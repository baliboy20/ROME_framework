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

/** Map: component id → [ids that depend on it] (reverse edges). */
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

  // 3. requirement change → components implementing it (from traceability)
  for (const req of change.requirements || []) {
    for (const d of ctx.traceabilityDeltas || []) {
      if (d.requirement === req && d.component) add(d.component, `implements changed ${req}`);
    }
  }

  // 4. expand downstream through the DAG
  const closure = downstreamClosure(ctx.graph, [...seeds]);
  for (const id of closure) if (!reasons[id]) reasons[id] = ['downstream of a changed component'];

  return { components: [...closure].sort(), seeds: [...seeds].sort(), reasons };
}

module.exports = { dependentsIndex, downstreamClosure, computeImpact };
