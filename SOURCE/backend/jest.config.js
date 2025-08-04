/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        module: 'esnext',
        moduleResolution: 'node',
        allowSyntheticDefaultImports: true,
        esModuleInterop: true
      }
    }]
  },
  moduleNameMapper: {
    // Handle relative imports with .js extension
    '^(\\.{1,2}/.*)\\.js$': '$1',
    // Handle @ path aliases with and without .js extension
    '^@/(.*)\\.js$': '<rootDir>/src/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    // Mock p-queue for tests
    '^p-queue$': '<rootDir>/src/tests/__mocks__/p-queue.js'
  },
  moduleDirectories: ['node_modules', '<rootDir>/src/tests/__mocks__'],
  transformIgnorePatterns: [
    'node_modules/(?!(p-queue|eventemitter3|turndown|marked|cheerio)/)'
  ],
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/types/**/*',
    '!src/tests/**/*'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  testPathIgnorePatterns: [
    'dist/',
    'node_modules/'
  ],
  testTimeout: 30000
};