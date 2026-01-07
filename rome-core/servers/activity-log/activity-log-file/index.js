#!/usr/bin/env node

/**
 * ROME Activity Log File MCP Server
 * Event-based file system for activity tracking
 */

import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import { parseEventLine, formatEventLine, getCurrentTimestamp, validateEvent } from './lib/event-parser.js';
import { buildState, getHistory } from './lib/state-builder.js';
import { findById, findByStatus, findByRobot, findByPhase } from './lib/query-engine.js';

/**
 * Get project root from current working directory
 * @returns {string} Project root path
 */
function getProjectRoot() {
  return process.cwd();
}

/**
 * Get activity log file path
 * @returns {string} Path to activity-log.txt
 */
function getActivityLogPath() {
  return path.join(getProjectRoot(), 'ARTIFACTS', 'activity-log.txt');
}

/**
 * Get activity state file path
 * @returns {string} Path to activity-state.yaml
 */
function getActivityStatePath() {
  return path.join(getProjectRoot(), 'ARTIFACTS', 'activity-state.yaml');
}

/**
 * Ensure ARTIFACTS directory exists
 */
async function ensureArtifactsDir() {
  const artifactsDir = path.join(getProjectRoot(), 'ARTIFACTS');
  try {
    await fs.access(artifactsDir);
  } catch {
    await fs.mkdir(artifactsDir, { recursive: true });
  }
}

/**
 * Append event to activity log
 * @param {Object} params - {type, id, attributes}
 * @returns {Object} Result with success status and event line
 */
async function appendEvent(params) {
  const { type, id, attributes } = params;

  // Validate input
  if (!type || !id || !attributes) {
    throw new Error('Missing required parameters: type, id, attributes');
  }

  const event = {
    timestamp: getCurrentTimestamp(),
    type: type.toUpperCase(),
    id,
    attributes
  };

  // Validate event structure
  const validation = validateEvent(event);
  if (!validation.valid) {
    throw new Error(`Invalid event: ${validation.errors.join(', ')}`);
  }

  // Format event line
  const eventLine = formatEventLine(event);

  // Ensure ARTIFACTS directory exists
  await ensureArtifactsDir();

  // Get log path
  const logPath = getActivityLogPath();

  // Check if file exists
  let fileExists = false;
  try {
    await fs.access(logPath);
    fileExists = true;
  } catch {
    // File doesn't exist, will create with header
  }

  // If file doesn't exist, create with header
  if (!fileExists) {
    const header = [
      '# ROME Activity Log',
      `# Project: ${path.basename(getProjectRoot())}`,
      `# Created: ${event.timestamp}`,
      '# Format: TIMESTAMP | TYPE | ID | ATTRIBUTES',
      ''
    ].join('\n');
    await fs.writeFile(logPath, header);
  }

  // Append event (atomic operation)
  await fs.appendFile(logPath, eventLine + '\n');

  return {
    success: true,
    event: eventLine,
    timestamp: event.timestamp
  };
}

/**
 * Rebuild activity state from event log
 * @returns {Object} Result with statistics
 */
async function rebuildState() {
  const logPath = getActivityLogPath();
  const statePath = getActivityStatePath();

  // Read event log
  let eventLogContent;
  try {
    eventLogContent = await fs.readFile(logPath, 'utf8');
  } catch (error) {
    throw new Error(`Failed to read activity log: ${error.message}`);
  }

  // Build state
  const state = buildState(eventLogContent);

  // Write state YAML
  const yamlContent = [
    '# ROME Activity State Index',
    '# Auto-generated from activity-log.txt',
    `# Last updated: ${state.metadata.generated}`,
    '# DO NOT EDIT MANUALLY - use rebuild_activity_state()',
    '',
    yaml.dump(state, { indent: 2, lineWidth: 120 })
  ].join('\n');

  await fs.writeFile(statePath, yamlContent);

  return {
    success: true,
    event_count: state.metadata.event_count,
    entry_count: Object.keys(state.phases).length +
                 Object.keys(state.features).length +
                 Object.keys(state.stories).length +
                 Object.keys(state.blockers).length +
                 Object.keys(state.amendments).length,
    generated_at: state.metadata.generated
  };
}

/**
 * Query activity state
 * @param {Object} params - Filter {type, status, robot, phase}
 * @returns {Object} Result with matching entries
 */
