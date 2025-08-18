/**
 * Tool Handler Interface
 * 
 * Base interface that all MCP tool handlers must implement
 * Defines the contract for tool registration, validation, and execution
 * 
 * Author: Reena (Backend Developer)
 * Date: 2025-08-06
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  sanitizedArgs?: any;
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface MCPToolResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  meta?: Record<string, any>;
  isError?: boolean;
}

/**
 * Base interface that all tool handlers must implement
 */
export interface IToolHandler {
  /**
   * Returns the MCP tool definition for this handler
   * Used for tool registration and client discovery
   */
  getToolDefinition(): Tool;

  /**
   * Validates the arguments provided to the tool
   * Must check required fields, types, ranges, and security
   * 
   * @param args - Raw arguments from the tool call
   * @returns Validation result with sanitized arguments if valid
   */
  validateArguments(args: unknown): ValidationResult;

  /**
   * Executes the tool with validated arguments
   * Must return standardized response format
   * Must handle errors gracefully
   * 
   * @param args - Validated and sanitized arguments
   * @returns Tool response in MCP format
   */
  execute(args: unknown): Promise<MCPToolResponse>;
}

/**
 * Base abstract class providing common functionality
 */
export abstract class BaseToolHandler implements IToolHandler {
  protected toolName: string;
  protected logger: any;

  constructor(toolName: string, logger: any) {
    this.toolName = toolName;
    this.logger = logger;
  }

  abstract getToolDefinition(): Tool;
  abstract validateArguments(args: unknown): ValidationResult;
  abstract execute(args: unknown): Promise<MCPToolResponse>;

  /**
   * Helper method to create validation errors
   */
  protected createValidationError(field: string, message: string, code?: string): ValidationError {
    return { field, message, code: code || '' };
  }

  /**
   * Helper method to create successful validation result
   */
  protected createValidationSuccess(sanitizedArgs?: any): ValidationResult {
    return {
      isValid: true,
      errors: [],
      sanitizedArgs
    };
  }

  /**
   * Helper method to create failed validation result
   */
  protected createValidationFailure(errors: ValidationError[]): ValidationResult {
    return {
      isValid: false,
      errors
    };
  }

  /**
   * Helper method to create success response
   */
  protected createSuccessResponse(text: string, meta?: Record<string, any>): MCPToolResponse {
    return {
      content: [{
        type: 'text',
        text
      }],
      meta: meta || {},
      isError: false
    };
  }

  /**
   * Helper method to create error response
   */
  protected createErrorResponse(message: string, meta?: Record<string, any>): MCPToolResponse {
    return {
      content: [{
        type: 'text', 
        text: message
      }],
      meta: meta || {},
      isError: true
    };
  }

  /**
   * Helper method to validate string parameter
   */
  protected validateString(value: any, fieldName: string, required: boolean = true, maxLength?: number): ValidationError | null {
    if (required && (value === undefined || value === null || value === '')) {
      return this.createValidationError(fieldName, `${fieldName} is required`, 'MISSING_REQUIRED_FIELD');
    }

    if (!required && (value === undefined || value === null)) {
      return null;
    }

    if (typeof value !== 'string') {
      return this.createValidationError(fieldName, `${fieldName} must be a string`, 'INVALID_TYPE');
    }

    if (maxLength && value.length > maxLength) {
      return this.createValidationError(fieldName, `${fieldName} must be ${maxLength} characters or less`, 'LENGTH_EXCEEDED');
    }

    return null;
  }

  /**
   * Helper method to validate number parameter
   */
  protected validateNumber(value: any, fieldName: string, required: boolean = true, min?: number, max?: number): ValidationError | null {
    if (required && (value === undefined || value === null)) {
      return this.createValidationError(fieldName, `${fieldName} is required`, 'MISSING_REQUIRED_FIELD');
    }

    if (!required && (value === undefined || value === null)) {
      return null;
    }

    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (typeof numValue !== 'number' || isNaN(numValue)) {
      return this.createValidationError(fieldName, `${fieldName} must be a number`, 'INVALID_TYPE');
    }

    if (min !== undefined && numValue < min) {
      return this.createValidationError(fieldName, `${fieldName} must be at least ${min}`, 'OUT_OF_RANGE');
    }

    if (max !== undefined && numValue > max) {
      return this.createValidationError(fieldName, `${fieldName} must be at most ${max}`, 'OUT_OF_RANGE');
    }

    return null;
  }

  /**
   * Helper method to validate enum parameter
   */
  protected validateEnum(value: any, fieldName: string, validValues: string[], required: boolean = true): ValidationError | null {
    if (required && (value === undefined || value === null || value === '')) {
      return this.createValidationError(fieldName, `${fieldName} is required`, 'MISSING_REQUIRED_FIELD');
    }

    if (!required && (value === undefined || value === null)) {
      return null;
    }

    if (typeof value !== 'string') {
      return this.createValidationError(fieldName, `${fieldName} must be a string`, 'INVALID_TYPE');
    }

    if (!validValues.includes(value)) {
      return this.createValidationError(
        fieldName, 
        `${fieldName} must be one of: ${validValues.join(', ')}`, 
        'INVALID_VALUE'
      );
    }

    return null;
  }

  /**
   * Helper method to sanitize string input
   */
  protected sanitizeString(value: string): string {
    if (typeof value !== 'string') return value;
    
    // Remove excessive whitespace
    let sanitized = value.trim().replace(/\s+/g, ' ');
    
    // Basic HTML/script tag removal for security
    sanitized = sanitized.replace(/<[^>]*>/g, '');
    
    // Remove potential SQL injection patterns
    const dangerousPatterns = [
      /['";]/g,
      /(\b(DROP|DELETE|INSERT|UPDATE|SELECT)\b)/gi,
      /(--|\#|\/\*|\*\/)/g
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(sanitized)) {
        this.logger.warn(`Potentially dangerous content detected in input: ${this.toolName}`);
        // For security, we could reject the input entirely
        // or sanitize it more aggressively
        sanitized = sanitized.replace(pattern, '');
      }
    }
    
    return sanitized;
  }

  /**
   * Helper method to validate and sanitize arguments object
   */
  protected validateAndSanitizeArgs(args: unknown): { args: any; errors: ValidationError[] } {
    const errors: ValidationError[] = [];
    
    if (!args || typeof args !== 'object') {
      errors.push(this.createValidationError('arguments', 'Arguments must be an object', 'INVALID_TYPE'));
      return { args: {}, errors };
    }

    return { args: args as any, errors };
  }
}