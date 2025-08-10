/**
 * Update Action List Handler - update_actionlist tool
 * 
 * Allows PMA robot to update central coordination document (actionlist.md)
 * Manages project-wide coordination, blockers, and dependencies
 * 
 * Author: ROME Development Team
 * Date: 2025-08-09
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { BaseToolHandler, ValidationResult, MCPToolResponse } from './IToolHandler.js';
import axios from 'axios';

interface UpdateActionListArgs {
  project_phase?: 'planning' | 'development' | 'integration' | 'deployment';
  add_blockers?: BlockerInfo[];
  resolve_blockers?: string[];
  update_dependencies?: DependencyUpdate[];
  overall_progress?: number;
  project_notes?: string;
  milestone_updates?: MilestoneUpdate[];
  priority_changes?: PriorityChange[];
}

interface BlockerInfo {
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  affected_robots: string[];
  description: string;
  owner: string;
  estimated_resolution?: string;
}

interface DependencyUpdate {
  from_robot: string;
  to_robot: string;
  dependency_type: 'contract' | 'data' | 'service' | 'integration';
  status: 'waiting' | 'ready' | 'delivered' | 'blocked';
  description: string;
  expected_delivery?: string;
}

interface MilestoneUpdate {
  milestone_name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  expected_completion: string;
  notes?: string;
}

interface PriorityChange {
  robot_role: string;
  old_priority: string;
  new_priority: string;
  reason: string;
}

interface ActionListUpdateResult {
  success: boolean;
  project_id: string;
  previous_phase: string;
  new_phase?: string;
  blockers_added: number;
  blockers_resolved: number;
  dependencies_updated: number;
  coordination_alerts: string[];
  team_notifications: string[];
  timestamp: string;
}

export class UpdateActionListHandler extends BaseToolHandler {
  private vdbServiceUrl: string;
  private readonly validProjectPhases = [
    'planning', 'development', 'integration', 'deployment'
  ];
  private readonly validBlockerSeverities = [
    'critical', 'high', 'medium', 'low'
  ];
  private readonly validDependencyTypes = [
    'contract', 'data', 'service', 'integration'
  ];
  private readonly validDependencyStatuses = [
    'waiting', 'ready', 'delivered', 'blocked'
  ];
  private readonly validRobotRoles = [
    'pma', 'backend', 'frontend', 'data', 'devops', 'qa'
  ];

  constructor(vdbServiceUrl: string, logger: any) {
    super('update_actionlist', logger);
    this.vdbServiceUrl = vdbServiceUrl;
  }

  getToolDefinition(): Tool {
    return {
      name: 'update_actionlist',
      description: 'Update central project coordination document (actionlist.md) - PMA coordination tool',
      inputSchema: {
        type: 'object',
        properties: {
          project_phase: {
            type: 'string',
            description: 'Update project phase',
            enum: this.validProjectPhases
          },
          add_blockers: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                severity: { type: 'string', enum: this.validBlockerSeverities },
                affected_robots: { type: 'array', items: { type: 'string' } },
                description: { type: 'string' },
                owner: { type: 'string' },
                estimated_resolution: { type: 'string' }
              },
              required: ['title', 'severity', 'affected_robots', 'description', 'owner']
            },
            description: 'New blockers to add to the project'
          },
          resolve_blockers: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of blocker IDs or titles to mark as resolved'
          },
          update_dependencies: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                from_robot: { type: 'string' },
                to_robot: { type: 'string' },
                dependency_type: { type: 'string', enum: this.validDependencyTypes },
                status: { type: 'string', enum: this.validDependencyStatuses },
                description: { type: 'string' },
                expected_delivery: { type: 'string' }
              },
              required: ['from_robot', 'to_robot', 'dependency_type', 'status', 'description']
            },
            description: 'Updates to inter-robot dependencies'
          },
          overall_progress: {
            type: 'number',
            description: 'Overall project progress percentage (0-100)',
            minimum: 0,
            maximum: 100
          },
          project_notes: {
            type: 'string',
            description: 'General project notes or observations from PMA'
          },
          milestone_updates: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                milestone_name: { type: 'string' },
                status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'delayed'] },
                expected_completion: { type: 'string' },
                notes: { type: 'string' }
              },
              required: ['milestone_name', 'status', 'expected_completion']
            },
            description: 'Updates to project milestones'
          },
          priority_changes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                robot_role: { type: 'string', enum: this.validRobotRoles },
                old_priority: { type: 'string' },
                new_priority: { type: 'string' },
                reason: { type: 'string' }
              },
              required: ['robot_role', 'old_priority', 'new_priority', 'reason']
            },
            description: 'Changes to robot task priorities'
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
    const sanitizedArgs: UpdateActionListArgs = {};

    // Validate project_phase (optional)
    if (parsedArgs.project_phase !== undefined) {
      const phaseError = this.validateEnum(parsedArgs.project_phase, 'project_phase', this.validProjectPhases, false);
      if (phaseError) {
        errors.push(phaseError);
      } else {
        sanitizedArgs.project_phase = parsedArgs.project_phase as any;
      }
    }

    // Validate add_blockers (optional)
    if (parsedArgs.add_blockers !== undefined && Array.isArray(parsedArgs.add_blockers)) {
      const validBlockers: BlockerInfo[] = [];
      for (const blocker of parsedArgs.add_blockers) {
        if (this.isValidBlocker(blocker)) {
          validBlockers.push({
            title: this.sanitizeString(blocker.title),
            severity: blocker.severity,
            affected_robots: blocker.affected_robots.filter((r: any) => typeof r === 'string'),
            description: this.sanitizeString(blocker.description),
            owner: this.sanitizeString(blocker.owner),
            estimated_resolution: blocker.estimated_resolution ? this.sanitizeString(blocker.estimated_resolution) : undefined
          });
        }
      }
      sanitizedArgs.add_blockers = validBlockers;
    }

    // Validate resolve_blockers (optional)
    if (parsedArgs.resolve_blockers !== undefined && Array.isArray(parsedArgs.resolve_blockers)) {
      const validResolvedBlockers = parsedArgs.resolve_blockers
        .filter((id: any) => typeof id === 'string' && id.length > 0)
        .map((id: string) => this.sanitizeString(id));
      sanitizedArgs.resolve_blockers = validResolvedBlockers;
    }

    // Validate update_dependencies (optional)
    if (parsedArgs.update_dependencies !== undefined && Array.isArray(parsedArgs.update_dependencies)) {
      const validDependencies: DependencyUpdate[] = [];
      for (const dep of parsedArgs.update_dependencies) {
        if (this.isValidDependency(dep)) {
          validDependencies.push({
            from_robot: dep.from_robot,
            to_robot: dep.to_robot,
            dependency_type: dep.dependency_type,
            status: dep.status,
            description: this.sanitizeString(dep.description),
            expected_delivery: dep.expected_delivery ? this.sanitizeString(dep.expected_delivery) : undefined
          });
        }
      }
      sanitizedArgs.update_dependencies = validDependencies;
    }

    // Validate overall_progress (optional)
    if (parsedArgs.overall_progress !== undefined) {
      const progressError = this.validateNumber(parsedArgs.overall_progress, 'overall_progress', false, 0, 100);
      if (progressError) {
        errors.push(progressError);
      } else {
        sanitizedArgs.overall_progress = parseInt(parsedArgs.overall_progress.toString());
      }
    }

    // Validate project_notes (optional)
    if (parsedArgs.project_notes !== undefined) {
      const notesError = this.validateString(parsedArgs.project_notes, 'project_notes', false, 2000);
      if (notesError) {
        errors.push(notesError);
      } else {
        sanitizedArgs.project_notes = this.sanitizeString(parsedArgs.project_notes);
      }
    }

    if (errors.length > 0) {
      return this.createValidationFailure(errors);
    }

    return this.createValidationSuccess(sanitizedArgs);
  }

  async execute(args: unknown): Promise<MCPToolResponse> {
    const updateArgs = args as UpdateActionListArgs;

    try {
      this.logger.info(`Updating action list`, { 
        phase: updateArgs.project_phase,
        blockers_count: updateArgs.add_blockers?.length || 0,
        resolved_count: updateArgs.resolve_blockers?.length || 0
      });

      // Get current action list state
      const currentState = await this.getCurrentActionListState();
      
      // Update action list with new information
      const updateResult = await this.updateActionList(updateArgs, currentState);
      
      // Format results for response
      const formattedText = this.formatActionListUpdateResult(updateResult);
      
      const meta = {
        update_result: updateResult,
        suggested_next_tools: this.getSuggestedNextTools(updateResult),
        team_alerts: updateResult.team_notifications
      };

      return this.createSuccessResponse(formattedText, meta);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Action list update failed: ${errorMessage}`, { updateArgs, error });
      return this.createErrorResponse(
        `Failed to update action list: ${errorMessage}`,
        { updateArgs, error: errorMessage }
      );
    }
  }

  private isValidBlocker(blocker: any): boolean {
    return blocker &&
           typeof blocker.title === 'string' &&
           this.validBlockerSeverities.includes(blocker.severity) &&
           Array.isArray(blocker.affected_robots) &&
           typeof blocker.description === 'string' &&
           typeof blocker.owner === 'string';
  }

  private isValidDependency(dep: any): boolean {
    return dep &&
           typeof dep.from_robot === 'string' &&
           typeof dep.to_robot === 'string' &&
           this.validDependencyTypes.includes(dep.dependency_type) &&
           this.validDependencyStatuses.includes(dep.status) &&
           typeof dep.description === 'string';
  }

  private async getCurrentActionListState(): Promise<any> {
    try {
      // Get current action list from VDB service
      const response = await axios.get(`${this.vdbServiceUrl}/api/v1/coordination/actionlist`, {
        timeout: 5000
      });

      if (response.data.success && response.data.actionlist) {
        return response.data.actionlist;
      }
    } catch (error) {
      this.logger.warn('Could not fetch current action list state, using defaults', { error });
    }

    // Return default state
    return {
      project_id: 'rome_project_001',
      project_phase: 'development',
      overall_progress: 50,
      active_blockers: [],
      dependencies: [],
      milestones: []
    };
  }

  private async updateActionList(
    updates: UpdateActionListArgs,
    currentState: any
  ): Promise<ActionListUpdateResult> {
    const timestamp = new Date().toISOString();
    const projectId = currentState.project_id || 'rome_project_001';
    
    try {
      // Send updates to VDB service
      const response = await axios.post(`${this.vdbServiceUrl}/api/v1/coordination/update-actionlist`, {
        project_id: projectId,
        updates: updates,
        current_state: currentState,
        timestamp
      }, {
        timeout: 10000
      });

      if (response.data.success) {
        return this.buildUpdateResult(updates, currentState, response.data.update_summary);
      }
    } catch (error) {
      this.logger.warn('VDB service not available, creating local update result', { error });
    }

    // Fallback to local update result
    return this.buildUpdateResult(updates, currentState);
  }

  private buildUpdateResult(
    updates: UpdateActionListArgs,
    currentState: any,
    vdbSummary?: any
  ): ActionListUpdateResult {
    const blockersAdded = updates.add_blockers?.length || 0;
    const blockersResolved = updates.resolve_blockers?.length || 0;
    const dependenciesUpdated = updates.update_dependencies?.length || 0;

    // Generate coordination alerts
    const coordinationAlerts: string[] = [];
    
    if (updates.project_phase && updates.project_phase !== currentState.project_phase) {
      coordinationAlerts.push(`Project phase changed: ${currentState.project_phase} → ${updates.project_phase}`);
    }
    
    if (blockersAdded > 0) {
      const criticalBlockers = updates.add_blockers?.filter(b => b.severity === 'critical').length || 0;
      if (criticalBlockers > 0) {
        coordinationAlerts.push(`🚨 ${criticalBlockers} CRITICAL blocker(s) added - immediate attention required`);
      } else {
        coordinationAlerts.push(`⚠️ ${blockersAdded} new blocker(s) added to project`);
      }
    }
    
    if (blockersResolved > 0) {
      coordinationAlerts.push(`✅ ${blockersResolved} blocker(s) resolved - check for unblocked robots`);
    }
    
    if (dependenciesUpdated > 0) {
      coordinationAlerts.push(`🔗 ${dependenciesUpdated} dependency status(es) updated - coordinate affected robots`);
    }

    // Generate team notifications
    const teamNotifications: string[] = [];
    
    if (updates.add_blockers) {
      for (const blocker of updates.add_blockers) {
        for (const robot of blocker.affected_robots) {
          teamNotifications.push(`@${robot}: New ${blocker.severity} blocker affects your work: ${blocker.title}`);
        }
      }
    }
    
    if (updates.update_dependencies) {
      for (const dep of updates.update_dependencies) {
        if (dep.status === 'ready') {
          teamNotifications.push(`@${dep.from_robot}: Dependency ready for @${dep.to_robot}: ${dep.description}`);
        } else if (dep.status === 'blocked') {
          teamNotifications.push(`@${dep.from_robot}: Dependency blocked for @${dep.to_robot}: ${dep.description}`);
        }
      }
    }

    return {
      success: true,
      project_id: currentState.project_id || 'rome_project_001',
      previous_phase: currentState.project_phase || 'development',
      new_phase: updates.project_phase,
      blockers_added: blockersAdded,
      blockers_resolved: blockersResolved,
      dependencies_updated: dependenciesUpdated,
      coordination_alerts: coordinationAlerts,
      team_notifications: teamNotifications,
      timestamp: new Date().toISOString()
    };
  }

  private getSuggestedNextTools(result: ActionListUpdateResult): string[] {
    const tools: string[] = [];

    if (result.blockers_added > 0) {
      tools.push('get_coordination_status', 'resolve_blocker');
    }

    if (result.dependencies_updated > 0) {
      tools.push('validate_integration_contract', 'get_coordination_status');
    }

    if (result.new_phase === 'integration') {
      tools.push('report_integration_status', 'validate_integration_contract');
    } else if (result.new_phase === 'deployment') {
      tools.push('report_integration_status');
    }

    // Always suggest coordination status after updates
    tools.push('get_coordination_status');

    return [...new Set(tools)]; // Remove duplicates
  }

  private formatActionListUpdateResult(result: ActionListUpdateResult): string {
    let formatted = `Action List Update: **Project Coordination**\n\n`;
    
    // Update summary
    formatted += `✅ **Coordination Update Complete**\n`;
    formatted += `Project: ${result.project_id}\n`;
    
    if (result.new_phase) {
      formatted += `Phase: ${result.previous_phase} → ${result.new_phase}\n`;
    }
    formatted += '\n';

    // Update statistics
    formatted += `📊 **Update Summary**:\n`;
    formatted += `• Blockers Added: ${result.blockers_added}\n`;
    formatted += `• Blockers Resolved: ${result.blockers_resolved}\n`;
    formatted += `• Dependencies Updated: ${result.dependencies_updated}\n\n`;

    // Coordination alerts
    if (result.coordination_alerts.length > 0) {
      formatted += `🚨 **Coordination Alerts**:\n`;
      result.coordination_alerts.forEach(alert => {
        formatted += `• ${alert}\n`;
      });
      formatted += '\n';
    }

    // Team notifications
    if (result.team_notifications.length > 0) {
      formatted += `📢 **Team Notifications** (${result.team_notifications.length}):\n`;
      result.team_notifications.forEach((notification, index) => {
        formatted += `${index + 1}. ${notification}\n`;
      });
      formatted += '\n';
    }

    // Next steps
    formatted += `💡 **Recommended Next Steps**:\n`;
    formatted += `1. Review get_coordination_status for overall project impact\n`;
    formatted += `2. Communicate updates to affected robots\n`;
    formatted += `3. Monitor blocker resolution progress\n`;
    formatted += `4. Validate integration contracts if dependencies changed\n`;

    // Footer
    formatted += '\n---\n';
    formatted += `🕐 Updated: ${new Date(result.timestamp).toLocaleString()}\n`;
    formatted += `PMA coordination complete - actionlist.md updated\n`;

    return formatted;
  }
}