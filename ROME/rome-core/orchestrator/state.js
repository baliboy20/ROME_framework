/**
 * state.json — the orchestrator's live project state (source of truth, D2).
 *
 * Part of ROME-PROP-035 §6a / ROME-PLAN-035 Stage 2. Pure persistence + factory;
 * all enforcement lives in guard.js. No external dependencies.
 *
 * Schema v2 (ROME-PROP-048, framework v3.0.0): the lifecycle is per-INCREMENT.
 * `increments[]` each carry their own routing/phases/gates/verification; the
 * project level carries what increments SHARE — traceability (edges tagged by
 * increment), audit, the stub ledger, and the stage plan (PROP-049). A project
 * has no terminal state (ROME-AX-21); `load()` migrates v1 single-lifecycle
 * states by wrapping them as increment 0 (see ROME-MIG-002).
 *
 * Module convention: lifecycle reads/writes go through `active(state)`.
 */

const fs = require('fs');
const path = require('path');
const { STATUS, resolveRouting } = require('./lifecycle');

const SCHEMA_VERSION = 2;

/** Build one increment's lifecycle record (per-increment state, PROP-048). */
function newIncrement({ id, intent = 'greenfield', stage = null, routing, timestamp, awaitingIntake = false, change = null }) {
  const routed = resolveRouting(routing);
  const phases = {};
  routed.forEach((pid, i) => {
    phases[pid] = { status: i === 0 ? STATUS.IN_PROGRESS : STATUS.PENDING };
  });
  return {
    id,
    intent,
    stage,              // PROP-049: the Stage this increment builds (null = unstaged)
    change,             // PROP-054: { id, ct } when this is a change-scoped run (CT-1/2/3/5), else null
    sealed: false,      // sealed increments are immutable (ROME-AX-19)
    createdAt: timestamp,
    awaitingIntake,     // PROP-047: routing provisional until Surveyor's ICR
    routing: routed,
    currentPhase: routed[0],
    phases,
    gateLedger: [],     // { gate, phase, verdict, role, dispatchId?, timestamp, note? }
    blockers: [],       // { id, phase, description, owner, status }
    dispatch: [],       // { agent, role, phase, status, spawnedBy, timestamp }
    budget: { tokens: 0, ceiling: null },
    oq: { resolvedByTalib: 0, awaitingSponsor: 0, deferrals: [] }, // PROP-041
    inputReliability: [], // [{ location, form, reliability, sponsorAuthorized? }] — PROP-047
    testManifest: [],   // [{ req, outcomesTested, errorsTested:[id] }] — D7
    verification: {},   // phase → { key: { pass, detail, timestamp } } — guard preconditions
    aib: {},            // PROP-051: phase → { revision, omitted?, sponsorAuthorized?, response? } — sponsor briefs (AX-27)
  };
}

/**
 * Create a fresh project state with increment 0.
 * @param {object} opts { project, frameworkVersion, routing?, intent?, stage?, awaitingIntake?, timestamp }
 */
