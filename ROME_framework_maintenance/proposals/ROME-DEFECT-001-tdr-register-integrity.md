# ROME-DEFECT-001 — TDR register integrity: two defects in the PROP-052 machinery

**Document UID:** ROME-DEFECT-001
**Status:** Draft — raised for Archie's triage; PROP number not claimed (Archie assigns).
**Document Type:** Defect Report
**Raised from:** project `frob-admin-Bacon`, 2026-07-28, by Roma (orchestrator session).
**Against:** ROME-PROP-052 (technical-spec standard) as implemented in
`state.js`, `guard.js`, `verification.js`.
**Project-side record:** `frob-admin-Bacon/ARTIFACTS/_orchestration/findings/FINDING-009-empty-tdr-registry.md`
**Severity:** HIGH — silent data loss, a gate reporting success while checking
nothing, and a second defect that makes a class of sponsor decision
unrecordable.

**Two distinct defects:**
| # | Defect | Section |
|---|---|---|
| 1 | An intake carrying no TDRs silently erases a populated register | §1–§6 |
| 2 | A TDR can only ever be deviated from once, so multi-component decisions become unamendable | §7a |

Both were observed on a live project; §7a was found while remediating §1.

---

## 1. The defect in one line

`state.js#finalizeIntake` treats "this intake carried no TDRs" and "clear the
TDR register" as the same instruction, so any increment whose intake does not
re-supply the full TDR set destroys it.

## 2. The offending line

`ROME/rome-core/orchestrator/state.js`, in `finalizeIntake`:

```js
if (Array.isArray(routed.tdrs)) state.tdrs = routed.tdrs;
```

`Array.isArray([])` is `true`. An empty array therefore **replaces** a populated
register rather than leaving it alone. There is no guard on shrinkage, no
warning, and the audit entry records only a count:

```js
state.audit.push({ event: 'INTAKE_FINALIZED', increment: inc.id, routing,
                   tdrs: (routed.tdrs || []).length, timestamp });
```

`tdrs: 0` reads as "this intake carried none" — indistinguishable from
"seventeen were just deleted".

## 3. Observed on a real project

`frob-admin-Bacon` has exactly two `INTAKE_FINALIZED` events:

| Increment | Timestamp | `tdrs` |
|---|---|---|
| 0 | 2026-07-21T20:45:17Z | **17** |
| 1 | 2026-07-27T10:03:02Z | **0** |

Increment 0 constituted 17 TDRs correctly. Increment 1 — a change increment,
which had no reason to restate the project's technical decisions — wiped all 17.

Recovered intact from git (`7deff716`), and internally consistent with the four
recorded deviations (TDR-12→DEV-4, TDR-13→DEV-3, TDR-15→DEV-1, TDR-16→DEV-2, all
`SUPERSEDED` with matching `supersededBy`). So the loss was purely the
assignment above, not corruption.

## 4. Why it is worse than data loss — the gate goes quiet

`verification.js#checkTdrConformance`:

```js
const binding = (state.tdrs || []).filter(t => t.status === 'APPROVED' && (t.binds || []).includes(phase));
if (!binding.length) return { pass: true, ..., detail: `no APPROVED TDRs bind ${phase} — trivially conformant` };
```

With an empty register there are never binding TDRs, so `tdrConformance`
returns **`pass: true` unconditionally** at P3, P4 and P5. On this project,
increments 2 through 16 all gated in that state.

This directly contradicts the guarantee stated in `guard.js:196-198`:

> "While OPEN, checkTdrConformance fails for that TDR's phases — building past
> an unresolved deviation is structurally impossible."

It has not been impossible on this project since 2026-07-27. Every
`tdrConformance` pass recorded since is a false pass.

**The failure is silent in both directions.** The register empties without
complaint, and the check then reports success rather than "I have nothing to
check". A project whose artifacts cite TDRs throughout gets a green light from a
register that knows of none.

## 5. Second-order effect — the deviation API becomes unusable

`guard.js#recordTdrDeviation`:

```js
const target = (state.tdrs || []).find(t => t.id === tdr);
if (!target) throw new Error(`recordTdrDeviation: unknown TDR "${tdr}"`);
```

Once the register is empty, filing **any** deviation throws `unknown TDR`. On
this project a sponsor-approved deviation (macOS platform) could not be
registered through the sanctioned path at all — it exists only in the design
artifacts, because hand-editing `state.json` was refused as a workaround.

Related: deviation ids are positional —

```js
const id = `DEV-${state.tdrDeviations.length + 1}`;
```

so a register that loses entries will re-mint ids that already exist. This
project already has two distinct decisions both called `DEV-4` (one in state,
one in the design system document).

## 6. Proposed fix

1. **Absent means unchanged.** Only replace the register when the caller
   explicitly supplies TDRs:

   ```js
   if (Array.isArray(routed.tdrs) && routed.tdrs.length) state.tdrs = routed.tdrs;
   ```

   with an explicit opt-in (e.g. `routed.clearTdrs === true`) for the genuine
   "this project no longer has TDRs" case.

2. **Audit any reduction.** If the register shrinks, record the before/after
   count and the lost ids — never let a decrease look identical to a no-op.

3. **Stop the check passing silently.** `checkTdrConformance` returning
   "trivially conformant" is correct for a project that never had a spec input,
   and wrong for one whose register was emptied. Distinguish the two — e.g. a
   `tdrsEverPopulated` marker, or derive it from the audit trail — and warn or
   fail rather than pass when a project has TDR citations but no register.

