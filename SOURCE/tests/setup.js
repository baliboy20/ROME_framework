"use strict";
/**
 * Jest Test Setup for Contract Tests
 * TDD-ROME Test Environment Configuration
 */
Object.defineProperty(exports, "__esModule", { value: true });
// Global test setup and teardown
beforeAll(async () => {
    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.WEAVIATE_HOST = 'localhost';
    process.env.WEAVIATE_SCHEME = 'http';
    process.env.WEAVIATE_PORT = '8080';
    console.log('🧪 Contract Test Environment Initialized');
    console.log('⚠️  All tests should FAIL until implementations are created');
});
afterAll(async () => {
    console.log('🏁 Contract Test Suite Completed');
});
// Increase timeout for async operations
jest.setTimeout(30000);
//# sourceMappingURL=setup.js.map