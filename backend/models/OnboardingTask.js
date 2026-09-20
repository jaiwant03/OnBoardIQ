const mongoose = require('mongoose');

const OnboardingTaskSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['HR', 'IT', 'Security', 'Engineering', 'Training', 'General'],
    default: 'General'
  },
  dayNumber: {
    type: Number,
    default: 1
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed'],
    default: 'not_started'
  },
  dueDate: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  estimatedMinutes: {
    type: Number,
    default: 30
  },
  isCustom: {
    type: Boolean,
    default: false
  },
  sourceDocument: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('OnboardingTask', OnboardingTaskSchema);
