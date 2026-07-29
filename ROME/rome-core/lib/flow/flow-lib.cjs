/**
 * flow-lib — FLOW artifact machinery (ROME-PROP-057 / ROME-STD-FLOW).
 *
 * A FLOW is a sponsor-owned workflow artifact ABOVE AORDL: steps reference
 * REQ ids (never restate their content), transitions carry the arrows AORDL
 * cannot hold (triggers, timers, failure routes). Statechart discipline
 * underneath, journey presentation on top.
 *
 * Exports:
 *   loadReqs(reqDir)            → { byId, files }
 *   loadFlows(flowsDir)         → [ { doc, file } ]
 *   validateFlow(flow, byId)    → { errors:[], warnings:[] }   (V1..V7)
 *   buildIndex(flows)           → { REQ-id: [FLOW-id] }        (derived, never authored)
 *   renderMermaid(flow)         → mermaid flowchart string     (generated, never edited)
 *   draftFlows(byId, opts)      → [flowDoc]  (DRAFT skeletons from pre/postcondition
 *                                 chains — heuristic; every inference carries confidence,
 *                                 every error starts UNROUTED. AX-38: drafts never bind.)
 */
'use strict';
const fs = require('fs');
const path = require('path');
// js-yaml when available (framework clone); bundled subset reader otherwise —
// vendored engines exclude node_modules, and flow validation must work there
// (re-entry P1 runs on the vendored engine). The fallback covers the FLOW and
// AORDL schema subset (top-level scalars/maps, lists of scalars/flat maps) and
// dumps JSON, which is valid YAML.
let yaml;
try { yaml = require('js-yaml'); }
catch {
  yaml = { load: miniLoad, dump: o => JSON.stringify(o, null, 2) + '\n' };
}
function miniLoad(text) {
  const t = text.split('\n').filter(l => !l.trim().startsWith('#')).join('\n').trim();
  if (t.startsWith('{')) return JSON.parse(t); // fallback-dumped files are JSON (after comment lines)
  const doc = {};
  let key = null, sub = null, listItem = null;
  const strip = s => { s = s.trim(); return (/^".*"$|^'.*'$/.test(s)) ? s.slice(1, -1) : s; };
  const coerce = s => (s === 'true' ? true : s === 'false' ? false : (/^-?\d+(\.\d+)?$/.test(s) ? Number(s) : s));
  for (const raw of text.split('\n')) {
    if (raw.trim().startsWith('#') || !raw.trim()) continue;
    const line = raw.replace(/\s#\s.*$/, '').trimEnd();
    const indent = line.length - line.trimStart().length;
    const body = line.trim();
    let m;
    if (indent === 0 && (m = body.match(/^([A-Za-z][A-Za-z0-9_]*)\s*:\s*(.*)$/))) {
      key = m[1]; sub = null; listItem = null;
      doc[key] = m[2] ? coerce(strip(m[2])) : null;
      if (doc[key] === '[]') doc[key] = [];
      continue;
    }
    if (!key) continue;
    if (body.startsWith('- ') || body === '-') {
      const item = body.replace(/^-\s?/, '');
      if (sub) doc[key][sub] = Array.isArray(doc[key][sub]) ? doc[key][sub] : [];
      else if (!Array.isArray(doc[key])) doc[key] = [];
      const container = sub ? doc[key][sub] : doc[key];
      if ((m = item.match(/^([A-Za-z][A-Za-z0-9_]*)\s*:\s*(.*)$/))) { listItem = { [m[1]]: coerce(strip(m[2])) }; container.push(listItem); }
      else { listItem = null; container.push(coerce(strip(item))); }
      continue;
    }
    if ((m = body.match(/^([A-Za-z][A-Za-z0-9_]*)\s*:\s*(.*)$/))) {
      if (listItem) { listItem[m[1]] = coerce(strip(m[2])); continue; }
      if (doc[key] === null || (doc[key] && typeof doc[key] === 'object' && !Array.isArray(doc[key]))) {
        if (doc[key] === null) doc[key] = {};
        sub = m[1];
        doc[key][sub] = m[2] ? coerce(strip(m[2])) : [];
      }
    }
  }
  return doc;
}

// ── loading ──────────────────────────────────────────────────────────────────
function loadReqs(reqDir) {
  const byId = {}; const files = [];
  if (!fs.existsSync(reqDir)) return { byId, files };
  for (const f of fs.readdirSync(reqDir)) {
    if (!/^REQ-[A-Za-z0-9]+.*\.ya?ml$/i.test(f)) continue;
    try {
      const doc = yaml.load(fs.readFileSync(path.join(reqDir, f), 'utf8'));
      if (doc && doc.ID) { byId[doc.ID] = doc; files.push(f); }
    } catch { /* unreadable REQ is the AORDL validator's problem, not ours */ }
  }
  return { byId, files };
}

function loadFlows(flowsDir) {
  const out = [];
  if (!fs.existsSync(flowsDir)) return out;
  for (const f of fs.readdirSync(flowsDir)) {
    if (!/^FLOW-\d+.*\.ya?ml$/i.test(f)) continue;
    out.push({ doc: yaml.load(fs.readFileSync(path.join(flowsDir, f), 'utf8')), file: f });
  }
  return out;
}

// ── validation (deterministic — backs GATE-P1 fact flowValidation) ──────────
const ON_RE = /^(actor|system:.+|timer:.+|error:.+)$/;

function validateFlow(flow, byId) {
  const errors = []; const warnings = [];
  const E = m => errors.push(m); const W = m => warnings.push(m);
  if (!flow || typeof flow !== 'object') return { errors: ['not a YAML mapping'], warnings };
  if (!/^FLOW-\d+$/.test(flow.ID || '')) E(`V0: ID "${flow.ID}" must match FLOW-###`);
  if (!['DRAFT', 'SPONSOR_CONFIRMED'].includes(flow.Status)) E(`V0: Status "${flow.Status}" must be DRAFT or SPONSOR_CONFIRMED`);
  const steps = Array.isArray(flow.Steps) ? flow.Steps : [];
  const trans = Array.isArray(flow.Transitions) ? flow.Transitions : [];
  const routing = Array.isArray(flow.ErrorRouting) ? flow.ErrorRouting : [];
  if (!steps.length) { E('V0: no Steps'); return { errors, warnings }; }

  // V5: step ids unique; transitions reference declared steps
  const ids = new Set();
  for (const s of steps) {
    if (!s.id) E('V5: step without id');
    else if (ids.has(s.id)) E(`V5: duplicate step id "${s.id}"`);
    else ids.add(s.id);
    if (!['req', 'system', 'decision', 'end'].includes(s.kind)) E(`V5: step "${s.id}" kind "${s.kind}" invalid`);
    if (s.kind === 'req' && !s.req) E(`V5: step "${s.id}" kind req without a req reference`);
    if (s.kind === 'system' && !s.action) E(`V6: system step "${s.id}" needs a plain-language action`);
    if (s.kind === 'end' && !s.label) E(`V5: end step "${s.id}" needs a label`);
  }
  for (const t of trans) {
    if (!ids.has(t.from)) E(`V5: transition from undeclared step "${t.from}"`);
    if (!ids.has(t.to)) E(`V5: transition to undeclared step "${t.to}"`);
    if (!ON_RE.test(String(t.on || ''))) E(`V6: transition ${t.from}→${t.to} "on" must be actor | system:<event> | timer:<duration> | error:<req>/<condition>`);
  }

  // V1: referenced REQs exist (only checkable when a requirement set is given)
  if (byId) {
    for (const s of steps) if (s.kind === 'req' && !byId[s.req]) E(`V1: step "${s.id}" references unknown ${s.req}`);
  }

  // V2/V3: reachability from the first step; every non-end step reaches an
  // end. Error routes are arrows too: a step reached only on failure is
  // reachable, and a failure route into a dead branch must still reach an end.
  const adj = {}; trans.forEach(t => { (adj[t.from] = adj[t.from] || []).push(t.to); });
  const stepByReq = {}; steps.forEach(s => { if (s.kind === 'req') stepByReq[s.req] = s.id; });
  for (const r of routing) {
    if (r.route && r.route !== 'UNROUTED' && ids.has(r.route) && stepByReq[r.req]) {
      (adj[stepByReq[r.req]] = adj[stepByReq[r.req]] || []).push(r.route);
    }
  }
  const reach = new Set(); const q = [steps[0].id];
  while (q.length) { const n = q.shift(); if (reach.has(n)) continue; reach.add(n); (adj[n] || []).forEach(x => q.push(x)); }
  for (const s of steps) if (!reach.has(s.id)) E(`V2: step "${s.id}" unreachable from entry "${steps[0].id}"`);
  const endIds = new Set(steps.filter(s => s.kind === 'end').map(s => s.id));
  if (!endIds.size) E('V3: no end step declared');
  const allEdges = Object.entries(adj).flatMap(([from, tos]) => tos.map(to => ({ from, to })));
  const reachesEnd = new Set([...endIds]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const t of allEdges) if (reachesEnd.has(t.to) && !reachesEnd.has(t.from)) { reachesEnd.add(t.from); grew = true; }
  }
  for (const s of steps) if (s.kind !== 'end' && reach.has(s.id) && !reachesEnd.has(s.id)) E(`V3: step "${s.id}" has no path to any end state`);

  // V4: error routing, BOTH directions (PROP-057 v1.1 amendment)
  const declaredErrors = new Set(); // "REQ|condition"
  if (byId) {
    for (const s of steps) {
      if (s.kind !== 'req' || !byId[s.req]) continue;
      for (const er of (byId[s.req].Errors || [])) {
        const cond = typeof er === 'string' ? er : er.error;
        declaredErrors.add(`${s.req}|${cond}`);
        if (!routing.some(r => r.req === s.req && r.error === cond)) E(`V4a: error of ${s.req} has no ErrorRouting entry: "${cond}"`);
      }
    }
    for (const r of routing) {
      if (!declaredErrors.has(`${r.req}|${r.error}`)) E(`V4b: ErrorRouting entry references an error ${r.req} does not declare: "${r.error}" (stale route?)`);
    }
  }
  for (const r of routing) {
    if (r.route === 'UNROUTED') {
      if (flow.Status === 'SPONSOR_CONFIRMED') E(`V4/AX-39: confirmed flow carries UNROUTED error "${r.error}" (${r.req}) — every failure needs an onward route`);
      else W(`UNROUTED: ${r.req} "${r.error}" — sponsor decision pending`);
    } else if (!ids.has(r.route)) {
      E(`V4: ErrorRouting for ${r.req} "${r.error}" routes to undeclared step "${r.route}"`);
    }
  }

  // V7: confirmation is recorded, never narrated
  if (flow.Status === 'SPONSOR_CONFIRMED') {
    const c = flow.Confirmation;
    if (!c || c.sponsor !== true || !c.timestamp) E('V7/AX-38: Status SPONSOR_CONFIRMED without a recorded Confirmation {sponsor: true, timestamp}');
  }
  return { errors, warnings };
}

