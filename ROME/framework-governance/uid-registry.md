# ROME Framework: UID Registry

| Field | Value |
|-------|-------|
| **Document UID** | ROME-GOV-002 |
| **Version** | 2.5 |
| **Date** | 2025-12-18T00:00:00Z |
| **Status** | Draft |
| **Document Type** | Governance |
| **Author** | Framework Analyst & Architect |
| **Changes Approved** | false |

---

## Purpose

Maintains the authoritative registry of all Document UIDs within the ROME framework. Ensures uniqueness, prevents conflicts, and tracks allocation.

## Scope

- All documents within `/ROME/` requiring persistent identification
- Temporary/draft documents in `/ROME_architect/` may use ROME-REV-### series

---

## UID Format

```
ROME-[TYPE]-[NUMBER]
```

- **TYPE**: 2-5 character code indicating document category
- **NUMBER**: 3-digit zero-padded sequence (001-999)

---

## Type Codes

| Code | Category | Reserved Range | Description |
|------|----------|----------------|-------------|
| PRIN | Principles | 001-099 | Core framework principles |
| IMPL | Implementation/Policy | 001-099 | Principle implementation policies |
| LEX | Lexicon | 001-009 | Terminology definitions |
| PROC | Procedure | 001-099 | Operational procedures |
| PHASE | Phase Specification | 001-010 | Phase definitions |
| ROBOT | Robot Definition | 001-020 | Robot role definitions |
| GOV | Governance | 001-020 | Framework governance documents |
| CFG | Configuration | 001-020 | Environment/channel configuration |
| DEF | Definition | 001-099 | Role/concept definitions |
| PROP | Proposal | 001-099 | Framework modification proposals |
| MIG | Migration | 001-099 | Migration guides and procedures |
| REV | Review | 001-999 | Temporary review documents |

---

## Allocated UIDs

### Foundation Documents

| UID | Document | Location | Status |
|-----|----------|----------|--------|
| ROME-PRIN-001 | Core Principles | `/ROME/foundation/core-principles.md` | Draft |
| ROME-IMPL-001 | Core Principles Policy | `/ROME/foundation/core-principles-policy.md` | Draft |
| ROME-LEX-001 | Lexicon | `/ROME/foundation/lexicon.md` | Draft |

### Governance Documents

| UID | Document | Location | Status |
|-----|----------|----------|--------|
| ROME-GOV-001 | Document Standards | `/ROME/framework-governance/document-standards.md` | Draft |
| ROME-GOV-002 | UID Registry | `/ROME/framework-governance/uid-registry.md` | Draft |
| ROME-GOV-003 | Amendment Procedures | `/ROME/framework-governance/amendment-procedures.md` | Draft |
| ROME-GOV-004 | Terminology Management | `/ROME/framework-governance/terminology-management.md` | Draft |
| ROME-GOV-005 | Document Architecture | `/ROME/framework-governance/document-architecture.md` | Draft |
| ROME-GOV-006 | Sponsor Interaction Policy | `/ROME/framework-governance/sponsor-interaction-policy.md` | Draft |
| ROME-GOV-007 | Framework Fidelity | `/ROME/framework-governance/framework-fidelity.md` | Draft |
| ROME-GOV-008 | Activity Log Format | `/ROME/framework-governance/activity-log-format.md` | Draft |

### Configuration Documents

| UID | Document | Location | Status |
|-----|----------|----------|--------|
| ROME-CFG-001 | Sponsor Interaction Config | `/ROME/framework-governance/sponsor-interaction-config.md` | Draft |

### Procedure Documents

| UID | Document | Location | Status |
|-----|----------|----------|--------|
| ROME-PROC-002 | Sponsor Interaction Protocol | `/ROME/robot-templates/robot-operations-protocols/sponsor-interaction-protocol.md` | Draft |
| ROME-PROC-005 | Activity Logging Protocol | `/ROME/robot-templates/robot-operations-protocols/activity-logging-protocol.md` | Draft |
| ROME-PROC-006 | Quality Gate Protocol | `/ROME/life-cycle/cross-phase-procedures/quality-gate-protocol.md` | Draft |

