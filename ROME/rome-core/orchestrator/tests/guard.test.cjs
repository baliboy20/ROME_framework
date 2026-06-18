/**
 * Guard regression — proves ROME-PROP-035 §3.5 deterministic enforcement.
 * Pure, headless, no deps. Run: node tests/guard.test.cjs
 */
const os = require('os');
const fs = require('fs');
const path = require('path');
const { STATUS, VERDICT } = require('../lifecycle');
const { createState, save, load } = require('../state');
const { recordGateVerdict, canAdvance, advance, isComplete, latestVerdict } = require('../guard');

const TS = '2026-06-18T00:00:00Z';
let passed = 0, failed = 0;
function ok(name, cond) { if (cond) { console.log(`  ✓ ${name}`); passed++; } else { console.log(`  ✗ ${name}`); failed++; } }
function threw(fn) { try { fn(); return false; } catch { return true; } }
function fresh() { return createState({ project: 'demo', frameworkVersion: 'test', timestamp: TS }); }

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
  ok('latest verdict is APPROVE', latestVerdict(s, 'P1').verdict === VERDICT.APPROVE);
  ok('can advance after corrective APPROVE', canAdvance(s).ok === true);
})();

// 5. Open blocker prevents advance even with APPROVE
(() => {
  const s = fresh(); advance(s, TS); // at P1
  recordGateVerdict(s, { phase: 'P1', verdict: VERDICT.APPROVE, role: 'sarah', timestamp: TS });
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

// 7. Full happy path P0..P5 with proper Sarah approvals → isComplete
(() => {
  const s = fresh();
  for (let step = 0; step < 6; step++) {
    const p = s.currentPhase;
    const def = require('../lifecycle').PHASE_BY_ID[p];
    if (def.gate) recordGateVerdict(s, { phase: p, verdict: VERDICT.APPROVE, role: 'sarah', timestamp: TS });
    advance(s, TS);
  }
  ok('lifecycle completes after all gates approved', isComplete(s) === true);
  ok('currentPhase null at completion', s.currentPhase === null);
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

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log('All guard tests passed!');
