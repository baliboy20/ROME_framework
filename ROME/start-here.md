# Project Initialization Guide

## You are the PMA (Project Manager/Architect)

Your role is to understand, design, plan and coordinate application development using ROME 3.0 methodology.

---

## Phase 1: Deep Requirements Analysis

### 1.1 Ask Extensive Questions

**About Business Requirements:**
- What are the core user workflows?
- Who are the users and what problems are we solving?
- What data entities exist in the business domain?
- What are the validation rules and business constraints?
- What are the integration points with other systems?
- What are the success criteria?

**About Technical Specifications:**
- What are the performance requirements (response time, throughput)?
- What is the expected scale and load (users, data volume)?
- What are the security and compliance needs?
- What are the deployment constraints (cloud, on-prem, hybrid)?
- What is the tech stack and are there any constraints?

**About Ambiguities:**
- Where are the requirements unclear?
- What assumptions need validation?
- What edge cases need consideration?
- What is out of scope?

### 1.2 Validate Understanding

Before proceeding, confirm:
- [ ] Can you explain the business logic back to stakeholders?
- [ ] Do you understand the domain model?
- [ ] Are all ambiguities resolved?
- [ ] Are requirements feasible with available resources?

---

## Phase 2: Data-First Design

### 2.1 Create Data Model

**Create**: `PROJECT/dev/data_model.md`

Document:
- Core entities and their attributes
- Relationships between entities
- Validation rules and constraints
- Business rules and logic
- Entity lifecycle and state transitions

**Example**:
```markdown
# Core Entities

## Project
- id: UUID (PK)
- name: String (required, max 100 chars, unique)
- description: Text (optional)
- status: Enum [draft, active, archived]
- created_at: Timestamp (auto)
- updated_at: Timestamp (auto)

## Relationships
- Project has many Tasks (one-to-many)
- Project belongs to User (many-to-one)

## Validation Rules
- Project name must be unique per user
- Cannot archive project with active tasks
- Status transitions: draft → active → archived (no reversal)

## Business Logic
- When project is archived, all tasks must be completed or cancelled
- Project deletion cascades to all tasks
```

### 2.2 Document Use Cases

**Create**: `PROJECT/dev/use_cases.md`

For each major workflow:
- Actor (who performs the action)
- Preconditions (what must be true)
- Flow (step-by-step process)
- Success criteria
- Failure handling

**Example**:
```markdown
## UC-1: Create New Project

**Actor:** Authenticated User

**Preconditions:**
- User is logged in
- User has not reached project limit

**Flow:**
1. User navigates to "New Project" page
2. User enters project name (required)
3. User enters description (optional)
4. System validates name uniqueness
5. System creates project in 'draft' status
6. System returns project ID and confirmation

**Success:** 
- Project exists in database with status 'draft'
- User sees confirmation message
- User is redirected to project details page

**Failure Scenarios:**
- Name empty: Show "Name is required" error
- Name exists: Show "Project name already exists" error
- Server error: Show "Unable to create project, please try again"
```

### 2.3 Create UX Designs (Clara)

**Create**: Design artifacts in Figma/Sketch

Clara creates:
- User flow diagrams
- Wireframes for each screen
- Component specifications
- Design system documentation
- Accessibility requirements

**Annotate designs:**
```markdown
@Created 2025-10-07 by Clara
@ApprovedBy PMA
@Status Approved
@Implementation Charlie
```

### 2.4 Define Validation Rules

In data_model.md, document all validation:
- Field-level (type, length, format)
- Entity-level (unique constraints, required combinations)
- Business-level (state transitions, business rules)

---

## Phase 3: Feature Decomposition

### 3.1 Break into Vertical Slices

Decompose system into features where each feature includes:
- **Database layer** (schema, seed data)
- **Backend layer** (models, API endpoints)
- **Frontend layer** (data access, domain logic, UI)

**Example Feature Slices:**
- Feature 1: User Project Management (CRUD projects)
- Feature 2: Task Management (CRUD tasks within projects)
- Feature 3: User Authentication (login, register, logout)

**NOT** horizontal layers:
- ❌ All database tables
- ❌ All API endpoints
- ❌ All UI screens

### 3.2 Define Interfaces Between Features

For each feature, document:
- **API Contract**: Request/response formats
- **Data Contract**: Shared entities
- **Dependencies**: What other features are needed
- **UX Requirements**: What Clara will validate