### Phase Specifications

| UID | Document | Location | Status |
|-----|----------|----------|--------|
| ROME-PHASE-001 | Phase 0 - Bootup | `/ROME/life-cycle/P00-bootup/operations-guidelines.md` | Draft |
| ROME-PHASE-002 | Phase 1 - Ingest | `/ROME/life-cycle/P01-ingest/operations-guidelines.md` | Placeholder |
| ROME-PHASE-003 | Phase 2 - Analysis | `/ROME/life-cycle/P02-analysis/operations-guidelines.md` | Placeholder |
| ROME-PHASE-004 | Phase 3 - Design | `/ROME/life-cycle/P03-design/operations-guidelines.md` | Placeholder |
| ROME-PHASE-005 | Phase 4 - Config | `/ROME/life-cycle/P04-config/operations-guidelines.md` | Draft |
| ROME-PHASE-006 | Phase 5 - Generation | `/ROME/life-cycle/P05-generation/operations-guidelines.md` | Draft |

### Robot Definitions

| UID | Document | Location | Status |
|-----|----------|----------|--------|
| ROME-ROBOT-001 | Bootstrap Robot | `/ROME/robot-templates/bootstrap/CLAUDE.md` | Draft |
| ROME-ROBOT-002 | Talib Robot | `/ROME/robot-templates/talib/CLAUDE.md` | Draft |
| ROME-ROBOT-003 | PMA Robot | `/ROME/robot-templates/pma/CLAUDE.md` | Draft |
| ROME-ROBOT-004 | Roma Robot | `/ROME/robot-templates/roma/CLAUDE.md` | Draft |
| ROME-ROBOT-005 | Sarah Robot | `/ROME/robot-templates/sarah/CLAUDE.md` | Draft |
| ROME-ROBOT-006 | Clara Robot | `/ROME/robot-templates/clara/CLAUDE.md` | Draft |
| ROME-ROBOT-007 | Charlie Robot | `/ROME/robot-templates/charlie/CLAUDE.md` | Draft |
| ROME-ROBOT-008 | Reena Robot | `/ROME/robot-templates/reena/CLAUDE.md` | Draft |
| ROME-ROBOT-009 | Lucien Robot | `/ROME/robot-templates/lucien/CLAUDE.md` | Draft |
| ROME-ROBOT-010 | Ashok Robot | `/ROME/robot-templates/ashok/CLAUDE.md` | Draft |

### Role Definitions

| UID | Document | Location | Status |
|-----|----------|----------|--------|
| ROME-DEF-001 | Framework Analyst & Architect | `/ROME_architect/CLAUDE.md` | Draft |

### Proposal Documents

| UID | Document | Location | Status |
|-----|----------|----------|--------|
| ROME-PROP-001 | Parallel Development | `/ROME_framework_maintenance/proposals/ROME-PROP-001-parallel-development.md` | Proposal |
| ROME-PROP-002 | Code Traceability Protocol | `/ROME_framework_maintenance/proposals/ROME-PROP-002-code-traceability.md` | Proposal |
| ROME-PROP-003 | Multi-Agent Optimization | `/ROME_framework_maintenance/proposals/ROME-PROP-003-multi-agent-optimization.md` | Proposal |
| ROME-PROP-004 | Design Artifact Conciseness | `/ROME_framework_maintenance/proposals/ROME-PROP-004-design-artifact-conciseness.md` | Implemented |
| ROME-PROP-005 | Story ID Semantic Correction | `/ROME_framework_maintenance/proposals/ROME-PROP-005-story-id-semantic-correction.md` | Implemented |
| ROME-PROP-006 | Integration Testing Framework | `/ROME_framework_maintenance/proposals/ROME-PROP-006-integration-testing-framework.md` | Proposal |
| ROME-PROP-007 | Event Log Activity Tracking | `/ROME_framework_maintenance/proposals/ROME-PROP-007-event-log-activity-tracking.md` | In Progress (40%) |

