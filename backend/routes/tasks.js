const express = require('express');
const { body } = require('express-validator');
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  getDashboardStats,
} = require('../controllers/taskController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/stats', getDashboardStats);

router.route('/')
  .get(getTasks)
  .post(adminOnly, [
    body('title').trim().notEmpty().withMessage('Task title is required'),
    body('project').notEmpty().withMessage('Project is required'),
  ], createTask);

router.route('/:id')
  .get(getTask)
  .put(updateTask)
  .delete(adminOnly, deleteTask);

module.exports = router;
