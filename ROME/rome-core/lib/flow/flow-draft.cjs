#!/usr/bin/env node
/**
 * flow-draft — generate DRAFT flow skeletons from a requirement set
 * (ROME-PROP-057 §5, draft-and-confirm). Heuristic pre-population of the
 * derivable half; every inference carries confidence, every error starts
 * UNROUTED. Drafts NEVER bind (AX-38) — the sponsor fills the arrows AORDL
 * never contained, then confirms.
 *
 * usage: flow-draft.cjs <reqDir> <flowsDir> [--min-overlap 0.3] [--hub-threshold 6]
 * Refuses to overwrite existing FLOW files — flows are sponsor-owned once authored.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { yaml, loadReqs, draftFlows } = require('./flow-lib.cjs');

const [reqDir, flowsDir] = process.argv.slice(2);
function opt(f, d) { const i = process.argv.indexOf(f); return i >= 0 ? parseFloat(process.argv[i + 1]) : d; }
if (!reqDir || !flowsDir) { console.error('usage: flow-draft.cjs <reqDir> <flowsDir> [--min-overlap 0.3] [--hub-threshold 6]'); process.exit(2); }
const { byId } = loadReqs(reqDir);
if (!Object.keys(byId).length) { console.error(`flow-draft: no requirements under ${reqDir}`); process.exit(1); }
fs.mkdirSync(flowsDir, { recursive: true });
const existing = fs.readdirSync(flowsDir).filter(f => /^FLOW-\d+.*\.ya?ml$/i.test(f));
if (existing.length) { console.error(`flow-draft: ${flowsDir} already holds ${existing.length} FLOW file(s) — flows are sponsor-owned once authored; refusing to overwrite.`); process.exit(1); }
const drafts = draftFlows(byId, { minOverlap: opt('--min-overlap', 0.3), hubThreshold: opt('--hub-threshold', 6) });
for (const flow of drafts) {
  fs.writeFileSync(path.join(flowsDir, `${flow.ID}.yaml`), `# DRAFT — generated skeleton (PROP-057). Sponsor must route errors and confirm.\n` + yaml.dump(flow, { lineWidth: 100 }));
}
const unrouted = drafts.reduce((n, f) => n + f.ErrorRouting.length, 0);
console.log(`flow-draft: ${drafts.length} DRAFT flow(s) written to ${flowsDir}; ${unrouted} error(s) UNROUTED awaiting sponsor routing`);
