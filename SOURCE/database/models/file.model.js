const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs').promises;

const metadataSchema = new mongoose.Schema({
  // For images
  dimensions: {
    width: {
      type: Number,
      min: [1, 'Width must be positive']
    },
    height: {
      type: Number,
      min: [1, 'Height must be positive']
    }
  },
  // For videos/audio
  duration: {
    type: Number,
    min: [0, 'Duration cannot be negative']
  },
  // For documents
  pageCount: {
    type: Number,
    min: [1, 'Page count must be at least 1']
  },
  // Generic metadata
  encoding: String,
  lastModified: Date,
  checksum: String
}, { _id: false });

const fileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: [true, 'Filename is required'],
    unique: true,
    trim: true,
    maxlength: [255, 'Filename cannot exceed 255 characters']
  },
  originalName: {
    type: String,
    required: [true, 'Original filename is required'],
    trim: true,
    maxlength: [255, 'Original filename cannot exceed 255 characters']
  },
  mimetype: {
    type: String,
    required: [true, 'File mimetype is required'],
    trim: true,
    maxlength: [100, 'Mimetype cannot exceed 100 characters']
  },
  size: {
    type: Number,
    required: [true, 'File size is required'],
    min: [0, 'File size cannot be negative'],
    max: [52428800, 'File size cannot exceed 50MB']
  },
  path: {
    type: String,
    required: [true, 'File path is required'],
    trim: true,
    maxlength: [1000, 'File path cannot exceed 1000 characters']
  },
  entityType: {
    type: String,
    required: [true, 'Entity type is required'],
    enum: {
      values: ['project', 'task', 'blog'],
      message: 'Entity type must be project, task, or blog'
    },
    index: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Entity ID is required'],
    index: true
  },
  category: {
    type: String,
    enum: {
      values: ['document', 'image', 'attachment'],
      message: 'Category must be document, image, or attachment'
    },
    default: 'attachment',
    index: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'File description cannot exceed 500 characters']
  },
  uploadDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  metadata: {
    type: metadataSchema,
    default: {}
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  downloadCount: {
    type: Number,
    default: 0,
    min: [0, 'Download count cannot be negative']
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for common queries
fileSchema.index({ entityType: 1, entityId: 1 });
fileSchema.index({ category: 1, mimetype: 1 });
fileSchema.index({ uploadDate: -1, isActive: 1 });
fileSchema.index({ size: 1, uploadDate: -1 });
fileSchema.index({ isActive: 1, lastAccessed: 1 });

// Virtual for file extension
fileSchema.virtual('extension').get(function() {
  return path.extname(this.originalName).toLowerCase();
});

// Virtual for human-readable file size
fileSchema.virtual('humanSize').get(function() {
  const bytes = this.size;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  
  if (bytes === 0) return '0 Bytes';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = (bytes / Math.pow(1024, i)).toFixed(2);
  
  return `${size} ${sizes[i]}`;
});

// Virtual for file age in days
fileSchema.virtual('ageInDays').get(function() {
  const today = new Date();
  const upload = new Date(this.uploadDate);
  const diffTime = today - upload;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
});

// Virtual for download URL (would be used by the API)
fileSchema.virtual('downloadUrl').get(function() {
  return `/api/v1/files/${this._id}`;
});

// Virtual for thumbnail URL (for images)
fileSchema.virtual('thumbnailUrl').get(function() {
  if (this.category === 'image' || this.mimetype.startsWith('image/')) {
    return `/api/v1/files/${this._id}/thumbnail`;
  }
  return null;
});

// Virtual to check if file is an image
fileSchema.virtual('isImage').get(function() {
  return this.mimetype.startsWith('image/') || 
         ['image', 'picture', 'photo'].some(word => 
           this.category.toLowerCase().includes(word)
         );
});

// Virtual to check if file is a document
fileSchema.virtual('isDocument').get(function() {
  const documentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown'
  ];
  
  return documentTypes.includes(this.mimetype) || 
         this.category === 'document';
});

// Instance methods
fileSchema.methods.incrementDownloadCount = function() {
  this.downloadCount += 1;
  this.lastAccessed = new Date();
  return this.save();
};

fileSchema.methods.updateMetadata = function(newMetadata) {
  this.metadata = { ...this.metadata, ...newMetadata };
  return this.save();
};

fileSchema.methods.deactivate = function(reason = '') {
  this.isActive = false;
  this.description = this.description 
    ? `${this.description} [DEACTIVATED: ${reason}]`
    : `[DEACTIVATED: ${reason}]`;
  return this.save();
};

fileSchema.methods.activate = function() {
  this.isActive = true;
  // Remove deactivation message from description
  if (this.description) {
    this.description = this.description.replace(/ \[DEACTIVATED:.*?\]$/, '');
  }
  return this.save();
};

fileSchema.methods.getFileStats = function() {
  return {
    id: this._id,
    filename: this.filename,
    originalName: this.originalName,
    size: this.size,
    humanSize: this.humanSize,
    mimetype: this.mimetype,
    category: this.category,
    extension: this.extension,
    uploadDate: this.uploadDate,
    ageInDays: this.ageInDays,
    downloadCount: this.downloadCount,
    lastAccessed: this.lastAccessed,
    isActive: this.isActive,
    isImage: this.isImage,
    isDocument: this.isDocument
  };
};

// Static methods
fileSchema.statics.findByEntity = function(entityType, entityId, options = {}) {
  const query = this.find({ 
    entityType, 
    entityId: new mongoose.Types.ObjectId(entityId),
    isActive: options.includeInactive ? { $in: [true, false] } : true
  });
  
  if (options.category) {
    query.where('category', options.category);
  }
  
  if (options.mimetype) {
    query.where('mimetype', new RegExp(options.mimetype, 'i'));
  }
  
  return query.sort(options.sort || { uploadDate: -1 });
};

fileSchema.statics.findByMimetype = function(mimetypePattern) {
  return this.find({
    mimetype: new RegExp(mimetypePattern, 'i'),
    isActive: true
  }).sort({ uploadDate: -1 });
};

fileSchema.statics.findLargeFiles = function(minSize = 10485760) { // Default 10MB
  return this.find({
    size: { $gte: minSize },
    isActive: true
  }).sort({ size: -1 });
};

fileSchema.statics.findOldFiles = function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return this.find({
    uploadDate: { $lt: cutoffDate },
    isActive: true
  }).sort({ uploadDate: 1 });
};

