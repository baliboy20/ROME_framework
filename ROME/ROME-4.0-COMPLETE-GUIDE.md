# ROME 4.0 Complete Guide
**Single Source of Truth for ROME Execution, File Management, and Documentation**

**Version**: 4.0
**Status**: Complete & Ready for Use
**Last Updated**: 2025-10-29

---

## What This Guide Covers

This is the **comprehensive reference** for ROME 4.0 projects. It covers:

1. **Complete Execution Flow** - 4 sequential phases with correct ordering
2. **File Locations & Structure** - Where files go at each phase
3. **Document Management System** - Three-tier doc organization
4. **Implementation Timeline** - Getting started checklist
5. **Role Integration** - How each role uses this system
6. **FAQ & Troubleshooting** - Common questions answered

**Use this guide when you need to know:**
- What phase are we in? → See Phase Summary section
- Where do files go? → See File Locations by Phase
- How do I organize my docs? → See Document Management System
- What do I do first? → See Getting Started & Implementation Timeline

---

## Part A: ROME 4.0 Complete Execution Flow

### The 4 Phases: Correct Ordering

ROME 4.0 operates in **4 sequential phases**. You MUST follow this order:

```
Phase 1: Chaperone Phase 1 - Specification Refinement
         ↓ (produces refined specs)

Phase 2: PMA Phases 1-9 - Functional Design
         ↓ (produces design plan)

Phase 3: Chaperone Phase 2 - Design Inspection & Validation
         ↓ (approves or blocks design)

Phase 4: Development Robots - Implementation
         (builds with approved specs)
```

**Critical**: Do NOT skip phases or run them out of order. Each phase depends on the previous one.

---

## Phase 1: Chaperone Phase 1 - Specification Refinement

**When**: First, before PMA begins work
**Duration**: 2-5 days depending on complexity
**Who**: Chaperone AI Assistant
**Input**: Raw requirement documents in `PROJECT/dev/_user_input/`
**Output**: Refined specifications in `PROJECT/dev/`

### What Chaperone Does

1. Reads all raw requirement documents from `PROJECT/dev/_user_input/`
2. Analyzes project across 8 technical dimensions:
   - Data Model & Schema
   - Application Flows & Use Cases
   - Authentication & Authorization
   - Caching Strategy
   - Technology Stack & Patterns
   - Target Platforms & Deployment
   - Testing Strategy & Regime
   - System Scope (Greenfield vs Existing)

3. Identifies ambiguities, gaps, and inconsistencies
4. Asks clarifying questions with multiple options
5. Documents user answers
6. Produces refined specifications

### Quality Gate: ✅ Specifications are Clear and Unambiguous

- All 8 dimensions analyzed
- All clarifying questions answered
- Ambiguities and gaps resolved
- Deferred issues identified
- Development robots can understand specs
- **PMA can design with confidence**

### Input Files

```
PROJECT/dev/_user_input/
├── product_requirements.md          (PRD, business needs)
├── use_cases.md                     (user workflows)
├── design_mockups/                  (wireframes, screenshots)
├── technical_specs.md               (technical constraints)
└── business_context.md              (goals, constraints)
```

### Output Files

```
PROJECT/dev/
├── specification_augmented.md       ← PMA reads this
├── questions_and_answers.md         (Q&A log)
└── deferred_issues.md               (deferred to PMA phase)
```

### How to Launch Chaperone Phase 1

```bash
cd claude_chaperone
./__start.sh
# Chaperone will ask: "Where are your requirement documents?"
# You answer: "PROJECT/dev/_user_input/"
```

### Reference

See: [chaperone-comprehensive-guide.md](chaperone-comprehensive-guide.md) - Phase 1 section

---

## Phase 2: PMA Phases 1-9 - Functional Design

**When**: After Chaperone Phase 1 completes
**Duration**: 2-3 days
**Who**: PMA (Project Manager/Architect) AI Assistant
**Input**: Refined specifications from Chaperone Phase 1
**Output**: Functional design plan in `PROJECT/dev/`

### What PMA Does

1. **Phase 1** - Deep Requirements Analysis
   - Understand business logic and user workflows
   - Validate assumptions
   - Identify ambiguities

2. **Phase 2** - Data-First Design
   - Create detailed data model
   - Document use cases
   - Define validation rules

3. **Phase 3** - Feature Decomposition
   - Break into vertical feature slices
   - Define interfaces between features
   - Map features to robots

4. **Phase 4** - Integration Test Strategy
   - Plan testing approach for each feature
   - Identify complex logic needing unit tests

5. **Phase 5** - Project Setup
   - Create directory structure
   - Create tracking files
   - Create robot workspaces

6. **Phase 6** - Create Action List
   - Populate actionlist.md with feature assignments
   - Define API contracts
   - Set feature priorities

7. **Phase 7** - Launch Robots
   - Verify all setup is complete
   - Create __start.sh scripts
   - Configure robot permissions

8. **Phase 8** - Quality Assurance
   - Monitor annotations
   - Review integration tests
   - Approve stable classes

9. **Phase 9** - Complex Logic Unit Tests
   - Identify high-complexity logic
   - Add unit tests at project end

### Quality Gate: ✅ Project Design is Complete and Ready for Validation

- Data model finalized
- Use cases documented
- Features decomposed into vertical slices
- Action list populated with tasks
- Robot workspaces created
- Integration test strategy defined
- **Ready for Chaperone Phase 2 validation**

### Input Files

```
PROJECT/dev/
├── specification_augmented.md       (from Chaperone Phase 1)
├── questions_and_answers.md
└── deferred_issues.md
```

### Output Files

