# ROME-PROP-047: Input Characterization & Reliability Gating

| Field | Value |
|-------|-------|
| **UID** | ROME-PROP-047 |
| **Title** | Input Characterization & Reliability Gating — Assess Real Inputs Before Routing, Expose Intake for Greenfield, and Read the Sponsor's Own Reliability Markers |
| **Status** | Draft |
| **Author** | Archie |
| **Created** | 2026-07-16T00:00:00Z |
| **Origin** | fob-admin Module-1 live run, defects D3 + D4 + D16 — `FRAMEWORK-DEFECTS-2026-07-15.md` |
| **Targets** | `rome-core/orchestrator/rome-start.cjs`, `routing.js`, new intake step (Surveyor P0.5 output), `state.js` (`inputReliability`), `docs/standards/gate-decision-standard.md`, `GETTING-STARTED.md` |
| **Builds On** | ROME-PROP-036 (intent routing, P0.5 intake, quality verdict), ROME-PROP-041 (sponsor-authorized deferrals), ROME-PROP-046 (fact + waiver pattern) |
| **Relates To** | D15 (increments — a later proposal) |

---

## Executive Summary

ROME is blind to whether its **inputs** correspond to reality, exactly as it was
blind (pre-PROP-046) to whether its **outputs** do. The machinery to assess input
quality exists and is unreachable:

- `routing.js#routeFromICR` refuses to route on `qualityVerdict: 'INSUFFICIENT'` —
  but `rome-start.cjs:52` **hardcodes `SUFFICIENT`**, so the check is dead code.
- Worse, `rome-start` routes **before** `_user_input/raw-requirements/` is
  populated (it scaffolds the directory, then tells the user to fill it). On the
  fob-admin run the framework certified inputs sufficient while the directory was
  **empty**. The sponsor's wireframes and style guide were never staged; P1–P4 all
  gated against an incomplete input set. Cost: 2 new requirements, a design delta,
  a schema migration, an API patch, a UI restyle — discovered only when the sponsor
  asked "were the wireframes used?" after P5 had started.
- `routeFromICR` supports `forceIntake` (→ P0.5 Surveyor pass), but `rome-start`
  never exposes `--force-intake`, so **greenfield can never request characterization**
  — precisely the case that needs it most.
- The sponsor's own module analyses carry explicit reliability markers
  (`**Status:** PROPOSED / RECONSTRUCTED / UNDEFINED / Reliable`). **Nothing reads
  them.** Only 2 of 10 fob-admin modules were grounded in documented journeys;
  Module 1 succeeded partly *because* it was one. Choosing the next module safely
  required the orchestrator grepping `**Status:**` lines by hand.

This proposal makes input assessment a **real step over real inputs**: `rome-start`
stops trusting a constant, a Surveyor intake pass reads what is actually staged
(including reliability markers), and routing gates on a genuine verdict.

**Assessment:** HIGH VALUE, MEDIUM EFFORT. This was the single largest source of
rework on the live run, and the signal was sitting in plain text the whole time.

---

## Problem Statement

### P1 — The quality verdict is a constant stamped before inputs exist (D3)
`rome-start.cjs` builds the ICR with `qualityVerdict: 'SUFFICIENT'` literally, then
routes. The directory it assesses is the one it just created empty. The check in
`routeFromICR` that would refuse inadequate input is therefore unreachable through
the CLI. A constant that looks like a gate and reads as one to a reviewer is worse
than no gate.

### P2 — Greenfield cannot request intake (D4)
`routeFromICR` adds P0.5 only for brownfield intents or when `icr.forceIntake` is
set. `rome-start` exposes neither `--force-intake` nor any heuristic, so a greenfield
project with messy, heterogeneous inputs cannot get a Surveyor characterization pass
without hand-editing the ICR. Combined with P1, greenfield input quality is assessed
by no one.

### P3 — Sponsor-declared reliability is never read (D16)
Input files carry `**Status:**` markers the sponsor already wrote —
`Reliable`, `PROPOSED`, `RECONSTRUCTED ("source not available")`, `UNDEFINED`. These
are exactly the signal an intake step exists to read. Routing a `PROPOSED` module
(no journeys, named in the PRD only) through the same pipeline forces Talib to invent
or stall. The framework has no concept of input reliability; the sponsor's assessment
is discarded.

---

## Proposed Solution

### Part A — Assess real inputs, not a constant (D3)
Split scaffold-time from assess-time:

1. `rome-start` **scaffolds and stops** — it no longer emits a `qualityVerdict`. Its
   job is to create the workspace and stage directories.
2. A **Surveyor intake pass (P0.5)** reads what is actually in
   `_user_input/raw-requirements/` and **produces** the ICR quality verdict and the
   input inventory. Routing consumes that real verdict.
3. `routeFromICR` additionally **refuses to route with no verdict** (absence ≠
   SUFFICIENT) and refuses when `raw-requirements/` is empty. The dead check becomes
   live.

### Part B — Expose and default intake (D4)
- `rome-start` exposes `--force-intake` (and `--no-intake` to override).
- Default P0.5 **ON for greenfield when inputs are heterogeneous** — mixed formats,
  binaries (PDF/PNG), or more than N files — since that is the case most needing
  characterization. Homogeneous, small, text-only greenfield may still forward-route.

### Part C — Read reliability markers (D16)
- The Surveyor intake pass records an **`inputReliability`** fact per input/module:
  parse `**Status:**` markers where present; assess the rest.
- Routing **refuses or warns** on inputs the sponsor marked
  `PROPOSED / UNDEFINED / RECONSTRUCTED`. A sponsor may authorize proceeding via the
  existing deferral mechanism (PROP-041) — recorded, not silent.
- `state.inputReliability[]` carries the assessment so later phases and gates can see
  it; a `PROPOSED` input that ships is visible in the audit, not a surprise at P5.

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
