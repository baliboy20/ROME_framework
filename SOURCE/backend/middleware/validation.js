const { body, param, query, validationResult } = require('express-validator');
const { ApiError } = require('./errorHandler');

/**
 * Handle validation results
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const handleValidationErrors = (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => ({
        field: error.param,
        message: error.msg,
        value: error.value
      }));
      
      throw new ApiError(`Validation failed: ${errorMessages.map(e => e.message).join(', ')}`, 400);
    }
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validation rules for Project endpoints
 */
const projectValidation = {
  create: [
    body('name')
      .notEmpty()
      .withMessage('Project name is required')
      .isLength({ min: 2, max: 200 })
      .withMessage('Project name must be between 2 and 200 characters')
      .trim(),
    body('description')
      .notEmpty()
      .withMessage('Project description is required')
      .isLength({ min: 10, max: 2000 })
      .withMessage('Project description must be between 10 and 2000 characters')
      .trim(),
    body('localSourceFolder')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Local source folder path cannot exceed 500 characters')
      .trim()
      .custom((value) => {
        if (!value) return true; // Allow empty/null values
        // Basic path validation - allows various OS path formats
        if (!/^[a-zA-Z]:[\\\/]/.test(value) && !/^\//.test(value) && !/^~\//.test(value) && !/^\.\//.test(value) && !/^\.\.\//.test(value)) {
          throw new Error('Invalid local source folder path format');
        }
        return true;
      }),
    body('githubRepo')
      .optional()
      .isLength({ max: 200 })
      .withMessage('GitHub repository URL cannot exceed 200 characters')
      .trim()
      .custom((value) => {
        if (!value) return true; // Allow empty/null values
        // GitHub URL validation regex - supports https, git@, and GitHub Enterprise
        const githubRegex = /^(https:\/\/github\.[\w.-]+\/[\w.-]+\/[\w.-]+|https:\/\/github\.com\/[\w.-]+\/[\w.-]+|git@github\.[\w.-]*:[\w.-]+\/[\w.-]+\.git)$/;
        if (!githubRegex.test(value)) {
          throw new Error('Invalid GitHub repository URL format');
        }
        return true;
      }),
    body('folders')
      .optional()
      .isArray()
      .withMessage('Folders must be an array'),
    body('folders.*')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Each folder path cannot exceed 500 characters')
      .trim(),
    body('repositories')
      .optional()
      .isArray()
      .withMessage('Repositories must be an array')
      .custom((value) => {
        if (value && value.length > 10) {
          throw new Error('Cannot have more than 10 repositories per project');
        }
        return true;
      }),
    body('coreUrls')
      .optional()
      .isArray()
      .withMessage('Core URLs must be an array')
      .custom((value) => {
        if (value && value.length > 20) {
          throw new Error('Cannot have more than 20 URLs per project');
        }
        return true;
      }),
    body('stages')
      .optional()
      .isArray()
      .withMessage('Stages must be an array')
      .custom((value) => {
        if (value && value.length > 50) {
          throw new Error('Cannot have more than 50 stages per project');
        }
        return true;
      }),
    handleValidationErrors
  ],
  
  update: [
    param('id')
      .isMongoId()
      .withMessage('Invalid project ID'),
    body('name')
      .optional()
      .isLength({ min: 2, max: 200 })
      .withMessage('Project name must be between 2 and 200 characters')
      .trim(),
    body('description')
      .optional()
      .isLength({ min: 10, max: 2000 })
      .withMessage('Project description must be between 10 and 2000 characters')
      .trim(),
    body('localSourceFolder')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Local source folder path cannot exceed 500 characters')
      .trim()
      .custom((value) => {
        if (!value) return true; // Allow empty/null values
        // Basic path validation - allows various OS path formats
        if (!/^[a-zA-Z]:[\\\/]/.test(value) && !/^\//.test(value) && !/^~\//.test(value) && !/^\.\//.test(value) && !/^\.\.\//.test(value)) {
          throw new Error('Invalid local source folder path format');
        }
        return true;
      }),
    body('githubRepo')
      .optional()
      .isLength({ max: 200 })
      .withMessage('GitHub repository URL cannot exceed 200 characters')
      .trim()
      .custom((value) => {
        if (!value) return true; // Allow empty/null values
        // GitHub URL validation regex - supports https, git@, and GitHub Enterprise
        const githubRegex = /^(https:\/\/github\.[\w.-]+\/[\w.-]+\/[\w.-]+|https:\/\/github\.com\/[\w.-]+\/[\w.-]+|git@github\.[\w.-]*:[\w.-]+\/[\w.-]+\.git)$/;
        if (!githubRegex.test(value)) {
          throw new Error('Invalid GitHub repository URL format');
        }
        return true;
      }),
    body('folders')
      .optional()
      .isArray()
      .withMessage('Folders must be an array'),
    body('folders.*')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Each folder path cannot exceed 500 characters')
      .trim(),
    body('repositories')
      .optional()
      .isArray()
      .withMessage('Repositories must be an array')
      .custom((value) => {
        if (value && value.length > 10) {
          throw new Error('Cannot have more than 10 repositories per project');
        }
        return true;
      }),
    body('coreUrls')
      .optional()
      .isArray()
      .withMessage('Core URLs must be an array')
      .custom((value) => {
        if (value && value.length > 20) {
          throw new Error('Cannot have more than 20 URLs per project');
        }
        return true;
      }),
    body('stages')
      .optional()
      .isArray()
      .withMessage('Stages must be an array')
      .custom((value) => {
        if (value && value.length > 50) {
          throw new Error('Cannot have more than 50 stages per project');
        }
        return true;
      }),
    handleValidationErrors
  ],

  getById: [
    param('id')
      .isMongoId()
      .withMessage('Invalid project ID'),
    handleValidationErrors
  ],

  delete: [
    param('id')
      .isMongoId()
      .withMessage('Invalid project ID'),
    handleValidationErrors
  ]
};

