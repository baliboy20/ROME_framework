#!/usr/bin/env node
/**
 * rome-start — initialize a ROME project and hand the orchestrator its first
 * action (ROME-PLAN-035 §6d). Scaffolds the workspace, creates state.json (source
 * of truth) with a PROVISIONAL routing, and prints the next action.
 *
 * PROP-047: rome-start no longer fabricates a quality verdict. It routes
 * provisionally THROUGH intake (P0.5), where Surveyor reads the real staged inputs
 * and produces the ICR; the final routing is resolved then (routeFromICR). Intake
 * runs by default; `--no-intake` skips it for a confident, clean greenfield set.
 *
 * Usage:
 *   rome-start.cjs <projectDir> [--intent greenfield|refinement|extension|migration]
 *                               [--prototype] [--force-intake] [--no-intake]
 *                               [--budget <tokens>] [--no-vendor] [--ts <iso>]
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { createState, save, active } = require('./state');
const { routeInitial } = require('./routing');
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
if (!projectDir || projectDir.startsWith('--')) { console.error('usage: rome-start.cjs <projectDir> [--intent ...] [--prototype] [--force-intake] [--no-intake] [--budget N] [--no-vendor] [--ts ISO]'); process.exit(2); }
const ts = arg('--ts');
if (!ts) { console.error('rome-start: --ts <iso8601> required (no Date.now in lib)'); process.exit(2); }

const intent = arg('--intent', 'greenfield');
// Intake (Surveyor P0.5) runs by default; --no-intake skips it for a confident,
// clean greenfield input set. --force-intake is explicit (and the default) — kept
// for clarity and to override a future auto-skip heuristic.
const skipIntake = has('--no-intake') && !has('--force-intake');

// PROP-047: provisional routing only — NO fabricated qualityVerdict. The real
// verdict comes from Surveyor at P0.5 over the inputs the user is about to stage.
const route = routeInitial({ skipIntake, prototype: { enabled: has('--prototype') } });

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

// PROP-054 B.1: sentinel CLAUDE.md — catches sessions opened in the project
// folder by mistake and states the root rule in plain sponsor language.
fs.writeFileSync(path.join(projectDir, 'CLAUDE.md'), `# ${project} — ROME project folder (not a session root)

Document UID: ROME-DEF-003
Document Type: Sentinel (PROP-054 B.1)

You (the agent) have opened a session inside a ROME project folder. Explain
the following to the sponsor in plain language, then act on the first rule
that applies:

1. If \`../ROME/\` exists, this project lives inside a ROME framework clone.
   Ask the sponsor to reopen the Claude session with that parent folder
   (the framework root) as its working directory — everything, including
   changes and bug fixes to this project, runs from there. Do not proceed
   from here.
2. Otherwise this project has been moved out of its framework clone. Its own
   frozen framework copy in \`.rome/\` is the engine. Confirm this with the
   sponsor, treat \`.rome/\` as the framework root, and proceed under
   \`.rome/agents/roma/modes/orchestrator.md\` (re-entry mode: the project is
   already built — ask the sponsor what they want to change, and follow the
   change-queue flow).

This file never restates orchestrator logic. State lives in
\`ARTIFACTS/_orchestration/state.json\` — never hand-edit it.
`);

// PROP-047: routing is provisional until Surveyor's intake produces the real ICR.
// PROP-048: increment 0 carries the lifecycle; the project itself never seals.
const state = createState({ project, frameworkVersion: version, frameworkCommit: commit, vendored, routing: route.routing, intent, awaitingIntake: !skipIntake, timestamp: ts });
const budgetFlag = arg('--budget');
if (budgetFlag) active(state).budget.ceiling = Number(budgetFlag);
const statePath = path.join(projectDir, 'ARTIFACTS/_orchestration/state.json');
save(statePath, state, ts);

const na = nextAction(state);
console.log(`ROME project initialized: ${project}`);
console.log(`  framework: v${version}${commit ? ' @ ' + commit.slice(0, 8) : ''}${vendored ? ` (vendored → ${path.join(projectDir, '.rome')})` : ' (not vendored)'}`);
console.log(`  intent:   ${intent} (greenfield forward-only unless intake reclassifies)`);
console.log(`  routing:  ${route.routing.join(' → ')}${active(state).awaitingIntake ? '  [PROVISIONAL — finalized by intake]' : ''}`);
if (budgetFlag) console.log(`  budget:   ceiling ${budgetFlag} tokens`);
console.log(`  state:    ${statePath}`);
console.log(`  notes:    ${route.notes.join('; ')}`);
console.log('');
console.log(`NEXT ACTION → [${na.step}] ${na.instruction}`);
console.log(`  STEP 1: stage your inputs in ${path.join(projectDir, '_user_input/raw-requirements')}`);
if (active(state).awaitingIntake) {
  console.log(`  STEP 2: run intake — Surveyor (P0.5) reads them, produces the ICR, and finalizes routing.`);
  console.log(`          The framework will NOT proceed on an empty or insufficient input set (PROP-047 AX-17).`);
} else {
  console.log(`  (intake skipped via --no-intake: inputs asserted clean; no quality assessment)`);
}
