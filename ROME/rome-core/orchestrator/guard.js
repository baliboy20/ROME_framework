/**
 * Deterministic phase-advance guard — the load-bearing enforcement of
 * ROME-PROP-035 §3.5. The orchestrator (an LLM) decides what to do; THIS code
 * decides what is ALLOWED. Quality guarantees hold even if the orchestrator errs.
 *
 * Pure functions over a state object (see state.js). No I/O, no deps.
 * PROP-048: lifecycle fields live on the ACTIVE increment (state.js#active);
 * sealed increments are immutable (ROME-AX-19) and the guard refuses to touch
 * them. PROP-049: stub expiry (ROME-AX-24) is enforced at the P5 delivery edge.
 *
 * Enforced invariants:
 *  1. Only the current phase may be advanced.
 *  2. A gated phase advances only on an APPROVE verdict for its gate...
 *  3. ...recorded by the phase's designated gate role (no self-approval — EP-5).
 *  4. A later BLOCK overrides an earlier APPROVE (latest verdict wins).
 *  5. Phases cannot be skipped or reordered (advance moves exactly one step).
 */

const { STATUS, VERDICT, PHASE_BY_ID } = require('./lifecycle');
const { active } = require('./state');

function phaseDef(phaseId) {
  const def = PHASE_BY_ID[phaseId];
  if (!def) throw new Error(`Unknown phase: ${phaseId}`);
  return def;
}

/** Latest verdict recorded for a phase's gate, or null. */
function latestVerdict(state, phaseId) {
  const def = phaseDef(phaseId);
  if (!def.gate) return null;
  const inc = active(state);
  for (let i = inc.gateLedger.length - 1; i >= 0; i--) {
    const e = inc.gateLedger[i];
    if (e.phase === phaseId && e.gate === def.gate.id) return e;
  }
  return null;
}

/**
 * Record a gate verdict (ROME-PROP-045: verdict–dispatch binding).
 *
 * Preferred form binds the verdict to evidence: pass `dispatchId` (a sub-agent
 * instance id). The role is then DERIVED from that dispatch record, not trusted
 * from a parameter — a forged verdict must forge a completed gate-role dispatch,
 * not merely a string. The guard rejects a verdict whose cited dispatch is
 * unknown, for a different phase, of the wrong role, or not yet COMPLETE.
 *
 * Legacy form (transitional, one release) passes `role` with no `dispatchId`:
 * accepted, but the role is unproven and a VERDICT_LEGACY_UNBOUND audit event is
 * recorded. A future release removes this path.
 *
 * Rejects: ungated phase, unknown verdict, wrong (derived or supplied) role,
 * and — in bound form — any dispatch-binding failure. Mutates and returns state.
 */
function recordGateVerdict(state, { phase, verdict, role, dispatchId, timestamp, note }) {
  const def = phaseDef(phase);
  if (!def.gate) throw new Error(`Phase ${phase} has no gate; cannot record a verdict`);
  if (verdict !== VERDICT.APPROVE && verdict !== VERDICT.BLOCK) {
    throw new Error(`Invalid verdict "${verdict}" (expected APPROVE|BLOCK)`);
  }
  if (!timestamp) throw new Error('recordGateVerdict: timestamp required');
  const inc = active(state);
  if (inc.sealed) throw new Error(`Increment ${inc.id} is sealed — its ledger is immutable (ROME-AX-19)`);

  let resolvedRole = role;
  let boundDispatch = null;
  if (dispatchId) {
    // Bound form: derive the role from a real, completed gate-role dispatch.
    const d = (inc.dispatch || []).find(x => x.agent === dispatchId);
    if (!d) throw new Error(`Verdict cites unknown dispatch "${dispatchId}"`);
    if (d.phase !== phase) throw new Error(`Dispatch "${dispatchId}" is for ${d.phase}, not ${phase}`);
    if (d.status !== STATUS.COMPLETE) throw new Error(`Gate dispatch "${dispatchId}" has not completed (status ${d.status})`);
    resolvedRole = d.role;
    boundDispatch = dispatchId;
  } else {
    // Legacy unbound form (PROP-045 transitional): role is unproven — flag it.
    state.audit.push({ event: 'VERDICT_LEGACY_UNBOUND', gate: def.gate.id, phase, role, timestamp });
  }

  if (resolvedRole !== def.gate.role) {
    throw new Error(
      `Role "${resolvedRole}" may not record ${def.gate.id}. Only "${def.gate.role}" holds gate authority ` +
      `(self-approval / wrong-approver blocked).`
    );
  }
  inc.gateLedger.push({ gate: def.gate.id, phase, verdict, role: resolvedRole, ...(boundDispatch ? { dispatchId: boundDispatch } : {}), timestamp, ...(note ? { note } : {}) });
  // reflect a BLOCK in phase status immediately
  if (verdict === VERDICT.BLOCK && inc.phases[phase]) {
    inc.phases[phase].status = STATUS.BLOCKED;
  } else if (verdict === VERDICT.APPROVE && inc.phases[phase]) {
    inc.phases[phase].status = STATUS.GATE;
  }
  return state;
}

/**
 * May `state.currentPhase` advance? Returns { ok, reason }.
 * Does not mutate.
 */
