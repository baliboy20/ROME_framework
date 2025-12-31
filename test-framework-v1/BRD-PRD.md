# TaskFlow Mini - Business and Product Requirements Document

**Document UID**: TF-BRD-PRD-001
**Project Name**: TaskFlow Mini
**Project Type**: ROME Framework Validation Test
**Version**: 1.0.0
**Date**: 2025-12-29
**Status**: Approved for Development

---

## Executive Summary

TaskFlow Mini is a minimal task management application designed to validate the ROME Framework's correctness and efficiency across all phases (P1-P5). The application scope is deliberately constrained to 6-7 requirements to enable rapid completion (1-2 days) while exercising all framework features: AORDL requirements, automation utilities, multi-layer design, and code generation.

**Business Value**: Validate 50-60% time savings claim through measurable metrics
**Technical Value**: Test all automation utilities, quality gates, and traceability chain
**Deliverable**: Working application with 100% REQ→UC→Code traceability

---

## Business Objectives

### Primary Objectives

1. **Framework Validation**: Prove ROME framework enables end-to-end application delivery with automated artifact generation
2. **Time Efficiency**: Demonstrate 50-60% time savings vs manual development (baseline: 41-52 hours, target: 18-24 hours)
3. **Quality Assurance**: Achieve 100% traceability, ≥80% test coverage, 0 GATE blockers
4. **Automation Verification**: Validate all 13 utilities (9 creation, 4 validation) execute successfully

### Success Criteria

- [ ] All 7 use cases functional in production
- [ ] GATE-P1 and GATE-P3 pass with 0 blockers
- [ ] Artifact generation time < 5 minutes
- [ ] Test coverage ≥ 80% overall, 100% BLoC
- [ ] Application deployment successful

---

## Product Vision

**What**: Simple, secure task management system for personal productivity
**Who**: Individual users managing personal to-do lists, system administrators monitoring usage
**Why**: Validate ROME framework with real-world patterns (authentication, CRUD, RBAC, validation)

**Core Value Proposition**: Users can securely manage personal tasks with role-based access control

---

## User Personas

### Persona 1: TaskUser (Primary)

**Role**: Individual user
**Goals**: Create, view, update, delete personal tasks
**Permissions**: Own tasks only
**Technical proficiency**: Basic web application user

### Persona 2: TaskAdmin (Secondary)

**Role**: System administrator
**Goals**: Monitor all users' tasks for support and analytics
**Permissions**: Read-only access to all tasks
**Technical proficiency**: System administrator

---

## Functional Requirements

### FR-1: User Registration and Authentication

**Priority**: P0 (Critical)
**User Story**: As a TaskUser, I need to register and authenticate so that I can securely access my tasks

**Requirements**:
- FR-1.1: User registration with email + password
- FR-1.2: User login with email + password
- FR-1.3: Secure session management (JWT, 7-day expiration)
- FR-1.4: Password encryption (never store plaintext)

**Expected AORDL**: REQ-001 (register), REQ-002 (login)

---

### FR-2: Task Creation

**Priority**: P0 (Critical)
**User Story**: As a TaskUser, I want to create tasks so that I can track my to-do items

**Requirements**:
- FR-2.1: Create task with title (required) and description (optional)
- FR-2.2: Title length: 3-100 characters
- FR-2.3: Task owner auto-assigned to creator
- FR-2.4: Task status defaults to incomplete

**Expected AORDL**: REQ-003 (create task)

---

### FR-3: Task Viewing

**Priority**: P0 (Critical)
**User Story**: As a TaskUser, I want to view my task list so that I can see what I need to do

**Requirements**:
- FR-3.1: View list of own tasks only
- FR-3.2: Display title, description, completion status
- FR-3.3: Sort by creation date (newest first)
- FR-3.4: Empty state message when no tasks exist

**Expected AORDL**: REQ-004 (view task list)

---

### FR-4: Task Status Update

**Priority**: P0 (Critical)
**User Story**: As a TaskUser, I want to mark tasks complete/incomplete so that I can track progress

**Requirements**:
- FR-4.1: Toggle task status (complete ↔ incomplete)
- FR-4.2: Only owner can update status
- FR-4.3: Visual indicator for completed tasks

**Expected AORDL**: REQ-005 (update task status)

---

### FR-5: Task Deletion

**Priority**: P0 (Critical)
**User Story**: As a TaskUser, I want to delete tasks so that I can remove completed or unwanted items

**Requirements**:
- FR-5.1: Delete own tasks (hard delete)
- FR-5.2: Confirmation required before deletion
- FR-5.3: Permanent removal from database

**Expected AORDL**: REQ-006 (delete task)

---

### FR-6: Admin Task Monitoring

**Priority**: P1 (High)
**User Story**: As a TaskAdmin, I want to view all tasks so that I can monitor system usage and provide support

