/** Verification module regression (PROP-035 §3.5 hardening + PROP-042 edge path + PROP-041 matrix/sponsorOq). Run: node tests/verification.test.cjs */
const { createState } = require('../state');
const { recordDispatch, processReturn } = require('../subagent');
const { recordVerification, checkTraceability, checkTestAdequacy, buildMatrix, checkMatrix, checkSponsorOq } = require('../verification');

const TS = '2026-06-19T00:00:00Z';
let passed = 0, failed = 0;
function ok(n, c) { if (c) { console.log(`  ✓ ${n}`); passed++; } else { console.log(`  ✗ ${n}`); failed++; } }
function withDeltas(deltas) {
  const s = createState({ project: 'v', frameworkVersion: 't', timestamp: TS });
  recordDispatch(s, { agent: 'a', role: 'x', phase: 'P5', timestamp: TS });
  processReturn(s, { agent: 'a', role: 'x', phase: 'P5', status: 'COMPLETE', summary: 's', artifacts: [], traceabilityDeltas: deltas }, TS);
  return s;
}

function withEdges(edges) {
  const s = createState({ project: 'v', frameworkVersion: 't', timestamp: TS });
  recordDispatch(s, { agent: 'a', role: 'x', phase: 'P5', timestamp: TS });
  processReturn(s, { agent: 'a', role: 'x', phase: 'P5', status: 'COMPLETE', summary: 's', artifacts: [], traceabilityEdges: edges }, TS);
  return s;
}

console.log('verification regression:');

// recordVerification
(() => {
  const s = createState({ project: 'v', frameworkVersion: 't', timestamp: TS });
  recordVerification(s, 'P5', 'executability', true, null, TS);
  ok('records a passing fact', s.verification.P5.executability.pass === true);
  ok('audit entry written', s.audit.some(a => a.event === 'VERIFY' && a.key === 'executability'));
})();

// traceability completeness (ALWAYS-on)
(() => {
  const s = withDeltas([{ requirement: 'REQ-001', produces: 'a.md' }]);
  ok('req with a delta passes (non-test mode)', checkTraceability(s, ['REQ-001']).pass === true);
  ok('missing req fails', checkTraceability(s, ['REQ-001', 'REQ-002']).pass === false);

  // P5 requires BOTH code and test per requirement
  const s2 = withDeltas([
    { requirement: 'REQ-001', produces: 'user.js' },
    { requirement: 'REQ-001', produces: 'user.test.js' },
    { requirement: 'REQ-002', produces: 'order.js' }, // no test
  ]);
  const r = checkTraceability(s2, ['REQ-001', 'REQ-002'], { requireTest: true });
  ok('REQ with code+test passes; REQ without test fails', r.pass === false &&
     r.missing.length === 1 && r.missing[0].requirement === 'REQ-002' && r.missing[0].missing.includes('test'));
})();

// MVP test adequacy (declared Outcomes + Errors must be tested — no more)
(() => {
  const aordl = [{ ID: 'REQ-001', Outcomes: ['invoice saved'], Errors: [{ error: 'empty' }, { error: 'inactive' }] }];
  const good = checkTestAdequacy([{ requirement: 'REQ-001', outcomesTested: true, errorsTested: ['empty', 'inactive'] }], aordl);
  ok('MVP adequacy passes when outcomes + all errors tested', good.pass === true);

  const missErr = checkTestAdequacy([{ requirement: 'REQ-001', outcomesTested: true, errorsTested: ['empty'] }], aordl);
  ok('fails when a declared error untested', missErr.pass === false && /error conditions tested/.test(missErr.gaps[0].reason));

  const missOut = checkTestAdequacy([{ requirement: 'REQ-001', outcomesTested: false, errorsTested: ['empty', 'inactive'] }], aordl);
  ok('fails when happy-path outcome untested', missOut.pass === false);

  const noTests = checkTestAdequacy([], aordl);
  ok('fails when a requirement has no tests reported', noTests.pass === false);

  // MVP: a requirement with no declared errors needs only its outcome — not gold-plating
  const minimal = checkTestAdequacy([{ requirement: 'REQ-009', outcomesTested: true, errorsTested: [] }],
    [{ ID: 'REQ-009', Outcomes: ['done'], Errors: [] }]);
  ok('MVP: no declared errors → only outcome required', minimal.pass === true);
})();

