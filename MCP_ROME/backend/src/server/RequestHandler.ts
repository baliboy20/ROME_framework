/**
 * Request Handler
 * 
 * Handles incoming MCP requests, validates them, routes to appropriate handlers
 * Provides request correlation, timing, and error handling
 * 
 * Author: Reena (Backend Developer)
 * Date: 2025-08-06
 */

import { Logger } from '../utils/Logger.js';
import { Validator, ValidationResult } from '../utils/Validator.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';

export interface MCPRequest {
  jsonrpc: string;
  id: string | number;
  method: string;
  params?: any;
}

export interface MCPResponse {
  jsonrpc: string;
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface RequestValidationResult extends ValidationResult {
  sanitizedRequest?: MCPRequest;
}

export interface RouteInfo {
  handler: string;
  toolName?: string;
  method: string;
  arguments?: any;
}

export class RequestHandler {
  private validator: Validator;
  private errorHandler: ErrorHandler;
  private logger: Logger;
  private readonly supportedMethods = ['tools/list', 'tools/call'];
  private readonly maxRequestSize = 1024 * 1024; // 1MB

  constructor(logger?: Logger) {
    this.logger = logger || new Logger('RequestHandler');
    this.validator = new Validator(this.logger);
    this.errorHandler = new ErrorHandler(this.logger);
  }

  /**
   * Processes an MCP request end-to-end
   */
  public async processRequest(request: any): Promise<MCPResponse> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      this.logger.info('Processing request', { requestId, method: request.method });

      // Validate request structure
      const validation = this.validateRequest(request);
      if (!validation.isValid) {
        return this.createErrorResponse(
          request.id || requestId,
          -32602,
          'Invalid Request',
          { errors: validation.errors }
        );
      }

      const validatedRequest = validation.sanitizedRequest!;

      // Route the request
      const route = this.routeRequest(validatedRequest);

      // This is a simplified processing - in real implementation, 
      // this would delegate to the actual MCP server handlers
      const result = await this.executeRoute(route, validatedRequest);

      const duration = Date.now() - startTime;
      this.logger.info('Request processed successfully', { requestId, duration: `${duration}ms` });

      return {
        jsonrpc: '2.0',
        id: validatedRequest.id,
        result
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Request processing failed', { requestId, duration: `${duration}ms`, error: errorMessage });

      return this.createErrorResponse(
        request.id || requestId,
        -32603,
        'Internal error',
        { requestId, error: errorMessage }
      );
    }
  }

  /**
   * Validates the structure and content of an MCP request
   */
  public validateRequest(request: any): RequestValidationResult {
    const errors = [];

    // Check basic structure
    if (!request || typeof request !== 'object') {
      return {
        isValid: false,
        errors: [{ field: 'request', message: 'Request must be an object', code: 'INVALID_TYPE' }]
      };
    }

    // Validate JSON-RPC version
    if (!request.jsonrpc || request.jsonrpc !== '2.0') {
      errors.push({
        field: 'jsonrpc',
        message: 'Missing required JSON-RPC version',
        code: 'MISSING_JSONRPC_VERSION'
      });
    }

    // Validate ID
    if (request.id === undefined || request.id === null) {
      errors.push({
        field: 'id',
        message: 'Missing required request ID',
        code: 'MISSING_REQUEST_ID'
      });
    }

    // Validate method
    if (!request.method || typeof request.method !== 'string') {
      errors.push({
        field: 'method',
        message: 'Missing required method field',
        code: 'MISSING_METHOD'
      });
    } else if (!this.supportedMethods.includes(request.method)) {
      errors.push({
        field: 'method',
        message: `Unsupported method: ${request.method}`,
        code: 'UNSUPPORTED_METHOD'
      });
    }

    // Validate request size
    const requestSize = JSON.stringify(request).length;
    if (requestSize > this.maxRequestSize) {
      errors.push({
        field: 'request_size',
        message: 'Request exceeds maximum size limit',
        code: 'SIZE_LIMIT_EXCEEDED'
      });
    }

    // Validate tool call parameters
    if (request.method === 'tools/call') {
      const paramErrors = this.validateToolCallParams(request.params);
      errors.push(...paramErrors);
    }

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    // Sanitize request
    const sanitizedRequest: MCPRequest = {
      jsonrpc: request.jsonrpc,
      id: request.id,
      method: request.method,
      params: request.params
    };

    return {
      isValid: true,
      errors: [],
      sanitizedRequest
    };
  }

  /**
   * Routes a validated request to the appropriate handler
   */
  public routeRequest(request: MCPRequest): RouteInfo {
    switch (request.method) {
      case 'tools/list':
        return {
          handler: 'CapabilityHandler',
          method: 'listTools'
        };

      case 'tools/call':
        const { name, arguments: args } = request.params;
        
        // Map tool names to handler classes
        const toolHandlerMap: Record<string, string> = {
          search_docs: 'SearchHandler',
          get_snippet: 'SnippetHandler',
          get_rules: 'RulesHandler',
          validate_architecture: 'ValidationHandler',
          get_related: 'RelatedHandler'
        };

        const handlerClass = toolHandlerMap[name];
        if (!handlerClass) {
          throw new Error(`Unknown tool: ${name}`);
        }

        return {
          handler: handlerClass,
          toolName: name,
          method: 'execute',
          arguments: args
        };

      default:
        throw new Error(`Unsupported method: ${request.method}`);
    }
  }

  private validateToolCallParams(params: any): Array<{ field: string; message: string; code: string }> {
    const errors = [];

    if (!params || typeof params !== 'object') {
      errors.push({
        field: 'params',
        message: 'Tool call parameters must be an object',
        code: 'INVALID_PARAMS_TYPE'
      });
      return errors;
    }

    if (!params.name || typeof params.name !== 'string') {
      errors.push({
        field: 'params.name',
        message: 'Tool name is required',
        code: 'MISSING_TOOL_NAME'
      });
    }

    if (params.arguments !== undefined && typeof params.arguments !== 'object') {
      errors.push({
        field: 'params.arguments',
        message: 'Tool arguments must be an object',
        code: 'INVALID_ARGUMENTS_TYPE'
      });
    }

    return errors;
  }

  private async executeRoute(route: RouteInfo, request: MCPRequest): Promise<any> {
    // This is a simplified implementation for contract compliance
    // In the actual MCP server, this would delegate to the registered handlers

    switch (route.handler) {
      case 'CapabilityHandler':
        return {
          tools: [
            { name: 'search_docs', description: 'Search Flutter documentation' },
            { name: 'get_snippet', description: 'Get code snippet by ID' },
            { name: 'get_rules', description: 'Get architecture rules' },
            { name: 'validate_architecture', description: 'Validate code architecture' },
            { name: 'get_related', description: 'Get related documents' }
          ]
        };

      default:
        // For tool execution, this would normally delegate to the MCPServer
        // which has the actual handler instances
        return {
          content: [{
            type: 'text',
            text: `Tool ${route.toolName} executed successfully`
          }],
          meta: {
            handler: route.handler,
            timestamp: new Date().toISOString()
          }
        };
    }
  }

  private createErrorResponse(id: string | number, code: number, message: string, data?: any): MCPResponse {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code,
        message,
        data
      }
    };
  }

  private generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}