const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../../backend/server');
const Task = require('../../../backend/models/Task');
const Project = require('../../../backend/models/Project');

describe('Task Controller - Enhancement Fields (TASK-ENH-002)', () => {
  let server;
  let testProject;

  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/project_mgmt_test';
    await mongoose.connect(mongoUri);
    
    // Start server
    server = app.listen(0); // Use random port
  });

  afterAll(async () => {
    // Clean up
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    server.close();
  });

  beforeEach(async () => {
    // Clear collections before each test
    await Task.deleteMany({});
    await Project.deleteMany({});
    
    // Create a test project
    testProject = await Project.create({
      title: 'Test Project for Tasks',
      description: 'A project for testing task enhancement features',
      status: 'active'
    });
  });

  describe('POST /api/v1/tasks - Auto-populate projectTitle', () => {
    it('should auto-populate projectTitle when projectId is provided', async () => {
      const taskData = {
        title: 'Test Task with Project',
        description: 'Testing auto-population of project title',
        projectId: testProject._id.toString(),
        status: 'todo',
        priority: 'medium'
      };

      const response = await request(app)
        .post('/api/v1/tasks')
        .send(taskData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Test Task with Project');
      expect(response.body.data.projectId).toBeDefined();
      expect(response.body.data.projectTitle).toBe('Test Project for Tasks');

      // Verify in database
      const savedTask = await Task.findById(response.body.data._id);
      expect(savedTask.projectTitle).toBe('Test Project for Tasks');
      expect(savedTask.projectId.toString()).toBe(testProject._id.toString());
    });

    it('should create task without projectTitle when no projectId provided', async () => {
      const taskData = {
        title: 'Standalone Task',
        description: 'Task without project association',
        status: 'todo',
        priority: 'low'
      };

      const response = await request(app)
        .post('/api/v1/tasks')
        .send(taskData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Standalone Task');
      expect(response.body.data.projectId).toBeUndefined();
      expect(response.body.data.projectTitle).toBeUndefined();

      // Verify in database
      const savedTask = await Task.findById(response.body.data._id);
      expect(savedTask.projectTitle).toBeUndefined();
      expect(savedTask.projectId).toBeUndefined();
    });

    it('should return 404 when projectId does not exist', async () => {
      const nonExistentProjectId = new mongoose.Types.ObjectId();
      const taskData = {
        title: 'Task with Invalid Project',
        description: 'Testing invalid project reference',
        projectId: nonExistentProjectId.toString(),
        status: 'todo'
      };

      const response = await request(app)
        .post('/api/v1/tasks')
        .send(taskData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Project not found');
    });

    it('should handle invalid projectId format gracefully', async () => {
      const taskData = {
        title: 'Task with Invalid Project ID Format',
        description: 'Testing invalid project ID format',
        projectId: 'invalid-project-id',
        status: 'todo'
      };

      const response = await request(app)
        .post('/api/v1/tasks')
        .send(taskData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Invalid project ID');
    });
  });

  describe('PUT /api/v1/tasks/:id - Update projectTitle', () => {
    let testTask;
    let anotherProject;

    beforeEach(async () => {
      // Create a test task
      testTask = await Task.create({
        title: 'Original Task',
        description: 'Task to be updated',
        projectId: testProject._id,
        projectTitle: testProject.title,
        status: 'todo'
      });

      // Create another project for testing updates
      anotherProject = await Project.create({
        title: 'Another Test Project',
        description: 'Another project for testing updates',
        status: 'active'
      });
    });

    it('should update projectTitle when projectId is changed', async () => {
      const updateData = {
        projectId: anotherProject._id.toString(),
        status: 'inProgress'
      };

      const response = await request(app)
        .put(`/api/v1/tasks/${testTask._id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.projectId).toBeDefined();
      expect(response.body.data.projectTitle).toBe('Another Test Project');
      expect(response.body.data.status).toBe('inProgress');

      // Verify in database
      const updatedTask = await Task.findById(testTask._id);
      expect(updatedTask.projectTitle).toBe('Another Test Project');
      expect(updatedTask.projectId.toString()).toBe(anotherProject._id.toString());
    });

    it('should update other fields without affecting projectTitle when projectId unchanged', async () => {
      const updateData = {
        title: 'Updated Task Title',
        description: 'Updated description',
        status: 'completed'
      };

      const response = await request(app)
        .put(`/api/v1/tasks/${testTask._id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Updated Task Title');
      expect(response.body.data.description).toBe('Updated description');
      expect(response.body.data.status).toBe('completed');
      expect(response.body.data.projectTitle).toBe('Test Project for Tasks'); // Should remain unchanged

      // Verify in database
      const updatedTask = await Task.findById(testTask._id);
      expect(updatedTask.projectTitle).toBe('Test Project for Tasks');
      expect(updatedTask.projectId.toString()).toBe(testProject._id.toString());
    });

    it('should return 404 when updating with non-existent projectId', async () => {
      const nonExistentProjectId = new mongoose.Types.ObjectId();
      const updateData = {
        projectId: nonExistentProjectId.toString()
      };

      const response = await request(app)
        .put(`/api/v1/tasks/${testTask._id}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Project not found');
    });

    it('should return 404 when updating non-existent task', async () => {
      const nonExistentTaskId = new mongoose.Types.ObjectId();
      const updateData = {
        title: 'Updated Task'
      };

      const response = await request(app)
        .put(`/api/v1/tasks/${nonExistentTaskId}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Task not found');
    });
  });

  describe('GET /api/v1/tasks/available-projects - Project Selection Dropdown', () => {
    beforeEach(async () => {
      // Clear existing projects and create test projects with different statuses
      await Project.deleteMany({});
      
      await Project.create([
        {
          title: 'Active Project 1',
          description: 'First active project',
          status: 'active'
        },
        {
          title: 'Active Project 2', 
          description: 'Second active project',
          status: 'active'
        },
        {
          title: 'Planning Project',
          description: 'Project in planning phase',
          status: 'planning'
        },
        {
          title: 'In Progress Project',
          description: 'Project currently in progress',
          status: 'in_progress'
        },
        {
          title: 'Completed Project',
          description: 'Completed project should not appear',
          status: 'completed'
        },
        {
          title: 'Archived Project',
          description: 'Archived project should not appear',
          status: 'archived'
        }
      ]);
    });

    it('should return only active, planning, and in_progress projects', async () => {
      const response = await request(app)
        .get('/api/v1/tasks/available-projects')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(4); // Only active, planning, in_progress
      expect(response.body.count).toBe(4);
      expect(response.body.message).toBe('Found 4 available projects');

      // Verify only appropriate statuses are returned
      const statuses = response.body.data.map(p => p.status);
      expect(statuses).toEqual(expect.arrayContaining(['active', 'planning', 'in_progress']));
      expect(statuses).not.toContain('completed');
      expect(statuses).not.toContain('archived');

      // Verify projects are sorted by title
      const titles = response.body.data.map(p => p.title);
      const sortedTitles = [...titles].sort();
      expect(titles).toEqual(sortedTitles);
    });

    it('should return projects with only required fields', async () => {
      const response = await request(app)
        .get('/api/v1/tasks/available-projects')
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // Check that each project has only the required fields
      response.body.data.forEach(project => {
        expect(project).toHaveProperty('_id');
        expect(project).toHaveProperty('title');
        expect(project).toHaveProperty('status');
        expect(project).toHaveProperty('description');
        
        // Should not have other fields like createdAt, updatedAt, etc.
        expect(project).not.toHaveProperty('createdAt');
        expect(project).not.toHaveProperty('updatedAt');
        expect(project).not.toHaveProperty('__v');
      });
    });

    it('should return empty array when no available projects exist', async () => {
      // Remove all projects
      await Project.deleteMany({});

      const response = await request(app)
        .get('/api/v1/tasks/available-projects')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.count).toBe(0);
      expect(response.body.message).toBe('No available projects found');
    });

    it('should handle database errors gracefully', async () => {
      // Mock a database error by closing connection temporarily
      await mongoose.connection.close();

      const response = await request(app)
        .get('/api/v1/tasks/available-projects')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Failed to fetch available projects');

      // Reconnect for cleanup
      const mongoUri = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/project_mgmt_test';
      await mongoose.connect(mongoUri);
    });
  });

  describe('Integration Tests - Complete Workflow', () => {
    it('should handle complete task creation workflow with project selection', async () => {
      // Step 1: Get available projects
      const projectsResponse = await request(app)
        .get('/api/v1/tasks/available-projects')
        .expect(200);

      expect(projectsResponse.body.data.length).toBeGreaterThan(0);
      const selectedProject = projectsResponse.body.data[0];

      // Step 2: Create task with selected project
      const taskData = {
        title: 'Integration Test Task',
        description: 'Task created through complete workflow',
        projectId: selectedProject._id,
        status: 'todo',
        priority: 'high'
      };

      const taskResponse = await request(app)
        .post('/api/v1/tasks')
        .send(taskData)
        .expect(201);

      expect(taskResponse.body.success).toBe(true);
      expect(taskResponse.body.data.projectTitle).toBe(selectedProject.title);
      expect(taskResponse.body.data.projectId).toBeDefined();

      // Step 3: Verify task appears in project task list
      const projectTasksResponse = await request(app)
        .get(`/api/v1/tasks/project/${selectedProject._id}`)
        .expect(200);

      expect(projectTasksResponse.body.success).toBe(true);
      expect(projectTasksResponse.body.data.length).toBeGreaterThan(0);
      
      const createdTask = projectTasksResponse.body.data.find(
        task => task._id === taskResponse.body.data._id
      );
      expect(createdTask).toBeDefined();
      expect(createdTask.projectTitle).toBe(selectedProject.title);
    });

    it('should handle project change workflow', async () => {
      // Create initial task
      const initialTask = await Task.create({
        title: 'Task to Change Project',
        description: 'Will be moved between projects',
        projectId: testProject._id,
        projectTitle: testProject.title,
        status: 'todo'
      });

      // Create another project
      const newProject = await Project.create({
        title: 'New Project Destination',
        description: 'Target project for task move',
        status: 'active'
      });

      // Move task to new project
      const updateResponse = await request(app)
        .put(`/api/v1/tasks/${initialTask._id}`)
        .send({ projectId: newProject._id.toString() })
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.projectTitle).toBe('New Project Destination');
      expect(updateResponse.body.data.projectId).toBeDefined();

      // Verify in database
      const updatedTask = await Task.findById(initialTask._id);
      expect(updatedTask.projectTitle).toBe('New Project Destination');
      expect(updatedTask.projectId.toString()).toBe(newProject._id.toString());
    });
  });

  describe('Field Validation and Edge Cases', () => {
    it('should handle projectTitle field in responses correctly', async () => {
      const taskWithProject = await Task.create({
        title: 'Task with Project Title',
        description: 'Testing project title field',
        projectId: testProject._id,
        projectTitle: testProject.title,
        status: 'todo'
      });

      // Test GET single task
      const getResponse = await request(app)
        .get(`/api/v1/tasks/${taskWithProject._id}`)
        .expect(200);

      expect(getResponse.body.success).toBe(true);
      expect(getResponse.body.data.projectTitle).toBe('Test Project for Tasks');

      // Test GET all tasks
      const getAllResponse = await request(app)
        .get('/api/v1/tasks')
        .expect(200);

      expect(getAllResponse.body.success).toBe(true);
      const foundTask = getAllResponse.body.data.find(t => t._id === taskWithProject._id.toString());
      expect(foundTask.projectTitle).toBe('Test Project for Tasks');
    });

    it('should maintain projectTitle consistency during updates', async () => {
      const task = await Task.create({
        title: 'Consistency Test Task',
        projectId: testProject._id,
        projectTitle: testProject.title,
        status: 'todo'
      });

      // Update project title directly in database
      await Project.findByIdAndUpdate(testProject._id, { title: 'Updated Project Title' });

      // Update task without changing projectId (should not auto-update projectTitle)
      const updateResponse = await request(app)
        .put(`/api/v1/tasks/${task._id}`)
        .send({ description: 'Updated description' })
        .expect(200);

      expect(updateResponse.body.data.projectTitle).toBe('Test Project for Tasks'); // Original title

      // Update task with projectId (should update projectTitle)
      const updateWithProjectResponse = await request(app)
        .put(`/api/v1/tasks/${task._id}`)
        .send({ projectId: testProject._id.toString() })
        .expect(200);

      expect(updateWithProjectResponse.body.data.projectTitle).toBe('Updated Project Title'); // New title
    });
  });
});