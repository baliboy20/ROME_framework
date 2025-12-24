# Phase 5 - Generation: Operations Guidelines

| Field | Value |
|-------|-------|
| **Document UID** | ROME-PHASE-006 |
| **Version** | 2.0 |
| **Date** | 2025-12-24T00:00:00Z |
| **Status** | Active |
| **Document Type** | Phase Specification |
| **Author** | Framework Analyst & Architect |
| **Changes Approved** | true |

---

## Purpose

Defines WHAT Phase 5 (Generation) must accomplish, including entry/exit criteria, required outputs, and quality gates. Robot-specific procedures (HOW) are defined in each robot's CLAUDE.md.

## Dependencies

- ROME-PRIN-001 (Core Principles) - Phase Decomposition, Modularity
- ROME-PROC-005 (Activity Logging Protocol) - Logging requirements
- ROME-PROC-006 (Quality Gate Protocol) - GATE-P5 requirements
- ROME-PHASE-005 (P4 Config) - Predecessor phase
- ROME-ROBOT-010 (Ashok) - Data Layer robot
- ROME-ROBOT-008 (Reena) - Backend Layer robot
- ROME-ROBOT-007 (Charlie) - Frontend Layer robot

---

## Phase Overview

| Attribute | Value |
|-----------|-------|
| Phase Number | P5 |
| Phase Name | Generation |
| Primary Robots | Ashok (Data), Reena (Backend), Charlie (Frontend) |
| Predecessor | P4 (Config) |
| Successor | Delivery (application complete) |
| Quality Gate | GATE-P5 (Sarah audit required) |

**Objective:** Implement the application by generating working code across all layers. The delivered application should meet all requirements defined in P2 (Analysis) and designed in P3 (Design).

**Scope:** This phase INCLUDES:
- Database schema and migrations (Ashok)
- Seed data for development/testing (Ashok)
- API/backend implementation (Reena)
- Frontend/UI implementation (Charlie)
- Tests for all layers
- Documentation

**Out of Scope:**
- Architecture changes (requires amendment back to P3)
- New requirements (requires amendment back to P2)
- Environment configuration (P4)
- Deployment to production (post-P5 delivery)

---

## Layer Responsibilities

| Layer | Robot | Responsibilities |
|-------|-------|------------------|
| Data | Ashok | Database schema, migrations, models, seed data, data tests |
| Backend | Reena | API endpoints, business logic, middleware, API tests |
| Frontend | Charlie | UI components, state management, API integration, UI tests |

### Execution Order

```
1. Ashok (Data Layer)     ← First: database must exist
2. Reena (Backend Layer)  ← Second: needs database
3. Charlie (Frontend)     ← Third: needs API
```

**Note:** Robots may work in parallel on independent features, but dependencies must be respected.

---

## Entry Criteria

Phase 5 MAY NOT begin until ALL criteria are met:

| Criterion | Verification |
|-----------|--------------|
| P4 complete | PHASE-4 status = COMPLETED |
| GATE-P4 approved | Sarah audit passed |
| AORDL requirements available | REQ-*.yaml files from P1 (for full traceability) |
| Workspaces scaffolded | All workspaces exist in SOURCE/ |
| Handover received | `phase4-handover.md` complete with AORDL traceability |
| Feature entries created | Activity log has FEAT-### entries traced to AORDL |
| Roma assignment | All P5 robots assigned |
| PHASE-5 entry created | Activity log contains PHASE-5 |

---

## Exit Criteria

Phase 5 MAY NOT complete until ALL criteria are met:

| Criterion | Verification | Blocking |
|-----------|--------------|----------|
| All features implemented | 100% of FEAT-### entries = COMPLETED | Yes |
| Database layer complete | Schema, migrations, seeds working | Yes |
| Backend layer complete | All API endpoints working | Yes |
| Frontend layer complete | All UI screens working | Yes |
| All tests passing | Unit + integration tests green | Yes |
| Documentation complete | README per workspace | Yes |
| Application runs | End-to-end flow works | Yes |
| Activity log updated | PHASE-5 status = COMPLETED | Yes |
| Roma verification | Orchestrator confirms phase complete | Yes |
| **GATE-P5 APPROVED** | Sarah audit passed (ROME-PROC-006) | Yes |

---

## Quality Gates

### Gate 1: Data Layer Complete (Ashok)

**Check:** Database is ready for backend consumption.

**Pass Criteria:**
- All migrations run successfully
- All entities from data-dictionary.yaml exist
- All relationships implemented
- Seed data loads correctly
- Database tests passing

**Failure Action:** Ashok completes data layer before Reena proceeds.

### Gate 2: Backend Layer Complete (Reena)

**Check:** API is ready for frontend consumption.

**Pass Criteria:**
- All endpoints from api-design.md implemented
- Authentication/authorization working
- Input validation on all endpoints
- Error handling consistent
- API tests passing
- Documentation complete

**Failure Action:** Reena completes backend before Charlie proceeds.

### Gate 3: Frontend Layer Complete (Charlie)

**Check:** UI implements all use cases.

**Pass Criteria:**
- All screens from use-cases.md implemented
- API integration working
- Design system applied (if Clara deliverables exist)
- Accessibility requirements met
- UI tests passing

**Failure Action:** Charlie completes frontend.

### Gate 4: Integration Complete

**Check:** All layers work together.

**Pass Criteria:**
- End-to-end user flows work
- All features functional
- No integration errors
- Performance acceptable

**Failure Action:** Identify and fix integration issues.

### Gate 5: Documentation Complete

**Check:** Application is documented for handover.

