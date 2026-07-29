/**
 * Executability / self-heal regression (PROP-039 Part A) with REAL execution.
 * Generates actual JS components in temp dirs and runs node on them.
 * Run: node tests/executability.test.cjs
 */
const os = require('os');
const fs = require('fs');
const path = require('path');
const { verifyComponent, selfHeal } = require('../executability');

let passed = 0, failed = 0;
function ok(n, c) { if (c) { console.log(`  ✓ ${n}`); passed++; } else { console.log(`  ✗ ${n}`); failed++; } }
function tmp() { return fs.mkdtempSync(path.join(os.tmpdir(), 'rome-exec-')); }

// A component is a dir with sum.js + a test that asserts sum(2,3)===5.
function scaffold(dir, sumBody) {
  fs.writeFileSync(path.join(dir, 'sum.js'), `module.exports = function sum(a,b){ ${sumBody} };\n`);
  fs.writeFileSync(path.join(dir, 'test.cjs'),
    `const sum=require('./sum.js'); if(sum(2,3)!==5){console.error('FAIL: sum(2,3)='+sum(2,3));process.exit(1)} console.log('ok');\n`);
}
function component(dir) {
  return { id: 'calc', cwd: dir, steps: [{ name: 'test', command: 'node', args: ['test.cjs'] }] };
}

console.log('executability regression (real execution):');

// 1. Correct code → VERIFIED
(() => {
  const d = tmp(); scaffold(d, 'return a+b;');
  const r = verifyComponent(component(d));
  ok('correct component VERIFIED', r.status === 'VERIFIED');
})();

// 2. Broken code → FAILED with diagnostics
(() => {
  const d = tmp(); scaffold(d, 'return a-b;');
  const r = verifyComponent(component(d));
  ok('broken component FAILED', r.status === 'FAILED');
  ok('captures diagnostics', /FAIL: sum\(2,3\)/.test(r.diagnostics));
})();

// 3. Self-heal fixes a broken component (heal rewrites sum.js after seeing diagnostics)
(() => {
  const d = tmp(); scaffold(d, 'return a-b;'); // wrong
  let healCalls = 0;
  const heal = (diagnostics, iter) => {
    healCalls++;
    // a producing sub-agent would do this; here a deterministic fix
    fs.writeFileSync(path.join(d, 'sum.js'), 'module.exports = function sum(a,b){ return a+b; };\n');
    return true;
  };
  const r = selfHeal(component(d), heal, { maxIterations: 3 });
  ok('self-heal reaches VERIFIED', r.status === 'VERIFIED');
  ok('self-heal used exactly one heal call', healCalls === 1);
  ok('not escalated', r.escalated === false);
})();

// 4. Unfixable component → exhausts iterations → escalates
(() => {
  const d = tmp(); scaffold(d, 'return a-b;');
  const heal = () => true; // pretends to fix but never does
  const r = selfHeal(component(d), heal, { maxIterations: 2 });
  ok('unfixable stays FAILED', r.status === 'FAILED');
  ok('escalated after exhaustion (PROP-039 B)', r.escalated === true);
})();

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log('All executability tests passed!');
