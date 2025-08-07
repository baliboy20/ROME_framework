/**
 * Document Management API
 * 
 * HTTP API endpoints for document ingestion, management, and monitoring
 * Provides REST interface for the document ingestion service
 * 
 * Author: Reena (Backend Developer)
 * Date: 2025-08-06
 */

import { DocumentIngestionService } from '../ingestion/DocumentIngestionService.js';
import { WeaviateClient } from '../vectorstore/WeaviateClient.js';
import { Logger } from '../utils/Logger.js';
import express, { Request, Response } from 'express';
import multer from 'multer';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface DocumentUpload {
  content: string;
  filename: string;
  category?: string;
  tags?: string[];
}

export class DocumentAPI {
  private app: express.Application;
  private ingestionService: DocumentIngestionService;
  private logger: Logger;
  private upload: multer.Multer;

  constructor(ingestionService: DocumentIngestionService, logger?: Logger) {
    this.ingestionService = ingestionService;
    this.logger = logger || new Logger('DocumentAPI');
    this.app = express();
    this.upload = multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
      fileFilter: (req, file, cb) => {
        // Accept text files and markdown
        if (file.mimetype.startsWith('text/') || 
            file.originalname.match(/\.(md|txt|rst|adoc)$/i)) {
          cb(null, true);
        } else {
          cb(new Error('Only text files are allowed'));
        }
      }
    });

    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // Enable JSON parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // CORS middleware
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // Request logging
    this.app.use((req, res, next) => {
      this.logger.info(`${req.method} ${req.path}`, {
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });
      next();
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', this.handleHealthCheck.bind(this));

    // Document ingestion endpoints
    this.app.post('/api/documents/ingest', this.handleDocumentIngest.bind(this));
    this.app.post('/api/documents/upload', this.upload.single('file'), this.handleFileUpload.bind(this));
    this.app.post('/api/documents/directory', this.handleDirectoryIngest.bind(this));

    // Document management
    this.app.delete('/api/documents/clear', this.handleClearDocuments.bind(this));
    this.app.get('/api/documents/stats', this.handleGetStats.bind(this));

    // Search endpoints (for testing)
    this.app.get('/api/documents/search', this.handleSearchDocuments.bind(this));

    // Error handling
    this.app.use(this.handleError.bind(this));
  }

  private async handleHealthCheck(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.ingestionService.getIngestionStats();
      res.json({
        status: 'healthy',
        service: 'document-api',
        timestamp: new Date().toISOString(),
        database: {
          connected: true,
          documents: stats.totalDocuments
        }
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        service: 'document-api',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  private async handleDocumentIngest(req: Request, res: Response): Promise<void> {
    try {
      const { content, source, category, tags } = req.body;

      if (!content || !source) {
        res.status(400).json({
          error: 'Missing required fields: content and source'
        });
        return;
      }

      const result = await this.ingestionService.ingestDocument({
        content,
        source,
        category,
        tags
      });

      res.json({
        success: result.success,
        message: result.success ? 'Document ingested successfully' : 'Document ingestion failed',
        result
      });

    } catch (error) {
      this.logger.error('Document ingestion failed', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async handleFileUpload(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      const content = req.file.buffer.toString('utf-8');
      const { category, tags } = req.body;

      const result = await this.ingestionService.ingestDocument({
        content,
        source: req.file.originalname,
        category,
        tags: tags ? JSON.parse(tags) : undefined
      });

      res.json({
        success: result.success,
        message: result.success ? 'File uploaded and ingested successfully' : 'File ingestion failed',
        filename: req.file.originalname,
        size: req.file.size,
        result
      });

    } catch (error) {
      this.logger.error('File upload failed', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async handleDirectoryIngest(req: Request, res: Response): Promise<void> {
    try {
      const { directoryPath, pattern } = req.body;

      if (!directoryPath) {
        res.status(400).json({
          error: 'Missing required field: directoryPath'
        });
        return;
      }

      // Validate directory exists and is accessible
      try {
        await fs.access(directoryPath);
      } catch (error) {
        res.status(400).json({
          error: 'Directory not accessible',
          path: directoryPath
        });
        return;
      }

      const filePattern = pattern ? new RegExp(pattern) : undefined;
      const result = await this.ingestionService.ingestDirectory(directoryPath, filePattern);

      res.json({
        success: result.success,
        message: result.success ? 'Directory ingested successfully' : 'Directory ingestion failed',
        directoryPath,
        pattern,
        result
      });

    } catch (error) {
      this.logger.error('Directory ingestion failed', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async handleClearDocuments(req: Request, res: Response): Promise<void> {
    try {
      await this.ingestionService.clearAllDocuments();
      
      res.json({
        success: true,
        message: 'All documents cleared successfully'
      });

    } catch (error) {
      this.logger.error('Clear documents failed', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async handleGetStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.ingestionService.getIngestionStats();
      
      res.json({
        success: true,
        stats
      });

    } catch (error) {
      this.logger.error('Get stats failed', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async handleSearchDocuments(req: Request, res: Response): Promise<void> {
    try {
      const { query, category, limit = 5 } = req.query;

      if (!query || typeof query !== 'string') {
        res.status(400).json({
          error: 'Missing required query parameter'
        });
        return;
      }

      // This is a basic search endpoint for testing
      // In production, this would use the SearchHandler
      const weaviateConfig = {
        host: process.env.WEAVIATE_HOST || 'localhost',
        scheme: (process.env.WEAVIATE_SCHEME || 'http') as 'http' | 'https',
        port: parseInt(process.env.WEAVIATE_PORT || '8080'),
      };

      const weaviateClient = new WeaviateClient(weaviateConfig);
      
      let whereClause = '';
      if (category) {
        whereClause = `where: { path: ["category"], operator: Equal, valueText: "${category}" }`;
      }

      const graphqlQuery = `
        {
          Get {
            FlutterDoc(
              ${whereClause}
              nearText: { concepts: ["${query}"] }
              limit: ${limit}
            ) {
              content
              category
              source
              section
              tags
              _additional {
                certainty
                id
              }
            }
          }
        }
      `;

      const response = await weaviateClient.nearTextSearch('FlutterDoc', query, 10);
      const documents = response.data || [];

      res.json({
        success: true,
        query,
        category,
        results: documents.map((doc: any) => ({
          id: doc._additional.id,
          content: doc.content.substring(0, 500) + (doc.content.length > 500 ? '...' : ''),
          category: doc.category,
          source: doc.source,
          section: doc.section,
          tags: doc.tags,
          relevance: doc._additional.certainty
        }))
      });

    } catch (error) {
      this.logger.error('Search failed', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private handleError(error: Error, req: Request, res: Response, next: express.NextFunction): void {
    this.logger.error('API error', error);
    
    if (error.message.includes('Only text files are allowed')) {
      res.status(400).json({
        error: 'Invalid file type',
        message: 'Only text files (.md, .txt, .rst, .adoc) are allowed'
      });
      return;
    }

    if (error.message.includes('File too large')) {
      res.status(413).json({
        error: 'File too large',
        message: 'File size must be less than 10MB'
      });
      return;
    }

    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    });
  }

  public getApp(): express.Application {
    return this.app;
  }

  public listen(port: number, callback?: () => void): void {
    this.app.listen(port, callback);
  }
}

// Create standalone server if run directly
export async function createDocumentServer(port = 3001): Promise<DocumentAPI> {
  const logger = new Logger('DocumentServer');
  
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
  const ingestionService = new DocumentIngestionService(weaviateClient, logger);
  
  await ingestionService.initialize();
  
  const api = new DocumentAPI(ingestionService, logger);
  
  return api;
}

// Start server if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const port = parseInt(process.env.PORT || '3001');
  
  createDocumentServer(port).then(server => {
    server.listen(port, () => {
      console.log(`📚 Document API server running on http://localhost:${port}`);
      console.log(`🔍 Health check: http://localhost:${port}/health`);
      console.log(`📊 Stats: http://localhost:${port}/api/documents/stats`);
    });
  }).catch(error => {
    console.error('Failed to start document server:', error);
    process.exit(1);
  });
}