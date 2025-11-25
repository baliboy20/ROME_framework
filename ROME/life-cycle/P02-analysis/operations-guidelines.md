# Phase 2 - Analysis: Operations Guidelines

| Field | Value |
|-------|-------|
| **Document UID** | ROME-PHASE-003 |
| **Version** | 1.0 |
| **Date** | 2025-11-24T00:00:00Z |
| **Status** | Draft |
| **Document Type** | Phase Specification |
| **Author** | Framework Analyst & Architect |
| **Changes Approved** | false |

---

## Purpose

Defines WHAT Phase 2 (Analysis) must accomplish, including entry/exit criteria, required outputs, quality gates, and functional decomposition outcomes. Robot-specific procedures (HOW) are defined in respective robot CLAUDE.md documents.

## Dependencies

- ROME-PRIN-001 (Core Principles) - Phase Decomposition, Modularity & Vertical Slicing
- ROME-PROC-005 (Activity Logging Protocol) - Logging requirements
- ROME-PROC-002 (Sponsor Interaction Protocol) - Clarification procedures
- ROME-ROBOT-002 (Talib) - Primary robot for this phase
- ROME-PHASE-002 (P1 Ingest) - Predecessor phase

---

## Phase Overview

| Attribute | Value |
|-----------|-------|
| Phase Number | P2 |
| Phase Name | Analysis |
| Primary Robot | Talib |
| Predecessor | P1 (Ingest) |
| Successor | P3 (Design) |

**Objective:** Transform ingested raw materials into structured, atomic requirements across 8 dimensions, enabling PMA to design architecture without clarifying questions.

**Scope:** This phase INCLUDES:
- Functional decomposition (Epic → Feature → Story → Criteria → Atomic)
- 8-dimension requirements extraction
- Sponsor clarification for ambiguities
- Technical request capture
- Vertical slice identification
- Handover documentation

**Out of Scope:**
- Solution design (P3)
- Technology selection (P3, unless sponsor-specified)
- Architecture decisions (P3)

---

## Entry Criteria

Phase 2 MAY NOT begin until ALL criteria are met:

| Criterion | Verification |
|-----------|--------------|
| P1 complete | PHASE-1 status = COMPLETED |
| Document catalog exists | `document-catalog.md` in requirements/ |
| Ingest summary exists | `ingest-summary.md` in requirements/ |
| Roma approval | Orchestrator approved P1 → P2 transition |
| PHASE-2 entry created | Activity log contains PHASE-2 |

---

## Exit Criteria

Phase 2 MAY NOT transition to P3 until ALL criteria are met:

| Criterion | Verification | Blocking |
|-----------|--------------|----------|
| Requirements matrix complete | `requirements-matrix.yaml` exists with all 8 dimensions | Yes |
| Functional decomposition complete | Features decomposed to atomic requirements | Yes |
| User stories documented | `user-stories.md` complete | Yes |
| Acceptance criteria testable | All criteria are SMART | Yes |
| NFRs captured | `non-functional-requirements.md` complete | Yes |
| Technical requests captured | Section in matrix and handover | Yes |
| Ambiguities resolved | No open sponsor questions | Yes |
| Handover complete | `phase2-handover.md` with all sections | Yes |
| Activity log updated | PHASE-2 status = COMPLETED | Yes |
| Roma verification | Orchestrator confirms phase complete | Yes |
| **GATE-P2 APPROVED** | Sarah audit passed (ROME-PROC-006) | Yes |

---

## Quality Gates

**Note:** Internal quality gates (below) are validated by Talib during execution. GATE-P2 (Sarah audit) validates the complete phase output before P3 transition.

### Gate 1: Dimension Coverage

**Check:** All 8 dimensions addressed in requirements matrix.

**Pass Criteria:**
- Functional: Features with stories and acceptance criteria
- Data Model: Entities with attributes and relationships
- User Interface: Platforms and key screens identified
- Integration: External systems documented
- Security: Auth, authz, compliance addressed
- Performance: Quantified targets (response time, users, volume)
- Quality: Testing types and coverage specified
- Deployment: Platform, environments, frequency defined

**Failure Action:** Complete missing dimensions or document N/A with justification

### Gate 2: Decomposition Completeness

**Check:** Functional requirements fully decomposed.

**Pass Criteria:**
- Every feature has user stories
- Every story has acceptance criteria
- Acceptance criteria are SMART (Specific, Measurable, Achievable, Relevant, Testable)
- Atomic requirements identified where granularity needed

**Failure Action:** Continue decomposition until atomic level reached

### Gate 3: Ambiguity Resolution

**Check:** No unresolved sponsor questions.

**Pass Criteria:**
- All identified ambiguities have sponsor responses
- Responses documented in handover (Sponsor Decisions Log)
- Assumptions documented with risk assessment

**Failure Action:** Pursue remaining clarifications or document as assumptions

### Gate 4: Technical Request Capture

**Check:** Sponsor technical preferences captured for PMA.

