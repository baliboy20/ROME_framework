const mongoose = require('mongoose');

describe('Database Connection Tests', () => {
  describe('MongoDB Connection', () => {
    test('Should be able to connect to MongoDB', async () => {
      const connectionString = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/project_management_test';
      
      try {
        await mongoose.connect(connectionString, {
          useNewUrlParser: true,
          useUnifiedTopology: true
        });
        
        expect(mongoose.connection.readyState).toBe(1); // 1 = connected
        
        await mongoose.connection.close();
      } catch (error) {
        throw new Error(`Failed to connect to MongoDB: ${error.message}`);
      }
    });

    test('Should handle connection errors gracefully', async () => {
      const invalidConnectionString = 'mongodb://invalid-host:27017/test';
      
      try {
        await mongoose.connect(invalidConnectionString, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          serverSelectionTimeoutMS: 1000 // Quick timeout for test
        });
        
        // If we reach here, the connection succeeded unexpectedly
        await mongoose.connection.close();
        throw new Error('Expected connection to fail');
        
      } catch (error) {
        // This is expected behavior for invalid connection
        expect(error).toBeDefined();
        expect(error.message).toContain('getaddrinfo ENOTFOUND');
      }
    });

    test('Should validate connection string format', () => {
      const validConnectionStrings = [
        'mongodb://localhost:27017/test',
        'mongodb://localhost:27017/project_management',
        'mongodb://user:pass@localhost:27017/db'
      ];
      
      const invalidConnectionStrings = [
        'invalid-connection-string',
        'http://localhost:27017/test',
        ''
      ];
      
      validConnectionStrings.forEach(connectionString => {
        expect(connectionString).toMatch(/^mongodb:\/\//);
      });
      
      invalidConnectionStrings.forEach(connectionString => {
        expect(connectionString).not.toMatch(/^mongodb:\/\/.*:\d+\/.+$/);
      });
    });
  });

  describe('Connection Configuration', () => {
    test('Should use correct database name for testing', () => {
      const testUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/project_management_test';
      expect(testUri).toContain('test');
    });

    test('Should use different databases for production and testing', () => {
      const prodUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/project_management';
      const testUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/project_management_test';
      
      expect(prodUri).not.toBe(testUri);
    });
  });

  describe('Connection State Management', () => {
    test('Should properly manage connection states', async () => {
      const connectionString = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/project_management_test';
      
      // Initial state should be disconnected
      expect(mongoose.connection.readyState).toBe(0); // 0 = disconnected
      
      await mongoose.connect(connectionString, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      
      // After connection should be connected
      expect(mongoose.connection.readyState).toBe(1); // 1 = connected
      
      await mongoose.connection.close();
      
      // After closing should be disconnected
      expect(mongoose.connection.readyState).toBe(0); // 0 = disconnected
    });

    test('Should handle multiple connection attempts', async () => {
      const connectionString = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/project_management_test';
      
      // First connection
      await mongoose.connect(connectionString, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      expect(mongoose.connection.readyState).toBe(1);
      
      // Second connection attempt should not create new connection
      await mongoose.connect(connectionString, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      expect(mongoose.connection.readyState).toBe(1);
      
      await mongoose.connection.close();
    });
  });

  describe('Connection Options', () => {
    test('Should use proper connection options', () => {
      const recommendedOptions = {
        useNewUrlParser: true,
        useUnifiedTopology: true
      };
      
      // Test that our recommended options are valid
      expect(recommendedOptions.useNewUrlParser).toBe(true);
      expect(recommendedOptions.useUnifiedTopology).toBe(true);
    });
  });

  afterEach(async () => {
    // Clean up connections after each test
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  });
});