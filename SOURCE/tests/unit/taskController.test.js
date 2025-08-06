const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../backend/server');
const Task = require('../../backend/models/Task');
const Project = require('../../backend/models/Project');

// Mock the database connection for testing
jest.mock('../../backend/config/database', () => ({
  connect: jest.fn().mockResolvedValue(true),
  getConnectionStatus: jest.fn().mockReturnValue('connected'),
  isDbConnected: jest.fn().mockReturnValue(true)
}));

describe('Task Controller', () => {
  let projectId;

  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/project_management_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
  });

  beforeEach(async () => {
    // Clear the database before each test
    await Task.deleteMany({});
    await Project.deleteMany({});

    // Create a test project
    const project = await Project.create({
      title: 'Test Project',
      description: 'A project for testing tasks'
    });
    projectId = project._id.toString();
  });

  afterAll(async () => {
    // Close database connection
    await mongoose.connection.close();
  });

  describe('POST /api/v1/tasks', () => {
    it('should create a new task with valid data', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'A test task',
        projectId: projectId,
        status: 'todo',
        priority: 'high',
        estimatedHours: 8
      };

      const response = await request(app)
        .post('/api/v1/tasks')
        .send(taskData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(taskData.title);
      expect(response.body.data.description).toBe(taskData.description);
      expect(response.body.data.projectId._id).toBe(projectId);
      expect(response.body.data.status).toBe(taskData.status);
      expect(response.body.data.priority).toBe(taskData.priority);
      expect(response.body.data.estimatedHours).toBe(taskData.estimatedHours);
    });

    it('should create task without project reference', async () => {
      const taskData = {
        title: 'Standalone Task',
        description: 'A task without project'
      };

      const response = await request(app)
        .post('/api/v1/tasks')
        .send(taskData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(taskData.title);
      expect(response.body.data.projectId).toBeUndefined();
    });

    it('should fail to create task without title', async () => {
      const taskData = {
        description: 'A task without title'
      };

      const response = await request(app)
        .post('/api/v1/tasks')
        .send(taskData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Task title is required');
    });

    it('should fail with non-existent project ID', async () => {
      const nonExistentProjectId = new mongoose.Types.ObjectId();
      const taskData = {
        title: 'Test Task',
        projectId: nonExistentProjectId
      };

      const response = await request(app)
        .post('/api/v1/tasks')
        .send(taskData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Project not found');
    });

    it('should create task with default values', async () => {
      const taskData = {
        title: 'Minimal Task'
      };

      const response = await request(app)
        .post('/api/v1/tasks')
        .send(taskData)
        .expect(201);

      expect(response.body.data.status).toBe('todo');
      expect(response.body.data.priority).toBe('medium');
      expect(response.body.data.assignedTo).toBe('unassigned');
      expect(response.body.data.actualHours).toBe(0);
    });
  });

  describe('GET /api/v1/tasks', () => {
    beforeEach(async () => {
      // Create test tasks
      await Task.create([
        {
          title: 'Task 1',
          description: 'First task',
          projectId: projectId,
          status: 'todo',
          priority: 'high',
          assignedTo: 'user1'
        },
        {
          title: 'Task 2',
          description: 'Second task',
          status: 'in_progress',
          priority: 'medium',
          assignedTo: 'user2'
        },
        {
          title: 'Task 3',
          description: 'Third task',
          status: 'completed',
          priority: 'low'
        }
      ]);
    });

    it('should get all tasks', async () => {
      const response = await request(app)
        .get('/api/v1/tasks')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.pagination).toBeDefined();
    });

    it('should filter tasks by status', async () => {
      const response = await request(app)
        .get('/api/v1/tasks?status=todo')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe('todo');
    });

    it('should filter tasks by priority', async () => {
      const response = await request(app)
        .get('/api/v1/tasks?priority=high')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].priority).toBe('high');
    });

    it('should filter tasks by project ID', async () => {
      const response = await request(app)
        .get(`/api/v1/tasks?projectId=${projectId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].projectId._id).toBe(projectId);
    });

    it('should filter tasks by assignee', async () => {
      const response = await request(app)
        .get('/api/v1/tasks?assignedTo=user1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].assignedTo).toBe('user1');
    });

    it('should search tasks by title and description', async () => {
      const response = await request(app)
        .get('/api/v1/tasks?search=First')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toContain('Task 1');
    });
  });

  describe('GET /api/v1/tasks/:id', () => {
    let taskId;

    beforeEach(async () => {
      const task = await Task.create({
        title: 'Test Task',
        description: 'A test task',
        projectId: projectId
      });
      taskId = task._id.toString();
    });

    it('should get task by valid ID', async () => {
      const response = await request(app)
        .get(`/api/v1/tasks/${taskId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(taskId);
      expect(response.body.data.title).toBe('Test Task');
      expect(response.body.data.projectId).toBeDefined();
    });

    it('should return 404 for non-existent task', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/v1/tasks/${nonExistentId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Task not found');
    });

    it('should return 400 for invalid task ID', async () => {
      const response = await request(app)
        .get('/api/v1/tasks/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Invalid task ID');
    });
  });

  describe('PUT /api/v1/tasks/:id', () => {
    let taskId;

    beforeEach(async () => {
      const task = await Task.create({
        title: 'Original Task',
        description: 'Original description',
        status: 'todo'
      });
      taskId = task._id.toString();
    });

    it('should update task with valid data', async () => {
      const updateData = {
        title: 'Updated Task',
        description: 'Updated description',
        status: 'in_progress',
        actualHours: 4
      };

      const response = await request(app)
        .put(`/api/v1/tasks/${taskId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updateData.title);
      expect(response.body.data.description).toBe(updateData.description);
      expect(response.body.data.status).toBe(updateData.status);
      expect(response.body.data.actualHours).toBe(updateData.actualHours);
    });

    it('should update task with project reference', async () => {
      const updateData = {
        projectId: projectId
      };

      const response = await request(app)
        .put(`/api/v1/tasks/${taskId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.projectId._id).toBe(projectId);
    });

    it('should fail with non-existent project ID', async () => {
      const nonExistentProjectId = new mongoose.Types.ObjectId();
      const updateData = {
        projectId: nonExistentProjectId
      };

      const response = await request(app)
        .put(`/api/v1/tasks/${taskId}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Project not found');
    });
  });

  describe('DELETE /api/v1/tasks/:id', () => {
    let taskId;

    beforeEach(async () => {
      const task = await Task.create({
        title: 'Task to Delete',
        description: 'This task will be deleted'
      });
      taskId = task._id.toString();
    });

    it('should delete task successfully', async () => {
      const response = await request(app)
        .delete(`/api/v1/tasks/${taskId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Task deleted successfully');

      // Verify task is deleted
      const deletedTask = await Task.findById(taskId);
      expect(deletedTask).toBeNull();
    });

    it('should return 404 for non-existent task', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/v1/tasks/${nonExistentId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Task not found');
    });
  });

  describe('GET /api/v1/tasks/project/:projectId', () => {
    beforeEach(async () => {
      await Task.create([
        { title: 'Project Task 1', projectId: projectId },
        { title: 'Project Task 2', projectId: projectId },
        { title: 'Standalone Task' }
      ]);
    });

    it('should get tasks by project ID', async () => {
      const response = await request(app)
        .get(`/api/v1/tasks/project/${projectId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.project.id).toBe(projectId);
    });

    it('should return 404 for non-existent project', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/v1/tasks/project/${nonExistentId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Project not found');
    });
  });

  describe('GET /api/v1/tasks/overdue', () => {
    beforeEach(async () => {
      const pastDate = new Date(Date.now() - 86400000); // 1 day ago
      const futureDate = new Date(Date.now() + 86400000); // 1 day from now

      await Task.create([
        {
          title: 'Overdue Task',
          dueDate: pastDate,
          status: 'todo'
        },
        {
          title: 'On Time Task',
          dueDate: futureDate,
          status: 'todo'
        },
        {
          title: 'Completed Task',
          dueDate: pastDate,
          status: 'completed'
        }
      ]);
    });

    it('should get overdue tasks', async () => {
      const response = await request(app)
        .get('/api/v1/tasks/overdue')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Overdue Task');
    });
  });

  describe('POST /api/v1/tasks/:id/subtasks', () => {
    let taskId;

    beforeEach(async () => {
      const task = await Task.create({
        title: 'Parent Task',
        description: 'A task with subtasks'
      });
      taskId = task._id.toString();
    });

    it('should add subtask successfully', async () => {
      const subtaskData = {
        title: 'New Subtask'
      };

      const response = await request(app)
        .post(`/api/v1/tasks/${taskId}/subtasks`)
        .send(subtaskData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.subtasks).toHaveLength(1);
      expect(response.body.data.subtasks[0].title).toBe('New Subtask');
      expect(response.body.data.subtasks[0].completed).toBe(false);
    });

    it('should fail without subtask title', async () => {
      const response = await request(app)
        .post(`/api/v1/tasks/${taskId}/subtasks`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Subtask title is required');
    });
  });

  describe('PATCH /api/v1/tasks/:id/subtasks/:subtaskId/complete', () => {
    let taskId;
    let subtaskId;

    beforeEach(async () => {
      const task = await Task.create({
        title: 'Parent Task',
        subtasks: [{ title: 'Test Subtask', completed: false }]
      });
      taskId = task._id.toString();
      subtaskId = task.subtasks[0]._id.toString();
    });

    it('should complete subtask successfully', async () => {
      const response = await request(app)
        .patch(`/api/v1/tasks/${taskId}/subtasks/${subtaskId}/complete`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.subtasks[0].completed).toBe(true);
      expect(response.body.data.subtasks[0].completedDate).toBeDefined();
    });

    it('should return 404 for non-existent subtask', async () => {
      const nonExistentSubtaskId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .patch(`/api/v1/tasks/${taskId}/subtasks/${nonExistentSubtaskId}/complete`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Subtask not found');
    });
  });

  describe('PATCH /api/v1/tasks/:id/time', () => {
    let taskId;

    beforeEach(async () => {
      const task = await Task.create({
        title: 'Time Tracking Task',
        actualHours: 5
      });
      taskId = task._id.toString();
    });

    it('should log time successfully', async () => {
      const timeData = {
        hours: 3
      };

      const response = await request(app)
        .patch(`/api/v1/tasks/${taskId}/time`)
        .send(timeData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.actualHours).toBe(8); // 5 + 3
      expect(response.body.message).toBe('3 hours logged successfully');
    });

    it('should fail with invalid hours', async () => {
      const timeData = {
        hours: -2
      };

      const response = await request(app)
        .patch(`/api/v1/tasks/${taskId}/time`)
        .send(timeData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Hours must be a positive number');
    });

    it('should fail with hours too large', async () => {
      const timeData = {
        hours: 25
      };

      const response = await request(app)
        .patch(`/api/v1/tasks/${taskId}/time`)
        .send(timeData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Hours must be a positive number less than or equal to 24');
    });
  });
});