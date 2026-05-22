const express = require('express');
const { body } = require('express-validator');
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
} = require('../controllers/projectController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getProjects)
  .post(adminOnly, [
    body('name').trim().notEmpty().withMessage('Project name is required'),
  ], createProject);

router.route('/:id')
  .get(getProject)
  .put(adminOnly, updateProject)
  .delete(adminOnly, deleteProject);

router.post('/:id/members', adminOnly, addMember);
router.delete('/:id/members/:userId', adminOnly, removeMember);

module.exports = router;
