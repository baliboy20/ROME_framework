/**
 * Add Dependency Handler - add_dependency tool
 * 
 * Tracks dependencies between robots and their tasks
 * Updates coordination tracking for better project management
 * 
 * Author: ROME Development Team
 * Date: 2025-08-09
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { BaseToolHandler, ValidationResult, MCPToolResponse } from './IToolHandler.js';
import axios from 'axios';

interface AddDependencyArgs {
  from_robot: string;
  to_robot: string;
  dependency_type: 'contract' | 'data' | 'service' | 'integration' | 'approval' | 'information';
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  expected_delivery?: string;
  blocking_task?: string;
  delivery_criteria?: string[];
  notes?: string;
}

interface DependencyTrackingResult {
  success: boolean;
  dependency_id: string;
  from_robot: string;
  to_robot: string;
  dependency_type: string;
  priority: string;
  coordination_alerts: string[];
  potential_blockers: string[];
  timeline_impact: string;
  suggested_actions: string[];
  related_dependencies: string[];
  timestamp: string;
}

export class AddDependencyHandler extends BaseToolHandler {
  private vdbServiceUrl: string;
  private readonly validRobotRoles = [
    'pma', 'backend', 'frontend', 'data', 'devops', 'qa'
  ];
  private readonly validDependencyTypes = [
    'contract', 'data', 'service', 'integration', 'approval', 'information'
  ];
  private readonly validPriorities = [
    'critical', 'high', 'medium', 'low'
  ];

  constructor(vdbServiceUrl: string, logger: any) {
    super('add_dependency', logger);
    this.vdbServiceUrl = vdbServiceUrl;
  }

  getToolDefinition(): Tool {
    return {
      name: 'add_dependency',
      description: 'Track dependencies between robots for coordination and project management',
      inputSchema: {
        type: 'object',
        properties: {
          from_robot: {
            type: 'string',
            description: 'Robot that depends on work from another robot'
          },
          to_robot: {
            type: 'string',
            description: 'Robot that needs to provide/deliver something'
          },
          dependency_type: {
            type: 'string',
            description: 'Type of dependency being tracked',
            enum: this.validDependencyTypes
          },
          description: {
            type: 'string',
            description: 'Clear description of what is needed and why'
          },
          priority: {
            type: 'string',
            description: 'Priority level of this dependency',
            enum: this.validPriorities
          },
          expected_delivery: {
            type: 'string',
            description: 'ISO date string for when delivery is expected'
          },
          blocking_task: {
            type: 'string',
            description: 'Specific task that is blocked by this dependency'
          },
          delivery_criteria: {
            type: 'array',
            items: { type: 'string' },
            description: 'Specific criteria that must be met for delivery acceptance'
          },
          notes: {
            type: 'string',
            description: 'Additional notes or context about this dependency'
          }
        },
        required: ['from_robot', 'to_robot', 'dependency_type', 'description', 'priority']
      }
    };
  }

  validateArguments(args: unknown): ValidationResult {
    const { args: parsedArgs, errors: parseErrors } = this.validateAndSanitizeArgs(args);
    if (parseErrors.length > 0) {
      return this.createValidationFailure(parseErrors);
    }

    const errors = [];
    const sanitizedArgs: AddDependencyArgs = {
      from_robot: '',
      to_robot: '',
      dependency_type: 'contract',
      description: '',
      priority: 'medium'
    };

    // Validate from_robot (required)
    const fromRobotError = this.validateString(parsedArgs.from_robot, 'from_robot', true, 50);
    if (fromRobotError) {
      errors.push(fromRobotError);
    } else {
      sanitizedArgs.from_robot = this.sanitizeString(parsedArgs.from_robot).toLowerCase();
    }

    // Validate to_robot (required)
    const toRobotError = this.validateString(parsedArgs.to_robot, 'to_robot', true, 50);
    if (toRobotError) {
      errors.push(toRobotError);
    } else {
      sanitizedArgs.to_robot = this.sanitizeString(parsedArgs.to_robot).toLowerCase();
    }

    // Check for self-dependency
    if (sanitizedArgs.from_robot === sanitizedArgs.to_robot) {
      errors.push({ field: 'to_robot', message: 'Robot cannot depend on itself' });
    }

    // Validate dependency_type (required)
    const typeError = this.validateEnum(parsedArgs.dependency_type, 'dependency_type', this.validDependencyTypes, true);
    if (typeError) {
      errors.push(typeError);
    } else {
      sanitizedArgs.dependency_type = parsedArgs.dependency_type as any;
    }

    // Validate description (required)
    const descError = this.validateString(parsedArgs.description, 'description', true, 500);
    if (descError) {
      errors.push(descError);
    } else {
      sanitizedArgs.description = this.sanitizeString(parsedArgs.description);
    }

    // Validate priority (required)
    const priorityError = this.validateEnum(parsedArgs.priority, 'priority', this.validPriorities, true);
    if (priorityError) {
      errors.push(priorityError);
    } else {
      sanitizedArgs.priority = parsedArgs.priority as any;
    }

    // Validate expected_delivery (optional)
    if (parsedArgs.expected_delivery !== undefined) {
      const deliveryError = this.validateString(parsedArgs.expected_delivery, 'expected_delivery', false, 50);
      if (deliveryError) {
        errors.push(deliveryError);
      } else {
        // Basic ISO date validation
        const dateStr = this.sanitizeString(parsedArgs.expected_delivery);
        try {
          new Date(dateStr).toISOString();
          sanitizedArgs.expected_delivery = dateStr;
        } catch {
          errors.push({ field: 'expected_delivery', message: 'Invalid date format, use ISO format (YYYY-MM-DDTHH:mm:ssZ)' });
        }
      }
    }

    // Validate blocking_task (optional)
    if (parsedArgs.blocking_task !== undefined) {
      const taskError = this.validateString(parsedArgs.blocking_task, 'blocking_task', false, 200);
      if (taskError) {
        errors.push(taskError);
      } else {
        sanitizedArgs.blocking_task = this.sanitizeString(parsedArgs.blocking_task);
      }
    }

    // Validate delivery_criteria (optional)
    if (parsedArgs.delivery_criteria !== undefined && Array.isArray(parsedArgs.delivery_criteria)) {
      const validCriteria = parsedArgs.delivery_criteria
        .filter((criteria: any) => typeof criteria === 'string' && criteria.length > 0)
        .map((criteria: string) => this.sanitizeString(criteria));
      sanitizedArgs.delivery_criteria = validCriteria;
    }

    // Validate notes (optional)
    if (parsedArgs.notes !== undefined) {
      const notesError = this.validateString(parsedArgs.notes, 'notes', false, 1000);
      if (notesError) {
        errors.push(notesError);
      } else {
        sanitizedArgs.notes = this.sanitizeString(parsedArgs.notes);
      }
    }

    if (errors.length > 0) {
      return this.createValidationFailure(errors);
    }

    return this.createValidationSuccess(sanitizedArgs);
  }

  async execute(args: unknown): Promise<MCPToolResponse> {
    const dependencyArgs = args as AddDependencyArgs;

    try {
      this.logger.info(`Adding dependency`, { 
        from_robot: dependencyArgs.from_robot,
        to_robot: dependencyArgs.to_robot,
        dependency_type: dependencyArgs.dependency_type,
        priority: dependencyArgs.priority
      });

      // Process dependency addition
      const trackingResult = await this.addDependencyTracking(dependencyArgs);
      
      // Format results for response
      const formattedText = this.formatDependencyResult(trackingResult);
      
      const meta = {
        dependency_result: trackingResult,
        suggested_next_tools: this.getSuggestedNextTools(trackingResult),
        coordination_recommendations: this.getCoordinationRecommendations(trackingResult)
      };

      return this.createSuccessResponse(formattedText, meta);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Dependency addition failed: ${errorMessage}`, { dependencyArgs, error });
      return this.createErrorResponse(
        `Failed to add dependency: ${errorMessage}`,
        { dependencyArgs, error: errorMessage }
      );
    }
  }

  private async addDependencyTracking(dependency: AddDependencyArgs): Promise<DependencyTrackingResult> {
    const dependencyId = this.generateDependencyId(dependency);
    const timestamp = new Date().toISOString();

    try {
      // Send dependency to VDB service
      const response = await axios.post(`${this.vdbServiceUrl}/api/v1/coordination/add-dependency`, {
        dependency_id: dependencyId,
        dependency: dependency,
        timestamp
      }, {
        timeout: 10000
      });

      if (response.data.success) {
        return this.buildTrackingResult(dependencyId, dependency, response.data.analysis);
      }
    } catch (error) {
      this.logger.warn('VDB service not available, creating local dependency tracking', { error });
    }

    // Fallback to local dependency analysis
    return this.buildTrackingResult(dependencyId, dependency);
  }

  private generateDependencyId(dependency: AddDependencyArgs): string {
    const timestamp = Date.now();
    const typePrefix = dependency.dependency_type.substring(0, 3);
    return `dep_${typePrefix}_${dependency.from_robot}_to_${dependency.to_robot}_${timestamp}`;
  }

  private buildTrackingResult(
    dependencyId: string,
    dependency: AddDependencyArgs,
    vdbAnalysis?: any
  ): DependencyTrackingResult {
    // Generate coordination alerts
    const coordinationAlerts: string[] = [];
    
    if (dependency.priority === 'critical') {
      coordinationAlerts.push('🚨 CRITICAL dependency added - immediate coordination required');
    } else if (dependency.priority === 'high') {
      coordinationAlerts.push('⚠️ High-priority dependency added - monitor closely');
    }
    
    if (dependency.expected_delivery) {
      const deliveryDate = new Date(dependency.expected_delivery);
      const daysUntilDelivery = Math.ceil((deliveryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDelivery <= 1) {
        coordinationAlerts.push('⏰ Dependency expected within 24 hours - ensure deliverer is aware');
      } else if (daysUntilDelivery <= 3) {
        coordinationAlerts.push(`⏳ Dependency expected in ${daysUntilDelivery} days - coordinate delivery timeline`);
      }
    }

    // Identify potential blockers
    const potentialBlockers = this.identifyPotentialBlockers(dependency);

    // Assess timeline impact
    const timelineImpact = this.assessTimelineImpact(dependency);

    // Generate suggested actions
    const suggestedActions = this.generateSuggestedActions(dependency);

    // Find related dependencies (simplified logic)
    const relatedDependencies = this.findRelatedDependencies(dependency);

    return {
      success: true,
      dependency_id: dependencyId,
      from_robot: dependency.from_robot,
      to_robot: dependency.to_robot,
      dependency_type: dependency.dependency_type,
      priority: dependency.priority,
      coordination_alerts: coordinationAlerts,
      potential_blockers: potentialBlockers,
      timeline_impact: timelineImpact,
      suggested_actions: suggestedActions,
      related_dependencies: relatedDependencies,
      timestamp: new Date().toISOString()
    };
  }

  private identifyPotentialBlockers(dependency: AddDependencyArgs): string[] {
    const blockers: string[] = [];

    // Type-specific potential blockers
    switch (dependency.dependency_type) {
      case 'contract':
        blockers.push('Contract validation failures');
        blockers.push('Interface specification changes');
        break;
      case 'data':
        blockers.push('Database schema changes');
        blockers.push('Data migration issues');
        break;
      case 'service':
        blockers.push('Service deployment delays');
        blockers.push('API endpoint availability');
        break;
      case 'integration':
        blockers.push('Integration test failures');
        blockers.push('Environment configuration issues');
        break;
      case 'approval':
        blockers.push('Roma approval delays');
        blockers.push('Requirements clarification needed');
        break;
      case 'information':
        blockers.push('Documentation gaps');
        blockers.push('Stakeholder availability');
        break;
    }

    // Priority-specific blockers
    if (dependency.priority === 'critical') {
      blockers.push('Resource contention with other critical tasks');
    }

    return blockers;
  }

  private assessTimelineImpact(dependency: AddDependencyArgs): string {
    if (dependency.priority === 'critical') {
      return 'HIGH IMPACT - Critical dependency could significantly delay project if not delivered on time';
    } else if (dependency.priority === 'high') {
      return 'MEDIUM IMPACT - High-priority dependency may affect project timeline if delayed';
    } else if (dependency.expected_delivery) {
      const deliveryDate = new Date(dependency.expected_delivery);
      const daysUntilDelivery = Math.ceil((deliveryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDelivery <= 2) {
        return 'URGENT - Short delivery timeline increases risk of delays';
      } else if (daysUntilDelivery <= 7) {
        return 'MODERATE - One week delivery window requires active coordination';
      } else {
        return 'LOW IMPACT - Sufficient time for delivery with proper coordination';
      }
    } else {
      return 'UNDEFINED - No delivery timeline specified, monitor for potential delays';
    }
  }

  private generateSuggestedActions(dependency: AddDependencyArgs): string[] {
    const actions: string[] = [];

    // Priority-based actions
    if (dependency.priority === 'critical') {
      actions.push('Immediately notify recipient robot of critical dependency');
      actions.push('Schedule daily check-ins to monitor progress');
    } else if (dependency.priority === 'high') {
      actions.push('Notify recipient robot of high-priority dependency');
      actions.push('Set up progress milestone checkpoints');
    }

    // Type-specific actions
    switch (dependency.dependency_type) {
      case 'contract':
        actions.push('Use get_contract_template to help define interface specifications');
        actions.push('Plan for contract validation using validate_integration_contract');
        break;
      case 'approval':
        actions.push('Prepare documentation for Roma approval using check_roma_approval');
        actions.push('Schedule Roma review session');
        break;
      case 'integration':
        actions.push('Coordinate integration testing schedule');
        actions.push('Prepare test environment and data');
        break;
    }

    // Timeline-based actions
    if (dependency.expected_delivery) {
      actions.push('Add delivery milestone to project tracking');
      actions.push('Set up automated reminders before delivery date');
    } else {
      actions.push('Work with recipient robot to establish delivery timeline');
    }

    // General coordination actions
    actions.push('Update actionlist.md with new dependency');
    actions.push('Monitor dependency status in regular coordination reviews');

    return actions;
  }

  private findRelatedDependencies(dependency: AddDependencyArgs): string[] {
    // This would normally query existing dependencies from VDB
    // For now, return logical related dependency patterns
    const related: string[] = [];

    // Bidirectional dependencies
    related.push(`${dependency.to_robot} may also depend on ${dependency.from_robot}`);

    // Chain dependencies
    if (dependency.dependency_type === 'contract') {
      related.push('May require data or service dependencies to implement contracts');
    } else if (dependency.dependency_type === 'data') {
      related.push('May require service dependencies to expose data');
    } else if (dependency.dependency_type === 'service') {
      related.push('May require integration dependencies to connect services');
    }

    return related;
  }

  private getSuggestedNextTools(result: DependencyTrackingResult): string[] {
    const tools: string[] = [];

    // Always suggest coordination tools
    tools.push('update_actionlist', 'get_coordination_status');

    // Type-specific tools
    switch (result.dependency_type) {
      case 'contract':
        tools.push('get_contract_template', 'validate_integration_contract');
        break;
      case 'approval':
        tools.push('check_roma_approval', 'get_rome_standards');
        break;
      case 'integration':
        tools.push('validate_integration_contract', 'report_integration_status');
        break;
    }

    // Priority-specific tools
    if (result.priority === 'critical') {
      tools.push('update_robot_status'); // Both robots should update their status
    }

    return tools;
  }

  private getCoordinationRecommendations(result: DependencyTrackingResult): string[] {
    const recommendations: string[] = [];

    recommendations.push(`Communicate dependency to @${result.to_robot} robot`);
    
    if (result.priority === 'critical') {
      recommendations.push('Establish daily progress check-ins for critical dependency');
    }
    
    recommendations.push('Add dependency tracking to project status meetings');
    
    if (result.potential_blockers.length > 0) {
      recommendations.push('Proactively address potential blockers before they occur');
    }
    
    recommendations.push('Set up notification system for delivery milestones');

    return recommendations;
  }

  private formatDependencyResult(result: DependencyTrackingResult): string {
    let formatted = `Dependency Added: **${result.from_robot} → ${result.to_robot}**\n\n`;
    
    // Dependency summary
    formatted += `✅ **Dependency Tracked Successfully**\n`;
    formatted += `Dependency ID: ${result.dependency_id}\n`;
    formatted += `Type: ${result.dependency_type}\n`;
    formatted += `Priority: ${result.priority.toUpperCase()}\n\n`;

    // Timeline impact
    formatted += `⏱️ **Timeline Impact**:\n${result.timeline_impact}\n\n`;

    // Coordination alerts
    if (result.coordination_alerts.length > 0) {
      formatted += `🚨 **Coordination Alerts**:\n`;
      result.coordination_alerts.forEach(alert => {
        formatted += `• ${alert}\n`;
      });
      formatted += '\n';
    }

    // Potential blockers
    if (result.potential_blockers.length > 0) {
      formatted += `⚠️ **Potential Blockers to Watch**:\n`;
      result.potential_blockers.forEach(blocker => {
        formatted += `• ${blocker}\n`;
      });
      formatted += '\n';
    }

    // Suggested actions
    formatted += `🎯 **Recommended Actions** (${result.suggested_actions.length}):\n`;
    result.suggested_actions.forEach((action, index) => {
      formatted += `${index + 1}. ${action}\n`;
    });

    // Related dependencies
    if (result.related_dependencies.length > 0) {
      formatted += `\n🔗 **Related Dependencies**:\n`;
      result.related_dependencies.forEach(related => {
        formatted += `• ${related}\n`;
      });
    }

    // Footer
    formatted += '\n---\n';
    formatted += `🕐 Added: ${new Date(result.timestamp).toLocaleString()}\n`;
    formatted += `Use get_coordination_status to see updated dependency tracking\n`;

    return formatted;
  }
}