function createState({ project, frameworkVersion = 'unknown', frameworkCommit = null, vendored = false, routing, intent, stage, awaitingIntake, timestamp } = {}) {
  if (!project) throw new Error('createState: project is required');
  if (!timestamp) throw new Error('createState: timestamp is required (no Date.now in lib)');
  return {
    schemaVersion: SCHEMA_VERSION,
    project,
    frameworkVersion,
    // provenance: exactly which framework built this project (vendored copy in .rome/)
    framework: { version: frameworkVersion, commit: frameworkCommit, vendored },
    createdAt: timestamp,
    updatedAt: timestamp,
    activeIncrement: 0,
    increments: [newIncrement({ id: 0, intent, stage, routing, timestamp, awaitingIntake })],
    // ── shared across increments (ROME-AX-20: one store, union coverage) ──
    traceability: {
      deltas: [],    // legacy flat list — retained for backward compat (PROP-042 transition)
      artifacts: {}, // canonicalId → { logicalName, kind, path, component }
      edges: [],     // { req, ..., increment, stale } — tagged with the producing increment
      byReq: {},     // derived — rebuilt on every edge write, never written directly
      byArtifact: {},
      matrix: {},
    },
    stagePlan: null,    // PROP-049: { stages:[{id, inputs, provides, presumes, dependsOn}], decisions:[] }
    stubs: [],          // PROP-049 stub ledger: { id, subsystem, contract?, stubbedIn, implementBy, sponsorDecision, status, timestamp }
    tdrs: [],           // PROP-052: validated TDRs from decisions.tdr.yaml (post carrier-reliability downgrade)
    tdrsEverPopulated: false, // PROP-056 (AX-36): empty-after-populated is a conformance failure, not a trivial pass
    tdrDeviations: [],  // PROP-052 §2.5: { id, tdr, phase?, scope?, reason, proposedAlternative, status:OPEN|SPONSOR_APPROVED|SPONSOR_REJECTED, timestamp }
    tdrDeviationSeq: 0, // PROP-056 (AX-36): monotonic — DEV ids survive register loss without reuse
    infraConstraints: null, // PROP-051: sponsor's existing infra/vendor constraints from intake (ICR passthrough)
    // PROP-055 (AX-34): the rule-set these artifacts were built under = the
    // framework version at last build/upgrade. Raised ONLY by rome-upgrade.
    conventionLevel: frameworkVersion,
    upgrade: null,      // PROP-055: { target, pending:[gapId] } while an upgrade has open gaps
    changeQueue: [],    // PROP-054 B.2: append-only triage queue — { id, description, source?, status, ct?, blastRadius?, timestamp }
    audit: [],          // append-only, project-wide
  };
}

// ── PROP-054: change queue (live triage) ─────────────────────────────────────
// Status flow: QUEUED → CLASSIFIED → CONFIRMED → IN_PROGRESS → DELIVERED
// (PARKED reachable from any pre-IN_PROGRESS status). Entries are never removed.

const CHANGE_STATUS = Object.freeze(['QUEUED', 'CLASSIFIED', 'CONFIRMED', 'IN_PROGRESS', 'DELIVERED', 'PARKED']);
// PROP-054 v1.4: sponsor-set ordering signal. Priority is the sponsor's call,
// never computed — the trace decides the path, the sponsor decides the order.
const CHANGE_PRIORITY = Object.freeze(['HIGH', 'NORMAL', 'LOW']);

/** Capture a sponsor observation — B.2 step 1: capture, don't chase. */
function queueChange(state, { description, source = 'sponsor', priority = 'NORMAL', timestamp }) {
  if (!timestamp) throw new Error('queueChange: timestamp required');
  if (!description) throw new Error('queueChange: description required');
  if (!CHANGE_PRIORITY.includes(priority)) throw new Error(`queueChange: priority must be one of ${CHANGE_PRIORITY.join('|')}`);
  state.changeQueue = state.changeQueue || [];
  const entry = { id: `CHG-${String(state.changeQueue.length + 1).padStart(3, '0')}`, description, source, status: 'QUEUED', priority, timestamp };
  state.changeQueue.push(entry);
  state.audit.push({ event: 'CHANGE_QUEUED', change: entry.id, timestamp });
  state.updatedAt = timestamp;
  return entry;
}

/** Record Roma's trace-verified classification — B.2 step 2 (ROME-AX-31). */
function classifyChange(state, changeId, { ct, blastRadius, timestamp }) {
  if (!timestamp) throw new Error('classifyChange: timestamp required');
  const entry = (state.changeQueue || []).find(c => c.id === changeId);
  if (!entry) throw new Error(`classifyChange: unknown change ${changeId}`);
  if (!blastRadius || blastRadius.verified !== true) {
    throw new Error(`Classification of ${changeId} lacks a trace-verified blast radius (ROME-AX-31): compute it via impact.js#blastRadius first.`);
  }
  entry.ct = ct;
  entry.blastRadius = blastRadius;
  entry.status = 'CLASSIFIED';
  state.audit.push({ event: 'CHANGE_CLASSIFIED', change: changeId, ct, timestamp });
  state.updatedAt = timestamp;
  return entry;
}

