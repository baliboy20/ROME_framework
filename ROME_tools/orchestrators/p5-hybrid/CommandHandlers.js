#!/usr/bin/env node
/**
 * CommandHandlers - Interactive command handlers for Roma Command Center
 *
 * Part of ROME-PROP-022: Agentic Loop Optimization
 */

const ActivityLogCoordinator = require('../../lib/ActivityLogCoordinator');
const fs = require('fs').promises;
const path = require('path');

class CommandHandlers {
  constructor(dashboard, agents, phase) {
    this.dashboard = dashboard;
    this.agents = agents; // {ashok: agent_id, reena: agent_id, charlie: agent_id}
    this.phase = phase;
    this.coordinator = new ActivityLogCoordinator();
  }

  /**
   * Handle user command input
   */
  async handleCommand(command) {
    const parts = command.trim().split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);

    try {
      switch (cmd) {
        case '/pause':
          await this.handlePause();
          break;

        case '/resume':
          await this.handleResume();
          break;

        case '/details':
          await this.handleDetails(args[0]);
          break;

        case '/tail':
          await this.handleTail(args[0]);
          break;

        case '/force-continue':
          await this.handleForceContinue(args[0], args[1]);
          break;

        case '/restart':
          await this.handleRestart(args[0]);
          break;

        case '/stop':
          await this.handleStop();
          break;

        case '/help':
          this.handleHelp();
          break;

        default:
          console.log(`\n❌ Unknown command: ${cmd}`);
          console.log('Type /help for available commands\n');
      }
    } catch (error) {
      console.error(`\n❌ Error executing command: ${error.message}\n`);
    }
  }

  /**
   * Pause monitoring
   */
  async handlePause() {
    this.dashboard.pause();
  }

  /**
   * Resume monitoring
   */
  async handleResume() {
    await this.dashboard.resume();
  }

  /**
   * Show detailed robot status
   */
  async handleDetails(robotName) {
    if (!robotName || !this.agents[robotName]) {
      console.log('\n❌ Usage: /details <robot>');
      console.log(`Available robots: ${Object.keys(this.agents).join(', ')}\n`);
      return;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🤖 ${robotName.toUpperCase()} DETAILED STATUS`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const status = await this.coordinator.getRobotStatus(robotName, this.phase);

    console.log(`Agent ID: ${this.agents[robotName]}`);
    console.log(`Phase: ${this.phase}`);
    console.log('');

    console.log('Stories:');
    console.log(`  ✅ Completed: ${status.stories.completed}`);
    console.log(`  ⏳ In Progress: ${status.stories.inProgress}`);
    console.log(`  📋 Pending: ${status.stories.pending}`);
    console.log(`  📊 Total: ${status.stories.total}`);
    console.log('');

    if (status.liveness.alive) {
      console.log(`💓 Liveness: ALIVE (last heartbeat ${status.liveness.gapSeconds}s ago)`);
    } else {
      console.log(`❌ Liveness: DEAD (${status.liveness.reason})`);
    }
    console.log('');

    if (status.progress.progressing) {
      console.log(`📈 Progress: ACTIVE (last work ${status.progress.stagnantSeconds}s ago)`);
    } else {
      console.log(`⚠️  Progress: STAGNANT (${status.progress.reason})`);
    }
    console.log('');

    // Recent events
    console.log('Recent Events (last 5):');
    const recentEvents = status.events.slice(-5).reverse();
    recentEvents.forEach(event => {
      const time = new Date(event.timestamp || event.attributes?.timestamp).toLocaleTimeString();
      console.log(`  ${time} - ${event.type}: ${event.id} (${event.attributes?.status || 'N/A'})`);
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Press Enter to return to dashboard...');

    // Wait for enter key
    await new Promise(resolve => {
      const listener = (data) => {
        if (data.toString().includes('\n')) {
          process.stdin.removeListener('data', listener);
          resolve();
        }
      };
      process.stdin.on('data', listener);
    });

    await this.dashboard.render();
  }

  /**
   * Tail agent output
   */
  async handleTail(robotName) {
    if (!robotName || !this.agents[robotName]) {
      console.log('\n❌ Usage: /tail <robot>');
      console.log(`Available robots: ${Object.keys(this.agents).join(', ')}\n`);
      return;
    }

    const agentId = this.agents[robotName];

    console.log(`\n📜 Tailing ${robotName} agent output...`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Try to read agent output file
    // Note: Actual path depends on Claude Code Task tool implementation
    const possiblePaths = [
      `/tmp/claude-task-${agentId}.log`,
      `./agent-output-${agentId}.log`,
      `./.claude/task-output/${agentId}.log`
    ];

    let found = false;
    for (const outputPath of possiblePaths) {
      try {
        const output = await fs.readFile(outputPath, 'utf-8');
        console.log(output);
        found = true;
        break;
      } catch (error) {
        // Try next path
      }
    }

    if (!found) {
      console.log(`⚠️  Agent output file not found for ${robotName} (${agentId})`);
      console.log(`Tried paths: ${possiblePaths.join(', ')}`);
      console.log('\nNote: Agent output logging may not be implemented yet.');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Press Enter to return to dashboard...');

    await new Promise(resolve => {
      const listener = (data) => {
        if (data.toString().includes('\n')) {
          process.stdin.removeListener('data', listener);
          resolve();
        }
      };
      process.stdin.on('data', listener);
    });

    await this.dashboard.render();
  }

  /**
   * Force continue blocked robot
   */
  async handleForceContinue(blockedRobot, dependencyRobot) {
    if (!blockedRobot) {
      console.log('\n❌ Usage: /force-continue <blocked-robot> [dependency-robot]');
      console.log(`Available robots: ${Object.keys(this.agents).join(', ')}\n`);
      return;
    }

    console.log(`\n⚠️  MANUAL OVERRIDE: Forcing ${blockedRobot} to continue\n`);

    // Log manual override
    await mcp__activity_log__append({
      type: "AMENDMENT",
      id: `MANUAL-OVERRIDE-${Date.now()}`,
      attributes: {
        status: "OVERRIDE",
        robot: blockedRobot,
        blocked_by: dependencyRobot || 'unknown',
        operator: "USER",
        reason: "Manual intervention - force continue despite dependency",
        phase: this.phase
      }
    });

    if (dependencyRobot) {
      // Mark dependency as artificially satisfied
      await mcp__activity_log__append({
        type: "PHASE",
        id: `${dependencyRobot}-FORCE-COMPLETE`,
        attributes: {
          status: "COMPLETED",
          robot: dependencyRobot,
          phase: this.phase,
          forced: true,
          operator: "USER"
        }
      });

      console.log(`✅ ${blockedRobot} dependency on ${dependencyRobot} artificially satisfied`);
    } else {
      console.log(`✅ ${blockedRobot} force-continue logged (no specific dependency cleared)`);
    }

    console.log(`💡 ${blockedRobot} agent should now proceed\n`);

    setTimeout(async () => {
      await this.dashboard.render();
    }, 2000);
  }

  /**
   * Restart failed agent
   */
  async handleRestart(robotName) {
    if (!robotName || !this.agents[robotName]) {
      console.log('\n❌ Usage: /restart <robot>');
      console.log(`Available robots: ${Object.keys(this.agents).join(', ')}\n`);
      return;
    }

    console.log(`\n🔧 Restarting ${robotName} agent...\n`);

    // Log restart event
    await mcp__activity_log__append({
      type: "AMENDMENT",
      id: `AGENT-RESTART-${robotName}-${Date.now()}`,
      attributes: {
        status: "RESTARTING",
        robot: robotName,
        old_agent_id: this.agents[robotName],
        operator: "USER",
        reason: "Manual restart requested",
        phase: this.phase
      }
    });

    console.log(`⚠️  Agent restart requires spawning new Task agent`);
    console.log(`   This functionality requires integration with main orchestration command`);
    console.log(`   Current agent ID: ${this.agents[robotName]}\n`);

    setTimeout(async () => {
      await this.dashboard.render();
    }, 2000);
  }

  /**
   * Stop all agents and exit
   */
  async handleStop() {
    console.log('\n🛑 Stopping all agents and exiting...\n');

    // Log shutdown
    await mcp__activity_log__append({
      type: "AMENDMENT",
      id: `ORCHESTRATOR-SHUTDOWN-${Date.now()}`,
      attributes: {
        status: "SHUTDOWN",
        robot: "roma",
        operator: "USER",
        reason: "Manual shutdown requested",
        phase: this.phase
      }
    });

    this.dashboard.stop();

    console.log('✅ Monitoring stopped');
    console.log('⚠️  Note: Background agents may still be running');
    console.log('   Check activity log for their status\n');

    process.exit(0);
  }

  /**
   * Show help
   */
  handleHelp() {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📖 ROMA COMMAND CENTER - AVAILABLE COMMANDS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('/pause                  - Pause monitoring (agents continue)');
    console.log('/resume                 - Resume monitoring');
    console.log('/details <robot>        - Show detailed status for robot');
    console.log('/tail <robot>           - View agent output log');
    console.log('/force-continue <robot> - Manual override for blocked agent');
    console.log('/restart <robot>        - Restart failed agent');
    console.log('/stop                   - Stop monitoring and exit');
    console.log('/help                   - Show this help');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\nAvailable robots: ' + Object.keys(this.agents).join(', '));
    console.log('\nPress Enter to return to dashboard...');

    setTimeout(async () => {
      await this.dashboard.render();
    }, 5000);
  }
}

module.exports = CommandHandlers;
