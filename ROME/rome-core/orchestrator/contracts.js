/**
 * Inter-component contracts + drift detection (ROME-PROP-039 Part C).
 *
 * Components are generated in parallel (PROP-038) against shared contracts so
 * they integrate. A contract is the canonical interface between components:
 *   { id, kind:'api'|'types'|'event', members:[string], producer, consumers:[id] }
 * `members` are the interface elements (e.g. "POST /projects", "Project.ownerId").
 *
 * Drift = a producer not implementing a contract member, or a consumer using a
 * member the contract does not declare. Detected at GATE-P5 → BLOCK (§C.3).
 * A consumer implementing a SUBSET of the contract is fine. Pure, no deps.
 */

function asSet(a) { return new Set(a || []); }

/** Producer conformance: must implement every contract member. */
function checkProducer(contract, provided) {
  const want = asSet(contract.members);
  const have = asSet(provided);
  const missing = [...want].filter(m => !have.has(m)).sort();
  const extra = [...have].filter(m => !want.has(m)).sort(); // not drift, but reported
  return { conforms: missing.length === 0, missing, extra };
}

/** Consumer conformance: may use a subset, but nothing outside the contract. */
function checkConsumer(contract, used) {
  const want = asSet(contract.members);
  const undeclared = [...asSet(used)].filter(m => !want.has(m)).sort();
  return { conforms: undeclared.length === 0, undeclared };
}

/**
 * Aggregate drift across a contract and the components touching it.
 * impls = { producer: [members], consumers: { componentId: [members] } }
 * Returns { contract, conforms, drift: [ {component, role, issue, members} ] }
 */
function detectDrift(contract, impls = {}) {
  const drift = [];
  if (impls.producer !== undefined) {
    const p = checkProducer(contract, impls.producer);
    if (!p.conforms) drift.push({ component: contract.producer, role: 'producer', issue: 'unimplemented-members', members: p.missing });
  }
  for (const [component, used] of Object.entries(impls.consumers || {})) {
    const c = checkConsumer(contract, used);
    if (!c.conforms) drift.push({ component, role: 'consumer', issue: 'undeclared-usage', members: c.undeclared });
  }
  return { contract: contract.id, conforms: drift.length === 0, drift };
}

/** Gate helper: true only if every contract is drift-free. */
function gateContracts(contracts, implsById) {
  const reports = contracts.map(c => detectDrift(c, implsById[c.id] || {}));
  return { conforms: reports.every(r => r.conforms), reports };
}

module.exports = { checkProducer, checkConsumer, detectDrift, gateContracts };