/** Sponsor's confirmation (or parking) of a classified change — B.2 step 3. */
function confirmChange(state, changeId, { park = false, timestamp }) {
  if (!timestamp) throw new Error('confirmChange: timestamp required');
  const entry = (state.changeQueue || []).find(c => c.id === changeId);
  if (!entry) throw new Error(`confirmChange: unknown change ${changeId}`);
  if (entry.status !== 'CLASSIFIED' && !(park && entry.status === 'QUEUED')) {
    throw new Error(`confirmChange: ${changeId} is ${entry.status}; confirm requires CLASSIFIED`);
  }
  entry.status = park ? 'PARKED' : 'CONFIRMED';
  state.audit.push({ event: park ? 'CHANGE_PARKED' : 'CHANGE_CONFIRMED', change: changeId, timestamp });
  state.updatedAt = timestamp;
  return entry;
}

/**
 * Record the sponsor's flows decision for the active increment
 * (ROME-PROP-057 / ROME-AX-38, the AX-27 omission pattern): a project with
 * no business journeys records that as an explicit sponsor decision — never
 * a default. Confirmation of authored flows lives IN the FLOW artifacts
 * (Status/Confirmation), not here.
 */
function recordFlowsOmission(state, { sponsorAuthorized, reason, timestamp }) {
  if (!timestamp) throw new Error('recordFlowsOmission: timestamp required');
  if (sponsorAuthorized !== true) throw new Error('recordFlowsOmission: only the sponsor omits journeys (sponsorAuthorized: true required — ROME-AX-38)');
  const inc = active(state);
  if (inc.sealed) throw new Error(`Increment ${inc.id} is sealed (ROME-AX-19)`);
  inc.flows = { omitted: true, sponsorAuthorized: true, reason: reason || null, timestamp };
  state.audit.push({ event: 'FLOWS_OMITTED', increment: inc.id, reason: reason || null, timestamp });
  state.updatedAt = timestamp;
  return state;
}

/**
 * Sponsor re-ranks a queue entry (PROP-054 v1.4). Any status before DELIVERED;
 * priority is an ordering signal only — it never routes, classifies, or
 * bypasses confirmation.
 */
function prioritizeChange(state, changeId, { priority, timestamp }) {
  if (!timestamp) throw new Error('prioritizeChange: timestamp required');
  if (!CHANGE_PRIORITY.includes(priority)) throw new Error(`prioritizeChange: priority must be one of ${CHANGE_PRIORITY.join('|')}`);
  const entry = (state.changeQueue || []).find(c => c.id === changeId);
  if (!entry) throw new Error(`prioritizeChange: unknown change ${changeId}`);
  if (entry.status === 'DELIVERED') throw new Error(`prioritizeChange: ${changeId} is DELIVERED — nothing left to order`);
  entry.priority = priority;
  state.audit.push({ event: 'CHANGE_PRIORITIZED', change: changeId, priority, timestamp });
  state.updatedAt = timestamp;
  return entry;
}

/**
 * Sponsor pulls a stashed entry back into play (PROP-054 v1.4). PARKED →
 * CLASSIFIED if it was classified before parking (classification is kept —
 * the trace verdict doesn't expire), else back to QUEUED.
 */
function reopenChange(state, changeId, { timestamp }) {
  if (!timestamp) throw new Error('reopenChange: timestamp required');
  const entry = (state.changeQueue || []).find(c => c.id === changeId);
  if (!entry) throw new Error(`reopenChange: unknown change ${changeId}`);
  if (entry.status !== 'PARKED') throw new Error(`reopenChange: ${changeId} is ${entry.status}, not PARKED`);
  entry.status = entry.ct ? 'CLASSIFIED' : 'QUEUED';
  state.audit.push({ event: 'CHANGE_REOPENED', change: changeId, status: entry.status, timestamp });
  state.updatedAt = timestamp;
  return entry;
}

/**
 * Begin the change-scoped run for a confirmed change — B.2 step 4. Reuses the
 * increment container (tagged `change: {id, ct}`) so ALL guard machinery
 * (gates, evidence, sealing — ROME-AX-32) applies unchanged. CT-4 never comes
 * here: it routes to beginIncrement via rome-increment (PROP-054 A.1).
 */