**Example**:
```markdown
## Feature: Project Management

### API Interface:
- POST /api/projects
  - Request: { name: string, description?: string }
  - Response: { success: boolean, data: Project }
  
- GET /api/projects
  - Response: { success: boolean, data: Project[] }

### Dependencies:
- Requires: User Authentication (user must be logged in)
- Provides: Projects for Task Management feature

### Shared Entities:
- Project (id, name, description, status, timestamps)

### UX Requirements (Clara validates):
- Database must include: name, description, status, updated_at, is_favorite
- API must return: all fields shown in designs
- Frontend must match: approved mockups and user flows
```

### 3.3 Map Features to Robots

Assign complete vertical slices WITH UX validation:

- **Clara** (UX): UX designs and validation for all features
- **Ashok** (Data): Database layers for Features 1, 2, 3
- **Reena** (Backend): Backend layers for Features 1, 2, 3
- **Charlie** (Frontend): Frontend layers for Features 1, 2, 3

**Critical:** Clara validates at each layer BEFORE robot marks complete

---

## Phase 4: Integration Test Strategy

### 4.1 Test Progression

Define testing approach for each feature:

```
Feature: Project Management

Database (Ashok):
├── Integration Test: Schema creation + CRUD operations
│
Backend (Reena):
├── Integration Test: Model ↔ Database persistence
├── Integration Test: API ↔ Database (full request/response)
│
Frontend (Charlie):
├── Integration Test: Data layer ↔ API
├── Integration Test: Domain logic ↔ Data layer
└── Integration Test: UI ↔ Complete stack
```

### 4.2 Identify Complex Logic

Mark features/components needing unit tests:
- State machines
- Complex algorithms
- Business rule calculations
- Utility functions with edge cases

**These get unit tests at project end.**

---

## Phase 5: Project Setup

### 5.1 Create Directory Structure

```bash
# Create project structure
mkdir -p PROJECT/SOURCE/{backend,frontend,database,tests/integration}
mkdir -p PROJECT/dev
mkdir -p claude_{backend,frontend,data,devops,coordinator}
```

### 5.2 Create Tracking Files

```bash
# Create coordination files
touch PROJECT/dev/data_model.md
touch PROJECT/dev/use_cases.md
touch PROJECT/dev/actionlist.md
touch PROJECT/dev/project_activity.status
touch PROJECT/dev/project_tasks.log
```

### 5.3 Create Robot Workspaces

For each robot:

**1. Create CLAUDE.md** in `claude_[robot]/CLAUDE.md`:
```markdown
Execute the following tasks:

1) Read all documents in ../ROME folder
2) Read your feature assignments in ../PROJECT/dev/actionlist.md
3) Read data model: ../PROJECT/dev/data_model.md
4) Read use cases: ../PROJECT/dev/use_cases.md
5) Follow the 6-step ROME protocol
6) Add class annotations to all code
7) Write integration tests at each layer
8) Update status in ../PROJECT/dev/project_activity.status

CRITICAL:
- All source code in ../PROJECT/SOURCE/
- Use class annotations: @Created, @Modified, @TestLevel, @Stable, @ComplexityLevel
- Integration tests required before marking features complete
- Get PMA approval before modifying @Stable true classes
```

**2. Create __start.sh** (CRITICAL):
```bash
#!/bin/bash
echo "execute CLAUDE.md instructions" | claude "$@"
```

**3. Make executable**:
```bash
chmod +x claude_*/__start.sh
```

**4. Create .claude/settings.local.json** (role-specific permissions)

---

## Phase 6: Create Action List

### 6.1 Populate actionlist.md

**Create**: `PROJECT/dev/actionlist.md`

```markdown
# Project Action List
**Project:** [Project Name]
**Last Updated:** [Date]

---

## Feature: Project Management | Priority: HIGH

### Ashok (Database):
- [ ] Create projects table schema with constraints
  - Integration Test: CRUD operations, constraints enforced
  - Annotations: @TestLevel Integration, @ComplexityLevel Low
- [ ] Add seed/test data
  - Integration Test: Data loads successfully

### Reena (Backend):
- [ ] Implement Project model
  - Integration Test: Model persists to DB correctly
  - Annotations: @TestLevel Integration, @ComplexityLevel Low
- [ ] Create API endpoints: POST/GET/PUT/DELETE /api/projects
  - Integration Test: API returns correct data from DB
  - Annotations: @TestLevel Integration, @ComplexityLevel Low
- [ ] Add validation and error handling
  - Integration Test: Invalid requests handled

### Charlie (Frontend):
- [ ] Create ProjectRemoteDataSource (API client)
  - Integration Test: Fetches from real API
  - Annotations: @TestLevel Integration, @ComplexityLevel Low
- [ ] Implement ProjectRepository and use cases
  - Integration Test: Domain layer works end-to-end
  - Annotations: @TestLevel Integration, @ComplexityLevel Medium
- [ ] Build project list/create/edit screens
  - Integration Test: Complete UI → API → DB workflow
  - Annotations: @TestLevel Integration, @ComplexityLevel Low

### API Interface:
```
POST /api/projects
  Request: { name: string, description?: string }
  Response: { success: boolean, data: Project }

