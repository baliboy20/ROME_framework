# ROME-PROP-046: Integration Fact & Payload-Level Contracts

| Field | Value |
|-------|-------|
| **UID** | ROME-PROP-046 |
| **Title** | Integration Fact & Payload-Level Contracts — Verify the Running System End-to-End, and Compare Code to Contract by Shape, Not Just Route |
| **Status** | Draft |
| **Author** | Archie |
| **Created** | 2026-07-16T00:00:00Z |
| **Origin** | fob-admin Module-1 live run, defects D2 + D8b (both CRITICAL) — `FRAMEWORK-DEFECTS-2026-07-15.md` |
| **Targets** | `rome-core/orchestrator/lifecycle.js` (P5 `requires`), new `integration` fact source, `contracts.js` (payload members), `verification.js`, `docs/standards/gate-decision-standard.md` |
| **Builds On** | ROME-PROP-039 (executability), ROME-STD-GATE (P5 requires), ROME-PROP-044 (`axioms.js`) |
| **Relates To** | D8 (vacuous contract pass on empty consumer usage) |

---

## Executive Summary

At P5 the guard requires six facts —
`executability, testAdequacy, secrets, contracts, traceability, matrix`. All six
passed on the fob-admin run; Sarah approved; the lifecycle completed. **The
delivered product was non-functional in a browser.** No CORS, no auth path, and —
sharpest — the API returned snake_case rows while the gated, Sarah-approved
contract specified a camelCase nested shape. Producer and consumer agreed on all
25 URLs and disagreed on nearly every field. Every booking rendered blank.

Two blind spots, one root cause: **nothing runs the system, and the contract gate
compares route strings, not payload shapes.**

- `executability.js#verifyComponent` runs each component's *own* build/test in
  isolation. Nothing exercises the seam between them.
- `contracts.js` extracts route members (`POST /projects`) and does set arithmetic
  over them. Nothing looks at request/response schema.

Both test suites passed because each mocked the other side: `vitest` drove the API
in-process (no browser, no CORS preflight), `flutter test` used a mocked
ApiClient. 285 green tests, zero integration.

This proposal adds an **`integration` fact** to P5 (start the real system, drive
≥1 requirement end-to-end) and extends **contracts to field-level members** so the
gate that exists to catch payload drift actually can.

**Assessment:** HIGH VALUE, MEDIUM–HIGH EFFORT. This is the report's central
thesis made mechanical: ROME verifies artifacts-agree-with-each-other; this makes
it also check artifacts-correspond-to-a-running-system.

---

## Problem Statement

### P1 — "executability: VERIFIED" overstates what ran
`lifecycle.js:48` P5 requires `executability`; `executability.js#verifyComponent`
runs a single component's build/test steps. The name implies the system is
executable; the check proves each brick compiles. The integration seam — CORS,
auth, cross-service payloads — is never exercised. On this run that seam was broken
in three independent ways, all downstream of a green gate.

### P2 — The contracts gate is route-deep, not schema-deep (D8b)
`contracts.js` defines a contract as `{ id, kind, members:[string] }`; for
`kind:'api'`, members are route strings. `detectDrift` does set difference over
routes. `GATE-P5` recorded `contracts: produced=25 consumed=23 → NO DRIFT` while
the payload shapes were incompatible on nearly every field. The `members` doc
comment already hints at field-level identity (`Project.ownerId`) — the model
allows it; the extractor and comparison don't use it.

### P3 — Silent-pass failure modes compound it (D8)
`gateContracts` passes vacuously when a consumer uses nothing — a broken extractor
(0 routes found) reads as "NO DRIFT". So even the route-level check fails *open*
when its input is empty. (Fixable independently; folded in here as it shares the
contracts surface.)

---

## Proposed Solution

### Part A — The `integration` fact (P5)
Add `integration` to P5 `requires` in `lifecycle.js`. It is satisfied by starting
the **real system** and driving at least one in-scope requirement end-to-end —
the `run`/`verify` skill pattern already in the harness. Minimum bar:

