#!/usr/bin/env node

/**
 * Enhanced test to identify the exact blog creation issue
 * This script simulates the exact controller logic with additional debugging
 */

const express = require('express');
const mongoose = require('mongoose');
const Blog = require('./models/Blog');
const Project = require('./models/Project');
const Task = require('./models/Task');

async function testBlogCreationWithControllerLogic() {
  try {
    console.log('🔍 Testing blog creation with exact controller logic...');
    
    // Connect to database
    const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/project_mgmt';
    console.log(`📊 Connecting to: ${dbUri}`);
    
    await mongoose.connect(dbUri);
    console.log('✅ Connected to MongoDB');
    
    // Simulate request body that was causing the issue
    const reqBody = {
      title: 'Problematic Blog Post',
      content: 'This blog post simulates the creation issue reported in logs',
      category: 'technical',
      author: 'system',
      draft: true
    };
    
    console.log('📝 Simulating blog creation with request body:', {
      ...reqBody,
      content: '[CONTENT REDACTED]'
    });
    
    // EXACT CONTROLLER LOGIC START
    try {
      // Validate project reference if provided (lines 149-156)
      if (reqBody.projectRef) {
        const project = await Project.findById(reqBody.projectRef);
        if (!project) {
          console.log('❌ Project not found');
          throw new Error('Project not found');
        }
        console.log('✅ Blog linked to project', { projectId: project._id, projectTitle: project.title });
      }

      // Validate task reference if provided (lines 158-166)
      if (reqBody.taskRef) {
        const task = await Task.findById(reqBody.taskRef);
        if (!task) {
          console.log('❌ Task not found');
          throw new Error('Task not found');
        }
        console.log('✅ Blog linked to task', { taskId: task._id, taskTitle: task.title });
      }

      // Transform frontend 'draft' field to backend 'isPublished' field (lines 168-173)
      const blogData = { ...reqBody };
      if (blogData.draft !== undefined) {
        blogData.isPublished = !blogData.draft; // draft: true means isPublished: false
        delete blogData.draft; // Remove the draft field
      }
      
      console.log('🔄 Transformed data for creation:', {
        ...blogData,
        content: '[CONTENT REDACTED]'
      });
      
      // Database write operation with enhanced logging (line 175)
      console.log('💾 Calling Blog.create()...');
      const blog = await Blog.create(blogData);
      console.log('✅ Blog.create() returned:', {
        id: blog._id,
        title: blog.title,
        isPublished: blog.isPublished,
        category: blog.category
      });
      
      // Populate the created blog for response (lines 177-181)
      console.log('🔗 Populating blog references...');
      await blog.populate([
        { path: 'projectRef', select: 'title status' },
        { path: 'taskRef', select: 'title status' }
      ]);
      console.log('✅ Blog populated successfully');

      // Log success (lines 183-188)
      console.log('📄 Blog created successfully:', { 
        blogId: blog._id, 
        title: blog.title,
        isPublished: blog.isPublished,
        category: blog.category
      });

      // CRITICAL: Verify the blog actually exists in database
      console.log('🔍 VERIFICATION: Checking if blog was actually saved...');
      const verificationBlog = await Blog.findById(blog._id);
      
      if (verificationBlog) {
        console.log('✅ VERIFICATION PASSED: Blog found in database');
        console.log('📊 Verified blog data:', {
          id: verificationBlog._id,
          title: verificationBlog.title,
          isPublished: verificationBlog.isPublished,
          createdAt: verificationBlog.createdAt
        });
      } else {
        console.log('❌ VERIFICATION FAILED: Blog not found in database');
        console.log('🚨 THIS IS THE BUG: Blog.create() succeeded but save didn\'t persist');
      }

      // Check if there are any pending database operations
      console.log('⏳ Database connection state:', mongoose.connection.readyState);
      console.log('📊 Active database operations:', mongoose.connection.db.s.topology.s.description);

    } catch (controllerError) {
      console.error('❌ Controller logic error:', controllerError);
      
      if (controllerError.name === 'ValidationError') {
        const messages = Object.values(controllerError.errors).map(err => err.message);
        console.log('🚨 VALIDATION ERROR:', messages);
      }
      if (controllerError.name === 'CastError') {
        console.log('🚨 CAST ERROR: Invalid reference ID');
      }
      
      throw controllerError;
    }
    // EXACT CONTROLLER LOGIC END
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
    
    try {
      await mongoose.disconnect();
    } catch (e) {
      // Ignore disconnect errors
    }
  }
}

testBlogCreationWithControllerLogic();