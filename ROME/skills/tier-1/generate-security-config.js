/**
 * /generate-security-config skill (Tier 1)
 * Generates security configuration
 * Version: 1.0.0
 */

const fs = require('fs');
const path = require('path');

class GenerateSecurityConfig {
  static async execute(params, executionId) {
    const { design_directory, output_directory } = params;

    try {
      const filesGenerated = [];

      // Generate security middleware
      const securityCode = this.generateSecurityMiddleware();
      fs.writeFileSync(path.join(output_directory, 'security.ts'), securityCode);
      filesGenerated.push('security.ts');

      return { files_generated: filesGenerated };

    } catch (error) {
      throw new Error(`Security configuration generation failed: ${error.message}`);
    }
  }

  static generateSecurityMiddleware() {
    return `import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { Express } from 'express';

export function setupSecurity(app: Express) {
  // Helmet for security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }));

  // CORS configuration
  const corsOptions = {
    origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(','),
    credentials: true,
    optionsSuccessStatus: 200,
  };
  app.use(cors(corsOptions));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/', limiter);

  // Strict rate limiting for auth endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: 'Too many authentication attempts, please try again later.',
  });
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);
}

export default setupSecurity;
`;
  }
}

module.exports = GenerateSecurityConfig;
