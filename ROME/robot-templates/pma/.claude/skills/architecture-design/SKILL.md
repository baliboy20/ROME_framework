---
name: architecture-design
description: Layer-specific standards, patterns, and rules for P3 architectural decisions. Use when creating tech-stack.md, data-dictionary.yaml, api-design.md, use-cases.md, system-architecture.md. Ensures designs align with implementation patterns and framework constraints.
allowed-tools: [Bash, Read, Write, Glob]
---

# Architecture Design Skill

## Purpose

PMA's P3 design reference: standards, patterns, and constraints for all architectural layers. Ensures P3 deliverables are implementable, consistent, and complete for P5 robots.

## When to Use

- **Creating tech-stack.md**: Validate technology choices against framework constraints
- **Creating data-dictionary.yaml**: Apply naming conventions, type constraints, relationship patterns
- **Creating api-design.md**: Follow RESTful conventions, error formats, auth patterns
- **Creating use-cases.md**: Map AORDL to use case flows with correct structure
- **Creating system-architecture.md**: Document ADRs with layer-specific rationale
- **Creating actionlist.md**: Break down work with correct granularity and dependencies

---

## Layer 1: Data Layer Standards

### Naming Conventions

**Entities (Parse Server Classes)**:
```yaml
# ✅ Good - PascalCase, singular, business entity
Project
Task
User
TeamMember

# ❌ Bad
projects          # lowercase
Tasks             # plural
project_table     # snake_case
tbl_project       # technical prefix
```

**Fields (Parse Server Columns)**:
```yaml
# ✅ Good - camelCase, descriptive, no abbreviations
name
createdAt
projectOwner
estimatedBudget
isActive

# ❌ Bad
Name              # PascalCase
project_name      # snake_case
prj_name          # abbreviation
is_active         # snake_case
est_budget        # abbreviation
```

**Relationships**:
```yaml
# ✅ Good - Pointer/Relation field names describe relationship
Project:
  owner: Pointer<User>              # singular - one owner
  team: Relation<User>              # plural - many users
  assignedTasks: Relation<Task>     # plural - many tasks

Task:
  project: Pointer<Project>         # singular - belongs to one project
  assignee: Pointer<User>           # singular - one assignee

# ❌ Bad
Project:
  user: Pointer<User>               # ambiguous - which user?
  users: Relation<User>             # vague - team? owners?
  task: Relation<Task>              # singular for many
```

### Parse Server Type Constraints

**Supported field types**:
```yaml
String              # Text data (max 128KB)
Number              # Integers and floats
Boolean             # true/false
Date                # ISO 8601 timestamp
Object              # JSON object (nested data)
Array               # JSON array
Pointer<ClassName>  # Foreign key (one-to-one, many-to-one)
Relation<ClassName> # Join table (many-to-many)
File                # Parse File (images, PDFs, etc.)
GeoPoint            # Latitude/longitude
Polygon             # Geographic boundary
```

**Type selection rules**:
```yaml
# String length considerations
shortText: String          # < 255 chars (names, titles)
longText: String           # < 128KB (descriptions, notes)
hugeText: File             # > 128KB (store as .txt File)

# Number considerations
quantity: Number           # Integers (1, 2, 3)
amount: Number             # Decimals (19.99, 100.50)
currency: Number           # ALWAYS store as cents/smallest unit (1999, 10050)

# Date considerations
createdAt: Date            # Auto-managed by Parse
updatedAt: Date            # Auto-managed by Parse
customDate: Date           # User-defined dates

# Avoid String for structured data
status: String             # ✅ Use enum/constraint
statusObject: Object       # ❌ Don't use Object for simple values
```

### Data Dictionary Template

