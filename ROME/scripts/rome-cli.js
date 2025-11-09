#!/usr/bin/env node

/**
 * @Created 2025-11-09 by Roma
 * @Purpose ROME v6.1 CLI tool for activity log management
 * @Description Allows robots to efficiently read/write project activity status
 */

const fs = require('fs');
const path = require('path');
const { program } = require('commander');
const Table = require('cli-table3');
const chalk = require('chalk');

// Constants
const ACTIVITY_LOG_PATH = path.join(__dirname, '../templates/project-activity-status.json');
const VALID_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED'];
const VALID_SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const VALID_ROBOTS = ['talib', 'pma', 'clara', 'sarah', 'ashok', 'reena', 'charlie', 'roma'];

// Utility: Load activity log
function loadActivityLog() {
  try {
    if (!fs.existsSync(ACTIVITY_LOG_PATH)) {
      console.error(chalk.red(`❌ Activity log not found at ${ACTIVITY_LOG_PATH}`));
      process.exit(1);
    }
    return JSON.parse(fs.readFileSync(ACTIVITY_LOG_PATH, 'utf8'));
  } catch (e) {
    console.error(chalk.red(`❌ Failed to load activity log: ${e.message}`));
    process.exit(1);
  }
}

// Utility: Save activity log
function saveActivityLog(data) {
  try {
    fs.writeFileSync(ACTIVITY_LOG_PATH, JSON.stringify(data, null, 2), 'utf8');
    console.log(chalk.green('✅ Activity log updated'));
  } catch (e) {
    console.error(chalk.red(`❌ Failed to save activity log: ${e.message}`));
    process.exit(1);
  }
}

// Utility: Generate unique ID
function generateId(prefix) {
  const log = loadActivityLog();
  const matching = log.entries.filter(e => e.id.startsWith(prefix));
  const num = matching.length + 1;
  return `${prefix}-${String(num).padStart(3, '0')}`;
}

// Utility: Validate ID format
function isValidId(id, type) {
  const patterns = {
    feature: /^FEAT-\d+-(db|api|ui)$/,
    story: /^STORY-\d+-\d+-\d+-(db|api|ui)$/,
    blocker: /^BLOCK-\d+$/,
    amendment: /^AMD-\d+$/,
    phase: /^PHASE-[0-9a-z]+$/
  };
  return patterns[type] ? patterns[type].test(id) : false;
}

// Command: Update status
program
  .command('update-status <id> <status>')
  .description('Update status of feature or story')
  .option('--notes <text>', 'Add or update notes')
  .action((id, status, options) => {
    if (!VALID_STATUSES.includes(status)) {
      console.error(chalk.red(`❌ Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`));
      process.exit(1);
    }

    const log = loadActivityLog();
    const entry = log.entries.find(e => e.id === id);

    if (!entry) {
      console.error(chalk.red(`❌ Entry not found: ${id}`));
      process.exit(1);
    }

    entry.status = status;
    entry.lastUpdate = new Date().toISOString();

    if (options.notes) {
      entry.notes = options.notes;
    }

    if (status === 'COMPLETED' && !entry.completionDate) {
      entry.completionDate = new Date().toISOString();
    }

    if (status === 'IN_PROGRESS' && !entry.startDate) {
      entry.startDate = new Date().toISOString();
    }

    saveActivityLog(log);
    console.log(chalk.cyan(`Updated ${id} → ${chalk.bold(status)}`));
  });

