/**
 * Jest Setup Configuration
 * Global test setup for database model testing
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'memory'; // Will be overridden by mongodb-memory-server

// Global test timeout
jest.setTimeout(30000);

// Console configuration for tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  // Suppress console warnings and errors during tests unless they're test-related
  console.error = (message, ...args) => {
    if (
      typeof message === 'string' &&
      (message.includes('DeprecationWarning') ||
       message.includes('MongoMemoryServer') ||
       message.includes('mongoose'))
    ) {
      return; // Suppress MongoDB/Mongoose warnings during tests
    }
    originalConsoleError(message, ...args);
  };

  console.warn = (message, ...args) => {
    if (
      typeof message === 'string' &&
      (message.includes('DeprecationWarning') ||
       message.includes('MongoMemoryServer') ||
       message.includes('mongoose'))
    ) {
      return; // Suppress MongoDB/Mongoose warnings during tests
    }
    originalConsoleWarn(message, ...args);
  };
});

afterAll(() => {
  // Restore original console methods
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Global error handler for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Custom matchers
expect.extend({
  toBeValidObjectId(received) {
    const isValid = received && 
                   typeof received === 'object' && 
                   received.constructor.name === 'ObjectId';
    
    if (isValid) {
      return {
        message: () => `expected ${received} not to be a valid ObjectId`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid ObjectId`,
        pass: false,
      };
    }
  },

  toBeWithinDateRange(received, startDate, endDate) {
    const receivedTime = new Date(received).getTime();
    const startTime = new Date(startDate).getTime();
    const endTime = new Date(endDate).getTime();
    
    const isWithinRange = receivedTime >= startTime && receivedTime <= endTime;
    
    if (isWithinRange) {
      return {
        message: () => `expected ${received} not to be within date range ${startDate} - ${endDate}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within date range ${startDate} - ${endDate}`,
        pass: false,
      };
    }
  },

  toHaveValidationError(received, field) {
    const hasValidationError = received &&
                              received.errors &&
                              received.errors[field];
    
    if (hasValidationError) {
      return {
        message: () => `expected not to have validation error for field '${field}'`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected to have validation error for field '${field}'`,
        pass: false,
      };
    }
  }
});

// Test database configuration
global.TEST_CONFIG = {
  database: {
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    }
  },
  
  // Test data factories
  factories: {
    createValidProject: (overrides = {}) => ({
      name: 'Test Project',
      description: 'This is a test project description that meets the minimum length requirement.',
      ...overrides
    }),
    
    createValidTask: (projectId, overrides = {}) => ({
      projectId,
      title: 'Test Task',
      ...overrides
    }),
    
    createValidBlog: (projectId, overrides = {}) => ({
      projectId,
      title: 'Test Blog Post',
      content: 'This is a test blog post content that meets the minimum length requirement.',
      ...overrides
    }),
    
    createValidFile: (entityId, overrides = {}) => ({
      filename: 'test-file.pdf',
      originalName: 'Test File.pdf',
      mimetype: 'application/pdf',
      size: 1024,
      path: '/uploads/test/test-file.pdf',
      entityType: 'project',
      entityId,
      ...overrides
    })
  }
};