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

/** Record a mechanical fact for a phase. Mutates + returns state. */
function recordVerification(state, phase, key, pass, detail, timestamp) {
  if (!timestamp) throw new Error('recordVerification: timestamp required');
  state.verification[phase] = state.verification[phase] || {};
  state.verification[phase][key] = { pass: !!pass, detail: detail || null, timestamp };
  state.audit.push({ event: 'VERIFY', phase, key, pass: !!pass, timestamp });
  return state;
}

/**
 * Traceability completeness for a set of in-scope requirements.
 * @param requirements [REQ-###] expected for the project (in scope)
 * @param opts { requireTest:boolean } — P5 also requires a test artifact per req
 * Returns { pass, missing:[{requirement, missing:['code'|'test'|'any']}] }
 */
function checkTraceability(state, requirements = [], { requireTest = false } = {}) {
  const deltas = state.traceability.deltas;
  const missing = [];
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
  return { pass: missing.length === 0, missing };
}

/**
 * MVP test adequacy. The producer reports, per requirement, which declared
 * Outcomes/Errors it tested; this verifies that against the AORDL declaration.
 * @param testManifest [{ requirement, outcomesTested:bool, errorsTested:[id] }]
 * @param aordl        [{ ID, Outcomes:[], Errors:[{error,...}] }]
 * Returns { pass, gaps:[{requirement, reason}] }
 */
function checkTestAdequacy(testManifest = [], aordl = []) {
  const byId = Object.fromEntries(aordl.map(r => [r.ID || r.id, r]));
  const manifestById = Object.fromEntries(testManifest.map(m => [m.requirement, m]));
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

module.exports = { recordVerification, checkTraceability, checkTestAdequacy };
