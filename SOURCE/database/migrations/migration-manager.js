/**
 * Database Migration Manager
 * Medium Flutter Link Extractor - Migration Framework
 * 
 * @author Ashok (Data Architect)
 * @date 2025-07-28
 * @version 1.0.0
 * 
 * Provides version-controlled database migrations with:
 * - Forward and backward migration support
 * - Migration tracking and rollback
 * - Schema validation
 * - Data transformation utilities
 * - Migration dependency management
 */

import { ObjectId } from 'mongodb';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

/**
 * Migration Status Enum
 */
export const MigrationStatus = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  ROLLED_BACK: 'rolled_back'
};

/**
 * Migration Base Class
 * All migrations should extend this class
 */
export class Migration {
  constructor(version, description) {
    if (new.target === Migration) {
      throw new Error('Cannot instantiate abstract Migration class directly');
    }
    
    this.version = version;
    this.description = description;
    this.timestamp = new Date();
  }

  /**
   * Execute forward migration
   * Must be implemented by subclasses
   */
  async up(db) {
    throw new Error('Migration.up() must be implemented by subclass');
  }

  /**
   * Execute rollback migration
   * Must be implemented by subclasses
   */
  async down(db) {
    throw new Error('Migration.down() must be implemented by subclass');
  }

  /**
   * Validate migration preconditions
   * Override in subclasses if needed
   */
  async validate(db) {
    return true;
  }

  /**
   * Get migration metadata
   */
  getMetadata() {
    return {
      version: this.version,
      description: this.description,
      timestamp: this.timestamp,
      checksum: this._calculateChecksum()
    };
  }

  /**
   * Calculate checksum for migration integrity
   */
  _calculateChecksum() {
    const content = this.up.toString() + this.down.toString();
    return crypto.createHash('sha256').update(content).digest('hex');
  }
}

/**
 * Migration Manager
 * Handles migration execution, tracking, and rollback
 */
export class MigrationManager {
  constructor(db, options = {}) {
    this.db = db;
    this.options = {
      migrationsCollection: 'migrations',
      migrationsDir: './migrations',
      timeout: 300000, // 5 minutes default timeout
      ...options
    };
    
    this.migrations = new Map();
    this.migrationHistory = [];
  }

  /**
   * Initialize migration system
   */
  async initialize() {
    // Create migrations collection if it doesn't exist
    const collections = await this.db.listCollections({
      name: this.options.migrationsCollection
    }).toArray();

    if (collections.length === 0) {
      await this.db.createCollection(this.options.migrationsCollection, {
        validator: {
          $jsonSchema: {
            bsonType: "object",
            required: ["version", "description", "status", "executedAt"],
            properties: {
              version: {
                bsonType: "string",
                description: "Migration version identifier"
              },
              description: {
                bsonType: "string",
                description: "Migration description"
              },
              status: {
                bsonType: "string",
                enum: Object.values(MigrationStatus),
                description: "Migration execution status"
              },
              executedAt: {
                bsonType: "date",
                description: "Migration execution timestamp"
              },
              executionTime: {
                bsonType: "int",
                minimum: 0,
                description: "Migration execution time in milliseconds"
              },
              checksum: {
                bsonType: "string",
                description: "Migration content checksum"
              }
            }
          }
        }
      });

      // Create index for efficient querying
      await this.db.collection(this.options.migrationsCollection)
        .createIndex({ version: 1 }, { unique: true });
    }

    // Load migration history
    await this._loadMigrationHistory();
  }

  /**
   * Register a migration
   */
  registerMigration(migration) {
    if (!(migration instanceof Migration)) {
      throw new Error('Migration must be an instance of Migration class');
    }

    if (this.migrations.has(migration.version)) {
      throw new Error(`Migration version ${migration.version} already registered`);
    }

    this.migrations.set(migration.version, migration);
  }

  /**
   * Load migrations from directory
   */
  async loadMigrationsFromDirectory(directory = this.options.migrationsDir) {
    try {
      const files = await fs.readdir(directory);
      const migrationFiles = files
        .filter(file => file.endsWith('.js') && !file.startsWith('_'))
        .sort(); // Ensure consistent ordering

      for (const file of migrationFiles) {
        const filePath = path.join(directory, file);
        
        try {
          const migrationModule = await import(filePath);
          const MigrationClass = migrationModule.default || migrationModule.Migration;
          
          if (MigrationClass && typeof MigrationClass === 'function') {
            const migration = new MigrationClass();
            this.registerMigration(migration);
          }
        } catch (error) {
          console.error(`Failed to load migration from ${file}:`, error.message);
        }
      }

      console.log(`📦 Loaded ${this.migrations.size} migrations`);
      
    } catch (error) {
      console.error(`Failed to load migrations from directory ${directory}:`, error.message);
    }
  }

