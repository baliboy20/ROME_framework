/**
 * Sub-agent loader + structured-return contract regression (PROP-035 §3.2/§6b).
 * Loads a REAL role (pma) from agents and exercises return processing.
 * Run: node tests/subagent.test.cjs
 */
const { createState } = require('../state');
const {
  RETURN_STATUS, loadRoleSpec, validateReturn, recordDispatch, processReturn, coverage,
} = require('../subagent');

const TS = '2026-06-18T00:00:00Z';
let passed = 0, failed = 0;
function ok(name, cond) { if (cond) { console.log(`  ✓ ${name}`); passed++; } else { console.log(`  ✗ ${name}`); failed++; } }
function threw(fn) { try { fn(); return false; } catch { return true; } }

console.log('subagent regression:');

// 1. Load a real role definition (pma, P3)
(() => {
  const spec = loadRoleSpec('pma', 'P3');
  ok('pma spec has non-empty system prompt', typeof spec.systemPrompt === 'string' && spec.systemPrompt.length > 100);
  ok('pma system prompt includes return contract', /Return Contract/.test(spec.systemPrompt));
  ok('pma resolved a P3 mode file', /P3/i.test(spec.modeFile || ''));
  ok('pma exposes its skills', spec.skills.includes('design-data-dictionary'));
})();

// 2. Unknown role throws
(() => ok('unknown role throws', threw(() => loadRoleSpec('nobody', 'P3'))))();

// 3. Return validation
(() => {
  ok('valid return passes', validateReturn({
    agent: 'pma-1', role: 'pma', phase: 'P3', status: 'COMPLETE',
    summary: 'designed architecture', artifacts: [{ path: 'architecture.md' }],
    traceabilityDeltas: [{ requirement: 'REQ-001', produces: 'architecture.md' }],
  }).length === 0);
  ok('garbage return rejected', validateReturn({}).length > 0);
  ok('missing summary rejected', validateReturn({
    agent: 'x', role: 'pma', phase: 'P3', status: 'COMPLETE', artifacts: [], traceabilityDeltas: [],
  }).some(e => /summary/.test(e)));
  ok('bad traceability delta rejected', validateReturn({
    agent: 'x', role: 'pma', phase: 'P3', status: 'COMPLETE', summary: 's',
    artifacts: [], traceabilityDeltas: [{ requirement: 'REQ-001' }],
  }).some(e => /traceability/.test(e)));
  ok('BLOCKED without blockers rejected', validateReturn({
    agent: 'x', role: 'pma', phase: 'P3', status: 'BLOCKED', summary: 's',
    artifacts: [], traceabilityDeltas: [],
  }).some(e => /blockers/.test(e)));
})();

// 4. Dispatch + processReturn → state records (completion = record)
(() => {
  const s = createState({ project: 'demo', frameworkVersion: 'test', timestamp: TS });
  recordDispatch(s, { agent: 'pma-1', role: 'pma', phase: 'P3', timestamp: TS });
  ok('dispatch recorded RUNNING', s.dispatch[0].status === 'RUNNING');
  processReturn(s, {
    agent: 'pma-1', role: 'pma', phase: 'P3', status: RETURN_STATUS.COMPLETE,
    summary: 'done', artifacts: [{ path: 'architecture.md' }],
    traceabilityDeltas: [
      { requirement: 'REQ-001', produces: 'architecture.md' },
      { requirement: 'REQ-002', produces: 'api-spec.yaml' },
    ],
  }, TS);
  ok('dispatch updated to COMPLETE', s.dispatch[0].status === 'COMPLETE');
  ok('traceability deltas merged', s.traceability.deltas.length === 2);
  ok('coverage counts distinct requirements', coverage(s).requirementsCovered === 2);
  ok('audit has DISPATCH + RETURN', s.audit.filter(a => ['DISPATCH', 'RETURN'].includes(a.event)).length === 2);
})();

// 5. Invalid return throws in processReturn; BLOCKED records a blocker
(() => {
  const s = createState({ project: 'demo', frameworkVersion: 'test', timestamp: TS });
  ok('processReturn throws on invalid', threw(() => processReturn(s, { bad: true }, TS)));
  processReturn(s, {
    agent: 'talib-1', role: 'talib', phase: 'P1', status: RETURN_STATUS.BLOCKED,
    summary: 'cannot proceed', artifacts: [], traceabilityDeltas: [],
    blockers: ['ambiguous requirement REQ-003'],
  }, TS);
  ok('BLOCKED return records an open blocker', s.blockers.length === 1 && s.blockers[0].status === 'OPEN');
})();

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log('All subagent tests passed!');
