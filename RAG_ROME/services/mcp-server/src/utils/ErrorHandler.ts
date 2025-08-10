/**
 * Error Handler Utility
 * 
 * Centralized error handling for the MCP Documentation Server
 * Provides error categorization, sanitization, and formatting
 * 
 * Author: Reena (Backend Developer)
 * Date: 2025-08-06
 */

import { Logger } from './Logger.js';

export interface ErrorCategory {
  type: 'client_error' | 'server_error' | 'network_error' | 'validation_error' | 'unknown_error';
  code: string;
  severity: 'error' | 'warning' | 'info';
  retryable: boolean;
  httpStatus: number;
}

export interface RetryInfo {
  retryable: boolean;
  maxRetries?: number;
  backoffMs?: number;
  backoffMultiplier?: number;
  reason?: string;
}

export interface ToolErrorContext {
  requestId?: string;
  toolName?: string;
  arguments?: any;
  duration?: number;
  timestamp?: string;
  userId?: string;
  startTime?: number;
  memoryUsage?: NodeJS.MemoryUsage;
  activeRequests?: number;
  vectorDimensions?: number;
  searchResults?: number;
  queryComplexity?: string;
}

export interface SanitizedError {
  message: string;
  code?: string;
  context?: any;
  stack?: string;
}

export class ErrorHandler {
  private logger: Logger;
  private isDevelopment: boolean;

  constructor(logger: Logger) {
    this.logger = logger;
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  /**
   * Handles tool execution errors and returns formatted response
   */
  public handleToolError(error: any, context: ToolErrorContext): any {
    try {
      // Categorize the error
      const category = this.categorizeError(error);
      
      // Sanitize the error
      const sanitized = this.sanitizeError(error);
      
      // Log the error
      this.logger.error(`Tool error: ${category.type}`, {
        error: sanitized,
        context,
        category
      });

      // Return standardized error response
      return {
        content: [{
          type: 'text',
          text: this.formatErrorMessage(sanitized, category, context)
        }],
        isError: true,
        error: {
          code: category.code,
          message: sanitized.message,
          data: {
            ...context,
            category: category.type,
            severity: category.severity,
            retryable: category.retryable,
            timestamp: new Date().toISOString()
          }
        }
      };

    } catch (handlingError) {
      // Fallback error handling
      const handlingErrorMessage = handlingError instanceof Error ? handlingError.message : String(handlingError);
      this.logger.error('Error in error handler', { error: handlingErrorMessage });
      
      return {
        content: [{
          type: 'text',
          text: 'An unexpected error occurred while processing your request'
        }],
        isError: true,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
          data: {
            timestamp: new Date().toISOString()
          }
        }
      };
    }
  }

  /**
   * Categorizes an error into predefined categories
   */
  public categorizeError(error: any): ErrorCategory {
    const code = error.code || error.name || 'UNKNOWN_ERROR';
    const message = error.message || 'Unknown error';

    // Client errors (4xx equivalent)
    if (this.isValidationError(code, message)) {
      return {
        type: 'validation_error',
        code: 'VALIDATION_ERROR',
        severity: 'error',
        retryable: false,
        httpStatus: 422
      };
    }

    if (this.isAuthError(code, message)) {
      return {
        type: 'client_error',
        code: 'AUTHENTICATION_ERROR',
        severity: 'error',
        retryable: false,
        httpStatus: 401
      };
    }

    if (this.isClientError(code, message)) {
      return {
        type: 'client_error',
        code: code,
        severity: 'error',
        retryable: false,
        httpStatus: 400
      };
    }

    // Network errors (5xx equivalent but retryable)
    if (this.isNetworkError(code, message)) {
      return {
        type: 'network_error',
        code: 'NETWORK_TIMEOUT',
        severity: 'warning',
        retryable: true,
        httpStatus: 503
      };
    }

    // Server errors (5xx equivalent)
    if (this.isDatabaseError(code, message)) {
      return {
        type: 'server_error',
        code: 'DATABASE_ERROR',
        severity: 'error',
        retryable: true,
        httpStatus: 500
      };
    }

    if (this.isServerError(code, message)) {
      return {
        type: 'server_error',
        code: code,
        severity: 'error',
        retryable: false,
        httpStatus: 500
      };
    }

    // Default to unknown error
    return {
      type: 'unknown_error',
      code: 'INTERNAL_ERROR',
      severity: 'error',
      retryable: false,
      httpStatus: 500
    };
  }

  /**
   * Sanitizes error messages by removing sensitive information
   */
  public sanitizeError(error: any): SanitizedError {
    const message = error.message || 'Unknown error occurred';
    const code = error.code || error.name;

    // Remove sensitive information from message
    let sanitizedMessage = this.removeSensitiveInfo(message);

    // In production, remove file paths and stack traces
    if (!this.isDevelopment) {
      sanitizedMessage = this.removeFilePaths(sanitizedMessage);
    }

    const sanitized: SanitizedError = {
      message: sanitizedMessage,
      code: code
    };

    // Preserve essential context
    if (error.context) {
      sanitized.context = this.sanitizeContext(error.context);
    }

    // Include stack trace only in development
    if (this.isDevelopment && error.stack) {
      sanitized.stack = error.stack;
    }

    return sanitized;
  }

