const Task = require('../models/Task');
const Project = require('../models/Project');
const { validationResult } = require('express-validator');

// @desc  Get all tasks (with filters)
// @route GET /api/tasks
const getTasks = async (req, res, next) => {
  try {
    const { project, status, priority, assignedTo, search } = req.query;

    let query = {};

    // Role-based filtering
    if (req.user.role !== 'admin') {
      // Members see tasks in their projects or assigned to them
      const userProjects = await Project.find({ members: req.user._id }).select('_id');
      const projectIds = userProjects.map(p => p._id);
      query.$or = [
        { project: { $in: projectIds } },
        { assignedTo: req.user._id },
      ];
    }

    if (project) query.project = project;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;
    if (search) query.title = { $regex: search, $options: 'i' };

    const tasks = await Task.find(query)
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort('-createdAt');

    res.json({ success: true, count: tasks.length, tasks });
  } catch (err) {
    next(err);
  }
};

// @desc  Get single task
// @route GET /api/tasks/:id
const getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('project', 'name members')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    res.json({ success: true, task });
  } catch (err) {
    next(err);
  }
};

// @desc  Create task
// @route POST /api/tasks
const createTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { title, description, priority, status, dueDate, project, assignedTo } = req.body;

    // Verify project exists
    const projectDoc = await Project.findById(project);
    if (!projectDoc) return res.status(404).json({ success: false, message: 'Project not found' });

    const task = await Task.create({
      title,
      description,
      priority,
      status,
      dueDate,
      project,
      assignedTo,
      createdBy: req.user._id,
    });

    await task.populate('project', 'name');
    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');

    res.status(201).json({ success: true, task });
  } catch (err) {
    next(err);
  }
};

// @desc  Update task
// @route PUT /api/tasks/:id
const updateTask = async (req, res, next) => {
  try {
    let task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    // Members can only update status of their own tasks
    if (req.user.role === 'member') {
      const isAssigned = task.assignedTo && task.assignedTo.toString() === req.user._id.toString();
      if (!isAssigned) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
      // Members can only update status
      const { status } = req.body;
      task = await Task.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true, runValidators: true }
      )
        .populate('project', 'name')
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email');
    } else {
      // Admin can update everything
      const { title, description, priority, status, dueDate, assignedTo } = req.body;
      task = await Task.findByIdAndUpdate(
        req.params.id,
        { title, description, priority, status, dueDate, assignedTo },
        { new: true, runValidators: true }
      )
        .populate('project', 'name')
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email');
    }

    res.json({ success: true, task });
  } catch (err) {
    next(err);
  }
};

// @desc  Delete task
// @route DELETE /api/tasks/:id
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    if (req.user.role !== 'admin' && task.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await task.deleteOne();
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// @desc  Get dashboard stats
// @route GET /api/tasks/stats
const getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();
    let projectQuery = {};
    let taskQuery = {};

    if (req.user.role !== 'admin') {
      const userProjects = await Project.find({ members: req.user._id }).select('_id');
      const projectIds = userProjects.map(p => p._id);
      projectQuery = { members: req.user._id };
      taskQuery = { $or: [{ project: { $in: projectIds } }, { assignedTo: req.user._id }] };
    }

    const [totalProjects, totalTasks, completedTasks, inProgressTasks, overdueTasks, myTasks] = await Promise.all([
      Project.countDocuments(projectQuery),
      Task.countDocuments(taskQuery),
      Task.countDocuments({ ...taskQuery, status: 'completed' }),
      Task.countDocuments({ ...taskQuery, status: 'in-progress' }),
      Task.countDocuments({ ...taskQuery, status: { $ne: 'completed' }, dueDate: { $lt: now } }),
      Task.countDocuments({ assignedTo: req.user._id }),
    ]);

    // Recent tasks
    const recentTasks = await Task.find(taskQuery)
      .populate('project', 'name')
      .populate('assignedTo', 'name')
      .sort('-createdAt')
      .limit(5);

    // Tasks by status for chart
    const tasksByStatus = [
      { name: 'Todo', value: totalTasks - completedTasks - inProgressTasks, color: '#94a3b8' },
      { name: 'In Progress', value: inProgressTasks, color: '#f59e0b' },
      { name: 'Completed', value: completedTasks, color: '#10b981' },
    ];

    // Tasks by priority
    const [lowPriority, medPriority, highPriority] = await Promise.all([
      Task.countDocuments({ ...taskQuery, priority: 'low' }),
      Task.countDocuments({ ...taskQuery, priority: 'medium' }),
      Task.countDocuments({ ...taskQuery, priority: 'high' }),
    ]);

    const tasksByPriority = [
      { name: 'Low', value: lowPriority, color: '#10b981' },
      { name: 'Medium', value: medPriority, color: '#f59e0b' },
      { name: 'High', value: highPriority, color: '#ef4444' },
    ];

    res.json({
      success: true,
      stats: {
        totalProjects,
        totalTasks,
        completedTasks,
        inProgressTasks,
        pendingTasks: totalTasks - completedTasks,
        overdueTasks,
        myTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      },
      recentTasks,
      tasksByStatus,
      tasksByPriority,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getTasks, getTask, createTask, updateTask, deleteTask, getDashboardStats };
