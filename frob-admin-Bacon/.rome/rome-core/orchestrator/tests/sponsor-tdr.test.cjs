/**
 * Sponsor checkpoint + TDR regression (ROME-PROP-051 / ROME-PROP-052).
 * Tagged violation tests for AX-27..AX-30 (fidelity check 6b reads the tags).
 * Pure, headless. Run: node tests/sponsor-tdr.test.cjs
 */
const { PHASE_BY_ID, VERDICT } = require('../lifecycle');
const { createState, active, finalizeIntake, recordAib, recordAibResponse } = require('../state');
const { recordDispatch, processReturn, validateReturn } = require('../subagent');
const { routeFromICR } = require('../routing');
const { recordGateVerdict, canAdvance, advance, recordTdrDeviation, resolveTdrDeviation } = require('../guard');
const { recordVerification, checkSponsorAib, checkEnvDivergence, checkTdrConformance } = require('../verification');
const { validateTdrs, applyCarrierReliability } = require('../intake');

const TS = '2026-07-17T00:00:00Z';
let passed = 0, failed = 0;
function ok(name, cond) { if (cond) { console.log(`  ✓ ${name}`); passed++; } else { console.log(`  ✗ ${name}`); failed++; } }
function threw(fn) { try { fn(); return false; } catch { return true; } }
function fresh() { return createState({ project: 'aib', frameworkVersion: 'test', timestamp: TS }); }
function satisfy(s, phase, except = []) {
  for (const k of PHASE_BY_ID[phase].requires || []) if (!except.includes(k)) recordVerification(s, phase, k, true, null, TS);
  return s;
}
/** Advance the active increment to the given phase. */
function driveTo(s, target) {
  while (active(s).currentPhase !== target) {
    const p = active(s).currentPhase;
    if (PHASE_BY_ID[p].gate) recordGateVerdict(s, { phase: p, verdict: VERDICT.APPROVE, role: 'sarah', timestamp: TS });
    satisfy(s, p);
    advance(s, TS);
  }
  return s;
}

console.log('sponsor checkpoint + TDR regression:');

// ── AX-27 — GATE-P3/P4 do not pass without a bound sponsor response ─────────
(() => {
  ok('AX-27 sponsorArch is a required P3 fact', PHASE_BY_ID['P3'].requires.includes('sponsorArch'));
  ok('AX-27 sponsorInfra is a required P4 fact', PHASE_BY_ID['P4'].requires.includes('sponsorInfra'));

  const s = driveTo(fresh(), 'P3');
  recordGateVerdict(s, { phase: 'P3', verdict: VERDICT.APPROVE, role: 'sarah', timestamp: TS });
  satisfy(s, 'P3', ['sponsorArch']);
  ok('AX-27 P3 advance refused with sponsorArch unrecorded', canAdvance(s).ok === false && /sponsorArch/.test(canAdvance(s).reason));

  // no AIB record at all → check fails
  ok('AX-27 no AIB record fails', checkSponsorAib(s, 'P3').pass === false);

  // response bound to a stale revision → fails; current revision CONFIRM → passes
  active(s).aib = { P3: { revision: 'r2', response: { type: 'CONFIRM', revision: 'r1', timestamp: TS } } };
  ok('AX-27 stale-revision confirmation refused', checkSponsorAib(s, 'P3').pass === false && /stale/.test(checkSponsorAib(s, 'P3').detail));
  active(s).aib.P3.response = { type: 'CONFIRM', revision: 'r2', timestamp: TS };
  ok('AX-27 current-revision CONFIRM passes', checkSponsorAib(s, 'P3').pass === true);

  // REDIRECT stays failing until reconfirmed
  active(s).aib.P3.response = { type: 'REDIRECT', revision: 'r2', timestamp: TS };
  ok('AX-27 open REDIRECT fails', checkSponsorAib(s, 'P3').pass === false);

  // DELEGATE is a first-class recorded answer…
  active(s).aib.P3.response = { type: 'DELEGATE', revision: 'r2', timestamp: TS };
  ok('AX-27 DELEGATE passes as recorded consent', checkSponsorAib(s, 'P3').pass === true);
  // …and never auto-extends to P4 (OQ-2): P4 has its own record.
  ok('AX-27 P3 DELEGATE does not satisfy P4', checkSponsorAib(s, 'P4').pass === false);

  // recording the passing fact unblocks the gate
  const arch = checkSponsorAib(s, 'P3');
  recordVerification(s, 'P3', 'sponsorArch', arch.pass, arch.detail, TS);
  ok('AX-27 gate passes once sponsor fact recorded', canAdvance(s).ok === true);

  // checkpoint omission: only with sponsor authorization
  const t = fresh();
  active(t).aib = { P3: { omitted: true } };
  ok('AX-27 omission without sponsor authorization fails', checkSponsorAib(t, 'P3').pass === false);
  active(t).aib.P3.sponsorAuthorized = true;
  ok('AX-27 sponsor-authorized omission passes', checkSponsorAib(t, 'P3').pass === true);
  // routing side: an ICR omitting the checkpoint needs sponsor authorization
  const icrBase = { qualityVerdict: 'SUFFICIENT', inputs: [{ form: 'docs', location: 'x.md', reliability: 'Reliable' }] };
  ok('AX-27 routing refuses unauthorized checkpoint omission', threw(() => routeFromICR({ ...icrBase, sponsorCheckpoint: false })));
  ok('AX-27 routing accepts sponsor-authorized omission', routeFromICR({ ...icrBase, sponsorCheckpoint: false, sponsorCheckpointAuthorized: true }).sponsorCheckpointOmitted === true);
})();

