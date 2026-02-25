# ROME-PROP-025: Capability-Based Architecture

| Field | Value |
|-------|-------|
| **Proposal ID** | ROME-PROP-025 |
| **Title** | Capability-Based Architecture — Replace Fixed Layers with Dynamic Capabilities |
| **Status** | Draft |
| **Created** | 2026-02-25 |
| **Version** | 1.0 |
| **Author** | Framework Analyst & Architect |
| **Priority** | HIGH |
| **Complexity** | High |
| **Dependencies** | ROME-PROP-024 (Feature Technical Specifications) |
| **Scope** | Replace fixed db/api/ui layer model with dynamic capability declarations |

---

## Problem Statement

### Fixed Three-Layer Model

ROME hardcodes three layers mapped to three P5 robots in a fixed dependency chain:

```
db (Ashok) → api (Reena) → ui (Charlie)
```

This assumption is embedded in **52 locations across 14 files**: the STORY ID pattern, Roma's orchestrator logic, Sarah's GATE-P5 validation, Lucien's scaffolding, Bootstrap's initialization, and every P5 robot's identity and mode file.

### What Breaks

| Scenario | Problem |
|----------|---------|
| Static website + Flutter components | Two frontends, one robot, one "ui" layer |
| Message queue / background workers | Fourth concern — not db, api, or ui |
| Notification service (SendGrid, etc.) | Shared service consumed by features — no layer for it |
| ML pipeline / data processing | Additional backend concern beyond API |
| Project without a database | Ashok has nothing to do but framework expects db layer |
| CDN / edge functions | Deployment concern with its own code |

### Root Cause

ROME conflates two concepts:

- **Feature** (vertical): User-facing value that cuts through the system
- **Layer** (horizontal): System service that features consume

