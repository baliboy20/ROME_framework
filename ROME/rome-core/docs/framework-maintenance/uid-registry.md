# ROME Framework: UID Registry

| Field | Value |
|-------|-------|
| **Document UID** | ROME-GOV-002 || **Version** | 4.4 |
| **Date** | 2026-07-15T00:00:00Z |
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
| SPEC | Technical Specification | 001-099 | Internal framework technical specifications (non-standard: uses word suffix instead of number) |
| STD | Standard | n/a | Normative cross-cutting standards (non-standard: uses word suffix instead of number) |
| ONT | Ontology | 001-009 | Formal entity/relation/axiom sets |
| PLAN | Implementation Plan | 001-099 | Staged build plans for an accepted proposal; numbered to match the proposal |

---

## Allocated UIDs

### Technical Specification Documents

| UID | Document | Location | Status |
|-----|----------|----------|--------|
| ROME-SPEC-SKILL-FRAMEWORK | Skill Framework Technical Specification | ~~Deleted~~ — superseded by SKILL.md-based implementation (PROP-019/020) | Deprecated |
| ROME-SPEC-SUBAGENT-FRAMEWORK | Subagent Framework Technical Specification | ~~Deleted~~ — superseded by Claude Code Task tool (PROP-011/021) | Deprecated |

### Standards Documents

Normative cross-cutting standards extracted per PROP-034 Track A. Enforced mechanically by the orchestrator guard.

| UID | Document | Location | Status |
|-----|----------|----------|--------|
| ROME-STD-AGENT-ROLES | Agent Roles Standard | `/ROME/rome-core/docs/standards/agent-roles-standard.md` | Active |
| ROME-STD-AORDL | AORDL Standard | `/ROME/rome-core/docs/standards/aordl-standard.md` | Active |
| ROME-STD-GATE | Gate Decision Standard | `/ROME/rome-core/docs/standards/gate-decision-standard.md` | Active |
| ROME-STD-SECURITY | Security Standard | `/ROME/rome-core/docs/standards/security-standard.md` | Active |
| ROME-STD-TRACE | Traceability Standard | `/ROME/rome-core/docs/standards/traceability-standard.md` | Active |

### Foundation Documents

> **Sub-document ID patterns.** `ROME-ENT-##`, `ROME-REL-##`, and `ROME-AX-##` are scoped to ROME-ONT-001 and take no UID of their own — they are not allocated here and must not be registered as standalone entries.

| UID | Document | Location | Status |
|-----|----------|----------|--------|
| ROME-PRIN-001 | Core Principles | `/ROME/rome-core/docs/framework-maintenance/core-principles.md` | Draft |
| ROME-IMPL-001 | Core Principles Policy | `/ROME/rome-core/docs/framework-maintenance/core-principles-policy.md` | Draft |
| ROME-LEX-001 | Lexicon | `/ROME/rome-core/docs/foundation/lexicon.md` | Draft |
| ROME-ONT-001 | Ontology & Axiom Set | `/ROME/rome-core/docs/foundation/ontology.md` | Active |

### Governance Documents

| UID | Document | Location | Status |
|-----|----------|----------|--------|
| ROME-GOV-001 | Document Standards | `/ROME/rome-core/docs/framework-maintenance/document-standards.md` | Draft |
| ROME-GOV-002 | UID Registry | `/ROME/rome-core/docs/framework-maintenance/uid-registry.md` | Draft |
| ROME-GOV-003 | Amendment Procedures | `/ROME/rome-core/docs/framework-maintenance/amendment-procedures.md` | Draft |
| ROME-GOV-004 | Terminology Management | `/ROME/rome-core/docs/framework-maintenance/terminology-management.md` | Draft |
| ROME-GOV-005 | Document Architecture | `/ROME/rome-core/docs/framework-maintenance/document-architecture.md` | Draft |
| ROME-GOV-006 | Sponsor Interaction | `/ROME/rome-core/docs/operational/sponsor-interaction.md` | Active |
| ROME-GOV-007 | Framework Fidelity | `/ROME/rome-core/docs/framework-maintenance/framework-fidelity.md` | Draft |
| ROME-GOV-008 | Activity Log Format | `/ROME/rome-core/docs/operational/activity-log-format.md` | Draft |
| ROME-GOV-009 | MCP Server Dependencies | `/ROME/rome-core/docs/operational/mcp-server-dependencies.md` | Draft |
| ROME-GOV-010 | Document Taxonomy | `/ROME/rome-core/docs/framework-maintenance/document-taxonomy.md` | Draft |
| ROME-GOV-BASELINE | Robot Baseline (Monolithic) | `/ROME/rome-core/docs/governance/robot-baseline.md` | Deprecated |
| ROME-GOV-BASELINE-A | Baseline: Universal | `/ROME/rome-core/docs/operational/baseline-universal.md` | Draft |
| ROME-GOV-BASELINE-B | Baseline: Coordination | `/ROME/rome-core/docs/operational/baseline-coordination.md` | Draft |
| ROME-GOV-BASELINE-C | Baseline: Governance | `/ROME/rome-core/docs/framework-maintenance/baseline-governance.md` | Draft |
| ROME-GOV-011 | Git Conventions | `/ROME/rome-core/docs/operational/git-conventions.md` | Draft |

