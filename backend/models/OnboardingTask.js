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
    set: (v) => {
      if (!v) return 'General';
      const low = String(v).toLowerCase();
      if (low.includes('hr') || low.includes('leave') || low.includes('handbook') || low.includes('people')) return 'HR';
      if (low.includes('sec') || low.includes('compliance') || low.includes('access') || low.includes('policy')) return 'Security';
      if (low.includes('eng') || low.includes('code') || low.includes('dev') || low.includes('arch') || low.includes('stack')) return 'Engineering';
      if (low.includes('it') || low.includes('hardware') || low.includes('tool') || low.includes('setup') || low.includes('cloud')) return 'IT';
      if (low.includes('train') || low.includes('learn') || low.includes('course') || low.includes('culture')) return 'Training';
      const valid = ['HR', 'IT', 'Security', 'Engineering', 'Training', 'General'];
      const matched = valid.find(val => val.toLowerCase() === low);
      return matched || 'General';
    },
    default: 'General'
  },
  dayNumber: {
    type: Number,
    default: 1
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    set: (v) => {
      if (!v) return 'medium';
      const low = String(v).toLowerCase().trim();
      if (low === 'high' || low === 'urgent' || low === 'critical') return 'high';
      if (low === 'low') return 'low';
      return 'medium';
    },
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
