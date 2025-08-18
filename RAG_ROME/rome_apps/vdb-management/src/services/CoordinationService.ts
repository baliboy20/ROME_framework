import { Logger } from '../utils/Logger.js';
import { WeaviateService } from './WeaviateService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export class CoordinationService {
  private robotStatusDir: string;

  constructor(private weaviate: WeaviateService, private logger: Logger) {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    this.robotStatusDir = path.join(__dirname, '../../robot_status');
    
    // Ensure robot status directory exists
    if (!fs.existsSync(this.robotStatusDir)) {
      fs.mkdirSync(this.robotStatusDir, { recursive: true });
    }
  }

  async getRobotStatus(robotRole: string): Promise<any> {
    this.logger.info('Getting robot status', { robotRole });
    
    try {
      const statusFile = path.join(this.robotStatusDir, `${robotRole}_status.json`);
      
      if (fs.existsSync(statusFile)) {
        const statusData = JSON.parse(fs.readFileSync(statusFile, 'utf-8'));
        return statusData;
      }
      
      // Return default status if no file exists
      return {
        robot_role: robotRole,
        protocol_step: 1,
        task_progress: 0,
        status: 'inactive',
        current_task: 'No current task',
        last_activity: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to read robot status', { robotRole, error });
      throw error;
    }
  }

  async updateRobotStatus(update: any): Promise<any> {
    this.logger.info('Updating robot status', update);
    
    try {
      const statusFile = path.join(this.robotStatusDir, `${update.robot_role}_status.json`);
      const markdownFile = path.join(this.robotStatusDir, `${update.robot_role}_status.md`);
      
      const statusData = {
        robot_role: update.robot_role,
        protocol_step: update.protocol_step,
        task_progress: update.task_progress,
        status: 'active',
        current_task: update.current_task,
        recent_activity: update.recent_activity,
        last_updated: new Date().toISOString()
      };
      
      // Save JSON status file
      fs.writeFileSync(statusFile, JSON.stringify(statusData, null, 2));
      
      // Save markdown file for documentation
      const markdownContent = `# ${update.robot_role.toUpperCase()} Robot Status

## Current Status
- **Protocol Step:** ${update.protocol_step}/8
- **Progress:** ${update.task_progress}%
- **Status:** Active
- **Last Updated:** ${statusData.last_updated}

## Current Task
${update.current_task}

## Recent Activity
${update.recent_activity}

## Protocol Progress
- Step ${update.protocol_step} of 8 in ROME TDD methodology
- Overall task completion: ${update.task_progress}%
`;
      
      fs.writeFileSync(markdownFile, markdownContent);
      
      this.logger.info('Robot status updated successfully', {
        robot_role: update.robot_role,
        protocol_step: update.protocol_step,
        progress: update.task_progress
      });
      
      return { 
        success: true, 
        document_path: `robot_status/${update.robot_role}_status.md` 
      };
    } catch (error) {
      this.logger.error('Failed to update robot status', { update, error });
      throw error;
    }
  }

  async getAllRobotStatus(): Promise<any[]> {
    this.logger.info('Getting all robot status');
    
    try {
      const robotRoles = ['pma', 'backend', 'frontend', 'data', 'devops', 'qa'];
      const allStatus = [];
      
      for (const role of robotRoles) {
        const statusFile = path.join(this.robotStatusDir, `${role}_status.json`);
        
        if (fs.existsSync(statusFile)) {
          const statusData = JSON.parse(fs.readFileSync(statusFile, 'utf-8'));
          allStatus.push(statusData);
        }
      }
      
      return allStatus;
    } catch (error) {
      this.logger.error('Failed to get all robot status', { error });
      throw error;
    }
  }

  async getActionList(): Promise<any> {
    this.logger.info('Getting action list');
    return {
      project_id: 'rome_project_001',
      project_phase: 'development',
      overall_progress: 68
    };
  }

  async updateActionList(updates: any): Promise<any> {
    this.logger.info('Updating action list', updates);
    return { success: true, update_summary: 'Action list updated successfully' };
  }
}