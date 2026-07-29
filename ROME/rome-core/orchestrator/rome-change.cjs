#!/usr/bin/env node
/**
 * rome-change — the change-queue shell for a DELIVERED project (ROME-PROP-054).
 *
 * Captures, lists, and (post-confirmation) begins change-scoped runs. The
 * intelligence — trace verification (AX-31), CT classification, sponsor
 * confirmation — stays with Roma + sponsor in the session; this CLI only
 * moves deterministic state. CT-4 (new capability) is refused here: it is an
 * increment (rome-increment.cjs), never a change record (PROP-054 A.1).
 *
 * Usage:
 *   rome-change.cjs <projectDir> --queue "<description>" [--priority HIGH|NORMAL|LOW] --ts <iso>
 *   rome-change.cjs <projectDir> --list
 *   rome-change.cjs <projectDir> --prioritize <CHG-ID> <HIGH|NORMAL|LOW> --ts <iso>
 *   rome-change.cjs <projectDir> --reopen <CHG-ID> --ts <iso>   (PARKED → back in play)
 *   rome-change.cjs <projectDir> --begin <CHG-ID> --ts <iso>    (requires CONFIRMED)
 */
const path = require('path');
const { load, save, active, queueChange, prioritizeChange, reopenChange, beginChange } = require('./state');
const { routeChange } = require('./routing');

function arg(flag, def) { const i = process.argv.indexOf(flag); return i >= 0 ? process.argv[i + 1] : def; }
function has(flag) { return process.argv.includes(flag); }

const projectDir = process.argv[2];
if (!projectDir || projectDir.startsWith('--')) {
  console.error('usage: rome-change.cjs <projectDir> --queue "<description>" --ts ISO | --list | --begin <CHG-ID> --ts ISO');
  process.exit(2);
}
const statePath = path.join(projectDir, 'ARTIFACTS/_orchestration/state.json');
const state = load(statePath);

if (has('--list')) {
  const q = state.changeQueue || [];
  if (!q.length) { console.log('Change queue is empty.'); process.exit(0); }
  // Sponsor-facing order: live work first by priority, then the stash, then
  // delivered history. Order within a band is capture order (stable ids).
  const statusRank = { IN_PROGRESS: 0, CONFIRMED: 1, CLASSIFIED: 2, QUEUED: 3, PARKED: 4, DELIVERED: 5 };
  const prioRank = { HIGH: 0, NORMAL: 1, LOW: 2 };
  const sorted = [...q].sort((a, b) =>
    (statusRank[a.status] - statusRank[b.status]) ||
    (prioRank[a.priority || 'NORMAL'] - prioRank[b.priority || 'NORMAL']) ||
    a.id.localeCompare(b.id));
  for (const c of sorted) {
    console.log(`${c.id}  [${c.status}]${c.status === 'DELIVERED' ? '' : ` ${c.priority || 'NORMAL'}`}${c.ct ? ' ' + c.ct : ''}  ${c.description}`);
  }
  process.exit(0);
}

const ts = arg('--ts');
if (!ts) { console.error('rome-change: --ts <iso8601> required (no Date.now in lib)'); process.exit(2); }

if (arg('--queue')) {
  const entry = queueChange(state, { description: arg('--queue'), priority: arg('--priority', 'NORMAL'), timestamp: ts });
  save(statePath, state, ts);
  console.log(`Queued ${entry.id} [${entry.priority}]: ${entry.description}`);
  console.log('NEXT → in the Roma session: classify against the trace (AX-31), confirm with the sponsor, then --begin.');
  process.exit(0);
}

if (arg('--prioritize')) {
  const id = arg('--prioritize');
  const i = process.argv.indexOf('--prioritize');
  const entry = prioritizeChange(state, id, { priority: process.argv[i + 2], timestamp: ts });
  save(statePath, state, ts);
  console.log(`${entry.id} priority → ${entry.priority}`);
  process.exit(0);
}

if (arg('--reopen')) {
  const entry = reopenChange(state, arg('--reopen'), { timestamp: ts });
  save(statePath, state, ts);
  console.log(`${entry.id} reopened → ${entry.status}${entry.ct ? ` (classification ${entry.ct} kept)` : ''}`);
  process.exit(0);
}

if (arg('--begin')) {
  const id = arg('--begin');
  const entry = (state.changeQueue || []).find(c => c.id === id);
  if (!entry) { console.error(`rome-change: unknown change ${id}`); process.exit(2); }
  const routed = routeChange(entry.ct, entry.blastRadius || {}); // throws unless trace-verified (AX-31) and not CT-4
  beginChange(state, id, { routing: routed.routing, timestamp: ts });
  save(statePath, state, ts);
  console.log(`Change ${id} begun as increment ${state.activeIncrement} (${entry.ct}).`);
  console.log(`  routing: ${routed.routing.join(' → ')}`);
  console.log(`  notes:   ${routed.notes.join('; ')}`);
  process.exit(0);
}

console.error('rome-change: nothing to do (--queue / --list / --prioritize / --reopen / --begin)');
process.exit(2);