```yaml
# ARTIFACTS/dev/design/data-dictionary.yaml

entities:
  - name: Project
    description: Represents a project with budget, timeline, and team
    source: REQ-001, REQ-002, REQ-010  # Traceability to AORDL

    fields:
      - name: objectId
        type: String
        required: true
        description: Auto-generated unique identifier
        managed: Parse Server

      - name: name
        type: String
        required: true
        constraints:
          - minLength: 3
          - maxLength: 50
          - unique: true
          - pattern: "^[A-Za-z0-9 ]+$"
        description: Project name, case-insensitive unique
        source: REQ-001 (AORDL Invariants)

      - name: budget
        type: Number
        required: true
        constraints:
          - min: 0
          - max: 10000000
        description: Budget in cents (USD)
        source: REQ-001 (AORDL Conditions)

      - name: status
        type: String
        required: true
        constraints:
          - enum: [ACTIVE, ARCHIVED, DELETED]
        default: ACTIVE
        description: Project lifecycle status
        source: REQ-001 (AORDL Invariants)

      - name: owner
        type: Pointer<User>
        required: true
        description: Project owner (single user)
        source: REQ-001 (AORDL Postconditions)

      - name: team
        type: Relation<User>
        required: false
        description: Project team members (many users)
        source: REQ-010 (AORDL Intent)

      - name: createdAt
        type: Date
        required: true
        managed: Parse Server
        description: Auto-managed creation timestamp

      - name: updatedAt
        type: Date
        required: true
        managed: Parse Server
        description: Auto-managed update timestamp

    indexes:
      - fields: [name]
        unique: true

    permissions:
      classLevelPermissions:
        find:
          requiresAuthentication: true
        get:
          requiresAuthentication: true
        create:
          role: ProjectManager
        update:
          role: ProjectManager
        delete:
          role: Administrator
```

### Database Design Patterns

**Normalization vs Denormalization**:
```yaml
# ✅ Normalize - Separate entities with relationships
User:
  name: String
  email: String

Project:
  name: String
  owner: Pointer<User>    # Reference User, don't duplicate

# ❌ Denormalize (only if read-heavy, rare updates)
Project:
  name: String
  ownerName: String       # Duplicates User.name
  ownerEmail: String      # Duplicates User.email
  # Risk: User updates don't propagate
```

**When to denormalize** (rare):
- Read-heavy, write-rare data (e.g., cached counts)
- Performance critical (e.g., dashboard aggregates)
- Document explicitly in data-dictionary.yaml

---

## Layer 2: API Layer Standards

### RESTful API Conventions

**Resource naming**:
```yaml
# ✅ Good - Plural nouns, lowercase, hierarchical
GET    /projects                    # List all projects
GET    /projects/:id                # Get single project
POST   /projects                    # Create project
PUT    /projects/:id                # Update project (full)
PATCH  /projects/:id                # Update project (partial)
DELETE /projects/:id                # Delete project

GET    /projects/:id/tasks          # List tasks for project
POST   /projects/:id/tasks          # Create task in project
GET    /projects/:id/team           # Get project team

# ❌ Bad
GET    /getProjects                 # Verb in URL
POST   /project/create              # Verb in URL
GET    /Projects                    # Capitalized
GET    /project-list                # Hyphenated
```

**HTTP verbs → AORDL Intent mapping**:
```yaml
AORDL Intent         HTTP Method    Endpoint Pattern
----------------     -----------    ----------------
create project    →  POST           /projects
view project      →  GET            /projects/:id
view dashboard    →  GET            /projects (with filters)
update project    →  PUT/PATCH      /projects/:id
delete project    →  DELETE         /projects/:id
approve request   →  PATCH          /requests/:id (status update)
search projects   →  GET            /projects?q=...
```

### API Design Template

