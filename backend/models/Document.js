const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String
  },
  filePath: {
    type: String
  },
  fileType: {
    type: String,
    default: 'pdf'
  },
  department: {
    type: String,
    enum: ['HR', 'IT', 'Security', 'Finance', 'Engineering', 'Training', 'General'],
    default: 'General'
  },
  category: {
    type: String,
    enum: ['HR', 'IT', 'Security', 'Finance', 'Engineering', 'Training', 'General'],
    default: 'General'
  },
  fileSize: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['uploading', 'extracting', 'embedding', 'indexed', 'failed'],
    default: 'indexed'
  },
  chunkCount: {
    type: Number,
    default: 0
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  uploadDate: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Document', DocumentSchema);