/**
 * Validation rules for Task endpoints
 */
const taskValidation = {
  create: [
    body('title')
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ min: 3, max: 100 })
      .withMessage('Title must be between 3 and 100 characters')
      .trim(),
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Description cannot exceed 1000 characters')
      .trim(),
    body('projectId')
      .optional()
      .isMongoId()
      .withMessage('Invalid project ID'),
    body('status')
      .optional()
      .isIn(['todo', 'inProgress', 'review', 'blocked', 'completed', 'cancelled'])
      .withMessage('Status must be one of: todo, inProgress, review, blocked, completed, cancelled'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('Priority must be one of: low, medium, high, urgent'),
    body('dueDate')
      .optional()
      .isISO8601()
      .withMessage('Due date must be a valid ISO 8601 date'),
    body('estimatedHours')
      .optional()
      .isFloat({ min: 0, max: 1000 })
      .withMessage('Estimated hours must be a positive number less than 1000'),
    handleValidationErrors
  ],

  update: [
    param('id')
      .isMongoId()
      .withMessage('Invalid task ID'),
    body('title')
      .optional()
      .isLength({ min: 3, max: 100 })
      .withMessage('Title must be between 3 and 100 characters')
      .trim(),
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Description cannot exceed 1000 characters')
      .trim(),
    body('projectId')
      .optional()
      .isMongoId()
      .withMessage('Invalid project ID'),
    body('status')
      .optional()
      .isIn(['todo', 'inProgress', 'review', 'blocked', 'completed', 'cancelled'])
      .withMessage('Status must be one of: todo, inProgress, review, blocked, completed, cancelled'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('Priority must be one of: low, medium, high, urgent'),
    body('dueDate')
      .optional()
      .isISO8601()
      .withMessage('Due date must be a valid ISO 8601 date'),
    body('estimatedHours')
      .optional()
      .isFloat({ min: 0, max: 1000 })
      .withMessage('Estimated hours must be a positive number less than 1000'),
    body('actualHours')
      .optional()
      .isFloat({ min: 0, max: 1000 })
      .withMessage('Actual hours must be a positive number less than 1000'),
    handleValidationErrors
  ],

  getById: [
    param('id')
      .isMongoId()
      .withMessage('Invalid task ID'),
    handleValidationErrors
  ],

  delete: [
    param('id')
      .isMongoId()
      .withMessage('Invalid task ID'),
    handleValidationErrors
  ]
};

/**
 * Validation rules for Blog endpoints
 */
const blogValidation = {
  create: [
    body('title')
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ min: 5, max: 200 })
      .withMessage('Title must be between 5 and 200 characters')
      .trim(),
    body('content')
      .notEmpty()
      .withMessage('Content is required')
      .isLength({ min: 10 })
      .withMessage('Content must be at least 10 characters long'),
    body('excerpt')
      .optional()
      .isLength({ max: 300 })
      .withMessage('Excerpt cannot exceed 300 characters')
      .trim(),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array'),
    body('tags.*')
      .optional()
      .trim()
      .isLength({ min: 2, max: 30 })
      .withMessage('Each tag must be between 2 and 30 characters'),
    body('category')
      .optional()
      .isIn(['general', 'project_update', 'technical', 'personal', 'milestone'])
      .withMessage('Category must be one of: general, project_update, technical, personal, milestone'),
    body('isPublished')
      .optional()
      .isBoolean()
      .withMessage('isPublished must be a boolean'),
    handleValidationErrors
  ],

  update: [
    param('id')
      .isMongoId()
      .withMessage('Invalid blog ID'),
    body('title')
      .optional()
      .isLength({ min: 5, max: 200 })
      .withMessage('Title must be between 5 and 200 characters')
      .trim(),
    body('content')
      .optional()
      .isLength({ min: 10 })
      .withMessage('Content must be at least 10 characters long'),
    body('excerpt')
      .optional()
      .isLength({ max: 300 })
      .withMessage('Excerpt cannot exceed 300 characters')
      .trim(),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array'),
    body('tags.*')
      .optional()
      .trim()
      .isLength({ min: 2, max: 30 })
      .withMessage('Each tag must be between 2 and 30 characters'),
    body('category')
      .optional()
      .isIn(['general', 'project_update', 'technical', 'personal', 'milestone'])
      .withMessage('Category must be one of: general, project_update, technical, personal, milestone'),
    body('isPublished')
      .optional()
      .isBoolean()
      .withMessage('isPublished must be a boolean'),
    handleValidationErrors
  ],

  getById: [
    param('id')
      .isMongoId()
      .withMessage('Invalid blog ID'),
    handleValidationErrors
  ],

  delete: [
    param('id')
      .isMongoId()
      .withMessage('Invalid blog ID'),
    handleValidationErrors
  ]
};

/**
 * Query validation for listing endpoints
 */
const queryValidation = {
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('sortBy')
      .optional()
      .isString()
      .withMessage('SortBy must be a string'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('SortOrder must be asc or desc'),
    handleValidationErrors
  ]
};

module.exports = {
  projectValidation,
  taskValidation,
  blogValidation,
  queryValidation,
  handleValidationErrors
};