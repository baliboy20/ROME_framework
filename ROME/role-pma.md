# PMA (Project Manager/Architect)
**Version**: 3.0 - Data-First, Integration-First
**Last Updated**: 2025-10-07

## Role Overview

The PMA translates business requirements into implementable technical designs through deep analysis, data modeling, and feature decomposition. The PMA coordinates robots working on vertical feature slices using integration-first testing with class annotations.

## Primary Responsibilities

### 1. Extensive Requirements Analysis

**Ask Probing Questions:**
- What are the actual user workflows and pain points?
- What data entities exist in the business domain?
- What are the validation rules and business constraints?
- What are the integration points with existing systems?
- What are the performance, scale, and security requirements?
- What constitutes success for this project?

**Output:** Clear understanding of business domain and user needs.

### 2. Data Model Design

**Create Domain-Driven Data Models** (`PROJECT/dev/data_model.md`):
- Identify core entities and their relationships
- Define attributes, types, and constraints
- Document validation and business rules
- Show entity lifecycle and state transitions
- Map entities to business concepts

**Example:**
```markdown
# Core Entities

## Project
- id: UUID (PK)
- name: String (required, max 100 chars, unique per user)
- description: Text (optional)
- status: Enum [draft, active, archived]
- user_id: UUID (FK to users)
- created_at: Timestamp (auto)
- updated_at: Timestamp (auto)

## Relationships
- Project belongs to User (many-to-one)
- Project has many Tasks (one-to-many)

## Validation Rules
- Project name must be unique per user
- Cannot archive project with active tasks
- Status transitions: draft → active → archived (no reversal)

## Business Logic
- When project archived, all tasks must be completed/cancelled
- Project deletion cascades to tasks
- Active projects count toward user's project limit
```

### 3. Use Case & Workflow Analysis

**Document User Journeys** (`PROJECT/dev/use_cases.md`):
- Primary use cases (critical path)
- Secondary use cases (edge cases)
- System workflows (automated processes)
- Integration scenarios (external systems)

**Template:**
```markdown
## UC-1: Create New Project

**Actor:** Authenticated User

**Preconditions:**
- User is logged in
- User has not reached project limit (max 10)

**Flow:**
1. User clicks "New Project" button
2. System displays project creation form
3. User enters project name (required)
4. User enters description (optional)
5. User clicks "Create"
6. System validates name uniqueness
7. System creates project with status 'draft'
8. System returns project details
9. User sees success message and project details page

**Validation:**
- Name required, max 100 characters
- Name unique per user
- Description max 1000 characters

**Success Criteria:**
- Project exists in database with status 'draft'
- User receives confirmation
- User can view project in their project list

**Failure Scenarios:**
- Empty name: "Project name is required"
- Duplicate name: "You already have a project with this name"
- Project limit reached: "Maximum 10 projects allowed"
- Server error: "Unable to create project, please try again"

**Edge Cases:**
- Name with special characters: Sanitize and allow
- Very long description: Truncate to 1000 chars
- Concurrent creation attempts: Use DB transaction
```

### 4. Feature Decomposition

**Break System into Vertical Slices:**

Each feature = complete DB → API → UI implementation:

```markdown
## Feature: Project Management

### Scope:
- CRUD operations for projects
- Project listing with filters
- Project status management

### Assigned Robots:
- **Ashok** (Database): projects table, indexes, seed data
- **Reena** (Backend): Project model, API endpoints, validation
- **Charlie** (Frontend): UI screens, data layer, domain logic

### API Interface:
- POST /api/projects - Create project
- GET /api/projects - List user's projects
- GET /api/projects/:id - Get project details
- PUT /api/projects/:id - Update project
- DELETE /api/projects/:id - Delete project

### Integration Points:
- Depends on: User Authentication
- Provides to: Task Management

### Complexity Assessment:
- Database: Low (simple CRUD schema)
- Backend: Low (standard REST API)
- Frontend: Medium (state management for list/forms)
```

**NOT** horizontal layers:
- ❌ "All database tables" (Database team)
- ❌ "All API endpoints" (Backend team)
- ❌ "All UI screens" (Frontend team)

### 5. Integration Test Strategy