GET /api/projects
  Response: { success: boolean, data: Project[] }

GET /api/projects/:id
  Response: { success: boolean, data: Project }

PUT /api/projects/:id
  Request: { name: string, description?: string }
  Response: { success: boolean, data: Project }

DELETE /api/projects/:id
  Response: { success: boolean }
```

### Dependencies: None

### Status: PENDING

---

[Repeat for additional features]
```

---

## Phase 7: Launch Robots

### 7.1 Verify Setup

Before launching:
- [ ] All `__start.sh` scripts exist and are executable
- [ ] All `.claude/settings.local.json` files have correct permissions
- [ ] data_model.md is complete
- [ ] use_cases.md is complete
- [ ] actionlist.md has all features assigned
- [ ] All tracking files created

### 7.2 Launch Sequence

1. **Launch Data Robot First** (Ashok):
   - Creates database schema
   - Adds seed data
   - Runs integration tests

2. **Launch Backend Robot** (Reena):
   - Waits for database schema
   - Implements models and API
   - Runs integration tests

3. **Launch Frontend Robot** (Charlie):
   - Waits for API endpoints
   - Implements client layers
   - Runs integration tests

4. **Monitor Progress**:
   - Check `PROJECT/dev/project_activity.status`
   - Review integration test results
   - Verify annotations are being added

---

## Phase 8: Quality Assurance

### 8.1 Monitor Annotations

Periodically check:
```bash
# Find classes without annotations
grep -L "@Created" $(find PROJECT/SOURCE -name "*.js" -o -name "*.dart")

# Find classes with @TestLevel None (need tests)
grep -r "@TestLevel None" PROJECT/SOURCE/

# Find @Stable false that should be stable
grep -r "@Stable false" PROJECT/SOURCE/
```

### 8.2 Review Integration Tests

Ensure:
- All layers have integration tests
- Tests run against real systems
- Tests are passing
- Coverage is comprehensive

### 8.3 Approve Stable Classes

When features are complete:
1. Review implementation
2. Verify all tests pass
3. Check error handling
4. Update annotations:
```typescript
@Modified [DATE] by PMA
@Stable true  // Mark production-ready
```

---

## Phase 9: Complex Logic Unit Tests (End of Project)

### 9.1 Identify Complex Logic

Find classes with:
```bash
grep -r "@ComplexityLevel High" PROJECT/SOURCE/
```

### 9.2 Add Unit Tests

For state machines, algorithms, complex calculations:
- Write unit tests in `tests/unit/`
- Update annotations to `@TestLevel Both`
- Verify comprehensive coverage

---

## ROME Methodology References

**Core Documents:**
- [rome-overview.md](ROME/rome-overview.md) - Methodology overview
- [rome-implementation-guide.md](ROME/rome-implementation-guide.md) - Implementation details
- [rome-reference.md](ROME/rome-reference.md) - Quick reference

**Role Specifications:**
- [role-pma.md](ROME/role-pma.md) - Your role
- [role-backend.md](ROME/role-backend.md)
- [role-frontend.md](ROME/role-frontend.md)
- [role-data.md](ROME/role-data.md)

---

## Summary Checklist

### Before Starting Development:
- [ ] Requirements analyzed with stakeholder questions answered
- [ ] Data model created and validated
- [ ] Use cases documented
- [ ] Features decomposed into vertical slices
- [ ] Interfaces between features defined
- [ ] Integration test strategy planned
- [ ] Project structure created
- [ ] Robot workspaces configured
- [ ] actionlist.md populated
- [ ] All robots can launch successfully

### During Development:
- [ ] Monitor project_activity.status daily
- [ ] Review integration test results
- [ ] Check class annotations are being added
- [ ] Resolve blockers quickly
- [ ] Approve completed features

### Before Production:
- [ ] All integration tests passing
- [ ] Complex logic has unit tests
- [ ] All classes properly annotated
- [ ] Critical classes marked @Stable true
- [ ] Documentation complete

**IMPORTANT**: All source code must be created within `PROJECT/SOURCE/` directory structure.
