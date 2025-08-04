import { AuthService } from '@/services/AuthService.js';
import { validateAuthConfig } from '@/config/auth.config.js';
export class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService || new AuthService();
    }
    /**
     * GET /api/auth/google/init
     * Initiates OAuth2 flow
     */
    initializeAuth = async (req, res) => {
        try {
            // Validate configuration before proceeding
            if (!validateAuthConfig()) {
                res.status(500).json({
                    error: 'Server configuration error',
                    code: 'CONFIG_ERROR',
                    message: 'OAuth configuration is incomplete. Please contact administrator.'
                });
                return;
            }
            const { url, state } = this.authService.generateAuthUrl();
            // Store state in session if available
            if (req.session) {
                req.session.authState = state;
            }
            res.json({
                success: true,
                authUrl: url,
                state
            });
        }
        catch (error) {
            this.handleError(error, res);
        }
    };
    /**
     * GET /api/auth/google/callback
     * Handles OAuth2 callback
     */
    handleCallback = async (req, res) => {
        try {
            const { code, state, error: oauthError } = req.query;
            // Handle OAuth errors
            if (oauthError) {
                res.status(400).json({
                    error: 'OAuth authentication failed',
                    code: 'OAUTH_ERROR',
                    message: oauthError
                });
                return;
            }
            if (!code || typeof code !== 'string') {
                res.status(400).json({
                    error: 'Invalid callback',
                    code: 'NO_CODE',
                    message: 'Authorization code is missing'
                });
                return;
            }
            if (!state || typeof state !== 'string') {
                res.status(400).json({
                    error: 'Invalid callback',
                    code: 'NO_STATE',
                    message: 'State parameter is missing'
                });
                return;
            }
            // Try to verify state from session first, but don't fail if session doesn't exist
            // This handles the case where OAuth flow happens in browser without session context
            if (req.session && req.session.authState) {
                if (req.session.authState !== state) {
                    res.status(400).json({
                        error: 'Invalid state',
                        code: 'STATE_MISMATCH',
                        message: 'State parameter does not match'
                    });
                    return;
                }
            }
            const authorizedUser = await this.authService.handleCallback(code, state);
            // Store user ID in session
            if (req.session) {
                req.session.userId = authorizedUser.userId;
                req.session.userEmail = authorizedUser.email;
            }
            // For OAuth callback, return an HTML page that can communicate with the Flutter app
            // This is necessary because the OAuth flow happens in the browser
            const successHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Authentication Successful</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .success { color: #4CAF50; }
            .info { margin: 20px 0; }
          </style>
        </head>
        <body>
          <h1 class="success">Authentication Successful!</h1>
          <p class="info">You have successfully authenticated with Google.</p>
          <p>You can close this window and return to the app.</p>
          <script>
            // Try to communicate with the app if possible
            if (window.opener) {
              window.opener.postMessage({
                type: 'auth-success',
                user: ${JSON.stringify({
                id: authorizedUser.userId,
                email: authorizedUser.email
            })}
              }, '*');
            }
            // Auto-close after 3 seconds
            setTimeout(() => window.close(), 3000);
          </script>
        </body>
        </html>
      `;
            res.set('Content-Type', 'text/html');
            res.send(successHtml);
        }
        catch (error) {
            // Handle specific OAuth errors with user-friendly HTML pages
            if (error.code === 'INVALID_STATE' || error.code === 'STATE_EXPIRED') {
                const errorHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Authentication Error</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .error { color: #f44336; }
              .info { margin: 20px 0; }
              button { padding: 10px 20px; font-size: 16px; cursor: pointer; }
            </style>
          </head>
          <body>
            <h1 class="error">Authentication Error</h1>
            <p class="info">${error.message}</p>
            <p>This usually happens when the authentication process takes too long or the page was refreshed.</p>
            <button onclick="window.close()">Close Window</button>
            <p style="margin-top: 20px;">Please try signing in again from the app.</p>
          </body>
          </html>
        `;
                res.set('Content-Type', 'text/html');
                res.status(400).send(errorHtml);
            }
            else {
                this.handleError(error, res);
            }
        }
    };
    /**
     * POST /api/auth/refresh
     * Refreshes access token
     */
    refreshToken = async (req, res) => {
        try {
            const userId = req.userId || req.session?.userId;
            if (!userId) {
                res.status(401).json({
                    error: 'Not authenticated',
                    code: 'NO_USER_ID',
                    message: 'User ID is required to refresh token'
                });
                return;
            }
            const tokens = await this.authService.refreshAccessToken(userId);
            res.json({
                success: true,
                message: 'Token refreshed successfully',
                expiryDate: tokens.expiryDate
            });
        }
        catch (error) {
            this.handleError(error, res);
        }
    };
    /**
     * DELETE /api/auth/logout
     * Revokes tokens and logs out user
     */
    logout = async (req, res) => {
        try {
            const userId = req.userId || req.session?.userId;
            if (userId) {
                await this.authService.revokeAccess(userId);
            }
            // Clear session
            if (req.session) {
                req.session.destroy((err) => {
                    if (err) {
                        console.error('Session destruction error:', err);
                    }
                });
            }
            res.json({
                success: true,
                message: 'Logged out successfully'
            });
        }
        catch (error) {
            // Always return success for logout
            res.json({
                success: true,
                message: 'Logged out successfully'
            });
        }
    };
    /**
     * GET /api/auth/status
     * Checks authentication status
     */
    checkStatus = async (req, res) => {
        try {
            const userId = req.userId || req.session?.userId;
            if (!userId) {
                res.json({
                    authenticated: false
                });
                return;
            }
            const isValid = await this.authService.validateToken(userId);
            if (isValid) {
                const userInfo = await this.authService.getUserInfo(userId);
                res.json({
                    authenticated: true,
                    user: {
                        id: userId,
                        email: userInfo.email,
                        name: userInfo.name,
                        picture: userInfo.picture
                    }
                });
            }
            else {
                res.json({
                    authenticated: false
                });
            }
        }
        catch (error) {
            res.json({
                authenticated: false
            });
        }
    };
    handleError(error, res) {
        const authError = error;
        const status = authError.status || 500;
        const code = authError.code || 'AUTH_ERROR';
        const message = authError.message || 'Authentication error occurred';
        console.error('Auth controller error:', {
            code,
            message,
            stack: error.stack
        });
        res.status(status).json({
            error: 'Authentication failed',
            code,
            message
        });
    }
}
// Export singleton instance
export const authController = new AuthController();
// Export class for testing
export { AuthController as AuthControllerClass };
//# sourceMappingURL=auth.controller.js.map