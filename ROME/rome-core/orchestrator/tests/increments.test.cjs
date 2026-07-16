/**
 * Increments + staging regression (ROME-PROP-048 / PROP-049).
 * Tagged violation tests for AX-19..AX-24 (fidelity check 6b reads the tags).
 * Pure, headless. Run: node tests/increments.test.cjs
 */
const os = require('os');
const fs = require('fs');
const path = require('path');
const { STATUS, VERDICT, PHASE_BY_ID } = require('../lifecycle');
const { createState, active, sealActive, beginIncrement, migrateV1, save, load, SCHEMA_VERSION } = require('../state');
const { recordGateVerdict, canAdvance, advance, isComplete } = require('../guard');
const { recordVerification, checkTraceability, checkStageConsistency, checkStubs } = require('../verification');
const { validateStagePlan } = require('../routing');
const { recordDispatch, processReturn } = require('../subagent');

const TS = '2026-07-17T00:00:00Z';
let passed = 0, failed = 0;
function ok(name, cond) { if (cond) { console.log(`  ✓ ${name}`); passed++; } else { console.log(`  ✗ ${name}`); failed++; } }
function threw(fn) { try { fn(); return false; } catch { return true; } }
function fresh() { return createState({ project: 'multi', frameworkVersion: 'test', timestamp: TS }); }
function satisfy(s, phase) { for (const k of PHASE_BY_ID[phase].requires || []) recordVerification(s, phase, k, true, null, TS); return s; }
/** Drive the active increment P0→complete. */
function completeIncrement(s) {
  while (active(s).currentPhase) {
    const p = active(s).currentPhase;
    if (PHASE_BY_ID[p].gate) recordGateVerdict(s, { phase: p, verdict: VERDICT.APPROVE, role: 'sarah', timestamp: TS });
    satisfy(s, p);
    advance(s, TS);
  }
  return s;
}

console.log('increments + staging regression:');

// AX-19 — adding an increment preserves every prior record (append-only).
(() => {
  const s = fresh();
  recordDispatch(s, { agent: 'i1', role: 'talib', phase: 'P1', timestamp: TS });
  processReturn(s, { agent: 'i1', role: 'talib', phase: 'P1', status: 'COMPLETE', summary: 'x', artifacts: [], traceabilityEdges: [{ req: 'REQ-1', artifactId: 'A', satisfiesHow: 'documents' }] }, TS);
  completeIncrement(s);
  const ledgerBefore = JSON.stringify(active(s).gateLedger);
  const edgesBefore = s.traceability.edges.length;
  const auditBefore = s.audit.length;
  sealActive(s, TS);
  beginIncrement(s, { intent: 'extension', stage: 1, timestamp: TS });
  ok('AX-19 prior gate ledger preserved intact', JSON.stringify(s.increments[0].gateLedger) === ledgerBefore);
  ok('AX-19 shared traceability preserved', s.traceability.edges.length === edgesBefore);
  ok('AX-19 audit only appended, never truncated', s.audit.length > auditBefore);
  ok('AX-19 sealed increment refuses new verdicts', (() => { s.activeIncrement = 0; const t = threw(() => recordGateVerdict(s, { phase: 'P1', verdict: VERDICT.APPROVE, role: 'sarah', timestamp: TS })); s.activeIncrement = 1; return t; })());
  ok('AX-19 sealed increment refuses advance', (() => { s.activeIncrement = 0; const r = canAdvance(s); s.activeIncrement = 1; return r.ok === false && /sealed/.test(r.reason); })());
})();

