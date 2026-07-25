/**
 * Regression test for validate-aordl.js (ROME-PLAN-035 Stage 1.x).
 * Proves the deterministic P1 accuracy check (PROP-035 §3.5.3) runs:
 *   - a valid AORDL requirement PASSes in STRICT mode
 *   - an invalid one FAILs and reports the expected violation rules
 */
const path = require('path');
const ValidateAORDL = require('./validate-aordl.js');

let passed = 0, failed = 0;
function check(name, cond) {
  if (cond) { console.log(`  ✓ ${name}`); passed++; }
  else { console.log(`  ✗ ${name}`); failed++; }
}

(async () => {
  console.log('validate-aordl regression:');

  const good = await ValidateAORDL.execute(
    { requirement_file: path.join(__dirname, 'tests/REQ-good.yaml'), mode: 'STRICT' }, 'test-good');
  check('valid requirement PASSes (STRICT)', good.status === 'PASS');
  check('valid requirement has zero violations', good.violations.length === 0);
  check('valid requirement id parsed', good.requirement_id === 'REQ-001');

  const bad = await ValidateAORDL.execute(
    { requirement_file: path.join(__dirname, 'tests/REQ-bad.yaml'), mode: 'STRICT' }, 'test-bad');
  const rules = new Set(bad.violations.map(v => v.rule));
  check('invalid requirement FAILs (STRICT)', bad.status === 'FAIL');
  check('detects bad ID format', rules.has('ID_FORMAT'));
  check('detects generic actor', rules.has('GENERIC_ACTOR'));
  check('detects ambiguous verb', rules.has('AMBIGUOUS_VERB'));
  check('detects missing required field (CopilotMode)', rules.has('REQUIRED_FIELDS'));
  check('detects technical jargon (SQL)', rules.has('TECHNICAL_JARGON'));

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
  console.log('All validate-aordl tests passed!');
})().catch(e => { console.error('FATAL', e); process.exit(1); });
