/** Verification module regression (PROP-035 §3.5 hardening). Run: node tests/verification.test.cjs */
const { createState } = require('../state');
const { recordDispatch, processReturn } = require('../subagent');
const { recordVerification, checkTraceability, checkTestAdequacy } = require('../verification');

const TS = '2026-06-19T00:00:00Z';
let passed = 0, failed = 0;
function ok(n, c) { if (c) { console.log(`  ✓ ${n}`); passed++; } else { console.log(`  ✗ ${n}`); failed++; } }
function withDeltas(deltas) {
  const s = createState({ project: 'v', frameworkVersion: 't', timestamp: TS });
  recordDispatch(s, { agent: 'a', role: 'x', phase: 'P5', timestamp: TS });
  processReturn(s, { agent: 'a', role: 'x', phase: 'P5', status: 'COMPLETE', summary: 's', artifacts: [], traceabilityDeltas: deltas }, TS);
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

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log('All verification tests passed!');
