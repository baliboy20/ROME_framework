# [Project Name] - Augmented Technical Specification
**Created by**: Chaperone
**Date**: YYYY-MM-DD
**Status**: Draft/Approved
**Reviewed by**: PMA, Stakeholders

---

## Executive Summary

### Project Overview
[Brief description of what the project does]

### Scope & Objectives
[What the project aims to achieve]

### Current Specification Status
- [Gap 1: What was unclear in original spec]
- [Gap 2: What was missing]
- [Gap 3: What needs clarification]

### Key Technical Decisions
1. **Data Model**: [Brief decision]
2. **Architecture**: [Brief decision]
3. **Tech Stack**: [Brief decision]
4. **Auth Approach**: [Brief decision]
5. **Deployment**: [Brief decision]

### Risk Summary
- **High Priority**: [Major risk]
- **Medium Priority**: [Secondary risk]
- **Mitigation**: [Overview of mitigation strategies]

### Recommended Implementation Approach
[High-level strategy for execution]

---

## Data Model & Schema

### Overview
[What data the system manages]

### Core Entities

#### Entity 1: [Name]
**Purpose**: [What this entity represents]

**Attributes**:
| Attribute | Type | Constraints | Notes |
|-----------|------|-----------|-------|
| id | UUID | PRIMARY KEY | Auto-generated |
| name | VARCHAR(100) | NOT NULL, UNIQUE per [scope] | User-provided, immutable |
| description | TEXT | OPTIONAL | Markdown supported |
| status | ENUM | [draft\|active\|archived] | Defaults to draft |
| created_at | TIMESTAMP | NOT NULL | Auto-generated |
| updated_at | TIMESTAMP | NOT NULL | Auto-updated on modify |

**Validation Rules**:
- Name must be 1-100 characters
- Name must be unique within scope
- Status transitions: draft → active → archived (one-way)
- Cannot delete entity with active children

**Lifecycle**:
1. Created in `draft` status
2. Can transition to `active` when validated
3. Can be archived (logical delete)
4. Permanent deletion only if no dependencies

#### Entity 2: [Name]
[Repeat format above]

### Entity Relationships

**Diagram**:
```
[ASCII ER diagram or description]

Entity1 (1) ──── (M) Entity2
```

**Relationships**:
- Entity1 has many Entity2 (one-to-many)
- Entity2 belongs to Entity1 (many-to-one)
- [Other relationships]

### Query Patterns & Indexing

**Common Queries**:
1. Fetch all entities: `SELECT * FROM entity1 ORDER BY created_at DESC`
   - Index: `created_at` DESC
   - Expected rows: [estimate]
   - Frequency: [per request/per page load]

2. [Other critical queries]
   - Index recommendations
   - Performance targets

### Data Volume & Growth

| Metric | Current | Year 1 | Year 3 |
|--------|---------|--------|--------|
| Total Records | - | [estimate] | [estimate] |
| Daily New | - | [estimate] | [estimate] |
| Storage (GB) | - | [estimate] | [estimate] |

**Considerations**:
- Archiving/deletion strategy needed by [timeframe]
- Potential for sharding if [condition]
- Backup and recovery: [strategy]

### Original Specification Gaps
- [ ] Gap 1: [What was missing]
- [ ] Gap 2: [What needs clarification]

### Recommendations
1. [Recommendation 1]
2. [Recommendation 2]

---

## Use Cases & Workflows

### Overview
[What users do with the system]

### Use Case 1: [Name]
**Actor**: [Who performs this action]
**Frequency**: [How often, volume]
**Complexity**: [Low/Medium/High]

**Preconditions**:
- User is authenticated
- [Other conditions]

**Main Flow**:
1. User navigates to [screen]
2. System displays [content]
3. User enters [input]
4. System validates [what]
5. System creates/updates [what]
6. System returns [what]

**Success Criteria**:
- [Entity] exists in database with correct values
- User sees [confirmation]
- User is redirected to [screen]

**Failure Scenarios**:

