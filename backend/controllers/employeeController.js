const User = require('../models/User');
const OnboardingProgress = require('../models/OnboardingProgress');

// @desc    Get current employee profile with progress stats
// @route   GET /api/employee/profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const progress = await OnboardingProgress.findOne({ user: user._id });

    res.json({
      user,
      progress: progress || {
        overallPercentage: 0,
        totalTasks: 0,
        completedTasks: 0,
        remainingTasks: 0,
        inProgressTasks: 0,
        overdueTasks: 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update employee profile
// @route   PUT /api/employee/profile
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, role, department, experience, skills, preferredLearningStyle, avatar } = req.body;

    if (name) user.name = name;
    if (role) user.role = role;
    if (department) user.department = department;
    if (experience) user.experience = experience;
    if (skills) user.skills = skills;
    if (preferredLearningStyle) user.preferredLearningStyle = preferredLearningStyle;
    if (avatar !== undefined) user.avatar = avatar;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      department: updatedUser.department,
      experience: updatedUser.experience,
      skills: updatedUser.skills,
      preferredLearningStyle: updatedUser.preferredLearningStyle,
      avatar: updatedUser.avatar,
      userType: updatedUser.userType
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getProfile, updateProfile };
