# ROME v4.0 to v5.0 Migration Guide

**Version:** 5.0
**Date:** November 6, 2025
**Audience:** Teams migrating from ROME v4.0 to v5.0
**Status:** Production

---

## Overview

ROME v5.0 introduces **HTM (Hierarchical Traceability Method)** integration and **UX Design phase**, transforming the early phases while keeping development phases (3-4) unchanged.

**Key Changes:**
- Phase 1 completely replaced (Chaperone specs → HTM requirements)
- Phase 2 expanded (PMA does architecture design)
- Phase 2A added (UX design with Clara)
- Phase 2B enhanced (Chaperone validates all artifacts)
- Phases 3-4 unchanged (Development and deployment)

---

## What's Changed: Side-by-Side Comparison

### Phase 1: Requirements/Specification

| ROME v4.0 | ROME v5.0 |
|-----------|-----------|
| **Chaperone** refines specifications | **HTM Decomposer** transforms PRD |
| Iterative spec refinement | Structured HTM decomposition |
| Informal specifications | YAML artifacts with traceability |
| No formal data model | data-dictionary.yaml created |
| No component mapping | component-registry.yaml created |
| **Output:** Refined spec doc | **Output:** 3 YAML files + feature docs |

**Impact:** Phase 1 now produces structured, traceable artifacts instead of prose documents.

---

### Phase 2: Architecture & Planning

| ROME v4.0 | ROME v5.0 |
|-----------|-----------|
| **PMA** 6 steps | **PMA** 6 steps (Step 2 expanded) |
| Step 1: Initial planning | Step 1: Read HTM artifacts |
| Step 2: Data model | Step 2: **Technical architecture design** ← NEW |
| Step 3: Use cases | Step 3: Data model refinement |
| Step 4: Integration tests | Step 4: Integration test planning |
| Step 5: Project setup | Step 5: Project setup |
| Step 6: Action list | Step 6: Action list creation |
| **No architecture phase** | **Architecture specification created** |
| PMA creates requirements + design | PMA reads requirements, creates design |

**Impact:** PMA now receives structured requirements instead of creating them. Step 2 expanded to include full architecture design (tech stack, API design, data architecture, deployment).

---

### Phase 2A: UX Design (NEW)

| ROME v4.0 | ROME v5.0 |
|-----------|-----------|
| **No formal UX phase** | **Phase 2A: UX Clara** |
| UX informal or ad-hoc | Structured UX design process |
| Frontend devs lack design specs | Complete UX specifications delivered |
| **No wireframes** | Wireframes created |
| **No design system** | Design system documented |
| **No component specs** | Component specifications defined |

**Impact:** Frontend developers now receive complete UX specifications before Phase 3, solving "no styling/UX carried forward" issue.

---

### Phase 2B: Validation Gate

| ROME v4.0 | ROME v5.0 |
|-----------|-----------|
| **Chaperone** validates specs | **Chaperone** validates HTM + PMA + UX |
| Validates: Specs + data model + tests | Validates: Requirements + Architecture + UX |
| **No HTM artifacts to check** | Checks HTM YAML completeness |
| **No architecture to validate** | Validates architecture decisions |
| **No UX to validate** | Validates UX specifications |

**Impact:** Chaperone's validation is more comprehensive, covering requirements, architecture, AND design.

---

### Phase 3: Development

| ROME v4.0 | ROME v5.0 |
|-----------|-----------|
| **UNCHANGED** | **UNCHANGED** |
| Development robots build features | Development robots build features |
| Backend, Data, Frontend roles | Backend, Data, Frontend roles |
| **Frontend lacks UX specs** | **Frontend uses Phase 2A UX specs** |

**Impact:** Development process unchanged, but frontend now has complete UX specifications.

---

### Phase 4: Validation & Deploy

| ROME v4.0 | ROME v5.0 |
|-----------|-----------|
| **UNCHANGED** | **UNCHANGED** |
| Integration testing | Integration testing |
| User acceptance testing | User acceptance testing |
| Deployment | Deployment |

**Impact:** No changes to Phase 4.

---

## Migration Scenarios

### Scenario 1: Mid-Project (Currently in Phase 2-4)

**Current State:** You're using ROME v4.0 and are in Phase 2, 3, or 4

**Recommendation:** **Finish with v4.0**

**Why:**
- Phases 2-4 are similar enough to continue
- Switching mid-project risks confusion
- Complete current project with v4.0
- Use v5.0 for next project

**Exception:** If you're stuck in Phase 2 due to unclear requirements, consider:
1. Pause current workflow
2. Run HTM Phase 1 on your PRD
3. Resume with v5.0 Phase 2

---

### Scenario 2: Starting New Project (Have PRD)

