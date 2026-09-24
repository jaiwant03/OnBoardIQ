const path = require('path');
const fs = require('fs');
const Document = require('../models/Document');
const OnboardingTask = require('../models/OnboardingTask');
const LearningPath = require('../models/LearningPath');
const OnboardingProgress = require('../models/OnboardingProgress');
const User = require('../models/User');
const aiServiceClient = require('./aiServiceClient');

// Helper to recalculate user's progress
const recalculateProgress = async (userId) => {
  const tasks = await OnboardingTask.find({ user: userId });
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const remaining = total - completed;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  const progress = await OnboardingProgress.findOneAndUpdate(
    { user: userId },
    {
      overallPercentage: percentage,
      totalTasks: total,
      completedTasks: completed,
      remainingTasks: remaining,
      inProgressTasks: inProgress,
      overdueTasks: 0,
      updatedAt: new Date()
    },
    { new: true, upsert: true }
  );

  return progress;
};

// Fallback task generator if AI service is offline
const generateFallbackTasksForDoc = (doc) => {
  const cleanTitle = (doc.title || doc.originalName || 'Company Policy')
    .replace(/\.[^/.]+$/, '')
    .replace(/[_\-]+/g, ' ')
    .trim();

  const dept = doc.department || 'General';
  let cat = 'General';
  if (/hr|leave|handbook|culture|people/i.test(cleanTitle + dept)) cat = 'HR';
  else if (/security|access|policy|auth/i.test(cleanTitle + dept)) cat = 'Security';
  else if (/tech|stack|code|standard|engineer/i.test(cleanTitle + dept)) cat = 'Engineering';
  else if (/it|tool|hardware|laptop|cloud|devops/i.test(cleanTitle + dept)) cat = 'IT';
  else if (/learn|train|onboard/i.test(cleanTitle + dept)) cat = 'Training';

  return [
    {
      dayNumber: 1,
      title: `Review & Acknowledge: ${cleanTitle}`,
      description: `Read and understand the requirements and policies detailed in ${doc.originalName}.`,
      category: cat,
      priority: cat === 'Security' || cat === 'HR' ? 'high' : 'medium',
      status: 'not_started',
      estimatedMinutes: 30,
      sourceDocument: doc.originalName
    },
    {
      dayNumber: cat === 'Security' ? 1 : 2,
      title: `Verify Environment & Compliance: ${cleanTitle}`,
      description: `Apply the procedures and compliance standards from ${doc.originalName} to your workstation.`,
      category: cat,
      priority: 'medium',
      status: 'not_started',
      estimatedMinutes: 45,
      sourceDocument: doc.originalName
    },
    {
      dayNumber: 3,
      title: `Complete Operational Check: ${cleanTitle}`,
      description: `Confirm integration and complete practical checklist items from ${doc.originalName}.`,
      category: cat,
      priority: 'medium',
      status: 'not_started',
      estimatedMinutes: 30,
      sourceDocument: doc.originalName
    }
  ];
};

/**
 * Ensures a user has onboarding tasks and learning path derived from all uploaded documents.
 * - If NO documents exist in system: ensures tasks and learning path are empty (showing clean empty state).
 * - If documents DO exist: guarantees tasks and learning curriculum are populated and active.
 */
const syncUserTasks = async (userId, options = {}) => {
  const { force = false } = options;

  // 1. Check all uploaded valid documents
  const docs = await Document.find({ status: { $ne: 'failed' } });

  // If NO documents exist in the system, wipe tasks and learning path so empty state is displayed!
  if (!docs || docs.length === 0) {
    await OnboardingTask.deleteMany({ user: userId });
    await LearningPath.findOneAndUpdate({ user: userId }, { stages: [] });
    await recalculateProgress(userId);
    return { count: 0, status: 'empty_no_documents' };
  }

  // 2. Check if user already has tasks
  const existingTasks = await OnboardingTask.find({ user: userId });
  if (existingTasks.length > 0 && !force) {
    // User already has tasks. Ensure learning path is also populated.
    const userLP = await LearningPath.findOne({ user: userId });
    if (!userLP || !userLP.stages || userLP.stages.length === 0) {
      await ensureLearningPathForUser(userId, docs);
    }
    return { count: existingTasks.length, status: 'already_populated' };
  }

  // 3. Extract tasks and stages across all uploaded documents
  const allExtractedTasks = [];
  let collectedStages = [];

  for (const doc of docs) {
    const fullPath = doc.filePath ? path.resolve(doc.filePath) : null;
    let extracted = null;

    if (fullPath && fs.existsSync(fullPath)) {
      try {
        const result = await aiServiceClient.extractTasks({
          file_path: fullPath,
          filename: doc.originalName,
          department: doc.department,
          category: doc.category,
          fast: true
        });

        if (result && result.tasks && result.tasks.length > 0) {
          extracted = result.tasks;
          if (result.learning_path && result.learning_path.stages && result.learning_path.stages.length > 0) {
            collectedStages = result.learning_path.stages;
          }
        }
      } catch (err) {
        console.warn(`[documentTaskSync] Fast extraction for ${doc.originalName} failed (${err.message}), using fallback.`);
      }
    }

    if (!extracted || extracted.length === 0) {
      extracted = generateFallbackTasksForDoc(doc);
    }

    allExtractedTasks.push(...extracted);
  }

  // Deduplicate tasks by normalized title
  const uniqueTasksMap = new Map();
  for (const t of allExtractedTasks) {
    const normTitle = (t.title || '').trim().toLowerCase();
    if (!uniqueTasksMap.has(normTitle)) {
      uniqueTasksMap.set(normTitle, t);
    }
  }

  // Map to OnboardingTask documents
  const completedTitles = new Set(
    existingTasks.filter((t) => t.status === 'completed').map((t) => t.title.toLowerCase().trim())
  );
  const customTasks = existingTasks.filter((t) => t.isCustom);

  const newTasksToInsert = Array.from(uniqueTasksMap.values()).map((t) => {
    const isAlreadyDone = completedTitles.has((t.title || '').toLowerCase().trim());
    return {
      user: userId,
      title: t.title,
      description: t.description || `Milestone from ${t.sourceDocument || 'Company Documentation'}`,
      category: t.category,
      dayNumber: Number(t.dayNumber) || 1,
      priority: t.priority || 'medium',
      status: isAlreadyDone ? 'completed' : 'not_started',
      completedAt: isAlreadyDone ? new Date() : null,
      estimatedMinutes: Number(t.estimatedMinutes) || 30,
      sourceDocument: t.sourceDocument || 'Company Documentation',
      isCustom: false
    };
  });

  // Replace generated tasks, preserving custom tasks
  await OnboardingTask.deleteMany({ user: userId, isCustom: { $ne: true } });
  if (newTasksToInsert.length > 0) {
    await OnboardingTask.insertMany(newTasksToInsert);
  }

  // 4. Ensure Learning Path has structured stages
  await ensureLearningPathForUser(userId, docs, collectedStages);

  // 5. Recalculate progress
  const updatedProgress = await recalculateProgress(userId);

  const finalCount = newTasksToInsert.length + customTasks.length;
  console.log(`[documentTaskSync] Successfully synced ${finalCount} onboarding tasks for user ${userId}`);

  return {
    count: finalCount,
    status: 'synced',
    progress: updatedProgress
  };
};

