#!/usr/bin/env node

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs').promises;

// Import database configuration
const databaseConfig = require('../backend/config/database');

/**
 * Database Migration Runner
 * Handles running migrations and seeds for the Project Management Application
 */

class MigrationRunner {
  constructor() {
    this.migrationsPath = path.join(__dirname, 'migrations');
    this.seedsPath = path.join(__dirname, 'seeds');
    this.executedMigrations = [];
  }

  async connect() {
    try {
      const connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/project_mgmt';
      await databaseConfig.connect(connectionString);
      console.log('🔗 Connected to MongoDB for migrations');
    } catch (error) {
      console.error('❌ Failed to connect to database:', error.message);
      process.exit(1);
    }
  }

  async disconnect() {
    try {
      await databaseConfig.disconnect();
      console.log('🔌 Disconnected from MongoDB');
    } catch (error) {
      console.error('❌ Error disconnecting from database:', error.message);
    }
  }

  async loadMigrationFiles(directory) {
    try {
      const files = await fs.readdir(directory);
      const migrationFiles = files
        .filter(file => file.endsWith('.js'))
        .sort(); // Execute in alphabetical order
      
      const migrations = [];
      
      for (const file of migrationFiles) {
        const filePath = path.join(directory, file);
        const migration = require(filePath);
        
        migrations.push({
          name: file,
          path: filePath,
          up: migration.up,
          down: migration.down
        });
      }
      
      return migrations;
    } catch (error) {
      console.error(`❌ Error loading migration files from ${directory}:`, error.message);
      return [];
    }
  }

  async runMigrations() {
    try {
      console.log('🚀 Running database migrations...\n');
      
      const migrations = await this.loadMigrationFiles(this.migrationsPath);
      
      if (migrations.length === 0) {
        console.log('📝 No migration files found');
        return;
      }
      
      for (const migration of migrations) {
        console.log(`⚡ Executing migration: ${migration.name}`);
        
        try {
          await migration.up();
          this.executedMigrations.push(migration.name);
          console.log(`✅ Migration completed: ${migration.name}\n`);
        } catch (error) {
          console.error(`❌ Migration failed: ${migration.name}`);
          console.error(`   Error: ${error.message}\n`);
          throw error;
        }
      }
      
      console.log(`🎉 All ${migrations.length} migrations completed successfully!`);
      
    } catch (error) {
      console.error('❌ Migration process failed:', error.message);
      throw error;
    }
  }

  async rollbackMigrations() {
    try {
      console.log('⏪ Rolling back database migrations...\n');
      
      const migrations = await this.loadMigrationFiles(this.migrationsPath);
      
      if (migrations.length === 0) {
        console.log('📝 No migration files found');
        return;
      }
      
      // Execute rollbacks in reverse order
      const reversedMigrations = migrations.reverse();
      
      for (const migration of reversedMigrations) {
        console.log(`⚡ Rolling back migration: ${migration.name}`);
        
        try {
          if (migration.down) {
            await migration.down();
            console.log(`✅ Rollback completed: ${migration.name}\n`);
          } else {
            console.log(`⚠️  No rollback function for: ${migration.name}\n`);
          }
        } catch (error) {
          console.error(`❌ Rollback failed: ${migration.name}`);
          console.error(`   Error: ${error.message}\n`);
          throw error;
        }
      }
      
      console.log(`🎉 All migrations rolled back successfully!`);
      
    } catch (error) {
      console.error('❌ Rollback process failed:', error.message);
      throw error;
    }
  }

  async runSeeds() {
    try {
      console.log('🌱 Running database seeds...\n');
      
      const seeds = await this.loadMigrationFiles(this.seedsPath);
      
      if (seeds.length === 0) {
        console.log('📝 No seed files found');
        return;
      }
      
      for (const seed of seeds) {
        console.log(`⚡ Executing seed: ${seed.name}`);
        
        try {
          await seed.up();
          console.log(`✅ Seed completed: ${seed.name}\n`);
        } catch (error) {
          console.error(`❌ Seed failed: ${seed.name}`);
          console.error(`   Error: ${error.message}\n`);
          throw error;
        }
      }
      
      console.log(`🎉 All ${seeds.length} seeds completed successfully!`);
      
    } catch (error) {
      console.error('❌ Seeding process failed:', error.message);
      throw error;
    }
  }

