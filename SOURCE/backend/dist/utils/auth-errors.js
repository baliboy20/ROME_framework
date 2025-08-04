export var AuthErrorCode;
(function (AuthErrorCode) {
    // Configuration errors
    AuthErrorCode["CONFIG_ERROR"] = "CONFIG_ERROR";
    AuthErrorCode["MISSING_CONFIG"] = "MISSING_CONFIG";
    // OAuth flow errors
    AuthErrorCode["INVALID_STATE"] = "INVALID_STATE";
    AuthErrorCode["STATE_EXPIRED"] = "STATE_EXPIRED";
    AuthErrorCode["STATE_MISMATCH"] = "STATE_MISMATCH";
    AuthErrorCode["NO_CODE"] = "NO_CODE";
    AuthErrorCode["NO_STATE"] = "NO_STATE";
    AuthErrorCode["OAUTH_ERROR"] = "OAUTH_ERROR";
    // Token errors
    AuthErrorCode["TOKEN_EXCHANGE_FAILED"] = "TOKEN_EXCHANGE_FAILED";
    AuthErrorCode["NO_REFRESH_TOKEN"] = "NO_REFRESH_TOKEN";
    AuthErrorCode["REFRESH_FAILED"] = "REFRESH_FAILED";
    AuthErrorCode["INVALID_TOKEN"] = "INVALID_TOKEN";
    AuthErrorCode["TOKEN_EXPIRED"] = "TOKEN_EXPIRED";
    // Authentication errors
    AuthErrorCode["NOT_AUTHENTICATED"] = "NOT_AUTHENTICATED";
    AuthErrorCode["NO_AUTH"] = "NO_AUTH";
    AuthErrorCode["NO_USER_ID"] = "NO_USER_ID";
    // Permission errors
    AuthErrorCode["INSUFFICIENT_SCOPE"] = "INSUFFICIENT_SCOPE";
    AuthErrorCode["PERMISSION_DENIED"] = "PERMISSION_DENIED";
    // Storage errors
    AuthErrorCode["STORAGE_ERROR"] = "STORAGE_ERROR";
    AuthErrorCode["ENCRYPTION_ERROR"] = "ENCRYPTION_ERROR";
    // Network errors
    AuthErrorCode["NETWORK_ERROR"] = "NETWORK_ERROR";
    AuthErrorCode["API_ERROR"] = "API_ERROR";
    // Generic errors
    AuthErrorCode["AUTH_ERROR"] = "AUTH_ERROR";
    AuthErrorCode["UNKNOWN_ERROR"] = "UNKNOWN_ERROR";
})(AuthErrorCode || (AuthErrorCode = {}));
export class AuthenticationError extends Error {
    code;
    status;
    constructor(message, code, status = 401) {
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
    constructor(message, code = AuthErrorCode.CONFIG_ERROR) {
        super(message, code, 500);
        this.name = 'ConfigurationError';
    }
}
export class TokenError extends AuthenticationError {
    constructor(message, code) {
        super(message, code, 401);
        this.name = 'TokenError';
    }
}
export class PermissionError extends AuthenticationError {
    constructor(message, code = AuthErrorCode.PERMISSION_DENIED) {
        super(message, code, 403);
        this.name = 'PermissionError';
    }
}
export class StorageError extends AuthenticationError {
    constructor(message, code = AuthErrorCode.STORAGE_ERROR) {
        super(message, code, 500);
        this.name = 'StorageError';
    }
}
/**
 * Creates a standardized auth error response
 */
export function createAuthErrorResponse(error) {
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
export function isAuthError(error) {
    return error &&
        typeof error.code === 'string' &&
        typeof error.status === 'number' &&
        error instanceof Error;
}
/**
 * Maps Google OAuth errors to our error codes
 */
export function mapOAuthError(error) {
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
//# sourceMappingURL=auth-errors.js.map