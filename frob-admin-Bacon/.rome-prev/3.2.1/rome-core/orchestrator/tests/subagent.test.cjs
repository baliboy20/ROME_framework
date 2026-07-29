/**
 * Sub-agent loader + structured-return contract regression (PROP-035 §3.2/§6b).
 * Loads a REAL role (pma) from agents and exercises return processing.
 * Run: node tests/subagent.test.cjs
 */
const { createState, active } = require('../state');
const {
  RETURN_STATUS, loadRoleSpec, validateReturn, recordDispatch, processReturn, coverage,
  canonicalId,
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
  ok('valid delta return passes', validateReturn({
    agent: 'pma-1', role: 'pma', phase: 'P3', status: 'COMPLETE',
    summary: 'designed architecture', artifacts: [{ path: 'architecture.md' }],
    traceabilityDeltas: [{ requirement: 'REQ-001', produces: 'architecture.md' }],
  }).length === 0);
  ok('valid edge return passes', validateReturn({
    agent: 'reena-1', role: 'reena', phase: 'P5', status: 'COMPLETE',
    summary: 'generated service', artifacts: [],
    traceabilityEdges: [{ req: 'REQ-001', artifactId: 'OrgService', satisfiesHow: 'implements' }],
  }).length === 0);
  ok('neither deltas nor edges rejected', validateReturn({
    agent: 'x', role: 'pma', phase: 'P3', status: 'COMPLETE', summary: 's', artifacts: [],
  }).some(e => /traceabilityDeltas or traceabilityEdges/.test(e)));
  ok('garbage return rejected', validateReturn({}).length > 0);
  ok('missing summary rejected', validateReturn({
    agent: 'x', role: 'pma', phase: 'P3', status: 'COMPLETE', artifacts: [], traceabilityDeltas: [],
  }).some(e => /summary/.test(e)));
  ok('bad traceability delta rejected', validateReturn({
    agent: 'x', role: 'pma', phase: 'P3', status: 'COMPLETE', summary: 's',
    artifacts: [], traceabilityDeltas: [{ requirement: 'REQ-001' }],
  }).some(e => /traceability/.test(e)));
  ok('bad satisfiesHow rejected', validateReturn({
    agent: 'x', role: 'reena', phase: 'P5', status: 'COMPLETE', summary: 's',
    artifacts: [], traceabilityEdges: [{ req: 'REQ-001', artifactId: 'Foo', satisfiesHow: 'magic' }],
  }).some(e => /satisfiesHow/.test(e)));
  ok('BLOCKED without blockers rejected', validateReturn({
    agent: 'x', role: 'pma', phase: 'P3', status: 'BLOCKED', summary: 's',
    artifacts: [], traceabilityDeltas: [],
  }).some(e => /blockers/.test(e)));
})();

// 4. Dispatch + processReturn → state records (completion = record)
(() => {
  const s = createState({ project: 'demo', frameworkVersion: 'test', timestamp: TS });
  recordDispatch(s, { agent: 'pma-1', role: 'pma', phase: 'P3', timestamp: TS });
  ok('dispatch recorded RUNNING', active(s).dispatch[0].status === 'RUNNING');
  processReturn(s, {
    agent: 'pma-1', role: 'pma', phase: 'P3', status: RETURN_STATUS.COMPLETE,
    summary: 'done', artifacts: [{ path: 'architecture.md' }],
    traceabilityDeltas: [
      { requirement: 'REQ-001', produces: 'architecture.md' },
      { requirement: 'REQ-002', produces: 'api-spec.yaml' },
    ],
  }, TS);
  ok('dispatch updated to COMPLETE', active(s).dispatch[0].status === 'COMPLETE');
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
  ok('BLOCKED return records an open blocker', active(s).blockers.length === 1 && active(s).blockers[0].status === 'OPEN');
})();

// 6. PROP-042: traceabilityEdges — artifact graph, indexes, three-level coverage
(() => {
  const s = createState({ project: 'graph-demo', frameworkVersion: 'test', timestamp: TS });
  recordDispatch(s, { agent: 'reena-1', role: 'reena', phase: 'P5', timestamp: TS });
  processReturn(s, {
    agent: 'reena-1', role: 'reena', phase: 'P5', status: RETURN_STATUS.COMPLETE,
    summary: 'generated service and tests',
    artifacts: [],
    traceabilityEdges: [
      { req: 'REQ-012', reqField: 'Invariants[0]', artifactId: 'OrgService', artifactKind: 'class',
        artifactPath: 'features/org/services/org_service.dart', component: 'mobile', satisfiesHow: 'enforces' },
      { req: 'REQ-012', artifactId: 'OrgService', artifactKind: 'class',
        artifactPath: 'features/org/services/org_service.dart', component: 'mobile', satisfiesHow: 'implements' },
      { req: 'REQ-003', artifactId: 'OrgService', artifactKind: 'class',
        artifactPath: 'features/org/services/org_service.dart', component: 'mobile', satisfiesHow: 'implements' },
      { req: 'REQ-012', artifactId: 'OrgServiceTest', artifactKind: 'test',
        artifactPath: 'features/org/tests/org_service_test.dart', component: 'mobile', satisfiesHow: 'validates' },
    ],
  }, TS);

  ok('canonical id uses component:name', canonicalId('OrgService', 'mobile') === 'mobile:OrgService');
  ok('artifact node created for OrgService', !!s.traceability.artifacts['mobile:OrgService']);
  ok('artifact kind recorded', s.traceability.artifacts['mobile:OrgService'].kind === 'class');
  ok('byReq index built for REQ-012', (s.traceability.byReq['REQ-012'] || []).includes('mobile:OrgService'));
  ok('byReq index built for REQ-003', (s.traceability.byReq['REQ-003'] || []).includes('mobile:OrgService'));
  ok('byArtifact index built', (s.traceability.byArtifact['mobile:OrgService'] || []).includes('REQ-012'));
  ok('byArtifact includes REQ-003', (s.traceability.byArtifact['mobile:OrgService'] || []).includes('REQ-003'));
  ok('3 unique edges stored (enforces+implements+validates for REQ-012; implements for REQ-003)',
    s.traceability.edges.length === 4);

  const cov = coverage(s);
  ok('linked = 2 (REQ-012 + REQ-003)', cov.linked === 2);
  ok('implemented = 2 (both have implements edges)', cov.implemented === 2);
  ok('verified = 1 (only REQ-012 has validates edge)', cov.verified === 1);
  ok('requirementsCovered backward compat = linked', cov.requirementsCovered === 2);
})();

