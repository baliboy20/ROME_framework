#!/usr/bin/env node

/**
 * Database Initialization Script
 * Medium Flutter Link Extractor - Database Setup
 * 
 * @author Ashok (Data Architect)
 * @date 2025-07-28
 * @version 1.0.0
 * 
 * Initializes MongoDB database with:
 * - Collection creation with validation
 * - Index creation for performance
 * - Seed data (optional)
 * - Health checks
 */

import { MongoClient } from 'mongodb';
import { ArticleValidation } from './schemas/article.schema.js';
import { EmailDigestValidation } from './schemas/email-digest.schema.js';
import { createAllIndexes, analyzeIndexUsage } from './indexes/create-indexes.js';
import fs from 'fs/promises';
import path from 'path';

// Configuration
const DEFAULT_CONFIG = {
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017',
  DATABASE_NAME: process.env.DATABASE_NAME || 'medium_extractor',
  CONNECTION_TIMEOUT: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 10000,
  SOCKET_TIMEOUT: parseInt(process.env.DB_SOCKET_TIMEOUT) || 30000,
  MAX_POOL_SIZE: parseInt(process.env.DB_MAX_POOL_SIZE) || 10
};

/**
 * Database Collections Configuration
 */
const COLLECTIONS = [
  {
    name: 'articles',
    validator: ArticleValidation,
    description: 'Stores scraped Medium articles with full metadata'
  },
  {
    name: 'emailDigests',
    validator: EmailDigestValidation,
    description: 'Tracks processed Medium Daily Digest emails'
  }
];

/**
 * Logging utility
 */
const logger = {
  info: (msg) => console.log(`ℹ️  ${new Date().toISOString()} - ${msg}`),
  success: (msg) => console.log(`✅ ${new Date().toISOString()} - ${msg}`),
  warn: (msg) => console.log(`⚠️  ${new Date().toISOString()} - ${msg}`),
  error: (msg) => console.log(`❌ ${new Date().toISOString()} - ${msg}`),
  debug: (msg) => process.env.DEBUG && console.log(`🐛 ${new Date().toISOString()} - ${msg}`)
};

/**
 * Database Connection Manager
 */
class DatabaseInitializer {
  constructor(config = DEFAULT_CONFIG) {
    this.config = config;
    this.client = null;
    this.db = null;
  }

