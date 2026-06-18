/**
 * Visualization (ROME-PROP-037) — standard, cross-cutting diagrams emitted from
 * the source-of-truth state, so they never drift. Produces Mermaid text the
 * orchestrator can render (e.g. via the Mermaid MCP) at any phase. Pure, no deps.
 */

const { topoBatches } = require('./topology');

const TYPE_SHAPE = {
  db: ['[(', ')]'], 'shared-lib': ['{{', '}}'], service: ['[', ']'],
  bff: ['[', ']'], ui: ['([', '])'], integration: ['[/', '/]'],
};

function nodeShape(n) {
  const [l, r] = TYPE_SHAPE[n.type] || ['[', ']'];
  return `${n.id}${l}"${n.id}<br/>${n.type || ''}"${r}`;
}

/** Component graph → Mermaid flowchart (PROP-038 topology), batched by depth. */
function componentGraphMermaid(graph) {
  const lines = ['flowchart TD'];
  const batches = topoBatches(graph); // validates too
  batches.forEach((batch, i) => {
    lines.push(`  subgraph B${i}["batch ${i + 1}"]`);
    for (const id of batch) lines.push(`    ${nodeShape(graph.nodes.find(n => n.id === id))}`);
    lines.push('  end');
  });
  for (const n of graph.nodes) for (const dep of n.dependsOn || []) lines.push(`  ${dep} --> ${n.id}`);
  return lines.join('\n');
}

/** Lifecycle state → Mermaid flowchart of phases with status. */
function lifecycleMermaid(state) {
  const lines = ['flowchart LR'];
  const mark = { COMPLETE: '✓', IN_PROGRESS: '▶', BLOCKED: '✗', GATE: '⊘', PENDING: '·' };
  state.routing.forEach((id, i) => {
    const st = (state.phases[id] || {}).status || 'PENDING';
    lines.push(`  ${id}["${id} ${mark[st] || ''}<br/>${st}"]`);
    if (i > 0) lines.push(`  ${state.routing[i - 1]} --> ${id}`);
  });
  return lines.join('\n');
}

/** Traceability deltas → Mermaid requirement→artifact graph. */
function traceabilityMermaid(state) {
  const lines = ['flowchart LR'];
  const seen = new Set();
  for (const d of state.traceability.deltas) {
    const r = d.requirement.replace(/[^A-Za-z0-9]/g, '_');
    const p = (d.component ? d.component + '/' : '') + d.produces;
    const pid = 'a_' + p.replace(/[^A-Za-z0-9]/g, '_');
    if (!seen.has(r)) { lines.push(`  ${r}["${d.requirement}"]`); seen.add(r); }
    if (!seen.has(pid)) { lines.push(`  ${pid}["${p}"]`); seen.add(pid); }
    lines.push(`  ${r} --> ${pid}`);
  }
  return lines.join('\n');
}

module.exports = { componentGraphMermaid, lifecycleMermaid, traceabilityMermaid };
