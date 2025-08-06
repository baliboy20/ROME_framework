const mongoose = require('mongoose');
const Project = require('../../backend/models/Project');
const Task = require('../../backend/models/Task');
const Blog = require('../../backend/models/Blog');

describe('Mongoose Models', () => {
  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/project_management_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
  });

  beforeEach(async () => {
    // Clear all collections before each test
    await Project.deleteMany({});
    await Task.deleteMany({});
    await Blog.deleteMany({});
  });

  afterAll(async () => {
    // Close database connection
    await mongoose.connection.close();
  });

  describe('Project Model', () => {
    describe('Validation', () => {
      it('should create a valid project', async () => {
        const projectData = {
          title: 'Test Project',
          description: 'A test project',
          status: 'active',
          priority: 'high',
          startDate: new Date(),
          endDate: new Date(Date.now() + 86400000), // Tomorrow
          progress: 50
        };

        const project = new Project(projectData);
        const savedProject = await project.save();

        expect(savedProject._id).toBeDefined();
        expect(savedProject.title).toBe(projectData.title);
        expect(savedProject.status).toBe(projectData.status);
        expect(savedProject.progress).toBe(projectData.progress);
        expect(savedProject.createdAt).toBeDefined();
        expect(savedProject.updatedAt).toBeDefined();
      });

      it('should require title', async () => {
        const project = new Project({
          description: 'Project without title'
        });

        await expect(project.save()).rejects.toThrow('Project title is required');
      });

      it('should enforce title length constraints', async () => {
        const shortTitle = new Project({
          title: 'AB' // Too short
        });
        await expect(shortTitle.save()).rejects.toThrow('Title must be at least 3 characters long');

        const longTitle = new Project({
          title: 'A'.repeat(101) // Too long
        });
        await expect(longTitle.save()).rejects.toThrow('Title cannot exceed 100 characters');
      });

      it('should enforce valid status values', async () => {
        const project = new Project({
          title: 'Test Project',
          status: 'invalid_status'
        });

        await expect(project.save()).rejects.toThrow();
      });

      it('should set default values', async () => {
        const project = new Project({
          title: 'Minimal Project'
        });

        const savedProject = await project.save();
        expect(savedProject.status).toBe('draft');
        expect(savedProject.priority).toBe('medium');
        expect(savedProject.progress).toBe(0);
        expect(savedProject.createdBy).toBe('system');
      });

      it('should validate date logic in pre-save hook', async () => {
        const tomorrow = new Date(Date.now() + 86400000);
        const yesterday = new Date(Date.now() - 86400000);

        const project = new Project({
          title: 'Invalid Date Project',
          startDate: tomorrow,
          endDate: yesterday // End before start
        });

        await expect(project.save()).rejects.toThrow('Start date cannot be after end date');
      });

      it('should auto-complete project at 100% progress', async () => {
        const project = new Project({
          title: 'Test Project',
          status: 'active',
          progress: 100
        });

        const savedProject = await project.save();
        expect(savedProject.status).toBe('completed'); // Should be auto-set
      });
    });

    describe('Virtual Properties', () => {
      it('should calculate duration virtual property', async () => {
        const startDate = new Date();
        const endDate = new Date(Date.now() + 7 * 86400000); // 7 days later

        const project = new Project({
          title: 'Duration Test',
          startDate,
          endDate
        });

        await project.save();
        expect(project.duration).toBe(7);
      });

      it('should return null duration when dates are missing', async () => {
        const project = new Project({
          title: 'No Dates Project'
        });

        await project.save();
        expect(project.duration).toBeNull();
      });

      it('should provide status summary virtual', async () => {
        const pastDate = new Date(Date.now() - 86400000); // Yesterday
        const project = new Project({
          title: 'Overdue Project',
          status: 'active',
          priority: 'high',
          progress: 75,
          endDate: pastDate
        });

        await project.save();
        const summary = project.statusSummary;
        expect(summary.status).toBe('active');
        expect(summary.priority).toBe('high');
        expect(summary.progress).toBe(75);
        expect(summary.isOverdue).toBe(true);
      });
    });

    describe('Static Methods', () => {
      beforeEach(async () => {
        await Project.create([
          { title: 'Active Project 1', status: 'active', priority: 'high' },
          { title: 'Active Project 2', status: 'active', priority: 'medium' },
          { title: 'Draft Project', status: 'draft', priority: 'high' },
          { 
            title: 'Overdue Project', 
            status: 'active', 
            endDate: new Date(Date.now() - 86400000) 
          }
        ]);
      });

      it('should find projects by status', async () => {
        const activeProjects = await Project.findByStatus('active');
        expect(activeProjects).toHaveLength(3); // 2 active + 1 overdue (still active)
      });

      it('should find projects by priority', async () => {
        const highPriorityProjects = await Project.findByPriority('high');
        expect(highPriorityProjects).toHaveLength(2);
      });

      it('should find overdue projects', async () => {
        const overdueProjects = await Project.findOverdue();
        expect(overdueProjects).toHaveLength(1);
        expect(overdueProjects[0].title).toBe('Overdue Project');
      });
    });

    describe('Instance Methods', () => {
      it('should update progress correctly', async () => {
        const project = await Project.create({
          title: 'Progress Test',
          progress: 50
        });

        await project.updateProgress(75);
        expect(project.progress).toBe(75);

        await project.updateProgress(100);
        expect(project.progress).toBe(100);
        expect(project.status).toBe('completed');
      });

      it('should add and remove tags', async () => {
        const project = await Project.create({
          title: 'Tag Test Project'
        });

        await project.addTag('urgent');
        expect(project.tags).toContain('urgent');

        await project.addTag('urgent'); // Should not add duplicate
        expect(project.tags).toHaveLength(1);

        await project.removeTag('urgent');
        expect(project.tags).not.toContain('urgent');
      });
    });
  });

  describe('Task Model', () => {
    let projectId;

    beforeEach(async () => {
      const project = await Project.create({
        title: 'Test Project for Tasks'
      });
      projectId = project._id;
    });

    describe('Validation', () => {
      it('should create a valid task', async () => {
        const taskData = {
          title: 'Test Task',
          description: 'A test task',
          projectId: projectId,
          status: 'todo',
          priority: 'high',
          assignedTo: 'testuser',
          estimatedHours: 8,
          dueDate: new Date(Date.now() + 86400000)
        };

        const task = new Task(taskData);
        const savedTask = await task.save();

        expect(savedTask._id).toBeDefined();
        expect(savedTask.title).toBe(taskData.title);
        expect(savedTask.projectId).toEqual(projectId);
        expect(savedTask.status).toBe(taskData.status);
      });

      it('should require title', async () => {
        const task = new Task({
          description: 'Task without title'
        });

        await expect(task.save()).rejects.toThrow('Task title is required');
      });

      it('should enforce title length constraints', async () => {
        const shortTitle = new Task({
          title: 'AB' // Too short
        });
        await expect(shortTitle.save()).rejects.toThrow();

        const longTitle = new Task({
          title: 'A'.repeat(101) // Too long
        });
        await expect(longTitle.save()).rejects.toThrow();
      });

      it('should set default values', async () => {
        const task = new Task({
          title: 'Minimal Task'
        });

        const savedTask = await task.save();
        expect(savedTask.status).toBe('todo');
        expect(savedTask.priority).toBe('medium');
        expect(savedTask.assignedTo).toBe('unassigned');
        expect(savedTask.actualHours).toBe(0);
      });

      it('should handle completion date in pre-save hook', async () => {
        const task = await Task.create({
          title: 'Completion Test',
          status: 'todo'
        });

        // Mark as completed
        task.status = 'completed';
        await task.save();
        expect(task.completedDate).toBeDefined();

        // Mark as not completed
        task.status = 'todo';
        await task.save();
        expect(task.completedDate).toBeUndefined();
      });
    });

    describe('Virtual Properties', () => {
      it('should calculate completion percentage from subtasks', async () => {
        const task = await Task.create({
          title: 'Subtask Test',
          subtasks: [
            { title: 'Subtask 1', completed: true },
            { title: 'Subtask 2', completed: false },
            { title: 'Subtask 3', completed: true }
          ]
        });

        expect(task.completionPercentage).toBe(67); // 2 out of 3 = 66.67%, rounded to 67
      });

      it('should detect overdue status', async () => {
        const overdueTask = await Task.create({
          title: 'Overdue Task',
          dueDate: new Date(Date.now() - 86400000), // Yesterday
          status: 'todo'
        });

        expect(overdueTask.isOverdue).toBe(true);

        const completedTask = await Task.create({
          title: 'Completed Task',
          dueDate: new Date(Date.now() - 86400000), // Yesterday
          status: 'completed'
        });

        expect(completedTask.isOverdue).toBe(false);
      });

      it('should provide time tracking information', async () => {
        const task = await Task.create({
          title: 'Time Tracking Test',
          estimatedHours: 10,
          actualHours: 7
        });

        const timeTracking = task.timeTracking;
        expect(timeTracking.estimated).toBe(10);
        expect(timeTracking.actual).toBe(7);
        expect(timeTracking.remaining).toBe(3);
        expect(timeTracking.variance).toBe(-3); // Under estimate
      });
    });

    describe('Static Methods', () => {
      beforeEach(async () => {
        await Task.create([
          { title: 'Project Task 1', projectId: projectId, status: 'todo', priority: 'high', assignedTo: 'user1' },
          { title: 'Project Task 2', projectId: projectId, status: 'in_progress', priority: 'medium', assignedTo: 'user1' },
          { title: 'Standalone Task', status: 'completed', priority: 'low', assignedTo: 'user2' },
          { 
            title: 'Overdue Task', 
            status: 'todo', 
            dueDate: new Date(Date.now() - 86400000) 
          }
        ]);
      });

      it('should find tasks by project', async () => {
        const projectTasks = await Task.findByProject(projectId);
        expect(projectTasks).toHaveLength(2);
      });

      it('should find tasks by status', async () => {
        const todoTasks = await Task.findByStatus('todo');
        expect(todoTasks).toHaveLength(2);
      });

      it('should find tasks by priority', async () => {
        const highPriorityTasks = await Task.findByPriority('high');
        expect(highPriorityTasks).toHaveLength(1);
      });

      it('should find overdue tasks', async () => {
        const overdueTasks = await Task.findOverdue();
        expect(overdueTasks).toHaveLength(1);
      });

      it('should find tasks by assignee', async () => {
        const user1Tasks = await Task.findByAssignee('user1');
        expect(user1Tasks).toHaveLength(2);
      });
    });

    describe('Instance Methods', () => {
      let task;

      beforeEach(async () => {
        task = await Task.create({
          title: 'Method Test Task',
          actualHours: 5
        });
      });

      it('should add subtasks', async () => {
        await task.addSubtask('New Subtask');
        expect(task.subtasks).toHaveLength(1);
        expect(task.subtasks[0].title).toBe('New Subtask');
        expect(task.subtasks[0].completed).toBe(false);
      });

      it('should complete subtasks', async () => {
        await task.addSubtask('Completable Subtask');
        const subtaskId = task.subtasks[0]._id;

        await task.completeSubtask(subtaskId);
        expect(task.subtasks[0].completed).toBe(true);
        expect(task.subtasks[0].completedDate).toBeDefined();
      });

      it('should add comments', async () => {
        await task.addComment('Test comment', 'testuser');
        expect(task.comments).toHaveLength(1);
        expect(task.comments[0].content).toBe('Test comment');
        expect(task.comments[0].author).toBe('testuser');
      });

      it('should log time', async () => {
        await task.logTime(3);
        expect(task.actualHours).toBe(8); // 5 + 3
      });

      it('should add and remove tags', async () => {
        await task.addTag('urgent');
        expect(task.tags).toContain('urgent');

        await task.removeTag('urgent');
        expect(task.tags).not.toContain('urgent');
      });
    });
  });

  describe('Blog Model', () => {
    let projectId;
    let taskId;

    beforeEach(async () => {
      const project = await Project.create({
        title: 'Test Project for Blogs'
      });
      projectId = project._id;

      const task = await Task.create({
        title: 'Test Task for Blogs'
      });
      taskId = task._id;
    });

    describe('Validation', () => {
      it('should create a valid blog', async () => {
        const blogData = {
          title: 'Test Blog Post',
          content: 'This is test content for a blog post',
          excerpt: 'Test excerpt',
          author: 'testauthor',
          category: 'technical',
          tags: ['test', 'blog'],
          isPublished: true,
          projectRef: projectId
        };

        const blog = new Blog(blogData);
        const savedBlog = await blog.save();

        expect(savedBlog._id).toBeDefined();
        expect(savedBlog.title).toBe(blogData.title);
        expect(savedBlog.content).toBe(blogData.content);
        expect(savedBlog.isPublished).toBe(true);
        expect(savedBlog.publishedDate).toBeDefined();
      });

      it('should require title', async () => {
        const blog = new Blog({
          content: 'Blog without title'
        });

        await expect(blog.save()).rejects.toThrow('Blog title is required');
      });

      it('should require content', async () => {
        const blog = new Blog({
          title: 'Blog without content'
        });

        await expect(blog.save()).rejects.toThrow('Blog content is required');
      });

      it('should enforce title length constraints', async () => {
        const shortTitle = new Blog({
          title: 'ABCD', // Too short (minimum 5)
          content: 'Some content'
        });
        await expect(shortTitle.save()).rejects.toThrow();

        const longTitle = new Blog({
          title: 'A'.repeat(201), // Too long
          content: 'Some content'
        });
        await expect(longTitle.save()).rejects.toThrow();
      });

      it('should set default values', async () => {
        const blog = new Blog({
          title: 'Minimal Blog Post',
          content: 'Minimal content'
        });

        const savedBlog = await blog.save();
        expect(savedBlog.author).toBe('system');
        expect(savedBlog.category).toBe('general');
        expect(savedBlog.isPublished).toBe(false);
        expect(savedBlog.views).toBe(0);
        expect(savedBlog.likes).toBe(0);
      });

      it('should auto-generate excerpt if not provided', async () => {
        const longContent = 'A'.repeat(200) + ' more content here';
        const blog = new Blog({
          title: 'Auto Excerpt Blog',
          content: longContent
        });

        const savedBlog = await blog.save();
        expect(savedBlog.excerpt).toBeDefined();
        expect(savedBlog.excerpt.length).toBeLessThanOrEqual(153); // 150 + '...'
      });

      it('should calculate reading time', async () => {
        const longContent = 'word '.repeat(400); // 400 words
        const blog = new Blog({
          title: 'Reading Time Test',
          content: longContent
        });

        const savedBlog = await blog.save();
        expect(savedBlog.readingTime).toBe(2); // 400 words / 200 words per minute = 2 minutes
      });

      it('should handle published date logic', async () => {
        const blog = await Blog.create({
          title: 'Publish Test Blog',
          content: 'Test content',
          isPublished: false
        });

        expect(blog.publishedDate).toBeUndefined();

        blog.isPublished = true;
        await blog.save();
        expect(blog.publishedDate).toBeDefined();

        blog.isPublished = false;
        await blog.save();
        expect(blog.publishedDate).toBeUndefined();
      });
    });

    describe('Virtual Properties', () => {
      it('should generate URL slug', async () => {
        const blog = await Blog.create({
          title: 'This is a Test Blog Post with Special Characters!@#',
          content: 'Test content'
        });

        expect(blog.slug).toBe('this-is-a-test-blog-post-with-special-characters');
      });

      it('should calculate estimated reading time', async () => {
        const content = 'word '.repeat(600); // 600 words
        const blog = await Blog.create({
          title: 'Reading Time Virtual Test',
          content: content
        });

        expect(blog.estimatedReadingTime).toBe(3); // 600 words / 200 wpm = 3 minutes
      });

      it('should provide content preview', async () => {
        const blog = await Blog.create({
          title: 'Preview Test',
          content: 'A'.repeat(200),
          excerpt: 'Custom excerpt'
        });

        expect(blog.preview).toBe('Custom excerpt');

        const blogWithoutExcerpt = await Blog.create({
          title: 'No Excerpt Test',
          content: 'A'.repeat(200)
        });

        expect(blogWithoutExcerpt.preview).toHaveLength(153); // 150 + '...'
      });

      it('should provide publication status', async () => {
        const publishedBlog = await Blog.create({
          title: 'Published Blog',
          content: 'Published content',
          isPublished: true
        });

        const status = publishedBlog.publicationStatus;
        expect(status.isPublished).toBe(true);
        expect(status.isDraft).toBe(false);
        expect(status.canPublish).toBe(true);

        const draftBlog = await Blog.create({
          title: 'Draft Blog',
          content: 'Draft content',
          isPublished: false
        });

        const draftStatus = draftBlog.publicationStatus;
        expect(draftStatus.isPublished).toBe(false);
        expect(draftStatus.isDraft).toBe(true);
      });
    });

    describe('Static Methods', () => {
      beforeEach(async () => {
        await Blog.create([
          { 
            title: 'Published Tech Blog', 
            content: 'Technical content',
            category: 'technical',
            tags: ['javascript', 'programming'],
            author: 'tech_author',
            isPublished: true,
            publishedDate: new Date()
          },
          { 
            title: 'Published General Blog', 
            content: 'General content',
            category: 'general',
            tags: ['general'],
            author: 'general_author',
            isPublished: true,
            publishedDate: new Date()
          },
          { 
            title: 'Draft Blog', 
            content: 'Draft content',
            author: 'tech_author',
            isPublished: false 
          }
        ]);
      });

      it('should find published blogs', async () => {
        const publishedBlogs = await Blog.findPublished();
        expect(publishedBlogs).toHaveLength(2);
        expect(publishedBlogs.every(blog => blog.isPublished)).toBe(true);
      });

      it('should find blogs by category', async () => {
        const techBlogs = await Blog.findByCategory('technical');
        expect(techBlogs).toHaveLength(1);
        expect(techBlogs[0].category).toBe('technical');
      });

      it('should find blogs by tag', async () => {
        const jsBlogs = await Blog.findByTag('javascript');
        expect(jsBlogs).toHaveLength(1);
        expect(jsBlogs[0].tags).toContain('javascript');
      });

      it('should find blogs by author', async () => {
        const authorBlogs = await Blog.findByAuthor('tech_author');
        expect(authorBlogs).toHaveLength(2); // 1 published + 1 draft
      });

      it('should search blogs by title', async () => {
        const searchResults = await Blog.searchByTitle('Tech');
        expect(searchResults).toHaveLength(1);
        expect(searchResults[0].title).toContain('Tech');
      });

      it('should search blogs by content', async () => {
        const searchResults = await Blog.searchByContent('programming');
        expect(searchResults).toHaveLength(1);
        expect(searchResults[0].tags).toContain('programming');
      });
    });

    describe('Instance Methods', () => {
      let blog;

      beforeEach(async () => {
        blog = await Blog.create({
          title: 'Method Test Blog',
          content: 'Test content',
          isPublished: false,
          views: 10,
          likes: 5
        });
      });

      it('should publish and unpublish blogs', async () => {
        await blog.publish();
        expect(blog.isPublished).toBe(true);
        expect(blog.publishedDate).toBeDefined();

        await blog.unpublish();
        expect(blog.isPublished).toBe(false);
        expect(blog.publishedDate).toBeUndefined();
      });

      it('should add comments', async () => {
        await blog.addComment('testuser', 'Great blog post!');
        expect(blog.comments).toHaveLength(1);
        expect(blog.comments[0].author).toBe('testuser');
        expect(blog.comments[0].content).toBe('Great blog post!');
        expect(blog.comments[0].isApproved).toBe(false);
      });

      it('should approve comments', async () => {
        await blog.addComment('testuser', 'Great blog post!');
        const commentId = blog.comments[0]._id;

        await blog.approveComment(commentId);
        expect(blog.comments[0].isApproved).toBe(true);
      });

      it('should increment views', async () => {
        await blog.incrementViews();
        expect(blog.views).toBe(11);
      });

      it('should increment likes', async () => {
        await blog.incrementLikes();
        expect(blog.likes).toBe(6);
      });

      it('should add and remove tags', async () => {
        await blog.addTag('new-tag');
        expect(blog.tags).toContain('new-tag');

        await blog.removeTag('new-tag');
        expect(blog.tags).not.toContain('new-tag');
      });
    });
  });

  describe('Model Relationships', () => {
    it('should populate project reference in tasks', async () => {
      const project = await Project.create({
        title: 'Related Project'
      });

      const task = await Task.create({
        title: 'Related Task',
        projectId: project._id
      });

      const populatedTask = await Task.findById(task._id).populate('projectId');
      expect(populatedTask.projectId.title).toBe('Related Project');
    });

    it('should populate project and task references in blogs', async () => {
      const project = await Project.create({
        title: 'Blog Related Project'
      });

      const task = await Task.create({
        title: 'Blog Related Task'
      });

      const blog = await Blog.create({
        title: 'Related Blog Post',
        content: 'Blog content with references',
        projectRef: project._id,
        taskRef: task._id
      });

      const populatedBlog = await Blog.findById(blog._id)
        .populate('projectRef')
        .populate('taskRef');

      expect(populatedBlog.projectRef.title).toBe('Blog Related Project');
      expect(populatedBlog.taskRef.title).toBe('Blog Related Task');
    });
  });
});