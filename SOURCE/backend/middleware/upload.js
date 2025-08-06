const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { ApiError, logger } = require('./errorHandler');

// Create uploads directory if it doesn't exist
const createUploadDirs = () => {
  const dirs = [
    'uploads',
    'uploads/images',
    'uploads/documents',
    'uploads/attachments'
  ];
  
  dirs.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      logger.info(`Created upload directory: ${fullPath}`);
    }
  });
};

// Initialize upload directories
createUploadDirs();

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      let uploadPath = 'uploads/attachments'; // default
      
      // Determine upload path based on file type or request
      if (file.mimetype.startsWith('image/')) {
        uploadPath = 'uploads/images';
      } else if (file.mimetype === 'application/pdf' || 
                 file.mimetype.includes('document') ||
                 file.mimetype.includes('text')) {
        uploadPath = 'uploads/documents';
      }
      
      // Override based on request path or custom header
      if (req.path.includes('/images')) {
        uploadPath = 'uploads/images';
      } else if (req.path.includes('/documents')) {
        uploadPath = 'uploads/documents';
      }
      
      logger.info('File upload destination determined', {
        originalName: file.originalname,
        mimetype: file.mimetype,
        destination: uploadPath
      });
      
      cb(null, uploadPath);
    } catch (error) {
      logger.error('Error determining upload destination', { error: error.message });
      cb(error);
    }
  },
  
  filename: (req, file, cb) => {
    try {
      // Generate unique filename
      const timestamp = Date.now();
      const randomNum = Math.round(Math.random() * 1000);
      const ext = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, ext)
        .replace(/[^a-zA-Z0-9]/g, '_')
        .substring(0, 20);
      
      const filename = `${baseName}_${timestamp}_${randomNum}${ext}`;
      
      logger.info('Generated filename for upload', {
        originalName: file.originalname,
        generatedName: filename,
        mimetype: file.mimetype
      });
      
      cb(null, filename);
    } catch (error) {
      logger.error('Error generating filename', { error: error.message });
      cb(error);
    }
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  try {
    const allowedTypes = {
      images: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
      documents: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'text/csv'
      ],
      archives: [
        'application/zip',
        'application/x-zip-compressed',
        'application/x-rar-compressed',
        'application/x-7z-compressed'
      ]
    };
    
    const allAllowedTypes = [
      ...allowedTypes.images,
      ...allowedTypes.documents,
      ...allowedTypes.archives
    ];
    
    // Check if file type is allowed
    if (allAllowedTypes.includes(file.mimetype)) {
      logger.info('File type allowed for upload', {
        originalName: file.originalname,
        mimetype: file.mimetype
      });
      cb(null, true);
    } else {
      logger.warn('File type not allowed', {
        originalName: file.originalname,
        mimetype: file.mimetype,
        allowedTypes: allAllowedTypes
      });
      cb(new ApiError(`File type ${file.mimetype} is not allowed`, 400), false);
    }
  } catch (error) {
    logger.error('Error in file filter', { error: error.message });
    cb(error, false);
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files per request
  }
});

// Middleware for single file upload
const uploadSingle = (fieldName = 'file') => {
  return (req, res, next) => {
    const singleUpload = upload.single(fieldName);
    
    singleUpload(req, res, (err) => {
      try {
        if (err instanceof multer.MulterError) {
          logger.error('Multer error during single file upload', {
            error: err.message,
            code: err.code,
            field: err.field
          });
          
          switch (err.code) {
            case 'LIMIT_FILE_SIZE':
              return next(new ApiError('File too large. Maximum size is 10MB', 400));
            case 'LIMIT_FILE_COUNT':
              return next(new ApiError('Too many files. Maximum is 5 files', 400));
            case 'LIMIT_UNEXPECTED_FILE':
              return next(new ApiError(`Unexpected field: ${err.field}`, 400));
            default:
              return next(new ApiError(`Upload error: ${err.message}`, 400));
          }
        } else if (err) {
          logger.error('General error during single file upload', { error: err.message });
          return next(err);
        }
        
        // Log successful upload
        if (req.file) {
          logger.info('Single file uploaded successfully', {
            originalName: req.file.originalname,
            filename: req.file.filename,
            size: req.file.size,
            mimetype: req.file.mimetype,
            destination: req.file.destination
          });
        }
        
        next();
      } catch (error) {
        logger.error('Unexpected error in single upload middleware', { error: error.message });
        next(new ApiError('File upload failed', 500));
      }
    });
  };
};