```
PROJECT/dev/
├── data_model.md                    ← Chaperone Phase 2 reads this
├── use_cases.md                     ← Chaperone Phase 2 reads this
├── actionlist.md                    ← Chaperone Phase 2 reads this
├── project_activity.status          (status tracking)
└── project_tasks.log                (detailed log)

PROJECT/SOURCE/                      (created by PMA)
├── backend/
├── frontend/
├── database/
│   └── migrations/
└── tests/
    └── integration/
```

### How to Launch PMA

```bash
cd claude_pma
./__start.sh
# PMA automatically reads: ../PROJECT/dev/specification_augmented.md
```

### Reference

See: [start-here.md](start-here.md) - PMA Phases 1-9 section

---

## Phase 3: Chaperone Phase 2 - Design Inspection & Validation

**When**: After PMA Phases 1-9 complete
**Duration**: 1-2 days
**Who**: Chaperone AI Assistant
**Input**: PMA's functional design and Phase 1 refined specs
**Output**: Design approval or blocking issues in `PROJECT/dev/`

### What Chaperone Does

1. Reviews PMA's design against Phase 1 refined specifications
2. Validates that all requirements are addressed
3. Assesses business practicality:
   - **Technical Feasibility**: Can this be built with chosen tech?
   - **Schedule Realism**: Is timeline realistic for complexity?
   - **Scope Clarity**: Are requirements and scope aligned?

4. Makes decision:
   - ✅ **APPROVE** - Design is practically achievable
   - 🚫 **BLOCK** - Issues found that must be resolved
   - 🚩 **ESCALATE** - Conflicts need stakeholder decision

### Quality Gate: ✅ Design is Approved and Ready for Development

- Design matches refined specifications
- All requirements confirmed as addressed
- Technical feasibility confirmed
- Schedule is realistic
- Scope is clear and aligned
- **Development robots ready to proceed** (if approved)

### Input Files

```
PROJECT/dev/
├── specification_augmented.md       (Phase 1 output)
├── data_model.md                    (PMA output)
├── use_cases.md                     (PMA output)
└── actionlist.md                    (PMA output)
```

### Output Files

```
PROJECT/dev/
├── design_approval.md               (if approved) ← Robots read this
│   or
└── design_blocking_issues.md        (if blocked)
```

### How to Launch Chaperone Phase 2

```bash
cd claude_chaperone
./__start.sh
# Select: Phase 2 - Design Inspection & Validation
# Chaperone automatically reads the files above
```

### Reference

See: [chaperone-comprehensive-guide.md](chaperone-comprehensive-guide.md) - Phase 2 section

---

## Phase 4: Development Robots - Implementation

**When**: After Chaperone Phase 2 approval
**Duration**: Varies by project complexity
**Who**: Ashok (Data), Reena (Backend), Charlie (Frontend)
**Input**: Refined specs, design, action list, design approval
**Output**: Implementation in `PROJECT/SOURCE/`

### What Robots Do

Each robot implements their vertical feature slices following the 6-step ROME protocol:

1. **ANALYZE** - Understand use cases and data model
2. **DESIGN** - Create feature design with clear interfaces
3. **IMPLEMENT** - Build from data layer outward
4. **INTEGRATE** - Test integration at each layer
5. **VALIDATE** - Ensure feature completeness
6. **REPORT** - Update status

### Launch Sequence

```bash
# 1. Database layer first (Ashok)
cd claude_data
./__start.sh

# 2. Backend layer (Reena) - waits for database
cd ../claude_backend
./__start.sh

# 3. Frontend layer (Charlie) - waits for API
cd ../claude_frontend
./__start.sh
```

### Quality Gate: ✅ Features Complete with Integration Tests

- All integration tests passing
- Class annotations present
- Code follows ROME patterns
- Features marked @Stable true

### Input Files

```
PROJECT/dev/
├── specification_augmented.md       (refined requirements)
├── data_model.md                    (data structure)
├── use_cases.md                     (workflows)
├── actionlist.md                    (robot task assignments)
└── design_approval.md               (confirmation of approval)

ROME/
└── (all ROME documentation)
```

### Output Files

```
PROJECT/SOURCE/
├── backend/                         (Reena creates)
├── frontend/                        (Charlie creates)
├── database/                        (Ashok creates)
│   ├── migrations/
│   └── schemas.sql
└── tests/
    └── integration/                 (all robots contribute)

PROJECT/dev/
├── project_activity.status          (robots update)
└── project_tasks.log                (robots update)
```

### Reference

See: [role-data.md](role-data.md), [role-backend.md](role-backend.md), [role-frontend.md](role-frontend.md)

---

# Part B: File Locations & Structure by Phase

## Before Starting: User Input Phase

```
PROJECT/dev/
└── _user_input/                     ← User puts raw requirements here
    ├── product_requirements.md      (PRD, business needs)
    ├── use_cases.md                 (user workflows)
    ├── design_mockups/              (wireframes, screenshots)
    ├── technical_specs.md           (technical constraints)
    └── business_context.md          (goals, constraints)
```

**Chaperone Phase 1 looks for**: Everything in `PROJECT/dev/_user_input/`

---

## After Phase 1: Chaperone Specification Refinement

```
PROJECT/dev/
├── _user_input/                     (original user documents)
├── specification_augmented.md       ✅ Created by Chaperone
│                                    (refined, clear specs)
├── questions_and_answers.md         ✅ Created by Chaperone
│                                    (Q&A log from clarification)
└── deferred_issues.md               ✅ Created by Chaperone
                                     (issues deferred to PMA)
```

**PMA looks for**: `specification_augmented.md` and related Chaperone outputs

---

## After Phase 2: PMA Functional Design

