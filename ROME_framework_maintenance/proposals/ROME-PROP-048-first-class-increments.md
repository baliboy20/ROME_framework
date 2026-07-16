# ROME-PROP-048: First-Class Increments

| Field | Value |
|-------|-------|
| **UID** | ROME-PROP-048 |
| **Title** | First-Class Increments — Grow a Delivered Project Without Destroying Its Record |
| **Status** | Draft |
| **Author** | Archie |
| **Created** | 2026-07-16T00:00:00Z |
| **Origin** | fob-admin live run, defect D15 — `FRAMEWORK-DEFECTS-2026-07-15.md` |
| **Targets** | `rome-core/orchestrator/state.js`, `guard.js` (`isComplete`), new `rome-increment` command, `driver.js`, `docs/foundation/lexicon.md`, `docs/foundation/ontology.md`, `GETTING-STARTED.md` |
| **Builds On** | ROME-PROP-035 (state.json), ROME-PROP-042 (artifact-graph traceability), ROME-PROP-047 (Surveyor intake), ROME-PROP-043/044 (ontology/axioms) |
| **Companion To** | ROME-PROP-049 (Input Staging & Build-Out Decisions) — staging is the intended front door that decides increment order, foundation (stage 0), and the MVP slice (stage 1); this proposal supplies the execution mechanics |

---

## In Plain Terms

*A jargon-free summary. The precise version, for the agents, is below.*

Right now, a ROME project can be built **once** and then it's "done" — permanently.
There's no way to come back and add a second piece of work to a finished project.

Real projects aren't like that. You build Module 1 (say, bookings), ship it, then
want to add Module 2 (say, enquiries) to the same app. Today the only way to do that
is to **wipe the project's memory and start over**: the single file that records
everything — every quality-gate approval, every link from requirement to code, the
whole history — gets overwritten. Module 1's entire paper trail is destroyed just to
begin Module 2. On the real project this actually happened; the workaround was to
hand-copy the old record to a backup file before starting the next module, and even
then the new module couldn't "see" the old one's work.

This proposal makes **increments** a real thing the framework understands. An
increment is one added chunk of work — a module, a slice. The idea:

- Each increment keeps its **own** progress and approvals, so adding a new one never
  erases the old one's record.
- But they **share one map** of "which requirement is satisfied by which code," so at
  any point you can see the whole project's coverage, not just the latest piece.
- "Finished" becomes "this increment is finished" — the project itself is never sealed
  shut, so you can always add the next module.
- A new command (think `rome-increment`) adds a module to an existing project instead
  of the current one (`rome-start`) which only ever creates a brand-new one.

In short: today the framework can build a thing, but it can't help you **grow** it. The
docs even promise incremental change; the code doesn't deliver it. This closes that gap.

---

## Problem Statement

### P1 — `isComplete` is a terminal state with no exit (D15)
`guard.js#isComplete` is true when `currentPhase === null` and every routed phase is
COMPLETE. Nothing transitions out of it. A delivered project is a dead end.

### P2 — State models one lifecycle, not a growing set
`state.js#createState` produces a single `{ routing, phases, currentPhase, gateLedger,
verification }`. There is no `increment` / `module` / `slice` concept. Starting a
second module means overwriting `state.json` — destroying increment 1's gate ledger,
traceability edges, and audit trail, the very evidence PROP-035 calls the source of
truth.

### P3 — `impact.js` handles change, not growth
`computeImpact` / `applyChange` / `resolveDeferral` operate on **changes to existing
requirements** (staleness, deltas). None of them add a new module's worth of new
requirements over a shared traceability store. Change ≠ growth.

### Observed
After Module 1 delivered (67 audit entries, 5 APPROVE gates, 157 edges), starting
Module 11 required hand-archiving `state.json` and creating a fresh state beside it —
an orchestrator workaround, not a framework feature. The new increment's gates could
not see the previous increment's traceability, so whole-project coverage could only
be reassembled by reading multiple files. Nothing knew increment 2 related to
increment 1.

---

## Proposed Solution

Make the **Increment** a first-class unit.

### Part A — Per-increment lifecycle over a shared project record
- `state.increments[]` — each `{ id, routing, phases, currentPhase, gateLedger,
  verification, budget, intent }`. This is the per-increment lifecycle.
- **Project-level, shared across increments**: `project`, `framework`, `traceability`
  (the artifact graph — PROP-042), `audit`. Coverage is therefore project-wide by
  construction; a requirement in increment 2 and its code live in the same edge store
  as increment 1's.
- Each traceability edge is tagged with its `increment` so per-increment and
  whole-project views are both derivable.

### Part B — `isComplete` becomes per-increment; the project never seals
- `isComplete(state, incrementId)` — the *increment* is complete. The project has no
  terminal state; a new increment can always begin.
- `driver.nextAction` operates on the active increment.

