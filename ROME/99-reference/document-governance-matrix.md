# ROME Document Governance Matrix
**Version**: 1.0 - Central Reference for All Project Documents
**Last Updated**: 2025-10-30
**Purpose**: Single source of truth for what documents exist, who creates them, who uses them, and which project phase they belong to

---

## Executive Summary

This document provides a **complete matrix of all project documents** used throughout the ROME methodology. It shows:
- ✅ What documents exist
- ✅ Which phase/stage each is created
- ✅ Who creates it (role/robot)
- ✅ Who uses it (roles)
- ✅ Where it's located (tier & path)
- ✅ Success criteria & completion indicators
- ✅ When it transitions between tiers

**Use this document when**:
- Setting up a new project
- Determining what documents should exist at any phase
- Understanding document ownership and dependencies
- Knowing where to find specific documents
- Determining readiness to move to next phase

---

## Part 1: Phase-Based Document Creation Map

### PHASE 1: Specification Refinement (robot_chaperone)

| Document | Created By | Used By | Location | Tier | Success Criteria | Notes |
|----------|-----------|---------|----------|------|-----------------|-------|
| **specification_augmented.md** | robot_chaperone | robot_pma, development robots | `PROJECT/dev/` | Tier 1 (after approval) | All ambiguities resolved, 8 dimensions analyzed, user confirms clarity | Core artifact: Refined requirements |
| **questions_and_answers.md** | robot_chaperone | robot_pma, user/stakeholder | `PROJECT_WORKING/chaperone/` → `PROJECT/dev/` | Tier 2→1 | All clarifying questions answered, decisions documented | Working document during refinement |
| **deferred_issues.md** | robot_chaperone | robot_pma, user | `PROJECT/dev/` | Tier 1 | Issues identified, user decision to defer documented | Lists items deferred to design phase |

---

### PHASE 2: Functional Design (robot_pma)

| Document | Created By | Used By | Location | Tier | Success Criteria | Notes |
|----------|-----------|---------|----------|------|-----------------|-------|
| **data_model.md** | robot_pma | robot_ashok, robot_reena, robot_charlie, robot_clara | `PROJECT/dev/` | Tier 1 | Entities defined, relationships clear, constraints documented, UX validation complete | Driven by specification_augmented.md |
| **use_cases.md** | robot_pma | development robots, robot_clara | `PROJECT/dev/` | Tier 1 | User workflows documented, success/failure scenarios defined, all features mapped to use cases | Driven by specification_augmented.md |
| **actionlist.md** | robot_pma | development robots (robot_ashok, robot_reena, robot_charlie) | `PROJECT/dev/` | Tier 1 | Feature slices defined, assignments clear, dependencies mapped, complexity assessed | Task assignments to robots |
| **project_plan.md** | robot_pma | robot_roma, stakeholders | `PROJECT/dev/` | Tier 1 | Schedule realistic, dependencies identified, risks assessed, milestones clear | Timeline and planning |
| **project_activity.status** | robot_pma (initial), robot_roma (updates) | all robots, stakeholders | `PROJECT/dev/` | Tier 1 | Updated daily/weekly, all completed features logged | Real-time progress tracking |
| **project_tasks.log** | robot_pma (initial), robots (updates) | all robots, robot_roma | `PROJECT/dev/` | Tier 1 | All tasks logged, status updated, blockers documented | Detailed task tracking |
| **design_system.md** | robot_clara | robot_charlie, robot_pma | `DESIGN/` | Tier 1 (after approval) | Colors defined, typography specs complete, spacing scale defined, accessibility specs included | UX Design deliverable |

---

### PHASE 2: Design (robot_clara - UX Designer)

