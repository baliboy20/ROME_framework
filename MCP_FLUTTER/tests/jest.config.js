/**
 * Jest Configuration for Contract Tests
 * TDD-ROME Test Framework Setup
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/contracts'],
  testMatch: ['**/*.contract.test.ts'],
  collectCoverageFrom: [
    '../**/*.ts',
    '!../**/*.d.ts',
    '!../node_modules/**',
    '!../tests/**',
  ],
  coverageDirectory: '../coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/setup.ts'],
  testTimeout: 30000,
  verbose: true,
  bail: false, // Continue running tests even if some fail
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        module: 'commonjs',
        target: 'ES2022',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        moduleResolution: 'node',
        strict: false,
        skipLibCheck: true,
      }
    }]
  },
  transformIgnorePatterns: [
    'node_modules/(?!(node-fetch|weaviate-ts-client)/)'
  ],
};