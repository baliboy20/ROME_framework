import type { Request, Response } from 'express';
import { AuthService } from '@/services/AuthService.js';
export declare class AuthController {
    private authService;
    constructor(authService?: AuthService);
    /**
     * GET /api/auth/google/init
     * Initiates OAuth2 flow
     */
    initializeAuth: (req: Request, res: Response) => Promise<void>;
    /**
     * GET /api/auth/google/callback
     * Handles OAuth2 callback
     */
    handleCallback: (req: Request, res: Response) => Promise<void>;
    /**
     * POST /api/auth/refresh
     * Refreshes access token
     */
    refreshToken: (req: Request, res: Response) => Promise<void>;
    /**
     * DELETE /api/auth/logout
     * Revokes tokens and logs out user
     */
    logout: (req: Request, res: Response) => Promise<void>;
    /**
     * GET /api/auth/status
     * Checks authentication status
     */
    checkStatus: (req: Request, res: Response) => Promise<void>;
    private handleError;
}
export declare const authController: AuthController;
export { AuthController as AuthControllerClass };
//# sourceMappingURL=auth.controller.d.ts.map