```
PROJECT/dev/
├── _user_input/                     (original user documents)
├── specification_augmented.md       (refined specs from Chaperone)
├── questions_and_answers.md         (Q&A from Chaperone)
├── deferred_issues.md               (deferred items)
├── data_model.md                    ✅ Created by PMA
│                                    (entities, relationships)
├── use_cases.md                     ✅ Created by PMA
│                                    (workflows, flows)
├── actionlist.md                    ✅ Created by PMA
│                                    (feature assignments)
├── project_activity.status          ✅ Created by PMA
│                                    (status tracking)
└── project_tasks.log                ✅ Created by PMA
                                     (detailed log)

PROJECT/SOURCE/                      ✅ Created by PMA
├── backend/
├── frontend/
├── database/
│   └── migrations/
└── tests/
    └── integration/
```

**Chaperone Phase 2 looks for**: `specification_augmented.md`, `data_model.md`, `use_cases.md`, `actionlist.md`

---

## After Phase 3: Chaperone Design Approval

```
PROJECT/dev/
├── _user_input/                     (original user documents)
├── specification_augmented.md       (refined specs)
├── questions_and_answers.md         (Q&A log)
├── deferred_issues.md               (deferred items)
├── data_model.md                    (PMA design)
├── use_cases.md                     (PMA design)
├── actionlist.md                    (PMA design)
├── project_activity.status          (PMA status)
├── project_tasks.log                (PMA log)
├── design_approval.md               ✅ Created by Chaperone
│                                    (approval confirmation)
    or
└── design_blocking_issues.md        🚫 Created if issues found
```

**Status**: ✅ APPROVED or 🚫 BLOCKED

---

## During Phase 4: Development Robots Working

```
PROJECT/dev/
├── _user_input/                     (reference documents)
├── specification_augmented.md       ← Robots read this
├── questions_and_answers.md
├── deferred_issues.md
├── data_model.md                    ← Robots read this
├── use_cases.md                     ← Robots read this
├── actionlist.md                    ← Robots read this
├── design_approval.md               ← Robots verify this exists
├── project_activity.status          (robots update)
└── project_tasks.log                (robots update)

PROJECT/SOURCE/                      ← Robots write code here
├── backend/                         (Reena)
│   ├── models/
│   ├── controllers/
│   ├── routes/
│   └── ...
├── frontend/                        (Charlie)
│   ├── lib/
│   ├── src/
│   └── ...
├── database/                        (Ashok)
│   ├── migrations/
│   ├── seeds/
│   └── schemas.sql
└── tests/
    └── integration/
        ├── database_test.js
        ├── api_test.js
        └── ui_test.dart
```

**Robots read**: `specification_augmented.md`, `data_model.md`, `use_cases.md`, `actionlist.md`, `design_approval.md`

---

## File Dependencies: What Depends on What

```
┌─────────────────────────────────────────────────────────────┐
│ User Input (PROJECT/dev/_user_input/)                       │
│  └─ product_requirements.md, use_cases.md, design_mockups/  │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ↓ Chaperone Phase 1 reads from here
┌────────────────────────────────────────────────────────────┐
│ Chaperone Phase 1 Output (PROJECT/dev/)                    │
│  └─ specification_augmented.md ◄────────────────┐           │
│  └─ questions_and_answers.md                    │           │
│  └─ deferred_issues.md                          │           │
└────────┬───────────────────────────────────────┼───────────┘
         │                                       │
         ↓ PMA reads from here                   │
┌────────────────────────────────────────────────┼───────────┐
│ PMA Output (PROJECT/dev/)                      │           │
│  ├─ data_model.md ◄────────────────┐           │           │
│  ├─ use_cases.md ◄──────────────┐  │           │           │
│  ├─ actionlist.md ◄─────────┐   │  │           │           │
│  ├─ project_activity.status  │   │  │           │           │
│  └─ project_tasks.log        │   │  │           │           │
└────────┬──────────────────────┼───┼──┼───────┬──┼───────────┘
         │                      │   │  │       │  │
         │ spec_augmented ──────┼───┘  │       │  │
         ↓ (still used)         │      │       │  │
┌────────────────────────────────────────────────┼──┼───────┐
│ Chaperone Phase 2 (PROJECT/dev/)              │  │       │
│ Reads:                                        │  │       │
│  - specification_augmented.md ────────────────┘  │       │
│  - data_model.md ──────────────────────────────┘        │
│  - use_cases.md ───────────────────────────────────────┘│
│  - actionlist.md ──────────────────────────────────────┐│
│                                                        │ │
│ Creates:                                              │ │
│  └─ design_approval.md ◄────────────────┐             │ │
│     or design_blocking_issues.md         │             │ │
└────────┬─────────────────────────────────┼─────────────┼┘
         │                                 │             │
         ↓ Robots read from here           │             │
┌────────────────────────────────────────┬─┼─────────────┘
│ Development Robots (PROJECT/dev/)      │ │
│ Reads:                                 │ │
│  - specification_augmented.md ─────┐   │ │
│  - data_model.md                   │   │ │
│  - use_cases.md                    │   │ │
│  - actionlist.md                   │   │ │
│  - design_approval.md (verify) ────┼───┘ │
│                                    │     │
│ Creates:                           │     │
│  └─ PROJECT/SOURCE/ (code) ────────┼─────┘
└────────────────────────────────────┘
```

---

# Part C: Document Management System

## Overview: Three-Tier Documentation

ROME uses a **tiered documentation system** to maintain clarity while allowing robots to explore freely.

