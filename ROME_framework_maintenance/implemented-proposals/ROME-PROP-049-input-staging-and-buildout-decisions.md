# ROME-PROP-049: Input Staging & Build-Out Decisions

| Field | Value |
|-------|-------|
| **UID** | ROME-PROP-049 |
| **Title** | Input Staging & Build-Out Decisions — Sponsor-Ordered Stages, Core-Subsystem Identification, and Declared Stubs with Due Dates |
| **Status** | Draft |
| **Author** | Archie |
| **Created** | 2026-07-16T00:00:00Z |
| **Origin** | Sponsor design session 2026-07-16 (multi-module ordering / MVP / core subsystems / stub decisions); fob-admin evidence: D2 root cause 2 (auth belonged to no slice), D5 (design system never produced), the undeclared `token: null` / hardcoded-fake-token stubs that shipped |
| **Targets** | `_user_input/raw-requirements/` staging convention, `agents/surveyor/` (program-level intake), `rome-core/orchestrator/intake.js` + `routing.js`, `state.js` (stage plan + stub ledger), `guard.js`/`verification.js` (stub expiry), `docs/foundation/lexicon.md`, `docs/foundation/ontology.md` |
| **Builds On** | ROME-PROP-047 (Surveyor intake, reliability gating), ROME-PROP-048 (increments — **staging is its intended front door**), ROME-PROP-038 (dependency topology), ROME-PROP-039/046 (contracts — stubs honor interface shape), ROME-PROP-041 (sponsor-authorized override pattern) |
| **Companion To** | ROME-PROP-048 (First-Class Increments) — the pair travel together: 048 gives growth its mechanics, 049 gives it its plan |

---

## In Plain Terms

*A jargon-free summary. The precise version, for the agents, is below.*

When a project has many modules, three questions decide everything: **what order do
we build in, what shared plumbing must exist first, and what can we fake for now and
finish later?** Today the framework answers none of them — a person works it out by
hand, and the record of those decisions lives nowhere.

This proposal answers all three with one idea: **you, the sponsor, express the plan
by organising your input documents into ordered stages** — and the framework reads,
checks, and enforces what you decided.

- **Order and MVP become curation, not computation.** Put the thin slice you want
  demoable first into `stage-1/`. Put the next layer in `stage-2/`. "The MVP" is
  simply whatever you put in stage 1 — the framework never has to guess your intent,
  because the folder structure *is* your intent. Shared plumbing (login, database
  schema, design system) goes in `stage-0/`, built first, used by everything after.
- **The framework checks your ordering instead of trusting it blindly.** Humans
  stage wrong. If something in stage 1 secretly needs something you put in stage 3,
  the input specialist (Surveyor) catches it at intake and asks you to reorder or
  explicitly accept it — before anything is built, not in a browser after delivery.
- **Surveyor also spots the plumbing nobody owns.** On the real project, login and
  the design system belonged to *no* module — so no module built them, and the
  shipped app couldn't log in and had no consistent look. Surveyor now scans the
  whole staged set for exactly these cross-cutting needs and recommends what belongs
  in stage 0.
- **You choose what's real and what's faked, per stage — and fakes get due dates.**
  For each shared subsystem and external service (payments, email, …), Surveyor
  presents you a simple choice per stage: *implement now, stub for now, or defer*.
  A **stub** is a stand-in that behaves like the real thing from the outside so the
  rest of the app can be built and demoed against it. The catch that makes this safe:
  every stub is **recorded with a deadline stage**, and the framework **refuses to
  finish** a stage whose due stubs are still fake, and refuses final delivery with
  any undeclared or expired stub. On the real project, undeclared fakes (a hardcoded
  login token) sailed through every check and shipped — the difference between a stub
  and a bug is a record, and now there is one.

One sentence: **you decide the shape of the build-out through your inputs; the
framework verifies it's consistent and holds you and itself to what was decided.**

---

## Problem Statement

### P1 — No program-level ordering; MVP has no home
ROME orders work by dependency *within* one increment (PROP-038 component topology)
but nothing orders the *module set*. "MVP for the whole product" — a thin cross-module
slice demoable first — is not a concept the framework has; per-requirement MVP
(`testAdequacy`) is a different altitude. On fob-admin, module order was chosen by the
orchestrator grepping sponsor notes by hand.

### P2 — Cross-cutting core subsystems belong to no module and fall through
PMA designs foundations *per slice, from the slice's requirements*. A subsystem every
module presumes but no module owns is invisible to it. Observed: authentication
belonged to Module 11 (out of slice) → PMA specified bearer auth anyway → Charlie
built a client for tokens nothing could issue → shipped product could not log in
(D2 root cause 2). Design system: never produced (D5) → 74-file restyle. Surveyor —
the only actor who ever sees all inputs — currently has no architectural vocabulary
at all.

