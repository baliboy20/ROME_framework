#!/usr/bin/env node
/**
 * MCP Server Startup Script
 * Starts the Model Context Protocol server with Weaviate integration
 */

import { MCPServer } from '../server/MCPServer.js';
import { WeaviateClient } from '../vectorstore/WeaviateClient.js';
import { Logger } from '../utils/Logger.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

async function startServer() {
  const logger = new Logger('MCP-Startup');
  
  console.log('🚀 Starting MCP Documentation Server...\n');
  
  try {
    // Initialize Weaviate client
    logger.info('Connecting to Weaviate...');
    const weaviateClient = new WeaviateClient({
      host: 'localhost',
      scheme: 'http',
      port: 8088,
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 5000,
      retryAttempts: 3,
      retryDelay: 1000
    });
    
    const connected = await weaviateClient.connect();
    if (!connected) {
      throw new Error('Failed to connect to Weaviate');
    }
    
    const health = await weaviateClient.getHealth();
    logger.info(`✅ Connected to Weaviate (status: ${health.status}, latency: ${health.latency}ms)`);
    
    // Initialize MCP server
    logger.info('Initializing MCP server...');
    const mcpServer = new MCPServer({
      weaviateClient,
      logger
    });
    
    // Connect to stdio transport
    const transport = new StdioServerTransport();
    await mcpServer.connect(transport);
    
    logger.info('✅ MCP server started successfully');
    logger.info('📝 Available tools:');
    const tools = mcpServer.getRegisteredTools();
    tools.forEach(tool => {
      logger.info(`  - ${tool}`);
    });
    
    // Handle shutdown gracefully
    process.on('SIGINT', async () => {
      logger.info('\n🛑 Shutting down MCP server...');
      await weaviateClient.disconnect();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      logger.info('\n🛑 Shutting down MCP server...');
      await weaviateClient.disconnect();
      process.exit(0);
    });
    
    // Keep process alive
    process.stdin.resume();
    
  } catch (error) {
    logger.error('❌ Failed to start MCP server:', error);
    process.exit(1);
  }
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer();
}

export { startServer };