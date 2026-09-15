const express = require('express');
const router = express.Router();
const { uploadDocument, getDocuments, deleteDocument, seedDocuments } = require('../controllers/documentController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', protect, getDocuments);
router.post('/upload', protect, upload.single('file'), uploadDocument);
router.delete('/:id', protect, deleteDocument);
router.post('/seed', protect, seedDocuments);

module.exports = router;
