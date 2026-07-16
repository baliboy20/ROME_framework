/**
 * Verification evidence (ROME-PROP-035 §3.5 hardening).
 *
 * Mechanical gate criteria are recorded here as FACTS the guard demands before a
 * gated advance — closing the hole where an LLM gate role could APPROVE without
 * the checks having run. The guard reads state.verification[phase][key].pass.
 *
 * Two checks are computed here from state (not trusted from an agent):
 *  - traceability: ALWAYS enforced (iterative-dev safety). Every in-scope
 *    requirement maps requirement→artifact; at P5 also requirement→code AND →test.
 *  - testAdequacy: MVP rule — each requirement's declared Outcomes + Errors are
 *    tested (reported per-requirement by the producer, verified against AORDL).
 * Others (executability/secrets/contracts/aordl) are recorded from their modules.
 * Pure, no deps.
 */

const { CODE_SATISFIES } = require('./lifecycle');
const { active } = require('./state');

/** Record a mechanical fact for a phase. Mutates + returns state. */
function recordVerification(state, phase, key, pass, detail, timestamp) {
  if (!timestamp) throw new Error('recordVerification: timestamp required');
  const inc = active(state);
  inc.verification[phase] = inc.verification[phase] || {};
  inc.verification[phase][key] = { pass: !!pass, detail: detail || null, timestamp };
  state.audit.push({ event: 'VERIFY', phase, key, pass: !!pass, timestamp });
  return state;
}

/**
 * Traceability completeness for a set of in-scope requirements.
 * @param requirements [REQ-###] expected for the project (in scope)
 * @param opts { requireTest:boolean } — P5 also requires implements + validates edges
 *
 * PROP-042: uses edge store when populated (satisfiesHow: implements / validates).
 * Falls back to legacy delta heuristics when no edges exist.
 *
 * Returns { pass, missing:[{requirement, missing:['code'|'test'|'any']}] }
 */
function checkTraceability(state, requirements = [], { requireTest = false } = {}) {
  const edges = state.traceability.edges || [];
  const missing = [];

  if (edges.length > 0) {
    // PROP-042 path: use typed edges
    for (const req of requirements) {
      const active = edges.filter(e => e.req === req && !e.stale);
      if (!active.length) { missing.push({ requirement: req, missing: ['any'] }); continue; }
      if (requireTest) {
        const hasImpl = active.some(e => CODE_SATISFIES.includes(e.satisfiesHow));
        const hasTest = active.some(e => e.satisfiesHow === 'validates');
        const gap = [];
        if (!hasImpl) gap.push('code');
        if (!hasTest) gap.push('test');
        if (gap.length) missing.push({ requirement: req, missing: gap });
      }
    }
  } else {
    // Legacy path: heuristic file-extension / name matching on deltas
    const deltas = state.traceability.deltas || [];
    for (const req of requirements) {
      const ds = deltas.filter(d => d.requirement === req);
      if (ds.length === 0) { missing.push({ requirement: req, missing: ['any'] }); continue; }
      if (requireTest) {
        const hasCode = ds.some(d => /\.(js|ts|tsx|dart|py|go|rb|java|cs)$/.test(d.produces) || d.kind === 'code' || /code/i.test(d.produces));
        const hasTest = ds.some(d => /test|spec/i.test(d.produces));
        const gap = [];
        if (!hasCode) gap.push('code');
        if (!hasTest) gap.push('test');
        if (gap.length) missing.push({ requirement: req, missing: gap });
      }
    }
  }

  return { pass: missing.length === 0, missing };
}

/**
 * MVP test adequacy. The producer reports, per requirement, which declared
 * Outcomes/Errors it tested; this verifies that against the AORDL declaration.
 * @param testManifest [{ req, outcomesTested:bool, errorsTested:[id] }]
 *   Canonical key is `req` (matches traceabilityEdges); `requirement` accepted as
 *   a legacy alias (fob-admin defect D7 — the two used to disagree, so every entry
 *   keyed `undefined` and all requirements falsely reported "no tests").
 * @param aordl        [{ ID, Outcomes:[], Errors:[{error,...}] }]
 * Returns { pass, gaps:[{requirement, reason}] }
 */