// PROP-042: edge-based checkTraceability
(() => {
  const s = withEdges([
    { req: 'REQ-001', artifactId: 'Svc', satisfiesHow: 'implements' },
    { req: 'REQ-001', artifactId: 'SvcTest', satisfiesHow: 'validates' },
    { req: 'REQ-002', artifactId: 'Svc', satisfiesHow: 'implements' },
    // REQ-002 has no validates edge
  ]);
  ok('edge path: req with any edge passes (non-test mode)', checkTraceability(s, ['REQ-001']).pass === true);
  ok('edge path: missing req fails', checkTraceability(s, ['REQ-001', 'REQ-999']).pass === false);

  const r = checkTraceability(s, ['REQ-001', 'REQ-002'], { requireTest: true });
  ok('edge path: REQ with implements+validates passes; REQ without validates fails',
    r.pass === false && r.missing.length === 1 && r.missing[0].requirement === 'REQ-002' && r.missing[0].missing.includes('test'));

  // stale edges are excluded
  s.traceability.edges.forEach(e => { if (e.req === 'REQ-001') e.stale = true; });
  ok('edge path: stale edges not counted', checkTraceability(s, ['REQ-001']).pass === false);
})();

// PROP-041: buildMatrix + checkMatrix
(() => {
  const s = withEdges([
    { req: 'REQ-001', artifactId: 'ApiSpec', satisfiesHow: 'documents',  location: 'api-design.md#create-org' },
    { req: 'REQ-001', artifactId: 'OrgSvc',  satisfiesHow: 'implements', location: 'org_service.dart:42' },
    { req: 'REQ-001', artifactId: 'OrgTest', satisfiesHow: 'validates',  location: 'org_service_test.dart:30' },
    { req: 'REQ-002', artifactId: 'OrgSvc',  satisfiesHow: 'implements', location: 'org_service.dart:88' },
    // REQ-002 has no test location → partial
    { req: 'REQ-003', artifactId: 'Foo',     satisfiesHow: 'implements' },
    // REQ-003 edge has no location field → unlinked in matrix
  ]);
  const reqs = ['REQ-001', 'REQ-002', 'REQ-003'];
  const matrix = buildMatrix(s, reqs);

  ok('matrix: REQ-001 status = linked', matrix['REQ-001'].status === 'linked');
  ok('matrix: REQ-001 has design entry', matrix['REQ-001'].design.includes('api-design.md#create-org'));
  ok('matrix: REQ-001 has code entry', matrix['REQ-001'].code.includes('org_service.dart:42'));
  ok('matrix: REQ-001 has test entry', matrix['REQ-001'].tests.includes('org_service_test.dart:30'));
  ok('matrix: REQ-002 status = partial (code but no test)', matrix['REQ-002'].status === 'partial');
  ok('matrix: REQ-003 status = unlinked (no location on edge)', matrix['REQ-003'].status === 'unlinked');

  // P3: warn-only — always passes; warns only on reqs lacking a design link
  const p3 = checkMatrix(s, reqs, { phase: 'P3' });
  ok('checkMatrix P3: always passes', p3.pass === true);
  ok('checkMatrix P3: warns on reqs with no design link (REQ-002, REQ-003)', p3.warnings.length === 2 && p3.warnings.includes('REQ-002') && p3.warnings.includes('REQ-003'));
  ok('checkMatrix P3: design-anchored REQ-001 not warned (covered for design even without code yet)', !p3.warnings.includes('REQ-001'));

  // a req with a design anchor but no code/tests is fine at P3, not warned
  const sDesignOnly = withEdges([
    { req: 'REQ-010', artifactId: 'Spec', satisfiesHow: 'documents', location: 'design.md#req-010' },
  ]);
  const p3d = checkMatrix(sDesignOnly, ['REQ-010'], { phase: 'P3' });
  ok('checkMatrix P3: design-only req passes with zero warnings', p3d.pass === true && p3d.warnings.length === 0);
  ok('checkMatrix P5: same design-only req fails STRICT (no code/tests)', checkMatrix(sDesignOnly, ['REQ-010'], { phase: 'P5' }).pass === false);

  // P5: strict — partial and unlinked both fail
  const p5 = checkMatrix(s, reqs, { phase: 'P5' });
  ok('checkMatrix P5: fails when partial/unlinked exist', p5.pass === false);
  ok('checkMatrix P5: failures includes REQ-002 and REQ-003', p5.failures.includes('REQ-002') && p5.failures.includes('REQ-003'));
  ok('checkMatrix P5: REQ-001 not in failures', !p5.failures.includes('REQ-001'));

  // fully linked set passes P5
  const s2 = withEdges([
    { req: 'REQ-001', artifactId: 'S', satisfiesHow: 'implements', location: 'svc.dart:1' },
    { req: 'REQ-001', artifactId: 'T', satisfiesHow: 'validates',  location: 'svc_test.dart:1' },
  ]);
  ok('checkMatrix P5: fully linked set passes', checkMatrix(s2, ['REQ-001'], { phase: 'P5' }).pass === true);
})();

