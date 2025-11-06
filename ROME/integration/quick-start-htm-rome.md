# Quick Start: HTM-ROME Integration

**Version:** 5.0
**Date:** November 6, 2025
**Audience:** Users new to ROME v5.0
**Status:** Production

---

## Prerequisites

Before starting, ensure you have:

- [ ] **A requirements document (PRD)**
  - Can be any format (Word doc, slides, wiki page, etc.)
  - Should describe desired product/features
  - Doesn't need to be perfectly formatted

- [ ] **Project directory structure**
  - Create: `PROJECT/` (replace with your project name)
  - Will auto-generate subdirectories during workflow

- [ ] **Claude Code CLI access**
  - HTM Decomposer robot instance
  - PMA robot instance
  - UX Clara robot instance
  - Chaperone robot instance

- [ ] **Familiarity with ROME concepts** (optional but helpful)
  - Read `/ROME/start-here.md` first
  - Or just follow this guide step-by-step

---

## The 5-Minute Overview

**What you're about to do:**

1. **Phase 1 (HTM):** Transform your PRD into structured YAML artifacts
2. **Phase 2 (PMA):** Design technical architecture from those artifacts
3. **Phase 2A (UX):** Create design specifications and wireframes
4. **Phase 2B (Chaperone):** Validate everything before development
5. **Phase 3-4:** Development and deployment (standard ROME)

**Total phases before coding:** 4 planning/design phases
**Key output:** Complete specifications ready for development robots

---

## Step-by-Step Walkthrough

### PHASE 1: HTM Requirements Engineering

#### Stage 1: Assess Your PRD

**Action:** Work with HTM Decomposer robot

1. **Open HTM Decomposer Claude instance**
   ```bash
   cd robot_htm_decomposer
   ./start.sh
   ```

2. **Provide your PRD**
   - Upload PRD document OR
   - Paste PRD content into chat

3. **HTM assesses readiness**
   - Is PRD HTM-ready? (6 required sections)
   - If YES: Skip to Stage 3
   - If NO: Proceed to Stage 2

#### Stage 2: Transform PRD (if needed)

**Only if your PRD is not HTM-ready**

HTM Decomposer will ask you questions to fill gaps:

**Business Context:**
- What problem does this solve?
- Who are the users?
- What are the business goals?

**Product Capabilities:**
- What features are needed?
- What should users be able to do?

**User Context:**
- Who are the user roles?
- What are their workflows?

**Domain Model:**
- What are the key entities (nouns)?
- What are the relationships?

**Technical Context:**
- Any technology constraints?
- Any integration requirements?

**Scope:**
- What's in scope for v1?
- What's deferred?

**Result:** HTM creates "HTM-Ready PRD" document

#### Stage 3: HTM Decomposition

**HTM Decomposer performs automated decomposition:**

1. **Identifies Epics** (major capabilities)
2. **Breaks down Features** (within each epic)
3. **Defines Stories** (within each feature)
4. **Creates Tasks** (within each story)
5. **Assigns traceability IDs** (EPIC-001, FEAT-001.1, etc.)
6. **Extracts entities** for data dictionary
7. **Maps components** for technical boundaries

**You may be asked:**
- Clarify ambiguous requirements
- Prioritize features
- Confirm scope decisions

**Duration:** HTM will iterate until complete

#### Stage 4: Generate Artifacts

**HTM Decomposer creates:**

```
PROJECT/requirements/
├── requirements-matrix.yaml      ✅ Created
├── data-dictionary.yaml          ✅ Created
├── component-registry.yaml       ✅ Created
└── docs/features/
    ├── FEAT-001.1.md            ✅ Created
    ├── FEAT-001.2.md            ✅ Created
    └── ...                       ✅ One per feature
```

**Validation:**
- HTM runs self-check
- Confirms all artifacts complete
- Declares "PHASE 1 COMPLETE"

**🎉 Phase 1 Done!** You now have structured requirements.

---

### PHASE 2: Technical Architecture & Planning

#### Step 1: PMA Reads HTM Artifacts

**Action:** Switch to PMA robot

1. **Open PMA Claude instance**
   ```bash
   cd robot_pma
   ./start.sh
   ```

2. **Instruct PMA to begin Phase 2**
   ```
   Phase 1 is complete. HTM artifacts are in PROJECT/requirements/.
   Begin Phase 2: Technical Architecture & Planning.
   ```

3. **PMA analyzes artifacts**
   - Reads requirements-matrix.yaml
   - Reads data-dictionary.yaml
   - Reads component-registry.yaml
   - Validates completeness
   - Identifies scope

**PMA reports:**
- X epics, Y features, Z stories
- N entities in data model
- M components identified
- Any issues or clarifications needed

