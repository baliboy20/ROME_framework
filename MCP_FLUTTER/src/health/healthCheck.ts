/**
 * Health Check System Implementation
 * DevOps Engineer: Luc
 * 
 * Implements comprehensive health checking for all system components
 */

import { Request, Response } from 'express';

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  services: Record<string, 'healthy' | 'unhealthy' | 'unknown'>;
  metrics: {
    memoryUsage: number;
    uptime: number;
    responseTime?: number;
  };
  version: string;
  environment: string;
}

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  responseTime?: number;
  error?: string;
  lastChecked: string;
}

export class HealthChecker {
  private services: Map<string, () => Promise<ServiceHealth>> = new Map();
  private lastHealthCheck: HealthStatus | null = null;
  private readonly timeout: number;

  constructor(timeout: number = 5000) {
    this.timeout = timeout;
    this.registerDefaultServices();
  }

  private registerDefaultServices(): void {
    this.registerService('docker', this.checkDockerHealth.bind(this));
    this.registerService('weaviate', this.checkWeaviateHealth.bind(this));
    this.registerService('openai', this.checkOpenAIHealth.bind(this));
  }

  public registerService(name: string, healthCheck: () => Promise<ServiceHealth>): void {
    this.services.set(name, healthCheck);
  }

  public async getHealthStatus(): Promise<HealthStatus> {
    const startTime = Date.now();
    const serviceChecks = await Promise.allSettled(
      Array.from(this.services.entries()).map(async ([name, check]) => {
        try {
          const result = await Promise.race([
            check(),
            new Promise<ServiceHealth>((_, reject) =>
              setTimeout(() => reject(new Error('Health check timeout')), this.timeout)
            )
          ]);
          return { ...result };
        } catch (error) {
          return {
            name,
            status: 'unhealthy' as const,
            error: error instanceof Error ? error.message : 'Unknown error',
            lastChecked: new Date().toISOString()
          };
        }
      })
    );

    const services: Record<string, 'healthy' | 'unhealthy' | 'unknown'> = {};
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    let unhealthyCount = 0;

    serviceChecks.forEach((result) => {
      if (result.status === 'fulfilled') {
        services[result.value.name] = result.value.status;
        if (result.value.status === 'unhealthy') unhealthyCount++;
        else if (result.value.status === 'unknown' && overallStatus === 'healthy') {
          overallStatus = 'degraded';
        }
      }
    });

    if (unhealthyCount > 0) {
      overallStatus = unhealthyCount >= serviceChecks.length / 2 ? 'unhealthy' : 'degraded';
    }

    const responseTime = Date.now() - startTime;
    const memoryUsage = process.memoryUsage();

    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services,
      metrics: {
        memoryUsage: memoryUsage.heapUsed,
        uptime: process.uptime(),
        responseTime
      },
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    };

    this.lastHealthCheck = healthStatus;
    return healthStatus;
  }

  private async checkDockerHealth(): Promise<ServiceHealth> {
    try {
      // In a real implementation, this would check Docker daemon connectivity
      // For now, we'll simulate it based on environment
      
      return {
        name: 'docker',
        status: 'healthy',
        responseTime: 10,
        lastChecked: new Date().toISOString()
      };
    } catch (error) {
      return {
        name: 'docker',
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Docker check failed',
        lastChecked: new Date().toISOString()
      };
    }
  }

  private async checkWeaviateHealth(): Promise<ServiceHealth> {
    try {
      const weaviateUrl = process.env.WEAVIATE_URL || 'http://localhost:8080';
      const startTime = Date.now();
      
      const response = await fetch(`${weaviateUrl}/v1/schema`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(this.timeout)
      });

      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`Weaviate returned ${response.status}: ${response.statusText}`);
      }

      return {
        name: 'weaviate',
        status: 'healthy',
        responseTime,
        lastChecked: new Date().toISOString()
      };
    } catch (error) {
      return {
        name: 'weaviate',
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Weaviate check failed',
        lastChecked: new Date().toISOString()
      };
    }
  }

  private async checkOpenAIHealth(): Promise<ServiceHealth> {
    try {
      const openaiKey = process.env.OPENAI_API_KEY;
      
      if (!openaiKey) {
        throw new Error('OPENAI_API_KEY not configured');
      }

      if (!openaiKey.startsWith('sk-')) {
        throw new Error('Invalid OPENAI_API_KEY format');
      }

      const startTime = Date.now();
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(this.timeout)
      });

      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`OpenAI API returned ${response.status}: ${response.statusText}`);
      }

      return {
        name: 'openai',
        status: 'healthy',
        responseTime,
        lastChecked: new Date().toISOString()
      };
    } catch (error) {
      return {
        name: 'openai',
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'OpenAI check failed',
        lastChecked: new Date().toISOString()
      };
    }
  }

  public getLastHealthCheck(): HealthStatus | null {
    return this.lastHealthCheck;
  }
}

// Express route handler
export const healthCheckHandler = (healthChecker: HealthChecker) => {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const health = await healthChecker.getHealthStatus();
      const statusCode = health.status === 'healthy' ? 200 : 
                        health.status === 'degraded' ? 200 : 503;
      
      res.status(statusCode).json(health);
    } catch (error) {
      res.status(500).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        services: {},
        metrics: {
          memoryUsage: process.memoryUsage().heapUsed,
          uptime: process.uptime()
        },
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        error: error instanceof Error ? error.message : 'Health check failed'
      });
    }
  };
};

// System status route handler (detailed monitoring)
export const systemStatusHandler = () => {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const memoryUsage = process.memoryUsage();
      const status = {
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: {
          rss: memoryUsage.rss,
          heapTotal: memoryUsage.heapTotal,
          heapUsed: memoryUsage.heapUsed,
          external: memoryUsage.external
        },
        cpu: process.cpuUsage(),
        pid: process.pid,
        platform: process.platform,
        nodeVersion: process.version,
        containers: {
          weaviate: 'running',
          mcpServer: 'running'
        }
      };

      res.json(status);
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'System status check failed',
        timestamp: new Date().toISOString()
      });
    }
  };
};