### P3 — Stubs happen anyway, undeclared, and ship
fob-admin shipped `Session` registered with `token: null` and a hardcoded fake token
in `main.dart` — de-facto stubs no one declared, past analyze, 190 tests, and the
secrets scan. The implement-vs-stub decision is real and unavoidable in staged
build-outs; today it is made implicitly by generators and recorded nowhere.

---

## Proposed Solution

Four parts, one intake surface. All decisions are the sponsor's; all consistency
checks and enforcement are the framework's ("decide by input, verify by framework").

### Part A — Staging convention (order & MVP by curation)
- Inputs are staged: `_user_input/raw-requirements/stage-0/ … stage-N/` (or an
  equivalent `stages.yaml` manifest listing files per stage — OQ-1).
- **Stage 0** = foundation (core subsystems). **Stage 1** = the product MVP slice,
  *by definition*. Later stages = subsequent build-out.
- Each stage binds to one Increment (PROP-048); stage order is increment order.
  Unstaged inputs = single implicit stage (backward compatible).

### Part B — Stage validation (Surveyor, program-level intake)
- Surveyor reads the staging into the ICR (`stages[]`, each with inputs + reliability
  per PROP-047).
- **Dependency-consistency check:** a stage's requirements may depend only on
  same-or-earlier stages (PROP-038's topology discipline lifted to stage altitude).
  Violation → WARN + sponsor reorder-or-authorize (the AX-18 pattern). → **AX-22**.

### Part C — Core-subsystem identification & dangling presumptions
- Surveyor scans the full staged set for **cross-cutting core subsystems**: concerns
  multiple stages presume or any stage requires and none provides (auth, data schema,
  API skeleton, design system, hosting/CORS, …). Output: a core-subsystems section in
  the ICR recommending stage-0 contents.
- **Dangling-presumption check:** no stage may presume a subsystem no same-or-earlier
  stage provides (or stubs — Part D). Violation → WARN + sponsor resolution. → **AX-23**.
- Boundary preserved: Surveyor *identifies and recommends*; the sponsor approves the
  staging; **PMA designs** the foundation subsystems inside increment 0 as real
  requirements with real gates.

### Part D — The build-out decision matrix & the stub ledger
- For every identified core subsystem and external API, Surveyor presents the sponsor
  a decision per stage: **implement | stub | defer**, with recommendations. Choices are
  recorded in the ICR / stage plan.
- **Stub discipline:**
  - A stub honors the real contract shape (PROP-039/046 field-level members) — stub
    the implementation, never the interface. Integration facts (PROP-046) may run
    against a declared stub; the seam is still exercised.
  - Every stub is declared in a **stub ledger**: `{ subsystem, contract, stubbedIn,
    implementBy, sponsorDecision, timestamp }` (`state.stubs[]`).
  - Traceability edges produced against a stub are tagged `viaStub` — coverage reports
    read "satisfied (stubbed)", never plain "satisfied".
  - **Expiry enforcement:** the gate of a stub's `implementBy` stage refuses APPROVE
    while the stub survives; final delivery refuses any undeclared or expired stub.
    → **AX-24** (the *no-silent-stubs* invariant — would have caught the fob-admin
    fake token at the delivery gate).

---

## Ontology, Lexicon & Axiom Alignment

*In plain terms: the framework's dictionary, map, and rulebook gain the words "stage",
"core subsystem", and "stub" — and three new always-true rules: stages can't depend
forward, nothing may presume plumbing that doesn't exist yet, and every fake has a
recorded deadline it cannot outlive.*

Companion changes to ROME-LEX-001 / ROME-ONT-001 **on implementation**. (ID numbering
continues from PROP-048's draft reservations ENT-15/16, REL-14..17, AX-19..21; if 048's
allocations shift before implementation, renumber consistently.)

### Lexicon (ROME-LEX-001)
| Term | Definition |
|------|------------|
| **Stage** | A sponsor-ordered group of Inputs within `raw-requirements/`; binds to one Increment. Stage 0 = foundation; Stage 1 = the product MVP slice by definition. |
| **Core Subsystem** | A cross-cutting capability multiple Stages presume or consume (auth, data schema, API skeleton, design system, hosting). Identified by Surveyor; designed by PMA in the foundation Increment. |
| **Stub** | A sponsor-declared stand-in implementing a Contract's interface shape with substitute behaviour, carrying an `implementBy` Stage. Undeclared or expired stubs block gates (ROME-AX-24). |
| **Build-Out Decision** | The sponsor's recorded per-Stage choice for a Core Subsystem or external API: implement \| stub \| defer. |

### Ontology (ROME-ONT-001)
Entities: **ENT-17 Stage**, **ENT-18 Core Subsystem**, **ENT-19 Stub**.
Relations:
| Rel ID | Relation | Cardinality |
|--------|----------|-------------|
| REL-18 | Stage `contains` Input | Stage(1) → Input(N) |
| REL-19 | Increment `builds` Stage | Increment(1) → Stage(1) |
| REL-20 | Stage `provides/presumes` Core Subsystem | N ↔ M (basis of AX-23) |
| REL-21 | Stub `stands-in-for` Core Subsystem/Contract `until` Stage | Stub(1) → Subsystem(1), due Stage(1) |

### Axioms (ROME-ONT-001 §3)
| ID | Axiom | Provenance (on implementation) |
|----|-------|--------------------------------|
| AX-22 | A Stage's requirements depend only on same-or-earlier Stages; forward dependency blocks routing absent recorded sponsor authorization. | ENFORCED (intake/routing stage check) |
| AX-23 | No Stage presumes a Core Subsystem that no same-or-earlier Stage provides or stubs; a dangling presumption blocks routing absent recorded sponsor authorization. | ENFORCED (intake/routing subsystem check) |
| AX-24 | Every Stub is sponsor-declared with an `implementBy` Stage; that Stage's gate refuses APPROVE while the stub survives, and delivery refuses any undeclared or expired stub. | ENFORCED (`guard`/`verification` over `state.stubs[]`) |

Each with a tagged violation test (PROP-044 / check 6b).

---

## Non-Goals
- **No automatic decomposition or planning.** The framework never invents the staging,
  the MVP, or the stub choices — it reads, checks, and enforces the sponsor's.
- **No stub code generation.** Generators build stubs against contracts as normal P5
  work; this proposal governs the *decision and its lifecycle*, not the code.
- **No cross-increment contract versioning** (sealed-increment interface evolution) —
  the known gap recorded in PROP-048's non-goals; separate follow-up.

---

## Impact
- The three program-level questions (order, foundation, MVP) get formal, recorded,
  checked answers — with the sponsor deciding all three through input structure.
- Additive on top of PROP-048 (stage plan + stub ledger are new state; staging
  convention is opt-in — unstaged inputs behave as today). Version impact rides
  PROP-048's OQ-1: together they land in whatever release carries the increment
  schema (MAJOR if nested).
- The fob-admin failure classes this closes at intake or gate: build-order-by-hand,
  unowned auth/design-system, shipped undeclared fakes.

---

## Open Questions
1. ~~**Staging syntax.**~~ **RESOLVED (sponsor, 2026-07-17): both.** `stage-N/` directories are canonical and self-evident; an optional `stages.yaml` manifest stages without moving files.
2. ~~**Dependency detection at intake.**~~ **RESOLVED (sponsor, 2026-07-17): notes + judgement now, strict later.** Intake reads sponsor `depends:` notes plus Surveyor's own reading — WARN only. AX-22 turns STRICT at P2 (`stageConsistency` mechanical fact over the real requirement graph).
3. ~~**Subsystem catalogue.**~~ **RESOLVED (sponsor, 2026-07-17): seeded checklist + reading.** The checklist (auth, data schema, API skeleton, design system, hosting/CORS, observability) encodes exactly what fob-admin missed.
4. ~~**Stub verification depth.**~~ **RESOLVED (sponsor, 2026-07-17): yes.** A declared stub must pass the integration fact (PROP-046) against its contract shape in its own stage — a stub that can't honor the contract is a bug, not a stub.
5. ~~**Decision-matrix channel.**~~ **RESOLVED (sponsor, 2026-07-17): ICR + existing sponsor channel.** No new machinery.

**All open questions resolved. Build-ready.**

---

## Revision History

| Version | Date/Time (ISO 8601) | Summary |
|---------|----------------------|---------|
| 1.0 | 2026-07-17T00:00:00Z | Implemented in v3.0.0 "Antoninus" (MAJOR — state schema restructure per OQ-1, auto-migration ROME-MIG-002). All parts shipped with tagged violation tests; companion ONT/LEX changes applied (v1.3). 29 increment/staging regression tests; 313 total pass; fidelity green (6b covers 15 ENFORCED axioms). Moved to implemented-proposals/. |
| 0.1 | 2026-07-16T00:00:00Z | Initial draft from the sponsor design session. Four parts over one intake surface: (A) sponsor-ordered stages — MVP = stage 1 by curation, foundation = stage 0; (B) stage dependency-consistency (AX-22); (C) Surveyor core-subsystem identification + dangling-presumption check (AX-23), PMA designs in increment 0; (D) sponsor implement/stub/defer matrix + stub ledger with due-stage expiry (AX-24, no-silent-stubs). Companion ONT/LEX additions (ENT-17..19, REL-18..21). Five OQs; load-bearing: dependency detection at intake (OQ-2). |