```
Tier 1: Core Project Docs
├── Versioned in git ✅
├── Canonical source of truth
├── Approved and permanent
└── Location: PROJECT/dev/

Tier 2: Working Docs
├── NOT versioned (git-ignored)
├── Transient and ephemeral
├── Free exploration
└── Location: PROJECT_WORKING/[robot]/current/

Tier 3: Archive
├── Old working docs
├── Reference only
├── Auto-deleted after 6 months
└── Location: PROJECT_ARCHIVE/
```

---

## Tier 1: Core Project Documentation

### Location
```
PROJECT/dev/
```

### What Lives Here
- `specification_augmented.md` - Refined specifications (single source of truth)
- `data_model.md` - Data design
- `use_cases.md` - User workflows
- `actionlist.md` - Feature assignments
- `project_activity.status` - Current project status
- `project_tasks.log` - Activity log
- `design_approval.md` - Chaperone Phase 2 approval or blocking issues
- `spec_changes.log` - Interim modifications log

### Characteristics
- ✅ **Versioned in git** - Full history, immutable except via commits
- ✅ **Canonical** - Source of truth for all robots
- ✅ **Approved** - Only updated after approval
- ✅ **Permanent** - Never deleted
- ✅ **Formal** - Professional, well-structured naming

### Naming Convention
```
[project_name]_[document_type]_[version].md

Examples:
- projectx_specification_v1.md
- projectx_data_model_v1.md
- projectx_actionlist_v1.md
```

### Editing Rules
- **Who can edit**: PMA, Chaperone (with justification)
- **When**: Only after approval or as interim amendment (with log)
- **How**: Git commit with clear message explaining change
- **Approval**: Major changes require Chaperone/PMA sign-off

### Access Rules
- **Read**: Everyone (robots, stakeholders, coordinators)
- **Edit**: PMA, Chaperone only
- **History**: Full git history available
- **Cleanup**: Never auto-clean; permanent retention

---

## Tier 2: Working Documentation

### Location
```
PROJECT_WORKING/[robot_name]/[current or dated folder]/
```

### Structure by Robot
```
PROJECT_WORKING/
├── ashok_data/
│   ├── 2025-10-29_schema_exploration/
│   ├── 2025-10-30_indexing_analysis/
│   ├── 2025-10-31_migration_strategy/
│   └── current/                      # Latest active work
│       ├── README.md
│       └── [active working files]
│
├── reena_backend/
│   ├── 2025-10-29_api_design_draft/
│   ├── 2025-10-30_auth_investigation/
│   └── current/
│
├── charlie_frontend/
│   ├── 2025-10-29_state_management/
│   ├── 2025-10-30_component_design/
│   └── current/
│
├── chaperone_working/
│   ├── 2025-10-29_initial_analysis/
│   └── current/
│
└── pma_working/
    ├── 2025-10-30_design_v1/
    ├── 2025-10-31_design_v2/
    └── current/
```

### What Lives Here
- Exploration and analysis documents
- Draft designs (before approval)
- Performance testing results
- Technical investigation notes
- API design drafts
- Schema prototypes
- Component sketches

### Characteristics
- ❌ **NOT versioned** (git-ignored)
- ❌ **Not canonical** - May be superseded or deleted
- ✅ **Ephemeral** - Auto-cleanup after 3 months
- ✅ **Free-form** - Robots can explore without constraints
- ✅ **Dated** - Easy to identify age and cleanup candidates

### Naming Convention
```
YYYY-MM-DD_[task]_[robot_optional]_[description].md

Examples:
- 2025-10-29_schema_exploration_ashok_indexing.md
- 2025-10-30_api_draft_reena_auth_endpoints.md
- 2025-10-30_performance_analysis_redis_vs_memcached.md
```

### Working Doc Header Template
```markdown
---
Date: 2025-10-29
Robot: [Ashok | Reena | Charlie | PMA | Chaperone]
Task: [Brief task name]
Status: [In Progress | Review | Ready for Promotion | Archived]
Purpose: [Why this exploration exists]
---

# [Document Title]

## Context
[What problem are we solving?]

## Investigation / Analysis
[Content here]

## Findings
[Key discoveries]

## Recommendations
[For promotion or next steps]

## Decision
[What was decided based on this analysis]

## Promotion Candidate?
- [ ] Yes - ready to move to PROJECT/dev/
- [ ] No - informational only
```

### Editing Rules
- **Who can edit**: Robot who created it (or team for collaboration)
- **When**: Freely during development
- **How**: Direct edit, no git (since not versioned)
- **Cleanup**: Auto-delete after 3 months or manual archival

### Access Rules
- **Read**: Everyone (for visibility into work)
- **Edit**: Creator + team (free collaboration)
- **History**: Not tracked
- **Cleanup**: Automatic (via coordinator schedule)

---

## Tier 3: Archive

### Location
```
PROJECT_ARCHIVE/[robot_or_iteration]/YYYY-MM/
```

### Structure
```
PROJECT_ARCHIVE/
├── ashok_data/
│   ├── 2025-09/
│   │   ├── ARCHIVE_2025-09_schema_exploration.md
│   │   └── ARCHIVE_2025-09_indexing_analysis.md
│   └── 2025-10/
│       └── ARCHIVE_2025-10_migration_draft.md
│
├── reena_backend/
│   └── 2025-09/
│       └── ARCHIVE_2025-09_api_design_v1.md
│
└── 2025-10_cleanup_report.md
```

### What Lives Here
- Old working docs (moved from PROJECT_WORKING/)
- Superseded iterations
- Historical analysis (for reference only)
- Cleanup logs

### Characteristics
- ❌ **NOT versioned**
- ❌ **Not canonical** - For reference only
- ✅ **Organized by date** - Easy to identify for deletion
- ✅ **Read-only** - Snapshot, not actively edited
- ✅ **Temporary** - Delete after 6 months

