# Database Architecture Documentation
## Project Management Application

**Version**: 1.2  
**Date**: August 2025 (Updated)  
**Architect**: Ashok (Data Architect)  
**Status**: Production Ready - Backend Models Synchronized  
**Latest Update**: TASK-ENH-001 completed - projectTitle field added to task models with indexing and migration

---

## Table of Contents

1. [Overview](#overview)
2. [Schema Design](#schema-design)
3. [Model Specifications](#model-specifications)
4. [Relationships](#relationships)
5. [Indexing Strategy](#indexing-strategy)
6. [Migration System](#migration-system)
7. [Testing Framework](#testing-framework)
8. [Performance Optimization](#performance-optimization)
9. [Usage Guidelines](#usage-guidelines)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The Project Management Application uses MongoDB as its primary database with Mongoose ODM for schema modeling and validation. The architecture follows Domain-Driven Design principles with a focus on data integrity, performance, and scalability.

### Key Features

- **Comprehensive Validation**: All models include extensive validation rules and constraints
- **File Management**: Integrated file attachment system with metadata tracking
- **Performance Optimized**: Strategic indexing for common query patterns
- **Test Coverage**: 80%+ unit test coverage for all models
- **Migration Support**: Automated migration and seeding system
- **Audit Trail**: Automatic timestamp tracking for all entities

### Technology Stack

- **Database**: MongoDB 6.0+
- **ODM**: Mongoose 8.0+
- **Testing**: Jest with MongoDB Memory Server
- **Migration**: Custom migration framework
- **Validation**: Built-in Mongoose validators with custom rules

---

## Schema Design

### Core Entities

The application manages four primary entities:

1. **Project** - Main organizational unit for work
2. **Task** - Individual work items with progress tracking
3. **Blog** - Progress journal entries with markdown support
4. **File** - File attachments with metadata and categorization

### Design Principles

- **Normalization**: Proper data normalization to reduce redundancy
- **Denormalization**: Strategic denormalization for performance where appropriate
- **Validation**: Comprehensive validation at the schema level
- **Flexibility**: Support for future feature expansion
- **Consistency**: Consistent naming and structure across models

---

## Model Specifications

### Project Model

**Purpose**: Central entity representing a project with associated metadata, stages, and resources.

**Key Features**:
- Configurable project stages with ordering
- Multiple repository and URL associations
- File attachment support
- Comprehensive validation rules

**Schema Structure**:
```javascript
{
  name: String (required, 2-200 chars, indexed),
  description: String (required, 10-2000 chars),
  folders: [String],
  repositories: [{
    name: String (required),
    url: String (required, validated),
    type: String (enum: git/svn/mercurial/other)
  }],
  coreUrls: [{
    title: String (required),
    url: String (required, validated),
    description: String
  }],
  stages: [{
    name: String (required),
    order: Number (required, auto-corrected),
    description: String
  }],
  attachments: [{
    fileId: ObjectId (ref: File),
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    uploadDate: Date,
    category: String
  }],
  createdAt: Date,
  updatedAt: Date
}
```

**Validation Rules**:
- Maximum 10 repositories per project
- Maximum 20 core URLs per project
- Maximum 50 stages per project
- Maximum 100 attachments per project
- Stage orders must be unique and sequential
- URL format validation for repositories and core URLs

**Instance Methods**:
- `addStage(name, description)` - Add new stage with auto-ordering
- `removeStage(order)` - Remove stage and reorder remaining
- `addRepository(name, url, type)` - Add repository with validation
- `addCoreUrl(title, url, description)` - Add core URL with validation

**Static Methods**:
- `findByName(name)` - Case-insensitive name search
- `findByDateRange(startDate, endDate)` - Find projects by creation date

### Task Model

**Purpose**: Individual work items with progress tracking and project association.

**Key Features**:
- Progress tracking (0-100%)
- Automatic status management based on progress
- Date validation and virtual properties
- File attachment support
- Full-text search capabilities

**Schema Structure**:
```javascript
{
  projectId: ObjectId (required, ref: Project, indexed),
  title: String (required, 2-200 chars, indexed),
  description: String (0-2000 chars),
  category: String (indexed),
  progress: Number (0-100, integer, default: 0),
  startDate: Date (validated: not future),
  targetDate: Date (validated: after startDate),
  status: String (enum: pending/in_progress/completed, indexed),
  priority: String (enum: low/medium/high, indexed),
  attachments: [{
    fileId: ObjectId (ref: File),
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    uploadDate: Date,
    description: String
  }],
  createdAt: Date,
  updatedAt: Date
}
```

**Virtual Properties**:
- `daysRemaining` - Calculated days until target date
- `daysElapsed` - Days since start date
- `estimatedCompletionDate` - Projected completion based on progress
- `isOverdue` - Boolean indicating if task is overdue

**Validation Rules**:
- Progress must be integer between 0-100
- Start date cannot be in future
- Target date must be after start date
- Maximum 50 attachments per task

**Instance Methods**:
- `updateProgress(progress)` - Update progress with auto-status management
- `markCompleted()` - Set progress to 100% and status to completed
- `addAttachment(fileData)` - Add file attachment with validation
- `removeAttachment(fileId)` - Remove attachment by file ID

**Static Methods**:
- `findByProject(projectId, options)` - Find tasks with filtering options
- `searchTasks(searchTerm, projectId)` - Full-text search in tasks
- `getTasksByDateRange(startDate, endDate, projectId)` - Date range queries
- `getTaskStatistics(projectId)` - Aggregated statistics

### Blog Model

**Purpose**: Progress journal entries with markdown content and rich metadata.

**Key Features**:
- Markdown content support with word count calculation
- Tag management with normalization
- URL reference system
- Draft/published workflow
- File attachment support
- Full-text search with weighted scoring

**Schema Structure**:
```javascript
{
  projectId: ObjectId (required, ref: Project, indexed),
  title: String (required, 2-300 chars, indexed),
  content: String (required, 10-50000 chars),
  urls: [{
    title: String (required),
    url: String (required, validated)
  }],
  attachments: [{
    fileId: ObjectId (ref: File),
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    uploadDate: Date,
    category: String
  }],
  tags: [String] (normalized, max 20),
  publishDate: Date (validated: not future),
  draft: Boolean (default: false, indexed),
  wordCount: Number (auto-calculated),
  readingTime: Number (auto-calculated),
  createdAt: Date,
  updatedAt: Date
}
```

**Virtual Properties**:
- `excerpt` - First 200 characters with markdown stripped
- `formattedPublishDate` - Human-readable publish date
- `daysSincePublished` - Days since publication
- `imageAttachments` - Filtered image attachments only

**Validation Rules**:
- Maximum 50 URLs per blog
- Maximum 100 attachments per blog
- Maximum 20 tags per blog
- Each tag must be 1-50 characters
- Publish date cannot be in future

**Instance Methods**:
- `addUrl(title, url)` - Add URL reference with validation
- `removeUrl(url)` - Remove URL by URL string
- `addTags(tags)` - Add tags with normalization and deduplication
- `removeTags(tags)` - Remove specified tags
- `publish()` - Set draft to false and update publish date
- `unpublish()` - Set draft to true
- `addAttachment(fileData)` - Add file attachment
- `removeAttachment(fileId)` - Remove attachment by file ID

**Static Methods**:
- `findByProject(projectId, options)` - Find blogs with filtering
- `searchBlogs(searchTerm, projectId)` - Full-text search with scoring
- `findByTags(tags, projectId)` - Find blogs by tag matching
- `getBlogStatistics(projectId)` - Aggregated blog statistics

### File Model

**Purpose**: File metadata and attachment management with categorization and lifecycle tracking.

**Key Features**:
- Comprehensive metadata storage
- Automatic category detection from MIME type
- File lifecycle management (active/inactive)
- Usage tracking with download counts
- Orphaned file detection
- Storage statistics and optimization

**Schema Structure**:
```javascript
{
  filename: String (required, unique, trimmed),
  originalName: String (required, trimmed),
  mimetype: String (required, trimmed),
  size: Number (required, 0-50MB),
  path: String (required, server file path),
  entityType: String (required, enum: project/task/blog, indexed),
  entityId: ObjectId (required, indexed),
  category: String (enum: document/image/attachment, indexed),
  description: String (0-500 chars),
  uploadDate: Date (default: now, indexed),
  metadata: {
    dimensions: { width: Number, height: Number },
    duration: Number,
    pageCount: Number,
    encoding: String,
    lastModified: Date,
    checksum: String
  },
  isActive: Boolean (default: true, indexed),
  downloadCount: Number (default: 0),
  lastAccessed: Date (default: now),
  createdAt: Date,
  updatedAt: Date
}
```

**Virtual Properties**:
- `extension` - File extension from original name
- `humanSize` - Human-readable file size (KB, MB, GB)
- `ageInDays` - Days since upload
- `downloadUrl` - API endpoint for file download
- `thumbnailUrl` - Thumbnail URL for images
- `isImage` - Boolean indicating if file is an image
- `isDocument` - Boolean indicating if file is a document

**Validation Rules**:
- Filename must be unique across all files
- File size limited to 50MB
- Category auto-detected from MIME type
- Metadata validated based on file type

**Instance Methods**:
- `incrementDownloadCount()` - Track file access
- `updateMetadata(metadata)` - Update file metadata
- `deactivate(reason)` - Mark file as inactive with reason
- `activate()` - Reactivate file
- `getFileStats()` - Get comprehensive file statistics

**Static Methods**:
- `findByEntity(entityType, entityId, options)` - Find files by parent entity
- `findByMimetype(pattern)` - Find files by MIME type pattern
- `findLargeFiles(minSize)` - Find files above size threshold
- `findOldFiles(daysOld)` - Find files older than specified days
- `findOrphanedFiles()` - Find files with missing parent entities
- `getStorageStatistics()` - Get storage usage statistics

---

## Relationships

### Entity Relationship Diagram

```
Project (1) ──┬── (n) Task
              ├── (n) Blog  
              └── (n) File (via attachments)

Task (1) ────── (n) File (via attachments)

Blog (1) ────── (n) File (via attachments)

File (n) ────── (1) Entity (Project/Task/Blog)
```

### Referential Integrity

- **Project → Task**: One-to-many relationship with cascading delete
- **Project → Blog**: One-to-many relationship with cascading delete
- **Entity → File**: One-to-many polymorphic relationship
- **File → Entity**: Many-to-one with entity type discrimination

### Cascade Operations

- Deleting a Project removes all associated Tasks, Blogs, and Files
- Deleting a Task removes all associated Files
- Deleting a Blog removes all associated Files
- Files are automatically cleaned up from filesystem on document removal

---

## Indexing Strategy

### Primary Indexes

**Project Collection**:
```javascript
{ name: 1 }                    // Name queries
{ createdAt: -1 }              // Recent projects
{ updatedAt: -1 }              // Recently updated
{ 'stages.order': 1 }          // Stage ordering
```

**Task Collection**:
```javascript
{ projectId: 1 }               // Project tasks
{ title: 1 }                   // Task search
{ category: 1 }                // Category filtering
{ status: 1 }                  // Status filtering
{ priority: 1 }                // Priority filtering
{ createdAt: -1 }              // Recent tasks
{ updatedAt: -1 }              // Recently updated
```

**Compound Indexes for Tasks**:
```javascript
{ projectId: 1, status: 1 }    // Project + status queries
{ projectId: 1, priority: 1 }  // Project + priority queries
{ projectId: 1, category: 1 }  // Project + category queries
{ status: 1, priority: 1 }     // Status + priority queries
{ targetDate: 1, status: 1 }   // Due date queries
```

**Text Search Indexes**:
```javascript
// Task text search with weights
{ 
  title: 'text', 
  description: 'text', 
  category: 'text' 
}
// Weights: title: 10, category: 5, description: 1

// Blog text search with weights
{ 
  title: 'text', 
  content: 'text', 
  tags: 'text' 
}
// Weights: title: 10, tags: 5, content: 1
```

**Blog Collection**:
```javascript
{ projectId: 1 }               // Project blogs
{ title: 1 }                   // Blog search
{ publishDate: -1 }            // Recent blogs
{ tags: 1 }                    // Tag filtering
{ draft: 1 }                   // Draft/published
{ projectId: 1, publishDate: -1 } // Project recent blogs
{ draft: 1, publishDate: -1 }  // Published recent blogs
```

**File Collection**:
```javascript
{ filename: 1 }                // Unique filename (unique index)
{ entityType: 1 }              // Entity type filtering
{ entityId: 1 }                // Entity files
{ category: 1 }                // Category filtering
{ uploadDate: -1 }             // Recent uploads
{ isActive: 1 }                // Active files
{ entityType: 1, entityId: 1 } // Entity files compound
{ category: 1, mimetype: 1 }   // Category + type queries
{ uploadDate: -1, isActive: 1 } // Recent active files
{ size: 1, uploadDate: -1 }    // Size-based queries
{ isActive: 1, lastAccessed: 1 } // Cleanup queries
```

### Index Performance Considerations

- **Selective Indexes**: Indexes on high-cardinality fields for optimal performance
- **Compound Index Order**: Most selective fields first in compound indexes
- **Text Search Optimization**: Weighted text indexes for relevance scoring
- **Partial Indexes**: Considered for sparse fields to reduce index size
- **Background Creation**: All indexes created with background: true option

---

## Migration System

### Migration Framework

The application includes a comprehensive migration system located in `database/migrate.js`.

**Key Features**:
- Automated migration execution
- Rollback capabilities
- Seed data management
- Status tracking and reporting

**Available Commands**:
```bash
node migrate.js migrate    # Run all pending migrations
node migrate.js rollback   # Rollback all migrations
node migrate.js seed       # Run all seed files
node migrate.js clear      # Clear all seed data
node migrate.js reset      # Full reset (rollback + migrate + seed)
node migrate.js status     # Show migration status
```

### Migration Files

**001_create_indexes.js**: Creates all database indexes for optimal performance
- Creates primary and compound indexes
- Sets up text search indexes
- Configures unique constraints
- Provides rollback functionality

### Seed Files

**001_sample_data.js**: Creates comprehensive sample data for development and testing
- 3 sample projects with realistic data
- 9 sample tasks with various states
- 4 sample blog entries with rich content
- Proper relationships and realistic metadata

### Migration Best Practices

1. **Atomic Operations**: Each migration should be atomic and reversible
2. **Data Validation**: Validate data integrity after migrations
3. **Backup Strategy**: Always backup before running migrations in production
4. **Testing**: Test migrations on staging environment first
5. **Documentation**: Document migration purposes and effects

---

## Testing Framework

### Test Architecture

The database models include comprehensive unit tests with 80%+ code coverage requirement.

**Test Structure**:
```
tests/
├── package.json              # Test dependencies and scripts
├── setup/
│   └── jest.setup.js         # Global test configuration
├── unit/database/
│   ├── project.model.test.js # Project model tests
│   ├── task.model.test.js    # Task model tests
│   ├── blog.model.test.js    # Blog model tests
│   └── file.model.test.js    # File model tests
└── run-tests.js              # Test runner script
```

### Test Coverage Areas

**Model Validation Tests**:
- Required field validation
- Data type validation
- Length and range constraints
- Custom validation rules
- Edge cases and error conditions

**Instance Method Tests**:
- Method functionality
- Parameter validation
- State changes
- Error handling
- Return value verification

**Static Method Tests**:
- Query functionality
- Filtering and sorting
- Aggregation operations
- Performance considerations
- Error scenarios

**Virtual Property Tests**:
- Calculated properties
- Date computations
- String formatting
- Boolean logic
- Null/undefined handling

**Middleware Tests**:
- Pre-save operations
- Post-save effects
- Pre-remove cleanup
- Cascade operations
- Error propagation

### Testing Tools

- **Jest**: Testing framework with extensive matcher library
- **MongoDB Memory Server**: In-memory MongoDB for isolated testing
- **Custom Matchers**: Specialized matchers for database operations
- **Factory Functions**: Test data generation utilities
- **Coverage Reporting**: HTML and LCOV coverage reports

### Running Tests

```bash
# Navigate to tests directory
cd tests

# Install dependencies
npm install

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific model tests
npm run test:project
npm run test:task
npm run test:blog
npm run test:file

# Watch mode for development
npm run test:watch

# CI/CD mode
npm run test:ci
```

---

## Performance Optimization

### Query Optimization

**Index Usage**:
- All common query patterns have supporting indexes
- Compound indexes ordered by selectivity
- Text search indexes with relevance weighting

**Query Patterns**:
- Use `lean()` for read-only operations
- Project only required fields with `select()`
- Limit and paginate large result sets
- Use aggregation pipelines for complex operations

**Example Optimized Queries**:
```javascript
// Efficient project tasks query
const tasks = await Task.find({ projectId, status: 'in_progress' })
  .select('title progress targetDate')
  .sort({ priority: -1, targetDate: 1 })
  .limit(20)
  .lean();

// Aggregated task statistics
const stats = await Task.aggregate([
  { $match: { projectId } },
  { $group: {
    _id: '$status',
    count: { $sum: 1 },
    avgProgress: { $avg: '$progress' }
  }}
]);
```

### Memory Management

**Connection Pooling**:
- Configured connection pool with optimal settings
- Maximum 10 concurrent connections
- Connection timeout and retry logic

**Document Size Optimization**:
- File metadata stored separately from content
- Large text fields (blog content) with size limits
- Attachment arrays with reasonable limits

### Caching Strategy

**Application-Level Caching**:
- Cache frequently accessed project data
- Cache aggregated statistics
- Invalidate cache on data changes

**Database-Level Optimization**:
- Working set fits in available RAM
- Indexes fit in memory for common queries
- Regular index maintenance and monitoring

---

## Usage Guidelines

### Connection Management

```javascript
const databaseConfig = require('./config/database');

// Connect to database
await databaseConfig.connect(process.env.MONGODB_URI);

// Check connection status
const isConnected = databaseConfig.isDbConnected();

// Get connection info
const info = databaseConfig.getConnectionInfo();

// Health check
const health = await databaseConfig.healthCheck();

// Graceful shutdown
await databaseConfig.disconnect();
```

### Model Usage Examples

**Creating a Project**:
```javascript
const Project = require('./models/project.model');

const project = new Project({
  name: 'New Project',
  description: 'Project description with minimum length requirement'
});

await project.save();

// Add stages
await project.addStage('Planning', 'Initial planning phase');
await project.addStage('Development', 'Implementation phase');

// Add repository
await project.addRepository('main-repo', 'https://github.com/company/repo.git', 'git');
```

**Working with Tasks**:
```javascript
const Task = require('./models/task.model');

// Create task
const task = new Task({
  projectId: project._id,
  title: 'Implement feature',
  description: 'Detailed task description',
  priority: 'high',
  startDate: new Date(),
  targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
});

await task.save();

// Update progress
await task.updateProgress(50);

// Add attachment
await task.addAttachment({
  fileId: file._id,
  filename: 'spec.pdf',
  originalName: 'Feature Specification.pdf',
  mimetype: 'application/pdf',
  size: 1024
});

// Search tasks
const results = await Task.searchTasks('implement feature');
```

**Blog Management**:
```javascript
const Blog = require('./models/blog.model');

// Create blog entry
const blog = new Blog({
  projectId: project._id,
  title: 'Development Progress Update',
  content: `# Week 1 Progress\n\nCompleted initial setup...`,
  tags: ['progress', 'development', 'week1']
});

await blog.save();

// Add URL reference
await blog.addUrl('GitHub PR', 'https://github.com/repo/pull/123');

// Publish blog
await blog.publish();
```

**File Management**:
```javascript
const File = require('./models/file.model');

// Create file record
const file = new File({
  filename: 'unique-filename-123.pdf',
  originalName: 'Project Document.pdf',
  mimetype: 'application/pdf',
  size: 2048,
  path: '/uploads/project/unique-filename-123.pdf',
  entityType: 'project',
  entityId: project._id
});

await file.save();

// Track download
await file.incrementDownloadCount();

// Add metadata
await file.updateMetadata({
  pageCount: 10,
  encoding: 'UTF-8'
});
```

### Error Handling

```javascript
try {
  const project = new Project(projectData);
  await project.save();
} catch (error) {
  if (error.name === 'ValidationError') {
    // Handle validation errors
    for (const field in error.errors) {
      console.error(`${field}: ${error.errors[field].message}`);
    }
  } else if (error.code === 11000) {
    // Handle duplicate key errors
    console.error('Duplicate value error');
  } else {
    // Handle other errors
    console.error('Database error:', error.message);
  }
}
```

---

## Troubleshooting

### Common Issues

**Connection Problems**:
```javascript
// Check MongoDB connection
const health = await databaseConfig.healthCheck();
if (health.status === 'unhealthy') {
  console.error('Database connection issue:', health.message);
}

// Verify connection string
console.log('Connection info:', databaseConfig.getConnectionInfo());
```

**Validation Errors**:
```javascript
// Check validation error details
if (error.name === 'ValidationError') {
  Object.keys(error.errors).forEach(field => {
    const fieldError = error.errors[field];
    console.log(`Field: ${field}`);
    console.log(`Message: ${fieldError.message}`);
    console.log(`Value: ${fieldError.value}`);
    console.log(`Kind: ${fieldError.kind}`);
  });
}
```

**Performance Issues**:
```javascript
// Check slow queries
mongoose.set('debug', true); // Enable query logging

// Monitor query performance
const startTime = Date.now();
const results = await Model.find(query);
const duration = Date.now() - startTime;
console.log(`Query took ${duration}ms`);

// Check index usage
const explain = await Model.find(query).explain();
console.log('Query plan:', explain);
```

**File Management Issues**:
```javascript
// Find orphaned files
const orphanedFiles = await File.findOrphanedFiles();
console.log(`Found ${orphanedFiles.length} orphaned files`);

// Check storage statistics
const stats = await File.getStorageStatistics();
console.log('Storage usage:', stats);

// Clean up inactive files
const inactiveFiles = await File.find({ isActive: false });
for (const file of inactiveFiles) {
  await file.deleteOne(); // Will clean up physical file
}
```

### Debugging Tools

**Query Analysis**:
```javascript
// Enable query logging
mongoose.set('debug', true);

// Explain query execution
const explanation = await Task.find({ projectId }).explain('executionStats');
console.log('Query execution stats:', explanation);
```

**Index Analysis**:
```javascript
// List collection indexes
const indexes = await mongoose.connection.db.collection('tasks').listIndexes().toArray();
console.log('Available indexes:', indexes);

// Check index usage statistics
const stats = await mongoose.connection.db.collection('tasks').stats();
console.log('Collection stats:', stats);
```

**Memory Monitoring**:
```javascript
// Monitor memory usage
const memUsage = process.memoryUsage();
console.log('Memory usage:', {
  rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
  heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
  external: `${Math.round(memUsage.external / 1024 / 1024)} MB`
});
```

### Maintenance Tasks

**Regular Maintenance**:
```javascript
// Rebuild indexes (if needed)
await mongoose.connection.db.collection('tasks').reIndex();

// Compact database (MongoDB maintenance)
await mongoose.connection.db.runCommand({ compact: 'tasks' });

// Check database integrity
const result = await mongoose.connection.db.runCommand({ dbStats: 1 });
console.log('Database statistics:', result);
```

**Data Cleanup**:
```javascript
// Clean up old files
const oldFiles = await File.findOldFiles(90); // Files older than 90 days
console.log(`Found ${oldFiles.length} old files for cleanup`);

// Remove orphaned attachments
const orphanedFiles = await File.findOrphanedFiles();
for (const file of orphanedFiles) {
  console.log(`Removing orphaned file: ${file.originalName}`);
  await file.deleteOne();
}
```

---

## Conclusion

This database architecture provides a robust, performant, and scalable foundation for the Project Management Application. The comprehensive validation, indexing strategy, and testing framework ensure data integrity and system reliability.

For questions or issues, refer to the troubleshooting section or consult the test suite for usage examples.

**Next Steps for Development**:
1. Review and test the database models
2. Run the migration system to set up indexes
3. Execute the test suite to verify functionality
4. Implement the API layer using these models
5. Monitor performance and optimize as needed

---

**Maintenance Schedule**:
- **Weekly**: Review slow query logs and optimize
- **Monthly**: Check storage statistics and clean up old files
- **Quarterly**: Review and update indexes based on usage patterns
- **Annually**: Full database health check and optimization