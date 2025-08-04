/**
 * Initial Database Setup Migration
 * Version: 001
 * 
 * @author Ashok (Data Architect)
 * @date 2025-07-28
 * 
 * Creates initial collections with validation schemas and indexes
 * for the Medium Flutter Link Extractor system.
 */

import { Migration, MigrationUtils } from './migration-manager.js';
import { ArticleValidation } from '../schemas/article.schema.js';
import { EmailDigestValidation } from '../schemas/email-digest.schema.js';
import { ARTICLE_INDEXES, EMAIL_DIGEST_INDEXES } from '../indexes/create-indexes.js';

export default class InitialSetupMigration extends Migration {
  constructor() {
    super('001', 'Initial database setup - Create collections, validation, and indexes');
  }

  /**
   * Execute forward migration
   */
  async up(db) {
    console.log('🏗️  Setting up initial database structure...');

    // 1. Create Articles collection with validation
    await this._createArticlesCollection(db);
    
    // 2. Create Email Digests collection with validation
    await this._createEmailDigestsCollection(db);
    
    // 3. Create indexes for performance
    await this._createIndexes(db);
    
    console.log('✅ Initial database setup completed');
  }

  /**
   * Execute rollback migration
   */
  async down(db) {
    console.log('🔄 Rolling back initial database setup...');

    // Drop collections (this will also drop their indexes)
    const collections = ['articles', 'emailDigests'];
    
    for (const collectionName of collections) {
      if (await MigrationUtils.collectionExists(db, collectionName)) {
        await db.collection(collectionName).drop();
        console.log(`   🗑️  Dropped collection: ${collectionName}`);
      }
    }
    
    console.log('✅ Initial database setup rolled back');
  }

  /**
   * Validate migration preconditions
   */
  async validate(db) {
    // Check that we can connect to the database
    try {
      await db.command({ ping: 1 });
      return true;
    } catch (error) {
      console.error('Database connection validation failed:', error.message);
      return false;
    }
  }

  /**
   * Create Articles collection with validation schema
   */
  async _createArticlesCollection(db) {
    const collectionName = 'articles';
    
    if (await MigrationUtils.collectionExists(db, collectionName)) {
      console.log(`   ⏭️  Collection '${collectionName}' already exists, updating validation...`);
      
      // Update existing collection validation
      await db.command({
        collMod: collectionName,
        validator: ArticleValidation,
        validationLevel: 'strict',
        validationAction: 'error'
      });
      
    } else {
      console.log(`   📄 Creating collection: ${collectionName}`);
      
      // Create new collection with validation
      await db.createCollection(collectionName, {
        validator: ArticleValidation,
        validationLevel: 'strict',
        validationAction: 'error'
      });
    }
  }

  /**
   * Create Email Digests collection with validation schema
   */
  async _createEmailDigestsCollection(db) {
    const collectionName = 'emailDigests';
    
    if (await MigrationUtils.collectionExists(db, collectionName)) {
      console.log(`   ⏭️  Collection '${collectionName}' already exists, updating validation...`);
      
      // Update existing collection validation
      await db.command({
        collMod: collectionName,
        validator: EmailDigestValidation,
        validationLevel: 'strict',
        validationAction: 'error'
      });
      
    } else {
      console.log(`   📄 Creating collection: ${collectionName}`);
      
      // Create new collection with validation
      await db.createCollection(collectionName, {
        validator: EmailDigestValidation,
        validationLevel: 'strict',
        validationAction: 'error'
      });
    }
  }

  /**
   * Create performance indexes
   */
  async _createIndexes(db) {
    console.log('   📊 Creating performance indexes...');
    
    // Create indexes for Articles collection
    await this._createCollectionIndexes(db, 'articles', ARTICLE_INDEXES);
    
    // Create indexes for Email Digests collection
    await this._createCollectionIndexes(db, 'emailDigests', EMAIL_DIGEST_INDEXES);
  }

  /**
   * Create indexes for a specific collection
   */
  async _createCollectionIndexes(db, collectionName, indexes) {
    const collection = db.collection(collectionName);
    let created = 0;
    let skipped = 0;

    for (const indexDef of indexes) {
      try {
        // Check if index already exists
        if (await MigrationUtils.indexExists(db, collectionName, indexDef.name)) {
          skipped++;
          continue;
        }

        // Create the index
        await collection.createIndex(indexDef.spec, indexDef.options);
        created++;
        
      } catch (error) {
        console.error(`     ❌ Failed to create index ${indexDef.name}: ${error.message}`);
        throw error; // Re-throw to fail the migration
      }
    }

    console.log(`     ✅ Created ${created} indexes for ${collectionName} (${skipped} already existed)`);
  }
}