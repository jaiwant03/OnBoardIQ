const express = require('express');
const router = express.Router();
const { getAnalytics, getEmployees } = require('../controllers/adminController');
const { protect } = require('../middleware/auth');

router.get('/analytics', protect, getAnalytics);
router.get('/employees', protect, getEmployees);

module.exports = router;
