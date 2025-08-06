const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Blog = require('../../../database/models/blog.model');
const Project = require('../../../database/models/project.model');

describe('Blog Model', () => {
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
    await Blog.deleteMany({});
    await Project.deleteMany({});
    
    // Create a test project
    testProject = new Project({
      name: 'Test Project',
      description: 'This is a test project description that meets the minimum length requirement.'
    });
    await testProject.save();
  });

  describe('Validation', () => {
    test('should create a valid blog with required fields', async () => {
      const blogData = {
        projectId: testProject._id,
        title: 'Test Blog Post',
        content: 'This is a test blog post content that meets the minimum length requirement.'
      };

      const blog = new Blog(blogData);
      const savedBlog = await blog.save();

      expect(savedBlog._id).toBeDefined();
      expect(savedBlog.projectId.toString()).toBe(testProject._id.toString());
      expect(savedBlog.title).toBe(blogData.title);
      expect(savedBlog.content).toBe(blogData.content);
      expect(savedBlog.draft).toBe(false);
      expect(savedBlog.publishDate).toBeDefined();
      expect(savedBlog.wordCount).toBeGreaterThan(0);
      expect(savedBlog.readingTime).toBeGreaterThan(0);
      expect(savedBlog.createdAt).toBeDefined();
      expect(savedBlog.updatedAt).toBeDefined();
    });

    test('should fail validation without required projectId', async () => {
      const blogData = {
        title: 'Test Blog Post',
        content: 'This is a test blog post content that meets the minimum length requirement.'
      };

      const blog = new Blog(blogData);
      
      await expect(blog.save()).rejects.toMatchObject({
        errors: {
          projectId: expect.objectContaining({
            message: 'Project ID is required'
          })
        }
      });
    });

    test('should fail validation without required title', async () => {
      const blogData = {
        projectId: testProject._id,
        content: 'This is a test blog post content that meets the minimum length requirement.'
      };

      const blog = new Blog(blogData);
      
      await expect(blog.save()).rejects.toMatchObject({
        errors: {
          title: expect.objectContaining({
            message: 'Blog title is required'
          })
        }
      });
    });

    test('should fail validation without required content', async () => {
      const blogData = {
        projectId: testProject._id,
        title: 'Test Blog Post'
      };

      const blog = new Blog(blogData);
      
      await expect(blog.save()).rejects.toMatchObject({
        errors: {
          content: expect.objectContaining({
            message: 'Blog content is required'
          })
        }
      });
    });

    test('should fail validation if title is too short', async () => {
      const blogData = {
        projectId: testProject._id,
        title: 'T',
        content: 'This is a test blog post content that meets the minimum length requirement.'
      };

      const blog = new Blog(blogData);
      
      await expect(blog.save()).rejects.toMatchObject({
        errors: {
          title: expect.objectContaining({
            message: 'Blog title must be at least 2 characters'
          })
        }
      });
    });

    test('should fail validation if title is too long', async () => {
      const blogData = {
        projectId: testProject._id,
        title: 'A'.repeat(301),
        content: 'This is a test blog post content that meets the minimum length requirement.'
      };

      const blog = new Blog(blogData);
      
      await expect(blog.save()).rejects.toMatchObject({
        errors: {
          title: expect.objectContaining({
            message: 'Blog title cannot exceed 300 characters'
          })
        }
      });
    });

    test('should fail validation if content is too short', async () => {
      const blogData = {
        projectId: testProject._id,
        title: 'Test Blog Post',
        content: 'Short'
      };

      const blog = new Blog(blogData);
      
      await expect(blog.save()).rejects.toMatchObject({
        errors: {
          content: expect.objectContaining({
            message: 'Blog content must be at least 10 characters'
          })
        }
      });
    });

    test('should fail validation if content is too long', async () => {
      const blogData = {
        projectId: testProject._id,
        title: 'Test Blog Post',
        content: 'A'.repeat(50001)
      };

      const blog = new Blog(blogData);
      
      await expect(blog.save()).rejects.toMatchObject({
        errors: {
          content: expect.objectContaining({
            message: 'Blog content cannot exceed 50,000 characters'
          })
        }
      });
    });

    test('should fail validation if publish date is in the future', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const blogData = {
        projectId: testProject._id,
        title: 'Test Blog Post',
        content: 'This is a test blog post content that meets the minimum length requirement.',
        publishDate: futureDate
      };

      const blog = new Blog(blogData);
      
      await expect(blog.save()).rejects.toMatchObject({
        errors: {
          publishDate: expect.objectContaining({
            message: 'Publish date cannot be in the future'
          })
        }
      });
    });
  });

  describe('URL Validation', () => {
    test('should accept valid URLs', async () => {
      const blogData = {
        projectId: testProject._id,
        title: 'Test Blog Post',
        content: 'This is a test blog post content that meets the minimum length requirement.',
        urls: [
          {
            title: 'External Link',
            url: 'https://example.com'
          },
          {
            title: 'Documentation',
            url: 'https://docs.example.com'
          }
        ]
      };

      const blog = new Blog(blogData);
      const savedBlog = await blog.save();

      expect(savedBlog.urls).toHaveLength(2);
      expect(savedBlog.urls[0].title).toBe('External Link');
      expect(savedBlog.urls[0].url).toBe('https://example.com');
    });

    test('should fail validation with invalid URL format', async () => {
      const blogData = {
        projectId: testProject._id,
        title: 'Test Blog Post',
        content: 'This is a test blog post content that meets the minimum length requirement.',
        urls: [
          {
            title: 'Invalid URL',
            url: 'not-a-valid-url'
          }
        ]
      };

      const blog = new Blog(blogData);
      
      await expect(blog.save()).rejects.toMatchObject({
        errors: {
          'urls.0.url': expect.objectContaining({
            message: 'Invalid URL format'
          })
        }
      });
    });

    test('should fail validation with too many URLs', async () => {
      const urls = Array.from({ length: 51 }, (_, i) => ({
        title: `URL ${i}`,
        url: `https://example${i}.com`
      }));

      const blogData = {
        projectId: testProject._id,
        title: 'Test Blog Post',
        content: 'This is a test blog post content that meets the minimum length requirement.',
        urls
      };

      const blog = new Blog(blogData);
      
      await expect(blog.save()).rejects.toMatchObject({
        errors: {
          urls: expect.objectContaining({
            message: 'Cannot have more than 50 URLs per blog'
          })
        }
      });
    });
  });

  describe('Tags Validation', () => {
    test('should accept valid tags', async () => {
      const blogData = {
        projectId: testProject._id,
        title: 'Test Blog Post',
        content: 'This is a test blog post content that meets the minimum length requirement.',
        tags: ['javascript', 'react', 'frontend', 'development']
      };

      const blog = new Blog(blogData);
      const savedBlog = await blog.save();

      expect(savedBlog.tags).toHaveLength(4);
      expect(savedBlog.tags).toContain('javascript');
      expect(savedBlog.tags).toContain('react');
    });

    test('should normalize tags to lowercase', async () => {
      const blogData = {
        projectId: testProject._id,
        title: 'Test Blog Post',
        content: 'This is a test blog post content that meets the minimum length requirement.',
        tags: ['JavaScript', 'REACT', 'Frontend']
      };

      const blog = new Blog(blogData);
      const savedBlog = await blog.save();

      expect(savedBlog.tags).toEqual(['javascript', 'react', 'frontend']);
    });

    test('should remove duplicate tags', async () => {
      const blogData = {
        projectId: testProject._id,
        title: 'Test Blog Post',
        content: 'This is a test blog post content that meets the minimum length requirement.',
        tags: ['javascript', 'JavaScript', 'JAVASCRIPT', 'react']
      };

      const blog = new Blog(blogData);
      const savedBlog = await blog.save();

      expect(savedBlog.tags).toEqual(['javascript', 'react']);
    });

    test('should fail validation with too many tags', async () => {
      const tags = Array.from({ length: 21 }, (_, i) => `tag${i}`);

      const blogData = {
        projectId: testProject._id,
        title: 'Test Blog Post',
        content: 'This is a test blog post content that meets the minimum length requirement.',
        tags
      };

      const blog = new Blog(blogData);
      
      await expect(blog.save()).rejects.toMatchObject({
        errors: {
          tags: expect.objectContaining({
            message: 'Cannot have more than 20 tags per blog'
          })
        }
      });
    });

    test('should fail validation with tags that are too long', async () => {
      const blogData = {
        projectId: testProject._id,
        title: 'Test Blog Post',
        content: 'This is a test blog post content that meets the minimum length requirement.',
        tags: ['A'.repeat(51)]
      };

      const blog = new Blog(blogData);
      
      await expect(blog.save()).rejects.toMatchObject({
        errors: {
          tags: expect.objectContaining({
            message: 'Each tag must be between 1 and 50 characters'
          })
        }
      });
    });
  });

  describe('Virtual Properties', () => {
    test('should generate excerpt from content', async () => {
      const longContent = 'A'.repeat(300) + ' This is the rest of the content.';
      
      const blogData = {
        projectId: testProject._id,
        title: 'Test Blog Post',
        content: longContent
      };

      const blog = new Blog(blogData);
      const savedBlog = await blog.save();

      expect(savedBlog.excerpt).toHaveLength(203); // 200 chars + '...'
      expect(savedBlog.excerpt).toEndWith('...');
    });

    test('should strip markdown from excerpt', async () => {
      const markdownContent = `
# This is a Header

This is **bold text** and this is *italic text*.

Here is a [link](https://example.com) and some \`inline code\`.

More content here.
      `.trim();

      const blogData = {
        projectId: testProject._id,
        title: 'Test Blog Post',
        content: markdownContent
      };

      const blog = new Blog(blogData);
      const savedBlog = await blog.save();

      expect(savedBlog.excerpt).not.toContain('**');
      expect(savedBlog.excerpt).not.toContain('*');
      expect(savedBlog.excerpt).not.toContain('[');
      expect(savedBlog.excerpt).not.toContain('`');
      expect(savedBlog.excerpt).not.toContain('#');
    });

    test('should calculate daysSincePublished correctly', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const blogData = {
        projectId: testProject._id,
        title: 'Test Blog Post',
        content: 'This is a test blog post content that meets the minimum length requirement.',
        publishDate: yesterday
      };

      const blog = new Blog(blogData);
      const savedBlog = await blog.save();

      expect(savedBlog.daysSincePublished).toBe(1);
    });

    test('should return formatted publish date', async () => {
      const testDate = new Date('2025-08-04T14:30:00Z');

      const blogData = {
        projectId: testProject._id,
        title: 'Test Blog Post',
        content: 'This is a test blog post content that meets the minimum length requirement.',
        publishDate: testDate
      };

      const blog = new Blog(blogData);
      const savedBlog = await blog.save();

      expect(savedBlog.formattedPublishDate).toMatch(/August/);
      expect(savedBlog.formattedPublishDate).toMatch(/2025/);
    });

    test('should filter image attachments', async () => {
      const attachments = [
        {
          fileId: new mongoose.Types.ObjectId(),
          filename: 'image.jpg',
          originalName: 'Image.jpg',
          mimetype: 'image/jpeg',
          size: 1024,
          category: 'image'
        },
        {
          fileId: new mongoose.Types.ObjectId(),
          filename: 'document.pdf',
          originalName: 'Document.pdf',
          mimetype: 'application/pdf',
          size: 2048,
          category: 'document'
        },
        {
          fileId: new mongoose.Types.ObjectId(),
          filename: 'photo.png',
          originalName: 'Photo.png',
          mimetype: 'image/png',
          size: 512,
          category: 'attachment'
        }
      ];

      const blogData = {
        projectId: testProject._id,
        title: 'Test Blog Post',
        content: 'This is a test blog post content that meets the minimum length requirement.',
        attachments
      };

      const blog = new Blog(blogData);
      const savedBlog = await blog.save();

      expect(savedBlog.imageAttachments).toHaveLength(2);
      expect(savedBlog.imageAttachments[0].mimetype).toBe('image/jpeg');
      expect(savedBlog.imageAttachments[1].mimetype).toBe('image/png');
    });
  });

  describe('Pre-save Middleware', () => {
    test('should calculate word count and reading time', async () => {
      const content = 'This is a test blog post with exactly twenty words in the content to test word counting functionality properly.';
      
      const blogData = {
        projectId: testProject._id,
        title: 'Test Blog Post',
        content
      };

      const blog = new Blog(blogData);
      const savedBlog = await blog.save();

      expect(savedBlog.wordCount).toBe(20);
      expect(savedBlog.readingTime).toBe(1); // Minimum 1 minute
    });

    test('should calculate reading time for longer content', async () => {
      // Create content with approximately 400 words (2 minutes reading time)
      const words = Array.from({ length: 400 }, (_, i) => `word${i}`);
      const content = words.join(' ');
      
      const blogData = {
        projectId: testProject._id,
        title: 'Test Blog Post',
        content
      };

      const blog = new Blog(blogData);
      const savedBlog = await blog.save();

      expect(savedBlog.wordCount).toBe(400);
      expect(savedBlog.readingTime).toBe(2);
    });

    test('should normalize and deduplicate tags', async () => {
      const blogData = {
        projectId: testProject._id,
        title: 'Test Blog Post',
        content: 'This is a test blog post content that meets the minimum length requirement.',
        tags: ['  JavaScript  ', 'REACT', 'javascript', '', 'react', 'Vue']
      };

      const blog = new Blog(blogData);
      const savedBlog = await blog.save();

      expect(savedBlog.tags).toEqual(['javascript', 'react', 'vue']);
    });
  });

  describe('Instance Methods', () => {
    let testBlog;

    beforeEach(async () => {
      const blogData = {
        projectId: testProject._id,
        title: 'Test Blog Post',
        content: 'This is a test blog post content that meets the minimum length requirement.',
        urls: [
          { title: 'Existing URL', url: 'https://existing.com' }
        ],
        tags: ['javascript', 'react']
      };

      testBlog = new Blog(blogData);
      await testBlog.save();
    });

    test('addUrl should add URL to blog', async () => {
      await testBlog.addUrl('New URL', 'https://new.com');
      
      expect(testBlog.urls).toHaveLength(2);
      expect(testBlog.urls[1].title).toBe('New URL');
      expect(testBlog.urls[1].url).toBe('https://new.com');
    });

    test('addUrl should fail when exceeding limit', async () => {
      // Add 49 more URLs (we already have 1, limit is 50)
      for (let i = 0; i < 49; i++) {
        await testBlog.addUrl(`URL ${i}`, `https://example${i}.com`);
      }

      // Try to add one more
      await expect(testBlog.addUrl('Extra URL', 'https://extra.com'))
        .rejects.toThrow('Cannot add more than 50 URLs per blog');
    });

    test('removeUrl should remove URL from blog', async () => {
      await testBlog.removeUrl('https://existing.com');
      
      expect(testBlog.urls).toHaveLength(0);
    });

    test('addTags should add new tags', async () => {
      await testBlog.addTags(['vue', 'angular']);
      
      expect(testBlog.tags).toHaveLength(4);
      expect(testBlog.tags).toContain('vue');
      expect(testBlog.tags).toContain('angular');
    });

    test('addTags should not add duplicate tags', async () => {
      await testBlog.addTags(['javascript', 'new-tag']);
      
      expect(testBlog.tags).toHaveLength(3);
      expect(testBlog.tags).toContain('new-tag');
      // Should still only have one instance of 'javascript'
      expect(testBlog.tags.filter(tag => tag === 'javascript')).toHaveLength(1);
    });

    test('addTags should fail when exceeding limit', async () => {
      // Add 18 more tags (we have 2, limit is 20)
      const newTags = Array.from({ length: 18 }, (_, i) => `tag${i}`);
      await testBlog.addTags(newTags);

      // Try to add one more
      await expect(testBlog.addTags(['extra-tag']))
        .rejects.toThrow('Cannot add more than 20 tags per blog');
    });

    test('removeTags should remove specified tags', async () => {
      await testBlog.removeTags(['javascript']);
      
      expect(testBlog.tags).toHaveLength(1);
      expect(testBlog.tags).toContain('react');
      expect(testBlog.tags).not.toContain('javascript');
    });

    test('publish should set draft to false and update publish date', async () => {
      testBlog.draft = true;
      await testBlog.save();

      const publishDate = testBlog.publishDate;
      await testBlog.publish();
      
      expect(testBlog.draft).toBe(false);
      expect(testBlog.publishDate).toBeInstanceOf(Date);
      expect(testBlog.publishDate.getTime()).toBeGreaterThanOrEqual(publishDate.getTime());
    });

    test('unpublish should set draft to true', async () => {
      await testBlog.unpublish();
      
      expect(testBlog.draft).toBe(true);
    });

    test('addAttachment should add attachment to blog', async () => {
      const attachmentData = {
        fileId: new mongoose.Types.ObjectId(),
        filename: 'test-image.jpg',
        originalName: 'Test Image.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        category: 'image'
      };

      await testBlog.addAttachment(attachmentData);
      
      expect(testBlog.attachments).toHaveLength(1);
      expect(testBlog.attachments[0].filename).toBe('test-image.jpg');
    });

    test('addAttachment should fail when exceeding limit', async () => {
      // Add 100 attachments (the limit)
      for (let i = 0; i < 100; i++) {
        const attachmentData = {
          fileId: new mongoose.Types.ObjectId(),
          filename: `file-${i}.txt`,
          originalName: `File ${i}.txt`,
          mimetype: 'text/plain',
          size: 100,
          category: 'document'
        };
        await testBlog.addAttachment(attachmentData);
      }

      // Try to add one more
      const extraAttachment = {
        fileId: new mongoose.Types.ObjectId(),
        filename: 'extra-file.txt',
        originalName: 'Extra File.txt',
        mimetype: 'text/plain',
        size: 100,
        category: 'document'
      };

      await expect(testBlog.addAttachment(extraAttachment))
        .rejects.toThrow('Cannot add more than 100 attachments per blog');
    });

    test('removeAttachment should remove attachment by fileId', async () => {
      const fileId = new mongoose.Types.ObjectId();
      const attachmentData = {
        fileId,
        filename: 'test-image.jpg',
        originalName: 'Test Image.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        category: 'image'
      };

      await testBlog.addAttachment(attachmentData);
      expect(testBlog.attachments).toHaveLength(1);

      await testBlog.removeAttachment(fileId);
      expect(testBlog.attachments).toHaveLength(0);
    });
  });

  describe('Static Methods', () => {
    beforeEach(async () => {
      // Create test blogs
      const blogs = [
        {
          projectId: testProject._id,
          title: 'Published Blog 1',
          content: 'This is a published blog post content that meets the minimum length requirement.',
          draft: false,
          tags: ['javascript', 'react'],
          publishDate: new Date('2025-08-01')
        },
        {
          projectId: testProject._id,
          title: 'Draft Blog',
          content: 'This is a draft blog post content that meets the minimum length requirement.',
          draft: true,
          tags: ['vue', 'frontend'],
          publishDate: new Date('2025-08-02')
        },
        {
          projectId: testProject._id,
          title: 'Published Blog 2',
          content: 'This is another published blog post content that meets the minimum length requirement.',
          draft: false,
          tags: ['javascript', 'backend'],
          publishDate: new Date('2025-08-03')
        }
      ];

      await Blog.insertMany(blogs);
    });

    test('findByProject should find all blogs for a project', async () => {
      const blogs = await Blog.findByProject(testProject._id);
      
      expect(blogs).toHaveLength(3);
      blogs.forEach(blog => {
        expect(blog.projectId.toString()).toBe(testProject._id.toString());
      });
    });

    test('findByProject should filter by published status', async () => {
      const publishedBlogs = await Blog.findByProject(testProject._id, { published: true });
      
      expect(publishedBlogs).toHaveLength(2);
      publishedBlogs.forEach(blog => {
        expect(blog.draft).toBe(false);
      });

      const draftBlogs = await Blog.findByProject(testProject._id, { published: false });
      
      expect(draftBlogs).toHaveLength(1);
      expect(draftBlogs[0].draft).toBe(true);
    });

    test('findByProject should filter by tags', async () => {
      const jsBlogs = await Blog.findByProject(testProject._id, { tags: ['javascript'] });
      
      expect(jsBlogs).toHaveLength(2);
      jsBlogs.forEach(blog => {
        expect(blog.tags).toContain('javascript');
      });
    });

    test('findByProject should filter by date range', async () => {
      const startDate = new Date('2025-08-01');
      const endDate = new Date('2025-08-02');

      const blogs = await Blog.findByProject(testProject._id, { 
        dateFrom: startDate, 
        dateTo: endDate 
      });
      
      expect(blogs).toHaveLength(2);
    });

    test('searchBlogs should find blogs by content', async () => {
      const blogs = await Blog.searchBlogs('javascript');
      
      expect(blogs.length).toBeGreaterThan(0);
      // Results should be sorted by text score
      expect(blogs[0].score).toBeDefined();
    });

    test('searchBlogs should filter by project', async () => {
      const blogs = await Blog.searchBlogs('blog', testProject._id);
      
      expect(blogs.length).toBeGreaterThan(0);
      blogs.forEach(blog => {
        expect(blog.projectId.toString()).toBe(testProject._id.toString());
      });
    });

    test('findByTags should find blogs with specified tags', async () => {
      const blogs = await Blog.findByTags(['javascript']);
      
      expect(blogs).toHaveLength(2);
      blogs.forEach(blog => {
        expect(blog.tags).toContain('javascript');
      });
    });

    test('findByTags should find blogs with any of the specified tags', async () => {
      const blogs = await Blog.findByTags(['javascript', 'vue']);
      
      expect(blogs).toHaveLength(3); // 2 with javascript, 1 with vue
    });

    test('getBlogStatistics should return correct statistics', async () => {
      const stats = await Blog.getBlogStatistics(testProject._id);
      
      expect(stats).toHaveLength(1);
      expect(stats[0].totalBlogs).toBe(3);
      expect(stats[0].publishedBlogs).toBe(2);
      expect(stats[0].draftBlogs).toBe(1);
      expect(stats[0].totalWords).toBeGreaterThan(0);
      expect(stats[0].averageWords).toBeGreaterThan(0);
      expect(stats[0].averageReadingTime).toBeGreaterThan(0);
    });
  });

  describe('Text Search Index', () => {
    beforeEach(async () => {
      const blogs = [
        {
          projectId: testProject._id,
          title: 'JavaScript Framework Comparison',
          content: 'React vs Vue vs Angular - a comprehensive comparison of modern JavaScript frameworks.',
          tags: ['javascript', 'react', 'vue', 'angular']
        },
        {
          projectId: testProject._id,
          title: 'Database Design Best Practices',
          content: 'MongoDB schema design patterns and optimization techniques for better performance.',
          tags: ['database', 'mongodb', 'performance']
        },
        {
          projectId: testProject._id,
          title: 'Frontend Development Tips',
          content: 'Essential tips and tricks for modern frontend development with CSS and JavaScript.',
          tags: ['frontend', 'css', 'javascript']
        }
      ];

      await Blog.insertMany(blogs);
    });

    test('should find blogs by title search', async () => {
      const blogs = await Blog.searchBlogs('JavaScript Framework');
      
      expect(blogs).toHaveLength(1);
      expect(blogs[0].title).toBe('JavaScript Framework Comparison');
    });

    test('should find blogs by content search', async () => {
      const blogs = await Blog.searchBlogs('MongoDB schema');
      
      expect(blogs).toHaveLength(1);
      expect(blogs[0].title).toBe('Database Design Best Practices');
    });

    test('should find blogs by tag search', async () => {
      const blogs = await Blog.searchBlogs('react');
      
      expect(blogs).toHaveLength(1);
      expect(blogs[0].tags).toContain('react');
    });

    test('should prioritize title matches over content matches', async () => {
      const blogs = await Blog.searchBlogs('javascript');
      
      expect(blogs.length).toBeGreaterThan(1);
      // Title matches should have higher scores
      expect(blogs[0].title).toContain('JavaScript');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty arrays for optional fields', async () => {
      const blogData = {
        projectId: testProject._id,
        title: 'Test Blog Post',
        content: 'This is a test blog post content that meets the minimum length requirement.',
        urls: [],
        attachments: [],
        tags: []
      };

      const blog = new Blog(blogData);
      const savedBlog = await blog.save();

      expect(savedBlog.urls).toEqual([]);
      expect(savedBlog.attachments).toEqual([]);
      expect(savedBlog.tags).toEqual([]);
    });

    test('should trim whitespace from string fields', async () => {
      const blogData = {
        projectId: testProject._id,
        title: '  Test Blog Post  ',
        content: '  This is a test blog post content that meets the minimum length requirement.  '
      };

      const blog = new Blog(blogData);
      const savedBlog = await blog.save();

      expect(savedBlog.title).toBe('Test Blog Post');
      expect(savedBlog.content).toBe('This is a test blog post content that meets the minimum length requirement.');
    });

    test('should handle very long content for word count calculation', async () => {
      const veryLongContent = Array.from({ length: 10000 }, (_, i) => `word${i}`).join(' ');
      
      const blogData = {
        projectId: testProject._id,
        title: 'Very Long Blog Post',
        content: veryLongContent
      };

      const blog = new Blog(blogData);
      const savedBlog = await blog.save();

      expect(savedBlog.wordCount).toBe(10000);
      expect(savedBlog.readingTime).toBe(50); // 10000 words / 200 words per minute
    });

    test('should handle content with special characters for word count', async () => {
      const specialContent = 'Hello, world! This is a test... with special characters: @#$%^&*()';
      
      const blogData = {
        projectId: testProject._id,
        title: 'Special Characters Blog',
        content: specialContent
      };

      const blog = new Blog(blogData);
      const savedBlog = await blog.save();

      // Should count actual words, not special characters
      expect(savedBlog.wordCount).toBe(11);
    });
  });
});