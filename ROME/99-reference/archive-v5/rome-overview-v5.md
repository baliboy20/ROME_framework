# ROME Overview
**Version:** 5.0 - HTM-Integrated, Data-Driven Development  
**Last Updated:** November 6, 2025

## What is ROME?

ROME (Robot Methodology) builds software using specialized AI assistants called "Robots" working on **vertical feature slices** from database to UI.

**NEW in v5.0:** Phase 1 is now **HTM (Hierarchical Traceability Method)** for structured requirements engineering.

---

## Core Philosophy (Unchanged)

### Data-First Design
- Start with use cases and workflows
- Design data models that reflect business domain
- Define validation and business rules early
- Build outward from data sources

### Integration-First Testing
- Test at integration boundaries, not individual units
- Test progression: DB → Server → API → Client → UI
- Unit tests only for complex logic (state machines, algorithms)
- Each layer validated before moving outward

### Vertical Feature Slices
Robots own complete features across the stack:
```
Feature: User Projects
├── Database (Ashok): projects table, seed data
├── Backend (Reena): API endpoints, business logic  
└── Frontend (Charlie): UI screens, domain logic
```

Not horizontal layers where integration is a surprise.

---

## ROME v5.0: The 4 Phases

```
┌──────────────────────────────────────────────────┐
│ PHASE 1: HTM Requirements Engineering           │
│ Duration: 2-5 days                               │
│ Agent: HTM Decomposer                            │
│                                                  │
│ • PRD transformation (if needed)                 │
│ • Hierarchical decomposition                     │
│ • Requirements artifacts generation              │
│                                                  │
│ Output: YAML artifacts                           │
│   - requirements-matrix.yaml                     │
│   - data-dictionary.yaml                         │
│   - component-registry.yaml                      │
└──────────────────┬───────────────────────────────┘
                   │
                   ↓
┌──────────────────────────────────────────────────┐
│ PHASE 2: Technical Architecture & Planning      │
│ Duration: 3-7 days                               │
│ Agent: PMA                                       │
│                                                  │
│ Step 1: Read HTM artifacts                      │
│ Step 2: Technical architecture design ← EXPANDED│
│   • Technology stack selection                   │
│   • API contract design                          │
│   • Data layer architecture                      │
│   • Auth/caching/deployment patterns             │
│ Step 3: Data model refinement                    │
│ Step 4: Integration test planning                │
│ Step 5: Project setup                            │
│ Step 6: Action list creation                     │
│                                                  │
│ Output: Architecture + Plans                     │
│   - architecture_specification.md                │
│   - data_model.md                                │
│   - integration_test_plan.md                     │
│   - actionlist.md                                │
└──────────────────┬───────────────────────────────┘
                   │
                   ↓
┌──────────────────────────────────────────────────┐
│ PHASE 2B: Design Validation Gate                │
│ Duration: 1-2 days                               │
│ Agent: Chaperone                                 │
│                                                  │
│ Validates:                                       │
│   ✓ HTM artifacts complete                      │
│   ✓ Architecture addresses requirements         │
│   ✓ Data model consistent                       │
│   ✓ Test plan comprehensive                     │
│                                                  │
│ Decision: ✅ Approve / 🚫 Block / 🚩 Escalate   │
└──────────────────┬───────────────────────────────┘
                   │
                   ↓
┌──────────────────────────────────────────────────┐
│ PHASE 3: Development                             │
│ Duration: Varies by project                      │
│ Agents: Ashok, Reena, Charlie                   │
│                                                  │
│ • Parallel feature development                   │
│ • Integration-first testing                      │
│ • Vertical slices (DB→API→UI)                   │
│                                                  │
│ Each robot follows: ANALYZE → DESIGN →          │
│ IMPLEMENT → INTEGRATE → VALIDATE → REPORT       │
└──────────────────┬───────────────────────────────┘
                   │
                   ↓
┌──────────────────────────────────────────────────┐
│ PHASE 4: Validation & Deploy                    │
│ • Final integration testing                      │
│ • Production deployment                          │
└──────────────────────────────────────────────────┘
```

---

## What Changed in v5.0

### Phase 1: HTM Replaces Chaperone Specification Refinement

**v4.0 Phase 1 (Old):**
- Chaperone refined specifications through technical analysis
- Asked stakeholder questions
- Output: `specification_augmented.md` (prose)

**v5.0 Phase 1 (New):**
- HTM Decomposer transforms PRDs into structured requirements
- Hierarchical decomposition (Epic→Feature→Story→Task)
- Output: YAML artifacts with full traceability

**Why?** Structured requirements enable better planning and traceability.

### Phase 2: PMA Step 2 Expanded

**v4.0 Step 2 (Old):**
- "Data-First Design" - just create data model

**v5.0 Step 2 (New):**
- "Technical Architecture Design" - complete architecture specification
- Technology stack selection
- API contract design
- Data architecture (expanded from v4.0)
- Authentication patterns
- Caching strategy
- Deployment architecture
- Risk assessment

**Why?** PMA has expert docs + MCP access. Can make informed technical decisions.

### Chaperone Role Refocused

**v4.0:** Phase 1 (spec refinement) + Phase 2B (validation)

**v5.0:** Phase 2B only (validation of HTM + PMA outputs)

**Why?** Requirements work moved to HTM. Chaperone focuses on validation gate.

---

## The 6-Step Robot Protocol (Unchanged)

Every development robot follows this for each feature:

