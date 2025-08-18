/**
 * Validator Utility
 * 
 * Comprehensive validation for tool arguments, responses, and data schemas
 * Provides security validation and sanitization capabilities
 * 
 * Author: Reena (Backend Developer)
 * Date: 2025-08-06
 */

import { Logger } from './Logger.js';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  sanitizedData?: any;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface Schema {
  type: string;
  properties?: Record<string, Schema>;
  required?: string[];
  items?: Schema;
  enum?: string[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
}

export class Validator {
  private logger: Logger;

  constructor(logger?: Logger) {
    this.logger = logger || new Logger('Validator');
  }

  /**
   * Validates tool arguments for specific tools
   */
  public validateToolArguments(toolName: string, args: unknown): ValidationResult {
    const schemas = this.getToolSchemas();
    const schema = schemas[toolName];

    if (!schema) {
      return {
        isValid: false,
        errors: [{
          field: 'toolName',
          message: `Unknown tool: ${toolName}`,
          code: 'UNKNOWN_TOOL'
        }]
      };
    }

    return this.validateSchema(args, schema);
  }

  /**
   * Validates response structure
   */
  public validateResponse(response: any): ValidationResult {
    const errors: ValidationError[] = [];

    // Check required response structure
    if (!response || typeof response !== 'object') {
      errors.push({
        field: 'response',
        message: 'Response must be an object',
        code: 'INVALID_TYPE'
      });
      return { isValid: false, errors };
    }

    // Check content array
    if (!response.content || !Array.isArray(response.content)) {
      errors.push({
        field: 'content',
        message: 'Content array is required',
        code: 'MISSING_REQUIRED_FIELD'
      });
    } else {
      // Validate each content item
      response.content.forEach((item: any, index: number) => {
        const itemErrors = this.validateContentItem(item, `content[${index}]`);
        errors.push(...itemErrors);
      });
    }

    // Validate response size
    const responseSize = JSON.stringify(response).length;
    const maxSize = 5 * 1024 * 1024; // 5MB limit

    if (responseSize > maxSize) {
      errors.push({
        field: 'response_size',
        message: 'Response exceeds maximum size limit',
        code: 'SIZE_LIMIT_EXCEEDED'
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates data against a JSON schema
   */
  public validateSchema(data: unknown, schema: Schema): ValidationResult {
    const errors: ValidationError[] = [];
    const sanitizedData = this.sanitizeData(data);

    this.validateSchemaRecursive(sanitizedData, schema, '', errors);

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: errors.length === 0 ? sanitizedData : undefined
    };
  }

  private validateContentItem(item: any, fieldPath: string): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!item || typeof item !== 'object') {
      errors.push({
        field: fieldPath,
        message: 'Content item must be an object',
        code: 'INVALID_TYPE'
      });
      return errors;
    }

    // Check required type field
    if (!item.type || typeof item.type !== 'string') {
      errors.push({
        field: `${fieldPath}.type`,
        message: 'Content item must have a type field',
        code: 'MISSING_REQUIRED_FIELD'
      });
    } else if (!['text', 'image', 'resource'].includes(item.type)) {
      errors.push({
        field: `${fieldPath}.type`,
        message: 'Content type must be text, image, or resource',
        code: 'INVALID_VALUE'
      });
    }

    // Check text content
    if (item.type === 'text') {
      if (!item.text || typeof item.text !== 'string') {
        errors.push({
          field: `${fieldPath}.text`,
          message: 'Text field is required for text content',
          code: 'MISSING_REQUIRED_FIELD'
        });
      }
    }

    return errors;
  }

  private validateSchemaRecursive(data: any, schema: Schema, path: string, errors: ValidationError[]): void {
    // Type validation
    if (schema.type) {
      if (!this.validateType(data, schema.type)) {
        errors.push({
          field: path || 'root',
          message: `Expected ${schema.type} but received ${typeof data}`,
          code: 'TYPE_MISMATCH'
        });
        return;
      }
    }

    // Handle different types
    switch (schema.type) {
      case 'object':
        this.validateObject(data, schema, path, errors);
        break;
      case 'array':
        this.validateArray(data, schema, path, errors);
        break;
      case 'string':
        this.validateString(data, schema, path, errors);
        break;
      case 'number':
        this.validateNumber(data, schema, path, errors);
        break;
    }
  }

  private validateType(data: any, expectedType: string): boolean {
    switch (expectedType) {
      case 'object':
        return data !== null && typeof data === 'object' && !Array.isArray(data);
      case 'array':
        return Array.isArray(data);
      case 'string':
        return typeof data === 'string';
      case 'number':
        return typeof data === 'number' && !isNaN(data);
      case 'boolean':
        return typeof data === 'boolean';
      default:
        return false;
    }
  }

  private validateObject(data: any, schema: Schema, path: string, errors: ValidationError[]): void {
    if (!data || typeof data !== 'object') return;

    // Check required properties
    if (schema.required) {
      schema.required.forEach(prop => {
        if (!(prop in data)) {
          errors.push({
            field: path ? `${path}.${prop}` : prop,
            message: `Required property '${prop}' is missing`,
            code: 'MISSING_REQUIRED_FIELD'
          });
        }
      });
    }

    // Validate properties
    if (schema.properties) {
      Object.keys(schema.properties).forEach(prop => {
        if (prop in data) {
          const propPath = path ? `${path}.${prop}` : prop;
          const propSchema = schema.properties![prop];
          if (propSchema) {
            this.validateSchemaRecursive(data[prop], propSchema, propPath, errors);
          }
        }
      });
    }
  }

  private validateArray(data: any, schema: Schema, path: string, errors: ValidationError[]): void {
    if (!Array.isArray(data)) return;

    // Validate items
    if (schema.items) {
      data.forEach((item, index) => {
        const itemPath = `${path}[${index}]`;
        this.validateSchemaRecursive(item, schema.items!, itemPath, errors);
      });
    }
  }

  private validateString(data: any, schema: Schema, path: string, errors: ValidationError[]): void {
    if (typeof data !== 'string') return;

    // Length validation
    if (schema.minLength !== undefined && data.length < schema.minLength) {
      errors.push({
        field: path,
        message: `String must be at least ${schema.minLength} characters`,
        code: 'LENGTH_TOO_SHORT'
      });
    }

    if (schema.maxLength !== undefined && data.length > schema.maxLength) {
      errors.push({
        field: path,
        message: `String must be at most ${schema.maxLength} characters`,
        code: 'LENGTH_TOO_LONG'
      });
    }

    // Enum validation
    if (schema.enum && !schema.enum.includes(data)) {
      errors.push({
        field: path,
        message: `Value must be one of: ${schema.enum.join(', ')}`,
        code: 'INVALID_ENUM_VALUE'
      });
    }

    // Security validation
    this.validateStringSecurity(data, path, errors);
  }

  private validateNumber(data: any, schema: Schema, path: string, errors: ValidationError[]): void {
    if (typeof data !== 'number' || isNaN(data)) return;

    if (schema.minimum !== undefined && data < schema.minimum) {
      errors.push({
        field: path,
        message: `Number must be at least ${schema.minimum}`,
        code: 'NUMBER_TOO_SMALL'
      });
    }

    if (schema.maximum !== undefined && data > schema.maximum) {
      errors.push({
        field: path,
        message: `Number must be at most ${schema.maximum}`,
        code: 'NUMBER_TOO_LARGE'
      });
    }
  }

  private validateStringSecurity(data: string, path: string, errors: ValidationError[]): void {
    // Check for potentially dangerous patterns
    const dangerousPatterns = [
      { pattern: /['";]/g, message: 'contains potentially dangerous characters' },
      { pattern: /\b(DROP|DELETE|INSERT|UPDATE|SELECT)\b/gi, message: 'contains SQL keywords' },
      { pattern: /<script[^>]*>/gi, message: 'contains script tags' },
      { pattern: /javascript:/gi, message: 'contains javascript protocol' },
      { pattern: /(--|\#|\/\*|\*\/)/g, message: 'contains comment syntax' }
    ];

    dangerousPatterns.forEach(({ pattern, message }) => {
      if (pattern.test(data)) {
        this.logger.warn(`Security validation failed: ${path} ${message}`, { data: data.substring(0, 100) });
        errors.push({
          field: path,
          message: `Input ${message}`,
          code: 'SECURITY_VIOLATION'
        });
      }
    });
  }

  private sanitizeData(data: unknown): any {
    if (typeof data === 'string') {
      return this.sanitizeString(data);
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    }

    if (data && typeof data === 'object') {
      const sanitized: any = {};
      Object.keys(data).forEach(key => {
        sanitized[key] = this.sanitizeData((data as any)[key]);
      });
      return sanitized;
    }

    return data;
  }

  private sanitizeString(value: string): string {
    if (typeof value !== 'string') return value;

    // Basic sanitization
    let sanitized = value.trim();
    
    // Remove excessive whitespace
    sanitized = sanitized.replace(/\s+/g, ' ');
    
    // Remove potentially dangerous HTML/script content
    sanitized = sanitized.replace(/<[^>]*>/g, '');
    
    return sanitized;
  }

  private getToolSchemas(): Record<string, Schema> {
    return {
      search_docs: {
        type: 'object',
        properties: {
          query: { type: 'string', minLength: 1, maxLength: 500 },
          category: { 
            type: 'string', 
            enum: ['widgets', 'state', 'navigation', 'animation', 'testing', 'performance', 'architecture', 'deployment', 'development'] 
          },
          limit: { type: 'number', minimum: 1, maximum: 50 }
        },
        required: ['query']
      },
      get_snippet: {
        type: 'object',
        properties: {
          snippet_id: { type: 'string', minLength: 1, maxLength: 200 },
          include_context: { type: 'boolean' }
        },
        required: ['snippet_id']
      },
      get_rules: {
        type: 'object',
        properties: {
          category: { 
            type: 'string',
            enum: ['state_management', 'widget_architecture', 'performance', 'testing', 'navigation', 'theming', 'animations', 'data_handling', 'security', 'accessibility']
          },
          rule_type: {
            type: 'string',
            enum: ['best_practices', 'anti_patterns', 'conventions', 'performance_tips', 'security_guidelines']
          }
        }
      },
      validate_architecture: {
        type: 'object',
        properties: {
          code: { type: 'string', minLength: 1, maxLength: 10000 },
          pattern_type: {
            type: 'string',
            enum: ['widget', 'state_management', 'navigation', 'animation', 'data_handling', 'testing', 'architecture', 'general']
          }
        },
        required: ['code']
      },
      get_related: {
        type: 'object',
        properties: {
          topic: { type: 'string', minLength: 1, maxLength: 200 },
          context: { type: 'string', maxLength: 500 },
          limit: { type: 'number', minimum: 1, maximum: 20 }
        },
        required: ['topic']
      }
    };
  }
}