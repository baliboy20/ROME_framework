/** Visualization regression (PROP-037). Run: node tests/visualize.test.cjs */
const { createState } = require('../state');
const { recordDispatch, processReturn } = require('../subagent');
const { componentGraphMermaid, lifecycleMermaid, traceabilityMermaid } = require('../visualize');

let passed = 0, failed = 0;
function ok(n, c) { if (c) { console.log(`  ✓ ${n}`); passed++; } else { console.log(`  ✗ ${n}`); failed++; } }
const TS = '2026-06-18T00:00:00Z';

console.log('visualize regression:');

// component graph
(() => {
  const g = { nodes: [
    { id: 'lib', type: 'shared-lib' },
    { id: 'api', type: 'service', dependsOn: ['lib'] },
    { id: 'web', type: 'ui', dependsOn: ['api'] },
  ]};
  const m = componentGraphMermaid(g);
  ok('starts with flowchart', m.startsWith('flowchart TD'));
  ok('has dependency edges', m.includes('lib --> api') && m.includes('api --> web'));
  ok('batches as subgraphs', m.includes('subgraph B0') && m.includes('subgraph B1'));
  ok('node shape rendered', m.includes('api["api'));
})();

// lifecycle
(() => {
  const s = createState({ project: 'v', frameworkVersion: 't', timestamp: TS });
  const m = lifecycleMermaid(s);
  ok('lifecycle is LR flowchart', m.startsWith('flowchart LR'));
  ok('shows P0 in progress + P1 pending', m.includes('P0') && m.includes('IN_PROGRESS') && m.includes('PENDING'));
  ok('chains phases', m.includes('P0 --> P1'));
})();

// traceability
(() => {
  const s = createState({ project: 'v', frameworkVersion: 't', timestamp: TS });
  recordDispatch(s, { agent: 'pma-1', role: 'pma', phase: 'P3', timestamp: TS });
  processReturn(s, { agent: 'pma-1', role: 'pma', phase: 'P3', status: 'COMPLETE', summary: 'x',
    artifacts: [], traceabilityDeltas: [{ requirement: 'REQ-001', produces: 'architecture.md' }] }, TS);
  const m = traceabilityMermaid(s);
  ok('traceability links REQ to artifact', m.includes('REQ_001') && m.includes('architecture'));
  ok('has an edge', /REQ_001 --> a_/.test(m));
})();

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log('All visualize tests passed!');
