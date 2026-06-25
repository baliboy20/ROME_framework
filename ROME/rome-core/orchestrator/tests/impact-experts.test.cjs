/** Impact analysis (040 E) + expert-pack selection (040 F). Run: node tests/impact-experts.test.cjs */
const { computeImpact, downstreamClosure, markStale, applyChange, resolveDeferral } = require('../impact');
const { selectPacks, enforcedRules, loadPacks } = require('../experts');
const { createState } = require('../state');
const { recordDispatch, processReturn } = require('../subagent');

let passed = 0, failed = 0;
function ok(n, c) { if (c) { console.log(`  ✓ ${n}`); passed++; } else { console.log(`  ✗ ${n}`); failed++; } }
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

console.log('impact + experts regression:');

// --- impact (040 E) ---
const graph = { nodes: [
  { id: 'lib', type: 'shared-lib' },
  { id: 'db', type: 'db' },
  { id: 'auth', type: 'service', dependsOn: ['lib', 'db'] },
  { id: 'billing', type: 'service', dependsOn: ['lib', 'db'] },
  { id: 'web', type: 'ui', dependsOn: ['auth', 'billing'] },
  { id: 'admin', type: 'ui', dependsOn: ['auth'] },
]};
const contracts = [{ id: 'auth-api', producer: 'auth', consumers: ['web', 'admin'] }];
const deltas = [{ requirement: 'REQ-001', component: 'billing' }, { requirement: 'REQ-002', component: 'web' }];

(() => {
  // changing lib affects everything downstream
  const r = computeImpact({ graph, contracts, traceabilityDeltas: deltas }, { components: ['lib'] });
  ok('changing lib hits all dependents', eq(r.components, ['admin', 'auth', 'billing', 'lib', 'web']));
})();
(() => {
  // changing a leaf affects only itself
  const r = computeImpact({ graph }, { components: ['admin'] });
  ok('changing admin (leaf) affects only admin', eq(r.components, ['admin']));
})();
(() => {
  // contract change → producer + consumers (+ downstream)
  const r = computeImpact({ graph, contracts }, { contracts: ['auth-api'] });
  ok('auth-api change hits auth+web+admin', r.components.includes('auth') && r.components.includes('web') && r.components.includes('admin'));
  ok('billing untouched by auth-api change', !r.components.includes('billing'));
})();
(() => {
  // requirement change → implementing component + downstream
  const r = computeImpact({ graph, traceabilityDeltas: deltas }, { requirements: ['REQ-001'] });
  ok('REQ-001 change hits billing + downstream web', r.components.includes('billing') && r.components.includes('web'));
  ok('reasons recorded', r.reasons['billing'].some(x => /REQ-001/.test(x)));
})();
(() => {
  ok('downstreamClosure includes seed', downstreamClosure(graph, ['web']).has('web'));
})();

// --- PROP-042: markStale ---
(() => {
  const TS = '2026-06-19T00:00:00Z';
  const s = createState({ project: 'stale-test', frameworkVersion: 't', timestamp: TS });
  recordDispatch(s, { agent: 'reena-1', role: 'reena', phase: 'P5', timestamp: TS });
  processReturn(s, {
    agent: 'reena-1', role: 'reena', phase: 'P5', status: 'COMPLETE',
    summary: 's', artifacts: [],
    traceabilityEdges: [
      { req: 'REQ-001', artifactId: 'backend:OrgSvc', satisfiesHow: 'implements' },
      { req: 'REQ-001', artifactId: 'backend:OrgTest', satisfiesHow: 'validates' },
      { req: 'REQ-002', artifactId: 'backend:OrgSvc', satisfiesHow: 'implements' },
    ],
  }, TS);

  ok('markStale: edges not stale before call', s.traceability.edges.every(e => !e.stale));

  markStale(s, ['REQ-001']);

  const req1edges = s.traceability.edges.filter(e => e.req === 'REQ-001');
  const req2edges = s.traceability.edges.filter(e => e.req === 'REQ-002');
  ok('markStale: REQ-001 edges now stale', req1edges.every(e => e.stale === true));
  ok('markStale: REQ-002 edge NOT stale', req2edges.every(e => !e.stale));
  // byReq retains stale artifacts — impact analysis still needs to know what was implementing REQ-001
  ok('markStale: byReq index retains REQ-001 entries (used by impact analysis)', s.traceability.byReq['REQ-001'] && s.traceability.byReq['REQ-001'].length > 0);
  ok('markStale: byReq index retains non-stale REQ-002', s.traceability.byReq['REQ-002'] && s.traceability.byReq['REQ-002'].length > 0);
})();