  /**
   * Connect to MongoDB with proper error handling
   */
  async connect() {
    try {
      logger.info('Connecting to MongoDB...');
      
      this.client = new MongoClient(this.config.MONGODB_URI, {
        serverSelectionTimeoutMS: this.config.CONNECTION_TIMEOUT,
        socketTimeoutMS: this.config.SOCKET_TIMEOUT,
        maxPoolSize: this.config.MAX_POOL_SIZE,
        minPoolSize: 1,
        maxIdleTimeMS: 300000, // 5 minutes
        retryWrites: true,
        w: 'majority'
      });

      await this.client.connect();
      
      // Test the connection
      await this.client.db('admin').command({ ping: 1 });
      
      this.db = this.client.db(this.config.DATABASE_NAME);
      
      logger.success(`Connected to MongoDB: ${this.config.DATABASE_NAME}`);
      
    } catch (error) {
      logger.error(`MongoDB connection failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create collections with validation schemas
   */
  async createCollections() {
    logger.info('Creating collections with validation...');
    
    const results = {
      created: [],
      existing: [],
      errors: []
    };

    for (const collConfig of COLLECTIONS) {
      try {
        // Check if collection already exists
        const collections = await this.db.listCollections({ name: collConfig.name }).toArray();
        
        if (collections.length > 0) {
          logger.warn(`Collection '${collConfig.name}' already exists`);
          results.existing.push(collConfig.name);
          
          // Update validation rules for existing collection
          await this.db.command({
            collMod: collConfig.name,
            validator: collConfig.validator
          });
          
          logger.success(`Updated validation for '${collConfig.name}'`);
          continue;
        }

        // Create new collection with validation
        await this.db.createCollection(collConfig.name, {
          validator: collConfig.validator,
          validationLevel: 'strict',
          validationAction: 'error'
        });

        logger.success(`Created collection '${collConfig.name}' with validation`);
        logger.debug(`  ${collConfig.description}`);
        
        results.created.push(collConfig.name);

      } catch (error) {
        const errorMsg = `Failed to create collection '${collConfig.name}': ${error.message}`;
        logger.error(errorMsg);
        results.errors.push(errorMsg);
      }
    }

    return results;
  }

  /**
   * Create database indexes for performance
   */
  async createIndexes() {
    logger.info('Creating database indexes...');
    
    const indexResults = await createAllIndexes(this.db, { verbose: true });
    
    if (indexResults.created.length > 0) {
      logger.success(`Created ${indexResults.created.length} indexes`);
    }
    
    if (indexResults.skipped.length > 0) {
      logger.info(`Skipped ${indexResults.skipped.length} existing indexes`);
    }
    
    if (indexResults.errors.length > 0) {
      logger.error(`Failed to create ${indexResults.errors.length} indexes`);
      indexResults.errors.forEach(error => logger.error(`  ${error}`));
    }

    return indexResults;
  }

  /**
   * Run database health checks
   */
  async runHealthChecks() {
    logger.info('Running database health checks...');
    
    const health = {
      connection: false,
      collections: {},
      indexes: {},
      performance: {},
      timestamp: new Date().toISOString()
    };

    try {
      // Test connection
      await this.db.command({ ping: 1 });
      health.connection = true;
      logger.success('Database connection: OK');

      // Check collections
      for (const collConfig of COLLECTIONS) {
        try {
          const stats = await this.db.collection(collConfig.name).stats();
          health.collections[collConfig.name] = {
            exists: true,
            count: stats.count,
            size: stats.size,
            avgObjSize: stats.avgObjSize
          };
          logger.success(`Collection '${collConfig.name}': ${stats.count} documents`);
        } catch (error) {
          health.collections[collConfig.name] = {
            exists: false,
            error: error.message
          };
          logger.error(`Collection '${collConfig.name}': ${error.message}`);
        }
      }

      // Check indexes
      const indexAnalysis = await analyzeIndexUsage(this.db);
      health.indexes = indexAnalysis;
      
      for (const [collName, analysis] of Object.entries(indexAnalysis)) {
        if (analysis.error) {
          logger.error(`Index analysis for '${collName}': ${analysis.error}`);
        } else {
          logger.success(`Indexes for '${collName}': ${analysis.indexes.length} indexes`);
        }
      }

      // Performance test - simple query
      const startTime = Date.now();
      await this.db.collection('articles').findOne({});
      const queryTime = Date.now() - startTime;
      
      health.performance.sampleQueryTime = queryTime;
      
      if (queryTime < 100) {
        logger.success(`Query performance: ${queryTime}ms (excellent)`);
      } else if (queryTime < 500) {
        logger.info(`Query performance: ${queryTime}ms (good)`);
      } else {
        logger.warn(`Query performance: ${queryTime}ms (needs optimization)`);
      }

    } catch (error) {
      logger.error(`Health check failed: ${error.message}`);
      health.error = error.message;
    }

    return health;
  }

  /**
   * Load seed data (optional)
   */
  async loadSeedData(seedFile = null) {
    if (!seedFile) {
      logger.info('No seed data specified, skipping...');
      return { loaded: 0 };
    }

    try {
      logger.info(`Loading seed data from: ${seedFile}`);
      
      const seedPath = path.resolve(seedFile);
      const seedData = JSON.parse(await fs.readFile(seedPath, 'utf8'));
      
      let totalLoaded = 0;
      
      for (const [collectionName, documents] of Object.entries(seedData)) {
        if (!Array.isArray(documents) || documents.length === 0) {
          continue;
        }

        try {
          const collection = this.db.collection(collectionName);
          const result = await collection.insertMany(documents, { ordered: false });
          
          logger.success(`Loaded ${result.insertedCount} documents into '${collectionName}'`);
          totalLoaded += result.insertedCount;
          
        } catch (error) {
          logger.error(`Failed to load seed data for '${collectionName}': ${error.message}`);
        }
      }

      return { loaded: totalLoaded };

    } catch (error) {
      logger.error(`Failed to load seed data: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate initialization report
   */
  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      database: this.config.DATABASE_NAME,
      collections: {},
      indexes: {},
      summary: {
        collectionsCreated: 0,
        indexesCreated: 0,
        totalDocuments: 0,
        status: 'success'
      }
    };

    try {
      // Collection statistics
      for (const collConfig of COLLECTIONS) {
        const collection = this.db.collection(collConfig.name);
        const stats = await collection.stats();
        const indexes = await collection.listIndexes().toArray();
        
        report.collections[collConfig.name] = {
          documents: stats.count,
          size: stats.size,
          indexes: indexes.length,
          avgDocSize: stats.avgObjSize
        };
        
        report.summary.totalDocuments += stats.count;
        report.summary.indexesCreated += indexes.length;
      }

      report.summary.collectionsCreated = COLLECTIONS.length;

    } catch (error) {
      report.summary.status = 'error';
      report.error = error.message;
    }

    return report;
  }

  /**
   * Close database connection
   */
  async disconnect() {
    if (this.client) {
      await this.client.close();
      logger.info('Disconnected from MongoDB');
    }
  }
}

/**
 * Main initialization function
 */
async function initializeDatabase(options = {}) {
  const {
    config = DEFAULT_CONFIG,
    seedFile = null,
    skipIndexes = false,
    skipHealthCheck = false,
    generateReportFile = false
  } = options;

  const initializer = new DatabaseInitializer(config);
  
  try {
    // Connect to database
    await initializer.connect();
    
    // Create collections with validation
    const collectionResults = await initializer.createCollections();
    
    // Create indexes (unless skipped)
    let indexResults = { created: [], skipped: [], errors: [] };
    if (!skipIndexes) {
      indexResults = await initializer.createIndexes();
    }
    
    // Load seed data (if provided)
    const seedResults = await initializer.loadSeedData(seedFile);
    
    // Run health checks (unless skipped)
    let healthResults = null;
    if (!skipHealthCheck) {
      healthResults = await initializer.runHealthChecks();
    }
    
    // Generate report
    const report = await initializer.generateReport();
    
    // Save report to file (if requested)
    if (generateReportFile) {
      const reportPath = `database-init-report-${Date.now()}.json`;
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      logger.success(`Report saved to: ${reportPath}`);
    }
    
    logger.success('Database initialization completed successfully!');
    
    return {
      success: true,
      collections: collectionResults,
      indexes: indexResults,
      seed: seedResults,
      health: healthResults,
      report
    };

  } catch (error) {
    logger.error(`Database initialization failed: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  } finally {
    await initializer.disconnect();
  }
}

// CLI support
if (import.meta.url === `file://${process.argv[1]}`) {
  const options = {
    seedFile: process.argv.includes('--seed') ? process.argv[process.argv.indexOf('--seed') + 1] : null,
    skipIndexes: process.argv.includes('--skip-indexes'),
    skipHealthCheck: process.argv.includes('--skip-health'),
    generateReportFile: process.argv.includes('--report')
  };

  initializeDatabase(options)
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      logger.error(`Initialization failed: ${error.message}`);
      process.exit(1);
    });
}

export default initializeDatabase;
export { DatabaseInitializer, COLLECTIONS, DEFAULT_CONFIG };