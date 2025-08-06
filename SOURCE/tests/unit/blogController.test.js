const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../backend/server');
const Blog = require('../../backend/models/Blog');
const Project = require('../../backend/models/Project');
const Task = require('../../backend/models/Task');

// Mock the database connection for testing
jest.mock('../../backend/config/database', () => ({
  connect: jest.fn().mockResolvedValue(true),
  getConnectionStatus: jest.fn().mockReturnValue('connected'),
  isDbConnected: jest.fn().mockReturnValue(true)
}));

describe('Blog Controller', () => {
  let projectId;
  let taskId;

  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/project_management_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
  });

  beforeEach(async () => {
    // Clear the database before each test
    await Blog.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});

    // Create test project and task
    const project = await Project.create({
      title: 'Test Project',
      description: 'A project for testing blogs'
    });
    projectId = project._id.toString();

    const task = await Task.create({
      title: 'Test Task',
      description: 'A task for testing blogs'
    });
    taskId = task._id.toString();
  });

  afterAll(async () => {
    // Close database connection
    await mongoose.connection.close();
  });

  describe('POST /api/v1/blogs', () => {
    it('should create a new blog with valid data', async () => {
      const blogData = {
        title: 'Test Blog Post',
        content: 'This is a test blog post with sufficient content to meet minimum requirements.',
        excerpt: 'Test excerpt',
        category: 'technical',
        tags: ['test', 'blog'],
        isPublished: true
      };

      const response = await request(app)
        .post('/api/v1/blogs')
        .send(blogData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(blogData.title);
      expect(response.body.data.content).toBe(blogData.content);
      expect(response.body.data.category).toBe(blogData.category);
      expect(response.body.data.tags).toEqual(blogData.tags);
      expect(response.body.data.isPublished).toBe(true);
      expect(response.body.data.publishedDate).toBeDefined();
    });

    it('should create blog with project reference', async () => {
      const blogData = {
        title: 'Project Update Blog',
        content: 'This blog post is related to a specific project.',
        category: 'project_update',
        projectRef: projectId
      };

      const response = await request(app)
        .post('/api/v1/blogs')
        .send(blogData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.projectRef._id).toBe(projectId);
    });

    it('should create blog with task reference', async () => {
      const blogData = {
        title: 'Task Update Blog',
        content: 'This blog post is related to a specific task.',
        taskRef: taskId
      };

      const response = await request(app)
        .post('/api/v1/blogs')
        .send(blogData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.taskRef._id).toBe(taskId);
    });

    it('should auto-generate excerpt if not provided', async () => {
      const blogData = {
        title: 'Auto Excerpt Blog',
        content: 'This is a long blog post that should have an excerpt automatically generated from its content. The excerpt should be a substring of the content with ellipsis if truncated.'
      };

      const response = await request(app)
        .post('/api/v1/blogs')
        .send(blogData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.excerpt).toBeDefined();
      expect(response.body.data.excerpt.length).toBeLessThanOrEqual(153); // 150 + '...'
    });

    it('should fail to create blog without title', async () => {
      const blogData = {
        content: 'Blog content without title'
      };

      const response = await request(app)
        .post('/api/v1/blogs')
        .send(blogData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Blog title is required');
    });

    it('should fail to create blog without content', async () => {
      const blogData = {
        title: 'Blog without content'
      };

      const response = await request(app)
        .post('/api/v1/blogs')
        .send(blogData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Blog content is required');
    });

    it('should fail with non-existent project reference', async () => {
      const nonExistentProjectId = new mongoose.Types.ObjectId();
      const blogData = {
        title: 'Test Blog',
        content: 'Test content',
        projectRef: nonExistentProjectId
      };

      const response = await request(app)
        .post('/api/v1/blogs')
        .send(blogData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Project not found');
    });

    it('should create unpublished blog by default', async () => {
      const blogData = {
        title: 'Draft Blog',
        content: 'This is a draft blog post'
      };

      const response = await request(app)
        .post('/api/v1/blogs')
        .send(blogData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isPublished).toBe(false);
      expect(response.body.data.publishedDate).toBeUndefined();
    });
  });

  describe('GET /api/v1/blogs', () => {
    beforeEach(async () => {
      // Create test blogs
      await Blog.create([
        {
          title: 'Published Blog 1',
          content: 'Content for published blog 1',
          category: 'technical',
          tags: ['tech', 'programming'],
          isPublished: true,
          publishedDate: new Date()
        },
        {
          title: 'Published Blog 2',
          content: 'Content for published blog 2',
          category: 'general',
          tags: ['general'],
          isPublished: true,
          publishedDate: new Date()
        },
        {
          title: 'Draft Blog',
          content: 'Content for draft blog',
          category: 'personal',
          isPublished: false
        }
      ]);
    });

    it('should get published blogs by default', async () => {
      const response = await request(app)
        .get('/api/v1/blogs')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2); // Only published blogs
      expect(response.body.data[0].isPublished).toBe(true);
      expect(response.body.data[1].isPublished).toBe(true);
    });

    it('should include unpublished blogs when requested', async () => {
      const response = await request(app)
        .get('/api/v1/blogs?includeUnpublished=true')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3); // All blogs
    });

    it('should filter blogs by category', async () => {
      const response = await request(app)
        .get('/api/v1/blogs?category=technical')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].category).toBe('technical');
    });

    it('should filter blogs by tag', async () => {
      const response = await request(app)
        .get('/api/v1/blogs?tag=tech')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].tags).toContain('tech');
    });

    it('should search blogs by title and content', async () => {
      const response = await request(app)
        .get('/api/v1/blogs?search=programming')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    it('should exclude content in list view', async () => {
      const response = await request(app)
        .get('/api/v1/blogs')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data[0].content).toBeUndefined();
      expect(response.body.data[0].title).toBeDefined();
      expect(response.body.data[0].excerpt).toBeDefined();
    });
  });

  describe('GET /api/v1/blogs/:id', () => {
    let blogId;

    beforeEach(async () => {
      const blog = await Blog.create({
        title: 'Test Blog Post',
        content: 'This is test content for a blog post',
        isPublished: true,
        views: 5
      });
      blogId = blog._id.toString();
    });

    it('should get blog by valid ID and increment views', async () => {
      const response = await request(app)
        .get(`/api/v1/blogs/${blogId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(blogId);
      expect(response.body.data.title).toBe('Test Blog Post');
      expect(response.body.data.content).toBeDefined(); // Full content in detail view
      expect(response.body.data.views).toBe(6); // Incremented from 5 to 6
    });

    it('should return 404 for non-existent blog', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/v1/blogs/${nonExistentId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Blog not found');
    });

    it('should return 400 for invalid blog ID', async () => {
      const response = await request(app)
        .get('/api/v1/blogs/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Invalid blog ID');
    });
  });

  describe('PUT /api/v1/blogs/:id', () => {
    let blogId;

    beforeEach(async () => {
      const blog = await Blog.create({
        title: 'Original Blog',
        content: 'Original content',
        category: 'general'
      });
      blogId = blog._id.toString();
    });

    it('should update blog with valid data', async () => {
      const updateData = {
        title: 'Updated Blog Title',
        content: 'Updated blog content with more details',
        category: 'technical',
        tags: ['updated', 'technical']
      };

      const response = await request(app)
        .put(`/api/v1/blogs/${blogId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updateData.title);
      expect(response.body.data.content).toBe(updateData.content);
      expect(response.body.data.category).toBe(updateData.category);
      expect(response.body.data.tags).toEqual(updateData.tags);
    });

    it('should return 404 for non-existent blog', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/v1/blogs/${nonExistentId}`)
        .send({ title: 'Updated Title', content: 'Updated content' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Blog not found');
    });
  });

  describe('DELETE /api/v1/blogs/:id', () => {
    let blogId;

    beforeEach(async () => {
      const blog = await Blog.create({
        title: 'Blog to Delete',
        content: 'This blog will be deleted'
      });
      blogId = blog._id.toString();
    });

    it('should delete blog successfully', async () => {
      const response = await request(app)
        .delete(`/api/v1/blogs/${blogId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Blog deleted successfully');

      // Verify blog is deleted
      const deletedBlog = await Blog.findById(blogId);
      expect(deletedBlog).toBeNull();
    });

    it('should return 404 for non-existent blog', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/v1/blogs/${nonExistentId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Blog not found');
    });
  });

  describe('GET /api/v1/blogs/category/:category', () => {
    beforeEach(async () => {
      await Blog.create([
        { title: 'Tech Blog 1', content: 'Technical content 1', category: 'technical', isPublished: true },
        { title: 'Tech Blog 2', content: 'Technical content 2', category: 'technical', isPublished: true },
        { title: 'General Blog', content: 'General content', category: 'general', isPublished: true }
      ]);
    });

    it('should get blogs by category', async () => {
      const response = await request(app)
        .get('/api/v1/blogs/category/technical')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.category).toBe('technical');
    });

    it('should return 400 for invalid category', async () => {
      const response = await request(app)
        .get('/api/v1/blogs/category/invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid category');
    });
  });

  describe('GET /api/v1/blogs/published', () => {
    beforeEach(async () => {
      await Blog.create([
        { title: 'Published 1', content: 'Content 1', isPublished: true },
        { title: 'Published 2', content: 'Content 2', isPublished: true },
        { title: 'Draft', content: 'Draft content', isPublished: false }
      ]);
    });

    it('should get only published blogs', async () => {
      const response = await request(app)
        .get('/api/v1/blogs/published')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every(blog => blog.isPublished)).toBe(true);
    });
  });

  describe('PATCH /api/v1/blogs/:id/publish', () => {
    let blogId;

    beforeEach(async () => {
      const blog = await Blog.create({
        title: 'Unpublished Blog',
        content: 'Content for unpublished blog',
        isPublished: false
      });
      blogId = blog._id.toString();
    });

    it('should publish blog successfully', async () => {
      const response = await request(app)
        .patch(`/api/v1/blogs/${blogId}/publish`)
        .send({ publish: true })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isPublished).toBe(true);
      expect(response.body.data.publishedDate).toBeDefined();
      expect(response.body.message).toBe('Blog published successfully');
    });

    it('should unpublish blog successfully', async () => {
      // First publish the blog
      await Blog.findByIdAndUpdate(blogId, { isPublished: true, publishedDate: new Date() });

      const response = await request(app)
        .patch(`/api/v1/blogs/${blogId}/publish`)
        .send({ publish: false })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isPublished).toBe(false);
      expect(response.body.data.publishedDate).toBeUndefined();
      expect(response.body.message).toBe('Blog unpublished successfully');
    });

    it('should fail with invalid publish value', async () => {
      const response = await request(app)
        .patch(`/api/v1/blogs/${blogId}/publish`)
        .send({ publish: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Publish status must be a boolean');
    });
  });

  describe('PATCH /api/v1/blogs/:id/like', () => {
    let blogId;

    beforeEach(async () => {
      const blog = await Blog.create({
        title: 'Likeable Blog',
        content: 'Content for likeable blog',
        likes: 5
      });
      blogId = blog._id.toString();
    });

    it('should like blog successfully', async () => {
      const response = await request(app)
        .patch(`/api/v1/blogs/${blogId}/like`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.likes).toBe(6); // Incremented from 5 to 6
      expect(response.body.message).toBe('Blog liked successfully');
    });

    it('should return 404 for non-existent blog', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .patch(`/api/v1/blogs/${nonExistentId}/like`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Blog not found');
    });
  });

  describe('GET /api/v1/blogs/search', () => {
    beforeEach(async () => {
      await Blog.create([
        {
          title: 'JavaScript Tutorial',
          content: 'Learn JavaScript programming',
          tags: ['javascript', 'tutorial'],
          isPublished: true
        },
        {
          title: 'Python Guide',
          content: 'Python programming guide',
          tags: ['python', 'guide'],
          isPublished: true
        },
        {
          title: 'Web Development',
          content: 'Learn web development with JavaScript',
          tags: ['web', 'development'],
          isPublished: true
        }
      ]);
    });

    it('should search blogs by query', async () => {
      const response = await request(app)
        .get('/api/v1/blogs/search?q=JavaScript')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2); // JavaScript Tutorial and Web Development
      expect(response.body.query).toBe('JavaScript');
    });

    it('should fail without search query', async () => {
      const response = await request(app)
        .get('/api/v1/blogs/search')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Search query is required');
    });

    it('should handle empty search results', async () => {
      const response = await request(app)
        .get('/api/v1/blogs/search?q=nonexistent')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.count).toBe(0);
    });
  });
});