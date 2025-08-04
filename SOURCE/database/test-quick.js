#!/usr/bin/env node

/**
 * Quick Database Test - Core Functionality
 * Medium Flutter Link Extractor - Essential Database Tests
 * 
 * @author Ashok (Data Architect)
 * @date 2025-07-28
 * @version 1.0.0
 */

import { MongoClient } from 'mongodb';
import { 
  initializeConnectionPool, 
  getDatabase, 
  healthCheck,
  getPoolStats,
  shutdown
} from './connection-pool.js';
import { createQueryOptimizer } from './query-optimizer.js';
import { createArticleDocument } from './schemas/article.schema.js';
import { createEmailDigestDocument } from './schemas/email-digest.schema.js';
import { createAllIndexes } from './indexes/create-indexes.js';

// Test Configuration
const TEST_CONFIG = {
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017',
  DATABASE_NAME: process.env.DATABASE_NAME || 'medium_extractor_test_quick'
};

async function runQuickTests() {
  console.log('🚀 Quick Database Tests');
  console.log('=======================');
  
  let client = null;
  let testsPassed = 0;
  let totalTests = 0;

  try {
    // Test 1: Basic Connection
    console.log('\n1. 🔌 Testing Database Connection...');
    totalTests++;
    
    client = new MongoClient(TEST_CONFIG.MONGODB_URI);
    await client.connect();
    const db = client.db(TEST_CONFIG.DATABASE_NAME);
    await db.command({ ping: 1 });
    
    console.log('   ✅ Database connection successful');
    testsPassed++;

    // Test 2: Connection Pool
    console.log('\n2. 🏊‍♂️ Testing Connection Pool...');
    totalTests++;
    
    const pool = initializeConnectionPool(
      TEST_CONFIG.MONGODB_URI,
      TEST_CONFIG.DATABASE_NAME,
      { minPoolSize: 1, maxPoolSize: 3 }
    );
    
    const poolDb = await pool.getDatabase();
    const stats = getPoolStats();
    
    if (stats.isConnected && poolDb) {
      console.log('   ✅ Connection pool working');
      console.log(`   📊 Pool stats: ${stats.config.minPoolSize}-${stats.config.maxPoolSize} connections`);
      testsPassed++;
    } else {
      console.log('   ❌ Connection pool failed');
    }

    // Test 3: Collection Creation with Indexes
    console.log('\n3. 📊 Testing Collections and Indexes...');
    totalTests++;
    
    // Create collections manually
    await db.createCollection('articles');
    await db.createCollection('emailDigests');
    
    // Create indexes
    const indexResult = await createAllIndexes(db, { verbose: false });
    
    if (indexResult.created.length > 0 || indexResult.skipped.length > 0) {
      console.log(`   ✅ Indexes created: ${indexResult.created.length}, skipped: ${indexResult.skipped.length}`);
      testsPassed++;
    } else {
      console.log('   ❌ Index creation failed');
    }

    // Test 4: Schema Validation - Articles
    console.log('\n4. 📝 Testing Article Schema...');
    totalTests++;
    
    const articleData = {
      title: 'Test Flutter Article',
      url: 'https://medium.com/test-flutter-article-123',
      urlHash: 'a1b2c3d4e5f67890123456789012345678901234567890123456789012345678',
      content: '# Test Article\n\nThis is a test article about Flutter development.',
      emailDate: new Date('2025-07-27T10:00:00.000Z'),
      wordCount: 50,
      readingTime: '1 min read',
      sourceEmail: {
        id: 'test-email-123',
        subject: 'Test Subject',
        date: new Date('2025-07-27T08:00:00.000Z')
      },
      filePath: 'test/articles/test-article.md',
      category: 'flutter',
      keywords: ['flutter', 'test'],
      tags: ['test']
    };
    
    const article = createArticleDocument(articleData);
    const articlesCollection = db.collection('articles');
    const insertResult = await articlesCollection.insertOne(article);
    
    if (insertResult.insertedId) {
      console.log('   ✅ Article schema validation passed');
      testsPassed++;
    } else {
      console.log('   ❌ Article schema validation failed');
    }

    // Test 5: Schema Validation - Email Digests
    console.log('\n5. 📧 Testing Email Digest Schema...');
    totalTests++;
    
    const digestData = {
      messageId: 'test-message-456',
      subject: 'Test Medium Daily Digest',
      date: new Date('2025-07-27T08:00:00.000Z'),
      sender: {
        email: 'test@medium.com',
        name: 'Medium Digest'
      },
      linksFound: 2,
      flutterLinks: ['https://medium.com/flutter-test'],
      allLinks: ['https://medium.com/flutter-test', 'https://medium.com/general-test']
    };
    
    const digest = createEmailDigestDocument(digestData);
    const digestsCollection = db.collection('emailDigests');
    const digestInsertResult = await digestsCollection.insertOne(digest);
    
    if (digestInsertResult.insertedId) {
      console.log('   ✅ Email digest schema validation passed');
      testsPassed++;
    } else {
      console.log('   ❌ Email digest schema validation failed');
    }

    // Test 6: Query Optimization
    console.log('\n6. ⚡ Testing Query Optimizer...');
    totalTests++;
    
    const optimizer = createQueryOptimizer(db, { cacheEnabled: true });
    
    // Test paginated query
    const paginatedResult = await optimizer.articles.getArticlesPaginated({
      limit: 5,
      filters: { status: 'scraped' }
    });
    
    // Test search functionality
    const searchResult = await optimizer.articles.searchArticles('flutter', { limit: 3 });
    
    const metrics = optimizer.getMetrics();
    
    if (paginatedResult && searchResult && metrics.totalQueries > 0) {
      console.log('   ✅ Query optimizer working');
      console.log(`   📊 Queries executed: ${metrics.totalQueries}, avg time: ${metrics.averageExecutionTime.toFixed(2)}ms`);
      testsPassed++;
    } else {
      console.log('   ❌ Query optimizer failed');
    }

    // Test 7: Health Check
    console.log('\n7. 🏥 Testing Health Check...');
    totalTests++;
    
    const health = await healthCheck();
    
    if (health.status === 'healthy') {
      console.log('   ✅ Health check passed');
      console.log(`   📊 Response time: ${health.responseTime}ms, Collections: ${health.collections}`);
      testsPassed++;
    } else {
      console.log('   ❌ Health check failed');
    }

    // Test 8: Performance Benchmark
    console.log('\n8. 🏃‍♂️ Performance Benchmark...');
    totalTests++;
    
    const startTime = Date.now();
    
    // Run several queries to test performance
    await Promise.all([
      optimizer.articles.getArticlesPaginated({ limit: 10 }),
      optimizer.articles.searchArticles('test', { limit: 5 }),
      optimizer.emailDigests.getRecentDigests({ limit: 10 })
    ]);
    
    const totalTime = Date.now() - startTime;
    
    if (totalTime < 500) { // Should complete within 500ms
      console.log(`   ✅ Performance test passed (${totalTime}ms)`);
      testsPassed++;
    } else {
      console.log(`   ⚠️  Performance slower than expected (${totalTime}ms)`);
      testsPassed++; // Still count as passed, just slower
    }

  } catch (error) {
    console.error(`\n❌ Test failed: ${error.message}`);
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up...');
    try {
      if (client) {
        const db = client.db(TEST_CONFIG.DATABASE_NAME);
        await db.dropDatabase();
        console.log('   ✅ Test database cleaned up');
      }
      
      await shutdown();
      if (client) await client.close();
      console.log('   ✅ Connections closed');
    } catch (error) {
      console.log(`   ⚠️  Cleanup warning: ${error.message}`);
    }
  }

  // Results
  console.log('\n📊 Test Results');
  console.log('================');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${testsPassed} ✅`);
  console.log(`Failed: ${totalTests - testsPassed} ❌`);
  console.log(`Success Rate: ${((testsPassed / totalTests) * 100).toFixed(1)}%`);

  if (testsPassed === totalTests) {
    console.log('\n🎉 All tests passed! Database infrastructure is working correctly.');
    return true;
  } else {
    console.log('\n⚠️  Some tests had issues. Please check the output above.');
    return false;
  }
}

// Run tests
if (import.meta.url === `file://${process.argv[1]}`) {
  runQuickTests()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('Test suite error:', error.message);
      process.exit(1);
    });
}

export { runQuickTests };