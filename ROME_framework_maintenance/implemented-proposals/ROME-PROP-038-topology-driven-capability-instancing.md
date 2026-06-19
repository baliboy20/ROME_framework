# ROME-PROP-038: Topology-Driven Capability Instancing

| Field | Value |
|-------|-------|
| **UID** | ROME-PROP-038 |
| **Title** | Topology-Driven Capability Instancing — Scaling Generation to Arbitrary Component Architectures Instead of Fixed Layer Seats |
| **Status** | Draft |
| **Author** | Archie |
| **Created** | 2026-06-18T00:00:00Z |
| **Targets** | ROME phase model (P3 design, P5 generation), `ROME/robot-plugins/`, `tech-stack.yaml` |
| **Companion to** | ROME-PROP-035 (single-session orchestration on the sub-agent model) |
| **Relates to** | ROME-PROP-025 (capability-based architecture), ROME-PROP-021 (multi-robot parallel execution), Roma orchestrator v3.1 (capability-based dependency graph) |

---

## Executive Summary

Legacy ROME hardwires **three named generation seats** — Ashok (DB), Reena (API), Charlie (UI) — into the framework's structure. This bakes in a single **3-layer monolith** assumption. Real systems vary: some have one UI / one API / one DB; others have **multiple UIs** (web, iOS, Android, admin, per-audience portals), **multiple services** (microservices, a BFF per frontend, shared domain libraries), or **fewer than three layers** (a static site, a CLI, a library). The fixed-seat model scales neither up (no seat for a 4th UI; one Charlie bottlenecks three frontends) nor down (three seats for a one-component app).

This proposal makes the application's **architecture topology a first-class design artifact** and treats generation **roles as capabilities the orchestrator instances per component**, rather than fixed seats. The number of UIs, services, and layers becomes **data** (a component graph) that drives dynamic, dependency-ordered fan-out — completing the capability-based direction begun in ROME-PROP-025 and Roma orchestrator v3.1, now executable on the PROP-035 sub-agent primitive.

---

## 1. Problem Statement

### 1.1 Fixed seats encode a fixed architecture

P5 declares exactly Ashok/Reena/Charlie. This is structurally a 3-layer monolith. Consequences:

- **No scale-up.** A second or third UI has no seat. One UI role serializes work that should run in parallel across frontends.
- **No scale-down.** A static site or library does not need three roles; the model still presumes them.
- **No multi-service shape.** Microservices, BFFs, and shared libraries have no representation.

### 1.2 The shape is not captured anywhere

The design phase produces architecture prose but no machine-readable **component graph**, so the orchestrator has nothing to fan out over. Roma v3.1 introduced a capability-based dependency graph driven by `tech-stack.yaml`, but generation roles remain fixed seats rather than per-component instances.

---

## 2. Definitions

| Term | Meaning |
|------|---------|
| **Topology** | The shape of an application — what components it has and how they connect. |
| **Component graph** | Topology captured as data: nodes (components) + edges (dependencies). |
| **Capability** | A kind of generation work named independently of who performs it (e.g. *generate-ui*, *generate-service*, *generate-schema*), not bound to a fixed seat. |
| **Instancing** | Creating one concrete sub-agent from a capability for one specific component. Three UIs → three instances of *generate-ui*. |
| **DAG** | Directed Acyclic Graph — the dependency edges of the component graph; defines what must finish before what, with no cycles. |
| **Fan-out** | Launching many sub-agent instances concurrently, ordered only where the DAG requires. |

---

## 3. Proposed Solution

Four mechanics.

### 3.1 Deriving the component graph (P3 Design)

PMA (P3) produces a machine-readable **component graph** as a design artifact: `ARTIFACTS/_design/component-graph.yaml`. Each **node** declares:

- `id` — unique component identifier
- `type` — `ui | service | bff | db | shared-lib | integration`
- `platform` — `web | ios | android | desktop | cli | n/a`
- `audience` — `end-user | admin | partner | n/a`
- `capability` — the generation capability that builds it
- `dependsOn[]` — other node ids it requires

A simple app emits 3 nodes; a complex app emits many. Clara validates the graph (completeness, no cycles, every node resolvable to a capability) at GATE-P3.

### 3.2 Roles as capabilities, instanced per component (P5 Generation)

Generation roles are redefined as **capabilities**, not seats:

| Legacy seat | Capability | Instanced |
|-------------|------------|-----------|
| Ashok (DB) | `generate-schema` | once per `db` node |
| Reena (API) | `generate-service` | once per `service` / `bff` node |
| Charlie (UI) | `generate-ui` | once per `ui` node |
| — (new) | `generate-shared-lib` | once per `shared-lib` node |
| — (new) | `generate-integration` | once per `integration` node |

The orchestrator (PROP-035) reads the component graph and **instances one sub-agent per node**, each with isolated context scoped to that component and the matching capability's skills. Persona names (Ashok/Reena/Charlie) are retained as **capability aliases** for continuity, not as instance limits.

