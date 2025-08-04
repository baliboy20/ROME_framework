#!/usr/bin/env node

/**
 * Migration CLI Tool
 * Medium Flutter Link Extractor - Database Migration Runner
 * 
 * @author Ashok (Data Architect)
 * @date 2025-07-28
 * @version 1.0.0
 * 
 * Command-line interface for database migrations:
 * - Run pending migrations
 * - Rollback migrations
 * - Check migration status
 * - Validate migration integrity
 */

import { MongoClient } from 'mongodb';
import { MigrationManager } from './migration-manager.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const config = {
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017',
  DATABASE_NAME: process.env.DATABASE_NAME || 'medium_extractor',
  MIGRATIONS_DIR: path.join(__dirname, '.'),
  CONNECTION_TIMEOUT: 10000
};

/**
 * CLI Commands
 */
const commands = {
  /**
   * Run pending migrations
   */
  async migrate(args) {
    const targetVersion = args[0] || null;
    
    console.log('🚀 Running database migrations...');
    if (targetVersion) {
      console.log(`   Target version: ${targetVersion}`);
    }
    
    const { db, client } = await connectToDatabase();
    const manager = new MigrationManager(db);
    
    try {
      await manager.initialize();
      await manager.loadMigrationsFromDirectory(config.MIGRATIONS_DIR);
      
      const result = await manager.migrate(targetVersion);
      
      if (result.executed > 0) {
        console.log(`\n✅ Successfully executed ${result.executed} migrations`);
        
        // Show executed migrations
        result.migrations.forEach(migration => {
          const status = migration.success ? '✅' : '❌';
          console.log(`   ${status} ${migration.version} (${migration.executionTime}ms)`);
        });
      } else {
        console.log('\nℹ️  No migrations executed');
      }
      
    } finally {
      await client.close();
    }
  },

  /**
   * Rollback migrations
   */
  async rollback(args) {
    const targetVersion = args[0];
    const steps = targetVersion ? null : parseInt(args[0]) || 1;
    
    console.log('🔄 Rolling back database migrations...');
    if (targetVersion) {
      console.log(`   Target version: ${targetVersion}`);
    } else {
      console.log(`   Steps: ${steps}`);
    }
    
    const { db, client } = await connectToDatabase();
    const manager = new MigrationManager(db);
    
    try {
      await manager.initialize();
      await manager.loadMigrationsFromDirectory(config.MIGRATIONS_DIR);
      
      const result = targetVersion
        ? await manager.rollback(targetVersion)
        : await manager.rollback(null, steps);
      
      if (result.rolledBack > 0) {
        console.log(`\n✅ Successfully rolled back ${result.rolledBack} migrations`);
        
        // Show rolled back migrations
        result.migrations.forEach(migration => {
          const status = migration.success ? '✅' : '❌';
          console.log(`   ${status} ${migration.version} (${migration.executionTime}ms)`);
        });
      } else {
        console.log('\nℹ️  No migrations rolled back');
      }
      
    } finally {
      await client.close();
    }
  },

  /**
   * Show migration status
   */
  async status(args) {
    console.log('📊 Migration Status');
    
    const { db, client } = await connectToDatabase();
    const manager = new MigrationManager(db);
    
    try {
      await manager.initialize();
      await manager.loadMigrationsFromDirectory(config.MIGRATIONS_DIR);
      
      const status = await manager.getStatus();
      
      console.log(`\nTotal migrations: ${status.total}`);
      console.log(`Completed: ${status.completed}`);
      console.log(`Pending: ${status.pending}`);
      
      if (status.migrations.length > 0) {
        console.log('\nMigrations:');
        status.migrations.forEach(migration => {
          const statusIcon = migration.status === 'completed' ? '✅' : '⏳';
          console.log(`   ${statusIcon} ${migration.version} - ${migration.description}`);
        });
      }
      
    } finally {
      await client.close();
    }
  },

  /**
   * Validate migration integrity
   */
  async validate(args) {
    console.log('🔍 Validating migration integrity...');
    
    const { db, client } = await connectToDatabase();
    const manager = new MigrationManager(db);
    
    try {
      await manager.initialize();
      await manager.loadMigrationsFromDirectory(config.MIGRATIONS_DIR);
      
      const validation = await manager.validateIntegrity();
      
      if (validation.isValid) {
        console.log('✅ All migrations are valid');
      } else {
        console.log('❌ Migration integrity issues found:');
        validation.issues.forEach(issue => {
          console.log(`   ❌ ${issue.version}: ${issue.message}`);
        });
        process.exit(1);
      }
      
    } finally {
      await client.close();
    }
  },

  /**
   * Create new migration template
   */
  async create(args) {
    const description = args.join(' ');
    
    if (!description) {
      console.error('❌ Migration description is required');
      console.log('Usage: npm run migrate create <description>');
      process.exit(1);
    }
    
    // Generate version number (001, 002, etc.)
    const fs = await import('fs/promises');
    const files = await fs.readdir(config.MIGRATIONS_DIR);
    const migrationFiles = files
      .filter(file => file.match(/^\d{3}_.*\.js$/))
      .sort();
    
    const lastMigration = migrationFiles[migrationFiles.length - 1];
    const lastVersion = lastMigration ? parseInt(lastMigration.substring(0, 3)) : 0;
    const newVersion = String(lastVersion + 1).padStart(3, '0');
    
    // Generate filename
    const filename = `${newVersion}_${description.toLowerCase().replace(/\s+/g, '_')}.js`;
    const filePath = path.join(config.MIGRATIONS_DIR, filename);
    
    // Generate migration template
    const template = generateMigrationTemplate(newVersion, description);
    
    try {
      await fs.writeFile(filePath, template);
      console.log(`✅ Created migration: ${filename}`);
      console.log(`   File: ${filePath}`);
    } catch (error) {
      console.error(`❌ Failed to create migration: ${error.message}`);
      process.exit(1);
    }
  },

  /**
   * Show help
   */
  help() {
    console.log(`
📚 Database Migration CLI

Usage: npm run migrate <command> [options]

Commands:
  migrate [version]     Run pending migrations up to optional version
  rollback [version|steps]   Rollback migrations to version or by steps (default: 1)
  status               Show migration status
  validate             Validate migration integrity
  create <description> Create new migration file
  help                 Show this help message

Examples:
  npm run migrate                    # Run all pending migrations
  npm run migrate 003                # Run migrations up to version 003
  npm run migrate rollback           # Rollback last migration
  npm run migrate rollback 2         # Rollback last 2 migrations
  npm run migrate rollback 001       # Rollback to version 001
  npm run migrate status             # Show current status
  npm run migrate validate           # Check integrity
  npm run migrate create "Add user roles"  # Create new migration

Environment Variables:
  MONGODB_URI          MongoDB connection string (default: mongodb://localhost:27017)
  DATABASE_NAME        Database name (default: medium_extractor)
`);
  }
};

