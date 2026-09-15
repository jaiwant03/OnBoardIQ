const express = require('express');
const router = express.Router();
const {
  chat,
  getNextAction,
  getLearningPath,
  toggleLearningModule,
  getHealth,
  getConversations,
  clearConversation
} = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.get('/health', getHealth);
router.post('/chat', protect, chat);
router.post('/next-action', protect, getNextAction);
router.get('/learning-path', protect, getLearningPath);
router.put('/learning-path/module', protect, toggleLearningModule);
router.get('/conversations', protect, getConversations);
router.delete('/conversations/:id', protect, clearConversation);

module.exports = router;
