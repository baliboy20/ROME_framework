/**
 * FLOW artifact regression (ROME-PROP-057). Tagged violation tests for
 * AX-38 (flows sponsor-confirmed, never inferred into bindingness) and
 * AX-39 (no unrouted failure). Pure, headless.
 * Run: node tests/flows.test.cjs
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { validateFlow, buildIndex, renderMermaid, draftFlows } = require('../../lib/flow/flow-lib.cjs');
const { createState, active, recordFlowsOmission } = require('../state');
const { checkFlowValidation } = require('../verification');

const TS = '2026-07-29T00:00:00Z';
let passed = 0, failed = 0;
function ok(name, cond) { if (cond) { console.log(`  ✓ ${name}`); passed++; } else { console.log(`  ✗ ${name}`); failed++; } }
function threw(re, fn) { try { fn(); return false; } catch (e) { return re.test(e.message); } }

const REQS = {
  'REQ-001': { ID: 'REQ-001', Actor: 'Customer', Intent: 'create booking', Preconditions: ['catalog exists'], Postconditions: ['a booking draft exists'], Errors: [] },
  'REQ-002': { ID: 'REQ-002', Actor: 'Customer', Intent: 'submit payment', Preconditions: ['a booking draft exists'], Postconditions: ['booking is paid'], Errors: [{ error: 'card declined', message: 'Payment failed' }] },
};
function goodFlow() {
  return {
    ID: 'FLOW-001', Name: 'book and pay', Status: 'DRAFT', Trigger: 'actor: Customer — create booking',
    Steps: [
      { id: 'book', kind: 'req', req: 'REQ-001' },
      { id: 'pay', kind: 'req', req: 'REQ-002' },
      { id: 'notify', kind: 'system', action: 'send payment-failed email' },
      { id: 'done', kind: 'end', label: 'SUCCESS' },
      { id: 'failed', kind: 'end', label: 'PAYMENT_FAILED' },
    ],
    Transitions: [
      { from: 'book', to: 'pay', on: 'actor' },
      { from: 'pay', to: 'done', on: 'actor' },
      { from: 'notify', to: 'failed', on: 'system:email-sent' },
    ],
    ErrorRouting: [{ req: 'REQ-002', error: 'card declined', route: 'notify' }],
  };
}

console.log('FLOW artifacts (PROP-057):');

// ── validator ────────────────────────────────────────────────────────────────
{
  const r = validateFlow(goodFlow(), REQS);
  ok('valid draft flow passes with no errors', r.errors.length === 0);
}
{
  const f = goodFlow(); f.Steps[0].req = 'REQ-999';
  ok('V1: unknown REQ reference fails', validateFlow(f, REQS).errors.some(e => /V1/.test(e)));
}
{
  const f = goodFlow(); f.Transitions = f.Transitions.filter(t => t.from !== 'book');
  ok('V2/V3: broken chain fails (unreachable / no path to end)', validateFlow(f, REQS).errors.some(e => /V2|V3/.test(e)));
}
{
  const f = goodFlow(); f.ErrorRouting = [];
  ok('AX-39/V4a: unrouted declared error fails', validateFlow(f, REQS).errors.some(e => /V4a/.test(e)));
}
{
  const f = goodFlow(); f.ErrorRouting.push({ req: 'REQ-002', error: 'nonexistent condition', route: 'notify' });
  ok('V4b: routing for an undeclared error fails (stale route)', validateFlow(f, REQS).errors.some(e => /V4b/.test(e)));
}
{
  // UNROUTED variant: drop the failure branch entirely (unrouted = branch not designed yet)
  const f = goodFlow();
  f.ErrorRouting[0].route = 'UNROUTED';
  f.Steps = f.Steps.filter(s => !['notify', 'failed'].includes(s.id));
  f.Transitions = f.Transitions.filter(t => t.from !== 'notify');
  ok('AX-39: UNROUTED is a warning while DRAFT', validateFlow(f, REQS).errors.length === 0 && validateFlow(f, REQS).warnings.length === 1);
  f.Status = 'SPONSOR_CONFIRMED'; f.Confirmation = { sponsor: true, timestamp: TS };
  ok('AX-39: UNROUTED in a CONFIRMED flow is a failure', validateFlow(f, REQS).errors.some(e => /AX-39/.test(e)));
}
{
  const f = goodFlow(); f.Status = 'SPONSOR_CONFIRMED';
  ok('AX-38/V7: SPONSOR_CONFIRMED without recorded Confirmation fails', validateFlow(f, REQS).errors.some(e => /V7/.test(e)));
  f.Confirmation = { sponsor: true, timestamp: TS };
  ok('AX-38/V7: recorded Confirmation passes', validateFlow(f, REQS).errors.length === 0);
}
{
  const f = goodFlow(); f.Transitions[0].on = 'whenever';
  ok('V6: free-form trigger refused', validateFlow(f, REQS).errors.some(e => /V6/.test(e)));
}

// ── derived index + rendering ────────────────────────────────────────────────
{
  const idx = buildIndex([{ doc: goodFlow(), file: 'x' }]);
  ok('index derived from flows (REQ → FLOW)', idx['REQ-001'][0] === 'FLOW-001' && idx['REQ-002'][0] === 'FLOW-001');
  const mmd = renderMermaid(goodFlow());
  ok('mermaid rendered from artifact (error arrow included)', /flowchart TD/.test(mmd) && /error: card declined/.test(mmd));
}

// ── draft generation ─────────────────────────────────────────────────────────
{
  const drafts = draftFlows(REQS);
  ok('draft generated from pre/postcondition chain, Status DRAFT', drafts.length === 1 && drafts[0].Status === 'DRAFT' && drafts[0].Steps.some(s => s.req === 'REQ-002'));
  ok('AX-39: drafted errors start UNROUTED', drafts[0].ErrorRouting.every(r => r.route === 'UNROUTED'));
  const v = validateFlow(drafts[0], REQS);
  ok('draft is structurally valid (only UNROUTED warnings remain)', v.errors.length === 0);
}

// ── gate fact (checkFlowValidation + recorded omission) ─────────────────────
{
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rome-flows-'));
  const flowsDir = path.join(dir, 'flows'); const reqDir = path.join(dir, 'reqs');
  fs.mkdirSync(flowsDir); fs.mkdirSync(reqDir);
  const yaml = require(path.join(__dirname, '../../lib/node_modules/js-yaml'));
  for (const r of Object.values(REQS)) fs.writeFileSync(path.join(reqDir, `${r.ID}.yaml`), yaml.dump(r));
  const s = createState({ project: 'fl', frameworkVersion: '3.4.0', timestamp: TS });
  ok('AX-38: no flows + no recorded omission → gate fact fails', checkFlowValidation(s, { flowsDir, reqDir }).pass === false);
  const draft = goodFlow(); draft.ErrorRouting[0].route = 'UNROUTED';
  fs.writeFileSync(path.join(flowsDir, 'FLOW-001.yaml'), yaml.dump(draft));
  ok('AX-38: DRAFT flow at the gate → fails (confirm or remove)', checkFlowValidation(s, { flowsDir, reqDir }).pass === false);
  const confirmed = goodFlow(); confirmed.Status = 'SPONSOR_CONFIRMED'; confirmed.Confirmation = { sponsor: true, timestamp: TS };
  fs.writeFileSync(path.join(flowsDir, 'FLOW-001.yaml'), yaml.dump(confirmed));
  ok('AX-38: confirmed + validator-clean → gate fact passes', checkFlowValidation(s, { flowsDir, reqDir }).pass === true);
  ok('AX-38: non-sponsor omission refused', threw(/AX-38/, () => recordFlowsOmission(s, { sponsorAuthorized: false, timestamp: TS })));
  recordFlowsOmission(s, { sponsorAuthorized: true, reason: 'pure library, no journeys', timestamp: TS });
  ok('AX-38: recorded sponsor omission passes without flows', checkFlowValidation(s, {}).pass === true && active(s).flows.omitted === true);
  fs.rmSync(dir, { recursive: true, force: true });
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
