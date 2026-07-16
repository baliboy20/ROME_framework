/**
 * Axiom checks — promotes ROME-ONT-001's ASSERTED tier (AX-12..16) to CHECKED
 * (ROME-PROP-044 Part B). Pure functions over a state object (see state.js).
 * No I/O, no deps. Each returns { axiom, pass, violations: [...] }.
 *
 * These are CHECKED, not ENFORCED: they detect a violation after the fact. The
 * guard does not refuse advance on their basis (AX-16 target = CHECKED, per the
 * sponsor OQ-1 resolution). Wire into verification.js#recordVerification to
 * surface them as recordable facts.
 *
 * Scope note per axiom is deliberate — each check states exactly what it proves
 * over existing state, no more. Provenance in ontology.md must match.
 */

const { PHASE_BY_ID } = require('./lifecycle');

const ORCHESTRATOR_ROLE = 'roma';
const UPSTREAM_OF_P5 = ['P0', 'P0.5', 'P1', 'P2', 'P3', 'P3.5', 'P4'];

/** AX-12 — every Instance (agent) fills exactly one Role for its lifetime. */
function checkOneRolePerInstance(state) {
  const rolesByAgent = {};
  for (const d of state.dispatch || []) {
    (rolesByAgent[d.agent] = rolesByAgent[d.agent] || new Set()).add(d.role);
  }
  const violations = Object.entries(rolesByAgent)
    .filter(([, roles]) => roles.size > 1)
    .map(([agent, roles]) => `agent "${agent}" filled multiple roles: ${[...roles].join(', ')}`);
  return { axiom: 'AX-12', pass: violations.length === 0, violations };
}

/**
 * AX-13 — separation of duties at ROLE level (sponsor OQ-2 resolution).
 * A producing Role (author of a traceability edge) must not also hold gate
 * authority in the same phase. Matches AX-03's gate-authority rule, extended to
 * the whole phase rather than a single verdict.
 */
function checkSeparationOfDuties(state) {
  const producersByPhase = {};
  for (const e of state.traceability?.edges || []) {
    if (!e.role || !e.phase) continue;
    (producersByPhase[e.phase] = producersByPhase[e.phase] || new Set()).add(e.role);
  }
  const violations = [];
  for (const v of state.gateLedger || []) {
    const producers = producersByPhase[v.phase];
    if (producers && producers.has(v.role)) {
      violations.push(`role "${v.role}" both produced an artifact and held gate authority in ${v.phase}`);
    }
  }
  return { axiom: 'AX-13', pass: violations.length === 0, violations };
}

/**
 * AX-14 — every Instance is spawned by the Orchestrator; no peer-spawn.
 * `recordDispatch` stamps `spawnedBy`; a dispatch spawned by anyone other than
 * the orchestrator role is a violation.
 */
function checkOrchestratorSpawns(state) {
  const violations = (state.dispatch || [])
    .filter(d => (d.spawnedBy || ORCHESTRATOR_ROLE) !== ORCHESTRATOR_ROLE)
    .map(d => `agent "${d.agent}" (${d.role}) was spawned by "${d.spawnedBy}", not the orchestrator`);
  return { axiom: 'AX-14', pass: violations.length === 0, violations };
}

/**
 * AX-15 — P5 introduces no requirement absent upstream.
 * Every requirement satisfied by a P5 `implements` edge must also appear on an
 * edge from an upstream phase (P0..P4). A requirement first seen at P5 is a
 * fresh introduction — the drift this axiom forbids. (The contract-drift portion
 * is separately ENFORCED at GATE-P5 via AX-08 `contracts`; this covers the
 * whole requirement set.)
 */
function checkP5NoNewRequirements(state) {
  const edges = state.traceability?.edges || [];
  const upstreamReqs = new Set(
    edges.filter(e => UPSTREAM_OF_P5.includes(e.phase)).map(e => e.req)
  );
  const violations = [];
  const seen = new Set();
  for (const e of edges) {
    if (e.phase !== 'P5' || e.satisfiesHow !== 'implements') continue;
    if (!upstreamReqs.has(e.req) && !seen.has(e.req)) {
      seen.add(e.req);
      violations.push(`requirement "${e.req}" first appears at P5 (no upstream edge) — introduced during generation`);
    }
  }
  return { axiom: 'AX-15', pass: violations.length === 0, violations };
}

/**
 * AX-16 — no silent recovery (EP-4).
 * Observable consequence over existing state: a COMPLETE phase must not carry a
 * blocker in a non-terminal state (OPEN/ESCALATED), and every blocker must be in
 * a recorded lifecycle state. A blocker that vanished without RESOLVED/ESCALATED,
 * or a phase completed over a live blocker, is silent recovery.
 * Scope: covers blocker lifecycle. Retry/escalation audit-event coverage is a
 * later extension (see PROP-044 Part B, AX-16 row) and is NOT asserted here.
 */
const VALID_BLOCKER_STATES = new Set(['OPEN', 'ESCALATED', 'RESOLVED']);
function checkNoSilentRecovery(state) {
  const violations = [];
  for (const b of state.blockers || []) {
    if (!VALID_BLOCKER_STATES.has(b.status)) {
      violations.push(`blocker "${b.id}" has unrecorded status "${b.status}"`);
      continue;
    }
    const phase = state.phases?.[b.phase];
    if (phase && phase.status === 'COMPLETE' && b.status !== 'RESOLVED') {
      violations.push(`phase ${b.phase} COMPLETE with non-resolved blocker "${b.id}" (${b.status}) — silent recovery`);
    }
  }
  return { axiom: 'AX-16', pass: violations.length === 0, violations };
}

/** Run all CHECKED axioms. Returns { pass, results: [...] }. */
const CHECKS = [
  checkOneRolePerInstance,
  checkSeparationOfDuties,
  checkOrchestratorSpawns,
  checkP5NoNewRequirements,
  checkNoSilentRecovery,
];
function checkAll(state) {
  const results = CHECKS.map(fn => fn(state));
  return { pass: results.every(r => r.pass), results };
}

module.exports = {
  checkOneRolePerInstance,
  checkSeparationOfDuties,
  checkOrchestratorSpawns,
  checkP5NoNewRequirements,
  checkNoSilentRecovery,
  checkAll,
  ORCHESTRATOR_ROLE,
};
