const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// @desc  Get all projects (admin: all, member: assigned only)
// @route GET /api/projects
const getProjects = async (req, res, next) => {
  try {
    const query = req.user.role === 'admin'
      ? {}
      : { members: req.user._id };

    const projects = await Project.find(query)
      .populate('createdBy', 'name email')
      .populate('members', 'name email role')
      .sort('-createdAt');

    res.json({ success: true, count: projects.length, projects });
  } catch (err) {
    next(err);
  }
};

// @desc  Get single project
// @route GET /api/projects/:id
const getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('members', 'name email role');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Check access
    const isMember = project.members.some(m => m._id.toString() === req.user._id.toString());
    if (req.user.role !== 'admin' && !isMember) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const tasks = await Task.find({ project: project._id })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    res.json({ success: true, project, tasks });
  } catch (err) {
    next(err);
  }
};

// @desc  Create project
// @route POST /api/projects
const createProject = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { name, description, deadline, members } = req.body;

    const project = await Project.create({
      name,
      description,
      deadline,
      createdBy: req.user._id,
      members: members || [],
    });

    await project.populate('createdBy', 'name email');
    await project.populate('members', 'name email role');

    res.status(201).json({ success: true, project });
  } catch (err) {
    next(err);
  }
};

// @desc  Update project
// @route PUT /api/projects/:id
const updateProject = async (req, res, next) => {
  try {
    let project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Only admin or creator can update
    if (req.user.role !== 'admin' && project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { name, description, deadline, status, members } = req.body;
    project = await Project.findByIdAndUpdate(
      req.params.id,
      { name, description, deadline, status, members },
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'name email')
      .populate('members', 'name email role');

    res.json({ success: true, project });
  } catch (err) {
    next(err);
  }
};

// @desc  Delete project
// @route DELETE /api/projects/:id
const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (req.user.role !== 'admin' && project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await Task.deleteMany({ project: project._id });
    await project.deleteOne();

    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// @desc  Add member to project
// @route POST /api/projects/:id/members
const addMember = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const userToAdd = await User.findById(userId);
    if (!userToAdd) return res.status(404).json({ success: false, message: 'User not found' });

    if (project.members.includes(userId)) {
      return res.status(400).json({ success: false, message: 'User already a member' });
    }

    project.members.push(userId);
    await project.save();
    await project.populate('members', 'name email role');

    res.json({ success: true, members: project.members });
  } catch (err) {
    next(err);
  }
};

// @desc  Remove member from project
// @route DELETE /api/projects/:id/members/:userId
const removeMember = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    if (project.createdBy.toString() === req.params.userId) {
      return res.status(400).json({ success: false, message: 'Cannot remove project creator' });
    }

    project.members = project.members.filter(m => m.toString() !== req.params.userId);
    await project.save();
    await project.populate('members', 'name email role');

    res.json({ success: true, members: project.members });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProjects, getProject, createProject, updateProject, deleteProject, addMember, removeMember };
