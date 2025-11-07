# ROME Operational Design Principles

**Version:** 6.0
**Audience:** Robot initialization, methodology improvement
**Status:** Core principles - reference only

---

## Purpose

This document enumerates the **core principles** that govern ROME methodology. Each principle is implemented in detail across other ROME documents. Use principle IDs to reference these concepts consistently.

---

## Naming Convention

**All robots referred to by human names only:**
- Phase 1: Talib (HTM Requirements Engineer)
- Phase 2: PMA (Project Manager/Architect)
- Phase 2A: Clara (UX Designer)
- Phase 2B: Sarah (System Auditor)
- Phase 3: Ashok (Data), Reena (Backend), Charlie (Frontend)
- Coordination: Roma (Project Coordinator)

Use human names in all documentation, code annotations, and communication. Directory names follow pattern: `robot_[firstname_lowercase]`.

---

## P1: Autonomous Robot Sessions

**Principle:** ROME = Phase-based task coordination via autonomous robot sessions

**Definition:**
- Each robot = Claude Code session in dedicated iTerm terminal
- Each phase = Stage in conventional application development lifecycle
- Scope = Requirements → Deployment (or feature enhancement cycle)

**Implemented in:**
- `00-start/README.md` - 4-phase execution model
- `08-robot-setup/robot-creation.md` - Robot workspace setup
- `scripts/create-robot.sh` - Automated robot instantiation

---

## P2: Phase-Based Execution

**Principle:** Work progresses through sequential phases with defined boundaries

**Definition:**
- Each phase has clear purpose, scope, and completion criteria
- Phases hand off artifacts to subsequent phases
- No phase begins until predecessor completes and passes quality gate
- **Phase 2B is a mandatory quality gate, not a sequential phase**: Sarah validates Phase 2A design before Phase 3 begins. If blocked, work returns to Clara. If approved, Phase 3 launches.

**Implemented in:**
- `00-start/README.md` - Complete phase structure (Phase 2B as gate)
- `00-start/overview.md` - Phase execution model
- `05-phase2b-audit/role-sarah.md` - Gate validation protocol
- Phase-specific folders: `02-phase1-requirements/` through `06-phase3-development/`

---

## P3: Explicit Input/Output Contracts

**Principle:** Every phase defines required inputs and guaranteed outputs

**Definition:**
- Inputs: Documents/artifacts consumed from previous phase or user
- Outputs: Documents/artifacts produced for next phase or final delivery
- Contracts documented and enforced via quality gates

**Implemented in:**
- `99-reference/document-governance-matrix.md` - **Canonical source** for all artifact contracts
- `integration/htm-to-pma-handoff.md` - Phase 1→2 contracts
- `04-phase2a-ux/ux-to-frontend-handoff.md` - Phase 2A→3 contracts

---

## P4: Complete Traceability

**Principle:** All work traces back to requirements; all decisions are justified

**Definition:**
- Source code annotated with requirement IDs
- Design artifacts link to requirements matrix
- Decisions logged with justification
- Audit trail: Code → Story → Feature → Epic

**Implemented in:**
- `01-methodology/reference.md` - Annotation standards
- `01-methodology/implementation-guide.md` - Annotation lifecycle
- `02-phase1-requirements/role-talib.md` - Requirements matrix structure

---

## P5: Quality Gate Enforcement

**Principle:** Progress blocked until work meets quality criteria

**Definition:**
- Gatekeepers validate outputs before phase transition
- Explicit PASS/BLOCK decisions
- Blocked work requires remediation before proceeding
- Gates enforce completeness, consistency, feasibility

**Implemented in:**
- `05-phase2b-audit/role-sarah.md` - Primary gatekeeper role, 8-dimension analysis
- `01-methodology/reference.md` - Production readiness gates
- Individual phase docs - Phase-specific gate criteria

---

## P6: Central Coordination via Roma

**Principle:** Single coordinator manages cross-robot communication and escalation

**Definition:**
- Roma monitors all robot activity via status files
- Escalates blockers to sponsor
- Broadcasts phase transitions and work assignments
- Resolves cross-robot conflicts
- Manages quality gate transitions

**Implemented in:**
- `99-reference/role-roma.md` - **Complete Roma specification**
- `PROJECT/dev/project_activity.status` - Status file format (created per-project)

---

## P7: Integration-First Testing

**Principle:** Prioritize integration tests over unit tests for faster delivery

**Definition:**
- Vertical feature slices tested end-to-end first
- Unit tests added only for complex logic requiring isolation
- Integration tests validate API → Backend → Database flows
- Class annotations track test coverage and complexity

**Implemented in:**
- `01-methodology/implementation-guide.md` - Integration-first methodology
- `01-methodology/reference.md` - Test level annotations
- `06-phase3-development/role-*.md` - Robot-specific testing protocols

---

## P8: Parallel Development

**Principle:** Phase 3 robots work concurrently on vertical feature slices

