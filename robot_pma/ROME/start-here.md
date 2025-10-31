# ROME Protocol - Role-Oriented Multi-Agent Execution

## Overview

**ROME** is a systematic approach to managing complex software development projects through specialized AI agents, each with clearly defined roles, responsibilities, and constraints.

## Core Principles

### 1. **R**ole Specialization
Each agent has a specific domain of expertise:
- **Database Engineer** (DB) - Schema design, migrations, indexing
- **Backend Engineer** (BE) - API endpoints, business logic, Cloud Functions
- **Frontend Engineer** (FE) - UI components, state management, user interactions
- **QA Engineer** (QA) - Testing, validation, quality assurance
- **Project Manager** (PM) - Coordination, dependency management, reporting

### 2. **O**rder of Execution
Tasks must follow strict dependency chains:
```
DATABASE → BACKEND → FRONTEND → QA
```
- DB tasks create foundation
- BE tasks build on DB schemas
- FE tasks consume BE APIs
- QA validates all layers

### 3. **M**odular Boundaries
Each agent operates within defined boundaries:
- **Read Access**: Can read entire codebase for context
- **Write Access**: Only writes to assigned domain
- **Communication**: Reports progress to PM, blocks on dependencies

### 4. **E**xplicit Contracts
All interfaces between roles are explicitly defined:
- DB → BE: Schema definitions, collection names, field types
- BE → FE: API contracts, request/response formats, error codes
- FE → QA: Component specifications, user flows, acceptance criteria

---

## ROME Workflow

### Phase 1: Planning
1. PM analyzes requirements
2. PM creates task breakdown by role
3. PM identifies dependencies
4. PM sequences execution order

### Phase 2: Execution
1. DB Agent completes all database tasks
2. BE Agent starts after DB completion
3. FE Agent starts after BE API contracts ready
4. QA Agent validates incrementally

### Phase 3: Integration
1. All components tested together
2. End-to-end flows validated
3. Performance benchmarks checked
4. Documentation finalized

### Phase 4: Delivery
1. Code review completed
2. All tests passing
3. Migration scripts ready
4. Deployment plan documented

---

## Agent Role Definitions

See individual role files for detailed specifications:

- [database-engineer.md](./database-engineer.md) - Parse Server schema design
- [backend-engineer.md](./backend-engineer.md) - Cloud Functions implementation
- [frontend-engineer.md](./frontend-engineer.md) - Flutter/Dart UI development
- [qa-engineer.md](./qa-engineer.md) - Testing and validation
- [project-manager.md](./project-manager.md) - Coordination and oversight

---

## Current Project: Order Management Refactoring

**Goal**: Refactor monolithic AdminOrder into logical submodels with full backward compatibility.

**Task Breakdown**: 70 tasks across 4 roles
- DB: 8 tasks (Schema creation, migration, indexing)
- BE: 12 tasks (Cloud Functions, helpers, ACL)
- FE: 42 tasks (Entities, models, converters, UI)
- QA: 8 tasks (Unit tests, integration tests)

**Reference Documents**:
- [IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md) - Complete task specifications
- [TodoList](../todo_list.md) - Current task status

---

## Protocol Rules

### For All Agents

1. **Never skip dependencies** - If task requires output from another role, block and request it
2. **Always validate inputs** - Check that required files/data exist before proceeding
3. **Report progress clearly** - Update task status, communicate blockers immediately
4. **Maintain contracts** - Never break existing APIs or interfaces
5. **Document decisions** - Comment complex logic, update relevant docs

### For Database Agents

- **Must** create schema files in `parse-server/cloud/schemas/`
- **Must** use Parse Server field types (String, Number, Boolean, Date, Array, Object, Pointer)
- **Must** define ACL permissions for each collection
- **Must** create indexes for frequently queried fields
- **Must** provide migration scripts for schema changes

### For Backend Agents

