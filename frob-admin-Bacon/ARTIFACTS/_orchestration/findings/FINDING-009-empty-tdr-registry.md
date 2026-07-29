# FINDING-009 — The TDR register was silently erased by a later intake, disabling TDR conformance at every subsequent gate

- **Component:** orchestration (`state.json`) + framework (`state.js#finalizeIntake`)
- **Raised by:** Roma, 2026-07-28, while attempting to register DEV-6
- **Severity:** **HIGH** (raised from MEDIUM on evidence) — 17 ratified
  technical decisions were destroyed, and every `tdrConformance` verdict
  recorded since is a false pass.

> **Revision note.** The first version of this finding said the register "has
> been empty since before the upgrade" and was "never populated". That was
> wrong, and it understated the problem. The audit trail shows the register was
> populated with 17 TDRs and later wiped. Corrected below.

## What actually happened

`state.audit` holds exactly two `INTAKE_FINALIZED` events:

| Event | Increment | Timestamp | `tdrs` |
|---|---|---|---|
| INTAKE_FINALIZED | 0 | 2026-07-21T20:45:17Z | **17** |
| INTAKE_FINALIZED | 1 | 2026-07-27T10:03:02Z | **0** |

The 17 TDRs were properly constituted at increment 0. Increment 1's intake
finalized with an empty TDR array, and `state.js#finalizeIntake` does:

```js
if (Array.isArray(routed.tdrs)) state.tdrs = routed.tdrs;
```

`Array.isArray([])` is `true`, so an empty array **replaces** the register
rather than leaving it alone. The 17 decisions were erased in one assignment,
with no warning and no audit entry recording a loss — the event says `tdrs: 0`,
which reads as "this intake carried no TDRs", not "the register was destroyed".

This is the root cause. It is a **framework defect**, not a project mistake: a
change-increment intake that does not re-supply the TDR set silently wipes it.

## Consequence — every gate since has passed TDR conformance falsely

`verification.js#checkTdrConformance`:

```js
const binding = (state.tdrs || []).filter(t => t.status === 'APPROVED' && (t.binds || []).includes(phase));
if (!binding.length) return { pass: true, ..., detail: `no APPROVED TDRs bind ${phase} — trivially conformant` };
```

With an empty register there are never binding TDRs, so the fact returns
`pass: true` unconditionally at P3, P4 and P5. Increments 2–16 all gated under
this condition. The guarantee in `guard.js:196-198` — "building past an
unresolved deviation is structurally impossible" — has not held since
2026-07-27.

This also corrects `REVIEW-standards-conformance.md` finding T-1, which recorded
that conformance "passed via the deviation coverage path". It did not; it passed
because there was nothing left to check.

## Secondary finding — `DEV-4` identifies two different deviations

- `state.tdrDeviations` **DEV-4** = TDR-12, greenfield build, approved
  2026-07-21T22:16:42Z.
- `design-system.md` **DEV-4** = Track A Cream & Ink superseding TDR-15 for
  `webapp-customer`, "sponsor-approved 2026-07-28".

Two distinct decisions share one identifier, and the design-system one is not in
state at all. Because deviation ids are generated positionally
(`DEV-${state.tdrDeviations.length + 1}`), a register that loses entries will
mint colliding ids again. The documented DEV-4 needs a fresh id (DEV-6) when the
register is restored.

## Recovery — done, pending intake

The register is recoverable exactly: commit `7deff716` holds all 17 TDRs, and
they are internally consistent with DEV-1…DEV-4 (TDR-12→DEV-4, TDR-13→DEV-3,
TDR-15→DEV-1, TDR-16→DEV-2 all marked SUPERSEDED with matching `supersededBy`).

`ARTIFACTS/_config/decisions.tdr.yaml` (new) reproduces those 17 entries
verbatim — recovered, not re-authored from prose, so no authority is invented.
It **passes `intake.js#validateTdrs`** (verified, 17/17, schema OK).

`state.json` was NOT hand-edited to restore it: `CLAUDE.md` reserves that file
to `state.js`/`driver.js`, and `finalizeIntake` — the only writer — requires an
active unsealed increment. The register therefore restores at the **next
intake**, which is the sanctioned path.

## Recommendation

1. **At the next intake, supply `decisions.tdr.yaml`** and mark the carrying
   input **Reliable** — otherwise `applyCarrierReliability` downgrades all 17
   APPROVED entries to PROPOSED.
2. **Re-file DEV-6** (macOS) through `guard.recordTdrDeviation` once TDR-13 is
   back in the register; it currently exists only in the design artifacts.
3. **Give the design-system's "DEV-4" a distinct id** (DEV-6) and register it.
4. **Resolve TDR-13's double supersession.** The schema allows one
   `supersededBy`; TDR-13 is now superseded twice (DEV-3 for mobile-guide,
   DEV-6 for webapp-admin). Either model per-component supersession or record
   DEV-6 as superseding DEV-3's revision of TDR-13.
5. **Framework fix (ROME_architect scope):** `finalizeIntake` must not let an
   empty/absent `tdrs` array erase a populated register. Treat absent as "no
   change", require an explicit flag to clear, and audit any reduction in
   register size. An empty register on a project whose artifacts cite TDRs
   should warn, never silently pass as "trivially conformant".
6. **Treat every `tdrConformance` pass from 2026-07-27 onward as unverified.**

## Status

OPEN — raised 2026-07-28, recovery artifact prepared and validated, restoration
pending the next intake. Recommendation 5 belongs to the framework, not this
project, and should be raised as a ROME proposal.
