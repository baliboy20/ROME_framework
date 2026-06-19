/** Topology / DAG fan-out regression (PROP-038). Run: node tests/topology.test.cjs */
const { validateGraph, topoBatches, shape, capabilityOf } = require('../topology');

let passed = 0, failed = 0;
function ok(n, c) { if (c) { console.log(`  ✓ ${n}`); passed++; } else { console.log(`  ✗ ${n}`); failed++; } }
function threw(fn) { try { fn(); return false; } catch { return true; } }

console.log('topology regression:');

// 1. Standard 3-layer (db <- service <- ui) — deep chain → 3 batches of 1
(() => {
  const g = { nodes: [
    { id: 'db', type: 'db' },
    { id: 'api', type: 'service', dependsOn: ['db'] },
    { id: 'web', type: 'ui', dependsOn: ['api'] },
  ]};
  const b = topoBatches(g);
  ok('3-layer yields 3 batches', b.length === 3);
  ok('order db→api→web', b[0][0] === 'db' && b[1][0] === 'api' && b[2][0] === 'web');
  ok('shape depth=3 width=1', JSON.stringify(shape(g)) === JSON.stringify({ depth: 3, width: 1, nodes: 3 }));
})();

// 2. Wide multi-platform SaaS — shared-lib + db first, 2 services parallel, 3 UIs parallel
(() => {
  const g = { nodes: [
    { id: 'lib', type: 'shared-lib' },
    { id: 'db', type: 'db' },
    { id: 'auth', type: 'service', dependsOn: ['lib', 'db'] },
    { id: 'billing', type: 'service', dependsOn: ['lib', 'db'] },
    { id: 'web', type: 'ui', dependsOn: ['auth', 'billing'] },
    { id: 'admin', type: 'ui', dependsOn: ['auth'] },
    { id: 'ios', type: 'ui', dependsOn: ['auth', 'billing'] },
  ]};
  const b = topoBatches(g);
  ok('batch 1 = {db, lib} concurrent', JSON.stringify(b[0]) === JSON.stringify(['db', 'lib']));
  ok('batch 2 = {auth, billing} concurrent', JSON.stringify(b[1]) === JSON.stringify(['auth', 'billing']));
  ok('batch 3 = {admin, ios, web} concurrent', JSON.stringify(b[2]) === JSON.stringify(['admin', 'ios', 'web']));
  ok('width=3 (max concurrency)', shape(g).width === 3);
})();

// 3. Degenerate: single node → one batch of one (scales down)
(() => {
  const g = { nodes: [{ id: 'site', type: 'ui' }] };
  ok('single node = 1 batch of 1', JSON.stringify(topoBatches(g)) === JSON.stringify([['site']]));
})();

// 4. Capability resolution
(() => {
  ok('type→capability', capabilityOf({ id: 'x', type: 'ui' }) === 'generate-ui');
  ok('explicit capability wins', capabilityOf({ id: 'x', type: 'ui', capability: 'generate-integration' }) === 'generate-integration');
})();

// 5. Validation failures
(() => {
  ok('cycle rejected', threw(() => topoBatches({ nodes: [
    { id: 'a', type: 'service', dependsOn: ['b'] }, { id: 'b', type: 'service', dependsOn: ['a'] }] })));
  ok('dangling dep rejected', threw(() => validateGraph({ nodes: [{ id: 'a', type: 'ui', dependsOn: ['ghost'] }] })));
  ok('duplicate id rejected', threw(() => validateGraph({ nodes: [{ id: 'a', type: 'ui' }, { id: 'a', type: 'db' }] })));
  ok('unknown type rejected', threw(() => validateGraph({ nodes: [{ id: 'a', type: 'wormhole' }] })));
  ok('empty graph rejected', threw(() => validateGraph({ nodes: [] })));
  ok('self-dependency rejected', threw(() => validateGraph({ nodes: [{ id: 'a', type: 'ui', dependsOn: ['a'] }] })));
})();

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log('All topology tests passed!');
