# ROME-PROP-043: Framework Ontology & Axiom Set

| Field | Value |
|-------|-------|
| **UID** | ROME-PROP-043 |
| **Title** | Framework Ontology & Axiom Set — Formal Entities, Relations, and Invariants with Enforcement Provenance |
| **Status** | Implemented |
| **Implemented In** | v2.4.0 "Vespasian" |
| **Implemented By** | `rome-core/docs/foundation/ontology.md` (ROME-ONT-001), `lexicon.md` v1.1 (companion fix), `check-framework-fidelity.sh` check 6 (AX-11), uid-registry v4.2 |
| **Author** | Archie |
| **Created** | 2026-07-14T00:00:00Z |
| **Targets** | `rome-core/docs/foundation/ontology.md` (NEW, ROME-ONT-001), `rome-core/docs/foundation/lexicon.md` (ROME-LEX-001, companion fix), UID registry |
| **Builds On** | ROME-STD-GATE (guard rules), ROME-STD-AGENT-ROLES (role/instance model), ROME-PROP-042 (artifact graph), ROME-PROP-038 (component topology) |

---

## Executive Summary

ROME has a **lexicon** (ROME-LEX-001) — a controlled vocabulary — and **relational structure implied** across standards (Role↔Gate ownership, Instance→Role, Requirement↔Artifact). It has **no formal ontology** and **no axiom set**: the invariants the framework guarantees exist as prose scattered across standards, or — stronger — as deterministic rules in `guard.js` that no document indexes as invariants.

This proposal introduces one foundation document — **Ontology (ROME-ONT-001)** — defining (a) the entity set, (b) the relation set with cardinalities, and (c) a numbered **axiom set** where each axiom carries **enforcement provenance**: `ENFORCED` (guard code), `CHECKED` (fidelity check), or `ASSERTED` (no mechanical check yet). The axiom set is **harvested first from already-enforced guard rules** (ROME-STD-GATE §3), then extended with checked and asserted invariants. The `ASSERTED` rows form the precise backlog for a follow-up enforcement proposal.

**Assessment:** MEDIUM VALUE, LOW–MEDIUM EFFORT. Additive documentation + a small lexicon correction. Converts implicit rules into citable IDs (`ROME-AX-###`) that gates, fidelity checks, and reviews reference instead of re-encoding prose.

---

## Problem Statement

### P1 — No formal ontology, only a taxonomy
The lexicon defines terms in isolation. It expresses no relations or cardinalities: "may an Instance fill two Roles?", "which transitions are gated?" cannot be answered from it.

### P2 — Invariants exist in three unindexed places
1. **Enforced code** — guard.js implements eight deterministic rules (ROME-STD-GATE §3) but nothing catalogs them as framework invariants.
2. **Standards prose** — separation-of-duties (EP-5), UID stability, traceability floors — stated in different documents, in different words, with no stable IDs.
3. **Fidelity check** — validates registry accuracy and cross-references against rules that exist only inside the script.

No single answer exists to "what does ROME guarantee is always true?", and nothing distinguishes guaranteed from merely intended.

### P3 — Lexicon is stale (companion defect)
ROME-LEX-001 states phases P0–P5 with a gate at each boundary. The active standard (ROME-STD-GATE) implements P0 → P0.5 → P1 → P2 → P3 → P3.5 → P4 → P5 → delivery, with **no gate on P0→next**. It also retains "Robot" as an entity, which ROME-STD-AGENT-ROLES §1 explicitly retires in favor of **Role / Instance**. The ontology must be built on the active standards, and the lexicon corrected, or the ontology institutionalizes drift.

---

## Proposed Solution

Create **`rome-core/docs/foundation/ontology.md`** (UID `ROME-ONT-001`, Document Type: Foundation) with the following content. Correct ROME-LEX-001 as a companion change.

### 1. Entity Set (`ROME-ENT-##`)

Aligned to active standards; lexicon owns definitions, ontology owns structure.

| Ent ID | Entity | Source of truth |
|--------|--------|-----------------|
| ENT-01 | Phase (incl. half-phases P0.5, P3.5) | ROME-STD-GATE §1 |
| ENT-02 | Quality Gate | ROME-STD-GATE |
| ENT-03 | Role (= capability; producer / validator / gate authority / orchestrator) | ROME-STD-AGENT-ROLES §1 |
| ENT-04 | Instance (sub-agent spawned from a Role) | ROME-STD-AGENT-ROLES §1 |
| ENT-05 | Orchestrator (Roma — distinguished Role) | ROME-STD-AGENT-ROLES §3 |
| ENT-06 | Sponsor (external approval/escalation actor; Seez MCP) | GATE-P3.5, PROP-039 B, PROP-041 |
| ENT-07 | Requirement (AORDL) | ROME-STD-AORDL |
| ENT-08 | Artifact (identity-stable; PROP-042) | traceability-standard |
| ENT-09 | Component (topology node) | PROP-038 |
| ENT-10 | Gate Verdict / Gate Ledger entry | ROME-STD-GATE §2 |
| ENT-11 | Blocker | ROME-STD-GATE §3.5 |
| ENT-12 | Document (UID-bearing) | uid-registry |