### Naming Convention
```
ARCHIVE_YYYY-MM_[robot]_[task]_[description].md

Examples:
- ARCHIVE_2025-09_ashok_migration_draft.md
- ARCHIVE_2025-10_reena_api_v1_design.md
```

### Access Rules
- **Read**: Everyone (for historical reference)
- **Edit**: Coordinator only (moves, organization)
- **History**: Not tracked
- **Cleanup**: Delete after 6 months

---

## Document Promotion: Working → Core

When working docs become valuable, promote them to core:

### Promotion Criteria
- [ ] Content is validated/tested
- [ ] Approved by Chaperone or PMA
- [ ] Addressed all blocking feedback
- [ ] Ready for permanent version control
- [ ] Follows core doc naming convention

### Promotion Process

**Step 1: Review & Approval**
```
Robot: This working doc is ready for core
Chaperone/PMA: Review and approve
```

**Step 2: Naming & Format**
```
FROM: 2025-10-29_schema_v2_ashok_indexing.md
TO: projectx_data_model_v2.md
```

**Step 3: Move to Core**
```bash
mv PROJECT_WORKING/ashok_data/2025-10-29_schema_v2_ashok_indexing.md \
   PROJECT/dev/projectx_data_model_v2.md
```

**Step 4: Add to Git**
```bash
git add PROJECT/dev/projectx_data_model_v2.md
git commit -m "Promote schema v2 to core data model (approved by Chaperone)"
```

**Step 5: Archive Original**
```bash
mv PROJECT_WORKING/ashok_data/current/2025-10-29_schema_v2_ashok_indexing.md \
   PROJECT_ARCHIVE/ashok_data/2025-10/ARCHIVE_2025-10_schema_v2.md
```

---

## Interim Spec Modifications

During development, core specs may need adjustment.

### Change Types

**Clarification** (24h approval)
- Adds detail without changing meaning
- Example: "User can have up to 100 projects" clarifies implicit limit

**Minor Amendment** (48h approval)
- Changes details but not core design
- Example: Change field type from `string` to `int`
- Approved by: Chaperone + PMA

**Major Revision** (1 week approval)
- Changes requirements or architecture
- Example: Add new major feature not in original spec
- Approved by: Chaperone + PMA + User/Stakeholder

### Change Request Process

**Step 1: Robot Creates Change Request**
```markdown
## Change Request

Date: 2025-10-30
Requester: Reena
Type: Clarification | Minor Amendment | Major Revision
Doc Affected: specification_augmented.md

### What's Changing?
[Clear description of change]

### Why?
[Reason for change]

### Impact?
[What does this affect?]

### Approval Timeline
[When is this needed?]
```

**Step 2: Approval**
- Clarifications: Chaperone approves (24h)
- Minor amendments: Chaperone + PMA approve (48h)
- Major revisions: Add User/Stakeholder approval (1 week)

**Step 3: Update & Log**
```bash
# Update the spec document
# Add entry to spec_changes.log
# Commit with clear message
git commit -m "AMEND: Add user preference limit (clarification, approved by Chaperone)"
```

**Step 4: Track in spec_changes.log**
```markdown
## 2025-10-30 - User Preference Limit

- Type: Clarification
- Requested by: Reena
- Approved by: Chaperone
- Date approved: 2025-10-30
- Change: Users can have max 100 active projects
- Rationale: Database performance limits
- Impact: None on implementation (already coded for this)
```

---

## Git Strategy

### .gitignore
```
# Ignore transient working docs
PROJECT_WORKING/
PROJECT_ARCHIVE/
claude_*/

# But track core docs explicitly
!PROJECT/dev/
!PROJECT/dev/**/*.md
!PROJECT/dev/**/*.status
!PROJECT/dev/**/*.log
```

### Commits for Core Docs
```bash
git commit -m "[TYPE] Brief description

[Body]
- What changed
- Why it changed
- Approval (if applicable)

TYPE:
- UPDATE: Minor changes to existing doc
- PROMOTE: Promoted working doc to core
- REVISE: Major revision after approval
- AMEND: Interim modification (with change request)
"
```

### Example Commits
```
git commit -m "UPDATE specification: Add user preferences entity (clarification)"

git commit -m "PROMOTE: Data model v1 to core (Chaperone approved)"

git commit -m "AMEND: Use case modification - defer user preferences to v2 (ticket #42)"

git commit -m "REVISE: PMA design plan v1 - adjusted timeline based on tech feasibility"
```

---

## Document Hygiene: Coordinator Responsibilities

The **Project Coordinator (Roma)** enforces document hygiene:

### Weekly (30 min)
- [ ] Check `PROJECT_WORKING/` folder sizes
- [ ] Remove duplicate/abandoned docs
- [ ] Fix naming convention violations
- [ ] Verify `current/` folders are up to date

### Monthly (2 hours)
- [ ] Archive working docs older than 3 months
- [ ] Generate cleanup report
- [ ] Review `spec_changes.log` for completeness
- [ ] Check for promotion candidates

### Quarterly (3 hours)
- [ ] Remove archived docs older than 6 months
- [ ] Generate document health metrics
- [ ] Audit core doc structure
- [ ] Report on document health

See: [coordinator-hygiene-checklist.md](coordinator-hygiene-checklist.md) for detailed checklist

---

# Part D: Getting Started & Implementation Timeline

## Quick Start: Where Do I Begin?

### If You're Starting a New Project
1. Read this guide (Part A - Execution Flow)
2. Create `PROJECT/dev/_user_input/` with raw requirements
3. Launch Chaperone Phase 1
4. When done, launch PMA Phases 1-9
5. When done, launch Chaperone Phase 2
6. When approved, launch Development Robots