### Migration Documents

| UID | Document | Location | Status |
|-----|----------|----------|--------|
| ROME-MIG-001 | MongoDB to Event Log Migration Guide | `/ROME_framework_maintenance/migration/MIGRATION-GUIDE.md` | Complete |

### Review Documents (Temporary)

| UID | Document | Location | Status |
|-----|----------|----------|--------|
| ROME-REV-002 | Git Activity Tracking Review | `/ROME_architect/git-activity-tracking-review.md` | Complete |
| ROME-REV-003 | Activity Log Compliance Review | `/ROME_architect/activity-log-compliance-review.md` | Complete |
| ROME-REV-004 | Activity Log MCP Source Review | `/ROME_architect/activity-log-mcp-source-review.md` | Complete |

---

## Allocation Rules

### New UID Allocation

1. Check this registry for next available number in category
2. Reserve UID by adding entry to this document
3. Create document with reserved UID
4. Update registry entry with location and status

### UID Persistence

- UIDs are **permanent** - never reassigned after allocation
- Deprecated documents retain their UID
- Document relocation updates location in registry, UID unchanged

### Reserved Ranges

| Range | Purpose |
|-------|---------|
| ROME-*-000 | Reserved (never use) |
| ROME-REV-* | Temporary documents, may be recycled after 90 days |

---

## Maintenance

### Update Triggers

This registry MUST be updated when:
- New document created
- Document relocated
- Document status changes
- Document deprecated

### Responsibility

- Framework Analyst & Architect maintains this registry
- Robots creating documents must request UID allocation

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 1.0 | 2025-11-21T00:00:00Z | Initial registry creation |
| 1.1 | 2025-11-21T00:00:00Z | Updated ROME-PHASE-001 and ROME-ROBOT-001 status to Draft |
| 1.2 | 2025-11-21T00:00:00Z | Added ROME-GOV-007 (Framework Fidelity) |
| 1.3 | 2025-11-24T00:00:00Z | Updated ROME-ROBOT-003 (PMA) and ROME-ROBOT-006 (Clara) status to Draft |
| 1.4 | 2025-11-24T00:00:00Z | Added ROME-ROBOT-009 (Lucien), updated ROME-PHASE-005 status to Draft |
| 1.5 | 2025-11-24T00:00:00Z | Added ROME-ROBOT-010 (Ashok), updated ROME-ROBOT-008 (Reena) and ROME-PHASE-006 status to Draft |
| 1.6 | 2025-11-24T00:00:00Z | Updated ROME-ROBOT-007 (Charlie) status to Draft |
| 1.7 | 2025-11-24T00:00:00Z | Updated ROME-ROBOT-002 (Talib) and ROME-ROBOT-005 (Sarah) status to Draft |
| 1.8 | 2025-11-24T00:00:00Z | Updated ROME-ROBOT-004 (Roma) status to Draft |
| 1.9 | 2025-11-24T00:00:00Z | Added ROME-PROC-006 (Quality Gate Protocol) |
| 2.0 | 2025-12-18T00:00:00Z | Added PROP type code, registered ROME-PROP-001 through ROME-PROP-004 |
| 2.1 | 2025-12-18T00:00:00Z | Registered ROME-PROP-005, updated ROME-PROP-004 and ROME-PROP-005 status to Implemented |
| 2.2 | 2025-12-18T00:00:00Z | Registered ROME-PROP-006 (Integration Testing Framework) |
| 2.3 | 2025-12-18T00:00:00Z | Registered ROME-PROP-007 (Event Log Activity Tracking) |
| 2.4 | 2025-12-18T00:00:00Z | Registered ROME-GOV-008 (Activity Log Format) |
| 2.5 | 2025-12-18T00:00:00Z | Added MIG type code, registered ROME-MIG-001 (Migration Guide), updated ROME-PROP-007 status to "In Progress (40%)" |