function checkTestAdequacy(testManifest = [], aordl = []) {
  const byId = Object.fromEntries(aordl.map(r => [r.ID || r.id, r]));
  const manifestById = Object.fromEntries(testManifest.map(m => [m.req || m.requirement, m]));
  const gaps = [];
  for (const req of Object.keys(byId)) {
    const m = manifestById[req];
    if (!m) { gaps.push({ requirement: req, reason: 'no tests reported' }); continue; }
    if ((byId[req].Outcomes || []).length && !m.outcomesTested) {
      gaps.push({ requirement: req, reason: 'happy-path outcome(s) not tested' });
    }
    const declaredErrors = (byId[req].Errors || []).length;
    const testedErrors = (m.errorsTested || []).length;
    if (declaredErrors > 0 && testedErrors < declaredErrors) {
      gaps.push({ requirement: req, reason: `${testedErrors}/${declaredErrors} declared error conditions tested` });
    }
  }
  return { pass: gaps.length === 0, gaps };
}

/**
 * Build the link-level traceability matrix from the edge store (PROP-041 A2).
 * Projects edges with a `location` field into per-requirement buckets:
 *   design  — satisfiesHow: 'documents'  (section anchor, P3-stage evidence)
 *   code    — satisfiesHow: 'implements' | 'enforces'  (line-level, P5)
 *   tests   — satisfiesHow: 'validates'  (line-level, P5)
 *
 * Returns { REQ-ID: { design:[loc], code:[loc], tests:[loc], status } }
 * where status = 'linked' | 'partial' | 'unlinked'.
 *
 * Does not mutate state. The orchestrator stores the result in
 * state.traceability.matrix and calls recordVerification with checkMatrix result.
 */
function buildMatrix(state, requirements = []) {
  const edges = state.traceability.edges || [];
  const matrix = {};
  for (const req of requirements) {
    const active = edges.filter(e => e.req === req && !e.stale && e.location);
    const design = active.filter(e => e.satisfiesHow === 'documents').map(e => e.location);
    const code   = active.filter(e => CODE_SATISFIES.includes(e.satisfiesHow)).map(e => e.location);
    const tests  = active.filter(e => e.satisfiesHow === 'validates').map(e => e.location);
    const hasCode = code.length > 0;
    const hasTest = tests.length > 0;
    const status = (hasCode && hasTest) ? 'linked' : (hasCode || hasTest || design.length > 0) ? 'partial' : 'unlinked';
    matrix[req] = { design, code, tests, status };
  }
  return matrix;
}

/**
 * Check matrix completeness for a phase (PROP-041 A3).
 *
 * P3 (design): WARN-only — always pass:true. Warns on requirements lacking a
 *   design-stage link (no `documents` anchor). A requirement that already has a
 *   design anchor is covered for design purposes even before code/tests exist,
 *   so it is NOT warned at P3.
 * P5 (generation): STRICT — pass:false if any req is unlinked or partial
 *   (missing code or test location links).
 *
 * Returns { pass, warnings:[REQ-ID], failures:[REQ-ID], detail }
 */
function checkMatrix(state, requirements = [], { phase = 'P5' } = {}) {
  const matrix = buildMatrix(state, requirements);

  if (phase === 'P3' || phase === 'P3.5') {
    // Design-stage concern: which requirements have no design link yet?
    const noDesign = requirements.filter(r => matrix[r] && matrix[r].design.length === 0);
    return {
      pass: true,
      warnings: noDesign,
      failures: [],
      detail: noDesign.length
        ? `WARN: ${noDesign.length} req(s) have no design-stage link yet: ${noDesign.join(', ')}`
        : 'all reqs have a design link',
    };
  }

  // P5: STRICT — both unlinked (nothing) and partial (code xor test) fail.
  const unlinked = requirements.filter(r => matrix[r] && matrix[r].status === 'unlinked');
  const partial  = requirements.filter(r => matrix[r] && matrix[r].status === 'partial');
  const failures = [...unlinked, ...partial];
  return {
    pass: failures.length === 0,
    warnings: [],
    failures,
    detail: failures.length
      ? `${failures.length} req(s) missing code or test location links: ${failures.join(', ')}`
      : 'all reqs linked to code and tests',
  };
}

