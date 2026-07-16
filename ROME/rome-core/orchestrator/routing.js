/**
 * Intent-driven routing (ROME-PROP-036, PROP-047) — resolves the phase sequence
 * from an Input Characterization Record (ICR). One routing model (PROP-035 §4a):
 * optional phases (P0.5 intake, P3.5 prototype) are included or omitted here;
 * the guard then treats every routed phase identically.
 *
 * ICR (subset): { intent: 'greenfield'|'refinement'|'extension'|'migration',
 *                 qualityVerdict: 'SUFFICIENT'|'INSUFFICIENT',
 *                 inputs: [{ form, location, reliability?, sponsorAuthorized? }],
 *                 prototype: { enabled: bool } }
 *
 * PROP-047 — the ICR is produced by Surveyor from real staged inputs, NOT
 * fabricated by rome-start. Two enforced invariants live here:
 *   AX-17  route only on a present, SUFFICIENT verdict over a non-empty input set.
 *   AX-18  a sponsor-flagged-shaky input routes only with sponsor authorization.
 * Pure, no deps.
 */

const { resolveRouting } = require('./lifecycle');

const BROWNFIELD = new Set(['refinement', 'extension', 'migration']);

// Sponsor-declared reliability levels (PROP-047 / D16). SHAKY levels block
// routing into requirements unless the sponsor authorizes the specific input.
const RELIABILITY = Object.freeze(['Reliable', 'PROPOSED', 'RECONSTRUCTED', 'UNDEFINED']);
const SHAKY = new Set(['PROPOSED', 'RECONSTRUCTED', 'UNDEFINED']);

/**
 * Provisional pre-assessment routing (PROP-047 Part A). Used by rome-start BEFORE
 * inputs are staged and BEFORE Surveyor runs: it always routes through intake
 * (P0.5, where Surveyor produces the real ICR) and does NOT assert a quality
 * verdict. `skipIntake` (--no-intake — confident, clean greenfield) routes past it.
 * @returns { routing:[phaseId], provisional:true, notes:[string] }
 */
function routeInitial({ skipIntake = false, prototype } = {}) {
  const phases = ['P0'];
  const notes = [];
  if (!skipIntake) { phases.push('P0.5'); notes.push('intake included — Surveyor produces the ICR from staged inputs'); }
  else notes.push('intake skipped (--no-intake): inputs asserted clean; no quality assessment');
  phases.push('P1', 'P2', 'P3');
  if (prototype && prototype.enabled) phases.push('P3.5');
  phases.push('P4', 'P5');
  notes.push('provisional routing — finalized by Surveyor intake (routeFromICR)');
  return { routing: resolveRouting(phases), provisional: true, notes };
}

/**
 * Resolve the FINAL routing from a Surveyor-produced ICR.
 * Enforces (PROP-047):
 *   AX-17 — the verdict MUST be present and SUFFICIENT (absent ≠ sufficient),
 *           over a non-empty input set.
 *   AX-18 — every SHAKY input (PROPOSED/RECONSTRUCTED/UNDEFINED) MUST carry
 *           `sponsorAuthorized: true`, else routing is refused.
 * @returns { routing:[phaseId], reverseFirst:boolean, notes:[string] }
 */
function routeFromICR(icr = {}) {
  // AX-17: a real, sufficient verdict over real inputs.
  if (icr.qualityVerdict !== 'SUFFICIENT') {
    throw new Error(
      `Input quality "${icr.qualityVerdict || '(none)'}" — route only on a Surveyor SUFFICIENT verdict ` +
      `(absent ≠ sufficient; PROP-047 AX-17). Gather clarification or run intake first.`
    );
  }
  if (Array.isArray(icr.inputs) && icr.inputs.length === 0) {
    throw new Error('No inputs to route (empty input set; PROP-047 AX-17). Stage inputs before routing.');
  }

  // AX-18: sponsor-flagged-shaky inputs need explicit authorization.
  const unauthorizedShaky = (icr.inputs || [])
    .filter(i => SHAKY.has(i.reliability) && i.sponsorAuthorized !== true)
    .map(i => `${i.location || i.form || 'input'} (${i.reliability})`);
  if (unauthorizedShaky.length) {
    throw new Error(
      `${unauthorizedShaky.length} input(s) the sponsor marked shaky lack authorization ` +
      `(PROP-047 AX-18): ${unauthorizedShaky.join(', ')}. Authorize (sponsorAuthorized:true) or clarify.`
    );
  }

  const intent = icr.intent || 'greenfield';
  const notes = [];
  const phases = ['P0'];

  const reverseFirst = BROWNFIELD.has(intent);
  if (icr.intent && (reverseFirst || icr.forceIntake)) { phases.push('P0.5'); notes.push('intake/characterization included'); }

  phases.push('P1', 'P2', 'P3');
  if (icr.prototype && icr.prototype.enabled) { phases.push('P3.5'); notes.push('optional UI/UX prototype enabled'); }
  phases.push('P4', 'P5');

  if (reverseFirst) notes.push(`brownfield intent "${intent}": derive as-is, then forward on the delta`);
  else notes.push('greenfield: forward-only');

  const authorizedShaky = (icr.inputs || []).filter(i => SHAKY.has(i.reliability)).length;
  if (authorizedShaky) notes.push(`${authorizedShaky} sponsor-authorized shaky input(s) routed`);

  return { routing: resolveRouting(phases), reverseFirst, notes };
}

module.exports = { routeFromICR, routeInitial, BROWNFIELD, RELIABILITY, SHAKY };