**Deprecation note:** "Robot" is retained in the lexicon only as a legacy alias → Role/Instance (per ROME-STD-AGENT-ROLES: "the legacy notion of a robot… is retired").

### 2. Relation Set (`ROME-REL-##`)

| Rel ID | Relation | Cardinality |
|--------|----------|-------------|
| REL-01 | Phase `guarded-by` Gate | Phase(1) → Gate(0..1) — P0 ungated; all others gated |
| REL-02 | Instance `fills` Role | Instance(N) → Role(1) |
| REL-03 | Orchestrator `spawns/coordinates` Instance | Orchestrator(1) → Instance(N) |
| REL-04 | Role `authorizes` Gate | Gate(N) → gate-authority Role(1) (currently Sarah) |
| REL-05 | Artifact `traces-to` Requirement | Artifact(N) ↔ Requirement(M) (PROP-042 edge store) |
| REL-06 | Artifact `belongs-to` Component | Artifact(N) → Component(1) |
| REL-07 | Requirement `depends-on` Requirement | N ↔ M (P2 dependency graph) |
| REL-08 | Document `identified-by` UID | Document(1) → UID(1) |
| REL-09 | Verdict `recorded-for` Gate `by` Role | append-only ledger |
| REL-10 | Sponsor `approves/escalated-to` Gate/Failure | GATE-P3.5 approval; PROP-039 B exhaustion |

### 3. Axiom Set (`ROME-AX-##`)

Each axiom: statement + constrained relations + **enforcement provenance**:
- `ENFORCED` — deterministic code refuses violation (cite module).
- `CHECKED` — a script detects violation after the fact (cite check).
- `ASSERTED` — no mechanical check yet (backlog for follow-up proposal).

Axioms are hard invariants by definition (MUST-only); SHOULD-level guidance stays in standards.

**Tier 1 — harvested from enforced guard rules (ROME-STD-GATE §3, `guard.js`):**

| ID | Axiom | Provenance |
|----|-------|------------|
| AX-01 | Only the current routed phase may advance. | ENFORCED (guard.js r1) |
| AX-02 | A gated phase advances only on an APPROVE for its gate. | ENFORCED (guard.js r2) |
| AX-03 | A verdict is accepted only from the gate's designated gate-authority role — self-approval is structurally impossible (EP-5). | ENFORCED (guard.js r3) |
| AX-04 | Latest verdict wins; a later BLOCK overrides an earlier APPROVE. | ENFORCED (guard.js r4) |
| AX-05 | Open blockers on a phase prevent advance. | ENFORCED (guard.js r5) |
| AX-06 | Phases cannot be skipped or reordered; advance moves exactly one step through P0→P0.5→P1→P2→P3→P3.5→P4→P5→delivery. | ENFORCED (guard.js r6) |
| AX-07 | A verdict on an ungated phase is rejected. | ENFORCED (guard.js r7) |
| AX-08 | A verdict is insufficient without its phase's required mechanical facts recorded AND passing in `state.verification` (traceability always; +secrets P4; +executability/testAdequacy/secrets/contracts P5). | ENFORCED (guard.js r8 / verification.js) |

**Tier 2 — checked:**

| ID | Axiom | Provenance |
|----|-------|------------|
| AX-09 | Every Document has exactly one UID, stable across revisions, resolvable in the UID registry. | CHECKED (fidelity-check c1/c2) |
| AX-10 | Every generated Artifact traces to ≥1 Requirement; at P5, every in-scope Requirement traces to code AND test. | CHECKED (verification.js traceability; PROP-042 edge store) |

**Tier 3 — asserted (enforcement backlog):**

