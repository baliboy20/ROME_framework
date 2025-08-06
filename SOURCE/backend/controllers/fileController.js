const path = require('path');
const fs = require('fs');
const { ApiError, logger } = require('../middleware/errorHandler');
const { asyncHandler } = require('../middleware/errorHandler');
const { deleteFile, getFileInfo } = require('../middleware/upload');

/**
 * @desc    Upload single file
 * @route   POST /api/v1/files/single
 * @access  Public
 */
const uploadSingleFile = asyncHandler(async (req, res) => {
  try {
    logger.info('POST /api/v1/files/single - Single file upload', {
      file: req.fileInfo,
      ip: req.ip
    });

    if (!req.file) {
      throw new ApiError('No file uploaded', 400);
    }

    const fileData = {
      ...req.fileInfo,
      url: `/api/v1/files/${req.file.filename}`,
      publicUrl: `${req.protocol}://${req.get('host')}/api/v1/files/${req.file.filename}`
    };

    logger.info('Single file uploaded successfully', {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    });

    res.status(201).json({
      success: true,
      data: fileData,
      message: 'File uploaded successfully'
    });

  } catch (error) {
    // Clean up uploaded file if there was an error
    if (req.file) {
      deleteFile(req.file.path);
    }
    logger.error('Error uploading single file', { error: error.message });
    throw error;
  }
});

/**
 * @desc    Upload multiple files
 * @route   POST /api/v1/files/multiple
 * @access  Public
 */
const uploadMultipleFiles = asyncHandler(async (req, res) => {
  try {
    logger.info('POST /api/v1/files/multiple - Multiple files upload', {
      fileCount: req.files ? req.files.length : 0,
      ip: req.ip
    });

    if (!req.files || req.files.length === 0) {
      throw new ApiError('No files uploaded', 400);
    }

    const filesData = req.files.map(file => {
      const fileInfo = getFileInfo(file);
      return {
        ...fileInfo,
        url: `/api/v1/files/${file.filename}`,
        publicUrl: `${req.protocol}://${req.get('host')}/api/v1/files/${file.filename}`
      };
    });

    logger.info('Multiple files uploaded successfully', {
      count: req.files.length,
      files: req.files.map(f => ({ name: f.filename, size: f.size }))
    });

    res.status(201).json({
      success: true,
      data: filesData,
      count: filesData.length,
      message: `${filesData.length} files uploaded successfully`
    });

  } catch (error) {
    // Clean up uploaded files if there was an error
    if (req.files) {
      req.files.forEach(file => {
        deleteFile(file.path);
      });
    }
    logger.error('Error uploading multiple files', { error: error.message });
    throw error;
  }
});

/**
 * @desc    Upload image file
 * @route   POST /api/v1/files/image
 * @access  Public
 */
