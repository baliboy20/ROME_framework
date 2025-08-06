const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Task = require('../../../database/models/task.model');
const Project = require('../../../database/models/project.model');

describe('Task Model', () => {
  let mongoServer;
  let testProject;

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
    await Task.deleteMany({});
    await Project.deleteMany({});
    
    // Create a test project
    testProject = new Project({
      name: 'Test Project',
      description: 'This is a test project description that meets the minimum length requirement.'
    });
    await testProject.save();
  });

  describe('Validation', () => {
    test('should create a valid task with required fields', async () => {
      const taskData = {
        projectId: testProject._id,
        title: 'Test Task'
      };

      const task = new Task(taskData);
      const savedTask = await task.save();

      expect(savedTask._id).toBeDefined();
      expect(savedTask.projectId.toString()).toBe(testProject._id.toString());
      expect(savedTask.title).toBe(taskData.title);
      expect(savedTask.progress).toBe(0);
      expect(savedTask.status).toBe('pending');
      expect(savedTask.priority).toBe('medium');
      expect(savedTask.createdAt).toBeDefined();
      expect(savedTask.updatedAt).toBeDefined();
    });

    test('should create task with projectTitle field', async () => {
      const taskData = {
        projectId: testProject._id,
        title: 'Test Task with Project Title',
        description: 'Test task description',
        projectTitle: 'Test Project'
      };

      const task = new Task(taskData);
      const savedTask = await task.save();

      expect(savedTask.projectTitle).toBe('Test Project');
      expect(savedTask.title).toBe(taskData.title);
    });

    test('should allow null projectTitle', async () => {
      const taskData = {
        projectId: testProject._id,
        title: 'Test Task',
        description: 'Test task description',
        projectTitle: null
      };

      const task = new Task(taskData);
      const savedTask = await task.save();

      expect(savedTask.projectTitle).toBeNull();
    });

    test('should fail validation with projectTitle too long', async () => {
      const taskData = {
        projectId: testProject._id,
        title: 'Test Task',
        description: 'Test task description',
        projectTitle: 'T'.repeat(201) // Exceeds 200 character limit
      };

      const task = new Task(taskData);
      
      await expect(task.save()).rejects.toMatchObject({
        errors: {
          projectTitle: expect.objectContaining({
            message: 'Project title cannot exceed 200 characters'
          })
        }
      });
    });

    test('should fail validation without required projectId', async () => {
      const taskData = {
        title: 'Test Task'
      };

      const task = new Task(taskData);
      
      await expect(task.save()).rejects.toMatchObject({
        errors: {
          projectId: expect.objectContaining({
            message: 'Project ID is required'
          })
        }
      });
    });

    test('should fail validation without required title', async () => {
      const taskData = {
        projectId: testProject._id
      };

      const task = new Task(taskData);
      
      await expect(task.save()).rejects.toMatchObject({
        errors: {
          title: expect.objectContaining({
            message: 'Task title is required'
          })
        }
      });
    });

    test('should fail validation if title is too short', async () => {
      const taskData = {
        projectId: testProject._id,
        title: 'T'
      };

      const task = new Task(taskData);
      
      await expect(task.save()).rejects.toMatchObject({
        errors: {
          title: expect.objectContaining({
            message: 'Task title must be at least 2 characters'
          })
        }
      });
    });

    test('should fail validation if title is too long', async () => {
      const taskData = {
        projectId: testProject._id,
        title: 'A'.repeat(201)
      };

      const task = new Task(taskData);
      
      await expect(task.save()).rejects.toMatchObject({
        errors: {
          title: expect.objectContaining({
            message: 'Task title cannot exceed 200 characters'
          })
        }
      });
    });

    test('should accept valid status values', async () => {
      const validStatuses = ['pending', 'in_progress', 'completed'];
      
      for (const status of validStatuses) {
        const taskData = {
          projectId: testProject._id,
          title: `Test Task ${status}`,
          status
        };

        const task = new Task(taskData);
        const savedTask = await task.save();
        
        expect(savedTask.status).toBe(status);
        
        // Clean up for next iteration
        await Task.deleteMany({});
      }
    });

    test('should fail validation with invalid status', async () => {
      const taskData = {
        projectId: testProject._id,
        title: 'Test Task',
        status: 'invalid-status'
      };

      const task = new Task(taskData);
      
      await expect(task.save()).rejects.toMatchObject({
        errors: {
          status: expect.objectContaining({
            message: 'Status must be pending, in_progress, or completed'
          })
        }
      });
    });

    test('should accept valid priority values', async () => {
      const validPriorities = ['low', 'medium', 'high'];
      
      for (const priority of validPriorities) {
        const taskData = {
          projectId: testProject._id,
          title: `Test Task ${priority}`,
          priority
        };

        const task = new Task(taskData);
        const savedTask = await task.save();
        
        expect(savedTask.priority).toBe(priority);
        
        // Clean up for next iteration
        await Task.deleteMany({});
      }
    });

    test('should fail validation with invalid priority', async () => {
      const taskData = {
        projectId: testProject._id,
        title: 'Test Task',
        priority: 'invalid-priority'
      };

      const task = new Task(taskData);
      
      await expect(task.save()).rejects.toMatchObject({
        errors: {
          priority: expect.objectContaining({
            message: 'Priority must be low, medium, or high'
          })
        }
      });
    });
  });

  describe('Progress Validation', () => {
    test('should accept valid progress values', async () => {
      const validProgress = [0, 25, 50, 75, 100];
      
      for (const progress of validProgress) {
        const taskData = {
          projectId: testProject._id,
          title: `Test Task ${progress}%`,
          progress
        };

        const task = new Task(taskData);
        const savedTask = await task.save();
        
        expect(savedTask.progress).toBe(progress);
        
        // Clean up for next iteration
        await Task.deleteMany({});
      }
    });

    test('should fail validation with progress below 0', async () => {
      const taskData = {
        projectId: testProject._id,
        title: 'Test Task',
        progress: -1
      };

      const task = new Task(taskData);
      
      await expect(task.save()).rejects.toMatchObject({
        errors: {
          progress: expect.objectContaining({
            message: 'Progress cannot be less than 0'
          })
        }
      });
    });

    test('should fail validation with progress above 100', async () => {
      const taskData = {
        projectId: testProject._id,
        title: 'Test Task',
        progress: 101
      };

      const task = new Task(taskData);
      
      await expect(task.save()).rejects.toMatchObject({
        errors: {
          progress: expect.objectContaining({
            message: 'Progress cannot be more than 100'
          })
        }
      });
    });

    test('should fail validation with non-integer progress', async () => {
      const taskData = {
        projectId: testProject._id,
        title: 'Test Task',
        progress: 25.5
      };

      const task = new Task(taskData);
      
      await expect(task.save()).rejects.toMatchObject({
        errors: {
          progress: expect.objectContaining({
            message: 'Progress must be an integer'
          })
        }
      });
    });
  });

  describe('Date Validation', () => {
    test('should accept valid date ranges', async () => {
      const startDate = new Date('2025-08-01');
      const targetDate = new Date('2025-08-15');

      const taskData = {
        projectId: testProject._id,
        title: 'Test Task',
        startDate,
        targetDate
      };

      const task = new Task(taskData);
      const savedTask = await task.save();

      expect(savedTask.startDate).toEqual(startDate);
      expect(savedTask.targetDate).toEqual(targetDate);
    });

    test('should fail validation if start date is in the future', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const taskData = {
        projectId: testProject._id,
        title: 'Test Task',
        startDate: futureDate
      };

      const task = new Task(taskData);
      
      await expect(task.save()).rejects.toMatchObject({
        errors: {
          startDate: expect.objectContaining({
            message: 'Start date cannot be in the future'
          })
        }
      });
    });

    test('should fail validation if target date is before start date', async () => {
      const startDate = new Date('2025-08-15');
      const targetDate = new Date('2025-08-01');

      const taskData = {
        projectId: testProject._id,
        title: 'Test Task',
        startDate,
        targetDate
      };

      const task = new Task(taskData);
      
      await expect(task.save()).rejects.toMatchObject({
        errors: {
          targetDate: expect.objectContaining({
            message: 'Target date must be after start date'
          })
        }
      });
    });
  });

  describe('Virtual Properties', () => {
    test('should calculate daysRemaining correctly', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const taskData = {
        projectId: testProject._id,
        title: 'Test Task',
        targetDate: tomorrow
      };

      const task = new Task(taskData);
      const savedTask = await task.save();

      expect(savedTask.daysRemaining).toBe(1);
    });

    test('should return null for daysRemaining when no target date', async () => {
      const taskData = {
        projectId: testProject._id,
        title: 'Test Task'
      };

      const task = new Task(taskData);
      const savedTask = await task.save();

      expect(savedTask.daysRemaining).toBeNull();
    });

    test('should calculate daysElapsed correctly', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const taskData = {
        projectId: testProject._id,
        title: 'Test Task',
        startDate: yesterday
      };

      const task = new Task(taskData);
      const savedTask = await task.save();

      expect(savedTask.daysElapsed).toBe(1);
    });

    test('should return null for daysElapsed when no start date', async () => {
      const taskData = {
        projectId: testProject._id,
        title: 'Test Task'
      };

      const task = new Task(taskData);
      const savedTask = await task.save();

      expect(savedTask.daysElapsed).toBeNull();
    });

    test('should identify overdue tasks correctly', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const taskData = {
        projectId: testProject._id,
        title: 'Overdue Task',
        targetDate: yesterday,
        status: 'in_progress'
      };

      const task = new Task(taskData);
      const savedTask = await task.save();

      expect(savedTask.isOverdue).toBe(true);
    });

    test('should not mark completed tasks as overdue', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const taskData = {
        projectId: testProject._id,
        title: 'Completed Task',
        targetDate: yesterday,
        status: 'completed'
      };

      const task = new Task(taskData);
      const savedTask = await task.save();

      expect(savedTask.isOverdue).toBe(false);
    });
  });

  describe('Instance Methods', () => {
    let testTask;

    beforeEach(async () => {
      const taskData = {
        projectId: testProject._id,
        title: 'Test Task',
        progress: 50,
        status: 'in_progress'
      };

      testTask = new Task(taskData);
      await testTask.save();
    });

    test('updateProgress should update progress and save', async () => {
      await testTask.updateProgress(75);
      
      expect(testTask.progress).toBe(75);
      expect(testTask.status).toBe('in_progress');
    });

    test('updateProgress should auto-set status to completed at 100%', async () => {
      await testTask.updateProgress(100);
      
      expect(testTask.progress).toBe(100);
      expect(testTask.status).toBe('completed');
    });

    test('updateProgress should auto-set status to pending at 0%', async () => {
      await testTask.updateProgress(0);
      
      expect(testTask.progress).toBe(0);
      expect(testTask.status).toBe('pending');
    });

    test('updateProgress should change pending to in_progress', async () => {
      // First set to pending
      await testTask.updateProgress(0);
      expect(testTask.status).toBe('pending');
      
      // Then update to in progress
      await testTask.updateProgress(25);
      expect(testTask.status).toBe('in_progress');
    });

    test('updateProgress should fail with invalid progress', async () => {
      await expect(testTask.updateProgress(-1)).rejects.toThrow('Progress must be between 0 and 100');
      await expect(testTask.updateProgress(101)).rejects.toThrow('Progress must be between 0 and 100');
    });

    test('markCompleted should set progress to 100 and status to completed', async () => {
      await testTask.markCompleted();
      
      expect(testTask.progress).toBe(100);
      expect(testTask.status).toBe('completed');
    });

    test('addAttachment should add attachment to task', async () => {
      const attachmentData = {
        fileId: new mongoose.Types.ObjectId(),
        filename: 'test-file.pdf',
        originalName: 'Test File.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        description: 'Test attachment'
      };

      await testTask.addAttachment(attachmentData);
      
      expect(testTask.attachments).toHaveLength(1);
      expect(testTask.attachments[0].filename).toBe('test-file.pdf');
      expect(testTask.attachments[0].originalName).toBe('Test File.pdf');
    });

    test('addAttachment should fail when exceeding limit', async () => {
      // Add 50 attachments (the limit)
      for (let i = 0; i < 50; i++) {
        const attachmentData = {
          fileId: new mongoose.Types.ObjectId(),
          filename: `file-${i}.txt`,
          originalName: `File ${i}.txt`,
          mimetype: 'text/plain',
          size: 100
        };
        await testTask.addAttachment(attachmentData);
      }

      // Try to add one more
      const extraAttachment = {
        fileId: new mongoose.Types.ObjectId(),
        filename: 'extra-file.txt',
        originalName: 'Extra File.txt',
        mimetype: 'text/plain',
        size: 100
      };

      await expect(testTask.addAttachment(extraAttachment))
        .rejects.toThrow('Cannot add more than 50 attachments per task');
    });

    test('removeAttachment should remove attachment by fileId', async () => {
      const fileId = new mongoose.Types.ObjectId();
      const attachmentData = {
        fileId,
        filename: 'test-file.pdf',
        originalName: 'Test File.pdf',
        mimetype: 'application/pdf',
        size: 1024
      };

      await testTask.addAttachment(attachmentData);
      expect(testTask.attachments).toHaveLength(1);

      await testTask.removeAttachment(fileId);
      expect(testTask.attachments).toHaveLength(0);
    });
  });

  describe('Static Methods', () => {
    beforeEach(async () => {
      // Create test tasks
      const tasks = [
        {
          projectId: testProject._id,
          title: 'High Priority Task',
          priority: 'high',
          status: 'pending',
          category: 'Development'
        },
        {
          projectId: testProject._id,
          title: 'Medium Priority Task',
          priority: 'medium',
          status: 'in_progress',
          category: 'Testing'
        },
        {
          projectId: testProject._id,
          title: 'Low Priority Task',
          priority: 'low',
          status: 'completed',
          category: 'Documentation'
        }
      ];

      await Task.insertMany(tasks);
    });

    test('findByProject should find all tasks for a project', async () => {
      const tasks = await Task.findByProject(testProject._id);
      
      expect(tasks).toHaveLength(3);
      tasks.forEach(task => {
        expect(task.projectId.toString()).toBe(testProject._id.toString());
      });
    });

    test('findByProject should filter by status', async () => {
      const tasks = await Task.findByProject(testProject._id, { status: 'in_progress' });
      
      expect(tasks).toHaveLength(1);
      expect(tasks[0].status).toBe('in_progress');
    });

    test('findByProject should filter by priority', async () => {
      const tasks = await Task.findByProject(testProject._id, { priority: 'high' });
      
      expect(tasks).toHaveLength(1);
      expect(tasks[0].priority).toBe('high');
    });

    test('findByProject should filter by category', async () => {
      const tasks = await Task.findByProject(testProject._id, { category: 'Development' });
      
      expect(tasks).toHaveLength(1);
      expect(tasks[0].category).toBe('Development');
    });

    test('getTaskStatistics should return correct statistics', async () => {
      const stats = await Task.getTaskStatistics(testProject._id);
      
      expect(stats).toHaveLength(1);
      expect(stats[0].totalTasks).toBe(3);
      expect(stats[0].completedTasks).toBe(1);
      expect(stats[0].inProgressTasks).toBe(1);
      expect(stats[0].pendingTasks).toBe(1);
      expect(stats[0].averageProgress).toBe(0); // All tasks have default 0 progress
    });
  });

  describe('Pre-save Middleware', () => {
    test('should auto-update status based on progress changes', async () => {
      const taskData = {
        projectId: testProject._id,
        title: 'Test Task',
        progress: 0,
        status: 'pending'
      };

      const task = new Task(taskData);
      await task.save();

      // Update progress to 50
      task.progress = 50;
      await task.save();
      expect(task.status).toBe('in_progress');

      // Update progress to 100
      task.progress = 100;
      await task.save();
      expect(task.status).toBe('completed');

      // Update progress back to 0
      task.progress = 0;
      await task.save();
      expect(task.status).toBe('pending');
    });

    test('should validate date logic in pre-save', async () => {
      const taskData = {
        projectId: testProject._id,
        title: 'Test Task',
        startDate: new Date('2025-08-15'),
        targetDate: new Date('2025-08-01') // Before start date
      };

      const task = new Task(taskData);
      
      await expect(task.save()).rejects.toThrow('Start date cannot be after target date');
    });
  });

  describe('Text Search Index', () => {
    beforeEach(async () => {
      const tasks = [
        {
          projectId: testProject._id,
          title: 'JavaScript Development Task',
          description: 'Implement React components',
          category: 'Frontend'
        },
        {
          projectId: testProject._id,
          title: 'Database Migration',
          description: 'Update MongoDB schemas',
          category: 'Backend'
        },
        {
          projectId: testProject._id,
          title: 'API Testing',
          description: 'Test REST endpoints',
          category: 'Testing'
        }
      ];

      await Task.insertMany(tasks);
    });

    test('searchTasks should find tasks by title', async () => {
      const tasks = await Task.searchTasks('JavaScript');
      
      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe('JavaScript Development Task');
    });

    test('searchTasks should find tasks by description', async () => {
      const tasks = await Task.searchTasks('React');
      
      expect(tasks).toHaveLength(1);
      expect(tasks[0].description).toBe('Implement React components');
    });

    test('searchTasks should find tasks by category', async () => {
      const tasks = await Task.searchTasks('Frontend');
      
      expect(tasks).toHaveLength(1);
      expect(tasks[0].category).toBe('Frontend');
    });

    test('searchTasks should filter by project', async () => {
      const tasks = await Task.searchTasks('Task', testProject._id);
      
      expect(tasks.length).toBeGreaterThan(0);
      tasks.forEach(task => {
        expect(task.projectId.toString()).toBe(testProject._id.toString());
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle null/undefined optional fields', async () => {
      const taskData = {
        projectId: testProject._id,
        title: 'Test Task',
        description: null,
        category: undefined,
        startDate: null,
        targetDate: undefined
      };

      const task = new Task(taskData);
      const savedTask = await task.save();

      expect(savedTask.description).toBeUndefined();
      expect(savedTask.category).toBeUndefined();
      expect(savedTask.startDate).toBeUndefined();
      expect(savedTask.targetDate).toBeUndefined();
    });

    test('should trim whitespace from string fields', async () => {
      const taskData = {
        projectId: testProject._id,
        title: '  Test Task  ',
        description: '  Task description  ',
        category: '  Development  '
      };

      const task = new Task(taskData);
      const savedTask = await task.save();

      expect(savedTask.title).toBe('Test Task');
      expect(savedTask.description).toBe('Task description');
      expect(savedTask.category).toBe('Development');
    });
  });
});