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
 *   guard-cli.cjs scan    <state.json> --ts <iso> [--json] [--req REQ-001]   (PROP-058: derive code/test links from source comments; persists them)
 *   guard-cli.cjs scope   <state.json> --ts <iso> (--from-corpus | --req REQ-A,REQ-B)   (PROP-058: set the increment's in-scope requirements)
 *   guard-cli.cjs verify  <state.json> --ts <iso> --phase P5   (PROP-058: run and record the requirement-scoped facts; the only writer for them)
 *   guard-cli.cjs intake  <state.json> --icr <icr.json> --ts <iso> [--clear-tdrs] [--replace-infra]   (CHG-120: the escapes the guard names)
 *   guard-cli.cjs intake  <state.json> --icr <icr.json> --ts <iso>          (PROP-047/051/052: finalize routing + persist TDRs/constraints)
 *   guard-cli.cjs aib     <state.json> issue   --phase P3 --revision r1 --ts <iso>
 *   guard-cli.cjs aib     <state.json> respond --phase P3 --revision r1 --type CONFIRM|REDIRECT|DELEGATE --ts <iso>
 *   guard-cli.cjs deviation <state.json> file    --tdr TDR-1 --phase P3 [--scope <component>] --reason "..." --alt "..." --ts <iso>
 *   guard-cli.cjs deviation <state.json> resolve --id DEV-1 --approved true|false --sponsor --ts <iso>
 *
 * Exit codes: 0 = allowed/done, 1 = BLOCKED/invalid, 2 = usage error.
 */
const { load, save, active, finalizeIntake, recordAib, recordAibResponse } = require('./state');
const guard = require('./guard');
const axioms = require('./axioms');

function arg(flag) { const i = process.argv.indexOf(flag); return i >= 0 ? process.argv[i + 1] : undefined; }

// PROP-058: the requirement-scoped facts, computed from state. `file` locates
// the project for the AORDL definitions testAdequacy needs.
const SCOPED_KEYS = ['traceability', 'matrix', 'testAdequacy'];
function loadAordl(file) {
  const path = require('path'); const fs = require('fs');
  const dir = path.join(path.resolve(path.dirname(file), '../..'), 'ARTIFACTS/_requirements');
  if (!fs.existsSync(dir)) return null;
  let yaml; try { yaml = require('js-yaml'); } catch { try { yaml = require('../lib/node_modules/js-yaml'); } catch { return null; } }
  const out = [];
  for (const f of fs.readdirSync(dir)) {
    if (!/^REQ-.*\.ya?ml$/i.test(f)) continue;
    try { const d = yaml.load(fs.readFileSync(path.join(dir, f), 'utf8')); if (d && d.ID) out.push(d); } catch { /* validator's job */ }
  }
  return out;
}
function runScopedChecks(state, phase, file) {
  const V = require('./verification');
  const { PHASE_BY_ID } = require('./lifecycle');
  const req = (PHASE_BY_ID[phase] || {}).requires || [];
  const out = {};
  if (req.includes('traceability')) out.traceability = V.checkTraceability(state, undefined, { requireTest: phase === 'P5' });
  if (req.includes('matrix')) out.matrix = V.checkMatrix(state, undefined, { phase });
  if (req.includes('testAdequacy')) {
    const aordl = loadAordl(file);
    out.testAdequacy = aordl ? V.checkTestAdequacy(state, aordl) : { pass: false, state: 'INCONCLUSIVE', detail: 'testAdequacy: AORDL definitions unavailable (no ARTIFACTS/_requirements or js-yaml not installed — run npm install in rome-core/lib)' };
  }
  return out;
}
function driftedFacts(state, file) {
  const inc = active(state); const phase = inc.currentPhase;
  const recs = (inc.verification || {})[phase] || {};
  const fresh = runScopedChecks(state, phase, file);
  const drift = [];
  for (const key of SCOPED_KEYS) {
    if (!recs[key] || !fresh[key]) continue;
    if (!!recs[key].pass !== !!fresh[key].pass) drift.push(`${key}: recorded ${recs[key].pass ? 'PASS' : 'FAIL'}, recomputed ${fresh[key].state || (fresh[key].pass ? 'PASS' : 'FAIL')}`);
  }
  return drift;
}

const cmd = process.argv[2];
const file = process.argv[3];
if (!cmd || !file) { console.error('usage: guard-cli.cjs <check|verdict|advance|trace|scan|scope|verify|axioms|intake|aib|deviation> <state.json> [opts]'); process.exit(2); }

try {
  const state = load(file);
  if (cmd === 'check' || cmd === 'advance') {
    // PROP-058 / AX-40: a recorded requirement-scoped fact must agree with a
    // fresh computation. A record that disagrees is refused, whatever it says.
    const drift = driftedFacts(state, file);
    if (drift.length) { console.log(`BLOCK: recorded fact(s) disagree with recomputation — ${drift.join('; ')} (AX-40; run guard-cli verify)`); process.exit(1); }
  }
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
    if (process.argv.includes('--clear-tdrs')) icr.clearTdrs = true;         // CHG-120: the escape the AX-36 message names
    if (process.argv.includes('--replace-infra')) icr.replaceInfraConstraints = true; // CHG-119
    const routed = routeFromICR(icr);
    finalizeIntake(state, routed, arg('--ts'));
    // PROP-058 §2.4: a non-change increment's scope defaults to the whole corpus.
    if (!active(state).change && !(active(state).scope && active(state).scope.requirements)) {
      const path = require('path');
      const { setScope } = require('./state');
      const dir = path.join(path.resolve(path.dirname(file), '../..'), (state.traceability && state.traceability.reqDir) || 'ARTIFACTS/_requirements');
      const ids = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => /^REQ-[A-Za-z0-9]+.*\.ya?ml$/i.test(f)).map(f => f.match(/^(REQ-[A-Za-z0-9]+)/)[1]) : [];
      setScope(state, ids, 'corpus', arg('--ts'));
    }
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
      // --scope (PROP-056/AX-37): deviation applies to one component/app only;
      // omit for whole-TDR supersession (legacy semantics).
      guard.recordTdrDeviation(state, { tdr: arg('--tdr'), phase: arg('--phase'), scope: arg('--scope'), reason: arg('--reason'), proposedAlternative: arg('--alt'), timestamp: arg('--ts') });
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
    // PROP-058: computed from the edge store every time. The stored table this
    // command used to prefer was never written by any version of the framework.
    const reqId = arg('--req');
    if (!reqId) { console.error('usage: guard-cli.cjs trace <state.json> --req REQ-001'); process.exit(2); }
    const { buildMatrix } = require('./verification');
    const row = buildMatrix(state, [reqId])[reqId];
    const declaredOnly = (state.traceability.edges || []).filter(e => e.req === reqId && !e.stale && e.source !== 'scan' && e.satisfiesHow !== 'documents');
    if (!row.design.length && !row.code.length && !row.tests.length && !(state.traceability.byReq || {})[reqId]) { console.log(`${reqId}: no traceability data`); process.exit(1); }
    console.log(`${reqId}:`);
    console.log(`  status : ${row.status}`);
    if (row.design.length) console.log(`  design (declared) : ${row.design.join(', ')}`);
    if (row.code.length)   console.log(`  code   (scanned)  : ${row.code.join(', ')}`);
    if (row.tests.length)  console.log(`  tests  (scanned)  : ${row.tests.join(', ')}`);
    if (declaredOnly.length) console.log(`  note: ${declaredOnly.length} declared code/test edge(s) ignored as evidence (PROP-058) — run guard-cli scan`);
    const scanned = (state.audit || []).filter(a => a.event === 'TRACEABILITY_SCANNED').pop();
    console.log(scanned ? `  last scan: ${scanned.timestamp} (increment ${scanned.increment})` : '  last scan: never — code/tests above are empty until guard-cli scan --ts runs');
    process.exit(0);
  }
  if (cmd === 'scan') {
    // PROP-058 §2.2: the code/test half of the matrix is read from the source
    // tree, never declared. projectDir is derived from the state path
    // (<project>/ARTIFACTS/_orchestration/state.json).
    const path = require('path');
    const { scanTraceability } = require('./scan');
    const projectDir = path.resolve(path.dirname(file), '../..');
    const r = scanTraceability(projectDir, state);
    if (arg('--ts')) { require('./verification').applyScan(state, r, arg('--ts')); save(file, state, arg('--ts')); }
    const only = arg('--req');
    const edges = only ? r.edges.filter(e => e.req === only) : r.edges;
    if (process.argv.includes('--json')) { process.stdout.write(JSON.stringify({ ...r, edges }, null, 2) + '\n', () => process.exit(0)); return; }
    console.log(`scanned ${r.files} file(s) under ${r.sourceRoot}/ — ${edges.length} link(s), ${r.unattributed.length} unattributed file(s), ${r.unknownIds.length} unknown id(s)${r.corpusChecked ? '' : ' (no requirement corpus found; unknown-id check skipped)'}`);
    let cur = null;
    for (const e of edges) {
      if (e.req !== cur) { cur = e.req; console.log(`${cur}:`); }
      console.log(`  ${e.satisfiesHow === 'validates' ? 'tests' : 'code '} : ${e.location}`);
    }
    if (!only) {
      for (const u of r.unknownIds) console.log(`UNKNOWN ${u.req} at ${u.location}`);
      for (const f of r.unattributed) console.log(`UNATTRIBUTED ${f}`);
    }
    if (!arg('--ts')) console.log('(read-only: pass --ts <iso> to persist the scan into state)');
    process.exit(0);
  }
  if (cmd === 'scope') {
    // PROP-058 §2.4: in-scope requirement ids come from state, never from the
    // caller of a check. --from-corpus reads ARTIFACTS/_requirements/.
    const path = require('path');
    const fs = require('fs');
    const { setScope } = require('./state');
    let ids, source;
    if (process.argv.includes('--from-corpus')) {
      const projectDir = path.resolve(path.dirname(file), '../..');
      const dir = path.join(projectDir, (state.traceability && state.traceability.reqDir) || 'ARTIFACTS/_requirements');
      ids = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => /^REQ-[A-Za-z0-9]+.*\.ya?ml$/i.test(f)).map(f => f.match(/^(REQ-[A-Za-z0-9]+)/)[1]) : [];
      source = 'corpus';
    } else if (arg('--req')) { ids = arg('--req').split(',').map(x => x.trim()).filter(Boolean); source = 'sponsor'; }
    else { console.error('usage: guard-cli.cjs scope <state.json> --ts <iso> (--from-corpus | --req REQ-A,REQ-B)'); process.exit(2); }
    setScope(state, ids, source, arg('--ts'));
    save(file, state, arg('--ts'));
    console.log(`scope set for increment ${active(state).id}: ${ids.length} requirement(s) (${source})`);
    process.exit(0);
  }
  if (cmd === 'verify') {
    // PROP-058: the requirement-scoped facts are computed HERE from state (and
    // the persisted scan) and recorded. Nothing else records them honestly.
    const phase = arg('--phase') || active(state).currentPhase;
    const ts = arg('--ts');
    if (!ts) { console.error('usage: guard-cli.cjs verify <state.json> --ts <iso> [--phase P5]'); process.exit(2); }
    const V = require('./verification');
    const results = runScopedChecks(state, phase, file);
    for (const [key, r] of Object.entries(results)) {
      V.recordVerification(state, phase, key, r.pass, r.detail, ts, r.linked ? { linked: r.linked, state: r.state } : { state: r.state });
      console.log(`${key.padEnd(14)} ${r.state || (r.pass ? 'PASS' : 'FAIL')}${r.detail ? ' — ' + r.detail : ''}`);
    }
    save(file, state, ts);
    process.exit(Object.values(results).every(r => r.pass) ? 0 : 1);
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