### If You're Joining Mid-Project
1. Check: What phase are we in? (See Phase Summary above)
2. Check: What files exist in `PROJECT/dev/`?
3. Read: Relevant input files for your role
4. Follow: Instructions in your role specification

### If You're a Coordinator
1. Read: Document Management System (Part C)
2. Run: Coordinator checklist weekly/monthly/quarterly
3. Monitor: Spec changes log and working docs
4. Report: Monthly health metrics

---

## Implementation Timeline

### Day 1: Setup
```bash
# Create directory structure
mkdir -p PROJECT/dev/_user_input
mkdir -p PROJECT_WORKING/{ashok_data,reena_backend,charlie_frontend,pma_working,chaperone_working}/current
mkdir -p PROJECT_ARCHIVE/{ashok_data,reena_backend,charlie_frontend}/2025-10

# Create core files
touch PROJECT/dev/spec_changes.log
touch PROJECT/dev/project_activity.status

# Update .gitignore
cat >> .gitignore << 'EOF'
PROJECT_WORKING/
PROJECT_ARCHIVE/
claude_*/
EOF

# Gather requirements
# Put documents in PROJECT/dev/_user_input/
```

### Day 2-4: Chaperone Phase 1
```bash
cd claude_chaperone
./__start.sh
# Chaperone analyzes raw requirements
# Produces: specification_augmented.md
```

### Day 5-7: PMA Phases 1-9
```bash
cd claude_pma
./__start.sh
# PMA designs based on refined specs
# Produces: data_model.md, use_cases.md, actionlist.md
```

### Day 8: Chaperone Phase 2
```bash
cd claude_chaperone
./__start.sh
# Select: Phase 2 - Design Inspection
# Decision: Approve or Block
```

### Day 9+: Development (if Approved)
```bash
cd claude_data && ./__start.sh    # Ashok (database)
cd ../claude_backend && ./__start.sh  # Reena (backend API)
cd ../claude_frontend && ./__start.sh # Charlie (frontend)
```

---

## Role-Specific Getting Started

### For Chaperone Phase 1
**First Time?**
1. Read: Part A - Phase 1 section above
2. Read: [chaperone-comprehensive-guide.md](chaperone-comprehensive-guide.md) - Phase 1 section
3. Execute: Launch Chaperone as shown above

**Reference During Work:**
- 8 Technical Dimensions: chaperone-comprehensive-guide.md
- Question Templates: chaperone-comprehensive-guide.md
- Output Template: template-augmented-specification.md

---

### For PMA
**First Time?**
1. Read: Part A - Phase 2 section above
2. Read: [start-here.md](start-here.md) - PMA Phases 1-9 section
3. Execute: Launch PMA as shown above

**Reference During Work:**
- Phase details: start-here.md
- Actionlist template: template-actionlist.md
- Robot workspace setup: start-here.md Phase 7

---

### For Chaperone Phase 2
**First Time?**
1. Read: Part A - Phase 3 section above
2. Read: [chaperone-comprehensive-guide.md](chaperone-comprehensive-guide.md) - Phase 2 section
3. Execute: Launch Chaperone Phase 2 as shown above

**Reference During Work:**
- Design validation checklist: chaperone-comprehensive-guide.md
- Decision matrix template: chaperone-comprehensive-guide.md
- Output templates: template-augmented-specification.md

---

### For Development Robots
**First Time?**
1. Read: Part A - Phase 4 section above
2. Read: Your role specification
   - [role-data.md](role-data.md) - Ashok
   - [role-backend.md](role-backend.md) - Reena
   - [role-frontend.md](role-frontend.md) - Charlie
3. Read: ROME documentation
   - [rome-overview.md](rome-overview.md)
   - [rome-implementation-guide.md](rome-implementation-guide.md)
   - [rome-reference.md](rome-reference.md)
4. Execute: Launch as shown above

**Reference During Work:**
- Your role spec
- Data model: PROJECT/dev/data_model.md
- Use cases: PROJECT/dev/use_cases.md
- Action list: PROJECT/dev/actionlist.md
- ROME reference: rome-reference.md

---

### For Project Coordinator (Roma)
**First Time?**
1. Read: Part C - Document Management System above
2. Read: [coordinator-hygiene-checklist.md](coordinator-hygiene-checklist.md)
3. Setup: Calendar reminders for weekly/monthly/quarterly tasks

**Reference During Work:**
- Weekly checklist: coordinator-hygiene-checklist.md
- Monthly maintenance: coordinator-hygiene-checklist.md
- Promotion process: Part C - Document Promotion section
- Change process: Part C - Interim Spec Modifications section

---

## Complete Directory Structure (Final State)

