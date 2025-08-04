import { Router } from 'express';
import { authController } from '@/controllers/auth.controller.js';
import { authMiddleware } from '@/middleware/auth.middleware.js';
const router = Router();
/**
 * @route   GET /api/auth/google/init
 * @desc    Initialize Google OAuth2 flow
 * @access  Public
 */
router.get('/google/init', authController.initializeAuth);
/**
 * @route   GET /api/auth/google/callback
 * @desc    Handle Google OAuth2 callback
 * @access  Public
 */
router.get('/google/callback', authController.handleCallback);
/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Private
 */
router.post('/refresh', authMiddleware.authenticate, authController.refreshToken);
/**
 * @route   DELETE /api/auth/logout
 * @desc    Logout user and revoke tokens
 * @access  Private
 */
router.delete('/logout', authMiddleware.optionalAuth, authController.logout);
/**
 * @route   GET /api/auth/status
 * @desc    Check authentication status
 * @access  Public
 */
router.get('/status', authController.checkStatus);
export default router;
//# sourceMappingURL=auth.routes.js.map