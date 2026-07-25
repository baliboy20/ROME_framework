/**
 * Topology-driven capability instancing (ROME-PROP-038) — deterministic core.
 *
 * A component graph is DATA describing the application's shape:
 *   nodes: [{ id, type, capability, dependsOn:[id], platform?, audience? }]
 * The orchestrator instances ONE sub-agent per node (capability), and fans them
 * out concurrently in dependency order. This file derives the schedule and
 * validates the graph. Pure, no deps.
 *
 * Scales both ways: a 1-node graph yields one batch of one; a wide graph yields
 * few batches of many; a deep chain yields many batches of one (critical-path
 * bound — see PROP-035 §3.5.1). Same machinery either way.
 */

const CAPABILITIES = Object.freeze([
  'generate-schema', 'generate-service', 'generate-bff',
  'generate-ui', 'generate-shared-lib', 'generate-integration',
]);

const TYPE_CAPABILITY = Object.freeze({
  db: 'generate-schema', service: 'generate-service', bff: 'generate-bff',
  ui: 'generate-ui', 'shared-lib': 'generate-shared-lib', integration: 'generate-integration',
});

/**
 * Validate a component graph. Throws on: empty, duplicate id, unknown type,
 * dangling dependsOn, unknown capability, or a dependency cycle.
 */
function validateGraph(graph) {
  if (!graph || !Array.isArray(graph.nodes) || graph.nodes.length === 0) {
    throw new Error('component graph must have a non-empty nodes[]');
  }
  const ids = new Set();
  for (const n of graph.nodes) {
    if (!n.id) throw new Error('node missing id');
    if (ids.has(n.id)) throw new Error(`duplicate node id: ${n.id}`);
    ids.add(n.id);
    if (n.type && !TYPE_CAPABILITY[n.type]) throw new Error(`unknown node type: ${n.type} (${n.id})`);
    const cap = n.capability || (n.type && TYPE_CAPABILITY[n.type]);
    if (!cap || !CAPABILITIES.includes(cap)) {
      throw new Error(`node ${n.id} has no resolvable capability (type=${n.type}, capability=${n.capability})`);
    }
  }
  for (const n of graph.nodes) {
    for (const dep of n.dependsOn || []) {
      if (!ids.has(dep)) throw new Error(`node ${n.id} dependsOn unknown node: ${dep}`);
      if (dep === n.id) throw new Error(`node ${n.id} dependsOn itself`);
    }
  }
  detectCycle(graph); // throws if a cycle exists
  return true;
}

/** Resolve a node's capability (explicit wins, else by type). */
function capabilityOf(node) {
  return node.capability || TYPE_CAPABILITY[node.type];
}

/** DFS cycle detection; throws with the offending path. */
function detectCycle(graph) {
  const byId = Object.fromEntries(graph.nodes.map(n => [n.id, n]));
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = {};
  graph.nodes.forEach(n => { color[n.id] = WHITE; });
  const stack = [];
  function visit(id) {
    color[id] = GRAY; stack.push(id);
    for (const dep of byId[id].dependsOn || []) {
      if (color[dep] === GRAY) throw new Error(`dependency cycle: ${[...stack, dep].join(' -> ')}`);
      if (color[dep] === WHITE) visit(dep);
    }
    stack.pop(); color[id] = BLACK;
  }
  graph.nodes.forEach(n => { if (color[n.id] === WHITE) visit(n.id); });
}

/**
 * Topological batches for fan-out. Returns an array of batches; every node in a
 * batch has all dependencies satisfied by earlier batches, so a batch runs
 * concurrently. Deterministic order (id-sorted within a batch).
 */
function topoBatches(graph) {
  validateGraph(graph);
  const byId = Object.fromEntries(graph.nodes.map(n => [n.id, n]));
  const remaining = new Set(graph.nodes.map(n => n.id));
  const done = new Set();
  const batches = [];
  while (remaining.size) {
    const ready = [...remaining]
      .filter(id => (byId[id].dependsOn || []).every(d => done.has(d)))
      .sort();
    if (!ready.length) throw new Error('no ready nodes — graph not a DAG'); // safety
    batches.push(ready);
    ready.forEach(id => { remaining.delete(id); done.add(id); });
  }
  return batches;
}

/** Width = max concurrency; depth = critical-path length (batch count). */
function shape(graph) {
  const batches = topoBatches(graph);
  return { depth: batches.length, width: Math.max(...batches.map(b => b.length)), nodes: graph.nodes.length };
}

module.exports = { CAPABILITIES, TYPE_CAPABILITY, validateGraph, capabilityOf, topoBatches, shape };
