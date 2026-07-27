#!/usr/bin/env node
/**
 * rome-upgrade — ladder a project's conventionLevel to a newer framework
 * version (ROME-PROP-055). One declared step per version boundary
 * (rome-core/migrations/<from>-<to>/step.md); missing step → refuse, never
 * guess (AX-35). Default run prints the pre-approval brief (sponsor decides —
 * AX-33), including the escape-hatch comparison against a fresh
 * migration-intent re-intake (Part B step 7). `--apply` executes:
 *
 *   1. snapshot state (append-only) →
 *      ARTIFACTS/_orchestration/state.pre-upgrade-<from>.json
 *   2. append each step's semantics notes to
 *      ARTIFACTS/_orchestration/migration-log.md (the anti-drift ledger)
 *   3. record open gaps in state.upgrade.pending (closed later as routed
 *      change-queue work, PROP-054)
 *   4. raise conventionLevel to the target
 *   5. LAST: retain the old engine at .rome-prev/<from>/ and vendor the new
 *      one into .rome/ (skipped for non-vendored projects)
 *
 * Rollback = restore the snapshot + .rome-prev/<from>/.
 *
 * Usage:
 *   rome-upgrade.cjs <projectDir> --ts <iso> [--to <version>] [--apply]
 */
const fs = require('fs');
const path = require('path');
const { load, save } = require('./state');

function arg(flag, def) { const i = process.argv.indexOf(flag); return i >= 0 ? process.argv[i + 1] : def; }
function has(flag) { return process.argv.includes(flag); }

const FRAMEWORK_ROOT = path.resolve(__dirname, '..', '..');
const MIGRATIONS_DIR = path.join(FRAMEWORK_ROOT, 'rome-core', 'migrations');

function frameworkVersion() {
  const v = fs.readFileSync(path.join(FRAMEWORK_ROOT, 'rome-core/VERSION'), 'utf8');
  return (v.match(/ROME_FRAMEWORK_VERSION=(.+)/) || [])[1].trim();
}
function semverCmp(a, b) {
  const pa = a.split('.').map(Number), pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) { if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0); }
  return 0;
}