Features are flexible (FUNC-### can be anything). Layers are fixed (always exactly db/api/ui). Features should be able to consume any number of system services, but the framework constrains them to exactly three.

---

## Proposed Solution

### Replace Layers with Capabilities

**Capability:** A system service that features consume. Defined per project in `tech-stack.yaml` by PMA in P3. Not fixed by the framework.

```
Feature (vertical)     ←→     Capability (horizontal)
FUNC-### (unchanged)           Declared in tech-stack.yaml
User-facing value              System service
Cuts through capabilities      Consumed by features
```

### tech-stack.yaml Schema (Extended)

```yaml
# Current (implicit, hardcoded)
# Always: database → api → ui

# Proposed (explicit, declared)
capabilities:
  - id: database
    technology: PostgreSQL
    robot: ashok
    workspace: database

  - id: api
    technology: Hono (Bun)
    robot: reena
    workspace: backend-api

  - id: ui-app
    technology: Flutter
    robot: charlie
    workspace: frontend-app

  - id: ui-static
    technology: Astro
    robot: charlie
    workspace: marketing-site

  - id: notifications
    technology: SendGrid
    robot: reena
    workspace: backend-api

dependencies:
  api: [database]
  ui-app: [api]
  ui-static: []
  notifications: [api]
```

### Key Properties

| Property | Current (Fixed) | Proposed (Capabilities) |
|----------|----------------|------------------------|
| Number of services | Always 3 | Any number |
| Robot assignment | 1:1 (Ashok=db, Reena=api, Charlie=ui) | Many:1 (multiple capabilities per robot) |
| Workspace assignment | 1:1 | Many:1 (multiple capabilities can share a workspace) |
| Dependencies | Hardcoded chain | Declared per project |
| Adding a service | Framework change required | Add entry to tech-stack.yaml |

---

## STORY ID Pattern

### Current
```
STORY-[EPIC]-[FEAT]-[SEQ]-[LAYER]
  where LAYER ∈ {db, api, ui}
```

### Proposed
```
STORY-[EPIC]-[FEAT]-[SEQ]-[CAP]
  where CAP = capability ID from tech-stack.yaml
```

### Examples

```
STORY-001-002-1-database        (was: STORY-001-002-1-db)
STORY-001-002-1-api             (unchanged)
STORY-001-002-1-ui-app          (was: STORY-001-002-1-ui)
STORY-001-002-1-ui-static       (new — not possible before)
STORY-001-002-1-notifications   (new — not possible before)
```

---

## Dependency Coordination

### Current (Roma Orchestrator)

```
Hardcoded in orchestrator.md lines 360-450:
  1. Ashok MUST complete first
  2. Reena depends on Ashok
  3. Charlie depends on Reena
  Roma enforces this sequence.
```

### Proposed

Roma reads `dependencies` from tech-stack.yaml and builds a dependency graph dynamically:

```
FOR EACH capability in tech-stack.yaml.capabilities:
  deps = dependencies[capability.id] or []
  IF all deps have status COMPLETED:
    capability is READY — robot can start
  ELSE:
    capability is BLOCKED — wait
```

This handles any topology:
- Linear chain: database → api → ui (same as today)
- Parallel: ui-static starts immediately (no deps), api waits for database
- Diamond: multiple capabilities depending on the same upstream
- Independent: capabilities with no dependencies run in parallel from the start

---

## Feature Spec Impact (ROME-PROP-024)

Feature specs (SPEC-###) currently have hardcoded Implementation subsections:

```markdown
## Implementation
### Database (Ashok)
### Backend (Reena)
### Frontend (Charlie)
```

With capabilities, these become dynamic — one subsection per capability the feature touches:

```markdown
## Implementation
### database (Ashok)
### api (Reena)
### ui-app (Charlie)
### notifications (Reena)
```

PMA generates these headings from the capability declarations in tech-stack.yaml.

---

## Impact Assessment

### Change Points: 52 instances across 14 files

| File | Category | Instances | Severity |
|------|----------|-----------|----------|
| `lexicon.md` | LAYER_ENUM | 4 | Medium — redefine terms |
| `activity-log-format.md` | STORY_ID | 17 | Medium — update pattern + examples |
| `activity-log-file/README.md` | STORY_ID | 4 | Low — update examples |
| `roma/modes/orchestrator.md` | DEPENDENCY_CHAIN | 8 | **High — rewrite ~80 lines** |
| `ashok/modes/P5-generation.md` | LAYER_ENUM | 2 | Low — change attribute |
| `reena/modes/P5-generation.md` | LAYER_ENUM | 1 | Low — change attribute |
| `charlie/modes/P5-generation.md` | LAYER_ENUM | 1 | Low — change attribute |
| `sarah/modes/QA-validator.md` | ROBOT_LIST | 3 | Medium — dynamic validation |
| `lucien/modes/P4-config.md` | LAYER_ENUM + CHAIN | 3 | Medium — scaffold per capability |
| `bootstrap/modes/P0-bootup.md` | ROBOT_LIST | 1 | Low — remove fixed list |
| `ashok/ROBOT.md` | DEPENDENCY_CHAIN | 1 | Low — update coordination |
| `reena/ROBOT.md` | DEPENDENCY_CHAIN | 1 | Low — update coordination |
| `charlie/ROBOT.md` | DEPENDENCY_CHAIN | 1 | Low — update coordination |
| `lucien/ROBOT.md` | ROBOT_LIST | 2 | Low — update downstream |

### Critical Path

Roma's orchestrator rewrite is the highest-risk change. All other changes are mechanical (find/replace layer references). The orchestrator must become a generic dependency graph coordinator.

---

## PMA's Expanded Role

PMA already selects the tech stack. This proposal extends P3 responsibilities:

1. **Define capabilities** — id, technology, robot, workspace in tech-stack.yaml
2. **Declare dependencies** — which capabilities depend on which
3. **Assign features to capabilities** — in the actionlist (which features need which capabilities)
4. **Create feature spec headings** — Implementation section per capability, not per fixed layer

---

## Backward Compatibility

Default tech-stack.yaml for standard client-server app:

```yaml
capabilities:
  - id: database
    technology: PostgreSQL
    robot: ashok
    workspace: database
  - id: api
    technology: Node.js
    robot: reena
    workspace: backend-api
  - id: ui
    technology: Flutter
    robot: charlie
    workspace: frontend-app

dependencies:
  api: [database]
  ui: [api]
```

This produces identical behaviour to today's fixed model. Existing projects work unchanged.

---

## Lexicon Updates

### Modify

**Layer:** Currently "database | backend | frontend". Change to: "Deprecated. See Capability."

### Add

**Capability:**
- **Definition:** A system service that features consume. Declared per project in tech-stack.yaml.
- **Properties:** id (unique identifier), technology (framework/platform), robot (assigned P5 robot), workspace (SOURCE/ directory)
- **Examples:** database, api, ui-app, ui-static, notifications, cdn, ml-pipeline
- **Contrast:** Unlike the deprecated "layer" (fixed to db/api/ui), capabilities are project-specific and unbounded in number.

**Capability Dependency:**
- **Definition:** A declared relationship where one capability requires another to complete before it can start.
- **Declaration:** `dependencies` section in tech-stack.yaml
- **Enforcement:** Roma reads declarations and coordinates P5 execution order.

---

## Implementation Phasing

### Phase A: Proposal (this document)
- Write and review ROME-PROP-025
- No framework changes

### Phase B: Foundation (separate branch)
- Update Lexicon with Capability definition
- Define tech-stack.yaml capability schema
- Update PMA mode to declare capabilities
- Update Lucien mode to scaffold per capability

### Phase C: Execution Model (separate branch)
- Update STORY ID pattern in activity-log-format
- Rewrite Roma orchestrator dependency logic
- Update Sarah GATE-P5 validation
- Update P5 robot modes (layer → capability attribute)
- Update P5 ROBOT.md coordination sections
- Update Bootstrap robot initialization

---

## Revision History

| Version | Date | Summary |
|---------|------|---------|
| 1.0 | 2026-02-25 | Initial proposal |
