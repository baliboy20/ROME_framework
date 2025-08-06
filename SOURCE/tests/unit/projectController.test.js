const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../backend/server');
const Project = require('../../backend/models/Project');

// Mock the database connection for testing
jest.mock('../../backend/config/database', () => ({
  connect: jest.fn().mockResolvedValue(true),
  getConnectionStatus: jest.fn().mockReturnValue('connected'),
  isDbConnected: jest.fn().mockReturnValue(true)
}));

describe('Project Controller', () => {
  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/project_management_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
  });

  beforeEach(async () => {
    // Clear the database before each test
    await Project.deleteMany({});
  });

  afterAll(async () => {
    // Close database connection
    await mongoose.connection.close();
  });

  describe('POST /api/v1/projects', () => {
    it('should create a new project with valid data', async () => {
      const projectData = {
        title: 'Test Project',
        description: 'A test project',
        status: 'active',
        priority: 'high'
      };

      const response = await request(app)
        .post('/api/v1/projects')
        .send(projectData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(projectData.title);
      expect(response.body.data.description).toBe(projectData.description);
      expect(response.body.data.status).toBe(projectData.status);
      expect(response.body.data.priority).toBe(projectData.priority);
      expect(response.body.message).toBe('Project created successfully');
    });

    it('should fail to create project without title', async () => {
      const projectData = {
        description: 'A test project without title'
      };

      const response = await request(app)
        .post('/api/v1/projects')
        .send(projectData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Title is required');
    });

    it('should fail to create project with title too short', async () => {
      const projectData = {
        title: 'AB', // Too short
        description: 'A test project'
      };

      const response = await request(app)
        .post('/api/v1/projects')
        .send(projectData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Title must be between 3 and 100 characters');
    });

    it('should fail to create project with invalid status', async () => {
      const projectData = {
        title: 'Test Project',
        status: 'invalid_status'
      };

      const response = await request(app)
        .post('/api/v1/projects')
        .send(projectData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should create project with default values', async () => {
      const projectData = {
        title: 'Minimal Project'
      };

      const response = await request(app)
        .post('/api/v1/projects')
        .send(projectData)
        .expect(201);

      expect(response.body.data.status).toBe('draft');
      expect(response.body.data.priority).toBe('medium');
      expect(response.body.data.progress).toBe(0);
    });
  });

  describe('GET /api/v1/projects', () => {
    beforeEach(async () => {
      // Create test projects
      await Project.create([
        {
          title: 'Project 1',
          description: 'First project',
          status: 'active',
          priority: 'high'
        },
        {
          title: 'Project 2',
          description: 'Second project',
          status: 'completed',
          priority: 'medium'
        },
        {
          title: 'Project 3',
          description: 'Third project',
          status: 'draft',
          priority: 'low'
        }
      ]);
    });

    it('should get all projects', async () => {
      const response = await request(app)
        .get('/api/v1/projects')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.total).toBe(3);
    });

    it('should filter projects by status', async () => {
      const response = await request(app)
        .get('/api/v1/projects?status=active')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe('active');
    });

    it('should filter projects by priority', async () => {
      const response = await request(app)
        .get('/api/v1/projects?priority=high')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].priority).toBe('high');
    });

    it('should search projects by title', async () => {
      const response = await request(app)
        .get('/api/v1/projects?search=Project 1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toContain('Project 1');
    });

    it('should paginate projects', async () => {
      const response = await request(app)
        .get('/api/v1/projects?page=1&limit=2')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
      expect(response.body.pagination.pages).toBe(2);
    });

    it('should sort projects', async () => {
      const response = await request(app)
        .get('/api/v1/projects?sortBy=title&sortOrder=asc')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data[0].title).toBe('Project 1');
      expect(response.body.data[1].title).toBe('Project 2');
      expect(response.body.data[2].title).toBe('Project 3');
    });
  });

  describe('GET /api/v1/projects/:id', () => {
    let projectId;

    beforeEach(async () => {
      const project = await Project.create({
        title: 'Test Project',
        description: 'A test project'
      });
      projectId = project._id.toString();
    });

    it('should get project by valid ID', async () => {
      const response = await request(app)
        .get(`/api/v1/projects/${projectId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(projectId);
      expect(response.body.data.title).toBe('Test Project');
    });

    it('should return 404 for non-existent project', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/v1/projects/${nonExistentId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Project not found');
    });

    it('should return 400 for invalid project ID', async () => {
      const response = await request(app)
        .get('/api/v1/projects/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Invalid project ID');
    });
  });

  describe('PUT /api/v1/projects/:id', () => {
    let projectId;

    beforeEach(async () => {
      const project = await Project.create({
        title: 'Original Project',
        description: 'Original description',
        status: 'draft'
      });
      projectId = project._id.toString();
    });

    it('should update project with valid data', async () => {
      const updateData = {
        title: 'Updated Project',
        description: 'Updated description',
        status: 'active'
      };

      const response = await request(app)
        .put(`/api/v1/projects/${projectId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updateData.title);
      expect(response.body.data.description).toBe(updateData.description);
      expect(response.body.data.status).toBe(updateData.status);
      expect(response.body.message).toBe('Project updated successfully');
    });

    it('should return 404 for non-existent project', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/v1/projects/${nonExistentId}`)
        .send({ title: 'Updated Title' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Project not found');
    });

    it('should fail validation with invalid data', async () => {
      const response = await request(app)
        .put(`/api/v1/projects/${projectId}`)
        .send({ title: 'AB' }) // Too short
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/projects/:id', () => {
    let projectId;

    beforeEach(async () => {
      const project = await Project.create({
        title: 'Project to Delete',
        description: 'This project will be deleted'
      });
      projectId = project._id.toString();
    });

    it('should delete project successfully', async () => {
      const response = await request(app)
        .delete(`/api/v1/projects/${projectId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Project deleted successfully');
      expect(response.body.data.id).toBe(projectId);

      // Verify project is deleted
      const deletedProject = await Project.findById(projectId);
      expect(deletedProject).toBeNull();
    });

    it('should return 404 for non-existent project', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/v1/projects/${nonExistentId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Project not found');
    });
  });

  describe('GET /api/v1/projects/status/:status', () => {
    beforeEach(async () => {
      await Project.create([
        { title: 'Active Project 1', status: 'active' },
        { title: 'Active Project 2', status: 'active' },
        { title: 'Draft Project', status: 'draft' }
      ]);
    });

    it('should get projects by status', async () => {
      const response = await request(app)
        .get('/api/v1/projects/status/active')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.status).toBe('active');
    });

    it('should return 400 for invalid status', async () => {
      const response = await request(app)
        .get('/api/v1/projects/status/invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid status');
    });
  });

  describe('GET /api/v1/projects/overdue', () => {
    beforeEach(async () => {
      const pastDate = new Date(Date.now() - 86400000); // 1 day ago
      const futureDate = new Date(Date.now() + 86400000); // 1 day from now

      await Project.create([
        {
          title: 'Overdue Project',
          endDate: pastDate,
          status: 'active'
        },
        {
          title: 'On Time Project',
          endDate: futureDate,
          status: 'active'
        },
        {
          title: 'Completed Project',
          endDate: pastDate,
          status: 'completed'
        }
      ]);
    });

    it('should get overdue projects', async () => {
      const response = await request(app)
        .get('/api/v1/projects/overdue')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Overdue Project');
    });
  });

  describe('PATCH /api/v1/projects/:id/progress', () => {
    let projectId;

    beforeEach(async () => {
      const project = await Project.create({
        title: 'Progress Test Project',
        progress: 50
      });
      projectId = project._id.toString();
    });

    it('should update project progress', async () => {
      const response = await request(app)
        .patch(`/api/v1/projects/${projectId}/progress`)
        .send({ progress: 75 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.progress).toBe(75);
    });

    it('should auto-complete project at 100% progress', async () => {
      const response = await request(app)
        .patch(`/api/v1/projects/${projectId}/progress`)
        .send({ progress: 100 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.progress).toBe(100);
      expect(response.body.data.status).toBe('completed');
    });

    it('should fail with invalid progress value', async () => {
      const response = await request(app)
        .patch(`/api/v1/projects/${projectId}/progress`)
        .send({ progress: 150 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Progress must be a number between 0 and 100');
    });
  });
});