# ROME-PROP-056 — TDR Register Integrity

Document UID: ROME-PROP-056
Status: Implemented (v3.3.1)
Document Type: Framework Proposal
Supersedes: ROME-DEFECT-001 (field defect report, frob-admin-Bacon, 2026-07-28)
Targets: `state.js`, `guard.js`, `verification.js`, new `rome-doctor` check, migration step
Axioms: introduces AX-36, AX-37; repairs enforcement of AX-29, AX-30

---

## In Plain Terms

A live project lost its entire list of recorded technical decisions (TDRs)
because one routine intake didn't mention them — the framework read "this
intake carried no decisions" as "delete all decisions." Worse, the quality
check that relies on that list reports *success* when the list is empty, so
nothing noticed. And separately: once a decision has been changed once, it can
never be changed again — even when the decision covers four apps and only one
of them changed. This proposal makes the decision register impossible to lose
silently, makes the empty-register case loud instead of green, lets a
multi-app decision be amended per app, and ships a repair path for projects
already damaged.

---

## 1. Defects (verified against v3.3.0 source)

### D1 — Intake silently erases the TDR register
`state.js#finalizeIntake`:
```js
if (Array.isArray(routed.tdrs)) state.tdrs = routed.tdrs;
```
`Array.isArray([])` is true → an empty (or absent-then-defaulted) `tdrs` array
replaces a populated register. Audit records only a count (`tdrs: 0`), making
deletion indistinguishable from "carried none."

