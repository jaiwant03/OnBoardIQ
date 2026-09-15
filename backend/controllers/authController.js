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

// @desc    Register a new employee
// @route   POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, role, department, experience, skills, preferredLearningStyle } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email address' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'Software Developer',
      department: department || 'Engineering',
      experience: experience || 'Fresher',
      skills: skills || ['JavaScript', 'React', 'Node.js', 'Git'],
      preferredLearningStyle: preferredLearningStyle || 'Hands-on Projects & Code',
      userType: email.includes('admin') ? 'admin' : 'employee'
    });

    // Generate personalized onboarding tasks via AI service
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