### Configuration Documents

| UID | Document | Location | Status |
|-----|----------|----------|--------|
| ROME-CFG-001 | ~~Sponsor Interaction Config~~ | Superseded by ROME-GOV-006 | Deprecated |

### Procedure Documents

| UID | Document | Location | Status |
|-----|----------|----------|--------|
| ROME-PROC-002 | ~~Sponsor Interaction Protocol~~ | Superseded by ROME-GOV-006 | Deprecated |
| ROME-PROC-005 | ~~Activity Logging Protocol~~ | ~~Deleted~~ — robot-templates/ retired in v2.0 (PROP-035); activity logging now via the `activity-log-file` MCP, documented in ROME-GOV-008 | Deprecated |
| ROME-PROC-006 | ~~Quality Gate Protocol~~ | Superseded by ROME-STD-GATE; archived at `/ROME_framework_maintenance/archive/life-cycle/cross-phase-procedures/quality-gate-protocol.md` | Deprecated |

### Phase Specifications

Retired in v2.0 (PROP-035): the `life-cycle/` tree was archived and phase behaviour now lives in per-agent mode files (`/ROME/agents/<agent>/modes/P<n>-<phase>.md`) driven by the orchestrator. Archived copies retained at `/ROME_framework_maintenance/archive/life-cycle/`. UIDs are not reallocated.

| UID | Document | Location | Status |
|-----|----------|----------|--------|
| ROME-PHASE-001 | ~~Phase 0 - Bootup~~ | Archived — `/ROME_framework_maintenance/archive/life-cycle/P00-bootup/operations-guidelines.md` | Deprecated |
| ROME-PHASE-002 | ~~Phase 1 - Ingest~~ | Archived — `/ROME_framework_maintenance/archive/life-cycle/P01-aordl/operations-guidelines.md` | Deprecated |
| ROME-PHASE-003 | ~~Phase 2 - Analysis~~ | Archived — `/ROME_framework_maintenance/archive/life-cycle/P02-analysis/operations-guidelines.md` | Deprecated |
| ROME-PHASE-004 | ~~Phase 3 - Design~~ | Archived — `/ROME_framework_maintenance/archive/life-cycle/P03-design/operations-guidelines.md` | Deprecated |
| ROME-PHASE-005 | ~~Phase 4 - Config~~ | Archived — `/ROME_framework_maintenance/archive/life-cycle/P04-config/operations-guidelines.md` | Deprecated |
| ROME-PHASE-006 | ~~Phase 5 - Generation~~ | Archived — `/ROME_framework_maintenance/archive/life-cycle/P05-generation/operations-guidelines.md` | Deprecated |

### Robot Definitions

Relocated in v2.0 (PROP-035): `robot-templates/<robot>/CLAUDE.md` → `agents/<agent>/ROBOT.md`. Role/instance semantics are defined by ROME-STD-AGENT-ROLES.

