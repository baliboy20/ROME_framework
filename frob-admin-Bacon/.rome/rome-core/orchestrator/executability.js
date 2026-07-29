/**
 * Executability: build / verify / self-heal (ROME-PROP-039 Part A).
 *
 * Proves generated code RUNS — not just that it traces. A component is VERIFIED
 * only when its checks (install/build/test) actually pass. On failure the
 * orchestrator feeds diagnostics back to the producing sub-agent (the `heal`
 * callback) and re-verifies, bounded by maxIterations (then escalates —
 * PROP-039 Part B). Executability is a blocking gate criterion (§A.3).
 *
 * Uses node:child_process only. The heal callback is supplied by the caller
 * (a sub-agent in production; a deterministic fixer in tests).
 */

const { spawnSync } = require('child_process');

/** Run one check command in cwd. Returns { ok, code, stdout, stderr }. */
function runCheck({ cwd, command, args = [], timeout = 120000 }) {
  const r = spawnSync(command, args, { cwd, encoding: 'utf8', timeout });
  const stdout = r.stdout || '';
  const stderr = r.stderr || (r.error ? String(r.error.message) : '');
  return { ok: r.status === 0, code: r.status, stdout, stderr };
}

/**
 * Verify a component by running its steps in order; stop at first failure.
 * component = { id, cwd, steps: [{ name, command, args }] }
 * Returns { component, status: 'VERIFIED'|'FAILED', failedStep?, diagnostics? }
 */
function verifyComponent(component) {
  for (const step of component.steps) {
    const res = runCheck({ cwd: component.cwd, command: step.command, args: step.args });
    if (!res.ok) {
      return {
        component: component.id,
        status: 'FAILED',
        failedStep: step.name,
        diagnostics: `[${step.name}] exit ${res.code}\n${(res.stderr || res.stdout).trim().slice(0, 2000)}`,
      };
    }
  }
  return { component: component.id, status: 'VERIFIED' };
}

/**
 * Self-heal loop. Verify → on FAILED call heal(diagnostics, iteration) → re-verify.
 * heal returns truthy if it attempted a fix. Bounded by maxIterations.
 * Returns { component, status, iterations, escalated, history }.
 */
function selfHeal(component, heal, { maxIterations = 3 } = {}) {
  const history = [];
  for (let i = 1; i <= maxIterations; i++) {
    const res = verifyComponent(component);
    history.push({ iteration: i, status: res.status, failedStep: res.failedStep });
    if (res.status === 'VERIFIED') {
      return { component: component.id, status: 'VERIFIED', iterations: i, escalated: false, history };
    }
    const attempted = heal(res.diagnostics, i);
    if (!attempted) break; // healer gave up
  }
  // final verify after last heal attempt
  const finalRes = verifyComponent(component);
  history.push({ iteration: 'final', status: finalRes.status });
  const verified = finalRes.status === 'VERIFIED';
  return {
    component: component.id,
    status: finalRes.status,
    iterations: history.length,
    escalated: !verified, // PROP-039 Part B: exhaustion → escalate
    history,
  };
}

module.exports = { runCheck, verifyComponent, selfHeal };
