/**
 * Roma Approval Handler - check_roma_approval tool
 * 
 * Validates development plans against ROME standards for Roma approval
 * Provides detailed compliance analysis and approval recommendations
 * 
 * Author: ROME Development Team
 * Date: 2025-08-09
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { BaseToolHandler, ValidationResult, MCPToolResponse } from './IToolHandler.js';
import axios from 'axios';

interface CheckRomaApprovalArgs {
  development_plan: string;
  module_type?: 'api' | 'database' | 'frontend' | 'service' | 'integration';
  robot_role?: 'pma' | 'backend' | 'frontend' | 'data' | 'devops' | 'qa';
  project_context?: string;
}

interface ApprovalResult {
  approval_status: 'approved' | 'conditional' | 'rejected';
  compliance_score: number;
  requirements_met: ComplianceCheck[];
  required_changes: string[];
  roma_feedback: string;
  next_steps: string[];
  approval_timestamp?: string;
}

interface ComplianceCheck {
  requirement: string;
  status: 'met' | 'partial' | 'missing';
  details: string;
  weight: number;
}

export class CheckRomaApprovalHandler extends BaseToolHandler {
  private vdbServiceUrl: string;
  private readonly validModuleTypes = [
    'api', 'database', 'frontend', 'service', 'integration'
  ];
  private readonly validRobotRoles = [
    'pma', 'backend', 'frontend', 'data', 'devops', 'qa'
  ];

  constructor(vdbServiceUrl: string, logger: any) {
    super('check_roma_approval', logger);
    this.vdbServiceUrl = vdbServiceUrl;
  }

  getToolDefinition(): Tool {
    return {
      name: 'check_roma_approval',
      description: 'Validate development plans against ROME standards for Roma approval',
      inputSchema: {
        type: 'object',
        properties: {
          development_plan: {
            type: 'string',
            description: 'Development plan in markdown format to validate against ROME standards'
          },
          module_type: {
            type: 'string',
            description: 'Type of module being developed',
            enum: this.validModuleTypes
          },
          robot_role: {
            type: 'string',
            description: 'Robot role requesting approval',
            enum: this.validRobotRoles
          },
          project_context: {
            type: 'string',
            description: 'Additional project context for approval consideration'
          }
        },
        required: ['development_plan']
      }
    };
  }

  validateArguments(args: unknown): ValidationResult {
    const { args: parsedArgs, errors: parseErrors } = this.validateAndSanitizeArgs(args);
    if (parseErrors.length > 0) {
      return this.createValidationFailure(parseErrors);
    }

    const errors = [];
    const sanitizedArgs: CheckRomaApprovalArgs = { development_plan: '' };

    // Validate development_plan (required)
    const planError = this.validateString(parsedArgs.development_plan, 'development_plan', true, 10000);
    if (planError) {
      errors.push(planError);
    } else {
      sanitizedArgs.development_plan = this.sanitizeString(parsedArgs.development_plan);
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

    // Validate robot_role (optional)
    if (parsedArgs.robot_role !== undefined) {
      const roleError = this.validateEnum(parsedArgs.robot_role, 'robot_role', this.validRobotRoles, false);
      if (roleError) {
        errors.push(roleError);
      } else {
        sanitizedArgs.robot_role = parsedArgs.robot_role as any;
      }
    }

    // Validate project_context (optional)
    if (parsedArgs.project_context !== undefined) {
      const contextError = this.validateString(parsedArgs.project_context, 'project_context', false, 2000);
      if (contextError) {
        errors.push(contextError);
      } else {
        sanitizedArgs.project_context = this.sanitizeString(parsedArgs.project_context);
      }
    }

    if (errors.length > 0) {
      return this.createValidationFailure(errors);
    }

    return this.createValidationSuccess(sanitizedArgs);
  }

  async execute(args: unknown): Promise<MCPToolResponse> {
    const { development_plan, module_type, robot_role, project_context } = args as CheckRomaApprovalArgs;

    try {
      this.logger.info(`Checking Roma approval for development plan`, { module_type, robot_role });

      // Perform comprehensive approval validation
      const approvalResult = await this.validateDevelopmentPlan(
        development_plan,
        module_type,
        robot_role,
        project_context
      );
      
      // Format results for response
      const formattedText = this.formatApprovalResult(approvalResult, robot_role);
      
      const meta = {
        approval_result: approvalResult,
        suggested_next_tools: this.getSuggestedNextTools(approvalResult)
      };

      return this.createSuccessResponse(formattedText, meta);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Roma approval validation failed: ${errorMessage}`, { module_type, robot_role, error });
      return this.createErrorResponse(
        `Roma approval validation failed: ${errorMessage}`,
        { module_type, robot_role, error: errorMessage }
      );
    }
  }

  private async validateDevelopmentPlan(
    plan: string,
    module_type?: string,
    robot_role?: string,
    context?: string
  ): Promise<ApprovalResult> {
    // Perform comprehensive validation against ROME standards
    const checks = await this.performComplianceChecks(plan, module_type, robot_role, context);
    
    // Calculate compliance score
    const totalWeight = checks.reduce((sum, check) => sum + check.weight, 0);
    const metPoints = checks.reduce((sum, check) => {
      const points = check.status === 'met' ? check.weight : 
                    check.status === 'partial' ? check.weight * 0.5 : 0;
      return sum + points;
    }, 0);
    const compliance_score = Math.round((metPoints / totalWeight) * 100);

    // Determine approval status
    let approval_status: 'approved' | 'conditional' | 'rejected';
    if (compliance_score >= 90) {
      approval_status = 'approved';
    } else if (compliance_score >= 70) {
      approval_status = 'conditional';
    } else {
      approval_status = 'rejected';
    }

    // Generate required changes
    const required_changes = checks
      .filter(check => check.status !== 'met')
      .map(check => this.generateChangeRecommendation(check));

    // Generate Roma feedback
    const roma_feedback = this.generateRomaFeedback(
      checks,
      compliance_score,
      approval_status,
      robot_role
    );

    // Generate next steps
    const next_steps = this.generateNextSteps(approval_status, required_changes);

    return {
      approval_status,
      compliance_score,
      requirements_met: checks,
      required_changes,
      roma_feedback,
      next_steps,
      approval_timestamp: new Date().toISOString()
    };
  }

  private async performComplianceChecks(
    plan: string,
    module_type?: string,
    robot_role?: string,
    context?: string
  ): Promise<ComplianceCheck[]> {
    const checks: ComplianceCheck[] = [];
    const planLower = plan.toLowerCase();

    // Core TDD-ROME Compliance Checks
    checks.push({
      requirement: 'TDD Approach Specified',
      status: this.checkTDDApproach(planLower),
      details: 'Development plan must explicitly mention test-first or TDD approach',
      weight: 20
    });

    checks.push({
      requirement: 'Contract Interfaces Defined',
      status: this.checkContractInterfaces(planLower),
      details: 'Plan must include contract definitions or interface specifications',
      weight: 25
    });

    checks.push({
      requirement: '8-Step Protocol Adherence',
      status: this.checkProtocolSteps(planLower),
      details: 'Plan should reference ROME 8-step protocol or show step-by-step approach',
      weight: 15
    });

    checks.push({
      requirement: 'Integration Strategy',
      status: this.checkIntegrationStrategy(planLower),
      details: 'Plan must address how module will integrate with other components',
      weight: 15
    });

    checks.push({
      requirement: 'Quality Gates Defined',
      status: this.checkQualityGates(planLower),
      details: 'Plan must specify acceptance criteria, test coverage, or quality metrics',
      weight: 10
    });

    checks.push({
      requirement: 'Error Handling Strategy',
      status: this.checkErrorHandling(planLower),
      details: 'Plan should address error scenarios and failure handling',
      weight: 10
    });

    checks.push({
      requirement: 'Documentation Plan',
      status: this.checkDocumentationPlan(planLower),
      details: 'Plan should mention documentation or API documentation generation',
      weight: 5
    });

    // Module-specific checks
    if (module_type) {
      checks.push(...this.getModuleSpecificChecks(plan, module_type));
    }

    // Robot-specific checks
    if (robot_role) {
      checks.push(...this.getRobotSpecificChecks(plan, robot_role));
    }

    return checks;
  }

  private checkTDDApproach(planLower: string): 'met' | 'partial' | 'missing' {
    const tddKeywords = ['tdd', 'test-driven', 'test first', 'failing test', 'red-green-refactor'];
    const strongIndicators = tddKeywords.filter(keyword => planLower.includes(keyword));
    
    if (strongIndicators.length >= 2) return 'met';
    if (strongIndicators.length === 1) return 'partial';
    return 'missing';
  }

  private checkContractInterfaces(planLower: string): 'met' | 'partial' | 'missing' {
    const contractKeywords = ['contract', 'interface', 'api spec', 'schema', 'endpoint'];
    const designKeywords = ['design', 'specification', 'definition'];
    
    const contractCount = contractKeywords.filter(keyword => planLower.includes(keyword)).length;
    const designCount = designKeywords.filter(keyword => planLower.includes(keyword)).length;
    
    if (contractCount >= 2) return 'met';
    if (contractCount >= 1 || designCount >= 2) return 'partial';
    return 'missing';
  }

  private checkProtocolSteps(planLower: string): 'met' | 'partial' | 'missing' {
    const stepKeywords = ['step', 'phase', 'stage', 'protocol'];
    const processKeywords = ['analyze', 'implement', 'test', 'validate'];
    
    const stepCount = stepKeywords.filter(keyword => planLower.includes(keyword)).length;
    const processCount = processKeywords.filter(keyword => planLower.includes(keyword)).length;
    
    if (stepCount >= 2 && processCount >= 3) return 'met';
    if (stepCount >= 1 || processCount >= 2) return 'partial';
    return 'missing';
  }

  private checkIntegrationStrategy(planLower: string): 'met' | 'partial' | 'missing' {
    const integrationKeywords = ['integration', 'connect', 'dependency', 'interface', 'communicate'];
    const strategyCount = integrationKeywords.filter(keyword => planLower.includes(keyword)).length;
    
    if (strategyCount >= 2) return 'met';
    if (strategyCount === 1) return 'partial';
    return 'missing';
  }

  private checkQualityGates(planLower: string): 'met' | 'partial' | 'missing' {
    const qualityKeywords = ['acceptance', 'criteria', 'coverage', 'quality', 'performance', 'metric'];
    const qualityCount = qualityKeywords.filter(keyword => planLower.includes(keyword)).length;
    
    if (qualityCount >= 3) return 'met';
    if (qualityCount >= 1) return 'partial';
    return 'missing';
  }

  private checkErrorHandling(planLower: string): 'met' | 'partial' | 'missing' {
    const errorKeywords = ['error', 'exception', 'failure', 'fallback', 'retry', 'timeout'];
    const errorCount = errorKeywords.filter(keyword => planLower.includes(keyword)).length;
    
    if (errorCount >= 2) return 'met';
    if (errorCount === 1) return 'partial';
    return 'missing';
  }

  private checkDocumentationPlan(planLower: string): 'met' | 'partial' | 'missing' {
    const docKeywords = ['documentation', 'document', 'readme', 'api doc', 'comment'];
    const docCount = docKeywords.filter(keyword => planLower.includes(keyword)).length;
    
    if (docCount >= 2) return 'met';
    if (docCount === 1) return 'partial';
    return 'missing';
  }

  private getModuleSpecificChecks(plan: string, module_type: string): ComplianceCheck[] {
    const planLower = plan.toLowerCase();
    const checks: ComplianceCheck[] = [];

    switch (module_type) {
      case 'api':
        checks.push({
          requirement: 'HTTP Status Codes Specified',
          status: planLower.includes('status') || planLower.includes('http') ? 'met' : 'missing',
          details: 'API plans should specify proper HTTP status codes',
          weight: 8
        });
        checks.push({
          requirement: 'Request/Response Validation',
          status: planLower.includes('validation') || planLower.includes('schema') ? 'met' : 'missing',
          details: 'API plans must include input/output validation strategy',
          weight: 12
        });
        break;

      case 'database':
        checks.push({
          requirement: 'Schema Migration Strategy',
          status: planLower.includes('migration') || planLower.includes('schema') ? 'met' : 'missing',
          details: 'Database plans must include schema migration approach',
          weight: 15
        });
        checks.push({
          requirement: 'Data Integrity Measures',
          status: planLower.includes('constraint') || planLower.includes('integrity') ? 'met' : 'missing',
          details: 'Database plans should address data integrity and constraints',
          weight: 10
        });
        break;

      case 'frontend':
        checks.push({
          requirement: 'State Management Strategy',
          status: planLower.includes('state') || planLower.includes('management') ? 'met' : 'missing',
          details: 'Frontend plans should specify state management approach',
          weight: 12
        });
        checks.push({
          requirement: 'User Experience Considerations',
          status: planLower.includes('user') || planLower.includes('ux') || planLower.includes('ui') ? 'met' : 'missing',
          details: 'Frontend plans should address user experience',
          weight: 8
        });
        break;

      case 'service':
        checks.push({
          requirement: 'Service Health Monitoring',
          status: planLower.includes('health') || planLower.includes('monitoring') ? 'met' : 'missing',
          details: 'Service plans should include health check and monitoring',
          weight: 10
        });
        break;

      case 'integration':
        checks.push({
          requirement: 'Circuit Breaker Pattern',
          status: planLower.includes('circuit') || planLower.includes('fallback') ? 'met' : 'missing',
          details: 'Integration plans should address failure handling patterns',
          weight: 12
        });
        break;
    }

    return checks;
  }

  private getRobotSpecificChecks(plan: string, robot_role: string): ComplianceCheck[] {
    const planLower = plan.toLowerCase();
    const checks: ComplianceCheck[] = [];

    switch (robot_role) {
      case 'backend':
        checks.push({
          requirement: 'API Security Considerations',
          status: planLower.includes('security') || planLower.includes('auth') ? 'met' : 'missing',
          details: 'Backend plans should address security and authentication',
          weight: 10
        });
        break;

      case 'frontend':
        checks.push({
          requirement: 'Accessibility Compliance',
          status: planLower.includes('accessibility') || planLower.includes('a11y') ? 'partial' : 'missing',
          details: 'Frontend plans should consider accessibility requirements',
          weight: 8
        });
        break;

      case 'data':
        checks.push({
          requirement: 'Data Privacy Compliance',
          status: planLower.includes('privacy') || planLower.includes('gdpr') ? 'met' : 'missing',
          details: 'Data plans should address privacy and compliance requirements',
          weight: 12
        });
        break;

      case 'devops':
        checks.push({
          requirement: 'Deployment Strategy',
          status: planLower.includes('deploy') || planLower.includes('ci/cd') ? 'met' : 'missing',
          details: 'DevOps plans should include deployment and CI/CD considerations',
          weight: 15
        });
        break;
    }

    return checks;
  }

  private generateChangeRecommendation(check: ComplianceCheck): string {
    const requirement = check.requirement;
    const status = check.status;

    if (status === 'missing') {
      return `Add ${requirement.toLowerCase()} to development plan - ${check.details}`;
    } else if (status === 'partial') {
      return `Expand ${requirement.toLowerCase()} details - ${check.details}`;
    }
    return `Improve ${requirement.toLowerCase()} specification`;
  }

  private generateRomaFeedback(
    checks: ComplianceCheck[],
    score: number,
    status: string,
    robot_role?: string
  ): string {
    let feedback = '';

    if (status === 'approved') {
      feedback = `✅ **APPROVED** - Development plan meets ROME standards with ${score}% compliance.\n\n`;
      feedback += `Excellent adherence to TDD-ROME methodology. `;
      if (robot_role) {
        feedback += `Your ${robot_role} robot role shows good understanding of domain-specific requirements. `;
      }
      feedback += `You may proceed with implementation following the 8-step protocol.`;
    } else if (status === 'conditional') {
      feedback = `⚠️ **CONDITIONAL APPROVAL** - Development plan shows good foundation but needs refinement (${score}% compliance).\n\n`;
      feedback += `Your plan demonstrates understanding of ROME methodology but requires improvements in key areas. `;
      
      const missingChecks = checks.filter(c => c.status === 'missing');
      if (missingChecks.length > 0) {
        feedback += `Focus on addressing: ${missingChecks.map(c => c.requirement.toLowerCase()).join(', ')}. `;
      }
      
      feedback += `Address the required changes and resubmit for final approval.`;
    } else {
      feedback = `❌ **REJECTED** - Development plan requires significant revision (${score}% compliance).\n\n`;
      feedback += `The plan needs substantial improvements to meet ROME standards. `;
      
      const criticalIssues = checks.filter(c => c.status === 'missing' && c.weight >= 15);
      if (criticalIssues.length > 0) {
        feedback += `Critical gaps: ${criticalIssues.map(c => c.requirement.toLowerCase()).join(', ')}. `;
      }
      
      feedback += `Please review ROME methodology documentation and revise your approach before resubmitting.`;
    }

    return feedback;
  }

  private generateNextSteps(status: string, changes: string[]): string[] {
    const steps: string[] = [];

    if (status === 'approved') {
      steps.push('Begin TDD implementation using get_robot_protocol');
      steps.push('Create contract tests using get_contract_template');
      steps.push('Update actionlist.md with approved plan');
      steps.push('Start with Step 4: Test-First implementation');
    } else if (status === 'conditional') {
      steps.push('Address the required changes listed above');
      steps.push('Use get_rome_standards for detailed requirements');
      steps.push('Resubmit plan for final Roma approval');
      steps.push('Consider consulting with PMA if clarification needed');
    } else {
      steps.push('Review ROME methodology using search_rome_docs');
      steps.push('Study similar approved plans for reference');
      steps.push('Use get_rome_standards for detailed requirements');
      steps.push('Completely revise plan before resubmission');
      steps.push('Consider pair planning with experienced team member');
    }

    return steps;
  }

  private getSuggestedNextTools(result: ApprovalResult): string[] {
    const tools: string[] = [];

    if (result.approval_status === 'approved') {
      tools.push('get_robot_protocol', 'get_contract_template');
    } else {
      tools.push('get_rome_standards', 'search_rome_docs');
      
      if (result.approval_status === 'conditional') {
        tools.push('get_contract_template');
      }
    }

    return tools;
  }

  private formatApprovalResult(result: ApprovalResult, robot_role?: string): string {
    let formatted = `Roma Approval Result\n\n`;

    // Status and score
    const statusIcon = result.approval_status === 'approved' ? '✅' : 
                      result.approval_status === 'conditional' ? '⚠️' : '❌';
    formatted += `${statusIcon} **Status**: ${result.approval_status.toUpperCase()}\n`;
    formatted += `📊 **Compliance Score**: ${result.compliance_score}%\n\n`;

    // Roma feedback
    formatted += `**Roma Feedback**:\n${result.roma_feedback}\n\n`;

    // Requirements analysis
    formatted += `**Requirements Analysis** (${result.requirements_met.length} checks):\n\n`;
    result.requirements_met.forEach(check => {
      const icon = check.status === 'met' ? '✅' : check.status === 'partial' ? '🟡' : '❌';
      formatted += `${icon} **${check.requirement}** (Weight: ${check.weight})\n`;
      formatted += `   ${check.details}\n\n`;
    });

    // Required changes
    if (result.required_changes.length > 0) {
      formatted += `**Required Changes** (${result.required_changes.length}):\n\n`;
      result.required_changes.forEach((change, index) => {
        formatted += `${index + 1}. ${change}\n`;
      });
      formatted += '\n';
    }

    // Next steps
    formatted += `**Next Steps**:\n`;
    result.next_steps.forEach((step, index) => {
      formatted += `${index + 1}. ${step}\n`;
    });

    // Footer
    formatted += '\n---\n';
    if (result.approval_status === 'approved') {
      formatted += `🎉 Congratulations! Your development plan is approved. Begin implementation immediately.\n`;
    } else {
      formatted += `💪 Revise your plan and resubmit. Roma is here to ensure ROME methodology excellence.\n`;
    }

    return formatted;
  }
}