| Document | Created By | Used By | Location | Tier | Success Criteria | Notes |
|----------|-----------|---------|----------|------|-----------------|-------|
| **component_specs/** | robot_clara | robot_charlie | `DESIGN/COMPONENT_SPECS/` | Tier 1 (after approval) | Each component spec complete (variants, properties, responsive, accessibility), ready for implementation | Design specs for UI components |
| **user_flows/** | robot_clara | robot_charlie, robot_pma | `DESIGN/USER_FLOWS/` | Tier 1 (after approval) | All workflows documented, user journey clarity, interaction sequences clear | Navigation and workflow design |
| **mockups/** | robot_clara | robot_charlie, robot_pma, robot_clara | `DESIGN/MOCKUPS/` | Tier 1 (after approval) | Annotated mockups, component references, layout specs, responsive designs, accessibility notes | Visual design specifications |
| **design_tokens.md** | robot_clara | robot_charlie | `DESIGN/` | Tier 1 (after approval) | Colors, typography, spacing, shadows all documented in copy-paste format (Dart constants) | Handed to Charlie for code |

---

### PHASE 3: Design Validation (robot_chaperone)

| Document | Created By | Used By | Location | Tier | Success Criteria | Notes |
|----------|-----------|---------|----------|------|-----------------|-------|
| **design_approval.md** | robot_chaperone | development robots, stakeholders | `PROJECT/dev/` | Tier 1 | Design approved, technical feasibility confirmed, schedule realistic, scope clear | Approval to proceed OR |
| **design_blocking_issues.md** | robot_chaperone | robot_pma, stakeholders | `PROJECT/dev/` | Tier 1 | Blocking issues documented, impact described, resolution required before development | Blocks development until resolved |

---

### PHASE 4: Implementation (development robots)

#### Database Layer (robot_ashok)

| Document | Created By | Used By | Location | Tier | Success Criteria | Notes |
|----------|-----------|---------|----------|------|-----------------|-------|
| **Schema definition** (code) | robot_ashok | robot_reena, robot_charlie, robot_clara | `PROJECT/SOURCE/database/` | Tier 1 | Schema created, migrations written, indexes defined, seed data included | Implementation code |
| **Schema annotations** | robot_ashok | robots, documentation | Code comments | Tier 1 | @Created, @TestLevel, @Stable, @ComplexityLevel on all classes | ROME standard annotations |
| **Database UX validation** | robot_clara | robot_ashok | `PROJECT/dev/` | Tier 1 | Schema supports UX, all fields present, constraints correct, Clara approves | Design validation |

#### Backend Layer (robot_reena)

| Document | Created By | Used By | Location | Tier | Success Criteria | Notes |
|----------|-----------|---------|----------|------|-----------------|-------|
| **API endpoints** (code) | robot_reena | robot_charlie, robots | `PROJECT/SOURCE/backend/` | Tier 1 | Endpoints defined, request/response contracts clear, error handling complete, validations implemented | Implementation code |
| **API documentation** | robot_reena | robot_charlie, external integrations | `PROJECT/dev/API.md` or code comments | Tier 1 | Routes documented, parameters defined, responses shown with examples, status codes clear | API contract |
| **API annotations** | robot_reena | robots | Code comments | Tier 1 | @Created, @TestLevel, @Stable, @ComplexityLevel on all classes | ROME standard annotations |
| **API UX validation** | robot_clara | robot_reena | `PROJECT/dev/` | Tier 1 | API returns all needed fields, sorting/filtering works, error messages user-friendly, Clara approves | Design validation |

#### Frontend Layer (robot_charlie)

| Document | Created By | Used By | Location | Tier | Success Criteria | Notes |
|----------|-----------|---------|----------|------|-----------------|-------|
| **Design tokens (code)** | robot_charlie | robot_charlie | `PROJECT/SOURCE/lib/design/design_tokens.dart` | Tier 1 | All tokens from Clara's design_tokens.md translated to code, used throughout | Implementation code |
| **UI components** (code) | robot_charlie | robot_charlie | `PROJECT/SOURCE/lib/ui/components/` | Tier 1 | Components match component specs, all variants implemented, states work, Clara validates | Implementation code |
| **UI screens** (code) | robot_charlie | robots, users | `PROJECT/SOURCE/lib/ui/screens/` | Tier 1 | Screens match mockups, responsive, accessible, integration tests pass, Clara validates | Implementation code |
| **Frontend annotations** | robot_charlie | robots | Code comments | Tier 1 | @Created, @TestLevel, @Stable, @ComplexityLevel on all classes | ROME standard annotations |
| **Frontend UX validation** | robot_clara | robot_charlie | `PROJECT/dev/` | Tier 1 | Visual matches design, colors correct, typography correct, spacing correct, responsive works, accessibility meets specs, Clara approves | Design validation checkpoints |

---

## Part 2: Document Ownership & Usage Matrix

### By Role/Robot

#### robot_chaperone
**Creates**: specification_augmented.md, questions_and_answers.md, deferred_issues.md, design_approval.md, design_blocking_issues.md
**Owns**: Specification refinement and design validation quality gates
**Uses**: specification_augmented.md (feedback), data_model.md, use_cases.md, design_system.md, component_specs
**Phases**: Phase 1 (Spec Refinement), Phase 3 (Design Validation)

#### robot_pma
**Creates**: data_model.md, use_cases.md, actionlist.md, project_plan.md, project_activity.status (initial), project_tasks.log (initial)
**Owns**: Functional design and feature decomposition
**Uses**: specification_augmented.md, user feedback
**Phases**: Phase 2 (Functional Design)
**Partners**: robot_clara (design validation), robot_chaperone (design approval)

#### robot_clara (UX Designer)
**Creates**: design_system.md, component_specs/*, user_flows/*, mockups/*, design_tokens.md
**Owns**: UX design specifications and validation across all layers
**Uses**: data_model.md, use_cases.md, design_approval.md (validates against this)
**Creates**: Database UX validation, API UX validation, Frontend UX validation reports
**Phases**: Phase 2 (Design), Phase 3 (Validation)

#### robot_ashok (Data Architect)
**Creates**: Schema code, schema annotations, integration tests
**Owns**: Database layer implementation
**Uses**: data_model.md, design_approval.md, design_tokens.md (for understanding UX context)
**Validated by**: robot_clara (database UX validation)
**Phases**: Phase 4 Layer 1

#### robot_reena (Backend Engineer)
**Creates**: API endpoints, API documentation, API annotations, integration tests
**Owns**: Backend/API layer implementation
**Uses**: data_model.md, use_cases.md, design_approval.md, design_system.md (for error message UX)
**Validated by**: robot_clara (API UX validation)
**Phases**: Phase 4 Layers 2-3

#### robot_charlie (Frontend Developer)
**Creates**: design_tokens.dart, UI components, UI screens, frontend annotations, integration tests
**Owns**: Frontend layer implementation
**Uses**: design_tokens.md, component_specs/*, user_flows/*, mockups/*, API documentation
**Validated by**: robot_clara (Frontend UX validation at 3 checkpoints)
**Phases**: Phase 4 Layers 4-6

#### robot_roma (Project Coordinator)
**Creates**: project_activity.status (updates), weekly/monthly/quarterly hygiene reports
**Owns**: Document management and project oversight
**Uses**: project_activity.status, project_tasks.log, all other documents (monitors)
**Phases**: Throughout all phases

#### User/Stakeholder
**Provides**: Raw requirements, PRD, design mockups, use case descriptions
**Uses**: specification_augmented.md (for clarification confirmation), design_approval.md
**Approves**: specification_augmented.md, design_approval.md

---

## Part 3: Document Locations & Tier Structure

### Tier 1: Core Project Documentation
**Location**: `PROJECT/dev/`
**Status**: Canonical, versioned, git-tracked
**Promotion Criteria**: Complete, validated, approved
**Retention**: Permanent (git history)
**Access**: All project team members

**Tier 1 Documents**:
```
PROJECT/dev/
├── specification_augmented.md         (robot_chaperone)
├── deferred_issues.md                 (robot_chaperone)
├── data_model.md                      (robot_pma)
├── use_cases.md                       (robot_pma)
├── actionlist.md                      (robot_pma)
├── project_plan.md                    (robot_pma)
├── project_activity.status            (robot_pma, robot_roma updates)
├── project_tasks.log                  (robots update)
├── design_approval.md OR design_blocking_issues.md (robot_chaperone)
├── DESIGN/
│   ├── design_system.md               (robot_clara)
│   ├── design_tokens.md               (robot_clara)
│   ├── COMPONENT_SPECS/
│   │   ├── button_spec.md
│   │   ├── input_spec.md
│   │   └── [more component specs...]
│   ├── USER_FLOWS/
│   │   ├── create_flow.md
│   │   └── [more flows...]
│   └── MOCKUPS/
│       ├── project_list_mockup.md
│       └── [more mockups...]
└── [phase-specific validation reports...]
```

### Tier 2: Working Documentation
**Location**: `PROJECT_WORKING/[robot]/`
**Status**: Ephemeral, in-progress, git-ignored
**Use**: Scratch work, drafts, research
**Promotion**: When complete and validated, promote to Tier 1
**Retention**: Git-ignored, cleaned monthly by robot_roma

**Tier 2 Structure**:
```
PROJECT_WORKING/
├── chaperone/
│   ├── questions_and_answers.md       (Draft)
│   └── [working notes...]
├── pma/
│   └── [design drafts...]
├── clara/
│   └── [design iterations...]
├── ashok/
│   └── [schema experiments...]
├── reena/
│   └── [API drafts...]
└── charlie/
    └── [UI prototypes...]
```

### Tier 3: Archive
**Location**: `PROJECT_ARCHIVE/`
**Status**: Historical reference only
**Retention**: 6-month deletion policy (auto-delete after 6 months by robot_roma)
**Use**: Historical reference, decision tracking

---

## Part 4: Phase-by-Phase Success Criteria

### Phase 1: Specification Refinement - COMPLETION CHECKLIST

**Created Documents**:
- [ ] specification_augmented.md - Complete, all 8 dimensions covered
- [ ] questions_and_answers.md - All clarifications documented
- [ ] deferred_issues.md - Issues listed with user's decision (resolve now or defer)

**Success Criteria**:
- [ ] All specification ambiguities resolved
- [ ] User confirms understanding and clarity
- [ ] All 8 technical dimensions analyzed
- [ ] All clarifying questions answered
- [ ] Deferred issues documented with rationale
- [ ] Ready for robot_pma to design from

**Approval Gate**: robot_chaperone marks specification_augmented.md as complete

---

### Phase 2: Functional Design - COMPLETION CHECKLIST

**Created Documents**:
- [ ] data_model.md - All entities, relationships, constraints
- [ ] use_cases.md - All workflows, success/failure scenarios
- [ ] actionlist.md - Features decomposed into vertical slices
- [ ] project_plan.md - Schedule, milestones, dependencies
- [ ] project_activity.status - Initialized with all tasks
- [ ] design_system.md - Colors, typography, spacing, components
- [ ] component_specs/\*.md - All components specified
- [ ] user_flows/\*.md - All workflows diagrammed
- [ ] mockups/\*.md - All screens designed
- [ ] design_tokens.md - Copy-paste ready for developers

**Success Criteria**:
- [ ] Data model reviewed by user/stakeholder
- [ ] Use cases validated against requirements
- [ ] Features clearly scoped and assigned to robots
- [ ] Design system complete and approved
- [ ] All components and mockups annotated
- [ ] Design tokens ready in Dart format
- [ ] Ready for robot_chaperone Phase 3 validation

**Approval Gate**: robot_pma marks design complete, ready for Phase 3 validation

---

### Phase 3: Design Validation - COMPLETION CHECKLIST

**Created Documents**:
- [ ] design_approval.md - Approval document if feasible, OR
- [ ] design_blocking_issues.md - Blocking issues if not feasible

**Success Criteria**:
- [ ] Design reviewed against refined specifications
- [ ] All requirements confirmed as addressed
- [ ] Technical feasibility confirmed (or issues documented)
- [ ] Schedule realism confirmed (or issues documented)
- [ ] Scope clarity confirmed (or issues documented)
- [ ] design_approval.md approved by robot_chaperone

**Approval Gate**: robot_chaperone approves design OR blocks with documented issues

---

### Phase 4: Implementation - COMPLETION CHECKLIST

**Layer 1 (Database - robot_ashok)**:
- [ ] Schema defined in code with annotations
- [ ] Migrations written
- [ ] Integration tests passing
- [ ] robot_clara validates database UX support
- [ ] Annotations complete (@Created, @TestLevel Integration, etc.)

**Layers 2-3 (Backend - robot_reena)**:
- [ ] API endpoints implemented with annotations
- [ ] API documentation complete
- [ ] Validation and error handling complete
- [ ] Integration tests passing
- [ ] robot_clara validates API provides UX needs
- [ ] Annotations complete (@Created, @TestLevel Integration, etc.)

**Layers 4-6 (Frontend - robot_charlie)**:
- [ ] design_tokens.dart created from Clara's design_tokens.md
- [ ] UI components implemented per component specs
- [ ] UI screens implemented per mockups
- [ ] Responsive layouts working (mobile/tablet/desktop)
- [ ] Accessibility specs implemented
- [ ] Integration tests passing
- [ ] Three design validation checkpoints passed (Clara validates):
  - [ ] Checkpoint 1: design_tokens.dart
  - [ ] Checkpoint 2: UI components
  - [ ] Checkpoint 3: UI screens + responsive + accessibility
- [ ] Annotations complete (@Created, @TestLevel Integration, @Source tags, etc.)

**Feature Completion**:
- [ ] All robots completed layer assignments
- [ ] All validation reports show PASS
- [ ] All integration tests passing
- [ ] project_activity.status updated with completion
- [ ] Feature moved from actionlist.md → completed section

---

## Part 5: Document Promotion Workflow

### Tier 2 → Tier 1 Promotion

**Criteria for Promotion**:
1. Document is complete (not draft)
2. Document is validated/approved by appropriate reviewer
3. Naming follows ROME convention: `[project]_[type]_[version].md`
4. Content is ready for canonical use

**Promotion Process**:
1. Robot completes document in Tier 2 location
2. Robot reviews against success criteria
3. Appropriate reviewer approves
4. Robot moves to Tier 1 (`PROJECT/dev/`)
5. Commit to git with message: "Promote [doc_name] from Tier 2 to Tier 1"

**Example**:
```bash
# In Tier 2
PROJECT_WORKING/chaperone/questions_and_answers.md

# After approval, move to Tier 1
PROJECT/dev/questions_and_answers.md

# Git commit
git add PROJECT/dev/questions_and_answers.md
git rm PROJECT_WORKING/chaperone/questions_and_answers.md
git commit -m "Promote questions_and_answers.md from Tier 2 to Tier 1 - Phase 1 complete"
```

---

## Part 6: Quick Reference: "Which Document Do I Need?"

### By Phase

**Phase 1: Refinement**
- Need to understand requirements? → specification_augmented.md
- Want to see what was asked? → questions_and_answers.md
- Need to know deferred issues? → deferred_issues.md

**Phase 2: Design**
- Need entity definitions? → data_model.md
- Need user workflows? → use_cases.md
- Need feature assignments? → actionlist.md
- Need design specifications? → design_system.md, component_specs/*, mockups/*
- Need tokens for code? → design_tokens.md
- Need timeline? → project_plan.md

**Phase 3: Validation**
- Can we build this? → design_approval.md (if approved) or design_blocking_issues.md (if blocked)

**Phase 4: Implementation**
- Which features? → actionlist.md
- What goes in database? → data_model.md
- What are workflows? → use_cases.md
- What's the UI design? → mockups/*, component_specs/*, design_tokens.md
- What APIs do I need? → API documentation + use_cases.md
- How are we doing? → project_activity.status

### By Role

**robot_chaperone**
- Create: specification_augmented.md, design_approval.md
- Read: PRD, design_system.md, data_model.md, use_cases.md

**robot_pma**
- Create: data_model.md, use_cases.md, actionlist.md, project_plan.md
- Read: specification_augmented.md

**robot_clara**
- Create: design_system.md, component_specs, mockups, design_tokens.md
- Read: data_model.md, use_cases.md

**robot_ashok**
- Create: database schema code
- Read: data_model.md, design_approval.md

**robot_reena**
- Create: API endpoints code
- Read: use_cases.md, data_model.md, design_approval.md

**robot_charlie**
- Create: design_tokens.dart, UI components, UI screens
- Read: design_tokens.md, component_specs, mockups, use_cases.md

**robot_roma**
- Monitor: All documents
- Create: project_activity.status updates
- Maintain: Document hygiene, archiving

---

## Part 7: Document Naming Convention

All Tier 1 documents follow this naming:

```
[project_name]_[document_type]_[version].md
```

**Examples**:
- `myapp_specification_augmented_v1.md`
- `myapp_data_model_v2.md`
- `myapp_design_approval_v1.md`
- `myapp_actionlist_v1.md`

**Document Types**:
- specification_augmented
- data_model
- use_cases
- actionlist
- project_plan
- design_system
- design_tokens
- design_approval
- design_blocking_issues
- database_schema
- api_documentation

---

## Part 8: Document Management Responsibilities

### robot_roma - Weekly
- [ ] Check all robots updated project_activity.status
- [ ] Review project_tasks.log for blockers
- [ ] Archive completed tasks
- [ ] Verify git commits have proper messages

### robot_roma - Monthly
- [ ] Archive completed phase documents to Tier 3
- [ ] Verify all Tier 1 documents current
- [ ] Clean up old Tier 2 documents (older than 1 month)
- [ ] Review document naming conventions
- [ ] Update document-governance-matrix.md if new doc types added

### robot_roma - Quarterly
- [ ] Review Tier 3 archive, delete documents older than 6 months
- [ ] Assess whether document structure is working
- [ ] Report to user/stakeholders on project status
- [ ] Recommend process improvements

---

## Summary: The Three Core Artifacts

### From Each Phase

**Phase 1 → specification_augmented.md**
- What it is: Refined requirements with all ambiguities resolved
- Who creates: robot_chaperone
- Who approves: User/stakeholder
- Who uses: robot_pma, development robots
- Success: All 8 dimensions analyzed, all questions answered

**Phase 2 → data_model.md + use_cases.md + actionlist.md + design artifacts**
- What they are: Design and feature decomposition
- Who creates: robot_pma + robot_clara
- Who approves: User/stakeholder, robot_chaperone (Phase 3)
- Who uses: Development robots
- Success: Design practical, features clearly scoped

**Phase 3 → design_approval.md**
- What it is: Approval to proceed with development
- Who creates: robot_chaperone
- Who uses: Development robots, stakeholders
- Success: Technical, schedule, scope all validated

**Phase 4 → Implementation code + @Stable true classes**
- What they are: Working software
- Who creates: robot_ashok, robot_reena, robot_charlie
- Who uses: Users, stakeholders
- Success: Meets design specs, tests pass, Clara validates

---

## Integration with New Guides

This governance matrix integrates with:
- **guide-ux-to-frontend-integration.md** → Shows how design_system.md, component_specs, mockups flow to robot_charlie with validation checkpoints
- **guide-robot-naming-conventions.md** → Shows why robots are named robot_clara, robot_charlie, etc.
- **guide-question-option-completeness.md** → Shows how robot_chaperone and robot_pma ask questions to create specification_augmented.md and design artifacts

---

## References

Related ROME documents:
- [document-management-strategy.md](document-management-strategy.md) - Three-tier system details
- [ROME-4.0-COMPLETE-GUIDE.md](ROME-4.0-COMPLETE-GUIDE.md) - Phase-by-phase execution
- [guide-ux-to-frontend-integration.md](guide-ux-to-frontend-integration.md) - Design artifact handoff
- [guide-robot-naming-conventions.md](guide-robot-naming-conventions.md) - Robot naming standards
- [coordinator-hygiene-checklist.md](coordinator-hygiene-checklist.md) - Maintenance tasks
