#!/usr/bin/env node

const mongoose = require('mongoose');

async function simpleSeed() {
  try {
    console.log('🌱 Simple database seeding...');
    
    // Direct connection without custom config
    await mongoose.connect('mongodb://localhost:27017/project_mgmt');
    console.log('✅ Connected to MongoDB');
    
    // Load models
    const { Project, Task, Blog } = require('./models');
    
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await Project.deleteMany({});
    await Task.deleteMany({});
    await Blog.deleteMany({});
    
    // Create sample project
    console.log('📊 Creating sample project...');
    const project = new Project({
      name: 'Test Project',
      description: 'This is a test project for verifying database functionality.'
    });
    await project.save();
    console.log('✅ Project created:', project.name);
    
    // Create sample task
    console.log('📋 Creating sample task...');
    const task = new Task({
      projectId: project._id,
      title: 'Test Task',
      description: 'This is a test task.',
      status: 'pending',
      priority: 'medium'
    });
    await task.save();
    console.log('✅ Task created:', task.title);
    
    // Create sample blog
    console.log('📝 Creating sample blog...');
    const blog = new Blog({
      projectId: project._id,
      title: 'Test Blog Entry',
      content: '# Test Blog\n\nThis is a test blog entry to verify the database is working.',
      tags: ['test', 'database'],
      isPublished: true,
      publishedDate: new Date()
    });
    await blog.save();
    console.log('✅ Blog created:', blog.title);
    
    // Verify data
    const projectCount = await Project.countDocuments();
    const taskCount = await Task.countDocuments();
    const blogCount = await Blog.countDocuments();
    
    console.log('\n📊 Database Summary:');
    console.log(`   Projects: ${projectCount}`);
    console.log(`   Tasks: ${taskCount}`);
    console.log(`   Blogs: ${blogCount}`);
    
    console.log('\n🎉 Simple seed completed successfully!');
    
  } catch (error) {
    console.error('❌ Simple seed failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

simpleSeed();