# HTM-ROME Integration Guide
**Version:** 5.0  
**Date:** November 6, 2025  
**Status:** Production

---

## Overview

ROME v5.0 integrates **HTM (Hierarchical Traceability Method)** as Phase 1 Requirements Engineering, replacing the previous Chaperone specification refinement approach.

## What Changed in v5.0

### Phase 1: HTM Requirements Engineering (NEW)
- **Was:** Chaperone refines specifications through technical analysis
- **Now:** HTM Decomposer transforms PRDs into structured requirements artifacts
- **Output:** YAML artifacts (requirements-matrix, data-dictionary, component-registry)

### Phase 2: Technical Architecture & Planning (EXPANDED)
- **Was:** PMA creates data model, use cases, action list (6 steps)
- **Now:** PMA reads HTM artifacts + designs technical architecture (6 steps, Step 2 expanded)
- **Output:** Architecture specification + refined data model + test plan + action list

### Phase 2A: UX Design & Prototyping (NEW)
- **Was:** Not formally part of workflow
- **Now:** UX Clara creates design specifications and prototypes
- **Output:** Prototype UI document with wireframes, styling specs, component designs

### Phases 2B, 3, 4: UNCHANGED
- Phase 2B: Chaperone validates (now validates HTM + PMA + UX outputs)
- Phase 3: Development robots build features
- Phase 4: Validation & deployment

---

## Complete v5.0 Workflow

```
External PRD (any format)
    ↓
┌─────────────────────────────────────────────────┐
│ PHASE 1: HTM Requirements Engineering          │
│ Agent: HTM Decomposer                           │
│                                                 │
│ Stage 1: Assessment (human decision)           │
│ Stage 2: PRD Transformation (if needed)        │
│ Stage 3: HTM Decomposition                     │
│ Stage 4: Artifact Generation                   │
│                                                 │
│ Outputs → PROJECT/requirements/                │
│   ├── requirements-matrix.yaml                 │
│   ├── data-dictionary.yaml                     │
│   ├── component-registry.yaml                  │
│   └── docs/features/*.md                       │
└─────────────────────────────────────────────────┘
    ↓ (HTM artifacts ready)
┌─────────────────────────────────────────────────┐
│ PHASE 2: Technical Architecture & Planning     │
│ Agent: PMA                                      │
│                                                 │
│ Step 1: Read HTM Artifacts                     │
│ Step 2: Technical Architecture Design ← NEW    │
│         - Tech stack selection                  │
│         - API design                            │
│         - Data architecture                     │
│         - Auth patterns                         │
│         - Caching strategy                      │
│         - Deployment architecture               │
│ Step 3: Data Model Refinement                  │
│ Step 4: Integration Test Planning              │
│ Step 5: Project Setup                          │
│ Step 6: Action List Creation                   │
│                                                 │
│ Outputs → PROJECT/dev/                         │
│   ├── architecture_specification.md            │
│   ├── data_model.md                            │
│   ├── integration_test_plan.md                 │
│   └── actionlist.md                            │
└─────────────────────────────────────────────────┘
    ↓ (Architecture complete)
┌─────────────────────────────────────────────────┐
│ PHASE 2A: UX Design & Prototyping              │
│ Agent: UX Clara                                 │
│                                                 │
│ Step 1: Read Requirements & Architecture       │
│ Step 2: Create Wireframes                      │
│ Step 3: Define Component Specifications        │
│ Step 4: Document Styling & Design System       │
│ Step 5: Create Interactive Prototypes          │
│                                                 │
│ Outputs → PROJECT/design/                      │
│   ├── prototype_ui.md                          │
│   ├── wireframes/                              │
│   ├── component_specs.md                       │
│   └── design_system.md                         │
└─────────────────────────────────────────────────┘
    ↓ (Design complete)
┌─────────────────────────────────────────────────┐
│ PHASE 2B: Design Validation Gate               │
│ Agent: Chaperone                                │
│                                                 │
│ Validates:                                      │
│   ✓ HTM artifacts complete                     │
│   ✓ Architecture addresses all requirements    │
│   ✓ UX design specs complete & consistent      │
│   ✓ Data model consistent                      │
│   ✓ Test plan comprehensive                    │
│                                                 │
│ Decision: ✅ Approve / 🚫 Block / 🚩 Escalate  │
└─────────────────────────────────────────────────┘
    ↓ (Approved)
┌─────────────────────────────────────────────────┐
│ PHASE 3: Development                            │
│ Agents: Backend, Data, Frontend Robots         │
│ Build features per action list                 │
│ Frontend uses UX specs from Phase 2A           │
└─────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────┐
│ PHASE 4: Validation & Deploy                   │
└─────────────────────────────────────────────────┘
```

