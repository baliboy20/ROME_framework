const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Project = require('../../../backend/models/Project');

describe('Backend Project Model', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Project.deleteMany({});
  });

  describe('Basic Validation', () => {
    test('should create a valid project with required fields', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'This is a test project description that meets the minimum length requirement.'
      };

      const project = new Project(projectData);
      const savedProject = await project.save();

      expect(savedProject._id).toBeDefined();
      expect(savedProject.name).toBe(projectData.name);
      expect(savedProject.description).toBe(projectData.description);
      expect(savedProject.createdAt).toBeDefined();
      expect(savedProject.updatedAt).toBeDefined();
    });

    test('should fail validation without required name', async () => {
      const projectData = {
        description: 'This is a test project description that meets the minimum length requirement.'
      };

      const project = new Project(projectData);
      
      await expect(project.save()).rejects.toMatchObject({
        errors: {
          name: expect.objectContaining({
            message: 'Project name is required'
          })
        }
      });
    });

    test('should fail validation without required description', async () => {
      const projectData = {
        name: 'Test Project'
      };

      const project = new Project(projectData);
      
      await expect(project.save()).rejects.toMatchObject({
        errors: {
          description: expect.objectContaining({
            message: 'Project description is required'
          })
        }
      });
    });

    test('should fail validation with name too short', async () => {
      const projectData = {
        name: 'T',
        description: 'This is a test project description that meets the minimum length requirement.'
      };

      const project = new Project(projectData);
      
      await expect(project.save()).rejects.toMatchObject({
        errors: {
          name: expect.objectContaining({
            message: 'Project name must be at least 2 characters'
          })
        }
      });
    });

    test('should fail validation with name too long', async () => {
      const projectData = {
        name: 'T'.repeat(201),
        description: 'This is a test project description that meets the minimum length requirement.'
      };

      const project = new Project(projectData);
      
      await expect(project.save()).rejects.toMatchObject({
        errors: {
          name: expect.objectContaining({
            message: 'Project name cannot exceed 200 characters'
          })
        }
      });
    });

    test('should fail validation with description too short', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'Short'
      };

      const project = new Project(projectData);
      
      await expect(project.save()).rejects.toMatchObject({
        errors: {
          description: expect.objectContaining({
            message: 'Project description must be at least 10 characters'
          })
        }
      });
    });

    test('should fail validation with description too long', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'D'.repeat(2001)
      };

      const project = new Project(projectData);
      
      await expect(project.save()).rejects.toMatchObject({
        errors: {
          description: expect.objectContaining({
            message: 'Project description cannot exceed 2000 characters'
          })
        }
      });
    });
  });

  describe('PROJECT-ENH-001: Enhancement Fields (localSourceFolder & githubRepo)', () => {
    describe('localSourceFolder field', () => {
      test('should allow null/undefined localSourceFolder', async () => {
        const projectData = {
          name: 'Test Project',
          description: 'This is a test project description that meets the minimum length requirement.',
          localSourceFolder: null
        };

        const project = new Project(projectData);
        const savedProject = await project.save();

        expect(savedProject.localSourceFolder).toBeNull();
      });

      test('should allow undefined localSourceFolder', async () => {
        const projectData = {
          name: 'Test Project',
          description: 'This is a test project description that meets the minimum length requirement.'
          // localSourceFolder not provided
        };

        const project = new Project(projectData);
        const savedProject = await project.save();

        expect(savedProject.localSourceFolder).toBeUndefined();
      });

      test('should allow valid local source folder path', async () => {
        const projectData = {
          name: 'Test Project',
          description: 'This is a test project description that meets the minimum length requirement.',
          localSourceFolder: '/Users/developer/projects/my-app'
        };

        const project = new Project(projectData);
        const savedProject = await project.save();

        expect(savedProject.localSourceFolder).toBe('/Users/developer/projects/my-app');
      });

      test('should allow Windows-style path', async () => {
        const projectData = {
          name: 'Test Project',
          description: 'This is a test project description that meets the minimum length requirement.',
          localSourceFolder: 'C:\\Users\\Developer\\Projects\\MyApp'
        };

        const project = new Project(projectData);
        const savedProject = await project.save();

        expect(savedProject.localSourceFolder).toBe('C:\\Users\\Developer\\Projects\\MyApp');
      });

      test('should trim localSourceFolder path', async () => {
        const projectData = {
          name: 'Test Project',
          description: 'This is a test project description that meets the minimum length requirement.',
          localSourceFolder: '  /Users/developer/projects/my-app  '
        };

        const project = new Project(projectData);
        const savedProject = await project.save();

        expect(savedProject.localSourceFolder).toBe('/Users/developer/projects/my-app');
      });

      test('should fail validation with localSourceFolder too long', async () => {
        const projectData = {
          name: 'Test Project',
          description: 'This is a test project description that meets the minimum length requirement.',
          localSourceFolder: '/'.repeat(501)
        };

        const project = new Project(projectData);
        
        await expect(project.save()).rejects.toMatchObject({
          errors: {
            localSourceFolder: expect.objectContaining({
              message: 'Local source folder path cannot exceed 500 characters'
            })
          }
        });
      });
    });

    describe('githubRepo field', () => {
      test('should allow null/undefined githubRepo', async () => {
        const projectData = {
          name: 'Test Project',
          description: 'This is a test project description that meets the minimum length requirement.',
          githubRepo: null
        };

        const project = new Project(projectData);
        const savedProject = await project.save();

        expect(savedProject.githubRepo).toBeNull();
      });

      test('should allow undefined githubRepo', async () => {
        const projectData = {
          name: 'Test Project',
          description: 'This is a test project description that meets the minimum length requirement.'
          // githubRepo not provided
        };

        const project = new Project(projectData);
        const savedProject = await project.save();

        expect(savedProject.githubRepo).toBeUndefined();
      });

      test('should allow valid GitHub HTTPS URL', async () => {
        const projectData = {
          name: 'Test Project',
          description: 'This is a test project description that meets the minimum length requirement.',
          githubRepo: 'https://github.com/user/repository'
        };

        const project = new Project(projectData);
        const savedProject = await project.save();

        expect(savedProject.githubRepo).toBe('https://github.com/user/repository');
      });

      test('should allow valid GitHub SSH URL', async () => {
        const projectData = {
          name: 'Test Project',
          description: 'This is a test project description that meets the minimum length requirement.',
          githubRepo: 'git@github.com:user/repository.git'
        };

        const project = new Project(projectData);
        const savedProject = await project.save();

        expect(savedProject.githubRepo).toBe('git@github.com:user/repository.git');
      });

      test('should allow GitHub Enterprise URL', async () => {
        const projectData = {
          name: 'Test Project',
          description: 'This is a test project description that meets the minimum length requirement.',
          githubRepo: 'https://github.enterprise.com/user/repository'
        };

        const project = new Project(projectData);
        const savedProject = await project.save();

        expect(savedProject.githubRepo).toBe('https://github.enterprise.com/user/repository');
      });

      test('should trim githubRepo URL', async () => {
        const projectData = {
          name: 'Test Project',
          description: 'This is a test project description that meets the minimum length requirement.',
          githubRepo: '  https://github.com/user/repository  '
        };

        const project = new Project(projectData);
        const savedProject = await project.save();

        expect(savedProject.githubRepo).toBe('https://github.com/user/repository');
      });

      test('should fail validation with invalid GitHub URL format', async () => {
        const projectData = {
          name: 'Test Project',
          description: 'This is a test project description that meets the minimum length requirement.',
          githubRepo: 'https://gitlab.com/user/repository'
        };

        const project = new Project(projectData);
        
        await expect(project.save()).rejects.toMatchObject({
          errors: {
            githubRepo: expect.objectContaining({
              message: 'Invalid GitHub repository URL format'
            })
          }
        });
      });

      test('should fail validation with invalid URL format', async () => {
        const projectData = {
          name: 'Test Project',
          description: 'This is a test project description that meets the minimum length requirement.',
          githubRepo: 'not-a-url'
        };

        const project = new Project(projectData);
        
        await expect(project.save()).rejects.toMatchObject({
          errors: {
            githubRepo: expect.objectContaining({
              message: 'Invalid GitHub repository URL format'
            })
          }
        });
      });

      test('should fail validation with githubRepo too long', async () => {
        const projectData = {
          name: 'Test Project',
          description: 'This is a test project description that meets the minimum length requirement.',
          githubRepo: 'https://github.com/' + 'a'.repeat(200)
        };

        const project = new Project(projectData);
        
        await expect(project.save()).rejects.toMatchObject({
          errors: {
            githubRepo: expect.objectContaining({
              message: 'GitHub repository URL cannot exceed 200 characters'
            })
          }
        });
      });
    });

    describe('Combined enhancement fields', () => {
      test('should allow both enhancement fields together', async () => {
        const projectData = {
          name: 'Test Project',
          description: 'This is a test project description that meets the minimum length requirement.',
          localSourceFolder: '/Users/developer/projects/my-app',
          githubRepo: 'https://github.com/user/repository'
        };

        const project = new Project(projectData);
        const savedProject = await project.save();

        expect(savedProject.localSourceFolder).toBe('/Users/developer/projects/my-app');
        expect(savedProject.githubRepo).toBe('https://github.com/user/repository');
      });

      test('should allow one field null and other with value', async () => {
        const projectData = {
          name: 'Test Project',
          description: 'This is a test project description that meets the minimum length requirement.',
          localSourceFolder: null,
          githubRepo: 'https://github.com/user/repository'
        };

        const project = new Project(projectData);
        const savedProject = await project.save();

        expect(savedProject.localSourceFolder).toBeNull();
        expect(savedProject.githubRepo).toBe('https://github.com/user/repository');
      });
    });
  });

  describe('Repositories', () => {
    test('should allow adding repositories', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'This is a test project description that meets the minimum length requirement.',
        repositories: [
          {
            name: 'Main Repo',
            url: 'https://github.com/user/main-repo',
            type: 'git'
          }
        ]
      };

      const project = new Project(projectData);
      const savedProject = await project.save();

      expect(savedProject.repositories).toHaveLength(1);
      expect(savedProject.repositories[0].name).toBe('Main Repo');
      expect(savedProject.repositories[0].url).toBe('https://github.com/user/main-repo');
      expect(savedProject.repositories[0].type).toBe('git');
    });

    test('should fail validation with too many repositories', async () => {
      const repositories = Array.from({ length: 11 }, (_, i) => ({
        name: `Repo ${i + 1}`,
        url: `https://github.com/user/repo-${i + 1}`,
        type: 'git'
      }));

      const projectData = {
        name: 'Test Project',
        description: 'This is a test project description that meets the minimum length requirement.',
        repositories
      };

      const project = new Project(projectData);
      
      await expect(project.save()).rejects.toMatchObject({
        errors: {
          repositories: expect.objectContaining({
            message: 'Cannot have more than 10 repositories per project'
          })
        }
      });
    });
  });

  describe('Stages', () => {
    test('should allow adding stages', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'This is a test project description that meets the minimum length requirement.',
        stages: [
          {
            name: 'Planning',
            order: 1,
            description: 'Project planning phase'
          },
          {
            name: 'Development',
            order: 2,
            description: 'Development phase'
          }
        ]
      };

      const project = new Project(projectData);
      const savedProject = await project.save();

      expect(savedProject.stages).toHaveLength(2);
      expect(savedProject.stages[0].name).toBe('Planning');
      expect(savedProject.stages[0].order).toBe(1);
      expect(savedProject.stages[1].name).toBe('Development');
      expect(savedProject.stages[1].order).toBe(2);
    });

    test('should fail validation with duplicate stage orders', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'This is a test project description that meets the minimum length requirement.',
        stages: [
          {
            name: 'Planning',
            order: 1,
            description: 'Project planning phase'
          },
          {
            name: 'Development',
            order: 1, // Duplicate order
            description: 'Development phase'
          }
        ]
      };

      const project = new Project(projectData);
      
      await expect(project.save()).rejects.toMatchObject({
        errors: {
          stages: expect.objectContaining({
            message: 'Stage orders must be unique'
          })
        }
      });
    });
  });

  describe('Instance Methods', () => {
    test('should add stage with correct order', async () => {
      const project = new Project({
        name: 'Test Project',
        description: 'This is a test project description that meets the minimum length requirement.'
      });
      
      await project.save();
      
      await project.addStage('Planning', 'Initial planning phase');
      await project.addStage('Development');
      
      expect(project.stages).toHaveLength(2);
      expect(project.stages[0].name).toBe('Planning');
      expect(project.stages[0].order).toBe(1);
      expect(project.stages[1].name).toBe('Development');
      expect(project.stages[1].order).toBe(2);
    });

    test('should remove stage and reorder remaining stages', async () => {
      const project = new Project({
        name: 'Test Project',
        description: 'This is a test project description that meets the minimum length requirement.',
        stages: [
          { name: 'Planning', order: 1 },
          { name: 'Development', order: 2 },
          { name: 'Testing', order: 3 }
        ]
      });
      
      await project.save();
      
      await project.removeStage(2); // Remove Development
      
      expect(project.stages).toHaveLength(2);
      expect(project.stages[0].name).toBe('Planning');
      expect(project.stages[0].order).toBe(1);
      expect(project.stages[1].name).toBe('Testing');
      expect(project.stages[1].order).toBe(2); // Reordered
    });

    test('should add repository', async () => {
      const project = new Project({
        name: 'Test Project',
        description: 'This is a test project description that meets the minimum length requirement.'
      });
      
      await project.save();
      
      await project.addRepository('Main Repo', 'https://github.com/user/repo');
      
      expect(project.repositories).toHaveLength(1);
      expect(project.repositories[0].name).toBe('Main Repo');
      expect(project.repositories[0].url).toBe('https://github.com/user/repo');
      expect(project.repositories[0].type).toBe('git');
    });

    test('should add core URL', async () => {
      const project = new Project({
        name: 'Test Project',
        description: 'This is a test project description that meets the minimum length requirement.'
      });
      
      await project.save();
      
      await project.addCoreUrl('Documentation', 'https://docs.example.com', 'Project documentation');
      
      expect(project.coreUrls).toHaveLength(1);
      expect(project.coreUrls[0].title).toBe('Documentation');
      expect(project.coreUrls[0].url).toBe('https://docs.example.com');
      expect(project.coreUrls[0].description).toBe('Project documentation');
    });
  });

  describe('Static Methods', () => {
    test('should find project by name', async () => {
      await Project.create({
        name: 'Test Project',
        description: 'This is a test project description that meets the minimum length requirement.'
      });

      const foundProject = await Project.findByName('test project');
      
      expect(foundProject).toBeTruthy();
      expect(foundProject.name).toBe('Test Project');
    });

    test('should find projects by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      
      await Project.create({
        name: 'Test Project',
        description: 'This is a test project description that meets the minimum length requirement.'
      });

      const projects = await Project.findByDateRange(startDate, endDate);
      
      expect(projects).toHaveLength(1);
      expect(projects[0].name).toBe('Test Project');
    });
  });

  describe('Virtuals', () => {
    test('should populate task count virtual', async () => {
      const project = await Project.create({
        name: 'Test Project',
        description: 'This is a test project description that meets the minimum length requirement.'
      });

      const populatedProject = await Project.findById(project._id).populate('taskCount');
      
      expect(populatedProject.taskCount).toBeDefined();
    });

    test('should populate blog count virtual', async () => {
      const project = await Project.create({
        name: 'Test Project',
        description: 'This is a test project description that meets the minimum length requirement.'
      });

      const populatedProject = await Project.findById(project._id).populate('blogCount');
      
      expect(populatedProject.blogCount).toBeDefined();
    });
  });

  describe('Pre-save Middleware', () => {
    test('should auto-reorder stages on save', async () => {
      const project = new Project({
        name: 'Test Project',
        description: 'This is a test project description that meets the minimum length requirement.',
        stages: [
          { name: 'Testing', order: 3 },
          { name: 'Planning', order: 1 },
          { name: 'Development', order: 2 }
        ]
      });

      const savedProject = await project.save();
      
      expect(savedProject.stages[0].name).toBe('Planning');
      expect(savedProject.stages[0].order).toBe(1);
      expect(savedProject.stages[1].name).toBe('Development');
      expect(savedProject.stages[1].order).toBe(2);
      expect(savedProject.stages[2].name).toBe('Testing');
      expect(savedProject.stages[2].order).toBe(3);
    });
  });
});