function beginChange(state, changeId, { routing, timestamp }) {
  if (!timestamp) throw new Error('beginChange: timestamp required');
  const entry = (state.changeQueue || []).find(c => c.id === changeId);
  if (!entry) throw new Error(`beginChange: unknown change ${changeId}`);
  if (entry.status !== 'CONFIRMED') throw new Error(`beginChange: ${changeId} is ${entry.status}; sponsor confirmation required (ROME-AX-31)`);
  if (entry.ct === 'CT-4') throw new Error('CT-4 (new capability) is an increment, not a change record (PROP-054 A.1) — use rome-increment.cjs');
  const prior = active(state);
  if (!prior.sealed) throw new Error(`Increment ${prior.id} is not sealed; a change runs only against delivered scope`);
  const inc = newIncrement({ id: state.increments.length, intent: 'change', routing, timestamp, awaitingIntake: false, change: { id: changeId, ct: entry.ct } });
  state.increments.push(inc);
  state.activeIncrement = inc.id;
  entry.status = 'IN_PROGRESS';
  state.audit.push({ event: 'CHANGE_BEGUN', change: changeId, ct: entry.ct, increment: inc.id, routing: inc.routing, timestamp });
  state.updatedAt = timestamp;
  return state;
}

/**
 * Finalize intake (PROP-047/051/052): apply a Surveyor-produced routing result
 * (the return of routing.js#routeFromICR) to state. This is the missing link
 * between the ICR and state — it replaces the provisional routing, clears
 * awaitingIntake, and persists TDRs / infra constraints / checkpoint-omission
 * records. TDRs must already be schema-validated and carrier-downgraded
 * (intake.js#validateTdrs + #applyCarrierReliability) by the caller.
 */
function finalizeIntake(state, routed, timestamp) {
  if (!timestamp) throw new Error('finalizeIntake: timestamp required');
  if (!routed || !Array.isArray(routed.routing)) throw new Error('finalizeIntake: routed.routing required (pass routeFromICR\'s return)');
  const inc = active(state);
  if (inc.sealed) throw new Error(`Increment ${inc.id} is sealed (ROME-AX-19)`);
  const routing = resolveRouting(routed.routing);
  const done = Object.fromEntries(Object.entries(inc.phases).filter(([, p]) => p.status === STATUS.COMPLETE));
  inc.routing = routing;
  inc.phases = {};
  routing.forEach(pid => { inc.phases[pid] = done[pid] || { status: STATUS.PENDING }; });
  if (!inc.currentPhase || !routing.includes(inc.currentPhase)) inc.currentPhase = routing.find(pid => inc.phases[pid].status !== STATUS.COMPLETE) || null;
  if (inc.currentPhase) inc.phases[inc.currentPhase].status = STATUS.IN_PROGRESS;
  inc.awaitingIntake = false;
  // PROP-056 (AX-36): the register never shrinks silently. Key absent →
  // unchanged; a shrinking replacement is refused unless clearTdrs:true, and
  // any accepted reduction audits the lost ids.
  if (Array.isArray(routed.tdrs)) {
    const before = state.tdrs || [];
    const afterIds = new Set(routed.tdrs.map(t => t.id));
    const lostIds = before.map(t => t.id).filter(id => !afterIds.has(id));
    if (lostIds.length && routed.clearTdrs !== true) {
      throw new Error(`finalizeIntake: intake would drop TDRs from the register (${before.length} → ${routed.tdrs.length}; lost: ${lostIds.join(', ')}). An intake that carries no TDRs must omit the key; pass clearTdrs:true to remove decisions deliberately (ROME-AX-36).`);
    }
    if (lostIds.length) {
      state.audit.push({ event: 'TDR_REGISTER_REDUCED', before: before.length, after: routed.tdrs.length, lostIds, clearTdrs: true, timestamp });
    }
    state.tdrs = routed.tdrs;
  }
  if ((state.tdrs || []).length) state.tdrsEverPopulated = true;
  if (routed.infraConstraints !== undefined) state.infraConstraints = routed.infraConstraints;
  if (routed.sponsorCheckpointOmitted) {
    // Sponsor-authorized omission (AX-27): record it so checkSponsorAib passes.
    inc.aib = inc.aib || {};
    for (const phase of ['P3', 'P4']) inc.aib[phase] = { omitted: true, sponsorAuthorized: true };
  }
  state.audit.push({ event: 'INTAKE_FINALIZED', increment: inc.id, routing, tdrs: (routed.tdrs || []).length, timestamp });
  state.updatedAt = timestamp;
  return state;
}

