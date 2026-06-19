/**
 * End-to-end integration: drives a full simulated lifecycle through EVERY core
 * module exactly as roma/modes/orchestrator.md v5.0 prescribes. Proves the
 * operating loop composes (routing → state → dispatch/return → guard gates →
 * P5 topology fan-out → executability → contract drift → budget).
 *
 * Sub-agent "work" is simulated by structured returns (the live-agent path is
 * proven separately in m2-proof / m3-proof); executability runs for real on a
 * generated component. Run: node tests/integration.test.cjs
 */
const os = require('os');
const fs = require('fs');
const path = require('path');
const { createState } = require('../state');
const guard = require('../guard');
const { PHASE_BY_ID } = require('../lifecycle');
const { recordDispatch, processReturn, coverage } = require('../subagent');
const { topoBatches } = require('../topology');
const { verifyComponent } = require('../executability');
const { gateContracts } = require('../contracts');
const { routeFromICR } = require('../routing');
const { recordVerification } = require('../verification');
const budget = require('../budget');

const TS = '2026-06-18T12:00:00Z';
let passed = 0, failed = 0;
function ok(n, c) { if (c) { console.log(`  ✓ ${n}`); passed++; } else { console.log(`  ✗ ${n}`); failed++; } }

console.log('integration (full lifecycle composition):');

// --- Intake → routing (036) ---
const route = routeFromICR({ intent: 'greenfield', qualityVerdict: 'SUFFICIENT' });
const s = createState({ project: 'integ', frameworkVersion: 'rearch-dev', routing: route.routing, timestamp: TS });
s.budget.ceiling = 100000;
ok('routed greenfield P0..P5', s.routing.join() === 'P0,P1,P2,P3,P4,P5');

// helper: a producer return for a phase
function produce(role, phase, deltas) {
  const agent = `${role}-${phase}`;
  recordDispatch(s, { agent, role, phase, timestamp: TS });
  processReturn(s, {
    agent, role, phase, status: 'COMPLETE', summary: `${role} did ${phase}`,
    artifacts: [{ path: `${phase}.md`, kind: 'artifact' }], traceabilityDeltas: deltas || [],
  }, TS);
  budget.record(s, 5000);
}
function gateAndAdvance(phase) {
  const def = PHASE_BY_ID[phase];
  // record the phase's required mechanical facts (the guard now demands them)
  for (const k of def.requires || []) recordVerification(s, phase, k, true, null, TS);
  if (def.gate) guard.recordGateVerdict(s, { phase, verdict: 'APPROVE', role: 'sarah', timestamp: TS });
  guard.advance(s, TS);
}

// --- P0 bootstrap (no gate) ---
produce('bootstrap', 'P0');
gateAndAdvance('P0');
ok('advanced to P1', s.currentPhase === 'P1');

// --- P1 requirements (mechanical AORDL gate validated elsewhere) ---
produce('talib', 'P1', [{ requirement: 'REQ-001', produces: 'REQ-001.yaml' }, { requirement: 'REQ-002', produces: 'REQ-002.yaml' }]);
ok('budget PROCEED early', budget.policy(s).action === 'PROCEED');
gateAndAdvance('P1');

// --- P2 analysis ---
produce('talib', 'P2', [{ requirement: 'REQ-001', produces: 'entities.md' }]);
gateAndAdvance('P2');

// --- P3 design (PMA produce → Clara validate, distinct roles) ---
produce('pma', 'P3', [{ requirement: 'REQ-001', produces: 'architecture.md' }, { requirement: 'REQ-002', produces: 'architecture.md' }]);
recordDispatch(s, { agent: 'clara-P3', role: 'clara', phase: 'P3', timestamp: TS });
processReturn(s, { agent: 'clara-P3', role: 'clara', phase: 'P3', status: 'COMPLETE', summary: 'validated PASS', artifacts: [{ path: 'validation-report.md', kind: 'validation' }], traceabilityDeltas: [] }, TS);
gateAndAdvance('P3');

// --- P4 config ---
produce('lucien', 'P4');
gateAndAdvance('P4');

// --- P5 generation: topology fan-out + executability + contract drift ---
ok('at P5', s.currentPhase === 'P5');
const graph = { nodes: [
  { id: 'lib', type: 'shared-lib' },
  { id: 'api', type: 'service', dependsOn: ['lib'] },
  { id: 'web', type: 'ui', dependsOn: ['api'] },
]};
const batches = topoBatches(graph);
ok('fan-out batches = lib → api → web', JSON.stringify(batches) === JSON.stringify([['lib'], ['api'], ['web']]));

// simulate per-node generation returns (one capability instance per node)
for (const batch of batches) for (const node of batch) {
  produce(`gen-${node}`, 'P5', [{ requirement: node === 'web' ? 'REQ-002' : 'REQ-001', produces: `${node}/index.js`, component: node }]);
}

// real executability on a generated component
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rome-integ-'));
fs.writeFileSync(path.join(dir, 'index.js'), 'module.exports=(a,b)=>a+b;\n');
fs.writeFileSync(path.join(dir, 'test.cjs'), "const f=require('./index.js');if(f(2,3)!==5)process.exit(1);console.log('ok');\n");
const ver = verifyComponent({ id: 'api', cwd: dir, steps: [{ name: 'test', command: 'node', args: ['test.cjs'] }] });
ok('executability gate VERIFIED (real run)', ver.status === 'VERIFIED');

// contract drift gate
const contract = { id: 'api', kind: 'api', producer: 'api', members: ['POST /projects', 'POST /tasks'] };
const drift = gateContracts([contract], { api: { producer: ['POST /projects', 'POST /tasks'], consumers: { web: ['POST /projects'] } } });
ok('contract gate: no drift', drift.conforms === true);

// P5 gate (only if executability + contracts pass) → advance to completion
ok('executability+contracts MET → may gate', ver.status === 'VERIFIED' && drift.conforms);
gateAndAdvance('P5');

// --- assertions on final composed state ---
ok('lifecycle complete', guard.isComplete(s) === true);
ok('all 5 gates APPROVE by sarah', s.gateLedger.filter(g => g.verdict === 'APPROVE' && g.role === 'sarah').length === 5);
ok('coverage = 2 requirements', coverage(s).requirementsCovered === 2);
ok('no open blockers', s.blockers.filter(b => b.status !== 'RESOLVED').length === 0);
ok('budget within ceiling', budget.remaining(s) > 0 && budget.policy(s).action !== 'ESCALATE');

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log('All integration tests passed!');