| Condition | Error Message | Recovery |
|-----------|---------------|----------|
| Invalid input | "Name is required" | Show error, allow retry |
| Duplicate name | "Name already exists" | Show error, suggest alternatives |
| Permission denied | "You don't have access" | Redirect to home |
| Server error | "Unable to complete, try again" | Log error, offer support |

**Edge Cases**:
- What if [edge case 1]? → [Behavior]
- What if [edge case 2]? → [Behavior]

### Use Case 2: [Name]
[Repeat format above]

### User Journey Map
```
[ASCII diagram or description]

Path 1: Normal flow → Success
Path 2: Error handling → Retry → Success or Failure
Path 3: Complex workflow → Multiple steps → Success
```

### Original Specification Gaps
- [ ] Unclear: [What was unclear]
- [ ] Missing: [What was missing]
- [ ] Assumption: [What was assumed]

### Questions for Stakeholders
- [ ] Question 1: [Specific question]
  - Option A: [choice]
  - Option B: [choice]

---

## Technical Architecture

### High-Level Architecture Diagram
```
┌─────────────────────────────────────────────────┐
│                   Frontend                      │
│          (Flutter/Web Browser)                  │
└──────────────────┬──────────────────────────────┘
                   │ HTTP/REST API
┌──────────────────▼──────────────────────────────┐
│                   Backend                       │
│       (Node.js/Express or [Language])           │
└──────────────────┬──────────────────────────────┘
                   │ SQL
┌──────────────────▼──────────────────────────────┐
│               PostgreSQL Database               │
└─────────────────────────────────────────────────┘

Cache Layer:
- Client: LocalStorage / In-Memory
- Server: Redis (if needed)
```

### Authentication & Authorization

**Authentication Strategy**:
- Method: [JWT/OAuth2/Session-based/API Key]
- Token Type: [Bearer/API Key/Session]
- Expiration: [Duration]
- Refresh Strategy: [How to refresh]

**Token Structure** (if JWT):
```json
{
  "sub": "user_id",
  "name": "User Name",
  "email": "user@example.com",
  "role": "admin",
  "iat": 1234567890,
  "exp": 1234571490
}
```

**Authorization Model**:
- Type: [RBAC/ABAC/Resource-level]
- Roles: [List of roles]
- Permissions: [By role]

**Permission Matrix**:
| Resource | Guest | User | Admin |
|----------|-------|------|-------|
| View own projects | - | ✓ | ✓ |
| Create projects | - | ✓ | ✓ |
| Delete projects | - | Own only | All |
| Admin panel | - | - | ✓ |

**Security Requirements**:
- [ ] HTTPS enforcement
- [ ] CORS configuration
- [ ] Rate limiting: [requests per minute]
- [ ] CSRF protection: [strategy]
- [ ] Input validation: [approach]
- [ ] Secrets management: [approach]

### Caching Strategy

**Cache Layers**:
```
Request
  ↓
1. Client Cache (LocalStorage/In-Memory)
  ├─ Hit: Return cached
  ├─ Miss: ↓
2. Server Cache (Redis)
  ├─ Hit: Return cached
  ├─ Miss: ↓
3. Database
  └─ Fetch & Cache
```

**What to Cache**:
- [ ] User profiles (TTL: 1 hour)
- [ ] Project list (TTL: 5 minutes)
- [ ] [Other entities] (TTL: [duration])

**Cache Invalidation**:
- Event-based: Invalidate on create/update/delete
- TTL-based: Automatic expiration after [duration]
- Manual: API endpoint to clear cache

**Performance Targets**:
- Response time (cached): < 100ms
- Response time (uncached): < 500ms
- Cache hit ratio target: 70-80%

### Technology Stack

**Backend**:
- Language: [Node.js / Python / Go / Java]
- Framework: [Express / Django / Gin / Spring]
- Database: [PostgreSQL / MySQL / MongoDB]
- Cache: [Redis / Memcached / None]
- API Documentation: [OpenAPI/Swagger / GraphQL]