**Requirements**:
- FR-6.1: View all tasks from all users
- FR-6.2: Display task owner, title, description, status
- FR-6.3: Read-only access (no edit/delete)
- FR-6.4: Require Admin role

**Expected AORDL**: REQ-007 (admin view all tasks)

---

## Non-Functional Requirements

### NFR-1: Performance

**Priority**: P0 (Critical)

- NFR-1.1: Task list load time < 2 seconds
- NFR-1.2: Task creation response time < 1 second
- NFR-1.3: Support ≥ 100 tasks per user without degradation

---

### NFR-2: Security

**Priority**: P0 (Critical)

- NFR-2.1: Passwords encrypted (bcrypt or equivalent)
- NFR-2.2: JWT session tokens (7-day expiration)
- NFR-2.3: RBAC enforcement (User vs Admin roles)
- NFR-2.4: Authorization checks on all endpoints
- NFR-2.5: No task access across users (except Admin read-only)

---

### NFR-3: Platform Compatibility

**Priority**: P0 (Critical)

- NFR-3.1: Web browser support (Chrome, Firefox, Safari)
- NFR-3.2: Mobile-responsive design (phones + tablets)
- NFR-3.3: Desktop and mobile screen sizes

---

### NFR-4: Usability

**Priority**: P1 (High)

- NFR-4.1: Clean, simple interface
- NFR-4.2: Clear feedback for user actions
- NFR-4.3: Descriptive error messages with resolution guidance
- NFR-4.4: Empty state messaging

---

### NFR-5: Testability

**Priority**: P0 (Critical - Framework Validation)

- NFR-5.1: Test coverage ≥ 80% overall
- NFR-5.2: BLoC test coverage = 100%
- NFR-5.3: API tests via Postman collection (auto-generated)
- NFR-5.4: Schema validation tests

---

## Technical Constraints

### Stack Requirements

- **Backend**: Parse Server + MongoDB (Docker containerized)
- **Frontend**: Flutter Web
- **Authentication**: JWT sessions
- **Deployment**: Docker + GitHub Actions CI/CD

**Rationale**: These constraints test ROME framework's Parse Server and Flutter patterns

---

### Development Environment

- **Ports**: Parse Server (1337), MongoDB (27017), Flutter (3000), Dashboard (4040)
- **Dev setup time**: < 30 minutes
- **Single command startup**: `docker-compose up`

---

## Data Model

### Entity: User

**Fields**:
- `objectId`: String (Parse auto-generated)
- `username`: String (unique, 3-50 chars)
- `email`: String (unique, email format)
- `password`: String (encrypted)
- `role`: String (enum: "User", "Admin")
- `createdAt`: DateTime (Parse auto-generated)
- `updatedAt`: DateTime (Parse auto-generated)

**Constraints**:
- Email unique
- Password encrypted
- Role defaults to "User"

---

### Entity: Task

**Fields**:
- `objectId`: String (Parse auto-generated)
- `title`: String (required, 3-100 chars)
- `description`: String (optional)
- `isComplete`: Boolean (default: false)
- `owner`: Pointer<User> (required)
- `createdAt`: DateTime (Parse auto-generated)
- `updatedAt`: DateTime (Parse auto-generated)

**Constraints**:
- Title length 3-100 characters
- Owner required (auto-set to creator)

**Relationships**:
- Task.owner → User (Many-to-One)

---

## Business Rules

### BR-1: Task Ownership

- Users can only view, edit, delete their own tasks
- Admin can view all tasks (read-only)
- Task owner cannot be changed after creation

---

### BR-2: Task Validation

- Title required (3-100 characters)
- Description optional
- Duplicate titles permitted (users can have multiple tasks with same name)

---

### BR-3: Deletion Policy

- Hard delete (permanent removal)
- No soft delete / archiving
- No undo capability

---

### BR-4: Session Management

- Session expiration: 7 days
- Automatic logout after expiration
- Re-login required

---

### BR-5: Role-Based Access

- Default role: "User"
- Admin role manually assigned
- Role cannot be self-assigned

---

## API Endpoints (Expected)

**Estimated**: 7 endpoints

1. `POST /users/register` - User registration
2. `POST /users/login` - User login
3. `POST /tasks/create` - Create task
4. `GET /tasks/list` - List own tasks
5. `PUT /tasks/:id/status` - Update task status
6. `DELETE /tasks/:id` - Delete task
7. `GET /tasks/admin/all` - Admin view all tasks

**API Design**: Generated by `generate-api-design.js` utility in Phase 3

---

## Out of Scope (Version 1)

The following features are explicitly excluded:

- ❌ Task due dates
- ❌ Task priorities (high/medium/low)
- ❌ Task categories or tags
- ❌ Task sharing with other users
- ❌ Task reminders or notifications
- ❌ Recurring tasks
- ❌ Task attachments or file uploads
- ❌ Task comments or notes
- ❌ Team collaboration features
- ❌ Task templates

