# ROME-PROP-036: Input Characterization & Intent-Driven Routing

| Field | Value |
|-------|-------|
| **UID** | ROME-PROP-036 |
| **Title** | Input Characterization & Intent-Driven Routing — Quality-Gating Raw Inputs and Adapting the Lifecycle to Greenfield vs. Brownfield Purpose |
| **Status** | Draft |
| **Author** | Archie |
| **Created** | 2026-06-18T00:00:00Z |
| **Targets** | ROME phase model, `ROME/robot-plugins/`, intake stage |
| **Companion to** | ROME-PROP-035 (single-session orchestration on the sub-agent model) |
| **Relates to** | ROME-PROP-034 (phase plugin consolidation) |

---

## Executive Summary

ROME's analysis and design phases derive requirements from raw inputs, but the framework implicitly assumes a single kind of front door: a reasonably complete **PRD/BRD for a greenfield application**. Real inputs do not behave this way. They vary along three independent axes — **form** (running app, legacy code, docs, an idea), **quality** (complete vs. vague/contradictory/partial), and **intent** (new build vs. refining/extending/migrating an existing system).

The current single P1 entry (Talib → AORDL) has no defined behavior for low-quality or non-document inputs, and no mechanism to adapt the lifecycle when the purpose is to modify an existing system rather than build a new one. Fed legacy code or a refinement request, it will either fabricate requirements or stall.

This proposal adds an explicit **Intake & Characterization stage (P0.5)** that assesses input quality, gates on it, classifies intent, and **routes the downstream lifecycle accordingly** — preserving ROME's principles (EP-1 traceability, EP-3 quality control) by moving quality enforcement upstream to the source.

---

## 1. Problem Statement

### 1.1 Inputs vary along three axes

| Axis | Range |
|------|-------|
| **Form** | Running app · legacy codebase · PRD/BRD docs · napkin idea · screenshots · API spec · mixed |
| **Quality** | Complete & precise · vague · contradictory · partial · stale |
| **Intent** | Greenfield (new) · refinement/extension · migration / re-platform |

### 1.2 The framework collapses all three into one entry

P1 (Talib → AORDL) assumes form = docs, quality = adequate, intent = greenfield. Consequences:

1. **No input-quality control.** Garbage inputs propagate silently into analysis and design; errors surface late, expensively (the very rework ROME aims to prevent).
2. **No reverse path.** When the input *is* an existing system, ROME has no way to derive *as-is* requirements/architecture from code before designing *to-be*.
3. **No purpose awareness.** A refinement of an existing app and a brand-new build run the identical forward flow, despite needing different work.

---

## 2. Proposed Solution

Insert a stage **before analysis** — **P0.5 Intake & Characterization** (runs after P0 Bootstrap, before P1 Requirements). It produces one artifact, the **Input Characterization Record (ICR)**, and performs three functions.

### 2.1 Classify

A new **Surveyor sub-agent** (per the PROP-035 model) inspects all inputs and classifies them across the three axes, recording form, quality indicators, and detected intent in the ICR.

### 2.2 Quality-gate the inputs

A Sarah-style gate, applied to *inputs* rather than outputs:

```
Score input quality against a rubric (completeness, consistency, specificity, freshness).
  Sufficient   → proceed to routing.
  Insufficient → DO NOT GUESS. Emit targeted sponsor-clarification
                 questions (Seez MCP) and loop until threshold met.
```

This directly addresses input quality: it is **measured and enforced at the source**, and the lifecycle refuses to proceed on inadequate inputs rather than silently propagating them.

### 2.3 Classify intent and route the lifecycle

The ICR's `intent` value branches the orchestrator's lifecycle:

| Intent | Routed lifecycle |
|--------|------------------|
| **Greenfield** | Forward flow as today: inputs → AORDL → analysis → design → config → generation. |
| **Brownfield refinement/extension** | **Reverse step first:** Surveyor/discovery sub-agent derives *as-is* requirements, entities, and architecture from the existing code/app. Forward flow then runs on the **delta** (as-is → to-be). |
| **Migration / re-platform** | Reverse-extract as-is, then forward-design to a new tech stack while preserving behavior; traceability links new code to both the new requirement and the prior behavior. |

---

## 3. New Artifact: Input Characterization Record (ICR)

Location: `ARTIFACTS/_intake/icr.yaml`. Indicative fields:

- `inputs[]` — each with `form`, `location`, `quality_score`, `issues[]`
- `intent` — `greenfield | refinement | extension | migration`
- `quality_verdict` — `SUFFICIENT | INSUFFICIENT` (gate result)
- `clarifications[]` — open/closed sponsor questions
- `routing` — selected lifecycle path + phases to add/skip
- `as_is_required` — boolean (triggers discovery sub-agent)