**Frontend**:
- Framework: [Flutter / React / Vue]
- State Management: [Riverpod / Redux / Vuex]
- HTTP Client: [Dio / Fetch / Axios]
- UI Library: [Material / Cupertino / MUI]
- Testing: [Flutter test / Jest / Cypress]

**Data Patterns**:
- Repository pattern: Yes / No
- Data source abstraction: Yes / No
- Local storage: [SQLite / Realm / Hive]
- Offline-first: Yes / No

**Architecture Patterns**:
- Clean Architecture / MVVM / BLoC
- Dependency Injection: [Service Locator / GetIt / Provider]
- Error handling: [Exceptions / Either/Result types]
- Logging: [Strategy]

### Deployment Architecture

**Environment Strategy**:
```
Local Development
      ↓
Staging (Test database)
      ↓
Production (Real database)
```

**Infrastructure**:
- Cloud Provider: [AWS / GCP / Azure]
- Container: [Docker / Kubernetes / Serverless]
- Database Hosting: [Managed / Self-hosted]
- CDN: [CloudFlare / AWS CloudFront / None]

**Scaling Strategy**:
- Load Balancing: [Strategy]
- Database Replication: [Read replicas / Failover]
- Auto-scaling: [Triggers / Thresholds]
- Rate Limiting: [Strategy]

**Monitoring & Alerting**:
- Logging: [CloudWatch / DataDog / ELK]
- Monitoring: [Metrics, uptime, errors]
- Alerting: [Thresholds, notification channels]
- Backups: [Frequency, recovery plan]

### Original Specification Gaps
- [ ] Architecture not documented
- [ ] Technology choices not justified
- [ ] Deployment strategy unclear

### Recommendations
1. [Specific recommendation with justification]
2. [Specific recommendation with justification]

---

## Testing & Quality Assurance

### Testing Strategy (ROME Integration-First Approach)

**Layer 1: Database Integration Tests**
- What: Schema creation, constraints, CRUD operations
- Tool: [Jest / Python unittest]
- Example: `INSERT INTO projects (name) → Verify constraint`
- Location: `test/integration/database/`

**Layer 2: Data Layer Integration Tests**
- What: Model methods, data persistence, relationships
- Tool: [Jest / Python unittest]
- Example: `Project.create() → Verify in database`
- Location: `test/integration/data/`

**Layer 3: API Integration Tests**
- What: Endpoint contract validation, request/response flow
- Tool: [Supertest / RestAssured]
- Example: `POST /api/projects → Verify 201 + data in DB`
- Location: `test/integration/api/`

**Layer 4: Client Data Layer Tests** (Frontend)
- What: API communication, data deserialization
- Tool: [Flutter test / Jest]
- Example: `fetchProjects() → Verify API call + parsing`
- Location: `test/integration/data_sources/`

**Layer 5: Domain Logic Tests** (Frontend)
- What: Business logic, validation, use cases
- Tool: [Flutter test / Jest]
- Example: `CreateProject.call() → Verify validation + creation`
- Location: `test/integration/domain/`

**Layer 6: UI Integration Tests** (Frontend)
- What: User workflows, state changes, error handling
- Tool: [Flutter widgetTest / Cypress / Playwright]
- Example: `User taps create → Dialog opens → Project created`
- Location: `test/integration/presentation/`

### Unit Test Priorities
**Add unit tests for**:
- [ ] Complex algorithms (calculations, formatting)
- [ ] State machines with multiple transitions
- [ ] Permission/authorization logic
- [ ] [Other complex logic]

**Don't unit test**:
- ❌ Simple CRUD operations (covered by integration tests)
- ❌ Straightforward data models
- ❌ API routes (covered by integration tests)
- ❌ Simple UI widgets

### Test Data & Fixtures
- Seeding strategy: [How test data is created]
- Cleanup strategy: [After each test]
- Realistic data volume: [For load testing]

### Performance Testing
- Target response time: [Duration]
- Throughput target: [Requests/second]
- Load test scenario: [X concurrent users]
- Stress test scenario: [3X peak load]

