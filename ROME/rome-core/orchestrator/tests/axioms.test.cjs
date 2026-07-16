/**
 * Axiom regression (ROME-PROP-044).
 *
 * Part A: one violation test per ENFORCED axiom (AX-01..08), mapping each to the
 * guard behaviour that enforces it. Test names are tagged "AX-0n" so fidelity
 * check 6 can assert every ENFORCED axiom keeps a violation test (behavioural
 * provenance — closes the "function exists but no longer enforces" gap).
 *
 * Part B: the CHECKED axioms (AX-12..16) in axioms.js.
 *
 * Pure, headless, no deps. Run: node tests/axioms.test.cjs
 */
const { STATUS, VERDICT, PHASE_BY_ID, resolveRouting } = require('../lifecycle');
const { createState } = require('../state');
const { recordGateVerdict, canAdvance, advance } = require('../guard');
const { recordVerification } = require('../verification');
const { recordDispatch } = require('../subagent');
const axioms = require('../axioms');

const TS = '2026-07-16T00:00:00Z';
let passed = 0, failed = 0;
function ok(name, cond) { if (cond) { console.log(`  ✓ ${name}`); passed++; } else { console.log(`  ✗ ${name}`); failed++; } }
function threw(fn) { try { fn(); return false; } catch { return true; } }
function fresh() { return createState({ project: 'demo', frameworkVersion: 'test', timestamp: TS }); }
function satisfy(s, phase) { for (const k of PHASE_BY_ID[phase].requires || []) recordVerification(s, phase, k, true, null, TS); return s; }

console.log('axiom regression:');

// ── Part A — ENFORCED axioms (AX-01..08). Tags are load-bearing for check 6. ──

// AX-01 — only the current routed phase may advance.
(() => {
  const s = fresh();
  s.currentPhase = 'P9-bogus';
  ok('AX-01 non-current/unrouted phase cannot advance', canAdvance(s).ok === false);
})();

// AX-02 — a gated phase advances only on an APPROVE for its gate.
(() => {
  const s = fresh(); advance(s, TS); // → P1
  ok('AX-02 gated P1 blocked with no verdict', canAdvance(s).ok === false);
})();

// AX-03 — verdict accepted only from the designated gate role (EP-5).
(() => {
  const s = fresh(); advance(s, TS);
  ok('AX-03 wrong-role verdict rejected', threw(() => recordGateVerdict(s, { phase: 'P1', verdict: VERDICT.APPROVE, role: 'talib', timestamp: TS })));
})();

// AX-04 — latest verdict wins; a later BLOCK overrides an earlier APPROVE.
(() => {
  const s = fresh(); advance(s, TS); satisfy(s, 'P1');
  recordGateVerdict(s, { phase: 'P1', verdict: VERDICT.APPROVE, role: 'sarah', timestamp: TS });
  recordGateVerdict(s, { phase: 'P1', verdict: VERDICT.BLOCK, role: 'sarah', timestamp: TS });
  ok('AX-04 later BLOCK overrides earlier APPROVE', canAdvance(s).ok === false);
})();

// AX-05 — open blockers prevent advance.
(() => {
  const s = fresh(); advance(s, TS); satisfy(s, 'P1');
  recordGateVerdict(s, { phase: 'P1', verdict: VERDICT.APPROVE, role: 'sarah', timestamp: TS });
  s.blockers.push({ id: 'BLK-1', phase: 'P1', description: 'x', status: 'OPEN' });
  ok('AX-05 open blocker prevents advance', canAdvance(s).ok === false);
})();

// AX-06 — routing may not be reordered.
(() => {
  ok('AX-06 reordered routing rejected', threw(() => resolveRouting(['P1', 'P0'])));
  ok('AX-06 optional-phase omission permitted', Array.isArray(resolveRouting(['P0', 'P1', 'P2', 'P3', 'P4', 'P5'])));
})();

// AX-07 — a verdict on an ungated phase is rejected.
(() => {
  const s = fresh();
  ok('AX-07 verdict on ungated P0 rejected', threw(() => recordGateVerdict(s, { phase: 'P0', verdict: VERDICT.APPROVE, role: 'sarah', timestamp: TS })));
})();

// AX-08 — required mechanical facts must be recorded AND passing.
(() => {
  const s = fresh(); advance(s, TS); // → P1, requires aordl + traceability
  recordGateVerdict(s, { phase: 'P1', verdict: VERDICT.APPROVE, role: 'sarah', timestamp: TS });
  ok('AX-08 APPROVE insufficient without required facts', canAdvance(s).ok === false);
  satisfy(s, 'P1');
  ok('AX-08 advance allowed once facts recorded+passing', canAdvance(s).ok === true);
})();

