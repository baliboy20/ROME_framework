/**
 * Deterministic phase-advance guard — the load-bearing enforcement of
 * ROME-PROP-035 §3.5. The orchestrator (an LLM) decides what to do; THIS code
 * decides what is ALLOWED. Quality guarantees hold even if the orchestrator errs.
 *
 * Pure functions over a state object (see state.js). No I/O, no deps.
 *
 * Enforced invariants:
 *  1. Only the current phase may be advanced.
 *  2. A gated phase advances only on an APPROVE verdict for its gate...
 *  3. ...recorded by the phase's designated gate role (no self-approval — EP-5).
 *  4. A later BLOCK overrides an earlier APPROVE (latest verdict wins).
 *  5. Phases cannot be skipped or reordered (advance moves exactly one step).
 */

const { STATUS, VERDICT, PHASE_BY_ID } = require('./lifecycle');

function phaseDef(phaseId) {
  const def = PHASE_BY_ID[phaseId];
  if (!def) throw new Error(`Unknown phase: ${phaseId}`);
  return def;
}

/** Latest verdict recorded for a phase's gate, or null. */
function latestVerdict(state, phaseId) {
  const def = phaseDef(phaseId);
  if (!def.gate) return null;
  for (let i = state.gateLedger.length - 1; i >= 0; i--) {
    const e = state.gateLedger[i];
    if (e.phase === phaseId && e.gate === def.gate.id) return e;
  }
  return null;
}

/**
 * Record a gate verdict. Rejects:
 *  - verdicts for an ungated phase
 *  - verdicts from the wrong role (the self-approval guard)
 *  - unknown verdict values
 * Mutates and returns state.
 */
function recordGateVerdict(state, { phase, verdict, role, timestamp, note }) {
  const def = phaseDef(phase);
  if (!def.gate) throw new Error(`Phase ${phase} has no gate; cannot record a verdict`);
  if (verdict !== VERDICT.APPROVE && verdict !== VERDICT.BLOCK) {
    throw new Error(`Invalid verdict "${verdict}" (expected APPROVE|BLOCK)`);
  }
  if (role !== def.gate.role) {
    throw new Error(
      `Role "${role}" may not record ${def.gate.id}. Only "${def.gate.role}" holds gate authority ` +
      `(self-approval / wrong-approver blocked).`
    );
  }
  if (!timestamp) throw new Error('recordGateVerdict: timestamp required');
  state.gateLedger.push({ gate: def.gate.id, phase, verdict, role, timestamp, ...(note ? { note } : {}) });
  // reflect a BLOCK in phase status immediately
  if (verdict === VERDICT.BLOCK && state.phases[phase]) {
    state.phases[phase].status = STATUS.BLOCKED;
  } else if (verdict === VERDICT.APPROVE && state.phases[phase]) {
    state.phases[phase].status = STATUS.GATE;
  }
  return state;
}

/**
 * May `state.currentPhase` advance? Returns { ok, reason }.
 * Does not mutate.
 */
function canAdvance(state) {
  const phaseId = state.currentPhase;
  if (!phaseId) return { ok: false, reason: 'No current phase (lifecycle complete?)' };
  if (!state.routing.includes(phaseId)) {
    return { ok: false, reason: `Current phase ${phaseId} not in routing` };
  }
  const def = phaseDef(phaseId);

  // open blockers on this phase prevent advance
  const openBlockers = (state.blockers || []).filter(
    b => b.phase === phaseId && b.status !== 'RESOLVED'
  );
  if (openBlockers.length) {
    return { ok: false, reason: `${openBlockers.length} open blocker(s) on ${phaseId}` };
  }

  if (def.gate) {
    const v = latestVerdict(state, phaseId);
    if (!v) return { ok: false, reason: `No ${def.gate.id} verdict recorded for ${phaseId}` };
    if (v.verdict !== VERDICT.APPROVE) {
      return { ok: false, reason: `${def.gate.id} latest verdict is ${v.verdict}, not APPROVE` };
    }
    if (v.role !== def.gate.role) {
      return { ok: false, reason: `${def.gate.id} approved by wrong role ${v.role}` };
    }
  }
  return { ok: true, reason: 'authorized' };
}

/**
 * Advance the lifecycle by exactly one routed phase. Throws if not authorized.
 * Marks the current phase COMPLETE and the next phase IN_PROGRESS.
 * Mutates and returns state.
 */
function advance(state, timestamp) {
  const decision = canAdvance(state);
  if (!decision.ok) throw new Error(`Advance BLOCKED: ${decision.reason}`);
  if (!timestamp) throw new Error('advance: timestamp required');

  const i = state.routing.indexOf(state.currentPhase);
  state.phases[state.currentPhase].status = STATUS.COMPLETE;
  const next = state.routing[i + 1];
  if (next) {
    state.currentPhase = next;
    state.phases[next].status = STATUS.IN_PROGRESS;
  } else {
    state.currentPhase = null; // lifecycle complete
  }
  state.updatedAt = timestamp;
  return state;
}

/** True when all routed phases are COMPLETE. */
function isComplete(state) {
  return state.currentPhase === null &&
    state.routing.every(id => state.phases[id] && state.phases[id].status === STATUS.COMPLETE);
}

module.exports = { latestVerdict, recordGateVerdict, canAdvance, advance, isComplete };
