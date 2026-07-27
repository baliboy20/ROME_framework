/**
 * Expert-pack injection (ROME-PROP-040 Part F).
 *
 * The Experts/ library holds domain knowledge (Flutter, Parse Server, analysis/
 * design). Each pack declares applicability; the orchestrator selects packs
 * matching a component's capability / platform / stack and injects them into
 * that sub-agent's context. Anti-pattern rules in a pack become gate criteria.
 *
 * Applicability lives in pack.json per Experts/<pack>/ (authored separately).
 * This module is the pure selection logic. fs reads only.
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_EXPERTS_DIR = path.join(__dirname, '..', '..', '..', 'Experts');

/**
 * Load expert-pack manifests. A pack is Experts/<name>/ with an optional
 * pack.json: { applies: { capabilities?:[], platforms?:[], stacks?:[], phases?:[] },
 *              enforce?: [rule] }. Missing pack.json → pack with empty applicability.
 */
function loadPacks(expertsDir = DEFAULT_EXPERTS_DIR) {
  if (!fs.existsSync(expertsDir)) return [];
  return fs.readdirSync(expertsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => {
      const manifestPath = path.join(expertsDir, d.name, 'pack.json');
      let manifest = { applies: {}, enforce: [] };
      if (fs.existsSync(manifestPath)) {
        try { manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')); } catch { /* keep default */ }
      }
      return { name: d.name, dir: path.join(expertsDir, d.name), applies: manifest.applies || {}, enforce: manifest.enforce || [] };
    });
}

function matches(applies, ctx) {
  // A pack with no constraint on a dimension matches any value of it.
  const dim = (key, val) => {
    const allowed = applies[key];
    if (!allowed || allowed.length === 0) return true;
    return val != null && allowed.includes(val);
  };
  // Must have at least one positive applicability declared to be selectable,
  // and every declared dimension must match.
  const declared = ['capabilities', 'platforms', 'stacks', 'phases'].some(k => (applies[k] || []).length);
  if (!declared) return false;
  return dim('capabilities', ctx.capability) && dim('platforms', ctx.platform) &&
         dim('stacks', ctx.stack) && dim('phases', ctx.phase);
}

/**
 * Select packs applicable to a generation/work context.
 * @param ctx { capability?, platform?, stack?, phase? }
 * @returns [{ name, dir, enforce }]
 */
function selectPacks(ctx, expertsDir = DEFAULT_EXPERTS_DIR) {
  return loadPacks(expertsDir)
    .filter(p => matches(p.applies, ctx))
    .map(p => ({ name: p.name, dir: p.dir, enforce: p.enforce }));
}

/** Collect enforce-rules (→ gate criteria) from the selected packs. */
function enforcedRules(ctx, expertsDir = DEFAULT_EXPERTS_DIR) {
  return selectPacks(ctx, expertsDir).flatMap(p => p.enforce);
}

module.exports = { DEFAULT_EXPERTS_DIR, loadPacks, selectPacks, enforcedRules, matches };
