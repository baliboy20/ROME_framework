/**
 * ROME Standards Handler - get_rome_standards tool
 * 
 * Retrieves ROME-specific standards, TDD protocols, and compliance criteria
 * Provides standards validation and approval requirements
 * 
 * Author: ROME Development Team
 * Date: 2025-08-09
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { BaseToolHandler, ValidationResult, MCPToolResponse } from './IToolHandler.js';
import axios from 'axios';

interface GetRomeStandardsArgs {
  standard_type?: 'development' | 'testing' | 'integration' | 'deployment' | 'coordination';
  robot_role?: 'pma' | 'backend' | 'frontend' | 'data' | 'devops' | 'qa';
  project_phase?: 'planning' | 'development' | 'integration' | 'deployment';
}

interface RomeStandard {
  id: string;
  title: string;
  description: string;
  standard_type: string;
  robot_role?: string;
  requirements: string[];
  validation_criteria: string[];
  examples?: string[];
  related_protocols?: string[];
}

export class GetRomeStandardsHandler extends BaseToolHandler {
  private vdbServiceUrl: string;
  private readonly validStandardTypes = [
    'development', 'testing', 'integration', 'deployment', 'coordination'
  ];
  private readonly validRobotRoles = [
    'pma', 'backend', 'frontend', 'data', 'devops', 'qa'
  ];
  private readonly validProjectPhases = [
    'planning', 'development', 'integration', 'deployment'
  ];

  constructor(vdbServiceUrl: string, logger: any) {
    super('get_rome_standards', logger);
    this.vdbServiceUrl = vdbServiceUrl;
  }

  getToolDefinition(): Tool {
    return {
      name: 'get_rome_standards',
      description: 'Retrieve ROME methodology standards, TDD protocols, and compliance criteria',
      inputSchema: {
        type: 'object',
        properties: {
          standard_type: {
            type: 'string',
            description: 'Type of ROME standard to retrieve',
            enum: this.validStandardTypes
          },
          robot_role: {
            type: 'string',
            description: 'Filter standards by robot role',
            enum: this.validRobotRoles
          },
          project_phase: {
            type: 'string',
            description: 'Filter standards by project phase',
            enum: this.validProjectPhases
          }
        },
        required: []
      }
    };
  }

  validateArguments(args: unknown): ValidationResult {
    const { args: parsedArgs, errors: parseErrors } = this.validateAndSanitizeArgs(args);
    if (parseErrors.length > 0) {
      return this.createValidationFailure(parseErrors);
    }

    const errors = [];
    const sanitizedArgs: GetRomeStandardsArgs = {};

    // Validate standard_type (optional)
    if (parsedArgs.standard_type !== undefined) {
      const typeError = this.validateEnum(parsedArgs.standard_type, 'standard_type', this.validStandardTypes, false);
      if (typeError) {
        errors.push(typeError);
      } else {
        sanitizedArgs.standard_type = parsedArgs.standard_type as any;
      }
    }

    // Validate robot_role (optional)
    if (parsedArgs.robot_role !== undefined) {
      const roleError = this.validateEnum(parsedArgs.robot_role, 'robot_role', this.validRobotRoles, false);
      if (roleError) {
        errors.push(roleError);
      } else {
        sanitizedArgs.robot_role = parsedArgs.robot_role as any;
      }
    }

    // Validate project_phase (optional)
    if (parsedArgs.project_phase !== undefined) {
      const phaseError = this.validateEnum(parsedArgs.project_phase, 'project_phase', this.validProjectPhases, false);
      if (phaseError) {
        errors.push(phaseError);
      } else {
        sanitizedArgs.project_phase = parsedArgs.project_phase as any;
      }
    }

    if (errors.length > 0) {
      return this.createValidationFailure(errors);
    }

    return this.createValidationSuccess(sanitizedArgs);
  }

  async execute(args: unknown): Promise<MCPToolResponse> {
    const { standard_type, robot_role, project_phase } = args as GetRomeStandardsArgs;

    try {
      this.logger.info(`Retrieving ROME standards`, { standard_type, robot_role, project_phase });

      // Get standards from VDB or built-in knowledge
      const standards = await this.getRomeStandards(standard_type, robot_role, project_phase);
      
      // Format results for response
      const formattedText = this.formatRomeStandards(standards, standard_type, robot_role, project_phase);
      
      const meta = {
        total_standards: standards.length,
        filters: {
          standard_type: standard_type || 'all',
          robot_role: robot_role || 'all',
          project_phase: project_phase || 'all'
        },
        suggested_next_tools: ['check_roma_approval', 'get_robot_protocol'],
        standards: standards
      };

      return this.createSuccessResponse(formattedText, meta);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`ROME standards retrieval failed: ${errorMessage}`, { standard_type, robot_role, project_phase, error });
      return this.createErrorResponse(
        `Failed to retrieve ROME standards: ${errorMessage}`,
        { standard_type, robot_role, project_phase, error: errorMessage }
      );
    }
  }

  private async getRomeStandards(
    standard_type?: string,
    robot_role?: string,
    project_phase?: string
  ): Promise<RomeStandard[]> {
    try {
      // First try to get from VDB Management Service
      const searchParams: any = {
        query: 'ROME standards requirements validation criteria',
        filters: {
          rome_category: 'standards',
          ...(robot_role && { robot_type: robot_role }),
          ...(project_phase && { project_phase })
        },
        limit: 20
      };

      const response = await axios.get(`${this.vdbServiceUrl}/api/v1/documents/search`, {
        params: searchParams,
        timeout: 5000
      });

      if (response.data.success && response.data.results?.length > 0) {
        return this.parseStandardsFromDocuments(response.data.results, standard_type);
      }
    } catch (error) {
      this.logger.warn('VDB service not available, using built-in standards', { error });
    }

    // Fallback to built-in ROME standards
    return this.getBuiltInRomeStandards(standard_type, robot_role, project_phase);
  }

  private parseStandardsFromDocuments(documents: any[], standard_type?: string): RomeStandard[] {
    // Parse standards from VDB documents - implementation would extract structured data
    // For now, return parsed content as standards
    return documents.map((doc, index) => ({
      id: doc.id || `standard_${index}`,
      title: doc.section || `ROME Standard ${index + 1}`,
      description: doc.content.substring(0, 200) + '...',
      standard_type: standard_type || 'general',
      robot_role: doc.robot_type,
      requirements: this.extractRequirements(doc.content),
      validation_criteria: this.extractValidationCriteria(doc.content),
      examples: this.extractExamples(doc.content),
      related_protocols: doc.rome_tags || []
    }));
  }

  private getBuiltInRomeStandards(
    standard_type?: string,
    robot_role?: string,
    project_phase?: string
  ): RomeStandard[] {
    const allStandards: RomeStandard[] = [
      {
        id: 'tdd_protocol_standard',
        title: 'TDD-ROME Protocol Standard',
        description: 'The 8-step Test-Driven Development protocol for ROME methodology',
        standard_type: 'development',
        requirements: [
          'All development must follow the 8-step TDD-ROME protocol',
          'Tests must be written before implementation',
          'Contract tests must be defined before coding begins',
          'All tests must pass before task completion'
        ],
        validation_criteria: [
          'Roma approval required for development plans',
          'Minimum 80% test coverage',
          'All contract tests passing',
          'Zero integration failures'
        ],
        examples: [
          'API contract definition with failing tests',
          'Database schema with validation tests',
          'UI component with behavior tests'
        ],
        related_protocols: ['8_step_protocol', 'contract_testing']
      },
      {
        id: 'contract_testing_standard',
        title: 'Contract Testing Standard',
        description: 'Standards for contract-based testing and interface definition',
        standard_type: 'testing',
        requirements: [
          'All module interfaces must have contract tests',
          'Contracts must be immutable once approved',
          'Integration tests must validate contract compliance',
          'Test data must be realistic and comprehensive'
        ],
        validation_criteria: [
          'All contract tests written before implementation',
          'Contract tests covering happy path and edge cases',
          'Integration tests verifying contract adherence',
          'Test execution time under performance thresholds'
        ],
        examples: [
          'REST API contract with request/response validation',
          'Database contract with schema and query tests',
          'Event-driven contract with message format tests'
        ],
        related_protocols: ['api_contracts', 'database_contracts', 'ui_contracts']
      },
      {
        id: 'robot_coordination_standard',
        title: 'Robot Coordination Standard',
        description: 'Standards for robot communication and task coordination',
        standard_type: 'coordination',
        requirements: [
          'All robots must update actionlist.md with task status',
          'Blocking tasks must be clearly identified',
          'Dependencies between robots must be documented',
          'Progress reporting must be timely and accurate'
        ],
        validation_criteria: [
          'Actionlist updated within 1 hour of status change',
          'All blockers resolved before dependent tasks start',
          'Communication logs maintained for all coordination',
          'Project status accessible to all team members'
        ],
        examples: [
          'Actionlist.md with proper task categorization',
          'Dependency mapping between robot tasks',
          'Status reporting with test evidence'
        ],
        related_protocols: ['task_management', 'status_reporting', 'dependency_tracking']
      },
      {
        id: 'integration_standard',
        title: 'Module Integration Standard',
        description: 'Standards for integrating modules developed by different robots',
        standard_type: 'integration',
        requirements: [
          'All modules must pass contract tests before integration',
          'Integration tests must cover all module interactions',
          'Performance requirements must be met',
          'Security standards must be validated'
        ],
        validation_criteria: [
          'Zero integration test failures',
          'Performance benchmarks met',
          'Security scan completed with no critical issues',
          'Documentation updated for all integrations'
        ],
        examples: [
          'API-Database integration test suite',
          'Frontend-Backend integration validation',
          'Cross-service communication tests'
        ],
        related_protocols: ['integration_testing', 'performance_validation', 'security_scanning']
      }
    ];

    // Filter standards based on parameters
    return allStandards.filter(standard => {
      if (standard_type && standard.standard_type !== standard_type) return false;
      if (robot_role && standard.robot_role && standard.robot_role !== robot_role) return false;
      // Project phase filtering would be implemented based on standard metadata
      return true;
    });
  }

  private extractRequirements(content: string): string[] {
    // Extract requirements from document content
    const requirements: string[] = [];
    const lines = content.split('\n');
    
    let inRequirementsSection = false;
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.toLowerCase().includes('requirement') || trimmed.toLowerCase().includes('must')) {
        inRequirementsSection = true;
      }
      
      if (inRequirementsSection && (trimmed.startsWith('- ') || trimmed.startsWith('* '))) {
        requirements.push(trimmed.substring(2));
      }
      
      if (trimmed === '' && inRequirementsSection && requirements.length > 0) {
        break; // End of requirements section
      }
    }
    
    return requirements.length > 0 ? requirements : ['Standard requirements apply'];
  }

  private extractValidationCriteria(content: string): string[] {
    // Extract validation criteria from document content
    const criteria: string[] = [];
    const lines = content.split('\n');
    
    let inCriteriaSection = false;
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.toLowerCase().includes('criteria') || trimmed.toLowerCase().includes('validation')) {
        inCriteriaSection = true;
      }
      
      if (inCriteriaSection && (trimmed.startsWith('- ') || trimmed.startsWith('* '))) {
        criteria.push(trimmed.substring(2));
      }
      
      if (trimmed === '' && inCriteriaSection && criteria.length > 0) {
        break; // End of criteria section
      }
    }
    
    return criteria.length > 0 ? criteria : ['Standard validation criteria apply'];
  }

  private extractExamples(content: string): string[] {
    // Extract examples from document content
    const examples: string[] = [];
    const lines = content.split('\n');
    
    let inExamplesSection = false;
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.toLowerCase().includes('example')) {
        inExamplesSection = true;
      }
      
      if (inExamplesSection && (trimmed.startsWith('- ') || trimmed.startsWith('* '))) {
        examples.push(trimmed.substring(2));
      }
      
      if (trimmed === '' && inExamplesSection && examples.length > 0) {
        break; // End of examples section
      }
    }
    
    return examples;
  }

  private formatRomeStandards(
    standards: RomeStandard[],
    standard_type?: string,
    robot_role?: string,
    project_phase?: string
  ): string {
    if (standards.length === 0) {
      return `ROME Standards:\n\nNo standards found matching the specified criteria.\n\nAvailable standard types: development, testing, integration, deployment, coordination\nAvailable robot roles: pma, backend, frontend, data, devops, qa`;
    }

    let formatted = `ROME Standards:\n\n`;
    
    // Add filter context
    const filters = [];
    if (standard_type) filters.push(`Type: ${standard_type}`);
    if (robot_role) filters.push(`Robot: ${robot_role}`);
    if (project_phase) filters.push(`Phase: ${project_phase}`);
    
    if (filters.length > 0) {
      formatted += `Filtered by: ${filters.join(', ')}\n\n`;
    }
    
    formatted += `Found ${standards.length} applicable standard${standards.length === 1 ? '' : 's'}:\n\n`;

    standards.forEach((standard, index) => {
      formatted += `${index + 1}. **${standard.title}**\n`;
      formatted += `   Type: ${standard.standard_type}`;
      if (standard.robot_role) {
        formatted += ` | Robot: ${standard.robot_role}`;
      }
      formatted += `\n\n   ${standard.description}\n\n`;
      
      // Requirements
      formatted += `   **Requirements:**\n`;
      standard.requirements.forEach(req => {
        formatted += `   - ${req}\n`;
      });
      
      // Validation Criteria
      formatted += `\n   **Validation Criteria:**\n`;
      standard.validation_criteria.forEach(criteria => {
        formatted += `   - ${criteria}\n`;
      });
      
      // Examples (if available)
      if (standard.examples && standard.examples.length > 0) {
        formatted += `\n   **Examples:**\n`;
        standard.examples.forEach(example => {
          formatted += `   - ${example}\n`;
        });
      }
      
      formatted += '\n---\n\n';
    });

    // Add next steps
    formatted += '**Next Steps:**\n';
    formatted += '- Use check_roma_approval to validate your development plan\n';
    formatted += '- Use get_robot_protocol for step-by-step guidance\n';
    formatted += '- Use get_contract_template for TDD contract creation\n';

    return formatted;
  }
}