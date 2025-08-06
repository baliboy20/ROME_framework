const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../../backend/server');
const Project = require('../../../backend/models/Project');

describe('Project Controller - Enhancement Fields (PROJECT-ENH-002)', () => {
  let server;

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
    // Clear projects collection before each test
    await Project.deleteMany({});
  });

  describe('POST /api/v1/projects - Enhanced Fields', () => {
    it('should create project with localSourceFolder and githubRepo fields', async () => {
      const projectData = {
        name: 'Enhanced Project',
        description: 'Project with new enhancement fields',
        localSourceFolder: '/Users/dev/projects/enhanced-project',
        githubRepo: 'https://github.com/user/enhanced-project'
      };

      const response = await request(app)
        .post('/api/v1/projects')
        .send(projectData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Enhanced Project');
      expect(response.body.data.localSourceFolder).toBe('/Users/dev/projects/enhanced-project');
      expect(response.body.data.githubRepo).toBe('https://github.com/user/enhanced-project');

      // Verify in database
      const savedProject = await Project.findById(response.body.data._id);
      expect(savedProject.localSourceFolder).toBe('/Users/dev/projects/enhanced-project');
      expect(savedProject.githubRepo).toBe('https://github.com/user/enhanced-project');
    });

    it('should create project without optional enhancement fields', async () => {
      const projectData = {
        name: 'Basic Project',
        description: 'Project without enhancement fields'
      };

      const response = await request(app)
        .post('/api/v1/projects')
        .send(projectData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Basic Project');
      expect(response.body.data.localSourceFolder).toBeUndefined();
      expect(response.body.data.githubRepo).toBeUndefined();
    });

    it('should validate localSourceFolder path format', async () => {
      const invalidPaths = [
        'invalid-path',
        'not/absolute/path',
        'c:invalid-windows-path',
        ''
      ];

      for (const invalidPath of invalidPaths) {
        const projectData = {
          name: 'Path Test Project',
          description: 'Testing path validation',
          localSourceFolder: invalidPath
        };

        const response = await request(app)
          .post('/api/v1/projects')
          .send(projectData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.message).toContain('Invalid local source folder path format');
      }
    });

    it('should accept valid localSourceFolder path formats', async () => {
      const validPaths = [
        '/Users/dev/projects/my-project',      // Unix absolute
        '~/projects/my-project',               // Unix home
        './projects/my-project',               // Unix relative
        '../projects/my-project',              // Unix relative up
        'C:\\Users\\dev\\projects\\my-project' // Windows absolute
      ];

      for (const validPath of validPaths) {
        await Project.deleteMany({}); // Clean up for each test

        const projectData = {
          name: `Path Test Project ${validPath}`,
          description: 'Testing valid path format',
          localSourceFolder: validPath
        };

        const response = await request(app)
          .post('/api/v1/projects')
          .send(projectData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.localSourceFolder).toBe(validPath);
      }
    });

    it('should validate GitHub repository URL format', async () => {
      const invalidUrls = [
        'not-a-url',
        'https://gitlab.com/user/repo',
        'http://github.com/user/repo',
        'github.com/user/repo',
        'https://github.com/user',
        'https://github.com/',
        ''
      ];

      for (const invalidUrl of invalidUrls) {
        const projectData = {
          name: 'GitHub URL Test Project',
          description: 'Testing GitHub URL validation',
          githubRepo: invalidUrl
        };

        const response = await request(app)
          .post('/api/v1/projects')
          .send(projectData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.message).toContain('Invalid GitHub repository URL format');
      }
    });

    it('should accept valid GitHub repository URL formats', async () => {
      const validUrls = [
        'https://github.com/user/repo',
        'https://github.com/organization/project-name',
        'https://github.com/user/repo.git',
        'git@github.com:user/repo.git'
      ];

      for (const validUrl of validUrls) {
        await Project.deleteMany({}); // Clean up for each test

        const projectData = {
          name: `GitHub URL Test Project ${validUrl}`,
          description: 'Testing valid GitHub URL format',
          githubRepo: validUrl
        };

        const response = await request(app)
          .post('/api/v1/projects')
          .send(projectData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.githubRepo).toBe(validUrl);
      }
    });

    it('should validate field length constraints', async () => {
      // Test localSourceFolder max length (500 chars)
      const longPath = '/Users/dev/projects/' + 'a'.repeat(500);
      const tooLongPath = '/Users/dev/projects/' + 'a'.repeat(501);

      const validLengthData = {
        name: 'Length Test Project',
        description: 'Testing field length constraints',
        localSourceFolder: longPath
      };

      await request(app)
        .post('/api/v1/projects')
        .send(validLengthData)
        .expect(201);

      const invalidLengthData = {
        name: 'Length Test Project 2',
        description: 'Testing field length constraints',
        localSourceFolder: tooLongPath
      };

      const response = await request(app)
        .post('/api/v1/projects')
        .send(invalidLengthData)
        .expect(400);

      expect(response.body.error.message).toContain('Local source folder path cannot exceed 500 characters');

      // Test githubRepo max length (200 chars)
      const longGithubUrl = 'https://github.com/user/' + 'a'.repeat(200);
      const tooLongGithubUrl = 'https://github.com/user/' + 'a'.repeat(201);

      await Project.deleteMany({});

      const validUrlLengthData = {
        name: 'GitHub Length Test',
        description: 'Testing GitHub URL length',
        githubRepo: longGithubUrl
      };

      await request(app)
        .post('/api/v1/projects')
        .send(validUrlLengthData)
        .expect(201);

      const invalidUrlLengthData = {
        name: 'GitHub Length Test 2',
        description: 'Testing GitHub URL length',
        githubRepo: tooLongGithubUrl
      };

      const urlResponse = await request(app)
        .post('/api/v1/projects')
        .send(invalidUrlLengthData)
        .expect(400);

      expect(urlResponse.body.error.message).toContain('GitHub repository URL cannot exceed 200 characters');
    });
  });

  describe('PUT /api/v1/projects/:id - Enhanced Fields', () => {
    let projectId;

    beforeEach(async () => {
      const project = await Project.create({
        name: 'Test Project',
        description: 'Project for update testing'
      });
      projectId = project._id;
    });

    it('should update project with new enhancement fields', async () => {
      const updateData = {
        localSourceFolder: '/Users/dev/updated-project',
        githubRepo: 'https://github.com/user/updated-project'
      };

      const response = await request(app)
        .put(`/api/v1/projects/${projectId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.localSourceFolder).toBe('/Users/dev/updated-project');
      expect(response.body.data.githubRepo).toBe('https://github.com/user/updated-project');

      // Verify in database
      const updatedProject = await Project.findById(projectId);
      expect(updatedProject.localSourceFolder).toBe('/Users/dev/updated-project');
      expect(updatedProject.githubRepo).toBe('https://github.com/user/updated-project');
    });

    it('should validate enhancement fields during update', async () => {
      const invalidUpdateData = {
        localSourceFolder: 'invalid-path-format',
        githubRepo: 'not-a-github-url'
      };

      const response = await request(app)
        .put(`/api/v1/projects/${projectId}`)
        .send(invalidUpdateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid local source folder path format');
      expect(response.body.error.message).toContain('Invalid GitHub repository URL format');
    });

    it('should allow clearing enhancement fields by setting to null', async () => {
      // First set the fields
      await Project.findByIdAndUpdate(projectId, {
        localSourceFolder: '/Users/dev/test-project',
        githubRepo: 'https://github.com/user/test-project'
      });

      // Then clear them
      const clearData = {
        localSourceFolder: null,
        githubRepo: null
      };

      const response = await request(app)
        .put(`/api/v1/projects/${projectId}`)
        .send(clearData)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify they are cleared in database
      const updatedProject = await Project.findById(projectId);
      expect(updatedProject.localSourceFolder).toBeNull();
      expect(updatedProject.githubRepo).toBeNull();
    });
  });

  describe('GET /api/v1/projects - Enhanced Fields', () => {
    beforeEach(async () => {
      // Create test projects with and without enhancement fields
      await Project.create([
        {
          name: 'Project with Enhancement Fields',
          description: 'Has localSourceFolder and githubRepo',
          localSourceFolder: '/Users/dev/enhanced-project',
          githubRepo: 'https://github.com/user/enhanced-project'
        },
        {
          name: 'Basic Project',
          description: 'No enhancement fields'
        },
        {
          name: 'Partial Enhancement Project',
          description: 'Only has localSourceFolder',
          localSourceFolder: '/Users/dev/partial-project'
        }
      ]);
    });

    it('should return projects with enhancement fields in listing', async () => {
      const response = await request(app)
        .get('/api/v1/projects')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);

      const enhancedProject = response.body.data.find(p => p.name === 'Project with Enhancement Fields');
      expect(enhancedProject.localSourceFolder).toBe('/Users/dev/enhanced-project');
      expect(enhancedProject.githubRepo).toBe('https://github.com/user/enhanced-project');

      const basicProject = response.body.data.find(p => p.name === 'Basic Project');
      expect(basicProject.localSourceFolder).toBeUndefined();
      expect(basicProject.githubRepo).toBeUndefined();

      const partialProject = response.body.data.find(p => p.name === 'Partial Enhancement Project');
      expect(partialProject.localSourceFolder).toBe('/Users/dev/partial-project');
      expect(partialProject.githubRepo).toBeUndefined();
    });
  });

  describe('Database Model Integration', () => {
    it('should save and retrieve enhancement fields correctly through Mongoose', async () => {
      const projectData = {
        name: 'Direct Model Test',
        description: 'Testing direct model operations',
        localSourceFolder: '/Users/dev/model-test',
        githubRepo: 'https://github.com/user/model-test'
      };

      // Create through Mongoose model directly
      const project = await Project.create(projectData);
      expect(project.localSourceFolder).toBe('/Users/dev/model-test');
      expect(project.githubRepo).toBe('https://github.com/user/model-test');

      // Retrieve through Mongoose model
      const retrievedProject = await Project.findById(project._id);
      expect(retrievedProject.localSourceFolder).toBe('/Users/dev/model-test');
      expect(retrievedProject.githubRepo).toBe('https://github.com/user/model-test');
    });

    it('should handle GitHub URL validation at model level', async () => {
      const invalidProjectData = {
        name: 'Model Validation Test',
        description: 'Testing model-level validation',
        githubRepo: 'invalid-github-url'
      };

      await expect(Project.create(invalidProjectData)).rejects.toThrow('Invalid GitHub repository URL format');
    });

    it('should enforce field length constraints at model level', async () => {
      const longPathData = {
        name: 'Long Path Test',
        description: 'Testing path length validation',
        localSourceFolder: 'a'.repeat(501) // Exceeds 500 char limit
      };

      await expect(Project.create(longPathData)).rejects.toThrow('Local source folder path cannot exceed 500 characters');
    });
  });
});