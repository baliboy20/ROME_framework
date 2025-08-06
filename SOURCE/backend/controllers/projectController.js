const Project = require('../models/Project');
const { ApiError, logger } = require('../middleware/errorHandler');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Get all projects
 * @route   GET /api/v1/projects
 * @access  Public (no auth required as per instruction)
 */
const getProjects = asyncHandler(async (req, res) => {
  try {
    logger.info('GET /api/v1/projects - Fetching all projects', {
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
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    logger.info('Project query filter applied', { filter, pagination: { page, limit, skip } });

    const projects = await Project.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Project.countDocuments(filter);

    logger.info('Projects fetched successfully', { 
      count: projects.length, 
      total, 
      page, 
      totalPages: Math.ceil(total / limit) 
    });

    res.status(200).json({
      success: true,
      data: projects,
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
    logger.error('Error fetching projects', { error: error.message, stack: error.stack });
    throw new ApiError('Failed to fetch projects', 500);
  }
});

/**
 * @desc    Get single project
 * @route   GET /api/v1/projects/:id
 * @access  Public
 */
const getProject = asyncHandler(async (req, res) => {
  try {
    logger.info('GET /api/v1/projects/:id - Fetching project', {
      projectId: req.params.id,
      ip: req.ip
    });

    const project = await Project.findById(req.params.id);

    if (!project) {
      logger.warn('Project not found', { projectId: req.params.id });
      throw new ApiError('Project not found', 404);
    }

    logger.info('Project fetched successfully', { projectId: project._id, name: project.name });

    res.status(200).json({
      success: true,
      data: project
    });

  } catch (error) {
    if (error.name === 'CastError') {
      logger.warn('Invalid project ID format', { projectId: req.params.id });
      throw new ApiError('Invalid project ID', 400);
    }
    logger.error('Error fetching project', { error: error.message, projectId: req.params.id });
    throw error;
  }
});

/**
 * @desc    Create new project
 * @route   POST /api/v1/projects
 * @access  Public
 */
const createProject = asyncHandler(async (req, res) => {
  try {
    logger.info('POST /api/v1/projects - Creating new project', {
      body: { ...req.body, description: req.body.description ? '[REDACTED]' : undefined },
      ip: req.ip
    });

    const project = await Project.create(req.body);

    logger.info('Project created successfully', { 
      projectId: project._id, 
      name: project.name,
      localSourceFolder: project.localSourceFolder,
      githubRepo: project.githubRepo
    });

    res.status(201).json({
      success: true,
      data: project,
      message: 'Project created successfully'
    });

  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      logger.warn('Project validation failed', { errors: messages, body: req.body });
      throw new ApiError(`Validation failed: ${messages.join(', ')}`, 400);
    }
    logger.error('Error creating project', { error: error.message, body: req.body });
    throw new ApiError('Failed to create project', 500);
  }
});

/**
 * @desc    Update project
 * @route   PUT /api/v1/projects/:id
 * @access  Public
 */
const updateProject = asyncHandler(async (req, res) => {
  try {
    logger.info('PUT /api/v1/projects/:id - Updating project', {
      projectId: req.params.id,
      updates: Object.keys(req.body),
      ip: req.ip
    });

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!project) {
      logger.warn('Project not found for update', { projectId: req.params.id });
      throw new ApiError('Project not found', 404);
    }

    logger.info('Project updated successfully', { 
      projectId: project._id, 
      name: project.name,
      localSourceFolder: project.localSourceFolder,
      githubRepo: project.githubRepo,
      updatedFields: Object.keys(req.body)
    });

    res.status(200).json({
      success: true,
      data: project,
      message: 'Project updated successfully'
    });

  } catch (error) {
    if (error.name === 'CastError') {
      logger.warn('Invalid project ID format for update', { projectId: req.params.id });
      throw new ApiError('Invalid project ID', 400);
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      logger.warn('Project update validation failed', { errors: messages, projectId: req.params.id });
      throw new ApiError(`Validation failed: ${messages.join(', ')}`, 400);
    }
    logger.error('Error updating project', { error: error.message, projectId: req.params.id });
    throw new ApiError('Failed to update project', 500);
  }
});

/**
 * @desc    Delete project
 * @route   DELETE /api/v1/projects/:id
 * @access  Public
 */
const deleteProject = asyncHandler(async (req, res) => {
  try {
    logger.info('DELETE /api/v1/projects/:id - Deleting project', {
      projectId: req.params.id,
      ip: req.ip
    });

    const project = await Project.findById(req.params.id);

    if (!project) {
      logger.warn('Project not found for deletion', { projectId: req.params.id });
      throw new ApiError('Project not found', 404);
    }

    await Project.findByIdAndDelete(req.params.id);

    logger.info('Project deleted successfully', { 
      projectId: req.params.id, 
      title: project.title 
    });

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
      data: {
        id: req.params.id,
        title: project.title
      }
    });

  } catch (error) {
    if (error.name === 'CastError') {
      logger.warn('Invalid project ID format for deletion', { projectId: req.params.id });
      throw new ApiError('Invalid project ID', 400);
    }
    logger.error('Error deleting project', { error: error.message, projectId: req.params.id });
    throw new ApiError('Failed to delete project', 500);
  }
});

