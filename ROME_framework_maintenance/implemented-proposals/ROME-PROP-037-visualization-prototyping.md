# ROME-PROP-037: Visualization & Optional Prototyping (UI/UX Validation)

| Field | Value |
|-------|-------|
| **UID** | ROME-PROP-037 |
| **Title** | Visualization as a Standard Capability and Optional Prototyping for UI/UX Validation Before Generation |
| **Status** | Draft |
| **Author** | Archie |
| **Created** | 2026-06-18T00:00:00Z |
| **Targets** | ROME phase model, `ROME/robot-plugins/` (Reena, Charlie, PMA, Clara), visualization tooling |
| **Companion to** | ROME-PROP-035 (single-session orchestration), ROME-PROP-036 (input characterization) |
| **Relates to** | ROME-PROP-028 (P5 implementation / Widget & Screen Design Plan) |

---

## Executive Summary

ROME derives design from requirements as **text artifacts** and jumps straight from text design (P3) to generated code (P5). For most artifacts this is fine. For **UI/UX it is the weakest point in the framework**: layout, flow, hierarchy, spacing, and interaction quality cannot be validated from prose tables (e.g. PROP-028's text-based Widget & Screen Design Plan). The sponsor first sees the interface only after it is generated — the most expensive possible moment to discover a layout or flow is wrong.

This proposal does two things:

1. **Visualization** — elevates diagrams from scattered, ad-hoc skills to a **standard, cross-cutting capability** the orchestrator emits at each phase, always in sync with the source-of-truth state.
2. **Prototyping** — adds an **optional, electable P3.5 "Prototype & Visual Validation" phase**, centered on UI/UX, that produces low-fidelity viewable/clickable artifacts and a **sponsor visual-approval gate** *before* full generation commits. It is an integral *option* — employed when the UI warrants it, skipped when it does not.

---

## 1. Problem Statement

### 1.1 UI/UX cannot be validated from text

PROP-028 §6 captures UI design as a **table** (layout widgets, key child widgets, state connection). This conveys *structure* but not *experience*: it cannot show visual hierarchy, spacing, responsive behavior, navigation flow, or interaction feel. These are the exact properties that determine whether a UI is acceptable — and the exact properties prose cannot carry.

### 1.2 No feedback loop before generation

The lifecycle is text design (P3) → code (P5). The sponsor sees the interface only after Charlie/Reena generate it. UI/UX errors are therefore discovered at the most expensive point, forcing P5 rework — the rework ROME exists to prevent (EP-7).

### 1.3 Visualization is ad-hoc

Diagram generation exists (PMA `generate-architecture-diagram`, Clara references) but is scattered per-robot, not a standard capability, and risks drifting from the design it depicts.

---

## 2. Proposed Solution

### 2.1 Visualization as a standard, cross-cutting capability

Under the PROP-035 orchestrator, visualization becomes a standard output emitted each phase from the source-of-truth state (using the available Mermaid Chart MCP and equivalent renderers):

| Phase | Standard visual artifacts |
|-------|---------------------------|
| P2 Analysis | Entity/ER diagrams, dependency graphs |
| P3 Design | Architecture diagrams, API/sequence diagrams, **screen-flow / navigation maps** |
| P5 Generation | Component hierarchy diagrams (as-built) |

Because they are regenerated from state, diagrams **never drift** from the design — strengthening EP-3 (comprehension for the reviewer/sponsor) and EP-1 (visual artifacts are traceable to their source).

### 2.2 Optional P3.5 — Prototype & Visual Validation (UI/UX)

An **elective** phase inserted between P3 (design) and P4/P5, run by the orchestrator **only when requested** for the project (see §5 electability). When employed:

1. A UI-specialist sub-agent (Reena/Charlie, or a dedicated **Visualizer** role) produces a **low-fidelity, throwaway** UI artifact at a chosen fidelity tier (§3).
2. The orchestrator presents it to the sponsor for a **visual-approval gate**.
3. `APPROVE` → proceed to generation, with the approved layout/flow informing Charlie's P5 work. `BLOCK` → iterate on the prototype (cheaply) until the look-and-flow is right.

**Throwaway by design:** the prototype validates UI/UX; it is not the deliverable. P5 still generates the real code. The accepted prototype becomes an *input* to generation, creating a `prototype → screen → code` traceability link.

---

## 3. Fidelity Tiers (choose per project)

| Tier | Artifact | Use when |
|------|----------|----------|
| **T0 — Wireframe** | Static low-fi wireframes / screen-flow render | Validate structure & navigation only; fastest. |
| **T1 — Static mockup** | Rendered HTML/image mockups with real layout & styling, non-interactive | Validate visual design & hierarchy. |
| **T2 — Clickable prototype** | Navigable static prototype (links between screens, no backend) | Validate flow & interaction. |
| **T3 — Runnable UI skeleton** | Real UI framework, mocked data, no backend logic | Validate feel in the target tech stack before full P5. |

Default for UI-bearing projects: **T1 or T2**. T3 only when interaction feel must be proven in-stack.

---

## 4. UI/UX as First-Class Concern

To make UI/UX validation rigorous rather than cosmetic:

- **Design-system anchoring:** prototypes draw on the project's design system / component library (ties to PROP-028 §6 reused-widget mapping) so the prototype predicts the real build.
- **UX validation checklist (Clara/Sarah):** navigation completeness, state coverage (empty/loading/error/populated), responsive breakpoints, accessibility basics (contrast, focus order, labels), consistency with design system. The visual-approval gate checks these, not just "looks nice."
- **Sponsor-in-the-loop:** the visual-approval gate is an explicit human checkpoint surfaced via the `Seez` MCP — the one place UI/UX subjectivity is resolved by the sponsor, early and cheaply.

---

## 5. Electability — "Integral Option"

P3.5 is **not forced on every project.** The orchestrator decides whether to run it from project configuration and the Input Characterization Record (PROP-036):

- **Employ** when: UI is novel/complex, sponsor wants to see before build, UX risk is high, or intent is a UI refinement.
- **Skip** when: backend-only/API/library project, trivial or well-established UI, or sponsor opts out.

Configuration: `prototype: { enabled: bool, tier: T0..T3 }`. When disabled, the lifecycle runs P3 → P4 → P5 unchanged. This is the "integral option that can be employed" — a built-in capability, electively invoked.

---

## 6. New/Extended Sub-Agent Role

Option A *(recommended for v1)* — extend existing UI specialists (Reena/Charlie) with prototyping skills: `generate-wireframe`, `generate-mockup`, `generate-clickable-prototype`, `generate-ui-skeleton`.

Option B — a dedicated **Visualizer** role owning all visualization + prototyping, isolated context, scoped to render-only. Cleaner separation if visualization grows; more roles to maintain.

Either way, the **visual-approval gate is owned by Sarah/Clara + sponsor**, never by the producing role (EP-5 separation of duties).

---

## 7. Principle Alignment

| Principle | Effect |
|-----------|--------|
| EP-1 Traceability | Visuals traceable to state; accepted prototype → generated screen link. **Enhanced.** |
| EP-3 Quality control | UI/UX validated visually before generation, not assumed from text. **Enhanced.** |
| EP-5 Separation of duties | Producer prototypes; Sarah/Clara + sponsor approve. **Preserved.** |
| EP-7 Optimal operation | Cheap visual iteration prevents expensive P5 UI rework. **Enhanced.** |

---

## 8. Migration Path

Builds on the PROP-035 orchestrator.

- **V1** — Standardize visualization: orchestrator emits P2/P3 diagrams from state via Mermaid MCP. No new phase.
- **V2** — Add prototyping skills (T0/T1) to Reena/Charlie; define the visual-approval gate + UX checklist.
- **V3** — Wire optional P3.5 into the orchestrator with `prototype` config + ICR-driven electability (default skip).
- **V4** — Add T2/T3 fidelity tiers and `prototype → code` traceability link.

V1 delivers always-in-sync diagrams with zero phase change; V2–V4 add the elective UI/UX prototyping loop.

---

## 9. Risks

| Risk | Mitigation |
|------|------------|
| Prototyping always-on adds cost to non-UI projects | Elective by config + ICR; default skip for backend/library projects. |
| Throwaway prototype mistaken for deliverable | Explicitly throwaway; P5 generates real code; prototype marked as validation artifact. |
| Prototype diverges from final build | Anchor to design system; offer T3 in-stack skeleton when feel must be proven. |
| Visual-approval gate becomes subjective bikeshedding | UX checklist gives objective gate criteria; sponsor resolves remaining subjectivity once, early. |

---

## 10. Recommendation

1. Make **visualization a standard capability** emitted each phase from state (V1).
2. Add an **optional P3.5 Prototype & Visual Validation phase** centered on UI/UX, with fidelity tiers and a sponsor visual-approval gate.
3. Keep it **electable** (config + ICR-driven), default-skip for non-UI projects — the "integral option."
4. v1: extend Reena/Charlie with prototyping skills; revisit a dedicated Visualizer role if visualization scope grows.

---

## Open Questions for Sponsor

1. Default fidelity tier for UI projects — T1 (static mockup) or T2 (clickable)? Recommend T1, escalate to T2 on request.
2. Extend Reena/Charlie vs. dedicated Visualizer role? Recommend extend for v1.
3. Should the accepted prototype be a hard input constraint on P5 generation, or advisory? Recommend hard input for layout/flow, advisory for styling details.

---

## Revision History

| Version | Date | Summary |
|---------|------|---------|
| 1.0 | 2026-06-18 | Initial draft — visualization as standard cross-cutting capability; optional electable P3.5 prototyping phase for UI/UX validation with fidelity tiers, visual-approval gate, UX checklist, and prototype→code traceability. |
