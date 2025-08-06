const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const path = require('path');
const fs = require('fs').promises;
const File = require('../../../database/models/file.model');
const Project = require('../../../database/models/project.model');

describe('File Model', () => {
  let mongoServer;
  let testProject;
  let testEntityId;

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
    await File.deleteMany({});
    await Project.deleteMany({});
    
    // Create a test project
    testProject = new Project({
      name: 'Test Project',
      description: 'This is a test project description that meets the minimum length requirement.'
    });
    await testProject.save();
    testEntityId = testProject._id;
  });

  describe('Validation', () => {
    test('should create a valid file with required fields', async () => {
      const fileData = {
        filename: 'test-file-123.pdf',
        originalName: 'Test File.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        path: '/uploads/project/test-file-123.pdf',
        entityType: 'project',
        entityId: testEntityId
      };

      const file = new File(fileData);
      const savedFile = await file.save();

      expect(savedFile._id).toBeDefined();
      expect(savedFile.filename).toBe(fileData.filename);
      expect(savedFile.originalName).toBe(fileData.originalName);
      expect(savedFile.mimetype).toBe(fileData.mimetype);
      expect(savedFile.size).toBe(fileData.size);
      expect(savedFile.path).toBe(fileData.path);
      expect(savedFile.entityType).toBe(fileData.entityType);
      expect(savedFile.entityId.toString()).toBe(testEntityId.toString());
      expect(savedFile.category).toBe('document'); // Auto-detected from mimetype
      expect(savedFile.isActive).toBe(true);
      expect(savedFile.downloadCount).toBe(0);
      expect(savedFile.uploadDate).toBeDefined();
      expect(savedFile.lastAccessed).toBeDefined();
    });

    test('should fail validation without required filename', async () => {
      const fileData = {
        originalName: 'Test File.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        path: '/uploads/project/test-file.pdf',
        entityType: 'project',
        entityId: testEntityId
      };

      const file = new File(fileData);
      
      await expect(file.save()).rejects.toMatchObject({
        errors: {
          filename: expect.objectContaining({
            message: 'Filename is required'
          })
        }
      });
    });

    test('should fail validation without required originalName', async () => {
      const fileData = {
        filename: 'test-file-123.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        path: '/uploads/project/test-file-123.pdf',
        entityType: 'project',
        entityId: testEntityId
      };

      const file = new File(fileData);
      
      await expect(file.save()).rejects.toMatchObject({
        errors: {
          originalName: expect.objectContaining({
            message: 'Original filename is required'
          })
        }
      });
    });

    test('should fail validation without required size', async () => {
      const fileData = {
        filename: 'test-file-123.pdf',
        originalName: 'Test File.pdf',
        mimetype: 'application/pdf',
        path: '/uploads/project/test-file-123.pdf',
        entityType: 'project',
        entityId: testEntityId
      };

      const file = new File(fileData);
      
      await expect(file.save()).rejects.toMatchObject({
        errors: {
          size: expect.objectContaining({
            message: 'File size is required'
          })
        }
      });
    });

    test('should fail validation with negative size', async () => {
      const fileData = {
        filename: 'test-file-123.pdf',
        originalName: 'Test File.pdf',
        mimetype: 'application/pdf',
        size: -1,
        path: '/uploads/project/test-file-123.pdf',
        entityType: 'project',
        entityId: testEntityId
      };

      const file = new File(fileData);
      
      await expect(file.save()).rejects.toMatchObject({
        errors: {
          size: expect.objectContaining({
            message: 'File size cannot be negative'
          })
        }
      });
    });

    test('should fail validation with size exceeding limit', async () => {
      const fileData = {
        filename: 'test-file-123.pdf',
        originalName: 'Test File.pdf',
        mimetype: 'application/pdf',
        size: 52428801, // 50MB + 1 byte
        path: '/uploads/project/test-file-123.pdf',
        entityType: 'project',
        entityId: testEntityId
      };

      const file = new File(fileData);
      
      await expect(file.save()).rejects.toMatchObject({
        errors: {
          size: expect.objectContaining({
            message: 'File size cannot exceed 50MB'
          })
        }
      });
    });

    test('should accept valid entity types', async () => {
      const validEntityTypes = ['project', 'task', 'blog'];
      
      for (const entityType of validEntityTypes) {
        const fileData = {
          filename: `test-file-${entityType}.pdf`,
          originalName: 'Test File.pdf',
          mimetype: 'application/pdf',
          size: 1024,
          path: `/uploads/${entityType}/test-file.pdf`,
          entityType,
          entityId: testEntityId
        };

        const file = new File(fileData);
        const savedFile = await file.save();
        
        expect(savedFile.entityType).toBe(entityType);
        
        // Clean up for next iteration
        await File.deleteMany({});
      }
    });

    test('should fail validation with invalid entity type', async () => {
      const fileData = {
        filename: 'test-file-123.pdf',
        originalName: 'Test File.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        path: '/uploads/project/test-file-123.pdf',
        entityType: 'invalid-entity',
        entityId: testEntityId
      };

      const file = new File(fileData);
      
      await expect(file.save()).rejects.toMatchObject({
        errors: {
          entityType: expect.objectContaining({
            message: 'Entity type must be project, task, or blog'
          })
        }
      });
    });

    test('should accept valid categories', async () => {
      const validCategories = ['document', 'image', 'attachment'];
      
      for (const category of validCategories) {
        const fileData = {
          filename: `test-file-${category}.pdf`,
          originalName: 'Test File.pdf',
          mimetype: 'application/pdf',
          size: 1024,
          path: `/uploads/project/test-file-${category}.pdf`,
          entityType: 'project',
          entityId: testEntityId,
          category
        };

        const file = new File(fileData);
        const savedFile = await file.save();
        
        expect(savedFile.category).toBe(category);
        
        // Clean up for next iteration
        await File.deleteMany({});
      }
    });

    test('should fail validation with invalid category', async () => {
      const fileData = {
        filename: 'test-file-123.pdf',
        originalName: 'Test File.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        path: '/uploads/project/test-file-123.pdf',
        entityType: 'project',
        entityId: testEntityId,
        category: 'invalid-category'
      };

      const file = new File(fileData);
      
      await expect(file.save()).rejects.toMatchObject({
        errors: {
          category: expect.objectContaining({
            message: 'Category must be document, image, or attachment'
          })
        }
      });
    });

    test('should enforce unique filename constraint', async () => {
      const fileData1 = {
        filename: 'unique-file.pdf',
        originalName: 'Test File 1.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        path: '/uploads/project/unique-file.pdf',
        entityType: 'project',
        entityId: testEntityId
      };

      const fileData2 = {
        filename: 'unique-file.pdf', // Same filename
        originalName: 'Test File 2.pdf',
        mimetype: 'application/pdf',
        size: 2048,
        path: '/uploads/task/unique-file.pdf',
        entityType: 'task',
        entityId: testEntityId
      };

      const file1 = new File(fileData1);
      await file1.save();

      const file2 = new File(fileData2);
      await expect(file2.save()).rejects.toMatchObject({
        code: 11000 // MongoDB duplicate key error
      });
    });
  });

  describe('Auto-category Detection', () => {
    test('should auto-detect image category from mimetype', async () => {
      const imageTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp'
      ];

      for (const mimetype of imageTypes) {
        const fileData = {
          filename: `test-image.${mimetype.split('/')[1]}`,
          originalName: `Test Image.${mimetype.split('/')[1]}`,
          mimetype,
          size: 1024,
          path: `/uploads/project/test-image.${mimetype.split('/')[1]}`,
          entityType: 'project',
          entityId: testEntityId
        };

        const file = new File(fileData);
        const savedFile = await file.save();
        
        expect(savedFile.category).toBe('image');
        
        // Clean up for next iteration
        await File.deleteMany({});
      }
    });

    test('should auto-detect document category from mimetype', async () => {
      const documentTypes = [
        'application/pdf',
        'application/msword',
        'text/plain',
        'text/markdown'
      ];

      for (const mimetype of documentTypes) {
        const extension = mimetype === 'application/pdf' ? 'pdf' : 
                         mimetype === 'application/msword' ? 'doc' :
                         mimetype === 'text/plain' ? 'txt' : 'md';

        const fileData = {
          filename: `test-document.${extension}`,
          originalName: `Test Document.${extension}`,
          mimetype,
          size: 1024,
          path: `/uploads/project/test-document.${extension}`,
          entityType: 'project',
          entityId: testEntityId
        };

        const file = new File(fileData);
        const savedFile = await file.save();
        
        expect(savedFile.category).toBe('document');
        
        // Clean up for next iteration
        await File.deleteMany({});
      }
    });

    test('should keep explicit category when provided', async () => {
      const fileData = {
        filename: 'test-image.jpg',
        originalName: 'Test Image.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        path: '/uploads/project/test-image.jpg',
        entityType: 'project',
        entityId: testEntityId,
        category: 'attachment' // Override auto-detection
      };

      const file = new File(fileData);
      const savedFile = await file.save();
      
      expect(savedFile.category).toBe('attachment');
    });
  });

  describe('Virtual Properties', () => {
    test('should return correct file extension', async () => {
      const fileData = {
        filename: 'test-file-123.pdf',
        originalName: 'Test File.PDF', // Mixed case
        mimetype: 'application/pdf',
        size: 1024,
        path: '/uploads/project/test-file-123.pdf',
        entityType: 'project',
        entityId: testEntityId
      };

      const file = new File(fileData);
      const savedFile = await file.save();

      expect(savedFile.extension).toBe('.pdf');
    });

    test('should return human-readable file size', async () => {
      const testCases = [
        { size: 512, expected: '512.00 Bytes' },
        { size: 1024, expected: '1.00 KB' },
        { size: 1048576, expected: '1.00 MB' },
        { size: 1073741824, expected: '1.00 GB' }
      ];

      for (const testCase of testCases) {
        const fileData = {
          filename: `test-file-${testCase.size}.txt`,
          originalName: 'Test File.txt',
          mimetype: 'text/plain',
          size: testCase.size,
          path: `/uploads/project/test-file-${testCase.size}.txt`,
          entityType: 'project',
          entityId: testEntityId
        };

        const file = new File(fileData);
        const savedFile = await file.save();
        
        expect(savedFile.humanSize).toBe(testCase.expected);
        
        // Clean up for next iteration
        await File.deleteMany({});
      }
    });

    test('should calculate age in days correctly', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const fileData = {
        filename: 'old-file.txt',
        originalName: 'Old File.txt',
        mimetype: 'text/plain',
        size: 1024,
        path: '/uploads/project/old-file.txt',
        entityType: 'project',
        entityId: testEntityId,
        uploadDate: yesterday
      };

      const file = new File(fileData);
      const savedFile = await file.save();

      expect(savedFile.ageInDays).toBe(1);
    });

    test('should return correct download URL', async () => {
      const fileData = {
        filename: 'test-file.pdf',
        originalName: 'Test File.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        path: '/uploads/project/test-file.pdf',
        entityType: 'project',
        entityId: testEntityId
      };

      const file = new File(fileData);
      const savedFile = await file.save();

      expect(savedFile.downloadUrl).toBe(`/api/v1/files/${savedFile._id}`);
    });

    test('should return thumbnail URL for images', async () => {
      const fileData = {
        filename: 'test-image.jpg',
        originalName: 'Test Image.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        path: '/uploads/project/test-image.jpg',
        entityType: 'project',
        entityId: testEntityId
      };

      const file = new File(fileData);
      const savedFile = await file.save();

      expect(savedFile.thumbnailUrl).toBe(`/api/v1/files/${savedFile._id}/thumbnail`);
    });

    test('should return null thumbnail URL for non-images', async () => {
      const fileData = {
        filename: 'test-document.pdf',
        originalName: 'Test Document.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        path: '/uploads/project/test-document.pdf',
        entityType: 'project',
        entityId: testEntityId
      };

      const file = new File(fileData);
      const savedFile = await file.save();

      expect(savedFile.thumbnailUrl).toBeNull();
    });

    test('should correctly identify images', async () => {
      const imageFile = new File({
        filename: 'test-image.jpg',
        originalName: 'Test Image.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        path: '/uploads/project/test-image.jpg',
        entityType: 'project',
        entityId: testEntityId
      });

      const documentFile = new File({
        filename: 'test-document.pdf',
        originalName: 'Test Document.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        path: '/uploads/project/test-document.pdf',
        entityType: 'project',
        entityId: testEntityId
      });

      const savedImageFile = await imageFile.save();
      const savedDocumentFile = await documentFile.save();

      expect(savedImageFile.isImage).toBe(true);
      expect(savedDocumentFile.isImage).toBe(false);
    });

    test('should correctly identify documents', async () => {
      const documentFile = new File({
        filename: 'test-document.pdf',
        originalName: 'Test Document.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        path: '/uploads/project/test-document.pdf',
        entityType: 'project',
        entityId: testEntityId
      });

      const imageFile = new File({
        filename: 'test-image.jpg',
        originalName: 'Test Image.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        path: '/uploads/project/test-image.jpg',
        entityType: 'project',
        entityId: testEntityId
      });

      const savedDocumentFile = await documentFile.save();
      const savedImageFile = await imageFile.save();

      expect(savedDocumentFile.isDocument).toBe(true);
      expect(savedImageFile.isDocument).toBe(false);
    });
  });

  describe('Instance Methods', () => {
    let testFile;

    beforeEach(async () => {
      const fileData = {
        filename: 'test-file.pdf',
        originalName: 'Test File.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        path: '/uploads/project/test-file.pdf',
        entityType: 'project',
        entityId: testEntityId,
        downloadCount: 5
      };

      testFile = new File(fileData);
      await testFile.save();
    });

    test('incrementDownloadCount should increase download count and update last accessed', async () => {
      const originalLastAccessed = testFile.lastAccessed;
      const originalCount = testFile.downloadCount;

      await testFile.incrementDownloadCount();

      expect(testFile.downloadCount).toBe(originalCount + 1);
      expect(testFile.lastAccessed.getTime()).toBeGreaterThan(originalLastAccessed.getTime());
    });

    test('updateMetadata should merge new metadata with existing', async () => {
      await testFile.updateMetadata({
        dimensions: { width: 800, height: 600 },
        encoding: 'UTF-8'
      });

      expect(testFile.metadata.dimensions.width).toBe(800);
      expect(testFile.metadata.dimensions.height).toBe(600);
      expect(testFile.metadata.encoding).toBe('UTF-8');

      // Add more metadata
      await testFile.updateMetadata({
        duration: 120,
        pageCount: 5
      });

      expect(testFile.metadata.dimensions.width).toBe(800); // Should persist
      expect(testFile.metadata.duration).toBe(120);
      expect(testFile.metadata.pageCount).toBe(5);
    });

    test('deactivate should set isActive to false and update description', async () => {
      await testFile.deactivate('File corrupted');

      expect(testFile.isActive).toBe(false);
      expect(testFile.description).toBe('[DEACTIVATED: File corrupted]');
    });

    test('deactivate should append to existing description', async () => {
      testFile.description = 'Original description';
      await testFile.save();

      await testFile.deactivate('Security concern');

      expect(testFile.description).toBe('Original description [DEACTIVATED: Security concern]');
    });

    test('activate should set isActive to true and remove deactivation message', async () => {
      await testFile.deactivate('Test deactivation');
      expect(testFile.isActive).toBe(false);

      await testFile.activate();

      expect(testFile.isActive).toBe(true);
      expect(testFile.description).toBe('');
    });

    test('activate should preserve non-deactivation description text', async () => {
      testFile.description = 'Important file [DEACTIVATED: Test]';
      await testFile.save();

      await testFile.activate();

      expect(testFile.description).toBe('Important file');
    });

    test('getFileStats should return comprehensive file information', async () => {
      const stats = testFile.getFileStats();

      expect(stats).toHaveProperty('id');
      expect(stats).toHaveProperty('filename', 'test-file.pdf');
      expect(stats).toHaveProperty('originalName', 'Test File.pdf');
      expect(stats).toHaveProperty('size', 1024);
      expect(stats).toHaveProperty('humanSize');
      expect(stats).toHaveProperty('mimetype', 'application/pdf');
      expect(stats).toHaveProperty('category', 'document');
      expect(stats).toHaveProperty('extension', '.pdf');
      expect(stats).toHaveProperty('uploadDate');
      expect(stats).toHaveProperty('ageInDays');
      expect(stats).toHaveProperty('downloadCount', 5);
      expect(stats).toHaveProperty('lastAccessed');
      expect(stats).toHaveProperty('isActive', true);
      expect(stats).toHaveProperty('isImage', false);
      expect(stats).toHaveProperty('isDocument', true);
    });
  });

  describe('Static Methods', () => {
    beforeEach(async () => {
      // Create test files
      const files = [
        {
          filename: 'project-image.jpg',
          originalName: 'Project Image.jpg',
          mimetype: 'image/jpeg',
          size: 2048,
          path: '/uploads/project/project-image.jpg',
          entityType: 'project',
          entityId: testEntityId,
          category: 'image'
        },
        {
          filename: 'project-document.pdf',
          originalName: 'Project Document.pdf',
          mimetype: 'application/pdf',
          size: 1048576, // 1MB
          path: '/uploads/project/project-document.pdf',
          entityType: 'project',
          entityId: testEntityId,
          category: 'document'
        },
        {
          filename: 'task-attachment.zip',
          originalName: 'Task Attachment.zip',
          mimetype: 'application/zip',
          size: 5242880, // 5MB
          path: '/uploads/task/task-attachment.zip',
          entityType: 'task',
          entityId: testEntityId,
          category: 'attachment'
        }
      ];

      await File.insertMany(files);
    });

    test('findByEntity should find all files for an entity', async () => {
      const files = await File.findByEntity('project', testEntityId);
      
      expect(files).toHaveLength(2);
      files.forEach(file => {
        expect(file.entityType).toBe('project');
        expect(file.entityId.toString()).toBe(testEntityId.toString());
      });
    });

    test('findByEntity should filter by category', async () => {
      const imageFiles = await File.findByEntity('project', testEntityId, { category: 'image' });
      
      expect(imageFiles).toHaveLength(1);
      expect(imageFiles[0].category).toBe('image');
    });

    test('findByEntity should filter by mimetype', async () => {
      const pdfFiles = await File.findByEntity('project', testEntityId, { mimetype: 'pdf' });
      
      expect(pdfFiles).toHaveLength(1);
      expect(pdfFiles[0].mimetype).toBe('application/pdf');
    });

    test('findByEntity should include inactive files when requested', async () => {
      // Deactivate one file
      const file = await File.findOne({ filename: 'project-image.jpg' });
      await file.deactivate('Test');

      const activeFiles = await File.findByEntity('project', testEntityId);
      expect(activeFiles).toHaveLength(1);

      const allFiles = await File.findByEntity('project', testEntityId, { includeInactive: true });
      expect(allFiles).toHaveLength(2);
    });

    test('findByMimetype should find files by mimetype pattern', async () => {
      const imageFiles = await File.findByMimetype('image');
      
      expect(imageFiles).toHaveLength(1);
      expect(imageFiles[0].mimetype).toBe('image/jpeg');
    });

    test('findLargeFiles should find files above size threshold', async () => {
      const largeFiles = await File.findLargeFiles(1000000); // 1MB threshold
      
      expect(largeFiles).toHaveLength(2); // 1MB PDF and 5MB ZIP
      expect(largeFiles[0].size).toBeGreaterThanOrEqual(1000000);
    });

    test('findOldFiles should find files older than specified days', async () => {
      // Create an old file
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 31);

      const oldFile = new File({
        filename: 'old-file.txt',
        originalName: 'Old File.txt',
        mimetype: 'text/plain',
        size: 512,
        path: '/uploads/project/old-file.txt',
        entityType: 'project',
        entityId: testEntityId,
        uploadDate: oldDate
      });
      await oldFile.save();

      const oldFiles = await File.findOldFiles(30);
      
      expect(oldFiles).toHaveLength(1);
      expect(oldFiles[0].filename).toBe('old-file.txt');
    });

    test('getStorageStatistics should return correct statistics', async () => {
      const stats = await File.getStorageStatistics();
      
      expect(stats).toHaveLength(1);
      expect(stats[0].totalFiles).toBe(3);
      expect(stats[0].totalSize).toBe(2048 + 1048576 + 5242880); // Sum of all file sizes
      expect(stats[0].averageSize).toBeGreaterThan(0);
      expect(stats[0].largestFile).toBe(5242880);
      expect(stats[0].smallestFile).toBe(2048);
    });
  });

  describe('Metadata Validation', () => {
    test('should accept valid image metadata', async () => {
      const fileData = {
        filename: 'test-image.jpg',
        originalName: 'Test Image.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        path: '/uploads/project/test-image.jpg',
        entityType: 'project',
        entityId: testEntityId,
        metadata: {
          dimensions: {
            width: 1920,
            height: 1080
          }
        }
      };

      const file = new File(fileData);
      const savedFile = await file.save();

      expect(savedFile.metadata.dimensions.width).toBe(1920);
      expect(savedFile.metadata.dimensions.height).toBe(1080);
    });

    test('should accept valid document metadata', async () => {
      const fileData = {
        filename: 'test-document.pdf',
        originalName: 'Test Document.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        path: '/uploads/project/test-document.pdf',
        entityType: 'project',
        entityId: testEntityId,
        metadata: {
          pageCount: 10,
          encoding: 'UTF-8'
        }
      };

      const file = new File(fileData);
      const savedFile = await file.save();

      expect(savedFile.metadata.pageCount).toBe(10);
      expect(savedFile.metadata.encoding).toBe('UTF-8');
    });

    test('should fail validation with negative dimensions', async () => {
      const fileData = {
        filename: 'test-image.jpg',
        originalName: 'Test Image.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        path: '/uploads/project/test-image.jpg',
        entityType: 'project',
        entityId: testEntityId,
        metadata: {
          dimensions: {
            width: -100,
            height: 1080
          }
        }
      };

      const file = new File(fileData);
      
      await expect(file.save()).rejects.toMatchObject({
        errors: {
          'metadata.dimensions.width': expect.objectContaining({
            message: 'Width must be positive'
          })
        }
      });
    });

    test('should fail validation with negative duration', async () => {
      const fileData = {
        filename: 'test-video.mp4',
        originalName: 'Test Video.mp4',
        mimetype: 'video/mp4',
        size: 1024,
        path: '/uploads/project/test-video.mp4',
        entityType: 'project',
        entityId: testEntityId,
        metadata: {
          duration: -60
        }
      };

      const file = new File(fileData);
      
      await expect(file.save()).rejects.toMatchObject({
        errors: {
          'metadata.duration': expect.objectContaining({
            message: 'Duration cannot be negative'
          })
        }
      });
    });

    test('should fail validation with invalid page count', async () => {
      const fileData = {
        filename: 'test-document.pdf',
        originalName: 'Test Document.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        path: '/uploads/project/test-document.pdf',
        entityType: 'project',
        entityId: testEntityId,
        metadata: {
          pageCount: 0
        }
      };

      const file = new File(fileData);
      
      await expect(file.save()).rejects.toMatchObject({
        errors: {
          'metadata.pageCount': expect.objectContaining({
            message: 'Page count must be at least 1'
          })
        }
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle files with no extension', async () => {
      const fileData = {
        filename: 'readme-file',
        originalName: 'README',
        mimetype: 'text/plain',
        size: 1024,
        path: '/uploads/project/readme-file',
        entityType: 'project',
        entityId: testEntityId
      };

      const file = new File(fileData);
      const savedFile = await file.save();

      expect(savedFile.extension).toBe('');
    });

    test('should handle very small files', async () => {
      const fileData = {
        filename: 'tiny-file.txt',
        originalName: 'Tiny File.txt',
        mimetype: 'text/plain',
        size: 0,
        path: '/uploads/project/tiny-file.txt',
        entityType: 'project',
        entityId: testEntityId
      };

      const file = new File(fileData);
      const savedFile = await file.save();

      expect(savedFile.humanSize).toBe('0 Bytes');
    });

    test('should trim whitespace from string fields', async () => {
      const fileData = {
        filename: '  test-file.pdf  ',
        originalName: '  Test File.pdf  ',
        mimetype: '  application/pdf  ',
        size: 1024,
        path: '  /uploads/project/test-file.pdf  ',
        entityType: 'project',
        entityId: testEntityId,
        description: '  Test file description  '
      };

      const file = new File(fileData);
      const savedFile = await file.save();

      expect(savedFile.filename).toBe('test-file.pdf');
      expect(savedFile.originalName).toBe('Test File.pdf');
      expect(savedFile.mimetype).toBe('application/pdf');
      expect(savedFile.path).toBe('/uploads/project/test-file.pdf');
      expect(savedFile.description).toBe('Test file description');
    });

    test('should handle maximum allowed file size', async () => {
      const fileData = {
        filename: 'max-size-file.zip',
        originalName: 'Max Size File.zip',
        mimetype: 'application/zip',
        size: 52428800, // Exactly 50MB
        path: '/uploads/project/max-size-file.zip',
        entityType: 'project',
        entityId: testEntityId
      };

      const file = new File(fileData);
      const savedFile = await file.save();

      expect(savedFile.size).toBe(52428800);
      expect(savedFile.humanSize).toBe('50.00 MB');
    });
  });
});