- the system starts (all components up, real ports/origins);
- at least one requirement's happy path is exercised **across** the component seam
  (client → API → store → response), not in-process on one side;
- the response is asserted against the **contract shape** (ties to Part B), not the
  producer's own belief about its output.

Recorded like other facts via `verification.js#recordVerification`. STRICT at P5.

### Part B — Field-level contract members
Extend contract extraction/comparison from routes to **payload fields**:
`Booking.partySize`, `Booking.customer.email`, … `detectDrift` compares the
field sets (and optionally types) the producer emits against those the contract /
consumer expects. Cheapest realisation first:

1. contracts carry field-level members (the `members` comment already implies it);
   extract them from `api-design.md` and from real responses (the Part A run is the
   natural place to capture a live response);
2. optionally, generate the contract from `api-design.md` and validate responses
   against it;
3. optionally, shared generated types across producer/consumer.

### Part C — Contracts fail closed on empty usage (D8)
`gateContracts` (or `checkConsumer`) flags "consumer declared but zero usage
extracted" as a probable broken extractor rather than passing. Turns a silent green
into an explicit "verified nothing".

### Naming honesty
Rename the component-level check `componentExecutability` (or document clearly that
`executability` ≠ system works) so the fact name stops implying integration.

---

## Non-Goals

- **No full E2E test authoring per requirement.** The bar is *one* requirement
  end-to-end proving the seam is live, not a complete integration suite.
- **No new browser/runner infrastructure** beyond the existing run/verify skills.
- **Auth/CORS as requirements** is out of scope — those trace to input-completeness
  (D3/D4/D16), a separate proposal. This proposal ensures a broken seam is *seen*,
  wherever its root cause lies.

---

## Impact

- P5 gains a fact that would have caught all three fob-admin integration failures.
- `contracts: NO DRIFT` starts meaning "shapes match", not "URLs match".
- Additive P5 `requires` entry → projects re-gating at P5 must now produce the
  `integration` fact. **MINOR**, but it raises the P5 bar — existing in-flight
  projects need the new fact recorded. Phase in as WARN→STRICT (the PROP-041
  precedent) if a soak period is wanted.

---

## Open Questions

1. **Integration STRICT immediately, or WARN→STRICT?** STRICT is the point, but it
   blocks P5 for any project the harness can't start (offline deps, external
   services). *(Recommend: STRICT where the system is startable; a recorded,
   sponsor-authorized `integrationWaiver` for genuinely un-runnable stacks — reuse
   the PROP-041 deferral mechanism, not a silent skip.)*
2. **Payload comparison depth — fields only, or fields + types?** *(Recommend:
   field-set first (catches the snake/camel case that shipped); types as a fast
   follow.)*
3. **Does Part B belong here or in its own proposal?** D2 and D8b share a root
   cause (nothing compares to reality) and the Part A run is where a live response
   gets captured, so they are cheaper together. *(Recommend: keep together; split
   only if Part A lands first for schedule reasons.)*
4. **Where does the contract shape come from as source of truth** — `api-design.md`
   (the Sarah-approved doc) or generated types? *(Recommend: `api-design.md` — it
   was correct on the fob-admin run; the code was what diverged.)*

---

## Revision History

| Version | Date/Time (ISO 8601) | Summary |
|---------|----------------------|---------|
| 0.1 | 2026-07-16T00:00:00Z | Initial draft from fob-admin defects D2 + D8b. Part A: `integration` fact at P5 — run the real system, drive ≥1 requirement across the seam, assert response against contract. Part B: field-level contract members so drift detection sees payload shape, not just routes. Part C: contracts fail closed on empty consumer usage (D8). Naming: componentExecutability. Four OQs (STRICT-vs-WARN + waiver, comparison depth, A/B split, contract source of truth). |