// AX-20 — whole-project coverage is the union across increments (one shared store).
(() => {
  const s = fresh();
  recordDispatch(s, { agent: 'i1', role: 'charlie', phase: 'P5', timestamp: TS });
  processReturn(s, { agent: 'i1', role: 'charlie', phase: 'P5', status: 'COMPLETE', summary: 'x', artifacts: [], traceabilityEdges: [{ req: 'REQ-1', artifactId: 'A', satisfiesHow: 'implements' }] }, TS);
  completeIncrement(s); sealActive(s, TS);
  beginIncrement(s, { intent: 'extension', timestamp: TS });
  recordDispatch(s, { agent: 'i2', role: 'charlie', phase: 'P5', timestamp: TS });
  processReturn(s, { agent: 'i2', role: 'charlie', phase: 'P5', status: 'COMPLETE', summary: 'x', artifacts: [], traceabilityEdges: [{ req: 'REQ-2', artifactId: 'B', satisfiesHow: 'implements' }] }, TS);
  ok('AX-20 edges tagged with producing increment', s.traceability.edges.some(e => e.increment === 0) && s.traceability.edges.some(e => e.increment === 1));
  const cov = checkTraceability(s, ['REQ-1', 'REQ-2']);
  ok('AX-20 union coverage spans increments', cov.pass === true);
})();

// AX-21 — a Project has no terminal state; isComplete is per-increment.
(() => {
  const s = fresh();
  completeIncrement(s);
  ok('AX-21 increment completes', isComplete(s) === true);
  sealActive(s, TS);
  beginIncrement(s, { intent: 'extension', timestamp: TS });
  ok('AX-21 project continues — new increment active, not complete', isComplete(s) === false && active(s).id === 1);
  ok('AX-21 unsealed increment cannot be superseded', threw(() => beginIncrement(s, { intent: 'extension', timestamp: TS })));
})();

// AX-22 — stage dependency-consistency (STRICT at P2 via the stageConsistency fact).
(() => {
  const s = fresh();
  s.stagePlan = { stages: [{ id: 1, inputs: ['a.md'] }, { id: 2, inputs: ['b.md'] }], decisions: [] };
  const bad = checkStageConsistency(s, [
    { id: 'REQ-1', stage: 1, dependsOn: ['REQ-9'] },
    { id: 'REQ-9', stage: 2, dependsOn: [] },
  ]);
  ok('AX-22 forward stage dependency fails', bad.pass === false && bad.violations.length === 1);
  const good = checkStageConsistency(s, [
    { id: 'REQ-1', stage: 2, dependsOn: ['REQ-9'] },
    { id: 'REQ-9', stage: 1, dependsOn: [] },
  ]);
  ok('AX-22 same-or-earlier stage dependency passes', good.pass === true);
  ok('AX-22 unstaged project trivially consistent', checkStageConsistency(fresh(), [{ id: 'R', stage: 1, dependsOn: [] }]).pass === true);
  ok('AX-22 is a required P2 fact', PHASE_BY_ID['P2'].requires.includes('stageConsistency'));
})();

// AX-23 — dangling presumption: no stage presumes an unprovided/unstubbed subsystem.
(() => {
  ok('AX-23 dangling presumption refused', threw(() => validateStagePlan({
    stages: [{ id: 1, presumes: ['auth'] }],
  })));
  ok('AX-23 provided-in-stage-0 passes', validateStagePlan({
    stages: [{ id: 0, provides: ['auth'] }, { id: 1, presumes: ['auth'] }],
  }).ok === true);
  ok('AX-23 stub decision satisfies presumption', validateStagePlan({
    stages: [{ id: 1, presumes: ['payments'] }],
    decisions: [{ subsystem: 'payments', stage: 1, decision: 'stub' }],
  }).ok === true);
  ok('AX-23 sponsor-authorized gap passes', validateStagePlan({
    stages: [{ id: 1, presumes: [{ subsystem: 'auth', sponsorAuthorized: true }] }],
  }).ok === true);
  const fwd = validateStagePlan({ stages: [{ id: 1, dependsOn: [2] }, { id: 2 }] });
  ok('AX-22 forward dep at intake is WARN not refusal', fwd.ok === true && fwd.warnings.length === 1);
})();

