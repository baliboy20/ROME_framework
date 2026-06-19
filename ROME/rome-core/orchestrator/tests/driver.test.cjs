/** Driver next-action regression (PLAN-035 §6d). Run: node tests/driver.test.cjs */
const { createState } = require('../state');
const { PHASE_BY_ID } = require('../lifecycle');
const guard = require('../guard');
const { recordDispatch, processReturn } = require('../subagent');
const { recordVerification } = require('../verification');
const { nextAction } = require('../driver');

const TS = '2026-06-18T00:00:00Z';
let passed = 0, failed = 0;
function ok(n, c) { if (c) { console.log(`  ✓ ${n}`); passed++; } else { console.log(`  ✗ ${n}`); failed++; } }
function produce(s, role, phase) {
  recordDispatch(s, { agent: `${role}-${phase}`, role, phase, timestamp: TS });
  processReturn(s, { agent: `${role}-${phase}`, role, phase, status: 'COMPLETE', summary: 'x', artifacts: [], traceabilityDeltas: [] }, TS);
}
function satisfy(s, phase) { for (const k of PHASE_BY_ID[phase].requires || []) recordVerification(s, phase, k, true, null, TS); return s; }

console.log('driver regression:');

const s = createState({ project: 'd', frameworkVersion: 't', timestamp: TS });

// P0: nothing produced → DISPATCH bootstrap
(() => { const na = nextAction(s); ok('P0 first action = DISPATCH bootstrap', na.step === 'DISPATCH' && na.owner === 'bootstrap'); })();

// P0 produced, no gate → ADVANCE
(() => { produce(s, 'bootstrap', 'P0'); const na = nextAction(s); ok('P0 produced → ADVANCE (no gate)', na.step === 'ADVANCE'); })();

guard.advance(s, TS); // → P1

// P1: not produced → DISPATCH talib
(() => { const na = nextAction(s); ok('P1 → DISPATCH talib', na.step === 'DISPATCH' && na.owner === 'talib'); })();

// P1 produced, facts outstanding → VERIFY (mechanical checks before the gate)
(() => { produce(s, 'talib', 'P1'); const na = nextAction(s); ok('P1 produced → VERIFY (facts first)', na.step === 'VERIFY' && na.outstanding.includes('aordl')); })();

// P1 facts recorded, no verdict → REQUEST_GATE (sarah)
(() => { satisfy(s, 'P1'); const na = nextAction(s); ok('P1 verified → REQUEST_GATE from sarah', na.step === 'REQUEST_GATE' && na.gateRole === 'sarah'); })();

// P1 approved + facts → ADVANCE
(() => { guard.recordGateVerdict(s, { phase: 'P1', verdict: 'APPROVE', role: 'sarah', timestamp: TS }); const na = nextAction(s); ok('P1 approved+verified → ADVANCE', na.step === 'ADVANCE'); })();

// drive to completion, expect done
(() => {
  guard.advance(s, TS); // P2
  for (const p of ['P2', 'P3', 'P4', 'P5']) {
    produce(s, 'x', p);
    satisfy(s, p);
    guard.recordGateVerdict(s, { phase: p, verdict: 'APPROVE', role: 'sarah', timestamp: TS });
    guard.advance(s, TS);
  }
  ok('completed → done', nextAction(s).done === true);
})();

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log('All driver tests passed!');