```markdown
# ARTIFACTS/dev/design/api-design.md

## Endpoint: Create Project

**Source**: REQ-001 (AORDL Intent: "create project")

**HTTP Method**: POST
**Endpoint**: `/projects`
**Authentication**: Required (JWT)
**Authorization**: Role = ProjectManager

### Request

**Headers**:
```json
{
  "Content-Type": "application/json",
  "X-Parse-Session-Token": "<session_token>"
}
```

**Body**:
```json
{
  "name": "New Project",
  "description": "Project description",
  "budget": 10000000,       // cents
  "startDate": "2025-01-15T00:00:00.000Z",
  "endDate": "2025-12-31T23:59:59.999Z"
}
```

**Validation** (from AORDL Conditions):
- `name`: 3-50 chars, unique (case-insensitive)
- `budget`: >= 0, <= 10000000
- `startDate` < `endDate`

### Response

**Success (201 Created)**:
```json
{
  "objectId": "PRJ-abc123",
  "name": "New Project",
  "description": "Project description",
  "budget": 10000000,
  "status": "ACTIVE",
  "owner": {
    "__type": "Pointer",
    "className": "User",
    "objectId": "user123"
  },
  "createdAt": "2025-12-29T22:00:00.000Z",
  "updatedAt": "2025-12-29T22:00:00.000Z"
}
```

**Error Responses** (from AORDL Errors):

**400 Bad Request - Validation Error**:
```json
{
  "code": 400,
  "error": "ValidationError",
  "message": "Project name must be 3-50 characters",
  "field": "name"
}
```

**409 Conflict - Duplicate Name**:
```json
{
  "code": 409,
  "error": "ProjectNameAlreadyExists",
  "message": "A project with this name already exists. Please choose a different name.",
  "userAction": "Choose a different project name and retry"
}
```

**403 Forbidden - Insufficient Permissions**:
```json
{
  "code": 403,
  "error": "InsufficientPermissions",
  "message": "You do not have permission to create projects.",
  "userAction": "Contact administrator to request ProjectManager role"
}
```

**401 Unauthorized - Not Authenticated**:
```json
{
  "code": 401,
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

### Rate Limiting

- 100 requests/minute per user
- 1000 requests/hour per user
```

### Error Response Format (Standard)

**All API errors must follow this format**:
```json
{
  "code": 400 | 401 | 403 | 404 | 409 | 422 | 500,
  "error": "ErrorCodeInCamelCase",
  "message": "Human-readable message",
  "field": "fieldName",           // Optional - for validation errors
  "userAction": "What to do next" // Optional - from AORDL Errors
}
```

---

## Layer 3: Business Logic Layer Standards

### Service Pattern (Repository + Service)

**Repository Layer** (Ashok):
```dart
// Data access only - no business logic
abstract class ProjectRepository {
  Future<Project> findById(String id);
  Future<List<Project>> findAll({Map<String, dynamic>? filters});
  Future<Project> create(Project project);
  Future<Project> update(String id, Project project);
  Future<void> delete(String id);
}
```

**Service Layer** (Reena):
```dart
// Business logic - validates AORDL Invariants/Conditions
class ProjectService {
  final ProjectRepository _repository;
  final UserRepository _userRepository;

  Future<Project> createProject({
    required String name,
    required double budget,
    required String ownerId,
  }) async {
    // AORDL Precondition: Owner exists
    final owner = await _userRepository.findById(ownerId);
    if (owner == null) {
      throw NotFoundException('Owner not found');
    }

    // AORDL Condition: Name unique (case-insensitive)
    final existing = await _repository.findByName(name);
    if (existing != null) {
      throw ConflictException('ProjectNameAlreadyExists');
    }

    // AORDL Condition: Budget non-negative
    if (budget < 0) {
      throw ValidationException('Budget must be non-negative');
    }

    // AORDL Invariant: Status defaults to ACTIVE
    final project = Project(
      name: name,
      budget: budget,
      owner: owner,
      status: ProjectStatus.ACTIVE,
    );

    // AORDL Postcondition: Project created, owner assigned
    final created = await _repository.create(project);

    // AORDL Postcondition: Audit log entry
    await _auditService.log('PROJECT_CREATED', created.id);

    return created;
  }
}
```

### State Management Pattern (BLoC)

**Principle**: All UI state changes go through BLoC events/states.

**Event naming** (from AORDL Intent):
```dart
// Pattern: <Verb><Entity>Event
abstract class ProjectEvent {}

class LoadProjectsEvent extends ProjectEvent {}       // Intent: view dashboard
class CreateProjectEvent extends ProjectEvent {       // Intent: create project
  final String name;
  final double budget;
}
class UpdateProjectEvent extends ProjectEvent {       // Intent: update project
  final String id;
  final Map<String, dynamic> updates;
}
class DeleteProjectEvent extends ProjectEvent {       // Intent: delete project
  final String id;
}
```

**State naming**:
```dart
// Pattern: <Entity><StateType>State
abstract class ProjectState {}

class ProjectInitialState extends ProjectState {}
class ProjectLoadingState extends ProjectState {}
class ProjectLoadedState extends ProjectState {
  final List<Project> projects;
}
class ProjectErrorState extends ProjectState {
  final String message;
  final String? userAction;  // From AORDL Errors
}
class ProjectSuccessState extends ProjectState {
  final Project project;
}
```

---

## Layer 4: UI Layer Standards

### Screen Organization Pattern

**Directory structure**:
```
lib/features/project_management/
├── bloc/
│   ├── project_bloc.dart
│   ├── project_event.dart
│   └── project_state.dart
├── models/
│   └── project.dart
├── repositories/
│   └── project_repository.dart
├── screens/
│   ├── project_list_screen.dart    # UC-001: View dashboard
│   ├── project_detail_screen.dart  # UC-002: View project
│   └── project_form_screen.dart    # UC-003: Create project
└── widgets/
    ├── project_card.dart
    └── project_form_fields.dart
```

### Component Naming Conventions

**Screens** (top-level routes):
```dart
// Pattern: <Entity><Purpose>Screen
class ProjectListScreen extends StatelessWidget {}     // List view
class ProjectDetailScreen extends StatelessWidget {}   // Detail view
class ProjectFormScreen extends StatelessWidget {}     // Create/Edit form
class ProjectDashboardScreen extends StatelessWidget {} // Dashboard view
```

**Widgets** (reusable components):
```dart
// Pattern: <Entity><Component>Widget or <Entity><Component>
class ProjectCard extends StatelessWidget {}           // Card component
class ProjectFormFields extends StatelessWidget {}     // Form fields
class ProjectStatusBadge extends StatelessWidget {}    // Status indicator
```

### Use Case Template

```markdown
# ARTIFACTS/dev/design/use-cases.md

## UC-001: View Project Dashboard

**Source**: REQ-002 (AORDL Actor: ProjectManager, Intent: view dashboard)

**Actor**: ProjectManager
**Preconditions** (from AORDL):
- ProjectManager is authenticated
- ProjectManager has "view_projects" permission

**Main Flow**:
1. System displays dashboard screen
2. System loads all projects where Actor is owner or team member
3. System displays projects in list/grid format
4. For each project, system shows:
   - Project name
   - Status (ACTIVE, ARCHIVED, DELETED)
   - Budget
   - Owner name
   - Team size
5. Actor can filter by status
6. Actor can search by name
7. Actor can sort by name, budget, createdAt

**Postconditions** (from AORDL):
- Dashboard displays all authorized projects
- Filters/search applied correctly

**UI Components** (for Clara/Charlie):
- Screen: `ProjectDashboardScreen`
- Widgets: `ProjectCard`, `ProjectFilterBar`, `ProjectSearchField`
- BLoC: `ProjectBloc` (LoadProjectsEvent → ProjectLoadedState)

**API Endpoint** (for Reena):
- GET `/projects?filter[owner]=:userId&filter[status]=ACTIVE`

**Error Handling** (from AORDL Errors):
- Network timeout: Show retry button with message "Network connection lost. Please retry."
- No projects found: Show empty state "You have no projects yet. Create your first project."
- Unauthorized: Redirect to login screen
```

### Navigation Patterns

**Navigation routes** (map to use cases):
```dart
// lib/routes/app_routes.dart
class AppRoutes {
  static const projectDashboard = '/projects';           // UC-001
  static const projectDetail = '/projects/:id';          // UC-002
  static const projectCreate = '/projects/create';       // UC-003
  static const projectEdit = '/projects/:id/edit';       // UC-004
}
```

---

## Cross-Cutting Concerns

### ADR (Architecture Decision Record) Template

**Every significant architectural decision must be documented**:

```markdown
# ADR-001: Use Parse Server for Backend

**Date**: 2025-12-29
**Status**: Accepted
**Deciders**: PMA, Sponsor

## Context

P2 analysis identified need for:
- User authentication and authorization
- Real-time data synchronization
- File storage (images, documents)
- Mobile + Web support
- REQ-015 requires role-based access control (RBAC)
- REQ-022 requires < 2s API response time

## Decision

Use Parse Server as backend platform.

## Rationale

**Pros**:
- Built-in authentication (supports AORDL NonFunctional.Security)
- Built-in RBAC with roles/permissions (supports REQ-015)
- Real-time queries via LiveQuery (supports REQ-022)
- File storage included (supports REQ-018 file uploads)
- Open source, self-hosted option
- Flutter SDK available (parse_server_sdk_flutter)

**Cons**:
- Learning curve for team
- Schema changes require downtime
- Query complexity limitations (no JOINs)

**Alternatives Considered**:
- Firebase: Vendor lock-in, cost scaling concerns
- Custom Node.js API: Higher development time (4-6 weeks vs 1-2 weeks)
- Supabase: Newer, less mature ecosystem

## Consequences

**Positive**:
- Faster development (2 weeks savings)
- Built-in auth reduces security risk
- Real-time updates improve UX

**Negative**:
- Team training required (1 week)
- Schema migration strategy needed
- Query optimization required for complex reports

**Mitigation**:
- Training: 1 week Parse Server deep-dive (Lucien leads)
- Migrations: Document all schema changes in ADR
- Queries: Use Cloud Code for complex queries

**Impact on Phases**:
- P4 (Config): Lucien sets up Parse Server, configures roles
- P5 (Generation): Reena implements Cloud Code, Ashok creates migrations

**Traceability**:
- REQ-015 (RBAC) → Parse Server roles/ACLs
- REQ-022 (Performance) → LiveQuery + caching
- REQ-018 (File uploads) → Parse File storage
```

### Tech Stack Selection Criteria

**Evaluate each technology against**:

1. **AORDL NonFunctional Requirements**:
   - Performance: Does it meet response time requirements?
   - Security: Does it support auth, encryption, compliance?
   - Usability: Does it support accessibility, multi-language?
   - Scalability: Does it support expected user load?

2. **P5 Implementation Feasibility**:
   - Does Charlie/Lucien/Reena have expertise?
   - Is there good documentation?
   - Is there a mature Flutter SDK?
   - Can we automate with existing utilities?

3. **Project Constraints**:
   - Budget: Licensing costs, hosting costs
   - Timeline: Learning curve, development time
   - Team: Skill gaps, training required

4. **Long-term Viability**:
   - Active community, frequent updates
   - Vendor support, SLA guarantees
   - Migration path if needed

### Traceability Pattern (REQ→FUNC→UC→Code)

**Every P3 artifact must link to AORDL**:

```yaml
# In data-dictionary.yaml
entities:
  - name: Project
    source: REQ-001, REQ-002, REQ-010  # ← AORDL traceability

# In api-design.md
## Endpoint: Create Project
**Source**: REQ-001 (AORDL Intent: "create project")  # ← AORDL traceability

# In use-cases.md
## UC-001: View Project Dashboard
**Source**: REQ-002 (AORDL Actor: ProjectManager, Intent: view dashboard)  # ← AORDL traceability

# In actionlist.md
- [ ] Implement ProjectBloc (UC-001, UC-002, UC-003)  # ← Use case traceability
      Robot: Charlie
      Files: lib/features/project_management/bloc/
```

**Validation**: Sarah's GATE-P3 checklist verifies 100% traceability.

---

## P3 Deliverable Templates

### tech-stack.md Template

```markdown
# Tech Stack

**Date**: 2025-12-29
**Phase**: P3
**Robot**: PMA

## Overview

Selected technologies for all architectural layers, validated against AORDL NonFunctional requirements and P5 implementation feasibility.

## Frontend (Charlie)

| Layer | Technology | Version | Rationale |
|-------|-----------|---------|-----------|
| Framework | Flutter | 3.16+ | Cross-platform (mobile + web), REQ-030 platform support |
| State Management | flutter_bloc | 8.1+ | BLoC pattern, testable, Charlie expertise |
| HTTP Client | dio | 5.4+ | Interceptors, retry logic, supports REQ-022 performance |
| Local Storage | hive | 2.2+ | Fast key-value store, offline mode (REQ-025) |
| UI Components | Material Design 3 | Built-in | WCAG AA compliant (REQ-035 accessibility) |

**ADRs**: ADR-002 (Flutter), ADR-003 (BLoC pattern)

## Backend (Reena)

| Layer | Technology | Version | Rationale |
|-------|-----------|---------|-----------|
| Platform | Parse Server | 6.4+ | Built-in auth, RBAC, real-time (REQ-015, REQ-022) |
| Runtime | Node.js | 20 LTS | Parse Server requirement, async I/O performance |
| Database | MongoDB | 7.0+ | Parse Server default, document model fits data structure |
| File Storage | Parse File (S3) | Built-in | Scalable file storage (REQ-018) |
| Authentication | Parse Auth | Built-in | Session tokens, RBAC (REQ-015) |

**ADRs**: ADR-001 (Parse Server), ADR-004 (MongoDB)

## Infrastructure (Lucien)

| Layer | Technology | Version | Rationale |
|-------|-----------|---------|-----------|
| Containerization | Docker | 24+ | Reproducible environments, P4 scaffolding |
| Orchestration | Docker Compose | 2.23+ | Local dev, staging deployment |
| CI/CD | GitHub Actions | Latest | Automated testing, deployment |
| Hosting (Staging) | DigitalOcean | N/A | Cost-effective, easy setup |
| Hosting (Prod) | TBD | N/A | Sponsor decision pending |

**ADRs**: ADR-005 (Docker), ADR-006 (GitHub Actions)

## Testing (All P5 Robots)

| Type | Technology | Version | Rationale |
|------|-----------|---------|-----------|
| Unit Tests | flutter_test | Built-in | Flutter default |
| Widget Tests | flutter_test | Built-in | UI component testing |
| Integration Tests | integration_test | Built-in | E2E testing |
| Mocking | mockito | 5.4+ | BLoC testing, repository mocking |
| API Tests | Postman/Newman | Latest | API contract validation |

**ADRs**: ADR-007 (Testing strategy)

## Dependencies Summary

**Total packages**: 15
**Security audit**: All packages checked (no critical vulnerabilities)
**License compliance**: All MIT or BSD (sponsor approved)

## Validation Checklist

- [x] All AORDL NonFunctional.Performance requirements met
- [x] All AORDL NonFunctional.Security requirements met
- [x] All AORDL NonFunctional.Usability requirements met
- [x] P5 robots have expertise or training plan
- [x] Sponsor approved all technology choices
- [x] ADRs documented for all major decisions
```

### actionlist.md Template

```markdown
# Action List (Work Breakdown)

**Date**: 2025-12-29
**Phase**: P4/P5
**Generated By**: PMA

## Overview

Work breakdown for P4 (Configuration) and P5 (Generation). Each action item maps to use cases (UC-###), which trace to AORDL requirements (REQ-###).

## P4: Configuration (Lucien)

### Workspace Setup

- [ ] **P4-001**: Initialize Flutter project structure
      Priority: CRITICAL
      Estimated Effort: 2 hours
      Dependencies: None
      Files: `flutter create`, `pubspec.yaml`

- [ ] **P4-002**: Configure Parse Server (Docker Compose)
      Priority: CRITICAL
      Estimated Effort: 4 hours
      Dependencies: P4-001
      Files: `docker-compose.yml`, `.env.example`
      ADR: ADR-001

- [ ] **P4-003**: Set up MongoDB (Docker Compose)
      Priority: CRITICAL
      Estimated Effort: 2 hours
      Dependencies: P4-002
      Files: `docker-compose.yml`, `mongo-init.js`
      ADR: ADR-004

### CI/CD Setup

- [ ] **P4-004**: Configure GitHub Actions (CI pipeline)
      Priority: HIGH
      Estimated Effort: 3 hours
      Dependencies: P4-001
      Files: `.github/workflows/ci.yml`
      ADR: ADR-006

## P5: Generation

### Feature: Project Management (UC-001 to UC-005)

**Priority**: CRITICAL
**Source**: REQ-001, REQ-002, REQ-003, REQ-010
**Robots**: Charlie (UI), Reena (API), Ashok (Data)

#### Ashok: Data Layer

- [ ] **P5-001**: Create Project schema migration
      Priority: CRITICAL
      Estimated Effort: 2 hours
      Files: `migrations/001_create_project.js`
      Source: data-dictionary.yaml (Project entity)
      Traceability: REQ-001, REQ-002

- [ ] **P5-002**: Create User schema migration
      Priority: CRITICAL
      Estimated Effort: 1 hour
      Files: `migrations/002_create_user.js`
      Source: data-dictionary.yaml (User entity)
      Traceability: REQ-015

#### Reena: API Layer

- [ ] **P5-003**: Implement POST /projects (Create Project)
      Priority: CRITICAL
      Estimated Effort: 4 hours
      Files: `cloud/functions/projects.js`
      Source: api-design.md (Create Project endpoint)
      Traceability: REQ-001 → UC-003
      Tests: Integration test (201 Created, 409 Conflict, 403 Forbidden)

- [ ] **P5-004**: Implement GET /projects (List Projects)
      Priority: CRITICAL
      Estimated Effort: 3 hours
      Files: `cloud/functions/projects.js`
      Source: api-design.md (List Projects endpoint)
      Traceability: REQ-002 → UC-001
      Tests: Integration test (200 OK, filters, pagination)

#### Charlie: UI Layer

- [ ] **P5-005**: Implement ProjectBloc (events, states)
      Priority: CRITICAL
      Estimated Effort: 3 hours
      Files: `lib/features/project_management/bloc/`
      Source: use-cases.md (UC-001, UC-003)
      Traceability: REQ-001, REQ-002
      Tests: Unit tests (all events → states)

- [ ] **P5-006**: Implement ProjectListScreen (Dashboard)
      Priority: CRITICAL
      Estimated Effort: 6 hours
      Files: `lib/features/project_management/screens/project_list_screen.dart`
      Source: use-cases.md (UC-001)
      Traceability: REQ-002
      Tests: Widget tests (empty state, loaded state, error state)

- [ ] **P5-007**: Implement ProjectFormScreen (Create Project)
      Priority: CRITICAL
      Estimated Effort: 8 hours
      Files: `lib/features/project_management/screens/project_form_screen.dart`
      Source: use-cases.md (UC-003)
      Traceability: REQ-001
      Tests: Widget tests (validation, submit, errors)

### Dependencies Graph

```
P4-001 (Flutter init)
  ↓
P4-002 (Parse Server) → P4-003 (MongoDB)
  ↓                        ↓
P5-001 (Migrations) ← ←  ← ←
  ↓
P5-003 (API: Create) → P5-005 (BLoC)
  ↓                        ↓
P5-004 (API: List)   → P5-006 (List Screen)
                          ↓
                     P5-007 (Form Screen)
```

### Estimation Summary

| Phase | Total Tasks | Total Hours | Priority Breakdown |
|-------|------------|-------------|-------------------|
| P4 | 4 | 11 hours | CRITICAL: 3, HIGH: 1 |
| P5 | 7 | 27 hours | CRITICAL: 7 |
| **Total** | **11** | **38 hours** | **10 CRITICAL, 1 HIGH** |
```

---

## Layer 5: Dev Environment, Testing & Deployment

**See dedicated skills for detailed standards**:

### dev-environment-design

**Purpose**: Localhost ports, folder structure, build configs, secrets management

**Outputs**: dev-environment.md

**Key Standards**:
- Port allocation (Parse Server: 1337, MongoDB: 27017, Flutter: 3000)
- Folder structure (backend/, frontend/, docker/, scripts/, ARTIFACTS/)
- Environment files (.env.development, .env.staging, .env.production)
- Secrets management (GitHub Secrets, server env vars)
- Docker configuration (docker-compose.dev.yml)

**Sponsor approval required**: Ports, secrets management approach

### testing-strategy

**Purpose**: Test pyramid, data policies, coverage, API/schema validation

**Outputs**: test-architecture.md, test-data-spec.md

**Key Standards**:
- Test pyramid (70% unit, 20% integration, 10% E2E)
- Coverage requirements (80% overall, 100% BLoC, 90% services)
- Test data policies (dev, staging, production)
- First usable functionality tests (smoke tests)
- API contract validation (Postman/Newman against api-design.md)
- Schema validation (validate-schema.js against data-dictionary.yaml)

**No sponsor approval required** (technical standards)

### deployment-design

**Purpose**: CI/CD pipeline, deployment stages, rollback, monitoring

**Outputs**: deployment-plan.md

**Key Standards**:
- Deployment stages (local, staging, production)
- Git workflow (Git Flow: main, develop, feature/*, bugfix/*)
- CI/CD pipeline (lint → test → build → deploy → verify)
- Rollback procedures (automated triggers, manual process)
- Monitoring (health checks, error tracking, APM)
- Disaster recovery (backups, restore procedures)

**Sponsor approval required**: CI/CD provider, monitoring tools, alert channels

---

## Related Skills

- `flutter-best-practices` - Flutter/Dart implementation patterns (symlinked)
- `parse-server-config` - Parse Server constraints and patterns (symlinked)
- `ui-design-patterns` - UI component patterns (symlinked)
- `dev-environment-design` - Dev environment standards
- `testing-strategy` - Testing strategy and data policies
- `deployment-design` - CI/CD and deployment standards

---

**Skill Version**: 2.0.0
**Last Updated**: 2025-12-29
**Robot**: PMA only
**Priority**: CRITICAL
**Purpose**: Ensure P3 architectural decisions align with P5 implementation constraints
