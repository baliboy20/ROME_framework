/**
 * TDR register integrity regression (ROME-PROP-056).
 * Tagged violation tests for AX-36 (register never shrinks silently; empty-
 * after-populated fails conformance) and AX-37 (deviation authority is
 * scope-bounded). Also reinforces AX-29 / AX-30 enforcement, whose guarantees
 * assumed a register that reflects reality.
 * Pure, headless. Run: node tests/tdr-integrity.test.cjs
 */
const { createState, active, finalizeIntake, load, save } = require('../state');
const { recordTdrDeviation, resolveTdrDeviation } = require('../guard');
const { checkTdrConformance } = require('../verification');
const fs = require('fs');
const os = require('os');
const path = require('path');

const TS = '2026-07-28T00:00:00Z';
let passed = 0, failed = 0;
function ok(name, cond) { if (cond) { console.log(`  ✓ ${name}`); passed++; } else { console.log(`  ✗ ${name}`); failed++; } }
function threw(re, fn) { try { fn(); return false; } catch (e) { return re.test(e.message); } }

function tdr(id, extra) { return Object.assign({ id, status: 'APPROVED', scope: 'stack', decision: 'x', binds: ['P3'] }, extra); }
function fresh() {
  const s = createState({ project: 'tdrint', frameworkVersion: '3.3.1', timestamp: TS });
  active(s).awaitingIntake = true;
  return s;
}
function populated() {
  const s = fresh();
  finalizeIntake(s, { routing: ['P1', 'P3', 'P5'], tdrs: [tdr('TDR-01'), tdr('TDR-02')] }, TS);
  return s;
}

console.log('TDR register integrity (PROP-056):');

// ── AX-36: no silent shrink ──────────────────────────────────────────────────
{
  const s = populated();
  finalizeIntake(s, { routing: ['P5'] }, TS); // no tdrs key
  ok('AX-36: intake with no tdrs key leaves populated register intact', s.tdrs.length === 2);
}
{
  const s = populated();
  ok('AX-36: explicit tdrs:[] without clearTdrs is refused',
    threw(/clearTdrs|shrink|drop/i, () => finalizeIntake(s, { routing: ['P5'], tdrs: [] }, TS)) && s.tdrs.length === 2);
}
{
  const s = populated();
  ok('AX-36: partial replacement losing an id without clearTdrs is refused',
    threw(/TDR-02/, () => finalizeIntake(s, { routing: ['P5'], tdrs: [tdr('TDR-01')] }, TS)));
}
{
  const s = populated();
  finalizeIntake(s, { routing: ['P5'], tdrs: [], clearTdrs: true }, TS);
  const audit = s.audit.find(a => a.event === 'TDR_REGISTER_REDUCED');
  ok('AX-36: clearTdrs:true clears and audits lost ids',
    s.tdrs.length === 0 && audit && audit.before === 2 && audit.lostIds.join() === 'TDR-01,TDR-02');
}
{
  const s = populated();
  s.tdrs = []; // simulate legacy damage
  const r = checkTdrConformance(s, 'P3', []);
  ok('AX-36: empty-but-ever-populated register fails conformance', r.pass === false && /AX-36/.test(r.detail));
}
{
  const s = fresh();
  finalizeIntake(s, { routing: ['P5'] }, TS);
  const r = checkTdrConformance(s, 'P3', []);
  ok('AX-36: never-populated register still passes trivially', r.pass === true);
}
{
  // load() derives tdrsEverPopulated + tdrDeviationSeq on legacy states
  const s = populated();
  delete s.tdrsEverPopulated;
  s.tdrDeviations = [{ id: 'DEV-4', tdr: 'TDR-01', status: 'SPONSOR_APPROVED' }];
  delete s.tdrDeviationSeq;
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'tdrint-')), 'state.json');
  save(f, s, TS);
  const l = load(f);
  ok('AX-36: load() derives tdrsEverPopulated and tdrDeviationSeq from history',
    l.tdrsEverPopulated === true && l.tdrDeviationSeq === 4);
}
{
  const s = populated();
  s.tdrDeviations = [{ id: 'DEV-4', tdr: 'TDR-01', status: 'SPONSOR_REJECTED' }];
  s.tdrDeviationSeq = 4;
  recordTdrDeviation(s, { tdr: 'TDR-01', phase: 'P3', reason: 'r', proposedAlternative: 'a', timestamp: TS });
  ok('AX-36: DEV ids are monotonic — never reminted after loss', s.tdrDeviations[1].id === 'DEV-5');
}

// ── AX-37: scope-bounded deviation authority ────────────────────────────────
{
  const s = populated();
  recordTdrDeviation(s, { tdr: 'TDR-01', phase: 'P3', scope: 'webapp-admin', reason: 'r', proposedAlternative: 'a', timestamp: TS });
  resolveTdrDeviation(s, { deviation: 'DEV-1', approved: true, sponsor: true, timestamp: TS });
  const t = s.tdrs.find(x => x.id === 'TDR-01');
  ok('AX-37: scoped approval carves out the scope, TDR stays APPROVED',
    t.status === 'APPROVED' && t.carveOuts.length === 1 && t.carveOuts[0].scope === 'webapp-admin');
  const r = checkTdrConformance(s, 'P3', []);
  ok('AX-37: carved TDR still binds its other scopes (conformance still requires citation)',
    r.pass === false && r.unaddressed.includes('TDR-01'));
  recordTdrDeviation(s, { tdr: 'TDR-01', phase: 'P3', scope: 'mobile-guide', reason: 'r', proposedAlternative: 'a', timestamp: TS });
  ok('AX-37: a second deviation on a different scope files successfully', s.tdrDeviations.length === 2);
  ok('AX-37: repeat deviation on an already-carved scope is refused',
    threw(/already carved/, () => recordTdrDeviation(s, { tdr: 'TDR-01', scope: 'webapp-admin', reason: 'r', proposedAlternative: 'a', timestamp: TS })));
}
{
  const s = populated();
  recordTdrDeviation(s, { tdr: 'TDR-01', phase: 'P3', reason: 'r', proposedAlternative: 'a', timestamp: TS }); // unscoped
  resolveTdrDeviation(s, { deviation: 'DEV-1', approved: true, sponsor: true, timestamp: TS });
  const t = s.tdrs.find(x => x.id === 'TDR-01');
  ok('AX-37: unscoped approval still supersedes the whole TDR (legacy semantics)',
    t.status === 'SUPERSEDED' && t.supersededBy === 'DEV-1');
  ok('AX-37: fully superseded TDR refuses further deviations',
    threw(/SUPERSEDED in full/, () => recordTdrDeviation(s, { tdr: 'TDR-01', scope: 'webapp-admin', reason: 'r', proposedAlternative: 'a', timestamp: TS })));
  // AX-29/AX-30 reinforcement: whole-TDR approved deviation exempts conformance
  const r = checkTdrConformance(s, 'P3', ['TDR-02']);
  ok('AX-29: whole-TDR sponsor-approved deviation exempts the TDR from citation', r.pass === true);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
