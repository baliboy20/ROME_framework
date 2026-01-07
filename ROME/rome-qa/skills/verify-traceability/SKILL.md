# Verify Traceability

**ID**: verify-traceability
**Category**: Quality & Validation
**Phase**: GATE-P2, GATE-P3, GATE-P5
**Robot**: Sarah

## Purpose

Verify end-to-end traceability from AORDL requirements through design to implementation

## Inputs

Phase-dependent:
- P2: AORDL REQ-*.yaml, features, user stories, acceptance criteria
- P3: Design artifacts (data dictionary, API design, UI design)
- P5: Generated code, tests, documentation

## Outputs

- Traceability report
- Coverage metrics
- Orphaned elements report
- Missing links report

## Traceability Chains

### P2 Analysis Phase

```
AORDL REQ-###
  → FUNC-### Feature
    → User Story US-###
      → Acceptance Criteria AC-###
```

### P3 Design Phase

```
AORDL REQ-###
  → Entity in data-dictionary.yaml
  → API Endpoint in api-design.md
  → UI Screen in ui-design.md
```

### P5 Generation Phase

```
AORDL REQ-###
  → Implementation (models, controllers, views)
  → Test cases
  → Documentation
```

## Validation Checks

### 1. Forward Traceability

- Every AORDL requirement traces forward to features
- Every feature traces to user stories
- Every story traces to acceptance criteria
- Every requirement traces to design elements
- Every design element traces to implementation

### 2. Backward Traceability

- Every implementation traces back to design
- Every design element traces back to requirements
- Every acceptance criterion traces back to stories
- Every story traces back to features
- Every feature traces back to AORDL requirements

### 3. Coverage Metrics

- Requirements coverage: % of REQ-### with forward traces
- Feature coverage: % of features implemented
- Test coverage: % of requirements with test cases
- Documentation coverage: % of features documented

### 4. Orphan Detection

- Design elements without requirements
- Implementation without design
- Tests without requirements
- Features without AORDL

## Example Output

```yaml
traceability_report:
  phase: GATE-P3
  date: 2026-01-07T15:30:00Z
  validator: sarah

coverage_metrics:
  requirements_to_features: 100%
  features_to_stories: 100%
  stories_to_acceptance_criteria: 100%
  requirements_to_design: 100%
  design_to_data_dictionary: 100%
  design_to_api: 100%
  design_to_ui: 100%

forward_traceability:
  - req_id: REQ-001
    traces_to:
      - feature: FUNC-001
      - entity: User
      - api_endpoint: POST /api/users
      - ui_screen: UserRegistrationScreen
    status: COMPLETE

  - req_id: REQ-002
    traces_to:
      - feature: FUNC-002
      - entity: Task
      - api_endpoint: GET /api/tasks
      - ui_screen: TaskListScreen
    status: COMPLETE

backward_traceability:
  - api_endpoint: POST /api/users
    traces_back_to:
      - requirement: REQ-001
      - use_case: UC-001
    status: COMPLETE

orphaned_elements:
  design: []
  implementation: []
  tests: []

missing_traces:
  requirements_without_design: []
  design_without_requirements: []

validation_status: PASS
```

## Traceability Matrix Format

| REQ ID | Feature | Story | Design | API | UI | Implementation | Tests |
|--------|---------|-------|--------|-----|----|--------------| ------|
| REQ-001 | FUNC-001 | US-001 | Entity:User | POST /users | UserRegScreen | UserModel, UserController | TestUserReg |
| REQ-002 | FUNC-002 | US-002 | Entity:Task | GET /tasks | TaskListScreen | TaskModel, TaskController | TestTaskList |

## AORDL Traceability

- Maintains bidirectional traceability throughout ROME phases
- Ensures no requirements are lost or orphaned
- Validates design and implementation completeness
- Supports impact analysis for changes
