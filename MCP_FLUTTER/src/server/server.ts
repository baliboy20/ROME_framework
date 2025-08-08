/**
 * MCP Documentation Server Implementation
 * DevOps Engineer: Luc (Server Infrastructure)
 * Backend Engineer: Reena (MCP Protocol Integration)
 *
 * Basic Express server with health checks and infrastructure monitoring
 */

import express, { Express, Request, Response } from 'express';
import { createServer, Server } from 'http';
import { HealthChecker, healthCheckHandler, systemStatusHandler } from '../health/healthCheck.js';
import { getConfig, AppConfig } from '../config/configLoader.js';

export class MCPDocumentationServer {
  private app: Express;
  private server: Server | null = null;
  private healthChecker: HealthChecker;
  private config: AppConfig;
  private isShuttingDown: boolean = false;

  constructor() {
    this.app = express();
    this.config = getConfig();
    this.healthChecker = new HealthChecker(this.config.health.timeout);

    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
    this.setupGracefulShutdown();
  }

  private setupMiddleware(): void {
    // Basic middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // CORS configuration for production
    if (this.config.security?.cors) {
      this.app.use((req: Request, res: Response, next): void => {
        const { origin, credentials } = this.config.security!.cors;
        
        if (origin) {
          res.header('Access-Control-Allow-Origin', typeof origin === 'string' ? origin : '*');
        }
        
        if (credentials) {
          res.header('Access-Control-Allow-Credentials', 'true');
        }
        
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        
        if (req.method === 'OPTIONS') {
          res.sendStatus(200);
          return;
        }
        
        next();
      });
    }

    // Request logging
    this.app.use((req: Request, res: Response, next) => {
      const start = Date.now();

      res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
      });

      next();
    });
  }

  private setupRoutes(): void {
    // Health check endpoints
    this.app.get('/health', healthCheckHandler(this.healthChecker));
    this.app.get('/system/status', systemStatusHandler());

    // Basic server info
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        service: 'MCP Documentation Server',
        version: process.env.npm_package_version || '1.0.0',
        environment: this.config.server.environment,
        timestamp: new Date().toISOString(),
        status: 'running'
      });
    });

    // Metrics endpoint (if enabled)
    if (this.config.monitoring?.metrics.enabled) {
      this.app.get(this.config.monitoring.metrics.endpoint, (req: Request, res: Response) => {
        const metrics = this.generateMetrics();
        res.set('Content-Type', 'text/plain');
        res.send(metrics);
      });
    }

    // Placeholder for MCP protocol endpoints (to be implemented by Reena)
    this.app.post('/mcp/*', (req: Request, res: Response) => {
      res.status(501).json({
        error: 'MCP Protocol endpoints not yet implemented',
        message: 'Backend Engineer Reena will implement MCP protocol handlers',
        timestamp: new Date().toISOString()
      });
    });
  }

  private setupErrorHandling(): void {
    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
        timestamp: new Date().toISOString()
      });
    });

    // Global error handler
    this.app.use((error: Error, req: Request, res: Response, next: any) => {
      console.error('Unhandled error:', error);

      if (res.headersSent) {
        return next(error);
      }

      const statusCode = this.isShuttingDown ? 503 : 500;

      res.status(statusCode).json({
        error: this.config.server.environment === 'production' 
          ? 'Internal Server Error' 
          : error.message,
        timestamp: new Date().toISOString(),
        ...(this.config.server.environment !== 'production' && { stack: error.stack })
      });
    });
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      console.log(`Received ${signal}, starting graceful shutdown...`);
      this.isShuttingDown = true;

      if (this.server) {
        this.server.close((err) => {
          if (err) {
            console.error('Error during server shutdown:', err);
            process.exit(1);
          }

          console.log('Server closed successfully');
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }

  private generateMetrics(): string {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    const lastHealth = this.healthChecker.getLastHealthCheck();

    const metrics = [
      '# HELP nodejs_memory_heap_used_bytes Process heap memory used in bytes',
      '# TYPE nodejs_memory_heap_used_bytes gauge',
      `nodejs_memory_heap_used_bytes ${memoryUsage.heapUsed}`,
      '',
      '# HELP nodejs_memory_heap_total_bytes Process heap memory total in bytes',
      '# TYPE nodejs_memory_heap_total_bytes gauge',
      `nodejs_memory_heap_total_bytes ${memoryUsage.heapTotal}`,
      '',
      '# HELP process_uptime_seconds Number of seconds since the process started',
      '# TYPE process_uptime_seconds gauge',
      `process_uptime_seconds ${uptime}`,
      '',
      '# HELP service_health_status Current health status of services',
      '# TYPE service_health_status gauge'
    ];

    if (lastHealth) {
      Object.entries(lastHealth.services).forEach(([service, status]) => {
        const value = status === 'healthy' ? 1 : status === 'unhealthy' ? 0 : 0.5;
        metrics.push(`service_health_status{service="${service}",status="${status}"} ${value}`);
      });
    }

    return metrics.join('\n') + '\n';
  }

  public async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = createServer(this.app);

        this.server.listen(this.config.server.port, this.config.server.host, () => {
          console.log(`MCP Documentation Server started on ${this.config.server.host}:${this.config.server.port}`);
          console.log(`Environment: ${this.config.server.environment}`);
          console.log(`Health check: http://${this.config.server.host}:${this.config.server.port}/health`);
          resolve();
        });

        this.server.on('error', (error: Error) => {
          console.error('Server error:', error);
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  public async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        resolve();
        return;
      }

      this.server.close((error) => {
        if (error) {
          reject(error);
        } else {
          console.log('Server stopped');
          resolve();
        }
      });
    });
  }

  public getApp(): Express {
    return this.app;
  }

  public getHealthChecker(): HealthChecker {
    return this.healthChecker;
  }
}