**Definition:**
- Ashok, Reena, Charlie work simultaneously
- Features decomposed into independent vertical slices
- API contracts defined upfront enable parallel work
- Integration tests detect interface mismatches

**Implemented in:**
- `00-start/README.md` - Phase 3 coordination
- `03-phase2-architecture/role-pma.md` - Action list creation with robot assignments
- `06-phase3-development/` - Individual robot role specifications

---

## P9: Artifact Ownership

**Principle:** Every artifact has single creator, explicit consumers, defined location

**Definition:**
- Ownership prevents duplicate/conflicting documents
- Consumers know where to find required inputs
- Location standards enforce project structure
- Governance matrix is single source of truth

**Implemented in:**
- `99-reference/document-governance-matrix.md` - **Canonical artifact registry**
- `07-project-structure/directory-layout.md` - Standard project structure
- Individual role docs - Artifact creation responsibilities

---

## P10: Self-Optimization

**Principle:** Robots identify and propose methodology improvements

**Definition:**
- Robots flag unclear/conflicting guidance during execution
- Improvements proposed via documented channels
- Methodology evolves based on real execution experience
- All changes version-controlled with justification

**Implemented in:**
- This principle itself (meta-level)
- `ROME/suggestions/` directory (created as needed)
- Version control in all ROME documents

---

## P11: Sponsor Visibility & Control

**Principle:** Sponsor maintains visibility and decision authority throughout

**Definition:**
- Roma reports status, blockers, gate results to sponsor
- Sponsor approves critical quality gates (Phase 3→4 deployment)
- Sponsor resolves escalated decisions (scope, approach, priorities)
- No autonomous scope changes without sponsor approval

**Implemented in:**
- `99-reference/role-roma.md` - Escalation and reporting protocols
- Quality gate definitions - Sponsor approval requirements

---

## P12: Global Artifact Visibility with Phase-Scoped Amendments

**Principle:** All artifacts have global visibility but can only be amended within their originating phase

**Definition:**
- Artifacts created in a phase are visible to all subsequent phases
- Amendments require returning control to originating phase for modification
- Phase progression and parallel activities coordinated through centralized logs
- Information flow one-directional forward; control flow backward only for amendments

**Examples:**
- Talib creates `requirements-matrix.yaml` (Phase 1 artifact)
- PMA can READ requirements-matrix but CANNOT amend it
- If requirements need change, PMA requests amendment from Talib
- Phase 2B Sarah can READ design artifacts but cannot amend them; changes require Clara
- Phase 3 (Ashok/Reena/Charlie) can READ all prior artifacts; cannot amend any

**Implemented in:**
- `robot-protocol.md` (to be created) - Phase amendment request protocol
- `99-reference/document-governance-matrix.md` - Artifact creation phase ownership
- Activity logs and status files - Central coordination mechanism

---

## Principle Reference Map

Use these IDs when referencing principles in other documents:

| ID | Short Name | Key Concept |
|----|------------|-------------|
| **P1** | Autonomous Sessions | Robot = Claude Code in iTerm |
| **P2** | Phase-Based | Sequential phases with boundaries |
| **P3** | Input/Output Contracts | Explicit artifact dependencies |
| **P4** | Traceability | Code → Requirements audit trail |
| **P5** | Quality Gates | Progress blocked until validated |
| **P6** | Central Coordination | Roma manages cross-robot work |
| **P7** | Integration-First | End-to-end tests before unit tests |
| **P8** | Parallel Development | Ashok/Reena/Charlie work concurrently |
| **P9** | Artifact Ownership | Single creator per document |
| **P10** | Self-Optimization | Robots improve methodology |
| **P11** | Sponsor Control | Visibility and decision authority |
| **P12** | Global Visibility, Phase-Scoped Amendments | All can read, only creator phase can amend |

---

## Usage in Other Documents

**To reference a principle:**

```markdown
Per **P4 (Traceability)**, all source code must include @RequirementID annotations.
See `01-methodology/operational-design.md#P4` for principle definition.
Implementation: `01-methodology/reference.md` lines 42-148.
```

**Example cross-reference:**
```markdown
Sarah enforces **P5 (Quality Gates)** via 8-dimension analysis.
Principle: `01-methodology/operational-design.md#P5`
Implementation: `05-phase2b-audit/role-sarah.md` lines 125-172
```

---

## Document Status

**This is a reference document only** - contains no implementation detail.

All implementation specifications exist in other ROME documents. When conflicts arise between this document and implementation docs, **implementation docs take precedence** (they are more detailed and context-specific).

Use this document to:
- Understand core ROME philosophy
- Reference principles consistently across docs
- Identify which documents implement which concepts
- Orient new users to ROME methodology

**Do not duplicate implementation detail here** - link to authoritative sources instead.

---

**Read this on initialization to understand ROME principles. Reference by principle ID during execution.**
