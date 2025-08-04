import type { AuthError } from '@/types/auth.types.js';
export declare enum AuthErrorCode {
    CONFIG_ERROR = "CONFIG_ERROR",
    MISSING_CONFIG = "MISSING_CONFIG",
    INVALID_STATE = "INVALID_STATE",
    STATE_EXPIRED = "STATE_EXPIRED",
    STATE_MISMATCH = "STATE_MISMATCH",
    NO_CODE = "NO_CODE",
    NO_STATE = "NO_STATE",
    OAUTH_ERROR = "OAUTH_ERROR",
    TOKEN_EXCHANGE_FAILED = "TOKEN_EXCHANGE_FAILED",
    NO_REFRESH_TOKEN = "NO_REFRESH_TOKEN",
    REFRESH_FAILED = "REFRESH_FAILED",
    INVALID_TOKEN = "INVALID_TOKEN",
    TOKEN_EXPIRED = "TOKEN_EXPIRED",
    NOT_AUTHENTICATED = "NOT_AUTHENTICATED",
    NO_AUTH = "NO_AUTH",
    NO_USER_ID = "NO_USER_ID",
    INSUFFICIENT_SCOPE = "INSUFFICIENT_SCOPE",
    PERMISSION_DENIED = "PERMISSION_DENIED",
    STORAGE_ERROR = "STORAGE_ERROR",
    ENCRYPTION_ERROR = "ENCRYPTION_ERROR",
    NETWORK_ERROR = "NETWORK_ERROR",
    API_ERROR = "API_ERROR",
    AUTH_ERROR = "AUTH_ERROR",
    UNKNOWN_ERROR = "UNKNOWN_ERROR"
}
export declare class AuthenticationError extends Error implements AuthError {
    code: string;
    status: number;
    constructor(message: string, code: AuthErrorCode | string, status?: number);
}
export declare class ConfigurationError extends AuthenticationError {
    constructor(message: string, code?: AuthErrorCode);
}
export declare class TokenError extends AuthenticationError {
    constructor(message: string, code: AuthErrorCode);
}
export declare class PermissionError extends AuthenticationError {
    constructor(message: string, code?: AuthErrorCode);
}
export declare class StorageError extends AuthenticationError {
    constructor(message: string, code?: AuthErrorCode);
}
/**
 * Creates a standardized auth error response
 */
export declare function createAuthErrorResponse(error: AuthError | Error): {
    error: string;
    code: string;
    message: string;
    status: number;
};
/**
 * Type guard to check if error is an AuthError
 */
export declare function isAuthError(error: any): error is AuthError;
/**
 * Maps Google OAuth errors to our error codes
 */
export declare function mapOAuthError(error: any): AuthError;
//# sourceMappingURL=auth-errors.d.ts.map