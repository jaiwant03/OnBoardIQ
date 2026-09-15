const mongoose = require('mongoose');

const ModuleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  completed: { type: Boolean, default: false }
});

const LearningPathSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    default: 'Software Developer'
  },
  stages: [
    {
      stage: {
        type: String,
        enum: ['foundation', 'current', 'next', 'upcoming'],
        required: true
      },
      stageLabel: { type: String, default: 'STAGE' },
      status: {
        type: String,
        enum: ['completed', 'in_progress', 'upcoming', 'locked'],
        default: 'upcoming'
      },
      title: { type: String, required: true },
      description: { type: String, default: '' },
      estimatedHours: { type: Number, default: 10 },
      modules: [ModuleSchema]
    }
  ],
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('LearningPath', LearningPathSchema);
