---
module: DS
status: PROPOSED
actors: [Customer, Prospect, Owner]
depends-on: []
presumes: []
---

# core-design-system — Module Spec

| | |
|---|---|
| **Document** | core-design-system module spec (Stage 4) |
| **Status** | PROPOSED — **presumed shared design asset**, no AORDL requirements (see §4). |
| **Sources** | `Intake_Note.md` (F-10) · `technical-state/FOB_Technical_Context_Summary.md` §I · `strategic/FOB_Product_Requirements_Document_v1_0.md` §10.1 · `ROME-GUIDE-001` (Part 5) |

## 1. Intent
Provide one set of shared brand tokens (colour, type) so every customer-facing surface presents the brand consistently from a single source; each app implements its own component library on top of those shared tokens, since apps on different devices (web, Flutter) cannot literally share components. **Success:** all customer surfaces render from the same tokens/type; a token change propagates from one place. *(Reworded at Stage 5 propagation per DR-11 — `Decision_Record_Aristotle_2026-07-20.md` — narrowing the original "one set of...components" framing.)*

## 2. Facts
| ID | Fact | Source |
|---|---|---|
| F-10 | Built: forest-palette CSS tokens (e.g. `--forest #5a9962`, `--charcoal #243320`); Syne (display) + DM Sans (body), self-hosted variable woff2, `font-display: swap`; spec in `design-system.md`. | Tech Context §I |
| — | Every customer-facing surface uses the design system (PRD §10.1). **Narrowed by DR-11:** every surface uses the shared tokens; components are implemented per-app, not shared. | PRD §10.1 |

## 3. Decisions needed
| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D-DS-1 | Single source of truth (SQ-08). | `design-system.md` + `styles.css` | Yes — canonicalise these; other surfaces consume them. | **CLOSED — DR-11.** Tokens canonicalised in `design-system.md` + `styles.css`; components per-app on top of them. |
| D-DS-2 | Does a Flutter component library exist, or is it to-build? | exists \| to-build | Confirm; if to-build, it is a Stage-6e design deliverable, not a REQ. | **CLOSED — DR-12.** To-build; Stage 6e deliverable. |

## 4. Requirements
**None authored at business level — this is a presumed shared design asset.** Per ROME-GUIDE-001 Part 5, tokens, typography, and component libraries are *design outputs* (produced at Stage 6e — wireframes + design), consumed by the App modules; authoring them as requirements would preempt the designer and mix design into the requirement layer. The design system is declared here as a fact and referenced by every customer-facing surface.

## 5. Journeys
| UJ id | Journey | Disposition |
|---|---|---|
| UJ-DS-01 | Surface renders from design system | **Design asset** — realised at Stage 6e; consumed by App modules. |
| UJ-DS-02 | Token change propagates | **Design asset** — single-source maintenance rule, not actor behaviour. |