---

## Key Integration Points

### 1. HTM → PMA Handoff

**HTM Delivers:**
```
PROJECT/requirements/
├── requirements-matrix.yaml      # All requirements with traceability
├── data-dictionary.yaml          # Domain entities and attributes
├── component-registry.yaml       # Technical components mapping
└── docs/features/
    ├── FEAT-001.1.md            # Feature specifications
    ├── FEAT-001.2.md
    └── ...
```

**PMA Reads & Uses:**
- **Step 1:** Analyzes HTM artifacts for completeness
- **Step 2:** Uses requirements context for architecture decisions
- **Step 3:** Refines data-dictionary.yaml into data_model.md
- **Step 6:** Uses component-registry.yaml to create actionlist.md

### 2. PMA → UX Clara Handoff

**PMA Delivers:**
```
PROJECT/dev/
├── architecture_specification.md  # Tech stack, APIs, data architecture
├── data_model.md                 # Refined data structures
└── (HTM artifacts accessible)
```

**UX Clara Reads & Uses:**
- Requirements from HTM artifacts
- Architecture constraints from PMA
- Data model for form/display design
- Component registry for UI mapping

**UX Clara Delivers:**
```
PROJECT/design/
├── prototype_ui.md               # Main design specification
├── wireframes/                   # Visual mockups
├── component_specs.md            # Component design details
└── design_system.md              # Styling, colors, typography
```

### 3. UX Clara → Frontend Robot Handoff

**Frontend robots receive:**
- Complete UX specifications from `PROJECT/design/`
- Component-level styling requirements
- Interaction patterns and user flows
- Responsive design specifications

**This solves:** "No point where styling or UX design carried forward to frontend developer"

### 4. Why PMA Does Architecture (Not Chaperone)

**PMA has access to:**
- ✅ Expert technical documentation
- ✅ MCP servers (database, cloud, APIs)
- ✅ Framework/library specifications
- ✅ Current technology constraints

**This enables informed decisions about:**
- Which database to use (based on available MCP)
- Which auth library to implement (based on expert docs)
- Which API framework to select (based on infrastructure)
- How to structure deployment (based on cloud provider)

**Chaperone validates** decisions but doesn't need deep technical resources.

---

## Role Responsibilities v5.0

### HTM Decomposer (Phase 1)
**Robot Name:** HTM Decomposer (robot_htm_decomposer)
**Focus:** Requirements engineering
**Needs:** HTM methodology knowledge
**Does NOT need:** Technical architecture expertise, MCP access
**Outputs:** Requirements artifacts (YAML)

### PMA (Phase 2)
**Robot Name:** PMA (robot_pma)
**Focus:** Technical architecture + implementation planning
**Needs:** Expert docs, MCP access, architecture knowledge
**Outputs:** Architecture spec, data model, test plan, action list

### UX Clara (Phase 2A)
**Robot Name:** Clara (robot_clara)
**Focus:** User experience design & prototyping
**Needs:** Design expertise, requirements & architecture context
**Does NOT need:** MCP access (receives specs from PMA)
**Outputs:** Wireframes, component specs, design system, prototype UI