const uploadImage = asyncHandler(async (req, res) => {
  try {
    logger.info('POST /api/v1/files/image - Image upload', {
      file: req.fileInfo,
      ip: req.ip
    });

    if (!req.file) {
      throw new ApiError('No image uploaded', 400);
    }

    // Validate that it's actually an image
    if (!req.file.mimetype.startsWith('image/')) {
      deleteFile(req.file.path);
      throw new ApiError('File must be an image', 400);
    }

    const imageData = {
      ...req.fileInfo,
      url: `/api/v1/files/${req.file.filename}`,
      publicUrl: `${req.protocol}://${req.get('host')}/api/v1/files/${req.file.filename}`,
      type: 'image',
      dimensions: null // Could add image dimension detection here
    };

    logger.info('Image uploaded successfully', {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    res.status(201).json({
      success: true,
      data: imageData,
      message: 'Image uploaded successfully'
    });

  } catch (error) {
    if (req.file) {
      deleteFile(req.file.path);
    }
    logger.error('Error uploading image', { error: error.message });
    throw error;
  }
});

/**
 * @desc    Upload document file
 * @route   POST /api/v1/files/document
 * @access  Public
 */
const uploadDocument = asyncHandler(async (req, res) => {
  try {
    logger.info('POST /api/v1/files/document - Document upload', {
      file: req.fileInfo,
      ip: req.ip
    });

    if (!req.file) {
      throw new ApiError('No document uploaded', 400);
    }

    const documentTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv'
    ];

    // Validate that it's a document
    if (!documentTypes.includes(req.file.mimetype)) {
      deleteFile(req.file.path);
      throw new ApiError('File must be a document (PDF, Word, Excel, or text)', 400);
    }

    const documentData = {
      ...req.fileInfo,
      url: `/api/v1/files/${req.file.filename}`,
      publicUrl: `${req.protocol}://${req.get('host')}/api/v1/files/${req.file.filename}`,
      type: 'document'
    };

    logger.info('Document uploaded successfully', {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    res.status(201).json({
      success: true,
      data: documentData,
      message: 'Document uploaded successfully'
    });

  } catch (error) {
    if (req.file) {
      deleteFile(req.file.path);
    }
    logger.error('Error uploading document', { error: error.message });
    throw error;
  }
});

/**
 * @desc    Get/Download file
 * @route   GET /api/v1/files/:filename
 * @access  Public
 */
const getFile = asyncHandler(async (req, res) => {
  try {
    const { filename } = req.params;
    
    logger.info('GET /api/v1/files/:filename - File download', {
      filename,
      ip: req.ip
    });

    // Security: Prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      logger.warn('Potential directory traversal attempt', { filename, ip: req.ip });
      throw new ApiError('Invalid filename', 400);
    }

    // Look for file in all upload directories
    const uploadDirs = ['uploads/images', 'uploads/documents', 'uploads/attachments'];
    let filePath = null;
    let fileExists = false;

    for (const dir of uploadDirs) {
      const testPath = path.join(process.cwd(), dir, filename);
      if (fs.existsSync(testPath)) {
        filePath = testPath;
        fileExists = true;
        break;
      }
    }

    if (!fileExists || !filePath) {
      logger.warn('File not found', { filename });
      throw new ApiError('File not found', 404);
    }

    // Get file stats
    const stats = fs.statSync(filePath);
    const ext = path.extname(filename).toLowerCase();
    
    // Determine content type
    const contentTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.txt': 'text/plain',
      '.csv': 'text/csv',
      '.zip': 'application/zip'
    };

    const contentType = contentTypes[ext] || 'application/octet-stream';

    // Set appropriate headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours cache

    // If it's an image, display inline; otherwise, force download
    if (contentType.startsWith('image/')) {
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    } else {
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    }

    logger.info('File served successfully', {
      filename,
      contentType,
      size: stats.size
    });

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    logger.error('Error serving file', { error: error.message, filename: req.params.filename });
    throw error;
  }
});

/**
 * @desc    Delete file
 * @route   DELETE /api/v1/files/:filename
 * @access  Public
 */
const deleteUploadedFile = asyncHandler(async (req, res) => {
  try {
    const { filename } = req.params;
    
    logger.info('DELETE /api/v1/files/:filename - File deletion', {
      filename,
      ip: req.ip
    });

    // Security: Prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      logger.warn('Potential directory traversal attempt in delete', { filename, ip: req.ip });
      throw new ApiError('Invalid filename', 400);
    }

    // Look for file in all upload directories
    const uploadDirs = ['uploads/images', 'uploads/documents', 'uploads/attachments'];
    let filePath = null;
    let fileExists = false;

    for (const dir of uploadDirs) {
      const testPath = path.join(process.cwd(), dir, filename);
      if (fs.existsSync(testPath)) {
        filePath = testPath;
        fileExists = true;
        break;
      }
    }

    if (!fileExists || !filePath) {
      logger.warn('File not found for deletion', { filename });
      throw new ApiError('File not found', 404);
    }

    const deleted = deleteFile(filePath);

    if (!deleted) {
      throw new ApiError('Failed to delete file', 500);
    }

    logger.info('File deleted successfully', { filename });

    res.status(200).json({
      success: true,
      message: 'File deleted successfully',
      filename
    });

  } catch (error) {
    logger.error('Error deleting file', { error: error.message, filename: req.params.filename });
    throw error;
  }
});

/**
 * @desc    Get file list
 * @route   GET /api/v1/files
 * @access  Public
 */
const getFileList = asyncHandler(async (req, res) => {
  try {
    logger.info('GET /api/v1/files - Getting file list', { ip: req.ip });

    const uploadDirs = ['uploads/images', 'uploads/documents', 'uploads/attachments'];
    const files = [];

    uploadDirs.forEach(dir => {
      const fullPath = path.join(process.cwd(), dir);
      if (fs.existsSync(fullPath)) {
        const dirFiles = fs.readdirSync(fullPath);
        dirFiles.forEach(filename => {
          const filePath = path.join(fullPath, filename);
          const stats = fs.statSync(filePath);
          
          if (stats.isFile()) {
            files.push({
              filename,
              originalName: filename, // Could be enhanced to store original names
              size: stats.size,
              uploadDate: stats.birthtime,
              modifiedDate: stats.mtime,
              type: dir.split('/')[1], // images, documents, attachments
              url: `/api/v1/files/${filename}`,
              publicUrl: `${req.protocol}://${req.get('host')}/api/v1/files/${filename}`
            });
          }
        });
      }
    });

    // Sort by upload date (newest first)
    files.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));

    logger.info('File list retrieved successfully', { count: files.length });

    res.status(200).json({
      success: true,
      data: files,
      count: files.length
    });

  } catch (error) {
    logger.error('Error getting file list', { error: error.message });
    throw new ApiError('Failed to get file list', 500);
  }
});

module.exports = {
  uploadSingleFile,
  uploadMultipleFiles,
  uploadImage,
  uploadDocument,
  getFile,
  deleteUploadedFile,
  getFileList
};