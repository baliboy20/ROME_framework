/**
 * Resolve Blocker Handler - resolve_blocker tool
 * 
 * Allows robots to mark blockers as resolved and track resolution impact
 * Updates coordination tracking and notifies affected team members
 * 
 * Author: ROME Development Team
 * Date: 2025-08-09
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { BaseToolHandler, ValidationResult, MCPToolResponse } from './IToolHandler.js';
import axios from 'axios';

interface ResolveBlockerArgs {
  blocker_id: string;
  resolution_method: 'fixed' | 'workaround' | 'cancelled' | 'duplicate' | 'external_resolution';
  resolution_description: string;
  resolved_by: string;
  resolution_evidence?: string;
  lessons_learned?: string;
  preventive_measures?: string[];
}

interface BlockerResolutionResult {
  success: boolean;
  blocker_id: string;
  blocker_title: string;
  resolution_method: string;
  affected_robots: string[];
  unblocked_tasks: string[];
  coordination_impact: string[];
  follow_up_actions: string[];
  resolution_time_hours: number;
  timestamp: string;
}

interface BlockerInfo {
  id: string;
  title: string;
  severity: string;
  affected_robots: string[];
  blocking_since: string;
  description: string;
  owner: string;
}

export class ResolveBlockerHandler extends BaseToolHandler {
  private vdbServiceUrl: string;
  private readonly validResolutionMethods = [
    'fixed', 'workaround', 'cancelled', 'duplicate', 'external_resolution'
  ];

  constructor(vdbServiceUrl: string, logger: any) {
    super('resolve_blocker', logger);
    this.vdbServiceUrl = vdbServiceUrl;
  }

  getToolDefinition(): Tool {
    return {
      name: 'resolve_blocker',
      description: 'Mark a blocker as resolved and update coordination tracking',
      inputSchema: {
        type: 'object',
        properties: {
          blocker_id: {
            type: 'string',
            description: 'ID or title of the blocker being resolved'
          },
          resolution_method: {
            type: 'string',
            description: 'How the blocker was resolved',
            enum: this.validResolutionMethods
          },
          resolution_description: {
            type: 'string',
            description: 'Detailed description of how the blocker was resolved'
          },
          resolved_by: {
            type: 'string',
            description: 'Robot role or person who resolved the blocker'
          },
          resolution_evidence: {
            type: 'string',
            description: 'Evidence of resolution (test results, approval, etc.)'
          },
          lessons_learned: {
            type: 'string',
            description: 'Lessons learned from this blocker for future prevention'
          },
          preventive_measures: {
            type: 'array',
            items: { type: 'string' },
            description: 'Measures to prevent similar blockers in the future'
          }
        },
        required: ['blocker_id', 'resolution_method', 'resolution_description', 'resolved_by']
      }
    };
  }

  validateArguments(args: unknown): ValidationResult {
    const { args: parsedArgs, errors: parseErrors } = this.validateAndSanitizeArgs(args);
    if (parseErrors.length > 0) {
      return this.createValidationFailure(parseErrors);
    }

    const errors = [];
    const sanitizedArgs: ResolveBlockerArgs = {
      blocker_id: '',
      resolution_method: 'fixed',
      resolution_description: '',
      resolved_by: ''
    };

    // Validate blocker_id (required)
    const blockerIdError = this.validateString(parsedArgs.blocker_id, 'blocker_id', true, 200);
    if (blockerIdError) {
      errors.push(blockerIdError);
    } else {
      sanitizedArgs.blocker_id = this.sanitizeString(parsedArgs.blocker_id);
    }

    // Validate resolution_method (required)
    const methodError = this.validateEnum(parsedArgs.resolution_method, 'resolution_method', this.validResolutionMethods, true);
    if (methodError) {
      errors.push(methodError);
    } else {
      sanitizedArgs.resolution_method = parsedArgs.resolution_method as any;
    }

    // Validate resolution_description (required)
    const descError = this.validateString(parsedArgs.resolution_description, 'resolution_description', true, 1000);
    if (descError) {
      errors.push(descError);
    } else {
      sanitizedArgs.resolution_description = this.sanitizeString(parsedArgs.resolution_description);
    }

    // Validate resolved_by (required)
    const resolvedByError = this.validateString(parsedArgs.resolved_by, 'resolved_by', true, 100);
    if (resolvedByError) {
      errors.push(resolvedByError);
    } else {
      sanitizedArgs.resolved_by = this.sanitizeString(parsedArgs.resolved_by);
    }

    // Validate resolution_evidence (optional)
    if (parsedArgs.resolution_evidence !== undefined) {
      const evidenceError = this.validateString(parsedArgs.resolution_evidence, 'resolution_evidence', false, 2000);
      if (evidenceError) {
        errors.push(evidenceError);
      } else {
        sanitizedArgs.resolution_evidence = this.sanitizeString(parsedArgs.resolution_evidence);
      }
    }

    // Validate lessons_learned (optional)
    if (parsedArgs.lessons_learned !== undefined) {
      const lessonsError = this.validateString(parsedArgs.lessons_learned, 'lessons_learned', false, 1000);
      if (lessonsError) {
        errors.push(lessonsError);
      } else {
        sanitizedArgs.lessons_learned = this.sanitizeString(parsedArgs.lessons_learned);
      }
    }

    // Validate preventive_measures (optional)
    if (parsedArgs.preventive_measures !== undefined && Array.isArray(parsedArgs.preventive_measures)) {
      const validMeasures = parsedArgs.preventive_measures
        .filter((measure: any) => typeof measure === 'string' && measure.length > 0)
        .map((measure: string) => this.sanitizeString(measure));
      sanitizedArgs.preventive_measures = validMeasures;
    }

    if (errors.length > 0) {
      return this.createValidationFailure(errors);
    }

    return this.createValidationSuccess(sanitizedArgs);
  }

  async execute(args: unknown): Promise<MCPToolResponse> {
    const resolveArgs = args as ResolveBlockerArgs;

    try {
      this.logger.info(`Resolving blocker`, { 
        blocker_id: resolveArgs.blocker_id,
        resolution_method: resolveArgs.resolution_method,
        resolved_by: resolveArgs.resolved_by
      });

      // Get current blocker information
      const blockerInfo = await this.getBlockerInfo(resolveArgs.blocker_id);
      
      if (!blockerInfo) {
        throw new Error(`Blocker not found: ${resolveArgs.blocker_id}`);
      }

      // Process blocker resolution
      const resolutionResult = await this.processBlockerResolution(resolveArgs, blockerInfo);
      
      // Format results for response
      const formattedText = this.formatResolutionResult(resolutionResult);
      
      const meta = {
        resolution_result: resolutionResult,
        suggested_next_tools: this.getSuggestedNextTools(resolutionResult),
        team_notifications: this.generateTeamNotifications(resolutionResult)
      };

      return this.createSuccessResponse(formattedText, meta);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Blocker resolution failed: ${errorMessage}`, { resolveArgs, error });
      return this.createErrorResponse(
        `Failed to resolve blocker: ${errorMessage}`,
        { resolveArgs, error: errorMessage }
      );
    }
  }

  private async getBlockerInfo(blockerId: string): Promise<BlockerInfo | null> {
    try {
      // Try to get blocker info from VDB service
      const response = await axios.get(`${this.vdbServiceUrl}/api/v1/coordination/blocker`, {
        params: { blocker_id: blockerId },
        timeout: 5000
      });

      if (response.data.success && response.data.blocker) {
        return response.data.blocker;
      }
    } catch (error) {
      this.logger.warn('Could not fetch blocker info from VDB service, searching by ID', { blockerId, error });
    }

    // Fallback: try to find blocker by searching for it
    try {
      const searchResponse = await axios.get(`${this.vdbServiceUrl}/api/v1/documents/search`, {
        params: {
          query: `blocker ${blockerId}`,
          category: 'coordination',
          limit: 5
        },
        timeout: 5000
      });

      if (searchResponse.data.success && searchResponse.data.results?.length > 0) {
        // Parse blocker from search results
        const blockerDoc = searchResponse.data.results[0];
        return {
          id: blockerId,
          title: blockerDoc.section || blockerId,
          severity: 'medium', // Default
          affected_robots: ['unknown'], // Default
          blocking_since: new Date().toISOString(),
          description: blockerDoc.content?.substring(0, 200) || 'No description available',
          owner: 'unknown'
        };
      }
    } catch (error) {
      this.logger.warn('Could not search for blocker, creating default info', { blockerId, error });
    }

    // Return null if blocker not found
    return null;
  }

  private async processBlockerResolution(
    resolveArgs: ResolveBlockerArgs,
    blockerInfo: BlockerInfo
  ): Promise<BlockerResolutionResult> {
    const timestamp = new Date().toISOString();
    const blockingSince = new Date(blockerInfo.blocking_since || timestamp);
    const resolutionTime = Math.round((Date.now() - blockingSince.getTime()) / (1000 * 60 * 60)); // Hours

    try {
      // Send resolution to VDB service
      const response = await axios.post(`${this.vdbServiceUrl}/api/v1/coordination/resolve-blocker`, {
        blocker_id: resolveArgs.blocker_id,
        blocker_info: blockerInfo,
        resolution: resolveArgs,
        timestamp
      }, {
        timeout: 10000
      });

      if (response.data.success) {
        return this.buildResolutionResult(resolveArgs, blockerInfo, resolutionTime, response.data.impact_analysis);
      }
    } catch (error) {
      this.logger.warn('VDB service not available, creating local resolution result', { error });
    }

    // Fallback to local resolution processing
    return this.buildResolutionResult(resolveArgs, blockerInfo, resolutionTime);
  }

  private buildResolutionResult(
    resolveArgs: ResolveBlockerArgs,
    blockerInfo: BlockerInfo,
    resolutionTimeHours: number,
    vdbAnalysis?: any
  ): BlockerResolutionResult {
    // Determine coordination impact
    const coordinationImpact: string[] = [];
    
    if (blockerInfo.severity === 'critical') {
      coordinationImpact.push('Critical blocker resolved - major impact on project timeline');
    } else if (blockerInfo.severity === 'high') {
      coordinationImpact.push('High-priority blocker resolved - significant impact on affected robots');
    }
    
    if (blockerInfo.affected_robots.length > 1) {
      coordinationImpact.push(`${blockerInfo.affected_robots.length} robots can now continue work`);
    }
    
    if (resolutionTimeHours > 24) {
      coordinationImpact.push('Long-running blocker resolved - project timeline may need adjustment');
    }

    // Generate unblocked tasks
    const unblockedTasks = blockerInfo.affected_robots.map(robot => 
      `${robot}: Can resume work on tasks blocked by this issue`
    );

    // Generate follow-up actions
    const followUpActions = this.generateFollowUpActions(resolveArgs, blockerInfo);

    return {
      success: true,
      blocker_id: resolveArgs.blocker_id,
      blocker_title: blockerInfo.title,
      resolution_method: resolveArgs.resolution_method,
      affected_robots: blockerInfo.affected_robots,
      unblocked_tasks: unblockedTasks,
      coordination_impact: coordinationImpact,
      follow_up_actions: followUpActions,
      resolution_time_hours: resolutionTimeHours,
      timestamp: new Date().toISOString()
    };
  }

  private generateFollowUpActions(resolveArgs: ResolveBlockerArgs, blockerInfo: BlockerInfo): string[] {
    const actions: string[] = [];

    // Resolution-specific follow-ups
    switch (resolveArgs.resolution_method) {
      case 'workaround':
        actions.push('Monitor workaround effectiveness and plan permanent fix');
        actions.push('Update documentation with workaround procedure');
        break;
      case 'fixed':
        actions.push('Validate fix with integration tests');
        actions.push('Update affected robots about resolution');
        break;
      case 'external_resolution':
        actions.push('Confirm external resolution is stable');
        actions.push('Update dependencies documentation');
        break;
    }

    // General follow-ups
    actions.push('Notify affected robots that work can resume');
    actions.push('Update actionlist.md to reflect resolution');

    if (resolveArgs.lessons_learned) {
      actions.push('Document lessons learned in team knowledge base');
    }

    if (resolveArgs.preventive_measures && resolveArgs.preventive_measures.length > 0) {
      actions.push('Implement preventive measures to avoid similar blockers');
    }

    // Check for cascading unblocking
    if (blockerInfo.affected_robots.length > 1) {
      actions.push('Check for other blockers that may now be resolvable');
    }

    return actions;
  }

  private getSuggestedNextTools(result: BlockerResolutionResult): string[] {
    const tools: string[] = [];

    // Always suggest updating coordination status after resolution
    tools.push('update_actionlist', 'get_coordination_status');

    // Suggest robot status updates for affected robots
    if (result.affected_robots.length > 0) {
      tools.push('update_robot_status');
    }

    // If workaround, suggest monitoring tools
    if (result.resolution_method === 'workaround') {
      tools.push('add_dependency', 'get_robot_protocol');
    }

    // If fixed, suggest validation tools
    if (result.resolution_method === 'fixed') {
      tools.push('validate_integration_contract', 'report_integration_status');
    }

    return tools;
  }

  private generateTeamNotifications(result: BlockerResolutionResult): string[] {
    const notifications: string[] = [];

    // Notify all affected robots
    for (const robot of result.affected_robots) {
      notifications.push(`@${robot}: Blocker "${result.blocker_title}" resolved - you can resume work`);
    }

    // General team notification
    const resolutionEmoji = result.resolution_method === 'fixed' ? '🔧' : 
                           result.resolution_method === 'workaround' ? '🔄' : '✅';
    
    notifications.push(`${resolutionEmoji} Team: Blocker "${result.blocker_title}" resolved (${result.resolution_method})`);

    // Timeline impact notification
    if (result.resolution_time_hours > 24) {
      notifications.push(`⏰ Timeline impact: Blocker was active for ${result.resolution_time_hours} hours - review project schedule`);
    }

    return notifications;
  }

  private formatResolutionResult(result: BlockerResolutionResult): string {
    let formatted = `Blocker Resolution: **${result.blocker_title}**\n\n`;
    
    // Resolution summary
    formatted += `✅ **Resolution Complete**\n`;
    formatted += `Blocker ID: ${result.blocker_id}\n`;
    formatted += `Resolution Method: ${result.resolution_method}\n`;
    formatted += `Resolution Time: ${result.resolution_time_hours} hours\n\n`;

    // Affected robots and unblocked tasks
    formatted += `🤖 **Affected Robots** (${result.affected_robots.length}):\n`;
    result.affected_robots.forEach(robot => {
      formatted += `• ${robot}\n`;
    });
    formatted += '\n';

    formatted += `🚀 **Unblocked Tasks**:\n`;
    result.unblocked_tasks.forEach(task => {
      formatted += `• ${task}\n`;
    });
    formatted += '\n';

    // Coordination impact
    if (result.coordination_impact.length > 0) {
      formatted += `📊 **Coordination Impact**:\n`;
      result.coordination_impact.forEach(impact => {
        formatted += `• ${impact}\n`;
      });
      formatted += '\n';
    }

    // Follow-up actions
    formatted += `🎯 **Follow-up Actions** (${result.follow_up_actions.length}):\n`;
    result.follow_up_actions.forEach((action, index) => {
      formatted += `${index + 1}. ${action}\n`;
    });

    // Footer
    formatted += '\n---\n';
    formatted += `🕐 Resolved: ${new Date(result.timestamp).toLocaleString()}\n`;
    formatted += `Use get_coordination_status to see updated project status\n`;

    return formatted;
  }
}