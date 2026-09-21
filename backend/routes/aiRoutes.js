const express = require('express');
const router = express.Router();
const {
  chat,
  getNextAction,
  getLearningPath,
  toggleLearningModule,
  getHealth,
  getConversations,
  getConversationById,
  createConversation,
  clearConversation
} = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.get('/health', getHealth);
router.post('/chat', protect, chat);
router.post('/next-action', protect, getNextAction);
router.get('/learning-path', protect, getLearningPath);
router.put('/learning-path/module', protect, toggleLearningModule);
router.get('/conversations', protect, getConversations);
router.get('/conversations/:id', protect, getConversationById);
router.post('/conversations', protect, createConversation);
router.delete('/conversations/:id', protect, clearConversation);

module.exports = router;
