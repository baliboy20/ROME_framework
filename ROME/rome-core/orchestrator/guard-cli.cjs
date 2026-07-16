#!/usr/bin/env node
/**
 * Guard CLI — the deterministic enforcement entry point (ROME-PROP-035 §3.5).
 * The orchestrator MUST route transitions through this; it exits non-zero to
 * BLOCK, so it can be wired as a hook/guard over state.json mutations.
 *
 * Usage:
 *   guard-cli.cjs check   <state.json>
 *   guard-cli.cjs verdict <state.json> --phase P3 --verdict APPROVE --role sarah --ts <iso> [--note "..."]
 *   guard-cli.cjs advance <state.json> --ts <iso>
 *   guard-cli.cjs trace   <state.json> --req REQ-001
 *
 * Exit codes: 0 = allowed/done, 1 = BLOCKED/invalid, 2 = usage error.
 */
const { load, save } = require('./state');
const guard = require('./guard');
const axioms = require('./axioms');

function arg(flag) { const i = process.argv.indexOf(flag); return i >= 0 ? process.argv[i + 1] : undefined; }

const cmd = process.argv[2];
const file = process.argv[3];
if (!cmd || !file) { console.error('usage: guard-cli.cjs <check|verdict|advance|trace|axioms> <state.json> [opts]'); process.exit(2); }

try {
  const state = load(file);
  if (cmd === 'check') {
    const d = guard.canAdvance(state);
    console.log(`${d.ok ? 'ALLOW' : 'BLOCK'}: ${d.reason} (phase ${state.currentPhase})`);
    process.exit(d.ok ? 0 : 1);
  }
  if (cmd === 'verdict') {
    // PROP-045: --dispatch <agentId> binds the verdict to a real dispatch (role
    // derived). --role is the legacy unbound form (flagged in the audit).
    guard.recordGateVerdict(state, {
      phase: arg('--phase'), verdict: arg('--verdict'),
      dispatchId: arg('--dispatch'), role: arg('--role'),
      timestamp: arg('--ts'), note: arg('--note'),
    });
    save(file, state, arg('--ts'));
    const by = arg('--dispatch') ? `dispatch ${arg('--dispatch')}` : `${arg('--role')} (unbound)`;
    console.log(`recorded ${arg('--verdict')} for ${arg('--phase')} by ${by}`);
    process.exit(0);
  }
  if (cmd === 'advance') {
    guard.advance(state, arg('--ts'));
    save(file, state, arg('--ts'));
    console.log(`advanced → ${state.currentPhase || '(complete)'}`);
    process.exit(0);
  }
  if (cmd === 'trace') {
    const reqId = arg('--req');
    if (!reqId) { console.error('usage: guard-cli.cjs trace <state.json> --req REQ-001'); process.exit(2); }
    const matrix = state.traceability.matrix || {};
    const byReq  = state.traceability.byReq  || {};
    const row = matrix[reqId];
    if (!row && !byReq[reqId]) { console.log(`${reqId}: no traceability data`); process.exit(1); }
    if (row) {
      console.log(`${reqId}:`);
      console.log(`  status : ${row.status}`);
      if (row.design.length)  console.log(`  design : ${row.design.join(', ')}`);
      if (row.code.length)    console.log(`  code   : ${row.code.join(', ')}`);
      if (row.tests.length)   console.log(`  tests  : ${row.tests.join(', ')}`);
    } else {
      console.log(`${reqId}: artifacts = ${byReq[reqId].join(', ')} (no location links yet)`);
    }
    process.exit(0);
  }
  if (cmd === 'axioms') {
    // CHECKED axioms (ROME-PROP-044 / AX-12..16). Detect-after-the-fact, not a
    // gate precondition — reports violations without blocking.
    const { pass, results } = axioms.checkAll(state);
    for (const r of results) {
      if (r.pass) { console.log(`  ok   ${r.axiom}`); }
      else { for (const v of r.violations) console.log(`  FAIL ${r.axiom}: ${v}`); }
    }
    console.log(pass ? 'ALL AXIOMS HOLD' : 'AXIOM VIOLATION(S) FOUND');
    process.exit(pass ? 0 : 1);
  }
  console.error(`unknown command: ${cmd}`); process.exit(2);
} catch (e) {
  console.error(`BLOCK: ${e.message}`);
  process.exit(1);
}
