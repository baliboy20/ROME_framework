/**
 * /generate-api-gateway-config skill (Tier 1)
 * Generates API gateway configuration
 * Version: 1.0.0
 */

const fs = require('fs');
const path = require('path');

class GenerateAPIGatewayConfig {
  static async execute(params, executionId) {
    const { design_directory, output_directory } = params;

    try {
      const filesGenerated = [];

      // Generate API gateway setup
      const gatewayCode = this.generateAPIGateway();
      fs.writeFileSync(path.join(output_directory, 'api-gateway.ts'), gatewayCode);
      filesGenerated.push('api-gateway.ts');

      return { files_generated: filesGenerated };

    } catch (error) {
      throw new Error(`API gateway configuration generation failed: ${error.message}`);
    }
  }

  static generateAPIGateway() {
    return `import express, { Express, Request, Response, NextFunction } from 'express';

export interface RouteConfig {
  path: string;
  method: 'get' | 'post' | 'put' | 'patch' | 'delete';
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  middlewares?: Array<(req: Request, res: Response, next: NextFunction) => void>;
  description?: string;
}

export class APIGateway {
  private app: Express;
  private routes: RouteConfig[] = [];

  constructor(app: Express) {
    this.app = app;
  }

  registerRoute(config: RouteConfig) {
    this.routes.push(config);

    const middlewares = config.middlewares || [];
    const handler = async (req: Request, res: Response, next: NextFunction) => {
      try {
        await config.handler(req, res, next);
      } catch (error) {
        next(error);
      }
    };

    this.app[config.method](
      \`/api/v1\${config.path}\`,
      ...middlewares,
      handler
    );
  }

  registerRoutes(configs: RouteConfig[]) {
    configs.forEach(config => this.registerRoute(config));
  }

  getRegisteredRoutes() {
    return this.routes.map(r => ({
      path: \`/api/v1\${r.path}\`,
      method: r.method.toUpperCase(),
      description: r.description || 'No description',
    }));
  }

  setupHealthCheck() {
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    });
  }

  setupAPIDocumentation() {
    this.app.get('/api/routes', (req, res) => {
      res.json({
        version: '1.0.0',
        routes: this.getRegisteredRoutes(),
      });
    });
  }
}

export default APIGateway;
`;
  }
}

module.exports = GenerateAPIGatewayConfig;