**Current State:** You have a PRD and were about to start ROME v4.0 Phase 1

**Recommendation:** **Start with v5.0**

**Why:**
- HTM Phase 1 provides better requirements structure
- PMA benefits from structured HTM artifacts
- Frontend benefits from Phase 2A UX specs

**Migration Steps:**
1. Skip v4.0 entirely
2. Follow `/ROME/integration/quick-start-htm-rome.md`
3. Start with HTM Phase 1

---

### Scenario 3: Completed v4.0 Phase 1 (Have Specs)

**Current State:** Chaperone finished specification refinement (v4.0 Phase 1)

**Options:**

**Option A: Continue with v4.0** (Recommended if specs are clear)
- Proceed to v4.0 Phase 2
- Complete project with v4.0
- Use v5.0 for next project

**Option B: Backfill HTM artifacts** (If you want traceability)
1. Run HTM Phase 1 on your refined specs
2. Generate YAML artifacts retroactively
3. Continue with v5.0 Phase 2

**Decision Criteria:**
- **Clear specs + simple project** → Continue with v4.0
- **Complex project needing traceability** → Backfill HTM

---

### Scenario 4: Have Specifications But No PRD

**Current State:** You have internal specs but no formal PRD

**Recommendation:** **Convert specs to PRD, then run HTM**

**Steps:**
1. Create PRD from existing specs
2. Run HTM Stage 1 (Assessment)
3. If HTM-ready: Skip to Stage 3
4. If not: Complete Stage 2 transformation
5. Continue with v5.0 Phase 2

---

## Robot Configuration Changes

### New Robots Required

#### HTM Decomposer Robot (NEW)

**Directory:** `robot_htm_decomposer/`

**Setup:**
```bash
mkdir robot_htm_decomposer
cd robot_htm_decomposer
# Copy CLAUDE.md template
cp /ROME/template-claude-md.txt ./CLAUDE.md
```

**CLAUDE.md content:**
```markdown
# HTM Decomposer Robot

You are the HTM Decomposer for ROME v5.0 Phase 1.

## Role
Your role is defined in: /path/to/role-htm-decomposer.md

## Key Responsibilities
- Transform PRDs into HTM-ready format
- Decompose requirements into Epic → Feature → Story → Task hierarchy
- Generate YAML artifacts (requirements-matrix, data-dictionary, component-registry)
- Create feature documentation

## Reference Documents
- /HTM/ - HTM methodology
- /ROME/integration/ - Integration protocols
- /ROME/guide-question-option-completeness.md - Question guidelines

## Workflow
Follow HTM Stages 1-4 as defined in role specification.
```

#### UX Clara Robot (NEW to workflow)

**Directory:** `robot_ux_clara/`

**Note:** UX Clara role exists but may not have been used in v4.0 workflow

**Setup (if not existing):**
```bash
mkdir robot_ux_clara
cd robot_ux_clara
cp /ROME/template-claude-md.txt ./CLAUDE.md
```

**CLAUDE.md content:**
```markdown
# UX Clara Robot

You are UX Clara for ROME v5.0 Phase 2A.

## Role
Your role is defined in: /path/to/role-ux-clara.md

## Key Responsibilities
- Read HTM requirements and PMA architecture
- Create wireframes for all user-facing features
- Define component specifications
- Document design system (colors, typography, spacing)
- Create prototype UI documentation

## Reference Documents
- PROJECT/requirements/ - HTM artifacts
- PROJECT/dev/ - PMA architecture
- /ROME/template-prototype-ui.md - Template

## Workflow
Follow Phase 2A steps as defined in role specification.
```

---

### Updated Robots

#### PMA Robot (UPDATED)

**Changes:**
- Step 1 now reads HTM artifacts (instead of creating requirements)
- Step 2 expanded to include architecture design
- Steps 3-6 similar but refined

**CLAUDE.md updates:**
```markdown
# PMA Robot

## CHANGES IN v5.0:
- Phase 2 Step 1: Now reads HTM artifacts from PROJECT/requirements/
- Phase 2 Step 2: EXPANDED - Now includes full architecture design
  - Tech stack selection
  - API design
  - Data architecture
  - Auth patterns
  - Caching strategy
  - Deployment architecture

## Role
Your role is defined in: /path/to/role-pma.md

## Reference Documents
- PROJECT/requirements/ - READ HTM artifacts first
- /Experts/ - Expert documentation for architecture decisions
- MCP servers - For technology availability checks

## Workflow
Follow Phase 2 steps 1-6 as defined in role specification.
Phase 2 Step 2 is significantly expanded in v5.0.
```

#### Chaperone Robot (UPDATED)

