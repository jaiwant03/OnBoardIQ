const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OnboardingTask = require('../models/OnboardingTask');
const LearningPath = require('../models/LearningPath');
const OnboardingProgress = require('../models/OnboardingProgress');
const aiServiceClient = require('../services/aiServiceClient');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'onboardiq_jwt_secret_key_2026', {
    expiresIn: '30d'
  });
};

// @desc    Register a new user (employee or admin)
// @route   POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, role, department, experience, skills, preferredLearningStyle, userType } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email address' });
    }

    const accountType = userType === 'admin' ? 'admin' : 'employee';

    const user = await User.create({
      name,
      email,
      password,
      role: role || (accountType === 'admin' ? 'HR Administrator' : 'Software Developer'),
      department: department || (accountType === 'admin' ? 'People & HR' : 'Engineering'),
      experience: experience || (accountType === 'admin' ? 'Senior (5+ yrs)' : 'Fresher'),
      skills: skills || (accountType === 'admin' ? ['HR Operations', 'People Management', 'Compliance', 'Policy'] : ['JavaScript', 'React', 'Node.js', 'Git']),
      preferredLearningStyle: preferredLearningStyle || 'Hands-on Projects & Code',
      userType: accountType
    });

    if (accountType === 'admin') {
      // Administrative onboarding setup tasks
      const adminTasks = [
        { user: user._id, dayNumber: 1, title: 'Review Organization Onboarding Policies & Handbook', category: 'HR', priority: 'high', status: 'completed' },
        { user: user._id, dayNumber: 1, title: 'Configure Department Milestone Checklists', category: 'HR', priority: 'high', status: 'in_progress' },
        { user: user._id, dayNumber: 1, title: 'Verify Employee Security Compliance Protocols', category: 'Security', priority: 'high', status: 'in_progress' },
        { user: user._id, dayNumber: 2, title: 'Audit Vector Knowledge Base Indexing in ChromaDB', category: 'IT', priority: 'medium', status: 'not_started' },
        { user: user._id, dayNumber: 2, title: 'Review Department Onboarding Analytics & Velocity', category: 'HR', priority: 'medium', status: 'not_started' }
      ];
      await OnboardingTask.insertMany(adminTasks);
    } else {
      // Generate personalized onboarding tasks via AI service for employees
      try {
        const plan = await aiServiceClient.generateOnboardingPlan({
          role: user.role,
          department: user.department,
          experience: user.experience,
          skills: user.skills
        });

        if (plan && plan.tasks && plan.tasks.length > 0) {
          const taskDocs = plan.tasks.map(t => ({
            ...t,
            user: user._id
          }));
          await OnboardingTask.insertMany(taskDocs);
        }
      } catch (planErr) {
        console.warn('[Register] AI plan generation fallback:', planErr.message);
        // Fallback default tasks if AI service is offline
        const defaultTasks = [
          { user: user._id, dayNumber: 1, title: 'Complete HR Registration & Portal Verification', category: 'HR', priority: 'high', status: 'completed' },
          { user: user._id, dayNumber: 1, title: 'Review Employee Handbook & Policies', category: 'HR', priority: 'medium', status: 'completed' },
          { user: user._id, dayNumber: 1, title: 'Configure Company Email & Slack Workspace', category: 'IT', priority: 'high', status: 'completed' },
          { user: user._id, dayNumber: 1, title: `Install Developer Tooling for ${user.role}`, category: 'IT', priority: 'high', status: 'in_progress' },
          { user: user._id, dayNumber: 2, title: 'Configure Enterprise Git & SSH Key Signing', category: 'IT', priority: 'high', status: 'in_progress' },
          { user: user._id, dayNumber: 2, title: 'Complete Security Awareness Training & MFA Setup', category: 'Security', priority: 'high', status: 'not_started' }
        ];
        await OnboardingTask.insertMany(defaultTasks);
      }
    }

    // Generate learning path via AI service
    try {
      const lp = await aiServiceClient.generateLearningPath({
        role: user.role,
        experience: user.experience
      });
      if (lp && lp.stages) {
        await LearningPath.create({
          user: user._id,
          role: user.role,
          stages: lp.stages
        });
      }
    } catch (lpErr) {
      console.warn('[Register] AI learning path generation fallback:', lpErr.message);
      const defaultStages = [
        {
          stage: 'foundation',
          stageLabel: 'FOUNDATION',
          status: 'completed',
          title: 'Organization Culture & Tooling Essentials',
          description: 'Understanding corporate communication, version control setup, and workspace orientation.',
          estimatedHours: 6,
          modules: [
            { title: 'Corporate Workstation & Account Setup', completed: true },
            { title: 'Git & Repository Access Provisioning', completed: true },
            { title: 'Communication Protocols (Slack, Email, Jira)', completed: true }
          ]
        },
        {
          stage: 'current',
          stageLabel: 'CURRENT',
          status: 'in_progress',
          title: `Core Competencies for ${user.role}`,
          description: `Mastering project workflows, development guidelines, and team conventions for ${user.department}.`,
          estimatedHours: 10,
          modules: [
            { title: 'Department Standards & Architecture Overview', completed: true },
            { title: 'Local Development Environment & Testing', completed: false },
            { title: 'Security Compliance & Credential Management', completed: false }
          ]
        },
        {
          stage: 'next',
          stageLabel: 'NEXT',
          status: 'upcoming',
          title: 'End-to-End System Integration & CI/CD',
          description: 'Deep dive into microservices, containerization, and release pipelines.',
          estimatedHours: 14,
          modules: [
            { title: 'Service Orchestration & API Endpoints', completed: false },
            { title: 'Automated CI/CD Workflows', completed: false }
          ]
        },
        {
          stage: 'upcoming',
          stageLabel: 'UPCOMING',
          status: 'locked',
          title: 'Production Readiness & Mentorship',
          description: 'Sprint planning participation, code review certification, and independent contribution.',
          estimatedHours: 8,
          modules: [
            { title: 'First Sprint Milestone Delivery', completed: false },
            { title: 'Retrospective & 30-Day Evaluation', completed: false }
          ]
        }
      ];
      await LearningPath.create({
        user: user._id,
        role: user.role,
        stages: defaultStages
      });
    }

    // Initialize progress record
    const allTasks = await OnboardingTask.find({ user: user._id });
    const completed = allTasks.filter(t => t.status === 'completed').length;
    const inProgress = allTasks.filter(t => t.status === 'in_progress').length;
    const remaining = allTasks.length - completed;
    const percentage = allTasks.length > 0 ? Math.round((completed / allTasks.length) * 100) : 0;

    await OnboardingProgress.create({
      user: user._id,
      overallPercentage: percentage,
      totalTasks: allTasks.length,
      completedTasks: completed,
      remainingTasks: remaining,
      inProgressTasks: inProgress,
      overdueTasks: 0
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      experience: user.experience,
      skills: user.skills,
      userType: user.userType,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('[Register Error]:', error);
    res.status(500).json({ message: error.message || 'Server error during registration' });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        experience: user.experience,
        skills: user.skills,
        userType: user.userType,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('[Login Error]:', error);
    res.status(500).json({ message: error.message || 'Server error during login' });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { register, login, getMe };
