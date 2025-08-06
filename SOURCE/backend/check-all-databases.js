#!/usr/bin/env node

/**
 * Check all possible databases for blogs
 */

const mongoose = require('mongoose');

async function checkAllDatabases() {
  try {
    console.log('🔍 Checking all possible databases...');
    
    const databases = [
      'mongodb://localhost:27017/project_mgmt',
      'mongodb://localhost:27017/project_management',
      'mongodb://localhost:27017/project_management_test'
    ];
    
    for (const dbUri of databases) {
      console.log(`\n📊 Checking database: ${dbUri}`);
      
      try {
        await mongoose.connect(dbUri, { serverSelectionTimeoutMS: 3000 });
        
        // Check collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`   Collections: ${collections.map(c => c.name).join(', ')}`);
        
        // Check for blogs collection
        if (collections.some(c => c.name === 'blogs')) {
          const blogsCollection = mongoose.connection.db.collection('blogs');
          
          // Count blogs by publication status
          const totalBlogs = await blogsCollection.countDocuments();
          const publishedBlogs = await blogsCollection.countDocuments({ isPublished: true });
          const unpublishedBlogs = await blogsCollection.countDocuments({ isPublished: false });
          
          console.log(`   📊 Total blogs: ${totalBlogs}`);
          console.log(`   📄 Published: ${publishedBlogs}`);
          console.log(`   📝 Unpublished: ${unpublishedBlogs}`);
          
          if (totalBlogs > 0) {
            const recentBlogs = await blogsCollection.find({}).limit(3).toArray();
            console.log(`   📄 Recent blogs:`);
            recentBlogs.forEach((blog, index) => {
              console.log(`      ${index + 1}. "${blog.title}" - Published: ${blog.isPublished ? 'YES' : 'NO'}`);
            });
          }
        } else {
          console.log(`   ❌ No 'blogs' collection found`);
        }
        
        await mongoose.disconnect();
        
      } catch (error) {
        console.log(`   ❌ Error connecting: ${error.message}`);
        try {
          await mongoose.disconnect();
        } catch (e) {
          // Ignore disconnect errors
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Script error:', error.message);
  }
}

checkAllDatabases();