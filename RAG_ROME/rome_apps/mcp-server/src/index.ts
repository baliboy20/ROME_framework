/**
 * ROME MCP Server Entry Point
 * 
 * Main entry point for the ROME Methodology MCP Server
 * Provides ROME-focused tools for AI development coordination
 * 
 * Author: ROME Development Team
 * Date: 2025-08-09
 */

import { MCPServer } from './server/MCPServer.js';
import { Logger } from './utils/Logger.js';
import axios from 'axios';

async function main() {
  const logger = new Logger('ROMEMCPServer');
  
  // Debug: Show startup information
  console.log('\n=== ROME MCP SERVER STARTUP DEBUG ===');
  console.log(`🚀 Starting ROME MCP Server at ${new Date().toISOString()}`);
  console.log(`📁 Working Directory: ${process.cwd()}`);
  console.log(`🆔 Process ID: ${process.pid}`);
  console.log(`📝 Node Version: ${process.version}`);
  console.log(`💾 Memory Usage:`, process.memoryUsage());
  console.log('=====================================\n');
  
  try {
    logger.info('Starting ROME MCP Server');

    // Get VDB service URL
    const vdbServiceUrl = process.env.VDB_SERVICE_URL || 'http://localhost:8081';
    console.log(`🔗 VDB Service URL: ${vdbServiceUrl}`);
    
    // Test VDB service connection
    console.log('🔍 Testing VDB service connection...');
    try {
      const healthResponse = await axios.get(`${vdbServiceUrl}/health`);
      console.log('✅ VDB Service connection successful');
      console.log(`📊 VDB Health Status:`, healthResponse.data);
      logger.info('Connected to VDB Management Service', { url: vdbServiceUrl });
    } catch (error) {
      console.log('⚠️  VDB Service connection failed, will retry later');
      console.log(`❌ Error:`, error instanceof Error ? error.message : String(error));
      logger.warn('VDB Management Service not available, will retry on first request', { url: vdbServiceUrl });
    }

    // Initialize MCP server with VDB service client
    console.log('⚙️  Initializing MCP server...');
    const mcpServer = new MCPServer({
      vdbServiceUrl,
      logger
    });
    console.log('✅ MCP server instance created');

    // Connect to stdio transport
    console.log('🔌 Connecting to stdio transport...');
    await mcpServer.connect();
    console.log('🎉 MCP server connected successfully!');
    console.log('📡 Server is ready to accept connections');
    logger.info('ROME MCP server connected and ready');

    // Handle graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down gracefully');
      try {
        await mcpServer.close();
        logger.info('Server shutdown complete');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown', error instanceof Error ? error : new Error(String(error)));
        process.exit(1);
      }
    });

    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down gracefully');
      try {
        await mcpServer.close();
        logger.info('Server shutdown complete');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown', error instanceof Error ? error : new Error(String(error)));
        process.exit(1);
      }
    });

  } catch (error) {
    console.log('\n❌ FATAL ERROR: MCP Server startup failed!');
    console.log('🔍 Error details:');
    console.error(error);
    console.log('=====================================\n');
    logger.error('Failed to start MCP server', error instanceof Error ? error : new Error(String(error)));
    process.exit(1);
  }
}

// Handle unhandled errors
process.on('unhandledRejection', (reason, promise) => {
  const logger = new Logger('UnhandledRejection');
  logger.error('Unhandled Rejection at Promise', { reason, promise });
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  const logger = new Logger('UncaughtException');
  logger.error('Uncaught Exception', error);
  process.exit(1);
});

// Start the server (ES module compatible)
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main };