// ── derived reverse index (never authored — cannot go stale) ────────────────
function buildIndex(flows) {
  const index = {};
  for (const { doc } of flows) {
    for (const s of (doc && doc.Steps) || []) {
      if (s.kind === 'req' && s.req) (index[s.req] = index[s.req] || []).push(doc.ID);
    }
  }
  return index;
}

// ── mermaid rendering (generated FROM the artifact; never hand-edited) ──────
function renderMermaid(flow) {
  const L = ['flowchart TD'];
  const esc = s => String(s).replace(/"/g, "'");
  for (const s of flow.Steps || []) {
    if (s.kind === 'end') L.push(`  ${s.id}(["${esc(s.label)}"])`);
    else if (s.kind === 'decision') L.push(`  ${s.id}{"${esc(s.label || s.id)}"}`);
    else if (s.kind === 'system') L.push(`  ${s.id}[["${esc(s.action)}"]]`);
    else L.push(`  ${s.id}["${esc(s.req)}"]`);
  }
  for (const t of flow.Transitions || []) L.push(`  ${t.from} -->|"${esc(t.on)}${t.guard ? ` [${esc(t.guard)}]` : ''}"| ${t.to}`);
  for (const r of flow.ErrorRouting || []) {
    if (r.route && r.route !== 'UNROUTED') {
      const from = (flow.Steps || []).find(s => s.kind === 'req' && s.req === r.req);
      if (from) L.push(`  ${from.id} -.->|"error: ${esc(r.error)}"| ${r.route}`);
    }
  }
  return L.join('\n');
}

// ── draft generation (heuristic; validated approach — see rome-flow-analyzer) ─
const STOP = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'has', 'have', 'been', 'to', 'of', 'in', 'on', 'for', 'with', 'and', 'or', 'must', 'be', 'set', 'exists', 'existing', 'system', 'state', 'successfully', 'valid']);
const tokens = s => new Set(String(s).toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/[\s-]+/).filter(w => w.length > 2 && !STOP.has(w)));
function overlap(a, b) { let n = 0; for (const w of a) if (b.has(w)) n++; return n / (Math.min(a.size, b.size) || 1); }