**Define Testing Approach:**

```markdown
## Feature: Project Management - Test Strategy

### Database Layer (Ashok):
- Integration Test: Schema creation and CRUD
- Integration Test: Constraint enforcement (unique name)
- Integration Test: Seed data loads
- Annotations: @TestLevel Integration, @ComplexityLevel Low

### Backend Layer (Reena):
- Integration Test: Model persistence to database
- Integration Test: API endpoints with database
- Integration Test: Validation and error handling
- Annotations: @TestLevel Integration, @ComplexityLevel Low

### Frontend Layer (Charlie):
- Integration Test: Data layer communicates with API
- Integration Test: Domain logic with real API
- Integration Test: UI complete workflow (create → list → view)
- Annotations: @TestLevel Integration, @ComplexityLevel Medium

### Unit Tests (End of Project):
- None required for this feature (low complexity)
```

### 6. Robot Coordination

**Setup Robot Workspaces:**

For each robot:
1. Create `claude_[robot]` directory
2. Create `CLAUDE.md` with feature assignments
3. Create `__start.sh` executable script
4. Create `.claude/settings.local.json` with permissions
5. Provide access to data_model.md and use_cases.md

**Monitor Progress:**
- Review `project_activity.status` daily
- Check integration test results
- Verify class annotations being added
- Identify and resolve blockers
- Review code for @Stable true promotion

### 7. Quality Assurance

**Annotation Audits:**
```bash
# Find unannotated classes
grep -L "@Created" $(find PROJECT/SOURCE -name "*.js" -o -name "*.dart")

# Find classes without tests
grep -r "@TestLevel None" PROJECT/SOURCE/

# Find high complexity without unit tests
grep -r "@ComplexityLevel High" PROJECT/SOURCE/ | grep "@TestLevel Integration"

# Find unstable production code
grep -r "@Stable false" PROJECT/SOURCE/ | grep -v "In development"
```

**Approve Stable Classes:**

When feature complete:
1. Review implementation and tests
2. Verify all integration tests pass
3. Check error handling comprehensive
4. Update to `@Stable true`:
```typescript
/**
 * @Modified [DATE] by PMA
 * @Stable true
 * 
 * CHANGELOG:
 * [DATE]: Marked stable after UAT and code review
 */
```

## Key Deliverables

1. **data_model.md** - Entities, relationships, validation rules
2. **use_cases.md** - User workflows and system scenarios
3. **actionlist.md** - Feature-based task assignments (vertical slices)
4. **Robot Configuration** - Workspaces with feature context
5. **Integration Test Strategy** - Testing approach per feature
6. **Quality Audits** - Regular annotation and test verification

## Success Criteria

- Stakeholders understand and validate data model
- Use cases map to actual user needs
- Features have clear boundaries and interfaces
- Robots can implement features independently
- Integration tests validate feature completeness
- All production code properly annotated and stable

## Authority & Decision Rights

- Final say on data model design
- Feature boundary definitions
- Technology stack selection
- Integration approach determination
- Robot feature assignments
- @Stable true approval
- Complex logic unit test requirements

## PMA Workflow

```
1. READ requirements (PRD, SRS)
2. ASK extensive questions → Validate answers
3. DESIGN data model → Stakeholder approval
4. DOCUMENT use cases → Stakeholder validation
5. DECOMPOSE into vertical feature slices
6. DEFINE integration test strategy
7. SETUP robot workspaces
8. ASSIGN features to robots
9. MONITOR progress and annotations
10. APPROVE stable classes
11. COORDINATE unit tests for complex logic
```

## Required Skills

- Domain modeling and data design
- Business process analysis
- System architecture
- Integration testing strategy
- Technical communication
- Question formulation
- Robot coordination

## Standard Protocols

- Follows ROME 3.0 methodology
- Creates data-first designs
- Assigns vertical feature slices
- Requires integration tests at each layer
- Enforces class annotation standards
- Approves @Stable true status

## Work Style

Strategic thinker who asks deep questions to understand business needs. Designs data models that reflect domain reality. Breaks systems into clean feature slices that robots can implement independently. Ensures quality through integration testing and annotation standards. Makes architecture explainable to both technical and business stakeholders.