| ID | Axiom | Provenance |
|----|-------|------------|
| AX-11 | Every Instance fills exactly one Role for its lifetime; roles do not blend within an instance. | ASSERTED |
| AX-12 | Separation of duties: for any artifact, producer role ≠ validator role ≠ gate-authority role. | ASSERTED (partially ENFORCED via AX-03) |
| AX-13 | Every Instance is spawned and coordinated by the Orchestrator; no instance self-transitions phases or spawns peers. | ASSERTED |
| AX-14 | P5 output derives strictly from P4 outputs + SPECs; P5 introduces no requirement absent upstream (zero contract drift at GATE-P5). | ASSERTED (drift portion ENFORCED via AX-08 `contracts`) |
| AX-15 | All BLOCKs, retries, and escalations are recorded; no silent recovery (EP-4); exhaustion escalates to the Sponsor. | ASSERTED |

### 4. Companion changes
- **ROME-LEX-001 corrections:** phase table gains P0.5/P3.5; "Robot" re-labeled legacy alias → Role/Instance; cross-link to ROME-ONT-001. (Term *definitions* otherwise unchanged.)
- **UID registry:** register `ROME-ONT-001`; note `ROME-ENT/REL/AX` as sub-document ID patterns (not standalone registry entries).
- Standards may cite `ROME-AX-###` and drop restated prose (non-blocking, incremental).

---

## Non-Goals
- No OWL/RDF or logic engine — axioms are structured English + ID + provenance.
- No new enforcement code — Tier 3 mechanization is a follow-up proposal (`PROP-044` candidate: promote ASSERTED → CHECKED/ENFORCED).
- No renaming of `agents/` content or `ROBOT.md` files (per ROME-STD-AGENT-ROLES: interpretation governs, files unchanged).

---

## Impact
- Additive: one new foundation doc + registry entries + a stale-lexicon fix.
- Gates, fidelity checks, and reviews gain a citable invariant source.
- `ASSERTED` rows constitute a precise, prioritized enforcement backlog.

---

## Open Questions

1. ~~Does the axiom set supersede prose invariants in standards, or annotate them?~~ **RESOLVED (sponsor, 2026-07-15): annotate.** Standards keep their prose and remain readable standalone; the ontology cross-references. The drafted "incremental cite-and-drop" was rejected as not a distinct position — it is *annotate* plus an unenforced intention to migrate, and unenforced intentions are what produced the STD-GATE drift this proposal's implementation uncovered. Revisit only with a mechanical check behind it.
2. ~~Should AX provenance be verified automatically?~~ **RESOLVED (sponsor, 2026-07-15): yes, now — not deferred to PROP-044.** Implemented as fidelity check 6 / AX-11: every cited `<module>.js#<function>` must exist. Verifying that cited code still *implements* its axiom requires a test and remains out of scope (see Non-Goals); that portion stays the PROP-044 candidate.

**All open questions resolved. Implemented in v2.4.0.**

---

## Revision History

| Rev | Date/Time (ISO 8601) | Summary |
|-----|----------------------|---------|
| v1.0 | 2026-07-14T00:00:00Z | Initial draft — ontology (entities, relations) + seed axiom set (AX-01..08). |
| v2.0 | 2026-07-15T00:00:00Z | Implemented in v2.4.0 "Vespasian". OQ1 resolved: annotate (not incremental cite-and-drop). OQ2 resolved: provenance existence verified now, as fidelity check 6 / AX-11. Corrections applied during implementation, from verifying all eight ENFORCED claims against the code: **AX-06 was wrong** — `lifecycle.js#resolveRouting` rejects reordering but permits omission of optional phases (P0.5, P3.5) by design, so "phases cannot be skipped" is not a guarantee ROME makes; restated as one-step-along-routing + no-reordering. **The `guard.js r1..r8` citations were unusable** — no such markers exist, and guard.js's header numbering (1–5) conflicts with ROME-STD-GATE §3's (1–8), so `r5` resolves to two different rules; provenance now cites STD-GATE rule numbers + `<module>.js#<function>`. **AX-08's fact table was stale** — it copied ROME-STD-GATE §3, which had itself drifted from `lifecycle.js` (missing `sponsorOq`/`matrix` from PROP-041/042); STD-GATE corrected to v1.1 first, as a prerequisite. Axiom count 15 → 16 (AX-11 added; rows below renumbered). Moved to implemented-proposals/. |
| v1.1 | 2026-07-14T00:00:00Z | Review revision: Robot→Role/Instance per ROME-STD-AGENT-ROLES; phase/gate model corrected per ROME-STD-GATE (P0 ungated, half-phases); axioms rebuilt from the eight enforced guard rules + enforcement-provenance field (ENFORCED/CHECKED/ASSERTED); added entities (Instance, Sponsor, Component, Verdict, Blocker) and relations (gate authority, req-dependency, artifact-component); lexicon staleness flagged as companion fix; severity question resolved (MUST-only). |