/**
 * Record/refresh an AIB (PROP-051 / ROME-AX-27). Issuing a new revision clears
 * any prior response — a sponsor answer never carries over to a changed brief.
 */
function recordAib(state, phase, revision, timestamp) {
  if (!timestamp) throw new Error('recordAib: timestamp required');
  if (!revision) throw new Error('recordAib: revision required');
  const inc = active(state);
  if (inc.sealed) throw new Error(`Increment ${inc.id} is sealed (ROME-AX-19)`);
  inc.aib = inc.aib || {};
  inc.aib[phase] = { revision, timestamp };
  state.audit.push({ event: 'AIB_ISSUED', phase, revision, timestamp });
  return state;
}

/** Record the sponsor's response to the current AIB revision (ROME-AX-27). */
function recordAibResponse(state, phase, { type, revision, timestamp }) {
  if (!timestamp) throw new Error('recordAibResponse: timestamp required');
  if (!['CONFIRM', 'REDIRECT', 'DELEGATE'].includes(type)) throw new Error(`recordAibResponse: type must be CONFIRM|REDIRECT|DELEGATE (got "${type}")`);
  const inc = active(state);
  const aib = (inc.aib || {})[phase];
  if (!aib) throw new Error(`recordAibResponse: no AIB issued for ${phase} — recordAib first`);
  if (revision !== aib.revision) throw new Error(`recordAibResponse: response cites revision "${revision}" but current AIB-${phase} is "${aib.revision}" (stale — reissue or reconfirm)`);
  aib.response = { type, revision, timestamp };
  state.audit.push({ event: 'AIB_RESPONSE', phase, type, revision, timestamp });
  return state;
}

/** The active increment — where all lifecycle reads/writes go. */
function active(state) {
  const inc = (state.increments || [])[state.activeIncrement];
  if (!inc) throw new Error(`No active increment (activeIncrement=${state.activeIncrement})`);
  return inc;
}

/**
 * Seal the active increment (ROME-AX-19: append-only preservation — nothing is
 * deleted; the record simply becomes immutable). Requires the increment complete.
 */
function sealActive(state, timestamp) {
  const inc = active(state);
  if (!timestamp) throw new Error('sealActive: timestamp required');
  if (inc.currentPhase !== null) throw new Error(`Cannot seal increment ${inc.id}: lifecycle incomplete (at ${inc.currentPhase})`);
  inc.sealed = true;
  state.audit.push({ event: 'INCREMENT_SEALED', increment: inc.id, timestamp });
  // PROP-054: sealing a change-scoped run delivers its queue entry
  if (inc.change) {
    const entry = (state.changeQueue || []).find(c => c.id === inc.change.id);
    if (entry) { entry.status = 'DELIVERED'; state.audit.push({ event: 'CHANGE_DELIVERED', change: entry.id, increment: inc.id, timestamp }); }
  }
  state.updatedAt = timestamp;
  return state;
}

/**
 * Begin a new increment on an existing project (ROME-AX-21: a Project has no
 * terminal state). The prior active increment must be sealed first. Appends —
 * never overwrites (ROME-AX-19).
 */
function beginIncrement(state, { intent, stage = null, routing, timestamp, awaitingIntake = true } = {}) {
  if (!timestamp) throw new Error('beginIncrement: timestamp required');
  const prior = active(state);
  if (!prior.sealed) throw new Error(`Increment ${prior.id} is not sealed; seal it before beginning the next`);
  const inc = newIncrement({ id: state.increments.length, intent, stage, routing, timestamp, awaitingIntake });
  state.increments.push(inc);
  state.activeIncrement = inc.id;
  state.audit.push({ event: 'INCREMENT_BEGUN', increment: inc.id, stage, intent: inc.intent, timestamp });
  state.updatedAt = timestamp;
  return state;
}

