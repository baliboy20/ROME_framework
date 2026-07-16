# ROME-PROP-047: Input Characterization & Reliability Gating

| Field | Value |
|-------|-------|
| **UID** | ROME-PROP-047 |
| **Title** | Input Characterization & Reliability Gating — Assess Real Inputs Before Routing, Expose Intake for Greenfield, and Read the Sponsor's Own Reliability Markers |
| **Status** | Draft |
| **Author** | Archie |
| **Created** | 2026-07-16T00:00:00Z |
| **Origin** | fob-admin Module-1 live run, defects D3 + D4 + D16 — `FRAMEWORK-DEFECTS-2026-07-15.md` |
| **Targets** | `rome-core/orchestrator/rome-start.cjs`, `routing.js`, `agents/surveyor/` (ROBOT.md + P0.5 mode — `inputReliability`), `state.js` (`inputReliability`), `docs/foundation/lexicon.md` (ROME-LEX-001), `docs/foundation/ontology.md` (ROME-ONT-001 — ENT-13/14, REL-11/12/13, AX-17/18), `docs/standards/gate-decision-standard.md`, `GETTING-STARTED.md` |
| **Builds On** | ROME-PROP-036 (Surveyor, ICR, intent routing, P0.5 intake), ROME-PROP-041 (sponsor-authorized deferrals), ROME-PROP-043 (ontology/lexicon/axiom model), ROME-PROP-044 (tagged-test provenance), ROME-PROP-046 (fact + waiver pattern) |
| **Relates To** | D15 (increments — a later proposal) |

---

## In Plain Terms

*A jargon-free summary. The precise version, for the agents, is below.*

ROME already employs an input specialist. It's an agent role called **Surveyor**,
and its whole job is to look at the materials you hand a project — your requirements
document, your notes, your wireframes — and answer two questions: *are these good
enough to build from, or should we go back and ask you to clarify?* and *is this a
brand-new build or a change to something that already exists?* Surveyor writes its
answer into a short record the framework then uses to plan the work. (That record is
called the **ICR**; the plan-the-work step is called **routing**.)

The problem is not that this specialist is missing. **The problem is it almost never
gets to do its job.**

- **The startup command does Surveyor's job for it — badly.** When you begin a
  project, the `rome-start` command sets up an empty folder for your materials and,
  in the same breath, writes down "the materials are good enough" — a fixed answer it
  made up, not one Surveyor produced by actually reading anything. It's filling in
  Surveyor's report with a rubber stamp, on an empty folder, before you've handed over
  a single file. On the real project this meant the client's wireframes and style
  guide were never checked in and never noticed missing — the app got built without
  them, and it had to be partly redone.

- **Brand-new projects can't call Surveyor at all.** Surveyor runs automatically only
  when you're changing an existing system. For a from-scratch project there's no way
  to switch it on — even though a fresh project with a messy pile of inputs is exactly
  when you'd want a careful first look. On the real project (a from-scratch one),
  Surveyor never ran once.

- **Surveyor doesn't read the "how solid is this?" notes you already write.** On your
  own documents you'd written things like *"this part is only a proposal,"* *"this was
  reconstructed from memory — the original is lost,"* *"this is undefined."* Those are
  precisely the warnings that say which parts are risky to build from. Surveyor judges
  input quality in a general way but doesn't read those specific notes. This is the one
  piece that's genuinely new work; the first two are just plumbing that already exists
  but was never connected.

**So the proposal is mostly connecting up a specialist you already have** — make the
startup command actually call Surveyor instead of faking its report, and let new
projects switch it on — **plus one real addition**: teach Surveyor to read your
reliability notes and stop (to ask you) before building on anything you flagged as
shaky.

---

## Executive Summary

**ROME already has a specialist whose entire job is assessing inputs — the Surveyor
role (ROME-ROBOT-011, PROP-036). The defect is that it is bypassed, not missing.**
Surveyor's `ROBOT.md` defines it to inspect `_user_input/raw-requirements/`, judge
whether the inputs are good enough to proceed or the sponsor must clarify, and
produce the Input Characterization Record (ICR) — `qualityVerdict`, per-input
`quality_score`, `issues[]`, `clarifications[]`. That is exactly the "look at what
you were given" step. It just never runs on the case that needs it.

Two things stand in its way, plus one genuine gap in what it reads:

