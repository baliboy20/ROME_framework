/**
 * Driver helpers (ROME-PLAN-035 §6d). Given state, compute the orchestrator's
 * next deterministic action. The LLM orchestrator follows this; the guard
 * enforces it. Pure, no deps.
 */

const { active } = require('./state');
const { PHASE_BY_ID } = require('./lifecycle');
const { isComplete, latestVerdict, canAdvance } = require('./guard');

/** Mechanical facts a phase still needs (missing or failed) in state.verification. */
function outstandingChecks(state, phase) {
  const def = PHASE_BY_ID[phase];
  const recs = active(state).verification[phase] || {};
  return (def.requires || []).filter(k => !recs[k] || !recs[k].pass);
}

/** Has the phase owner produced (a COMPLETE return for this phase)? */
function producedFor(state, phase) {
  return active(state).dispatch.some(d => d.phase === phase && d.status === 'COMPLETE');
}

/**
 * The next action for the orchestrator.
 * @returns {done} | { phase, owner, gateRole, step, instruction }
 *   step: 'DISPATCH' | 'REQUEST_GATE' | 'ADVANCE'
 */
function nextAction(state) {
  if (isComplete(state)) return { done: true, instruction: 'lifecycle complete — deliver' };
  const phase = active(state).currentPhase;
  const def = PHASE_BY_ID[phase];
  const owner = def.owner;
  const gateRole = def.gate ? def.gate.role : null;

  if (!producedFor(state, phase)) {
    return { phase, owner, gateRole, step: 'DISPATCH',
      instruction: `dispatch ${owner} for ${phase} (${def.name}); process its structured return` };
  }
  // mechanical facts must be recorded+passing before requesting the gate / advancing
  const outstanding = outstandingChecks(state, phase);
  if (outstanding.length) {
    return { phase, owner, gateRole, step: 'VERIFY', outstanding,
      instruction: `run mechanical checks and record verification for ${phase}: ${outstanding.join(', ')}` };
  }
  if (def.gate) {
    const v = latestVerdict(state, phase);
    if (!v || v.verdict !== 'APPROVE') {
      return { phase, owner, gateRole, step: 'REQUEST_GATE',
        instruction: `request ${def.gate.id} verdict from ${gateRole}; record via guard` };
    }
  }
  // final safety: only ADVANCE when the guard agrees
  if (!canAdvance(state).ok) {
    return { phase, owner, gateRole, step: 'BLOCKED', instruction: canAdvance(state).reason };
  }
  return { phase, owner, gateRole, step: 'ADVANCE',
    instruction: `guard advance from ${phase}` };
}

module.exports = { nextAction, producedFor, outstandingChecks };
