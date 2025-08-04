import type { Request, Response, NextFunction } from 'express';
import { AuthService } from '@/services/AuthService.js';
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
declare class AuthMiddleware {
    private authService;
    constructor(authService?: AuthService);
    authenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    optionalAuth: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    requireScopes: (requiredScopes: string[]) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
    private extractUserId;
    private handleAuthError;
}
export declare const authMiddleware: AuthMiddleware;
export { AuthMiddleware };
//# sourceMappingURL=auth.middleware.d.ts.map