const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters long'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    index: true
  },
  projectTitle: {
    type: String,
    trim: true,
    maxlength: [200, 'Project title cannot exceed 200 characters'],
    index: true
  },
  status: {
    type: String,
    enum: ['todo', 'inProgress', 'review', 'blocked', 'completed', 'cancelled'],
    default: 'todo'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  assignedTo: {
    type: String,
    default: 'unassigned'
  },
  createdBy: {
    type: String,
    default: 'system'
  },
  dueDate: {
    type: Date
  },
  completedDate: {
    type: Date
  },
  estimatedHours: {
    type: Number,
    min: 0,
    max: 1000
  },
  actualHours: {
    type: Number,
    min: 0,
    max: 1000,
    default: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  dependencies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  subtasks: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedDate: Date
  }],
  comments: [{
    content: {
      type: String,
      required: true,
      trim: true
    },
    author: {
      type: String,
      default: 'system'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for task completion percentage
taskSchema.virtual('completionPercentage').get(function() {
  if (this.subtasks && this.subtasks.length > 0) {
    const completed = this.subtasks.filter(subtask => subtask.completed).length;
    return Math.round((completed / this.subtasks.length) * 100);
  }
  return this.status === 'completed' ? 100 : 0;
});

// Virtual for overdue status
taskSchema.virtual('isOverdue').get(function() {
  return this.dueDate && new Date() > this.dueDate && this.status !== 'completed';
});

// Virtual for time tracking
taskSchema.virtual('timeTracking').get(function() {
  return {
    estimated: this.estimatedHours || 0,
    actual: this.actualHours || 0,
    remaining: Math.max(0, (this.estimatedHours || 0) - (this.actualHours || 0)),
    variance: (this.actualHours || 0) - (this.estimatedHours || 0)
  };
});

// Pre-save middleware
taskSchema.pre('save', function(next) {
  try {
    // Set completed date when status changes to completed
    if (this.status === 'completed' && !this.completedDate) {
      this.completedDate = new Date();
    }
    
    // Clear completed date if status changes from completed
    if (this.status !== 'completed' && this.completedDate) {
      this.completedDate = undefined;
    }
    
    // Update subtask completion dates
    if (this.subtasks) {
      this.subtasks.forEach(subtask => {
        if (subtask.completed && !subtask.completedDate) {
          subtask.completedDate = new Date();
        } else if (!subtask.completed && subtask.completedDate) {
          subtask.completedDate = undefined;
        }
      });
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Static methods
taskSchema.statics.findByProject = function(projectId) {
  return this.find({ projectId }).populate('projectId', 'title status');
};

taskSchema.statics.findByStatus = function(status) {  
  return this.find({ status });
};

taskSchema.statics.findByPriority = function(priority) {
  return this.find({ priority });
};

taskSchema.statics.findOverdue = function() {
  return this.find({
    dueDate: { $lt: new Date() },
    status: { $ne: 'completed' }
  });
};

taskSchema.statics.findByAssignee = function(assignedTo) {
  return this.find({ assignedTo });
};

// Instance methods
taskSchema.methods.addSubtask = function(title) {
  this.subtasks.push({ title, completed: false });
  return this.save();
};

taskSchema.methods.completeSubtask = function(subtaskId) {
  const subtask = this.subtasks.id(subtaskId);
  if (subtask) {
    subtask.completed = true;
    subtask.completedDate = new Date();
    return this.save();
  }
  throw new Error('Subtask not found');
};

taskSchema.methods.addComment = function(content, author = 'system') {
  this.comments.push({ content, author });
  return this.save();
};

taskSchema.methods.logTime = function(hours) {
  this.actualHours = (this.actualHours || 0) + hours;
  return this.save();
};

taskSchema.methods.addTag = function(tag) {
  if (!this.tags.includes(tag)) {
    this.tags.push(tag);
    return this.save();
  }
  return Promise.resolve(this);
};

taskSchema.methods.removeTag = function(tag) {
  this.tags = this.tags.filter(t => t !== tag);
  return this.save();
};

// Indexes for performance
taskSchema.index({ projectId: 1, status: 1 });
taskSchema.index({ projectId: 1, projectTitle: 1 }); // TASK-ENH-001: Compound index for project queries
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ status: 1, priority: 1 });
taskSchema.index({ dueDate: 1, status: 1 });
taskSchema.index({ tags: 1 });
taskSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Task', taskSchema);