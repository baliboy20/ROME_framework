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
 *   guard-cli.cjs intake  <state.json> --icr <icr.json> --ts <iso>          (PROP-047/051/052: finalize routing + persist TDRs/constraints)
 *   guard-cli.cjs aib     <state.json> issue   --phase P3 --revision r1 --ts <iso>
 *   guard-cli.cjs aib     <state.json> respond --phase P3 --revision r1 --type CONFIRM|REDIRECT|DELEGATE --ts <iso>
 *   guard-cli.cjs deviation <state.json> file    --tdr TDR-1 --phase P3 --reason "..." --alt "..." --ts <iso>
 *   guard-cli.cjs deviation <state.json> resolve --id DEV-1 --approved true|false --sponsor --ts <iso>
 *
 * Exit codes: 0 = allowed/done, 1 = BLOCKED/invalid, 2 = usage error.
 */
const { load, save, active, finalizeIntake, recordAib, recordAibResponse } = require('./state');
const guard = require('./guard');
const axioms = require('./axioms');

function arg(flag) { const i = process.argv.indexOf(flag); return i >= 0 ? process.argv[i + 1] : undefined; }

const cmd = process.argv[2];
const file = process.argv[3];
if (!cmd || !file) { console.error('usage: guard-cli.cjs <check|verdict|advance|trace|axioms|intake|aib|deviation> <state.json> [opts]'); process.exit(2); }

try {
  const state = load(file);
  if (cmd === 'check') {
    const d = guard.canAdvance(state);
    console.log(`${d.ok ? 'ALLOW' : 'BLOCK'}: ${d.reason} (increment ${active(state).id}, phase ${active(state).currentPhase})`);
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
    console.log(`advanced → ${active(state).currentPhase || '(increment complete)'}`);
    process.exit(0);
  }
  if (cmd === 'intake') {
    // Finalize routing from a Surveyor ICR (validates + downgrades TDRs here —
    // the deterministic path, no LLM in the authority loop).
    const fs = require('fs');
    const { routeFromICR } = require('./routing');
    const { validateTdrs, applyCarrierReliability } = require('./intake');
    const icr = JSON.parse(fs.readFileSync(arg('--icr'), 'utf8'));
    if (Array.isArray(icr.tdrs) && icr.tdrs.length) {
      const v = validateTdrs(icr.tdrs);
      if (!v.ok) { console.error(`BLOCK: invalid TDRs — ${v.errors.join('; ')}`); process.exit(1); }
      const specInput = (icr.inputs || []).find(i => i.form === 'spec');
      icr.tdrs = applyCarrierReliability(icr.tdrs, specInput ? specInput.reliability : undefined);
    }
    const routed = routeFromICR(icr);
    finalizeIntake(state, routed, arg('--ts'));
    save(file, state, arg('--ts'));
    console.log(`intake finalized: routing [${routed.routing.join(', ')}]; ${(routed.tdrs || []).length} TDR(s); ${routed.notes.join(' | ')}`);
    process.exit(0);
  }
  if (cmd === 'aib') {
    const sub = process.argv[4];
    if (sub === 'issue') recordAib(state, arg('--phase'), arg('--revision'), arg('--ts'));
    else if (sub === 'respond') recordAibResponse(state, arg('--phase'), { type: arg('--type'), revision: arg('--revision'), timestamp: arg('--ts') });
    else { console.error('usage: guard-cli.cjs aib <state.json> issue|respond --phase P3|P4 --revision r --ts <iso> [--type CONFIRM|REDIRECT|DELEGATE]'); process.exit(2); }
    save(file, state, arg('--ts'));
    console.log(`aib ${sub}: ${arg('--phase')} rev ${arg('--revision')}${sub === 'respond' ? ` ${arg('--type')}` : ''}`);
    process.exit(0);
  }
  if (cmd === 'deviation') {
    const sub = process.argv[4];
    if (sub === 'file') {
      guard.recordTdrDeviation(state, { tdr: arg('--tdr'), phase: arg('--phase'), reason: arg('--reason'), proposedAlternative: arg('--alt'), timestamp: arg('--ts') });
    } else if (sub === 'resolve') {
      // --sponsor is a bare flag: its presence asserts the resolution is the
      // sponsor's recorded answer (ROME-AX-30). Without it, guard refuses.
      guard.resolveTdrDeviation(state, { deviation: arg('--id'), approved: arg('--approved') === 'true', sponsor: process.argv.includes('--sponsor'), timestamp: arg('--ts') });
    } else { console.error('usage: guard-cli.cjs deviation <state.json> file|resolve [--tdr TDR-1 --phase P3 --reason .. --alt ..] [--id DEV-1 --approved true|false --sponsor] --ts <iso>'); process.exit(2); }
    save(file, state, arg('--ts'));
    console.log(`deviation ${sub}: ${sub === 'file' ? arg('--tdr') : arg('--id')}`);
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