// Command: Add blocker
program
  .command('add-blocker <id> <description>')
  .description('Create blocker for feature or story')
  .option('--severity <level>', 'Severity level (default: HIGH)', 'HIGH')
  .option('--robot <name>', 'Reporting robot (default: roma)', 'roma')
  .action((id, description, options) => {
    if (!VALID_SEVERITIES.includes(options.severity)) {
      console.error(chalk.red(`❌ Invalid severity. Must be one of: ${VALID_SEVERITIES.join(', ')}`));
      process.exit(1);
    }

    if (!VALID_ROBOTS.includes(options.robot)) {
      console.error(chalk.red(`❌ Invalid robot. Must be one of: ${VALID_ROBOTS.join(', ')}`));
      process.exit(1);
    }

    const log = loadActivityLog();
    const entry = log.entries.find(e => e.id === id);

    if (!entry) {
      console.error(chalk.red(`❌ Entry not found: ${id}`));
      process.exit(1);
    }

    const blockerId = generateId('BLOCK');
    const blocker = {
      id: blockerId,
      type: 'blocker',
      severity: options.severity,
      feature: entry.feature || null,
      story: entry.story || null,
      description,
      robot: options.robot,
      status: 'OPEN',
      createdDate: new Date().toISOString(),
      resolvedDate: null
    };

    log.entries.push(blocker);
    entry.blocker = blockerId;
    entry.status = 'BLOCKED';

    log.lastUpdated = new Date().toISOString();
    saveActivityLog(log);
    console.log(chalk.yellow(`🚨 Blocker created: ${blockerId}`));
  });

// Command: Resolve blocker
program
  .command('resolve-blocker <blockerId>')
  .description('Mark blocker as resolved')
  .action((blockerId) => {
    const log = loadActivityLog();
    const blocker = log.entries.find(e => e.id === blockerId && e.type === 'blocker');

    if (!blocker) {
      console.error(chalk.red(`❌ Blocker not found: ${blockerId}`));
      process.exit(1);
    }

    blocker.status = 'RESOLVED';
    blocker.resolvedDate = new Date().toISOString();

    // Clear blocker reference from entry
    const entry = log.entries.find(e => e.blocker === blockerId);
    if (entry) {
      entry.blocker = null;
    }

    log.lastUpdated = new Date().toISOString();
    saveActivityLog(log);
    console.log(chalk.green(`✅ Blocker resolved: ${blockerId}`));
  });

// Command: Request amendment
program
  .command('request-amendment <feature> <description>')
  .description('Request amendment to prior phase work')
  .option('--severity <level>', 'Severity level (default: MEDIUM)', 'MEDIUM')
  .option('--target-phase <phase>', 'Target phase to amend (e.g., 1, 2, 2a)', '2')
  .option('--robot <name>', 'Requesting robot (default: roma)', 'roma')
  .action((feature, description, options) => {
    if (!VALID_SEVERITIES.includes(options.severity)) {
      console.error(chalk.red(`❌ Invalid severity. Must be one of: ${VALID_SEVERITIES.join(', ')}`));
      process.exit(1);
    }

    const log = loadActivityLog();
    const amendmentId = generateId('AMD');

    const amendment = {
      id: amendmentId,
      type: 'amendment',
      severity: options.severity,
      feature,
      story: null,
      description,
      requestedBy: options.robot,
      targetPhase: options['target-phase'],
      status: 'PENDING_REVIEW',
      createdDate: new Date().toISOString(),
      decidedDate: null,
      decision: null
    };

    log.entries.push(amendment);
    log.lastUpdated = new Date().toISOString();
    saveActivityLog(log);
    console.log(chalk.blue(`📋 Amendment requested: ${amendmentId}`));
  });

// Command: Approve amendment
program
  .command('approve-amendment <amendmentId>')
  .description('Approve amendment request')
  .action((amendmentId) => {
    const log = loadActivityLog();
    const amendment = log.entries.find(e => e.id === amendmentId && e.type === 'amendment');

    if (!amendment) {
      console.error(chalk.red(`❌ Amendment not found: ${amendmentId}`));
      process.exit(1);
    }

    amendment.status = 'APPROVED';
    amendment.decision = 'APPROVED';
    amendment.decidedDate = new Date().toISOString();

    log.lastUpdated = new Date().toISOString();
    saveActivityLog(log);
    console.log(chalk.green(`✅ Amendment approved: ${amendmentId}`));
  });

