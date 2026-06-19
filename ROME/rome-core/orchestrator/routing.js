/**
 * Intent-driven routing (ROME-PROP-036) — resolves the phase sequence from an
 * Input Characterization Record (ICR). One routing model (PROP-035 §4a):
 * optional phases (P0.5 intake, P3.5 prototype) are included or omitted here;
 * the guard then treats every routed phase identically.
 *
 * ICR (subset): { intent: 'greenfield'|'refinement'|'extension'|'migration',
 *                 qualityVerdict: 'SUFFICIENT'|'INSUFFICIENT',
 *                 prototype: { enabled: bool } }
 * Pure, no deps.
 */

const { resolveRouting } = require('./lifecycle');

const BROWNFIELD = new Set(['refinement', 'extension', 'migration']);

/**
 * Resolve a routing from an ICR. Throws if input quality is INSUFFICIENT
 * (PROP-036 §2.2: do not proceed on inadequate input — elicit clarification).
 * @returns { routing:[phaseId], reverseFirst:boolean, notes:[string] }
 */
function routeFromICR(icr = {}) {
  if (icr.qualityVerdict && icr.qualityVerdict !== 'SUFFICIENT') {
    throw new Error('Input quality INSUFFICIENT — gather clarification before routing (PROP-036 §2.2)');
  }
  const intent = icr.intent || 'greenfield';
  const notes = [];
  const phases = ['P0'];

  // Brownfield/migration always characterize inputs (intake) and derive as-is first.
  const reverseFirst = BROWNFIELD.has(intent);
  if (icr.intent && (reverseFirst || icr.forceIntake)) { phases.push('P0.5'); notes.push('intake/characterization included'); }

  phases.push('P1', 'P2', 'P3');

  if (icr.prototype && icr.prototype.enabled) { phases.push('P3.5'); notes.push('optional UI/UX prototype enabled'); }

  phases.push('P4', 'P5');

  if (reverseFirst) notes.push(`brownfield intent "${intent}": derive as-is, then forward on the delta`);
  else notes.push('greenfield: forward-only');

  return { routing: resolveRouting(phases), reverseFirst, notes };
}

module.exports = { routeFromICR, BROWNFIELD };
