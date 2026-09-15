const OnboardingTask = require('../models/OnboardingTask');
const OnboardingProgress = require('../models/OnboardingProgress');

// Helper to recalculate user's progress
const recalculateProgress = async (userId) => {
  const tasks = await OnboardingTask.find({ user: userId });
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
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

// @desc    Get all onboarding tasks for user
// @route   GET /api/tasks
const getTasks = async (req, res) => {
  try {
    const { category, status, day } = req.query;
    const filter = { user: req.user._id };

    if (category) filter.category = category;
    if (status) filter.status = status;
    if (day) filter.dayNumber = Number(day);

    const tasks = await OnboardingTask.find(filter).sort({ dayNumber: 1, createdAt: 1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new task
// @route   POST /api/tasks
const createTask = async (req, res) => {
  try {
    const { title, description, category, dayNumber, priority, estimatedMinutes } = req.body;

    const task = await OnboardingTask.create({
      user: req.user._id,
      title,
      description: description || '',
      category: category || 'General',
      dayNumber: dayNumber || 1,
      priority: priority || 'medium',
      estimatedMinutes: estimatedMinutes || 30,
      status: 'not_started',
      isCustom: true
    });

    const updatedProgress = await recalculateProgress(req.user._id);

    res.status(201).json({ task, progress: updatedProgress });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update task status or details
// @route   PUT /api/tasks/:id
const updateTask = async (req, res) => {
  try {
    const task = await OnboardingTask.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const { status, title, description, priority, category } = req.body;

    if (status) {
      task.status = status;
      if (status === 'completed') {
        task.completedAt = new Date();
      } else {
        task.completedAt = null;
      }
    }
    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (priority) task.priority = priority;
    if (category) task.category = category;

    await task.save();

    // Recalculate progress immediately
    const updatedProgress = await recalculateProgress(req.user._id);

    res.json({ task, progress: updatedProgress });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
  try {
    const task = await OnboardingTask.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const updatedProgress = await recalculateProgress(req.user._id);
    res.json({ message: 'Task deleted successfully', progress: updatedProgress });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getTasks, createTask, updateTask, deleteTask };