// PROP-041: checkSponsorOq + openQuestions in processReturn
(() => {
  const s = createState({ project: 'oq-test', frameworkVersion: 't', timestamp: TS });
  ok('initial state: awaitingSponsor = 0 → passes', checkSponsorOq(s).pass === true);

  // Talib returns OQ counts
  recordDispatch(s, { agent: 'talib-1', role: 'talib', phase: 'P2', timestamp: TS });
  processReturn(s, {
    agent: 'talib-1', role: 'talib', phase: 'P2', status: 'COMPLETE',
    summary: 'analysis done', artifacts: [], traceabilityDeltas: [],
    openQuestions: { resolvedByTalib: 10, awaitingSponsor: 3, deferrals: [] },
  }, TS);
  ok('oq merged into state', s.oq.awaitingSponsor === 3 && s.oq.resolvedByTalib === 10);
  ok('checkSponsorOq fails when awaitingSponsor > 0', checkSponsorOq(s).pass === false);
  ok('detail mentions count', /3 sponsor-owned/.test(checkSponsorOq(s).detail));

  // sponsor answers → talib returns again with awaitingSponsor = 0
  recordDispatch(s, { agent: 'talib-2', role: 'talib', phase: 'P2', timestamp: TS });
  processReturn(s, {
    agent: 'talib-2', role: 'talib', phase: 'P2', status: 'COMPLETE',
    summary: 'oqs resolved', artifacts: [], traceabilityDeltas: [],
    openQuestions: { resolvedByTalib: 3, awaitingSponsor: 0, deferrals: [] },
  }, TS);
  ok('awaitingSponsor reset to 0 on re-return', s.oq.awaitingSponsor === 0);
  ok('resolvedByTalib accumulates across returns', s.oq.resolvedByTalib === 13);
  ok('checkSponsorOq passes once awaitingSponsor = 0', checkSponsorOq(s).pass === true);

  // deferral recorded
  recordDispatch(s, { agent: 'talib-3', role: 'talib', phase: 'P2', timestamp: TS });
  processReturn(s, {
    agent: 'talib-3', role: 'talib', phase: 'P2', status: 'COMPLETE',
    summary: 'deferral recorded', artifacts: [], traceabilityDeltas: [],
    openQuestions: {
      resolvedByTalib: 0, awaitingSponsor: 0,
      deferrals: [{ oqId: 'OQ-003', provisional: true, provisionalAssumption: '8-12 models', affectedReqs: ['REQ-005'] }],
    },
  }, TS);
  ok('deferral stored in state.oq.deferrals', s.oq.deferrals.length === 1 && s.oq.deferrals[0].oqId === 'OQ-003');
})();

