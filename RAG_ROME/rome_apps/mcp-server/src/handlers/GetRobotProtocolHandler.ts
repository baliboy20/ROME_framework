/**
 * Robot Protocol Handler - get_robot_protocol tool
 * 
 * Provides step-by-step guidance for the ROME 8-step TDD protocol
 * Offers robot-specific guidance and context-aware instructions
 * 
 * Author: ROME Development Team
 * Date: 2025-08-09
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { BaseToolHandler, ValidationResult, MCPToolResponse } from './IToolHandler.js';
import axios from 'axios';

interface GetRobotProtocolArgs {
  current_step?: number;
  robot_role?: 'pma' | 'backend' | 'frontend' | 'data' | 'devops' | 'qa';
  module_type?: 'api' | 'database' | 'frontend' | 'service' | 'integration';
  context?: string;
}

interface ProtocolStep {
  number: number;
  name: string;
  description: string;
  robot_specific_guidance: string;
  required_deliverables: string[];
  success_criteria: string[];
  tools_to_use: string[];
  common_blockers: string[];
  time_estimate: string;
  dependencies: string[];
}

interface ProtocolGuidance {
  current_step: ProtocolStep;
  next_step_preview?: ProtocolStep;
  step_checklist: ChecklistItem[];
  overall_progress: string;
  context_specific_tips: string[];
}

interface ChecklistItem {
  task: string;
  completed: boolean;
  required: boolean;
  details?: string;
}

export class GetRobotProtocolHandler extends BaseToolHandler {
  private vdbServiceUrl: string;
  private readonly validRobotRoles = [
    'pma', 'backend', 'frontend', 'data', 'devops', 'qa'
  ];
  private readonly validModuleTypes = [
    'api', 'database', 'frontend', 'service', 'integration'
  ];

  constructor(vdbServiceUrl: string, logger: any) {
    super('get_robot_protocol', logger);
    this.vdbServiceUrl = vdbServiceUrl;
  }

  getToolDefinition(): Tool {
    return {
      name: 'get_robot_protocol',
      description: 'Get step-by-step guidance for the ROME 8-step TDD protocol with robot-specific instructions',
      inputSchema: {
        type: 'object',
        properties: {
          current_step: {
            type: 'number',
            description: 'Current step in the 8-step protocol (1-8)',
            minimum: 1,
            maximum: 8
          },
          robot_role: {
            type: 'string',
            description: 'Robot role for specialized guidance',
            enum: this.validRobotRoles
          },
          module_type: {
            type: 'string',
            description: 'Type of module being developed for context-specific guidance',
            enum: this.validModuleTypes
          },
          context: {
            type: 'string',
            description: 'Current task or project context for personalized guidance'
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
    const sanitizedArgs: GetRobotProtocolArgs = {};

    // Validate current_step (optional)
    if (parsedArgs.current_step !== undefined) {
      const stepError = this.validateNumber(parsedArgs.current_step, 'current_step', false, 1, 8);
      if (stepError) {
        errors.push(stepError);
      } else {
        sanitizedArgs.current_step = parseInt(parsedArgs.current_step.toString());
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

    // Validate module_type (optional)
    if (parsedArgs.module_type !== undefined) {
      const moduleError = this.validateEnum(parsedArgs.module_type, 'module_type', this.validModuleTypes, false);
      if (moduleError) {
        errors.push(moduleError);
      } else {
        sanitizedArgs.module_type = parsedArgs.module_type as any;
      }
    }

    // Validate context (optional)
    if (parsedArgs.context !== undefined) {
      const contextError = this.validateString(parsedArgs.context, 'context', false, 1000);
      if (contextError) {
        errors.push(contextError);
      } else {
        sanitizedArgs.context = this.sanitizeString(parsedArgs.context);
      }
    }

    if (errors.length > 0) {
      return this.createValidationFailure(errors);
    }

    return this.createValidationSuccess(sanitizedArgs);
  }

  async execute(args: unknown): Promise<MCPToolResponse> {
    const { current_step, robot_role, module_type, context } = args as GetRobotProtocolArgs;

    try {
      this.logger.info(`Providing robot protocol guidance`, { current_step, robot_role, module_type });

      // Get protocol guidance
      const protocolGuidance = await this.getProtocolGuidance(
        current_step || 1,
        robot_role,
        module_type,
        context
      );
      
      // Format results for response
      const formattedText = this.formatProtocolGuidance(protocolGuidance, robot_role);
      
      const meta = {
        protocol_guidance: protocolGuidance,
        suggested_next_tools: this.getSuggestedTools(protocolGuidance.current_step.number)
      };

      return this.createSuccessResponse(formattedText, meta);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Robot protocol guidance failed: ${errorMessage}`, { current_step, robot_role, module_type, error });
      return this.createErrorResponse(
        `Failed to get robot protocol guidance: ${errorMessage}`,
        { current_step, robot_role, module_type, error: errorMessage }
      );
    }
  }

  private async getProtocolGuidance(
    current_step: number,
    robot_role?: string,
    module_type?: string,
    context?: string
  ): Promise<ProtocolGuidance> {
    // Get the current step details
    const currentStepDetails = this.getStepDetails(current_step, robot_role, module_type, context);
    
    // Get next step preview
    const nextStepDetails = current_step < 8 ? 
      this.getStepDetails(current_step + 1, robot_role, module_type, context) : undefined;
    
    // Generate step checklist
    const stepChecklist = this.generateStepChecklist(current_step, robot_role, module_type);
    
    // Calculate overall progress
    const overall_progress = `Step ${current_step} of 8 (${Math.round((current_step / 8) * 100)}% complete)`;
    
    // Generate context-specific tips
    const context_specific_tips = this.generateContextTips(current_step, robot_role, module_type, context);

    return {
      current_step: currentStepDetails,
      next_step_preview: nextStepDetails,
      step_checklist: stepChecklist,
      overall_progress,
      context_specific_tips
    };
  }

  private getStepDetails(
    step: number,
    robot_role?: string,
    module_type?: string,
    context?: string
  ): ProtocolStep {
    const baseSteps: Omit<ProtocolStep, 'robot_specific_guidance'>[] = [
      {
        number: 1,
        name: 'Read',
        description: 'Read and understand requirements, analyze the task',
        required_deliverables: ['Requirements analysis', 'Task understanding document'],
        success_criteria: ['All requirements understood', 'Clarifications documented', 'Scope clearly defined'],
        tools_to_use: ['search_rome_docs', 'get_rome_standards'],
        common_blockers: ['Unclear requirements', 'Missing context', 'Ambiguous specifications'],
        time_estimate: '15-30 minutes',
        dependencies: ['Requirements document', 'Project context']
      },
      {
        number: 2,
        name: 'Analyze',
        description: 'Analyze what needs to be done and create development plan',
        required_deliverables: ['Development plan', 'Architecture design', 'Implementation approach'],
        success_criteria: ['Plan covers all requirements', 'Architecture is sound', 'Approach is feasible'],
        tools_to_use: ['get_contract_template', 'search_rome_docs'],
        common_blockers: ['Complex requirements', 'Unclear dependencies', 'Technical constraints'],
        time_estimate: '30-60 minutes',
        dependencies: ['Requirements analysis', 'System architecture knowledge']
      },
      {
        number: 3,
        name: 'Standards Review',
        description: 'Get Roma approval of development plan against technical standards',
        required_deliverables: ['Approved development plan', 'Standards compliance confirmation'],
        success_criteria: ['Roma approval received', 'All standards validated', 'Plan meets ROME requirements'],
        tools_to_use: ['check_roma_approval', 'get_rome_standards'],
        common_blockers: ['Plan not meeting standards', 'Missing documentation', 'Incomplete architecture'],
        time_estimate: '15-30 minutes',
        dependencies: ['Complete development plan', 'Architecture documentation']
      },
      {
        number: 4,
        name: 'Test-First',
        description: 'Write failing tests for all interfaces and functionality',
        required_deliverables: ['Contract tests', 'Unit tests', 'Integration test stubs'],
        success_criteria: ['All tests written and failing', 'Tests cover all requirements', 'Test structure is clean'],
        tools_to_use: ['get_contract_template'],
        common_blockers: ['Unclear test requirements', 'Complex test setup', 'Mock dependencies'],
        time_estimate: '45-90 minutes',
        dependencies: ['Approved plan', 'Test framework setup', 'Development environment']
      },
      {
        number: 5,
        name: 'Clarify',
        description: 'Clarify any test ambiguities with coordinator',
        required_deliverables: ['Clarified test cases', 'Updated test documentation'],
        success_criteria: ['All ambiguities resolved', 'Tests are clear and actionable', 'Team alignment achieved'],
        tools_to_use: ['get_coordination_status'],
        common_blockers: ['PMA unavailable', 'Complex edge cases', 'Integration dependencies'],
        time_estimate: '15-30 minutes',
        dependencies: ['Written tests', 'Identified ambiguities']
      },
      {
        number: 6,
        name: 'Implement',
        description: 'Implement minimum code to make tests pass',
        required_deliverables: ['Working implementation', 'Passing tests', 'Clean code'],
        success_criteria: ['All tests pass', 'Code meets standards', 'Implementation is minimal and focused'],
        tools_to_use: [],
        common_blockers: ['Technical challenges', 'Complex algorithms', 'External dependencies'],
        time_estimate: '60-180 minutes',
        dependencies: ['Failing tests', 'Development environment', 'Required dependencies']
      },
      {
        number: 7,
        name: 'Validate',
        description: 'Ensure comprehensive test coverage and quality',
        required_deliverables: ['Test coverage report', 'Quality metrics', 'Code review'],
        success_criteria: ['Coverage >= 80%', 'All edge cases tested', 'Code quality standards met'],
        tools_to_use: [],
        common_blockers: ['Low test coverage', 'Missing edge cases', 'Performance issues'],
        time_estimate: '30-60 minutes',
        dependencies: ['Complete implementation', 'Working tests', 'Coverage tools']
      },
      {
        number: 8,
        name: 'Report',
        description: 'Report completion status with test evidence',
        required_deliverables: ['Completion report', 'Test results', 'Updated documentation'],
        success_criteria: ['All deliverables complete', 'Documentation updated', 'Status reported to team'],
        tools_to_use: ['get_coordination_status'],
        common_blockers: ['Documentation gaps', 'Incomplete testing', 'Integration issues'],
        time_estimate: '15-30 minutes',
        dependencies: ['Complete implementation', 'Test results', 'Documentation']
      }
    ];

    const baseStep = baseSteps[step - 1];
    const robotGuidance = this.getRobotSpecificGuidance(step, robot_role, module_type, context);

    return {
      ...baseStep,
      robot_specific_guidance: robotGuidance
    };
  }

  private getRobotSpecificGuidance(
    step: number,
    robot_role?: string,
    module_type?: string,
    context?: string
  ): string {
    const stepName = ['Read', 'Analyze', 'Standards Review', 'Test-First', 'Clarify', 'Implement', 'Validate', 'Report'][step - 1];
    
    if (!robot_role) {
      return `General guidance for ${stepName} step in ROME 8-step protocol.`;
    }

    const roleGuidance: Record<string, Record<number, string>> = {
      backend: {
        1: 'Focus on API requirements, data models, and service interactions. Understand performance requirements and security considerations.',
        2: 'Design API endpoints, database schemas, and service architecture. Consider scalability and maintainability.',
        3: 'Ensure API design follows RESTful principles, security standards, and performance requirements.',
        4: 'Write API contract tests, database tests, and service layer tests. Mock external dependencies.',
        5: 'Clarify API edge cases, error handling scenarios, and integration points with other services.',
        6: 'Implement API endpoints, business logic, and database operations. Focus on making tests pass.',
        7: 'Validate API performance, security, error handling, and database integrity.',
        8: 'Document API endpoints, update service documentation, and report implementation status.'
      },
      frontend: {
        1: 'Understand UI/UX requirements, user flows, and component interactions. Review design specifications.',
        2: 'Design component hierarchy, state management, and user interaction flows. Plan responsive design.',
        3: 'Ensure UI design follows accessibility standards, performance guidelines, and user experience principles.',
        4: 'Write component tests, user interaction tests, and integration tests with backend APIs.',
        5: 'Clarify UI behavior edge cases, user interaction patterns, and responsive design requirements.',
        6: 'Implement UI components, state management, and user interactions. Make all tests pass.',
        7: 'Validate UI responsiveness, accessibility, performance, and cross-browser compatibility.',
        8: 'Update component documentation, style guides, and report UI implementation status.'
      },
      data: {
        1: 'Understand data requirements, schemas, relationships, and performance needs. Review data governance policies.',
        2: 'Design database schemas, data models, indexing strategy, and migration plans. Consider data integrity.',
        3: 'Ensure database design follows normalization principles, performance standards, and security requirements.',
        4: 'Write schema validation tests, query performance tests, and data integrity tests.',
        5: 'Clarify data relationships, query patterns, and performance optimization strategies.',
        6: 'Implement database schemas, migrations, and data access layers. Ensure all tests pass.',
        7: 'Validate query performance, data integrity, backup strategies, and security measures.',
        8: 'Document database schemas, query patterns, and report data implementation status.'
      },
      devops: {
        1: 'Understand deployment requirements, infrastructure needs, and operational constraints. Review security policies.',
        2: 'Design CI/CD pipelines, infrastructure architecture, and deployment strategies. Plan monitoring and scaling.',
        3: 'Ensure infrastructure design follows security standards, scalability requirements, and operational best practices.',
        4: 'Write infrastructure tests, deployment tests, and monitoring tests. Test rollback procedures.',
        5: 'Clarify deployment scenarios, scaling requirements, and operational procedures.',
        6: 'Implement CI/CD pipelines, infrastructure provisioning, and deployment automation. Make tests pass.',
        7: 'Validate deployment processes, monitoring systems, security configurations, and disaster recovery.',
        8: 'Document infrastructure setup, operational procedures, and report deployment readiness.'
      },
      qa: {
        1: 'Understand testing requirements, quality standards, and acceptance criteria. Review test strategy.',
        2: 'Design test plans, test cases, automation strategy, and quality gates. Plan test data management.',
        3: 'Ensure test strategy covers all quality requirements, risk areas, and compliance standards.',
        4: 'Write acceptance tests, integration tests, and performance tests. Set up test automation.',
        5: 'Clarify test scenarios, edge cases, and quality criteria with development team.',
        6: 'Implement test automation, execute test suites, and validate quality metrics.',
        7: 'Validate test coverage, test reliability, performance benchmarks, and quality reports.',
        8: 'Document test results, quality metrics, and report testing completion status.'
      },
      pma: {
        1: 'Review all requirements, coordinate with stakeholders, and ensure team understanding. Validate project scope.',
        2: 'Coordinate architecture decisions, validate technical approach, and ensure team alignment. Plan resource allocation.',
        3: 'Review all robot plans for consistency, completeness, and alignment with project goals.',
        4: 'Coordinate contract definition across all robots. Ensure integration points are well-defined.',
        5: 'Facilitate clarification sessions, resolve conflicts, and ensure team coordination.',
        6: 'Monitor implementation progress, unblock robots, and coordinate integration activities.',
        7: 'Validate overall system integration, quality gates, and project completion criteria.',
        8: 'Compile project status, coordinate final deliverables, and report to stakeholders.'
      }
    };

    const guidance = roleGuidance[robot_role]?.[step];
    if (guidance) {
      let contextualGuidance = guidance;
      
      // Add module-specific context
      if (module_type) {
        contextualGuidance += `\n\nFor ${module_type} modules: `;
        switch (module_type) {
          case 'api':
            contextualGuidance += 'Pay special attention to endpoint design, request/response validation, and error handling.';
            break;
          case 'database':
            contextualGuidance += 'Focus on schema design, query optimization, and data integrity constraints.';
            break;
          case 'frontend':
            contextualGuidance += 'Emphasize user experience, responsive design, and accessibility compliance.';
            break;
          case 'service':
            contextualGuidance += 'Consider service reliability, monitoring, and integration patterns.';
            break;
          case 'integration':
            contextualGuidance += 'Focus on service communication, error handling, and data consistency.';
            break;
        }
      }

      return contextualGuidance;
    }

    return `Specialized ${robot_role} guidance for ${stepName} step - apply role expertise to this protocol step.`;
  }

  private generateStepChecklist(
    current_step: number,
    robot_role?: string,
    module_type?: string
  ): ChecklistItem[] {
    const baseChecklist: Record<number, ChecklistItem[]> = {
      1: [
        { task: 'Read all requirement documents', completed: false, required: true },
        { task: 'Identify key stakeholders', completed: false, required: true },
        { task: 'Document unclear requirements', completed: false, required: true },
        { task: 'Validate scope understanding', completed: false, required: false }
      ],
      2: [
        { task: 'Create development plan document', completed: false, required: true },
        { task: 'Design technical architecture', completed: false, required: true },
        { task: 'Identify implementation dependencies', completed: false, required: true },
        { task: 'Estimate effort and timeline', completed: false, required: false }
      ],
      3: [
        { task: 'Submit plan for Roma approval', completed: false, required: true },
        { task: 'Address Roma feedback', completed: false, required: true },
        { task: 'Receive final approval', completed: false, required: true },
        { task: 'Update team on approved approach', completed: false, required: false }
      ],
      4: [
        { task: 'Write contract tests (failing)', completed: false, required: true },
        { task: 'Write unit tests (failing)', completed: false, required: true },
        { task: 'Set up test framework', completed: false, required: true },
        { task: 'Verify all tests fail initially', completed: false, required: true }
      ],
      5: [
        { task: 'Review tests with team', completed: false, required: true },
        { task: 'Clarify ambiguous test cases', completed: false, required: true },
        { task: 'Update test documentation', completed: false, required: false },
        { task: 'Get team sign-off on tests', completed: false, required: true }
      ],
      6: [
        { task: 'Implement core functionality', completed: false, required: true },
        { task: 'Make all tests pass', completed: false, required: true },
        { task: 'Follow coding standards', completed: false, required: true },
        { task: 'Keep implementation minimal', completed: false, required: false }
      ],
      7: [
        { task: 'Run full test suite', completed: false, required: true },
        { task: 'Check test coverage (>80%)', completed: false, required: true },
        { task: 'Validate performance requirements', completed: false, required: false },
        { task: 'Code quality review', completed: false, required: true }
      ],
      8: [
        { task: 'Update project documentation', completed: false, required: true },
        { task: 'Report completion status', completed: false, required: true },
        { task: 'Update actionlist.md', completed: false, required: true },
        { task: 'Prepare handoff materials', completed: false, required: false }
      ]
    };

    const checklist = baseChecklist[current_step] || [];
    
    // Add role-specific checklist items
    if (robot_role && current_step === 4) {
      const roleSpecificTests = {
        backend: { task: 'Write API endpoint tests', completed: false, required: true },
        frontend: { task: 'Write component interaction tests', completed: false, required: true },
        data: { task: 'Write schema validation tests', completed: false, required: true },
        devops: { task: 'Write deployment tests', completed: false, required: true },
        qa: { task: 'Write acceptance test scenarios', completed: false, required: true }
      };
      
      if (roleSpecificTests[robot_role as keyof typeof roleSpecificTests]) {
        checklist.push(roleSpecificTests[robot_role as keyof typeof roleSpecificTests]);
      }
    }

    return checklist;
  }

  private generateContextTips(
    current_step: number,
    robot_role?: string,
    module_type?: string,
    context?: string
  ): string[] {
    const tips: string[] = [];

    // Step-specific tips
    if (current_step === 1) {
      tips.push('Take time to truly understand requirements - rushing here creates problems later');
      tips.push('Ask questions early - clarifications are cheaper than rework');
    } else if (current_step === 4) {
      tips.push('Write tests that clearly express the intended behavior');
      tips.push('Start with happy path tests, then add edge cases');
      tips.push('Ensure tests fail for the right reasons before implementing');
    } else if (current_step === 6) {
      tips.push('Implement only enough to make tests pass');
      tips.push('Resist the urge to over-engineer - keep it simple');
      tips.push('Run tests frequently to get immediate feedback');
    }

    // Role-specific tips
    if (robot_role) {
      const roleTips = {
        backend: ['Consider API versioning from the start', 'Think about security implications early'],
        frontend: ['Mobile-first responsive design saves time later', 'Accessibility should be built-in, not added on'],
        data: ['Index strategy affects performance more than you think', 'Plan for data migration scenarios'],
        devops: ['Infrastructure as code prevents configuration drift', 'Monitor everything, alert on what matters'],
        qa: ['Automate repetitive tests to focus on exploratory testing', 'Test data management is crucial for reliable tests'],
        pma: ['Regular check-ins prevent small issues from becoming big problems', 'Document decisions to avoid repeated discussions']
      };
      
      if (roleTips[robot_role as keyof typeof roleTips]) {
        tips.push(...roleTips[robot_role as keyof typeof roleTips]);
      }
    }

    // Context-specific tips
    if (context && context.toLowerCase().includes('deadline')) {
      tips.push('Under time pressure? Focus on core functionality first, add features later');
    }
    if (context && context.toLowerCase().includes('complex')) {
      tips.push('Complex requirements? Break them into smaller, testable pieces');
    }

    return tips;
  }

  private getSuggestedTools(current_step: number): string[] {
    const toolsByStep: Record<number, string[]> = {
      1: ['search_rome_docs', 'get_rome_standards'],
      2: ['get_contract_template', 'search_rome_docs'],
      3: ['check_roma_approval', 'get_rome_standards'],
      4: ['get_contract_template'],
      5: ['get_coordination_status'],
      6: [],
      7: [],
      8: ['get_coordination_status']
    };

    return toolsByStep[current_step] || [];
  }

  private formatProtocolGuidance(guidance: ProtocolGuidance, robot_role?: string): string {
    let formatted = `ROME 8-Step Protocol Guidance\n\n`;
    
    // Progress and role context
    formatted += `📊 **Progress**: ${guidance.overall_progress}\n`;
    if (robot_role) {
      formatted += `🤖 **Robot Role**: ${robot_role}\n`;
    }
    formatted += '\n';

    // Current step details
    const step = guidance.current_step;
    formatted += `## Step ${step.number}: ${step.name}\n\n`;
    formatted += `**Description**: ${step.description}\n\n`;
    formatted += `**Robot-Specific Guidance**:\n${step.robot_specific_guidance}\n\n`;

    // Required deliverables
    formatted += `**Required Deliverables**:\n`;
    step.required_deliverables.forEach(deliverable => {
      formatted += `- ${deliverable}\n`;
    });
    formatted += '\n';

    // Success criteria
    formatted += `**Success Criteria**:\n`;
    step.success_criteria.forEach(criteria => {
      formatted += `- ${criteria}\n`;
    });
    formatted += '\n';

    // Tools to use
    if (step.tools_to_use.length > 0) {
      formatted += `**Recommended Tools**:\n`;
      step.tools_to_use.forEach(tool => {
        formatted += `- ${tool}\n`;
      });
      formatted += '\n';
    }

    // Step checklist
    formatted += `**Step Checklist**:\n`;
    guidance.step_checklist.forEach(item => {
      const icon = item.completed ? '✅' : (item.required ? '☐' : '◯');
      const label = item.required ? ' (Required)' : ' (Optional)';
      formatted += `${icon} ${item.task}${label}\n`;
    });
    formatted += '\n';

    // Common blockers
    if (step.common_blockers.length > 0) {
      formatted += `**Common Blockers & Solutions**:\n`;
      step.common_blockers.forEach(blocker => {
        formatted += `⚠️ ${blocker}\n`;
      });
      formatted += '\n';
    }

    // Context-specific tips
    if (guidance.context_specific_tips.length > 0) {
      formatted += `**💡 Tips for Success**:\n`;
      guidance.context_specific_tips.forEach(tip => {
        formatted += `• ${tip}\n`;
      });
      formatted += '\n';
    }

    // Time estimate
    formatted += `**⏱️ Estimated Time**: ${step.time_estimate}\n\n`;

    // Next step preview
    if (guidance.next_step_preview) {
      const next = guidance.next_step_preview;
      formatted += `## Next Step Preview: Step ${next.number} - ${next.name}\n`;
      formatted += `${next.description}\n\n`;
      
      if (next.dependencies.length > 0) {
        formatted += `**Preparation Needed**:\n`;
        next.dependencies.forEach(dep => {
          formatted += `- ${dep}\n`;
        });
      }
    } else {
      formatted += `## 🎉 Final Step Complete!\n`;
      formatted += `You've completed all 8 steps of the ROME protocol. Great work!\n`;
    }

    formatted += '\n---\n';
    formatted += `**Remember**: Each step builds on the previous ones. Don't skip ahead until current step is complete.\n`;

    return formatted;
  }
}