/**
 * Connect to MongoDB
 */
async function connectToDatabase() {
  try {
    console.log(`🔗 Connecting to MongoDB: ${config.DATABASE_NAME}`);
    
    const client = new MongoClient(config.MONGODB_URI, {
      serverSelectionTimeoutMS: config.CONNECTION_TIMEOUT
    });
    
    await client.connect();
    await client.db('admin').command({ ping: 1 });
    
    const db = client.db(config.DATABASE_NAME);
    
    return { db, client };
    
  } catch (error) {
    console.error(`❌ Failed to connect to MongoDB: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Generate migration template
 */
function generateMigrationTemplate(version, description) {
  return `/**
 * ${description}
 * Version: ${version}
 * 
 * @author Your Name
 * @date ${new Date().toISOString().split('T')[0]}
 * 
 * Describe what this migration does here.
 */

import { Migration, MigrationUtils } from './migration-manager.js';

export default class ${toPascalCase(description)}Migration extends Migration {
  constructor() {
    super('${version}', '${description}');
  }

  /**
   * Execute forward migration
   */
  async up(db) {
    console.log('🏗️  Executing ${description.toLowerCase()}...');
    
    // TODO: Implement migration logic here
    // Example:
    // const collection = db.collection('your_collection');
    // await collection.updateMany({}, { $set: { newField: 'defaultValue' } });
    
    console.log('✅ ${description} completed');
  }

  /**
   * Execute rollback migration
   */
  async down(db) {
    console.log('🔄 Rolling back ${description.toLowerCase()}...');
    
    // TODO: Implement rollback logic here
    // Example:
    // const collection = db.collection('your_collection');
    // await collection.updateMany({}, { $unset: { newField: '' } });
    
    console.log('✅ ${description} rollback completed');
  }

  /**
   * Validate migration preconditions
   */
  async validate(db) {
    // TODO: Add validation logic if needed
    // Example:
    // const exists = await MigrationUtils.collectionExists(db, 'required_collection');
    // return exists;
    
    return true;
  }
}
`;
}

/**
 * Convert string to PascalCase
 */
function toPascalCase(str) {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

/**
 * Main CLI handler
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  const commandArgs = args.slice(1);

  if (!commands[command]) {
    console.error(`❌ Unknown command: ${command}`);
    commands.help();
    process.exit(1);
  }

  try {
    await commands[command](commandArgs);
  } catch (error) {
    console.error(`❌ Command failed: ${error.message}`);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run CLI if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  });
}

export { commands, connectToDatabase, config };