/**
 * Check sponsor-OQ gate (PROP-041 B3).
 * GATE-P2 requires all sponsor-owned OQs either answered (awaitingSponsor === 0)
 * or explicitly deferred WITH sponsor authorization. An unauthorized deferral is
 * an invalid escape hatch and blocks the gate even when the count is zeroed.
 * Returns { pass, awaitingSponsor, resolvedByTalib, unauthorizedDeferrals, detail }
 */
function checkSponsorOq(state) {
  const oq = active(state).oq || { resolvedByTalib: 0, awaitingSponsor: 0, deferrals: [] };
  const deferrals = oq.deferrals || [];

  // PROP-041 B3: a deferral is valid ONLY with explicit sponsor authorization
  // (sponsorAuthorized === true). An unauthorized provisional deferral is a
  // silent escape hatch — it BLOCKS the gate even when Talib has zeroed
  // awaitingSponsor. A resolved deferral (sponsor later answered) no longer gates.
  const unauthorized = deferrals.filter(d => !d.resolved && d.provisional && d.sponsorAuthorized !== true);
  const authorized = deferrals.filter(d => d.sponsorAuthorized === true);

  const pass = oq.awaitingSponsor === 0 && unauthorized.length === 0;
  let detail;
  if (pass) {
    detail = `all sponsor OQs answered or authorized-deferred (${oq.resolvedByTalib} resolved by Talib, ${authorized.length} sponsor-authorized deferral(s))`;
  } else if (oq.awaitingSponsor > 0) {
    detail = `${oq.awaitingSponsor} sponsor-owned OQ(s) unanswered — GATE-P2 blocked until sponsor responds`;
  } else {
    detail = `${unauthorized.length} deferral(s) lack explicit sponsor authorization (sponsorAuthorized:true) — invalid per PROP-041 B3`;
  }

  return {
    pass,
    awaitingSponsor: oq.awaitingSponsor,
    resolvedByTalib: oq.resolvedByTalib,
    unauthorizedDeferrals: unauthorized.length,
    detail,
  };
}


/**
 * Stage dependency-consistency (ROME-PROP-049 / ROME-AX-22, STRICT at P2).
 * A requirement may depend only on requirements in the SAME or an EARLIER stage.
 * At intake this is WARN-only (judgement); here at P2 the requirement graph is
 * mechanical, so it is a recorded P2 fact (`stageConsistency` in PHASES.requires).
 *
 * Unstaged projects (no stagePlan) pass trivially.
 * @param requirements [{ id, stage, dependsOn:[reqId] }] — stage per requirement
 * Returns { pass, violations:[{requirement, dependsOn, reqStage, depStage}], detail }
 */
function checkStageConsistency(state, requirements = []) {
  if (!state.stagePlan) return { pass: true, violations: [], detail: 'unstaged project — trivially consistent' };
  const stageOf = Object.fromEntries(requirements.map(r => [r.id, r.stage]));
  const violations = [];
  for (const r of requirements) {
    for (const dep of r.dependsOn || []) {
      const rs = r.stage, ds = stageOf[dep];
      if (rs != null && ds != null && ds > rs) {
        violations.push({ requirement: r.id, dependsOn: dep, reqStage: rs, depStage: ds });
      }
    }
  }
  return {
    pass: violations.length === 0,
    violations,
    detail: violations.length
      ? `${violations.length} forward stage dependency(ies): ${violations.map(v => `${v.requirement}(s${v.reqStage})→${v.dependsOn}(s${v.depStage})`).join(', ')} (ROME-AX-22)`
      : 'no forward stage dependencies',
  };
}

/**
 * Stub ledger status (ROME-PROP-049 / ROME-AX-24). Reports ACTIVE stubs due by
 * the given increment. The guard enforces expiry at the P5 delivery edge; this
 * gives the orchestrator/CLI the same fact for reporting.
 * Returns { pass, expired:[stub], active:[stub] }
 */
function checkStubs(state, incrementId) {
  const stubs = state.stubs || [];
  const activeStubs = stubs.filter(st => st.status === 'ACTIVE');
  const expired = activeStubs.filter(st => st.implementBy <= incrementId);
  return { pass: expired.length === 0, expired, active: activeStubs };
}

module.exports = { recordVerification, checkTraceability, checkTestAdequacy, buildMatrix, checkMatrix, checkSponsorOq, checkStageConsistency, checkStubs };