// ── AX-28 — dev/prod divergence must be declared (CHECKED) ──────────────────
(() => {
  ok('AX-28 missing devRuntimeDiffers declaration fails', checkEnvDivergence({}, {}).pass === false);
  ok('AX-28 declared true without note fails', checkEnvDivergence({ devRuntimeDiffers: true }, {}).pass === false);
  ok('AX-28 declared true with note passes', checkEnvDivergence({ devRuntimeDiffers: true, divergenceNote: 'dev uses in-memory store; prod uses Postgres' }, { devRuntimeDiffers: true }).pass === true);
  ok('AX-28 undeclared observed divergence fails', checkEnvDivergence({ devRuntimeDiffers: false }, { devRuntimeDiffers: true }).pass === false);
  ok('AX-28 no divergence declared or observed passes', checkEnvDivergence({ devRuntimeDiffers: false }, { devRuntimeDiffers: false }).pass === true);
})();

// ── AX-29 — binding APPROVED TDRs: cited, sponsor-deviated, or the gate holds ─
(() => {
  ok('AX-29 tdrConformance required at P3', PHASE_BY_ID['P3'].requires.includes('tdrConformance'));
  ok('AX-29 tdrConformance required at P4', PHASE_BY_ID['P4'].requires.includes('tdrConformance'));
  ok('AX-29 tdrConformance required at P5 (OQ-1)', PHASE_BY_ID['P5'].requires.includes('tdrConformance'));

  const s = fresh();
  ok('AX-29 no TDRs → trivially conformant', checkTdrConformance(s, 'P3').pass === true);

  s.tdrs = [
    { id: 'TDR-1', status: 'APPROVED', scope: 'data', decision: 'Postgres 16 via drizzle', binds: ['P3', 'P4'] },
    { id: 'TDR-2', status: 'APPROVED', scope: 'vendor', decision: 'Stripe for payments', binds: ['P4'] },
    { id: 'TDR-3', status: 'PROPOSED', scope: 'vendor', decision: 'email vendor open', binds: ['P4'] },
  ];
  ok('AX-29 unaddressed binding TDR fails', (() => { const r = checkTdrConformance(s, 'P3', []); return r.pass === false && r.unaddressed.includes('TDR-1'); })());
  ok('AX-29 PROPOSED TDR never binds', checkTdrConformance(s, 'P3', ['TDR-1']).pass === true);
  ok('AX-29 citation coverage passes', checkTdrConformance(s, 'P4', ['TDR-1', 'TDR-2']).pass === true);
  ok('AX-29 gate demands the fact at P3', (() => {
    const g = driveTo(fresh(), 'P3');
    recordGateVerdict(g, { phase: 'P3', verdict: VERDICT.APPROVE, role: 'sarah', timestamp: TS });
    satisfy(g, 'P3', ['tdrConformance']);
    return canAdvance(g).ok === false && /tdrConformance/.test(canAdvance(g).reason);
  })());

  // an OPEN deviation fails (pending sponsor); approval supersedes; rejection reinstates
  recordTdrDeviation(s, { tdr: 'TDR-2', phase: 'P4', reason: 'vendor gap', proposedAlternative: 'Adyen', timestamp: TS });
  ok('AX-29 OPEN deviation fails the check', (() => { const r = checkTdrConformance(s, 'P4', ['TDR-1']); return r.pass === false && r.pendingDeviations.includes('TDR-2'); })());
  resolveTdrDeviation(s, { deviation: 'DEV-1', approved: true, sponsor: true, timestamp: TS });
  ok('AX-29 sponsor-approved deviation covers the TDR', checkTdrConformance(s, 'P4', ['TDR-1']).pass === true);
  ok('AX-29 approved deviation supersedes the TDR', s.tdrs.find(t => t.id === 'TDR-2').status === 'SUPERSEDED');

  recordTdrDeviation(s, { tdr: 'TDR-1', phase: 'P3', reason: 'x', proposedAlternative: 'y', timestamp: TS });
  resolveTdrDeviation(s, { deviation: 'DEV-2', approved: false, sponsor: true, timestamp: TS });
  ok('AX-29 rejected deviation leaves the TDR binding', (() => { const r = checkTdrConformance(s, 'P3', []); return r.pass === false && r.unaddressed.includes('TDR-1'); })());
})();

