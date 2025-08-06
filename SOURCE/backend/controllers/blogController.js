const Blog = require('../models/Blog');
const Project = require('../models/Project');
const Task = require('../models/Task');
const { ApiError, logger } = require('../middleware/errorHandler');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Get all blogs
 * @route   GET /api/v1/blogs
 * @access  Public
 */
const getBlogs = asyncHandler(async (req, res) => {
  try {
    logger.info('GET /api/v1/blogs - Fetching all blogs', {
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
    
    // Only show published blogs by default, unless specifically requesting all
    if (req.query.includeUnpublished !== 'true') {
      filter.isPublished = true; // Show only published blogs
    }
    
    if (req.query.category) {
      filter.category = req.query.category;
    }
    if (req.query.author) {
      filter.author = req.query.author;
    }
    if (req.query.tag) {
      filter.tags = req.query.tag;
    }
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { content: { $regex: req.query.search, $options: 'i' } },
        { tags: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    logger.info('Blog query filter applied', { filter, pagination: { page, limit, skip } });

    const blogs = await Blog.find(filter)
      .populate('projectRef', 'title status')
      .populate('taskRef', 'title status')
      .populate('relatedPosts', 'title publishedDate')
      .select('-content') // Exclude full content for list view
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Blog.countDocuments(filter);

    logger.info('Blogs fetched successfully', { 
      count: blogs.length, 
      total, 
      page, 
      totalPages: Math.ceil(total / limit) 
    });

    res.status(200).json({
      success: true,
      data: blogs,
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
    logger.error('Error fetching blogs', { error: error.message, stack: error.stack });
    throw new ApiError('Failed to fetch blogs', 500);
  }
});

/**
 * @desc    Get single blog
 * @route   GET /api/v1/blogs/:id
 * @access  Public
 */
const getBlog = asyncHandler(async (req, res) => {
  try {
    logger.info('GET /api/v1/blogs/:id - Fetching blog', {
      blogId: req.params.id,
      ip: req.ip
    });

    const blog = await Blog.findById(req.params.id)
      .populate('projectRef', 'title status priority')
      .populate('taskRef', 'title status priority')
      .populate('relatedPosts', 'title publishedDate excerpt');

    if (!blog) {
      logger.warn('Blog not found', { blogId: req.params.id });
      throw new ApiError('Blog not found', 404);
    }

    // Increment view count
    await blog.incrementViews();

    logger.info('Blog fetched successfully', { 
      blogId: blog._id, 
      title: blog.title, 
      views: blog.views 
    });

    res.status(200).json({
      success: true,
      data: blog
    });

  } catch (error) {
    if (error.name === 'CastError') {
      logger.warn('Invalid blog ID format', { blogId: req.params.id });
      throw new ApiError('Invalid blog ID', 400);
    }
    logger.error('Error fetching blog', { error: error.message, blogId: req.params.id });
    throw error;
  }
});

/**
 * @desc    Create new blog
 * @route   POST /api/v1/blogs
 * @access  Public
 */
const createBlog = asyncHandler(async (req, res) => {
  try {
    logger.info('POST /api/v1/blogs - Creating new blog', {
      body: { ...req.body, content: req.body.content ? '[REDACTED]' : undefined },
      ip: req.ip
    });

    // Validate project reference if provided
    if (req.body.projectRef) {
      const project = await Project.findById(req.body.projectRef);
      if (!project) {
        logger.warn('Project not found for blog creation', { projectId: req.body.projectRef });
        throw new ApiError('Project not found', 404);
      }
      logger.info('Blog linked to project', { projectId: project._id, projectTitle: project.title });
    }

    // Validate task reference if provided
    if (req.body.taskRef) {
      const task = await Task.findById(req.body.taskRef);
      if (!task) {
        logger.warn('Task not found for blog creation', { taskId: req.body.taskRef });
        throw new ApiError('Task not found', 404);
      }
      logger.info('Blog linked to task', { taskId: task._id, taskTitle: task.title });
    }

    // Transform frontend 'draft' field to backend 'isPublished' field
    const blogData = { ...req.body };
    if (blogData.draft !== undefined) {
      blogData.isPublished = !blogData.draft; // draft: true means isPublished: false
      delete blogData.draft; // Remove the draft field
    }
    
    const blog = await Blog.create(blogData);
    
    // CRITICAL FIX: Ensure the blog is actually saved by re-fetching it
    const savedBlog = await Blog.findById(blog._id);
    if (!savedBlog) {
      logger.error('Blog creation failed - blog not found after creation', { 
        blogId: blog._id, 
        title: blog.title 
      });
      throw new ApiError('Failed to save blog to database', 500);
    }
    
    // Populate the created blog for response
    await savedBlog.populate([
      { path: 'projectRef', select: 'title status' },
      { path: 'taskRef', select: 'title status' }
    ]);

    logger.info('Blog created successfully', { 
      blogId: savedBlog._id, 
      title: savedBlog.title,
      isPublished: savedBlog.isPublished,
      category: savedBlog.category
    });

    res.status(201).json({
      success: true,
      data: savedBlog,
      message: 'Blog created successfully'
    });

  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      logger.warn('Blog validation failed', { errors: messages, body: req.body });
      throw new ApiError(`Validation failed: ${messages.join(', ')}`, 400);
    }
    if (error.name === 'CastError') {
      logger.warn('Invalid reference ID in blog creation', { body: req.body });
      throw new ApiError('Invalid project or task ID', 400);
    }
    logger.error('Error creating blog', { error: error.message, body: req.body });
    throw error;
  }
});

/**
 * @desc    Update blog
 * @route   PUT /api/v1/blogs/:id
 * @access  Public
 */
const updateBlog = asyncHandler(async (req, res) => {
  try {
    logger.info('PUT /api/v1/blogs/:id - Updating blog', {
      blogId: req.params.id,
      updates: Object.keys(req.body),
      ip: req.ip
    });

    // Validate project reference if being updated
    if (req.body.projectRef) {
      const project = await Project.findById(req.body.projectRef);
      if (!project) {
        logger.warn('Project not found for blog update', { projectId: req.body.projectRef });
        throw new ApiError('Project not found', 404);
      }
    }

    // Validate task reference if being updated
    if (req.body.taskRef) {
      const task = await Task.findById(req.body.taskRef);
      if (!task) {
        logger.warn('Task not found for blog update', { taskId: req.body.taskRef });
        throw new ApiError('Task not found', 404);
      }
    }

    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate([
      { path: 'projectRef', select: 'title status' },
      { path: 'taskRef', select: 'title status' }
    ]);

    if (!blog) {
      logger.warn('Blog not found for update', { blogId: req.params.id });
      throw new ApiError('Blog not found', 404);
    }

    logger.info('Blog updated successfully', { 
      blogId: blog._id, 
      title: blog.title,
      updatedFields: Object.keys(req.body)
    });

    res.status(200).json({
      success: true,
      data: blog,
      message: 'Blog updated successfully'
    });

  } catch (error) {
    if (error.name === 'CastError') {
      if (error.path === '_id') {
        logger.warn('Invalid blog ID format for update', { blogId: req.params.id });
        throw new ApiError('Invalid blog ID', 400);
      }
      logger.warn('Invalid reference ID in blog update', { blogId: req.params.id });
      throw new ApiError('Invalid project or task ID', 400);
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      logger.warn('Blog update validation failed', { errors: messages, blogId: req.params.id });
      throw new ApiError(`Validation failed: ${messages.join(', ')}`, 400);
    }
    logger.error('Error updating blog', { error: error.message, blogId: req.params.id });
    throw error;
  }
});

/**
 * @desc    Delete blog
 * @route   DELETE /api/v1/blogs/:id
 * @access  Public
 */
const deleteBlog = asyncHandler(async (req, res) => {
  try {
    logger.info('DELETE /api/v1/blogs/:id - Deleting blog', {
      blogId: req.params.id,
      ip: req.ip
    });

    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      logger.warn('Blog not found for deletion', { blogId: req.params.id });
      throw new ApiError('Blog not found', 404);
    }

    await Blog.findByIdAndDelete(req.params.id);

    logger.info('Blog deleted successfully', { 
      blogId: req.params.id, 
      title: blog.title 
    });

    res.status(200).json({
      success: true,
      message: 'Blog deleted successfully',
      data: {
        id: req.params.id,
        title: blog.title
      }
    });

  } catch (error) {
    if (error.name === 'CastError') {
      logger.warn('Invalid blog ID format for deletion', { blogId: req.params.id });
      throw new ApiError('Invalid blog ID', 400);
    }
    logger.error('Error deleting blog', { error: error.message, blogId: req.params.id });
    throw new ApiError('Failed to delete blog', 500);
  }
});

/**
 * @desc    Get blogs by category
 * @route   GET /api/v1/blogs/category/:category
 * @access  Public
 */
const getBlogsByCategory = asyncHandler(async (req, res) => {
  try {
    const { category } = req.params;
    
    logger.info('GET /api/v1/blogs/category/:category - Fetching blogs by category', {
      category,
      ip: req.ip
    });

    const validCategories = ['general', 'project_update', 'technical', 'personal', 'milestone'];
    if (!validCategories.includes(category)) {
      logger.warn('Invalid blog category requested', { category, validCategories });
      throw new ApiError(`Invalid category. Must be one of: ${validCategories.join(', ')}`, 400);
    }

    const blogs = await Blog.findByCategory(category)
      .populate('projectRef', 'title status')
      .populate('taskRef', 'title status')
      .select('-content')
      .lean();

    logger.info('Blogs by category fetched successfully', { 
      category, 
      count: blogs.length 
    });

    res.status(200).json({
      success: true,
      data: blogs,
      count: blogs.length,
      category
    });

  } catch (error) {
    logger.error('Error fetching blogs by category', { error: error.message, category: req.params.category });
    throw error;
  }
});

/**
 * @desc    Get published blogs only
 * @route   GET /api/v1/blogs/published
 * @access  Public
 */
const getPublishedBlogs = asyncHandler(async (req, res) => {
  try {
    logger.info('GET /api/v1/blogs/published - Fetching published blogs', {
      ip: req.ip
    });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const blogs = await Blog.findPublished()
      .populate('projectRef', 'title status')
      .populate('taskRef', 'title status')
      .select('-content')
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Blog.countDocuments({ isPublished: true });

    logger.info('Published blogs fetched successfully', { 
      count: blogs.length,
      total,
      page
    });

    res.status(200).json({
      success: true,
      data: blogs,
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
    logger.error('Error fetching published blogs', { error: error.message });
    throw new ApiError('Failed to fetch published blogs', 500);
  }
});

/**
 * @desc    Publish/unpublish blog
 * @route   PATCH /api/v1/blogs/:id/publish
 * @access  Public
 */
const togglePublish = asyncHandler(async (req, res) => {
  try {
    const { publish } = req.body;
    
    logger.info('PATCH /api/v1/blogs/:id/publish - Toggling blog publish status', {
      blogId: req.params.id,
      publish,
      ip: req.ip
    });

    if (typeof publish !== 'boolean') {
      throw new ApiError('Publish status must be a boolean', 400);
    }

    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      logger.warn('Blog not found for publish toggle', { blogId: req.params.id });
      throw new ApiError('Blog not found', 404);
    }

    if (publish) {
      await blog.publish();
    } else {
      await blog.unpublish();
    }

    logger.info('Blog publish status updated successfully', { 
      blogId: blog._id, 
      title: blog.title,
      isPublished: blog.isPublished,
      publishedDate: blog.publishedDate
    });

    res.status(200).json({
      success: true,
      data: blog,
      message: `Blog ${publish ? 'published' : 'unpublished'} successfully`
    });

  } catch (error) {
    if (error.name === 'CastError') {
      logger.warn('Invalid blog ID format for publish toggle', { blogId: req.params.id });
      throw new ApiError('Invalid blog ID', 400);
    }
    logger.error('Error toggling blog publish status', { error: error.message, blogId: req.params.id });
    throw error;
  }
});

/**
 * @desc    Like blog
 * @route   PATCH /api/v1/blogs/:id/like
 * @access  Public
 */
const likeBlog = asyncHandler(async (req, res) => {
  try {
    logger.info('PATCH /api/v1/blogs/:id/like - Liking blog', {
      blogId: req.params.id,
      ip: req.ip
    });

    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      logger.warn('Blog not found for like', { blogId: req.params.id });
      throw new ApiError('Blog not found', 404);
    }

    await blog.incrementLikes();

    logger.info('Blog liked successfully', { 
      blogId: blog._id, 
      title: blog.title,
      likes: blog.likes
    });

    res.status(200).json({
      success: true,
      data: {
        id: blog._id,
        title: blog.title,
        likes: blog.likes
      },
      message: 'Blog liked successfully'
    });

  } catch (error) {
    if (error.name === 'CastError') {
      logger.warn('Invalid blog ID format for like', { blogId: req.params.id });
      throw new ApiError('Invalid blog ID', 400);
    }
    logger.error('Error liking blog', { error: error.message, blogId: req.params.id });
    throw error;
  }
});

/**
 * @desc    Search blogs
 * @route   GET /api/v1/blogs/search
 * @access  Public
 */
const searchBlogs = asyncHandler(async (req, res) => {
  try {
    const { q } = req.query;
    
    logger.info('GET /api/v1/blogs/search - Searching blogs', {
      query: q,
      ip: req.ip
    });

    if (!q || q.trim().length === 0) {
      throw new ApiError('Search query is required', 400);
    }

    const blogs = await Blog.searchByContent(q.trim())
      .populate('projectRef', 'title status')
      .populate('taskRef', 'title status')
      .select('-content')
      .limit(20)
      .lean();

    logger.info('Blog search completed', { 
      query: q,
      count: blogs.length 
    });

    res.status(200).json({
      success: true,
      data: blogs,
      count: blogs.length,
      query: q.trim()
    });

  } catch (error) {
    logger.error('Error searching blogs', { error: error.message, query: req.query.q });
    throw error;
  }
});

module.exports = {
  getBlogs,
  getBlog,
  createBlog,
  updateBlog,
  deleteBlog,
  getBlogsByCategory,
  getPublishedBlogs,
  togglePublish,
  likeBlog,
  searchBlogs
};