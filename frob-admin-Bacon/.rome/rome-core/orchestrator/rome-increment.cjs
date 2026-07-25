#!/usr/bin/env node
/**
 * rome-increment — add an increment to an EXISTING ROME project (ROME-PROP-048).
 * The companion to rome-start: rome-start creates a project; this grows one.
 *
 * Append-only (ROME-AX-19): the prior increment's gate ledger, traceability, and
 * audit are preserved untouched — the active increment is sealed, a new one is
 * begun, and the shared stores continue. A project has no terminal state
 * (ROME-AX-21). The new increment routes provisionally through Surveyor intake
 * (PROP-047 — a new module is new input) unless --no-intake.
 *
 * Usage:
 *   rome-increment.cjs <projectDir> [--intent greenfield|refinement|extension|migration]
 *                                   [--stage <n>] [--prototype] [--no-intake]
 *                                   [--budget <tokens>] --ts <iso>
 */
const path = require('path');
const { load, save, active, sealActive, beginIncrement } = require('./state');
const { routeInitial } = require('./routing');
const { isComplete } = require('./guard');
const { nextAction } = require('./driver');

function arg(flag, def) { const i = process.argv.indexOf(flag); return i >= 0 ? process.argv[i + 1] : def; }
function has(flag) { return process.argv.includes(flag); }

const projectDir = process.argv[2];
if (!projectDir || projectDir.startsWith('--')) { console.error('usage: rome-increment.cjs <projectDir> [--intent ...] [--stage n] [--prototype] [--no-intake] [--budget N] --ts ISO'); process.exit(2); }
const ts = arg('--ts');
if (!ts) { console.error('rome-increment: --ts <iso8601> required (no Date.now in lib)'); process.exit(2); }

const statePath = path.join(projectDir, 'ARTIFACTS/_orchestration/state.json');

try {
  const state = load(statePath); // auto-migrates v1 single-lifecycle states (ROME-MIG-002)
  const prior = active(state);

  // Seal the completed increment first (AX-19: immutable record, nothing deleted).
  if (!prior.sealed) {
    if (!isComplete(state)) {
      console.error(`rome-increment BLOCKED: increment ${prior.id} is incomplete (at ${prior.currentPhase}). Finish or block it before growing the project.`);
      process.exit(1);
    }
    sealActive(state, ts);
  }

  const skipIntake = has('--no-intake');
  const route = routeInitial({ skipIntake, prototype: { enabled: has('--prototype') } });
  const stageFlag = arg('--stage');
  beginIncrement(state, {
    intent: arg('--intent', 'greenfield'),
    stage: stageFlag != null ? Number(stageFlag) : null,
    routing: route.routing,
    awaitingIntake: !skipIntake,
    timestamp: ts,
  });
  const inc = active(state);
  const budgetFlag = arg('--budget');
  if (budgetFlag) inc.budget.ceiling = Number(budgetFlag);
  save(statePath, state, ts);

  const na = nextAction(state);
  console.log(`ROME increment ${inc.id} begun on project: ${state.project}`);
  console.log(`  prior:    increment ${prior.id} sealed — ledger/traceability/audit preserved (ROME-AX-19)`);
  console.log(`  stage:    ${inc.stage != null ? inc.stage : '(unstaged)'}${inc.stage === 0 ? ' — foundation' : inc.stage === 1 ? ' — product MVP slice' : ''}`);
  console.log(`  routing:  ${inc.routing.join(' → ')}${inc.awaitingIntake ? '  [PROVISIONAL — finalized by intake]' : ''}`);
  console.log(`  coverage: shared traceability continues (${(state.traceability.edges || []).length} edges to date, ROME-AX-20)`);
  console.log('');
  console.log(`NEXT ACTION → [${na.step}] ${na.instruction}`);
  console.log(`  stage this increment's inputs in ${path.join(projectDir, '_user_input/raw-requirements')}${inc.stage != null ? `/stage-${inc.stage}` : ''}, then run intake.`);
} catch (e) {
  console.error(`rome-increment BLOCKED: ${e.message}`);
  process.exit(1);
}
