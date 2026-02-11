#!/usr/bin/env node
/**
 * AlertSystem - Detects and reports agent failures, stuck agents, and blockers
 *
 * Part of ROME-PROP-022: Agentic Loop Optimization
 */

const ActivityLogCoordinator = require('../../rome-core/lib/ActivityLogCoordinator');

class AlertSystem {
  constructor(robots = ['ashok', 'reena', 'charlie'], phase = 'P5-generation') {
    this.robots = robots;
    this.phase = phase;
    this.coordinator = new ActivityLogCoordinator();
    this.thresholds = {
      heartbeatGap: 90, // seconds
      stagnation: 600, // 10 minutes
      blockerAge: 900 // 15 minutes
    };
  }

  /**
   * Check for all alert conditions
   */
  async checkForAlerts() {
    const alerts = [];

    // Check each robot
    for (const robotName of this.robots) {
      // Check liveness
      const livenessAlert = await this.checkLivenessAlert(robotName);
      if (livenessAlert) alerts.push(livenessAlert);

      // Check progress
      const progressAlert = await this.checkProgressAlert(robotName);
      if (progressAlert) alerts.push(progressAlert);

      // Check blockers
      const blockerAlert = await this.checkBlockerAlert(robotName);
      if (blockerAlert) alerts.push(blockerAlert);
    }

    return alerts;
  }

  /**
   * Check for agent death (no heartbeat)
   */
  async checkLivenessAlert(robotName) {
    const alive = await this.coordinator.checkAgentAlive(robotName, this.phase);

    if (!alive.alive) {
      return {
        severity: 'ERROR',
        type: 'LIVENESS',
        robot: robotName,
        message: `Agent appears dead: ${alive.reason}`,
        details: alive,
        action: 'Restart agent or force-continue',
        timestamp: new Date().toISOString()
      };
    }

    return null;
  }

  /**
   * Check for stuck agent (alive but not progressing)
   */
  async checkProgressAlert(robotName) {
    const progressing = await this.coordinator.checkAgentProgressing(robotName, this.phase);

    if (!progressing.progressing && progressing.stagnantSeconds > this.thresholds.stagnation) {
      return {
        severity: 'WARNING',
        type: 'PROGRESS',
        robot: robotName,
        message: `Agent stuck: ${progressing.reason}`,
        details: progressing,
        action: 'Check agent output or restart',
        timestamp: new Date().toISOString()
      };
    }

    return null;
  }

  /**
   * Check for long-running blockers
   */
  async checkBlockerAlert(robotName) {
    try {
      const events = await mcp__activity_log__query({
        robot: robotName,
        phase: this.phase
      });

      const blockers = events.filter(e =>
        e.type === 'BLOCKER' && e.attributes?.status === 'WAITING'
      );

      if (blockers.length === 0) return null;

      const latestBlocker = blockers[blockers.length - 1];
      const blockerTime = new Date(latestBlocker.timestamp || latestBlocker.attributes.timestamp);
      const now = new Date();
      const ageSeconds = (now - blockerTime) / 1000;

      if (ageSeconds > this.thresholds.blockerAge) {
        return {
          severity: 'WARNING',
          type: 'BLOCKER',
          robot: robotName,
          message: `Blocked for ${Math.floor(ageSeconds / 60)} minutes`,
          details: {
            blockedBy: latestBlocker.attributes.blocked_by,
            ageSeconds: Math.floor(ageSeconds),
            ageMinutes: Math.floor(ageSeconds / 60)
          },
          action: `Check ${latestBlocker.attributes.blocked_by} status or force-continue`,
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error(`Error checking blockers for ${robotName}:`, error.message);
    }

    return null;
  }

  /**
   * Display alerts in formatted output
   */
  displayAlerts(alerts) {
    if (alerts.length === 0) return;

    console.log('\n🚨 ALERTS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    alerts.forEach(alert => {
      const icon = alert.severity === 'ERROR' ? '❌' : '⚠️';
      console.log(`${icon} ${alert.robot.toUpperCase()}: ${alert.message}`);
      console.log(`   → ${alert.action}`);

      if (alert.details) {
        if (alert.type === 'BLOCKER') {
          console.log(`   Blocked by: ${alert.details.blockedBy} (${alert.details.ageMinutes}m)`);
        } else if (alert.type === 'LIVENESS') {
          if (alert.details.lastHeartbeat) {
            console.log(`   Last heartbeat: ${alert.details.gapSeconds}s ago`);
          }
        }
      }
      console.log('');
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  /**
   * Get alert summary
   */
  getAlertSummary(alerts) {
    const errors = alerts.filter(a => a.severity === 'ERROR').length;
    const warnings = alerts.filter(a => a.severity === 'WARNING').length;

    return {
      total: alerts.length,
      errors: errors,
      warnings: warnings,
      hasErrors: errors > 0,
      hasWarnings: warnings > 0
    };
  }
}

module.exports = AlertSystem;
