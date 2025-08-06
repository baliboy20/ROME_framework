const mongoose = require('mongoose');
const DatabaseConfig = require('../../backend/config/database');

describe('Database Configuration Tests', () => {
  let originalConsoleLog;
  let originalConsoleError;

  beforeAll(() => {
    // Mock console methods to reduce test noise
    originalConsoleLog = console.log;
    originalConsoleError = console.error;
    console.log = jest.fn();
    console.error = jest.fn();
  });

  afterAll(() => {
    // Restore console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  afterEach(async () => {
    // Clean up connections after each test
    if (DatabaseConfig.isDbConnected()) {
      await DatabaseConfig.disconnect();
    }
  });

  describe('Connection Management', () => {
    test('Should initialize with disconnected state', () => {
      expect(DatabaseConfig.isDbConnected()).toBe(false);
      expect(DatabaseConfig.getConnectionStatus()).toBe('disconnected');
    });

    test('Should connect to database successfully', async () => {
      const connectionString = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/project_management_test';
      
      await DatabaseConfig.connect(connectionString);
      
      expect(DatabaseConfig.isDbConnected()).toBe(true);
      expect(DatabaseConfig.getConnectionStatus()).toBe('connected');
    });

    test('Should handle connection to invalid database gracefully', async () => {
      const invalidConnectionString = 'mongodb://invalid-host:27017/test';
      
      await expect(DatabaseConfig.connect(invalidConnectionString))
        .rejects
        .toThrow();
    });

    test('Should not create duplicate connections', async () => {
      const connectionString = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/project_management_test';
      
      await DatabaseConfig.connect(connectionString);
      const firstConnectionState = DatabaseConfig.getConnectionStatus();
      
      await DatabaseConfig.connect(connectionString);
      const secondConnectionState = DatabaseConfig.getConnectionStatus();
      
      expect(firstConnectionState).toBe('connected');
      expect(secondConnectionState).toBe('connected');
    });

    test('Should disconnect successfully', async () => {
      const connectionString = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/project_management_test';
      
      await DatabaseConfig.connect(connectionString);
      expect(DatabaseConfig.isDbConnected()).toBe(true);
      
      await DatabaseConfig.disconnect();
      expect(DatabaseConfig.isDbConnected()).toBe(false);
    });

    test('Should handle disconnect when not connected', async () => {
      expect(DatabaseConfig.isDbConnected()).toBe(false);
      
      // Should not throw error
      await expect(DatabaseConfig.disconnect()).resolves.toBeUndefined();
    });
  });

  describe('Connection Info', () => {
    test('Should provide connection information when connected', async () => {
      const connectionString = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/project_management_test';
      
      await DatabaseConfig.connect(connectionString);
      
      const info = DatabaseConfig.getConnectionInfo();
      
      expect(info).toHaveProperty('status');
      expect(info).toHaveProperty('readyState');
      expect(info.status).toBe('connected');
      expect(info.readyState).toBe(1);
    });

    test('Should provide disconnected status when not connected', () => {
      const info = DatabaseConfig.getConnectionInfo();
      
      expect(info.status).toBe('disconnected');
      expect(info.readyState).toBe(0);
    });
  });

  describe('Health Check', () => {
    test('Should return unhealthy when disconnected', async () => {
      const health = await DatabaseConfig.healthCheck();
      
      expect(health.status).toBe('unhealthy');
      expect(health.message).toBe('Database not connected');
      expect(health).toHaveProperty('timestamp');
    });

    test('Should return healthy when connected', async () => {
      const connectionString = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/project_management_test';
      
      await DatabaseConfig.connect(connectionString);
      
      const health = await DatabaseConfig.healthCheck();
      
      expect(health.status).toBe('healthy');
      expect(health.message).toBe('Database connection is working');
      expect(health).toHaveProperty('connectionInfo');
      expect(health).toHaveProperty('timestamp');
    });
  });

  describe('Database Statistics', () => {
    test('Should throw error when getting stats while disconnected', async () => {
      await expect(DatabaseConfig.getStats())
        .rejects
        .toThrow('Database not connected');
    });

    test('Should return database statistics when connected', async () => {
      const connectionString = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/project_management_test';
      
      await DatabaseConfig.connect(connectionString);
      
      const stats = await DatabaseConfig.getStats();
      
      expect(stats).toHaveProperty('collections');
      expect(stats).toHaveProperty('dataSize');
      expect(stats).toHaveProperty('indexSize');
      expect(stats).toHaveProperty('storageSize');
      expect(stats).toHaveProperty('objects');
      expect(typeof stats.collections).toBe('number');
    });
  });

  describe('Connection Options', () => {
    test('Should use recommended connection options', () => {
      expect(DatabaseConfig.connectionOptions).toHaveProperty('useNewUrlParser', true);
      expect(DatabaseConfig.connectionOptions).toHaveProperty('useUnifiedTopology', true);
      expect(DatabaseConfig.connectionOptions).toHaveProperty('maxPoolSize');
      expect(DatabaseConfig.connectionOptions).toHaveProperty('serverSelectionTimeoutMS');
    });
  });

  describe('Connection State Validation', () => {
    test('Should correctly identify connection states', async () => {
      // Start disconnected
      expect(DatabaseConfig.getConnectionStatus()).toBe('disconnected');
      
      const connectionString = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/project_management_test';
      
      // Connect
      await DatabaseConfig.connect(connectionString);
      expect(DatabaseConfig.getConnectionStatus()).toBe('connected');
      
      // Disconnect
      await DatabaseConfig.disconnect();
      expect(DatabaseConfig.getConnectionStatus()).toBe('disconnected');
    });
  });
});