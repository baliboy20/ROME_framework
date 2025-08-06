const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../../backend/server');
const Blog = require('../../../backend/models/Blog');

describe('Blog Controller - Silent Failure Prevention', () => {
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
    // Clear blogs collection before each test
    await Blog.deleteMany({});
  });

  describe('POST /api/v1/blogs - Silent Failure Prevention', () => {
    it('should detect when Blog.create succeeds but save fails', async () => {
      // Mock Blog.create to simulate the silent failure scenario
      const originalCreate = Blog.create;
      const mockBlogId = new mongoose.Types.ObjectId();
      
      // Mock Blog.create to return a blog object but not actually save
      Blog.create = jest.fn().mockResolvedValue({
        _id: mockBlogId,
        title: 'Mock Blog',
        content: 'Mock content',
        isPublished: false,
        category: 'technical',
        author: 'system',
        populate: jest.fn().mockResolvedValue(undefined)
      });
      
      // Mock Blog.findById to return null (simulating save failure)
      const originalFindById = Blog.findById;
      Blog.findById = jest.fn().mockResolvedValue(null);

      const blogData = {
        title: 'Test Silent Failure Blog',
        content: 'This should trigger the silent failure detection',
        category: 'technical',
        author: 'system',
        draft: true
      };

      const response = await request(app)
        .post('/api/v1/blogs')
        .send(blogData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Failed to save blog to database');
      
      // Verify that Blog.create was called
      expect(Blog.create).toHaveBeenCalledWith({
        title: 'Test Silent Failure Blog',
        content: 'This should trigger the silent failure detection',
        category: 'technical',
        author: 'system',
        isPublished: false // draft: true should be converted to isPublished: false
      });
      
      // Verify that Blog.findById was called to verify the save
      expect(Blog.findById).toHaveBeenCalledWith(mockBlogId);

      // Restore original methods
      Blog.create = originalCreate;
      Blog.findById = originalFindById;
    });

    it('should successfully create blog when save actually works', async () => {
      const blogData = {
        title: 'Successful Blog Creation',
        content: 'This blog should be created successfully',
        category: 'technical',
        author: 'system',
        draft: false
      };

      const response = await request(app)
        .post('/api/v1/blogs')
        .send(blogData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Successful Blog Creation');
      expect(response.body.data.isPublished).toBe(true); // draft: false = isPublished: true
      expect(response.body.message).toBe('Blog created successfully');

      // Verify the blog actually exists in database
      const savedBlog = await Blog.findById(response.body.data._id);
      expect(savedBlog).toBeTruthy();
      expect(savedBlog.title).toBe('Successful Blog Creation');
      expect(savedBlog.isPublished).toBe(true);
    });

    it('should properly transform draft field to isPublished field', async () => {
      const testCases = [
        { draft: true, expectedPublished: false },
        { draft: false, expectedPublished: true },
        { /* no draft field */, expectedPublished: false } // default
      ];

      for (const testCase of testCases) {
        await Blog.deleteMany({}); // Clean up before each test

        const blogData = {
          title: `Test Blog - Draft: ${testCase.draft}`,
          content: 'Testing draft field transformation',
          category: 'technical',
          author: 'system'
        };

        if (testCase.draft !== undefined) {
          blogData.draft = testCase.draft;
        }

        const response = await request(app)
          .post('/api/v1/blogs')
          .send(blogData)
          .expect(201);

        expect(response.body.data.isPublished).toBe(testCase.expectedPublished);
        
        // Verify in database
        const savedBlog = await Blog.findById(response.body.data._id);
        expect(savedBlog.isPublished).toBe(testCase.expectedPublished);
      }
    });

    it('should log detailed error information when silent failure occurs', async () => {
      // Mock logger to capture log messages
      const { logger } = require('../../../backend/middleware/errorHandler');
      const loggerErrorSpy = jest.spyOn(logger, 'error');

      // Mock Blog.create and Blog.findById to simulate silent failure
      const originalCreate = Blog.create;
      const originalFindById = Blog.findById;
      const mockBlogId = new mongoose.Types.ObjectId();
      
      Blog.create = jest.fn().mockResolvedValue({
        _id: mockBlogId,
        title: 'Mock Blog',
        populate: jest.fn().mockResolvedValue(undefined)
      });
      Blog.findById = jest.fn().mockResolvedValue(null);

      const blogData = {
        title: 'Logging Test Blog',
        content: 'Test logging for silent failures',
        category: 'technical'
      };

      await request(app)
        .post('/api/v1/blogs')
        .send(blogData)
        .expect(500);

      // Verify error was logged with proper details
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Blog creation failed - blog not found after creation',
        {
          blogId: mockBlogId,
          title: 'Mock Blog'
        }
      );

      // Restore original methods
      Blog.create = originalCreate;
      Blog.findById = originalFindById;
      loggerErrorSpy.mockRestore();
    });

    it('should handle validation errors properly without silent failure', async () => {
      const invalidBlogData = {
        // Missing required title
        content: 'Blog without title',
        category: 'technical'
      };

      const response = await request(app)
        .post('/api/v1/blogs')
        .send(invalidBlogData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation failed');
      expect(response.body.message).toContain('title is required');

      // Verify no blog was created
      const blogCount = await Blog.countDocuments();
      expect(blogCount).toBe(0);
    });
  });

  describe('Integration with Database Verification', () => {
    it('should verify blog exists after creation through database query', async () => {
      const blogData = {
        title: 'Database Verification Test',
        content: 'Testing database verification logic',
        category: 'technical',
        author: 'system'
      };

      const response = await request(app)
        .post('/api/v1/blogs')
        .send(blogData)
        .expect(201);

      const blogId = response.body.data._id;

      // Direct database verification
      const directQuery = await mongoose.connection.db.collection('blogs').findOne({
        _id: new mongoose.Types.ObjectId(blogId)
      });

      expect(directQuery).toBeTruthy();
      expect(directQuery.title).toBe('Database Verification Test');

      // Mongoose model verification
      const modelQuery = await Blog.findById(blogId);
      expect(modelQuery).toBeTruthy();
      expect(modelQuery.title).toBe('Database Verification Test');
    });
  });
});