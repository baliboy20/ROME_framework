#!/usr/bin/env node

/**
 * Publish some sample blogs so they appear in the default GET endpoint
 */

const mongoose = require('mongoose');
const Blog = require('./models/Blog');

async function publishSampleBlogs() {
  try {
    console.log('🔍 Publishing sample blogs...');
    
    // Connect to database
    const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/project_mgmt';
    await mongoose.connect(dbUri);
    console.log('✅ Connected to MongoDB');
    
    // Get all unpublished blogs
    const unpublishedBlogs = await Blog.find({ isPublished: false }).limit(3);
    console.log(`📝 Found ${unpublishedBlogs.length} unpublished blogs`);
    
    if (unpublishedBlogs.length === 0) {
      console.log('❌ No unpublished blogs found to publish');
      await mongoose.disconnect();
      return;
    }
    
    // Publish the first 3 blogs
    const publishedBlogs = [];
    for (const blog of unpublishedBlogs) {
      console.log(`📤 Publishing: "${blog.title}"`);
      
      // Use the blog's publish method which sets isPublished=true and publishedDate
      await blog.publish();
      publishedBlogs.push(blog);
      
      console.log(`   ✅ Published successfully (ID: ${blog._id})`);
    }
    
    console.log(`\n🎉 Successfully published ${publishedBlogs.length} blogs:`);
    publishedBlogs.forEach((blog, index) => {
      console.log(`   ${index + 1}. "${blog.title}"`);
      console.log(`      - Published: ${blog.isPublished ? 'YES' : 'NO'}`);
      console.log(`      - Published Date: ${blog.publishedDate}`);
      console.log(`      - Category: ${blog.category}`);
    });
    
    // Verify the change
    const totalPublished = await Blog.countDocuments({ isPublished: true });
    console.log(`\n📊 Total published blogs now: ${totalPublished}`);
    
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    try {
      await mongoose.disconnect();
    } catch (e) {
      // Ignore disconnect errors
    }
  }
}

publishSampleBlogs();