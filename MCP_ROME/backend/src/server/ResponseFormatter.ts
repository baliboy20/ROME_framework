/**
 * Response Formatter
 * 
 * Formats and validates MCP responses, handles success/error formatting
 * Ensures responses meet MCP protocol requirements and size limits
 * 
 * Author: Reena (Backend Developer)
 * Date: 2025-08-06
 */

import { Logger } from '../utils/Logger.js';
import { Validator, ValidationResult } from '../utils/Validator.js';

export interface SuccessResponseData {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    uri?: string;
    mimeType?: string;
  }>;
  meta?: Record<string, any>;
}

export interface ErrorResponseData {
  code: string;
  message: string;
  data?: any;
}

export interface FormattedResponse {
  content: SuccessResponseData['content'];
  meta?: Record<string, any>;
  isError?: boolean;
  error?: ErrorResponseData;
}

export class ResponseFormatter {
  private validator: Validator;
  private logger: Logger;
  private readonly maxResponseSize = 5 * 1024 * 1024; // 5MB limit

  constructor(logger?: Logger) {
    this.logger = logger || new Logger('ResponseFormatter');
    this.validator = new Validator(this.logger);
  }

  /**
   * Formats a successful response with data and metadata
   */
  public formatSuccessResponse(data: SuccessResponseData, meta?: Record<string, any>): FormattedResponse {
    try {
      // Validate content array
      if (!data.content || !Array.isArray(data.content)) {
        throw new Error('Content array is required for success response');
      }

      // Validate each content item
      data.content.forEach((item, index) => {
        this.validateContentItem(item, index);
      });

      // Merge metadata
      const mergedMeta = {
        ...(data.meta || {}),
        ...(meta || {}),
        timestamp: new Date().toISOString()
      };

      // Check response size and optimize if needed
      const response: FormattedResponse = {
        content: data.content,
        meta: mergedMeta,
        isError: false
      };

      return this.optimizeResponseSize(response);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to format success response', { error: errorMessage });
      throw error;
    }
  }

