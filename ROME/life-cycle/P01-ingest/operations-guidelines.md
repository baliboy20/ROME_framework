# Phase 1 - Ingest: Operations Guidelines

| Field | Value |
|-------|-------|
| **Document UID** | ROME-PHASE-002 |
| **Version** | 1.0 |
| **Date** | 2025-11-24T00:00:00Z |
| **Status** | Draft |
| **Document Type** | Phase Specification |
| **Author** | Framework Analyst & Architect |
| **Changes Approved** | false |

---

## Purpose

Defines WHAT Phase 1 (Ingest) must accomplish, including entry/exit criteria, required outputs, and quality gates. Robot-specific procedures (HOW) are defined in respective robot CLAUDE.md documents.

## Dependencies

- ROME-PRIN-001 (Core Principles) - Phase Decomposition principle
- ROME-PROC-005 (Activity Logging Protocol) - Logging requirements
- ROME-ROBOT-002 (Talib) - Primary robot for this phase

---

## Phase Overview

| Attribute | Value |
|-----------|-------|
| Phase Number | P1 |
| Phase Name | Ingest |
| Primary Robot | Talib |
| Predecessor | P0 (Bootup) |
| Successor | P2 (Analysis) |

**Objective:** Intake and catalog all raw sponsor materials (PRDs, BRDs, notes, sketches) into an organized corpus ready for analysis.

**Scope:** This phase is LIMITED to:
- Receiving raw materials
- Cataloging content types and scope
- Identifying obvious gaps
- Organizing for analysis consumption

**Out of Scope:**
- Detailed requirements extraction (P2)
- Functional decomposition (P2)
- Sponsor clarification beyond basic gaps (P2)

---

## Entry Criteria

Phase 1 MAY NOT begin until ALL criteria are met:

| Criterion | Verification |
|-----------|--------------|
| Bootstrap complete | Project structure exists at ARTIFACTS path |
| Raw materials present | At least one document in `_user_input/raw-requirements/` |
| Activity log initialized | Database responds to MCP queries |
| Roma assignment | Talib assigned to P1 by orchestrator |
| PHASE-1 entry created | Activity log contains PHASE-1 with status NOT_STARTED or IN_PROGRESS |

---

## Exit Criteria

Phase 1 MAY NOT transition to P2 until ALL criteria are met:

| Criterion | Verification | Blocking |
|-----------|--------------|----------|
| All materials cataloged | Document catalog artifact exists | Yes |
| Content scope documented | Summary of what materials contain | Yes |
| Gaps identified | List of obvious missing information | Yes |
| Activity log updated | PHASE-1 status = COMPLETED | Yes |
| Roma verification | Orchestrator confirms phase complete | Yes |

---

## Quality Gates

### Gate 1: Material Completeness

**Check:** All files in raw-requirements directory have been read and cataloged.

**Pass Criteria:**
- Document catalog lists every file
- No unread files remain
- File types identified (PDF, DOCX, MD, etc.)

**Failure Action:** Return to ingest remaining files

### Gate 2: Catalog Quality

**Check:** Catalog provides sufficient information for P2 planning.

**Pass Criteria:**
- Each document has: filename, type, size, summary (1-2 sentences)
- Content categories identified (functional, technical, design, etc.)
- Sponsor/author identified where available

**Failure Action:** Enhance catalog entries

### Gate 3: Gap Identification

**Check:** Obvious gaps flagged for P2 attention.

**Pass Criteria:**
- Missing document types noted (e.g., "No technical constraints provided")
- Incomplete sections flagged
- Questions for sponsor queued (not asked yet - that's P2)

**Failure Action:** Review materials for missed gaps

---

## Outputs

### Required Artifacts

| Artifact | Location | Description |
|----------|----------|-------------|
| document-catalog.md | `ARTIFACTS/dev/requirements/` | Catalog of all ingested materials |
| ingest-summary.md | `ARTIFACTS/dev/requirements/` | Summary of content scope and initial gaps |

### Document Catalog Schema

```markdown
# Document Catalog

**Phase:** P1 - Ingest
**Date:** [ISO-8601]
**Robot:** Talib

## Materials Ingested

| # | Filename | Type | Pages/Size | Category | Summary |
|---|----------|------|------------|----------|---------|
| 1 | [name] | [PDF/DOCX/MD] | [count] | [functional/technical/design] | [1-2 sentence summary] |

## Content Coverage

| Category | Documents | Coverage Assessment |
|----------|-----------|---------------------|
| Functional Requirements | [count] | [Complete/Partial/Missing] |
| Technical Constraints | [count] | [Complete/Partial/Missing] |
| Design/UI | [count] | [Complete/Partial/Missing] |
| Business Rules | [count] | [Complete/Partial/Missing] |

## Identified Gaps

| # | Gap Description | Impact | Queued for P2 |
|---|-----------------|--------|---------------|
| 1 | [What's missing] | [Effect on analysis] | Yes |
```

### Ingest Summary Schema

```markdown
# Ingest Summary

**Phase:** P1 - Ingest
**Date:** [ISO-8601]
**Robot:** Talib

## Overview

- Total documents: [count]
- Total pages/content: [estimate]
- Primary sponsor: [identified from materials]

## Content Scope

[2-3 paragraph summary of what the materials describe - the application, its purpose, key functionality areas]

## Initial Assessment

### Strengths
- [What's well-documented]

### Gaps
- [What's missing or unclear - queued for P2]

### Recommendations for P2
- [Suggested focus areas for analysis]
```

---

## Traceability Requirements

### Source-to-Catalog Tracing

Every raw material MUST be traceable:
- Raw file → Catalog entry
- Catalog entry → Content category
- Gap identified → Queued question for P2

### Activity Log Tracing

| Event | Log Entry |
|-------|-----------|
| Phase start | PHASE-1 status → IN_PROGRESS |
| Material ingested | Note in phase entry or separate tracking |
| Gap identified | Documented in ingest-summary.md |
| Phase complete | PHASE-1 status → COMPLETED |

---

## Activity Logging Requirements

All robots operating in this phase MUST follow the Activity Logging Protocol:
- **ROME-PROC-005**: `/ROME/robot-templates/robot-operations-protocols/activity-logging-protocol.md`

### Phase-Specific Logging

| Event | Required Action |
|-------|-----------------|
| Phase begins | Update PHASE-1: status → IN_PROGRESS, startDate |
| Blocker encountered | Create BLOCK-### entry |
| Phase complete | Update PHASE-1: status → COMPLETED, completionDate |

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 0.1 | 2025-11-20T00:00:00Z | Initial phase specification placeholder |
| 1.0 | 2025-11-24T00:00:00Z | Complete phase specification with entry/exit criteria, quality gates, output schemas |
