/**
 * Guard regression — proves ROME-PROP-035 §3.5 deterministic enforcement.
 * Pure, headless, no deps. Run: node tests/guard.test.cjs
 */
const os = require('os');
const fs = require('fs');
const path = require('path');
const { STATUS, VERDICT, PHASE_BY_ID } = require('../lifecycle');
const { createState, save, load } = require('../state');
const { recordGateVerdict, canAdvance, advance, isComplete, latestVerdict } = require('../guard');
const { recordVerification } = require('../verification');
const { recordDispatch } = require('../subagent');

const TS = '2026-06-18T00:00:00Z';
let passed = 0, failed = 0;
function ok(name, cond) { if (cond) { console.log(`  ✓ ${name}`); passed++; } else { console.log(`  ✗ ${name}`); failed++; } }
function threw(fn) { try { fn(); return false; } catch { return true; } }
function fresh() { return createState({ project: 'demo', frameworkVersion: 'test', timestamp: TS }); }
// record the mechanical facts a phase requires (so the guard precondition passes)
function satisfy(s, phase) { for (const k of PHASE_BY_ID[phase].requires || []) recordVerification(s, phase, k, true, null, TS); return s; }

console.log('guard regression:');

// 1. P0 has no gate → advances without a verdict
(() => {
  const s = fresh();
  ok('starts at P0 IN_PROGRESS', s.currentPhase === 'P0' && s.phases.P0.status === STATUS.IN_PROGRESS);
  ok('P0 (no gate) may advance with no verdict', canAdvance(s).ok === true);
  advance(s, TS);
  ok('after advance currentPhase is P1', s.currentPhase === 'P1');
  ok('P0 marked COMPLETE', s.phases.P0.status === STATUS.COMPLETE);
})();

// 2. Gated phase blocked without a verdict
(() => {
  const s = fresh(); advance(s, TS); // at P1
  ok('P1 blocked with no GATE-P1 verdict', canAdvance(s).ok === false);
  ok('advance() throws when blocked', threw(() => advance(s, TS)));
})();

// 3. Self-approval / wrong-role rejected (the core EP-5 guard)
(() => {
  const s = fresh(); advance(s, TS); // at P1
  ok('talib (producer) cannot record GATE-P1', threw(() =>
    recordGateVerdict(s, { phase: 'P1', verdict: VERDICT.APPROVE, role: 'talib', timestamp: TS })));
  ok('pma cannot record GATE-P1 either', threw(() =>
    recordGateVerdict(s, { phase: 'P1', verdict: VERDICT.APPROVE, role: 'pma', timestamp: TS })));
  ok('still blocked after rejected verdicts', canAdvance(s).ok === false);
})();

// 4. BLOCK verdict prevents advance; later APPROVE allows it (latest wins)
(() => {
  const s = fresh(); advance(s, TS); // at P1
  recordGateVerdict(s, { phase: 'P1', verdict: VERDICT.BLOCK, role: 'sarah', timestamp: TS });
  ok('P1 BLOCKED status after BLOCK verdict', s.phases.P1.status === STATUS.BLOCKED);
  ok('cannot advance on BLOCK', canAdvance(s).ok === false);
  recordGateVerdict(s, { phase: 'P1', verdict: VERDICT.APPROVE, role: 'sarah', timestamp: TS });
  satisfy(s, 'P1');
  ok('latest verdict is APPROVE', latestVerdict(s, 'P1').verdict === VERDICT.APPROVE);
  ok('can advance after corrective APPROVE', canAdvance(s).ok === true);
})();

// 5. Open blocker prevents advance even with APPROVE
(() => {
  const s = fresh(); advance(s, TS); // at P1
  recordGateVerdict(s, { phase: 'P1', verdict: VERDICT.APPROVE, role: 'sarah', timestamp: TS });
  satisfy(s, 'P1');
  s.blockers.push({ id: 'BLK-1', phase: 'P1', description: 'x', owner: 'talib', status: 'OPEN' });
  ok('open blocker blocks advance', canAdvance(s).ok === false);
  s.blockers[0].status = 'RESOLVED';
  ok('resolved blocker unblocks', canAdvance(s).ok === true);
})();

// 6. Ungated-phase verdict rejected
(() => {
  const s = fresh();
  ok('recording a verdict on P0 (no gate) throws', threw(() =>
    recordGateVerdict(s, { phase: 'P0', verdict: VERDICT.APPROVE, role: 'sarah', timestamp: TS })));
})();

// 7. Full happy path P0..P5 with verdicts + mechanical facts → isComplete
(() => {
  const s = fresh();
  for (let step = 0; step < 6; step++) {
    const p = s.currentPhase;
    const def = PHASE_BY_ID[p];
    if (def.gate) recordGateVerdict(s, { phase: p, verdict: VERDICT.APPROVE, role: 'sarah', timestamp: TS });
    satisfy(s, p); // record the phase's required mechanical facts
    advance(s, TS);
  }
  ok('lifecycle completes after all gates approved + facts', isComplete(s) === true);
  ok('currentPhase null at completion', s.currentPhase === null);
})();

