/**
 * Coordination API Routes
 * 
 * Handles robot status tracking, actionlist management, and project coordination
 * Used by MCP server coordination tools for ROME project management
 */

import { Router, Request, Response } from 'express';

interface ServiceRequest extends Request {
  services?: {
    weaviate: any;
    coordination: any;
    documents: any;
    logger: any;
  };
}

const router = Router();

/**
 * Get robot status endpoint
 * GET /api/v1/coordination/robot/:role/status
 */
router.get('/robot/:role/status', async (req: ServiceRequest, res: Response) => {
  try {
    const { role } = req.params as { role: string };
    
    const validRoles = ['pma', 'backend', 'frontend', 'data', 'devops', 'qa'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid robot role',
        valid_roles: validRoles,
        timestamp: new Date().toISOString()
      });
    }

    req.services?.logger?.info('Robot status requested', { robot_role: role });

    const status = await req.services?.coordination?.getRobotStatus(role);

    res.status(200).json({
      success: true,
      robot_status: status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    req.services?.logger?.error('Robot status retrieval failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      robot_role: req.params.role
    });

    res.status(500).json({
      success: false,
      message: 'Robot status retrieval failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Update robot status endpoint
 * PUT /api/v1/coordination/robot/status
 */
router.put('/robot/status', async (req: ServiceRequest, res: Response) => {
  try {
    const { robot_role, protocol_step, task_progress, current_task, recent_activity } = req.body;

    // Validation
    const validRoles = ['pma', 'backend', 'frontend', 'data', 'devops', 'qa'];
    if (!robot_role || !validRoles.includes(robot_role)) {
      return res.status(400).json({
        success: false,
        message: 'Valid robot_role is required',
        valid_roles: validRoles,
        timestamp: new Date().toISOString()
      });
    }

    if (!protocol_step || protocol_step < 1 || protocol_step > 8) {
      return res.status(400).json({
        success: false,
        message: 'protocol_step must be between 1 and 8',
        timestamp: new Date().toISOString()
      });
    }

    if (task_progress < 0 || task_progress > 100) {
      return res.status(400).json({
        success: false,
        message: 'task_progress must be between 0 and 100',
        timestamp: new Date().toISOString()
      });
    }

    req.services?.logger?.info('Robot status update requested', {
      robot_role,
      protocol_step,
      task_progress,
      current_task
    });

    const updateData = {
      robot_role,
      protocol_step,
      task_progress,
      current_task,
      recent_activity,
      updated_at: new Date().toISOString()
    };

    const result = await req.services?.coordination?.updateRobotStatus(updateData);

    res.status(200).json({
      success: true,
      update_result: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    req.services?.logger?.error('Robot status update failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      body: req.body
    });

    res.status(500).json({
      success: false,
      message: 'Robot status update failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Get action list endpoint
 * GET /api/v1/coordination/actionlist
 */
router.get('/actionlist', async (req: ServiceRequest, res: Response) => {
  try {
    req.services?.logger?.info('Action list requested');

    const actionList = await req.services?.coordination?.getActionList();

    res.status(200).json({
      success: true,
      action_list: actionList,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    req.services?.logger?.error('Action list retrieval failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      message: 'Action list retrieval failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Update action list endpoint
 * PUT /api/v1/coordination/actionlist
 */
router.put('/actionlist', async (req: ServiceRequest, res: Response) => {
  try {
    const { updates } = req.body;

    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Updates object is required',
        timestamp: new Date().toISOString()
      });
    }

    req.services?.logger?.info('Action list update requested', { updates });

    const result = await req.services?.coordination?.updateActionList({
      ...updates,
      updated_at: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      update_result: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    req.services?.logger?.error('Action list update failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      body: req.body
    });

    res.status(500).json({
      success: false,
      message: 'Action list update failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Get coordination status endpoint
 * GET /api/v1/coordination/status
 */
router.get('/status', async (req: ServiceRequest, res: Response) => {
  try {
    req.services?.logger?.info('Coordination status requested');

    // Get real robot status from coordination service
    const robotStatus = await req.services?.coordination?.getAllRobotStatus() || [];
    
    // Calculate overall progress from active robots
    let totalProgress = 0;
    let activeRobots = 0;
    
    for (const robot of robotStatus) {
      if (robot.status === 'active') {
        totalProgress += robot.task_progress;
        activeRobots++;
      }
    }
    
    const overallProgress = activeRobots > 0 ? Math.round(totalProgress / activeRobots) : 0;

    // Get comprehensive project status
    const projectStatus = {
      project_overview: {
        project_id: 'rome_project_001',
        project_name: 'ROME TDD Development',
        current_phase: 'development',
        overall_progress: overallProgress,
        start_date: '2025-08-01',
        target_completion: '2025-09-15',
        active_robot_count: activeRobots,
        total_robot_count: robotStatus.length
      },
      robot_status: robotStatus,
      active_blockers: [
        {
          blocker_id: 'BLK001',
          description: 'Frontend waiting for API contract approval',
          affected_robots: ['frontend'],
          priority: 'high',
          created_at: new Date().toISOString()
        }
      ],
      dependency_map: [
        {
          from_robot: 'backend',
          to_robot: 'frontend',
          dependency_type: 'api_contract',
          status: 'pending',
          description: 'API contract for user authentication'
        }
      ],
      integration_readiness: {
        overall_score: 6.5,
        backend_frontend: 7.2,
        data_backend: 6.8,
        frontend_ui: 5.9,
        last_assessment: new Date().toISOString()
      }
    };

    res.status(200).json({
      success: true,
      coordination_status: projectStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    req.services?.logger?.error('Coordination status retrieval failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      message: 'Coordination status retrieval failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Add dependency endpoint
 * POST /api/v1/coordination/dependency
 */
router.post('/dependency', async (req: ServiceRequest, res: Response) => {
  try {
    const { from_robot, to_robot, dependency_type, description } = req.body;

    const validRoles = ['pma', 'backend', 'frontend', 'data', 'devops', 'qa'];
    
    if (!from_robot || !validRoles.includes(from_robot)) {
      return res.status(400).json({
        success: false,
        message: 'Valid from_robot is required',
        valid_roles: validRoles,
        timestamp: new Date().toISOString()
      });
    }

    if (!to_robot || !validRoles.includes(to_robot)) {
      return res.status(400).json({
        success: false,
        message: 'Valid to_robot is required',
        valid_roles: validRoles,
        timestamp: new Date().toISOString()
      });
    }

    req.services?.logger?.info('Dependency addition requested', {
      from_robot,
      to_robot,
      dependency_type,
      description
    });

    const dependencyData = {
      from_robot,
      to_robot,
      dependency_type: dependency_type || 'general',
      description,
      status: 'active',
      created_at: new Date().toISOString()
    };

    // Mock implementation - in real system this would update dependency tracking
    const result = {
      success: true,
      dependency_id: `DEP_${Date.now()}`,
      dependency: dependencyData
    };

    res.status(201).json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    req.services?.logger?.error('Dependency addition failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      body: req.body
    });

    res.status(500).json({
      success: false,
      message: 'Dependency addition failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

export { router as coordinationRouter };