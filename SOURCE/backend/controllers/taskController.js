const Task = require('../models/Task');
const Project = require('../models/Project');
const { ApiError, logger } = require('../middleware/errorHandler');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Get all tasks
 * @route   GET /api/v1/tasks
 * @access  Public
 */
const getTasks = asyncHandler(async (req, res) => {
  try {
    logger.info('GET /api/v1/tasks - Fetching all tasks', {
      query: req.query,
      ip: req.ip
    });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // Build filter object
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.priority) {
      filter.priority = req.query.priority;
    }
    if (req.query.projectId) {
      filter.projectId = req.query.projectId;
    }
    if (req.query.assignedTo) {
      filter.assignedTo = req.query.assignedTo;
    }
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    logger.info('Task query filter applied', { filter, pagination: { page, limit, skip } });

    const tasks = await Task.find(filter)
      .populate('projectId', 'title status')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Task.countDocuments(filter);

    logger.info('Tasks fetched successfully', { 
      count: tasks.length, 
      total, 
      page, 
      totalPages: Math.ceil(total / limit) 
    });

    res.status(200).json({
      success: true,
      data: tasks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    logger.error('Error fetching tasks', { error: error.message, stack: error.stack });
    throw new ApiError('Failed to fetch tasks', 500);
  }
});

/**
 * @desc    Get single task
 * @route   GET /api/v1/tasks/:id
 * @access  Public
 */
const getTask = asyncHandler(async (req, res) => {
  try {
    logger.info('GET /api/v1/tasks/:id - Fetching task', {
      taskId: req.params.id,
      ip: req.ip
    });

    const task = await Task.findById(req.params.id)
      .populate('projectId', 'title status priority')
      .populate('dependencies', 'title status');

    if (!task) {
      logger.warn('Task not found', { taskId: req.params.id });
      throw new ApiError('Task not found', 404);
    }

    logger.info('Task fetched successfully', { taskId: task._id, title: task.title });

    res.status(200).json({
      success: true,
      data: task
    });

  } catch (error) {
    if (error.name === 'CastError') {
      logger.warn('Invalid task ID format', { taskId: req.params.id });
      throw new ApiError('Invalid task ID', 400);
    }
    logger.error('Error fetching task', { error: error.message, taskId: req.params.id });
    throw error;
  }
});

/**
 * @desc    Create new task
 * @route   POST /api/v1/tasks
 * @access  Public
 */
const createTask = asyncHandler(async (req, res) => {
  try {
    logger.info('POST /api/v1/tasks - Creating new task', {
      body: { ...req.body, description: req.body.description ? '[REDACTED]' : undefined },
      ip: req.ip
    });

    let taskData = { ...req.body };

    // TASK-ENH-002: Auto-populate projectTitle when projectId is provided
    if (req.body.projectId) {
      const project = await Project.findById(req.body.projectId);
      if (!project) {
        logger.warn('Project not found for task creation', { projectId: req.body.projectId });
        throw new ApiError('Project not found', 404);
      }
      
      // Auto-populate projectTitle from the project
      taskData.projectTitle = project.title;
      
      logger.info('Task linked to project with auto-populated title', { 
        projectId: project._id, 
        projectTitle: project.title 
      });
    }

    const task = await Task.create(taskData);
    
    // Populate the created task for response
    await task.populate('projectId', 'title status');

    logger.info('Task created successfully', { 
      taskId: task._id, 
      title: task.title,
      status: task.status,
      projectId: task.projectId?._id,
      projectTitle: task.projectTitle
    });

    res.status(201).json({
      success: true,
      data: task,
      message: 'Task created successfully'
    });

  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      logger.warn('Task validation failed', { errors: messages, body: req.body });
      throw new ApiError(`Validation failed: ${messages.join(', ')}`, 400);
    }
    if (error.name === 'CastError' && error.path === 'projectId') {
      logger.warn('Invalid project ID in task creation', { projectId: req.body.projectId });
      throw new ApiError('Invalid project ID', 400);
    }
    logger.error('Error creating task', { error: error.message, body: req.body });
    throw error;
  }
});

/**
 * @desc    Update task
 * @route   PUT /api/v1/tasks/:id
 * @access  Public
 */