#### Step 2: Architecture Design (NEW in v5.0)

**PMA designs technical architecture:**

**Tech Stack Selection:**
- Frontend framework (based on expert docs)
- Backend framework (based on available MCP)
- Database selection (based on data model)
- Auth library (based on security requirements)

**API Design:**
- REST vs. GraphQL
- Endpoint structure
- Authentication patterns
- Rate limiting strategy

**Data Architecture:**
- Database schema approach
- Caching strategy
- Data migration plan
- Backup/recovery approach

**Deployment Architecture:**
- Hosting platform
- Scaling strategy
- CI/CD pipeline
- Monitoring approach

**You may be asked:**
- Preferred cloud provider
- Performance requirements
- Budget constraints
- Compliance requirements

**Output:** `PROJECT/dev/architecture_specification.md`

#### Steps 3-6: Complete Planning

**PMA continues:**

3. **Data Model Refinement**
   - Converts data-dictionary.yaml to technical data_model.md
   - Adds foreign keys, indexes, constraints
   - Output: `PROJECT/dev/data_model.md`

4. **Integration Test Planning**
   - Identifies test boundaries
   - Creates test scenarios
   - Output: `PROJECT/dev/integration_test_plan.md`

5. **Project Setup**
   - Creates directory structure
   - Initializes configuration files
   - Sets up repositories

6. **Action List Creation**
   - Assigns features to robots (Backend, Data, Frontend)
   - Creates task sequence
   - Output: `PROJECT/dev/actionlist.md`

**🎉 Phase 2 Done!** You have complete technical architecture.

---

### PHASE 2A: UX Design & Prototyping

#### Step 1: UX Clara Reads Context

**Action:** Switch to UX Clara robot

1. **Open UX Clara Claude instance**
   ```bash
   cd robot_ux_clara
   ./start.sh
   ```

2. **Instruct UX Clara to begin Phase 2A**
   ```
   Phase 2 is complete. Begin Phase 2A: UX Design & Prototyping.
   Requirements in PROJECT/requirements/
   Architecture in PROJECT/dev/
   ```

3. **UX Clara reviews:**
   - HTM requirements (features with UI)
   - PMA architecture (frontend tech stack)
   - Data model (forms and displays)

#### Step 2-5: Create Design Specifications

**UX Clara creates:**

1. **Wireframes**
   - Screen layouts
   - Navigation flows
   - User journeys
   - Output: `PROJECT/design/wireframes/`

2. **Component Specifications**
   - Button styles
   - Form patterns
   - Card layouts
   - Modal behaviors
   - Output: `PROJECT/design/component_specs.md`

3. **Design System**
   - Color palette
   - Typography
   - Spacing system
   - Responsive breakpoints
   - Output: `PROJECT/design/design_system.md`

4. **Interactive Prototypes**
   - Main user flows
   - Key interactions
   - State transitions
   - Output: `PROJECT/design/prototype_ui.md`

**You may be asked:**
- Brand preferences (colors, fonts)
- Target devices (mobile, tablet, desktop)
- Accessibility requirements
- Design inspiration examples

**🎉 Phase 2A Done!** Frontend developers have complete UX specs.

---

### PHASE 2B: Design Validation Gate

#### Chaperone Review

**Action:** Switch to Chaperone robot

1. **Open Chaperone Claude instance**
   ```bash
   cd robot_chaperone
   ./start.sh
   ```

2. **Instruct Chaperone to validate**
   ```
   Phase 1, 2, and 2A are complete.
   Perform Phase 2B validation of all artifacts.
   ```

**Chaperone validates:**

✅ **HTM Artifacts (Phase 1)**
- requirements-matrix.yaml complete
- data-dictionary.yaml consistent
- component-registry.yaml maps all features
- Feature docs comprehensive

✅ **Architecture (Phase 2)**
- architecture_specification.md addresses all requirements
- data_model.md matches data dictionary
- integration_test_plan.md covers boundaries
- actionlist.md assigns all features

✅ **UX Design (Phase 2A)**
- prototype_ui.md covers all UI features
- Wireframes match requirements
- component_specs.md complete
- design_system.md provides standards
- Designs align with architecture constraints

**Chaperone decision:**

- ✅ **APPROVE:** Ready for Phase 3
- 🚫 **BLOCK:** Issues found, must fix before proceeding
- 🚩 **ESCALATE:** Need user decision on trade-offs

**If blocked:**
- Chaperone documents specific issues
- Relevant robot fixes issues
- Chaperone re-validates

**🎉 Phase 2B Done!** All planning validated, ready for development.

---

### PHASE 3: Development

**Standard ROME Phase 3** (unchanged from v4.0)

