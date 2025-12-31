---
name: testing-strategy
description: Test pyramid, data policies, coverage requirements, API/schema validation tests. Use when creating test-architecture.md and test-data-spec.md. Defines first usable functionality tests and validation strategy.
allowed-tools: [Bash, Read, Write, Glob]
---

# Testing Strategy Skill

## Purpose

PMA's P3 testing standards: test pyramid, data policies, coverage, validation. Output: test-architecture.md, test-data-spec.md for P5 robots.

## When to Use

- Creating test-architecture.md (P3 deliverable)
- Creating test-data-spec.md (P3 deliverable)
- Defining test coverage requirements
- Designing API contract validation
- Designing schema validation tests

---

## Test Pyramid

### Standard Distribution

```
        /\
       /  \  E2E Tests (10%)
      /____\  - User journey tests
     /      \  - Cross-platform tests
    / Integ. \ Integration Tests (20%)
   /__________\ - API contract tests
  /            \ - Schema validation
 /     Unit     \ Unit Tests (70%)
/________________\ - BLoC, Service, Repository
                   - Widget tests
```

### Test Type Breakdown

| Test Type | Percentage | Scope | Tools |
|-----------|-----------|-------|-------|
| Unit | 70% | BLoC, Service, Repository, Utilities | flutter_test, mockito |
| Widget | Included in 70% | UI components (isolated) | flutter_test |
| Integration | 20% | API contracts, Schema, Multi-component | integration_test, Postman |
| E2E | 10% | User journeys (UC-###) | integration_test, flutter_driver |

---

## Coverage Requirements

### Minimum Coverage Targets

```yaml
Overall:
  Line coverage: ≥ 80%
  Branch coverage: ≥ 75%

Unit Tests:
  BLoC: 100%               # All events → states
  Services: 90%            # Business logic critical
  Repositories: 80%        # Data access
  Models: 70%              # Getters/setters
  Utilities: 90%           # Pure functions

Integration Tests:
  Critical paths: 100%     # AORDL CRITICAL priority
  High priority: 80%       # AORDL HIGH priority
  Medium priority: 50%     # AORDL MEDIUM priority
  Low priority: 0%         # Optional

E2E Tests:
  Happy paths: 100%        # All UC-### main flows
  Error paths: 50%         # Major error scenarios
```

### Coverage Enforcement

```yaml
# CI/CD pipeline gates
Fail build if:
  - Overall coverage < 80%
  - BLoC coverage < 100%
  - Service coverage < 90%
  - Any critical path untested
```

---

## Test Data Policies

### Development Environment

```yaml
Test Data Volume:
  - Users: 50 (10 per role)
  - Projects: 100 (various statuses)
  - Tasks: 500 (linked to projects)
  - Comments: 1000 (linked to tasks)

Characteristics:
  - Realistic but synthetic (no real PII)
  - Deterministic (same seed → same data)
  - Reset script available (scripts/reset-db.sh)
  - Seed script (npm run seed:dev)

Storage:
  - Location: backend/seeds/dev.js
  - Format: JavaScript (idempotent)
  - Version controlled: Yes
```

### Unit Test Data

```yaml
Strategy: Hardcoded fixtures
Location: test/fixtures/
Format: Dart constants

Example:
  - test/fixtures/project_fixtures.dart
  - test/fixtures/user_fixtures.dart

Characteristics:
  - Minimal data (1-5 records per entity)
  - No database required
  - Inline in test files or separate fixtures
```

### Integration Test Data

```yaml
Strategy: Test database + seeds
Database: Separate test DB (test_db)
Reset: Before each test suite

Process:
  1. Spin up test DB (docker-compose.test.yml)
  2. Run migrations
  3. Seed test data (backend/seeds/test.js)
  4. Run tests
  5. Drop test DB (cleanup)

Characteristics:
  - Isolated from dev database
  - Predictable state
  - Auto-cleanup after tests
```

### Staging Environment

```yaml
Test Data Volume:
  - Users: 1000 (production-like)
  - Projects: 5000
  - Tasks: 25000
  - Comments: 100000

Characteristics:
  - Anonymized real data (GDPR compliant)
  - Performance testing realistic
  - Seed script (npm run seed:staging)

Data Anonymization:
  - Real names → Faker.js generated names
  - Real emails → test+{id}@example.com
  - Real content → Lorem ipsum
  - Preserve data relationships
```

### Production Environment

**PROHIBITED**:
- ❌ Never use production data for testing
- ❌ Never run tests against production DB
- ❌ Never seed production with test data

---

## First Usable Functionality Tests

### Smoke Tests (Priority 1)

**Run BEFORE comprehensive test suites**:

```yaml
Auth Tests:
  - User can register
  - User can login (valid credentials)
  - User receives session token
  - User can logout
  - Invalid credentials rejected

Core Entity Tests (per entity):
  - User can create entity (REQ-###)
  - User can view entity list (empty state OK)
  - User can view entity detail
  - API returns 201 Created
  - API returns 200 OK

Critical Error Tests:
  - API returns 400 Bad Request (validation)
  - API returns 401 Unauthorized (no token)
  - API returns 403 Forbidden (wrong role)
  - API returns 404 Not Found (invalid ID)
```

**Pass criteria**: All smoke tests pass before proceeding to full test suite.

### Use Case Tests (Priority 2)

**Map every UC-### to test**:

```yaml
UC-001: View Project Dashboard
  Tests:
    - Empty state (no projects)
    - Loaded state (projects displayed)
    - Filtered state (status filter applied)
    - Search state (name search applied)
    - Error state (API failure)
    - Unauthorized state (no permission)

UC-003: Create Project
  Tests:
    - Happy path (valid data → 201 Created)
    - Validation errors (name too short → 400)
    - Duplicate name (409 Conflict)
    - Unauthorized (no token → 401)
    - Forbidden (wrong role → 403)
```

---

## API Contract Validation

### Against api-design.md

**Validate implementation matches P3 design**:

```yaml
Request Validation:
  - HTTP method correct (POST, GET, PUT, DELETE)
  - Endpoint URL correct (/projects, /projects/:id)
  - Headers required (Content-Type, X-Parse-Session-Token)
  - Request body schema matches
  - Query parameters validated

Response Validation:
  - Status code correct (200, 201, 400, 401, 403, 404, 409, 500)
  - Response body schema matches
  - Error format consistent (code, error, message, userAction)
  - Headers present (Content-Type: application/json)

AORDL Traceability:
  - Every AORDL Error → HTTP error code tested
  - Every AORDL Outcome → Success response tested
```

### Tools

```yaml
Postman Collections:
  - Location: docs/api/postman/
  - Collections per feature
  - Environment variables (dev, staging, prod)

Newman (CLI):
  - CI/CD integration
  - Command: newman run docs/api/postman/projects.json --environment dev

Dredd (Optional):
  - API blueprint testing
  - OpenAPI 3.0 validation
```

### Example Postman Test

```javascript
// POST /projects - Create Project
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Response has objectId", function () {
    var json = pm.response.json();
    pm.expect(json).to.have.property('objectId');
});

pm.test("Owner is assigned", function () {
    var json = pm.response.json();
    pm.expect(json.owner).to.have.property('objectId');
});

// Error test: 409 Conflict - Duplicate name
pm.test("Duplicate name returns 409", function () {
    pm.response.to.have.status(409);
});

pm.test("Error message matches AORDL", function () {
    var json = pm.response.json();
    pm.expect(json.error).to.eql("ProjectNameAlreadyExists");
    pm.expect(json.userAction).to.include("different name");
});
```

---

## Schema Validation Tests

### Against data-dictionary.yaml

**Validate Parse Server schema matches P3 design**:

```yaml
Entity Validation:
  - All entities exist (Project, User, Task, etc.)
  - Class names correct (PascalCase)

Field Validation:
  - All fields exist
  - Field types correct (String, Number, Pointer, Relation)
  - Required fields enforced
  - Default values applied

Constraint Validation:
  - Unique constraints enforced (name unique)
  - Min/max constraints enforced (budget >= 0)
  - Enum constraints enforced (status: ACTIVE|ARCHIVED|DELETED)
  - Pattern constraints enforced (regex validation)

Relationship Validation:
  - Pointers reference correct class
  - Relations configured correctly

Index Validation:
  - Indexes exist on specified fields
  - Unique indexes enforced
```

### Validation Script Template

```javascript
// scripts/validate-schema.js

const Parse = require('parse/node');
const yaml = require('js-yaml');
const fs = require('fs');

// Load data-dictionary.yaml
const dataDictionary = yaml.load(
  fs.readFileSync('ARTIFACTS/dev/design/data-dictionary.yaml', 'utf8')
);

async function validateSchema() {
  const errors = [];

  for (const entity of dataDictionary.entities) {
    console.log(`Validating ${entity.name}...`);

    // Check entity exists
    const schema = await Parse.Schema.get(entity.name);
    if (!schema) {
      errors.push(`Entity ${entity.name} does not exist`);
      continue;
    }

    // Check fields
    for (const field of entity.fields) {
      const parseField = schema.fields[field.name];
      if (!parseField) {
        errors.push(`${entity.name}.${field.name} does not exist`);
        continue;
      }

      // Check field type
      if (parseField.type !== field.type) {
        errors.push(
          `${entity.name}.${field.name} type mismatch: ` +
          `expected ${field.type}, got ${parseField.type}`
        );
      }

      // Check required
      if (field.required && !parseField.required) {
        errors.push(`${entity.name}.${field.name} should be required`);
      }
    }
  }

  if (errors.length > 0) {
    console.error('❌ Schema validation failed:');
    errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  } else {
    console.log('✅ Schema validation passed');
  }
}

validateSchema();
```

**Run in CI/CD**:
```bash
npm run validate:schema
# Fails build if schema doesn't match data-dictionary.yaml
```

---

## P3 Deliverable Templates

### test-architecture.md Template

```markdown
# Test Architecture

**Date**: 2025-12-29
**Phase**: P3
**Robot**: PMA

## Test Pyramid

- Unit Tests: 70% (BLoC, Services, Repositories, Widgets)
- Integration Tests: 20% (API, Schema, Multi-component)
- E2E Tests: 10% (User journeys)

## Coverage Requirements

| Component | Target | Enforcement |
|-----------|--------|-------------|
| Overall | 80% | CI/CD gate |
| BLoC | 100% | CI/CD gate |
| Services | 90% | CI/CD gate |
| Repositories | 80% | Warning only |

## Test Types

### Unit Tests (Charlie, Reena, Ashok)
- BLoC event/state tests (mockito)
- Service layer tests (mock repositories)
- Repository tests (mock Parse SDK)
- Widget tests (isolated components)

### Integration Tests (All P5 robots)
- API contract tests (Postman collections)
- Schema validation tests (validate-schema.js)
- Multi-component tests (BLoC + Service + Repository)

### E2E Tests (Charlie)
- User journey tests (UC-001 to UC-00N)
- Cross-platform tests (web + mobile)
- Smoke tests (first usable functionality)

## First Usable Functionality (Smoke Tests)

**Priority 1 - Run first**:
1. User authentication (login, logout)
2. Create first project
3. View project list
4. View project detail
5. API health check

**Pass criteria**: 100% smoke tests pass

## API Contract Validation

**Strategy**: Postman collections + Newman
**Location**: docs/api/postman/
**CI/CD**: newman run on every commit
**Validates**: api-design.md implementation

## Schema Validation

**Strategy**: Custom validation script
**Location**: scripts/validate-schema.js
**CI/CD**: npm run validate:schema on every commit
**Validates**: data-dictionary.yaml implementation

## Tools

- flutter_test: Unit + widget tests
- mockito: Mocking dependencies
- integration_test: E2E tests
- Postman/Newman: API contract tests
- Custom scripts: Schema validation
```

### test-data-spec.md Template

```markdown
# Test Data Specification

**Date**: 2025-12-29
**Phase**: P3
**Robot**: PMA

## Development Environment

**Seed script**: `npm run seed:dev`
**Reset script**: `npm run reset:dev`

**Data volume**:
- Users: 50 (10 per role: ProjectManager, TeamLead, etc.)
- Projects: 100 (50 ACTIVE, 30 ARCHIVED, 20 DELETED)
- Tasks: 500 (linked to projects)
- Comments: 1000 (linked to tasks)

**Characteristics**:
- Deterministic (same seed → same data)
- Realistic names (Faker.js)
- Valid relationships (tasks → projects, comments → tasks)
- No real PII

## Unit Test Data

**Strategy**: Hardcoded fixtures
**Location**: test/fixtures/

**Example fixture**:
```dart
// test/fixtures/project_fixtures.dart
const testProject = Project(
  objectId: 'test-project-1',
  name: 'Test Project',
  status: ProjectStatus.ACTIVE,
  budget: 10000000,
);
```

## Integration Test Data

**Database**: test_db (separate from dev)
**Seed script**: backend/seeds/test.js
**Reset**: Before each test suite (auto-cleanup)

**Data volume**:
- Minimal (10 records per entity)
- Covers edge cases (empty states, validation errors)

## Staging Environment

**Seed script**: `npm run seed:staging`

**Data volume**:
- Users: 1000
- Projects: 5000
- Tasks: 25000

**Data source**: Anonymized production data (GDPR compliant)

**Anonymization**:
- Names → Faker.js
- Emails → test+{id}@example.com
- Content → Lorem ipsum

## Production Environment

**Test data**: PROHIBITED
- Never seed production with test data
- Never run tests against production DB
```

---

## Validation Checklist

Before finalizing test deliverables:

- [ ] Test pyramid defined (70/20/10 split)
- [ ] Coverage requirements defined (80% overall, 100% BLoC)
- [ ] Test data policies defined (dev, test, staging, prod)
- [ ] First usable functionality tests identified (smoke tests)
- [ ] API contract validation strategy defined (Postman/Newman)
- [ ] Schema validation strategy defined (validate-schema.js)
- [ ] CI/CD gates defined (coverage, smoke tests, contract tests)
- [ ] Traceability: Every UC-### has E2E test
- [ ] Traceability: Every AORDL Error has API test

---

**Skill Version**: 1.0.0
**Last Updated**: 2025-12-29
**Robot**: PMA only
**Priority**: CRITICAL
**Outputs**: test-architecture.md, test-data-spec.md
