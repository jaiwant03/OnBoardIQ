const fs = require('fs');
const path = require('path');
const Document = require('../models/Document');
const OnboardingTask = require('../models/OnboardingTask');
const LearningPath = require('../models/LearningPath');
const OnboardingProgress = require('../models/OnboardingProgress');
const User = require('../models/User');
const aiServiceClient = require('../services/aiServiceClient');
const documentTaskSync = require('../services/documentTaskSync');

// Helper to recalculate user's progress
const recalculateProgress = async (userId) => {
  return await documentTaskSync.recalculateProgress(userId);
};

// @desc    Upload & index a new company document
// @route   POST /api/documents/upload
const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { title, department, category } = req.body;

    const doc = await Document.create({
      title: title || req.file.originalname,
      filename: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      department: department || 'General',
      category: category || 'General',
      status: 'extracting',
      uploadedBy: req.user ? req.user._id : null
    });

    // Send to Python AI Service for text extraction, chunking, ChromaDB indexing,
    // AND dynamic extraction of onboarding tasks & learning curriculum
    try {
      doc.status = 'embedding';
      await doc.save();

      const indexResult = await aiServiceClient.indexDocument({
        file_path: path.resolve(req.file.path),
        filename: req.file.originalname,
        department: doc.department,
        category: doc.category,
        doc_id: doc._id.toString()
      });

      if (indexResult && indexResult.chunks_indexed > 0) {
        doc.status = 'indexed';
        doc.chunkCount = indexResult.chunks_indexed;
        await doc.save();

        // Dynamically update onboarding tasks and learning curriculum across users
        await documentTaskSync.syncAllUsers({ force: true });

        return res.status(201).json({
          message: `Document indexed successfully. Onboarding tasks and learning curriculum updated.`,
          document: doc,
          chunksIndexed: doc.chunkCount
        });
      } else {
        doc.status = 'failed';
        doc.chunkCount = 0;
        await doc.save();
        return res.status(400).json({
          message: 'Document contains no readable text or sections to index.',
          document: doc
        });
      }
    } catch (aiErr) {
      console.error('[Document Index Error]:', aiErr.message);
      doc.status = 'failed';
      await doc.save();
      res.status(500).json({
        message: 'Document uploaded but failed indexing in vector store: ' + aiErr.message,
        document: doc
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all documents
// @route   GET /api/documents
const getDocuments = async (req, res) => {
  try {
    const { department, category } = req.query;
    const filter = {};
    if (department && department !== 'All') filter.department = department;
    if (category && category !== 'All') filter.category = category;

    const documents = await Document.find(filter).sort({ uploadDate: -1 });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a document and its associated generated tasks/chunks
// @route   DELETE /api/documents/:id
const deleteDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Remove associated physical file if exists
    if (doc.filePath && fs.existsSync(doc.filePath)) {
      try {
        fs.unlinkSync(doc.filePath);
      } catch (err) {
        console.warn('Could not remove file:', err.message);
      }
    }

    // Remove tasks generated from this specific document
    await OnboardingTask.deleteMany({ sourceDocument: doc.originalName });
    await Document.findByIdAndDelete(req.params.id);

    // If no documents remain in the database, clear learning paths and tasks completely!
    const remainingDocsCount = await Document.countDocuments({});
    if (remainingDocsCount === 0) {
      await documentTaskSync.cleanIfNoDocuments();
    } else {
      // Recalculate progress for remaining documents
      await documentTaskSync.syncAllUsers({ force: true });
    }

    res.json({ message: 'Document and its associated onboarding data removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { uploadDocument, getDocuments, deleteDocument };
