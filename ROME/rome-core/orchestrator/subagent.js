/**
 * Sub-agent definitions + structured-return processing (ROME-PROP-035 §3.2, §6b).
 *
 * Two jobs:
 *  1. loadRoleSpec(): turn a robot-plugin folder (ROBOT.md + modes/ + skills/)
 *     into a sub-agent spec — system prompt + scoped skill list. This is how
 *     "robots become sub-agent types" without rewriting their content.
 *  2. The structured-return contract: a sub-agent FINISHES by returning a
 *     validated result; processReturn() records it into state. "Completion =
 *     return = record" — there is no silent-finish path (§6b).
 *
 * PROP-042: accepts traceabilityEdges (new) alongside traceabilityDeltas (legacy).
 * Edges use a bipartite graph model — artifact nodes keyed component:logicalName,
 * edges upserted on natural key (req, artifactId, satisfiesHow), two derived indexes
 * (byReq, byArtifact) rebuilt after every merge.
 *
 * Pure + fs reads only. No external deps.
 */

const fs = require('fs');
const path = require('path');

// Repo-relative default location of role definitions.
const DEFAULT_ROLES_DIR = path.join(__dirname, '..', '..', 'agents');

const RETURN_STATUS = Object.freeze({ COMPLETE: 'COMPLETE', FAILED: 'FAILED', BLOCKED: 'BLOCKED' });

/** Find the mode doc for a phase: prefix match on phase id, else exact, else first. */
function findModeFile(modesDir, phaseOrMode) {
  if (!fs.existsSync(modesDir)) return null;
  const files = fs.readdirSync(modesDir).filter(f => f.endsWith('.md'));
  if (!files.length) return null;
  const exact = files.find(f => f === `${phaseOrMode}.md` || f === phaseOrMode);
  if (exact) return path.join(modesDir, exact);
  const prefixed = files.find(f => f.toUpperCase().startsWith(String(phaseOrMode).toUpperCase()));
  if (prefixed) return path.join(modesDir, prefixed);
  return path.join(modesDir, files[0]);
}

/**
 * Load a role's sub-agent spec.
 * @returns { role, systemPrompt, skills:[name], modeFile, sourceDir }
 */
function loadRoleSpec(role, phaseOrMode, rolesDir = DEFAULT_ROLES_DIR) {
  const dir = path.join(rolesDir, role);
  const robotMd = path.join(dir, 'ROBOT.md');
  if (!fs.existsSync(robotMd)) throw new Error(`Role "${role}" has no ROBOT.md at ${robotMd}`);

  const identity = fs.readFileSync(robotMd, 'utf8');
  const modeFile = findModeFile(path.join(dir, 'modes'), phaseOrMode);
  const mode = modeFile && fs.existsSync(modeFile) ? fs.readFileSync(modeFile, 'utf8') : '';

  const skillsDir = path.join(dir, 'skills');
  const skills = fs.existsSync(skillsDir)
    ? fs.readdirSync(skillsDir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name)
    : [];

  const systemPrompt = [
    identity,
    mode ? `\n---\n# Active Mode\n\n${mode}` : '',
    `\n---\n# Return Contract\n` +
    `You FINISH by returning a single structured result (status, summary, artifacts, ` +
    `traceabilityDeltas, blockers). Returning IS your progress record — there is no ` +
    `separate logging step and no silent-finish path.`,
  ].join('');

  return { role, systemPrompt, skills, modeFile: modeFile || null, sourceDir: dir };
}

/**
 * Validate a sub-agent's structured return. Returns an array of problems
 * (empty = valid). Used by the orchestrator to reject garbage returns
 * (failure policy, PROP-039 Part B).
 *
 * Accepts traceabilityEdges (PROP-042) or traceabilityDeltas (legacy) — at least
 * one must be present as an array. Both may be present during the transition.
 */