- **`rome-start` fabricates the ICR instead of asking Surveyor for it.**
  `rome-start.cjs:52` **hardcodes `qualityVerdict: 'SUFFICIENT'`** and routes on that
  constant. It impersonates the very output Surveyor exists to produce, so Surveyor's
  real assessment is bypassed and `routeFromICR`'s `INSUFFICIENT` refusal becomes
  dead code. Worse, this happens **before** `_user_input/raw-requirements/` is
  populated (rome-start scaffolds the empty dir, then tells the user to fill it) — the
  fabricated verdict certifies an empty folder. On the fob-admin run the sponsor's
  wireframes and style guide were never staged; P1–P4 all gated against an incomplete
  input set. Cost: 2 new requirements, a design delta, a schema migration, an API
  patch, a UI restyle — found only when the sponsor asked "were the wireframes used?"
  after P5 had started.
- **Greenfield can never invoke Surveyor.** Surveyor's intake pass (P0.5) runs only
  for brownfield intents or when `forceIntake` is set, and `rome-start` exposes no
  `--force-intake`. So a from-scratch project — often the messiest inputs — cannot
  summon the input specialist at all. On fob-admin (greenfield) Surveyor **never ran
  once**; the hardcoded stamp stood in for it.
- **Surveyor does not read the sponsor's own reliability markers (the one real gap).**
  Input files carry explicit author flags — `**Status:** PROPOSED / RECONSTRUCTED
  ("source not available") / UNDEFINED / Reliable`. Surveyor scores input quality in
  general terms but does not read these specific markers. Only 2 of 10 fob-admin
  modules were grounded in documented journeys; Module 1 succeeded partly *because*
  it was one. Choosing the next module safely required the orchestrator grepping
  `**Status:**` lines by hand.

So this proposal is mostly **wiring up the Surveyor that already exists** — make
`rome-start` call it instead of faking its output, and let greenfield invoke it —
plus **one extension to Surveyor's job**: read the sponsor's reliability markers.

**Assessment:** HIGH VALUE, MEDIUM EFFORT (lower than it looks — D3/D4 are wiring an
existing role, not new capability). This was the single largest source of
rework on the live run, and the signal was sitting in plain text the whole time.

---

## Problem Statement

### P1 — `rome-start` fabricates Surveyor's output (D3)
Producing the `qualityVerdict` is Surveyor's defined authority (its `ROBOT.md`:
"Produces the ICR; does not design or approve"). Yet `rome-start.cjs:52` writes
`qualityVerdict: 'SUFFICIENT'` itself and routes on it — impersonating the ICR
rather than obtaining it from Surveyor. And it does so on the empty directory it
just created, before any input is staged. So `routeFromICR`'s `INSUFFICIENT` refusal
is unreachable, and a constant that looks like a real gate certifies nothing. The
bug is not a missing capability; it is one component doing another's job, badly.

### P2 — Greenfield cannot invoke Surveyor (D4)
`routeFromICR` schedules Surveyor's P0.5 pass only for brownfield intents or when
`icr.forceIntake` is set. `rome-start` exposes neither `--force-intake` nor any
heuristic, so a greenfield project cannot summon Surveyor at all. Combined with P1,
a from-scratch project's inputs are assessed by no one — Surveyor exists but is
structurally unreachable for the greenfield case.

### P3 — Surveyor doesn't read the sponsor's reliability markers (D16) — the real gap
This is the one part that is genuinely absent from Surveyor's job today. Input files
carry explicit author markers — `**Status:** Reliable / PROPOSED / RECONSTRUCTED
("source not available") / UNDEFINED`. Surveyor scores input quality in general terms
(`quality_score`, `issues[]`) but does not read these specific declarations. Routing a
`PROPOSED` module (no journeys, named in the PRD only) through the pipeline forces
Talib to invent or stall. The sponsor already did the reliability assessment; nothing
consumes it.

---

## Proposed Solution

### Part A — `rome-start` calls the real Surveyor, not a fake ICR (D3)
Stop impersonating Surveyor; split scaffold-time from assess-time:

1. `rome-start` **scaffolds and stops** — it no longer emits a `qualityVerdict` at
   all. Its job is to create the workspace and stage directories, nothing more.
2. **Surveyor's P0.5 pass produces the ICR** by reading what is actually in
   `_user_input/raw-requirements/` — as its `ROBOT.md` already specifies. Routing
   consumes *that* verdict, the genuine one.
