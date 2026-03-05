# Analysis Standard

| Field | Value |
|-------|-------|
| **Document UID** | ROME-GOV-013 |
| **Version** | 1.0 |
| **Date** | 2026-03-05T00:00:00Z |
| **Status** | Active |
| **Document Type** | Framework Standard |
| **Author** | Framework Analyst & Architect |

---

## Purpose

Defines the requirements analysis framework used in P2 — the 8-dimension coverage model, complexity scoring algorithm, cross-requirement dependency taxonomy, and AORDL-to-P2 transformation rules. Single source of truth consumed by Talib (analysis execution) and Sarah (GATE-P2 validation).

---

## 8-Dimension Analysis Framework

Every AORDL requirement must be analysed across all 8 dimensions. No dimension may be left unevaluated.

| # | Dimension | Derived From AORDL Fields | What It Captures |
|---|-----------|--------------------------|------------------|
| 1 | **Functional** | Intent, Outcomes | Core system capabilities and business actions |
| 2 | **Data Model** | Invariants, Postconditions | Entities, attributes, relationships, constraints |
| 3 | **Business Rules** | Conditions, Invariants | Domain logic, validation rules, enforced policies |
| 4 | **Security** | NonFunctional.Security | Authentication, authorisation, data protection requirements |
| 5 | **Performance** | NonFunctional.Performance | Response time, throughput, concurrency targets |
| 6 | **Quality** | Errors, Conditions | Error handling, edge cases, failure modes |
| 7 | **Integration** | Actor interactions, Preconditions | External system dependencies, service boundaries |
| 8 | **Deployment** | NonFunctional constraints | Infrastructure, environment, operational requirements |

---

## AORDL → P2 Artifact Transformation

| From AORDL | To P2 Artifact | Format |
|------------|----------------|--------|
| REQ-### | Feature (FUNC-###) | One or more features per requirement |
| Actor | User role in user stories | `As a [Actor]` |
| Intent | User story capability | `I want to [Intent]` |
| Outcomes | Acceptance criteria | `So that [Outcome]` / `Then [verifiable state]` |
| NonFunctional | NFR specification | Aggregated into non-functional-requirements.md |
| Errors | Error handling requirements | Per-error acceptance criteria |

**Traceability chain established in P2:**
```
REQ-### → FUNC-### → US-### → AC-###
```

---

## Complexity Scoring Algorithm

Each requirement receives a complexity score used to flag candidates for decomposition.

### Inputs

| Factor | Score per unit |
|--------|---------------|
| Number of Preconditions | +1 each |
| Number of Postconditions | +1 each |
| Number of Invariants | +1.5 each |
| Number of Conditions | +1 each |
| Number of Error scenarios | +1.5 each |
| NonFunctional.Performance entries | +2 each |
| NonFunctional.Security entries | +2 each |
| NonFunctional.Usability entries | +1 each |
| Cross-requirement dependencies identified | +3 each |

### Classification

| Score | Band | Action |
|-------|------|--------|
| 1–10 | **Low** | Proceed as single requirement |
| 11–20 | **Medium** | Document decomposition rationale; may proceed |
| 21+ | **High** | Decompose into atomic requirements before P2 completion |

High-complexity requirements are a P2 blocker if not decomposed before GATE-P2.

---

## Cross-Requirement Dependency Taxonomy

Three dependency types must be identified and documented in `requirements-matrix.yaml`.

### Sequential Dependency
REQ-B cannot be executed until REQ-A has completed.

```yaml
dependency:
  type: sequential
  source: REQ-001
  target: REQ-002
  rationale: "User must authenticate before viewing profile"
```

### Conditional Dependency
REQ-C is only valid or applicable if REQ-A exists or has been executed.

```yaml
dependency:
  type: conditional
  source: REQ-001
  target: REQ-003
  condition: "Only applies when user has admin role"
```

### Referential Dependency
REQ-D references entities, data, or invariants established by REQ-A.

```yaml
dependency:
  type: referential
  source: REQ-001
  target: REQ-004
  shared: "User entity, email invariant"
```

---

## Coverage Gap Detection

P2 analysis must identify and document the following gap types:

| Gap Type | Description | Required Action |
|----------|-------------|-----------------|
| Missing CRUD operations | Entity has create but no delete, or read but no update | Flag in requirements-matrix.yaml; raise OpenQuestion |
| Unaddressed actors | Actor appears in source material but has no REQ | Raise OpenQuestion to sponsor |
| Incomplete error handling | Happy path defined but no error scenarios | Add Error entries to affected REQ |
| Conflicting invariants | Two requirements assert contradictory domain truths | Raise as blocker — must resolve before GATE-P2 |
| Competing NFRs | Two requirements have incompatible performance or security constraints | Flag for P3 architecture decision |

---

## GATE-P2 Blocking Checklist

All criteria must pass before Roma may transition to P3.

| # | Check | Pass Criteria |
|---|-------|---------------|
| 1 | All requirements analysed | Every REQ-### has a corresponding entry in requirements-matrix.yaml |
| 2 | 8-dimension coverage | No dimension left unevaluated for any requirement |
| 3 | Feature derivation | Every REQ-### maps to at least one FUNC-### |
| 4 | User story generation | Every FUNC-### has at least one US-### with acceptance criteria |
| 5 | High-complexity decomposed | No requirement with score 21+ remains undecomposed |
| 6 | Conflicts resolved | No unresolved conflicting invariants or competing NFRs |
| 7 | Dependencies documented | All cross-requirement dependencies typed and recorded |
| 8 | Handover document complete | phase2-handover.md exists with summary of all features |

---

## Output Artifact Specification

| Artifact | Location | Description |
|----------|----------|-------------|
| `requirements-matrix.yaml` | `ARTIFACTS/_requirements/` | 8-dimension coverage per requirement; dependency map |
| `user-stories.md` | `ARTIFACTS/_requirements/` | US-### entries with acceptance criteria |
| `acceptance-criteria.md` | `ARTIFACTS/_requirements/` | AC-### entries linked to US-### |
| `non-functional-requirements.md` | `ARTIFACTS/_requirements/` | Aggregated NFR specifications |
| `phase2-handover.md` | `ARTIFACTS/_requirements/` | P2 exit document for P3 entry |

---

## Revision History

| Version | Date | Summary |
|---------|------|---------|
| 1.0 | 2026-03-05T00:00:00Z | Created — extracted from rome-p2-analysis phase plugin (ROME-PROP-034) |