fileSchema.statics.findOrphanedFiles = async function() {
  const files = await this.find({ isActive: true });
  const orphaned = [];
  
  for (const file of files) {
    let entityExists = false;
    
    try {
      switch (file.entityType) {
        case 'project':
          entityExists = await mongoose.model('Project').exists({ _id: file.entityId });
          break;
        case 'task':
          entityExists = await mongoose.model('Task').exists({ _id: file.entityId });
          break;
        case 'blog':
          entityExists = await mongoose.model('Blog').exists({ _id: file.entityId });
          break;
      }
      
      if (!entityExists) {
        orphaned.push(file);
      }
    } catch (error) {
      // If we can't check, assume it's orphaned for safety
      orphaned.push(file);
    }
  }
  
  return orphaned;
};

fileSchema.statics.getStorageStatistics = function() {
  return this.aggregate([
    {
      $match: { isActive: true }
    },
    {
      $group: {
        _id: null,
        totalFiles: { $sum: 1 },
        totalSize: { $sum: '$size' },
        averageSize: { $avg: '$size' },
        largestFile: { $max: '$size' },
        smallestFile: { $min: '$size' },
        totalDownloads: { $sum: '$downloadCount' },
        byCategory: {
          $push: {
            category: '$category',
            size: '$size'
          }
        },
        byEntityType: {
          $push: {
            entityType: '$entityType',
            size: '$size'
          }
        }
      }
    },
    {
      $project: {
        totalFiles: 1,
        totalSize: 1,
        totalSizeHuman: {
          $switch: {
            branches: [
              { case: { $lt: ['$totalSize', 1024] }, then: { $concat: [{ $toString: '$totalSize' }, ' B'] } },
              { case: { $lt: ['$totalSize', 1048576] }, then: { $concat: [{ $toString: { $round: [{ $divide: ['$totalSize', 1024] }, 2] } }, ' KB'] } },
              { case: { $lt: ['$totalSize', 1073741824] }, then: { $concat: [{ $toString: { $round: [{ $divide: ['$totalSize', 1048576] }, 2] } }, ' MB'] } }
            ],
            default: { $concat: [{ $toString: { $round: [{ $divide: ['$totalSize', 1073741824] }, 2] } }, ' GB'] }
          }
        },
        averageSize: { $round: ['$averageSize', 0] },
        largestFile: 1,
        smallestFile: 1,
        totalDownloads: 1
      }
    }
  ]);
};

// Pre-save middleware
fileSchema.pre('save', function(next) {
  // Auto-detect category based on mimetype if not set
  if (!this.category || this.category === 'attachment') {
    if (this.mimetype.startsWith('image/')) {
      this.category = 'image';
    } else if (['application/pdf', 'application/msword', 'text/plain', 'text/markdown'].includes(this.mimetype)) {
      this.category = 'document';
    }
  }
  
  next();
});

// Pre-remove middleware to clean up physical file
fileSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  try {
    // Delete physical file from filesystem
    await fs.unlink(this.path);
  } catch (error) {
    // Log error but don't fail the deletion - file might already be gone
    console.warn(`Failed to delete physical file ${this.path}:`, error.message);
  }
  
  next();
});

// Post-save middleware for logging
fileSchema.post('save', function(doc, next) {
  if (this.isNew) {
    console.log(`New file uploaded: ${doc.originalName} (${doc.humanSize}) for ${doc.entityType} ${doc.entityId}`);
  }
  next();
});

const File = mongoose.model('File', fileSchema);

module.exports = File;