// 9. Mechanical precondition: APPROVE alone is NOT enough (the §3.5 hardening)
(() => {
  const s = fresh(); advance(s, TS); // at P1 (requires aordl + traceability)
  recordGateVerdict(s, { phase: 'P1', verdict: VERDICT.APPROVE, role: 'sarah', timestamp: TS });
  ok('APPROVE without facts is BLOCKED', canAdvance(s).ok === false);
  ok('reason names the missing check', /mechanical check "aordl"/.test(canAdvance(s).reason));
  recordVerification(s, 'P1', 'aordl', true, null, TS);
  ok('still blocked with only one fact', canAdvance(s).ok === false);
  recordVerification(s, 'P1', 'traceability', true, null, TS);
  ok('advance allowed once verdict + all facts present', canAdvance(s).ok === true);
  // a FAILED fact blocks even with APPROVE
  recordVerification(s, 'P1', 'traceability', false, 'REQ-003 has no test', TS);
  ok('a FAILED fact blocks advance', canAdvance(s).ok === false);
})();

// 8. state.json persistence round-trip
(() => {
  const s = fresh();
  recordGateVerdict(s, { phase: 'P1', verdict: VERDICT.APPROVE, role: 'sarah', timestamp: TS });
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'rome-')), 'state.json');
  save(file, s, TS);
  const r = load(file);
  ok('round-trip preserves gateLedger', r.gateLedger.length === 1 && r.gateLedger[0].role === 'sarah');
  ok('round-trip preserves routing', JSON.stringify(r.routing) === JSON.stringify(s.routing));
})();

// PROP-045 — verdict–dispatch binding. Role is DERIVED from a completed dispatch.
(() => {
  // helper: bring a fresh state to P3 (a gated phase owned by sarah)
  function atP3() {
    const s = fresh();
    advance(s, TS);                       // P0 → P1
    satisfy(s, 'P1'); recordGateVerdict(s, { phase: 'P1', verdict: VERDICT.APPROVE, role: 'sarah', timestamp: TS }); advance(s, TS);
    satisfy(s, 'P2'); recordGateVerdict(s, { phase: 'P2', verdict: VERDICT.APPROVE, role: 'sarah', timestamp: TS }); advance(s, TS);
    return s; // now at P3
  }

  // bound form: a completed sarah dispatch for P3 → verdict accepted, role derived
  const s1 = atP3();
  recordDispatch(s1, { agent: 'sarah-p3', role: 'sarah', phase: 'P3', timestamp: TS });
  const d1 = s1.dispatch.find(x => x.agent === 'sarah-p3'); d1.status = STATUS.COMPLETE;
  recordGateVerdict(s1, { phase: 'P3', verdict: VERDICT.APPROVE, dispatchId: 'sarah-p3', timestamp: TS });
  const led = s1.gateLedger[s1.gateLedger.length - 1];
  ok('PROP-045 bound verdict derives role from dispatch', led.role === 'sarah' && led.dispatchId === 'sarah-p3');

  // unknown dispatch rejected
  const s2 = atP3();
  ok('PROP-045 verdict citing unknown dispatch rejected', threw(() => recordGateVerdict(s2, { phase: 'P3', verdict: VERDICT.APPROVE, dispatchId: 'ghost', timestamp: TS })));

  // wrong-role dispatch rejected (derived role ≠ gate role)
  const s3 = atP3();
  recordDispatch(s3, { agent: 'pma-p3', role: 'pma', phase: 'P3', timestamp: TS });
  s3.dispatch.find(x => x.agent === 'pma-p3').status = STATUS.COMPLETE;
  ok('PROP-045 wrong-role dispatch rejected', threw(() => recordGateVerdict(s3, { phase: 'P3', verdict: VERDICT.APPROVE, dispatchId: 'pma-p3', timestamp: TS })));

  // incomplete dispatch rejected (still RUNNING)
  const s4 = atP3();
  recordDispatch(s4, { agent: 'sarah-run', role: 'sarah', phase: 'P3', timestamp: TS });
  ok('PROP-045 incomplete dispatch rejected', threw(() => recordGateVerdict(s4, { phase: 'P3', verdict: VERDICT.APPROVE, dispatchId: 'sarah-run', timestamp: TS })));

  // legacy unbound form still works but is flagged in the audit
  const s5 = atP3();
  recordGateVerdict(s5, { phase: 'P3', verdict: VERDICT.APPROVE, role: 'sarah', timestamp: TS });
  ok('PROP-045 legacy unbound verdict flagged', s5.audit.some(a => a.event === 'VERDICT_LEGACY_UNBOUND' && a.phase === 'P3'));
})();

// PROP-046 — `integration` is a required P5 fact; its absence blocks advance.
(() => {
  ok('PROP-046 integration is in P5 requires', PHASE_BY_ID['P5'].requires.includes('integration'));
  // record every P5 fact EXCEPT integration → still blocked
  const s = fresh();
  for (const k of PHASE_BY_ID['P5'].requires) if (k !== 'integration') recordVerification(s, 'P5', k, true, null, TS);
  s.currentPhase = 'P5';
  recordDispatch(s, { agent: 'sarah-p5', role: 'sarah', phase: 'P5', timestamp: TS });
  s.dispatch.find(x => x.agent === 'sarah-p5').status = STATUS.COMPLETE;
  recordGateVerdict(s, { phase: 'P5', verdict: VERDICT.APPROVE, dispatchId: 'sarah-p5', timestamp: TS });
  ok('PROP-046 P5 blocked without integration fact', canAdvance(s).ok === false);
  recordVerification(s, 'P5', 'integration', true, null, TS);
  ok('PROP-046 P5 allowed once integration recorded', canAdvance(s).ok === true);
})();

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log('All guard tests passed!');
