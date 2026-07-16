/**
 * Intake helper regression (ROME-PROP-047 / D16, D4).
 * Run: node tests/intake.test.cjs
 */
const { parseReliability, classifyInputs } = require('../intake');

let passed = 0, failed = 0;
function ok(name, cond) { if (cond) { console.log(`  ✓ ${name}`); passed++; } else { console.log(`  ✗ ${name}`); failed++; } }

console.log('intake regression:');

// parseReliability — reads the sponsor's **Status:** marker (D16)
ok('reads Reliable', parseReliability('**Status:** Reliable — derived from journeys') === 'Reliable');
ok('reads PROPOSED', parseReliability('| **Status:** PROPOSED — named in the PRD only |') === 'PROPOSED');
ok('reads RECONSTRUCTED', parseReliability('Status: RECONSTRUCTED (source not available)') === 'RECONSTRUCTED');
ok('reads UNDEFINED', parseReliability('**Status:** SCOPE UNDEFINED') === 'UNDEFINED');
ok('reads "genuinely undesigned" → UNDEFINED', parseReliability('**Status:** genuinely undesigned') === 'UNDEFINED');
ok('no marker → null (Surveyor assesses)', parseReliability('# Bookings\nSome requirements here.') === null);
ok('unrecognized marker → null', parseReliability('**Status:** ???') === null);

// classifyInputs — heterogeneity heuristic (D4)
ok('single clean text file → homogeneous', classifyInputs([{ name: 'prd.md' }]).heterogeneous === false);
ok('mixed formats → heterogeneous', classifyInputs([{ name: 'prd.md' }, { name: 'notes.txt' }]).heterogeneous === true);
ok('binary asset → heterogeneous', classifyInputs([{ name: 'wireframes.pdf' }]).heterogeneous === true);
ok('binary reason reported', /binary/.test(classifyInputs([{ name: 'ui.png' }]).reasons.join()));
ok('many files → heterogeneous', classifyInputs(Array.from({ length: 6 }, (_, i) => ({ name: `f${i}.md` }))).heterogeneous === true);

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log('All intake tests passed!');
