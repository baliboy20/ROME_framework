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
 * Pure + fs reads only. No external deps.
 */

const fs = require('fs');
const path = require('path');

// Repo-relative default location of role definitions.
const DEFAULT_ROLES_DIR = path.join(__dirname, '..', '..', 'robot-plugins');

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
  if (!Array.isArray(ret.traceabilityDeltas)) errs.push('traceabilityDeltas must be an array');
  for (const d of ret.traceabilityDeltas || []) {
    if (!d.requirement || !d.produces) { errs.push('traceability delta needs {requirement, produces}'); break; }
  }
  if (ret.status === RETURN_STATUS.BLOCKED && !(Array.isArray(ret.blockers) && ret.blockers.length)) {
    errs.push('BLOCKED return must include blockers[]');
  }
  return errs;
}

/** Record a dispatch (sub-agent launched). Mutates + returns state. */
function recordDispatch(state, { agent, role, phase, timestamp }) {
  if (!agent || !role || !phase || !timestamp) throw new Error('recordDispatch: agent, role, phase, timestamp required');
  state.dispatch.push({ agent, role, phase, status: 'RUNNING', timestamp });
  state.audit.push({ event: 'DISPATCH', agent, role, phase, timestamp });
  return state;
}

/**
 * Process a sub-agent's structured return into state (§6b "completion = record").
 * Validates, updates the dispatch record, merges traceability deltas, records
 * blockers, appends an audit entry. Throws on invalid return.
 * Mutates + returns state.
 */
function processReturn(state, ret, timestamp) {
  const errs = validateReturn(ret);
  if (errs.length) throw new Error(`Invalid sub-agent return: ${errs.join('; ')}`);
  if (!timestamp) throw new Error('processReturn: timestamp required');

  const d = [...state.dispatch].reverse().find(x => x.agent === ret.agent && x.status === 'RUNNING');
  if (d) d.status = ret.status;

  for (const delta of ret.traceabilityDeltas) {
    state.traceability.deltas.push({
      requirement: delta.requirement,
      produces: delta.produces,
      ...(delta.component ? { component: delta.component } : {}),
      phase: ret.phase, role: ret.role, agent: ret.agent,
    });
  }

  if (Array.isArray(ret.blockers)) {
    ret.blockers.forEach((b, i) => state.blockers.push({
      id: `BLK-${ret.agent}-${i}`, phase: ret.phase,
      description: typeof b === 'string' ? b : (b.description || JSON.stringify(b)),
      owner: ret.role, status: 'OPEN',
    }));
  }

  state.audit.push({
    event: 'RETURN', agent: ret.agent, role: ret.role, phase: ret.phase,
    status: ret.status, artifacts: ret.artifacts.length,
    deltas: ret.traceabilityDeltas.length, timestamp,
  });
  return state;
}

/** Requirement-coverage helper: distinct requirements with ≥1 traceability delta. */
function coverage(state) {
  const reqs = new Set(state.traceability.deltas.map(d => d.requirement));
  return { requirementsCovered: reqs.size, deltas: state.traceability.deltas.length };
}

module.exports = {
  RETURN_STATUS, DEFAULT_ROLES_DIR,
  loadRoleSpec, validateReturn, recordDispatch, processReturn, coverage,
};
