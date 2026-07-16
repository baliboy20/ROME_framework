# ROME-PROP-045: Verdict–Dispatch Binding

| Field | Value |
|-------|-------|
| **UID** | ROME-PROP-045 |
| **Title** | Verdict–Dispatch Binding — Make a Gate Verdict Provable Against a Real Gate-Role Dispatch, Not a Caller-Supplied String |
| **Status** | Draft |
| **Author** | Archie |
| **Created** | 2026-07-16T00:00:00Z |
| **Origin** | fob-admin Module-1 live run, defect D1 (CRITICAL) — `FRAMEWORK-DEFECTS-2026-07-15.md` |
| **Targets** | `rome-core/orchestrator/guard.js` (`recordGateVerdict`), `state.js` (dispatch record), `docs/foundation/ontology.md` (AX-03 provenance), `docs/standards/gate-decision-standard.md` |
| **Builds On** | ROME-STD-GATE (guard rules), ROME-PROP-035 (§3.5 deterministic enforcement), ROME-PROP-044 (`dispatch[].spawnedBy`, AX-03/AX-14 checks) |
| **Relates To** | D6 (return closes dispatch — fixed v2.6.0), D18 (phantom dispatch reconciliation) |

---

## Executive Summary

`guard.js#recordGateVerdict` enforces that a verdict's `role` equals the gate's
designated role. But `role` is a **string the orchestrator supplies**. The
orchestrator is an LLM. One line forges any gate:

```js
guard.recordGateVerdict(s, { phase:'P5', verdict:'APPROVE', role:'sarah', timestamp:ts });
```

No Sarah sub-agent need ever run. PROP-035's central safety claim — *"quality
guarantees hold even if the orchestrator model errs"* — currently reduces to
*"holds if the orchestrator is honest about a string"*, which is the exact
assumption the design says it does not make. `rome-core/README.md` and
ROME-STD-GATE both assert self-approval is "structurally impossible"; it is not.

This proposal **binds a verdict to evidence**: a verdict is accepted only when a
real dispatch of the gate role, for that phase, completed. The verdict cites a
`dispatchId`; the guard looks the role up **from the dispatch record** rather than
trusting a parameter. This upgrades ROME-AX-03 from "rejects a wrong-role string"
to "requires a real gate-role dispatch" — the property the docs already claim.

**Assessment:** HIGH VALUE, LOW–MEDIUM EFFORT. Small, deterministic, testable.
It does not achieve full rigour (a fully dishonest orchestrator can still fake a
dispatch record) — that needs an out-of-process transcript check, scoped as a
non-goal — but it closes the one-line hole and makes the forgery cost visible.

---

## Problem Statement

### P1 — The gate's identity check trusts its own input
`recordGateVerdict({ phase, verdict, role, timestamp })` (guard.js) checks
`role !== def.gate.role`. Both sides originate with the caller. Nothing ties the
verdict to a sub-agent that actually ran. The separation-of-duties guarantee
(EP-5) — which the fob-admin run showed doing *real* work, Sarah catching a genuine
schema gap — is only as strong as this check, and this check is forgeable.

### P2 — AX-03 overstates what it guarantees
ROME-AX-03 (v2.5.0): *"A verdict is accepted only from the gate's designated
gate-authority role — self-approval is structurally impossible."* The axiom's test
proves the guard rejects a **wrong-role string**. It does not prove a **right-role
string** corresponds to a real Sarah dispatch. The axiom is true as tested and
misleading as worded — exactly the "exists but doesn't guarantee what it says"
class PROP-044 Part A set out to close, one level up.

### P3 — The substrate to fix it already exists
`state.dispatch[]` records `{ agent, role, phase, status, spawnedBy, timestamp }`.
As of v2.6.0 (D6 fix) a return closes its dispatch to `COMPLETE`, and an unmatched
return is flagged. So "did a Sarah dispatch for this phase complete?" is already
answerable from state. The guard simply does not ask.

---

## Proposed Solution

### 1. Verdicts cite a dispatch
`recordGateVerdict(state, { phase, verdict, dispatchId, timestamp, note })`.
The `role` parameter is removed; the guard resolves it:

```js
const d = state.dispatch.find(x => x.agent === dispatchId);
if (!d)                       throw … 'verdict cites unknown dispatch';
if (d.phase !== phase)        throw … 'dispatch is for a different phase';
if (d.role !== def.gate.role) throw … 'dispatch role is not the gate authority';
if (d.status !== 'COMPLETE')  throw … 'gate dispatch has not completed';
```

The ledger entry records `dispatchId` alongside `gate/phase/verdict/role/timestamp`.
`role` is now **derived**, not asserted — a forged verdict must forge a whole
dispatch record with the right role, phase, and COMPLETE status.

### 2. AX-03 restated and re-provenanced
> AX-03 — A verdict is accepted only when bound to a completed dispatch of the
> gate's designated role for that phase. Self-approval requires forging a
> gate-role dispatch, not merely a string.

Provenance stays ENFORCED (`guard.js#recordGateVerdict`), with a new violation
test: a verdict citing a non-existent / wrong-role / wrong-phase / incomplete
dispatch is rejected.

### 3. Standard + README corrected
ROME-STD-GATE §1 and `rome-core/README.md`: "self-approval is structurally
impossible" → "a verdict must bind to a completed gate-role dispatch; forging one
requires fabricating that dispatch record" — precise about the actual guarantee.

---

## Non-Goals

- **Full trust rigour.** A dishonest orchestrator can still `recordDispatch` a fake
  Sarah, `processReturn` a fake completion, then cite it. Closing *that* needs an
  out-of-process check — a hook that verifies the sub-agent transcript exists and
  came from a real Task launch (pairs with D18 phantom-dispatch reconciliation).
  This proposal raises forgery cost from one line to a fabricated dispatch+return;
  the transcript hook is a separate follow-up.
- **No change to gate ownership, routing, or the `requires` table.**

---

## Impact

- The framework's headline safety property becomes true as stated.
- `recordGateVerdict`'s signature changes (`role` → `dispatchId`) — a breaking
  change to that internal API and to `guard-cli.cjs verdict`. Callers are all
  in-tree. **MINOR** if `verdict` CLI keeps accepting `--role` transitionally with
  a deprecation warning; otherwise a coordinated internal update.
- Directly strengthens the EP-5 separation the live run proved most valuable.

---

## Open Questions

1. **Transitional signature.** Remove `role` outright, or accept `{dispatchId}`
   OR `{role}` for one release with a warning on the legacy path? *(Recommend:
   dual-accept one release; the fob-admin state files use the old shape.)*
2. **How is `dispatchId` chosen?** Reuse the existing `agent` id (instance id) as
   the dispatch handle, or introduce a separate dispatch uuid? *(Recommend: reuse
   `agent` — D6 already keys dispatch closure on it; one identity, not two.)*
3. **Retro-gate for imported/legacy state** with verdicts but no dispatch binding —
   accept-with-warning, or refuse? *(Recommend: accept with a one-time WARN so
   existing delivered projects still load.)*

---

## Revision History

| Version | Date/Time (ISO 8601) | Summary |
|---------|----------------------|---------|
| 0.1 | 2026-07-16T00:00:00Z | Initial draft from fob-admin defect D1. Bind gate verdicts to a completed gate-role dispatch; derive `role` from the dispatch record instead of trusting a parameter. Restates AX-03 to match. Full transcript-level rigour scoped as a non-goal (follow-up, pairs with D18). Three OQs (transitional signature, dispatch handle identity, legacy state). |