// ── Part B — CHECKED axioms (AX-12..16) in axioms.js ──

// AX-12 — one Role per Instance.
(() => {
  const s = fresh();
  recordDispatch(s, { agent: 'inst-1', role: 'talib', phase: 'P1', timestamp: TS });
  ok('AX-12 single role per agent passes', axioms.checkOneRolePerInstance(s).pass === true);
  recordDispatch(s, { agent: 'inst-1', role: 'sarah', phase: 'P2', timestamp: TS });
  const r = axioms.checkOneRolePerInstance(s);
  ok('AX-12 same agent two roles fails', r.pass === false && r.violations.length === 1);
})();

// AX-13 — role-level separation of duties (producer role ≠ gate-authority role).
(() => {
  const s = fresh();
  s.traceability.edges.push({ req: 'REQ-1', artifactId: 'c:A', satisfiesHow: 'implements', phase: 'P5', role: 'charlie', agent: 'i1' });
  s.gateLedger.push({ gate: 'GATE-P5', phase: 'P5', verdict: 'APPROVE', role: 'sarah', timestamp: TS });
  ok('AX-13 distinct producer/gate roles pass', axioms.checkSeparationOfDuties(s).pass === true);
  s.gateLedger.push({ gate: 'GATE-P5', phase: 'P5', verdict: 'APPROVE', role: 'charlie', timestamp: TS });
  ok('AX-13 producer holding gate authority fails', axioms.checkSeparationOfDuties(s).pass === false);
})();

// AX-14 — orchestrator spawns; no peer-spawn.
(() => {
  const s = fresh();
  recordDispatch(s, { agent: 'i1', role: 'talib', phase: 'P1', timestamp: TS }); // defaults spawnedBy: roma
  ok('AX-14 orchestrator-spawned dispatch passes', axioms.checkOrchestratorSpawns(s).pass === true);
  recordDispatch(s, { agent: 'i2', role: 'clara', phase: 'P3', timestamp: TS, spawnedBy: 'talib' });
  ok('AX-14 peer-spawned dispatch fails', axioms.checkOrchestratorSpawns(s).pass === false);
})();

// AX-15 — P5 introduces no requirement absent upstream.
(() => {
  const s = fresh();
  s.traceability.edges.push({ req: 'REQ-1', artifactId: 'c:A', satisfiesHow: 'designs', phase: 'P3', role: 'pma', agent: 'i1' });
  s.traceability.edges.push({ req: 'REQ-1', artifactId: 'c:A', satisfiesHow: 'implements', phase: 'P5', role: 'charlie', agent: 'i2' });
  ok('AX-15 P5 req with upstream edge passes', axioms.checkP5NoNewRequirements(s).pass === true);
  s.traceability.edges.push({ req: 'REQ-NEW', artifactId: 'c:B', satisfiesHow: 'implements', phase: 'P5', role: 'charlie', agent: 'i2' });
  const r = axioms.checkP5NoNewRequirements(s);
  ok('AX-15 P5-introduced req fails', r.pass === false && r.violations[0].includes('REQ-NEW'));
})();

// AX-16 — no silent recovery.
(() => {
  const s = fresh();
  s.phases.P1 = { status: STATUS.COMPLETE };
  s.blockers.push({ id: 'BLK-1', phase: 'P1', description: 'x', status: 'RESOLVED' });
  ok('AX-16 resolved blocker on complete phase passes', axioms.checkNoSilentRecovery(s).pass === true);
  s.blockers.push({ id: 'BLK-2', phase: 'P1', description: 'y', status: 'OPEN' });
  ok('AX-16 complete phase over open blocker fails', axioms.checkNoSilentRecovery(s).pass === false);
  const s2 = fresh();
  s2.blockers.push({ id: 'BLK-3', phase: 'P2', description: 'z', status: 'VANISHED' });
  ok('AX-16 unrecorded blocker status fails', axioms.checkNoSilentRecovery(s2).pass === false);
})();

// checkAll aggregates
(() => {
  const s = fresh();
  recordDispatch(s, { agent: 'i1', role: 'talib', phase: 'P1', timestamp: TS });
  ok('checkAll passes on a clean state', axioms.checkAll(s).pass === true);
})();

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) { console.log('AXIOM TESTS FAILED'); process.exit(1); }
console.log('All axiom tests passed!');