**Pass Criteria:**
- README per workspace
- Setup instructions work
- Environment variables documented
- API documentation complete

**Failure Action:** Complete missing documentation.

---

## Outputs

### Per Layer

| Layer | Robot | Outputs | Location |
|-------|-------|---------|----------|
| Data | Ashok | Migrations, models, seeds, tests | `SOURCE/[data-workspace]/` |
| Backend | Reena | Controllers, services, routes, tests | `SOURCE/[api-workspace]/` |
| Frontend | Charlie | Components, screens, tests | `SOURCE/[app-workspace]/` |

### Required Artifacts

| Artifact | Description |
|----------|-------------|
| Working database | Schema deployed, migrations run |
| Working API | All endpoints functional |
| Working UI | All screens functional |
| Test suites | Passing tests per layer |
| Documentation | README per workspace |

---

## Feature Implementation Flow

For each feature (FEAT-###):

```
1. Ashok implements data requirements
   - Create/update migrations
   - Create/update models
   - Add seed data
   - Write data tests
   - Mark FEAT-###-database COMPLETED

2. Reena implements API requirements
   - Create endpoints
   - Implement business logic
   - Write API tests
   - Mark FEAT-###-backend COMPLETED

3. Charlie implements UI requirements
   - Create screens/components
   - Integrate with API
   - Apply design system
   - Write UI tests
   - Mark FEAT-###-frontend COMPLETED

4. Feature complete when all layers done
```

---

## Coordination Requirements

### Robot Communication

| From | To | Communication |
|------|----|---------------|
| Ashok | Reena | Database models ready, query patterns |
| Reena | Charlie | API contracts, response formats |
| All | Roma | Progress updates, blockers |

### Shared Artifacts

If using TypeScript, consider shared types:

```
SOURCE/shared/
├── types/
│   ├── models.ts      # Entity types (from data-dictionary)
│   ├── api.ts         # API request/response types
│   └── index.ts
└── package.json
```

---

## Activity Logging Requirements

All robots operating in this phase MUST follow the Activity Logging Protocol:
- **ROME-PROC-005**: `/ROME/robot-templates/robot-operations-protocols/activity-logging-protocol.md`

### Phase-Specific Logging

| Event | Required Action |
|-------|-----------------|
| Phase begins | Update PHASE-5: status → IN_PROGRESS, startDate |
| Feature started | Update FEAT-###-[layer]: status → IN_PROGRESS |
| Feature complete | Update FEAT-###-[layer]: status → COMPLETED |
| Blocker encountered | Create BLOCK-### entry |
| Phase complete | Update PHASE-5: status → COMPLETED, completionDate |

### Per-Robot Logging

| Robot | Log Entries |
|-------|-------------|
| Ashok | FEAT-###-database, migrations, seed status |
| Reena | FEAT-###-backend, endpoint status |
| Charlie | FEAT-###-frontend, screen status |

---

## Traceability Requirements

### AORDL-to-Code Tracing

Complete traceability from AORDL through all phases to implementation:

| From AORDL (P1) | Through P2 | Through P3 | Through P4 | To P5 Code |
|-----------------|------------|------------|------------|------------|
| REQ-### | Feature (FUNC-###) | Use case (UC-###) | Workspace | Feature implementation |
| Actor | User role | Use case Actor | Auth config | User authentication code |
| Intent | User story capability | Use case Flow | - | API endpoint + UI screen |
| Outcomes | Acceptance criteria | Use case steps | - | Business logic + tests |
| Invariants | Data constraints | Business rules | DB constraints | Database validations |
| NonFunctional.Performance | NFR specification | Architecture | Environment sizing | Performance optimizations |
| NonFunctional.Security | NFR specification | API auth | Security config | Auth middleware + encryption |
| Errors | Error handling | API design errors | Error logging | Error handlers + user messages |

### Design-to-Code Tracing

Every design artifact MUST be traceable to code:

| From P3 | To P5 Code |
|---------|------------|
| Entity (data-dictionary.yaml) | Migration + Model (Ashok) |
| Endpoint (api-design.md) | Controller + Route (Reena) |
| Use Case (use-cases.md) | Screen + Flow (Charlie) |
| UI Requirement | Component (Charlie) |
| Business Rule | Validation logic (Ashok/Reena) |

### Test Coverage

Each implemented item MUST have corresponding tests:

| Implementation | Test Type |
|----------------|-----------|
| Database model | Data validation test |
| API endpoint | Integration test |
| Business logic | Unit test |
| UI component | Component test |
| User flow | E2E test (optional) |

---

## Blocker Handling

**Common P5 blockers:**

| Blocker Type | Responsible | Resolution |
|--------------|-------------|------------|
| Unclear requirement | Roma → PMA/Talib | Amendment to P2/P3 artifacts |
| Missing design | Roma → PMA | Amendment to P3 artifacts |
| Database issue | Ashok | Fix and notify Reena |
| API issue | Reena | Fix and notify Charlie |
| Integration issue | All robots | Coordinate via Roma |

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 0.1 | 2025-11-20T00:00:00Z | Initial phase specification placeholder |
| 1.0 | 2025-11-24T00:00:00Z | Complete phase specification with layer responsibilities, gates, coordination |
| 2.0 | 2025-12-24T00:00:00Z | **AORDL Integration (ROME-PROP-013 Phase 3 Week 1):** Updated entry criteria to reference AORDL requirements for full traceability, added AORDL-to-Code tracing table (8 mappings from P1→P2→P3→P4→P5), expanded design-to-code tracing, updated status to Active |
