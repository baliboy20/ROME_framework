/**
 * VDB Management Service Entry Point
 * 
 * Main entry point for the ROME Vector Database Management Service
 * Handles document storage, semantic search, and coordination tracking
 * 
 * Author: ROME Development Team
 * Date: 2025-08-09
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Logger } from './utils/Logger.js';
import { WeaviateService } from './services/WeaviateService.js';
import { CoordinationService } from './services/CoordinationService.js';
import { DocumentService } from './services/DocumentService.js';

// Import routes
import { documentsRouter } from './routes/documents.js';
import { coordinationRouter } from './routes/coordination.js';
import { contractsRouter } from './routes/contracts.js';
import { integrationRouter } from './routes/integration.js';
import { healthRouter } from './routes/health.js';

// Load environment variables
dotenv.config();

class VDBManagementServer {
  private app: express.Application;
  private logger: Logger;
  private weaviateService!: WeaviateService;
  private coordinationService!: CoordinationService;
  private documentService!: DocumentService;
  private port: number;

  constructor() {
    this.app = express();
    this.logger = new Logger('VDBManagementServer');
    this.port = parseInt(process.env.PORT || '8081'); // Updated to 8081
    
    this.initializeServices();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private initializeServices(): void {
    try {
      // Initialize Weaviate service with real connection to port 8080
      this.weaviateService = new WeaviateService({
        scheme: process.env.WEAVIATE_SCHEME || 'http',
        host: process.env.WEAVIATE_HOST || 'localhost:8087' // Updated to point to Weaviate on 8087
      }, this.logger);

      // Initialize coordination service
      this.coordinationService = new CoordinationService(this.weaviateService, this.logger);

      // Initialize document service
      this.documentService = new DocumentService(this.weaviateService, this.logger);

      this.logger.info('All services initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize services', { error });
      throw error;
    }
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: false
    }));

    // CORS middleware
    this.app.use(cors({
      origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-correlation-id']
    }));

    // Compression middleware
    this.app.use(compression());

    // Request logging
    this.app.use(morgan('combined', {
      stream: {
        write: (message) => this.logger.info(message.trim())
      }
    }));

    // Body parsing middleware
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // Add services to request context
    this.app.use((req, _res, next) => {
      (req as any).services = {
        weaviate: this.weaviateService,
        coordination: this.coordinationService,
        documents: this.documentService,
        logger: this.logger
      };
      next();
    });
  }

  private setupRoutes(): void {
    // Health check endpoint (must be first)
    this.app.use('/health', healthRouter);

    // API routes
    this.app.use('/api/v1/documents', documentsRouter);
    this.app.use('/api/v1/coordination', coordinationRouter);
    this.app.use('/api/v1/contracts', contractsRouter);
    this.app.use('/api/v1/integration', integrationRouter);

    // Serve management console static files
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const consolePath = path.join(__dirname, '../rome-console');
    this.app.use('/console', express.static(consolePath));
    
    // Serve console at dashboard route
    this.app.get('/dashboard', (_req, res) => {
      res.sendFile(path.join(consolePath, 'index.html'));
    });

    // Root endpoint - redirect to dashboard
    this.app.get('/', (_req, res) => {
      res.redirect('/dashboard');
    });

    // API info endpoint
    this.app.get('/api', (_req, res) => {
      res.json({
        service: 'ROME VDB Management Service',
        version: '1.0.0',
        status: 'running',
        port: this.port,
        console_url: `http://localhost:${this.port}/dashboard`,
        endpoints: [
          '/health',
          '/api/v1/documents',
          '/api/v1/coordination', 
          '/api/v1/contracts',
          '/api/v1/integration'
        ],
        weaviate_host: process.env.WEAVIATE_HOST || 'localhost:8087',
        timestamp: new Date().toISOString()
      });
    });

    // 404 handler
    this.app.use('*', (_req, res) => {
      res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        timestamp: new Date().toISOString()
      });
    });
  }

  private setupErrorHandling(): void {
    // Global error handler
    this.app.use((error: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
      const correlationId = req.headers['x-correlation-id'] || 'unknown';
      
      this.logger.error('Unhandled error in request', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        correlationId
      });

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        correlationId,
        timestamp: new Date().toISOString()
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('Unhandled Rejection', { reason, promise });
      process.exit(1);
    });
  }

  public async start(): Promise<void> {
    try {
      // Test Weaviate connection
      await this.weaviateService.healthCheck();
      this.logger.info('Weaviate connection verified');

      // Initialize database schemas if needed
      await this.weaviateService.initializeSchemas();
      this.logger.info('Database schemas initialized');

      // Start the server
      const server = createServer(this.app);
      
      server.listen(this.port, () => {
        this.logger.info(`VDB Management Service running on port ${this.port}`, {
          port: this.port,
          environment: process.env.NODE_ENV || 'development',
          weaviate_host: process.env.WEAVIATE_HOST || 'localhost:8087'
        });
      });

      // Graceful shutdown handlers
      const shutdown = async (signal: string) => {
        this.logger.info(`Received ${signal}, shutting down gracefully`);
        
        server.close(async () => {
          try {
            await this.weaviateService.close();
            this.logger.info('All services closed, exiting');
            process.exit(0);
          } catch (error) {
            this.logger.error('Error during shutdown', { error });
            process.exit(1);
          }
        });

        // Force exit after timeout
        setTimeout(() => {
          this.logger.error('Forced shutdown after timeout');
          process.exit(1);
        }, 10000);
      };

      process.on('SIGTERM', () => shutdown('SIGTERM'));
      process.on('SIGINT', () => shutdown('SIGINT'));

    } catch (error) {
      this.logger.error('Failed to start VDB Management Service', { error });
      process.exit(1);
    }
  }

  public getApp(): express.Application {
    return this.app;
  }
}

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new VDBManagementServer();
  server.start().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

export { VDBManagementServer };