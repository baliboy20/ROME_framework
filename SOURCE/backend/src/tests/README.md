# Test Suite Documentation

## Overview
Comprehensive test suite for the Medium Flutter Link Extractor backend API, covering unit tests for all services and integration tests for API endpoints.

## Test Structure

### Unit Tests (`src/tests/services/`)
- **AuthService.test.ts** - OAuth2 authentication, token management, and security features
- **GmailService.test.ts** - Gmail API integration, email parsing, and link extraction
- **ScraperService.test.ts** - Web scraping functionality, content extraction, and queue management
- **StorageService.test.ts** - MongoDB operations, file system storage, and data management

### Integration Tests (`src/tests/integration/`)
- **api.test.ts** - Complete API endpoint testing with service integration

### Test Configuration
- **setup.ts** - Jest test environment setup with ESM support

## Coverage Requirements
The Jest configuration enforces 80% coverage across:
- Branches: 80%
- Functions: 80%
- Lines: 80%
- Statements: 80%

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

## Test Features

### Service Unit Tests
- **Comprehensive mocking** of external dependencies (MongoDB, Gmail API, Puppeteer)
- **Error handling** validation for all failure scenarios
- **Edge case testing** for boundary conditions
- **State management** validation for complex operations
- **Security testing** for authentication and token management

### Integration Tests
- **End-to-end API testing** with supertest
- **Service integration** validation
- **Error response** testing
- **CORS and middleware** validation
- **Rate limiting** verification

### Mock Strategy
- MongoDB collections and operations
- Gmail API calls and responses
- Puppeteer browser automation
- File system operations
- External service dependencies

## Test Coverage Areas

### AuthService (100% coverage target)
- OAuth2 URL generation with PKCE
- Callback handling and state validation
- Token refresh and validation
- Access revocation
- Error handling for authentication failures

### GmailService (100% coverage target)
- Email fetching with filters
- Link extraction from HTML and plain text
- Flutter-specific content filtering
- Batch processing and caching
- API quota management

### ScraperService (100% coverage target)
- URL scraping with Puppeteer
- Content extraction and processing
- Batch scraping with progress tracking
- Queue management and cancellation
- Resource optimization and error handling

### StorageService (100% coverage target)
- MongoDB document operations
- File system storage and retrieval
- Article deduplication by URL hash
- Query filtering and pagination
- Storage statistics and management

### API Integration (100% coverage target)
- Authentication endpoints
- Email digest retrieval
- Scraping operations (single and batch)
- Article management CRUD operations
- Error handling and validation

## Mock Data
All tests use realistic mock data that mirrors production data structures:
- Gmail message objects with proper headers and payload
- Scraped content with metadata and markdown
- MongoDB document structures with ObjectIds
- OAuth2 tokens and authentication responses

## Environment Setup
Tests run in isolated environment with:
- Test-specific environment variables
- Mocked external services
- In-memory data structures
- Console output suppression for clean test runs

## Security Testing
- PKCE flow validation in OAuth2
- State parameter verification
- Token encryption and storage
- Access token refresh handling
- Proper error sanitization

## Performance Testing
- Queue management efficiency
- Batch processing capabilities
- Memory leak prevention
- Resource cleanup validation

This test suite ensures the reliability, security, and performance of the Medium Flutter Link Extractor backend system.