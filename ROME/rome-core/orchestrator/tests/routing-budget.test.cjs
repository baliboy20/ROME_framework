/** Routing (PROP-036) + budget (PROP-040) regression. Run: node tests/routing-budget.test.cjs */
const { routeFromICR } = require('../routing');
const { createState } = require('../state');
const budget = require('../budget');

let passed = 0, failed = 0;
function ok(n, c) { if (c) { console.log(`  ✓ ${n}`); passed++; } else { console.log(`  ✗ ${n}`); failed++; } }
function threw(fn) { try { fn(); return false; } catch { return true; } }

console.log('routing + budget regression:');

// --- routing (036) ---
(() => {
  const g = routeFromICR({ intent: 'greenfield', qualityVerdict: 'SUFFICIENT' });
  ok('greenfield = forward-only, no intake/proto', JSON.stringify(g.routing) === JSON.stringify(['P0', 'P1', 'P2', 'P3', 'P4', 'P5']));
  ok('greenfield not reverse-first', g.reverseFirst === false);

  const b = routeFromICR({ intent: 'refinement', qualityVerdict: 'SUFFICIENT' });
  ok('brownfield includes P0.5 intake', b.routing.includes('P0.5'));
  ok('brownfield is reverse-first', b.reverseFirst === true);

  const p = routeFromICR({ intent: 'greenfield', prototype: { enabled: true } });
  ok('prototype enabled adds P3.5', p.routing.includes('P3.5'));

  ok('insufficient input quality throws', threw(() => routeFromICR({ intent: 'greenfield', qualityVerdict: 'INSUFFICIENT' })));

  const def = routeFromICR({});
  ok('empty ICR defaults to greenfield', def.reverseFirst === false && !def.routing.includes('P0.5'));
})();

// --- budget (040) ---
(() => {
  const s = createState({ project: 'b', frameworkVersion: 't', timestamp: '2026-06-18T00:00:00Z' });
  ok('no ceiling → PROCEED, remaining Infinity', budget.policy(s).action === 'PROCEED' && budget.remaining(s) === Infinity);

  s.budget.ceiling = 1000;
  budget.record(s, 500);
  ok('half-spent → PROCEED', budget.policy(s).action === 'PROCEED');
  ok('remaining computed', budget.remaining(s) === 500);

  budget.record(s, 350); // 850/1000 = 85% > 80% degrade band
  ok('degrade band → DEGRADE', budget.policy(s).action === 'DEGRADE');

  budget.record(s, 200); // 1050/1000 over
  ok('over ceiling → ESCALATE', budget.policy(s).action === 'ESCALATE');
  ok('remaining clamps to 0', budget.remaining(s) === 0);

  ok('negative spend rejected', threw(() => budget.record(s, -5)));
})();

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log('All routing + budget tests passed!');
