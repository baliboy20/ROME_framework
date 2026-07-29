#!/usr/bin/env node
/**
 * rome-doctor.cjs — project health check (ROME-PROP-056).
 * Read-only: reports TDR-register damage, never repairs it (restoration is a
 * sponsor action, recorded via the sanctioned APIs).
 *
 * usage: rome-doctor.cjs <projectDir>
 *
 * Checks:
 *   1. Register loss: ARTIFACTS cite TDR-## but state.tdrs is empty (AX-36).
 *   2. Duplicate deviation ids in state.tdrDeviations.
 *   3. Over-supersession advisory: whole-TDR SUPERSEDED entries listed for
 *      sponsor review — a legacy unscoped deviation may have closed a
 *      multi-component TDR that should be APPROVED with a carve-out (AX-37).
 * Exit: 0 clean, 1 findings, 2 usage/load error.
 */
const fs = require('fs');
const path = require('path');
const { load } = require('./state.js');

const projectDir = process.argv[2];
if (!projectDir) { console.error('usage: rome-doctor.cjs <projectDir>'); process.exit(2); }
const stateFile = path.join(projectDir, 'ARTIFACTS', '_orchestration', 'state.json');
if (!fs.existsSync(stateFile)) { console.error(`rome-doctor: no state.json at ${stateFile}`); process.exit(2); }
const state = load(stateFile);

function* walkFiles(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'node_modules' && e.name !== '.git') yield* walkFiles(p); }
    else if (/\.(md|ya?ml|json|txt)$/i.test(e.name)) yield p;
  }
}

const findings = [];

// 1. Register loss (AX-36)
if (!(state.tdrs || []).length) {
  const artifactsDir = path.join(projectDir, 'ARTIFACTS');
  const citing = [];
  if (fs.existsSync(artifactsDir)) {
    for (const f of walkFiles(artifactsDir)) {
      if (f === stateFile) continue;
      if (/\bTDR-\d+\b/.test(fs.readFileSync(f, 'utf8'))) citing.push(path.relative(projectDir, f));
    }
  }
  const everPopulated = state.tdrsEverPopulated ||
    (state.audit || []).some(a => a.event === 'INTAKE_FINALIZED' && a.tdrs > 0);
  if (citing.length || everPopulated) {
    findings.push(`REGISTER LOST (AX-36): state.tdrs is empty but ${everPopulated ? 'the audit trail shows it was populated' : 'artifacts cite TDRs'}${citing.length ? `; ${citing.length} artifact(s) cite TDR ids (e.g. ${citing.slice(0, 3).join(', ')})` : ''}. Restore via a sponsor-confirmed re-intake from decisions.tdr.yaml (git history is the source).`);
  }
}

// 2. Duplicate deviation ids
const seen = new Map();
for (const d of state.tdrDeviations || []) {
  if (seen.has(d.id)) findings.push(`DUPLICATE DEVIATION ID: ${d.id} appears more than once (targets ${seen.get(d.id)} and ${d.tdr}). Ids are minted from tdrDeviationSeq as of PROP-056 — re-id the later entry via sponsor decision.`);
  else seen.set(d.id, d.tdr);
}

// 3. Over-supersession advisory (AX-37)
for (const t of state.tdrs || []) {
  if (t.status === 'SUPERSEDED') {
    const dev = (state.tdrDeviations || []).find(d => d.id === t.supersededBy);
    findings.push(`ADVISORY over-supersession review: ${t.id} is SUPERSEDED in full by ${t.supersededBy || '(unknown)'}${dev && dev.scope ? '' : ' (unscoped legacy deviation)'}. If that deviation changed only one component, sponsor may reinstate ${t.id} as APPROVED with a carve-out (AX-37).`);
  }
}

if (!findings.length) { console.log('rome-doctor: no findings — TDR register healthy.'); process.exit(0); }
console.log(`rome-doctor: ${findings.length} finding(s)\n`);
for (const f of findings) console.log(`- ${f}`);
process.exit(1);