- **Must** implement Cloud Functions in `parse-server/cloud/functions/`
- **Must** validate all inputs with proper error messages
- **Must** use `useMasterKey: true` for admin operations
- **Must** implement backward compatibility for API changes
- **Must** handle Parse Server Pointer resolution

### For Frontend Agents

- **Must** follow Clean Architecture (entities/data/presentation)
- **Must** implement `JsonSchemaProvider` for all models
- **Must** use `Equatable` for domain entities
- **Must** create both Model (data layer) and Entity (domain layer)
- **Must** handle null safety properly

### For QA Agents

- **Must** write tests in `test/` directory mirroring `lib/` structure
- **Must** achieve >80% code coverage for new code
- **Must** test error cases and edge cases
- **Must** validate API contract adherence
- **Must** run integration tests against actual Parse Server

---

## Communication Protocol

### Agent → PM Communication

```markdown
## Progress Report
**Agent**: [DB/BE/FE/QA]
**Task**: [Task ID and description]
**Status**: [In Progress / Completed / Blocked]
**Completion**: [X/Y subtasks done]

### Completed Work
- [List of files created/modified]
- [Key decisions made]

### Blockers
- [List any dependencies blocking progress]

### Next Steps
- [What will be done next]
```

### PM → Agent Task Assignment

```markdown
## Task Assignment
**Agent**: [Role]
**Task ID**: [DB-1, BE-5, etc.]
**Priority**: [Critical / High / Medium / Low]

### Objective
[Clear description of what needs to be accomplished]

### Prerequisites
- [List of tasks that must be completed first]
- [Required files/data that must exist]

### Deliverables
- [Specific files to create/modify]
- [Expected outputs]

### Success Criteria
- [ ] [Checklist of requirements]
- [ ] [Validation steps]

### Reference Materials
- [Links to docs, examples, specifications]
```

---

## Quality Gates

### Database Phase Exit Criteria
- [ ] All schema files created and syntactically valid
- [ ] All collections have proper ACL definitions
- [ ] Indexes defined for performance-critical queries
- [ ] Migration scripts tested with sample data
- [ ] Schema documentation complete

### Backend Phase Exit Criteria
- [ ] All Cloud Functions implemented
- [ ] Input validation for all endpoints
- [ ] Error handling implemented
- [ ] Backward compatibility verified
- [ ] API documentation updated

### Frontend Phase Exit Criteria
- [ ] All entities and models created
- [ ] JsonSchemaProvider implemented
- [ ] UI components functional
- [ ] State management working
- [ ] No lint errors

### QA Phase Exit Criteria
- [ ] All unit tests passing
- [ ] Integration tests passing
- [ ] Code coverage >80%
- [ ] No critical bugs
- [ ] Performance acceptable

---

## Example Usage

### Starting DB Phase
```bash
PM: "Begin database implementation for Order Management refactoring"
   → Spawns DB Agent with tasks DB-1 through DB-8
   → DB Agent reads IMPLEMENTATION_PLAN.md
   → DB Agent creates OrderCustomers.js schema
   → DB Agent reports completion of DB-1
   → ... continues through DB-8
   → DB Agent reports all tasks complete
PM: "DB phase complete. Starting backend implementation."
```

### Handling Blockers
```bash
FE Agent: "Blocked on FE-22: Cannot implement CustomerDetailsModel.fromJson
           because BE API response format is not documented."
PM: "Assigning BE-11: Document API response formats"
   → Spawns BE Agent with documentation task
   → BE Agent creates API docs
   → BE Agent reports completion
PM: "Blocker resolved. FE Agent may proceed with FE-22."
```

---

## Success Metrics

- **Velocity**: Tasks completed per day
- **Quality**: Test pass rate, bug count
- **Efficiency**: Rework percentage, blocker frequency
- **Completeness**: Documentation coverage, code coverage

---

## Version History

- **v1.0** (2025-10-10) - Initial ROME protocol for Order Management refactoring
