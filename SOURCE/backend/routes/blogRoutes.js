const express = require('express');
const {
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
} = require('../controllers/blogController');

const { blogValidation, queryValidation } = require('../middleware/validation');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Blog:
 *       type: object
 *       required:
 *         - title
 *         - content
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the blog
 *         title:
 *           type: string
 *           minLength: 5
 *           maxLength: 200
 *           description: The blog title
 *         content:
 *           type: string
 *           minLength: 10
 *           description: The blog content
 *         excerpt:
 *           type: string
 *           maxLength: 300
 *           description: The blog excerpt
 *         author:
 *           type: string
 *           description: The blog author
 *         category:
 *           type: string
 *           enum: [general, project_update, technical, personal, milestone]
 *           description: The blog category
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Blog tags
 *         isPublished:
 *           type: boolean
 *           description: Whether the blog is published
 *         publishedDate:
 *           type: string
 *           format: date-time
 *           description: When the blog was published
 *         readingTime:
 *           type: number
 *           description: Estimated reading time in minutes
 *         views:
 *           type: number
 *           description: Number of views
 *         likes:
 *           type: number
 *           description: Number of likes
 *         projectRef:
 *           type: string
 *           description: Associated project ID
 *         taskRef:
 *           type: string
 *           description: Associated task ID
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the blog was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the blog was last updated
 */

/**
 * @swagger
 * /api/v1/blogs/search:
 *   get:
 *     summary: Search blogs
 *     tags: [Blogs]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Blog'
 *                 count:
 *                   type: number
 *                 query:
 *                   type: string
 *       400:
 *         description: Search query is required
 */
router.get('/search', searchBlogs);

/**
 * @swagger
 * /api/v1/blogs/published:
 *   get:
 *     summary: Get published blogs only
 *     tags: [Blogs]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of blogs per page
 *     responses:
 *       200:
 *         description: List of published blogs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Blog'
 *                 pagination:
 *                   type: object
 */
router.get('/published', queryValidation.pagination, getPublishedBlogs);

/**
 * @swagger
 * /api/v1/blogs/category/{category}:
 *   get:
 *     summary: Get blogs by category
 *     tags: [Blogs]
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *           enum: [general, project_update, technical, personal, milestone]
 *         description: Blog category
 *     responses:
 *       200:
 *         description: List of blogs in the category
 *       400:
 *         description: Invalid category
 */
router.get('/category/:category', getBlogsByCategory);

/**
 * @swagger
 * /api/v1/blogs:
 *   get:
 *     summary: Get all blogs
 *     tags: [Blogs]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of blogs per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [general, project_update, technical, personal, milestone]
 *         description: Filter by category
 *       - in: query
 *         name: author
 *         schema:
 *           type: string
 *         description: Filter by author
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *         description: Filter by tag
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title, content, and tags
 *       - in: query
 *         name: includeUnpublished
 *         schema:
 *           type: boolean
 *         description: Include unpublished blogs
 *     responses:
 *       200:
 *         description: List of blogs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Blog'
 *                 pagination:
 *                   type: object
 */
router.get('/', queryValidation.pagination, getBlogs);

/**
 * @swagger
 * /api/v1/blogs/{id}:
 *   get:
 *     summary: Get blog by id
 *     tags: [Blogs]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The blog id
 *     responses:
 *       200:
 *         description: Blog retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Blog'
 *       404:
 *         description: Blog not found
 *       400:
 *         description: Invalid blog ID
 */
router.get('/:id', blogValidation.getById, getBlog);

/**
 * @swagger
 * /api/v1/blogs:
 *   post:
 *     summary: Create a new blog
 *     tags: [Blogs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 200
 *               content:
 *                 type: string
 *                 minLength: 10
 *               excerpt:
 *                 type: string
 *                 maxLength: 300
 *               author:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [general, project_update, technical, personal, milestone]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               isPublished:
 *                 type: boolean
 *               projectRef:
 *                 type: string
 *               taskRef:
 *                 type: string
 *     responses:
 *       201:
 *         description: Blog created successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Project or task not found (if referenced)
 */
router.post('/', blogValidation.create, createBlog);

/**
 * @swagger
 * /api/v1/blogs/{id}:
 *   put:
 *     summary: Update blog by id
 *     tags: [Blogs]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The blog id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 200
 *               content:
 *                 type: string
 *                 minLength: 10
 *               excerpt:
 *                 type: string
 *                 maxLength: 300
 *               author:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [general, project_update, technical, personal, milestone]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               isPublished:
 *                 type: boolean
 *               projectRef:
 *                 type: string
 *               taskRef:
 *                 type: string
 *     responses:
 *       200:
 *         description: Blog updated successfully
 *       400:
 *         description: Validation error or invalid ID
 *       404:
 *         description: Blog, project, or task not found
 */
router.put('/:id', blogValidation.update, updateBlog);

/**
 * @swagger
 * /api/v1/blogs/{id}/publish:
 *   patch:
 *     summary: Publish or unpublish blog
 *     tags: [Blogs]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The blog id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - publish
 *             properties:
 *               publish:
 *                 type: boolean
 *                 description: Whether to publish (true) or unpublish (false)
 *     responses:
 *       200:
 *         description: Blog publish status updated successfully
 *       400:
 *         description: Invalid publish value or blog ID
 *       404:
 *         description: Blog not found
 */
router.patch('/:id/publish', togglePublish);

/**
 * @swagger
 * /api/v1/blogs/{id}/like:
 *   patch:
 *     summary: Like a blog
 *     tags: [Blogs]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The blog id
 *     responses:
 *       200:
 *         description: Blog liked successfully
 *       400:
 *         description: Invalid blog ID
 *       404:
 *         description: Blog not found
 */
router.patch('/:id/like', likeBlog);

/**
 * @swagger
 * /api/v1/blogs/{id}:
 *   delete:
 *     summary: Delete blog by id
 *     tags: [Blogs]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The blog id
 *     responses:
 *       200:
 *         description: Blog deleted successfully
 *       400:
 *         description: Invalid blog ID
 *       404:
 *         description: Blog not found
 */
router.delete('/:id', blogValidation.delete, deleteBlog);

module.exports = router;