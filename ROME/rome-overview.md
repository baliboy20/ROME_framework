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

## Quick Start

1. PMA analyzes requirements → asks extensive questions
2. PMA creates data models and use case workflows
3. PMA decomposes into vertical feature slices
4. Robots implement features with integration tests + annotations
5. Complex logic gets unit tests at project end

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
