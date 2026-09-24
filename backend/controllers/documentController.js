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

        // 1. DYNAMIC ONBOARDING TASKS GENERATION FROM UPLOADED DOCUMENT
        const extractedTasks = indexResult.extracted_tasks || [];
        let createdTasksCount = 0;

        if (extractedTasks.length > 0 && req.user) {
          // Find all users who should receive these document-derived tasks (the uploader and all active employees)
          const targetUsers = await User.find({
            $or: [{ _id: req.user._id }, { userType: 'employee' }]
          });

          for (const targetUser of targetUsers) {
            const taskDocs = extractedTasks.map((t) => ({
              user: targetUser._id,
              title: t.title,
              description: t.description || `Action item from ${doc.originalName}`,
              category: t.category || doc.category || 'General',
              dayNumber: Number(t.dayNumber) || 1,
              priority: t.priority || 'medium',
              status: 'not_started',
              estimatedMinutes: Number(t.estimatedMinutes) || 30,
              sourceDocument: doc.originalName
            }));

            await OnboardingTask.insertMany(taskDocs);
            await recalculateProgress(targetUser._id);
            createdTasksCount += taskDocs.length;
          }
        }

        // 2. DYNAMIC LEARNING PATH GENERATION FROM UPLOADED DOCUMENT
        const extractedLP = indexResult.extracted_learning_path;
        if (extractedLP && extractedLP.stages && extractedLP.stages.length > 0 && req.user) {
          const targetUsers = await User.find({
            $or: [{ _id: req.user._id }, { userType: 'employee' }]
          });

          for (const targetUser of targetUsers) {
            const existingLP = await LearningPath.findOne({ user: targetUser._id });
            if (existingLP) {
              // Append or update stages derived from this document
              existingLP.stages = extractedLP.stages;
              await existingLP.save();
            } else {
              await LearningPath.create({
                user: targetUser._id,
                role: targetUser.role,
                stages: extractedLP.stages
              });
            }
          }
        }

        return res.status(201).json({
          message: `Document indexed successfully. Generated ${extractedTasks.length} onboarding tasks and updated learning curriculum.`,
          document: doc,
          tasksGenerated: extractedTasks.length
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

    // Recalculate progress for users
    if (req.user) {
      await recalculateProgress(req.user._id);
    }

    // If no documents remain in the database, clear learning paths and tasks
    const remainingDocsCount = await Document.countDocuments({ _id: { $ne: doc._id } });
    if (remainingDocsCount === 0) {
      await OnboardingTask.deleteMany({});
      await LearningPath.deleteMany({});
      await OnboardingProgress.updateMany(
        {},
        {
          overallPercentage: 0,
          totalTasks: 0,
          completedTasks: 0,
          remainingTasks: 0,
          inProgressTasks: 0,
          overdueTasks: 0
        }
      );
      // Also clear ChromaDB vector store
      await aiServiceClient.clearVectorStore();
    }

    await Document.findByIdAndDelete(req.params.id);
    res.json({ message: 'Document and its associated onboarding data removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { uploadDocument, getDocuments, deleteDocument };
