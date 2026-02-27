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

| Layer | Technology |
|-------|-----------|
| Backend API | Hono (TypeScript) on Cloudflare Workers |
| Database | Cloudflare D1 (SQLite) |
| Frontend | Flutter Web |
| Authentication | JWT (httpOnly cookie) |
| Deployment | Cloudflare Wrangler CLI + GitHub Actions CI/CD |

**Rationale**: Tests ROME framework with edge-native, serverless stack (Hono/D1/Workers) and Flutter Web frontend

---

### Development Environment

- **Backend dev**: `wrangler dev` (local Workers emulation with local D1)
- **Frontend dev**: `flutter run -d chrome`
- **Dev setup time**: < 15 minutes (no Docker required)
- **Single command startup**: `wrangler dev` (backend), `flutter run -d chrome` (frontend)

---

## Data Model

### Entity: User (D1 table: `users`)

**Fields**:
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `email`: TEXT NOT NULL UNIQUE
- `password_hash`: TEXT NOT NULL
- `role`: TEXT NOT NULL DEFAULT 'user' (enum: 'user', 'admin')
- `created_at`: TEXT NOT NULL (ISO 8601)
- `updated_at`: TEXT NOT NULL (ISO 8601)

**Constraints**:
- Email unique
- Password stored as bcrypt hash
- Role defaults to 'user'

---

### Entity: Task (D1 table: `tasks`)

**Fields**:
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `title`: TEXT NOT NULL (3-100 chars)
- `description`: TEXT (optional)
- `is_complete`: INTEGER NOT NULL DEFAULT 0 (SQLite boolean)
- `user_id`: INTEGER NOT NULL REFERENCES users(id)
- `created_at`: TEXT NOT NULL (ISO 8601)
- `updated_at`: TEXT NOT NULL (ISO 8601)

**Constraints**:
- Title length 3-100 characters
- user_id required (auto-set to authenticated user)

**Relationships**:
- tasks.user_id → users.id (Many-to-One, ON DELETE CASCADE)

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

**API Design**: Hono routes on Cloudflare Workers; generated during Phase 3 Design

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

### Phase 1 (AORDL — Talib)

- **Actors**: TaskUser, TaskAdmin (specificity validation)
- **Intents**: register, login, create, view, update, delete (atomicity validation)
- **Errors**: Validation, authentication, authorization errors (AORDL Errors field)
- **OpenQuestions**: All resolved before PHASE-1 COMPLETED

**Skills exercised**: validate-aordl, transform-aordl-to-bdd

---

### Phase 2 (Analysis — Roma + Sarah)

- **Data Model**: 2 entities (users, tasks), D1 SQLite schema
- **Relationships**: tasks.user_id → users.id
- **Constraints**: Title length, email unique, password hash
- **Tech Stack**: Hono, D1, Wrangler, Flutter Web justified
- **Quality gate**: Sarah validates ARCHITECTURE.md completeness

---

### Phase 3 (Design — Roma + Sarah)

- **API Design**: 7 Hono route handlers, error codes, JWT middleware
- **TRACEABILITY.md**: REQ-### → SPEC ref → implementation file path
- **D1 migration files**: SQL schema scaffolded
- **wrangler.toml**: D1 binding defined
- **Quality gate**: Sarah validates TRACEABILITY.md content (REQ refs + SPEC refs)

---

### Phase 4 (Configuration — Lucien)

- **wrangler.toml**: Cloudflare Workers + D1 binding config
- **D1 migrations**: `migrations/` directory with `.sql` files
- **Flutter web**: Project structure, routing, build config
- **GitHub Actions**: CI workflow for `wrangler deploy` + `flutter build web`

---

### Phase 5 (Code Generation — Charlie + parallel)

- **Backend** (Hono routes, D1 queries, JWT middleware): Charlie or assigned robot
- **Frontend** (Flutter web screens, BLoCs): Charlie
- **Tests**: API integration tests, widget tests
- **Note**: No Parse Server robot used — Reena's Parse specialisation does not apply

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

- [ ] All ROME skills executed successfully per phase
- [ ] Activity log complete — every phase has IN_PROGRESS → COMPLETED pair
- [ ] Fidelity check --quick passes at end of run
- [ ] `wrangler deploy` executes without error on generated code
- [ ] `flutter build web` executes without error on generated frontend

---

## Approval

**Sponsor**: ROME Framework Team
**Approved By**: (Validation Test - Auto-Approved)
**Approval Date**: 2025-12-29
**Next Phase**: P0 (Bootup) → P1 (Ingest) — Talib to create REQ-001 through REQ-007

---

## Revision History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | 2025-12-29 | Initial BRD/PRD for framework validation test | Archie |
| 1.1.0 | 2026-02-27 | Corrected tech stack: Parse Server + MongoDB → Hono + Cloudflare Workers + D1 (SQLite). Updated data model to SQL schema. Updated phase mapping to current robot architecture. Removed references to deprecated JS utilities. | Archie |