```
PROJECT/
├── dev/                             # Core project docs (git-tracked)
│   ├── _user_input/                 # User requirements
│   │   ├── product_requirements.md
│   │   ├── use_cases.md
│   │   ├── design_mockups/
│   │   ├── technical_specs.md
│   │   └── business_context.md
│   │
│   ├── specification_augmented.md   # Refined specs (Chaperone)
│   ├── questions_and_answers.md     # Q&A log
│   ├── deferred_issues.md           # Deferred items
│   │
│   ├── data_model.md                # Design (PMA)
│   ├── use_cases.md
│   ├── actionlist.md
│   │
│   ├── design_approval.md           # Approval (Chaperone)
│   ├── design_blocking_issues.md    # Or blocking issues
│   │
│   ├── spec_changes.log             # Change tracking
│   ├── project_activity.status      # Status tracking
│   └── project_tasks.log            # Activity log
│
├── SOURCE/                          # Implementation (robots build here)
│   ├── backend/
│   │   ├── models/
│   │   ├── controllers/
│   │   ├── routes/
│   │   └── ...
│   ├── frontend/
│   │   ├── lib/
│   │   ├── src/
│   │   └── ...
│   ├── database/
│   │   ├── migrations/
│   │   ├── seeds/
│   │   └── schemas.sql
│   └── tests/
│       └── integration/
│
└── (Other project files)

PROJECT_WORKING/                     # Transient working docs (git-ignored)
├── ashok_data/
│   ├── 2025-10-29_schema_exploration/
│   ├── 2025-10-30_indexing_analysis/
│   └── current/
├── reena_backend/
│   ├── 2025-10-29_api_draft/
│   └── current/
├── charlie_frontend/
│   ├── 2025-10-29_state_design/
│   └── current/
├── pma_working/
│   ├── 2025-10-30_design_v1/
│   └── current/
└── chaperone_working/
    ├── 2025-10-29_analysis/
    └── current/

PROJECT_ARCHIVE/                    # Old working docs (git-ignored)
├── ashok_data/
│   └── 2025-09/
│       ├── ARCHIVE_2025-09_schema_exploration.md
│       └── ARCHIVE_2025-09_indexing_analysis.md
├── reena_backend/
│   └── 2025-09/
│       └── ARCHIVE_2025-09_api_design_v1.md
└── cleanup_logs/
    └── 2025-10_cleanup_report.md

ROME/                               # ROME methodology (immutable)
├── ROME-4.0-COMPLETE-GUIDE.md      # This file
├── chaperone-comprehensive-guide.md
├── start-here.md
├── role-*.md
├── template-*.md
└── ... (other ROME docs)

claude_*/                           # Robot workspaces (session-specific)
├── claude_chaperone/
│   ├── CLAUDE.md
│   └── __start.sh
├── claude_pma/
│   ├── CLAUDE.md
│   └── __start.sh
├── claude_data/
│   ├── CLAUDE.md
│   └── __start.sh
├── claude_backend/
│   ├── CLAUDE.md
│   └── __start.sh
└── claude_frontend/
    ├── CLAUDE.md
    └── __start.sh
```

---

# Part E: FAQ & Troubleshooting

## Phase & Workflow Questions

### Q: What phase are we in?
**A**: Check `PROJECT/dev/`:
- Only `_user_input/` exists? → **Phase 1 starting** (Chaperone)
- `specification_augmented.md` exists? → **Phase 2 starting** (PMA)
- `data_model.md` exists? → **Phase 2 in progress** (PMA)
- `design_approval.md` or `design_blocking_issues.md` exists? → **Phase 3 complete**
- If approved: → **Phase 4 starting** (Robots)

### Q: Can we skip a phase?
**A**: **NO.** All phases must complete in order:
- Skipping Phase 1 → PMA designs from unclear specs → rework later
- Skipping Phase 2 → No design plan → robots confused
- Skipping Phase 3 → Design issues discovered during dev → expensive fixes
- Skipping Phase 4 → Obviously needed!

### Q: What if Phase 3 blocks the design?
**A**:
1. Chaperone documents blocking issues
2. PMA must fix issues
3. Resubmit design for Phase 3 re-review
4. Iterate until approved

### Q: Can we run phases in parallel?
**A**: **NO.** Each phase requires the previous one's output:
- PMA needs `specification_augmented.md` from Phase 1
- Chaperone Phase 2 needs `data_model.md` from Phase 2
- Robots need `design_approval.md` from Phase 3

---

## File Location Questions

### Q: Where do I put my working document?
**A**:
- **Exploring/drafting?** → `PROJECT_WORKING/[your_name]/current/`
- **Approved and canonical?** → `PROJECT/dev/` (with formal naming)
- **Ready to delete?** → `PROJECT_ARCHIVE/` (then delete after 6 months)
- **Session workspace?** → `claude_[role]/` (auto-cleaned)

### Q: How do I promote a working doc to core?
**A**: See Part C - Document Promotion section above

### Q: What if I can't find a file?
**A**: Check Part B - File Locations by Phase section:
1. Identify what phase you're in
2. Look at the corresponding directory structure
3. File should be there with documented name

### Q: Can I modify core docs directly?
**A**: **Only if**:
- You're PMA or Chaperone
- You follow the Interim Spec Modifications process
- You log the change in `spec_changes.log`
- You commit to git with clear message

---

## Document Management Questions

### Q: What if I create a working doc but it's no longer needed?
**A**: Leave it in `PROJECT_WORKING/` - coordinator will archive after 3 months and delete after 6

### Q: How long do we keep archived docs?
**A**: 6 months. After that, coordinator deletes them.

### Q: What's the difference between working and core docs?
**A**:
| Aspect | Core | Working |
|--------|------|---------|
| Git versioned? | ✅ | ❌ |
| Canonical? | ✅ | ❌ |
| Edited freely? | ❌ | ✅ |
| Permanent? | ✅ | ❌ (3→6 months) |
| Naming | Formal | Dated |

### Q: Can multiple robots edit the same working doc?
**A**: **Yes** - working docs are free collaboration. Just coordinate in shared `PROJECT_WORKING/[team]/current/` folders

### Q: What happens if I forget to log a spec change?
**A**: Coordinator will catch it in monthly review - update `spec_changes.log` retroactively with the change date

---

## Role-Specific Questions

### For Chaperone

**Q: What do I analyze in Phase 1?**
**A**: 8 technical dimensions - see chaperone-comprehensive-guide.md

**Q: How long does Phase 1 take?**
**A**: 2-5 days depending on complexity

