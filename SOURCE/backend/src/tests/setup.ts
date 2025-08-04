/**
 * Test Setup Configuration
 * Sets up the testing environment for Jest with ESM support
 */

import { jest, afterEach } from '@jest/globals';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.GOOGLE_CLIENT_ID = 'test-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
process.env.GOOGLE_REDIRECT_URI = 'http://localhost:3000/api/auth/google/callback';
process.env.MONGODB_URI = 'mongodb://localhost:27017';
process.env.MONGODB_DB_NAME = 'medium_extractor_test';
process.env.SESSION_SECRET = 'test-session-secret';
process.env.ENCRYPTION_SECRET = 'test-encryption-secret-32-chars-min';

// Global test timeout
jest.setTimeout(30000);

// Mock console methods to reduce test noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Clean up after tests
afterEach(() => {
  jest.clearAllMocks();
});

export default {};