### Security Testing
- Input validation testing: [Approach]
- SQL injection tests: [Parameterized queries]
- Authentication/authorization tests: [Scenarios]
- CORS tests: [Allowed origins]

### Accessibility Testing
- WCAG 2.1 Level AA compliance
- Screen reader compatibility: [How tested]
- Keyboard navigation: [Testing approach]

### Original Specification Gaps
- [ ] Testing strategy not defined
- [ ] Test layers not specified
- [ ] Performance targets missing

### Recommendations
1. [Testing approach recommendation]
2. [Test automation strategy]

---

## Implementation Sequence & Dependencies

### Feature Dependency Graph
```
Auth Setup
  ├─ User Authentication
  │  ├─ User Registration
  │  └─ User Login
  └─ Authorization

Project Management
  ├─ Create Project (depends on: Auth)
  ├─ List Projects (depends on: Auth)
  └─ Delete Project (depends on: Auth)
```

### Recommended Implementation Order
1. **Phase 1**: Authentication & Database Setup
   - Create user table and auth schema
   - Implement login/register endpoints
   - Frontend auth flow
   - Status: [What needs to be done]

2. **Phase 2**: Core Features
   - Project CRUD (depends on Phase 1)
   - Task Management (depends on Phase 2)
   - Status: [What needs to be done]

3. **Phase 3**: Advanced Features
   - Caching implementation
   - Performance optimization
   - Status: [What needs to be done]

### Parallelization Strategy
- **Data Architect (Ashok)**: Complete Phase 1 schema first
- **Backend Engineer (Reena)**: Start Phase 1 API while Ashok works on Phase 2
- **Frontend Engineer (Charlie)**: Start Phase 2 UI while backend does Phase 1

### Critical Path Items
- [Item 1]: [Why critical]
- [Item 2]: [Why critical]

---

## Risk Assessment & Mitigation

### High-Risk Items
| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|-----------|
| [Risk 1] | [Impact] | [High/Med/Low] | [Plan to mitigate] |
| [Risk 2] | [Impact] | [High/Med/Low] | [Plan to mitigate] |

### Medium-Risk Items
[Similar table]

### Assumptions & Validations
| Assumption | Validation | Timeline |
|-----------|-----------|----------|
| [Assumption 1] | [How to validate] | [When] |
| [Assumption 2] | [How to validate] | [When] |

---

## Questions for Stakeholders

### Data Model
- [ ] **Question 1**: [Specific question about entities or relationships]
  - Option A: [Choice with implications]
  - Option B: [Choice with implications]
  - Other: [Custom answer]

### Architecture
- [ ] **Question 2**: [Technology choice question]
  - Option A: [Choice with justification]
  - Option B: [Choice with justification]

### Implementation
- [ ] **Question 3**: [Sequence or priority question]

---

## Appendices

### A. Glossary
- **Term 1**: [Definition]
- **Term 2**: [Definition]

### B. API Contract Examples

```
POST /api/projects
Request:
{
  "name": "My Project",
  "description": "Project description"
}

Response (201):
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "My Project",
    "description": "Project description",
    "status": "draft",
    "created_at": "2025-10-28T10:00:00Z"
  }
}

Error Response (400):
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Name is required"
  }
}
```

### C. Schema SQL

```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_project_name UNIQUE (name)
);

CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
```

### D. State Machine Diagram (if complex)

```
    ┌──────────────┐
    │    DRAFT     │
    └──────┬───────┘
           │ activate()
           ↓
    ┌──────────────┐
    │   ACTIVE     │
    └──────┬───────┘
           │ archive()
           ↓
    ┌──────────────┐
    │  ARCHIVED    │
    └──────────────┘
```

---

## Sign-Off

| Role | Name | Date | Approval |
|------|------|------|----------|
| Chaperone | [Name] | YYYY-MM-DD | ✓ |
| PMA | [Name] | YYYY-MM-DD | ✓ |
| Stakeholder | [Name] | YYYY-MM-DD | ✓ |

---

**Status**: [Draft / Approved / In Review]
**Last Updated**: YYYY-MM-DD
**Next Review**: YYYY-MM-DD
