#!/usr/bin/env node

const mongoose = require('mongoose');

async function loadSampleData() {
  try {
    console.log('🌱 Loading comprehensive sample data...');
    
    // Direct connection
    await mongoose.connect('mongodb://localhost:27017/project_mgmt');
    console.log('✅ Connected to MongoDB');
    
    // Load sample data function from seed file
    const seedModule = require('./seeds/001_sample_data');
    
    // Execute the seeding
    const result = await seedModule.up();
    
    console.log('\n🎉 Sample data loaded successfully!');
    
  } catch (error) {
    console.error('❌ Failed to load sample data:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

loadSampleData();