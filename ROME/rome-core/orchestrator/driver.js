/**
 * Driver helpers (ROME-PLAN-035 §6d). Given state, compute the orchestrator's
 * next deterministic action. The LLM orchestrator follows this; the guard
 * enforces it. Pure, no deps.
 */

const { PHASE_BY_ID } = require('./lifecycle');
const { isComplete, latestVerdict } = require('./guard');

/** Has the phase owner produced (a COMPLETE return for this phase)? */
function producedFor(state, phase) {
  return state.dispatch.some(d => d.phase === phase && d.status === 'COMPLETE');
}

/**
 * The next action for the orchestrator.
 * @returns {done} | { phase, owner, gateRole, step, instruction }
 *   step: 'DISPATCH' | 'REQUEST_GATE' | 'ADVANCE'
 */
function nextAction(state) {
  if (isComplete(state)) return { done: true, instruction: 'lifecycle complete — deliver' };
  const phase = state.currentPhase;
  const def = PHASE_BY_ID[phase];
  const owner = def.owner;
  const gateRole = def.gate ? def.gate.role : null;

  if (!producedFor(state, phase)) {
    return { phase, owner, gateRole, step: 'DISPATCH',
      instruction: `dispatch ${owner} for ${phase} (${def.name}); process its structured return` };
  }
  if (def.gate) {
    const v = latestVerdict(state, phase);
    if (!v || v.verdict !== 'APPROVE') {
      return { phase, owner, gateRole, step: 'REQUEST_GATE',
        instruction: `request ${def.gate.id} verdict from ${gateRole}; record via guard` };
    }
  }
  return { phase, owner, gateRole, step: 'ADVANCE',
    instruction: `guard advance from ${phase}` };
}

module.exports = { nextAction, producedFor };
