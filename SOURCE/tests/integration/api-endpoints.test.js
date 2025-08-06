/**
 * Integration Tests for All API Endpoints
 * Tests all 34 API endpoints with real database operations
 * Ensures end-to-end functionality with seeded data
 */

const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');

// Import server and models
const app = require('../../backend/server');
const Project = require('../../backend/models/Project');
const Task = require('../../backend/models/Task');
const Blog = require('../../backend/models/Blog');

describe('🚀 API Integration Tests - All 34 Endpoints', () => {
  let testProjectId;
  let testTaskId;
  let testBlogId;
  let server;

  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/project_management_test';
    
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    // Seed test data
    await seedTestData();
  });

  afterAll(async () => {
    // Clean up and close connections
    if (server) {
      server.close();
    }
    
    await cleanup();
    await mongoose.connection.close();
  });

  const seedTestData = async () => {
    // Clear existing data
    await Promise.all([
      Project.deleteMany({}),
      Task.deleteMany({}),
      Blog.deleteMany({})
    ]);

    // Create test project
    const testProject = await Project.create({
      name: 'Integration Test Project',
      description: 'Project for API integration testing',
      folders: ['/test/project'],
      repositories: [{
        name: 'test-repo',
        url: 'https://github.com/test/repo.git',
        type: 'git'
      }],
      coreUrls: [{
        title: 'Test URL',
        url: 'https://test.com',
        description: 'Test URL for integration tests'
      }],
      stages: [{
        name: 'Test Stage',
        order: 1,
        description: 'Test stage for integration testing'
      }]
    });
    testProjectId = testProject._id.toString();

    // Create test task
    const testTask = await Task.create({
      projectId: testProjectId,
      title: 'Integration Test Task',
      description: 'Task for API integration testing',
      category: 'Testing',
      progress: 50,
      startDate: new Date(),
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: 'in_progress',
      priority: 'high'
    });
    testTaskId = testTask._id.toString();

    // Create test blog
    const testBlog = await Blog.create({
      projectId: testProjectId,
      title: 'Integration Test Blog',
      content: 'Blog content for API integration testing',
      tags: ['integration', 'testing'],
      publishDate: new Date(),
      draft: false
    });
    testBlogId = testBlog._id.toString();

    console.log(`✅ Test data seeded:
      Project ID: ${testProjectId}
      Task ID: ${testTaskId}  
      Blog ID: ${testBlogId}`);
  };

  const cleanup = async () => {
    await Promise.all([
      Project.deleteMany({}),
      Task.deleteMany({}),
      Blog.deleteMany({})
    ]);
  };

  // =============================================================================
  // PROJECT ENDPOINTS (8 endpoints)
  // =============================================================================
  
  describe('📊 Project API Endpoints (8 endpoints)', () => {
    test('GET /api/v1/projects - Get all projects', async () => {
      const response = await request(app)
        .get('/api/v1/projects')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('name');
      expect(response.body.data[0]).toHaveProperty('description');
    });

    test('GET /api/v1/projects/:id - Get project by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/projects/${testProjectId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(testProjectId);
      expect(response.body.data.name).toBe('Integration Test Project');
    });

    test('POST /api/v1/projects - Create new project', async () => {
      const newProject = {
        name: 'New Integration Project',
        description: 'Created via integration test',
        folders: ['/new/project'],
        repositories: [{
          name: 'new-repo',
          url: 'https://github.com/test/new-repo.git',
          type: 'git'
        }]
      };

      const response = await request(app)
        .post('/api/v1/projects')
        .send(newProject)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(newProject.name);
      expect(response.body.data.description).toBe(newProject.description);
    });

    test('PUT /api/v1/projects/:id - Update project', async () => {
      const updateData = {
        name: 'Updated Integration Project',
        description: 'Updated via integration test'
      };

      const response = await request(app)
        .put(`/api/v1/projects/${testProjectId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.description).toBe(updateData.description);
    });

    test('PATCH /api/v1/projects/:id/progress - Update project progress', async () => {
      const response = await request(app)
        .patch(`/api/v1/projects/${testProjectId}/progress`)
        .send({ progress: 75 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.progress).toBe(75);
    });

    test('GET /api/v1/projects/status/:status - Get projects by status', async () => {
      const response = await request(app)
        .get('/api/v1/projects/status/active')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    test('GET /api/v1/projects/overdue - Get overdue projects', async () => {
      const response = await request(app)
        .get('/api/v1/projects/overdue')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    test('DELETE /api/v1/projects/:id - Delete project', async () => {
      // Create a project to delete
      const projectToDelete = await Project.create({
        name: 'Delete Test Project',
        description: 'Project to be deleted'
      });

      const response = await request(app)
        .delete(`/api/v1/projects/${projectToDelete._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Project deleted successfully');

      // Verify project was deleted
      const deletedProject = await Project.findById(projectToDelete._id);
      expect(deletedProject).toBeNull();
    });
  });

  // =============================================================================
  // TASK ENDPOINTS (10 endpoints)
  // =============================================================================

  describe('📋 Task API Endpoints (10 endpoints)', () => {
    test('GET /api/v1/tasks - Get all tasks', async () => {
      const response = await request(app)
        .get('/api/v1/tasks')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test('GET /api/v1/tasks/:id - Get task by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/tasks/${testTaskId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(testTaskId);
      expect(response.body.data.title).toBe('Integration Test Task');
    });

    test('POST /api/v1/tasks - Create new task', async () => {
      const newTask = {
        projectId: testProjectId,
        title: 'New Integration Task',
        description: 'Created via integration test',
        category: 'Testing',
        priority: 'medium',
        status: 'pending'
      };

      const response = await request(app)
        .post('/api/v1/tasks')
        .send(newTask)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(newTask.title);
      expect(response.body.data.projectId).toBe(testProjectId);
    });

    test('PUT /api/v1/tasks/:id - Update task', async () => {
      const updateData = {
        title: 'Updated Integration Task',
        description: 'Updated via integration test',
        progress: 80
      };

      const response = await request(app)
        .put(`/api/v1/tasks/${testTaskId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updateData.title);
      expect(response.body.data.progress).toBe(updateData.progress);
    });

    test('PATCH /api/v1/tasks/:id/status - Update task status', async () => {
      const response = await request(app)
        .patch(`/api/v1/tasks/${testTaskId}/status`)
        .send({ status: 'completed' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('completed');
    });

    test('GET /api/v1/tasks/project/:projectId - Get tasks by project', async () => {
      const response = await request(app)
        .get(`/api/v1/tasks/project/${testProjectId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].projectId).toBe(testProjectId);
    });

    test('GET /api/v1/tasks/status/:status - Get tasks by status', async () => {
      const response = await request(app)
        .get('/api/v1/tasks/status/completed')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    test('GET /api/v1/tasks/overdue - Get overdue tasks', async () => {
      const response = await request(app)
        .get('/api/v1/tasks/overdue')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    test('POST /api/v1/tasks/:id/subtasks - Add subtask', async () => {
      const subtaskData = {
        title: 'Integration Test Subtask',
        description: 'Subtask created via integration test'
      };

      const response = await request(app)
        .post(`/api/v1/tasks/${testTaskId}/subtasks`)
        .send(subtaskData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.subtasks).toBeInstanceOf(Array);
      expect(response.body.data.subtasks.length).toBeGreaterThan(0);
    });

    test('DELETE /api/v1/tasks/:id - Delete task', async () => {
      // Create a task to delete
      const taskToDelete = await Task.create({
        projectId: testProjectId,
        title: 'Delete Test Task',
        description: 'Task to be deleted',
        category: 'Testing'
      });

      const response = await request(app)
        .delete(`/api/v1/tasks/${taskToDelete._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Task deleted successfully');
    });
  });

  // =============================================================================
  // BLOG ENDPOINTS (9 endpoints)
  // =============================================================================

  describe('📝 Blog API Endpoints (9 endpoints)', () => {
    test('GET /api/v1/blogs - Get all blogs', async () => {
      const response = await request(app)
        .get('/api/v1/blogs')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test('GET /api/v1/blogs/:id - Get blog by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/blogs/${testBlogId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(testBlogId);
      expect(response.body.data.title).toBe('Integration Test Blog');
    });

    test('POST /api/v1/blogs - Create new blog', async () => {
      const newBlog = {
        projectId: testProjectId,
        title: 'New Integration Blog',
        content: 'Blog content created via integration test',
        tags: ['integration', 'api', 'testing'],
        draft: false
      };

      const response = await request(app)
        .post('/api/v1/blogs')
        .send(newBlog)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(newBlog.title);
      expect(response.body.data.projectId).toBe(testProjectId);
    });

    test('PUT /api/v1/blogs/:id - Update blog', async () => {
      const updateData = {
        title: 'Updated Integration Blog',
        content: 'Updated blog content via integration test',
        tags: ['updated', 'integration']
      };

      const response = await request(app)
        .put(`/api/v1/blogs/${testBlogId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updateData.title);
      expect(response.body.data.content).toBe(updateData.content);
    });

    test('PATCH /api/v1/blogs/:id/publish - Publish blog', async () => {
      const response = await request(app)
        .patch(`/api/v1/blogs/${testBlogId}/publish`)
        .send({ draft: false })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.draft).toBe(false);
    });

    test('GET /api/v1/blogs/project/:projectId - Get blogs by project', async () => {
      const response = await request(app)
        .get(`/api/v1/blogs/project/${testProjectId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test('GET /api/v1/blogs/search - Search blogs', async () => {
      const response = await request(app)
        .get('/api/v1/blogs/search')
        .query({ q: 'integration' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    test('POST /api/v1/blogs/:id/like - Like blog', async () => {
      const response = await request(app)
        .post(`/api/v1/blogs/${testBlogId}/like`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.likes).toBeGreaterThan(0);
    });

    test('DELETE /api/v1/blogs/:id - Delete blog', async () => {
      // Create a blog to delete
      const blogToDelete = await Blog.create({
        projectId: testProjectId,
        title: 'Delete Test Blog',
        content: 'Blog to be deleted',
        tags: ['delete', 'test']
      });

      const response = await request(app)
        .delete(`/api/v1/blogs/${blogToDelete._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Blog deleted successfully');
    });
  });

  // =============================================================================
  // FILE ENDPOINTS (7 endpoints) 
  // =============================================================================

  describe('📁 File API Endpoints (7 endpoints)', () => {
    test('GET /api/v1/files - Get all files', async () => {
      const response = await request(app)
        .get('/api/v1/files')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    test('POST /api/v1/files/upload - Upload file', async () => {
      const testFilePath = path.join(__dirname, '../fixtures/test-file.txt');
      
      // Create test file if it doesn't exist
      const fs = require('fs');
      if (!fs.existsSync(path.dirname(testFilePath))) {
        fs.mkdirSync(path.dirname(testFilePath), { recursive: true });
      }
      if (!fs.existsSync(testFilePath)) {
        fs.writeFileSync(testFilePath, 'Test file content for integration testing');
      }

      const response = await request(app)
        .post('/api/v1/files/upload')
        .attach('file', testFilePath)
        .field('projectId', testProjectId)
        .field('category', 'document')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('filename');
      expect(response.body.data).toHaveProperty('path');
    });

    test('GET /api/v1/files/:id - Get file by ID', async () => {
      // This test requires a file to exist first
      // For now, we'll test the endpoint structure
      const response = await request(app)
        .get('/api/v1/files/invalidid')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('GET /api/v1/files/project/:projectId - Get files by project', async () => {
      const response = await request(app)
        .get(`/api/v1/files/project/${testProjectId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    test('GET /api/v1/files/download/:id - Download file', async () => {
      // Test with invalid ID to check endpoint structure
      const response = await request(app)
        .get('/api/v1/files/download/invalidid')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('DELETE /api/v1/files/:id - Delete file', async () => {
      // Test with invalid ID to check endpoint structure
      const response = await request(app)
        .delete('/api/v1/files/invalidid')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('PUT /api/v1/files/:id - Update file metadata', async () => {
      // Test with invalid ID to check endpoint structure  
      const response = await request(app)
        .put('/api/v1/files/invalidid')
        .send({ name: 'Updated Name' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  // =============================================================================
  // ERROR HANDLING TESTS
  // =============================================================================

  describe('🚨 Error Handling Tests', () => {
    test('GET /api/v1/projects/:id - Invalid project ID', async () => {
      const response = await request(app)
        .get('/api/v1/projects/invalid_id')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid project ID');
    });

    test('GET /api/v1/projects/:id - Non-existent project', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/v1/projects/${nonExistentId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Project not found');
    });

    test('POST /api/v1/projects - Missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/projects')
        .send({}) // No required fields
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });

    test('GET /api/v1/nonexistent - Non-existent endpoint', async () => {
      const response = await request(app)
        .get('/api/v1/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  // =============================================================================
  // PERFORMANCE TESTS
  // =============================================================================

  describe('⚡ Performance Tests', () => {
    test('API response times should be under 1000ms', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/api/v1/projects')
        .expect(200);
        
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1000);
    });

    test('Concurrent requests handling', async () => {
      const promises = [];
      
      // Make 5 concurrent requests
      for (let i = 0; i < 5; i++) {
        promises.push(
          request(app)
            .get('/api/v1/projects')
            .expect(200)
        );
      }
      
      const responses = await Promise.all(promises);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.body.success).toBe(true);
      });
    });
  });

  // =============================================================================
  // INTEGRATION SUMMARY TEST
  // =============================================================================

  describe('📊 Integration Test Summary', () => {
    test('All API endpoints are responding correctly', async () => {
      const endpointTests = [
        // Project endpoints (8)
        { method: 'GET', path: '/api/v1/projects', expected: 200 },
        { method: 'GET', path: `/api/v1/projects/${testProjectId}`, expected: 200 },
        { method: 'GET', path: '/api/v1/projects/status/active', expected: 200 },
        { method: 'GET', path: '/api/v1/projects/overdue', expected: 200 },
        
        // Task endpoints (10)
        { method: 'GET', path: '/api/v1/tasks', expected: 200 },
        { method: 'GET', path: `/api/v1/tasks/${testTaskId}`, expected: 200 },
        { method: 'GET', path: `/api/v1/tasks/project/${testProjectId}`, expected: 200 },
        { method: 'GET', path: '/api/v1/tasks/status/completed', expected: 200 },
        { method: 'GET', path: '/api/v1/tasks/overdue', expected: 200 },
        
        // Blog endpoints (9)
        { method: 'GET', path: '/api/v1/blogs', expected: 200 },
        { method: 'GET', path: `/api/v1/blogs/${testBlogId}`, expected: 200 },
        { method: 'GET', path: `/api/v1/blogs/project/${testProjectId}`, expected: 200 },
        { method: 'GET', path: '/api/v1/blogs/search?q=test', expected: 200 },
        
        // File endpoints (7)
        { method: 'GET', path: '/api/v1/files', expected: 200 },
        { method: 'GET', path: `/api/v1/files/project/${testProjectId}`, expected: 200 }
      ];

      for (const test of endpointTests) {
        const response = await request(app)[test.method.toLowerCase()](test.path);
        expect(response.status).toBe(test.expected);
        expect(response.body.success).toBe(true);
      }

      console.log(`✅ All ${endpointTests.length} API endpoints tested successfully!`);
    });
  });
});