**Changes:**
- Phase 1 responsibility removed (HTM replaces Chaperone spec refinement)
- Phase 2B validation expanded (now validates HTM + PMA + UX)

**CLAUDE.md updates:**
```markdown
# Chaperone Robot

## CHANGES IN v5.0:
- Phase 1: NO LONGER PERFORMED BY CHAPERONE (HTM Decomposer does this)
- Phase 2B: EXPANDED VALIDATION
  - Now validates HTM artifacts (YAML completeness)
  - Now validates PMA architecture (addresses requirements)
  - Now validates UX Clara design (completeness & consistency)

## Role
Your role is defined in: /path/to/role-chaperone.md

## Reference Documents
- PROJECT/requirements/ - HTM artifacts to validate
- PROJECT/dev/ - PMA artifacts to validate
- PROJECT/design/ - UX artifacts to validate
- /ROME/integration/htm-to-pma-handoff.md - Handoff checklists

## Workflow
Phase 2B only in v5.0.
Validate all artifacts from Phases 1, 2, and 2A.
```

---

## Directory Structure Changes

### v4.0 Structure

```
PROJECT/
├── specs/           # Chaperone refined specs
├── dev/
│   ├── data_model.md
│   ├── use_cases.md
│   ├── integration_test_plan.md
│   └── actionlist.md
└── src/             # Development
```

### v5.0 Structure

```
PROJECT/
├── requirements/    # NEW - HTM Phase 1 outputs
│   ├── requirements-matrix.yaml
│   ├── data-dictionary.yaml
│   ├── component-registry.yaml
│   └── docs/
│       └── features/
│           ├── FEAT-001.1.md
│           └── ...
├── dev/             # PMA Phase 2 outputs
│   ├── architecture_specification.md  # NEW
│   ├── data_model.md
│   ├── integration_test_plan.md
│   └── actionlist.md
├── design/          # NEW - UX Clara Phase 2A outputs
│   ├── prototype_ui.md
│   ├── wireframes/
│   ├── component_specs.md
│   └── design_system.md
└── src/             # Development (unchanged)
```

**Migration Action:**
- Update project templates to include new directories
- Ensure robots know new artifact locations

---

## Workflow Timing Changes

### v4.0 Phases

```
Phase 1 (Chaperone) → Phase 2 (PMA) → Phase 2B (Chaperone) → Phase 3 (Dev) → Phase 4 (Deploy)
```

### v5.0 Phases

```
Phase 1 (HTM) → Phase 2 (PMA) → Phase 2A (UX) → Phase 2B (Chaperone) → Phase 3 (Dev) → Phase 4 (Deploy)
```

**Key Difference:** One additional phase (2A) before validation gate

**Note:** v5.0 documentation does NOT include time estimates. Phases complete when artifacts meet quality criteria, not on timeline.

---

## Breaking Changes

### 1. Phase 1 Outputs

**v4.0:** Prose specification document
**v5.0:** YAML artifacts + feature docs

**Impact:** Tools/scripts that parsed v4.0 specs need updates

**Migration:**
- Update any automation that reads Phase 1 outputs
- Parse YAML instead of markdown specs

---

### 2. PMA Inputs

**v4.0:** PMA creates requirements
**v5.0:** PMA reads requirements from HTM

**Impact:** PMA workflow changed

**Migration:**
- Update PMA robot CLAUDE.md
- Ensure PMA knows to read PROJECT/requirements/ first

---

### 3. Frontend Developer Handoff

**v4.0:** No formal UX handoff
**v5.0:** UX specs in PROJECT/design/

**Impact:** Frontend workflow includes UX review step

**Migration:**
- Train frontend robots to read PROJECT/design/ artifacts
- Update frontend CLAUDE.md to reference UX specs

---

### 4. Chaperone Role

**v4.0:** Chaperone does Phase 1 spec refinement
**v5.0:** Chaperone only validates (Phase 2B)

**Impact:** Chaperone no longer creates specs

**Migration:**
- Update Chaperone CLAUDE.md
- Remove Phase 1 instructions
- Add Phase 2B validation for HTM + UX artifacts

---

## New Document References

### Must Read for v5.0

**Integration Guides:**
- `/ROME/integration/htm-rome-integration-guide.md` - Overall workflow
- `/ROME/integration/htm-to-pma-handoff.md` - Phase 1→2 handoff
- `/ROME/integration/quick-start-htm-rome.md` - Quick start
- `/ROME/integration/yaml-schema-definitions.md` - YAML schemas

**Role Specifications:**
- `/role-htm-decomposer.md` - HTM Decomposer role (NEW)
- `/role-pma.md` - PMA role (UPDATED)
- `/role-ux-clara.md` - UX Clara role (UPDATED)
- `/role-chaperone.md` - Chaperone role (UPDATED)