/**
 * @desc    Get projects by status
 * @route   GET /api/v1/projects/status/:status
 * @access  Public
 */
const getProjectsByStatus = asyncHandler(async (req, res) => {
  try {
    const { status } = req.params;
    
    logger.info('GET /api/v1/projects/status/:status - Fetching projects by status', {
      status,
      ip: req.ip
    });

    const validStatuses = ['draft', 'active', 'completed', 'archived'];
    if (!validStatuses.includes(status)) {
      logger.warn('Invalid project status requested', { status, validStatuses });
      throw new ApiError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }

    const projects = await Project.findByStatus(status).lean();

    logger.info('Projects by status fetched successfully', { 
      status, 
      count: projects.length 
    });

    res.status(200).json({
      success: true,
      data: projects,
      count: projects.length,
      status
    });

  } catch (error) {
    logger.error('Error fetching projects by status', { error: error.message, status: req.params.status });
    throw error;
  }
});

/**
 * @desc    Get overdue projects
 * @route   GET /api/v1/projects/overdue
 * @access  Public
 */
const getOverdueProjects = asyncHandler(async (req, res) => {
  try {
    logger.info('GET /api/v1/projects/overdue - Fetching overdue projects', {
      ip: req.ip
    });

    const projects = await Project.findOverdue().lean();

    logger.info('Overdue projects fetched successfully', { 
      count: projects.length 
    });

    res.status(200).json({
      success: true,
      data: projects,
      count: projects.length,
      message: projects.length === 0 ? 'No overdue projects found' : `Found ${projects.length} overdue projects`
    });

  } catch (error) {
    logger.error('Error fetching overdue projects', { error: error.message });
    throw new ApiError('Failed to fetch overdue projects', 500);
  }
});

/**
 * @desc    Update project progress
 * @route   PATCH /api/v1/projects/:id/progress
 * @access  Public
 */
const updateProjectProgress = asyncHandler(async (req, res) => {
  try {
    const { progress } = req.body;
    
    logger.info('PATCH /api/v1/projects/:id/progress - Updating project progress', {
      projectId: req.params.id,
      progress,
      ip: req.ip
    });

    if (typeof progress !== 'number' || progress < 0 || progress > 100) {
      throw new ApiError('Progress must be a number between 0 and 100', 400);
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      logger.warn('Project not found for progress update', { projectId: req.params.id });
      throw new ApiError('Project not found', 404);
    }

    await project.updateProgress(progress);

    logger.info('Project progress updated successfully', { 
      projectId: project._id, 
      oldProgress: project.progress,
      newProgress: progress,
      status: project.status
    });

    res.status(200).json({
      success: true,
      data: project,
      message: `Project progress updated to ${progress}%`
    });

  } catch (error) {
    if (error.name === 'CastError') {
      logger.warn('Invalid project ID format for progress update', { projectId: req.params.id });
      throw new ApiError('Invalid project ID', 400);
    }
    logger.error('Error updating project progress', { error: error.message, projectId: req.params.id });
    throw error;
  }
});

module.exports = {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getProjectsByStatus,
  getOverdueProjects,
  updateProjectProgress
};