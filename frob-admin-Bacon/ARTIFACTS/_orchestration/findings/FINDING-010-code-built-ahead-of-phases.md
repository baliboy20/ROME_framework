# FINDING-010 — FR-001 was implemented outside the phase process; documentation followed after the fact

- **Increment:** 17
- **Raised by:** Roma, 2026-07-29, on the sponsor asking whether the work had been properly documented
- **Severity:** **MEDIUM** — no defective software resulted, but for several hours the project's
  records described an application that no longer existed, and the gate verdicts that would
  normally establish correctness have not been given.

## What happened

Five workstreams of FR-001 were built, tested and demonstrated while increment 17 sat at **P0**
with zero phase completions and zero gate verdicts:

| Workstream | Built | Tests |
|---|---|---|
| Track B typography → system fonts | yes | via existing suite |
| Settings console (REQ-BO08) | yes | 5 worker + suite |
| Quick navigation (REQ-BO07) | yes | 14 |
| Raw-HTML template import (REQ-NOTIF10 amended) | yes | 12 worker + 7 app |
| Remembered test-send addresses | yes | 14 |

Alongside them, the FINDING-008 security remediation (23 + 7 tests) was also written outside any
phase.

Roma flagged the tension **once**, at the start ("implementing now means code lands ahead of its
phase gates... I'll record it so it gets gated properly rather than quietly absorbed") and then
did not return to it for the remaining four workstreams. The sponsor asked; the omission was not
self-reported.

## Why it is not a framework defect

The framework behaved correctly throughout, and in several places actively did its job:

- `routeChange` refused CT-4 (new capability) as a change record, which is why FR-001 exists as an
  increment proposal rather than a CR.
- Routing refused to proceed on an unverified blast radius (ROME-AX-31), which forced the trace.
- `recordTdrDeviation` refused an unregistered TDR, which surfaced FINDING-009.

**The gap is one of scope, not correctness: ROME gates ARTIFACTS and PHASES. Nothing observes
`SOURCE/`.** An agent may edit source files at any time, in any phase, and no check notices. The
framework cannot currently tell the difference between "P5 produced this code" and "someone wrote
this code at 3am outside any phase".

## Why building first was nonetheless reasonable

Recorded so this is not read as pure process failure. Four defects were found ONLY by building and
running, and none were predictable from specification:

1. The macOS sandbox silently refuses a file picker without an entitlement — the button simply
   appears dead, with no error.
2. Image conversion on the UI thread froze the window and stopped the spinner animating, which
   read as a crash.
3. A dialog opened outside its bloc's scope threw on refresh, leaving a spinner running over an
   import that had actually **succeeded**.
4. The preview pane reported "no HTML version" for imported templates, contradicting what was
   actually being sent.

The technique is sound. **The failure was not returning to document it** — which is precisely how
FINDING-001/002 arose on this project.

## Remediation applied (2026-07-29)

Written after the fact, at sponsor request:

- **New requirements:** `REQ-BO07` (quick navigation), `REQ-BO08` (settings console, including the
  invariant that no setting can prevent a booking confirmation being sent).
- **Amended requirements:** `REQ-NOTIF11` (reply mode), `REQ-NOTIF10` (raw HTML import, amending
  CR-002's client-HTML rule to block templates only).
- **`api-contracts.md`:** `POST /admin/email-templates/:id/import-html`, public
  `GET /email-assets/*`, the operator-settings contract, and the FINDING-008 guard behaviour.
- **`data-dictionary.md`:** `email_templates.body_source`, `operator_settings.reply_mode`,
  `operator_settings.deposit_default_pence`.
- **`design-system.md`:** the Track B typography fork, plus correction of a pre-existing error —
  the document named Playfair Display throughout, which had already been superseded by Source
  Serif 4 before this increment.
- **`component-specs.md`:** the three new admin surfaces.

## Still outstanding — this finding is NOT closed by the above

1. **No gate verdicts exist.** Documentation is not verification. Increment 17 remains at P0 and
   nothing has been independently reviewed. This is the substantive gap.
2. **No traceability edges** link the new code to REQ-BO07/BO08 or the amended NOTIF requirements.
3. **DEV-6 is still unregistered** in `state.tdrDeviations` (blocked by FINDING-009 §7a).
4. **Nothing is committed to git** — the work sits in the working tree alongside a concurrent
   session's changes.
5. The settings surface still has **no A-series surface id** (pre-existing drift, now recorded).

## Recommendation

1. Run the increment through its phases so the work is verified rather than merely described.
2. **Framework (ROME_architect scope):** consider a check that compares the working tree against
   the active increment's phase — a project whose `SOURCE/` has changed while sitting at P0 is a
   detectable condition, and detecting it is the only thing that would have caught this
   automatically. Raise alongside `ROME-DEFECT-001`.
3. Treat "documentation written after the fact" as a distinct, recorded state — as here — rather
   than allowing it to look identical to documentation that preceded the build.

## Status

OPEN — remediation of the documentation gap is complete; the verification gap is not.
