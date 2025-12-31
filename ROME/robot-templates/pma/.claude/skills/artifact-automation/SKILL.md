---
name: artifact-automation
description: Automate P3 artifact creation and validation using JavaScript utilities. Use when generating data-dictionary.yaml, api-design.md, use-cases.md, or validating before GATE-P3. Saves hours of manual work.
allowed-tools: [Bash, Read, Write, Glob]
---

# Artifact Automation Skill

## Purpose

PMA's P3 automation toolkit: generate and validate P3 artifacts using JavaScript utilities. Catch design errors early, save hours of manual work.

## When to Use

- **Creating data-dictionary.yaml**: Auto-generate from AORDL requirements
- **Creating api-design.md**: Auto-generate endpoints from AORDL Intents
- **Creating use-cases.md**: Auto-generate UC-### from AORDL
- **Creating actionlist.md**: Auto-generate work breakdown from use cases
- **Before GATE-P3**: Run all validators to catch gaps

---

## Automation Strategy

### What to Automate

```yaml
High Automation (90-100%):
  - data-dictionary.yaml      # AORDL → entities/fields
  - api-design.md endpoints   # AORDL Intent → REST endpoints
  - use-cases.md structure    # AORDL → UC-### skeleton
  - test-data-spec.md         # data-dictionary → seed volumes
  - Postman collections       # api-design.md → API tests
  - actionlist.md tasks       # use-cases.md → work breakdown

Partial Automation (50-70%):
  - api-design.md details     # Generate + manual refinement
  - use-cases.md flows        # Generate structure + add details
  - test-architecture.md      # Generate coverage matrix + strategies

Manual Only (0-20%):
  - system-architecture.md    # Requires judgment, ADRs
  - dev-environment.md        # Requires sponsor decisions
  - deployment-plan.md        # Requires sponsor decisions
  - tech-stack.md             # Requires validation, ADRs
```

### Workflow Pattern

```
1. Read P2 inputs (requirements-matrix.yaml, user-stories.md)
2. Run creation utilities (generate-*)
3. Review generated artifacts (sanity check)
4. Manual refinement (add details, judgment calls)
5. Run validation utilities (validate-*)
6. Fix violations
7. Ready for GATE-P3
```

---

## Creation Utilities

**Location**: `/ROME/skills/tier-1/`

### Utility 1: generate-data-dictionary.js

**Purpose**: Generate data-dictionary.yaml from AORDL requirements

**Usage**:
```bash
node ROME/skills/tier-1/generate-data-dictionary.js \
  --requirements-directory ARTIFACTS/dev/requirements \
  --output ARTIFACTS/dev/design/data-dictionary.yaml
```

**What it generates**:
```yaml
entities:
  - name: Project
    description: Represents a project with budget, timeline, and team
    source: REQ-001, REQ-002, REQ-010

    fields:
      - name: name
        type: String
        required: true
        constraints:
          - minLength: 3
          - maxLength: 50
          - unique: true
        description: Project name, case-insensitive unique
        source: REQ-001 (AORDL Invariants)

      - name: budget
        type: Number
        required: true
        constraints:
          - min: 0
        description: Budget in cents (USD)
        source: REQ-001 (AORDL Conditions)

      - name: status
        type: String
        required: true
        constraints:
          - enum: [ACTIVE, ARCHIVED, DELETED]
        default: ACTIVE
        source: REQ-001 (AORDL Invariants)

      - name: owner
        type: Pointer<User>
        required: true
        description: Project owner (single user)
        source: REQ-001 (AORDL Postconditions)
```

