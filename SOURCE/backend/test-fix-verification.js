#!/usr/bin/env node

/**
 * Test the blog creation fix
 * This will test if the controller now properly handles silent failures
 */

async function testBlogCreationFix() {
  try {
    console.log('🔍 Testing blog creation fix...');
    
    // Test data
    const blogData = {
      title: 'Fix Test Blog Post',
      content: 'Testing the fix for silent blog creation failures',
      category: 'technical',
      author: 'system',
      draft: true
    };
    
    console.log('📝 Making POST request to test the fix...');
    
    // Make actual HTTP request to the API
    const response = await fetch('http://localhost:8090/api/v1/blogs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(blogData)
    });
    
    console.log('📡 Response status:', response.status);
    
    if (response.ok) {
      const responseData = await response.json();
      console.log('✅ API response success');
      console.log('📊 Created blog ID:', responseData.data._id);
      
      // Wait for database operations
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verify in database
      const mongoose = require('mongoose');
      await mongoose.connect('mongodb://localhost:27017/project_mgmt');
      
      const savedBlog = await mongoose.connection.db.collection('blogs').findOne({ 
        _id: new mongoose.Types.ObjectId(responseData.data._id) 
      });
      
      if (savedBlog) {
        console.log('✅ FIX VERIFIED: Blog found in database');
        console.log('📊 Database blog:', {
          id: savedBlog._id,
          title: savedBlog.title,
          isPublished: savedBlog.isPublished
        });
      } else {
        console.log('❌ FIX FAILED: Blog still not in database');
      }
      
      await mongoose.disconnect();
      
    } else {
      const errorData = await response.json();
      console.log('📄 API Error Response:', errorData);
      
      if (response.status === 500 && errorData.message?.includes('Failed to save blog to database')) {
        console.log('✅ FIX WORKING: API now properly detects and reports silent failures');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('🚨 Server not running. Please start the server first.');
    }
  }
}

testBlogCreationFix();