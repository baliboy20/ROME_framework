#!/usr/bin/env node
/** Run all orchestrator-core tests. Exit non-zero on any failure. */
const { execFileSync } = require('child_process');
const path = require('path');
const tests = ['guard.test.cjs', 'subagent.test.cjs', 'topology.test.cjs', 'executability.test.cjs', 'contracts.test.cjs', 'routing-budget.test.cjs', 'integration.test.cjs', 'visualize.test.cjs', 'driver.test.cjs', 'verification.test.cjs', 'impact-experts.test.cjs', 'security.test.cjs', 'sponsor-tdr.test.cjs', 'changes-upgrade.test.cjs'];
let failed = false;
for (const t of tests) {
  try { execFileSync('node', [path.join(__dirname, t)], { stdio: 'inherit' }); }
  catch { failed = true; }
}
process.exit(failed ? 1 : 0);