| UID | Document | Location | Status |
|-----|----------|----------|--------|
| ROME-ROBOT-001 | Bootstrap Robot | `/ROME/agents/bootstrap/ROBOT.md` | Draft |
| ROME-ROBOT-002 | Talib Robot | `/ROME/agents/talib/ROBOT.md` | Draft |
| ROME-ROBOT-003 | PMA Robot | `/ROME/agents/pma/ROBOT.md` | Draft |
| ROME-ROBOT-004 | Roma Robot | `/ROME/agents/roma/ROBOT.md` | Draft |
| ROME-ROBOT-005 | Sarah Robot | `/ROME/agents/sarah/ROBOT.md` | Draft |
| ROME-ROBOT-006 | Clara Robot | `/ROME/agents/clara/ROBOT.md` | Draft |
| ROME-ROBOT-007 | Charlie Robot | `/ROME/agents/charlie/ROBOT.md` | Draft |
| ROME-ROBOT-008 | Reena Robot | `/ROME/agents/reena/ROBOT.md` | Draft |
| ROME-ROBOT-009 | Lucien Robot | `/ROME/agents/lucien/ROBOT.md` | Draft |
| ROME-ROBOT-010 | Ashok Robot | `/ROME/agents/ashok/ROBOT.md` | Draft |
| ROME-ROBOT-011 | Surveyor Robot | `/ROME/agents/surveyor/ROBOT.md` | Draft |

### Role Definitions

| UID | Document | Location | Status |
|-----|----------|----------|--------|
| ROME-DEF-001 | Framework Analyst & Architect | `/ROME_architect/CLAUDE.md` | Draft |

### Proposal Documents

> **UID conflict — ROME-PROP-008 (unresolved).** Through v4.0 this registry recorded PROP-008 as "Phase-Based Plugin Architecture" at `ROME-PROP-008-phase-based-plugin-architecture.md`. No such file exists. Two distinct files are in play: `ROME-PROP-008-framework-processing-optimization.md` (the actual 008) and `ROME-PROP-018-phase-based-plugin-architecture.md` (which carries the title 008 was claiming). The entry below now points at the real 008 file, but neither proposal declares a `Document UID` header, so which of the two the "Phase-Based Plugin Architecture" line was originally allocated for cannot be settled from the documents alone. Both are superseded in practice by PROP-034 (phase plugin consolidation). Sponsor decision needed before either UID is treated as authoritative.

| UID | Document | Location | Status |
|-----|----------|----------|--------|
| ROME-PROP-001 | Parallel Development | `/ROME_framework_maintenance/proposals/ROME-PROP-001-parallel-development.md` | Proposal |
| ROME-PROP-015 | Change Management Protocol | `/ROME_framework_maintenance/proposals/ROME-PROP-015-change-management.md` | Proposal |
| ROME-PROP-002 | Code Traceability Protocol | `/ROME_framework_maintenance/proposals/ROME-PROP-002-code-traceability.md` | Proposal |
| ROME-PROP-003 | Multi-Agent Optimization | `/ROME_framework_maintenance/proposals/ROME-PROP-003-multi-agent-optimization.md` | Proposal |
| ROME-PROP-004 | Design Artifact Conciseness | `/ROME_framework_maintenance/proposals/ROME-PROP-004-design-artifact-conciseness.md` | Implemented |
| ROME-PROP-005 | Story ID Semantic Correction | `/ROME_framework_maintenance/proposals/ROME-PROP-005-story-id-semantic-correction.md` | Implemented |
| ROME-PROP-006 | Integration Testing Framework | `/ROME_framework_maintenance/proposals/ROME-PROP-006-integration-testing-framework.md` | Proposal |
| ROME-PROP-007 | Event Log Activity Tracking | `/ROME_framework_maintenance/proposals/ROME-PROP-007-event-log-activity-tracking.md` | In Progress (40%) |
| ROME-PROP-008 | Framework Processing Optimization | `/ROME_framework_maintenance/proposals/ROME-PROP-008-framework-processing-optimization.md` | Proposal |
| ROME-PROP-023 | ~~Operational/Governance Separation~~ | ~~Deleted~~ — no file present; separation delivered via the `operational/` vs `framework-maintenance/` docs split | Deprecated |
| ROME-PROP-026 | Change Management & Compliance Completeness | `/ROME_framework_maintenance/implemented-proposals/ROME-PROP-026-change-compliance-completeness.md` | Implemented |
| ROME-PROP-027 | Framework Versioning | `/ROME_framework_maintenance/implemented-proposals/ROME-PROP-027-framework-versioning.md` | Implemented |
| ROME-PROP-028 | P5 Implementation Proposal Gate | `/ROME_framework_maintenance/proposals/ROME-PROP-028-p5-implementation-proposal.md` | Draft |
| ROME-PROP-029 | P5 Completion Enforcement | `/ROME_framework_maintenance/proposals/ROME-PROP-029-p5-completion-enforcement.md` | Draft |
| ROME-PROP-030 | Roma Robot Documentation Restructure | `/ROME_framework_maintenance/implemented-proposals/ROME-PROP-030-roma-doc-restructure.md` | Implemented |
| ROME-PROP-034 | Phase Plugin Consolidation | `/ROME_framework_maintenance/implemented-proposals/ROME-PROP-034-phase-plugin-consolidation.md` | Implemented |
| ROME-PROP-035 | Sub-Agent Orchestration Model | `/ROME_framework_maintenance/implemented-proposals/ROME-PROP-035-subagent-orchestration-model.md` | Implemented (v2.0) |
| ROME-PROP-036 | Input Characterization & Intent Routing | `/ROME_framework_maintenance/implemented-proposals/ROME-PROP-036-input-characterization-intent-routing.md` | Implemented |
| ROME-PROP-037 | Visualization & Prototyping | `/ROME_framework_maintenance/implemented-proposals/ROME-PROP-037-visualization-prototyping.md` | Implemented |
| ROME-PROP-038 | Topology-Driven Capability Instancing | `/ROME_framework_maintenance/implemented-proposals/ROME-PROP-038-topology-driven-capability-instancing.md` | Implemented |
| ROME-PROP-039 | Executability & Resilience Contracts | `/ROME_framework_maintenance/implemented-proposals/ROME-PROP-039-executability-resilience-contracts.md` | Implemented |
| ROME-PROP-040 | Governance, Knowledge & Security | `/ROME_framework_maintenance/implemented-proposals/ROME-PROP-040-governance-knowledge-security.md` | Implemented |
| ROME-PROP-041 | Link-Level Traceability & Sponsor-OQ Gating | `/ROME_framework_maintenance/implemented-proposals/ROME-PROP-041-link-level-traceability-and-sponsor-oq-gating.md` | Implemented (v2.3.0) |
| ROME-PROP-042 | Artifact-Graph Traceability Model | `/ROME_framework_maintenance/implemented-proposals/ROME-PROP-042-artifact-graph-traceability.md` | Implemented (v2.3.0) |
| ROME-PROP-043 | Framework Ontology & Axiom Set | `/ROME_framework_maintenance/implemented-proposals/ROME-PROP-043-framework-ontology-and-axioms.md` | Implemented (v2.4.0) |
| ROME-PROP-044 | Axiom Enforcement & Role-Model Alignment | `/ROME_framework_maintenance/implemented-proposals/ROME-PROP-044-axiom-enforcement-and-role-model-alignment.md` | Implemented (v2.5.0) |