// PROP-041 B3: deferral authorization enforcement (silent-escape-hatch guard)
(() => {
  // unauthorized deferral with awaitingSponsor zeroed → STILL BLOCKS
  const s = createState({ project: 'oq-auth', frameworkVersion: 't', timestamp: TS });
  recordDispatch(s, { agent: 'talib-1', role: 'talib', phase: 'P2', timestamp: TS });
  processReturn(s, {
    agent: 'talib-1', role: 'talib', phase: 'P2', status: 'COMPLETE', summary: 's', artifacts: [], traceabilityDeltas: [],
    openQuestions: {
      resolvedByTalib: 0, awaitingSponsor: 0,
      deferrals: [{ oqId: 'OQ-007', provisional: true, affectedReqs: ['REQ-005'] }], // NO sponsorAuthorized
    },
  }, TS);
  const r = checkSponsorOq(s);
  ok('B3: unauthorized deferral blocks even when awaitingSponsor=0', r.pass === false);
  ok('B3: detail flags missing authorization', /lack explicit sponsor authorization/.test(r.detail));
  ok('B3: unauthorizedDeferrals count reported', r.unauthorizedDeferrals === 1);

  // authorized deferral → passes
  const s2 = createState({ project: 'oq-auth2', frameworkVersion: 't', timestamp: TS });
  recordDispatch(s2, { agent: 'talib-1', role: 'talib', phase: 'P2', timestamp: TS });
  processReturn(s2, {
    agent: 'talib-1', role: 'talib', phase: 'P2', status: 'COMPLETE', summary: 's', artifacts: [], traceabilityDeltas: [],
    openQuestions: {
      resolvedByTalib: 0, awaitingSponsor: 0,
      deferrals: [{ oqId: 'OQ-007', provisional: true, sponsorAuthorized: true, affectedReqs: ['REQ-005'] }],
    },
  }, TS);
  const r2 = checkSponsorOq(s2);
  ok('B3: sponsor-authorized deferral passes', r2.pass === true);
  ok('B3: detail counts authorized deferral', /1 sponsor-authorized deferral/.test(r2.detail));
})();

// D17 — checkTraceability and buildMatrix agree that `enforces` counts as code.
(() => {
  const s = createState({ project: 'd17', frameworkVersion: 't', timestamp: TS });
  s.traceability.edges.push({ req: 'REQ-106', artifactId: 'api:guard', satisfiesHow: 'enforces', location: 'require-owner.ts:3', phase: 'P5', stale: false });
  s.traceability.edges.push({ req: 'REQ-106', artifactId: 'api:guard.test', satisfiesHow: 'validates', location: 'x.test.ts:1', phase: 'P5', stale: false });
  const trace = checkTraceability(s, ['REQ-106'], { requireTest: true });
  ok('D17: enforces-only req passes checkTraceability requireTest', trace.pass === true);
  const matrix = buildMatrix(s, ['REQ-106']);
  ok('D17: buildMatrix counts enforces as code', matrix['REQ-106'].code.length === 1);
  ok('D17: both checks agree (status linked)', matrix['REQ-106'].status === 'linked');
})();

// D7 — testManifest merged from a return is read by checkTestAdequacy via `req`.
(() => {
  const s = createState({ project: 'd7', frameworkVersion: 't', timestamp: TS });
  recordDispatch(s, { agent: 'i1', role: 'charlie', phase: 'P5', timestamp: TS });
  processReturn(s, {
    agent: 'i1', role: 'charlie', phase: 'P5', status: 'COMPLETE', summary: 's',
    artifacts: [], traceabilityEdges: [],
    testManifest: [{ req: 'REQ-1', outcomesTested: true, errorsTested: ['E1'] }],
  }, TS);
  ok('D7: testManifest merged into state', s.testManifest.length === 1 && s.testManifest[0].req === 'REQ-1');
  const ta = checkTestAdequacy(s.testManifest, [{ ID: 'REQ-1', Outcomes: ['o'], Errors: [{ error: 'E1' }] }]);
  ok('D7: checkTestAdequacy reads merged manifest (no false "no tests")', ta.pass === true);
})();

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log('All verification tests passed!');