function canAdvance(state) {
  const inc = active(state);
  const phaseId = inc.currentPhase;
  if (inc.sealed) return { ok: false, reason: `Increment ${inc.id} is sealed (ROME-AX-19)` };
  if (!phaseId) return { ok: false, reason: 'No current phase (increment complete?)' };
  if (!inc.routing.includes(phaseId)) {
    return { ok: false, reason: `Current phase ${phaseId} not in routing` };
  }
  const def = phaseDef(phaseId);

  // open blockers on this phase prevent advance
  const openBlockers = (inc.blockers || []).filter(
    b => b.phase === phaseId && b.status !== 'RESOLVED'
  );
  if (openBlockers.length) {
    return { ok: false, reason: `${openBlockers.length} open blocker(s) on ${phaseId}` };
  }

  // Mechanical preconditions: the gate role's verdict is NOT sufficient — the
  // required facts must be recorded AND passing (PROP-035 §3.5 hardening).
  // This prevents an LLM gate role from APPROVING without the checks having run.
  for (const key of def.requires || []) {
    const rec = (inc.verification[phaseId] || {})[key];
    if (!rec) return { ok: false, reason: `${phaseId}: missing mechanical check "${key}" (no verification record)` };
    if (!rec.pass) return { ok: false, reason: `${phaseId}: mechanical check "${key}" FAILED${rec.detail ? ' — ' + rec.detail : ''}` };
  }

  // PROP-049 / ROME-AX-24 (no silent stubs): at the P5 delivery edge, any stub
  // whose implementBy increment is due (<= this increment) and still ACTIVE
  // blocks advance. Undeclared stubs are a generation defect the contracts and
  // integration facts own; DECLARED stubs expire here.
  if (phaseId === 'P5') {
    const expired = (state.stubs || []).filter(st => st.status === 'ACTIVE' && st.implementBy <= inc.id);
    if (expired.length) {
      return { ok: false, reason: `${expired.length} expired stub(s) due by increment ${inc.id}: ${expired.map(st => st.subsystem).join(', ')} (ROME-AX-24)` };
    }
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

  const inc = active(state);
  const i = inc.routing.indexOf(inc.currentPhase);
  inc.phases[inc.currentPhase].status = STATUS.COMPLETE;
  const next = inc.routing[i + 1];
  if (next) {
    inc.currentPhase = next;
    inc.phases[next].status = STATUS.IN_PROGRESS;
  } else {
    inc.currentPhase = null; // increment complete — the PROJECT never seals (ROME-AX-21)
  }
  state.updatedAt = timestamp;
  return state;
}

/**
 * True when the ACTIVE increment's routed phases are all COMPLETE.
 * Per-increment by definition (ROME-AX-21): a Project has no terminal state —
 * beginIncrement (state.js) may always append the next increment.
 */
function isComplete(state) {
  const inc = active(state);
  return inc.currentPhase === null &&
    inc.routing.every(id => inc.phases[id] && inc.phases[id].status === STATUS.COMPLETE);
}

/**
 * File a TDR deviation request (ROME-PROP-052 §2.5). A producer that cannot or
 * should not honor an APPROVED TDR records it here; the checkpoint surfaces it
 * to the sponsor (AIB delta, or blocking AskUserQuestion when the checkpoint is
 * routed out). While OPEN, checkTdrConformance fails for that TDR's phases —
 * building past an unresolved deviation is structurally impossible.
 * Mutates and returns state.
 */
function recordTdrDeviation(state, { tdr, phase, reason, proposedAlternative, timestamp }) {
  if (!timestamp) throw new Error('recordTdrDeviation: timestamp required');
  const target = (state.tdrs || []).find(t => t.id === tdr);
  if (!target) throw new Error(`recordTdrDeviation: unknown TDR "${tdr}"`);
  if (target.status !== 'APPROVED') throw new Error(`recordTdrDeviation: TDR ${tdr} is ${target.status}, not APPROVED — nothing to deviate from`);
  if (!reason || !proposedAlternative) throw new Error('recordTdrDeviation: reason and proposedAlternative required');
  state.tdrDeviations = state.tdrDeviations || [];
  const id = `DEV-${state.tdrDeviations.length + 1}`;
  state.tdrDeviations.push({ id, tdr, phase: phase || null, reason, proposedAlternative, status: 'OPEN', timestamp });
  state.audit.push({ event: 'TDR_DEVIATION_FILED', deviation: id, tdr, phase: phase || null, timestamp });
  return state;
}

/**
 * Resolve a TDR deviation (ROME-PROP-052 §2.5 / ROME-AX-30): ONLY the sponsor
 * changes a decision's authority. The caller must pass `sponsor: true` — an
 * explicit assertion that the resolution is the sponsor's recorded answer (the
 * sponsorAuthorized pattern of AX-18/23); anything else is refused. Approval
 * supersedes the TDR (status → SUPERSEDED, `supersededBy` = deviation id);
 * rejection reinstates it as binding. Mutates and returns state.
 */
function resolveTdrDeviation(state, { deviation, approved, sponsor, timestamp }) {
  if (!timestamp) throw new Error('resolveTdrDeviation: timestamp required');
  if (sponsor !== true) {
    throw new Error('Only the sponsor resolves a TDR deviation (sponsor:true required — ROME-AX-30). Detection or producer judgement never strips an APPROVED TDR of authority.');
  }
  const d = (state.tdrDeviations || []).find(x => x.id === deviation);
  if (!d) throw new Error(`resolveTdrDeviation: unknown deviation "${deviation}"`);
  if (d.status !== 'OPEN') throw new Error(`resolveTdrDeviation: deviation ${deviation} already ${d.status}`);
  d.status = approved ? 'SPONSOR_APPROVED' : 'SPONSOR_REJECTED';
  d.resolvedAt = timestamp;
  if (approved) {
    const t = (state.tdrs || []).find(x => x.id === d.tdr);
    if (t) { t.status = 'SUPERSEDED'; t.supersededBy = deviation; }
  }
  state.audit.push({ event: 'TDR_DEVIATION_RESOLVED', deviation, tdr: d.tdr, approved: !!approved, timestamp });
  return state;
}

module.exports = { latestVerdict, recordGateVerdict, canAdvance, advance, isComplete, recordTdrDeviation, resolveTdrDeviation };