// 7. PROP-042: upsert — latest assertion wins on same natural key
(() => {
  const s = createState({ project: 'upsert-demo', frameworkVersion: 'test', timestamp: TS });
  recordDispatch(s, { agent: 'reena-1', role: 'reena', phase: 'P5', timestamp: TS });
  processReturn(s, {
    agent: 'reena-1', role: 'reena', phase: 'P5', status: RETURN_STATUS.COMPLETE,
    summary: 'first pass', artifacts: [],
    traceabilityEdges: [
      { req: 'REQ-001', artifactId: 'Svc', component: 'mobile', satisfiesHow: 'implements', location: 'svc.dart:10' },
    ],
  }, TS);
  recordDispatch(s, { agent: 'reena-2', role: 'reena', phase: 'P5', timestamp: TS });
  processReturn(s, {
    agent: 'reena-2', role: 'reena', phase: 'P5', status: RETURN_STATUS.COMPLETE,
    summary: 'self-heal retry', artifacts: [],
    traceabilityEdges: [
      { req: 'REQ-001', artifactId: 'Svc', component: 'mobile', satisfiesHow: 'implements', location: 'svc.dart:22' },
    ],
  }, TS);
  ok('upsert: only 1 edge (not 2) for same natural key', s.traceability.edges.length === 1);
  ok('upsert: latest location wins', s.traceability.edges[0].location === 'svc.dart:22');
  ok('upsert: latest agent wins', s.traceability.edges[0].agent === 'reena-2');
})();

// 8. PROP-042: mixed delta + edge return (transition period)
(() => {
  const s = createState({ project: 'mixed', frameworkVersion: 'test', timestamp: TS });
  recordDispatch(s, { agent: 'pma-1', role: 'pma', phase: 'P3', timestamp: TS });
  processReturn(s, {
    agent: 'pma-1', role: 'pma', phase: 'P3', status: RETURN_STATUS.COMPLETE,
    summary: 'design doc', artifacts: [],
    traceabilityDeltas: [{ requirement: 'REQ-001', produces: 'arch.md' }],
    traceabilityEdges: [{ req: 'REQ-002', artifactId: 'ApiSpec', satisfiesHow: 'documents' }],
  }, TS);
  ok('mixed: delta recorded', s.traceability.deltas.length === 1);
  ok('mixed: edge recorded', s.traceability.edges.length === 1);
  const cov = coverage(s);
  ok('mixed: requirementsCovered = 2 (delta + edge)', cov.requirementsCovered === 2);
})();

// D6 — a return must carry `agent`, and processReturn must close/flag the dispatch.
(() => {
  const base = { role: 'talib', phase: 'P1', status: RETURN_STATUS.COMPLETE, summary: 's', artifacts: [], traceabilityEdges: [] };
  ok('D6: return missing agent is rejected', validateReturn(base).includes('missing agent'));
  ok('D6: return with agent validates', validateReturn({ ...base, agent: 'i1' }).length === 0);

  const s = createState({ project: 'd6', frameworkVersion: 't', timestamp: TS });
  recordDispatch(s, { agent: 'i1', role: 'talib', phase: 'P1', timestamp: TS });
  processReturn(s, { ...base, agent: 'i1' }, TS);
  ok('D6: matching return closes its dispatch (not stuck RUNNING)', active(s).dispatch[0].status === 'COMPLETE');

  processReturn(s, { ...base, agent: 'ghost' }, TS);
  ok('D6: unmatched return is flagged, not silently dropped', s.audit.some(a => a.event === 'RETURN_UNMATCHED' && a.agent === 'ghost'));
})();

// D7 — testManifest validation and legacy `requirement` alias.
(() => {
  const base = { agent: 'i1', role: 'charlie', phase: 'P5', status: RETURN_STATUS.COMPLETE, summary: 's', artifacts: [], traceabilityEdges: [] };
  ok('D7: testManifest entry without req is rejected', validateReturn({ ...base, testManifest: [{ outcomesTested: true }] }).some(e => /testManifest/.test(e)));
  ok('D7: legacy `requirement` alias accepted', validateReturn({ ...base, testManifest: [{ requirement: 'REQ-1' }] }).length === 0);
})();

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log('All subagent tests passed!');
