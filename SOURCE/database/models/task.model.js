const mongoose = require('mongoose');

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
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'File description cannot exceed 500 characters']
  }
}, { _id: false });

const taskSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project ID is required'],
    index: true
  },
  projectTitle: {
    type: String,
    trim: true,
    maxlength: [200, 'Project title cannot exceed 200 characters'],
    index: true
  },
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    minlength: [2, 'Task title must be at least 2 characters'],
    maxlength: [200, 'Task title cannot exceed 200 characters'],
    index: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Task description cannot exceed 2000 characters']
  },
  category: {
    type: String,
    trim: true,
    maxlength: [100, 'Task category cannot exceed 100 characters'],
    index: true
  },
  progress: {
    type: Number,
    min: [0, 'Progress cannot be less than 0'],
    max: [100, 'Progress cannot be more than 100'],
    default: 0,
    validate: {
      validator: function(v) {
        return Number.isInteger(v);
      },
      message: 'Progress must be an integer'
    }
  },
  startDate: {
    type: Date,
    validate: {
      validator: function(v) {
        if (!v) return true; // Allow null/undefined
        return v <= new Date();
      },
      message: 'Start date cannot be in the future'
    }
  },
  targetDate: {
    type: Date,
    validate: {
      validator: function(v) {
        if (!v || !this.startDate) return true; // Allow null/undefined
        return v >= this.startDate;
      },
      message: 'Target date must be after start date'
    }
  },
  status: {
    type: String,
    enum: {
      values: ['todo', 'inProgress', 'review', 'blocked', 'completed', 'cancelled'],
      message: 'Status must be todo, inProgress, review, blocked, completed, or cancelled'
    },
    default: 'todo',
    index: true
  },
  priority: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high', 'urgent'],
      message: 'Priority must be low, medium, high, or urgent'
    },
    default: 'medium',
    index: true
  },
  attachments: {
    type: [attachmentSchema],
    validate: {
      validator: function(v) {
        return v.length <= 50;
      },
      message: 'Cannot have more than 50 attachments per task'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for common queries
taskSchema.index({ projectId: 1, status: 1 });
taskSchema.index({ projectId: 1, priority: 1 });
taskSchema.index({ projectId: 1, category: 1 });
taskSchema.index({ projectId: 1, projectTitle: 1 }); // TASK-ENH-001: Compound index for project queries
taskSchema.index({ status: 1, priority: 1 });
taskSchema.index({ targetDate: 1, status: 1 });
taskSchema.index({ createdAt: -1 });
taskSchema.index({ updatedAt: -1 });

// Text index for search functionality
taskSchema.index({
  title: 'text',
  description: 'text',
  category: 'text'
});

// Virtual for days remaining
taskSchema.virtual('daysRemaining').get(function() {
  if (!this.targetDate) return null;
  
  const today = new Date();
  const target = new Date(this.targetDate);
  const diffTime = target - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
});

// Virtual for days elapsed
taskSchema.virtual('daysElapsed').get(function() {
  if (!this.startDate) return null;
  
  const today = new Date();
  const start = new Date(this.startDate);
  const diffTime = today - start;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
});

// Virtual for estimated completion date based on progress
taskSchema.virtual('estimatedCompletionDate').get(function() {
  if (!this.startDate || !this.targetDate || this.progress === 0) {
    return this.targetDate;
  }
  
  const start = new Date(this.startDate);
  const target = new Date(this.targetDate);
  const totalDays = Math.ceil((target - start) / (1000 * 60 * 60 * 24));
  const remainingDays = Math.ceil(totalDays * (100 - this.progress) / 100);
  
  const estimated = new Date();
  estimated.setDate(estimated.getDate() + remainingDays);
  
  return estimated;
});

// Virtual for overdue status
taskSchema.virtual('isOverdue').get(function() {
  if (!this.targetDate || this.status === 'completed') return false;
  
  return new Date() > new Date(this.targetDate);
});

// Instance methods
taskSchema.methods.updateProgress = function(newProgress) {
  if (newProgress < 0 || newProgress > 100) {
    throw new Error('Progress must be between 0 and 100');
  }
  
  this.progress = newProgress;
  
  // Auto-update status based on progress
  if (newProgress === 0) {
    this.status = 'pending';
  } else if (newProgress === 100) {
    this.status = 'completed';
  } else if (this.status === 'pending') {
    this.status = 'in_progress';
  }
  
  return this.save();
};

taskSchema.methods.markCompleted = function() {
  this.progress = 100;
  this.status = 'completed';
  return this.save();
};

taskSchema.methods.addAttachment = function(fileData) {
  if (this.attachments.length >= 50) {
    throw new Error('Cannot add more than 50 attachments per task');
  }
  
  this.attachments.push(fileData);
  return this.save();
};

taskSchema.methods.removeAttachment = function(fileId) {
  this.attachments = this.attachments.filter(
    attachment => !attachment.fileId.equals(fileId)
  );
  return this.save();
};

// Static methods
taskSchema.statics.findByProject = function(projectId, options = {}) {
  const query = this.find({ projectId });
  
  if (options.status) {
    query.where('status', options.status);
  }
  
  if (options.priority) {
    query.where('priority', options.priority);
  }
  
  if (options.category) {
    query.where('category', options.category);
  }
  
  if (options.overdue) {
    query.where('targetDate').lt(new Date());
    query.where('status').ne('completed');
  }
  
  return query.sort(options.sort || { createdAt: -1 });
};

taskSchema.statics.searchTasks = function(searchTerm, projectId = null) {
  const query = this.find({
    $text: { $search: searchTerm }
  });
  
  if (projectId) {
    query.where('projectId', projectId);
  }
  
  return query.sort({ score: { $meta: 'textScore' } });
};

taskSchema.statics.getTasksByDateRange = function(startDate, endDate, projectId = null) {
  const query = this.find({
    $or: [
      { startDate: { $gte: startDate, $lte: endDate } },
      { targetDate: { $gte: startDate, $lte: endDate } }
    ]
  });
  
  if (projectId) {
    query.where('projectId', projectId);
  }
  
  return query.sort({ startDate: 1 });
};

taskSchema.statics.getTaskStatistics = function(projectId = null) {
  const matchStage = projectId ? { $match: { projectId: new mongoose.Types.ObjectId(projectId) } } : null;
  
  const pipeline = [
    ...(matchStage ? [matchStage] : []),
    {
      $group: {
        _id: null,
        totalTasks: { $sum: 1 },
        completedTasks: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        inProgressTasks: {
          $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
        },
        pendingTasks: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        averageProgress: { $avg: '$progress' },
        overdueTasks: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $lt: ['$targetDate', new Date()] },
                  { $ne: ['$status', 'completed'] }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    }
  ];
  
  return this.aggregate(pipeline);
};

// Pre-save middleware
taskSchema.pre('save', function(next) {
  // Auto-update status based on progress
  if (this.isModified('progress')) {
    if (this.progress === 0) {
      this.status = 'pending';
    } else if (this.progress === 100) {
      this.status = 'completed';
    } else if (this.status === 'pending') {
      this.status = 'in_progress';
    }
  }
  
  // Validate date logic
  if (this.startDate && this.targetDate && this.startDate > this.targetDate) {
    return next(new Error('Start date cannot be after target date'));
  }
  
  next();
});

// Pre-remove middleware to clean up file attachments
taskSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  try {
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

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;