// AX-24 — no silent stubs: an expired ACTIVE stub blocks the P5 delivery edge.
(() => {
  const s = fresh();
  s.stubs.push({ id: 'STUB-1', subsystem: 'payments', stubbedIn: 0, implementBy: 0, sponsorDecision: 'stub', status: 'ACTIVE', timestamp: TS });
  // drive to P5
  while (active(s).currentPhase !== 'P5') {
    const p = active(s).currentPhase;
    if (PHASE_BY_ID[p].gate) recordGateVerdict(s, { phase: p, verdict: VERDICT.APPROVE, role: 'sarah', timestamp: TS });
    satisfy(s, p); advance(s, TS);
  }
  recordGateVerdict(s, { phase: 'P5', verdict: VERDICT.APPROVE, role: 'sarah', timestamp: TS });
  satisfy(s, 'P5');
  const r = canAdvance(s);
  ok('AX-24 expired stub blocks P5 delivery', r.ok === false && /stub/.test(r.reason));
  ok('AX-24 checkStubs reports the expiry', checkStubs(s, active(s).id).pass === false);
  s.stubs[0].status = 'REPLACED';
  ok('AX-24 replaced stub unblocks delivery', canAdvance(s).ok === true);
  // a stub due in a LATER increment does not block this one
  const s2 = fresh();
  s2.stubs.push({ id: 'STUB-2', subsystem: 'email', stubbedIn: 0, implementBy: 2, sponsorDecision: 'stub', status: 'ACTIVE', timestamp: TS });
  ok('AX-24 not-yet-due stub does not block', checkStubs(s2, 0).pass === true);
})();

// ROME-MIG-002 — a v1 single-lifecycle state loads as increment 0.
(() => {
  const v1 = {
    schemaVersion: 1, project: 'legacy', frameworkVersion: '2.8.0',
    createdAt: TS, updatedAt: TS,
    routing: ['P0', 'P1', 'P2', 'P3', 'P4', 'P5'], currentPhase: 'P3',
    phases: { P0: { status: 'COMPLETE' }, P1: { status: 'COMPLETE' }, P2: { status: 'COMPLETE' }, P3: { status: 'IN_PROGRESS' }, P4: { status: 'PENDING' }, P5: { status: 'PENDING' } },
    gateLedger: [{ gate: 'GATE-P1', phase: 'P1', verdict: 'APPROVE', role: 'sarah', timestamp: TS }],
    blockers: [], dispatch: [], budget: { tokens: 42, ceiling: null },
    traceability: { deltas: [], artifacts: {}, edges: [{ req: 'REQ-1', artifactId: 'A', satisfiesHow: 'documents', stale: false }], byReq: {}, byArtifact: {}, matrix: {} },
    oq: { resolvedByTalib: 3, awaitingSponsor: 0, deferrals: [] },
    verification: {}, audit: [{ event: 'DISPATCH' }],
  };
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rome-mig-'));
  const file = path.join(dir, 'state.json');
  fs.writeFileSync(file, JSON.stringify(v1));
  const m = load(file); // auto-migrates
  ok('MIG-002 v1 loads at current schema', m.schemaVersion === SCHEMA_VERSION);
  ok('MIG-002 lifecycle wrapped as increment 0', m.increments.length === 1 && active(m).currentPhase === 'P3');
  ok('MIG-002 gate ledger preserved', active(m).gateLedger.length === 1);
  ok('MIG-002 edges tagged increment 0', m.traceability.edges[0].increment === 0);
  ok('MIG-002 oq/budget carried over', active(m).oq.resolvedByTalib === 3 && active(m).budget.tokens === 42);
  ok('MIG-002 migrated state round-trips', (() => { save(file, m, TS); return load(file).schemaVersion === SCHEMA_VERSION; })());
})();

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) { console.log('INCREMENT TESTS FAILED'); process.exit(1); }
console.log('All increment tests passed!');
