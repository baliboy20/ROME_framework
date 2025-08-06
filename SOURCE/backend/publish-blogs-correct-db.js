#!/usr/bin/env node

/**
 * Publish blogs in the correct database that the server is using
 */

const mongoose = require('mongoose');
const Blog = require('./models/Blog');

async function publishBlogsInCorrectDatabase() {
  try {
    console.log('🔍 Publishing blogs in server database...');
    
    // Use the same logic as the server to determine database URI
    require('dotenv').config();
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/project_mgmt';
    console.log(`📊 Connecting to server database: ${mongoUri}`);
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB (server database)');
    
    // Get all unpublished blogs
    const unpublishedBlogs = await Blog.find({ isPublished: false }).limit(3);
    console.log(`📝 Found ${unpublishedBlogs.length} unpublished blogs`);
    
    if (unpublishedBlogs.length === 0) {
      console.log('❌ No unpublished blogs found to publish');
      
      // Check if there are any blogs at all
      const totalBlogs = await Blog.countDocuments();
      console.log(`📊 Total blogs in database: ${totalBlogs}`);
      
      if (totalBlogs === 0) {
        console.log('💡 Creating sample published blogs...');
        
        const sampleBlogs = [
          {
            title: 'Welcome to the Project Management System',
            content: 'This is our first blog post about the new project management system. It includes features for managing projects, tasks, and team collaboration.',
            category: 'general',
            author: 'system',
            isPublished: true,
            tags: ['welcome', 'project-management']
          },
          {
            title: 'How to Manage Tasks Effectively',
            content: 'Task management is crucial for project success. Here are some best practices for creating, organizing, and tracking tasks in your projects.',
            category: 'technical',
            author: 'system', 
            isPublished: true,
            tags: ['tasks', 'productivity', 'best-practices']
          },
          {
            title: 'Project Collaboration Features',
            content: 'Our system includes powerful collaboration features including real-time updates, file sharing, and team communication tools.',
            category: 'project_update',
            author: 'system',
            isPublished: true,
            tags: ['collaboration', 'features', 'teamwork']
          }
        ];
        
        for (const blogData of sampleBlogs) {
          const blog = await Blog.create(blogData);
          console.log(`   ✅ Created and published: "${blog.title}" (ID: ${blog._id})`);
        }
        
        console.log(`\n🎉 Created ${sampleBlogs.length} published blog posts`);
      }
      
      await mongoose.disconnect();
      return;
    }
    
    // Publish existing unpublished blogs
    const publishedBlogs = [];
    for (const blog of unpublishedBlogs) {
      console.log(`📤 Publishing: "${blog.title}"`);
      
      // Use the blog's publish method
      await blog.publish();
      publishedBlogs.push(blog);
      
      console.log(`   ✅ Published successfully (ID: ${blog._id})`);
    }
    
    console.log(`\n🎉 Successfully published ${publishedBlogs.length} blogs:`);
    publishedBlogs.forEach((blog, index) => {
      console.log(`   ${index + 1}. "${blog.title}"`);
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

publishBlogsInCorrectDatabase();