  /**
   * Determines if an error should be retried
   */
  public shouldRetry(error: any): RetryInfo {
    const category = this.categorizeError(error);
    
    if (!category.retryable) {
      return {
        retryable: false,
        reason: `${category.type} errors cannot be retried`
      };
    }

    // Network errors
    if (category.type === 'network_error') {
      return {
        retryable: true,
        maxRetries: 3,
        backoffMs: 1000,
        backoffMultiplier: 2
      };
    }

    // Database errors
    if (category.type === 'server_error' && category.code === 'DATABASE_ERROR') {
      return {
        retryable: true,
        maxRetries: 5,
        backoffMs: 2000,
        backoffMultiplier: 1.5
      };
    }

    // Circuit breaker
    if (error.code === 'CIRCUIT_BREAKER_OPEN') {
      return {
        retryable: false,
        reason: 'Circuit breaker is open - service degraded'
      };
    }

    return {
      retryable: false,
      reason: 'Error type not configured for retry'
    };
  }

  private isValidationError(code: string, message: string): boolean {
    const validationCodes = ['VALIDATION_ERROR', 'MISSING_FIELD', 'INVALID_TYPE', 'OUT_OF_RANGE'];
    const validationMessages = ['validation failed', 'invalid', 'required', 'missing'];
    
    return validationCodes.includes(code) || 
           validationMessages.some(pattern => message.toLowerCase().includes(pattern));
  }

  private isAuthError(code: string, message: string): boolean {
    const authCodes = ['AUTHENTICATION_ERROR', 'UNAUTHORIZED', 'INVALID_TOKEN'];
    const authMessages = ['authentication', 'unauthorized', 'invalid token', 'api key'];
    
    return authCodes.includes(code) || 
           authMessages.some(pattern => message.toLowerCase().includes(pattern));
  }

  private isClientError(code: string, message: string): boolean {
    const clientCodes = ['BAD_REQUEST', 'INVALID_INPUT', 'MALFORMED_REQUEST'];
    return clientCodes.includes(code);
  }

  private isNetworkError(code: string, message: string): boolean {
    const networkCodes = ['NETWORK_TIMEOUT', 'CONNECTION_ERROR', 'ENOTFOUND', 'ECONNREFUSED'];
    const networkMessages = ['timeout', 'connection', 'network', 'unreachable'];
    
    return networkCodes.includes(code) || 
           networkMessages.some(pattern => message.toLowerCase().includes(pattern));
  }

  private isDatabaseError(code: string, message: string): boolean {
    const dbCodes = ['DATABASE_ERROR', 'DATABASE_UNAVAILABLE', 'CONNECTION_POOL_ERROR'];
    const dbMessages = ['database', 'weaviate', 'connection pool', 'query failed'];
    
    return dbCodes.includes(code) || 
           dbMessages.some(pattern => message.toLowerCase().includes(pattern));
  }

  private isServerError(code: string, message: string): boolean {
    const serverCodes = ['INTERNAL_ERROR', 'SERVICE_UNAVAILABLE', 'MEMORY_ERROR'];
    return serverCodes.includes(code);
  }

  private removeSensitiveInfo(message: string): string {
    // Remove common sensitive patterns
    const sensitivePatterns = [
      /password=[\w\d]+/gi,
      /token=[\w\d]+/gi,
      /key=[\w\d]+/gi,
      /secret=[\w\d]+/gi,
      /user=[\w\d]+/gi,
      /username=[\w\d]+/gi,
      /auth=[\w\d]+/gi,
      /api_key=[\w\d]+/gi
    ];

    let sanitized = message;
    sensitivePatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, (match) => {
        const [key] = match.split('=');
        return `${key}=***`;
      });
    });

    return sanitized;
  }

  private removeFilePaths(message: string): string {
    // Remove absolute file paths in production
    const pathPatterns = [
      /\/[a-zA-Z0-9._\-\/]+\.js/g,
      /\/[a-zA-Z0-9._\-\/]+\.ts/g,
      /\/[a-zA-Z0-9._\-\/]+\.json/g,
      /\/usr\/[a-zA-Z0-9._\-\/]+/g,
      /\/home\/[a-zA-Z0-9._\-\/]+/g,
      /\/var\/[a-zA-Z0-9._\-\/]+/g
    ];

    let sanitized = message;
    pathPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[file path]');
    });

    return sanitized;
  }

  private sanitizeContext(context: any): any {
    if (!context || typeof context !== 'object') {
      return context;
    }

    const sanitized = { ...context };
    
    // Remove sensitive fields from context
    const sensitiveFields = ['password', 'token', 'key', 'secret', 'auth', 'credentials'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '***';
      }
    });

    return sanitized;
  }

  private formatErrorMessage(error: SanitizedError, category: ErrorCategory, context: ToolErrorContext): string {
    let message = '';

    // Add user-friendly error message based on category
    switch (category.type) {
      case 'validation_error':
        message = `Invalid request: ${error.message}. Please check your parameters and try again.`;
        break;
      
      case 'client_error':
        message = `Request error: ${error.message}. Please verify your input and retry.`;
        break;
        
      case 'network_error':
        message = `Network connectivity issue: ${error.message}. Please try again in a moment.`;
        break;
        
      case 'server_error':
        message = `Server error: ${error.message}. Our team has been notified.`;
        break;
        
      default:
        message = `An error occurred: ${error.message}. Please contact support if this persists.`;
    }

    // Add context information if helpful
    if (context.toolName) {
      message = `Tool "${context.toolName}" failed: ${message}`;
    }

    // Add retry information
    const retryInfo = this.shouldRetry({ code: error.code, message: error.message });
    if (retryInfo.retryable) {
      message += ` This operation can be retried.`;
    }

    // Add request ID for tracking
    if (context.requestId) {
      message += ` (Request ID: ${context.requestId})`;
    }

    return message;
  }
}