1. **ANALYZE** - Understand use cases and data model
2. **DESIGN** - Create feature design with clear interfaces
3. **IMPLEMENT** - Build from data layer outward (with annotations)
4. **INTEGRATE** - Test integration at each layer
5. **VALIDATE** - Ensure feature completeness
6. **REPORT** - Update status with working feature

---

## Class Annotation System (Unchanged)

All classes use development annotations for traceability:

```typescript
/**
 * @Created 2025-10-06 by Reena
 * @Modified 2025-10-07 by Reena
 * @TestLevel Integration
 * @Stable true
 * @ComplexityLevel Low
 */
class ProjectService { ... }
```

**Annotations:**
- **@Created**: Origin tracking (date + robot)
- **@Modified**: Last significant change
- **@TestLevel**: Integration | Unit | Both | None
- **@Stable**: true (production-ready) | false (in development)
- **@ComplexityLevel**: Low | Medium | High (guides unit test needs)

---

## Project Structure (Updated)

```
PROJECT/
├── requirements/               # NEW - HTM Phase 1 outputs
│   ├── requirements-matrix.yaml
│   ├── data-dictionary.yaml
│   ├── component-registry.yaml
│   └── docs/features/*.md
│
├── dev/                        # Phase 2 PMA outputs
│   ├── architecture_specification.md   # NEW - expanded
│   ├── data_model.md
│   ├── integration_test_plan.md
│   ├── actionlist.md
│   └── project_activity.status
│
├── SOURCE/                     # Phase 3 Development
│   ├── backend/
│   ├── frontend/
│   ├── database/
│   └── tests/integration/
│
└── robots/                     # Robot workspaces
    ├── robot_htm_decomposer/   # NEW
    ├── robot_pma/
    ├── robot_chaperone/
    ├── robot_ashok/
    ├── robot_reena/
    └── robot_charlie/
```

---

## When to Use ROME v5.0

### ✅ Good for:
- Business applications with clear workflows
- Systems with definable data models
- Projects needing requirements traceability
- Complex features (≥10 features)
- Teams using AI assistants

### 🟡 Use Simplified Mode for:
- Simple projects (<5 features)
- Rapid prototypes
- POCs or experiments
- Skip HTM Phase 1, go directly to PMA Phase 2

### ❌ Not ideal for:
- Algorithm-heavy systems
- Research/experimental projects (unclear requirements)
- Pure infrastructure projects (no features)

---

## Key Benefits of v5.0

### Structured Requirements
✅ Complete traceability (Epic→Feature→Story→Task)  
✅ YAML artifacts enable automation  
✅ Data dictionary from day one  
✅ Component boundaries clearly defined  

### Informed Architecture
✅ PMA makes decisions with expert docs + MCP  
✅ Technology choices based on real constraints  
✅ API contracts designed early  
✅ Risks identified upfront  

### Better Development
✅ Robots receive complete, structured specs  
✅ Vertical slices from HTM feature decomposition  
✅ Integration tests planned before coding  
✅ Reduced rework in Phase 3  

### Quality Gates
✅ Phase 2B validates requirements AND architecture  
✅ Clear approval criteria  
✅ Issues caught before development  

---

## Getting Started

### New to ROME v5.0?

**Read in this order:**
1. This overview (you are here)
2. `/ROME/integration/quick-start-htm-rome.md`
3. `/HTM/HTM-Master-Workflow.md`
4. `/ROME/start-here.md`

### Migrating from v4.0?

**Read:** `/MIGRATION-GUIDE.md`

**Key changes:** Phase 1 completely different, Phase 2 expanded

---

## Robot Roles

### HTM Decomposer (NEW - Phase 1)
**Mission:** Transform PRDs into structured requirements  
**Resources:** HTM methodology  
**Outputs:** YAML artifacts  

### PMA (Phase 2)
**Mission:** Design technical architecture + implementation plan  
**Resources:** Expert docs, MCP servers  
**Outputs:** Architecture spec, data model, test plan, action list  

### Chaperone (Phase 2B)
**Mission:** Validate requirements + architecture  
**Resources:** Critical thinking  
**Outputs:** Approval or blocking issues  

### Ashok - Data Architect (Phase 3)
**Mission:** Implement database layer  
**Outputs:** Schema, migrations, seeds  

### Reena - Backend Engineer (Phase 3)
**Mission:** Implement API layer  
**Outputs:** Endpoints, business logic  

### Charlie - Frontend Engineer (Phase 3)
**Mission:** Implement UI layer  
**Outputs:** Components, pages, interactions  

### Clara - UX Designer (Optional)
**Mission:** Design user experience  
**Outputs:** Mockups, prototypes, design specs  

---

## Next Steps

- Read the complete guide: `/ROME/ROME-5.0-COMPLETE-GUIDE.md`
- Follow quick start: `/ROME/integration/quick-start-htm-rome.md`
- Review HTM workflow: `/HTM/HTM-Master-Workflow.md`
- Check integration: `/ROME/integration/htm-rome-integration-guide.md`

---

## Version History

| Version | Date | Major Changes |
|---------|------|---------------|
| 5.0 | 2025-11-06 | HTM integration, PMA architecture expansion |
| 4.0 | 2025-10-XX | 4-phase model, validation gates |
| 3.0 | 2025-10-XX | Integration-first testing |

---

**Status:** Production-ready  
**License:** [Your License]  
**Support:** [GitHub Issues/Discussions]
