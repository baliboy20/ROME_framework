#!/usr/bin/env node

/**
 * Database Integration Test Suite
 * Medium Flutter Link Extractor - Database Testing
 * 
 * @author Ashok (Data Architect)
 * @date 2025-07-28
 * @version 1.0.0
 * 
 * Comprehensive testing of database infrastructure including:
 * - Connection pooling functionality
 * - Schema validation
 * - Index performance
 * - Migration system
 * - Query optimization
 * - Integration with backend services
 */

import { MongoClient } from 'mongodb';
import initializeDatabase, { DatabaseInitializer } from './init-database.js';
import { 
  initializeConnectionPool, 
  getDatabase, 
  getConnectionPool,
  healthCheck,
  getPoolStats,
  shutdown
} from './connection-pool.js';
import { createQueryOptimizer } from './query-optimizer.js';
import { MigrationManager } from './migrations/migration-manager.js';
import { createArticleDocument } from './schemas/article.schema.js';
import { createEmailDigestDocument } from './schemas/email-digest.schema.js';
import fs from 'fs/promises';
import path from 'path';

// Test Configuration
const TEST_CONFIG = {
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017',
  DATABASE_NAME: process.env.DATABASE_NAME || 'medium_extractor_test',
  CLEANUP_AFTER_TESTS: true
};

// Test Results Tracker
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  errors: []
};

/**
 * Test Utilities
 */
class TestRunner {
  constructor() {
    this.testSuite = 'Database Integration Tests';
    this.currentTest = '';
  }

  async runTest(testName, testFn) {
    this.currentTest = testName;
    testResults.total++;
    
    console.log(`\n🧪 Running: ${testName}`);
    
    try {
      const startTime = Date.now();
      await testFn();
      const duration = Date.now() - startTime;
      
      console.log(`   ✅ PASSED (${duration}ms)`);
      testResults.passed++;
      
    } catch (error) {
      console.log(`   ❌ FAILED: ${error.message}`);
      testResults.failed++;
      testResults.errors.push({ test: testName, error: error.message });
    }
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }

  assertEquals(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
  }

  assertGreaterThan(actual, expected, message) {
    if (actual <= expected) {
      throw new Error(message || `Expected ${actual} to be greater than ${expected}`);
    }
  }

  assertArrayContains(array, item, message) {
    if (!Array.isArray(array) || !array.includes(item)) {
      throw new Error(message || `Expected array to contain ${item}`);
    }
  }

