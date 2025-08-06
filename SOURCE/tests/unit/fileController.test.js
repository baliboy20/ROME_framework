const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../../backend/server');

// Mock the database connection for testing
jest.mock('../../backend/config/database', () => ({
  connect: jest.fn().mockResolvedValue(true),
  getConnectionStatus: jest.fn().mockReturnValue('connected'),
  isDbConnected: jest.fn().mockReturnValue(true)
}));

describe('File Controller', () => {
  const testUploadDir = path.join(process.cwd(), 'uploads', 'test');
  const testImagePath = path.join(__dirname, 'fixtures', 'test-image.png');
  const testDocumentPath = path.join(__dirname, 'fixtures', 'test-document.pdf');

  beforeAll(() => {
    // Create test directories
    ['uploads', 'uploads/images', 'uploads/documents', 'uploads/attachments'].forEach(dir => {
      const fullPath = path.join(process.cwd(), dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });

    // Create test fixtures directory
    const fixturesDir = path.join(__dirname, 'fixtures');
    if (!fs.existsSync(fixturesDir)) {
      fs.mkdirSync(fixturesDir, { recursive: true });
    }

    // Create test image file (1x1 PNG)
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
      0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
      0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
      0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42,
      0x60, 0x82
    ]);
    fs.writeFileSync(testImagePath, pngBuffer);

    // Create test PDF file
    const pdfContent = '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n174\n%%EOF';
    fs.writeFileSync(testDocumentPath, pdfContent);
  });

  afterAll(() => {
    // Clean up test files
    const cleanupPaths = [testImagePath, testDocumentPath];
    cleanupPaths.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    // Clean up upload directories
    const uploadDirs = ['uploads/images', 'uploads/documents', 'uploads/attachments'];
    uploadDirs.forEach(dir => {
      const fullPath = path.join(process.cwd(), dir);
      if (fs.existsSync(fullPath)) {
        const files = fs.readdirSync(fullPath);
        files.forEach(file => {
          fs.unlinkSync(path.join(fullPath, file));
        });
      }
    });
  });

  beforeEach(() => {
    // Clean up uploaded files before each test
    const uploadDirs = ['uploads/images', 'uploads/documents', 'uploads/attachments'];
    uploadDirs.forEach(dir => {
      const fullPath = path.join(process.cwd(), dir);
      if (fs.existsSync(fullPath)) {
        const files = fs.readdirSync(fullPath);
        files.forEach(file => {
          const filePath = path.join(fullPath, file);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
      }
    });
  });

  describe('POST /api/v1/files/single', () => {
    it('should upload single image file successfully', async () => {
      const response = await request(app)
        .post('/api/v1/files/single')
        .attach('file', testImagePath)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.originalName).toBe('test-image.png');
      expect(response.body.data.mimetype).toBe('image/png');
      expect(response.body.data.filename).toBeDefined();
      expect(response.body.data.url).toContain('/api/v1/files/');
      expect(response.body.data.publicUrl).toContain('http');
      expect(response.body.message).toBe('File uploaded successfully');
    });

    it('should upload single document file successfully', async () => {
      const response = await request(app)
        .post('/api/v1/files/single')
        .attach('file', testDocumentPath)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.originalName).toBe('test-document.pdf');
      expect(response.body.data.mimetype).toBe('application/pdf');
      expect(response.body.data.filename).toBeDefined();
    });

    it('should fail without file', async () => {
      const response = await request(app)
        .post('/api/v1/files/single')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('No file uploaded');
    });

    it('should fail with unsupported file type', async () => {
      // Create a temporary unsupported file
      const unsupportedPath = path.join(__dirname, 'fixtures', 'test.exe');
      fs.writeFileSync(unsupportedPath, 'fake executable content');

      const response = await request(app)
        .post('/api/v1/files/single')
        .attach('file', unsupportedPath)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('is not allowed');

      // Clean up
      fs.unlinkSync(unsupportedPath);
    });
  });

  describe('POST /api/v1/files/multiple', () => {
    it('should upload multiple files successfully', async () => {
      const response = await request(app)
        .post('/api/v1/files/multiple')
        .attach('files', testImagePath)
        .attach('files', testDocumentPath)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.count).toBe(2);
      expect(response.body.message).toBe('2 files uploaded successfully');
    });

    it('should fail without files', async () => {
      const response = await request(app)
        .post('/api/v1/files/multiple')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('No files uploaded');
    });
  });

  describe('POST /api/v1/files/image', () => {
    it('should upload image file successfully', async () => {
      const response = await request(app)
        .post('/api/v1/files/image')
        .attach('image', testImagePath)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.type).toBe('image');
      expect(response.body.data.mimetype).toBe('image/png');
      expect(response.body.message).toBe('Image uploaded successfully');
    });

    it('should fail with non-image file', async () => {
      const response = await request(app)
        .post('/api/v1/files/image')
        .attach('image', testDocumentPath)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('File must be an image');
    });

    it('should fail without image', async () => {
      const response = await request(app)
        .post('/api/v1/files/image')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('No image uploaded');
    });
  });

  describe('POST /api/v1/files/document', () => {
    it('should upload document file successfully', async () => {
      const response = await request(app)
        .post('/api/v1/files/document')
        .attach('document', testDocumentPath)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.type).toBe('document');
      expect(response.body.data.mimetype).toBe('application/pdf');
      expect(response.body.message).toBe('Document uploaded successfully');
    });

    it('should fail with non-document file', async () => {
      const response = await request(app)
        .post('/api/v1/files/document')
        .attach('document', testImagePath)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('File must be a document (PDF, Word, Excel, or text)');
    });

    it('should fail without document', async () => {
      const response = await request(app)
        .post('/api/v1/files/document')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('No document uploaded');
    });
  });

  describe('GET /api/v1/files', () => {
    beforeEach(async () => {
      // Upload some test files first
      await request(app)
        .post('/api/v1/files/single')
        .attach('file', testImagePath);
      
      await request(app)
        .post('/api/v1/files/single')
        .attach('file', testDocumentPath);
    });

    it('should get list of uploaded files', async () => {
      const response = await request(app)
        .get('/api/v1/files')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.count).toBe(2);
      
      const files = response.body.data;
      expect(files[0].filename).toBeDefined();
      expect(files[0].size).toBeDefined();
      expect(files[0].uploadDate).toBeDefined();
      expect(files[0].url).toBeDefined();
      expect(files[0].publicUrl).toBeDefined();
    });

    it('should return empty list when no files exist', async () => {
      // Clean up all files first
      const uploadDirs = ['uploads/images', 'uploads/documents', 'uploads/attachments'];
      uploadDirs.forEach(dir => {
        const fullPath = path.join(process.cwd(), dir);
        if (fs.existsSync(fullPath)) {
          const files = fs.readdirSync(fullPath);
          files.forEach(file => {
            fs.unlinkSync(path.join(fullPath, file));
          });
        }
      });

      const response = await request(app)
        .get('/api/v1/files')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.count).toBe(0);
    });
  });

  describe('GET /api/v1/files/:filename', () => {
    let uploadedFilename;

    beforeEach(async () => {
      // Upload a test file first
      const uploadResponse = await request(app)
        .post('/api/v1/files/single')
        .attach('file', testImagePath);
      
      uploadedFilename = uploadResponse.body.data.filename;
    });

    it('should download/view file successfully', async () => {
      const response = await request(app)
        .get(`/api/v1/files/${uploadedFilename}`)
        .expect(200);

      expect(response.headers['content-type']).toBe('image/png');
      expect(response.headers['content-disposition']).toContain('inline');
      expect(response.headers['cache-control']).toBe('public, max-age=86400');
    });

    it('should return 404 for non-existent file', async () => {
      const response = await request(app)
        .get('/api/v1/files/nonexistent.png')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('File not found');
    });

    it('should return 400 for invalid filename with path traversal', async () => {
      const response = await request(app)
        .get('/api/v1/files/../../../etc/passwd')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Invalid filename');
    });

    it('should set correct content-disposition for documents', async () => {
      // Upload a document first
      const uploadResponse = await request(app)
        .post('/api/v1/files/single')
        .attach('file', testDocumentPath);
      
      const documentFilename = uploadResponse.body.data.filename;

      const response = await request(app)
        .get(`/api/v1/files/${documentFilename}`)
        .expect(200);

      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.headers['content-disposition']).toContain('attachment');
    });
  });

  describe('DELETE /api/v1/files/:filename', () => {
    let uploadedFilename;

    beforeEach(async () => {
      // Upload a test file first
      const uploadResponse = await request(app)
        .post('/api/v1/files/single')
        .attach('file', testImagePath);
      
      uploadedFilename = uploadResponse.body.data.filename;
    });

    it('should delete file successfully', async () => {
      const response = await request(app)
        .delete(`/api/v1/files/${uploadedFilename}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('File deleted successfully');
      expect(response.body.filename).toBe(uploadedFilename);

      // Verify file is actually deleted
      const getResponse = await request(app)
        .get(`/api/v1/files/${uploadedFilename}`)
        .expect(404);
    });

    it('should return 404 for non-existent file', async () => {
      const response = await request(app)
        .delete('/api/v1/files/nonexistent.png')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('File not found');
    });

    it('should return 400 for invalid filename', async () => {
      const response = await request(app)
        .delete('/api/v1/files/../invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Invalid filename');
    });
  });

  describe('File Upload Validation', () => {
    it('should handle file size limit errors', async () => {
      // Create a large file (this would normally be caught by multer)
      const largePath = path.join(__dirname, 'fixtures', 'large-file.txt');
      const largeContent = 'x'.repeat(11 * 1024 * 1024); // 11MB
      fs.writeFileSync(largePath, largeContent);

      const response = await request(app)
        .post('/api/v1/files/single')
        .attach('file', largePath)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('File too large');

      // Clean up
      fs.unlinkSync(largePath);
    });

    it('should handle multiple file upload limits', async () => {
      // This test would require creating 6 files and uploading them
      const promises = [];
      for (let i = 0; i < 6; i++) {
        const tempPath = path.join(__dirname, 'fixtures', `temp-${i}.txt`);
        fs.writeFileSync(tempPath, `test content ${i}`);
        promises.push(tempPath);
      }

      let request_builder = request(app).post('/api/v1/files/multiple');
      promises.forEach(filePath => {
        request_builder = request_builder.attach('files', filePath);
      });

      const response = await request_builder.expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Too many files');

      // Clean up
      promises.forEach(filePath => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    });
  });

  describe('File Upload Security', () => {
    it('should prevent directory traversal in uploaded filenames', async () => {
      // Create a file with a malicious name
      const maliciousPath = path.join(__dirname, 'fixtures', '../../../malicious.txt');
      const tempPath = path.join(__dirname, 'fixtures', 'malicious.txt');
      fs.writeFileSync(tempPath, 'malicious content');

      const response = await request(app)
        .post('/api/v1/files/single')
        .attach('file', tempPath)
        .expect(201);

      expect(response.body.success).toBe(true);
      // Filename should be sanitized
      expect(response.body.data.filename).not.toContain('..');
      expect(response.body.data.filename).not.toContain('/');

      // Clean up
      fs.unlinkSync(tempPath);
    });

    it('should sanitize filenames with special characters', async () => {
      const specialPath = path.join(__dirname, 'fixtures', 'file with spaces & symbols!@#.txt');
      fs.writeFileSync(specialPath, 'test content');

      const response = await request(app)
        .post('/api/v1/files/single')
        .attach('file', specialPath)
        .expect(201);

      expect(response.body.success).toBe(true);
      // Filename should be sanitized (spaces and special chars replaced with _)
      expect(response.body.data.filename).toMatch(/^file_with_spaces____symbols____\d+_\d+\.txt$/);

      // Clean up
      fs.unlinkSync(specialPath);
    });
  });
});