function validateReturn(ret) {
  const errs = [];
  if (!ret || typeof ret !== 'object') return ['return is not an object'];
  if (!ret.role) errs.push('missing role');
  if (!ret.phase) errs.push('missing phase');
  if (!Object.values(RETURN_STATUS).includes(ret.status)) {
    errs.push(`invalid status "${ret.status}" (COMPLETE|FAILED|BLOCKED)`);
  }
  if (typeof ret.summary !== 'string' || !ret.summary.trim()) errs.push('missing summary');
  if (!Array.isArray(ret.artifacts)) errs.push('artifacts must be an array');

  const hasDeltas = Array.isArray(ret.traceabilityDeltas);
  const hasEdges = Array.isArray(ret.traceabilityEdges);
  if (!hasDeltas && !hasEdges) errs.push('traceabilityDeltas or traceabilityEdges must be an array');

  for (const d of ret.traceabilityDeltas || []) {
    if (!d.requirement || !d.produces) { errs.push('traceability delta needs {requirement, produces}'); break; }
  }
  for (const e of ret.traceabilityEdges || []) {
    if (!e.req || !e.artifactId || !e.satisfiesHow) {
      errs.push('traceability edge needs {req, artifactId, satisfiesHow}'); break;
    }
    if (!['implements', 'enforces', 'validates', 'documents'].includes(e.satisfiesHow)) {
      errs.push(`edge satisfiesHow "${e.satisfiesHow}" must be implements|enforces|validates|documents`); break;
    }
  }
  if (ret.status === RETURN_STATUS.BLOCKED && !(Array.isArray(ret.blockers) && ret.blockers.length)) {
    errs.push('BLOCKED return must include blockers[]');
  }
  return errs;
}

/**
 * Record a dispatch (sub-agent launched). Mutates + returns state.
 * `spawnedBy` defaults to the orchestrator role — recordDispatch IS the
 * orchestrator's spawn action (ROME-AX-14). Pass it explicitly only to record a
 * non-orchestrator spawner, which the AX-14 check will then flag.
 */
function recordDispatch(state, { agent, role, phase, timestamp, spawnedBy = 'roma' }) {
  if (!agent || !role || !phase || !timestamp) throw new Error('recordDispatch: agent, role, phase, timestamp required');
  state.dispatch.push({ agent, role, phase, status: 'RUNNING', timestamp, spawnedBy });
  state.audit.push({ event: 'DISPATCH', agent, role, phase, timestamp, spawnedBy });
  return state;
}

// ---------------------------------------------------------------------------
// PROP-042: artifact graph helpers
// ---------------------------------------------------------------------------

/** Canonical artifact id: component:logicalName, or just logicalName if no component. */
function canonicalId(logicalName, component) {
  return component ? `${component}:${logicalName}` : logicalName;
}

/** Rebuild byReq and byArtifact indexes from the edge list. Mutates traceability. */
function rebuildIndexes(traceability) {
  const byReq = {};
  const byArtifact = {};
  for (const edge of traceability.edges) {
    if (!byReq[edge.req]) byReq[edge.req] = [];
    if (!byReq[edge.req].includes(edge.artifactId)) byReq[edge.req].push(edge.artifactId);
    if (!byArtifact[edge.artifactId]) byArtifact[edge.artifactId] = [];
    if (!byArtifact[edge.artifactId].includes(edge.req)) byArtifact[edge.artifactId].push(edge.req);
  }
  traceability.byReq = byReq;
  traceability.byArtifact = byArtifact;
}

/** Upsert an artifact node. Mutates traceability.artifacts. */
function upsertArtifact(traceability, artifactId, { logicalName, kind, path, component }) {
  traceability.artifacts[artifactId] = {
    logicalName: logicalName || artifactId,
    kind: kind || 'unknown',
    path: path || null,
    component: component || null,
  };
}

/**
 * Upsert an edge on natural key (req, artifactId, satisfiesHow) — latest assertion wins.
 * Mutates traceability.edges.
 */
function upsertEdge(traceability, edge) {
  const idx = traceability.edges.findIndex(
    e => e.req === edge.req && e.artifactId === edge.artifactId && e.satisfiesHow === edge.satisfiesHow
  );
  if (idx >= 0) {
    traceability.edges[idx] = { ...traceability.edges[idx], ...edge };
  } else {
    traceability.edges.push(edge);
  }
}

// ---------------------------------------------------------------------------

/**
 * Process a sub-agent's structured return into state (§6b "completion = record").
 * Validates, updates the dispatch record, merges traceability deltas/edges, records
 * blockers, appends an audit entry. Throws on invalid return.
 * Mutates + returns state.
 */
