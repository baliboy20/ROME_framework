#!/usr/bin/env node

/**
 * Debug script to reproduce the blog creation issue
 * Issue: Blog shows as created in logs but not saved to database
 */

const mongoose = require('mongoose');
const Blog = require('./models/Blog');

async function debugBlogCreation() {
  try {
    console.log('🔍 Starting blog creation debug...');
    
    // Connect to database
    const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/project_mgmt';
    console.log(`📊 Connecting to: ${dbUri}`);
    
    await mongoose.connect(dbUri);
    console.log('✅ Connected to MongoDB');
    
    // Test the exact same data that failed
    const testBlogData = {
      title: 'Test Blog Debug',
      content: 'This is a test blog to debug the creation issue',
      category: 'technical',
      author: 'system',
      draft: true // This should be converted to isPublished: false
    };
    
    console.log('📝 Attempting to create blog with data:', testBlogData);
    
    // Transform frontend 'draft' field to backend 'isPublished' field (same as controller)
    const blogData = { ...testBlogData };
    if (blogData.draft !== undefined) {
      blogData.isPublished = !blogData.draft; // draft: true means isPublished: false
      delete blogData.draft; // Remove the draft field
    }
    
    console.log('🔄 Transformed data:', blogData);
    
    // Create blog and capture the process
    console.log('💾 Creating blog...');
    const blog = await Blog.create(blogData);
    
    console.log('✅ Blog created with ID:', blog._id);
    console.log('📊 Blog data:', {
      id: blog._id,
      title: blog.title,
      isPublished: blog.isPublished,
      category: blog.category,
      author: blog.author
    });
    
    // Verify it was actually saved by finding it
    console.log('🔍 Verifying blog was saved...');
    const savedBlog = await Blog.findById(blog._id);
    
    if (savedBlog) {
      console.log('✅ VERIFICATION PASSED: Blog found in database');
      console.log('📄 Saved blog:', {
        id: savedBlog._id,
        title: savedBlog.title,
        isPublished: savedBlog.isPublished,
        createdAt: savedBlog.createdAt
      });
    } else {
      console.log('❌ VERIFICATION FAILED: Blog not found in database');
      console.log('🚨 This reproduces the reported issue!');
    }
    
    // Check total blogs count
    const totalBlogs = await Blog.countDocuments();
    console.log(`📊 Total blogs in database: ${totalBlogs}`);
    
    // List all blogs to see what's there
    const allBlogs = await Blog.find({}).limit(5);
    console.log('📄 Recent blogs in database:');
    allBlogs.forEach((blog, index) => {
      console.log(`   ${index + 1}. "${blog.title}" (ID: ${blog._id}) - Published: ${blog.isPublished}`);
    });
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error during debug:', error);
    console.error('Stack trace:', error.stack);
    
    // Check if it's a validation error
    if (error.name === 'ValidationError') {
      console.log('🚨 VALIDATION ERROR DETECTED:');
      Object.values(error.errors).forEach(err => {
        console.log(`   - ${err.path}: ${err.message}`);
      });
    }
    
    try {
      await mongoose.disconnect();
    } catch (e) {
      // Ignore disconnect errors
    }
  }
}

debugBlogCreation();