const fs = require('fs');
const path = require('path');
const Document = require('../models/Document');
const aiServiceClient = require('../services/aiServiceClient');

// Sample policies metadata for programmatic seed
const SAMPLE_DOCS = [
  {
    title: 'Employee Leave & Attendance Policy',
    filename: 'Employee_Leave_Policy.pdf',
    department: 'HR',
    category: 'HR',
    fileSize: 45200,
    chunkCount: 5
  },
  {
    title: 'Company Employee Handbook',
    filename: 'Employee_Handbook.pdf',
    department: 'General',
    category: 'General',
    fileSize: 58900,
    chunkCount: 5
  },
  {
    title: 'IT Equipment & Developer Setup Guide',
    filename: 'IT_Setup_Guide.pdf',
    department: 'IT',
    category: 'IT',
    fileSize: 51200,
    chunkCount: 5
  },
  {
    title: 'Corporate Information Security Policy',
    filename: 'Information_Security_Policy.pdf',
    department: 'Security',
    category: 'Security',
    fileSize: 48300,
    chunkCount: 5
  },
  {
    title: 'Software Engineering Guidelines',
    filename: 'Engineering_Development_Guide.pdf',
    department: 'Engineering',
    category: 'Engineering',
    fileSize: 64100,
    chunkCount: 5
  }
];

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
      uploadedBy: req.user._id
    });

    // Send to Python AI Service for text extraction, chunking, and ChromaDB indexing
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

      doc.status = 'indexed';
      doc.chunkCount = indexResult.chunks_indexed || 1;
      await doc.save();

      res.status(201).json({
        message: 'Document successfully indexed and ready for AI search',
        document: doc
      });
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

// @desc    Delete a document
// @route   DELETE /api/documents/:id
const deleteDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Attempt to delete physical file if exists
    if (doc.filePath && fs.existsSync(doc.filePath)) {
      try {
        fs.unlinkSync(doc.filePath);
      } catch (err) {
        console.warn('Could not remove file:', err.message);
      }
    }

    await Document.findByIdAndDelete(req.params.id);
    res.json({ message: 'Document removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Seed sample company documents into database
// @route   POST /api/documents/seed
const seedDocuments = async (req, res) => {
  try {
    for (const d of SAMPLE_DOCS) {
      const exists = await Document.findOne({ filename: d.filename });
      if (!exists) {
        await Document.create({
          title: d.title,
          filename: d.filename,
          originalName: d.filename,
          department: d.department,
          category: d.category,
          fileSize: d.fileSize,
          status: 'indexed',
          chunkCount: d.chunkCount,
          uploadedBy: req.user ? req.user._id : null
        });
      }
    }
    const all = await Document.find().sort({ uploadDate: -1 });
    res.json({ message: 'Sample documents seeded successfully', documents: all });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { uploadDocument, getDocuments, deleteDocument, seedDocuments };
