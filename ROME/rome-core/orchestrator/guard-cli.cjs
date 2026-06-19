#!/usr/bin/env node
/**
 * Guard CLI — the deterministic enforcement entry point (ROME-PROP-035 §3.5).
 * The orchestrator MUST route transitions through this; it exits non-zero to
 * BLOCK, so it can be wired as a hook/guard over state.json mutations.
 *
 * Usage:
 *   guard-cli.cjs check   <state.json>
 *   guard-cli.cjs verdict <state.json> --phase P3 --verdict APPROVE --role sarah --ts <iso> [--note "..."]
 *   guard-cli.cjs advance <state.json> --ts <iso>
 *
 * Exit codes: 0 = allowed/done, 1 = BLOCKED/invalid, 2 = usage error.
 */
const { load, save } = require('./state');
const guard = require('./guard');

function arg(flag) { const i = process.argv.indexOf(flag); return i >= 0 ? process.argv[i + 1] : undefined; }

const cmd = process.argv[2];
const file = process.argv[3];
if (!cmd || !file) { console.error('usage: guard-cli.cjs <check|verdict|advance> <state.json> [opts]'); process.exit(2); }

try {
  const state = load(file);
  if (cmd === 'check') {
    const d = guard.canAdvance(state);
    console.log(`${d.ok ? 'ALLOW' : 'BLOCK'}: ${d.reason} (phase ${state.currentPhase})`);
    process.exit(d.ok ? 0 : 1);
  }
  if (cmd === 'verdict') {
    guard.recordGateVerdict(state, {
      phase: arg('--phase'), verdict: arg('--verdict'), role: arg('--role'),
      timestamp: arg('--ts'), note: arg('--note'),
    });
    save(file, state, arg('--ts'));
    console.log(`recorded ${arg('--verdict')} for ${arg('--phase')} by ${arg('--role')}`);
    process.exit(0);
  }
  if (cmd === 'advance') {
    guard.advance(state, arg('--ts'));
    save(file, state, arg('--ts'));
    console.log(`advanced → ${state.currentPhase || '(complete)'}`);
    process.exit(0);
  }
  console.error(`unknown command: ${cmd}`); process.exit(2);
} catch (e) {
  console.error(`BLOCK: ${e.message}`);
  process.exit(1);
}