  async clearSeeds() {
    try {
      console.log('🧹 Clearing seed data...\n');
      
      const seeds = await this.loadMigrationFiles(this.seedsPath);
      
      if (seeds.length === 0) {
        console.log('📝 No seed files found');
        return;
      }
      
      // Execute clear operations in reverse order
      const reversedSeeds = seeds.reverse();
      
      for (const seed of reversedSeeds) {
        console.log(`⚡ Clearing seed: ${seed.name}`);
        
        try {
          if (seed.down) {
            await seed.down();
            console.log(`✅ Seed cleared: ${seed.name}\n`);
          } else {
            console.log(`⚠️  No clear function for: ${seed.name}\n`);
          }
        } catch (error) {
          console.error(`❌ Clear failed: ${seed.name}`);
          console.error(`   Error: ${error.message}\n`);
          throw error;
        }
      }
      
      console.log(`🎉 All seed data cleared successfully!`);
      
    } catch (error) {
      console.error('❌ Clear process failed:', error.message);
      throw error;
    }
  }

  async showStatus() {
    try {
      console.log('📊 Database Migration Status\n');
      
      // Show database connection info
      const connectionInfo = databaseConfig.getConnectionInfo();
      console.log('🔗 Database Connection:');
      console.log(`   Status: ${connectionInfo.status}`);
      console.log(`   Host: ${connectionInfo.host || 'N/A'}`);
      console.log(`   Port: ${connectionInfo.port || 'N/A'}`);
      console.log(`   Database: ${connectionInfo.name || 'N/A'}\n`);
      
      // Show available migrations
      const migrations = await this.loadMigrationFiles(this.migrationsPath);
      console.log(`📁 Available Migrations (${migrations.length}):`);
      migrations.forEach((migration, index) => {
        console.log(`   ${index + 1}. ${migration.name}`);
      });
      console.log();
      
      // Show available seeds
      const seeds = await this.loadMigrationFiles(this.seedsPath);
      console.log(`🌱 Available Seeds (${seeds.length}):`);
      seeds.forEach((seed, index) => {
        console.log(`   ${index + 1}. ${seed.name}`);
      });
      console.log();
      
      // Show collection statistics
      if (databaseConfig.isDbConnected()) {
        console.log('📊 Collection Statistics:');
        const db = mongoose.connection.db;
        const collections = ['projects', 'tasks', 'blogs', 'files'];
        
        for (const collectionName of collections) {
          try {
            const collection = db.collection(collectionName);
            const count = await collection.countDocuments();
            console.log(`   ${collectionName}: ${count} documents`);
          } catch (error) {
            console.log(`   ${collectionName}: Error getting count`);
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Error showing status:', error.message);
    }
  }

  printUsage() {
    console.log(`
📋 Database Migration Runner - Usage

Commands:
  migrate        Run all pending migrations
  rollback       Rollback all migrations
  seed           Run all seed files
  clear          Clear all seed data
  reset          Rollback migrations, run migrations, then seed
  status         Show migration and database status
  help           Show this help message

Examples:
  node migrate.js migrate
  node migrate.js seed
  node migrate.js reset
  node migrate.js status

Environment Variables:
  MONGODB_URI    MongoDB connection string (default: mongodb://localhost:27017/project_mgmt)
`);
  }
}

// Main execution
async function main() {
  const runner = new MigrationRunner();
  const command = process.argv[2];
  
  if (!command || command === 'help') {
    runner.printUsage();
    return;
  }
  
  try {
    await runner.connect();
    
    switch (command) {
      case 'migrate':
        await runner.runMigrations();
        break;
        
      case 'rollback':
        await runner.rollbackMigrations();
        break;
        
      case 'seed':
        await runner.runSeeds();
        break;
        
      case 'clear':
        await runner.clearSeeds();
        break;
        
      case 'reset':
        console.log('🔄 Performing full database reset...\n');
        await runner.rollbackMigrations();
        await runner.runMigrations();
        await runner.runSeeds();
        console.log('🎉 Database reset completed!');
        break;
        
      case 'status':
        await runner.showStatus();
        break;
        
      default:
        console.error(`❌ Unknown command: ${command}`);
        runner.printUsage();
        process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Migration runner failed:', error.message);
    process.exit(1);
  } finally {
    await runner.disconnect();
  }
}

// Handle unhandled promises and exceptions
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception thrown:', error);
  process.exit(1);
});

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = MigrationRunner;