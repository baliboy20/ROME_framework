const express = require('express');
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getProjectsByStatus,
  getOverdueProjects,
  updateProjectProgress
} = require('../controllers/projectController');

const { projectValidation, queryValidation } = require('../middleware/validation');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Project:
 *       type: object
 *       required:
 *         - title
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the project
 *         title:
 *           type: string
 *           minLength: 3
 *           maxLength: 100
 *           description: The project title
 *         description:
 *           type: string
 *           maxLength: 500
 *           description: The project description
 *         status:
 *           type: string
 *           enum: [draft, active, completed, archived]
 *           description: The project status
 *         priority:
 *           type: string
 *           enum: [low, medium, high, critical]
 *           description: The project priority
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: The project start date
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: The project end date
 *         progress:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           description: Project completion percentage
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the project was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the project was last updated
 */

/**
 * @swagger
 * /api/v1/projects:
 *   get:
 *     summary: Get all projects
 *     tags: [Projects]
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
 *         description: Number of projects per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, active, completed, archived]
 *         description: Filter by project status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *         description: Filter by project priority
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title and description
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of projects retrieved successfully
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
 *                     $ref: '#/components/schemas/Project'
 *                 pagination:
 *                   type: object
 *       500:
 *         description: Server error
 */
router.get('/', queryValidation.pagination, getProjects);

/**
 * @swagger
 * /api/v1/projects/overdue:
 *   get:
 *     summary: Get overdue projects
 *     tags: [Projects]
 *     responses:
 *       200:
 *         description: List of overdue projects
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
 *                     $ref: '#/components/schemas/Project'
 *                 count:
 *                   type: number
 */
router.get('/overdue', getOverdueProjects);

/**
 * @swagger
 * /api/v1/projects/status/{status}:
 *   get:
 *     summary: Get projects by status
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [draft, active, completed, archived]
 *         description: Project status
 *     responses:
 *       200:
 *         description: List of projects with specified status
 *       400:
 *         description: Invalid status
 */
router.get('/status/:status', getProjectsByStatus);

/**
 * @swagger
 * /api/v1/projects/{id}:
 *   get:
 *     summary: Get project by id
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The project id
 *     responses:
 *       200:
 *         description: Project retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Project'
 *       404:
 *         description: Project not found
 *       400:
 *         description: Invalid project ID
 */
router.get('/:id', projectValidation.getById, getProject);

/**
 * @swagger
 * /api/v1/projects:
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 500
 *               status:
 *                 type: string
 *                 enum: [draft, active, completed, archived]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Project created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Project'
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/', projectValidation.create, createProject);

/**
 * @swagger
 * /api/v1/projects/{id}:
 *   put:
 *     summary: Update project by id
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The project id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 500
 *               status:
 *                 type: string
 *                 enum: [draft, active, completed, archived]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Project updated successfully
 *       400:
 *         description: Validation error or invalid ID
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.put('/:id', projectValidation.update, updateProject);

/**
 * @swagger
 * /api/v1/projects/{id}/progress:
 *   patch:
 *     summary: Update project progress
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The project id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - progress
 *             properties:
 *               progress:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *     responses:
 *       200:
 *         description: Project progress updated successfully
 *       400:
 *         description: Invalid progress value or project ID
 *       404:
 *         description: Project not found
 */
router.patch('/:id/progress', updateProjectProgress);

/**
 * @swagger
 * /api/v1/projects/{id}:
 *   delete:
 *     summary: Delete project by id
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The project id
 *     responses:
 *       200:
 *         description: Project deleted successfully
 *       400:
 *         description: Invalid project ID
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', projectValidation.delete, deleteProject);

module.exports = router;