4. **Make deviation ids non-positional** (monotonic counter persisted in state),
   so id reuse is impossible after any loss.

5. **Migration:** projects already affected need their register restored from
   history. Worth a `rome-doctor`-style check that flags "artifacts cite TDRs,
   register is empty".

## 7. Suggested regression test

An intake that carries no TDRs must not empty a populated register:

```js
const state = createState(/* … */);
state.tdrs = [{ id: 'TDR-01', status: 'APPROVED', scope: 'stack',
                decision: 'x', binds: ['P3'] }];
finalizeIntake(state, { routing: ['P5'] }, ts);          // no tdrs key
expect(state.tdrs).toHaveLength(1);                       // currently passes
finalizeIntake(state, { routing: ['P5'], tdrs: [] }, ts); // explicit empty
expect(state.tdrs).toHaveLength(1);                       // currently FAILS
```

The second assertion is the defect.

## 7a. SECOND DEFECT — a TDR can only ever be deviated from once

Found 2026-07-28 immediately after restoring the register, attempting to file
the (already sponsor-approved) macOS deviation through the sanctioned API:

```
$ guard-cli.cjs deviation … file --tdr TDR-13 --phase P3 …
BLOCK: recordTdrDeviation: TDR TDR-13 is SUPERSEDED, not APPROVED — nothing to deviate from
```

**The trap.** `resolveTdrDeviation` sets the TDR to `SUPERSEDED` on approval;
`recordTdrDeviation` then refuses any TDR that is not `APPROVED`. So the first
approved deviation permanently closes the TDR to further deviation. There is no
`amend`, no deviation-from-a-deviation, and no API to add or revise a TDR
outside intake.

**Why that is not merely pedantic.** A single TDR routinely spans several
components. `TDR-13` fixes the frontend stack for **four** apps at once:

| Component | Changed by | Recorded? |
|---|---|---|
| `mobile-guide` | DEV-3 (iOS-native dropped) | yes — consumed the one slot |
| `webapp-admin` | DEV-5 (Web SPA → macOS) | **cannot be filed** |
| `webapp-customer` | — | — |
| `webapp-editor` | — | — |

Once DEV-3 landed, no further change to any *other* component covered by TDR-13
could be recorded. The decision is not wrong or stale — it is simply
unamendable, and the only escape is a full re-intake that replaces the whole
register.

**This predicts the observed drift.** It explains why this project has
sponsor-approved deviations living only in design documents rather than in
state — `DEV-5` (macOS) and the design-system's `DEV-4` (Track A Cream & Ink,
superseding TDR-15 *for the customer webapp only*, while DEV-1 had already
superseded TDR-15). In both cases an earlier deviation had closed the TDR, so
the later one had nowhere to go. **The drift is not carelessness; it is what the
API leaves people no choice but to do.** That is the strongest argument that
this is a design gap rather than a project failing.

**Options for the fix (framework judgement, not mine):**

1. **Scoped deviations** — `recordTdrDeviation({tdr, scope})`, where `scope`
   names the component/surface. A TDR is superseded *for that scope*; other
   scopes stay APPROVED and deviable. Fits how TDRs are actually written.
2. **Supersession chains** — allow deviating from the current head, so
   DEV-5 supersedes DEV-3's revision of TDR-13, and the head is what binds.
3. **A revise-TDR API** — let a sponsor issue TDR-13 rev 2 outside intake, with
   the old revision retained. Heavier, but closest to how a real decision log
   evolves.

Option 1 looks the best fit for the existing data model and is the smallest
change; the `binds` field already shows TDRs are expected to be multi-phase, and
multi-component is the same idea one axis over.

## 8. Scope note

Raised from a project session, which does not change the framework. The fix
belongs to `ROME/rome-core/orchestrator/state.js`, `verification.js` and
`guard.js`, and should be carried as a ROME proposal with an axiom check —
the behaviour undermines ROME-AX-29 and ROME-AX-30, which both assume the
register reflects reality.

## 9. Remediation already applied on `frob-admin-Bacon`

For reference — the project side is recovered, so this defect report is not
blocking that project:

- `ARTIFACTS/_config/decisions.tdr.yaml` authored from commit `7deff716`,
  verbatim, passing `intake.js#validateTdrs` (17/17).
- Increment 17 opened (`--intent extension`); intake finalized with the spec
  input marked `Reliable`, restoring **17 TDRs, 12 APPROVED, 0 downgraded**.
- `checkTdrConformance` now returns real failures (7 unaddressed at P3, 6 at
  P4, 10 at P5) instead of "trivially conformant" — the gate is live again.
- Defect 2 (§7a) remains **unresolved and blocking**: DEV-5 still cannot be
  filed, so the project continues to carry a sponsor-approved deviation in its
  design artifacts that orchestration state does not know about. This is the
  concrete cost of §7a and the reason it is not merely theoretical.

## Revision History

| Rev | Date (ISO 8601) | Summary |
|-----|------------------|---------|
| v1.0 | 2026-07-28 | Initial: defect 1 (register erased by empty-TDR intake), evidence, proposed fix, regression test. |
| v1.1 | 2026-07-28 | Added defect 2 (§7a — single-use deviation blocks multi-component TDR amendment), found while remediating defect 1; added §9 remediation record; relocated to `ROME_framework_maintenance/proposals/` per ROME-DEF-001. |
