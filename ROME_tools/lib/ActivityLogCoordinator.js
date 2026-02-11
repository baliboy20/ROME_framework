#!/usr/bin/env node
/**
 * ActivityLogCoordinator - Enhanced coordination protocol for multi-robot execution
 * Provides liveness detection, progress monitoring, and dependency checking
 *
 * Part of ROME-PROP-022: Agentic Loop Optimization
 */

class ActivityLogCoordinator {
  constructor() {
    this.checkInterval = 30000; // 30 seconds between checks
    this.heartbeatTimeout = 90; // 90 seconds = 3 missed heartbeats
    this.progressTimeout = 600; // 10 minutes without progress
    this.dependencyTimeout = 1800; // 30 minutes max wait
  }

  /**
   * Log agent spawn event
   */
  async logAgentSpawn(robotName, agentId, phase) {
    return await mcp__activity_log__append({
      type: "AGENT_SPAWN",
      id: `SPAWN-${robotName}-${Date.now()}`,
      attributes: {
        status: "SPAWNED",
        robot: robotName,
        agent_id: agentId,
        phase: phase,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Log agent heartbeat
   */
  async logHeartbeat(robotName, agentId, context = {}) {
    return await mcp__activity_log__append({
      type: "AGENT_HEARTBEAT",
      id: `HEARTBEAT-${robotName}-${Date.now()}`,
      attributes: {
        status: "ACTIVE",
        robot: robotName,
        agent_id: agentId,
        timestamp: new Date().toISOString(),
        ...context
      }
    });
  }

  /**
   * Check if agent is alive based on heartbeat
   */
  async checkAgentAlive(robotName, phase = null) {
    try {
      const query = { robot: robotName, type: "AGENT_HEARTBEAT" };
      if (phase) query.phase = phase;

      const heartbeats = await mcp__activity_log__query(query);

      if (heartbeats.length === 0) {
        return {
          alive: false,
          reason: "No heartbeats found",
          lastHeartbeat: null
        };
      }

      const lastHeartbeat = heartbeats[heartbeats.length - 1];
      const lastTime = new Date(lastHeartbeat.timestamp || lastHeartbeat.attributes.timestamp);
      const now = new Date();
      const gapSeconds = (now - lastTime) / 1000;

      if (gapSeconds > this.heartbeatTimeout) {
        return {
          alive: false,
          reason: `Last heartbeat ${Math.floor(gapSeconds)}s ago (threshold: ${this.heartbeatTimeout}s)`,
          lastHeartbeat: lastTime,
          gapSeconds: Math.floor(gapSeconds)
        };
      }

      return {
        alive: true,
        lastHeartbeat: lastTime,
        gapSeconds: Math.floor(gapSeconds)
      };
    } catch (error) {
      return {
        alive: false,
        reason: `Error checking heartbeat: ${error.message}`,
        error: error
      };
    }
  }

  /**
   * Check if agent is making progress
   */
  async checkAgentProgressing(robotName, phase) {
    try {
      const events = await mcp__activity_log__query({
        robot: robotName,
        phase: phase
      });

      // Get work events (not heartbeats)
      const workEvents = events.filter(e =>
        e.type === 'STORY' || e.type === 'PHASE' || e.type === 'FEATURE'
      );

      if (workEvents.length === 0) {
        return {
          progressing: false,
          reason: "No work events logged yet",
          stagnantSeconds: 0
        };
      }

      // Get last work event
      const lastWork = workEvents[workEvents.length - 1];
      const lastTime = new Date(lastWork.timestamp || lastWork.attributes.timestamp);
      const now = new Date();
      const stagnantSeconds = (now - lastTime) / 1000;

      // Check if agent is alive (sending heartbeats)
      const heartbeats = events.filter(e => e.type === 'AGENT_HEARTBEAT');
      const recentHeartbeats = heartbeats.filter(h => {
        const hTime = new Date(h.timestamp || h.attributes.timestamp);
        return (now - hTime) / 1000 < 120; // Last 2 minutes
      });

      // Agent alive but no work progress
      if (recentHeartbeats.length > 0 && stagnantSeconds > this.progressTimeout) {
        return {
          progressing: false,
          reason: `Agent alive but no work progress for ${Math.floor(stagnantSeconds / 60)} minutes`,
          lastWorkEvent: lastWork.id,
          lastWorkTime: lastTime,
          stagnantSeconds: Math.floor(stagnantSeconds)
        };
      }

      return {
        progressing: true,
        lastWorkEvent: lastWork.id,
        lastWorkTime: lastTime,
        stagnantSeconds: Math.floor(stagnantSeconds)
      };
    } catch (error) {
      return {
        progressing: false,
        reason: `Error checking progress: ${error.message}`,
        error: error
      };
    }
  }

  /**
   * Check if dependency is satisfied
   */
  async checkDependencySatisfied(dependencyRobot, phase) {
    try {
      const status = await mcp__activity_log__query({
        robot: dependencyRobot,
        phase: phase
      });

      // Check for any pending or in-progress work
      const hasPending = status.some(e => {
        const attrs = e.attributes || {};
        return attrs.status === 'PENDING' || attrs.status === 'IN_PROGRESS';
      });

      return !hasPending;
    } catch (error) {
      console.error(`Error checking dependency: ${error.message}`);
      return false;
    }
  }

  /**
   * Wait for dependency with timeout and logging
   */
  async waitForDependency(dependencyRobot, currentRobot, phase) {
    let attempts = 0;
    const maxAttempts = Math.floor(this.dependencyTimeout / (this.checkInterval / 1000));

    console.log(`⏳ ${currentRobot} waiting for ${dependencyRobot} to complete...`);

    while (attempts < maxAttempts) {
      const satisfied = await this.checkDependencySatisfied(dependencyRobot, phase);

      if (satisfied) {
        await mcp__activity_log__append({
          type: "DEPENDENCY_CHECK",
          id: `DEP-RESOLVED-${currentRobot}-${Date.now()}`,
          attributes: {
            status: "RESOLVED",
            robot: currentRobot,
            blocked_by: dependencyRobot,
            wait_time_seconds: attempts * (this.checkInterval / 1000),
            phase: phase
          }
        });

        console.log(`✅ ${currentRobot} dependency satisfied (waited ${attempts * (this.checkInterval / 1000)}s)`);
        return true;
      }

      // Log waiting status
      await mcp__activity_log__append({
        type: "DEPENDENCY_CHECK",
        id: `DEP-WAITING-${currentRobot}-${Date.now()}`,
        attributes: {
          status: "WAITING",
          robot: currentRobot,
          blocked_by: dependencyRobot,
          check_count: attempts + 1,
          phase: phase
        }
      });

      await new Promise(resolve => setTimeout(resolve, this.checkInterval));
      attempts++;

      // Progress indicator
      if (attempts % 10 === 0) {
        console.log(`⏳ ${currentRobot} still waiting... (${attempts * (this.checkInterval / 1000)}s elapsed)`);
      }
    }

    // Timeout
    await mcp__activity_log__append({
      type: "BLOCKER",
      id: `DEP-TIMEOUT-${currentRobot}-${Date.now()}`,
      attributes: {
        status: "FAILED",
        robot: currentRobot,
        blocked_by: dependencyRobot,
        reason: `Dependency timeout after ${this.dependencyTimeout} seconds`,
        phase: phase
      }
    });

    console.error(`❌ ${currentRobot} dependency timeout after ${this.dependencyTimeout}s`);
    return false;
  }

  /**
   * Get robot status summary
   */
  async getRobotStatus(robotName, phase) {
    try {
      const events = await mcp__activity_log__query({
        robot: robotName,
        phase: phase
      });

      const stories = events.filter(e => e.type === 'STORY');
      const completed = stories.filter(e => e.attributes?.status === 'COMPLETED');
      const inProgress = stories.filter(e => e.attributes?.status === 'IN_PROGRESS');
      const pending = stories.filter(e => e.attributes?.status === 'PENDING');

      const liveness = await this.checkAgentAlive(robotName, phase);
      const progress = await this.checkAgentProgressing(robotName, phase);

      return {
        robot: robotName,
        phase: phase,
        stories: {
          total: stories.length,
          completed: completed.length,
          inProgress: inProgress.length,
          pending: pending.length
        },
        liveness: liveness,
        progress: progress,
        events: events
      };
    } catch (error) {
      return {
        robot: robotName,
        phase: phase,
        error: error.message
      };
    }
  }
}

module.exports = ActivityLogCoordinator;
