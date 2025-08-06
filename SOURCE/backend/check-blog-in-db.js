#!/usr/bin/env node

const mongoose = require('mongoose');

async function checkBlogInDatabase() {
  try {
    console.log('🔍 Checking for blog in database...');
    
    // Connect to the database the server is using
    const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/project_mgmt';
    console.log(`📊 Connecting to: ${dbUri}`);
    
    await mongoose.connect(dbUri);
    console.log('✅ Connected to MongoDB');
    
    // Check collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📁 Collections: ${collections.map(c => c.name).join(', ')}`);
    
    // Check for blogs collection
    if (collections.some(c => c.name === 'blogs')) {
      const blogsCollection = mongoose.connection.db.collection('blogs');
      
      // Count all blogs
      const totalBlogs = await blogsCollection.countDocuments();
      console.log(`📊 Total blogs in collection: ${totalBlogs}`);
      
      // Show all blogs
      const allBlogs = await blogsCollection.find({}).toArray();
      console.log(`\n📄 All blogs in database:`);
      
      if (allBlogs.length === 0) {
        console.log('   ❌ No blogs found in database!');
      } else {
        allBlogs.forEach((blog, index) => {
          console.log(`   ${index + 1}. "${blog.title}" (ID: ${blog._id})`);
          console.log(`      - draft: ${blog.draft}`);
          console.log(`      - isPublished: ${blog.isPublished}`);
          console.log(`      - createdAt: ${blog.createdAt}`);
          console.log('');
        });
      }
      
      // Look for the specific blog ID from the logs
      const blogId = '68920d58a9330d41d71461ed';
      const specificBlog = await blogsCollection.findOne({ 
        _id: new mongoose.Types.ObjectId(blogId) 
      });
      
      if (specificBlog) {
        console.log(`✅ Found the specific blog from logs:`);
        console.log(`   Title: "${specificBlog.title}"`);
        console.log(`   Content: ${specificBlog.content ? specificBlog.content.substring(0, 100) : 'No content'}...`);
        console.log(`   Draft: ${specificBlog.draft}`);
        console.log(`   IsPublished: ${specificBlog.isPublished}`);
      } else {
        console.log(`❌ Specific blog with ID ${blogId} not found`);
      }
      
    } else {
      console.log('❌ No "blogs" collection found in database');
      console.log('🔧 This suggests the blog creation failed or went to wrong database');
    }
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    try {
      await mongoose.disconnect();
    } catch (e) {
      // Ignore disconnect errors
    }
  }
}

checkBlogInDatabase();