  /**
   * Formats an error response with context
   */
  public formatErrorResponse(error: any, context?: Record<string, any>): FormattedResponse {
    try {
      const errorData = this.categorizeAndSanitizeError(error);
      
      const response: FormattedResponse = {
        content: [{
          type: 'text',
          text: this.formatErrorMessage(errorData, context)
        }],
        isError: true,
        error: {
          code: errorData.code,
          message: errorData.message,
          data: {
            ...(context || {}),
            category: errorData.category,
            timestamp: new Date().toISOString()
          }
        }
      };

      return response;

    } catch (formattingError) {
      const formattingErrorMessage = formattingError instanceof Error ? formattingError.message : String(formattingError);
      this.logger.error('Failed to format error response', { error: formattingErrorMessage });
      
      // Fallback error response
      return {
        content: [{
          type: 'text',
          text: 'An unexpected error occurred'
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
   * Validates a response structure against MCP requirements
   */
  public validateResponse(response: FormattedResponse): ValidationResult {
    const errors = [];

    // Check required content array
    if (!response.content || !Array.isArray(response.content)) {
      errors.push({
        field: 'content',
        message: 'Content array is required',
        code: 'MISSING_CONTENT'
      });
    } else {
      // Validate each content item
      response.content.forEach((item, index) => {
        const itemErrors = this.validateContentItemStructure(item, `content[${index}]`);
        errors.push(...itemErrors);
      });
    }

    // Check response size
    const responseSize = JSON.stringify(response).length;
    if (responseSize > this.maxResponseSize) {
      errors.push({
        field: 'response_size',
        message: 'Response exceeds maximum size limit',
        code: 'SIZE_LIMIT_EXCEEDED'
      });
    }

    // Validate error structure if present
    if (response.isError && response.error) {
      const errorErrors = this.validateErrorStructure(response.error);
      errors.push(...errorErrors);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private validateContentItem(item: any, index: number): void {
    if (!item || typeof item !== 'object') {
      throw new Error(`Content item ${index} must be an object`);
    }

    const validTypes = ['text', 'image', 'resource'];
    if (!item.type || !validTypes.includes(item.type)) {
      throw new Error(`Invalid content type: ${item.type}. Must be one of: ${validTypes.join(', ')}`);
    }

    switch (item.type) {
      case 'text':
        if (typeof item.text !== 'string') {
          throw new Error(`Content item ${index} of type 'text' must have a text field`);
        }
        break;
      case 'image':
        if (!item.data && !item.uri) {
          throw new Error(`Content item ${index} of type 'image' must have either data or uri field`);
        }
        break;
      case 'resource':
        if (!item.uri) {
          throw new Error(`Content item ${index} of type 'resource' must have a uri field`);
        }
        break;
    }
  }

  private validateContentItemStructure(item: any, fieldPath: string): Array<{field: string, message: string, code: string}> {
    const errors = [];

    if (!item || typeof item !== 'object') {
      errors.push({
        field: fieldPath,
        message: 'Content item must be an object',
        code: 'INVALID_CONTENT_ITEM'
      });
      return errors;
    }

    const validTypes = ['text', 'image', 'resource'];
    if (!item.type || !validTypes.includes(item.type)) {
      errors.push({
        field: `${fieldPath}.type`,
        message: 'Content item must have a valid type field',
        code: 'INVALID_CONTENT_TYPE'
      });
    }

    if (item.type === 'text' && (!item.text || typeof item.text !== 'string')) {
      errors.push({
        field: `${fieldPath}.text`,
        message: 'Text content must have a text field',
        code: 'MISSING_TEXT_FIELD'
      });
    }

    return errors;
  }

  private validateErrorStructure(error: ErrorResponseData): Array<{field: string, message: string, code: string}> {
    const errors = [];

    if (typeof error.code !== 'string') {
      errors.push({
        field: 'error.code',
        message: 'Error must have a code field',
        code: 'MISSING_ERROR_CODE'
      });
    }

    if (typeof error.message !== 'string') {
      errors.push({
        field: 'error.message',
        message: 'Error must have a message field',
        code: 'MISSING_ERROR_MESSAGE'
      });
    }

    return errors;
  }

  private categorizeAndSanitizeError(error: any): {
    code: string;
    message: string;
    category: string;
  } {
    let code = error.code || error.name || 'UNKNOWN_ERROR';
    let message = error.message || 'An unknown error occurred';
    let category = 'server_error';

    // Categorize error
    if (this.isValidationError(code, message)) {
      category = 'client_error';
      code = 'VALIDATION_ERROR';
    } else if (this.isNetworkError(code, message)) {
      category = 'network_error';
      code = 'NETWORK_ERROR';
    } else if (this.isDatabaseError(code, message)) {
      category = 'server_error';
      code = 'DATABASE_ERROR';
    }

    // Sanitize message in production
    if (process.env.NODE_ENV === 'production') {
      message = this.sanitizeErrorMessage(message);
    }

    return { code, message, category };
  }

  private isValidationError(code: string, message: string): boolean {
    const validationPatterns = ['validation', 'invalid', 'required', 'missing'];
    return validationPatterns.some(pattern => 
      code.toLowerCase().includes(pattern) || 
      message.toLowerCase().includes(pattern)
    );
  }

  private isNetworkError(code: string, message: string): boolean {
    const networkPatterns = ['network', 'timeout', 'connection', 'unreachable'];
    return networkPatterns.some(pattern => 
      code.toLowerCase().includes(pattern) || 
      message.toLowerCase().includes(pattern)
    );
  }

  private isDatabaseError(code: string, message: string): boolean {
    const dbPatterns = ['database', 'weaviate', 'query', 'connection pool'];
    return dbPatterns.some(pattern => 
      code.toLowerCase().includes(pattern) || 
      message.toLowerCase().includes(pattern)
    );
  }

  private sanitizeErrorMessage(message: string): string {
    // Remove sensitive information in production
    let sanitized = message;
    
    // Remove file paths
    sanitized = sanitized.replace(/\/[\w\-_/.]+\.(js|ts|json)/gi, '[file]');
    
    // Remove sensitive data patterns
    const sensitivePatterns = [
      /password=[\w\d]+/gi,
      /token=[\w\d]+/gi,
      /key=[\w\d]+/gi,
      /secret=[\w\d]+/gi
    ];

    sensitivePatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[redacted]');
    });

    return sanitized;
  }

  private formatErrorMessage(errorData: any, context?: Record<string, any>): string {
    let message = errorData.message;

    // Add context if helpful for user
    if (context?.toolName) {
      message = `Tool "${context.toolName}" failed: ${message}`;
    }

    // Add request ID for tracking
    if (context?.requestId) {
      message += ` (Request ID: ${context.requestId})`;
    }

    return message;
  }

  private optimizeResponseSize(response: FormattedResponse): FormattedResponse {
    const responseSize = JSON.stringify(response).length;
    
    if (responseSize <= this.maxResponseSize) {
      return response;
    }

    this.logger.warn('Response size exceeds limit, optimizing', { 
      originalSize: responseSize, 
      limit: this.maxResponseSize 
    });

    const optimized = { ...response };

    // Optimize content
    if (optimized.content) {
      optimized.content = optimized.content.map(item => {
        if (item.type === 'text' && item.text && item.text.length > 10000) {
          return {
            ...item,
            text: item.text.substring(0, 10000) + '... [content truncated due to size]'
          };
        }
        return item;
      });
    }

    // Optimize metadata
    if (optimized.meta && optimized.meta.results && Array.isArray(optimized.meta.results)) {
      const maxResults = 50;
      if (optimized.meta.results.length > maxResults) {
        optimized.meta.pagination = {
          total: optimized.meta.results.length,
          showing: maxResults,
          truncated: true
        };
        optimized.meta.results = optimized.meta.results.slice(0, maxResults);
      }
    }

    return optimized;
  }
}