**Q: What if specs are already clear?**
**A**: Phase 1 confirms clarity. You may finish faster, but don't skip it.

**Q: In Phase 2, what makes me block a design?**
**A**: Three reasons:
1. Technical feasibility issue (can't build with chosen tech)
2. Schedule unrealistic for complexity
3. Scope misalignment (missing core requirements)

---

### For PMA

**Q: Do I wait for Phase 1 to complete before starting?**
**A**: **Yes.** You MUST have `specification_augmented.md` before starting Phase 1.

**Q: How do I decompose features?**
**A**: See start-here.md Phase 3 - Feature Decomposition section

**Q: Can I create robot workspaces before Phase 7?**
**A**: Yes, prep them in Phase 5, but don't launch robots until Phase 7 complete.

---

### For Robots

**Q: Do I start before design is approved?**
**A**: **NO.** Wait for `design_approval.md` in Phase 3.

**Q: What if I find a bug in the spec?**
**A**: Create a change request - see Part C - Interim Spec Modifications

**Q: What happens if I find the design is infeasible?**
**A**: Immediately raise it - don't code around it. Escalate to PMA/Chaperone.

---

### For Coordinator

**Q: How often do I check working docs?**
**A**: Weekly (30 min) - see coordinator-hygiene-checklist.md

**Q: What if I find docs that don't follow naming convention?**
**A**: Rename them to follow convention and note in hygiene report

**Q: Can I delete working docs before 3 months?**
**A**: Only if robot explicitly marks them "archived" and approves deletion

---

## Troubleshooting

### Problem: PMA says specs are unclear
**Solution**: Go back to Chaperone Phase 1. Ask more questions. Update `specification_augmented.md`.

### Problem: Design fails Phase 3 review
**Solution**: PMA must address blocking issues. Resubmit for re-review. Don't skip Phase 3!

### Problem: Robot can't find a file
**Solution**: Check Part B file locations section. Verify phase is complete. Ask coordinator to audit.

### Problem: Spec keeps changing during development
**Solution**: Use formal change request process (Part C - Interim Spec Modifications). Log in `spec_changes.log`.

### Problem: Working docs folder is massive
**Solution**: Coordinator runs monthly cleanup. Archive docs older than 3 months. Delete docs older than 6 months in archive.

### Problem: Multiple robots edited same working doc and it's inconsistent
**Solution**: Coordinator resolves conflicts. If contentious, create separate docs or promote to core for formal approval.

---

## Quick Reference: Where Do I Put My Doc?

```
┌─────────────────────────────────────────────┐
│ Are you exploring or drafting?              │
│ → PROJECT_WORKING/[your_name]/current/     │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Is it approved and canonical?               │
│ → PROJECT/dev/ (with formal naming)         │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Is it old and ready to delete?              │
│ → PROJECT_ARCHIVE/ (then delete 6mo later)  │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Is it session-specific workspace?           │
│ → claude_[role]/ (auto-cleaned per session) │
└─────────────────────────────────────────────┘
```

---

## Summary Table: Document Types & Rules

| Aspect | Core (`PROJECT/dev/`) | Working (`PROJECT_WORKING/`) | Archive | Workspace |
|--------|---|---|---|---|
| **Versioning** | Git ✅ | No (git-ignored) | No | No |
| **Canonical** | Yes ✅ | No | No | No |
| **Audience** | Everyone | Team + robots | Reference | Robot |
| **Editing** | Controlled (approval) | Free | Read-only | Free |
| **Lifecycle** | Permanent | 3 months | 6 months | Per session |
| **Naming** | Formal | Dated | Dated + ARCHIVE_ | Session |
| **Purpose** | Source of truth | Exploration | Reference | Session work |

---

## Related Documents

- [chaperone-comprehensive-guide.md](chaperone-comprehensive-guide.md) - Chaperone Phase 1 & 2 details
- [start-here.md](start-here.md) - Entry point with phase navigation
- [coordinator-hygiene-checklist.md](coordinator-hygiene-checklist.md) - Coordinator oversight guide
- [spec-change-process.md](spec-change-process.md) - Formal change management
- [role-chaperone.md](role-chaperone.md) - Chaperone role specification
- [role-pma.md](role-pma.md) - PMA role specification
- [role-data.md](role-data.md) - Data Architect role
- [role-backend.md](role-backend.md) - Backend Engineer role
- [role-frontend.md](role-frontend.md) - Frontend Engineer role
- [role-roma.md](role-roma.md) - Project Coordinator role
- [rome-overview.md](rome-overview.md) - ROME methodology overview
- [rome-implementation-guide.md](rome-implementation-guide.md) - Implementation details
- [rome-reference.md](rome-reference.md) - Quick reference guide

---

## Using This Guide

### If you need to know...
- **What phase am I in?** → See "Phase & Workflow Questions"
- **Where do files go?** → See "Part B: File Locations by Phase"
- **How do I organize docs?** → See "Part C: Document Management System"
- **How do I get started?** → See "Part D: Getting Started"
- **What should I do?** → See "Role-Specific Getting Started"
- **Something else?** → See "Part E: FAQ & Troubleshooting"

### Bookmark these sections:
- Phase summary (beginning of Part A)
- File locations (Part B)
- Document tiers (Part C)
- Coordinator checklist (Part C)
- Getting started (Part D)

---

**Status**: Complete & Ready for Use
**Last Updated**: 2025-10-29
**Version**: 4.0 (Consolidated)

This is your **single source of truth** for ROME 4.0 execution, file management, and documentation. Reference it throughout your project lifecycle.

**Questions?** See Part E - FAQ & Troubleshooting, or check the related documents listed above.