  /**
   * Get pending migrations
   */
  getPendingMigrations() {
    const completedVersions = new Set(
      this.migrationHistory
        .filter(record => record.status === MigrationStatus.COMPLETED)
        .map(record => record.version)
    );

    return Array.from(this.migrations.values())
      .filter(migration => !completedVersions.has(migration.version))
      .sort((a, b) => a.version.localeCompare(b.version));
  }

  /**
   * Execute pending migrations
   */
  async migrate(targetVersion = null) {
    const pendingMigrations = this.getPendingMigrations();
    
    if (pendingMigrations.length === 0) {
      console.log('✅ No pending migrations');
      return { executed: 0, migrations: [] };
    }

    const migrationsToExecute = targetVersion
      ? pendingMigrations.filter(m => m.version <= targetVersion)
      : pendingMigrations;

    console.log(`🚀 Executing ${migrationsToExecute.length} migrations`);

    const results = [];

    for (const migration of migrationsToExecute) {
      const result = await this._executeMigration(migration, 'up');
      results.push(result);
      
      if (!result.success) {
        console.error(`❌ Migration ${migration.version} failed, stopping execution`);
        break;
      }
    }

    const successful = results.filter(r => r.success).length;
    console.log(`✅ Executed ${successful}/${migrationsToExecute.length} migrations successfully`);

    return {
      executed: successful,
      migrations: results
    };
  }

  /**
   * Rollback migrations
   */
  async rollback(targetVersion = null, steps = 1) {
    const completedMigrations = this.migrationHistory
      .filter(record => record.status === MigrationStatus.COMPLETED)
      .sort((a, b) => b.version.localeCompare(a.version)); // Reverse order for rollback

    if (completedMigrations.length === 0) {
      console.log('ℹ️  No migrations to rollback');
      return { rolledBack: 0, migrations: [] };
    }

    let migrationsToRollback;
    
    if (targetVersion) {
      migrationsToRollback = completedMigrations
        .filter(record => record.version > targetVersion);
    } else {
      migrationsToRollback = completedMigrations.slice(0, steps);
    }

    console.log(`🔄 Rolling back ${migrationsToRollback.length} migrations`);

    const results = [];

    for (const migrationRecord of migrationsToRollback) {
      const migration = this.migrations.get(migrationRecord.version);
      
      if (!migration) {
        console.error(`❌ Migration ${migrationRecord.version} not found in registry`);
        continue;
      }

      const result = await this._executeMigration(migration, 'down');
      results.push(result);
      
      if (!result.success) {
        console.error(`❌ Rollback of ${migration.version} failed, stopping`);
        break;
      }
    }

    const successful = results.filter(r => r.success).length;
    console.log(`✅ Rolled back ${successful}/${migrationsToRollback.length} migrations successfully`);

    return {
      rolledBack: successful,
      migrations: results
    };
  }

  /**
   * Get migration status
   */
  async getStatus() {
    await this._loadMigrationHistory();
    
    const allMigrations = Array.from(this.migrations.values())
      .sort((a, b) => a.version.localeCompare(b.version));
    
    const completedVersions = new Set(
      this.migrationHistory
        .filter(record => record.status === MigrationStatus.COMPLETED)
        .map(record => record.version)
    );

    return {
      total: allMigrations.length,
      completed: completedVersions.size,
      pending: allMigrations.length - completedVersions.size,
      migrations: allMigrations.map(migration => ({
        version: migration.version,
        description: migration.description,
        status: completedVersions.has(migration.version) ? 'completed' : 'pending'
      }))
    };
  }

