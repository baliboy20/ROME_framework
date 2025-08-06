const mongoose = require('mongoose');

/**
 * Migration: Add Project Enhancement Fields
 * PROJECT-ENH-001: Add localSourceFolder and githubRepo fields to project models
 * 
 * This migration:
 * 1. Adds index for githubRepo field for search performance
 * 2. Updates existing projects to have null values for new fields (data consistency)
 * 3. Documents the schema enhancement for PROJECT-ENH-001
 */

const addProjectEnhancementFields = async () => {
  try {
    console.log('🚀 Starting PROJECT-ENH-001 migration...');
    
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
    
    const projectCollection = db.collection('projects');
    
    // Step 1: Add new index for githubRepo field
    console.log('📊 Creating githubRepo index for search performance...');
    await projectCollection.createIndex(
      { githubRepo: 1 }, 
      { 
        name: 'idx_project_github_repo',
        sparse: true // Only index documents that have this field
      }
    );
    console.log('✅ githubRepo index created successfully');
    
    // Step 2: Update existing projects to have consistent field structure
    console.log('🔄 Updating existing projects with new fields...');
    
    // Find projects that don't have the new fields
    const projectsToUpdate = await projectCollection.find({
      $or: [
        { localSourceFolder: { $exists: false } },
        { githubRepo: { $exists: false } }
      ]
    }).toArray();
    
    console.log(`📋 Found ${projectsToUpdate.length} projects to update`);
    
    if (projectsToUpdate.length > 0) {
      // Update all projects to have the new fields with null values
      const updateResult = await projectCollection.updateMany(
        {
          $or: [
            { localSourceFolder: { $exists: false } },
            { githubRepo: { $exists: false } }
          ]
        },
        {
          $set: {
            localSourceFolder: null,
            githubRepo: null
          }
        }
      );
      
      console.log(`✅ Updated ${updateResult.modifiedCount} projects with new fields`);
    }
    
    // Step 3: Verify the migration
    console.log('🔍 Verifying migration results...');
    
    const totalProjects = await projectCollection.countDocuments();
    const projectsWithNewFields = await projectCollection.countDocuments({
      localSourceFolder: { $exists: true },
      githubRepo: { $exists: true }
    });
    
    console.log(`📊 Total projects: ${totalProjects}`);
    console.log(`📊 Projects with new fields: ${projectsWithNewFields}`);
    
    if (totalProjects !== projectsWithNewFields) {
      throw new Error('Migration verification failed: Not all projects have the new fields');
    }
    
    // Step 4: Display index information
    const indexes = await projectCollection.listIndexes().toArray();
    const githubRepoIndex = indexes.find(idx => idx.name === 'idx_project_github_repo');
    
    if (!githubRepoIndex) {
      throw new Error('Migration verification failed: githubRepo index not found');
    }
    
    console.log('✅ PROJECT-ENH-001 migration completed successfully!');
    console.log(`📊 Project collection now has ${indexes.length} indexes`);
    console.log('🎉 Enhancement fields (localSourceFolder, githubRepo) are ready for use');
    
  } catch (error) {
    console.error('❌ Error in PROJECT-ENH-001 migration:', error);
    throw error;
  }
};

const removeProjectEnhancementFields = async () => {
  try {
    console.log('🔄 Rolling back PROJECT-ENH-001 migration...');
    
    const db = mongoose.connection.db;
    const projectCollection = db.collection('projects');
    
    // Step 1: Drop the githubRepo index
    try {
      await projectCollection.dropIndex('idx_project_github_repo');
      console.log('✅ Dropped githubRepo index');
    } catch (error) {
      console.warn('⚠️ Could not drop githubRepo index (may not exist):', error.message);
    }
    
    // Step 2: Remove the new fields from all projects
    const removeResult = await projectCollection.updateMany(
      {},
      {
        $unset: {
          localSourceFolder: "",
          githubRepo: ""
        }
      }
    );
    
    console.log(`✅ Removed enhancement fields from ${removeResult.modifiedCount} projects`);
    
    // Step 3: Verify rollback
    const projectsWithFields = await projectCollection.countDocuments({
      $or: [
        { localSourceFolder: { $exists: true } },
        { githubRepo: { $exists: true } }
      ]
    });
    
    if (projectsWithFields > 0) {
      console.warn(`⚠️ Warning: ${projectsWithFields} projects still have enhancement fields`);
    }
    
    console.log('✅ PROJECT-ENH-001 rollback completed!');
    
  } catch (error) {
    console.error('❌ Error rolling back PROJECT-ENH-001 migration:', error);
    throw error;
  }
};

module.exports = {
  up: addProjectEnhancementFields,
  down: removeProjectEnhancementFields
};