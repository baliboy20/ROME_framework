const express = require('express');
const {
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
} = require('../controllers/taskController');

const { taskValidation, queryValidation } = require('../middleware/validation');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Task:
 *       type: object
 *       required:
 *         - title
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the task
 *         title:
 *           type: string
 *           minLength: 3
 *           maxLength: 100
 *           description: The task title
 *         description:
 *           type: string
 *           maxLength: 1000
 *           description: The task description
 *         projectId:
 *           type: string
 *           description: The associated project ID
 *         status:
 *           type: string
 *           enum: [todo, in_progress, completed, blocked]
 *           description: The task status
 *         priority:
 *           type: string
 *           enum: [low, medium, high, critical]
 *           description: The task priority
 *         assignedTo:
 *           type: string
 *           description: Who the task is assigned to
 *         dueDate:
 *           type: string
 *           format: date-time
 *           description: The task due date
 *         estimatedHours:
 *           type: number
 *           minimum: 0
 *           maximum: 1000
 *           description: Estimated hours to complete
 *         actualHours:
 *           type: number
 *           minimum: 0
 *           description: Actual hours spent
 *         subtasks:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               completed:
 *                 type: boolean
 *               completedDate:
 *                 type: string
 *                 format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the task was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the task was last updated
 */

/**
 * @swagger
 * /api/v1/tasks:
 *   get:
 *     summary: Get all tasks
 *     tags: [Tasks]
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
 *         description: Number of tasks per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [todo, in_progress, completed, blocked]
 *         description: Filter by task status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *         description: Filter by task priority
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *         description: Filter by project ID
 *       - in: query
 *         name: assignedTo
 *         schema:
 *           type: string
 *         description: Filter by assignee
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title and description
 *     responses:
 *       200:
 *         description: List of tasks retrieved successfully
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
 *                     $ref: '#/components/schemas/Task'
 *                 pagination:
 *                   type: object
 */
router.get('/', queryValidation.pagination, getTasks);

/**
 * @swagger
 * /api/v1/tasks/overdue:
 *   get:
 *     summary: Get overdue tasks
 *     tags: [Tasks]
 *     responses:
 *       200:
 *         description: List of overdue tasks
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
 *                     $ref: '#/components/schemas/Task'
 *                 count:
 *                   type: number
 */
router.get('/overdue', getOverdueTasks);

/**
 * @swagger
 * /api/v1/tasks/available-projects:
 *   get:
 *     summary: Get available projects for task selection
 *     tags: [Tasks]
 *     description: Returns a list of active projects that can be selected when creating or updating tasks
 *     responses:
 *       200:
 *         description: List of available projects for task selection
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
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: Project ID
 *                       title:
 *                         type: string
 *                         description: Project title
 *                       status:
 *                         type: string
 *                         enum: [active, planning, in_progress]
 *                         description: Project status
 *                       description:
 *                         type: string
 *                         description: Project description
 *                 count:
 *                   type: number
 *                   description: Number of available projects
 *                 message:
 *                   type: string
 *                   description: Response message
 *       500:
 *         description: Server error
 */
router.get('/available-projects', getAvailableProjects);

/**
 * @swagger
 * /api/v1/tasks/project/{projectId}:
 *   get:
 *     summary: Get tasks by project ID
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: List of tasks for the project
 *       400:
 *         description: Invalid project ID
 *       404:
 *         description: Project not found
 */
router.get('/project/:projectId', getTasksByProject);

/**
 * @swagger
 * /api/v1/tasks/{id}:
 *   get:
 *     summary: Get task by id
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The task id
 *     responses:
 *       200:
 *         description: Task retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       404:
 *         description: Task not found
 *       400:
 *         description: Invalid task ID
 */
router.get('/:id', taskValidation.getById, getTask);

/**
 * @swagger
 * /api/v1/tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
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
 *                 maxLength: 1000
 *               projectId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [todo, in_progress, completed, blocked]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *               assignedTo:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               estimatedHours:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1000
 *     responses:
 *       201:
 *         description: Task created successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Project not found (if projectId provided)
 */
router.post('/', taskValidation.create, createTask);

/**
 * @swagger
 * /api/v1/tasks/{id}:
 *   put:
 *     summary: Update task by id
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The task id
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
 *                 maxLength: 1000
 *               projectId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [todo, in_progress, completed, blocked]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *               assignedTo:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               estimatedHours:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1000
 *               actualHours:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1000
 *     responses:
 *       200:
 *         description: Task updated successfully
 *       400:
 *         description: Validation error or invalid ID
 *       404:
 *         description: Task or project not found
 */
router.put('/:id', taskValidation.update, updateTask);

/**
 * @swagger
 * /api/v1/tasks/{id}/subtasks:
 *   post:
 *     summary: Add subtask to task
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The task id
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
 *                 description: Subtask title
 *     responses:
 *       201:
 *         description: Subtask added successfully
 *       400:
 *         description: Invalid input or task ID
 *       404:
 *         description: Task not found
 */
router.post('/:id/subtasks', addSubtask);

/**
 * @swagger
 * /api/v1/tasks/{id}/subtasks/{subtaskId}/complete:
 *   patch:
 *     summary: Complete a subtask
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The task id
 *       - in: path
 *         name: subtaskId
 *         schema:
 *           type: string
 *         required: true
 *         description: The subtask id
 *     responses:
 *       200:
 *         description: Subtask completed successfully
 *       400:
 *         description: Invalid task or subtask ID
 *       404:
 *         description: Task or subtask not found
 */
router.patch('/:id/subtasks/:subtaskId/complete', completeSubtask);

/**
 * @swagger
 * /api/v1/tasks/{id}/time:
 *   patch:
 *     summary: Log time to task
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The task id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hours
 *             properties:
 *               hours:
 *                 type: number
 *                 minimum: 0.1
 *                 maximum: 24
 *                 description: Hours to log
 *     responses:
 *       200:
 *         description: Time logged successfully
 *       400:
 *         description: Invalid hours value or task ID
 *       404:
 *         description: Task not found
 */
router.patch('/:id/time', logTime);

/**
 * @swagger
 * /api/v1/tasks/{id}:
 *   delete:
 *     summary: Delete task by id
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The task id
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *       400:
 *         description: Invalid task ID
 *       404:
 *         description: Task not found
 */
router.delete('/:id', taskValidation.delete, deleteTask);

module.exports = router;