async function queryState(params = {}) {
  const statePath = getActivityStatePath();

  // Read state YAML
  let stateContent;
  try {
    stateContent = await fs.readFile(statePath, 'utf8');
  } catch (error) {
    // State file doesn't exist, rebuild it
    await rebuildState();
    stateContent = await fs.readFile(statePath, 'utf8');
  }

  // Parse YAML (skip header comments)
  const lines = stateContent.split('\n');
  const yamlLines = lines.filter(line => !line.startsWith('#'));
  const state = yaml.load(yamlLines.join('\n'));

  // Query based on filter
  let results = [];

  if (params.id) {
    const entry = findById(state, params.id);
    results = entry ? [entry] : [];
  } else if (params.status) {
    results = findByStatus(state, params.status);
  } else if (params.robot) {
    results = findByRobot(state, params.robot);
  } else if (params.phase !== undefined) {
    results = findByPhase(state, params.phase);
  } else {
    // Return all entries
    results = [
      ...Object.entries(state.phases).map(([id, entry]) => ({ id, ...entry })),
      ...Object.entries(state.features).map(([id, entry]) => ({ id, ...entry })),
      ...Object.entries(state.stories).map(([id, entry]) => ({ id, ...entry })),
      ...Object.entries(state.blockers).map(([id, entry]) => ({ id, ...entry })),
      ...Object.entries(state.amendments).map(([id, entry]) => ({ id, ...entry }))
    ];
  }

  return {
    results,
    count: results.length
  };
}

/**
 * Get event history for an entry
 * @param {Object} params - {id}
 * @returns {Object} Result with event history
 */
async function getEventHistory(params) {
  const { id } = params;

  if (!id) {
    throw new Error('Missing required parameter: id');
  }

  const logPath = getActivityLogPath();

  // Read event log
  let eventLogContent;
  try {
    eventLogContent = await fs.readFile(logPath, 'utf8');
  } catch (error) {
    throw new Error(`Failed to read activity log: ${error.message}`);
  }

  // Get history
  const events = getHistory(eventLogContent, id);

  return {
    id,
    events,
    event_count: events.length
  };
}

/**
 * Get activity statistics
 * @returns {Object} Statistics from state
 */
async function getStatistics() {
  const statePath = getActivityStatePath();

  // Read state YAML
  let stateContent;
  try {
    stateContent = await fs.readFile(statePath, 'utf8');
  } catch (error) {
    // State file doesn't exist, rebuild it
    await rebuildState();
    stateContent = await fs.readFile(statePath, 'utf8');
  }

  // Parse YAML
  const lines = stateContent.split('\n');
  const yamlLines = lines.filter(line => !line.startsWith('#'));
  const state = yaml.load(yamlLines.join('\n'));

  return {
    metadata: state.metadata,
    statistics: state.statistics,
    by_robot: Object.entries(state.by_robot).map(([robot, ids]) => ({
      robot,
      count: ids.length
    })),
    by_status: Object.entries(state.by_status).map(([status, ids]) => ({
      status,
      count: ids.length
    })),
    by_phase: Object.entries(state.by_phase).map(([phase, ids]) => ({
      phase,
      count: ids.length
    }))
  };
}

/**
 * MCP Server - Handle tool calls
 */
const tools = {
  'mcp__activity-log__append': appendEvent,
  'mcp__activity-log__rebuild_state': rebuildState,
  'mcp__activity-log__query': queryState,
  'mcp__activity-log__get_history': getEventHistory,
  'mcp__activity-log__get_statistics': getStatistics
};

/**
 * Process MCP request
 * @param {Object} request - JSON-RPC request
 * @returns {Object} JSON-RPC response
 */
async function processRequest(request) {
  const { id, method, params } = request;

  try {
    if (method === 'tools/list') {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          tools: [
            {
              name: 'mcp__activity-log__append',
              description: 'Append event to activity log',
              inputSchema: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['PHASE', 'FEATURE', 'STORY', 'BLOCKER', 'AMENDMENT'] },
                  id: { type: 'string' },
                  attributes: { type: 'object' }
                },
                required: ['type', 'id', 'attributes']
              }
            },
            {
              name: 'mcp__activity-log__rebuild_state',
              description: 'Rebuild activity state from event log',
              inputSchema: { type: 'object', properties: {} }
            },
            {
              name: 'mcp__activity-log__query',
              description: 'Query activity state',
              inputSchema: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  type: { type: 'string' },
                  status: { type: 'string' },
                  robot: { type: 'string' },
                  phase: { type: 'number' }
                }
              }
            },
            {
              name: 'mcp__activity-log__get_history',
              description: 'Get event history for an entry',
              inputSchema: {
                type: 'object',
                properties: {
                  id: { type: 'string' }
                },
                required: ['id']
              }
            },
            {
              name: 'mcp__activity-log__get_statistics',
              description: 'Get activity statistics',
              inputSchema: { type: 'object', properties: {} }
            }
          ]
        }
      };
    }

    if (method === 'tools/call') {
      const toolName = params.name;
      const toolParams = params.arguments || {};

      if (!tools[toolName]) {
        throw new Error(`Unknown tool: ${toolName}`);
      }

      const result = await tools[toolName](toolParams);

      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        }
      };
    }

    throw new Error(`Unknown method: ${method}`);
  } catch (error) {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code: -32603,
        message: error.message
      }
    };
  }
}

/**
 * Main server loop - read from stdin, write to stdout
 */
async function main() {
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  rl.on('line', async (line) => {
    try {
      const request = JSON.parse(line);
      const response = await processRequest(request);
      console.log(JSON.stringify(response));
    } catch (error) {
      console.error('Error processing request:', error);
    }
  });
}

// Run server
main().catch(console.error);
