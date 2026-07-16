# ROME-PROP-044: Axiom Enforcement & Role-Model Alignment

| Field | Value |
|-------|-------|
| **UID** | ROME-PROP-044 |
| **Title** | Axiom Enforcement & Role-Model Alignment — Promote ASSERTED Invariants to CHECKED/ENFORCED, Deepen Provenance from Existence to Behaviour, Align the `robot` Data Field |
| **Status** | Draft |
| **Author** | Archie |
| **Created** | 2026-07-16T00:00:00Z |
| **Targets** | `rome-core/orchestrator/` (new `axioms.js` checks + small `state.js`/`subagent.js` additions), `check-framework-fidelity.sh` (check 6 deepening), `docs/foundation/ontology.md` (provenance updates), `docs/operational/activity-log-format.md` + agent modes (field alignment) |
| **Builds On** | ROME-PROP-043 (ontology & axiom set — AX-01..16), ROME-STD-GATE, ROME-STD-AGENT-ROLES, ROME-STD-TRACE |
| **Companion To** | ROME-ONT-001 (this proposal reduces its ASSERTED tier) |

---

## Executive Summary

PROP-043 delivered the axiom set (ROME-AX-01..16) with three provenance tiers. It closed the **existence** gap (AX-11: every cited `<module>.js#<function>` must exist) but explicitly deferred two things as Non-Goals:

1. **Behavioural provenance.** AX-11 proves a cited function *exists*, not that it still *implements* its axiom. A rewritten `canAdvance` that silently stopped checking blockers passes check 6 today.
2. **The ASSERTED tier.** Five axioms (AX-12..16) carry no mechanical check — they are labelled intentions, not guarantees.

This proposal converts the backlog into work. **Finding from grounding against the code:** four of the five ASSERTED axioms are checkable from state the orchestrator *already records* (`dispatch[]`, `gateLedger`, `blockers`, `audit[]`, traceability `edges[]`); only AX-14 and part of AX-16 need small state additions. It also resolves the `robot`-field inconsistency flagged in v2.4.1 — which, crucially, is **doc/format-only**: `state.js` already separates `role` from `agent` (instance id), so no state migration is required.

**Assessment:** MEDIUM–HIGH VALUE, MEDIUM EFFORT. Turns five stated intentions into enforced or checked guarantees and makes the ENFORCED tier self-auditing. No change to the phase model or gate semantics.

---

## Problem Statement

### P1 — ENFORCED provenance is existence-only
Check 6 (AX-11) catches renames and deletions. It cannot catch a function that still exists but no longer enforces its axiom. The strongest tier of the ontology is verified at its weakest possible level. PROP-043's own implementation is the cautionary case: three drafted axioms were wrong about what the code did, caught only by manual reading.

### P2 — Five axioms are ASSERTED (unenforced intentions)
| Axiom | Claim | Today |
|-------|-------|-------|
| AX-12 | Every Instance fills exactly one Role for its lifetime. | No check |
| AX-13 | Separation of duties: producer ≠ validator ≠ gate-authority per artifact. | Gate-authority portion only, via AX-03 |
| AX-14 | Every Instance is spawned/coordinated by the Orchestrator; no self-transition or peer-spawn. | No check |
| AX-15 | P5 output introduces no requirement absent upstream. | Contract-drift portion only, via AX-08 |
| AX-16 | All BLOCKs, retries, escalations recorded; no silent recovery; exhaustion escalates to Sponsor. | Blockers recorded; retries/escalations not uniformly audited |

An `ASSERTED` axiom that reads like a guarantee but is unchecked is the exact failure mode this framework keeps hitting (cf. the STD-GATE drift fixed in v2.4.0).

### P3 — The `robot` data field contradicts the retired term
`activity-log-format.md` defines a `robot` field (`robot:ashok`), used 58× in the spec and 103× across agent modes. ROME-STD-AGENT-ROLES §1 retired "Robot" → Role/Instance, and `state.js` already models this correctly (`dispatch[] = { agent, role, ... }`). Only the human-facing log format and examples lag. The role axioms (AX-12/13/14) are about Role and Instance; enforcing them while the audit surface still says `robot` invites confusion in exactly the checks this proposal adds.

---

## Proposed Solution

Three parts. Parts A and B are the substance; Part C is the enabling cleanup.

### Part A — Behavioural provenance for ENFORCED axioms

Deepen AX-11 from "cited function exists" to "cited function is covered by a test asserting its axiom". Mechanism:

- A new test suite `tests/axioms.test.cjs` with one test per ENFORCED axiom (AX-01..08), each exercising the *violation* and asserting the guard refuses it. Most already exist implicitly in `guard.test.cjs`/`verification.test.cjs`; this suite maps them 1:1 to axiom IDs.
- Ontology provenance gains a test reference: `ENFORCED (guard.js#canAdvance; tests/axioms.test.cjs "AX-05")`.
- **Check 6 extension:** for each ENFORCED axiom, assert a test case tagged with its axiom ID exists. Still not a proof of correctness — but it fails if an axiom loses its test, closing the "exists but unenforced" gap to "exists, and a violation test guards it".

