const OnboardingProgress = require('../models/OnboardingProgress');
const OnboardingTask = require('../models/OnboardingTask');

// @desc    Get user's onboarding progress
// @route   GET /api/progress
const getProgress = async (req, res) => {
  try {
    let progress = await OnboardingProgress.findOne({ user: req.user._id });

    if (!progress) {
      const tasks = await OnboardingTask.find({ user: req.user._id });
      const total = tasks.length;
      const completed = tasks.filter(t => t.status === 'completed').length;
      const inProgress = tasks.filter(t => t.status === 'in_progress').length;
      const remaining = total - completed;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

      progress = await OnboardingProgress.create({
        user: req.user._id,
        overallPercentage: percentage,
        totalTasks: total,
        completedTasks: completed,
        remainingTasks: remaining,
        inProgressTasks: inProgress,
        overdueTasks: 0
      });
    }

    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getProgress };
