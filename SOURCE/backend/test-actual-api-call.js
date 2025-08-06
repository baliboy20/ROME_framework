#!/usr/bin/env node

/**
 * Test the actual API endpoint to reproduce the exact issue
 * This makes a real HTTP request like the user's curl command
 */

const mongoose = require('mongoose');

async function testActualAPICall() {
  try {
    console.log('🔍 Testing actual API call...');
    
    // Test data similar to what user was trying to create
    const blogData = {
      title: 'API Test Blog Post',
      content: 'This is a test to reproduce the API creation issue where blogs appear in logs but not in database',
      category: 'technical',
      author: 'system',
      draft: true
    };
    
    console.log('📝 Making POST request to /api/v1/blogs...');
    console.log('📊 Request data:', { ...blogData, content: '[REDACTED]' });
    
    // Make actual HTTP request to the API
    const response = await fetch('http://localhost:8090/api/v1/blogs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(blogData)
    });
    
    console.log('📡 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseData = await response.json();
    console.log('📄 Response body:', responseData);
    
    if (response.status === 201 && responseData.success) {
      const blogId = responseData.data._id;
      console.log('✅ API reported successful creation with ID:', blogId);
      
      // Wait a moment for any async operations to complete
      console.log('⏳ Waiting 2 seconds for database operations to complete...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Now check if the blog actually exists in the database
      console.log('🔍 Verifying blog exists in database...');
      
      // Connect to database to check
      const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/project_mgmt';
      await mongoose.connect(dbUri);
      
      const blogsCollection = mongoose.connection.db.collection('blogs');
      const savedBlog = await blogsCollection.findOne({ 
        _id: new mongoose.Types.ObjectId(blogId) 
      });
      
      if (savedBlog) {
        console.log('✅ VERIFICATION PASSED: Blog found in database');
        console.log('📊 Database blog:', {
          id: savedBlog._id,
          title: savedBlog.title,
          isPublished: savedBlog.isPublished,
          createdAt: savedBlog.createdAt
        });
      } else {
        console.log('❌ VERIFICATION FAILED: Blog with ID', blogId, 'not found in database');
        console.log('🚨 THIS REPRODUCES THE BUG: API says success but blog not saved');
        
        // Show what blogs are actually in the database
        const allBlogs = await blogsCollection.find({}).toArray();
        console.log('📄 All blogs in database:');
        allBlogs.forEach((blog, index) => {
          console.log(`   ${index + 1}. "${blog.title}" (ID: ${blog._id})`);
        });
      }
      
      await mongoose.disconnect();
      
    } else {
      console.log('❌ API request failed');
      console.log('📄 Error response:', responseData);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('🚨 Server not running. Please start the server first:');
      console.log('   cd ../SOURCE/backend && npm start');
    }
    
    try {
      await mongoose.disconnect();
    } catch (e) {
      // Ignore disconnect errors
    }
  }
}

testActualAPICall();