const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Task = require('../../../backend/models/Task');
const Project = require('../../../backend/models/Project');

describe('TASK-ENH-001: Task projectTitle Field Enhancement', () => {
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
    await Task.deleteMany({});
    await Project.deleteMany({});
  });

  describe('projectTitle Field Validation', () => {
    test('should allow null/undefined projectTitle', async () => {
      const project = await Project.create({
        name: 'Test Project',
        description: 'This is a test project description that meets the minimum length requirement.'
      });

      const taskData = {
        title: 'Test Task',
        description: 'Test task description',
        projectId: project._id,
        projectTitle: null
      };

      const task = new Task(taskData);
      const savedTask = await task.save();

      expect(savedTask.projectTitle).toBeNull();
    });

    test('should allow undefined projectTitle', async () => {
      const project = await Project.create({
        name: 'Test Project',
        description: 'This is a test project description that meets the minimum length requirement.'
      });

      const taskData = {
        title: 'Test Task',
        description: 'Test task description',
        projectId: project._id
        // projectTitle not provided
      };

      const task = new Task(taskData);
      const savedTask = await task.save();

      expect(savedTask.projectTitle).toBeUndefined();
    });

    test('should allow valid project title', async () => {
      const project = await Project.create({
        name: 'Test Project',
        description: 'This is a test project description that meets the minimum length requirement.'
      });

      const taskData = {
        title: 'Test Task',
        description: 'Test task description',
        projectId: project._id,
        projectTitle: 'Test Project'
      };

      const task = new Task(taskData);
      const savedTask = await task.save();

      expect(savedTask.projectTitle).toBe('Test Project');
    });

    test('should trim projectTitle value', async () => {
      const project = await Project.create({
        name: 'Test Project',
        description: 'This is a test project description that meets the minimum length requirement.'
      });

      const taskData = {
        title: 'Test Task',
        description: 'Test task description',
        projectId: project._id,
        projectTitle: '  Test Project with Spaces  '
      };

      const task = new Task(taskData);
      const savedTask = await task.save();

      expect(savedTask.projectTitle).toBe('Test Project with Spaces');
    });

    test('should fail validation with projectTitle too long', async () => {
      const project = await Project.create({
        name: 'Test Project',
        description: 'This is a test project description that meets the minimum length requirement.'
      });

      const taskData = {
        title: 'Test Task',
        description: 'Test task description',
        projectId: project._id,
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

    test('should allow projectTitle at maximum length', async () => {
      const project = await Project.create({
        name: 'Test Project',
        description: 'This is a test project description that meets the minimum length requirement.'
      });

      const longTitle = 'T'.repeat(200); // Exactly 200 characters

      const taskData = {
        title: 'Test Task',
        description: 'Test task description',
        projectId: project._id,
        projectTitle: longTitle
      };

      const task = new Task(taskData);
      const savedTask = await task.save();

      expect(savedTask.projectTitle).toBe(longTitle);
      expect(savedTask.projectTitle.length).toBe(200);
    });
  });

  describe('projectTitle with Different Project Scenarios', () => {
    test('should handle task with projectTitle matching project name', async () => {
      const project = await Project.create({
        name: 'E-Commerce Platform',
        description: 'This is a test project description that meets the minimum length requirement.'
      });

      const taskData = {
        title: 'Implement Shopping Cart',
        description: 'Add shopping cart functionality',
        projectId: project._id,
        projectTitle: 'E-Commerce Platform'
      };

      const task = await Task.create(taskData);

      expect(task.projectTitle).toBe('E-Commerce Platform');
      expect(task.projectId.toString()).toBe(project._id.toString());
    });

    test('should handle task with projectTitle different from project name', async () => {
      const project = await Project.create({
        name: 'E-Commerce Platform',
        description: 'This is a test project description that meets the minimum length requirement.'
      });

      const taskData = {
        title: 'Implement Shopping Cart',
        description: 'Add shopping cart functionality',
        projectId: project._id,
        projectTitle: 'Online Store' // Different from project name
      };

      const task = await Task.create(taskData);

      expect(task.projectTitle).toBe('Online Store');
      expect(task.projectId.toString()).toBe(project._id.toString());
    });

    test('should handle multiple tasks with same project', async () => {
      const project = await Project.create({
        name: 'Mobile App',
        description: 'This is a test project description that meets the minimum length requirement.'
      });

      const task1Data = {
        title: 'Design Login Screen',
        description: 'Create login UI',
        projectId: project._id,
        projectTitle: 'Mobile App'
      };

      const task2Data = {
        title: 'Implement Authentication',
        description: 'Add auth logic',
        projectId: project._id,
        projectTitle: 'Mobile App'
      };

      const task1 = await Task.create(task1Data);
      const task2 = await Task.create(task2Data);

      expect(task1.projectTitle).toBe('Mobile App');
      expect(task2.projectTitle).toBe('Mobile App');
      expect(task1.projectId.toString()).toBe(task2.projectId.toString());
    });
  });

  describe('projectTitle Indexing and Performance', () => {
    test('should create projectTitle index', async () => {
      const project = await Project.create({
        name: 'Test Project',
        description: 'This is a test project description that meets the minimum length requirement.'
      });

      // Create multiple tasks with different project titles
      await Task.create({
        title: 'Task 1',
        description: 'First task',
        projectId: project._id,
        projectTitle: 'Alpha Project'
      });

      await Task.create({
        title: 'Task 2',
        description: 'Second task',
        projectId: project._id,
        projectTitle: 'Beta Project'
      });

      await Task.create({
        title: 'Task 3',
        description: 'Third task',
        projectId: project._id,
        projectTitle: 'Alpha Project'
      });

      // Query by projectTitle should work efficiently
      const alphaTasks = await Task.find({ projectTitle: 'Alpha Project' });
      const betaTasks = await Task.find({ projectTitle: 'Beta Project' });

      expect(alphaTasks).toHaveLength(2);
      expect(betaTasks).toHaveLength(1);
      expect(alphaTasks[0].projectTitle).toBe('Alpha Project');
      expect(betaTasks[0].projectTitle).toBe('Beta Project');
    });

    test('should support compound queries with projectId and projectTitle', async () => {
      const project1 = await Project.create({
        name: 'Project 1',
        description: 'This is a test project description that meets the minimum length requirement.'
      });

      const project2 = await Project.create({
        name: 'Project 2',
        description: 'This is a test project description that meets the minimum length requirement.'
      });

      await Task.create({
        title: 'Task 1A',
        description: 'Task for project 1',
        projectId: project1._id,
        projectTitle: 'Alpha Project'
      });

      await Task.create({
        title: 'Task 1B',
        description: 'Another task for project 1',
        projectId: project1._id,
        projectTitle: 'Alpha Project'
      });

      await Task.create({
        title: 'Task 2A',
        description: 'Task for project 2',
        projectId: project2._id,
        projectTitle: 'Alpha Project'
      });

      // Compound query: specific project with specific title
      const project1Tasks = await Task.find({ 
        projectId: project1._id, 
        projectTitle: 'Alpha Project' 
      });

      const project2Tasks = await Task.find({ 
        projectId: project2._id, 
        projectTitle: 'Alpha Project' 
      });

      expect(project1Tasks).toHaveLength(2);
      expect(project2Tasks).toHaveLength(1);
      expect(project1Tasks[0].projectId.toString()).toBe(project1._id.toString());
      expect(project2Tasks[0].projectId.toString()).toBe(project2._id.toString());
    });
  });

  describe('projectTitle Edge Cases', () => {
    test('should handle empty string projectTitle', async () => {
      const project = await Project.create({
        name: 'Test Project',
        description: 'This is a test project description that meets the minimum length requirement.'
      });

      const taskData = {
        title: 'Test Task',
        description: 'Test task description',
        projectId: project._id,
        projectTitle: ''
      };

      const task = new Task(taskData);
      const savedTask = await task.save();

      expect(savedTask.projectTitle).toBe('');
    });

    test('should handle projectTitle with special characters', async () => {
      const project = await Project.create({
        name: 'Test Project',
        description: 'This is a test project description that meets the minimum length requirement.'
      });

      const specialTitle = 'Project #1 - Phase 2 (2024) & More!';

      const taskData = {
        title: 'Test Task',
        description: 'Test task description',
        projectId: project._id,
        projectTitle: specialTitle
      };

      const task = new Task(taskData);
      const savedTask = await task.save();

      expect(savedTask.projectTitle).toBe(specialTitle);
    });

    test('should handle projectTitle with unicode characters', async () => {
      const project = await Project.create({
        name: 'Test Project',
        description: 'This is a test project description that meets the minimum length requirement.'
      });

      const unicodeTitle = 'Проект 测试项目 プロジェクト 🚀';

      const taskData = {
        title: 'Test Task',
        description: 'Test task description',
        projectId: project._id,
        projectTitle: unicodeTitle
      };

      const task = new Task(taskData);
      const savedTask = await task.save();

      expect(savedTask.projectTitle).toBe(unicodeTitle);
    });

    test('should handle task without projectId but with projectTitle', async () => {
      const taskData = {
        title: 'Orphaned Task',
        description: 'Task without project association',
        projectTitle: 'Unknown Project'
      };

      const task = new Task(taskData);
      const savedTask = await task.save();

      expect(savedTask.projectTitle).toBe('Unknown Project');
      expect(savedTask.projectId).toBeUndefined();
    });
  });

  describe('projectTitle Integration with Existing Task Features', () => {
    test('should work with task status updates', async () => {
      const project = await Project.create({
        name: 'Test Project',
        description: 'This is a test project description that meets the minimum length requirement.'
      });

      const task = await Task.create({
        title: 'Test Task',
        description: 'Test task description',
        projectId: project._id,
        projectTitle: 'Test Project',
        status: 'todo'
      });

      // Update status
      task.status = 'completed';
      await task.save();

      expect(task.projectTitle).toBe('Test Project'); // Should remain unchanged
      expect(task.status).toBe('completed');
      expect(task.completedDate).toBeDefined();
    });

    test('should work with subtasks', async () => {
      const project = await Project.create({
        name: 'Test Project',
        description: 'This is a test project description that meets the minimum length requirement.'
      });

      const task = await Task.create({
        title: 'Main Task',
        description: 'Task with subtasks',
        projectId: project._id,
        projectTitle: 'Test Project'
      });

      await task.addSubtask('Subtask 1');
      await task.addSubtask('Subtask 2');

      const savedTask = await Task.findById(task._id);
      
      expect(savedTask.projectTitle).toBe('Test Project');
      expect(savedTask.subtasks).toHaveLength(2);
      expect(savedTask.subtasks[0].title).toBe('Subtask 1');
    });

    test('should work with task comments', async () => {
      const project = await Project.create({
        name: 'Test Project',
        description: 'This is a test project description that meets the minimum length requirement.'
      });

      const task = await Task.create({
        title: 'Task with Comments',
        description: 'Task that will have comments',
        projectId: project._id,
        projectTitle: 'Test Project'
      });

      await task.addComment('First comment', 'user1');
      await task.addComment('Second comment', 'user2');

      const savedTask = await Task.findById(task._id);
      
      expect(savedTask.projectTitle).toBe('Test Project');
      expect(savedTask.comments).toHaveLength(2);
      expect(savedTask.comments[0].content).toBe('First comment');
    });

    test('should work with tag operations', async () => {
      const project = await Project.create({
        name: 'Test Project',
        description: 'This is a test project description that meets the minimum length requirement.'
      });

      const task = await Task.create({
        title: 'Task with Tags',
        description: 'Task that will have tags',
        projectId: project._id,
        projectTitle: 'Test Project'
      });

      await task.addTag('urgent');
      await task.addTag('frontend');

      const savedTask = await Task.findById(task._id);
      
      expect(savedTask.projectTitle).toBe('Test Project');
      expect(savedTask.tags).toContain('urgent');
      expect(savedTask.tags).toContain('frontend');
    });
  });

  describe('Static Methods with projectTitle', () => {
    test('should find tasks by project with projectTitle populated', async () => {
      const project = await Project.create({
        name: 'Test Project',
        description: 'This is a test project description that meets the minimum length requirement.'
      });

      await Task.create({
        title: 'Task 1',
        description: 'First task',
        projectId: project._id,
        projectTitle: 'Test Project'
      });

      await Task.create({
        title: 'Task 2',
        description: 'Second task',
        projectId: project._id,
        projectTitle: 'Test Project'
      });

      const tasks = await Task.findByProject(project._id);
      
      expect(tasks).toHaveLength(2);
      tasks.forEach(task => {
        expect(task.projectTitle).toBe('Test Project');
        expect(task.projectId.toString()).toBe(project._id.toString());
      });
    });
  });
});