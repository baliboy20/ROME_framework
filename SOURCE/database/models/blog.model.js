const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema({
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
      values: ['image', 'document', 'attachment'],
      message: 'Category must be image, document, or attachment'
    },
    default: 'attachment'
  }
}, { _id: false });

const blogSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project ID is required'],
    index: true
  },
  title: {
    type: String,
    required: [true, 'Blog title is required'],
    trim: true,
    minlength: [2, 'Blog title must be at least 2 characters'],
    maxlength: [300, 'Blog title cannot exceed 300 characters'],
    index: true
  },
  content: {
    type: String,
    required: [true, 'Blog content is required'],
    trim: true,
    minlength: [10, 'Blog content must be at least 10 characters'],
    maxlength: [50000, 'Blog content cannot exceed 50,000 characters']
  },
  urls: {
    type: [urlSchema],
    validate: {
      validator: function(v) {
        return v.length <= 50;
      },
      message: 'Cannot have more than 50 URLs per blog'
    }
  },
  attachments: {
    type: [attachmentSchema],
    validate: {
      validator: function(v) {
        return v.length <= 100;
      },
      message: 'Cannot have more than 100 attachments per blog'
    }
  },
  tags: {
    type: [String],
    validate: [
      {
        validator: function(v) {
          return v.length <= 20;
        },
        message: 'Cannot have more than 20 tags per blog'
      },
      {
        validator: function(tags) {
          return tags.every(tag => 
            tag.trim().length >= 1 && tag.trim().length <= 50
          );
        },
        message: 'Each tag must be between 1 and 50 characters'
      }
    ]
  },
  publishDate: {
    type: Date,
    default: Date.now,
    validate: {
      validator: function(v) {
        return v <= new Date();
      },
      message: 'Publish date cannot be in the future'
    }
  },
  draft: {
    type: Boolean,
    default: false,
    index: true
  },
  wordCount: {
    type: Number,
    default: 0
  },
  readingTime: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
blogSchema.index({ projectId: 1, publishDate: -1 });
blogSchema.index({ publishDate: -1 });
blogSchema.index({ createdAt: -1 });
blogSchema.index({ updatedAt: -1 });
blogSchema.index({ tags: 1 });
blogSchema.index({ draft: 1, publishDate: -1 });

// Text index for search functionality
blogSchema.index({
  title: 'text',
  content: 'text',
  tags: 'text'
}, {
  weights: {
    title: 10,
    tags: 5,
    content: 1
  }
});

// Virtual for excerpt (first 200 characters)
blogSchema.virtual('excerpt').get(function() {
  if (!this.content) return '';
  
  // Remove markdown syntax for excerpt
  const plainText = this.content
    .replace(/#+\s/g, '') // Remove headers
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.*?)\*/g, '$1') // Remove italic
    .replace(/`(.*?)`/g, '$1') // Remove inline code
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Remove links
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .trim();
  
  return plainText.length > 200 
    ? plainText.substring(0, 200) + '...' 
    : plainText;
});

