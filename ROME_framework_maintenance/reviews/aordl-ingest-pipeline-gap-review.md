# AORDL Ingest Pipeline: Gap Review

| Field | Value |
|-------|-------|
| **Document UID** | ROME-REV-005 |
| **Version** | 1.0 |
| **Date** | 2026-03-04T00:00:00Z |
| **Status** | Review |
| **Document Type** | Framework Gap Review |
| **Author** | Framework Analyst & Architect |
| **Source Materials** | `admin_business_processes.md` (London Bike Tours), `feature1_departure_operations_detailed.md` |
| **Phases Reviewed** | P1 (AORDL), P2 (Analysis), P3 (Design) |

---

## Executive Summary

**Purpose:** Assess how ROME ingests structured raw inputs through formal analysis documents (AORDL → Requirements Matrix → Design) to produce quality and accurate systems. Identify gaps using real-world input documents as the test case.

**Input Observation:** The source documents are high quality but operate at different abstraction levels:
- `admin_business_processes.md` — business process specification (what + why). Well-structured, actor-specific, trigger-explicit. Maps directly to P1 AORDL.
- `feature1_departure_operations_detailed.md` — implementation specification (how + UI + data + SQL). Contains pre-committed design decisions. Does NOT belong in P1 — belongs in P3 as design constraints.

**Key Finding:** ROME has one input pathway (raw-requirements → AORDL) but multi-level input documents require two pathways. Three of seven gaps share this root cause.

**Gaps Identified:** 7 gaps across Critical (3), Significant (3), Moderate (1).

---

## Source Material Assessment

### admin_business_processes.md

