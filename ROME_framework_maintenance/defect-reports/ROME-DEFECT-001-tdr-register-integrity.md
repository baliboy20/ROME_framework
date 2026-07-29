# ROME-DEFECT-001 — TDR register integrity: two defects in the PROP-052 machinery

**Status:** Draft — for Archie's triage. PROP number not claimed.
**Raised from:** project `frob-admin-Bacon`, 2026-07-28, by Roma
**Against:** ROME-PROP-052, as implemented in `state.js`, `guard.js`, `verification.js`
**File:** `ROME_framework_maintenance/proposals/ROME-DEFECT-001-tdr-register-integrity.md`
**Severity:** HIGH

| # | Defect | Section |
|---|---|---|
| 1 | An intake carrying no TDRs silently erases a populated register | §1–§6 |
| 2 | A TDR can only ever be deviated from **once** — multi-component decisions become unamendable | §7a |

Both observed on a live project. **Defect 2 was found while remediating defect 1.**

---

## 1. Defect 1 in one line

`state.js#finalizeIntake` treats *"this intake carried no TDRs"* and *"clear the TDR register"* as the same instruction.

## 2. The offending line

```js
if (Array.isArray(routed.tdrs)) state.tdrs = routed.tdrs;
```

`Array.isArray([])` is `true`, so an empty array **replaces** a populated register. No shrinkage guard, no warning. The audit entry records only a count:

```js
state.audit.push({ event: 'INTAKE_FINALIZED', increment: inc.id, routing,
                   tdrs: (routed.tdrs || []).length, timestamp });
```

`tdrs: 0` reads as *"carried none"* — indistinguishable from *"seventeen just deleted"*.

## 3. Observed

| Increment | Timestamp | `tdrs` |
|---|---|---|
| 0 | 2026-07-21T20:45:17Z | **17** |
| 1 | 2026-07-27T10:03:02Z | **0** |

Increment 1 was a *change* increment with no reason to restate the project's technical decisions. It wiped all 17. Recovered intact from git (`7deff716`).

## 4. Worse than data loss — the gate goes quiet

```js
const binding = (state.tdrs || []).filter(t =>
  t.status === 'APPROVED' && (t.binds || []).includes(phase));
if (!binding.length) return { pass: true, ...,
  detail: `no APPROVED TDRs bind ${phase} — trivially conformant` };
```

Empty register → **`pass: true` unconditionally** at P3/P4/P5. Increments 2–16 all gated in that state, contradicting `guard.js:196-198`:

> "building past an unresolved deviation is structurally impossible"

**Silent in both directions:** the register empties without complaint, and the check then reports success rather than *"I have nothing to check."*

## 5. Second-order effect

```js
if (!target) throw new Error(`recordTdrDeviation: unknown TDR "${tdr}"`);
```

An empty register makes **every** deviation unfilable. Deviation ids are also positional — `DEV-${length + 1}` — so a register that loses entries re-mints existing ids. This project already has two distinct decisions both called `DEV-4`.

## 6. Proposed fix

1. **Absent means unchanged** — `if (Array.isArray(routed.tdrs) && routed.tdrs.length)`, with explicit `clearTdrs: true` for the genuine case.
2. **Audit any reduction** — record before/after counts and lost ids.
3. **Stop passing silently** — distinguish "never had a spec input" from "register was emptied"; warn or fail when artifacts cite TDRs but the register is empty.
4. **Non-positional deviation ids** — monotonic counter persisted in state.
5. **Migration** — a `rome-doctor` check for "artifacts cite TDRs, register empty".

---

## 7a. DEFECT 2 — a TDR can only ever be deviated from once

Found immediately after restoring the register, filing the already-sponsor-approved macOS deviation:

```
$ guard-cli.cjs deviation … file --tdr TDR-13 --phase P3 …
BLOCK: recordTdrDeviation: TDR TDR-13 is SUPERSEDED, not APPROVED — nothing to deviate from
```

**The trap.** `resolveTdrDeviation` sets the TDR to `SUPERSEDED` on approval; `recordTdrDeviation` then refuses anything not `APPROVED`. The first approved deviation permanently closes the TDR. There is no `amend`, no deviation-from-a-deviation, and no API to add or revise a TDR outside intake.

**Why this matters.** One TDR routinely spans several components. `TDR-13` fixes the frontend stack for **four** apps:

| Component | Changed by | Recorded? |
|---|---|---|
| `mobile-guide` | DEV-3 (iOS-native dropped) | yes — consumed the one slot |
| `webapp-admin` | DEV-5 (Web SPA → macOS) | **cannot be filed** |
| `webapp-customer` | — | — |
| `webapp-editor` | — | — |

Once DEV-3 landed, no further change to any *other* component under TDR-13 could be recorded. The only escape is a full re-intake replacing the whole register.

**This predicts the observed drift.** It explains why this project has sponsor-approved deviations living only in design documents — `DEV-5`, and the design-system's `DEV-4` (Track A, superseding TDR-15 for the customer webapp only, after DEV-1 had already superseded TDR-15). In both cases an earlier deviation had closed the TDR.

> **The drift is not carelessness — it is what the API leaves people no choice but to do.** That is the strongest argument this is a design gap, not a project failing.

**Options:**

1. **Scoped deviations** — `{tdr, scope}`; the TDR is superseded *for that scope*, other scopes stay APPROVED and deviable. ← *recommended: smallest change, fits the model (`binds` already shows TDRs are multi-axis)*
2. **Supersession chains** — deviate from the current head.
3. **A revise-TDR API** — sponsor issues TDR-13 rev 2 outside intake.

---

## 7. Regression test (defect 1)

```js
state.tdrs = [{ id: 'TDR-01', status: 'APPROVED', scope: 'stack',
                decision: 'x', binds: ['P3'] }];

finalizeIntake(state, { routing: ['P5'] }, ts);          // no tdrs key
expect(state.tdrs).toHaveLength(1);                       // currently passes

finalizeIntake(state, { routing: ['P5'], tdrs: [] }, ts); // explicit empty
expect(state.tdrs).toHaveLength(1);                       // currently FAILS
```

**The second assertion is the defect.**

---

## 9. Remediation already applied on `frob-admin-Bacon`

- `decisions.tdr.yaml` authored from `7deff716` verbatim; passes `validateTdrs` 17/17.
- Increment 17 opened; intake finalized with the spec input marked `Reliable` → **17 TDRs restored, 12 APPROVED, 0 downgraded**.
- `checkTdrConformance` now returns real failures (7 at P3, 6 at P4, 10 at P5) instead of "trivially conformant" — **the gate is live again**.
- **Defect 2 remains unresolved and blocking:** DEV-5 still cannot be filed, so the project carries a sponsor-approved deviation that orchestration state does not know about. That is the concrete cost of §7a.

## 8. Scope note

Raised from a project session, which does not change the framework. The fix belongs to `state.js`, `verification.js` and `guard.js`, and undermines **ROME-AX-29** and **ROME-AX-30**, both of which assume the register reflects reality.
