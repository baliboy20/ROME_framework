# ROME Overview
**Version**: 3.0 - Integration-First, Data-Driven Development  
**Last Updated**: 2025-10-07

## What is ROME?

ROME (Robot Methodology) builds software using specialized AI assistants called "Robots" working on **vertical feature slices** from database to UI.

## Core Philosophy

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

## The 6-Step Protocol

Every Robot follows this for each feature:

1. **ANALYZE** - Understand use cases and data model
2. **DESIGN** - Create feature design with clear interfaces
3. **IMPLEMENT** - Build from data layer outward (with annotations)
4. **INTEGRATE** - Test integration at each layer
5. **VALIDATE** - Ensure feature completeness
6. **REPORT** - Update status with working feature

## Class Annotation System

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

## When to Use ROME

✅ **Good for**:
- Business applications with clear workflows
- Systems with defined data models
- Projects needing parallel development
- Teams using AI assistants

❌ **Not ideal for**:
- Algorithm-heavy systems
- Research/experimental projects
- Systems without clear use cases

## ROME 4.0 Execution Model: 4 Phases

ROME 4.0 operates in **4 sequential Phases** with clear handoffs:

```
PHASE 1: Specification Refinement (Chaperone)
         Input: Raw requirements
         Output: Refined specifications

         ↓ (specifications approved)

PHASE 2: Functional Design & Planning (PMA)
         Input: Refined specifications
         Output: Data model, use cases, design, action list
         Includes:
         - Step 1: Deep Requirements Analysis
         - Step 2: Data-First Design
         - Step 3: Feature Decomposition
         - Step 4: Integration Test Planning
         - Step 5: Project Setup
         - Step 6: Create Action List

         ↓ (design ready for validation)

PHASE 2B: Design Validation Gate (Chaperone Phase 2)
         Input: PMA's design artifacts
         Output: Approval (✅), Blockers (🚫), or Escalation (🚩)
         Decision: Can development proceed?

         ↓ (IF APPROVED: Design is feasible and practical)

PHASE 3: Implementation (Development Robots)
         Input: Approved design + specifications
         Output: Working features with integration tests
         Robots:
         - robot_ashok (Data): Database schema & migrations
         - robot_reena (Backend): API endpoints & business logic
         - robot_charlie (Frontend): UI & domain logic
         - robot_clara (UX): Design validation throughout
         Includes:
         - Build Layer 1 (Database)
         - Build Layer 2-3 (Backend)
         - Build Layer 4-6 (Frontend)
         - Quality Assurance & Integration Tests
         - Complex Logic Unit Tests
```

**Critical Points:**
- Phases must run sequentially (no skipping or parallel running)
- Chaperone Phase 2 is a GATE that can BLOCK Phase 3
- Phase 3 includes quality assurance and unit tests (not separate phases)
- Each phase has clear inputs, outputs, and success criteria

## Quick Start (ROME 4.0 Correct Order)

**⚠️ CRITICAL: Read [ROME-4.0-COMPLETE-GUIDE.md](ROME-4.0-COMPLETE-GUIDE.md) for the complete process**

### Phase 1: Chaperone Phase 1 (Specification Refinement) ← START HERE
- Chaperone analyzes raw requirements across 8 technical dimensions
- Asks clarifying questions and resolves ambiguities
- Produces refined, unambiguous specifications
- **Output**: specification_augmented.md ✅

### Phase 2: PMA - Phase 2, Steps 1-6 (Functional Design & Planning)
- PMA analyzes refined requirements → asks design questions
- PMA creates data models and use case workflows
- PMA decomposes into vertical feature slices
- PMA creates action list and project plan
- **Output**: data_model.md, use_cases.md, actionlist.md ✅

### Phase 3: Chaperone Phase 2 (Design Inspection)
- Chaperone validates PMA's design against refined specs
- Checks technical feasibility, schedule realism, scope clarity
- Can BLOCK design if issues found
- **Output**: design_approval.md ✅

### Phase 4: Robots Implement (with validated specs and approved design)
- Robots implement features with integration tests + annotations
- Complex logic gets unit tests at project end
- **Output**: Working application 🎉

**Key Insight**: Chaperone Phase 1 must come FIRST, before PMA begins design.

## Project Structure
```
PROJECT/
├── SOURCE/
│   ├── backend/
│   ├── frontend/
│   ├── database/
│   └── tests/integration/  # Integration tests only
├── PROJECT/dev/
│   ├── data_model.md       # Data entities and relationships
│   ├── use_cases.md        # User workflows
│   ├── actionlist.md       # Feature assignments
│   └── project_activity.status
└── claude_*/
```

## Key Benefits

- **Faster**: No redundant test overhead (50-70% less test code)
- **Clearer**: Data models and use cases drive design
- **Safer**: Integration tests catch real issues
- **Traceable**: Class annotations show maturity and ownership
- **Satisfying**: Robots deliver working features, not layers

## Next Steps

- Read [rome-implementation-guide.md](rome-implementation-guide.md) for integration testing approach
- Review [role-pma.md](role-pma.md) for PMA analysis process
- Check [rome-reference.md](rome-reference.md) for protocols and annotations
