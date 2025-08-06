module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/tests/integration/*.test.js'
  ],
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.js'
  ], 
  coverageDirectory: './coverage',
  collectCoverageFrom: [
    'backend/**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!backend/server.js',
    '!backend/logs/**',
    '!backend/uploads/**'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  verbose: true,
  detectOpenHandles: true,
  forceExit: true,
  testPathIgnorePatterns: ['/node_modules/', '/coverage/'],
  testTimeout: 30000
};