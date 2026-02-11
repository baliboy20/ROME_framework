#!/usr/bin/env node
/**
 * MonitoringDashboard - Live monitoring interface for Roma Command Center
 *
 * Part of ROME-PROP-022: Agentic Loop Optimization
 */

const ActivityLogCoordinator = require('../../rome-core/lib/ActivityLogCoordinator');
const AlertSystem = require('./AlertSystem');

class MonitoringDashboard {
  constructor(agents, options = {}) {
    this.agents = agents; // {ashok: agent_id, reena: agent_id, charlie: agent_id}
    this.phase = options.phase || 'P5-generation';
    this.refreshInterval = options.refreshInterval || 10000; // 10 seconds
    this.running = true;
    this.coordinator = new ActivityLogCoordinator();
    this.alertSystem = new AlertSystem(Object.keys(agents), this.phase);
    this.commandHandlers = null; // Set externally
  }

  /**
   * Start the monitoring dashboard
   */
  async start() {
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👑 ROMA COMMAND CENTER - P5 GENERATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    // Initial render
    await this.render();

    // Auto-refresh loop
    this.intervalId = setInterval(async () => {
      if (this.running) {
        await this.render();
      }
    }, this.refreshInterval);

    // Enable command input
    console.log('\n> Type /help for commands');
  }

  /**
   * Stop monitoring
   */
  stop() {
    this.running = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  /**
   * Render the dashboard
   */
  async render() {
    // Move cursor to top and clear screen
    process.stdout.write('\x1b[2J\x1b[H');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 P5 GENERATION MONITORING DASHBOARD');
    console.log(`⏰ Last update: ${new Date().toLocaleTimeString()}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Get all events for this phase
    let allEvents = [];
    try {
      allEvents = await mcp__activity_log__query({ phase: this.phase });
    } catch (error) {
      console.error(`❌ Error querying activity log: ${error.message}\n`);
    }

    // Render each robot's status
    for (const robotName of Object.keys(this.agents)) {
      await this.renderRobotStatus(robotName, allEvents);
      console.log('');
    }

    // Overall progress
    await this.renderOverallProgress(allEvents);

    // Check and display alerts
    const alerts = await this.alertSystem.checkForAlerts();
    if (alerts.length > 0) {
      this.alertSystem.displayAlerts(alerts);
    }

    // Command help
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Commands: /pause /resume /details <robot> /tail <robot>');
    console.log('          /force-continue /restart <robot> /stop /help');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('> ');
  }

  /**
   * Render individual robot status
   */
  async renderRobotStatus(robotName, allEvents) {
    const robotEvents = allEvents.filter(e => e.attributes?.robot === robotName);

    // Get stories
    const stories = robotEvents.filter(e => e.type === 'STORY');
    const completed = stories.filter(e => e.attributes?.status === 'COMPLETED');
    const inProgress = stories.filter(e => e.attributes?.status === 'IN_PROGRESS');
    const pending = stories.filter(e => e.attributes?.status === 'PENDING');

    // Get heartbeats
    const heartbeats = robotEvents.filter(e => e.type === 'AGENT_HEARTBEAT');
    const lastHeartbeat = heartbeats[heartbeats.length - 1];
    const heartbeatAge = lastHeartbeat
      ? Math.floor((Date.now() - new Date(lastHeartbeat.timestamp || lastHeartbeat.attributes.timestamp)) / 1000)
      : null;

    // Determine status
    let statusIcon = '⏳';
    let statusText = 'ACTIVE';

    if (heartbeatAge === null) {
      statusIcon = '❓';
      statusText = 'NO HEARTBEAT';
    } else if (heartbeatAge > 90) {
      statusIcon = '💀';
      statusText = 'DEAD';
    } else if (inProgress.length === 0 && pending.length > 0) {
      statusIcon = '🔒';
      statusText = 'WAITING';
    } else if (completed.length > 0 && pending.length === 0 && inProgress.length === 0) {
      statusIcon = '✅';
      statusText = 'COMPLETE';
    }

    console.log(`${statusIcon} ${robotName.toUpperCase()} - ${statusText}`);
    console.log(`   Completed: ${completed.length} | In Progress: ${inProgress.length} | Pending: ${pending.length}`);

    if (heartbeatAge !== null) {
      const heartbeatStatus = heartbeatAge > 90 ? '❌' : '💓';
      console.log(`   ${heartbeatStatus} Last heartbeat: ${heartbeatAge}s ago`);
    } else {
      console.log(`   ⚠️  No heartbeat received yet`);
    }

    // Show current work
    if (inProgress.length > 0) {
      const current = inProgress[0];
      console.log(`   🔨 Working on: ${current.id}`);
    }

    // Show blockers
    const blockers = robotEvents.filter(e =>
      e.type === 'BLOCKER' && e.attributes?.status === 'WAITING'
    );
    if (blockers.length > 0) {
      const blocker = blockers[blockers.length - 1];
      console.log(`   🔒 Blocked by: ${blocker.attributes.blocked_by}`);
    }
  }

  /**
   * Render overall progress
   */
  async renderOverallProgress(allEvents) {
    const stories = allEvents.filter(e => e.type === 'STORY');
    const total = stories.length;
    const completed = stories.filter(e => e.attributes?.status === 'COMPLETED').length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📈 OVERALL PROGRESS: ${completed}/${total} stories (${percentage}%)`);

    if (total > 0) {
      // Progress bar
      const barLength = 40;
      const filledLength = Math.round(barLength * (completed / total));
      const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
      console.log(`   [${bar}]`);
    } else {
      console.log(`   [No stories found in activity log]`);
    }
  }

  /**
   * Pause monitoring (agents continue running)
   */
  pause() {
    this.running = false;
    console.log('\n⏸️  Monitoring paused (agents continue running)');
    console.log('Type /resume to continue monitoring\n');
  }

  /**
   * Resume monitoring
   */
  async resume() {
    this.running = true;
    console.log('\n▶️  Resuming monitoring...\n');
    await this.render();
  }
}

module.exports = MonitoringDashboard;
