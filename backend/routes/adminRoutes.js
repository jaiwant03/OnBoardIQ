const express = require('express');
const router = express.Router();
const { getAnalytics, getEmployees } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/analytics', protect, adminOnly, getAnalytics);
router.get('/employees', protect, adminOnly, getEmployees);

module.exports = router;
