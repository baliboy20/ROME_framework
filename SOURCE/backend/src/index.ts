import { MongoClient } from 'mongodb';
import app from './app.js';
import { appConfig } from '@/config/app.config.js';
import { dbConfig, validateDbConfig } from '@/config/database.config.js';
import { validateAuthConfig } from '@/config/auth.config.js';
import { AuthService } from '@/services/AuthService.js';
import { migrateExistingGmailToken } from '@/utils/existing-token-loader.js';

async function startServer() {
  try {
    console.log(`🚀 Starting ${appConfig.appName} v${appConfig.version}`);
    console.log(`📍 Environment: ${appConfig.nodeEnv}`);
    
    // Validate configuration
    if (!validateDbConfig()) {
      process.exit(1);
    }
    
    if (!validateAuthConfig()) {
      process.exit(1);
    }
    
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    const client = new MongoClient(dbConfig.uri, dbConfig.options);
    await client.connect();
    
    // Test the connection
    await client.db(dbConfig.dbName).admin().ping();
    console.log('✅ MongoDB connected successfully');
    
    // Migrate existing Gmail token if available
    try {
      const authService = new AuthService();
      await migrateExistingGmailToken(authService);
    } catch (error) {
      console.log('ℹ️  No existing Gmail token to migrate (normal for fresh setup)');
    }
    
    // Start HTTP server
    const server = app.listen(appConfig.port, () => {
      console.log(`🌐 Server running on port ${appConfig.port}`);
      console.log(`📊 Health check: http://localhost:${appConfig.port}/health`);
      console.log(`🔐 Auth endpoint: http://localhost:${appConfig.port}/api/auth/google/init`);
    });
    
    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n📴 Received ${signal}. Starting graceful shutdown...`);
      
      server.close(async (err) => {
        if (err) {
          console.error('❌ Error during server shutdown:', err);
          process.exit(1);
        }
        
        try {
          await client.close();
          console.log('✅ MongoDB connection closed');
          console.log('👋 Server shutdown complete');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error closing MongoDB connection:', error);
          process.exit(1);
        }
      });
      
      // Force shutdown after timeout
      setTimeout(() => {
        console.error('❌ Forced shutdown - timeout exceeded');
        process.exit(1);
      }, 10000);
    };
    
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