  printSummary() {
    console.log(`\n📊 Test Summary: ${this.testSuite}`);
    console.log(`   Total Tests: ${testResults.total}`);
    console.log(`   Passed: ${testResults.passed} ✅`);
    console.log(`   Failed: ${testResults.failed} ❌`);
    console.log(`   Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
    
    if (testResults.errors.length > 0) {
      console.log(`\n❌ Failed Tests:`);
      testResults.errors.forEach(error => {
        console.log(`   - ${error.test}: ${error.error}`);
      });
    }
    
    return testResults.failed === 0;
  }
}

/**
 * Database Test Suite
 */
async function runDatabaseTests() {
  const runner = new TestRunner();
  let db = null;
  let client = null;

  try {
    console.log(`🚀 Starting Database Integration Tests`);
    console.log(`   Database: ${TEST_CONFIG.DATABASE_NAME}`);
    console.log(`   MongoDB URI: ${TEST_CONFIG.MONGODB_URI}`);

    // Test 1: Database Connection
    await runner.runTest('Database Connection', async () => {
      client = new MongoClient(TEST_CONFIG.MONGODB_URI);
      await client.connect();
      db = client.db(TEST_CONFIG.DATABASE_NAME);
      
      // Test ping
      const pingResult = await db.command({ ping: 1 });
      runner.assertEquals(pingResult.ok, 1, 'Database ping should return ok: 1');
    });

    // Test 2: Database Initialization
    await runner.runTest('Database Initialization', async () => {
      const result = await initializeDatabase({
        config: {
          MONGODB_URI: TEST_CONFIG.MONGODB_URI,
          DATABASE_NAME: TEST_CONFIG.DATABASE_NAME
        },
        seedFile: path.join(process.cwd(), 'seeds/sample-data.json'),
        skipHealthCheck: false
      });
      
      runner.assert(result.success, 'Database initialization should succeed');
      runner.assert(result.collections.created.length > 0 || result.collections.existing.length > 0, 
        'Should create or find existing collections');
    });

    // Test 3: Connection Pool Setup
    await runner.runTest('Connection Pool Setup', async () => {
      const pool = initializeConnectionPool(
        TEST_CONFIG.MONGODB_URI,
        TEST_CONFIG.DATABASE_NAME,
        { minPoolSize: 2, maxPoolSize: 5 }
      );
      
      const database = await pool.getDatabase();
      runner.assert(database, 'Should get database instance from pool');
      
      const stats = getPoolStats();
      runner.assert(stats.isConnected, 'Connection pool should be connected');
      runner.assertEquals(stats.config.minPoolSize, 2, 'Min pool size should be configured');
    });

    // Test 4: Schema Validation
    await runner.runTest('Schema Validation', async () => {
      const articlesCollection = db.collection('articles');
      
      // Valid article document
      const validArticle = createArticleDocument({
        title: 'Test Article',
        url: 'https://medium.com/test-article',
        urlHash: 'a'.repeat(64), // Valid SHA-256 hash
        content: 'Test content',
        emailDate: new Date(),
        wordCount: 100,
        readingTime: '1 min read',
        sourceEmail: {
          id: 'test123',
          subject: 'Test Subject',
          date: new Date()
        },
        filePath: 'test/path.md'
      });
      
      const insertResult = await articlesCollection.insertOne(validArticle);
      runner.assert(insertResult.insertedId, 'Valid article should be inserted');
      
      // Cleanup
      await articlesCollection.deleteOne({ _id: insertResult.insertedId });
    });

    // Test 5: Index Performance
    await runner.runTest('Index Performance', async () => {
      const articlesCollection = db.collection('articles');
      
      // Test index exists
      const indexes = await articlesCollection.listIndexes().toArray();
      const indexNames = indexes.map(idx => idx.name);
      
      runner.assertArrayContains(indexNames, 'idx_articles_urlhash_unique', 
        'URL hash unique index should exist');
      runner.assertArrayContains(indexNames, 'idx_articles_emaildate_desc', 
        'Email date index should exist');
      runner.assertArrayContains(indexNames, 'idx_articles_text_search', 
        'Text search index should exist');
      
      // Test query performance (with explain)
      const explainResult = await articlesCollection.find({ status: 'scraped' })
        .explain('executionStats');
      
      runner.assert(explainResult.executionStats, 'Query should provide execution stats');
    });

    // Test 6: Query Optimizer
    await runner.runTest('Query Optimizer', async () => {
      const optimizer = createQueryOptimizer(db, { cacheEnabled: true });
      
      // Test article queries
      const paginatedResult = await optimizer.articles.getArticlesPaginated({
        limit: 5,
        filters: { status: 'scraped' }
      });
      
      runner.assert(Array.isArray(paginatedResult.articles), 'Should return articles array');
      runner.assert(typeof paginatedResult.hasNextPage === 'boolean', 'Should indicate next page status');
      
      // Test metrics
      const metrics = optimizer.getMetrics();
      runner.assertGreaterThan(metrics.totalQueries, 0, 'Should track query metrics');
    });

    // Test 7: Migration System
    await runner.runTest('Migration System', async () => {
      const migrationManager = new MigrationManager(db);
      await migrationManager.initialize();
      
      // Load migrations
      await migrationManager.loadMigrationsFromDirectory('./migrations');
      
      // Get status
      const status = await migrationManager.getStatus();
      runner.assertGreaterThan(status.total, 0, 'Should find migration files');
      
      // Test integrity
      const integrity = await migrationManager.validateIntegrity();
      runner.assert(integrity.isValid, 'Migration integrity should be valid');
    });

    // Test 8: Email Digest Schema
    await runner.runTest('Email Digest Schema', async () => {
      const emailDigestsCollection = db.collection('emailDigests');
      
      const validDigest = createEmailDigestDocument({
        messageId: 'test-message-123',
        subject: 'Test Subject',
        date: new Date(),
        sender: {
          email: 'test@example.com',
          name: 'Test Sender'
        },
        linksFound: 3,
        flutterLinks: ['https://medium.com/flutter-test'],
        allLinks: ['https://medium.com/flutter-test', 'https://example.com']
      });
      
      const insertResult = await emailDigestsCollection.insertOne(validDigest);
      runner.assert(insertResult.insertedId, 'Valid email digest should be inserted');
      
      // Cleanup
      await emailDigestsCollection.deleteOne({ _id: insertResult.insertedId });
    });

    // Test 9: Health Check
    await runner.runTest('Health Check', async () => {
      const health = await healthCheck();
      runner.assertEquals(health.status, 'healthy', 'Database should be healthy');
      runner.assertGreaterThan(health.collections, 0, 'Should find collections');
      runner.assert(health.responseTime, 'Should measure response time');
    });

    // Test 10: Sample Data Loading
    await runner.runTest('Sample Data Loading', async () => {
      const articlesCollection = db.collection('articles');
      const emailDigestsCollection = db.collection('emailDigests');
      
      const articleCount = await articlesCollection.countDocuments();
      const digestCount = await emailDigestsCollection.countDocuments();
      
      runner.assertGreaterThan(articleCount, 0, 'Should have sample article data');
      runner.assertGreaterThan(digestCount, 0, 'Should have sample email digest data');
    });

    // Test 11: Text Search Functionality
    await runner.runTest('Text Search', async () => {
      const optimizer = createQueryOptimizer(db);
      
      const searchResults = await optimizer.articles.searchArticles('flutter', {
        limit: 5
      });
      
      runner.assert(Array.isArray(searchResults.articles), 'Should return search results');
      runner.assertEquals(searchResults.searchTerm, 'flutter', 'Should track search term');
    });

    // Test 12: Aggregation Queries
    await runner.runTest('Aggregation Queries', async () => {
      const optimizer = createQueryOptimizer(db);
      
      const stats = await optimizer.articles.getArticleStats('daily');
      runner.assert(Array.isArray(stats), 'Should return statistics array');
      
      const categoryResults = await optimizer.articles.getArticlesByCategory('flutter', {
        includeStats: true
      });
      runner.assert(Array.isArray(categoryResults), 'Should return category results');
    });

  } finally {
    // Cleanup
    if (TEST_CONFIG.CLEANUP_AFTER_TESTS && db) {
      console.log('\n🧹 Cleaning up test data...');
      try {
        await db.dropDatabase();
        console.log('   ✅ Test database cleaned up');
      } catch (error) {
        console.log(`   ⚠️  Warning: Failed to cleanup database: ${error.message}`);
      }
    }

    // Close connections
    try {
      await shutdown();
      if (client) await client.close();
    } catch (error) {
      console.log(`   ⚠️  Warning: Error closing connections: ${error.message}`);
    }
  }

  return runner.printSummary();
}

/**
 * Performance Benchmark Tests
 */
async function runPerformanceTests() {
  console.log('\n🏃‍♂️ Running Performance Benchmarks...');
  
  const pool = getConnectionPool();
  const db = await pool.getDatabase();
  const optimizer = createQueryOptimizer(db);
  
  const benchmarks = [];

  // Benchmark 1: Simple Query Performance
  const simpleQueryStart = Date.now();
  await optimizer.articles.getArticlesPaginated({ limit: 10 });
  const simpleQueryTime = Date.now() - simpleQueryStart;
  benchmarks.push({ test: 'Simple Paginated Query', time: simpleQueryTime });

  // Benchmark 2: Text Search Performance
  const searchStart = Date.now();
  await optimizer.articles.searchArticles('flutter', { limit: 10 });
  const searchTime = Date.now() - searchStart;
  benchmarks.push({ test: 'Text Search Query', time: searchTime });

  // Benchmark 3: Aggregation Performance
  const aggStart = Date.now();
  await optimizer.articles.getArticleStats('daily');
  const aggTime = Date.now() - aggStart;
  benchmarks.push({ test: 'Aggregation Query', time: aggTime });

  console.log('\n📊 Performance Results:');
  benchmarks.forEach(benchmark => {
    const status = benchmark.time < 100 ? '🟢' : benchmark.time < 500 ? '🟡' : '🔴';
    console.log(`   ${status} ${benchmark.test}: ${benchmark.time}ms`);
  });

  return benchmarks;
}

/**
 * Main Test Runner
 */
async function main() {
  try {
    console.log('🧪 Database Integration Test Suite');
    console.log('=====================================');
    
    const testsSucceeded = await runDatabaseTests();
    
    if (testsSucceeded) {
      await runPerformanceTests();
      
      console.log('\n🎉 All tests passed! Database infrastructure is ready for production.');
      process.exit(0);
    } else {
      console.log('\n💥 Some tests failed. Please review the errors above.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n💥 Test suite failed with error:', error.message);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { runDatabaseTests, runPerformanceTests };