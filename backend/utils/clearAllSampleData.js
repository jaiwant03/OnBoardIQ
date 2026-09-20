require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const OnboardingTask = require('../models/OnboardingTask');
const LearningPath = require('../models/LearningPath');
const OnboardingProgress = require('../models/OnboardingProgress');
const Document = require('../models/Document');
const Conversation = require('../models/Conversation');
const aiServiceClient = require('../services/aiServiceClient');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/onboardiq';

const clearAllData = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('[Cleanup] Connected to MongoDB.');

    // 1. Delete all sample tasks
    const deletedTasks = await OnboardingTask.deleteMany({});
    console.log(`[Cleanup] Deleted ${deletedTasks.deletedCount} tasks.`);

    // 2. Delete all sample learning paths
    const deletedLP = await LearningPath.deleteMany({});
    console.log(`[Cleanup] Deleted ${deletedLP.deletedCount} learning paths.`);

    // 3. Delete all sample documents
    const deletedDocs = await Document.deleteMany({});
    console.log(`[Cleanup] Deleted ${deletedDocs.deletedCount} documents.`);

    // 4. Delete all sample conversations
    const deletedConvs = await Conversation.deleteMany({});
    console.log(`[Cleanup] Deleted ${deletedConvs.deletedCount} conversations.`);

    // 5. Reset progress for all existing users to 0% and 0 tasks
    const resetProgress = await OnboardingProgress.updateMany(
      {},
      {
        overallPercentage: 0,
        totalTasks: 0,
        completedTasks: 0,
        remainingTasks: 0,
        inProgressTasks: 0,
        overdueTasks: 0,
        updatedAt: new Date()
      }
    );
    console.log(`[Cleanup] Reset progress records: ${resetProgress.modifiedCount}.`);

    // 6. Wipe ChromaDB vector store
    try {
      const chromaResult = await aiServiceClient.clearVectorStore();
      console.log('[Cleanup] ChromaDB reset result:', chromaResult);
    } catch (err) {
      console.warn('[Cleanup] ChromaDB wipe warning:', err.message);
    }

    console.log('[Cleanup] All sample documents, tasks, learning paths, and mock progress wiped successfully!');
    process.exit(0);
  } catch (err) {
    console.error('[Cleanup Error]:', err);
    process.exit(1);
  }
};

clearAllData();
