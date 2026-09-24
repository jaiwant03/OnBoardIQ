const express = require('express');
const router = express.Router();
const { getTasks, createTask, updateTask, deleteTask, syncTasks } = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getTasks);
router.post('/sync', protect, syncTasks);
router.post('/', protect, createTask);
router.put('/:id', protect, updateTask);
router.delete('/:id', protect, deleteTask);

module.exports = router;
