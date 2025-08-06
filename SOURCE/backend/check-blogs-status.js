#!/usr/bin/env node

/**
 * Check current blog status and investigate GET endpoint issue
 */

const mongoose = require('mongoose');
const Blog = require('./models/Blog');

async function checkBlogsStatus() {
  try {
    console.log('🔍 Checking blogs status in database...');
    
    // Connect to database
    const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/project_mgmt';
    console.log(`📊 Connecting to: ${dbUri}`);
    
    await mongoose.connect(dbUri);
    console.log('✅ Connected to MongoDB');
    
    // Check total blogs in database
    const totalBlogs = await Blog.countDocuments();
    console.log(`📊 Total blogs in database: ${totalBlogs}`);
    
    // Check blogs by publication status
    const publishedBlogs = await Blog.countDocuments({ isPublished: true });
    const unpublishedBlogs = await Blog.countDocuments({ isPublished: false });
    console.log(`📄 Published blogs: ${publishedBlogs}`);
    console.log(`📝 Unpublished blogs (drafts): ${unpublishedBlogs}`);
    
    // Get all blogs with details
    const allBlogs = await Blog.find({}).select('title isPublished category author createdAt').sort({ createdAt: -1 });
    
    console.log('\n📄 All blogs in database:');
    if (allBlogs.length === 0) {
      console.log('   ❌ No blogs found in database');
    } else {
      allBlogs.forEach((blog, index) => {
        console.log(`   ${index + 1}. "${blog.title}"`);
        console.log(`      - ID: ${blog._id}`);
        console.log(`      - Published: ${blog.isPublished ? 'YES' : 'NO (DRAFT)'}`);
        console.log(`      - Category: ${blog.category}`);
        console.log(`      - Author: ${blog.author}`);
        console.log(`      - Created: ${blog.createdAt}`);
        console.log('');
      });
    }
    
    // Test the GET endpoint logic manually
    console.log('🧪 Testing GET endpoint logic...');
    
    // Test 1: Get all blogs (including unpublished)
    console.log('\n🔍 Test 1: All blogs (includeUnpublished=true)');
    const allBlogsQuery = await Blog.find({})
      .select('-content')
      .sort({ createdAt: -1 })
      .lean();
    console.log(`   Found: ${allBlogsQuery.length} blogs`);
    
    // Test 2: Get only published blogs (default behavior)
    console.log('\n🔍 Test 2: Published blogs only (default)');
    const publishedBlogsQuery = await Blog.find({ isPublished: true })
      .select('-content')
      .sort({ createdAt: -1 })
      .lean();
    console.log(`   Found: ${publishedBlogsQuery.length} published blogs`);
    
    if (publishedBlogsQuery.length === 0 && allBlogsQuery.length > 0) {
      console.log('   🚨 ISSUE IDENTIFIED: All blogs are unpublished (drafts)!');
      console.log('   📝 The GET endpoint filters out unpublished blogs by default');
      console.log('   💡 To see blogs, either:');
      console.log('      - Publish some blogs (set isPublished: true)');
      console.log('      - Use includeUnpublished=true query parameter');
    }
    
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

checkBlogsStatus();