// --- PROP-042 AC5: applyChange stales edges + computes impact (CR entry) ---
(() => {
  const TS = '2026-06-19T00:00:00Z';
  const s = createState({ project: 'cr-test', frameworkVersion: 't', timestamp: TS });
  // a small topology so impact can expand downstream
  s.topology = { nodes: [
    { id: 'backend', type: 'service' },
    { id: 'mobile', type: 'ui', dependsOn: ['backend'] },
  ]};
  recordDispatch(s, { agent: 'reena-1', role: 'reena', phase: 'P5', timestamp: TS });
  processReturn(s, {
    agent: 'reena-1', role: 'reena', phase: 'P5', status: 'COMPLETE', summary: 's', artifacts: [],
    traceabilityEdges: [
      { req: 'REQ-001', artifactId: 'OrgSvc', component: 'backend', satisfiesHow: 'implements', location: 'svc.dart:1' },
      { req: 'REQ-001', artifactId: 'OrgTest', component: 'backend', satisfiesHow: 'validates', location: 'svc_test.dart:1' },
      { req: 'REQ-002', artifactId: 'Other', component: 'mobile', satisfiesHow: 'implements', location: 'o.dart:1' },
    ],
  }, TS);

  const r = applyChange(s, { requirements: ['REQ-001'] });
  ok('applyChange: returns staled reqs', eq(r.staled, ['REQ-001']));
  ok('applyChange: REQ-001 edges now stale', s.traceability.edges.filter(e => e.req === 'REQ-001').every(e => e.stale));
  ok('applyChange: REQ-002 edge untouched', s.traceability.edges.filter(e => e.req === 'REQ-002').every(e => !e.stale));
  ok('applyChange: impact set includes backend (implements REQ-001)', r.impact && r.impact.components.includes('backend'));
  ok('applyChange: impact expands downstream to mobile', r.impact.components.includes('mobile'));

  const noGraph = applyChange(createState({ project: 'n', frameworkVersion: 't', timestamp: TS }), { requirements: ['REQ-009'] });
  ok('applyChange: no graph → impact null but still reports staled', noGraph.impact === null && eq(noGraph.staled, ['REQ-009']));
})();

// --- PROP-041 B4: resolveDeferral stales affected reqs (sponsor answered) ---
(() => {
  const TS = '2026-06-19T00:00:00Z';
  const s = createState({ project: 'defer-test', frameworkVersion: 't', timestamp: TS });
  recordDispatch(s, { agent: 'reena-1', role: 'reena', phase: 'P5', timestamp: TS });
  processReturn(s, {
    agent: 'reena-1', role: 'reena', phase: 'P5', status: 'COMPLETE', summary: 's', artifacts: [],
    traceabilityEdges: [{ req: 'REQ-005', artifactId: 'FleetSvc', component: 'backend', satisfiesHow: 'implements', location: 'f.dart:1' }],
  }, TS);
  s.oq.deferrals.push({ oqId: 'OQ-003', provisional: true, sponsorAuthorized: true, affectedReqs: ['REQ-005'] });

  const r = resolveDeferral(s, 'OQ-003');
  ok('resolveDeferral: reports resolved', r.resolved === true);
  ok('resolveDeferral: returns affected reqs', eq(r.affectedReqs, ['REQ-005']));
  ok('resolveDeferral: deferral marked resolved + no longer provisional', s.oq.deferrals[0].resolved === true && s.oq.deferrals[0].provisional === false);
  ok('resolveDeferral: affected REQ-005 edges staled for re-gen', s.traceability.edges.filter(e => e.req === 'REQ-005').every(e => e.stale));
  ok('resolveDeferral: unknown OQ → not resolved', resolveDeferral(s, 'OQ-999').resolved === false);
})();

// --- experts (040 F), against real Experts/ + authored pack.json ---
(() => {
  const packs = loadPacks();
  ok('loads expert packs', packs.some(p => p.name === 'expert_flutter'));

  const ui = selectPacks({ capability: 'generate-ui', platform: 'flutter', stack: 'flutter', phase: 'P5' });
  ok('flutter pack selected for generate-ui/flutter', ui.some(p => p.name === 'expert_flutter'));
  ok('parse pack NOT selected for a flutter UI', !ui.some(p => p.name === 'expert_parse_server'));

  const svc = selectPacks({ capability: 'generate-service', stack: 'parse-server', phase: 'P5' });
  ok('parse pack selected for parse-server service', svc.some(p => p.name === 'expert_parse_server'));

  const none = selectPacks({ capability: 'generate-ui', stack: 'react', platform: 'web', phase: 'P5' });
  ok('no flutter pack for a react stack', !none.some(p => p.name === 'expert_flutter'));

  const rules = enforcedRules({ capability: 'generate-ui', platform: 'flutter', stack: 'flutter', phase: 'P5' });
  ok('flutter pack contributes enforce rules (gate criteria)', rules.length > 0);
})();

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log('All impact + experts tests passed!');
