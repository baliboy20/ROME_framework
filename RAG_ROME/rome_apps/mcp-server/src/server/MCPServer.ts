/**
 * MCP Server Implementation
 * 
 * Implements the Model Context Protocol server for Claude Code integration
 * Provides tool registration and request handling for documentation server
 * 
 * Author: Reena (Backend Developer)
 * Date: 2025-08-06
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { IToolHandler } from '../handlers/IToolHandler.js';
import { SearchRomeDocsHandler } from '../handlers/SearchRomeDocsHandler.js';
import { GetRomeStandardsHandler } from '../handlers/GetRomeStandardsHandler.js';
import { GetContractTemplateHandler } from '../handlers/GetContractTemplateHandler.js';
import { CheckRomaApprovalHandler } from '../handlers/CheckRomaApprovalHandler.js';
import { GetRobotProtocolHandler } from '../handlers/GetRobotProtocolHandler.js';
import { ValidateIntegrationContractHandler } from '../handlers/ValidateIntegrationContractHandler.js';
import { GetCoordinationStatusHandler } from '../handlers/GetCoordinationStatusHandler.js';
import { UpdateRobotStatusHandler } from '../handlers/UpdateRobotStatusHandler.js';
import { UpdateActionListHandler } from '../handlers/UpdateActionListHandler.js';
import { ReportIntegrationStatusHandler } from '../handlers/ReportIntegrationStatusHandler.js';
import { ResolveBlockerHandler } from '../handlers/ResolveBlockerHandler.js';
import { AddDependencyHandler } from '../handlers/AddDependencyHandler.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';
import { Logger } from '../utils/Logger.js';

export interface MCPServerDependencies {
  vdbServiceUrl: string;
  logger?: Logger;
}

export class MCPServer {
  private server: Server;
  private handlers: Map<string, IToolHandler>;
  private errorHandler: ErrorHandler;
  private logger: Logger;
  private isConnected: boolean = false;

  constructor(dependencies: MCPServerDependencies) {
    this.server = new Server(
      {
        name: 'mcp-rome-server',
        version: '2.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.logger = dependencies.logger || new Logger('MCPServer');
    this.errorHandler = new ErrorHandler(this.logger);
    this.handlers = new Map();

    // Initialize tool handlers
    this.initializeHandlers(dependencies);
    this.setupRequestHandlers();
  }

  private initializeHandlers(dependencies: MCPServerDependencies): void {
    const { vdbServiceUrl } = dependencies;

    try {
      // Initialize all 12 ROME-focused tool handlers
      const searchRomeDocsHandler = new SearchRomeDocsHandler(vdbServiceUrl, this.logger);
      const getRomeStandardsHandler = new GetRomeStandardsHandler(vdbServiceUrl, this.logger);
      const getContractTemplateHandler = new GetContractTemplateHandler(vdbServiceUrl, this.logger);
      const checkRomaApprovalHandler = new CheckRomaApprovalHandler(vdbServiceUrl, this.logger);
      const getRobotProtocolHandler = new GetRobotProtocolHandler(vdbServiceUrl, this.logger);
      const validateIntegrationContractHandler = new ValidateIntegrationContractHandler(vdbServiceUrl, this.logger);
      const getCoordinationStatusHandler = new GetCoordinationStatusHandler(vdbServiceUrl, this.logger);
      const updateRobotStatusHandler = new UpdateRobotStatusHandler(vdbServiceUrl, this.logger);
      const updateActionListHandler = new UpdateActionListHandler(vdbServiceUrl, this.logger);
      const reportIntegrationStatusHandler = new ReportIntegrationStatusHandler(vdbServiceUrl, this.logger);
      const resolveBlockerHandler = new ResolveBlockerHandler(vdbServiceUrl, this.logger);
      const addDependencyHandler = new AddDependencyHandler(vdbServiceUrl, this.logger);

      // Register ROME-optimized handlers (read-only coordination tools)
      this.handlers.set('search_rome_docs', searchRomeDocsHandler);
      this.handlers.set('get_rome_standards', getRomeStandardsHandler);
      this.handlers.set('get_contract_template', getContractTemplateHandler);
      this.handlers.set('check_roma_approval', checkRomaApprovalHandler);
      this.handlers.set('get_robot_protocol', getRobotProtocolHandler);
      this.handlers.set('validate_integration_contract', validateIntegrationContractHandler);
      this.handlers.set('get_coordination_status', getCoordinationStatusHandler);
      
      // Register active coordination tools (for status updates)
      this.handlers.set('update_robot_status', updateRobotStatusHandler);
      this.handlers.set('update_actionlist', updateActionListHandler);
      this.handlers.set('report_integration_status', reportIntegrationStatusHandler);
      this.handlers.set('resolve_blocker', resolveBlockerHandler);
      this.handlers.set('add_dependency', addDependencyHandler);

      this.logger.info(`Initialized ${this.handlers.size} ROME tool handlers`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to initialize ROME tool handlers', { error: errorMessage });
      throw error;
    }
  }

  private setupRequestHandlers(): void {
    // Handle tool listing requests
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools: Tool[] = [];
      
      for (const [name, handler] of this.handlers.entries()) {
        try {
          const toolDef = handler.getToolDefinition();
          tools.push(toolDef);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.logger.error(`Failed to get tool definition for ${name}`, { error: errorMessage });
        }
      }

      return { tools };
    });

    // Handle tool call requests
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const startTime = Date.now();
      const requestId = this.generateRequestId();

      this.logger.info(`Tool call: ${name}`, { requestId, args });

      try {
        // Get the appropriate handler
        const handler = this.handlers.get(name);
        if (!handler) {
          throw new Error(`Unknown tool: ${name}`);
        }

        // Validate arguments
        const validation = handler.validateArguments(args);
        if (!validation.isValid) {
          const error = new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
          (error as any).code = 'VALIDATION_ERROR';
          (error as any).validationErrors = validation.errors;
          throw error;
        }

        // Execute the tool
        const result = await handler.execute(validation.sanitizedArgs || args);
        const duration = Date.now() - startTime;

        // Add performance metadata
        if (result.meta) {
          result.meta.query_time_ms = duration;
          result.meta.requestId = requestId;
          result.meta.timestamp = new Date().toISOString();
        }

        this.logger.info(`Tool executed successfully: ${name}`, { 
          requestId, 
          duration: `${duration}ms` 
        });

        return result;

      } catch (error) {
        const duration = Date.now() - startTime;
        
        this.logger.error(`Tool execution failed: ${name}`, { 
          requestId, 
          duration: `${duration}ms`, 
          error 
        });

        const context = {
          requestId,
          toolName: name,
          arguments: args,
          duration,
          timestamp: new Date().toISOString()
        };

        return this.errorHandler.handleToolError(error, context);
      }
    });
  }

  public async connect(transport?: StdioServerTransport): Promise<void> {
    try {
      const serverTransport = transport || new StdioServerTransport();
      await this.server.connect(serverTransport);
      this.isConnected = true;
      
      this.logger.info('MCP Server connected successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to connect MCP Server', { error: errorMessage });
      throw error;
    }
  }

  public async close(): Promise<void> {
    try {
      await this.server.close();
      this.isConnected = false;
      this.logger.info('MCP Server closed');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Error closing MCP Server', { error: errorMessage });
      throw error;
    }
  }

  // Contract compliance methods
  public getRegisteredTools(): string[] {
    return Array.from(this.handlers.keys());
  }

  public async handleRequest(request: any): Promise<any> {
    // This method exists for contract compliance
    // In practice, requests are handled by the MCP SDK internally
    const { method, params } = request;

    if (method === 'tools/list') {
      const tools: Tool[] = [];
      for (const [name, handler] of this.handlers.entries()) {
        tools.push(handler.getToolDefinition());
      }
      return {
        jsonrpc: '2.0',
        id: request.id,
        result: { tools }
      };
    }

    if (method === 'tools/call') {
      const { name, arguments: args } = params;
      const handler = this.handlers.get(name);
      
      if (!handler) {
        return {
          jsonrpc: '2.0',
          id: request.id,
          error: {
            code: -32601,
            message: `Unknown tool: ${name}`,
            data: { toolName: name }
          }
        };
      }

      try {
        const validation = handler.validateArguments(args);
        if (!validation.isValid) {
          return {
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: -32602,
              message: 'Invalid parameters',
              data: { errors: validation.errors }
            }
          };
        }

        const result = await handler.execute(validation.sanitizedArgs || args);
        return {
          jsonrpc: '2.0',
          id: request.id,
          result
        };
      } catch (error) {
        const context = {
          requestId: request.id,
          toolName: name,
          arguments: args,
          timestamp: new Date().toISOString()
        };

        const errorResponse = this.errorHandler.handleToolError(error, context);
        return {
          jsonrpc: '2.0',
          id: request.id,
          error: {
            code: -32603,
            message: error instanceof Error ? error.message : String(error),
            data: errorResponse
          }
        };
      }
    }

    throw new Error(`Unsupported method: ${method}`);
  }

  public isServerConnected(): boolean {
    return this.isConnected;
  }

  public getHandler(toolName: string): IToolHandler | undefined {
    return this.handlers.get(toolName);
  }

  private generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Health check method
  public async healthCheck(): Promise<{
    status: string;
    handlers: number;
    connected: boolean;
    timestamp: string;
  }> {
    return {
      status: 'healthy',
      handlers: this.handlers.size,
      connected: this.isConnected,
      timestamp: new Date().toISOString()
    };
  }
}