Cascade:
- `verification.js#checkTdrConformance` returns `pass: true` ("trivially
  conformant") for an empty register → every P3/P4/P5 conformance pass after
  the wipe is a false pass, contradicting the guard's documented guarantee.
- `guard.js#recordTdrDeviation` throws `unknown TDR` for everything → the
  sanctioned deviation path is dead.
- Deviation ids are positional (`DEV-${length+1}`) → loss re-mints existing
  ids (observed: two distinct decisions both named DEV-4).

### D2 — A TDR can only ever be deviated from once
`guard.js#resolveTdrDeviation` sets the TDR to `SUPERSEDED` on approval;
`recordTdrDeviation` refuses any target not `APPROVED`. One approved deviation
permanently closes the whole TDR. For multi-component TDRs this is
semantically false (TDR-13 binds four apps; DEV-3 changed one, state marked
all four superseded) and operationally blocking (DEV-5, sponsor-approved,
cannot be filed). Field consequence: sponsor-approved decisions live only in
design documents — the API leaves no compliant path.

## 2. Changes

### 2.1 Shrink guard (D1) — `state.js#finalizeIntake`
- Key absent (`!('tdrs' in routed)`) → register unchanged.
- Key present and result would shrink the register → **refuse** (throw) unless
  `routed.clearTdrs === true`. Never silently ignore an explicit instruction
  in either direction; never silently honor a destructive one.
- Any accepted reduction audits `{ event: 'TDR_REGISTER_REDUCED', before,
  after, lostIds, clearTdrs: true, timestamp }`.

### 2.2 Non-silent conformance (D1) — `verification.js#checkTdrConformance`
- `state.tdrsEverPopulated: true` set whenever the register becomes non-empty
  (createState default false; `load()` derives from audit for older states).
- Empty register + `tdrsEverPopulated` → `pass: false`, detail
  "register emptied — nothing to check is a failure, not conformance."
- Empty register, never populated → unchanged trivial pass (correct for
  projects with no spec input).

### 2.3 Monotonic deviation ids (D1) — `guard.js#recordTdrDeviation`
- `state.tdrDeviationSeq` persisted counter; id = `DEV-${++seq}`.
- `load()` initializes seq to `max(existing DEV numbers)` so legacy states
  never re-mint.

### 2.4 Scoped deviations (D2) — `guard.js`
- `recordTdrDeviation` accepts optional `scope` (string; component/app id).
  Default (no scope) = whole-TDR — preserves current semantics for
  single-component TDRs.
- `resolveTdrDeviation` on approval:
  - whole-TDR scope → `status: 'SUPERSEDED'` (as today).
  - scoped → TDR stays `APPROVED`; append to `tdr.carveOuts:
    [{ scope, deviation, timestamp }]`. Fully carved-out TDRs (every bound
    scope carved) may be marked `SUPERSEDED` by a doctor pass, never
    automatically.
- Filing rule change: target must be `APPROVED`, **or** `SUPERSEDED` where the
  new deviation's scope is not already covered — refused only when the exact
  scope is already superseded/carved.
- `checkTdrConformance` evaluates the *effective* decision per scope: a
  carve-out exempts only its scope; all other scopes still bind.

### 2.5 Doctor check + migration (repair path)
- `rome-doctor` (or fidelity-style project check) flags:
  (a) artifacts cite `TDR-*` while register is empty;
  (b) `SUPERSEDED` TDRs whose approving deviation was narrower than the TDR's
      bound scopes (over-supersession) — recommend revert to
      APPROVED-with-carve-out;
  (c) duplicate DEV ids.
- Migration step `3.3.0 → 3.3.1` (PATCH — see §4): adds `tdrsEverPopulated`,
  `tdrDeviationSeq`, `carveOuts` defaults; doctor findings recorded in
  migration-log.md; register restoration from git history is a **sponsor**
  action recorded as semantics decisions, never auto-applied.

### 2.6 Regression tests — `tests/changes-upgrade.test.cjs` (or new suite)
Tagged AX-29/AX-30/AX-36/AX-37:
1. Intake with no `tdrs` key leaves populated register intact.
2. Intake with explicit `tdrs: []` and no `clearTdrs` → refused.
3. `clearTdrs: true` clears and audits lost ids.
4. Empty-but-ever-populated register → `checkTdrConformance` fails.
5. Never-populated register → trivial pass unchanged.
6. DEV ids monotonic across a simulated loss/restore.
7. Scoped deviation leaves TDR APPROVED, exempts only its scope.
8. Second deviation on a different scope of the same TDR files successfully;
   same-scope repeat refused.

## 3. New axioms

| ID | Statement | Enforcement |
|----|-----------|-------------|
| AX-36 | The TDR register never shrinks silently: absent input leaves it unchanged, explicit clearing requires `clearTdrs: true` and audits every lost id, and a register that was ever populated and is now empty fails conformance rather than passing it. | ENFORCED (`finalizeIntake` refusal + `TDR_REGISTER_REDUCED` audit; `checkTdrConformance` empty-register failure; tagged tests) |
| AX-37 | A deviation strips a TDR's authority only within its declared scope. Whole-TDR supersession requires whole-TDR scope; other scopes remain APPROVED and deviable. | ENFORCED (`recordTdrDeviation`/`resolveTdrDeviation` scope handling; per-scope `checkTdrConformance`; tagged tests) |

AX-29/AX-30 provenance rows gain the new tests (their existing enforcement
assumed a register that reflects reality; these changes make that assumption
hold).

## 4. Versioning

Target release **v3.3.1** (PATCH): state fields are additive with
`load()`-derived defaults; no artifact-convention change; older engines can
still read the state. Migration boundary `3.3.0-3.3.1` ships a declared step
(transforms: field defaults; gaps: none; doctor guidance in semantics notes) —
AX-35 satisfied.

## 5. Out of scope

- A general revise-TDR / add-TDR API outside intake (option 3 in the field
  report) — deferred; scoped deviations remove the observed blockage.
- Automatic register restoration from git — sponsor-gated by design.

---

## Revision History

| Rev | Date (ISO 8601) | Summary |
|-----|------------------|---------|
| v1.0 | 2026-07-28 | Initial draft from ROME-DEFECT-001 (frob-admin-Bacon field report) + Archie triage: shrink guard, non-silent conformance, monotonic DEV ids, scoped deviations, doctor/migration, AX-36/37. |
| v1.1 | 2026-07-28 | Implemented (v3.3.1): state.js/guard.js/verification.js/guard-cli.cjs amended; `rome-doctor.cjs` added; MIG-3.3.0→3.3.1 shipped; ontology v1.7, lexicon v1.7, uid-registry v4.18; 15 tagged tests in `tdr-integrity.test.cjs`, all green; moved to implemented-proposals/. |
