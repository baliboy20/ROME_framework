/**
 * Incremental re-generation / impact analysis (ROME-PROP-040 Part E).
 *
 * A change targets requirements, contracts, and/or components. The affected set
 * = directly changed components + everything transitively downstream of them
 * (dependents via the component DAG) + consumers of any changed contract +
 * components implementing any changed requirement (then expanded downstream).
 * Re-run ONLY the affected set; unaffected verified artifacts are untouched.
 *
 * This is the same machinery PROP-036 uses for brownfield (delta on as-is).
 * Pure, no deps.
 */

const { validateGraph } = require('./topology');
const { rebuildIndexes } = require('./subagent');

/** Map: component id → [ids that depend on it] (reverse edges). */
const { active } = require('./state');

function dependentsIndex(graph) {
  const idx = {};
  for (const n of graph.nodes) idx[n.id] = idx[n.id] || [];
  for (const n of graph.nodes) for (const dep of n.dependsOn || []) {
    idx[dep] = idx[dep] || []; idx[dep].push(n.id);
  }
  return idx;
}

/** Transitive downstream closure of a set of component ids. */
function downstreamClosure(graph, seedIds) {
  const idx = dependentsIndex(graph);
  const seen = new Set();
  const stack = [...seedIds];
  while (stack.length) {
    const id = stack.pop();
    if (seen.has(id)) continue;
    seen.add(id);
    for (const dependent of idx[id] || []) if (!seen.has(dependent)) stack.push(dependent);
  }
  return seen;
}

/**
 * Compute the affected component set for a change.
 * @param {object} ctx  { graph, contracts?:[{id,producer,consumers}], traceabilityDeltas?:[{requirement,component}] }
 * @param {object} change { components?:[id], contracts?:[id], requirements?:[REQ] }
 * @returns { components:[id], seeds:[id], reasons:{id:[reason]} }
 */
function computeImpact(ctx, change = {}) {
  validateGraph(ctx.graph);
  const reasons = {};
  const seeds = new Set();
  const add = (id, why) => { if (!ctx.graph.nodes.find(n => n.id === id)) return; seeds.add(id); (reasons[id] = reasons[id] || []).push(why); };

  // 1. directly changed components
  for (const id of change.components || []) add(id, 'directly changed');

  // 2. contract change → producer + consumers
  for (const cid of change.contracts || []) {
    const c = (ctx.contracts || []).find(x => x.id === cid);
    if (!c) continue;
    if (c.producer) add(c.producer, `produces changed contract ${cid}`);
    for (const consumer of c.consumers || []) add(consumer, `consumes changed contract ${cid}`);
  }

  // 3. requirement change → components implementing it
  // PROP-042: prefer byArtifact reverse index; fall back to scanning legacy deltas
  for (const req of change.requirements || []) {
    const byReq = ctx.traceability && ctx.traceability.byReq;
    if (byReq && byReq[req]) {
      // each artifactId is component:logicalName — extract the component prefix
      for (const aid of byReq[req]) {
        const component = (ctx.traceability.artifacts[aid] || {}).component;
        if (component) add(component, `implements changed ${req} (artifact ${aid})`);
      }
    } else {
      // legacy delta fallback
      for (const d of ctx.traceabilityDeltas || []) {
        if (d.requirement === req && d.component) add(d.component, `implements changed ${req}`);
      }
    }
  }

  // 4. expand downstream through the DAG
  const closure = downstreamClosure(ctx.graph, [...seeds]);
  for (const id of closure) if (!reasons[id]) reasons[id] = ['downstream of a changed component'];

  return { components: [...closure].sort(), seeds: [...seeds].sort(), reasons };
}

/**
 * Mark all edges for a set of changed requirements as stale (PROP-042).
 * Stale edges are preserved but excluded from coverage until re-asserted.
 * Mutates state.traceability and rebuilds indexes.
 */
function markStale(state, changedRequirements = []) {
  if (!state.traceability || !state.traceability.edges) return state;
  const reqSet = new Set(changedRequirements);
  for (const edge of state.traceability.edges) {
    if (reqSet.has(edge.req)) edge.stale = true;
  }
  rebuildIndexes(state.traceability);
  return state;
}