### Part C — `rome-increment` adds to an existing project
- New command: `rome-increment <projectDir> --intent … --ts …`. It reads the existing
  `state.json`, appends a new increment (via Surveyor intake on the new module's inputs
  — PROP-047), and **never overwrites** the prior increments' records.
- A new increment's gates may **read** prior increments' traceability (a new module may
  depend on a delivered one), but cannot mutate a sealed increment's ledger.

---

## Ontology, Lexicon & Axiom Alignment

*In plain terms: the framework's dictionary, map, and rulebook don't yet know what an
"increment" is. This adds it, and turns "don't destroy the old record" into a stated
rule the code enforces.*

Companion changes, applied to ROME-LEX-001 and ROME-ONT-001 **on implementation**.

### Lexicon (ROME-LEX-001)
| Term | Definition |
|------|------------|
| **Increment** | One added unit of work (a module/slice) with its own lifecycle (routing, phases, gates) over the project's shared traceability store. |
| **Project** | The whole, one or more Increments sharing a traceability store, audit, and framework provenance. |

### Ontology (ROME-ONT-001)
Entities: **ENT-15 Increment**, **ENT-16 Project**.
Relations:
| Rel ID | Relation | Cardinality |
|--------|----------|-------------|
| REL-14 | Project `contains` Increment | Project(1) → Increment(N) |
| REL-15 | Increment `has` Lifecycle (routing/phases/gates) | Increment(1) → Lifecycle(1) |
| REL-16 | Increment `shares` Traceability store | Increment(N) → Traceability(1) — project-wide |
| REL-17 | Requirement `belongs-to` Increment | Requirement(N) → Increment(1) |

### Axioms (ROME-ONT-001 §3)
| ID | Axiom | Provenance (on implementation) |
|----|-------|--------------------------------|
| AX-19 | Adding an Increment preserves every prior Increment's gate ledger, traceability, and audit — append-only, never overwrite. | ENFORCED (`rome-increment` / `state.js`) — the anti-D15 invariant. |
| AX-20 | Whole-project requirement coverage is the union of coverage across all Increments (one shared traceability store). | CHECKED (`verification.js` over `traceability` tagged by increment). |
| AX-21 | A Project has no terminal state; `isComplete` is per-Increment, and a new Increment may always begin. | ENFORCED (`guard.js#isComplete(state, incrementId)`). |

Each ENFORCED axiom gets a tagged violation test (PROP-044 Part A / check 6b).

---

## Non-Goals

- **No cross-increment requirement rewriting.** Changing a delivered increment's
  requirements is still `impact.js` change-management (PROP-040), not this.
- **No automatic module decomposition.** The sponsor/Surveyor decides increment
  boundaries; the framework tracks them.
- **No change to the phase model or gate semantics within an increment.**

---

## Impact

- Real multi-module projects become supported, not a manual archive-and-recreate hack.
- **This is a `state.json` schema change** — the single-lifecycle shape becomes
  per-increment. That is the crux: it is either a **MAJOR** bump (v3.0.0) with a
  migration (`ROME-MIG-###` turning an existing state into "increment 0"), or a
  backward-compatible wrapper. See OQ-1.
- Whole-project coverage and audit become first-class, not reassembled by hand.

---

## Open Questions

1. **Schema model — nested (breaking) or wrapper (compatible)?** (a) Restructure
   `state.json` so the lifecycle fields live under `increments[]` — cleanest, but a
   breaking change → MAJOR + a migration that wraps existing single-lifecycle states
   as "increment 0". (b) Keep the current shape as increment 0 and add an increments
   registry beside it — backward-compatible, messier. *(Recommend: (a) nested with a
   migration — the clean model is worth one MAJOR; the migration is mechanical and
   one-time.)*
2. **Traceability sharing.** Confirm one project-wide store with edges tagged by
   increment (vs per-increment stores merged on demand). *(Recommend: one shared store,
   tagged — matches PROP-042 and makes AX-20 trivial.)*
3. **Cross-increment dependencies.** May increment N's gates read increment N-1's
   traceability (a new module depending on a delivered one)? *(Recommend: yes,
   read-only; a sealed increment's ledger is immutable (AX-19).)*
4. **New-increment intake.** Does `rome-increment` always run Surveyor intake
   (PROP-047) on the new module's inputs? *(Recommend: yes — a new module is new input;
   it gets the same characterization + reliability gating as a fresh project.)*

---

## Revision History

| Version | Date/Time (ISO 8601) | Summary |
|---------|----------------------|---------|
| 0.1 | 2026-07-16T00:00:00Z | Initial draft from fob-admin defect D15. Increment as first-class unit: per-increment lifecycle (routing/phases/gates) over a shared project-wide traceability store; `isComplete` per-increment (project never seals); `rome-increment` appends without overwriting. Ontology/lexicon/axiom alignment: ENT-15/16, REL-14..17, AX-19 (append-only preservation), AX-20 (union coverage), AX-21 (no terminal project). Four OQs — the load-bearing one is schema model (nested+migration → MAJOR, vs compatible wrapper). |
