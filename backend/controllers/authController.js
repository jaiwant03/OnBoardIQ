const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OnboardingTask = require('../models/OnboardingTask');
const LearningPath = require('../models/LearningPath');
const OnboardingProgress = require('../models/OnboardingProgress');
const aiServiceClient = require('../services/aiServiceClient');
const documentTaskSync = require('../services/documentTaskSync');

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

    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    if (!cleanEmail || !cleanPassword) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (cleanPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email address' });
    }

    const accountType = userType === 'admin' ? 'admin' : 'employee';

    const user = await User.create({
      name: (name || '').trim(),
      email: cleanEmail,
      password: cleanPassword,
      role: role || (accountType === 'admin' ? 'HR Administrator' : 'Software Developer'),
      department: department || (accountType === 'admin' ? 'People & HR' : 'Engineering'),
      experience: experience || (accountType === 'admin' ? 'Senior (5+ yrs)' : 'Fresher'),
      skills: skills || (accountType === 'admin' ? ['HR Operations', 'People Management', 'Compliance', 'Policy'] : ['JavaScript', 'React', 'Node.js', 'Git']),
      preferredLearningStyle: preferredLearningStyle || 'Hands-on Projects & Code',
      userType: accountType
    });
    // Synchronize tasks and learning path from uploaded documents if present
    await documentTaskSync.syncUserTasks(user._id);

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

    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    if (!cleanEmail || !cleanPassword) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: cleanEmail });
    if (user && (await user.matchPassword(cleanPassword))) {
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

// @desc    Reset user password
// @route   POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (newPassword || '').trim();

    if (!cleanEmail || !cleanPassword) {
      return res.status(400).json({ message: 'Email and new password are required' });
    }

    if (cleanPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email address' });
    }

    user.password = cleanPassword;
    await user.save();

    res.json({
      message: 'Password successfully updated. You can now sign in.',
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
    console.error('[Reset Password Error]:', error);
    res.status(500).json({ message: error.message || 'Server error during password reset' });
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

module.exports = { register, login, resetPassword, getMe };