**Rationale**: Maintain minimal scope for rapid framework validation

---

## Open Questions (Resolved)

### OQ-1: Task Title Uniqueness

**Question**: Should task titles be case-sensitive when checking for duplicates?
**Decision**: No restriction on duplicate titles
**Resolved By**: Sponsor
**Date**: 2025-12-29

### OQ-2: Task Creation Limit

**Question**: Should there be a limit on tasks per user?
**Decision**: No limit (monitor performance if users create 1000+ tasks)
**Resolved By**: Sponsor
**Date**: 2025-12-29

### OQ-3: Deletion Strategy

**Question**: Soft delete (archive) or hard delete (permanent removal)?
**Decision**: Hard delete (permanently remove from database)
**Resolved By**: Sponsor
**Date**: 2025-12-29

### OQ-4: Admin View Filter

**Question**: Should admin view show completed and incomplete tasks, or just incomplete?
**Decision**: Show all tasks (both complete and incomplete)
**Resolved By**: Sponsor
**Date**: 2025-12-29

### OQ-5: Session Duration

**Question**: How long should user sessions last?
**Decision**: 7 days, then require re-login
**Resolved By**: Sponsor
**Date**: 2025-12-29

---

## Framework Validation Mapping

This BRD/PRD tests the following ROME framework features:

### Phase 1 (AORDL)

- **Actors**: TaskUser, TaskAdmin (specificity validation)
- **Intents**: register, login, create, view, update, delete (atomicity validation)
- **Errors**: Validation, authentication, authorization errors (AORDL Errors field)
- **OpenQuestions**: All resolved (GATE-P1 requirement)

**Utilities tested**: validate-aordl.js, transform-aordl-to-bdd.js

---

### Phase 2 (Analysis)

- **Data Dictionary**: 2 entities (User, Task), 9 fields total
- **Relationships**: Task.owner → Pointer<User>
- **Constraints**: Title length, email unique, password encryption

**Utilities tested**: generate-data-dictionary.js

---

### Phase 3 (Design)

- **API Design**: 7 endpoints, error codes, authentication
- **Use Cases**: 7 use cases (UC-001 to UC-007)
- **Traceability**: REQ-001→UC-001→Code
- **Test Strategy**: Test pyramid (70% unit, 20% integration, 10% E2E)
- **Dev Environment**: Ports, folder structure, Docker config
- **Deployment**: CI/CD pipeline, Git Flow

**Utilities tested**: 9 creation utilities, 4 validation utilities

---

### Phase 4 (Configuration)

- **Docker**: Parse Server + MongoDB containers
- **Flutter**: Project initialization
- **Scripts**: setup-dev.sh (< 30 min execution)

---

### Phase 5 (Code Generation)

- **Data Layer** (Ashok): Schema migrations, constraints
- **API Layer** (Reena): 7 Cloud Functions, Postman tests
- **UI Layer** (Charlie): BLoCs, screens, 100% BLoC coverage

---

## Success Metrics

### Time Efficiency

| Phase | Manual Estimate | With ROME | Savings |
|-------|----------------|-----------|---------|
| P1 (AORDL) | 4-6 hours | 2-3 hours | 2-3 hours |
| P2 (Analysis) | 3-4 hours | 30 min | 2.5-3.5 hours |
| P3 (Design) | 12-15 hours | 2-3 hours | 9-12 hours |
| P4 (Config) | 2-3 hours | 30 min | 1.5-2.5 hours |
| P5 (Code) | 20-24 hours | 13-17 hours | 7 hours |
| **Total** | **41-52 hours** | **18-24 hours** | **22-28 hours (50-60%)** |

---

### Quality Metrics

- [ ] GATE-P1: 0 blockers, 0 critical warnings
- [ ] GATE-P3: 0 blockers, 0 critical warnings
- [ ] Traceability: 100% REQ→UC→Code
- [ ] Test coverage: ≥ 80% overall, 100% BLoC
- [ ] API tests: 100% pass rate
- [ ] Schema validation: PASS
- [ ] All 7 use cases functional

---

### Automation Metrics

- [ ] 9 creation utilities executed successfully
- [ ] 4 validation utilities executed successfully
- [ ] Artifact generation time: < 5 minutes
- [ ] Validation time: < 2 minutes
- [ ] 0 manual errors in generated artifacts

---

## Approval

**Sponsor**: ROME Framework Team
**Approved By**: (Validation Test - Auto-Approved)
**Approval Date**: 2025-12-29
**Next Phase**: Phase 1 (AORDL) - Talib to create REQ-001 through REQ-007

---

## Revision History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | 2025-12-29 | Initial BRD/PRD for framework validation test | Archie |
