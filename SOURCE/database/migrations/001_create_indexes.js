const mongoose = require('mongoose');

/**
 * Migration: Create Indexes
 * Creates all necessary indexes for optimal query performance
 */

const createIndexes = async () => {
  try {
    console.log('🚀 Starting index creation...');
    
    // Ensure models are loaded to trigger schema compilation
    require('../models');
    
    // Wait for connection to be ready with retry
    let retries = 5;
    while (mongoose.connection.readyState !== 1 && retries > 0) {
      console.log('⏳ Waiting for database connection...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      retries--;
    }
    
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database connection not ready after retries');
    }
    
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database object not available');
    }
    
    // Project Collection Indexes
    console.log('📊 Creating Project indexes...');
    const projectCollection = db.collection('projects');
    
    await projectCollection.createIndex({ name: 1 }, { name: 'idx_project_name' });
    await projectCollection.createIndex({ createdAt: -1 }, { name: 'idx_project_created' });
    await projectCollection.createIndex({ updatedAt: -1 }, { name: 'idx_project_updated' });
    await projectCollection.createIndex({ 'stages.order': 1 }, { name: 'idx_project_stages_order' });
    
    // Task Collection Indexes  
    console.log('📋 Creating Task indexes...');
    const taskCollection = db.collection('tasks');
    
    await taskCollection.createIndex({ projectId: 1 }, { name: 'idx_task_project' });
    await taskCollection.createIndex({ title: 1 }, { name: 'idx_task_title' });
    await taskCollection.createIndex({ category: 1 }, { name: 'idx_task_category' });
    await taskCollection.createIndex({ status: 1 }, { name: 'idx_task_status' });
    await taskCollection.createIndex({ priority: 1 }, { name: 'idx_task_priority' });
    await taskCollection.createIndex({ createdAt: -1 }, { name: 'idx_task_created' });
    await taskCollection.createIndex({ updatedAt: -1 }, { name: 'idx_task_updated' });
    
    // Compound indexes for tasks
    await taskCollection.createIndex(
      { projectId: 1, status: 1 }, 
      { name: 'idx_task_project_status' }
    );
    await taskCollection.createIndex(
      { projectId: 1, priority: 1 }, 
      { name: 'idx_task_project_priority' }
    );
    await taskCollection.createIndex(
      { projectId: 1, category: 1 }, 
      { name: 'idx_task_project_category' }
    );
    await taskCollection.createIndex(
      { status: 1, priority: 1 }, 
      { name: 'idx_task_status_priority' }
    );
    await taskCollection.createIndex(
      { targetDate: 1, status: 1 }, 
      { name: 'idx_task_target_status' }
    );
    
    // Text search index for tasks
    await taskCollection.createIndex(
      { title: 'text', description: 'text', category: 'text' },
      { 
        name: 'idx_task_text_search',
        weights: { title: 10, category: 5, description: 1 }
      }
    );
    
    // Blog Collection Indexes
    console.log('📝 Creating Blog indexes...');
    const blogCollection = db.collection('blogs');
    
    await blogCollection.createIndex({ projectId: 1 }, { name: 'idx_blog_project' });
    await blogCollection.createIndex({ title: 1 }, { name: 'idx_blog_title' });
    await blogCollection.createIndex({ publishDate: -1 }, { name: 'idx_blog_publish_date' });
    await blogCollection.createIndex({ createdAt: -1 }, { name: 'idx_blog_created' });
    await blogCollection.createIndex({ updatedAt: -1 }, { name: 'idx_blog_updated' });
    await blogCollection.createIndex({ tags: 1 }, { name: 'idx_blog_tags' });
    await blogCollection.createIndex({ draft: 1 }, { name: 'idx_blog_draft' });
    
    // Compound indexes for blogs
    await blogCollection.createIndex(
      { projectId: 1, publishDate: -1 }, 
      { name: 'idx_blog_project_date' }
    );
    await blogCollection.createIndex(
      { draft: 1, publishDate: -1 }, 
      { name: 'idx_blog_draft_date' }
    );
    
    // Text search index for blogs
    await blogCollection.createIndex(
      { title: 'text', content: 'text', tags: 'text' },
      { 
        name: 'idx_blog_text_search',
        weights: { title: 10, tags: 5, content: 1 }
      }
    );
    
    // File Collection Indexes
    console.log('📁 Creating File indexes...');
    const fileCollection = db.collection('files');
    
    await fileCollection.createIndex({ filename: 1 }, { unique: true, name: 'idx_file_filename_unique' });
    await fileCollection.createIndex({ entityType: 1 }, { name: 'idx_file_entity_type' });
    await fileCollection.createIndex({ entityId: 1 }, { name: 'idx_file_entity_id' });
    await fileCollection.createIndex({ category: 1 }, { name: 'idx_file_category' });
    await fileCollection.createIndex({ uploadDate: -1 }, { name: 'idx_file_upload_date' });
    await fileCollection.createIndex({ isActive: 1 }, { name: 'idx_file_active' });
    
    // Compound indexes for files
    await fileCollection.createIndex(
      { entityType: 1, entityId: 1 }, 
      { name: 'idx_file_entity' }
    );
    await fileCollection.createIndex(
      { category: 1, mimetype: 1 }, 
      { name: 'idx_file_category_type' }
    );
    await fileCollection.createIndex(
      { uploadDate: -1, isActive: 1 }, 
      { name: 'idx_file_date_active' }
    );
    await fileCollection.createIndex(
      { size: 1, uploadDate: -1 }, 
      { name: 'idx_file_size_date' }
    );
    await fileCollection.createIndex(
      { isActive: 1, lastAccessed: 1 }, 
      { name: 'idx_file_active_accessed' }
    );
    
    console.log('✅ All indexes created successfully!');
    
    // Display index information
    const collections = ['projects', 'tasks', 'blogs', 'files'];
    for (const collectionName of collections) {
      const collection = db.collection(collectionName);
      const indexes = await collection.listIndexes().toArray();
      console.log(`📊 ${collectionName} collection has ${indexes.length} indexes`);
    }
    
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    throw error;
  }
};

const dropIndexes = async () => {
  try {
    console.log('🗑️ Dropping all custom indexes...');
    
    const db = mongoose.connection.db;
    const collections = ['projects', 'tasks', 'blogs', 'files'];
    
    for (const collectionName of collections) {
      try {
        const collection = db.collection(collectionName);
        
        // Get all indexes except _id_
        const indexes = await collection.listIndexes().toArray();
        const customIndexes = indexes.filter(idx => idx.name !== '_id_');
        
        // Drop each custom index
        for (const index of customIndexes) {
          await collection.dropIndex(index.name);
          console.log(`  Dropped index: ${index.name} from ${collectionName}`);
        }
      } catch (error) {
        console.warn(`  Warning: Could not drop indexes from ${collectionName}:`, error.message);
      }
    }
    
    console.log('✅ Index cleanup completed!');
    
  } catch (error) {
    console.error('❌ Error dropping indexes:', error);
    throw error;
  }
};

module.exports = {
  up: createIndexes,
  down: dropIndexes
};