const updateTask = asyncHandler(async (req, res) => {
  try {
    logger.info('PUT /api/v1/tasks/:id - Updating task', {
      taskId: req.params.id,
      updates: Object.keys(req.body),
      ip: req.ip
    });

    let updateData = { ...req.body };

    // TASK-ENH-002: Auto-populate projectTitle when projectId is being updated
    if (req.body.projectId) {
      const project = await Project.findById(req.body.projectId);
      if (!project) {
        logger.warn('Project not found for task update', { projectId: req.body.projectId });
        throw new ApiError('Project not found', 404);
      }
      
      // Auto-populate projectTitle from the project
      updateData.projectTitle = project.title;
      
      logger.info('Task project updated with auto-populated title', { 
        projectId: project._id, 
        projectTitle: project.title 
      });
    }

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).populate('projectId', 'title status');

    if (!task) {
      logger.warn('Task not found for update', { taskId: req.params.id });
      throw new ApiError('Task not found', 404);
    }

    logger.info('Task updated successfully', { 
      taskId: task._id, 
      title: task.title,
      updatedFields: Object.keys(updateData),
      projectTitle: task.projectTitle
    });

    res.status(200).json({
      success: true,
      data: task,
      message: 'Task updated successfully'
    });

  } catch (error) {
    if (error.name === 'CastError') {
      if (error.path === '_id') {
        logger.warn('Invalid task ID format for update', { taskId: req.params.id });
        throw new ApiError('Invalid task ID', 400);
      }
      if (error.path === 'projectId') {
        logger.warn('Invalid project ID in task update', { projectId: req.body.projectId });
        throw new ApiError('Invalid project ID', 400);
      }
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      logger.warn('Task update validation failed', { errors: messages, taskId: req.params.id });
      throw new ApiError(`Validation failed: ${messages.join(', ')}`, 400);
    }
    logger.error('Error updating task', { error: error.message, taskId: req.params.id });
    throw error;
  }
});

/**
 * @desc    Delete task
 * @route   DELETE /api/v1/tasks/:id
 * @access  Public
 */
const deleteTask = asyncHandler(async (req, res) => {
  try {
    logger.info('DELETE /api/v1/tasks/:id - Deleting task', {
      taskId: req.params.id,
      ip: req.ip
    });

    const task = await Task.findById(req.params.id);

    if (!task) {
      logger.warn('Task not found for deletion', { taskId: req.params.id });
      throw new ApiError('Task not found', 404);
    }

    await Task.findByIdAndDelete(req.params.id);

    logger.info('Task deleted successfully', { 
      taskId: req.params.id, 
      title: task.title 
    });

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
      data: {
        id: req.params.id,
        title: task.title
      }
    });

  } catch (error) {
    if (error.name === 'CastError') {
      logger.warn('Invalid task ID format for deletion', { taskId: req.params.id });
      throw new ApiError('Invalid task ID', 400);
    }
    logger.error('Error deleting task', { error: error.message, taskId: req.params.id });
    throw new ApiError('Failed to delete task', 500);
  }
});

/**
 * @desc    Get tasks by project
 * @route   GET /api/v1/tasks/project/:projectId
 * @access  Public
 */
const getTasksByProject = asyncHandler(async (req, res) => {
  try {
    const { projectId } = req.params;
    
    logger.info('GET /api/v1/tasks/project/:projectId - Fetching tasks by project', {
      projectId,
      ip: req.ip
    });

    // Validate project exists
    const project = await Project.findById(projectId);
    if (!project) {
      logger.warn('Project not found for task query', { projectId });
      throw new ApiError('Project not found', 404);
    }

    const tasks = await Task.findByProject(projectId).lean();

    logger.info('Tasks by project fetched successfully', { 
      projectId, 
      projectTitle: project.title,
      count: tasks.length 
    });

    res.status(200).json({
      success: true,
      data: tasks,
      count: tasks.length,
      project: {
        id: project._id,
        title: project.title,
        status: project.status
      }
    });

  } catch (error) {
    if (error.name === 'CastError') {
      logger.warn('Invalid project ID format', { projectId: req.params.projectId });
      throw new ApiError('Invalid project ID', 400);
    }
    logger.error('Error fetching tasks by project', { error: error.message, projectId: req.params.projectId });
    throw error;
  }
});

/**
 * @desc    Get overdue tasks
 * @route   GET /api/v1/tasks/overdue
 * @access  Public
 */
const getOverdueTasks = asyncHandler(async (req, res) => {
  try {
    logger.info('GET /api/v1/tasks/overdue - Fetching overdue tasks', {
      ip: req.ip
    });

    const tasks = await Task.findOverdue()
      .populate('projectId', 'title status')
      .lean();

    logger.info('Overdue tasks fetched successfully', { 
      count: tasks.length 
    });

    res.status(200).json({
      success: true,
      data: tasks,
      count: tasks.length,
      message: tasks.length === 0 ? 'No overdue tasks found' : `Found ${tasks.length} overdue tasks`
    });

  } catch (error) {
    logger.error('Error fetching overdue tasks', { error: error.message });
    throw new ApiError('Failed to fetch overdue tasks', 500);
  }
});

/**
 * @desc    Add subtask
 * @route   POST /api/v1/tasks/:id/subtasks
 * @access  Public
 */