// Command: View activity
program
  .command('view')
  .description('View activity log (filtered)')
  .option('--filter-feature <id>', 'Filter by feature ID')
  .option('--filter-robot <name>', 'Filter by robot name')
  .option('--filter-status <status>', 'Filter by status')
  .option('--filter-type <type>', 'Filter by entry type (feature, story, blocker, amendment, phase)')
  .option('--format <format>', 'Output format: table|json (default: table)', 'table')
  .action((options) => {
    const log = loadActivityLog();
    let entries = log.entries;

    // Apply filters
    if (options['filter-feature']) {
      entries = entries.filter(e => e.feature === options['filter-feature'] || e.id === options['filter-feature']);
    }
    if (options['filter-robot']) {
      entries = entries.filter(e => e.robot === options['filter-robot']);
    }
    if (options['filter-status']) {
      entries = entries.filter(e => e.status === options['filter-status']);
    }
    if (options['filter-type']) {
      entries = entries.filter(e => e.type === options['filter-type']);
    }

    if (options.format === 'json') {
      console.log(JSON.stringify(entries, null, 2));
    } else {
      // Table format
      const table = new Table({
        head: [
          chalk.bold('ID'),
          chalk.bold('Type'),
          chalk.bold('Feature'),
          chalk.bold('Layer'),
          chalk.bold('Robot'),
          chalk.bold('Status'),
          chalk.bold('Notes')
        ],
        colWidths: [20, 12, 15, 12, 10, 15, 30],
        wordWrap: true
      });

      entries.forEach(e => {
        const statusColor = {
          'PENDING': chalk.gray,
          'IN_PROGRESS': chalk.yellow,
          'COMPLETED': chalk.green,
          'BLOCKED': chalk.red,
          'OPEN': chalk.red,
          'RESOLVED': chalk.green,
          'PENDING_REVIEW': chalk.yellow,
          'APPROVED': chalk.green
        };

        const color = statusColor[e.status] || chalk.white;

        table.push([
          e.id,
          e.type,
          e.feature || e.story || '-',
          e.layer || '-',
          e.robot || '-',
          color(e.status),
          (e.notes || e.description || '').substring(0, 25) + '...'
        ]);
      });

      console.log(table.toString());
    }
  });

// Command: Summary
program
  .command('summary')
  .description('Show project summary')
  .action(() => {
    const log = loadActivityLog();

    const stats = {
      totalFeatures: log.entries.filter(e => e.type === 'feature').length,
      totalStories: log.entries.filter(e => e.type === 'story').length,
      completedFeatures: log.entries.filter(e => e.type === 'feature' && e.status === 'COMPLETED').length,
      inProgressStories: log.entries.filter(e => e.type === 'story' && e.status === 'IN_PROGRESS').length,
      blockedEntries: log.entries.filter(e => e.blocker).length,
      openBlockers: log.entries.filter(e => e.type === 'blocker' && e.status === 'OPEN').length,
      pendingAmendments: log.entries.filter(e => e.type === 'amendment' && e.status === 'PENDING_REVIEW').length
    };

    console.log(chalk.bold('\n📊 Project Summary\n'));
    console.log(`Total Features: ${stats.totalFeatures}`);
    console.log(`Total Stories: ${stats.totalStories}`);
    console.log(`Completed Features: ${chalk.green(stats.completedFeatures)}`);
    console.log(`In Progress Stories: ${chalk.yellow(stats.inProgressStories)}`);
    console.log(`Blocked Entries: ${chalk.red(stats.blockedEntries)}`);
    console.log(`Open Blockers: ${chalk.red(stats.openBlockers)}`);
    console.log(`Pending Amendments: ${chalk.yellow(stats.pendingAmendments)}\n`);
  });

program.version('6.1.0').parse(process.argv);

if (process.argv.length < 3) {
  program.outputHelp();
}