6 features, each with 4–7 named business processes (BP-#.#):

| Attribute | Assessment |
|-----------|-----------|
| Actor specificity | Strong — named roles: Tour Guide, Equipment Manager, Operations Manager |
| Trigger definition | Explicit — time-based, user-initiated, system-generated |
| Decision points | Documented — branching to sub-processes (e.g., BP-1.1 → BP-1.6) |
| Success criteria | Present per process |
| AORDL readiness | High — requires decomposition but content is clean |

### feature1_departure_operations_detailed.md

Detailed implementation specification for Feature 1 only:

| Attribute | Assessment |
|-----------|-----------|
| UI mockups | Present — ASCII wireframes with field-level detail |
| Data specifications | Explicit — SQL queries, table/column names, status enum values |
| URL patterns | Specified — `/admin/dashboard`, `/admin/departures/{id}` |
| Performance SLAs | Embedded — "data loads within 1 second" |
| AORDL suitability | LOW — anti-pattern detector will reject SQL, URLs, UI language |
| Design constraint value | HIGH — pre-specified decisions that PMA must not re-derive |

---

## Gap Analysis

### GAP-1: No Input Document Classification (Critical)

**Description:**
ROME places all input files in `_user_input/raw-requirements/` and Talib processes them uniformly as P1 source material. There is no mechanism to classify inputs by abstraction level before processing.

**Impact:**
- Talib attempts AORDL extraction from `feature1_departure_operations_detailed.md`
- AORDL anti-pattern validation rejects embedded SQL, URLs, and UI language as violations
- Pre-specified design constraints are discarded rather than routed to P3
- PMA re-derives data model and UI independently, potentially conflicting with the source spec

**Current state:** `_user_input/technical-brief.yaml` is noted as optional in Roma's startup procedure. No structured slots. No routing logic.

**Root cause:** Single input pathway; no intake classification step.

---

### GAP-2: Process Sequence and Decision Branching Lost (Critical)

**Description:**
AORDL is atomic — one Actor + one Intent per REQ. Business processes are sequential and branching. BP-1.1 has 7 ordered steps; each step may branch to a different process (BP-1.6) under specific conditions.

**What is lost:**
- Step ordering within a business process
- Conditional routing to alternative processes ("If weather unsafe → BP-1.6")
- Sub-process invocation ("Roll Call → triggers Equipment Confirmation")

**AORDL field analysis:**

| BP Concept | Nearest AORDL field | Adequacy |
|-----------|-------------------|----------|
| Process sequence | `metadata.dependencies` | Partial — logical dep only, not ordering |
| Conditional branch trigger | `Conditions` | Partial — captures trigger, not target |
| Target process/subprocess | None | Not captured |
| Alternative path | `Errors` | Misuse — errors ≠ alternative flows |

**Impact:**
By P2, decomposed REQs exist but their sequential and conditional relationships are gone. PMA reconstructs flow in P3 through inference, potentially incorrectly.

---

### GAP-3: Pre-Specified Design Decisions Have No Preservation Pathway (Critical)

**Description:**
`feature1_departure_operations_detailed.md` contains committed design decisions that must propagate to P3 as constraints:

| Decision type | Example | Must reach |
|--------------|---------|-----------|
| Status taxonomy | `PENDING → PREPARING → READY → DEPARTED → COMPLETED` | Ashok (schema) |
| Data model shape | `departures JOIN bookings JOIN guides` | Ashok (schema) |
| URL conventions | `/admin/departures/{departure_id}` | Reena (API design) |
| Performance SLA | "data loads within 1 second" | Reena + Ashok (NFR) |
| UI patterns | Tab navigation, card layout, colour coding | Charlie + Clara |

**Current state:** `technical-brief.yaml` exists but is:
- Optional (Roma logs absent file as a note, not a warning)
- Unstructured (free-form YAML, no defined sections)
- Not formally read by PMA as binding constraints

**Impact:** PMA re-derives these decisions independently. First conflict surface point is P5 code review or GATE-P5.

---

### GAP-4: No Back-Reference to Source Business Process (Significant)

**Description:**
AORDL `metadata` has `feature: FEATURE-XXX` but no field to reference the source business process (e.g., `BP-1.3`, `Step 4`).

**Impact:**
Traceability is forward-only: `REQ-### → FUNC-### → UC-### → Code`.
Backward traceability (Code → REQ → Source BP → Business Decision) is broken. During P5 review or post-delivery change requests, there is no path from a code change back to the originating business process document.

---

### GAP-5: Trigger Types Not Distinguished (Significant)

**Description:**
Business processes have three distinct trigger types:

| Type | Example | Architectural consequence |
|------|---------|--------------------------|
| Time-based | "2 hours before departure" | Scheduled job (cron) |
| User-initiated | "Guide presses [Depart]" | REST endpoint |
| Event-based | "Customer arrives at meeting point" | Event handler / webhook |

AORDL `Preconditions` collapses all triggers into state assertions. The trigger type is not preserved.

**Impact:**
Reena in P5 must infer the correct architectural pattern (REST vs scheduler vs event-driven) from contextual reading. Misclassification produces an incorrect implementation that passes functional tests but fails operationally.

---

### GAP-6: External System Dependencies Not Declared (Significant)

**Description:**
BP documents explicitly list required external systems:
- Weather forecast API
- Bike inventory database
- Customer booking records (implied as external)

AORDL has no field for external system or integration dependencies. These become buried in `Conditions` as state assertions ("weather forecast available") without declaring the integration requirement.

**Impact:**
PMA discovers external dependencies through inference in P3, not from declared inputs. Integration requirements may be missed or underspecified. API design may omit required adapters or service boundaries.

---

### GAP-7: Multi-Actor Role Relationships Not Captured (Moderate)

**Description:**
The system has actors with overlapping roles and hierarchical authority:
- One person may be both Tour Guide and Equipment Manager
- Operations Manager can override Guide decisions
- Customer bookings create constraints on Guide preparation workflow

AORDL captures one Actor per REQ. No field exists for:
- Role hierarchy and override authority
- Role overlap (same person, multiple roles)
- Cross-actor dependencies (Customer action → Guide constraint)

**Impact:**
Access control design in P3 is derived from individual REQ actors only. Role hierarchy and permission inheritance must be inferred by PMA without explicit input.

---

## Gap Summary

| ID | Description | Phase Impact | Severity |
|----|-------------|-------------|----------|
| GAP-1 | No input document classification | P1 anti-pattern rejection of valid constraints | Critical |
| GAP-2 | Process sequence and branching lost | P2 loses flow; P3 re-derives incorrectly | Critical |
| GAP-3 | Pre-specified design decisions unpreserved | P3 conflict with sponsor's committed design | Critical |
| GAP-4 | No back-reference to source BP | Forward-only traceability | Significant |
| GAP-5 | Trigger types collapsed | Wrong architectural pattern in P5 | Significant |
| GAP-6 | External dependencies not declared | P3 integration requirements missed | Significant |
| GAP-7 | Role relationships not captured | Access control design incomplete | Moderate |

---

## Root Cause Analysis

Three of seven gaps (GAP-1, GAP-3, GAP-5, GAP-6) share a common root cause:

> **ROME has one input pathway. Real-world sponsors provide multi-level input documents.**

A requirements document and an implementation specification are both valid sponsor inputs but belong at different pipeline stages. Processing both through P1 AORDL either:
- Rejects legitimate design constraints (anti-pattern detection), or
- Allows technical jargon into AORDL (validation failure)

The secondary root cause (GAP-2, GAP-4) is:

> **AORDL atomicity cannot represent process flow. The template has no sequence, branch, or source-reference fields.**

---

## Remediation Direction

### R1: Formalise Technical Brief as Structured Intake Document (resolves GAP-1, GAP-3, GAP-5, GAP-6)

Elevate `_user_input/technical-brief.yaml` from optional free-form to mandatory structured document with defined sections:

```yaml
# Proposed technical-brief.yaml structure
pre_specified_decisions:
  data_model: []        # Schema hints, table names, status enums
  api_conventions: []   # URL patterns, versioning approach
  ui_patterns: []       # Navigation, layout, colour conventions
  performance_slas: []  # Response time, throughput targets

external_dependencies:
  - name: "Weather Forecast API"
    type: external_api
    required_by: [BP-1.1]

trigger_types:
  - process: BP-1.1
    trigger: time_based
    schedule: "T-2h before departure"
  - process: BP-1.3
    trigger: user_initiated
```

Bootstrap writes this structure; sponsor populates before P1. PMA reads it as binding constraints in P3.

### R2: Add Source Reference and Flow Fields to AORDL Template (resolves GAP-2, GAP-4)

Two additions to AORDL metadata:

```yaml
metadata:
  sourceRef: "BP-1.1 Step 3"     # Back-reference to source BP
  sequence: 3                     # Ordinal within parent process
  nextStep: REQ-024               # Next REQ in happy path
  alternativePath:                # Conditional branch
    condition: "weather unsafe"
    target: REQ-045               # REQ representing BP-1.6
```

### R3: Add Actor Hierarchy Document to P1 Deliverables (resolves GAP-7)

Introduce a lightweight `actor-hierarchy.yaml` as a P1 deliverable alongside REQ-*.yaml files:

```yaml
actors:
  - role: OperationsManager
    authority: override
    can_override: [TourGuide, EquipmentManager]
  - role: TourGuide
    may_also_be: EquipmentManager
```

---

## Proposed Next Steps

| Action | Priority |
|--------|---------|
| ROME-PROP-031: Structured Technical Brief (R1) | High |
| ROME-PROP-032: AORDL source-ref and flow fields (R2) | High |
| ROME-PROP-033: Actor hierarchy deliverable in P1 (R3) | Medium |

---

## Revision History

| Version | Date | Summary |
|---------|------|---------|
| 1.0 | 2026-03-04T00:00:00Z | Initial gap review — AORDL ingest pipeline vs real-world multi-level input documents |
