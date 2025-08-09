/**
 * MCP Documentation Server Entry Point
 * DevOps Engineer: Luc
 * 
 * Application startup and environment validation
 */

import 'dotenv/config';
import { MCPDocumentationServer } from './server/server.js';
import { getConfig } from './config/configLoader.js';

async function main(): Promise<void> {
  try {
    // Load and validate configuration
    console.log('Loading configuration...');
    const config = getConfig();
    console.log(`Configuration loaded for environment: ${config.server.environment}`);

    // Validate required environment variables
    const requiredEnvVars = ['OPENAI_API_KEY', 'WEAVIATE_URL'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    // Validate Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.split('.')[0]?.substring(1) || '0');
    if (majorVersion < 18) {
      throw new Error(`Node.js version ${nodeVersion} is not supported. Please use Node.js 18 or higher.`);
    }

    console.log(`Node.js version: ${nodeVersion} ✅`);
    console.log(`OpenAI API Key configured: ${process.env.OPENAI_API_KEY ? '✅' : '❌'}`);
    console.log(`Weaviate URL: ${process.env.WEAVIATE_URL}`);

    // Create and start server
    console.log('Starting MCP Documentation Server...');
    const server = new MCPDocumentationServer();
    
    await server.start();
    console.log('🚀 MCP Documentation Server is ready!');

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions and rejections
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the application
main().catch((error) => {
  console.error('Application startup failed:', error);
  process.exit(1);
});