/**
 * /generate-monitoring-config skill (Tier 1)
 * Generates monitoring configuration
 * Version: 1.0.0
 */

const fs = require('fs');
const path = require('path');

class GenerateMonitoringConfig {
  static async execute(params, executionId) {
    const { design_directory, output_directory } = params;

    try {
      const filesGenerated = [];

      // Generate Prometheus metrics middleware
      const metricsCode = this.generateMetricsMiddleware();
      fs.writeFileSync(path.join(output_directory, 'metrics.ts'), metricsCode);
      filesGenerated.push('metrics.ts');

      // Generate Prometheus config
      const prometheusConfig = this.generatePrometheusConfig();
      fs.writeFileSync(path.join(output_directory, 'prometheus.yml'), prometheusConfig);
      filesGenerated.push('prometheus.yml');

      return { files_generated: filesGenerated };

    } catch (error) {
      throw new Error(`Monitoring configuration generation failed: ${error.message}`);
    }
  }

  static generateMetricsMiddleware() {
    return `import { Request, Response, NextFunction } from 'express';
import promClient from 'prom-client';

// Create a Registry
export const register = new promClient.Registry();

// Add default metrics
promClient.collectDefaultMetrics({ register });

// Custom metrics
export const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const activeConnections = new promClient.Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
  registers: [register],
});

// Middleware
export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  activeConnections.inc();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;

    httpRequestDuration.observe(
      { method: req.method, route, status_code: res.statusCode },
      duration
    );

    httpRequestTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode,
    });

    activeConnections.dec();
  });

  next();
}

// Metrics endpoint handler
export async function metricsHandler(req: Request, res: Response) {
  res.setHeader('Content-Type', register.contentType);
  res.send(await register.metrics());
}
`;
  }

  static generatePrometheusConfig() {
    return `global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'nodejs-app'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
`;
  }
}

module.exports = GenerateMonitoringConfig;
