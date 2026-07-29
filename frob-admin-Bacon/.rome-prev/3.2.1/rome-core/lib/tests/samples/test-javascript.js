/**
 * ROME-SKILL: test-skill v1.0
 * ROME-ROBOT: archie
 * ROME-PHASE: P1-AORDL
 * ROME-DATE: 2026-01-09T20:46:13.593Z
 * ROME-DURATION: 1234ms
 * ROME-PARAMS: test=true
 */

function calculateSum(a, b) {
  return a + b;
}

const result = calculateSum(5, 3);
console.log('Sum:', result);

module.exports = { calculateSum };
