#!/usr/bin/env node
/** Run all orchestrator-core tests. Exit non-zero on any failure. */
const { execFileSync } = require('child_process');
const path = require('path');
// PROP-058 §2.8: every suite in this directory runs. The former hand-kept list
// silently omitted axioms, increments and intake.
const fs = require('fs');
const tests = fs.readdirSync(__dirname).filter(f => f.endsWith('.test.cjs')).sort();
let failed = false;
for (const t of tests) {
  try { execFileSync('node', [path.join(__dirname, t)], { stdio: 'inherit' }); }
  catch { failed = true; }
}
process.exit(failed ? 1 : 0);