function draftFlows(byId, { minOverlap = 0.3, hubThreshold = 6 } = {}) {
  const reqs = Object.values(byId);
  const raw = [];
  for (const a of reqs) for (const b of reqs) {
    if (a === b) continue;
    let best = null;
    for (const post of a.Postconditions || []) {
      const pt = tokens(post); if (!pt.size) continue;
      for (const pre of b.Preconditions || []) {
        const s = overlap(pt, tokens(pre));
        if (s >= minOverlap && (!best || s > best.score)) best = { score: s, post, pre };
      }
    }
    if (best) raw.push({ from: a.ID, to: b.ID, ...best });
  }
  const preSources = {};
  for (const e of raw) { const k = `${e.to}|${e.pre}`; (preSources[k] = preSources[k] || new Set()).add(e.from); }
  const hubs = new Set(Object.keys(preSources).filter(k => preSources[k].size >= hubThreshold));
  const seq = raw.filter(e => !hubs.has(`${e.to}|${e.pre}`));
  const bestIn = {};
  for (const e of seq) if (!bestIn[e.to] || e.score > bestIn[e.to].score) bestIn[e.to] = e;
  const edges = Object.values(bestIn);
  // connected components → one DRAFT flow each
  const parent = {}; const find = x => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  reqs.forEach(r => { parent[r.ID] = r.ID; });
  edges.forEach(e => { parent[find(e.from)] = find(e.to); });
  const groups = {};
  reqs.forEach(r => { (groups[find(r.ID)] = groups[find(r.ID)] || []).push(r); });
  const comps = Object.values(groups).filter(g => g.length > 1);
  return comps.map((comp, i) => {
    const ids = new Set(comp.map(r => r.ID));
    const local = edges.filter(e => ids.has(e.from) && ids.has(e.to));
    const inbound = {}; comp.forEach(r => { inbound[r.ID] = 0; }); local.forEach(e => inbound[e.to]++);
    const ordered = []; const seen = new Set();
    const q = comp.filter(r => inbound[r.ID] === 0).map(r => r.ID);
    if (!q.length) q.push(comp[0].ID);
    while (q.length) { const id = q.shift(); if (seen.has(id)) continue; seen.add(id); ordered.push(id); local.filter(e => e.from === id).forEach(e => { if (!seen.has(e.to)) q.push(e.to); }); }
    comp.forEach(r => { if (!seen.has(r.ID)) ordered.push(r.ID); });
    const first = byId[ordered[0]];
    const stepId = id => id.toLowerCase();
    const flow = {
      ID: `FLOW-${String(i + 1).padStart(3, '0')}`,
      Name: `${first.Intent}${ordered.length > 1 ? ` → ${byId[ordered[ordered.length - 1]].Intent}` : ''}`,
      Status: 'DRAFT',
      Trigger: `actor: ${first.Actor || 'UNKNOWN'} — ${first.Intent} (inferred entry)`,
      Steps: [...ordered.map(id => ({ id: stepId(id), kind: 'req', req: id })), { id: 'end-success', kind: 'end', label: 'SUCCESS' }],
      Transitions: [
        ...local.map(e => ({ from: stepId(e.from), to: stepId(e.to), on: 'actor', inferredFrom: e.post, matchedPrecondition: e.pre, confidence: +e.score.toFixed(2) })),
        // every leaf (no outbound arrow) drafts to SUCCESS — an assumption for
        // the sponsor to confirm or reroute, marked by confidence 0
        ...ordered.filter(id => !local.some(e => e.from === id)).map(id => ({ from: stepId(id), to: 'end-success', on: 'actor', confidence: 0 })),
      ],
      ErrorRouting: ordered.flatMap(id => ((byId[id].Errors || []).map(er => ({ req: id, error: typeof er === 'string' ? er : er.error, route: 'UNROUTED' })))),
      Invariants: [],
      OpenQuestions: [],
    };
    return flow;
  });
}

module.exports = { yaml, loadReqs, loadFlows, validateFlow, buildIndex, renderMermaid, draftFlows };
