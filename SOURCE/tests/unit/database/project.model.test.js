const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Project = require('../../../database/models/project.model');

describe('Project Model', () => {
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

  describe('Validation', () => {
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

    test('should fail validation if name is too short', async () => {
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

    test('should fail validation if name is too long', async () => {
      const projectData = {
        name: 'A'.repeat(201),
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

    test('should fail validation if description is too short', async () => {
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

    test('should fail validation if description is too long', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'A'.repeat(2001)
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

  describe('Repository Validation', () => {
    test('should accept valid repository data', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'This is a test project description that meets the minimum length requirement.',
        repositories: [
          {
            name: 'main-repo',
            url: 'https://github.com/company/main-repo.git',
            type: 'git'
          },
          {
            name: 'backup-repo',
            url: 'git@github.com:company/backup-repo.git',
            type: 'git'
          }
        ]
      };

      const project = new Project(projectData);
      const savedProject = await project.save();

      expect(savedProject.repositories).toHaveLength(2);
      expect(savedProject.repositories[0].name).toBe('main-repo');
      expect(savedProject.repositories[0].type).toBe('git');
    });

    test('should fail validation with invalid repository URL', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'This is a test project description that meets the minimum length requirement.',
        repositories: [
          {
            name: 'invalid-repo',
            url: 'invalid-url',
            type: 'git'
          }
        ]
      };

      const project = new Project(projectData);
      
      await expect(project.save()).rejects.toMatchObject({
        errors: {
          'repositories.0.url': expect.objectContaining({
            message: 'Invalid repository URL format'
          })
        }
      });
    });

    test('should fail validation with too many repositories', async () => {
      const repositories = Array.from({ length: 11 }, (_, i) => ({
        name: `repo-${i}`,
        url: `https://github.com/company/repo-${i}.git`,
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

    test('should accept valid repository types', async () => {
      const validTypes = ['git', 'svn', 'mercurial', 'other'];
      
      for (const type of validTypes) {
        const projectData = {
          name: `Test Project ${type}`,
          description: 'This is a test project description that meets the minimum length requirement.',
          repositories: [
            {
              name: 'test-repo',
              url: 'https://github.com/company/test-repo.git',
              type
            }
          ]
        };

        const project = new Project(projectData);
        const savedProject = await project.save();
        
        expect(savedProject.repositories[0].type).toBe(type);
        
        // Clean up for next iteration
        await Project.deleteMany({});
      }
    });

    test('should fail validation with invalid repository type', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'This is a test project description that meets the minimum length requirement.',
        repositories: [
          {
            name: 'test-repo',
            url: 'https://github.com/company/test-repo.git',
            type: 'invalid-type'
          }
        ]
      };

      const project = new Project(projectData);
      
      await expect(project.save()).rejects.toMatchObject({
        errors: {
          'repositories.0.type': expect.objectContaining({
            message: 'Repository type must be git, svn, mercurial, or other'
          })
        }
      });
    });
  });

  describe('Core URLs Validation', () => {
    test('should accept valid core URLs', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'This is a test project description that meets the minimum length requirement.',
        coreUrls: [
          {
            title: 'Production Site',
            url: 'https://example.com',
            description: 'Main production website'
          },
          {
            title: 'Staging',
            url: 'https://staging.example.com'
          }
        ]
      };

      const project = new Project(projectData);
      const savedProject = await project.save();

      expect(savedProject.coreUrls).toHaveLength(2);
      expect(savedProject.coreUrls[0].title).toBe('Production Site');
      expect(savedProject.coreUrls[0].url).toBe('https://example.com');
    });

    test('should fail validation with invalid URL format', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'This is a test project description that meets the minimum length requirement.',
        coreUrls: [
          {
            title: 'Invalid URL',
            url: 'not-a-valid-url'
          }
        ]
      };

      const project = new Project(projectData);
      
      await expect(project.save()).rejects.toMatchObject({
        errors: {
          'coreUrls.0.url': expect.objectContaining({
            message: 'Invalid URL format'
          })
        }
      });
    });

    test('should fail validation with too many URLs', async () => {
      const coreUrls = Array.from({ length: 21 }, (_, i) => ({
        title: `URL ${i}`,
        url: `https://example${i}.com`
      }));

      const projectData = {
        name: 'Test Project',
        description: 'This is a test project description that meets the minimum length requirement.',
        coreUrls
      };

      const project = new Project(projectData);
      
      await expect(project.save()).rejects.toMatchObject({
        errors: {
          coreUrls: expect.objectContaining({
            message: 'Cannot have more than 20 URLs per project'
          })
        }
      });
    });
  });

  describe('Stages Validation', () => {
    test('should accept valid stages with sequential ordering', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'This is a test project description that meets the minimum length requirement.',
        stages: [
          { name: 'Planning', order: 1, description: 'Project planning phase' },
          { name: 'Development', order: 2, description: 'Development phase' },
          { name: 'Testing', order: 3, description: 'Testing phase' }
        ]
      };

      const project = new Project(projectData);
      const savedProject = await project.save();

      expect(savedProject.stages).toHaveLength(3);
      expect(savedProject.stages[0].order).toBe(1);
      expect(savedProject.stages[1].order).toBe(2);
      expect(savedProject.stages[2].order).toBe(3);
    });

    test('should auto-correct stage ordering on save', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'This is a test project description that meets the minimum length requirement.',
        stages: [
          { name: 'Testing', order: 5 },
          { name: 'Planning', order: 3 },
          { name: 'Development', order: 1 }
        ]
      };

      const project = new Project(projectData);
      const savedProject = await project.save();

      // Should be reordered and renumbered
      expect(savedProject.stages[0].name).toBe('Development');
      expect(savedProject.stages[0].order).toBe(1);
      expect(savedProject.stages[1].name).toBe('Planning');
      expect(savedProject.stages[1].order).toBe(2);
      expect(savedProject.stages[2].name).toBe('Testing');
      expect(savedProject.stages[2].order).toBe(3);
    });

    test('should fail validation with duplicate stage orders', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'This is a test project description that meets the minimum length requirement.',
        stages: [
          { name: 'Planning', order: 1 },
          { name: 'Development', order: 1 }
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

    test('should fail validation with too many stages', async () => {
      const stages = Array.from({ length: 51 }, (_, i) => ({
        name: `Stage ${i}`,
        order: i + 1
      }));

      const projectData = {
        name: 'Test Project',
        description: 'This is a test project description that meets the minimum length requirement.',
        stages
      };

      const project = new Project(projectData);
      
      await expect(project.save()).rejects.toMatchObject({
        errors: {
          stages: expect.objectContaining({
            message: 'Cannot have more than 50 stages per project'
          })
        }
      });
    });
  });

  describe('Instance Methods', () => {
    let testProject;

    beforeEach(async () => {
      const projectData = {
        name: 'Test Project',
        description: 'This is a test project description that meets the minimum length requirement.',
        stages: [
          { name: 'Planning', order: 1 },
          { name: 'Development', order: 2 }
        ]
      };

      testProject = new Project(projectData);
      await testProject.save();
    });

    test('addStage should add a new stage with correct order', async () => {
      await testProject.addStage('Testing', 'Testing phase');
      
      expect(testProject.stages).toHaveLength(3);
      expect(testProject.stages[2].name).toBe('Testing');
      expect(testProject.stages[2].order).toBe(3);
      expect(testProject.stages[2].description).toBe('Testing phase');
    });

    test('removeStage should remove stage and reorder remaining', async () => {
      // Add a third stage first
      await testProject.addStage('Testing');
      expect(testProject.stages).toHaveLength(3);

      // Remove the middle stage
      await testProject.removeStage(2);
      
      expect(testProject.stages).toHaveLength(2);
      expect(testProject.stages[0].name).toBe('Planning');
      expect(testProject.stages[0].order).toBe(1);
      expect(testProject.stages[1].name).toBe('Testing');
      expect(testProject.stages[1].order).toBe(2);
    });

    test('addRepository should add repository to project', async () => {
      await testProject.addRepository('new-repo', 'https://github.com/company/new-repo.git');
      
      expect(testProject.repositories).toHaveLength(1);
      expect(testProject.repositories[0].name).toBe('new-repo');
      expect(testProject.repositories[0].type).toBe('git');
    });

    test('addRepository should fail when exceeding limit', async () => {
      // Add 10 repositories (the limit)
      for (let i = 0; i < 10; i++) {
        await testProject.addRepository(`repo-${i}`, `https://github.com/company/repo-${i}.git`);
      }

      // Try to add one more
      await expect(
        testProject.addRepository('repo-11', 'https://github.com/company/repo-11.git')
      ).rejects.toThrow('Cannot add more than 10 repositories per project');
    });

    test('addCoreUrl should add URL to project', async () => {
      await testProject.addCoreUrl('Production', 'https://example.com', 'Main site');
      
      expect(testProject.coreUrls).toHaveLength(1);
      expect(testProject.coreUrls[0].title).toBe('Production');
      expect(testProject.coreUrls[0].url).toBe('https://example.com');
      expect(testProject.coreUrls[0].description).toBe('Main site');
    });

    test('addCoreUrl should fail when exceeding limit', async () => {
      // Add 20 URLs (the limit)
      for (let i = 0; i < 20; i++) {
        await testProject.addCoreUrl(`URL ${i}`, `https://example${i}.com`);
      }

      // Try to add one more
      await expect(
        testProject.addCoreUrl('URL 21', 'https://example21.com')
      ).rejects.toThrow('Cannot add more than 20 URLs per project');
    });
  });

  describe('Static Methods', () => {
    beforeEach(async () => {
      // Create test projects
      const projects = [
        {
          name: 'Alpha Project',
          description: 'This is the alpha project description that meets requirements.'
        },
        {
          name: 'Beta Project',
          description: 'This is the beta project description that meets requirements.'
        },
        {
          name: 'Gamma Project',
          description: 'This is the gamma project description that meets requirements.'
        }
      ];

      await Project.insertMany(projects);
    });

    test('findByName should find project by name (case insensitive)', async () => {
      const project = await Project.findByName('alpha project');
      
      expect(project).toBeTruthy();
      expect(project.name).toBe('Alpha Project');
    });

    test('findByName should return null for non-existent project', async () => {
      const project = await Project.findByName('Non-existent Project');
      
      expect(project).toBeNull();
    });

    test('findByDateRange should find projects within date range', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 1);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 1);

      const projects = await Project.findByDateRange(startDate, endDate);
      
      expect(projects).toHaveLength(3);
      expect(projects[0].createdAt).toBeInstanceOf(Date);
    });
  });

  describe('Indexes', () => {
    test('should have name index', async () => {
      const indexes = await Project.collection.getIndexes();
      
      expect(indexes).toHaveProperty('name_1');
    });

    test('should have createdAt index', async () => {
      const indexes = await Project.collection.getIndexes();
      
      expect(indexes).toHaveProperty('createdAt_-1');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty arrays for optional fields', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'This is a test project description that meets the minimum length requirement.',
        folders: [],
        repositories: [],
        coreUrls: [],
        stages: [],
        attachments: []
      };

      const project = new Project(projectData);
      const savedProject = await project.save();

      expect(savedProject.folders).toEqual([]);
      expect(savedProject.repositories).toEqual([]);
      expect(savedProject.coreUrls).toEqual([]);
      expect(savedProject.stages).toEqual([]);
      expect(savedProject.attachments).toEqual([]);
    });

    test('should trim whitespace from string fields', async () => {
      const projectData = {
        name: '  Test Project  ',
        description: '  This is a test project description that meets the minimum length requirement.  '
      };

      const project = new Project(projectData);
      const savedProject = await project.save();

      expect(savedProject.name).toBe('Test Project');
      expect(savedProject.description).toBe('This is a test project description that meets the minimum length requirement.');
    });
  });

  describe('Enhancement Fields - localSourceFolder and githubRepo', () => {
    describe('localSourceFolder field', () => {
      test('should accept valid local source folder path', async () => {
        const projectData = {
          name: 'Test Project',
          description: 'This is a test project description that meets the minimum length requirement.',
          localSourceFolder: '/Users/john/Projects/my-project'
        };

        const project = new Project(projectData);
        const savedProject = await project.save();

        expect(savedProject.localSourceFolder).toBe('/Users/john/Projects/my-project');
      });

      test('should accept null for localSourceFolder', async () => {
        const projectData = {
          name: 'Test Project',
          description: 'This is a test project description that meets the minimum length requirement.',
          localSourceFolder: null
        };

        const project = new Project(projectData);
        const savedProject = await project.save();

        expect(savedProject.localSourceFolder).toBeNull();
      });

      test('should accept undefined for localSourceFolder', async () => {
        const projectData = {
          name: 'Test Project',
          description: 'This is a test project description that meets the minimum length requirement.'
        };

        const project = new Project(projectData);
        const savedProject = await project.save();

        expect(savedProject.localSourceFolder).toBeUndefined();
      });

      test('should trim whitespace from localSourceFolder', async () => {
        const projectData = {
          name: 'Test Project',
          description: 'This is a test project description that meets the minimum length requirement.',
          localSourceFolder: '  /Users/john/Projects/my-project  '
        };

        const project = new Project(projectData);
        const savedProject = await project.save();

        expect(savedProject.localSourceFolder).toBe('/Users/john/Projects/my-project');
      });

      test('should reject localSourceFolder exceeding 500 characters', async () => {
        const longPath = '/Users/john/Projects/' + 'a'.repeat(500);
        const projectData = {
          name: 'Test Project',
          description: 'This is a test project description that meets the minimum length requirement.',
          localSourceFolder: longPath
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

      test('should accept Windows-style paths', async () => {
        const projectData = {
          name: 'Test Project',
          description: 'This is a test project description that meets the minimum length requirement.',
          localSourceFolder: 'C:\\Users\\John\\Projects\\my-project'
        };

        const project = new Project(projectData);
        const savedProject = await project.save();

        expect(savedProject.localSourceFolder).toBe('C:\\Users\\John\\Projects\\my-project');
      });

      test('should accept relative paths', async () => {
        const projectData = {
          name: 'Test Project',
          description: 'This is a test project description that meets the minimum length requirement.',
          localSourceFolder: './my-project'
        };

        const project = new Project(projectData);
        const savedProject = await project.save();

        expect(savedProject.localSourceFolder).toBe('./my-project');
      });
    });

    describe('githubRepo field', () => {
      test('should accept valid GitHub URL with https', async () => {
        const projectData = {
          name: 'Test Project',
          description: 'This is a test project description that meets the minimum length requirement.',
          githubRepo: 'https://github.com/user/repo'
        };

        const project = new Project(projectData);
        const savedProject = await project.save();

        expect(savedProject.githubRepo).toBe('https://github.com/user/repo');
      });

      test('should accept valid GitHub URL with git protocol', async () => {
        const projectData = {
          name: 'Test Project',
          description: 'This is a test project description that meets the minimum length requirement.',
          githubRepo: 'git@github.com:user/repo.git'
        };

        const project = new Project(projectData);
        const savedProject = await project.save();

        expect(savedProject.githubRepo).toBe('git@github.com:user/repo.git');
      });

      test('should accept null for githubRepo', async () => {
        const projectData = {
          name: 'Test Project',
          description: 'This is a test project description that meets the minimum length requirement.',
          githubRepo: null
        };

        const project = new Project(projectData);
        const savedProject = await project.save();

        expect(savedProject.githubRepo).toBeNull();
      });

      test('should accept undefined for githubRepo', async () => {
        const projectData = {
          name: 'Test Project',
          description: 'This is a test project description that meets the minimum length requirement.'
        };

        const project = new Project(projectData);
        const savedProject = await project.save();

        expect(savedProject.githubRepo).toBeUndefined();
      });

      test('should trim whitespace from githubRepo', async () => {
        const projectData = {
          name: 'Test Project',
          description: 'This is a test project description that meets the minimum length requirement.',
          githubRepo: '  https://github.com/user/repo  '
        };

        const project = new Project(projectData);
        const savedProject = await project.save();

        expect(savedProject.githubRepo).toBe('https://github.com/user/repo');
      });

      test('should reject githubRepo exceeding 200 characters', async () => {
        const longUrl = 'https://github.com/user/' + 'a'.repeat(200);
        const projectData = {
          name: 'Test Project',
          description: 'This is a test project description that meets the minimum length requirement.',
          githubRepo: longUrl
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

      test('should reject invalid GitHub URL format', async () => {
        const projectData = {
          name: 'Test Project',
          description: 'This is a test project description that meets the minimum length requirement.',
          githubRepo: 'not-a-valid-github-url'
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

      test('should reject non-GitHub URLs', async () => {
        const projectData = {
          name: 'Test Project',
          description: 'This is a test project description that meets the minimum length requirement.',
          githubRepo: 'https://gitlab.com/user/repo'
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

      test('should accept GitHub Enterprise URLs', async () => {
        const projectData = {
          name: 'Test Project',
          description: 'This is a test project description that meets the minimum length requirement.',
          githubRepo: 'https://github.company.com/user/repo'
        };

        const project = new Project(projectData);
        const savedProject = await project.save();

        expect(savedProject.githubRepo).toBe('https://github.company.com/user/repo');
      });
    });

    describe('Combined field scenarios', () => {
      test('should accept both localSourceFolder and githubRepo', async () => {
        const projectData = {
          name: 'Test Project',
          description: 'This is a test project description that meets the minimum length requirement.',
          localSourceFolder: '/Users/john/Projects/my-project',
          githubRepo: 'https://github.com/user/repo'
        };

        const project = new Project(projectData);
        const savedProject = await project.save();

        expect(savedProject.localSourceFolder).toBe('/Users/john/Projects/my-project');
        expect(savedProject.githubRepo).toBe('https://github.com/user/repo');
      });

      test('should work with existing project structure', async () => {
        const projectData = {
          name: 'Test Project',
          description: 'This is a test project description that meets the minimum length requirement.',
          localSourceFolder: '/Users/john/Projects/my-project',
          githubRepo: 'https://github.com/user/repo',
          folders: ['/path/to/folder1', '/path/to/folder2'],
          repositories: [{
            name: 'Main Repo',
            url: 'https://github.com/example/repo',
            type: 'git'
          }],
          coreUrls: [{
            title: 'Documentation',
            url: 'https://docs.example.com',
            description: 'Project documentation'
          }]
        };

        const project = new Project(projectData);
        const savedProject = await project.save();

        expect(savedProject.localSourceFolder).toBe('/Users/john/Projects/my-project');
        expect(savedProject.githubRepo).toBe('https://github.com/user/repo');
        expect(savedProject.folders).toHaveLength(2);
        expect(savedProject.repositories).toHaveLength(1);
        expect(savedProject.coreUrls).toHaveLength(1);
      });
    });
  });
});