/**
 * Apply a change-request to state (PROP-042 AC5 + PROP-040 E). The single
 * deterministic entry the orchestrator routes a CR through:
 *   1. stales the edges of every changed requirement, so the gates
 *      (checkTraceability / checkMatrix, which exclude stale edges) re-demand
 *      fresh assertions before GATE-P5 can pass again;
 *   2. computes the affected component set, when a topology graph is available,
 *      so re-generation is scoped to exactly the impacted components.
 *
 * @param {object} state  the orchestrator state (mutated: edges staled)
 * @param {object} change { components?:[id], contracts?:[id], requirements?:[REQ] }
 * @param {object} opts   { graph?, contracts? } — topology + contract maps if not on state
 * @returns { staled:[REQ], impact: {components,seeds,reasons} | null }
 */
function applyChange(state, change = {}, opts = {}) {
  const staled = change.requirements || [];
  if (staled.length) markStale(state, staled);

  const graph = opts.graph || state.topology || state.graph || null;
  if (!graph) return { staled, impact: null };

  const ctx = {
    graph,
    contracts: opts.contracts || state.contracts,
    traceability: state.traceability,
    traceabilityDeltas: state.traceability && state.traceability.deltas,
  };
  return { staled, impact: computeImpact(ctx, change) };
}

/**
 * Resolve a previously deferred sponsor OQ once the sponsor answers
 * (PROP-041 B4 / A5). Marks the deferral resolved (no longer provisional) and
 * stales the edges of its affected requirements so PROP-039 re-gen is scoped to
 * exactly those REQ-IDs. Returns the affected requirement set for the caller to
 * route into re-generation.
 *
 * @returns { resolved:boolean, affectedReqs:[REQ] }
 */
function resolveDeferral(state, oqId) {
  const oq = active(state).oq || {};
  const d = (oq.deferrals || []).find(x => x.oqId === oqId);
  if (!d) return { resolved: false, affectedReqs: [] };
  d.resolved = true;
  d.provisional = false;
  const affectedReqs = d.affectedReqs || [];
  if (affectedReqs.length) markStale(state, affectedReqs);
  return { resolved: true, affectedReqs };
}

/**
 * Trace-verified blast radius for a change classification (PROP-054 A.2 /
 * ROME-AX-31). Wraps computeImpact with honesty about trace granularity:
 * the result NEVER asserts precision the trace does not carry.
 *
 * granularityCeiling values (null = trace isolated the impact precisely):
 *   'project'   — no topology graph at all: impact cannot be scoped below the
 *                 whole delivered scope;
 *   'component' — requirements resolved only to whole components (no
 *                 artifact-level edges): scope = full rework of those components.
 *
 * @param {object} state  orchestrator state (traceability + topology)
 * @param {object} change { requirements?:[REQ], components?:[id], contracts?:[id] }
 * @param {object} opts   { graph?, contracts? }
 * @returns { verified:true, components, seeds, reasons, requirements,
 *            designImpacted, granularityCeiling, notes:[string] }
 */
function blastRadius(state, change = {}, opts = {}) {
  const notes = [];
  const graph = opts.graph || state.topology || state.graph || null;
  const requirements = change.requirements || [];

  if (!graph) {
    notes.push('no topology graph: impact cannot be scoped below the whole delivered scope (A.2 — report plainly, widen honestly)');
    return { verified: true, components: [], seeds: [], reasons: {}, requirements, designImpacted: true, granularityCeiling: 'project', notes };
  }

  const ctx = {
    graph,
    contracts: opts.contracts || state.contracts,
    traceability: state.traceability,
    traceabilityDeltas: state.traceability && state.traceability.deltas,
  };
  const impact = computeImpact(ctx, change);

  // Granularity check: did any changed requirement resolve only through the
  // legacy component-level deltas (no artifact-level edge)?
  let ceiling = null;
  const byReq = (state.traceability && state.traceability.byReq) || {};
  for (const req of requirements) {
    if (!byReq[req] || byReq[req].length === 0) {
      ceiling = 'component';
      notes.push(`${req} traces only at component level — scope widens to full rework of its component(s)`);
    }
  }

  // Design impact: any affected artifact of kind design/spec, or a ceiling hit.
  const artifacts = (state.traceability && state.traceability.artifacts) || {};
  const designImpacted = !!ceiling || Object.values(artifacts).some(a =>
    impact.components.includes(a.component) && /design|spec/i.test(a.kind || ''));

  return { verified: true, components: impact.components, seeds: impact.seeds, reasons: impact.reasons, requirements, designImpacted, granularityCeiling: ceiling, notes };
}

module.exports = { dependentsIndex, downstreamClosure, computeImpact, markStale, applyChange, resolveDeferral, blastRadius };