function processReturn(state, ret, timestamp) {
  const errs = validateReturn(ret);
  if (errs.length) throw new Error(`Invalid sub-agent return: ${errs.join('; ')}`);
  if (!timestamp) throw new Error('processReturn: timestamp required');

  const d = [...state.dispatch].reverse().find(x => x.agent === ret.agent && x.status === 'RUNNING');
  if (d) d.status = ret.status;

  // Legacy delta format (backward compat)
  for (const delta of ret.traceabilityDeltas || []) {
    state.traceability.deltas.push({
      requirement: delta.requirement,
      produces: delta.produces,
      ...(delta.component ? { component: delta.component } : {}),
      phase: ret.phase, role: ret.role, agent: ret.agent,
    });
  }

  // PROP-042 edge format
  for (const e of ret.traceabilityEdges || []) {
    const aid = canonicalId(e.artifactId, e.component);
    upsertArtifact(state.traceability, aid, {
      logicalName: e.artifactId,
      kind: e.artifactKind,
      path: e.artifactPath || null,
      component: e.component || null,
    });
    upsertEdge(state.traceability, {
      req: e.req,
      ...(e.reqField ? { reqField: e.reqField } : {}),
      artifactId: aid,
      satisfiesHow: e.satisfiesHow,
      ...(e.location ? { location: e.location } : {}),
      phase: ret.phase, role: ret.role, agent: ret.agent,
      ...(e.reqVersion ? { reqVersion: e.reqVersion } : {}),
      stale: false,
    });
  }
  if ((ret.traceabilityEdges || []).length) rebuildIndexes(state.traceability);

  // PROP-041: OQ counts from Talib P2 (latest return wins for awaitingSponsor)
  if (ret.openQuestions && typeof ret.openQuestions === 'object') {
    state.oq.resolvedByTalib += (ret.openQuestions.resolvedByTalib || 0);
    state.oq.awaitingSponsor = (ret.openQuestions.awaitingSponsor || 0);
    for (const d of ret.openQuestions.deferrals || []) state.oq.deferrals.push(d);
  }

  if (Array.isArray(ret.blockers)) {
    ret.blockers.forEach((b, i) => state.blockers.push({
      id: `BLK-${ret.agent}-${i}`, phase: ret.phase,
      description: typeof b === 'string' ? b : (b.description || JSON.stringify(b)),
      owner: ret.role, status: 'OPEN',
    }));
  }

  const deltaCount = (ret.traceabilityDeltas || []).length;
  const edgeCount = (ret.traceabilityEdges || []).length;
  state.audit.push({
    event: 'RETURN', agent: ret.agent, role: ret.role, phase: ret.phase,
    status: ret.status, artifacts: ret.artifacts.length,
    deltas: deltaCount, edges: edgeCount, timestamp,
  });
  return state;
}

/**
 * Three-level coverage metric (PROP-042).
 *
 * Linked     — req has ≥1 non-stale edge (any satisfiesHow).
 * Implemented — req has ≥1 non-stale 'implements' edge.
 * Verified   — req has ≥1 'implements' AND ≥1 'validates' edge, both non-stale.
 *
 * requirementsCovered is kept for backward compat (= linked count + legacy delta reqs).
 */
function coverage(state) {
  const edges = state.traceability.edges || [];
  const deltas = state.traceability.deltas || [];

  const linked = new Set();
  const implemented = new Set();
  const verified = new Set();

  const allReqs = new Set(edges.map(e => e.req));
  for (const req of allReqs) {
    const active = edges.filter(e => e.req === req && !e.stale);
    if (!active.length) continue;
    linked.add(req);
    if (active.some(e => e.satisfiesHow === 'implements')) implemented.add(req);
    if (active.some(e => e.satisfiesHow === 'implements') && active.some(e => e.satisfiesHow === 'validates')) {
      verified.add(req);
    }
  }

  // legacy delta reqs not already in the edge store count toward requirementsCovered
  const legacyOnly = new Set(deltas.map(d => d.requirement).filter(r => !allReqs.has(r)));

  return {
    linked: linked.size,
    implemented: implemented.size,
    verified: verified.size,
    requirementsCovered: linked.size + legacyOnly.size,
    deltas: deltas.length,
    edges: edges.length,
  };
}

module.exports = {
  RETURN_STATUS, DEFAULT_ROLES_DIR,
  loadRoleSpec, validateReturn, recordDispatch, processReturn, coverage,
  canonicalId, rebuildIndexes,
};