/**
 * Ensures the user has a populated 4-stage learning path derived from documents
 */
const ensureLearningPathForUser = async (userId, docs, candidateStages = []) => {
  const user = await User.findById(userId);
  const roleName = user?.role || 'Team Member';

  let stages = candidateStages;
  if (!stages || stages.length === 0) {
    const docNames = docs.slice(0, 3).map((d) => d.title || d.originalName).join(', ');
    stages = [
      {
        stage: 'foundation',
        stageLabel: 'FOUNDATION',
        status: 'in_progress',
        title: `Core Foundations & Orientation (${roleName})`,
        description: `Baseline company policies, code of conduct, and IT setup standards from uploaded docs: ${docNames}.`,
        estimatedHours: 6,
        modules: [
          { title: 'Company Overview & Operating Principles', completed: false },
          { title: 'IT Security, Access & Credentials Verification', completed: false },
          { title: 'Workspace Configuration & Daily Workflow Setup', completed: false }
        ]
      },
      {
        stage: 'current',
        stageLabel: 'CURRENT',
        status: 'upcoming',
        title: 'Operational Standards & Team Architecture',
        description: 'Deep dive into engineering standards, repos, review workflows, and domain handbooks.',
        estimatedHours: 10,
        modules: [
          { title: 'Technology Stack & Engineering Guidelines', completed: false },
          { title: 'Local Development Environment & Repositories', completed: false },
          { title: 'Code Quality, Testing & Pull Request Protocols', completed: false }
        ]
      },
      {
        stage: 'next',
        stageLabel: 'NEXT',
        status: 'upcoming',
        title: 'Applied Systems & Milestone Delivery',
        description: 'Hands-on project execution, cloud infrastructure, and collaborative roadmap deliverables.',
        estimatedHours: 14,
        modules: [
          { title: 'First Production-Ready Feature / Project Task', completed: false },
          { title: 'Cloud Infrastructure & Deployment Verification', completed: false }
        ]
      },
      {
        stage: 'upcoming',
        stageLabel: 'UPCOMING',
        status: 'locked',
        title: 'Continuous Mastery & Domain Scaling',
        description: 'Advanced design architecture, enterprise security compliance, and playbook enhancements.',
        estimatedHours: 8,
        modules: [
          { title: 'Quarterly Architecture & Performance Review', completed: false },
          { title: 'Team Knowledge Contribution & Mentorship', completed: false }
        ]
      }
    ];
  }

  const existingLP = await LearningPath.findOne({ user: userId });
  if (existingLP) {
    if (!existingLP.stages || existingLP.stages.length === 0) {
      existingLP.stages = stages;
      await existingLP.save();
    }
  } else {
    await LearningPath.create({
      user: userId,
      role: roleName,
      stages
    });
  }
};

/**
 * Syncs tasks and learning path across all active users in the system
 */
const syncAllUsers = async (options = {}) => {
  const users = await User.find({});
  const results = [];
  for (const u of users) {
    const res = await syncUserTasks(u._id, options);
    results.push({ userId: u._id, name: u.name, result: res });
  }
  return results;
};

/**
 * Clears tasks, learning path, and progress when all documents are deleted
 */
const cleanIfNoDocuments = async () => {
  const count = await Document.countDocuments({});
  if (count === 0) {
    await OnboardingTask.deleteMany({});
    await LearningPath.updateMany({}, { stages: [] });
    await OnboardingProgress.updateMany(
      {},
      {
        overallPercentage: 0,
        totalTasks: 0,
        completedTasks: 0,
        remainingTasks: 0,
        inProgressTasks: 0,
        overdueTasks: 0
      }
    );
    try {
      await aiServiceClient.clearVectorStore();
    } catch (err) {
      console.warn('Could not clear vector store:', err.message);
    }
    console.log('[documentTaskSync] All documents removed. Completely cleared onboarding tasks and learning paths.');
    return true;
  }
  return false;
};

module.exports = {
  syncUserTasks,
  syncAllUsers,
  cleanIfNoDocuments,
  recalculateProgress
};