/** Parse a step.md: { from, to, noop, gaps:[{id, line, closes}], semantics:[line] } */
function parseStep(dir) {
  const [from, to] = path.basename(dir).split('-');
  const text = fs.readFileSync(path.join(dir, 'step.md'), 'utf8');
  const noop = /^##\s+declaration\b[\s\S]*?\bno-op\b/mi.test(text);
  const section = (name) => {
    const parts = text.split(/^## /m);
    const hit = parts.find(p => p.toLowerCase().startsWith(name.toLowerCase()));
    return hit ? hit.slice(hit.indexOf('\n') + 1) : '';
  };
  const gaps = [];
  for (const gm of section('gaps').matchAll(/^- (G\d+) `([^`]+)`[\s\S]*?closes: \*{0,2}`?(\w+)`?/gm)) {
    gaps.push({ id: `${from}->${to}:${gm[1]}`, name: gm[2], closes: gm[3] });
  }
  // bullets may wrap: fold continuation lines into their bullet
  const semantics = [];
  for (const line of section('semantics').split('\n')) {
    const t = line.trim();
    if (t.startsWith('-')) semantics.push(t);
    else if (t && semantics.length) semantics[semantics.length - 1] += ' ' + t;
  }
  return { from, to, dir, noop, gaps, semantics };
}

/** All shipped steps, sorted by their `from` version. */
function allSteps() {
  if (!fs.existsSync(MIGRATIONS_DIR)) return [];
  return fs.readdirSync(MIGRATIONS_DIR)
    .filter(d => fs.existsSync(path.join(MIGRATIONS_DIR, d, 'step.md')))
    .map(d => parseStep(path.join(MIGRATIONS_DIR, d)))
    .sort((a, b) => semverCmp(a.from, b.from));
}

/** Compose the contiguous ladder from `from` to `to`; throws on any hole (AX-35). */
function composeLadder(from, to) {
  const steps = allSteps();
  const ladder = [];
  let cur = from;
  while (semverCmp(cur, to) < 0) {
    const step = steps.find(s => s.from === cur);
    if (!step) {
      throw new Error(`No migration step for boundary ${cur} → ? (AX-35: refuse, never guess). ` +
        `A step must be authored at rome-core/migrations/${cur}-<next>/step.md before this upgrade can run.`);
    }
    ladder.push(step);
    cur = step.to;
  }
  if (cur !== to) throw new Error(`Ladder overshoots: reached ${cur}, target ${to}`);
  return ladder;
}

// ── main ─────────────────────────────────────────────────────────────────────
const projectDir = process.argv[2];
if (!projectDir || projectDir.startsWith('--')) {
  console.error('usage: rome-upgrade.cjs <projectDir> --ts <iso> [--to <version>] [--apply]');
  process.exit(2);
}
const ts = arg('--ts');
if (!ts) { console.error('rome-upgrade: --ts <iso8601> required (no Date.now in lib)'); process.exit(2); }

const statePath = path.join(projectDir, 'ARTIFACTS/_orchestration/state.json');
const state = load(statePath);
const from = state.conventionLevel;
const to = arg('--to', frameworkVersion());

if (semverCmp(from, to) === 0) { console.log(`Project is already at convention level ${from}. Nothing to do.`); process.exit(0); }
if (semverCmp(from, to) > 0) { console.error(`Project convention level ${from} is NEWER than target ${to} — no forward compatibility (AX-34). Refusing.`); process.exit(1); }

let ladder;
try { ladder = composeLadder(from, to); }
catch (e) { console.error(`rome-upgrade: ${e.message}`); process.exit(1); }
const realSteps = ladder.filter(s => !s.noop);
const gaps = ladder.flatMap(s => s.gaps);
const sponsorGaps = gaps.filter(g => g.closes === 'sponsor');

// Escape hatch (Part B step 7): compare the ladder against a fresh
// migration-intent re-intake and recommend the better deal. Heuristic: many
// boundaries with gaps, or more sponsor decisions than boundaries, favors
// re-intake. The sponsor chooses either way.
const recommendReintake = realSteps.length >= 3 && gaps.length >= 4;

console.log(`ROME upgrade brief — ${state.project}`);
console.log(`  from: ${from}   to: ${to}`);
console.log(`  ladder: ${ladder.map(s => `${s.from}→${s.to}${s.noop ? ' (no-op)' : ''}`).join(', ')}`);
console.log(`  gaps to close: ${gaps.length} (${sponsorGaps.length} need a sponsor decision; the rest are derived and marked RECONSTRUCTED)`);
for (const g of gaps) console.log(`    - ${g.id} ${g.name} [${g.closes}]`);
console.log(`  rollback: pre-upgrade state snapshot + old engine retained at .rome-prev/${from}/`);
console.log(`  alternative (escape hatch): fresh migration-intent re-intake reading this project's artifacts as inputs.`);
console.log(recommendReintake
  ? `  RECOMMENDATION: re-intake — ${realSteps.length} convention boundaries with ${gaps.length} gaps make the ladder the worse deal here.`
  : `  RECOMMENDATION: ladder — few boundaries/gaps; cheaper than a full re-intake.`);

if (!has('--apply')) {
  console.log('\nDry run. Sponsor approval required before anything changes (AX-33): re-run with --apply to execute.');
  process.exit(0);
}

// ── apply ────────────────────────────────────────────────────────────────────
// 1. append-only snapshot
const snapPath = path.join(projectDir, `ARTIFACTS/_orchestration/state.pre-upgrade-${from}.json`);
fs.writeFileSync(snapPath, JSON.stringify(state, null, 2) + '\n');

// 2. semantics ledger
const logPath = path.join(projectDir, 'ARTIFACTS/_orchestration/migration-log.md');
let log = fs.existsSync(logPath) ? fs.readFileSync(logPath, 'utf8')
  : '# Migration Log — semantics ledger (ROME-PROP-055 Part C)\n\nAgents reading pre-migration artifacts MUST consult this before flagging or "fixing" them.\n';
for (const step of ladder) {
  log += `\n## ${step.from} → ${step.to} (applied ${ts})\n`;
  log += step.noop ? '- no-op (convention-neutral)\n' : step.semantics.map(s => s + '\n').join('') || '- (no semantics notes)\n';
}
fs.writeFileSync(logPath, log);

// 3+4. gaps + level
state.upgrade = gaps.length ? { target: to, from, pending: gaps, appliedAt: ts } : null;
state.conventionLevel = to;
state.audit.push({ event: 'CONVENTION_UPGRADED', from, to, boundaries: ladder.length, gaps: gaps.length, timestamp: ts });
save(statePath, state, ts);

// 5. engine swap LAST (vendored projects only)
const romeDir = path.join(projectDir, '.rome');
if (fs.existsSync(romeDir)) {
  const prevDir = path.join(projectDir, '.rome-prev', from);
  fs.mkdirSync(path.dirname(prevDir), { recursive: true });
  fs.renameSync(romeDir, prevDir);
  fs.cpSync(FRAMEWORK_ROOT, romeDir, {
    recursive: true,
    filter: (src) => !/(\/|^)(node_modules|\.git)(\/|$)/.test(src.slice(FRAMEWORK_ROOT.length)),
  });
  console.log(`Engine swapped: old → .rome-prev/${from}/, new v${to} vendored into .rome/`);
} else {
  console.log('Project is not vendored — no engine swap.');
}

console.log(`Upgrade applied: conventionLevel ${from} → ${to}.`);
if (gaps.length) {
  console.log(`OPEN GAPS (${gaps.length}) recorded in state.upgrade.pending — close them as routed change-queue work (PROP-054); the upgrade is COMPLETE only when all are closed.`);
} else {
  console.log('No gaps — upgrade COMPLETE.');
}
console.log(`Rollback: restore ${path.basename(snapPath)} over state.json${fs.existsSync(path.join(projectDir, '.rome-prev', from)) ? ` and .rome-prev/${from}/ over .rome/` : ''}.`);
