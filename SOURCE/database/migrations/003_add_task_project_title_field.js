const mongoose = require('mongoose');

/**
 * Migration: Add Task projectTitle Field 
 * TASK-ENH-001: Add denormalized projectTitle field to task models
 * 
 * This migration:
 * 1. Adds projectTitle index for search performance  
 * 2. Adds compound (projectId, projectTitle) index for efficient queries
 * 3. Populates existing tasks with project titles from referenced Project documents
 * 4. Documents the schema enhancement for TASK-ENH-001
 */

const addTaskProjectTitleField = async () => {
  try {
    console.log('🚀 Starting TASK-ENH-001 migration...');
    
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
    
    const taskCollection = db.collection('tasks');
    const projectCollection = db.collection('projects');
    
    // Step 1: Add indexes for performance
    console.log('📊 Creating projectTitle indexes...');
    
    await taskCollection.createIndex(
      { projectTitle: 1 }, 
      { 
        name: 'idx_task_project_title',
        sparse: true // Only index documents that have this field
      }
    );
    console.log('✅ projectTitle index created successfully');
    
    await taskCollection.createIndex(
      { projectId: 1, projectTitle: 1 }, 
      { 
        name: 'idx_task_project_compound',
        sparse: true
      }
    );
    console.log('✅ compound (projectId, projectTitle) index created successfully');
    
    // Step 2: Populate existing tasks with project titles
    console.log('🔄 Populating existing tasks with project titles...');
    
    // Find tasks that don't have projectTitle but have projectId
    const tasksToUpdate = await taskCollection.find({
      projectId: { $exists: true, $ne: null },
      projectTitle: { $exists: false }
    }).toArray();
    
    console.log(`📋 Found ${tasksToUpdate.length} tasks to update`);
    
    if (tasksToUpdate.length > 0) {
      // Use aggregation pipeline to update tasks with project titles
      const pipeline = [
        {
          $match: {
            projectId: { $exists: true, $ne: null },
            projectTitle: { $exists: false }
          }
        },
        {
          $lookup: {
            from: 'projects',
            localField: 'projectId',
            foreignField: '_id',
            as: 'project'
          }
        },
        {
          $match: {
            'project.0': { $exists: true }
          }
        },
        {
          $addFields: {
            projectTitle: { $arrayElemAt: ['$project.name', 0] }
          }
        },
        {
          $project: {
            project: 0 // Remove the lookup result
          }
        },
        {
          $merge: {
            into: 'tasks',
            whenMatched: 'merge'
          }
        }
      ];
      
      const result = await taskCollection.aggregate(pipeline).toArray();
      console.log(`✅ Updated tasks with project titles via aggregation pipeline`);
      
      // Verify the updates
      const updatedTasksCount = await taskCollection.countDocuments({
        projectId: { $exists: true, $ne: null },
        projectTitle: { $exists: true, $ne: null }
      });
      
      console.log(`📊 Tasks with project titles: ${updatedTasksCount}`);
      
      // Handle tasks with invalid projectId references
      const orphanedTasks = await taskCollection.find({
        projectId: { $exists: true, $ne: null },
        projectTitle: { $exists: false }
      }).toArray();
      
      if (orphanedTasks.length > 0) {
        console.log(`⚠️ Found ${orphanedTasks.length} tasks with invalid project references`);
        
        // Set projectTitle to 'Unknown Project' for orphaned tasks
        await taskCollection.updateMany(
          {
            projectId: { $exists: true, $ne: null },
            projectTitle: { $exists: false }
          },
          {
            $set: {
              projectTitle: 'Unknown Project'
            }
          }
        );
        
        console.log(`✅ Set orphaned tasks to 'Unknown Project'`);
      }
    } else {
      console.log('ℹ️ All tasks already have project titles or no project association');
    }
    
    // Step 3: Verify the migration
    console.log('🔍 Verifying migration results...');
    
    const totalTasks = await taskCollection.countDocuments();
    const tasksWithProjectId = await taskCollection.countDocuments({ 
      projectId: { $exists: true, $ne: null } 
    });
    const tasksWithProjectTitle = await taskCollection.countDocuments({
      projectId: { $exists: true, $ne: null },
      projectTitle: { $exists: true, $ne: null }
    });
    
    console.log(`📊 Total tasks: ${totalTasks}`);
    console.log(`📊 Tasks with projectId: ${tasksWithProjectId}`);
    console.log(`📊 Tasks with projectTitle: ${tasksWithProjectTitle}`);
    
    if (tasksWithProjectId !== tasksWithProjectTitle) {
      throw new Error('Migration verification failed: Not all tasks with projectId have projectTitle');
    }
    
    // Step 4: Display index information
    const indexes = await taskCollection.listIndexes().toArray();
    const projectTitleIndex = indexes.find(idx => idx.name === 'idx_task_project_title');
    const compoundIndex = indexes.find(idx => idx.name === 'idx_task_project_compound');
    
    if (!projectTitleIndex || !compoundIndex) {
      throw new Error('Migration verification failed: Required indexes not found');
    }
    
    console.log('✅ TASK-ENH-001 migration completed successfully!');
    console.log(`📊 Task collection now has ${indexes.length} indexes`);
    console.log('🎉 projectTitle field is ready for use with full denormalization');
    
  } catch (error) {
    console.error('❌ Error in TASK-ENH-001 migration:', error);
    throw error;
  }
};

const removeTaskProjectTitleField = async () => {
  try {
    console.log('🔄 Rolling back TASK-ENH-001 migration...');
    
    const db = mongoose.connection.db;
    const taskCollection = db.collection('tasks');
    
    // Step 1: Drop the indexes
    try {
      await taskCollection.dropIndex('idx_task_project_title');
      console.log('✅ Dropped projectTitle index');
    } catch (error) {
      console.warn('⚠️ Could not drop projectTitle index (may not exist):', error.message);
    }
    
    try {
      await taskCollection.dropIndex('idx_task_project_compound');
      console.log('✅ Dropped compound (projectId, projectTitle) index');
    } catch (error) {
      console.warn('⚠️ Could not drop compound index (may not exist):', error.message);
    }
    
    // Step 2: Remove the projectTitle field from all tasks
    const removeResult = await taskCollection.updateMany(
      {},
      {
        $unset: {
          projectTitle: ""
        }
      }
    );
    
    console.log(`✅ Removed projectTitle field from ${removeResult.modifiedCount} tasks`);
    
    // Step 3: Verify rollback
    const tasksWithProjectTitle = await taskCollection.countDocuments({
      projectTitle: { $exists: true }
    });
    
    if (tasksWithProjectTitle > 0) {
      console.warn(`⚠️ Warning: ${tasksWithProjectTitle} tasks still have projectTitle field`);
    }
    
    console.log('✅ TASK-ENH-001 rollback completed!');
    
  } catch (error) {
    console.error('❌ Error rolling back TASK-ENH-001 migration:', error);
    throw error;
  }
};

module.exports = {
  up: addTaskProjectTitleField,
  down: removeTaskProjectTitleField
};