3. `routeFromICR` **refuses to route with no verdict** (absence ≠ SUFFICIENT) and
   when `raw-requirements/` is empty. Surveyor's `INSUFFICIENT` refusal — dead code
   today — becomes live.

Net effect: the authority the ROBOT.md already assigns to Surveyor is honoured in
the wiring instead of pre-empted by a constant.

### Part B — Let greenfield invoke Surveyor (D4)
- `rome-start` exposes `--force-intake` (and `--no-intake` to override).
- Default Surveyor's P0.5 pass **ON for greenfield when inputs are heterogeneous** —
  mixed formats, binaries (PDF/PNG), or more than N files — the case most needing
  characterization. Homogeneous, small, text-only greenfield may still forward-route.
- No change to Surveyor itself here — purely making the existing role reachable.

### Part C — Extend Surveyor to read reliability markers (D16) — the one new capability
This is the only part that adds to Surveyor's job rather than wiring the existing one.
- Surveyor's ICR gains an **`inputReliability`** output per input/module: parse the
  sponsor's `**Status:**` markers where present; assess the rest. (Its `ROBOT.md`
  Output table and P0.5 mode doc gain this field.)
- Routing **refuses or warns** on inputs the sponsor marked
  `PROPOSED / UNDEFINED / RECONSTRUCTED`. A sponsor may authorize proceeding via the
  existing deferral mechanism (PROP-041) — recorded, not silent.
- `state.inputReliability[]` carries the assessment so later phases and gates can see
  it; a `PROPOSED` input that ships is visible in the audit, not a surprise at P5.

---

## Ontology, Lexicon & Axiom Alignment

*In plain terms: the framework keeps a dictionary (the **lexicon**), a map of how its
pieces relate (the **ontology**), and a list of rules it promises are always true (the
**axioms**). Inputs, Surveyor, and the ICR are missing from all three today — the
framework builds from your materials without those materials being first-class things
it names or reasons about. This proposal adds them, so "check the inputs first" becomes
a stated rule, not just code buried in one file.*

These are companion changes, applied to ROME-LEX-001 and ROME-ONT-001 **on
implementation** (the pattern PROP-043 used for its lexicon fix).

### Lexicon (ROME-LEX-001) — terms currently undefined
| Term | Definition |
|------|------------|
| **Input** | A raw material a project starts from — a document (PRD/BRD), an idea, an existing codebase, or a design asset. Staged in `_user_input/raw-requirements/`. |
| **Surveyor** | The Role that characterizes Inputs at P0.5 and produces the ICR. Does not author requirements, design, or approve gates. |
| **ICR (Input Characterization Record)** | Surveyor's structured output: intent, quality verdict, per-input inventory, and (PROP-047) reliability. The Orchestrator routes the lifecycle from it. |
| **Quality Verdict** | `SUFFICIENT` \| `INSUFFICIENT` — Surveyor's judgement of whether Inputs are adequate to proceed. |
| **Input Reliability** | The sponsor-declared solidity of an Input (`Reliable` / `PROPOSED` / `RECONSTRUCTED` / `UNDEFINED`), read by Surveyor from `**Status:**` markers. |

### Ontology (ROME-ONT-001) — new entities & relations
Entities:
| Ent ID | Entity | Source of truth |
|--------|--------|-----------------|
| ENT-13 | Input | ROME-LEX-001; PROP-036/047 |
| ENT-14 | ICR (Input Characterization Record) | ROME-STD-AGENT-ROLES (Surveyor); PROP-036 |

Relations:
| Rel ID | Relation | Cardinality |
|--------|----------|-------------|
| REL-11 | Surveyor `characterizes` Input → ICR | Surveyor(1) → Input(N) → ICR(1) |
| REL-12 | Orchestrator `routes-from` ICR | Lifecycle routing derives from ICR(1) (`routeFromICR`) |
| REL-13 | Sponsor `declares-reliability-of` Input | Sponsor(1) → Input(N) |