// Virtual for formatted publish date
blogSchema.virtual('formattedPublishDate').get(function() {
  return this.publishDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Virtual for days since published
blogSchema.virtual('daysSincePublished').get(function() {
  const today = new Date();
  const published = new Date(this.publishDate);
  const diffTime = today - published;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
});

// Virtual for image attachments only
blogSchema.virtual('imageAttachments').get(function() {
  return this.attachments.filter(attachment => 
    attachment.category === 'image' || 
    attachment.mimetype.startsWith('image/')
  );
});

// Instance methods
blogSchema.methods.addUrl = function(title, url) {
  if (this.urls.length >= 50) {
    throw new Error('Cannot add more than 50 URLs per blog');
  }
  
  this.urls.push({ title, url });
  return this.save();
};

blogSchema.methods.removeUrl = function(urlToRemove) {
  this.urls = this.urls.filter(urlObj => urlObj.url !== urlToRemove);
  return this.save();
};

blogSchema.methods.addTags = function(newTags) {
  const tagsToAdd = Array.isArray(newTags) ? newTags : [newTags];
  
  tagsToAdd.forEach(tag => {
    const trimmedTag = tag.trim().toLowerCase();
    if (trimmedTag && !this.tags.includes(trimmedTag)) {
      if (this.tags.length >= 20) {
        throw new Error('Cannot add more than 20 tags per blog');
      }
      this.tags.push(trimmedTag);
    }
  });
  
  return this.save();
};

blogSchema.methods.removeTags = function(tagsToRemove) {
  const removeList = Array.isArray(tagsToRemove) ? tagsToRemove : [tagsToRemove];
  this.tags = this.tags.filter(tag => 
    !removeList.map(t => t.toLowerCase()).includes(tag.toLowerCase())
  );
  return this.save();
};

blogSchema.methods.publish = function() {
  this.draft = false;
  this.publishDate = new Date();
  return this.save();
};

blogSchema.methods.unpublish = function() {
  this.draft = true;
  return this.save();
};

blogSchema.methods.addAttachment = function(fileData) {
  if (this.attachments.length >= 100) {
    throw new Error('Cannot add more than 100 attachments per blog');
  }
  
  this.attachments.push(fileData);
  return this.save();
};

blogSchema.methods.removeAttachment = function(fileId) {
  this.attachments = this.attachments.filter(
    attachment => !attachment.fileId.equals(fileId)
  );
  return this.save();
};

// Static methods
blogSchema.statics.findByProject = function(projectId, options = {}) {
  const query = this.find({ projectId });
  
  if (options.published !== undefined) {
    query.where('draft', !options.published);
  }
  
  if (options.tags && options.tags.length > 0) {
    query.where('tags').in(options.tags);
  }
  
  if (options.dateFrom) {
    query.where('publishDate').gte(options.dateFrom);
  }
  
  if (options.dateTo) {
    query.where('publishDate').lte(options.dateTo);
  }
  
  return query.sort(options.sort || { publishDate: -1 });
};

blogSchema.statics.searchBlogs = function(searchTerm, projectId = null) {
  const query = this.find({
    $text: { $search: searchTerm }
  });
  
  if (projectId) {
    query.where('projectId', projectId);
  }
  
  return query
    .select({ score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } });
};

blogSchema.statics.findByTags = function(tags, projectId = null) {
  const tagList = Array.isArray(tags) ? tags : [tags];
  const query = this.find({
    tags: { $in: tagList.map(tag => tag.toLowerCase()) }
  });
  
  if (projectId) {
    query.where('projectId', projectId);
  }
  
  return query.sort({ publishDate: -1 });
};

blogSchema.statics.getBlogStatistics = function(projectId = null) {
  const matchStage = projectId ? { $match: { projectId: new mongoose.Types.ObjectId(projectId) } } : null;
  
  const pipeline = [
    ...(matchStage ? [matchStage] : []),
    {
      $group: {
        _id: null,
        totalBlogs: { $sum: 1 },
        publishedBlogs: {
          $sum: { $cond: [{ $eq: ['$draft', false] }, 1, 0] }
        },
        draftBlogs: {
          $sum: { $cond: [{ $eq: ['$draft', true] }, 1, 0] }
        },
        totalWords: { $sum: '$wordCount' },
        averageWords: { $avg: '$wordCount' },
        averageReadingTime: { $avg: '$readingTime' },
        totalAttachments: {
          $sum: { $size: '$attachments' }
        },
        uniqueTags: { $addToSet: '$tags' }
      }
    },
    {
      $project: {
        totalBlogs: 1,
        publishedBlogs: 1,
        draftBlogs: 1,
        totalWords: 1,
        averageWords: { $round: ['$averageWords', 0] },
        averageReadingTime: { $round: ['$averageReadingTime', 1] },
        totalAttachments: 1,
        uniqueTagsCount: { $size: { $reduce: {
          input: '$uniqueTags',
          initialValue: [],
          in: { $setUnion: ['$$value', '$$this'] }
        }}}
      }
    }
  ];
  
  return this.aggregate(pipeline);
};

// Pre-save middleware to calculate word count and reading time
blogSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    // Calculate word count
    const words = this.content
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0);
    
    this.wordCount = words.length;
    
    // Calculate reading time (average 200 words per minute)
    this.readingTime = Math.max(1, Math.ceil(this.wordCount / 200));
  }
  
  // Normalize tags to lowercase
  if (this.isModified('tags')) {
    this.tags = this.tags.map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0);
    // Remove duplicates
    this.tags = [...new Set(this.tags)];
  }
  
  next();
});

// Pre-remove middleware to clean up file attachments
blogSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
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

const Blog = mongoose.model('Blog', blogSchema);

module.exports = Blog;