// ── AX-30 — authority ≤ carrier reliability; only the sponsor deviates ──────
(() => {
  const tdrs = [
    { id: 'TDR-1', status: 'APPROVED', scope: 'stack', decision: 'x', binds: ['P3'] },
    { id: 'TDR-2', status: 'PROPOSED', scope: 'vendor', decision: 'y', binds: ['P4'] },
  ];
  const down = applyCarrierReliability(tdrs, 'RECONSTRUCTED');
  ok('AX-30 shaky carrier downgrades APPROVED to PROPOSED', down[0].status === 'PROPOSED' && down[0].downgraded === true && down[0].declaredStatus === 'APPROVED');
  ok('AX-30 non-APPROVED entries pass through untouched', down[1].status === 'PROPOSED' && !down[1].downgraded);
  ok('AX-30 Reliable carrier preserves authority', applyCarrierReliability(tdrs, 'Reliable')[0].status === 'APPROVED');

  const s = fresh();
  s.tdrs = [{ id: 'TDR-1', status: 'APPROVED', scope: 'stack', decision: 'x', binds: ['P3'] }];
  recordTdrDeviation(s, { tdr: 'TDR-1', reason: 'r', proposedAlternative: 'a', timestamp: TS });
  ok('AX-30 non-sponsor deviation resolution refused', threw(() => resolveTdrDeviation(s, { deviation: 'DEV-1', approved: true, timestamp: TS })));
  ok('AX-30 non-sponsor refusal leaves deviation OPEN', s.tdrDeviations[0].status === 'OPEN');
  ok('AX-30 sponsor resolution accepted', (() => { resolveTdrDeviation(s, { deviation: 'DEV-1', approved: true, sponsor: true, timestamp: TS }); return s.tdrDeviations[0].status === 'SPONSOR_APPROVED'; })());
  ok('AX-30 deviation on a non-APPROVED (superseded) TDR refused', threw(() => recordTdrDeviation(s, { tdr: 'TDR-1', reason: 'r', proposedAlternative: 'a', timestamp: TS })));

  // TDR schema validation is deterministic (no LLM in the authority loop)
  ok('AX-30 schema: bad id refused', validateTdrs([{ id: 'T1', status: 'APPROVED', scope: 'stack', decision: 'x', binds: ['P3'] }]).ok === false);
  ok('AX-30 schema: bad scope refused', validateTdrs([{ id: 'TDR-1', status: 'APPROVED', scope: 'framework', decision: 'x', binds: ['P3'] }]).ok === false);
  ok('AX-30 schema: empty binds refused', validateTdrs([{ id: 'TDR-1', status: 'APPROVED', scope: 'stack', decision: 'x', binds: [] }]).ok === false);
  ok('AX-30 schema: duplicate ids refused', validateTdrs([
    { id: 'TDR-1', status: 'APPROVED', scope: 'stack', decision: 'x', binds: ['P3'] },
    { id: 'TDR-1', status: 'PROPOSED', scope: 'vendor', decision: 'y', binds: ['P4'] },
  ]).ok === false);
  ok('AX-30 schema: well-formed set accepted', validateTdrs([{ id: 'TDR-1', status: 'APPROVED', scope: 'stack', decision: 'x', binds: ['P3', 'P4'] }]).ok === true);
})();