### 3.3 DAG-driven fan-out (orchestrator)

The orchestrator topologically sorts the component graph's `dependsOn` edges into a DAG and fans out:

```
1. Build dependency DAG from component-graph.yaml
2. Generate nodes with no unmet dependencies, concurrently
3. As each completes, release nodes whose dependencies are now met
4. Continue until all nodes generated, then join → GATE-P5
```

Typical order: shared libs + DB → services → BFFs → UIs, with every independent branch concurrent. Worktree isolation (PROP-035 §6c) is applied per instance where components would otherwise write conflicting paths.

### 3.4 Per-component traceability extension (EP-1)

The traceability chain extends to record **which component(s)** satisfy each requirement. A requirement implemented across several components (e.g. "password reset" → auth service + web UI + iOS UI) traces to all of them. Coverage is measured **per component**, so progress reflects "done in web UI, pending in iOS" rather than a single binary.

Chain becomes: `requirement → feature → component(s) → code → test`, indexed by component.

---

## 4. Worked Examples

**Simple app (degrades gracefully):** a static marketing site → component graph = 1 `ui` node → orchestrator instances 1 `generate-ui` sub-agent → no fan-out → single-component traceability. Same machinery, minimal footprint.

**Standard 3-layer:** UI + API + DB → 3 nodes → 3 instances (one each capability) → behaves exactly like legacy P5.

**Complex multi-platform SaaS:** web app + admin console + iOS app + auth service + billing service + shared-types lib + Postgres → 7 nodes →
- instance: 3 × `generate-ui`, 2 × `generate-service`, 1 × `generate-shared-lib`, 1 × `generate-schema` (7 instances from 4 capabilities)
- fan-out: lib + DB first → auth + billing in parallel → 3 UIs in parallel
- traceability: each requirement traced across the components that implement it.

---

## 5. Principle Alignment

| Principle | Effect |
|-----------|--------|
| EP-1 Traceability | Extended to component dimension; per-component coverage. **Enhanced.** |
| EP-2 Structured phases | Component graph is a P3 deliverable with a validation gate. **Enhanced.** |
| EP-6 Specialization | Capabilities remain specialized; instances are scoped per component. **Preserved.** |
| EP-7 Optimal operation | Parallel fan-out across all independent components; no seat bottleneck; scales down too. **Enhanced.** |

---

## 6. Migration Path

Builds on the PROP-035 orchestrator and the PROP-025 capability model.

- **T1** — Define `component-graph.yaml` schema; add Clara validation at GATE-P3 (no behavior change to P5 yet — single 3-node graph reproduces legacy).
- **T2** — Redefine generation roles as capabilities (`generate-schema/service/ui/shared-lib/integration`); persona names become aliases.
- **T3** — Orchestrator instances sub-agents per node and fans out on the DAG (delivers PROP-021 generally, not just for 3 fixed robots).
- **T4** — Extend traceability index to the component dimension; report per-component coverage.

T1 is non-breaking; a legacy 3-layer project emits a 3-node graph and runs as today.

---

## 7. Risks

| Risk | Mitigation |
|------|------------|
| Over-decomposition (too many tiny components) | Clara validates granularity at GATE-P3; component = independently buildable unit, not every file. |
| Concurrency explosion across many components | Orchestrator concurrency cap; DAG batching; worktrees only where paths conflict. |
| Cyclic dependencies in component graph | DAG validation rejects cycles at GATE-P3 before generation. |
| Capability coverage gaps (a node with no capability) | GATE-P3 requires every node resolve to a known capability; unknown types block. |
| Cross-component integration drift | A `generate-integration` capability + Charlie-style integration verification at GATE-P5. |

---

## 8. Recommendation

1. Make the **component graph** a first-class P3 design artifact, validated at GATE-P3.
2. Redefine generation roles as **capabilities instanced per component**; retain persona names as aliases.
3. Have the orchestrator **fan out on the dependency DAG**, scaling up and down to the topology.
4. Extend **traceability to the component dimension** with per-component coverage.
5. Sequence T1 (non-breaking graph + validation) first; T2–T4 once PROP-035 P5 conversion is proven.

---

## Open Questions for Sponsor

1. Granularity rule for "a component" — independently buildable/deployable unit? Recommend yes (not per-file, not per-feature).
2. Retain persona names as capability aliases, or move to capability names outright? Recommend retain as aliases (continuity).
3. Should the component graph be sponsor-confirmable before P5 fan-out (cost/parallelism implications)? Recommend yes for graphs above a node threshold.

---

## Revision History

| Version | Date | Summary |
|---------|------|---------|
| 1.0 | 2026-06-18 | Initial draft — component graph as P3 artifact, generation roles as capabilities instanced per component, DAG-driven fan-out scaling up/down to topology, per-component traceability extension. |
