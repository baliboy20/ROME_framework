#!/usr/bin/env node
/**
 * validate-flow — deterministic FLOW validation (ROME-PROP-057 / AX-38/39).
 * Backs the GATE-P1 required fact `flowValidation`. Also writes the DERIVED
 * reverse index (REQ → flows) to flow-index.json — never hand-author it.
 *
 * usage: validate-flow.cjs <flowsDir> <reqDir>
 * exit:  0 all flows valid · 1 violations · 2 usage
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { loadReqs, loadFlows, validateFlow, buildIndex } = require('./flow-lib.cjs');

const [flowsDir, reqDir] = process.argv.slice(2);
if (!flowsDir || !reqDir) { console.error('usage: validate-flow.cjs <flowsDir> <reqDir>'); process.exit(2); }
const { byId } = loadReqs(reqDir);
const flows = loadFlows(flowsDir);
if (!flows.length) { console.log(`validate-flow: no FLOW-*.yaml under ${flowsDir} (a project with no flows needs a recorded sponsor omission — AX-38)`); process.exit(0); }

let bad = 0;
for (const { doc, file } of flows) {
  const { errors, warnings } = validateFlow(doc, byId);
  const tag = errors.length ? 'FAIL' : 'PASS';
  if (errors.length) bad++;
  console.log(`${tag} ${file} (${doc && doc.ID} ${doc && doc.Status})`);
  errors.forEach(e => console.log(`  ✗ ${e}`));
  warnings.forEach(w => console.log(`  ! ${w}`));
}
const index = buildIndex(flows);
fs.writeFileSync(path.join(flowsDir, 'flow-index.json'), JSON.stringify(index, null, 2) + '\n');
const orphanReqs = Object.keys(byId).filter(id => !index[id]);
if (orphanReqs.length) console.log(`! ${orphanReqs.length} requirement(s) referenced by no flow (missing journey or dead requirement — sponsor dispositions): ${orphanReqs.slice(0, 8).join(', ')}${orphanReqs.length > 8 ? ', …' : ''}`);
console.log(`validate-flow: ${flows.length - bad}/${flows.length} valid; index written to flow-index.json`);
process.exit(bad ? 1 : 0);
