import type { AuthError } from '@/types/auth.types.js';

export enum AuthErrorCode {
  // Configuration errors
  CONFIG_ERROR = 'CONFIG_ERROR',
  MISSING_CONFIG = 'MISSING_CONFIG',
  
  // OAuth flow errors
  INVALID_STATE = 'INVALID_STATE',
  STATE_EXPIRED = 'STATE_EXPIRED',
  STATE_MISMATCH = 'STATE_MISMATCH',
  NO_CODE = 'NO_CODE',
  NO_STATE = 'NO_STATE',
  OAUTH_ERROR = 'OAUTH_ERROR',
  
  // Token errors
  TOKEN_EXCHANGE_FAILED = 'TOKEN_EXCHANGE_FAILED',
  NO_REFRESH_TOKEN = 'NO_REFRESH_TOKEN',
  REFRESH_FAILED = 'REFRESH_FAILED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // Authentication errors
  NOT_AUTHENTICATED = 'NOT_AUTHENTICATED',
  NO_AUTH = 'NO_AUTH',
  NO_USER_ID = 'NO_USER_ID',
  
  // Permission errors
  INSUFFICIENT_SCOPE = 'INSUFFICIENT_SCOPE',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  
  // Storage errors
  STORAGE_ERROR = 'STORAGE_ERROR',
  ENCRYPTION_ERROR = 'ENCRYPTION_ERROR',
  
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  
  // Generic errors
  AUTH_ERROR = 'AUTH_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export class AuthenticationError extends Error implements AuthError {
  code: string;
  status: number;

  constructor(message: string, code: AuthErrorCode | string, status: number = 401) {
    super(message);
    this.name = 'AuthenticationError';
    this.code = code;
    this.status = status;
    
    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AuthenticationError);
    }
  }
}

export class ConfigurationError extends AuthenticationError {
  constructor(message: string, code: AuthErrorCode = AuthErrorCode.CONFIG_ERROR) {
    super(message, code, 500);
    this.name = 'ConfigurationError';
  }
}

export class TokenError extends AuthenticationError {
  constructor(message: string, code: AuthErrorCode) {
    super(message, code, 401);
    this.name = 'TokenError';
  }
}

export class PermissionError extends AuthenticationError {
  constructor(message: string, code: AuthErrorCode = AuthErrorCode.PERMISSION_DENIED) {
    super(message, code, 403);
    this.name = 'PermissionError';
  }
}

export class StorageError extends AuthenticationError {
  constructor(message: string, code: AuthErrorCode = AuthErrorCode.STORAGE_ERROR) {
    super(message, code, 500);
    this.name = 'StorageError';
  }
}

/**
 * Creates a standardized auth error response
 */
export function createAuthErrorResponse(error: AuthError | Error) {
  if ('code' in error && 'status' in error) {
    return {
      error: error.name || 'Authentication Error',
      code: error.code,
      message: error.message,
      status: error.status
    };
  }
  
  // Generic error
  return {
    error: 'Authentication Error',
    code: AuthErrorCode.UNKNOWN_ERROR,
    message: error.message || 'An unknown error occurred',
    status: 500
  };
}

/**
 * Type guard to check if error is an AuthError
 */
export function isAuthError(error: any): error is AuthError {
  return error && 
         typeof error.code === 'string' && 
         typeof error.status === 'number' &&
         error instanceof Error;
}

/**
 * Maps Google OAuth errors to our error codes
 */
export function mapOAuthError(error: any): AuthError {
  const message = error.message || 'OAuth error occurred';
  
  if (message.includes('invalid_grant')) {
    return new TokenError('The provided authorization code is invalid or expired', AuthErrorCode.TOKEN_EXCHANGE_FAILED);
  }
  
  if (message.includes('invalid_client')) {
    return new ConfigurationError('Invalid OAuth client configuration', AuthErrorCode.CONFIG_ERROR);
  }
  
  if (message.includes('access_denied')) {
    return new PermissionError('User denied access to the application', AuthErrorCode.PERMISSION_DENIED);
  }
  
  if (message.includes('invalid_scope')) {
    return new PermissionError('Requested OAuth scopes are invalid', AuthErrorCode.INSUFFICIENT_SCOPE);
  }
  
  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    return new AuthenticationError('Network error connecting to OAuth provider', AuthErrorCode.NETWORK_ERROR, 503);
  }
  
  return new AuthenticationError(message, AuthErrorCode.OAUTH_ERROR);
}