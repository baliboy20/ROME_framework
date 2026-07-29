/**
 * Change-type routing + convention upgrade regression (ROME-PROP-054 / PROP-055).
 * Tagged violation tests for AX-31, AX-32, AX-34, AX-35 (fidelity check 6b
 * reads the tags). AX-33 is ASSERTED (prose register) — no mechanical test.
 * Pure, headless. Run: node tests/changes-upgrade.test.cjs
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { VERDICT, PHASE_BY_ID } = require('../lifecycle');
const { createState, active, sealActive, queueChange, classifyChange, confirmChange, prioritizeChange, reopenChange, beginChange, save, load } = require('../state');
const { recordGateVerdict, advance } = require('../guard');
const { recordVerification } = require('../verification');
const { routeChange } = require('../routing');
const { blastRadius } = require('../impact');

const TS = '2026-07-27T00:00:00Z';
let passed = 0, failed = 0;
function ok(name, cond) { if (cond) { console.log(`  ✓ ${name}`); passed++; } else { console.log(`  ✗ ${name}`); failed++; } }
function threw(re, fn) { try { fn(); return false; } catch (e) { return re.test(e.message); } }
function satisfy(s, phase) { for (const k of PHASE_BY_ID[phase].requires || []) recordVerification(s, phase, k, true, null, TS); return s; }
function completeActive(s) {
  while (active(s).currentPhase) {
    const p = active(s).currentPhase;
    if (PHASE_BY_ID[p].gate) recordGateVerdict(s, { phase: p, verdict: VERDICT.APPROVE, role: 'sarah', timestamp: TS });
    satisfy(s, p);
    advance(s, TS);
  }
  return s;
}
function delivered() {
  const s = createState({ project: 'chg', frameworkVersion: '3.3.0', timestamp: TS });
  completeActive(s);
  sealActive(s, TS);
  return s;
}

console.log('changes + upgrade regression:');

// AX-31 — a change routes only on a trace-verified, sponsor-confirmed classification.
(() => {
  ok('AX-31 routeChange refuses an unverified blast radius', threw(/AX-31/, () => routeChange('CT-1', {})));
  ok('AX-31 classifyChange refuses an unverified blast radius', (() => {
    const s = delivered();
    const e = queueChange(s, { description: 'x', timestamp: TS });
    return threw(/AX-31/, () => classifyChange(s, e.id, { ct: 'CT-1', blastRadius: { verified: false }, timestamp: TS }));
  })());
  ok('AX-31 beginChange refuses an unconfirmed change', (() => {
    const s = delivered();
    const e = queueChange(s, { description: 'x', timestamp: TS });
    classifyChange(s, e.id, { ct: 'CT-1', blastRadius: blastRadius(s, {}), timestamp: TS });
    return threw(/AX-31/, () => beginChange(s, e.id, { routing: ['P5'], timestamp: TS }));
  })());
  ok('AX-31 CT-4 refused as a change record (A.1 delegation to increments)', threw(/A\.1|increment/, () => routeChange('CT-4', { verified: true })));
})();

// A.2 — blast-radius honesty: no graph → project-level ceiling, design widened.
(() => {
  const s = delivered();
  const br = blastRadius(s, { requirements: ['REQ-9'] });
  ok('A.2 no topology → granularityCeiling "project" + verified', br.granularityCeiling === 'project' && br.verified === true);
  const routed = routeChange('CT-3', br);
  ok('A.2 ceiling widens CT-3 routing to include design (P3)', routed.routing.includes('P3'));
  ok('CT-1 light path routes [P5] only', JSON.stringify(routeChange('CT-1', { verified: true }).routing) === '["P5"]');
})();

// AX-32 — every change path ends at a guard-evidenced gate; delivery only on seal.
(() => {
  const s = delivered();
  const e = queueChange(s, { description: 'button broken', timestamp: TS });
  classifyChange(s, e.id, { ct: 'CT-1', blastRadius: blastRadius(s, {}), timestamp: TS });
  confirmChange(s, e.id, { timestamp: TS });
  beginChange(s, e.id, { routing: routeChange('CT-1', { verified: true }).routing, timestamp: TS });
  ok('AX-32 change runs as a tagged increment', active(s).change && active(s).change.ct === 'CT-1');
  ok('AX-32 P5 gate still demands full evidence (advance refused bare)', threw(/./, () => advance(s, TS)));
  ok('AX-32 queue entry not delivered before seal', s.changeQueue[0].status === 'IN_PROGRESS');
  completeActive(s);
  sealActive(s, TS);
  ok('AX-32 sealing the change-scoped run delivers the queue entry', s.changeQueue[0].status === 'DELIVERED');
  ok('AX-32 change against unsealed scope refused', (() => {
    const t = createState({ project: 'u', frameworkVersion: '3.3.0', timestamp: TS });
    const q = queueChange(t, { description: 'y', timestamp: TS });
    classifyChange(t, q.id, { ct: 'CT-1', blastRadius: blastRadius(t, {}), timestamp: TS });
    confirmChange(t, q.id, { timestamp: TS });
    return threw(/sealed/, () => beginChange(t, q.id, { routing: ['P5'], timestamp: TS }));
  })());
})();

// AX-34 — declared conventionLevel; refuse forward compatibility.
(() => {
  const s = createState({ project: 'lvl', frameworkVersion: '3.3.0', timestamp: TS });
  ok('AX-34 createState declares conventionLevel = framework version', s.conventionLevel === '3.3.0');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rome-ax34-'));
  const sp = path.join(dir, 'ARTIFACTS/_orchestration/state.json');
  delete s.conventionLevel; delete s.upgrade; delete s.changeQueue;
  save(sp, s, TS);
  const re = load(sp);
  ok('AX-34 load defaults an undeclared level to the building version', re.conventionLevel === '3.3.0' && Array.isArray(re.changeQueue));
  // rome-upgrade refuses a project NEWER than the target (no forward compat)
  re.conventionLevel = '99.0.0'; save(sp, re, TS);
  const r = (() => { try { execFileSync('node', [path.join(__dirname, '..', 'rome-upgrade.cjs'), dir, '--ts', TS, '--to', '3.2.1'], { encoding: 'utf8' }); return { code: 0 }; } catch (e) { return { code: e.status, out: String(e.stderr) }; } })();
  ok('AX-34 upgrade refuses artifacts above the engine version', r.code !== 0 && /AX-34|NEWER/.test(r.out || ''));
  fs.rmSync(dir, { recursive: true, force: true });
})();

// AX-35 — the ladder refuses any boundary without a shipped step (never guesses).
(() => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rome-ax35-'));
  const s = createState({ project: 'lad', frameworkVersion: '2.0.0', timestamp: TS }); // no 2.0.0→x step shipped
  save(path.join(dir, 'ARTIFACTS/_orchestration/state.json'), s, TS);
  const r = (() => { try { execFileSync('node', [path.join(__dirname, '..', 'rome-upgrade.cjs'), dir, '--ts', TS, '--to', '3.2.1'], { encoding: 'utf8' }); return { code: 0 }; } catch (e) { return { code: e.status, out: String(e.stderr) }; } })();
  ok('AX-35 missing boundary step → upgrade refuses, never guesses', r.code !== 0 && /AX-35/.test(r.out || ''));
  // and the shipped contiguous ladder 3.0.0→3.2.1 composes clean (retro steps)
  const s2 = createState({ project: 'lad2', frameworkVersion: '3.0.0', timestamp: TS });
  save(path.join(dir, 'ARTIFACTS/_orchestration/state.json'), s2, TS);
  const out = execFileSync('node', [path.join(__dirname, '..', 'rome-upgrade.cjs'), dir, '--ts', TS, '--to', '3.2.1'], { encoding: 'utf8' });
  ok('AX-35 retro ladder 3.0.0→3.2.1 composes (4 boundaries, dry run)', /3\.0\.0→3\.1\.0/.test(out) && /3\.2\.0→3\.2\.1 \(no-op\)/.test(out));
  fs.rmSync(dir, { recursive: true, force: true });
})();

// ── PROP-054 v1.4: queue priority + stash ────────────────────────────────────
(() => {
  const s = createState({ project: 'prio', frameworkVersion: '3.3.1', timestamp: TS });
  const a = queueChange(s, { description: 'typo', priority: 'LOW', timestamp: TS });
  const b = queueChange(s, { description: 'crash', timestamp: TS });
  ok('priority: defaults NORMAL, accepts explicit level', b.priority === 'NORMAL' && a.priority === 'LOW');
  ok('priority: invalid level refused', threw(/priority/, () => queueChange(s, { description: 'x', priority: 'URGENT', timestamp: TS })));
  prioritizeChange(s, b.id, { priority: 'HIGH', timestamp: TS });
  ok('priority: sponsor re-rank recorded with audit', b.priority === 'HIGH' && s.audit.some(e => e.event === 'CHANGE_PRIORITIZED' && e.change === b.id));
  classifyChange(s, a.id, { ct: 'CT-2', blastRadius: { verified: true }, timestamp: TS });
  confirmChange(s, a.id, { park: true, timestamp: TS });
  reopenChange(s, a.id, { timestamp: TS });
  ok('stash: reopen restores CLASSIFIED, classification kept', a.status === 'CLASSIFIED' && a.ct === 'CT-2');
  ok('stash: reopen refuses a non-PARKED entry', threw(/not PARKED/, () => reopenChange(s, b.id, { timestamp: TS })));
  delete b.priority;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rome-prio-'));
  const f = path.join(dir, 'state.json');
  save(f, s, TS);
  ok('priority: load() defaults legacy entries to NORMAL', load(f).changeQueue.find(c => c.id === b.id).priority === 'NORMAL');
  fs.rmSync(dir, { recursive: true, force: true });
})();

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
