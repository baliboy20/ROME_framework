const mongoose = require('mongoose');

const repositorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Repository name is required'],
    trim: true,
    maxlength: [100, 'Repository name cannot exceed 100 characters']
  },
  url: {
    type: String,
    required: [true, 'Repository URL is required'],
    trim: true,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v) || /^git@.+/.test(v);
      },
      message: 'Invalid repository URL format'
    }
  },
  type: {
    type: String,
    required: [true, 'Repository type is required'],
    enum: {
      values: ['git', 'svn', 'mercurial', 'other'],
      message: 'Repository type must be git, svn, mercurial, or other'
    },
    default: 'git'
  }
}, { _id: false });

const coreUrlSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'URL title is required'],
    trim: true,
    maxlength: [200, 'URL title cannot exceed 200 characters']
  },
  url: {
    type: String,
    required: [true, 'URL is required'],
    trim: true,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Invalid URL format'
    }
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'URL description cannot exceed 500 characters']
  }
}, { _id: false });

const stageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Stage name is required'],
    trim: true,
    maxlength: [100, 'Stage name cannot exceed 100 characters']
  },
  order: {
    type: Number,
    required: [true, 'Stage order is required'],
    min: [1, 'Stage order must be at least 1']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Stage description cannot exceed 500 characters']
  }
}, { _id: false });

const attachmentSchema = new mongoose.Schema({
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    required: [true, 'File ID is required']
  },
  filename: {
    type: String,
    required: [true, 'Filename is required'],
    trim: true
  },
  originalName: {
    type: String,
    required: [true, 'Original filename is required'],
    trim: true
  },
  mimetype: {
    type: String,
    required: [true, 'File mimetype is required'],
    trim: true
  },
  size: {
    type: Number,
    required: [true, 'File size is required'],
    min: [0, 'File size cannot be negative'],
    max: [52428800, 'File size cannot exceed 50MB']
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  category: {
    type: String,
    enum: {
      values: ['document', 'image', 'attachment'],
      message: 'Category must be document, image, or attachment'
    },
    default: 'attachment'
  }
}, { _id: false });

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    minlength: [2, 'Project name must be at least 2 characters'],
    maxlength: [200, 'Project name cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Project description is required'],
    trim: true,
    minlength: [10, 'Project description must be at least 10 characters'],
    maxlength: [2000, 'Project description cannot exceed 2000 characters']
  },
  localSourceFolder: {
    type: String,
    trim: true,
    maxlength: [500, 'Local source folder path cannot exceed 500 characters']
  },
  githubRepo: {
    type: String,
    trim: true,
    maxlength: [200, 'GitHub repository URL cannot exceed 200 characters'],
    validate: {
      validator: function(v) {
        if (!v) return true; // Allow null/undefined
        // GitHub URL validation regex - supports https, git@, and GitHub Enterprise
        return /^(https:\/\/github\.[\w.-]+\/[\w.-]+\/[\w.-]+|https:\/\/github\.com\/[\w.-]+\/[\w.-]+|git@github\.[\w.-]*:[\w.-]+\/[\w.-]+\.git)$/.test(v);
      },
      message: 'Invalid GitHub repository URL format'
    }
  },
  folders: [{
    type: String,
    trim: true,
    maxlength: [500, 'Folder path cannot exceed 500 characters']
  }],
  repositories: {
    type: [repositorySchema],
    validate: {
      validator: function(v) {
        return v.length <= 10;
      },
      message: 'Cannot have more than 10 repositories per project'
    }
  },
  coreUrls: {
    type: [coreUrlSchema],
    validate: {
      validator: function(v) {
        return v.length <= 20;
      },
      message: 'Cannot have more than 20 URLs per project'
    }
  },
  stages: {
    type: [stageSchema],
    validate: [
      {
        validator: function(v) {
          return v.length <= 50;
        },
        message: 'Cannot have more than 50 stages per project'
      },
      {
        validator: function(stages) {
          if (stages.length === 0) return true;
          const orders = stages.map(s => s.order);
          const uniqueOrders = new Set(orders);
          return uniqueOrders.size === orders.length;
        },
        message: 'Stage orders must be unique'
      }
    ]
  },
  attachments: {
    type: [attachmentSchema],
    validate: {
      validator: function(v) {
        return v.length <= 100;
      },
      message: 'Cannot have more than 100 attachments per project'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
projectSchema.index({ name: 1 });
projectSchema.index({ createdAt: -1 });
projectSchema.index({ updatedAt: -1 });
projectSchema.index({ 'stages.order': 1 });
projectSchema.index({ githubRepo: 1 }); // For searching by GitHub repository

// Virtual for task count
projectSchema.virtual('taskCount', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'projectId',
  count: true
});

// Virtual for blog count
projectSchema.virtual('blogCount', {
  ref: 'Blog',
  localField: '_id',
  foreignField: 'projectId',
  count: true
});

// Instance methods
projectSchema.methods.addStage = function(stageName, description = '') {
  const maxOrder = this.stages.length > 0 
    ? Math.max(...this.stages.map(s => s.order)) 
    : 0;
  
  this.stages.push({
    name: stageName,
    order: maxOrder + 1,
    description
  });
  
  return this.save();
};

projectSchema.methods.removeStage = function(stageOrder) {
  this.stages = this.stages.filter(s => s.order !== stageOrder);
  
  // Reorder remaining stages
  this.stages.sort((a, b) => a.order - b.order);
  this.stages.forEach((stage, index) => {
    stage.order = index + 1;
  });
  
  return this.save();
};

projectSchema.methods.addRepository = function(name, url, type = 'git') {
  if (this.repositories.length >= 10) {
    throw new Error('Cannot add more than 10 repositories per project');
  }
  
  this.repositories.push({ name, url, type });
  return this.save();
};

projectSchema.methods.addCoreUrl = function(title, url, description = '') {
  if (this.coreUrls.length >= 20) {
    throw new Error('Cannot add more than 20 URLs per project');
  }
  
  this.coreUrls.push({ title, url, description });
  return this.save();
};

// Static methods
projectSchema.statics.findByName = function(name) {
  return this.findOne({ 
    name: { $regex: new RegExp(name, 'i') } 
  });
};

projectSchema.statics.findByDateRange = function(startDate, endDate) {
  return this.find({
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ createdAt: -1 });
};

// Pre-save middleware for validation
projectSchema.pre('save', function(next) {
  // Ensure stage orders are sequential starting from 1
  if (this.stages && this.stages.length > 0) {
    this.stages.sort((a, b) => a.order - b.order);
    this.stages.forEach((stage, index) => {
      if (stage.order !== index + 1) {
        stage.order = index + 1;
      }
    });
  }
  
  next();
});

// Pre-remove middleware to clean up related data
projectSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  try {
    // Remove all tasks associated with this project
    await mongoose.model('Task').deleteMany({ projectId: this._id });
    
    // Remove all blogs associated with this project
    await mongoose.model('Blog').deleteMany({ projectId: this._id });
    
    // Clean up file attachments
    for (const attachment of this.attachments) {
      const File = mongoose.model('File');
      await File.findByIdAndDelete(attachment.fileId);
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;