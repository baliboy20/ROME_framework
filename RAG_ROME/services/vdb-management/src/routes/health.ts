/**
 * Health Check Routes
 * 
 * Provides health and readiness endpoints for the VDB Management Service
 * Used for monitoring, load balancers, and container orchestration
 */

import { Router, Request, Response } from 'express';

interface ServiceRequest extends Request {
  services?: {
    weaviate: any;
    coordination: any;
    documents: any;
    logger: any;
  };
}

const router = Router();

/**
 * Basic health check endpoint
 * Returns service status and basic info
 */
router.get('/', async (_req: ServiceRequest, res: Response) => {
  try {
    res.status(200).json({
      success: true,
      service: 'ROME VDB Management Service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      service: 'ROME VDB Management Service',
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Readiness check endpoint
 * Verifies all dependent services are accessible
 */
router.get('/ready', async (req: ServiceRequest, res: Response) => {
  try {
    const checks = {
      weaviate: false,
      coordination: false,
      documents: false
    };

    // Check Weaviate connectivity
    if (req.services?.weaviate) {
      checks.weaviate = await req.services.weaviate.healthCheck();
    }

    // Check coordination service
    if (req.services?.coordination) {
      checks.coordination = true; // Service is loaded
    }

    // Check document service
    if (req.services?.documents) {
      checks.documents = true; // Service is loaded
    }

    const allReady = Object.values(checks).every(status => status === true);

    if (allReady) {
      res.status(200).json({
        success: true,
        status: 'ready',
        checks,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        success: false,
        status: 'not ready',
        checks,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Liveness check endpoint
 * Simple endpoint to verify the service is responding
 */
router.get('/live', (_req: ServiceRequest, res: Response) => {
  res.status(200).json({
    success: true,
    status: 'alive',
    timestamp: new Date().toISOString()
  });
});

export { router as healthRouter };