// ── Integration: intake finalization, AIB recording, citation flow ──────────
(() => {
  // finalizeIntake persists routing + TDRs + constraints (the F4 gap fix)
  const s = fresh();
  const icr = {
    qualityVerdict: 'SUFFICIENT', intent: 'greenfield',
    inputs: [{ form: 'spec', location: 'tech-spec.md', reliability: 'Reliable' }],
    tdrs: [{ id: 'TDR-1', status: 'APPROVED', scope: 'data', decision: 'Postgres 16', binds: ['P3', 'P4'] }],
    infraConstraints: { hosting: 'fly.io (existing account)' },
  };
  const routed = routeFromICR(icr);
  finalizeIntake(s, routed, TS);
  ok('finalizeIntake persists TDRs into state', s.tdrs.length === 1 && s.tdrs[0].id === 'TDR-1');
  ok('finalizeIntake persists infra constraints', s.infraConstraints.hosting === 'fly.io (existing account)');
  ok('finalizeIntake clears awaitingIntake + applies routing', active(s).awaitingIntake === false && active(s).routing.join() === routed.routing.join());

  // sponsor-authorized omission recorded as passing AIB records
  const o = fresh();
  finalizeIntake(o, routeFromICR({ ...icr, tdrs: [], sponsorCheckpoint: false, sponsorCheckpointAuthorized: true }), TS);
  ok('finalizeIntake records authorized checkpoint omission', checkSponsorAib(o, 'P3').pass === true && checkSponsorAib(o, 'P4').pass === true);

  // recordAib / recordAibResponse (the F3 gap fix)
  recordAib(s, 'P3', 'r1', TS);
  ok('recordAib issues a revision', checkSponsorAib(s, 'P3').pass === false);
  ok('recordAibResponse refuses a stale revision', threw(() => recordAibResponse(s, 'P3', { type: 'CONFIRM', revision: 'r0', timestamp: TS })));
  recordAibResponse(s, 'P3', { type: 'CONFIRM', revision: 'r1', timestamp: TS });
  ok('recordAibResponse CONFIRM satisfies checkSponsorAib', checkSponsorAib(s, 'P3').pass === true);
  recordAib(s, 'P3', 'r2', TS);
  ok('reissuing an AIB clears the prior response', checkSponsorAib(s, 'P3').pass === false);

  // tdrCitations: return-contract → processReturn → checkTdrConformance default source (the F2 gap fix)
  ok('validateReturn rejects malformed tdrCitations', validateReturn({ agent: 'a', role: 'pma', phase: 'P3', status: 'COMPLETE', summary: 's', artifacts: [], traceabilityEdges: [], tdrCitations: ['nope'] }).length > 0);
  recordDispatch(s, { agent: 'pma-1', role: 'pma', phase: 'P3', timestamp: TS });
  processReturn(s, { agent: 'pma-1', role: 'pma', phase: 'P3', status: 'COMPLETE', summary: 'design', artifacts: [], traceabilityEdges: [], tdrCitations: [{ tdr: 'TDR-1', artifact: 'tech-stack.yaml#persistence' }] }, TS);
  ok('processReturn accumulates citations per phase', (s.tdrCitations.P3 || []).some(c => c.tdr === 'TDR-1'));
  ok('checkTdrConformance defaults to accumulated citations', checkTdrConformance(s, 'P3').pass === true);
  ok('P4 still unaddressed (citations are per-phase)', checkTdrConformance(s, 'P4').pass === false);
})();

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
console.log('All sponsor-checkpoint + TDR tests passed!');