### Chaperone (Phase 2B)
**Robot Name:** Chaperone (robot_chaperone)
**Focus:** Validation & quality gate
**Needs:** Critical thinking, methodology knowledge
**Does NOT need:** Deep technical resources (reviews, doesn't create)
**Outputs:** Approval or blocking issues

### Development Robots (Phase 3)
**Robot Names:** Charlie (robot_charlie - Frontend), Reena (robot_reena - Backend), Ashok (robot_ashok - Data)
**Focus:** Implementation
**Unchanged from v4.0**

**Note:** All robots referenced by human names. See `/ROME/guide-robot-naming-conventions.md` for directory structure.

---

## Decision Trees

### When to Use HTM vs. Direct ROME

```
Do you have a PRD/requirements document?
│
├─ NO → Not ready for ROME (do requirements elicitation first)
│
└─ YES → Continue
    │
    Is PRD complex (>10 features) OR needs traceability?
    │
    ├─ YES → Use HTM Phase 1
    │   └─→ Full HTM workflow → ROME Phase 2
    │
    └─ NO (simple, <5 features)
        └─→ Skip HTM, direct to ROME Phase 2
            (PMA creates basic requirements)
```

### Which HTM Stage Do I Need?

```
Is your PRD in HTM-ready format?
(6 sections: Business Context, Product Capabilities, 
User Context, Domain Model, Technical Context, Scope)
│
├─ YES → Skip to HTM Stage 3 (Decomposition)
│
└─ NO → Start at HTM Stage 1 (Assessment)
    └─→ HTM Stage 2 (Transformation)
        └─→ HTM Stage 3 (Decomposition)
            └─→ HTM Stage 4 (Artifacts)
```

---

## Document Locations

### HTM Documentation
All HTM methodology docs in: `/HTM/` directory
- HTM-Master-Workflow.md
- Prompting-Claude-for-HTM.md
- HTM-Input-Requirements.md
- Transforming-PRDs-for-HTM.md
- HTM-Ready-PRD-Structure.md

### ROME Integration Docs
In: `/ROME/integration/` directory
- htm-rome-integration-guide.md (this document)
- htm-to-pma-handoff.md
- quick-start-htm-rome.md

### Updated ROME Core Docs
In: `/ROME/` directory
- rome-overview.md (v5.0)
- ROME-5.0-COMPLETE-GUIDE.md
- start-here.md (v5.0)

### Robot Roles
In: `/ROME/roles/` directory
- role-htm-decomposer.md (NEW)
- role-pma.md (UPDATED - expanded Step 2)
- role-chaperone.md (UPDATED - Phase 1 removed)

---

## Quick Start

### First Time with ROME v5.0?

**Read in this order:**
1. This document (you are here)
2. `/ROME/integration/quick-start-htm-rome.md`
3. `/HTM/HTM-Master-Workflow.md`
4. `/ROME/start-here.md`

**Then:** Follow quick-start guide with your PRD

### Migrating from ROME v4.0?

**Read:** `/MIGRATION-GUIDE.md`

**Key change:** Phase 1 is completely different, Phase 2 expanded

---

## Benefits of HTM Integration

### For Requirements
✅ Structured, traceable requirements (Epic→Feature→Story→Task)  
✅ Complete data dictionary from day one  
✅ Component mapping for clear task assignment  
✅ Acceptance criteria at every level  

### For Architecture
✅ PMA has complete requirements context  
✅ Architecture decisions based on full picture  
✅ Data model grounded in business domain  
✅ Integration tests aligned with features  

### For Development
✅ Clear feature boundaries and interfaces  
✅ Vertical slices from HTM feature decomposition  
✅ Traceability from requirement to code  
✅ Better sprint planning from structured requirements  

### For Validation
✅ Chaperone validates both requirements AND architecture  
✅ Clear success criteria at Phase 2B gate  
✅ Reduced back-and-forth in Phase 3  

---

## Common Questions

**Q: Can I skip HTM for simple projects?**  
A: Yes. For <5 features, go directly to ROME Phase 2 (legacy mode).

**Q: What if my PRD is already good?**  
A: Run HTM Stage 3-4 only (decomposition + artifacts). Skip transformation.

**Q: Do I need to learn HTM AND ROME?**
A: Learn HTM for Phase 1, then ROME for Phases 2-4. They're sequential.

**Q: When does UX design happen?**
A: Phase 2A, after architecture is complete. UX Clara receives architecture constraints and requirements to create design specifications.

**Q: Can frontend developers start without UX specs?**
A: Not recommended. Phase 2B validation ensures UX specs are complete before Phase 3 development begins.

**Q: Can PMA do architecture without expert docs?**
A: No. PMA needs expert docs + MCP access. That's why architecture moved to Phase 2.

---

## Success Criteria

### Phase 1 Complete When:
- ✅ requirements-matrix.yaml generated
- ✅ data-dictionary.yaml complete
- ✅ component-registry.yaml created
- ✅ All features have specifications
- ✅ Traceability IDs assigned throughout

### Phase 2 Complete When:
- ✅ architecture_specification.md created
- ✅ Technology stack selected with rationale
- ✅ data_model.md refined from HTM dictionary
- ✅ integration_test_plan.md covers all boundaries
- ✅ actionlist.md assigns features to robots

### Phase 2A Complete When:
- ✅ prototype_ui.md created with complete specifications
- ✅ Wireframes cover all user-facing features
- ✅ component_specs.md defines all UI components
- ✅ design_system.md documents styling standards
- ✅ Designs align with architecture constraints

### Ready for Phase 3 When:
- ✅ Phase 2B Chaperone approves all artifacts
- ✅ No blocking issues
- ✅ Development robots have complete specs (architecture + UX)

---

## User Interaction Protocol

### When Robots Ask Questions

**Robots that interact with users:**
- HTM Decomposer (Phase 1) - Requirements clarification
- PMA (Phase 2) - Architecture decisions
- UX Clara (Phase 2A) - Design preferences
- Chaperone (Phase 2B) - Validation decisions

### Question Format Standard

**Always use structured options:**

```
Question: [Clear, specific question]

Options:
A) [Option 1 with brief description]
B) [Option 2 with brief description]
C) [Option 3 with brief description]
D) Other (please specify): __________

Which option do you prefer?
```

### When Options Are Incomplete

**If provided options don't fit user's needs:**
- User selects "D) Other"
- User provides written explanation
- Robot acknowledges and incorporates feedback
- Robot may refine options for future similar questions

**Reference:** `/ROME/guide-question-option-completeness.md` for detailed guidelines

### Escalation Triggers

**Robot must escalate (not decide) when:**
- User requirements conflict
- Technical infeasibility detected
- Scope change requested mid-phase
- Budget/timeline implications significant
- Security/compliance concerns

**Escalation path:** Robot → Chaperone → User decision

---

## Phase 1B: Validation Gate (Optional)

### Purpose

Optional checkpoint between HTM Phase 1 and PMA Phase 2 to validate artifact quality before handoff.

### When to Use Phase 1B

**Recommended for:**
- First-time HTM usage
- Complex projects (>20 features)
- Projects requiring external review
- Training/learning scenarios

**Can skip for:**
- Simple projects (<10 features)
- Experienced team with HTM
- Rapid prototyping

### Validation Checklist

**Chaperone validates:**

**Completeness:**
- [ ] requirements-matrix.yaml exists and parses
- [ ] data-dictionary.yaml exists and parses
- [ ] component-registry.yaml exists and parses
- [ ] All features have documentation files

**Consistency:**
- [ ] All feature IDs referenced exist
- [ ] All entity names referenced are defined
- [ ] All component IDs referenced exist
- [ ] Traceability chain complete (Epic → Feature → Story → Task)

**Quality:**
- [ ] Acceptance criteria specific and testable
- [ ] No placeholder or TODO items
- [ ] Business rules clearly stated
- [ ] Dependencies logically valid

### Outcomes

**✅ PASS:** PMA proceeds to Phase 2
**🚫 BLOCK:** HTM Decomposer fixes issues, resubmit for validation
**🚩 ESCALATE:** Ambiguity requires user clarification

### Rollback Process

**If blocked:**
1. Chaperone documents specific issues
2. HTM Decomposer reviews feedback
3. HTM Decomposer fixes identified problems
4. HTM Decomposer resubmits artifacts
5. Chaperone re-validates
6. Maximum 2 revision cycles before escalation

---

## Rework & Iteration Protocol

### Maximum Iteration Limits

**Per phase:**
- Phase 1 (HTM): Max 2 revision cycles
- Phase 2 (PMA): Max 2 revision cycles
- Phase 2A (UX): Max 2 revision cycles
- Phase 2B (Chaperone): Max 2 rejection cycles

**If limits exceeded:** Escalate to user for decision

### Revision Cycle Definition

**One cycle includes:**
1. Work performed
2. Validation/review
3. Issues identified
4. Fixes applied
5. Resubmission

**Example:**
- Cycle 1: HTM creates artifacts → Chaperone finds gaps → HTM fixes → Resubmit
- Cycle 2: HTM resubmits → Chaperone finds more issues → HTM fixes → Resubmit
- Cycle 3: ESCALATE (limit exceeded)

### Escalation Triggers

**Automatic escalation when:**
- Max iterations reached
- Requirements fundamentally unclear
- Technical infeasibility confirmed
- Conflicting user feedback
- Blocked by external dependency

### Escalation Path

```
Robot (blocked)
   ↓
Chaperone (reviews issue)
   ↓
[Can Chaperone resolve?]
   ├─ Yes → Provide guidance, robot continues
   └─ No → Escalate to User
          ↓
       User Decision
          ├─ Clarify requirements → Return to Phase 1
          ├─ Revise scope → Update artifacts, continue
          ├─ Accept limitations → Document, continue
          └─ Pause project → Document state, pause
```

### Preventing Rework

**Best practices:**
- Use Phase 1B validation gate
- Structured questions with options
- Clear acceptance criteria upfront
- Regular progress checkpoints
- Document assumptions immediately

### Tracking Iterations

**Activity log format:**
```
[Phase X] Iteration 1 COMPLETE
- Issues: [List]
- Fixes applied: [List]
- Status: [Resubmitted/Escalated]

[Phase X] Iteration 2 COMPLETE
- Issues: [List]
- Fixes applied: [List]
- Status: [Approved/Escalated]
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 5.0 | 2025-11-06 | HTM integration, PMA architecture expansion |
| 4.0 | 2025-10-XX | 4-phase model, validation gates |

---

**Next:** Read `/ROME/integration/quick-start-htm-rome.md` for step-by-step walkthrough
