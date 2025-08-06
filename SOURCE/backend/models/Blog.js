const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Blog title is required'],
    trim: true,
    minlength: [5, 'Title must be at least 5 characters long'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Blog content is required'],
    minlength: [10, 'Content must be at least 10 characters long']
  },
  excerpt: {
    type: String,
    trim: true,
    maxlength: [300, 'Excerpt cannot exceed 300 characters']
  },
  author: {
    type: String,
    default: 'system'
  },
  category: {
    type: String,
    enum: ['general', 'project_update', 'technical', 'personal', 'milestone'],
    default: 'general'
  },
  tags: [{
    type: String,
    trim: true,
    minlength: [2, 'Tag must be at least 2 characters long'],
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedDate: {
    type: Date
  },
  featuredImage: {
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  },
  readingTime: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  comments: [{
    author: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true,
      minlength: [1, 'Comment cannot be empty']
    },
    isApproved: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  relatedPosts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Blog'
  }],
  seo: {
    metaTitle: {
      type: String,
      maxlength: [60, 'Meta title cannot exceed 60 characters']
    },
    metaDescription: {
      type: String,
      maxlength: [160, 'Meta description cannot exceed 160 characters']
    },
    keywords: [{
      type: String,
      trim: true
    }]
  },
  projectRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  taskRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for URL slug
blogSchema.virtual('slug').get(function() {
  return this.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
});

// Virtual for reading time calculation
blogSchema.virtual('estimatedReadingTime').get(function() {
  if (this.content) {
    const wordsPerMinute = 200;
    const wordCount = this.content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }
  return 0;
});

// Virtual for content preview
blogSchema.virtual('preview').get(function() {
  if (this.excerpt) {
    return this.excerpt;
  }
  if (this.content) {
    return this.content.substring(0, 150) + (this.content.length > 150 ? '...' : '');
  }
  return '';
});

// Virtual for publication status
blogSchema.virtual('publicationStatus').get(function() {
  return {
    isPublished: this.isPublished,
    publishedDate: this.publishedDate,
    isDraft: !this.isPublished,
    canPublish: this.title && this.content
  };
});

// Pre-save middleware
blogSchema.pre('save', function(next) {
  try {
    // Set published date when publishing
    if (this.isPublished && !this.publishedDate) {
      this.publishedDate = new Date();
    }
    
    // Clear published date if unpublishing
    if (!this.isPublished && this.publishedDate) {
      this.publishedDate = undefined;
    }
    
    // Auto-generate excerpt if not provided
    if (!this.excerpt && this.content) {
      this.excerpt = this.content.substring(0, 150) + (this.content.length > 150 ? '...' : '');
    }
    
    // Calculate reading time
    if (this.content) {
      const wordsPerMinute = 200;
      const wordCount = this.content.split(/\s+/).length;
      this.readingTime = Math.ceil(wordCount / wordsPerMinute);
    }
    
    // Auto-generate SEO meta title if not provided
    if (!this.seo?.metaTitle && this.title) {
      if (!this.seo) this.seo = {};
      this.seo.metaTitle = this.title.substring(0, 60);
    }
    
    // Auto-generate SEO meta description if not provided
    if (!this.seo?.metaDescription && this.excerpt) {
      if (!this.seo) this.seo = {};
      this.seo.metaDescription = this.excerpt.substring(0, 160);
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Static methods
blogSchema.statics.findPublished = function() {
  return this.find({ isPublished: true }).sort({ publishedDate: -1 });
};

blogSchema.statics.findByCategory = function(category) {
  return this.find({ category, isPublished: true }).sort({ publishedDate: -1 });
};

blogSchema.statics.findByTag = function(tag) {
  return this.find({ tags: tag, isPublished: true }).sort({ publishedDate: -1 });
};

blogSchema.statics.findByAuthor = function(author) {
  return this.find({ author }).sort({ createdAt: -1 });
};

blogSchema.statics.searchByTitle = function(searchTerm) {
  return this.find({
    title: { $regex: searchTerm, $options: 'i' },
    isPublished: true
  }).sort({ publishedDate: -1 });
};

blogSchema.statics.searchByContent = function(searchTerm) {
  return this.find({
    $or: [
      { title: { $regex: searchTerm, $options: 'i' } },
      { content: { $regex: searchTerm, $options: 'i' } },
      { tags: { $regex: searchTerm, $options: 'i' } }
    ],
    isPublished: true
  }).sort({ publishedDate: -1 });
};

// Instance methods
blogSchema.methods.publish = function() {
  this.isPublished = true;
  this.publishedDate = new Date();
  return this.save();
};

blogSchema.methods.unpublish = function() {
  this.isPublished = false;
  this.publishedDate = undefined;
  return this.save();
};

blogSchema.methods.addComment = function(author, content) {
  this.comments.push({ author, content });
  return this.save();
};

blogSchema.methods.approveComment = function(commentId) {
  const comment = this.comments.id(commentId);
  if (comment) {
    comment.isApproved = true;
    return this.save();
  }
  throw new Error('Comment not found');
};

blogSchema.methods.incrementViews = function() {
  this.views = (this.views || 0) + 1;
  return this.save();
};

blogSchema.methods.incrementLikes = function() {
  this.likes = (this.likes || 0) + 1;
  return this.save();
};

blogSchema.methods.addTag = function(tag) {
  if (!this.tags.includes(tag)) {
    this.tags.push(tag);
    return this.save();
  }
  return Promise.resolve(this);
};

blogSchema.methods.removeTag = function(tag) {
  this.tags = this.tags.filter(t => t !== tag);
  return this.save();
};

// Indexes for performance
blogSchema.index({ isPublished: 1, publishedDate: -1 });
blogSchema.index({ category: 1, isPublished: 1 });
blogSchema.index({ author: 1, createdAt: -1 });
blogSchema.index({ tags: 1, isPublished: 1 });
blogSchema.index({ title: 'text', content: 'text', tags: 'text' });
blogSchema.index({ projectRef: 1 });
blogSchema.index({ taskRef: 1 });

module.exports = mongoose.model('Blog', blogSchema);