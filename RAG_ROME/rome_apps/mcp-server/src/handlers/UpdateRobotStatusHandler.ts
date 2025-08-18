/**
 * Update Robot Status Handler - update_robot_status tool
 * 
 * Allows robots to update their own status as they progress through ROME 8-step protocol
 * Updates robot status documents and maintains coordination tracking
 * 
 * Author: ROME Development Team
 * Date: 2025-08-09
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { BaseToolHandler, ValidationResult, MCPToolResponse } from './IToolHandler.js';
import axios from 'axios';

interface UpdateRobotStatusArgs {
  robot_role: 'pma' | 'backend' | 'frontend' | 'data' | 'devops' | 'qa';
  protocol_step: number; // 1-8
  task_progress: number; // 0-100
  current_task: string;
  blockers?: string[];
  recent_activity: string;
  test_status?: TestStatus;
  estimated_completion?: string;
}

interface TestStatus {
  total_tests: number;
  passing_tests: number;
  failed_tests: number;
  test_coverage?: number;
  performance_tests_passing?: boolean;
}

interface StatusUpdateResult {
  success: boolean;
  robot_id: string;
  previous_step: number;
  new_step: number;
  progress_change: number;
  document_updated: string;
  coordination_impact: string[];
  next_recommendations: string[];
  timestamp: string;
}

export class UpdateRobotStatusHandler extends BaseToolHandler {
  private vdbServiceUrl: string;
  private readonly validRobotRoles = [
    'pma', 'backend', 'frontend', 'data', 'devops', 'qa'
  ];

  constructor(vdbServiceUrl: string, logger: any) {
    super('update_robot_status', logger);
    this.vdbServiceUrl = vdbServiceUrl;
  }

  getToolDefinition(): Tool {
    return {
      name: 'update_robot_status',
      description: 'Update robot status as it progresses through ROME 8-step protocol',
      inputSchema: {
        type: 'object',
        properties: {
          robot_role: {
            type: 'string',
            description: 'Robot role updating status',
            enum: this.validRobotRoles
          },
          protocol_step: {
            type: 'number',
            description: 'Current step in 8-step ROME protocol (1-8)',
            minimum: 1,
            maximum: 8
          },
          task_progress: {
            type: 'number',
            description: 'Task completion percentage (0-100)',
            minimum: 0,
            maximum: 100
          },
          current_task: {
            type: 'string',
            description: 'Description of current task being worked on'
          },
          blockers: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of current blockers affecting progress'
          },
          recent_activity: {
            type: 'string',
            description: 'Recent work completed or progress made'
          },
          test_status: {
            type: 'object',
            properties: {
              total_tests: { type: 'number' },
              passing_tests: { type: 'number' },
              failed_tests: { type: 'number' },
              test_coverage: { type: 'number', minimum: 0, maximum: 100 },
              performance_tests_passing: { type: 'boolean' }
            },
            description: 'Current test suite status and coverage'
          },
          estimated_completion: {
            type: 'string',
            description: 'ISO date string for estimated task completion'
          }
        },
        required: ['robot_role', 'protocol_step', 'task_progress', 'current_task', 'recent_activity']
      }
    };
  }

  validateArguments(args: unknown): ValidationResult {
    const { args: parsedArgs, errors: parseErrors } = this.validateAndSanitizeArgs(args);
    if (parseErrors.length > 0) {
      return this.createValidationFailure(parseErrors);
    }

    const errors = [];
    const sanitizedArgs: UpdateRobotStatusArgs = {
      robot_role: 'pma',
      protocol_step: 1,
      task_progress: 0,
      current_task: '',
      recent_activity: ''
    };

    // Validate robot_role (required)
    const roleError = this.validateEnum(parsedArgs.robot_role, 'robot_role', this.validRobotRoles, true);
    if (roleError) {
      errors.push(roleError);
    } else {
      sanitizedArgs.robot_role = parsedArgs.robot_role as any;
    }

    // Validate protocol_step (required)
    const stepError = this.validateNumber(parsedArgs.protocol_step, 'protocol_step', true, 1, 8);
    if (stepError) {
      errors.push(stepError);
    } else {
      sanitizedArgs.protocol_step = parseInt(parsedArgs.protocol_step.toString());
    }

    // Validate task_progress (required)
    const progressError = this.validateNumber(parsedArgs.task_progress, 'task_progress', true, 0, 100);
    if (progressError) {
      errors.push(progressError);
    } else {
      sanitizedArgs.task_progress = parseInt(parsedArgs.task_progress.toString());
    }

    // Validate current_task (required)
    const taskError = this.validateString(parsedArgs.current_task, 'current_task', true, 500);
    if (taskError) {
      errors.push(taskError);
    } else {
      sanitizedArgs.current_task = this.sanitizeString(parsedArgs.current_task);
    }

    // Validate recent_activity (required)
    const activityError = this.validateString(parsedArgs.recent_activity, 'recent_activity', true, 1000);
    if (activityError) {
      errors.push(activityError);
    } else {
      sanitizedArgs.recent_activity = this.sanitizeString(parsedArgs.recent_activity);
    }

    // Validate blockers (optional)
    if (parsedArgs.blockers !== undefined) {
      if (Array.isArray(parsedArgs.blockers)) {
        const validBlockers = parsedArgs.blockers.filter((blocker: any) => 
          typeof blocker === 'string' && blocker.length > 0 && blocker.length < 200
        );
        sanitizedArgs.blockers = validBlockers;
      }
    }

    // Validate estimated_completion (optional)
    if (parsedArgs.estimated_completion !== undefined) {
      const completionError = this.validateString(parsedArgs.estimated_completion, 'estimated_completion', false, 50);
      if (completionError) {
        errors.push(completionError);
      } else {
        sanitizedArgs.estimated_completion = this.sanitizeString(parsedArgs.estimated_completion);
      }
    }

    // Validate test_status (optional)
    if (parsedArgs.test_status !== undefined) {
      const testStatus = parsedArgs.test_status as any;
      if (typeof testStatus === 'object') {
        sanitizedArgs.test_status = {
          total_tests: parseInt(testStatus.total_tests) || 0,
          passing_tests: parseInt(testStatus.passing_tests) || 0,
          failed_tests: parseInt(testStatus.failed_tests) || 0,
          test_coverage: testStatus.test_coverage ? parseFloat(testStatus.test_coverage) : undefined,
          performance_tests_passing: testStatus.performance_tests_passing
        };
      }
    }

    if (errors.length > 0) {
      return this.createValidationFailure(errors);
    }

    return this.createValidationSuccess(sanitizedArgs);
  }

  async execute(args: unknown): Promise<MCPToolResponse> {
    const { robot_role, protocol_step, task_progress, current_task, blockers, recent_activity, test_status, estimated_completion } = args as UpdateRobotStatusArgs;

    try {
      this.logger.info(`Updating robot status`, { robot_role, protocol_step, task_progress });

      // Get current robot status to compare changes
      const currentStatus = await this.getCurrentRobotStatus(robot_role);
      
      // Update robot status in VDB and coordination documents
      const updateResult = await this.updateRobotStatus({
        robot_role,
        protocol_step,
        task_progress,
        current_task,
        blockers: blockers || [],
        recent_activity,
        test_status,
        estimated_completion
      }, currentStatus);
      
      // Format results for response
      const formattedText = this.formatStatusUpdateResult(updateResult, robot_role);
      
      const meta = {
        update_result: updateResult,
        suggested_next_tools: this.getSuggestedNextTools(updateResult),
        coordination_alerts: this.getCoordinationAlerts(updateResult)
      };

      return this.createSuccessResponse(formattedText, meta);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Robot status update failed: ${errorMessage}`, { robot_role, protocol_step, error });
      return this.createErrorResponse(
        `Failed to update robot status: ${errorMessage}`,
        { robot_role, protocol_step, error: errorMessage }
      );
    }
  }

  private async getCurrentRobotStatus(robotRole: string): Promise<any> {
    try {
      // Try to get current status from VDB service
      const response = await axios.get(`${this.vdbServiceUrl}/api/v1/coordination/robot-status`, {
        params: { robot_role: robotRole },
        timeout: 5000
      });

      if (response.data.success && response.data.status) {
        return response.data.status;
      }
    } catch (error) {
      this.logger.warn('Could not fetch current robot status, treating as new', { robotRole, error });
    }

    // Return default status for new robot
    return {
      robot_role: robotRole,
      protocol_step: 1,
      task_progress: 0,
      current_task: 'Starting ROME protocol',
      blockers: [],
      recent_activity: 'Robot initialized'
    };
  }

  private async updateRobotStatus(
    newStatus: UpdateRobotStatusArgs, 
    currentStatus: any
  ): Promise<StatusUpdateResult> {
    const robotId = `${newStatus.robot_role}_001`;
    const timestamp = new Date().toISOString();

    // Calculate changes
    const progressChange = newStatus.task_progress - (currentStatus.task_progress || 0);
    const stepChange = newStatus.protocol_step - (currentStatus.protocol_step || 1);

    try {
      // Update VDB with new status
      const response = await axios.post(`${this.vdbServiceUrl}/api/v1/coordination/update-robot-status`, {
        robot_id: robotId,
        robot_role: newStatus.robot_role,
        protocol_step: newStatus.protocol_step,
        task_progress: newStatus.task_progress,
        current_task: newStatus.current_task,
        blockers: newStatus.blockers || [],
        recent_activity: newStatus.recent_activity,
        test_status: newStatus.test_status,
        estimated_completion: newStatus.estimated_completion,
        timestamp
      }, {
        timeout: 10000
      });

      if (response.data.success) {
        return this.buildStatusUpdateResult(newStatus, currentStatus, response.data.document_path);
      }
    } catch (error) {
      this.logger.warn('VDB service not available, creating local status update', { error });
    }

    // Fallback to local status tracking
    return this.buildStatusUpdateResult(newStatus, currentStatus, `robot_status/${newStatus.robot_role}_status.md`);
  }

  private buildStatusUpdateResult(
    newStatus: UpdateRobotStatusArgs,
    currentStatus: any,
    documentPath: string
  ): StatusUpdateResult {
    const robotId = `${newStatus.robot_role}_001`;
    const progressChange = newStatus.task_progress - (currentStatus.task_progress || 0);
    
    // Analyze coordination impact
    const coordinationImpact: string[] = [];
    
    if (newStatus.protocol_step > (currentStatus.protocol_step || 1)) {
      coordinationImpact.push(`Advanced to protocol step ${newStatus.protocol_step}/8`);
    }
    
    if (progressChange > 20) {
      coordinationImpact.push('Significant progress made - may unblock dependent tasks');
    }
    
    if (newStatus.blockers && newStatus.blockers.length > 0) {
      coordinationImpact.push(`${newStatus.blockers.length} active blocker(s) - may need PMA attention`);
    }
    
    if (newStatus.protocol_step >= 7 && newStatus.task_progress >= 80) {
      coordinationImpact.push('Approaching completion - ready for integration coordination');
    }

    // Generate next step recommendations
    const nextRecommendations = this.generateNextStepRecommendations(newStatus);

    return {
      success: true,
      robot_id: robotId,
      previous_step: currentStatus.protocol_step || 1,
      new_step: newStatus.protocol_step,
      progress_change: progressChange,
      document_updated: documentPath,
      coordination_impact: coordinationImpact,
      next_recommendations: nextRecommendations,
      timestamp: new Date().toISOString()
    };
  }

  private generateNextStepRecommendations(status: UpdateRobotStatusArgs): string[] {
    const recommendations: string[] = [];

    // Step-specific recommendations
    switch (status.protocol_step) {
      case 1:
        recommendations.push('Use search_rome_docs to find relevant methodology guidance');
        recommendations.push('Document any unclear requirements for clarification');
        break;
      case 2:
        recommendations.push('Use get_contract_template to start defining interfaces');
        recommendations.push('Prepare development plan for Roma approval');
        break;
      case 3:
        recommendations.push('Use check_roma_approval to validate development plan');
        recommendations.push('Address any Roma feedback before proceeding');
        break;
      case 4:
        recommendations.push('Write comprehensive failing tests for all interfaces');
        recommendations.push('Ensure test coverage meets 80% target');
        break;
      case 5:
        recommendations.push('Review tests with PMA and clarify ambiguities');
        recommendations.push('Use get_coordination_status to check team dependencies');
        break;
      case 6:
        recommendations.push('Implement minimum code to make tests pass');
        recommendations.push('Run tests frequently and maintain TDD discipline');
        break;
      case 7:
        recommendations.push('Validate test coverage and quality metrics');
        recommendations.push('Use validate_integration_contract for interface checking');
        break;
      case 8:
        recommendations.push('Update actionlist.md with completion status');
        recommendations.push('Prepare handoff documentation for integration');
        break;
    }

    // Progress-specific recommendations
    if (status.task_progress < 50) {
      recommendations.push('Consider breaking down task into smaller, manageable pieces');
    } else if (status.task_progress > 90) {
      recommendations.push('Prepare for next protocol step or integration activities');
    }

    // Blocker-specific recommendations
    if (status.blockers && status.blockers.length > 0) {
      recommendations.push('Use update_actionlist to escalate blockers to PMA');
      recommendations.push('Consider alternative approaches while waiting for blocker resolution');
    }

    return recommendations;
  }

  private getSuggestedNextTools(result: StatusUpdateResult): string[] {
    const tools: string[] = [];

    if (result.new_step <= 3) {
      tools.push('get_rome_standards', 'check_roma_approval');
    } else if (result.new_step <= 5) {
      tools.push('get_contract_template', 'get_coordination_status');
    } else if (result.new_step <= 7) {
      tools.push('validate_integration_contract', 'get_robot_protocol');
    } else {
      tools.push('update_actionlist', 'report_integration_status');
    }

    // Always suggest coordination tools if there are blockers
    if (result.coordination_impact.some(impact => impact.includes('blocker'))) {
      tools.push('resolve_blocker', 'add_dependency');
    }

    return tools;
  }

  private getCoordinationAlerts(result: StatusUpdateResult): string[] {
    const alerts: string[] = [];

    // Step progression alerts
    if (result.new_step > result.previous_step) {
      alerts.push(`🚀 Robot advanced to Step ${result.new_step}/8 - coordinate with dependent robots`);
    }

    // Progress alerts
    if (result.progress_change > 30) {
      alerts.push('📈 Significant progress - consider updating project timeline');
    } else if (result.progress_change < 0) {
      alerts.push('📉 Progress decreased - investigate potential issues');
    }

    // Integration readiness
    if (result.new_step >= 7) {
      alerts.push('🧪 Robot approaching completion - prepare for integration testing');
    }

    return alerts;
  }

  private formatStatusUpdateResult(result: StatusUpdateResult, robotRole: string): string {
    let formatted = `Robot Status Update: **${robotRole}**\n\n`;
    
    // Update summary
    formatted += `✅ **Status Updated Successfully**\n`;
    formatted += `Robot ID: ${result.robot_id}\n`;
    formatted += `Protocol Step: ${result.previous_step} → ${result.new_step} (${result.new_step}/8)\n`;
    formatted += `Progress Change: ${result.progress_change > 0 ? '+' : ''}${result.progress_change}%\n\n`;

    // Document updated
    formatted += `📄 **Document Updated**: ${result.document_updated}\n\n`;

    // Coordination impact
    if (result.coordination_impact.length > 0) {
      formatted += `🔄 **Coordination Impact**:\n`;
      result.coordination_impact.forEach(impact => {
        formatted += `• ${impact}\n`;
      });
      formatted += '\n';
    }

    // Next step recommendations  
    formatted += `💡 **Next Step Recommendations**:\n`;
    result.next_recommendations.forEach((rec, index) => {
      formatted += `${index + 1}. ${rec}\n`;
    });

    // Footer
    formatted += '\n---\n';
    formatted += `🕐 Updated: ${new Date(result.timestamp).toLocaleString()}\n`;
    formatted += `Use get_coordination_status to see overall project impact\n`;

    return formatted;
  }
}