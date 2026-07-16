/** Routing (PROP-036) + budget (PROP-040) regression. Run: node tests/routing-budget.test.cjs */
const { routeFromICR, routeInitial } = require('../routing');
const { createState, active } = require('../state');
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

  const p = routeFromICR({ intent: 'greenfield', qualityVerdict: 'SUFFICIENT', prototype: { enabled: true } });
  ok('prototype enabled adds P3.5', p.routing.includes('P3.5'));

  ok('insufficient input quality throws', threw(() => routeFromICR({ intent: 'greenfield', qualityVerdict: 'INSUFFICIENT' })));

  // PROP-047 AX-17: absent verdict is NOT sufficient — routeFromICR refuses it.
  ok('absent verdict throws (AX-17)', threw(() => routeFromICR({ intent: 'greenfield' })));
  ok('empty input set throws (AX-17)', threw(() => routeFromICR({ intent: 'greenfield', qualityVerdict: 'SUFFICIENT', inputs: [] })));

  // PROP-047 AX-18: a sponsor-flagged-shaky input blocks routing unless authorized.
  const shaky = { intent: 'greenfield', qualityVerdict: 'SUFFICIENT', inputs: [{ location: 'm2.md', reliability: 'PROPOSED' }] };
  ok('unauthorized shaky input throws (AX-18)', threw(() => routeFromICR(shaky)));
  const authorized = { intent: 'greenfield', qualityVerdict: 'SUFFICIENT', inputs: [{ location: 'm2.md', reliability: 'PROPOSED', sponsorAuthorized: true }] };
  ok('sponsor-authorized shaky input routes (AX-18)', routeFromICR(authorized).routing.length > 0);

  // PROP-047 Part A: provisional pre-assessment routing always includes intake.
  const init = routeInitial({});
  ok('routeInitial includes P0.5 intake', init.routing.includes('P0.5') && init.provisional === true);
  ok('routeInitial --no-intake skips P0.5', !routeInitial({ skipIntake: true }).routing.includes('P0.5'));
})();

// --- budget (040) ---
(() => {
  const s = createState({ project: 'b', frameworkVersion: 't', timestamp: '2026-06-18T00:00:00Z' });
  ok('no ceiling → PROCEED, remaining Infinity', budget.policy(s).action === 'PROCEED' && budget.remaining(s) === Infinity);

  active(s).budget.ceiling = 1000;
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