const addSubtask = asyncHandler(async (req, res) => {
  try {
    const { title } = req.body;
    
    logger.info('POST /api/v1/tasks/:id/subtasks - Adding subtask', {
      taskId: req.params.id,
      subtaskTitle: title,
      ip: req.ip
    });

    if (!title || title.trim().length === 0) {
      throw new ApiError('Subtask title is required', 400);
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      logger.warn('Task not found for subtask addition', { taskId: req.params.id });
      throw new ApiError('Task not found', 404);
    }

    await task.addSubtask(title.trim());

    logger.info('Subtask added successfully', { 
      taskId: task._id, 
      subtaskTitle: title,
      totalSubtasks: task.subtasks.length
    });

    res.status(201).json({
      success: true,
      data: task,
      message: 'Subtask added successfully'
    });

  } catch (error) {
    if (error.name === 'CastError') {
      logger.warn('Invalid task ID format for subtask addition', { taskId: req.params.id });
      throw new ApiError('Invalid task ID', 400);
    }
    logger.error('Error adding subtask', { error: error.message, taskId: req.params.id });
    throw error;
  }
});

/**
 * @desc    Complete subtask
 * @route   PATCH /api/v1/tasks/:id/subtasks/:subtaskId/complete
 * @access  Public
 */
const completeSubtask = asyncHandler(async (req, res) => {
  try {
    logger.info('PATCH /api/v1/tasks/:id/subtasks/:subtaskId/complete - Completing subtask', {
      taskId: req.params.id,
      subtaskId: req.params.subtaskId,
      ip: req.ip
    });

    const task = await Task.findById(req.params.id);

    if (!task) {
      logger.warn('Task not found for subtask completion', { taskId: req.params.id });
      throw new ApiError('Task not found', 404);
    }

    await task.completeSubtask(req.params.subtaskId);

    logger.info('Subtask completed successfully', { 
      taskId: task._id, 
      subtaskId: req.params.subtaskId,
      completionPercentage: task.completionPercentage
    });

    res.status(200).json({
      success: true,
      data: task,
      message: 'Subtask completed successfully'
    });

  } catch (error) {
    if (error.name === 'CastError') {
      logger.warn('Invalid ID format for subtask completion', { 
        taskId: req.params.id, 
        subtaskId: req.params.subtaskId 
      });
      throw new ApiError('Invalid task or subtask ID', 400);
    }
    if (error.message === 'Subtask not found') {
      logger.warn('Subtask not found for completion', { 
        taskId: req.params.id, 
        subtaskId: req.params.subtaskId 
      });
      throw new ApiError('Subtask not found', 404);
    }
    logger.error('Error completing subtask', { error: error.message, taskId: req.params.id });
    throw error;
  }
});

/**
 * @desc    Log time to task
 * @route   PATCH /api/v1/tasks/:id/time
 * @access  Public
 */
const logTime = asyncHandler(async (req, res) => {
  try {
    const { hours } = req.body;
    
    logger.info('PATCH /api/v1/tasks/:id/time - Logging time to task', {
      taskId: req.params.id,
      hours,
      ip: req.ip
    });

    if (typeof hours !== 'number' || hours <= 0 || hours > 24) {
      throw new ApiError('Hours must be a positive number less than or equal to 24', 400);
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      logger.warn('Task not found for time logging', { taskId: req.params.id });
      throw new ApiError('Task not found', 404);
    }

    const oldHours = task.actualHours || 0;
    await task.logTime(hours);

    logger.info('Time logged successfully', { 
      taskId: task._id, 
      oldHours,
      newHours: task.actualHours,
      addedHours: hours
    });

    res.status(200).json({
      success: true,
      data: task,
      message: `${hours} hours logged successfully`
    });

  } catch (error) {
    if (error.name === 'CastError') {
      logger.warn('Invalid task ID format for time logging', { taskId: req.params.id });
      throw new ApiError('Invalid task ID', 400);
    }
    logger.error('Error logging time', { error: error.message, taskId: req.params.id });
    throw error;
  }
});

/**
 * @desc    Get available projects for task selection
 * @route   GET /api/v1/tasks/available-projects
 * @access  Public
 */
const getAvailableProjects = asyncHandler(async (req, res) => {
  try {
    logger.info('GET /api/v1/tasks/available-projects - Fetching available projects for task selection', {
      ip: req.ip
    });

    // Get projects with active status for task selection
    const projects = await Project.find({ 
      status: { $in: ['active', 'planning', 'in_progress'] } 
    })
      .select('_id title status description')
      .sort({ title: 1 })
      .lean();

    logger.info('Available projects fetched successfully', { 
      count: projects.length,
      activeProjects: projects.filter(p => p.status === 'active').length,
      planningProjects: projects.filter(p => p.status === 'planning').length,
      inProgressProjects: projects.filter(p => p.status === 'in_progress').length
    });

    res.status(200).json({
      success: true,
      data: projects,
      count: projects.length,
      message: projects.length === 0 ? 'No available projects found' : `Found ${projects.length} available projects`
    });

  } catch (error) {
    logger.error('Error fetching available projects', { error: error.message });
    throw new ApiError('Failed to fetch available projects', 500);
  }
});

module.exports = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  getTasksByProject,
  getOverdueTasks,
  addSubtask,
  completeSubtask,
  logTime,
  getAvailableProjects
};