**Pass Criteria:**
- Technical requests listed with priority (Required/Preferred/Flexible)
- Source documented (PRD section, sponsor meeting)
- Captured in both requirements-matrix.yaml and handover

**Failure Action:** Review materials and sponsor interactions for missed technical requests

### Gate 5: Handover Readiness

**Check:** PMA can proceed without clarifying questions.

**Pass Criteria:**
- Handover document complete (all 12 sections)
- Technical requests clear
- Sponsor decisions logged
- Open items explicitly assigned
- Assumptions documented with risk

**Failure Action:** Complete handover sections

---

## Outputs

### Required Artifacts

| Artifact | Location | Description |
|----------|----------|-------------|
| requirements-matrix.yaml | `ARTIFACTS/dev/requirements/` | Structured requirements across 8 dimensions |
| user-stories.md | `ARTIFACTS/dev/requirements/` | Detailed user stories with acceptance criteria |
| acceptance-criteria.md | `ARTIFACTS/dev/requirements/` | Consolidated testable criteria |
| non-functional-requirements.md | `ARTIFACTS/dev/requirements/` | Performance, security, scalability specs |
| phase2-handover.md | `ARTIFACTS/dev/requirements/` | Complete handover document for PMA |

### Functional Decomposition Outcomes

The analysis phase MUST produce a decomposition hierarchy:

```
Epic (Business Goal)
  └── Feature (FUNC-###)
        └── User Story (capability statement)
              └── Acceptance Criteria (testable conditions)
                    └── Atomic Requirement (indivisible unit)
```

**Feature Requirements:**
- Unique ID (FUNC-###)
- Clear title and description
- Priority (HIGH/MEDIUM/LOW)
- At least one user story

**User Story Requirements:**
- Format: "As a [role], I want [capability], So that [value]"
- Specific user role (not generic "user")
- Concrete capability
- Measurable value

**Acceptance Criteria Requirements:**
- SMART: Specific, Measurable, Achievable, Relevant, Testable
- No vague terms ("fast", "easy", "user-friendly")
- Quantified where possible

**Atomic Requirement Characteristics:**
- Cannot be split without losing meaning
- Single responsibility
- Traceable to implementation
- Independently verifiable

### 8 Dimensions Coverage

| Dimension | Required Content |
|-----------|------------------|
| Functional | Features, stories, criteria, atomic requirements |
| Data Model | Entities, attributes, relationships, constraints |
| User Interface | Platforms, screens, interactions, design preferences |
| Integration | External systems, API types, authentication methods |
| Security | Authentication, authorization, compliance, encryption |
| Performance | Response time, concurrent users, data volume, scalability |
| Quality | Testing types, coverage, error handling, monitoring |
| Deployment | Platform, environments, frequency, backup/recovery |

### Vertical Slice Outcomes

Analysis SHOULD identify vertical slices for implementation:

| Criteria | Description |
|----------|-------------|
| End-to-end | Delivers complete functionality across layers |
| Demonstrable | Can be shown to sponsor |
| Prioritized | Ordered by MVP importance, dependencies, risk |

### Technical Requests Schema

```yaml
technical_requests:
  - id: TECH-001
    category: platform|language|database|framework|integration
    requirement: "[Description]"
    priority: REQUIRED|PREFERRED|FLEXIBLE
    source: "[PRD section / Sponsor meeting date]"
```

---

## Traceability Requirements

### Decomposition Tracing

Every requirement MUST be traceable:

| From | To |
|------|----|
| Raw material | Feature (source reference) |
| Feature | User stories |
| Story | Acceptance criteria |
| Criteria | Atomic requirements (where applicable) |
| Atomic requirement | Dimension cross-reference |

### Sponsor Decision Tracing

Every sponsor interaction MUST be traceable:

| Element | Traceability |
|---------|--------------|
| Clarification request | Blocker ID, timestamp, question |
| Sponsor response | Decision, rationale, timestamp |
| Impact | Affected requirements, handover section |

---

## Activity Logging Requirements

All robots operating in this phase MUST follow the Activity Logging Protocol:
- **ROME-PROC-005**: `/ROME/robot-templates/robot-operations-protocols/activity-logging-protocol.md`

### Phase-Specific Logging

| Event | Required Action |
|-------|-----------------|
| Phase begins | Update PHASE-2: status → IN_PROGRESS, startDate |
| Blocker encountered | Create BLOCK-### entry, update affected item → BLOCKED |
| Sponsor clarification received | Update blocker → RESOLVED, log decision |
| Feature analyzed | Log progress in phase notes |
| Phase complete | Update PHASE-2: status → COMPLETED, completionDate |

### Required Log Entries

| Entry Type | When Created |
|------------|--------------|
| PHASE-2 | Phase start |
| BLOCK-### | Ambiguity or missing info discovered |
| AMD-### | Change needed to P1 materials |

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 0.1 | 2025-11-20T00:00:00Z | Initial phase specification placeholder |
| 1.0 | 2025-11-24T00:00:00Z | Complete phase specification with functional decomposition outcomes, quality gates, 8 dimensions coverage |