**Development robots:**
- Backend Robot (Reena)
- Data Robot (Ashok)
- Frontend Robot (Charlie)

**Each robot receives:**
- Architecture specification
- Data model
- UX specifications (frontend only)
- Action list with assigned tasks

**Robots build features according to specs.**

**Frontend robot specifically:**
- Implements UX designs from Phase 2A
- Uses design_system.md for styling
- Implements component_specs.md patterns
- Follows prototype_ui.md flows

**This solves:** "No point where styling or UX design carried forward to frontend developer"

---

### PHASE 4: Validation & Deploy

**Standard ROME Phase 4** (unchanged from v4.0)

- Integration testing
- User acceptance testing
- Deployment
- Monitoring setup

---

## Decision Points

### Should I Use HTM Phase 1?

```
Do you have >5 features OR need requirements traceability?
│
├─ YES → Use full HTM Phase 1
│
└─ NO → Skip HTM, start with Phase 2 (legacy mode)
```

### Is My PRD HTM-Ready?

**HTM-ready PRD has 6 sections:**
1. Business Context
2. Product Capabilities
3. User Context
4. Domain Model
5. Technical Context
6. Scope

**If your PRD has these:** Skip to HTM Stage 3
**If not:** Start at HTM Stage 1

---

## Common Issues & Solutions

### Issue: "HTM can't understand my PRD"

**Solution:**
- Provide additional context
- Answer HTM's clarifying questions
- Consider starting with HTM Stage 1 (transformation)

### Issue: "PMA says HTM artifacts incomplete"

**Solution:**
- Check HTM self-validation passed
- Review specific missing items PMA identifies
- Return to HTM to complete artifacts

### Issue: "UX designs conflict with architecture"

**Solution:**
- UX Clara should have read architecture constraints
- If conflict exists: Choose architecture OR revise architecture
- Chaperone should catch this in Phase 2B

### Issue: "Too much planning, want to start coding"

**Reality check:**
- Planning saves time in development
- Incomplete specs cause rework
- Phase 3 goes faster with complete specs

**Option for small projects:**
- Skip HTM for <5 features
- PMA can create basic requirements
- Still complete Phases 2A-2B

---

## Success Checklist

After completing all phases, you should have:

**Phase 1 Outputs:**
- [ ] requirements-matrix.yaml
- [ ] data-dictionary.yaml
- [ ] component-registry.yaml
- [ ] Feature documentation files

**Phase 2 Outputs:**
- [ ] architecture_specification.md
- [ ] data_model.md
- [ ] integration_test_plan.md
- [ ] actionlist.md

**Phase 2A Outputs:**
- [ ] prototype_ui.md
- [ ] wireframes/
- [ ] component_specs.md
- [ ] design_system.md

**Phase 2B Outputs:**
- [ ] Chaperone approval
- [ ] No blocking issues
- [ ] Development robots ready to start

---

## Time Expectations

**Note:** ROME v5.0 does not provide time estimates. Actual completion depends on:
- Project complexity
- Requirements clarity
- User availability for questions
- Number of revision cycles

**General guidance:**
- Simple projects (<5 features): Consider skipping HTM
- Medium projects (5-20 features): Full HTM-ROME workflow
- Complex projects (>20 features): HTM provides significant value through traceability

---

## Next Steps

### After This Guide

1. **Read role documents:**
   - `/ROME/roles/role-htm-decomposer.md`
   - `/ROME/role-pma.md`
   - `/ROME/role-ux-clara.md`
   - `/ROME/role-chaperone.md`

2. **Review integration details:**
   - `/ROME/integration/htm-to-pma-handoff.md`
   - `/ROME/integration/yaml-schema-definitions.md`

3. **Check robot setup:**
   - `/ROME/guide-robot-naming-conventions.md`

4. **Start with your PRD:**
   - Follow Stage 1 with HTM Decomposer
   - Work through phases sequentially

---

## Getting Help

### Resources

- **ROME Overview:** `/ROME/rome-overview.md`
- **Complete Guide:** `/ROME/ROME-5.0-COMPLETE-GUIDE.md`
- **HTM Methodology:** `/HTM/HTM-Master-Workflow.md`
- **Integration Guide:** `/ROME/integration/htm-rome-integration-guide.md`

### Troubleshooting

**If robots aren't following protocol:**
- Verify robot CLAUDE.md files reference correct role documents
- Check activity log for status updates
- Review chaperone validation reports

**If stuck between phases:**
- Consult handoff protocol documents
- Review phase completion checklists
- Check with Chaperone for validation

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 5.0 | 2025-11-06 | Initial quick start for HTM-ROME integration |

---

**Ready to start?** Begin with Phase 1: Launch HTM Decomposer robot with your PRD.