// Middleware for multiple file upload
const uploadMultiple = (fieldName = 'files', maxCount = 5) => {
  return (req, res, next) => {
    const multipleUpload = upload.array(fieldName, maxCount);
    
    multipleUpload(req, res, (err) => {
      try {
        if (err instanceof multer.MulterError) {
          logger.error('Multer error during multiple file upload', {
            error: err.message,
            code: err.code,
            field: err.field
          });
          
          switch (err.code) {
            case 'LIMIT_FILE_SIZE':
              return next(new ApiError('One or more files are too large. Maximum size is 10MB per file', 400));
            case 'LIMIT_FILE_COUNT':
              return next(new ApiError(`Too many files. Maximum is ${maxCount} files`, 400));
            case 'LIMIT_UNEXPECTED_FILE':
              return next(new ApiError(`Unexpected field: ${err.field}`, 400));
            default:
              return next(new ApiError(`Upload error: ${err.message}`, 400));
          }
        } else if (err) {
          logger.error('General error during multiple file upload', { error: err.message });
          return next(err);
        }
        
        // Log successful uploads
        if (req.files && req.files.length > 0) {
          logger.info('Multiple files uploaded successfully', {
            count: req.files.length,
            files: req.files.map(file => ({
              originalName: file.originalname,
              filename: file.filename,
              size: file.size,
              mimetype: file.mimetype
            }))
          });
        }
        
        next();
      } catch (error) {
        logger.error('Unexpected error in multiple upload middleware', { error: error.message });
        next(new ApiError('File upload failed', 500));
      }
    });
  };
};

// Middleware for mixed field uploads
const uploadFields = (fields) => {
  return (req, res, next) => {
    const fieldsUpload = upload.fields(fields);
    
    fieldsUpload(req, res, (err) => {
      try {
        if (err instanceof multer.MulterError) {
          logger.error('Multer error during fields upload', {
            error: err.message,
            code: err.code,
            field: err.field
          });
          
          switch (err.code) {
            case 'LIMIT_FILE_SIZE':
              return next(new ApiError('One or more files are too large. Maximum size is 10MB per file', 400));
            case 'LIMIT_FILE_COUNT':
              return next(new ApiError('Too many files uploaded', 400));
            case 'LIMIT_UNEXPECTED_FILE':
              return next(new ApiError(`Unexpected field: ${err.field}`, 400));
            default:
              return next(new ApiError(`Upload error: ${err.message}`, 400));
          }
        } else if (err) {
          logger.error('General error during fields upload', { error: error.message });
          return next(err);
        }
        
        // Log successful uploads
        if (req.files) {
          const uploadedFiles = [];
          Object.keys(req.files).forEach(fieldName => {
            req.files[fieldName].forEach(file => {
              uploadedFiles.push({
                field: fieldName,
                originalName: file.originalname,
                filename: file.filename,
                size: file.size,
                mimetype: file.mimetype
              });
            });
          });
          
          if (uploadedFiles.length > 0) {
            logger.info('Fields upload completed successfully', {
              totalFiles: uploadedFiles.length,
              files: uploadedFiles
            });
          }
        }
        
        next();
      } catch (error) {
        logger.error('Unexpected error in fields upload middleware', { error: error.message });
        next(new ApiError('File upload failed', 500));
      }
    });
  };
};

// Utility function to delete uploaded file
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info('File deleted successfully', { filePath });
      return true;
    } else {
      logger.warn('File not found for deletion', { filePath });
      return false;
    }
  } catch (error) {
    logger.error('Error deleting file', { error: error.message, filePath });
    return false;
  }
};

// Utility function to get file info
const getFileInfo = (file) => {
  return {
    filename: file.filename,
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    path: file.path,
    uploadDate: new Date()
  };
};

// Validation middleware for file uploads
const validateFileUpload = (req, res, next) => {
  try {
    if (!req.file && !req.files) {
      return next(new ApiError('No file uploaded', 400));
    }
    
    // Add file info to request for easy access
    if (req.file) {
      req.fileInfo = getFileInfo(req.file);
    }
    
    if (req.files) {
      if (Array.isArray(req.files)) {
        req.filesInfo = req.files.map(getFileInfo);
      } else {
        req.filesInfo = {};
        Object.keys(req.files).forEach(fieldName => {
          req.filesInfo[fieldName] = req.files[fieldName].map(getFileInfo);
        });
      }
    }
    
    next();
  } catch (error) {
    logger.error('Error in file upload validation', { error: error.message });
    next(new ApiError('File validation failed', 500));
  }
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  uploadFields,
  deleteFile,
  getFileInfo,
  validateFileUpload,
  createUploadDirs
};