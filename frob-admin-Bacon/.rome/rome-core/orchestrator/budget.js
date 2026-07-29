/**
 * Budget governance (ROME-PROP-040 Part D). Tracks spend in the ACTIVE increment's budget (PROP-048): active(state).budget and
 * applies a degrade-before-abort policy as a ceiling is approached. No silent
 * overrun (EP-4). Pure functions over active(state).budget. No deps.
 *
 * active(state).budget = { tokens, ceiling, degradeAt? }
 */

const { active } = require('./state');

const DEFAULT_DEGRADE_FRACTION = 0.8; // begin degrading at 80% of ceiling

/** Add spend. Returns the budget. */
function record(state, tokens) {
  if (!(tokens >= 0)) throw new Error('record: tokens must be >= 0');
  active(state).budget.tokens += tokens;
  return active(state).budget;
}

function remaining(state) {
  const { ceiling, tokens } = active(state).budget;
  return ceiling == null ? Infinity : Math.max(0, ceiling - tokens);
}

/**
 * Policy decision for the orchestrator before launching more work.
 * @returns { action: 'PROCEED'|'DEGRADE'|'ESCALATE', reason }
 *  - no ceiling            → PROCEED
 *  - over ceiling          → ESCALATE (PROP-040: continue/raise/reduce-scope/abort is the sponsor's call)
 *  - within degrade band   → DEGRADE (reduce parallelism / self-heal iterations)
 *  - otherwise             → PROCEED
 */
function policy(state) {
  const { ceiling, tokens } = active(state).budget;
  if (ceiling == null) return { action: 'PROCEED', reason: 'no ceiling set' };
  if (tokens >= ceiling) return { action: 'ESCALATE', reason: `budget exhausted (${tokens}/${ceiling})` };
  const degradeAt = active(state).budget.degradeAt != null ? active(state).budget.degradeAt : Math.floor(ceiling * DEFAULT_DEGRADE_FRACTION);
  if (tokens >= degradeAt) return { action: 'DEGRADE', reason: `within degrade band (${tokens}/${ceiling}); reduce parallelism/self-heal` };
  return { action: 'PROCEED', reason: `within budget (${tokens}/${ceiling})` };
}

module.exports = { DEFAULT_DEGRADE_FRACTION, record, remaining, policy };
