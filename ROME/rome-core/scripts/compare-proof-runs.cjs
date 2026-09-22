#!/usr/bin/env node
/**
 * PROP-059 AC8 — compare two proof runs of the same test app.
 *
 * Usage: node compare-proof-runs.cjs <before-projectDir> <after-projectDir>
 *
 * Reads ARTIFACTS/_orchestration/state.json from each and prints, per phase:
 * dispatches, dispatches by a role the routing does not assign to that phase,
 * gate verdicts, budget tokens, and the word count of each phase's primary
 * artifact. "Turns Roma ended without a tool call" is not in state.json; count
 * it from the session transcript and enter it by hand in the review document.
 */
const fs = require('fs');
const path = require('path');

const PRIMARY = {
  'P1': 'ARTIFACTS/_requirements/requirements-catalog.md',
  'P2': 'ARTIFACTS/_analysis/requirements-matrix.yaml',
  'P3': 'ARTIFACTS/_design/design-decisions/actionlist.md',
  'P4': 'ARTIFACTS/_config/technical-specs/phase4-handover.md',
};

function load(dir) {
  const p = path.join(dir, 'ARTIFACTS', '_orchestration', 'state.json');
  const state = JSON.parse(fs.readFileSync(p, 'utf8'));
  const inc = state.increments ? state.increments[state.increments.length - 1] : state;
  return { state, inc, dir };
}

function words(file) {
  if (!fs.existsSync(file)) return null;
  return fs.readFileSync(file, 'utf8').split(/\s+/).filter(Boolean).length;
}

function phaseOwners(inc) {
  // routing may be an array of phase ids; owners are read from lifecycle if present
  try {
    const { PHASES } = require('../orchestrator/lifecycle.js');
    const m = {};
    for (const p of PHASES) m[p.id] = new Set(String(p.owner || '').split('|').filter(Boolean).map(s => s.toLowerCase()));
    return m;
  } catch { return {}; }
}

function summarize({ state, inc, dir }) {
  const owners = phaseOwners(inc);
  const phases = {};
  for (const d of inc.dispatch || []) {
    const ph = phases[d.phase] = phases[d.phase] || { dispatches: 0, outsideRouting: 0, models: {} };
    ph.dispatches++;
    ph.models[d.model || '?'] = (ph.models[d.model || '?'] || 0) + 1;
    const own = owners[d.phase];
    if (own && own.size && !own.has(String(d.role).toLowerCase()) && d.role !== 'sarah') ph.outsideRouting++;
  }
  const gates = {};
  for (const g of inc.gateLedger || []) gates[g.gate || g.phase] = g.verdict; // last verdict per gate wins
  const artifacts = {};
  for (const [ph, rel] of Object.entries(PRIMARY)) artifacts[ph] = words(path.join(dir, rel));
  return { phases, gates, tokens: (inc.budget || {}).tokens, artifacts };
}

const [a, b] = process.argv.slice(2);
if (!a || !b) { console.error('usage: compare-proof-runs.cjs <before-projectDir> <after-projectDir>'); process.exit(2); }
const A = summarize(load(a)), B = summarize(load(b));

const rows = [];
const allPhases = new Set([...Object.keys(A.phases), ...Object.keys(B.phases)]);
for (const ph of [...allPhases].sort()) {
  const x = A.phases[ph] || {}, y = B.phases[ph] || {};
  rows.push([`${ph} dispatches`, x.dispatches || 0, y.dispatches || 0]);
  rows.push([`${ph} outside routing`, x.outsideRouting || 0, y.outsideRouting || 0]);
  rows.push([`${ph} models`, JSON.stringify(x.models || {}), JSON.stringify(y.models || {})]);
}
for (const g of new Set([...Object.keys(A.gates), ...Object.keys(B.gates)])) rows.push([`gate ${g}`, A.gates[g] || '-', B.gates[g] || '-']);
rows.push(['budget tokens', A.tokens ?? '-', B.tokens ?? '-']);
for (const ph of Object.keys(PRIMARY)) rows.push([`${ph} artifact words`, A.artifacts[ph] ?? 'missing', B.artifacts[ph] ?? 'missing']);
rows.push(['Roma turns ended without tool call', 'enter by hand', 'enter by hand']);

const w = Math.max(...rows.map(r => r[0].length));
console.log(`${'measure'.padEnd(w)} | before | after`);
console.log(`${'-'.repeat(w)} | ------ | -----`);
for (const [k, x, y] of rows) console.log(`${k.padEnd(w)} | ${x} | ${y}`);
