#!/usr/bin/env node

/**
 * Debug Blog Query - Check what's actually in the database
 */

const mongoose = require('mongoose');
const path = require('path');

// Import models
const Blog = require('./models/Blog');

const debugBlogQuery = async () => {
  try {
    console.log('🔍 Debugging Blog Query Issue...');
    
    // Connect to database
    const mongoUri = 'mongodb://localhost:27017/project_management_test';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // 1. Check total blog count (no filters)
    const totalBlogs = await Blog.countDocuments();
    console.log(`\n📊 Total blogs in database: ${totalBlogs}`);
    
    if (totalBlogs === 0) {
      console.log('❌ No blogs found in database at all!');
      await mongoose.disconnect();
      return;
    }
    
    // 2. Get all blogs without any filters
    console.log('\n📋 All blogs in database (no filters):');
    const allBlogs = await Blog.find({});
    allBlogs.forEach((blog, index) => {
      console.log(`   ${index + 1}. "${blog.title}"`);
      console.log(`      - isPublished: ${blog.isPublished}`);
      console.log(`      - draft: ${blog.draft}`);
      console.log(`      - publishedDate: ${blog.publishedDate}`);
      console.log(`      - _id: ${blog._id}`);
      console.log('');
    });
    
    // 3. Test the exact query that the API uses
    console.log('🔍 Testing API query: { isPublished: true }');
    const publishedBlogs = await Blog.find({ isPublished: true });
    console.log(`   Found: ${publishedBlogs.length} published blogs`);
    
    // 4. Test various other filters
    console.log('\n🧪 Testing other filters:');
    const draftFalse = await Blog.find({ draft: false });
    console.log(`   draft: false -> ${draftFalse.length} blogs`);
    
    const isPublishedTrue = await Blog.find({ isPublished: true });
    console.log(`   isPublished: true -> ${isPublishedTrue.length} blogs`);
    
    const isPublishedExists = await Blog.find({ isPublished: { $exists: true } });
    console.log(`   isPublished exists -> ${isPublishedExists.length} blogs`);
    
    // 5. Show the exact document structure
    if (allBlogs.length > 0) {
      console.log('\n📄 First blog document structure:');
      console.log(JSON.stringify(allBlogs[0].toObject(), null, 2));
    }
    
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    await mongoose.disconnect();
  }
};

debugBlogQuery();