  /**
   * Validate migration integrity
   */
  async validateIntegrity() {
    const issues = [];

    for (const [version, migration] of this.migrations) {
      const historyRecord = this.migrationHistory.find(r => r.version === version);
      
      if (historyRecord && historyRecord.status === MigrationStatus.COMPLETED) {
        const currentChecksum = migration._calculateChecksum();
        
        if (historyRecord.checksum && historyRecord.checksum !== currentChecksum) {
          issues.push({
            version,
            issue: 'checksum_mismatch',
            message: 'Migration content has changed after execution'
          });
        }
      }
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Execute a single migration
   */
  async _executeMigration(migration, direction) {
    const startTime = Date.now();
    const isUp = direction === 'up';
    
    console.log(`${isUp ? '⬆️' : '⬇️'} ${isUp ? 'Executing' : 'Rolling back'} migration: ${migration.version}`);
    console.log(`   ${migration.description}`);

    // Create migration record
    const migrationRecord = {
      _id: new ObjectId(),
      version: migration.version,
      description: migration.description,
      status: MigrationStatus.RUNNING,
      executedAt: new Date(),
      direction,
      checksum: migration._calculateChecksum()
    };

    try {
      // Insert or update migration record
      await this.db.collection(this.options.migrationsCollection)
        .replaceOne(
          { version: migration.version },
          migrationRecord,
          { upsert: true }
        );

      // Validate preconditions
      if (isUp) {
        const isValid = await migration.validate(this.db);
        if (!isValid) {
          throw new Error('Migration validation failed');
        }
      }

      // Execute migration with timeout
      const operation = isUp ? migration.up(this.db) : migration.down(this.db);
      await this._withTimeout(operation, this.options.timeout);

      // Update status to completed
      const executionTime = Date.now() - startTime;
      const finalStatus = isUp ? MigrationStatus.COMPLETED : MigrationStatus.ROLLED_BACK;
      
      await this.db.collection(this.options.migrationsCollection)
        .updateOne(
          { version: migration.version },
          {
            $set: {
              status: finalStatus,
              executionTime,
              completedAt: new Date()
            }
          }
        );

      console.log(`   ✅ ${isUp ? 'Completed' : 'Rolled back'} in ${executionTime}ms`);

      return {
        success: true,
        version: migration.version,
        executionTime,
        direction
      };

    } catch (error) {
      // Update status to failed
      const executionTime = Date.now() - startTime;
      
      await this.db.collection(this.options.migrationsCollection)
        .updateOne(
          { version: migration.version },
          {
            $set: {
              status: MigrationStatus.FAILED,
              executionTime,
              error: error.message,
              failedAt: new Date()
            }
          }
        );

      console.error(`   ❌ Failed after ${executionTime}ms: ${error.message}`);

      return {
        success: false,
        version: migration.version,
        error: error.message,
        executionTime,
        direction
      };
    }
  }

  /**
   * Load migration history from database
   */
  async _loadMigrationHistory() {
    try {
      this.migrationHistory = await this.db
        .collection(this.options.migrationsCollection)
        .find({})
        .sort({ executedAt: 1 })
        .toArray();
    } catch (error) {
      console.error('Failed to load migration history:', error.message);
      this.migrationHistory = [];
    }
  }

  /**
   * Execute operation with timeout
   */
  async _withTimeout(operation, timeoutMs) {
    return Promise.race([
      operation,
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Migration timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      })
    ]);
  }
}

/**
 * Migration Utilities
 */
export class MigrationUtils {
  /**
   * Check if collection exists
   */
  static async collectionExists(db, collectionName) {
    const collections = await db.listCollections({ name: collectionName }).toArray();
    return collections.length > 0;
  }

  /**
   * Check if index exists
   */
  static async indexExists(db, collectionName, indexName) {
    try {
      const collection = db.collection(collectionName);
      const indexes = await collection.listIndexes().toArray();
      return indexes.some(index => index.name === indexName);
    } catch (error) {
      return false;
    }
  }

  /**
   * Backup collection data
   */
  static async backupCollection(db, collectionName, backupName = null) {
    const backup = backupName || `${collectionName}_backup_${Date.now()}`;
    const sourceCollection = db.collection(collectionName);
    const backupCollection = db.collection(backup);

    const documents = await sourceCollection.find({}).toArray();
    
    if (documents.length > 0) {
      await backupCollection.insertMany(documents);
    }

    return backup;
  }

  /**
   * Restore collection from backup
   */
  static async restoreCollection(db, backupName, targetCollectionName) {
    const backupCollection = db.collection(backupName);
    const targetCollection = db.collection(targetCollectionName);

    // Clear target collection
    await targetCollection.deleteMany({});

    // Restore data
    const documents = await backupCollection.find({}).toArray();
    
    if (documents.length > 0) {
      await targetCollection.insertMany(documents);
    }

    return documents.length;
  }

  /**
   * Transform documents in batches
   */
  static async transformDocuments(collection, transformFn, batchSize = 1000) {
    const cursor = collection.find({});
    let processed = 0;
    let batch = [];

    for await (const doc of cursor) {
      batch.push(doc);

      if (batch.length === batchSize) {
        await this._processBatch(collection, batch, transformFn);
        processed += batch.length;
        batch = [];
        
        console.log(`Processed ${processed} documents...`);
      }
    }

    // Process remaining documents
    if (batch.length > 0) {
      await this._processBatch(collection, batch, transformFn);
      processed += batch.length;
    }

    return processed;
  }

  static async _processBatch(collection, batch, transformFn) {
    const bulkOps = [];

    for (const doc of batch) {
      const transformed = await transformFn(doc);
      
      if (transformed) {
        bulkOps.push({
          replaceOne: {
            filter: { _id: doc._id },
            replacement: transformed
          }
        });
      }
    }

    if (bulkOps.length > 0) {
      await collection.bulkWrite(bulkOps);
    }
  }
}

export default {
  Migration,
  MigrationManager,
  MigrationUtils,
  MigrationStatus
};