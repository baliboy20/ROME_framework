# Code Organisation Standard

| Field | Value |
|-------|-------|
| **Document UID** | ROME-GOV-014 |
| **Version** | 1.0 |
| **Date** | 2026-03-05T00:00:00Z |
| **Status** | Active |
| **Document Type** | Framework Standard |
| **Author** | Framework Analyst & Architect |

---

## Purpose

Defines the mandatory code organisation structure for all P5 generated code — feature-based directory layout, TRACEABILITY.md specification, full traceability chain definition, and P5 execution mode determination. Single source of truth consumed by Ashok, Reena, and Charlie (code generation) and Sarah (GATE-P5 traceability validation).

---

## Feature-Based Directory Structure

All generated code must be organised by business feature, not by technical layer.

```
SOURCE/[workspace]/
└── features/
    ├── [feature_name]/
    │   ├── TRACEABILITY.md          # REQUIRED — see specification below
    │   ├── models/                  # Data/entity definitions (Ashok)
    │   ├── migrations/              # Schema migrations (Ashok)
    │   ├── seeds/                   # Seed data (Ashok)
    │   ├── services/                # Business logic (Reena)
    │   ├── controllers/             # API controllers (Reena)
    │   ├── middleware/              # Auth, validation, logging (Reena)
    │   ├── screens/ or pages/       # UI screens (Charlie)
    │   ├── components/              # Reusable UI components (Charlie)
    │   └── tests/                   # All tests for this feature
    │       ├── unit/
    │       ├── integration/
    │       └── ui/
    └── [feature_name_2]/
        └── ...
```

**Rule:** No code file may exist outside a named feature directory. Cross-feature shared utilities belong in a `shared/` directory at the workspace root, not in a feature directory.

---

## TRACEABILITY.md Specification

Every feature directory must contain a `TRACEABILITY.md` file. This file is mandatory — its absence is a GATE-P5 blocker.

### Required Content

```markdown
# TRACEABILITY — [Feature Name]

## Requirement Chain

| REQ-### | [Requirement title] |
| FUNC-### | [Feature title] |
| US-### | [User story title] |
| UC-### | [Use case title] |

## Entity Mapping

| Entity | Data Dictionary Entry | Implemented In |
|--------|----------------------|----------------|
| [Entity name] | data-dictionary.yaml § [section] | [file path] |

## API Mapping

| Endpoint | API Design Entry | Implemented In |
|----------|-----------------|----------------|
| [METHOD /path] | api-design.md § [section] | [file path] |

## Screen Mapping

| Screen | Wireframe/Design Reference | Implemented In |
|--------|---------------------------|----------------|
| [Screen name] | [design doc reference] | [file path] |

## Test Coverage

| Test Type | File | Covers |
|-----------|------|--------|
| Unit | [path] | [what it tests] |
| Integration | [path] | [what it tests] |
| UI | [path] | [what it tests] |
```

---

## 7-Link Traceability Chain

ROME enforces a complete bidirectional traceability chain from raw requirement to running code.

### Forward Chain (Requirement → Code)

```
REQ-###     (AORDL requirement)
  → FUNC-### (Feature — P2 decomposition)
    → US-###  (User story — P2)
      → UC-### (Use case — P3 design)
        → Entity / API Endpoint / Screen (P3 design artefacts)
          → Implementation file (P5 code)
            → Test file (P5 tests)
```

### Backward Chain (Code → Requirement)

```
Test file
  ← Implementation file
    ← Entity / API Endpoint / Screen
      ← UC-###
        ← US-###
          ← FUNC-###
            ← REQ-###
```

**Rule:** Every generated file must be traceable backward to at least one REQ-###. Any code not traceable to a requirement is out-of-scope and must not be introduced without a Change Request.

---

## P5 Execution Mode

### Determination

P5 execution mode is determined by Roma at P5 start, based on P3 design artifact completeness.

| Condition | Execution Mode |
|-----------|---------------|
| `data-dictionary.yaml` fully specifies all entities, fields, and constraints AND `api-design.md` fully specifies all endpoints with request/response shapes | **Parallel** — Ashok, Reena, and Charlie start simultaneously |
| P3 design artefacts have gaps, underspecified contracts, or ambiguous schemas | **Sequential** — Ashok first, then Reena, then Charlie |

Roma's `procedures/p5-capability-coordination.md` governs mode determination and documents the decision in the activity log.

### Parallel Mode

All three robots start simultaneously. Each reads from P3 design documents as the contract:
- Ashok reads: `data-dictionary.yaml`
- Reena reads: `api-design.md` + `data-dictionary.yaml`
- Charlie reads: `api-design.md` + design assets (wireframes, design system)

No robot waits for another robot's code output. Conflicts are resolved via activity log blockers.

### Sequential Mode (Fallback)

When P3 contracts are incomplete, implementation order resolves ambiguities:

1. **Ashok** completes database schema and ORM models
2. **Reena** starts after Ashok PHASE-5 COMPLETED event in activity log — reads Ashok's actual schema files to resolve gaps
3. **Charlie** starts after Reena PHASE-5 COMPLETED event — reads Reena's actual API response shapes to resolve gaps

**Dependency detection:** Each robot queries the activity log before starting:
```
query: robot=[predecessor], phase=P5-generation, status=COMPLETED
```
Proceed only when the predecessor's COMPLETED event is present.

---

## Feature Naming Convention

Feature directory names must:
- Use lowercase with hyphens: `departure-operations`, `booking-management`
- Match the feature name in `actionlist.md`
- Be stable — never renamed after P5 starts (would break traceability links)

---

## GATE-P5 Blocking Checklist

All criteria must pass before Roma may declare delivery.

| # | Check | Pass Criteria |
|---|-------|---------------|
| 1 | Feature completeness | Every feature in actionlist.md has a corresponding directory |
| 2 | TRACEABILITY.md presence | Every feature directory contains TRACEABILITY.md |
| 3 | Chain completeness | Every TRACEABILITY.md has complete 7-link chain entries |
| 4 | No orphan code | No implementation files outside feature directories (except shared/) |
| 5 | Test coverage | Every feature has unit + integration tests |
| 6 | Tests passing | All test suites pass with zero failures |
| 7 | Documentation | Every public API endpoint documented |

---

## Revision History

| Version | Date | Summary |
|---------|------|---------|
| 1.0 | 2026-03-05T00:00:00Z | Created — extracted from rome-p5-generation phase plugin (ROME-PROP-034). Execution chain updated from mandatory sequential to conditional — parallel when P3 contracts are complete. |