The ICR is held in orchestrator state and feeds routing decisions for all later phases.

---

## 4. New Sub-Agent Role: Surveyor

Under the PROP-035 sub-agent model, this is a new named role:

| Asset | Content |
|-------|---------|
| Identity | Surveyor — input assessment & reverse engineering specialist |
| Skills | classify-inputs · score-input-quality · derive-as-is-requirements · extract-as-is-architecture · compute-as-is-to-be-delta |
| Scope | Read existing code/app/docs; produce ICR and as-is artifacts. Does **not** design to-be (PMA) or write requirements forward (Talib). |
| Context | Isolated, scoped to the existing codebase/inputs. |

Separation of duties (EP-5) is preserved: Surveyor characterizes and reverse-derives; Talib/PMA produce forward; Sarah gates.

---

## 5. Traceability Impact (EP-1)

Traceability extends to mark provenance and change status. Every requirement/artifact carries one of: `as-is` · `to-be` · `unchanged` · `new` · `removed`.

- **Greenfield:** all `new` (current behavior).
- **Brownfield:** the delta (`to-be` / `new` / `removed`) is first-class; "what changed and why" becomes queryable — essential to safely modifying an existing system.
- Traceability for migration links new code to **both** the new requirement and the preserved prior behavior.

This strengthens EP-1: traceability now covers change, not just creation.

---

## 6. Principle Alignment

| Principle | Effect |
|-----------|--------|
| EP-1 Traceability | Extended to provenance/change status (as-is/to-be/new). **Enhanced.** |
| EP-2 Structured phases | Adds P0.5; routing makes the phase path purpose-appropriate. **Enhanced.** |
| EP-3 Quality control | Quality enforced at the **input source**, not just output gates. **Enhanced.** |
| EP-5 Separation of duties | New Surveyor role distinct from producers and gatekeeper. **Preserved.** |
| EP-7 Optimal operation | Avoids rework from bad inputs and avoids running greenfield work on brownfield projects. **Enhanced.** |

---

## 7. Migration Path

Builds on the PROP-035 orchestrator (the routing requires a session that can branch the lifecycle).

- **N1** — Define the ICR schema and the input-quality rubric (framework standard doc).
- **N2** — Add the Surveyor sub-agent definition (identity + classify/score skills).
- **N3** — Wire P0.5 into the orchestrator: classify → quality-gate → record ICR. Greenfield path only (routing = passthrough).
- **N4** — Add discovery skills (derive as-is requirements/architecture) and the brownfield reverse-then-forward route.
- **N5** — Add migration route + dual-link traceability.

N1–N3 deliver input quality-gating for the existing greenfield flow with no behavior change to later phases; N4–N5 add brownfield/migration support.

---

## 8. Risks

| Risk | Mitigation |
|------|------------|
| Over-strict input gate stalls projects | Rubric thresholds configurable; PERMISSIVE mode for exploratory starts, STRICT for delivery. |
| Reverse-derived as-is requirements inaccurate | Sarah gate validates as-is artifacts before forward flow; sponsor confirms intent + key as-is findings. |
| Intent misclassification | ICR routing is sponsor-confirmable before lifecycle branches. |
| Scope creep into full legacy-comprehension | v1 derives as-is at requirement/architecture granularity, not exhaustive code understanding; deep comprehension deferred. |

---

## 9. Recommendation

1. Approve **P0.5 Intake & Characterization** with the ICR artifact and the input-quality gate.
2. Add the **Surveyor** sub-agent role under the PROP-035 model.
3. Adopt **intent-driven routing**: greenfield forward-only; brownfield reverse-then-forward; migration with dual-link traceability.
4. Sequence N1→N3 (quality gate for greenfield) first; N4→N5 (brownfield/migration) once PROP-035 P3/P5 conversions are proven.

---

## Open Questions for Sponsor

1. Input-quality threshold strictness and whether it is mode-configurable (recommend: configurable STRICT/GUIDED/PERMISSIVE, mirroring AORDL validation modes).
2. Depth of as-is derivation for brownfield — requirement/architecture level vs. full code comprehension (recommend: requirement/architecture level for v1).
3. Should intent classification always require sponsor confirmation before routing (recommend: yes).

---

## Revision History

| Version | Date | Summary |
|---------|------|---------|
| 1.0 | 2026-06-18 | Initial draft — P0.5 intake stage, Input Characterization Record, input-quality gate, Surveyor sub-agent, intent-driven greenfield/brownfield/migration routing, change-aware traceability. |
