/**
 * ROME lifecycle definition — the canonical phase sequence and gate ownership.
 *
 * Part of ROME-PROP-035 §3.5 (deterministic enforcement) / ROME-PLAN-035 Stage 2.
 *
 * This is DATA, not behavior. The orchestrator (an LLM) DRIVES; the guard
 * (guard.js) ENFORCES transitions against this definition. Optional phases
 * (P0.5 intake — PROP-036; P3.5 prototype — PROP-037) are part of one routing
 * model: a project's resolved routing may include or omit them, but the guard
 * treats every routed phase identically.
 *
 * Separation of duties (EP-5): a phase's `owner` (producer) is never its gate
 * `role` (approver). The guard rejects a verdict recorded by any role other
 * than the phase's designated gate role — this is what makes self-approval
 * structurally impossible.
 */

const STATUS = Object.freeze({
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  GATE: 'GATE',
  BLOCKED: 'BLOCKED',
  COMPLETE: 'COMPLETE',
});

const VERDICT = Object.freeze({ APPROVE: 'APPROVE', BLOCK: 'BLOCK' });

// Canonical phase catalog. `gate: null` means no transition gate (e.g. P0).
//
// `requires` = mechanical facts the guard demands (as recorded verification
// evidence in state.verification[phase]) BEFORE a gated advance — not just the
// gate role's verdict (ROME-PROP-035 §3.5 hardening). Keys:
//   aordl        — AORDL STRICT validation passed (P1)
//   traceability — every in-scope requirement maps requirement→artifact(s);
//                  at P5, requirement→code AND →test (ALWAYS-ON, iterative safety)
//   secrets      — no-secrets-in-source scan clean
//   contracts    — inter-component contract drift = 0
//   executability— generated code installs/builds/tests pass
//   testAdequacy — MVP rule: each requirement's declared Outcomes + Errors are tested
const PHASES = Object.freeze([
  { id: 'P0',   name: 'bootstrap',    owner: 'bootstrap',            gate: null,                              optional: false, requires: [] },
  { id: 'P0.5', name: 'intake',       owner: 'surveyor',             gate: { id: 'GATE-P0.5', role: 'sarah' }, optional: true,  requires: [] },
  { id: 'P1',   name: 'requirements', owner: 'talib',                gate: { id: 'GATE-P1',   role: 'sarah' }, optional: false, requires: ['aordl', 'traceability'] },
  { id: 'P2',   name: 'analysis',     owner: 'talib',                gate: { id: 'GATE-P2',   role: 'sarah' }, optional: false, requires: ['traceability', 'sponsorOq'] },
  { id: 'P3',   name: 'design',       owner: 'pma',                  gate: { id: 'GATE-P3',   role: 'sarah' }, optional: false, requires: ['traceability', 'matrix'] },
  { id: 'P3.5', name: 'prototype',    owner: 'reena',                gate: { id: 'GATE-P3.5', role: 'sarah' }, optional: true,  requires: ['traceability', 'matrix'] },
  { id: 'P4',   name: 'config',       owner: 'lucien',               gate: { id: 'GATE-P4',   role: 'sarah' }, optional: false, requires: ['secrets', 'traceability'] },
  { id: 'P5',   name: 'generation',   owner: 'ashok|reena|charlie',  gate: { id: 'GATE-P5',   role: 'sarah' }, optional: false, requires: ['executability', 'testAdequacy', 'secrets', 'contracts', 'traceability', 'matrix'] },
]);

const PHASE_BY_ID = Object.freeze(
  PHASES.reduce((m, p) => { m[p.id] = p; return m; }, {})
);

/** Default greenfield routing (optional phases omitted). */
const DEFAULT_ROUTING = Object.freeze(['P0', 'P1', 'P2', 'P3', 'P4', 'P5']);

/** Resolve a routing array, validating every id exists and order is canonical. */
function resolveRouting(ids = DEFAULT_ROUTING) {
  const order = PHASES.map(p => p.id);
  for (const id of ids) {
    if (!PHASE_BY_ID[id]) throw new Error(`Unknown phase in routing: ${id}`);
  }
  // enforce canonical relative order (no reordering allowed)
  const idx = ids.map(id => order.indexOf(id));
  for (let i = 1; i < idx.length; i++) {
    if (idx[i] <= idx[i - 1]) {
      throw new Error(`Routing out of canonical order at ${ids[i]}`);
    }
  }
  return [...ids];
}

module.exports = { STATUS, VERDICT, PHASES, PHASE_BY_ID, DEFAULT_ROUTING, resolveRouting };