**How it works**:
- Extracts entities from AORDL Actor + Intent (e.g., "ProjectManager create project" → Project entity)
- Extracts fields from AORDL Invariants, Conditions, Postconditions
- Infers types (String, Number, Boolean, Date, Pointer, Relation)
- Extracts constraints from AORDL (unique, min, max, enum)
- Maintains traceability (source: REQ-###)

**Impact**: 2-4 hours manual → 30 seconds automated

---

### Utility 2: generate-api-design.js

**Purpose**: Generate REST API endpoints from AORDL Intents

**Usage**:
```bash
node ROME/skills/tier-1/generate-api-design.js \
  --requirements-directory ARTIFACTS/dev/requirements \
  --data-dictionary ARTIFACTS/dev/design/data-dictionary.yaml \
  --output ARTIFACTS/dev/design/api-design.md
```

**What it generates**:

```markdown
## Endpoint: Create Project

**Source**: REQ-001 (AORDL Intent: "create project")

**HTTP Method**: POST
**Endpoint**: `/projects`
**Authentication**: Required (JWT)
**Authorization**: Role = ProjectManager

### Request

**Body**:
```json
{
  "name": "New Project",
  "description": "Project description",
  "budget": 10000000
}
```

**Validation** (from AORDL Conditions):
- `name`: 3-50 chars, unique (case-insensitive)
- `budget`: >= 0

### Response

**Success (201 Created)**:
```json
{
  "objectId": "PRJ-abc123",
  "name": "New Project",
  "status": "ACTIVE",
  "owner": {...}
}
```

**Error Responses** (from AORDL Errors):

**409 Conflict - Duplicate Name**:
```json
{
  "code": 409,
  "error": "ProjectNameAlreadyExists",
  "message": "A project with this name already exists. Please choose a different name.",
  "userAction": "Choose a different project name and retry"
}
```
```

**How it works**:
- Maps AORDL Intent → HTTP method + endpoint:
  - "create project" → POST /projects
  - "view dashboard" → GET /projects
  - "update project" → PUT /projects/:id
  - "delete project" → DELETE /projects/:id
- Extracts request body from data-dictionary.yaml fields
- Extracts validation from AORDL Conditions, Invariants
- Maps AORDL Errors → HTTP error codes (409, 403, 400, etc.)
- Maintains traceability (source: REQ-###)

**Impact**: 3-5 hours manual → 1 minute automated

---

### Utility 3: generate-use-cases.js

**Purpose**: Generate use case structure from AORDL requirements

**Usage**:
```bash
node ROME/skills/tier-1/generate-use-cases.js \
  --requirements-directory ARTIFACTS/dev/requirements \
  --data-dictionary ARTIFACTS/dev/design/data-dictionary.yaml \
  --output ARTIFACTS/dev/design/use-cases.md
```

**What it generates**:

```markdown
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
- Network timeout: Show retry button
- No projects found: Show empty state
- Unauthorized: Redirect to login
```

**How it works**:
- Extracts Actor, Preconditions, Postconditions from AORDL
- Generates main flow steps from AORDL Intent + Outcomes
- Maps to UI components (screen, widgets, BLoC)
- Maps to API endpoints (from api-design.md)
- Maps AORDL Errors → error handling

**Impact**: 4-6 hours manual → 2 minutes automated (+ manual flow refinement)

---

### Utility 4: generate-actionlist.js

**Purpose**: Generate work breakdown from use cases

**Usage**:
```bash
node ROME/skills/tier-1/generate-actionlist.js \
  --use-cases ARTIFACTS/dev/design/use-cases.md \
  --data-dictionary ARTIFACTS/dev/design/data-dictionary.yaml \
  --output ARTIFACTS/dev/design/actionlist.md
```

**What it generates**:

```markdown
## P5: Generation

### Feature: Project Management (UC-001 to UC-005)

#### Ashok: Data Layer

- [ ] **P5-001**: Create Project schema migration
      Priority: CRITICAL
      Estimated Effort: 2 hours
      Files: `migrations/001_create_project.js`
      Source: data-dictionary.yaml (Project entity)
      Traceability: REQ-001, REQ-002

#### Reena: API Layer

- [ ] **P5-003**: Implement POST /projects (Create Project)
      Priority: CRITICAL
      Estimated Effort: 4 hours
      Files: `cloud/functions/projects.js`
      Source: api-design.md (Create Project endpoint)
      Traceability: REQ-001 → UC-003
      Tests: Integration test (201, 409, 403)

#### Charlie: UI Layer

- [ ] **P5-005**: Implement ProjectBloc (events, states)
      Priority: CRITICAL
      Estimated Effort: 3 hours
      Files: `lib/features/project_management/bloc/`
      Source: use-cases.md (UC-001, UC-003)
      Traceability: REQ-001, REQ-002
      Tests: Unit tests (all events → states)

- [ ] **P5-006**: Implement ProjectDashboardScreen
      Priority: CRITICAL
      Estimated Effort: 6 hours
      Files: `lib/features/project_management/screens/project_list_screen.dart`
      Source: use-cases.md (UC-001)
      Traceability: REQ-002
      Tests: Widget tests (empty, loaded, error states)
```

**How it works**:
- Extracts all UC-### from use-cases.md
- Creates tasks per layer (Data, API, UI)
- Assigns to robots (Ashok, Reena, Charlie)
- Estimates effort (based on complexity heuristics)
- Extracts dependencies (migrations before API, API before UI)
- Maintains traceability (REQ→UC→Code)

**Impact**: 2-3 hours manual → 1 minute automated

---

### Utility 5: generate-postman-collection.js

**Purpose**: Generate Postman API tests from api-design.md

**Usage**:
```bash
node ROME/skills/tier-1/generate-postman-collection.js \
  --api-design ARTIFACTS/dev/design/api-design.md \
  --output docs/api/postman/projects.json
```

**What it generates**:

```json
{
  "info": {
    "name": "Project Management API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Create Project",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/projects",
        "header": [
          {"key": "Content-Type", "value": "application/json"},
          {"key": "X-Parse-Session-Token", "value": "{{session_token}}"}
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"name\": \"Test Project\", \"budget\": 10000000}"
        }
      },
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "pm.test('Status code is 201', function () {",
              "    pm.response.to.have.status(201);",
              "});",
              "pm.test('Response has objectId', function () {",
              "    var json = pm.response.json();",
              "    pm.expect(json).to.have.property('objectId');",
              "});"
            ]
          }
        }
      ]
    },
    {
      "name": "Create Project - Duplicate Name (409)",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/projects",
        "body": {
          "raw": "{\"name\": \"Test Project\", \"budget\": 10000000}"
        }
      },
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "pm.test('Status code is 409', function () {",
              "    pm.response.to.have.status(409);",
              "});",
              "pm.test('Error code matches AORDL', function () {",
              "    var json = pm.response.json();",
              "    pm.expect(json.error).to.eql('ProjectNameAlreadyExists');",
              "});"
            ]
          }
        }
      ]
    }
  ]
}
```

**How it works**:
- Parses api-design.md endpoints
- Generates happy path tests (201, 200)
- Generates error path tests (400, 401, 403, 404, 409 from AORDL Errors)
- Includes validation assertions (objectId, status, error codes)

**Impact**: 3-4 hours manual → 1 minute automated

---

## Validation Utilities

### Utility 6: validate-traceability.js

**Purpose**: Validate 100% REQ→FUNC→UC→Code traceability

**Usage**:
```bash
node ROME/skills/tier-1/validate-traceability.js \
  --requirements-directory ARTIFACTS/dev/requirements \
  --design-directory ARTIFACTS/dev/design \
  --output ARTIFACTS/dev/design/traceability-report.json
```

**What it validates**:
- ✅ Every REQ-### has FUNC-### (from requirements-matrix.yaml)
- ✅ Every FUNC-### has UC-### (from use-cases.md)
- ✅ Every UC-### has tasks in actionlist.md
- ✅ No orphaned use cases (UC without REQ)
- ✅ No orphaned tasks (task without UC)

**Output**:
```json
{
  "status": "PASS",
  "coverage": {
    "req_to_func": "25/25 (100%)",
    "func_to_uc": "25/25 (100%)",
    "uc_to_tasks": "25/25 (100%)"
  },
  "orphans": {
    "use_cases": [],
    "tasks": []
  },
  "violations": []
}
```

**GATE-P3 Blocker**: Sarah requires 100% traceability

---

### Utility 7: validate-api-design.js

**Purpose**: Validate api-design.md against AORDL and data-dictionary.yaml

**Usage**:
```bash
node ROME/skills/tier-1/validate-api-design.js \
  --api-design ARTIFACTS/dev/design/api-design.md \
  --requirements-directory ARTIFACTS/dev/requirements \
  --data-dictionary ARTIFACTS/dev/design/data-dictionary.yaml \
  --output ARTIFACTS/dev/design/api-validation-report.json
```

**What it validates**:
- ✅ Every AORDL Intent has API endpoint
- ✅ HTTP methods correct (create→POST, view→GET, update→PUT, delete→DELETE)
- ✅ Request body fields exist in data-dictionary.yaml
- ✅ Response body fields exist in data-dictionary.yaml
- ✅ All AORDL Errors have HTTP error responses (409, 403, 400, etc.)
- ✅ Error codes match AORDL (e.g., "ProjectNameAlreadyExists")
- ✅ Authentication/authorization specified

**GATE-P3 Blocker**: Missing endpoints or mismatched error codes

---

### Utility 8: validate-use-cases.js

**Purpose**: Validate use-cases.md coverage and format

**Usage**:
```bash
node ROME/skills/tier-1/validate-use-cases.js \
  --use-cases ARTIFACTS/dev/design/use-cases.md \
  --requirements-directory ARTIFACTS/dev/requirements \
  --output ARTIFACTS/dev/design/use-case-validation-report.json
```

**What it validates**:
- ✅ Every REQ-### has UC-### (100% coverage)
- ✅ UC format correct (Actor, Preconditions, Main Flow, Postconditions)
- ✅ All Preconditions from AORDL present
- ✅ All Postconditions from AORDL present
- ✅ UI components specified (for Charlie)
- ✅ API endpoints specified (for Reena)

**GATE-P3 Blocker**: Missing use cases or incomplete structure

---

### Utility 9: validate-actionlist.js

**Purpose**: Validate actionlist.md completeness

**Usage**:
```bash
node ROME/skills/tier-1/validate-actionlist.js \
  --actionlist ARTIFACTS/dev/design/actionlist.md \
  --use-cases ARTIFACTS/dev/design/use-cases.md \
  --output ARTIFACTS/dev/design/actionlist-validation-report.json
```

**What it validates**:
- ✅ Every UC-### has tasks (data layer, API layer, UI layer)
- ✅ All tasks assigned to robots
- ✅ Dependencies valid (migrations before API, API before UI)
- ✅ No circular dependencies

**GATE-P3 Blocker**: Missing tasks or invalid dependencies

---

## P3 Automation Workflow

### Step 1: Generate Artifacts

```bash
#!/bin/bash
# scripts/generate-p3-artifacts.sh

echo "=== Generating P3 Artifacts ==="

# 1. Data Dictionary
echo "Generating data-dictionary.yaml..."
node /ROME/skills/tier-1/generate-data-dictionary.js \
  --requirements-directory ARTIFACTS/dev/requirements \
  --output ARTIFACTS/dev/design/data-dictionary.yaml

# 2. API Design
echo "Generating api-design.md..."
node /ROME/skills/tier-1/generate-api-design.js \
  --requirements-directory ARTIFACTS/dev/requirements \
  --data-dictionary ARTIFACTS/dev/design/data-dictionary.yaml \
  --output ARTIFACTS/dev/design/api-design.md

# 3. Use Cases
echo "Generating use-cases.md..."
node /ROME/skills/tier-1/generate-use-cases.js \
  --requirements-directory ARTIFACTS/dev/requirements \
  --data-dictionary ARTIFACTS/dev/design/data-dictionary.yaml \
  --output ARTIFACTS/dev/design/use-cases.md

# 4. Action List
echo "Generating actionlist.md..."
node /ROME/skills/tier-1/generate-actionlist.js \
  --use-cases ARTIFACTS/dev/design/use-cases.md \
  --data-dictionary ARTIFACTS/dev/design/data-dictionary.yaml \
  --output ARTIFACTS/dev/design/actionlist.md

# 5. Postman Collection
echo "Generating Postman collection..."
node /ROME/skills/tier-1/generate-postman-collection.js \
  --api-design ARTIFACTS/dev/design/api-design.md \
  --output docs/api/postman/projects.json

echo "✅ Artifact generation complete"
```

### Step 2: Manual Refinement

```markdown
After generation, PMA reviews and refines:

1. **data-dictionary.yaml**: Add complex constraints, custom validations
2. **api-design.md**: Add authentication details, rate limiting, pagination
3. **use-cases.md**: Refine main flow steps, add alternative flows
4. **system-architecture.md**: Write ADRs (manual only)
5. **dev-environment.md**: Get sponsor approval (manual only)
6. **deployment-plan.md**: Get sponsor approval (manual only)
```

### Step 3: Validate Before GATE-P3

```bash
#!/bin/bash
# scripts/validate-p3-artifacts.sh

echo "=== Validating P3 Artifacts ==="

FAILED=0

# 1. Traceability
echo "Validating traceability..."
result=$(node /ROME/skills/tier-1/validate-traceability.js \
  --requirements-directory ARTIFACTS/dev/requirements \
  --design-directory ARTIFACTS/dev/design)

status=$(echo "$result" | grep -o '"status": "[^"]*"' | cut -d'"' -f4)
if [ "$status" != "PASS" ]; then
  echo "❌ Traceability validation FAILED"
  FAILED=$((FAILED + 1))
else
  echo "✅ Traceability validation PASSED"
fi

# 2. API Design
echo "Validating API design..."
result=$(node /ROME/skills/tier-1/validate-api-design.js \
  --api-design ARTIFACTS/dev/design/api-design.md \
  --requirements-directory ARTIFACTS/dev/requirements \
  --data-dictionary ARTIFACTS/dev/design/data-dictionary.yaml)

status=$(echo "$result" | grep -o '"status": "[^"]*"' | cut -d'"' -f4)
if [ "$status" != "PASS" ]; then
  echo "❌ API design validation FAILED"
  FAILED=$((FAILED + 1))
else
  echo "✅ API design validation PASSED"
fi

# 3. Use Cases
echo "Validating use cases..."
result=$(node /ROME/skills/tier-1/validate-use-cases.js \
  --use-cases ARTIFACTS/dev/design/use-cases.md \
  --requirements-directory ARTIFACTS/dev/requirements)

status=$(echo "$result" | grep -o '"status": "[^"]*"' | cut -d'"' -f4)
if [ "$status" != "PASS" ]; then
  echo "❌ Use case validation FAILED"
  FAILED=$((FAILED + 1))
else
  echo "✅ Use case validation PASSED"
fi

# 4. Action List
echo "Validating action list..."
result=$(node /ROME/skills/tier-1/validate-actionlist.js \
  --actionlist ARTIFACTS/dev/design/actionlist.md \
  --use-cases ARTIFACTS/dev/design/use-cases.md)

status=$(echo "$result" | grep -o '"status": "[^"]*"' | cut -d'"' -f4)
if [ "$status" != "PASS" ]; then
  echo "❌ Action list validation FAILED"
  FAILED=$((FAILED + 1))
else
  echo "✅ Action list validation PASSED"
fi

if [ $FAILED -gt 0 ]; then
  echo ""
  echo "❌ GATE-P3 BLOCKED: $FAILED validations failed"
  exit 1
else
  echo ""
  echo "✅ All validations passed - Ready for GATE-P3"
fi
```

---

## GATE-P3 Validation Checklist

**Run before requesting Sarah's GATE-P3 audit**:

- [ ] Run `scripts/generate-p3-artifacts.sh` (auto-generate artifacts)
- [ ] Manual refinement complete (ADRs, sponsor approvals, flow details)
- [ ] Run `scripts/validate-p3-artifacts.sh` (all validators pass)
- [ ] Traceability: 100% REQ→FUNC→UC→Code
- [ ] API design: All endpoints match AORDL, all errors mapped
- [ ] Use cases: 100% REQ coverage, all UC-### complete
- [ ] Action list: All UC-### have tasks, dependencies valid
- [ ] Schema validation: data-dictionary.yaml implementable
- [ ] Postman collection: API tests generated

**If all pass**: Request GATE-P3 from Sarah

**If failures**: Fix violations, re-run validators

---

## Related Skills

- `architecture-design` - Layer-specific standards for manual refinement
- `dev-environment-design` - Dev environment (manual, requires sponsor approval)
- `testing-strategy` - Test data specs (partial automation)
- `deployment-design` - Deployment plan (manual, requires sponsor approval)

---

**Skill Version**: 1.0.0
**Last Updated**: 2025-12-29
**Robot**: PMA only
**Priority**: CRITICAL
**Impact**: 10-15 hours manual work → 10 minutes automated (+ manual refinement)