/** Wrap a v1 single-lifecycle state as increment 0 (ROME-MIG-002). Pure. */
function migrateV1(v1) {
  const lifecycle = {
    id: 0,
    intent: v1.intent || 'greenfield',
    stage: null,
    sealed: false,
    createdAt: v1.createdAt,
    awaitingIntake: !!v1.awaitingIntake,
    routing: v1.routing,
    currentPhase: v1.currentPhase,
    phases: v1.phases,
    gateLedger: v1.gateLedger || [],
    blockers: v1.blockers || [],
    dispatch: v1.dispatch || [],
    budget: v1.budget || { tokens: 0, ceiling: null },
    oq: v1.oq || { resolvedByTalib: 0, awaitingSponsor: 0, deferrals: [] },
    inputReliability: v1.inputReliability || [],
    testManifest: v1.testManifest || [],
    verification: v1.verification || {},
    aib: {},
  };
  // edges from a v1 state all belong to increment 0
  const traceability = v1.traceability || { deltas: [], artifacts: {}, edges: [], byReq: {}, byArtifact: {}, matrix: {} };
  for (const e of traceability.edges || []) { if (e.increment === undefined) e.increment = 0; }
  return {
    schemaVersion: SCHEMA_VERSION,
    project: v1.project,
    frameworkVersion: v1.frameworkVersion,
    framework: v1.framework || { version: v1.frameworkVersion, commit: null, vendored: false },
    createdAt: v1.createdAt,
    updatedAt: v1.updatedAt,
    activeIncrement: 0,
    increments: [lifecycle],
    traceability,
    stagePlan: null,
    stubs: [],
    tdrs: [],
    tdrsEverPopulated: false,
    tdrDeviations: [],
    tdrDeviationSeq: 0,
    infraConstraints: null,
    conventionLevel: (v1.framework && v1.framework.version) || v1.frameworkVersion || 'unknown',
    upgrade: null,
    changeQueue: [],
    audit: v1.audit || [],
  };
}

function load(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const state = JSON.parse(raw);
  if (state.schemaVersion === 1) return migrateV1(state); // ROME-MIG-002: auto-migrate on load
  if (state.schemaVersion !== SCHEMA_VERSION) {
    throw new Error(`state.json schema ${state.schemaVersion} != expected ${SCHEMA_VERSION}`);
  }
  // PROP-054/055 additive fields: default on older v2 states (AX-34 — an
  // undeclared conventionLevel is the version that built the project).
  if (state.conventionLevel === undefined) state.conventionLevel = (state.framework && state.framework.version) || state.frameworkVersion || 'unknown';
  if (state.upgrade === undefined) state.upgrade = null;
  if (!Array.isArray(state.changeQueue)) state.changeQueue = [];
  for (const c of state.changeQueue) { if (c.priority === undefined) c.priority = 'NORMAL'; }
  // PROP-056 additive fields (AX-36): derive from history so legacy states
  // never re-mint DEV ids or mistake an emptied register for a virgin one.
  if (state.tdrsEverPopulated === undefined) {
    state.tdrsEverPopulated = (state.tdrs || []).length > 0 ||
      (state.audit || []).some(a => a.event === 'INTAKE_FINALIZED' && a.tdrs > 0);
  }
  if (state.tdrDeviationSeq === undefined) {
    state.tdrDeviationSeq = (state.tdrDeviations || []).reduce((max, d) => {
      const n = parseInt(String(d.id).replace(/^DEV-/, ''), 10);
      return Number.isFinite(n) && n > max ? n : max;
    }, 0);
  }
  return state;
}

function save(file, state, timestamp) {
  if (timestamp) state.updatedAt = timestamp;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(state, null, 2) + '\n');
  return file;
}

module.exports = { SCHEMA_VERSION, CHANGE_STATUS, CHANGE_PRIORITY, createState, newIncrement, active, sealActive, beginIncrement, finalizeIntake, recordAib, recordAibResponse, recordFlowsOmission, queueChange, classifyChange, confirmChange, prioritizeChange, reopenChange, beginChange, migrateV1, load, save };
