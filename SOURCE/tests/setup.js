// Test setup file for Jest
const mongoose = require('mongoose');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/project_management_test';

// Increase timeout for database operations
jest.setTimeout(30000);

// Mock console.log to reduce noise in tests
const originalConsoleLog = console.log;
console.log = (...args) => {
  // Only log in verbose mode or for specific test messages
  if (process.env.JEST_VERBOSE || args[0]?.includes?.('Test')) {
    originalConsoleLog(...args);
  }
};

// Mock console.error for Winston in tests
const originalConsoleError = console.error;
console.error = (...args) => {
  // Still log errors but suppress Winston noise
  if (!args[0]?.includes?.('winston') && !args[0]?.includes?.('MongoDB connection')) {
    originalConsoleError(...args);
  }
};

// Global test utilities
global.testUtils = {
  // Helper to create test database connection
  async connectTestDB() {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
    }
  },

  // Helper to clean test database
  async cleanTestDB() {
    if (mongoose.connection.readyState === 1) {
      const collections = await mongoose.connection.db.listCollections().toArray();
      await Promise.all(
        collections.map(collection => 
          mongoose.connection.db.collection(collection.name).deleteMany({})
        )
      );
    }
  },

  // Helper to disconnect from test database
  async disconnectTestDB() {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  }
};

// Global beforeAll for all tests
beforeAll(async () => {
  await global.testUtils.connectTestDB();
});

// Global afterAll for all tests
afterAll(async () => {
  await global.testUtils.disconnectTestDB();
});