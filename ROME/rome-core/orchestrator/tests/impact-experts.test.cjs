/** Impact analysis (040 E) + expert-pack selection (040 F). Run: node tests/impact-experts.test.cjs */
const { computeImpact, downstreamClosure } = require('../impact');
const { selectPacks, enforcedRules, loadPacks } = require('../experts');

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