**Methodology:**
- `/HTM/HTM-Master-Workflow.md` - HTM methodology
- `/HTM/Prompting-Claude-for-HTM.md` - How to use HTM with Claude

**Guides:**
- `/ROME/guide-question-option-completeness.md` - Question protocol
- `/ROME/guide-robot-naming-conventions.md` - Robot naming
- `/ROME/guide-ux-to-frontend-integration.md` - UX handoff

---

## Backward Compatibility

### Can I Run v4.0 and v5.0 in Parallel?

**Yes, but not recommended**

**Scenario:** Use v5.0 for new projects, finish v4.0 projects as-is

**Setup:**
- Keep separate robot directories
- v4.0 robots: `robot_NAME_v4/`
- v5.0 robots: `robot_NAME/` or `robot_NAME_v5/`
- Don't mix workflows within same project

---

### Can I Partially Adopt v5.0?

**Yes, modular adoption possible:**

**Option 1: HTM Only**
- Use HTM Phase 1
- Skip UX Phase 2A
- Continue with v4.0-style Phase 2 (PMA without HTM artifacts)
- Not recommended: Lose main benefit

**Option 2: UX Only**
- Skip HTM Phase 1
- Use v4.0 Phase 1 (Chaperone specs)
- Add Phase 2A (UX)
- Benefit: Solves "no UX handoff" issue

**Option 3: Full v5.0** (Recommended)
- Use all phases
- Maximum benefit

---

## Common Migration Questions

### Q: Do I need to learn HTM methodology?

**A:** Yes, for Phase 1. HTM Decomposer needs to understand hierarchical decomposition, traceability, and YAML artifact generation. Read `/HTM/HTM-Master-Workflow.md`.

### Q: Can I skip HTM for simple projects?

**A:** Yes. For <5 features, start directly at Phase 2 (legacy mode). PMA can create basic requirements without HTM.

### Q: Do all robots need updates?

**A:**
- **New robots:** HTM Decomposer (Phase 1)
- **Updated robots:** PMA (Phase 2), UX Clara (Phase 2A), Chaperone (Phase 2B)
- **Unchanged robots:** Backend, Data, Frontend, DevOps (Phase 3-4)

### Q: What if I don't have a UX designer?

**A:** UX Clara robot can create UX specifications using design best practices and expert documentation. No human UX designer required.

### Q: Can I use v5.0 without robot automation?

**A:** Yes. The methodology works with human roles too. Replace "robot" with "human team member" in role descriptions.

### Q: Where do I get HTM documentation?

**A:** All HTM docs are in `/HTM/` directory. Start with `HTM-Master-Workflow.md`.

---

## Rollback Plan

### If v5.0 Isn't Working

**Symptoms:**
- HTM Phase 1 too complex
- Team prefers v4.0 simplicity
- YAML artifacts not providing value

**Rollback Steps:**
1. Finish current phase if possible
2. Switch back to v4.0 robots
3. Resume with v4.0 workflow
4. Document why v5.0 didn't work
5. Consider partial adoption (UX only)

**No Data Loss:**
- v5.0 artifacts remain in PROJECT/
- Can always return to v5.0 later

---

## Success Criteria for Migration

### Migration Considered Successful When:

- [ ] All robots updated to v5.0
- [ ] HTM Decomposer robot created and tested
- [ ] UX Clara robot integrated into workflow
- [ ] PMA reads HTM artifacts successfully
- [ ] Chaperone validates all v5.0 artifacts
- [ ] Frontend developers receive UX specs
- [ ] First v5.0 project completes successfully

### Metrics:

**Quality Improvements:**
- Fewer Phase 3 rework cycles (better specs upfront)
- Frontend matches design (UX specs provided)
- Clear traceability (HTM artifacts)

**Process Improvements:**
- Structured requirements (YAML artifacts)
- Architecture decisions documented (PMA architecture spec)
- Design system established (UX Clara design system)

---

## Getting Help

### Resources

- **Migration Questions:** Review this guide
- **HTM Questions:** `/HTM/HTM-Master-Workflow.md`
- **Integration Questions:** `/ROME/integration/htm-rome-integration-guide.md`
- **Quick Start:** `/ROME/integration/quick-start-htm-rome.md`

### Support

- **Role Specifications:** `/role-*.md` files for detailed robot instructions
- **Integration Protocols:** `/ROME/integration/` directory
- **Methodology Guides:** `/ROME/guide-*.md` files

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 5.0 | 2025-11-06 | Initial migration guide for v4.0 → v5.0 |

---

**Ready to migrate?** Read `/ROME/integration/quick-start-htm-rome.md` next.
