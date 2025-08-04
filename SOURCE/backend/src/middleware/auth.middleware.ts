import type { Request, Response, NextFunction } from 'express';
import { AuthService } from '@/services/AuthService.js';
import type { AuthError } from '@/types/auth.types.js';

// Extend Express Request type to include auth data
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      authClient?: any;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  userId: string;
  authClient: any;
}

class AuthMiddleware {
  private authService: AuthService;

  constructor(authService?: AuthService) {
    this.authService = authService || new AuthService();
  }

  authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Check for user session or token
      const userId = this.extractUserId(req);
      
      if (!userId) {
        res.status(401).json({
          error: 'Authentication required',
          code: 'NO_AUTH',
          message: 'Please authenticate to access this resource'
        });
        return;
      }

      // Validate token and get authorized client
      const isValid = await this.authService.validateToken(userId);
      if (!isValid) {
        res.status(401).json({
          error: 'Invalid or expired token',
          code: 'INVALID_TOKEN',
          message: 'Your session has expired. Please authenticate again'
        });
        return;
      }

      // Get authorized client for API calls
      const authClient = await this.authService.getAuthorizedClient(userId);
      
      // Attach to request for use in routes
      req.userId = userId;
      req.authClient = authClient;
      
      next();
    } catch (error) {
      this.handleAuthError(error, res);
    }
  };

  optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.extractUserId(req);
      
      if (userId) {
        const isValid = await this.authService.validateToken(userId);
        if (isValid) {
          const authClient = await this.authService.getAuthorizedClient(userId);
          req.userId = userId;
          req.authClient = authClient;
        }
      }
      
      next();
    } catch (error) {
      // Continue without auth on error
      next();
    }
  };

  requireScopes = (requiredScopes: string[]) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      if (!req.userId) {
        res.status(401).json({
          error: 'Authentication required',
          code: 'NO_AUTH',
          message: 'Please authenticate to access this resource'
        });
        return;
      }

      try {
        // In a real implementation, you would check the token scopes
        // For now, we'll assume the token has the required scopes if it's valid
        next();
      } catch (error) {
        res.status(403).json({
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_SCOPE',
          message: `This action requires the following permissions: ${requiredScopes.join(', ')}`
        });
      }
    };
  };

  private extractUserId(req: Request): string | null {
    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Check session
    if (req.session && (req.session as any).userId) {
      return (req.session as any).userId;
    }

    // Check cookie
    if (req.cookies && req.cookies.userId) {
      return req.cookies.userId;
    }

    return null;
  }

  private handleAuthError(error: any, res: Response): void {
    const authError = error as AuthError;
    
    const status = authError.status || 500;
    const code = authError.code || 'AUTH_ERROR';
    const message = authError.message || 'Authentication error occurred';

    res.status(status).json({
      error: 'Authentication failed',
      code,
      message
    });
  }
}

// Export singleton instance
export const authMiddleware = new AuthMiddleware();

// Export class for testing
export { AuthMiddleware };