This is the honest ceiling short of formal verification, and it is the portion of OQ2 that PROP-043 deferred.

### Part B — Promote the ASSERTED tier

New module `rome-core/orchestrator/axioms.js` — pure functions over state, same shape as `guard.js`. Each returns `{ axiom, pass, violations[] }`. Wired into `verification.js` as recordable facts and surfaced by `guard-cli.cjs`.

| Axiom | Target tier | Mechanism | State needed |
|-------|-------------|-----------|--------------|
| AX-12 | CHECKED | No `agent` in `dispatch[]` appears with two different `role` values. | none (exists) |
| AX-13 | CHECKED | For each artifact: producing `agent`/`role` (from traceability `edges[]`) ≠ validating role ≠ gate-authority role (`gateLedger`). | none (exists) |
| AX-14 | CHECKED | Every `dispatch[]` entry carries `spawnedBy: <orchestrator>`; reject peer-spawn. | small: add `spawnedBy` to `recordDispatch` |
| AX-15 | CHECKED | Every `req` on a P5 `implements` edge ∈ the requirement set sealed at GATE-P4. | small: snapshot req-set at P4 |
| AX-16 | CHECKED→ENFORCED | Retries and escalations emit audit events (`RETRY`, `ESCALATE`); exhaustion (`executability.js`, `budget.js`) records an `ESCALATE` to sponsor. Gate advance may assert the escalation trail is complete. | small: audit vocabulary + escalation recording |

AX-13 and AX-15 remain **partially ENFORCED** at their gates via AX-03 and AX-08 respectively; Part B adds the *whole-artifact* / *whole-requirement-set* check those gates do not cover.

### Part C — Align the `robot` field (doc/format only)

- `activity-log-format.md`: `robot` field → `role` + `agent` (matching `state.js`), or retain `robot` as a documented legacy alias mapping to `role`. **(OQ-3 — see below.)**
- Agent-mode log examples updated to match.
- **No `state.js` change** — the orchestrator already records `role` and `agent` separately. This is why Part C is cleanup, not migration.

---

## Non-Goals

- **No formal verification.** Axioms remain structured English guarded by tests, not machine-proved. Part A raises the floor; it does not reach a proof.
- **No new axioms.** This proposal enforces the existing AX-01..16; new invariants are out of scope.
- **No phase/gate model change.** Gate ownership, routing, and the `requires` table are untouched.
- **No renaming of `ROBOT.md` files** (per ROME-STD-AGENT-ROLES: interpretation governs, filenames unchanged).

---

## Impact

- The ASSERTED tier shrinks from five axioms to zero (or near-zero, pending OQ-1).
- The ENFORCED tier becomes self-auditing: an axiom cannot silently lose its enforcement without a test failing.
- The audit surface (`activity-log-format`) stops contradicting the role model.
- New module + test suite; small, additive state fields. No breaking change to state shape → MINOR framework bump on implementation.

---

## Open Questions

1. **AX-16 target — CHECKED or ENFORCED?** Recording escalations is CHECKED. Making the guard *refuse advance* when the escalation trail is incomplete is ENFORCED but risks blocking legitimate flows on audit-completeness grounds. *(Recommend: CHECKED first; consider ENFORCED once the audit vocabulary has soaked.)*
2. **AX-13 scope of "producer".** Does separation-of-duties bind at the artifact level (producing agent ≠ validating agent) or the role level (producing role ≠ validating role)? The lexicon permits one Role, many Instances. *(Recommend: role-level, matching AX-03's gate-authority rule; artifact-level as a stricter opt-in.)*
3. **`robot` field — rename or alias?** Hard rename (`robot` → `role`/`agent`) is cleaner but touches 161 sites and any external log parser. Documented alias is backward-compatible but keeps the dead word visible. *(Recommend: alias now, hard rename in a MAJOR release with a migration note.)*

---

## Revision History

| Version | Date/Time (ISO 8601) | Summary |
|---------|----------------------|---------|
| 0.1 | 2026-07-16T00:00:00Z | Initial draft. Follows PROP-043: Part A (behavioural provenance — test-per-ENFORCED-axiom, deepening AX-11/check 6), Part B (promote ASSERTED AX-12..16 to CHECKED/ENFORCED via a new `axioms.js`), Part C (align the `robot` data field — doc/format only, since `state.js` already separates role/agent). Grounded against the orchestrator: four of five ASSERTED axioms are checkable from existing state. Three OQs open (AX-16 tier, AX-13 scope, robot rename-vs-alias). |