### Axiom set (ROME-ONT-001 §3) — new invariants
| ID | Axiom | Provenance (on implementation) |
|----|-------|--------------------------------|
| AX-17 | A project routes only on an ICR whose `qualityVerdict` is `SUFFICIENT`; absent or `INSUFFICIENT` input quality blocks routing (sponsor may override, recorded). | ENFORCED (`routing.js#routeFromICR`) — the check exists today but is dead code until `rome-start` stops fabricating the verdict (Part A). |
| AX-18 | An Input the sponsor marked `PROPOSED` / `UNDEFINED` / `RECONSTRUCTED` routes into requirements only with a recorded sponsor authorization. | CHECKED (Surveyor `inputReliability` + routing) — new (Part C). |

Both axioms get a tagged violation test (per PROP-044 Part A / fidelity check 6b) on
implementation. AX-17 converts a currently-dead guard into a live, cited invariant;
AX-18 is the mechanical form of "don't silently build on sand."

---

## Non-Goals

- **No natural-language "is this a good requirement" judgement beyond the sponsor's
  own markers + Surveyor's structured inventory.** The framework reads declared
  reliability; it does not grade prose quality.
- **No change to P1–P5 or the gate model.** This is pre-P1 intake and routing.
- **No increment model** (D15) — separate proposal; this concerns a single run's
  input set.

---

## Impact

- The largest fob-admin rework source becomes a gated, visible fact.
- `rome-start`'s output changes (no `qualityVerdict`; intake may be inserted) and it
  gains flags — additive to the CLI. **MINOR**, but it changes the bootstrap flow:
  a project now routes on a produced verdict, not a constant. GETTING-STARTED.md must
  reflect scaffold-then-stage-then-intake ordering.
- Removes an incoherence (assessing an empty directory) that currently reads as a
  working gate.

---

## Open Questions

1. **Ordering — two-step or refuse-until-non-empty?** (a) `rome-start` scaffolds and
   stops; a separate `rome-intake` (or the P0.5 pass) assesses and routes once inputs
   are staged; or (b) `rome-start` refuses to route until `raw-requirements/` is
   non-empty and assesses inline. *(Recommend: (a) two-step — matches the existing
   P0.5 model and cleanly fixes the "assess before inputs exist" incoherence.)*
2. **Greenfield intake default.** Always insert P0.5 for greenfield, or only when
   inputs are heterogeneous (mixed formats / binaries / >N files)? *(Recommend:
   heterogeneous-triggered, with `--force-intake` / `--no-intake` overrides — cheap
   for the simple case, automatic for the messy one.)*
3. **Reliability enforcement — refuse or warn?** Hard-refuse routing a
   `PROPOSED/UNDEFINED/RECONSTRUCTED` input, or WARN + sponsor-authorized proceed?
   *(Recommend: WARN + sponsor-authorized deferral (PROP-041) — the sponsor already
   did the assessment; the framework should surface it, not veto it.)*
4. **Marker source of truth.** Trust `**Status:**` text markers (fob-admin
   convention), a structured intake questionnaire Surveyor fills, or both?
   *(Recommend: read `**Status:**` where present + Surveyor assessment for the rest;
   converge on a documented marker format over time.)*

---

## Revision History

| Version | Date/Time (ISO 8601) | Summary |
|---------|----------------------|---------|
| 0.1 | 2026-07-16T00:00:00Z | Initial draft from fob-admin defects D3/D4/D16. Part A: `rome-start` stops stamping `qualityVerdict`; a Surveyor P0.5 pass assesses real staged inputs; `routeFromICR` refuses absent-verdict / empty-inputs. Part B: expose `--force-intake`, default P0.5 for heterogeneous greenfield. Part C: record `inputReliability` from `**Status:**` markers; route refuses/warns on PROPOSED/UNDEFINED/RECONSTRUCTED with sponsor-authorized override. Four OQs (ordering, greenfield default, refuse-vs-warn, marker source). |
| 0.2 | 2026-07-16T00:00:00Z | Reframed on the correct diagnosis (sponsor): input characterization is **Surveyor's existing role**, bypassed not missing — D3/D4 are wiring the existing Role reachable; only D16 (reliability markers) adds to Surveyor's job. Added a jargon-free "In Plain Terms" on-ramp. Added Ontology/Lexicon/Axiom alignment: Surveyor, Input, ICR, Quality Verdict, Input Reliability are undefined in ROME-LEX-001 and absent from ROME-ONT-001 — companion additions specified (ENT-13/14, REL-11/12/13, AX-17 input-quality gating [ENFORCED, converts dead guard to live], AX-18 reliability authorization [CHECKED]). |
