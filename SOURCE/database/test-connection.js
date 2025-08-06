#!/usr/bin/env node

const mongoose = require('mongoose');
const databaseConfig = require('../backend/config/database');

async function testConnection() {
  try {
    console.log('🔗 Testing database connection...');
    
    const connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/project_mgmt_test';
    await databaseConfig.connect(connectionString);
    
    console.log('✅ Connected successfully!');
    
    // Test basic operations
    console.log('🧪 Testing basic operations...');
    
    // Create a simple test collection
    const TestModel = mongoose.model('Test', new mongoose.Schema({
      name: String,
      date: { type: Date, default: Date.now }
    }));
    
    // Insert a test document
    const testDoc = new TestModel({ name: 'Connection Test' });
    await testDoc.save();
    console.log('✅ Insert operation successful');
    
    // Find the document
    const found = await TestModel.findOne({ name: 'Connection Test' });
    console.log('✅ Find operation successful:', found.name);
    
    // Delete the document
    await TestModel.deleteMany({});
    console.log('✅ Delete operation successful');
    
    // Drop the test collection
    await TestModel.collection.drop();
    console.log('✅ Collection drop successful');
    
    console.log('🎉 All database operations working correctly!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    process.exit(1);
  } finally {
    await databaseConfig.disconnect();
  }
}

testConnection();