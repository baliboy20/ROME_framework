/**
 * Contract Template Handler - get_contract_template tool
 * 
 * Generates TDD contract templates for specific module types and technologies
 * Provides structured contracts with test cases for ROME methodology
 * 
 * Author: ROME Development Team
 * Date: 2025-08-09
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { BaseToolHandler, ValidationResult, MCPToolResponse } from './IToolHandler.js';
import axios from 'axios';

interface GetContractTemplateArgs {
  module_type: 'api' | 'database' | 'frontend' | 'service' | 'integration';
  technology_stack?: 'node' | 'flutter' | 'python' | 'docker';
  complexity?: 'simple' | 'standard' | 'complex';
  dependencies?: string[];
}

interface ContractTemplate {
  contract_id: string;
  type: string;
  technology: string;
  complexity: string;
  interfaces: ContractInterface[];
  dependencies: string[];
  acceptance_criteria: string[];
  test_template: string;
  implementation_guidance: string;
}

interface ContractInterface {
  name: string;
  endpoint?: string;
  method?: string;
  request_schema?: any;
  response_schema?: any;
  validation_rules?: string[];
  test_cases: TestCase[];
}

interface TestCase {
  name: string;
  description: string;
  test_data?: any;
  expected_result?: any;
  test_type: 'happy_path' | 'edge_case' | 'error_case' | 'performance';
}

export class GetContractTemplateHandler extends BaseToolHandler {
  private vdbServiceUrl: string;
  private readonly validModuleTypes = [
    'api', 'database', 'frontend', 'service', 'integration'
  ];
  private readonly validTechnologyStacks = [
    'node', 'flutter', 'python', 'docker'
  ];
  private readonly validComplexities = [
    'simple', 'standard', 'complex'
  ];

  constructor(vdbServiceUrl: string, logger: any) {
    super('get_contract_template', logger);
    this.vdbServiceUrl = vdbServiceUrl;
  }

  getToolDefinition(): Tool {
    return {
      name: 'get_contract_template',
      description: 'Generate TDD contract templates for specific module types and technologies',
      inputSchema: {
        type: 'object',
        properties: {
          module_type: {
            type: 'string',
            description: 'Type of module to generate contract template for',
            enum: this.validModuleTypes
          },
          technology_stack: {
            type: 'string',
            description: 'Technology stack for the module',
            enum: this.validTechnologyStacks
          },
          complexity: {
            type: 'string',
            description: 'Complexity level of the contract',
            enum: this.validComplexities,
            default: 'standard'
          },
          dependencies: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of module dependencies'
          }
        },
        required: ['module_type']
      }
    };
  }

  validateArguments(args: unknown): ValidationResult {
    const { args: parsedArgs, errors: parseErrors } = this.validateAndSanitizeArgs(args);
    if (parseErrors.length > 0) {
      return this.createValidationFailure(parseErrors);
    }

    const errors = [];
    const sanitizedArgs: GetContractTemplateArgs = { module_type: 'api' };

    // Validate module_type (required)
    const moduleTypeError = this.validateEnum(parsedArgs.module_type, 'module_type', this.validModuleTypes, true);
    if (moduleTypeError) {
      errors.push(moduleTypeError);
    } else {
      sanitizedArgs.module_type = parsedArgs.module_type as any;
    }

    // Validate technology_stack (optional)
    if (parsedArgs.technology_stack !== undefined) {
      const techError = this.validateEnum(parsedArgs.technology_stack, 'technology_stack', this.validTechnologyStacks, false);
      if (techError) {
        errors.push(techError);
      } else {
        sanitizedArgs.technology_stack = parsedArgs.technology_stack as any;
      }
    }

    // Validate complexity (optional)
    if (parsedArgs.complexity !== undefined) {
      const complexityError = this.validateEnum(parsedArgs.complexity, 'complexity', this.validComplexities, false);
      if (complexityError) {
        errors.push(complexityError);
      } else {
        sanitizedArgs.complexity = parsedArgs.complexity as any;
      }
    } else {
      sanitizedArgs.complexity = 'standard';
    }

    // Validate dependencies (optional)
    if (parsedArgs.dependencies !== undefined) {
      if (Array.isArray(parsedArgs.dependencies)) {
        const validDependencies = parsedArgs.dependencies.filter((dep: any) => 
          typeof dep === 'string' && dep.length > 0 && dep.length < 100
        );
        sanitizedArgs.dependencies = validDependencies;
      }
    }

    if (errors.length > 0) {
      return this.createValidationFailure(errors);
    }

    return this.createValidationSuccess(sanitizedArgs);
  }

  async execute(args: unknown): Promise<MCPToolResponse> {
    const { module_type, technology_stack, complexity, dependencies } = args as GetContractTemplateArgs;

    try {
      this.logger.info(`Generating contract template`, { module_type, technology_stack, complexity });

      // Generate contract template
      const contractTemplate = await this.generateContractTemplate(
        module_type, 
        technology_stack || 'node', 
        complexity || 'standard', 
        dependencies || []
      );
      
      // Format results for response
      const formattedText = this.formatContractTemplate(contractTemplate);
      
      const meta = {
        template: contractTemplate,
        related_contracts: this.getRelatedContracts(module_type, dependencies),
        suggested_next_tools: ['check_roma_approval', 'get_robot_protocol']
      };

      return this.createSuccessResponse(formattedText, meta);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Contract template generation failed: ${errorMessage}`, { module_type, technology_stack, complexity, error });
      return this.createErrorResponse(
        `Failed to generate contract template: ${errorMessage}`,
        { module_type, technology_stack, complexity, error: errorMessage }
      );
    }
  }

  private async generateContractTemplate(
    module_type: string,
    technology_stack: string,
    complexity: string,
    dependencies: string[]
  ): Promise<ContractTemplate> {
    try {
      // Try to get template from VDB service first
      const response = await axios.get(`${this.vdbServiceUrl}/api/v1/contract-templates`, {
        params: { module_type, technology_stack, complexity },
        timeout: 5000
      });

      if (response.data.success && response.data.template) {
        return response.data.template;
      }
    } catch (error) {
      this.logger.warn('VDB service not available, using built-in templates', { error });
    }

    // Fallback to built-in template generation
    return this.generateBuiltInTemplate(module_type, technology_stack, complexity, dependencies);
  }

  private generateBuiltInTemplate(
    module_type: string,
    technology_stack: string,
    complexity: string,
    dependencies: string[]
  ): ContractTemplate {
    const templateId = `${module_type}_${technology_stack}_${complexity}`;

    switch (module_type) {
      case 'api':
        return this.generateApiContractTemplate(templateId, technology_stack, complexity, dependencies);
      case 'database':
        return this.generateDatabaseContractTemplate(templateId, technology_stack, complexity, dependencies);
      case 'frontend':
        return this.generateFrontendContractTemplate(templateId, technology_stack, complexity, dependencies);
      case 'service':
        return this.generateServiceContractTemplate(templateId, technology_stack, complexity, dependencies);
      case 'integration':
        return this.generateIntegrationContractTemplate(templateId, technology_stack, complexity, dependencies);
      default:
        throw new Error(`Unsupported module type: ${module_type}`);
    }
  }

  private generateApiContractTemplate(id: string, tech: string, complexity: string, deps: string[]): ContractTemplate {
    const isComplex = complexity === 'complex';
    const isSimple = complexity === 'simple';

    return {
      contract_id: id,
      type: 'api',
      technology: tech,
      complexity,
      interfaces: [
        {
          name: 'CreateResource',
          endpoint: '/api/v1/resources',
          method: 'POST',
          request_schema: {
            type: 'object',
            properties: {
              name: { type: 'string', minLength: 1, maxLength: 100 },
              description: { type: 'string', maxLength: 500 },
              ...(isComplex && { metadata: { type: 'object' } }),
              ...(isComplex && { tags: { type: 'array', items: { type: 'string' } } })
            },
            required: ['name']
          },
          response_schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  created_at: { type: 'string', format: 'date-time' },
                  ...(isComplex && { status: { type: 'string' } })
                }
              }
            }
          },
          validation_rules: [
            'Name must be unique',
            'Description is optional but recommended',
            ...(isComplex ? ['Metadata must be valid JSON', 'Tags must be non-empty strings'] : [])
          ],
          test_cases: [
            {
              name: 'should create resource with valid data',
              description: 'Test successful resource creation with all required fields',
              test_data: {
                name: 'Test Resource',
                description: 'A test resource for validation'
              },
              expected_result: {
                success: true,
                data: { id: 'expect.any(String)', name: 'Test Resource' }
              },
              test_type: 'happy_path'
            },
            {
              name: 'should reject resource with missing name',
              description: 'Test validation error when name is missing',
              test_data: { description: 'Resource without name' },
              expected_result: {
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Name is required' }
              },
              test_type: 'error_case'
            },
            ...(isComplex ? [{
              name: 'should handle duplicate name gracefully',
              description: 'Test conflict resolution when resource name already exists',
              test_data: { name: 'Existing Resource' },
              expected_result: {
                success: false,
                error: { code: 'CONFLICT', message: 'Resource with this name already exists' }
              },
              test_type: 'edge_case' as 'edge_case'
            }] : []),
            ...(!isSimple ? [{
              name: 'should respond within acceptable time',
              description: 'Test API response time performance',
              test_data: { name: 'Performance Test Resource' },
              expected_result: { response_time_ms: { $lt: 200 } },
              test_type: 'performance' as 'performance'
            }] : [])
          ]
        },
        ...(isComplex ? [{
          name: 'GetResource',
          endpoint: '/api/v1/resources/:id',
          method: 'GET',
          request_schema: {
            type: 'object',
            properties: {
              id: { type: 'string', pattern: '^[a-zA-Z0-9-_]+$' }
            },
            required: ['id']
          },
          response_schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  created_at: { type: 'string' },
                  updated_at: { type: 'string' }
                }
              }
            }
          },
          test_cases: [
            {
              name: 'should retrieve existing resource',
              description: 'Test successful resource retrieval',
              test_type: 'happy_path' as 'happy_path'
            },
            {
              name: 'should return 404 for non-existent resource',
              description: 'Test error handling for missing resource',
              test_type: 'error_case' as 'error_case'
            }
          ]
        }] : [])
      ],
      dependencies: deps,
      acceptance_criteria: [
        'All API endpoints return proper HTTP status codes',
        'Request/response schemas are validated',
        'Error handling covers all failure scenarios',
        'API documentation is auto-generated from contract',
        ...(isComplex ? [
          'Rate limiting is implemented and tested',
          'Authentication/authorization is validated',
          'Comprehensive logging is in place'
        ] : [])
      ],
      test_template: this.generateTestTemplate('api', tech, complexity),
      implementation_guidance: `
Implementation Guidelines for ${tech} API:

1. **Setup**: Initialize ${tech} server with middleware for validation, logging, error handling
2. **Routes**: Implement endpoints matching contract specifications exactly
3. **Validation**: Use schema validation middleware (joi, yup, or similar)
4. **Error Handling**: Implement consistent error response format
5. **Testing**: Run contract tests continuously during development
6. **Documentation**: Generate API docs from contract schemas

Key Points:
- Contract tests must pass before any implementation begins
- Response schemas are mandatory, not optional
- All error cases must be handled explicitly
- Performance requirements are part of the contract
      `
    };
  }

  private generateDatabaseContractTemplate(id: string, tech: string, complexity: string, deps: string[]): ContractTemplate {
    return {
      contract_id: id,
      type: 'database',
      technology: tech,
      complexity,
      interfaces: [
        {
          name: 'UserTable',
          request_schema: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              email: { type: 'string', format: 'email' },
              name: { type: 'string', minLength: 1, maxLength: 100 },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' }
            },
            required: ['id', 'email', 'name'],
            indexes: ['email', 'created_at']
          },
          validation_rules: [
            'Email must be unique across all users',
            'ID must be UUID v4 format',
            'Name cannot be empty string',
            'Timestamps are automatically managed'
          ],
          test_cases: [
            {
              name: 'should insert user with valid data',
              description: 'Test successful user creation',
              test_type: 'happy_path'
            },
            {
              name: 'should reject duplicate email',
              description: 'Test unique constraint on email field',
              test_type: 'error_case'
            },
            {
              name: 'should enforce required fields',
              description: 'Test schema validation for required fields',
              test_type: 'error_case'
            }
          ]
        }
      ],
      dependencies: deps,
      acceptance_criteria: [
        'All database migrations run without errors',
        'Schema constraints are enforced',
        'Query performance meets requirements (<100ms for simple queries)',
        'Data integrity is maintained across all operations'
      ],
      test_template: this.generateTestTemplate('database', tech, complexity),
      implementation_guidance: `
Database Implementation Guidelines:

1. **Schema**: Create tables matching contract specifications exactly
2. **Migrations**: Write reversible migrations with proper rollback
3. **Constraints**: Implement all validation rules as database constraints
4. **Indexing**: Add indexes as specified in contract
5. **Testing**: Use test database for contract validation

Key Points:
- Schema must match contract exactly before any queries
- All constraints must be enforced at database level
- Performance requirements are tested with realistic data volumes
      `
    };
  }

  private generateFrontendContractTemplate(id: string, tech: string, complexity: string, deps: string[]): ContractTemplate {
    return {
      contract_id: id,
      type: 'frontend',
      technology: tech,
      complexity,
      interfaces: [
        {
          name: 'UserListComponent',
          request_schema: {
            type: 'object',
            properties: {
              users: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    email: { type: 'string' }
                  }
                }
              },
              loading: { type: 'boolean' },
              onUserSelect: { type: 'function' }
            },
            required: ['users', 'loading']
          },
          validation_rules: [
            'Component must handle empty user list gracefully',
            'Loading state must be displayed during data fetch',
            'User selection must trigger callback with user object'
          ],
          test_cases: [
            {
              name: 'should render user list correctly',
              description: 'Test component renders with user data',
              test_type: 'happy_path'
            },
            {
              name: 'should show loading state',
              description: 'Test loading indicator display',
              test_type: 'happy_path'
            },
            {
              name: 'should handle empty user list',
              description: 'Test empty state display',
              test_type: 'edge_case'
            }
          ]
        }
      ],
      dependencies: deps,
      acceptance_criteria: [
        'All components render without errors',
        'User interactions trigger expected callbacks',
        'Component state management works correctly',
        'UI matches design specifications'
      ],
      test_template: this.generateTestTemplate('frontend', tech, complexity),
      implementation_guidance: `
Frontend Implementation Guidelines for ${tech}:

1. **Components**: Build components matching contract interface exactly
2. **State Management**: Implement state handling as specified
3. **Props Validation**: Validate all props match contract schema
4. **Testing**: Use widget/component testing for contract validation
5. **UI/UX**: Follow design system and accessibility guidelines

Key Points:
- Component interfaces must match contract exactly
- All user interactions must be testable
- State management must be predictable and testable
      `
    };
  }

  private generateServiceContractTemplate(id: string, tech: string, complexity: string, deps: string[]): ContractTemplate {
    return {
      contract_id: id,
      type: 'service',
      technology: tech,
      complexity,
      interfaces: [
        {
          name: 'ProcessingService',
          request_schema: {
            type: 'object',
            properties: {
              data: { type: 'object' },
              options: { 
                type: 'object',
                properties: {
                  timeout: { type: 'number', minimum: 1000, maximum: 30000 },
                  retries: { type: 'number', minimum: 0, maximum: 3 }
                }
              }
            },
            required: ['data']
          },
          response_schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              result: { type: 'object' },
              processing_time_ms: { type: 'number' },
              metadata: { type: 'object' }
            }
          },
          validation_rules: [
            'Service must process data within timeout period',
            'Retry logic must be implemented for transient failures',
            'Processing time must be recorded and returned'
          ],
          test_cases: [
            {
              name: 'should process data successfully',
              description: 'Test successful data processing',
              test_type: 'happy_path'
            },
            {
              name: 'should handle processing timeout',
              description: 'Test timeout handling',
              test_type: 'error_case'
            },
            {
              name: 'should retry on transient failure',
              description: 'Test retry mechanism',
              test_type: 'edge_case'
            }
          ]
        }
      ],
      dependencies: deps,
      acceptance_criteria: [
        'Service processes requests within SLA requirements',
        'Error handling covers all failure scenarios',
        'Resource cleanup is performed after processing',
        'Service health monitoring is implemented'
      ],
      test_template: this.generateTestTemplate('service', tech, complexity),
      implementation_guidance: `
Service Implementation Guidelines:

1. **Interface**: Implement service interface matching contract exactly
2. **Error Handling**: Implement robust error handling and recovery
3. **Monitoring**: Add health checks and metrics collection
4. **Testing**: Use integration tests to validate contract compliance
5. **Performance**: Optimize for SLA requirements

Key Points:
- Service contract defines the complete interface behavior
- All error conditions must be handled gracefully
- Performance requirements are part of the contract
      `
    };
  }

  private generateIntegrationContractTemplate(id: string, tech: string, complexity: string, deps: string[]): ContractTemplate {
    return {
      contract_id: id,
      type: 'integration',
      technology: tech,
      complexity,
      interfaces: [
        {
          name: 'CrossServiceIntegration',
          request_schema: {
            type: 'object',
            properties: {
              service_a_endpoint: { type: 'string', format: 'uri' },
              service_b_endpoint: { type: 'string', format: 'uri' },
              data_flow: { 
                type: 'string',
                enum: ['bidirectional', 'a_to_b', 'b_to_a']
              }
            },
            required: ['service_a_endpoint', 'service_b_endpoint', 'data_flow']
          },
          validation_rules: [
            'Both services must be available and responding',
            'Data transformation must be lossless',
            'Integration must handle service failures gracefully'
          ],
          test_cases: [
            {
              name: 'should integrate services successfully',
              description: 'Test successful service integration',
              test_type: 'happy_path'
            },
            {
              name: 'should handle service unavailability',
              description: 'Test integration resilience when services are down',
              test_type: 'error_case'
            },
            {
              name: 'should maintain data consistency',
              description: 'Test data integrity across service boundaries',
              test_type: 'edge_case'
            }
          ]
        }
      ],
      dependencies: deps,
      acceptance_criteria: [
        'All integrated services communicate successfully',
        'Data consistency is maintained across all operations',
        'Integration handles all failure scenarios gracefully',
        'Performance meets end-to-end SLA requirements'
      ],
      test_template: this.generateTestTemplate('integration', tech, complexity),
      implementation_guidance: `
Integration Implementation Guidelines:

1. **Service Discovery**: Implement service discovery and health checking
2. **Data Flow**: Ensure data transformations match contract specifications
3. **Error Handling**: Implement circuit breakers and fallback mechanisms
4. **Testing**: Use end-to-end tests to validate integration contracts
5. **Monitoring**: Implement distributed tracing and monitoring

Key Points:
- Integration contracts define the complete interaction pattern
- All failure modes must be tested and handled
- Performance requirements apply to the entire integration flow
      `
    };
  }

  private generateTestTemplate(type: string, tech: string, complexity: string): string {
    const testFrameworks = {
      node: 'Jest',
      flutter: 'flutter_test',
      python: 'pytest',
      docker: 'docker-compose + testing framework'
    };

    const framework = testFrameworks[tech as keyof typeof testFrameworks] || 'Jest';

    return `
// Contract Test Template for ${type} module using ${framework}
// Generated for ${tech} with ${complexity} complexity

describe('${type.charAt(0).toUpperCase() + type.slice(1)} Contract Tests', () => {
  beforeAll(async () => {
    // Setup test environment
    // Initialize ${tech} test infrastructure
    // Prepare test data
  });

  afterAll(async () => {
    // Cleanup test environment
    // Close connections
    // Remove test data
  });

  describe('Interface Contract Compliance', () => {
    it('should implement all required interface methods', async () => {
      // Test that all contract interfaces are implemented
      // Verify method signatures match contract specifications
    });

    it('should validate input according to contract schema', async () => {
      // Test input validation against contract schema
      // Verify all required fields are checked
      // Verify data types are enforced
    });

    it('should return responses matching contract schema', async () => {
      // Test output format matches contract specification
      // Verify all required response fields are present
      // Verify data types are correct
    });
  });

  describe('Error Handling Contract', () => {
    it('should handle all specified error cases', async () => {
      // Test each error case defined in contract
      // Verify error response format matches contract
    });

    it('should provide meaningful error messages', async () => {
      // Test error messages are helpful for debugging
      // Verify error codes match contract specifications
    });
  });

  describe('Performance Contract', () => {
    it('should meet performance requirements', async () => {
      // Test response times are within contract limits
      // Test resource usage is within acceptable bounds
    });
  });

  // Add specific test cases from contract template
  // Each test case from the contract should have a corresponding test here
});
    `.trim();
  }

  private getRelatedContracts(module_type: string, dependencies?: string[]): string[] {
    const related: string[] = [];

    // Add related contracts based on module type
    switch (module_type) {
      case 'api':
        related.push('database_contract', 'authentication_contract');
        break;
      case 'database':
        related.push('api_contract', 'migration_contract');
        break;
      case 'frontend':
        related.push('api_contract', 'ui_component_contracts');
        break;
      case 'service':
        related.push('api_contract', 'database_contract');
        break;
      case 'integration':
        related.push('service_contracts', 'api_contracts');
        break;
    }

    // Add dependency contracts
    if (dependencies) {
      related.push(...dependencies.map(dep => `${dep}_contract`));
    }

    return [...new Set(related)]; // Remove duplicates
  }

  private formatContractTemplate(template: ContractTemplate): string {
    let formatted = `Contract Template: **${template.contract_id}**\n\n`;
    formatted += `**Type**: ${template.type} | **Technology**: ${template.technology} | **Complexity**: ${template.complexity}\n\n`;

    // Dependencies
    if (template.dependencies.length > 0) {
      formatted += `**Dependencies**: ${template.dependencies.join(', ')}\n\n`;
    }

    // Interfaces
    formatted += `**Interfaces** (${template.interfaces.length}):\n\n`;
    template.interfaces.forEach((iface, index) => {
      formatted += `${index + 1}. **${iface.name}**\n`;
      
      if (iface.endpoint && iface.method) {
        formatted += `   ${iface.method} ${iface.endpoint}\n`;
      }
      
      formatted += `   Test Cases: ${iface.test_cases.length}\n`;
      iface.test_cases.forEach(test => {
        formatted += `   - ${test.name} (${test.test_type})\n`;
      });
      formatted += '\n';
    });

    // Acceptance Criteria
    formatted += `**Acceptance Criteria**:\n`;
    template.acceptance_criteria.forEach(criteria => {
      formatted += `- ${criteria}\n`;
    });
    formatted += '\n';

    // Implementation Guidance
    formatted += `**Implementation Guidance**:\n${template.implementation_guidance}\n\n`;

    // Next Steps
    formatted += '---\n';
    formatted += '**Next Steps**:\n';
    formatted += '1. Use check_roma_approval to validate this contract\n';
    formatted += '2. Use get_robot_protocol for TDD implementation steps\n';
    formatted += '3. Begin with writing failing tests for all interfaces\n';

    return formatted;
  }
}