### Implementation Plans

| UID | Document | Location | Status |
|-----|----------|----------|--------|
| ROME-PLAN-035 | PROP-035 Implementation Plan | `/ROME_framework_maintenance/proposals/ROME-PROP-035-IMPLEMENTATION-PLAN.md` | Complete |

### Migration Documents

| UID | Document | Location | Status |
|-----|----------|----------|--------|
| ROME-MIG-001 | MongoDB to Event Log Migration Guide | `/ROME_framework_maintenance/migration/MIGRATION-GUIDE.md` | Complete |

### Review Documents (Temporary)

| UID | Document | Location | Status |
|-----|----------|----------|--------|
| ROME-REV-002 | ~~Git Activity Tracking Review~~ | ~~Deleted~~ — temporary review, work concluded | Deprecated |
| ROME-REV-003 | ~~Activity Log Compliance Review~~ | ~~Deleted~~ — temporary review, work concluded | Deprecated |
| ROME-REV-004 | ~~Activity Log MCP Source Review~~ | ~~Deleted~~ — temporary review, work concluded | Deprecated |
| ROME-REV-005 | AORDL Ingest Pipeline Gap Review | `/ROME_framework_maintenance/reviews/aordl-ingest-pipeline-gap-review.md` | Review |

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
| 2.6 | 2026-01-07T00:00:00Z | Registered ROME-PROP-008 (Phase-Based Plugin Architecture) |
| 2.7 | 2026-02-24T00:00:00Z | Updated locations for ROME-PROP-023 operational/governance separation. Added ROME-GOV-BASELINE-A/B/C tiered baselines. Deprecated ROME-GOV-BASELINE. |
| 2.8 | 2026-02-25T00:00:00Z | Registered ROME-GOV-010 (Document Taxonomy). Resolved UID conflict: document-taxonomy.md reassigned from ROME-GOV-008 to ROME-GOV-010. |
| 2.9 | 2026-02-27T00:00:00Z | Registered ROME-PROP-026 (Change Management & Compliance Completeness). Reserved ROME-GOV-011 (Git Conventions) per PROP-026 Phase B. |
| 3.0 | 2026-02-27T00:00:00Z | ROME-PROP-026 Phase A: Registered ROME-PROP-015 (moved from implemented-proposals/ to proposals/, status corrected to Proposal). |
| 3.1 | 2026-02-27T00:00:00Z | ROME-PROP-026 implemented: updated PROP-026 status to Implemented, updated location to implemented-proposals/. Updated ROME-GOV-011 status from Reserved to Draft. |
| 3.2 | 2026-02-27T00:00:00Z | Added SPEC type code. Registered ROME-SPEC-SKILL-FRAMEWORK and ROME-SPEC-SUBAGENT-FRAMEWORK (found unregistered during fidelity check). |
| 3.3 | 2026-02-27T00:00:00Z | Registered ROME-PROP-027 (Framework Versioning). |
| 3.4 | 2026-02-27T00:00:00Z | ROME-PROP-027 implemented: updated status to Implemented, path updated to implemented-proposals/. |
| 3.5 | 2026-02-27T00:00:00Z | Housekeeping: deleted ROME-SPEC-SKILL-FRAMEWORK and ROME-SPEC-SUBAGENT-FRAMEWORK (Node.js-era specs, superseded by PROP-011/019/020/021). Marked Deprecated. |
| 3.6 | 2026-02-27T00:00:00Z | Registered ROME-PROP-028 (P5 Implementation Proposal Gate). |
| 3.7 | 2026-02-28T00:00:00Z | Registered ROME-PROP-029 (P5 Completion Enforcement — composite PHASE-5 event, GATE-P5 mandate, zero-timestamp rejection). |
| 3.8 | 2026-03-03T20:00:00Z | Registered ROME-PROP-030 (Roma Robot Documentation Restructure — monolith split, proposal ref removal, capability-based rollback). |
| 3.9 | 2026-03-04T00:00:00Z | Framework v1.2.1: PROP-030 implemented (Roma doc restructure), proposal reference removal sweep across 20+ operational docs. PATCH bump — no breaking changes. |
| 4.0 | 2026-03-05T00:00:00Z | Registered ROME-PROP-034 (Phase Plugin Consolidation — retire phase plugins, elevate content to robot plugins and framework standards). Registered ROME-REV-005 (AORDL Ingest Pipeline Gap Review). |
| 4.4 | 2026-07-16T00:00:00Z | PROP-044 implemented (v2.5.0 "Titus"); moved to implemented-proposals/. ONT-001's ASSERTED tier emptied (AX-12..16 → CHECKED). |
| 4.3 | 2026-07-16T00:00:00Z | Registered ROME-PROP-044 (Axiom Enforcement & Role-Model Alignment — draft; promotes ONT-001's ASSERTED axioms, deepens ENFORCED provenance to behaviour, aligns the `robot` data field). |
| 4.2 | 2026-07-15T00:00:00Z | PROP-043 implemented (v2.4.0). Added ONT type code; registered ROME-ONT-001 (Ontology & Axiom Set). Noted ROME-ENT/REL/AX as sub-document patterns scoped to ROME-ONT-001, not standalone entries. PROP-043 → Implemented, moved to implemented-proposals/. |
| 4.1 | 2026-07-15T00:00:00Z | v2.x reconciliation — registry had not been maintained since v1.2.1 and did not reflect the v2.0 restructure. Added STD and PLAN type codes. Registered the five standards (ROME-STD-AGENT-ROLES / AORDL / GATE / SECURITY / TRACE), the v2.x proposal line (ROME-PROP-035 through 043), and ROME-PLAN-035. Repointed ROBOT-001..010 from retired `robot-templates/<robot>/CLAUDE.md` to `agents/<agent>/ROBOT.md`; registered ROME-ROBOT-011 (Surveyor, previously unregistered). Marked PHASE-001..006 and PROC-005/006 Deprecated (life-cycle tree archived in v2.0). Marked REV-002/003/004 and PROP-023 Deprecated (files deleted). Corrected PROP-034 location to implemented-proposals/. Corrected the PROP-008 title/path (see the UID conflict note under Proposal Documents). |
