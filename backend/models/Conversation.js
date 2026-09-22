const mongoose = require('mongoose');

const SourceSchema = new mongoose.Schema({
  document: { type: String, default: '' },
  section: { type: String, default: '' },
  confidence: { type: String, default: 'High' },
  similarity: { type: Number, default: 0.8 },
  snippet: { type: String, default: '' }
});

const MessageSchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  text: {
    type: String,
    required: true
  },
  agent: {
    type: String,
    default: 'OnboardIQ AI'
  },
  sources: [SourceSchema],
  confidence: {
    type: String,
    enum: ['High', 'Medium', 'Low', 'None'],
    default: 'High'
  },
  reasoning: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const ConversationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    default: 'New Conversation'
  },
  messages: [MessageSchema],
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Conversation', ConversationSchema);
