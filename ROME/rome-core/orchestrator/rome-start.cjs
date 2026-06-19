#!/usr/bin/env node
/**
 * rome-start — initialize a ROME project and hand the orchestrator its first
 * action (ROME-PLAN-035 §6d). Scaffolds the workspace, builds an ICR from flags,
 * resolves routing (PROP-036), creates state.json (source of truth), and prints
 * the next deterministic action.
 *
 * Usage:
 *   rome-start.cjs <projectDir> [--intent greenfield|refinement|extension|migration]
 *                               [--prototype] [--budget <tokens>] [--ts <iso>]
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { createState, save } = require('./state');
const { routeFromICR } = require('./routing');
const { nextAction } = require('./driver');

function arg(flag, def) { const i = process.argv.indexOf(flag); return i >= 0 ? process.argv[i + 1] : def; }
function has(flag) { return process.argv.includes(flag); }

// framework root = three levels up from this file (ROME/)
const FRAMEWORK_ROOT = path.resolve(__dirname, '..', '..');

function frameworkVersion() {
  try {
    const v = fs.readFileSync(path.join(FRAMEWORK_ROOT, 'rome-core/VERSION'), 'utf8');
    return (v.match(/ROME_FRAMEWORK_VERSION=(.+)/) || [])[1] || 'unknown';
  } catch { return 'unknown'; }
}
function frameworkCommit() {
  try { return execFileSync('git', ['-C', FRAMEWORK_ROOT, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); }
  catch { return null; }
}
/** Vendor a frozen snapshot of the framework into <projectDir>/.rome/ */
function vendorFramework(projectDir) {
  const dest = path.join(projectDir, '.rome');
  fs.cpSync(FRAMEWORK_ROOT, dest, {
    recursive: true,
    filter: (src) => !/(\/|^)(node_modules|\.git)(\/|$)/.test(src.slice(FRAMEWORK_ROOT.length)),
  });
  return dest;
}

const projectDir = process.argv[2];
if (!projectDir || projectDir.startsWith('--')) { console.error('usage: rome-start.cjs <projectDir> [--intent ...] [--prototype] [--budget N] [--no-vendor] [--ts ISO]'); process.exit(2); }
const ts = arg('--ts');
if (!ts) { console.error('rome-start: --ts <iso8601> required (no Date.now in lib)'); process.exit(2); }

const icr = {
  intent: arg('--intent', 'greenfield'),
  qualityVerdict: 'SUFFICIENT',
  prototype: { enabled: has('--prototype') },
};

let route;
try { route = routeFromICR(icr); }
catch (e) { console.error(`rome-start BLOCKED: ${e.message}`); process.exit(1); }

// scaffold workspace
for (const d of ['_user_input/raw-requirements', 'ARTIFACTS/_orchestration', 'ARTIFACTS/_requirements', 'ARTIFACTS/_analysis', 'ARTIFACTS/_design', 'ARTIFACTS/_config', 'SOURCE']) {
  fs.mkdirSync(path.join(projectDir, d), { recursive: true });
}

const project = path.basename(path.resolve(projectDir));
const version = frameworkVersion();
const commit = frameworkCommit();

// vendor a frozen framework snapshot into the project (default; --no-vendor to skip)
const vendored = !has('--no-vendor');
let vendorPath = null;
if (vendored) vendorPath = vendorFramework(projectDir);

const state = createState({ project, frameworkVersion: version, frameworkCommit: commit, vendored, routing: route.routing, timestamp: ts });
const budgetFlag = arg('--budget');
if (budgetFlag) state.budget.ceiling = Number(budgetFlag);
const statePath = path.join(projectDir, 'ARTIFACTS/_orchestration/state.json');
save(statePath, state, ts);

const na = nextAction(state);
console.log(`ROME project initialized: ${project}`);
console.log(`  framework: v${version}${commit ? ' @ ' + commit.slice(0, 8) : ''}${vendored ? ` (vendored → ${path.join(projectDir, '.rome')})` : ' (not vendored)'}`);
console.log(`  intent:   ${icr.intent}${route.reverseFirst ? ' (brownfield — derive as-is, then forward)' : ' (greenfield — forward-only)'}`);
console.log(`  routing:  ${route.routing.join(' → ')}`);
if (budgetFlag) console.log(`  budget:   ceiling ${budgetFlag} tokens`);
console.log(`  state:    ${statePath}`);
console.log(`  notes:    ${route.notes.join('; ')}`);
console.log('');
console.log(`NEXT ACTION → [${na.step}] ${na.instruction}`);
console.log(`  (place requirements/inputs in ${path.join(projectDir, '_user_input/raw-requirements')})`);
