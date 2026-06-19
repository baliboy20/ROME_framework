/**
 * state.json — the orchestrator's live lifecycle state (source of truth, D2).
 *
 * Part of ROME-PROP-035 §6a / ROME-PLAN-035 Stage 2. Pure persistence + factory;
 * all enforcement lives in guard.js. No external dependencies.
 */

const fs = require('fs');
const path = require('path');
const { STATUS, resolveRouting } = require('./lifecycle');

const SCHEMA_VERSION = 1;

/**
 * Create a fresh state for a project.
 * @param {object} opts { project, frameworkVersion, routing?, timestamp }
 */
function createState({ project, frameworkVersion = 'unknown', routing, timestamp } = {}) {
  if (!project) throw new Error('createState: project is required');
  if (!timestamp) throw new Error('createState: timestamp is required (no Date.now in lib)');
  const routed = resolveRouting(routing);
  const phases = {};
  routed.forEach((id, i) => {
    phases[id] = { status: i === 0 ? STATUS.IN_PROGRESS : STATUS.PENDING };
  });
  return {
    schemaVersion: SCHEMA_VERSION,
    project,
    frameworkVersion,
    createdAt: timestamp,
    updatedAt: timestamp,
    routing: routed,
    currentPhase: routed[0],
    phases,
    gateLedger: [],     // { gate, phase, verdict, role, timestamp, note? }
    blockers: [],       // { id, phase, description, owner, status }
    dispatch: [],       // { agent, role, phase, status, timestamp }
    budget: { tokens: 0, ceiling: null },
    traceability: { deltas: [] }, // { requirement, produces, component?, phase, role, agent }
    verification: {},   // phase → { key: { pass, detail, timestamp } } — guard preconditions
    audit: [],          // append-only audit entries mirrored to activity-log MCP
  };
}

function load(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const state = JSON.parse(raw);
  if (state.schemaVersion !== SCHEMA_VERSION) {
    throw new Error(`state.json schema ${state.schemaVersion} != expected ${SCHEMA_VERSION}`);
  }
  return state;
}

function save(file, state, timestamp) {
  if (timestamp) state.updatedAt = timestamp;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(state, null, 2) + '\n');
  return file;
}

module.exports = { SCHEMA_VERSION, createState, load, save };
