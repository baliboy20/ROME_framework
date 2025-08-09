/**
 * MCP Documentation Server Entry Point
 * 
 * Main entry point for the MCP Documentation Server
 * Initializes dependencies and starts the MCP server
 * 
 * Author: Reena (Backend Developer) 
 * Date: 2025-08-06
 */

import { MCPServer } from './server/MCPServer.js';
import { WeaviateClient } from './vectorstore/WeaviateClient.js';
import { Logger } from './utils/Logger.js';

async function main() {
  const logger = new Logger('MCPDocumentationServer');
  
  try {
    logger.info('Starting MCP Documentation Server');

    // Initialize Weaviate client
    const weaviateConfig = {
      host: process.env.WEAVIATE_HOST || 'localhost',
      scheme: (process.env.WEAVIATE_SCHEME || 'http') as 'http' | 'https',
      port: parseInt(process.env.WEAVIATE_PORT || '8080'),
      headers: process.env.OPENAI_API_KEY ? {
        'X-OpenAI-Api-Key': process.env.OPENAI_API_KEY
      } : undefined
    };

    const weaviateClient = new WeaviateClient(weaviateConfig);
    
    // Test database connection
    await weaviateClient.connect();
    logger.info('Connected to Weaviate database');

    // Initialize MCP server
    const mcpServer = new MCPServer({
      weaviateClient,
      logger
    });

    // Connect to stdio transport
    await mcpServer.connect();
    logger.info('MCP server connected and ready');

    // Handle graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down gracefully');
      try {
        await mcpServer.close();
        await weaviateClient.disconnect();
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
        await weaviateClient.disconnect();
        logger.info('Server shutdown complete');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown', error instanceof Error ? error : new Error(String(error)));
        process.exit(1);
      }
    });

  } catch (error) {
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