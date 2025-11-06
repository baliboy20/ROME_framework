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

### Phases 2B, 3, 4: UNCHANGED
- Phase 2B: Chaperone validates (now validates HTM + PMA outputs)
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
│ Duration: 2-5 days                              │
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
│ Duration: 3-7 days                              │
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
    ↓ (Design complete)
┌─────────────────────────────────────────────────┐
│ PHASE 2B: Design Validation Gate               │
│ Agent: Chaperone                                │
│ Duration: 1-2 days                              │
│                                                 │
│ Validates:                                      │
│   ✓ HTM artifacts complete                     │
│   ✓ Architecture addresses all requirements    │
│   ✓ Data model consistent                      │
│   ✓ Test plan comprehensive                    │
│                                                 │
│ Decision: ✅ Approve / 🚫 Block / 🚩 Escalate  │
└─────────────────────────────────────────────────┘
    ↓ (Approved)
┌─────────────────────────────────────────────────┐
│ PHASE 3: Development                            │
│ Agents: Ashok, Reena, Charlie                  │
│ Build features per action list                 │
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

### 2. Why PMA Does Architecture (Not Chaperone)

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
**Focus:** Requirements engineering  
**Needs:** HTM methodology knowledge  
**Does NOT need:** Technical architecture expertise, MCP access  
**Outputs:** Requirements artifacts (YAML)

### PMA (Phase 2)
**Focus:** Technical architecture + implementation planning  
**Needs:** Expert docs, MCP access, architecture knowledge  
**Outputs:** Architecture spec, data model, test plan, action list

### Chaperone (Phase 2B)
**Focus:** Validation & quality gate  
**Needs:** Critical thinking, methodology knowledge  
**Does NOT need:** Deep technical resources (reviews, doesn't create)  
**Outputs:** Approval or blocking issues

### Development Robots (Phase 3)
**Focus:** Implementation  
**Unchanged from v4.0**

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

**Q: How long does HTM add to timeline?**  
A: 2-5 days for Phase 1. But saves time in Phase 2-3 due to clarity.

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

### Ready for Phase 3 When:
- ✅ Phase 2B Chaperone approves
- ✅ No blocking issues
- ✅ Development robots have complete specs

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 5.0 | 2025-11-06 | HTM integration, PMA architecture expansion |
| 4.0 | 2025-10-XX | 4-phase model, validation gates |

---

**Next:** Read `/ROME/integration/quick-start-htm-rome.md` for step-by-step walkthrough
