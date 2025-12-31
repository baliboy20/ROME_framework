# TaskFlow Mini - ROME Framework Test Project

**Project Type**: Framework Validation Test
**Version**: 1.0.0
**Date**: 2025-12-29
**Status**: Ready for P1 (AORDL)

---

## Purpose

This is a **test project** designed to validate the ROME framework's correctness and efficiency end-to-end. It uses a minimal but comprehensive scope to exercise all phases, robots, skills, and automation utilities.

**Why TaskFlow Mini?**
- ✅ Small scope (6-7 requirements) → Fast completion (1-2 days)
- ✅ Comprehensive coverage → Tests all ROME features
- ✅ Real-world patterns → Authentication, CRUD, RBAC, validation
- ✅ Measurable outcomes → Time savings, artifact quality, automation success

---

## Project Scope

**Application**: Simple task management system

**Core Features**:
1. User registration and authentication
2. Create personal tasks (title + description)
3. View task list (own tasks only)
4. Mark tasks complete/incomplete
5. Delete tasks
6. Admin view (all users' tasks)

**Technical Stack** (from P3 design):
- Backend: Parse Server + MongoDB
- Frontend: Flutter (web)
- Authentication: JWT sessions
- Deployment: Docker + GitHub Actions

---

## Framework Features Being Tested

### Phase 1: AORDL (Talib)

**Skills Tested**:
- `aordl-validation` - AORDL creation and validation

**Utilities Tested**:
- `validate-aordl.js` - Automated validation
- `transform-aordl-to-bdd.js` - BDD scenario generation

**Validation Criteria**:
- [ ] 6-7 REQ-###.yaml files created
- [ ] All 13 AORDL fields present (ID, Actor, Intent, Preconditions, etc.)
- [ ] No anti-patterns (no "User", "click", "manage")
- [ ] All Intents atomic (single verb + object)
- [ ] All Actors specific (TaskUser, TaskAdmin, not "User", "Admin")
- [ ] All OpenQuestions RESOLVED
- [ ] validate-aordl.js: 100% PASS
- [ ] BDD scenarios generated (7 .feature files)
- [ ] GATE-P1: Sarah approves with 0 blockers

**Expected Requirements**:
1. REQ-001: TaskUser register account
2. REQ-002: TaskUser login
3. REQ-003: TaskUser create task
4. REQ-004: TaskUser view task list
5. REQ-005: TaskUser update task status
6. REQ-006: TaskUser delete task
7. REQ-007: TaskAdmin view all tasks

---

### Phase 2: Analysis (Talib)

**Utilities Tested**:
- `generate-data-dictionary.js` - Data model extraction

**Validation Criteria**:
- [ ] data-dictionary.yaml generated
- [ ] 2 entities (User, Task)
- [ ] 9 fields total
- [ ] Constraints extracted (title 3-100 chars, email unique)
- [ ] Relationships defined (Task.owner → Pointer<User>)
- [ ] API spec generated (7 endpoints)

**Expected Entities**:
- **User**: username, email, password, role
- **Task**: title, description, isComplete, owner, createdAt, updatedAt

---

### Phase 3: Design (PMA)

**Skills Tested**:
- `architecture-design` - Layer-specific standards
- `dev-environment-design` - Dev setup standards
- `testing-strategy` - Test pyramid and data policies
- `deployment-design` - CI/CD and deployment standards
- `artifact-automation` - Artifact creation and validation

**Utilities Tested**:
- `generate-data-dictionary.js`
- `generate-api-design.js`
- `generate-use-cases.js`
- `generate-actionlist.js`
- `generate-postman-collection.js`
- `validate-traceability.js`
- `validate-api-design.js`
- `validate-use-cases.js`
- `validate-actionlist.js`

**Validation Criteria**:
- [ ] All 11 P3 artifacts generated
- [ ] Artifact generation time < 5 minutes
- [ ] validate-traceability.js: 100% REQ→UC→Code
- [ ] validate-api-design.js: All AORDL Errors mapped to HTTP codes
- [ ] validate-use-cases.js: 100% REQ coverage (7/7)
- [ ] validate-actionlist.js: All UC have tasks
- [ ] GATE-P3: Sarah approves with 0 blockers

**Expected Artifacts**:
1. tech-stack.md
2. data-dictionary.yaml
3. api-design.md (7 endpoints)
4. use-cases.md (UC-001 to UC-007)
5. system-architecture.md
6. dev-environment.md
7. test-architecture.md
8. test-data-spec.md
9. deployment-plan.md
10. actionlist.md (30-40 tasks)
11. phase3-handover.md

---

### Phase 4: Configuration (Lucien)

**Validation Criteria**:
- [ ] Flutter project initialized
- [ ] Parse Server configured (docker-compose.dev.yml)
- [ ] MongoDB configured
- [ ] .env.development created (from .env.example)
- [ ] GitHub Actions workflow created
- [ ] scripts/setup-dev.sh runs successfully
- [ ] docker-compose up: Parse Server + MongoDB running
- [ ] Parse Dashboard accessible (localhost:4040)
- [ ] Time to setup < 30 minutes

---

### Phase 5: Code Generation

#### Ashok: Data Layer

**Validation Criteria**:
- [ ] 2 schema migrations (User, Task)
- [ ] Parse Dashboard shows correct schema
- [ ] Constraints enforced (title length, email unique)
- [ ] Relationships work (Task.owner)
- [ ] Time < 1 hour

#### Reena: API Layer

**Validation Criteria**:
- [ ] 7 Cloud Functions implemented
- [ ] Postman collection (auto-generated) tests: 100% pass
- [ ] npm run validate:schema: PASS
- [ ] Authentication works (JWT sessions)
- [ ] Authorization works (User vs Admin)
- [ ] Error responses match AORDL (409, 403, 400)
- [ ] Time: 4-6 hours

#### Charlie: UI Layer

**Validation Criteria**:
- [ ] 2 BLoCs (AuthBloc, TaskBloc)
- [ ] 3 screens (LoginScreen, TaskListScreen, TaskFormScreen)
- [ ] flutter test: All tests pass
- [ ] flutter analyze: 0 errors
- [ ] BLoC coverage: 100%
- [ ] Overall coverage: ≥ 80%
- [ ] All UC-001 to UC-007 functional
- [ ] Time: 8-10 hours

---

## Success Metrics

### Time Efficiency

| Phase | Manual Estimate | With ROME Framework | Savings |
|-------|----------------|---------------------|---------|
| P1 (AORDL) | 4-6 hours | 2-3 hours (automation) | 2-3 hours |
| P2 (Analysis) | 3-4 hours | 30 min (automation) | 2.5-3.5 hours |
| P3 (Design) | 12-15 hours | 2-3 hours (automation + refinement) | 9-12 hours |
| P4 (Config) | 2-3 hours | 30 min (templates) | 1.5-2.5 hours |
| P5 (Code) | 20-24 hours | 13-17 hours (automation + manual) | 7 hours |
| **Total** | **41-52 hours** | **18-24 hours** | **22-28 hours (50-60% savings)** |

### Quality Metrics

- [ ] GATE-P1: 0 blockers, 0 critical warnings
- [ ] GATE-P3: 0 blockers, 0 critical warnings
- [ ] Traceability: 100% REQ→UC→Code
- [ ] Test coverage: ≥ 80% overall, 100% BLoC
- [ ] API tests: 100% pass
- [ ] Schema validation: PASS
- [ ] All 7 use cases functional

### Automation Metrics

- [ ] 9 creation utilities executed successfully
- [ ] 4 validation utilities executed successfully
- [ ] Artifact generation time: < 5 minutes
- [ ] Validation time: < 2 minutes
- [ ] 0 manual errors in generated artifacts

---

## Folder Structure

```
test-framework-v1/
├── README.md                           # This file
├── BRD-PRD.md                          # Business and Product Requirements
├── VALIDATION-RESULTS.md               # Test results and metrics
│
├── _user_input/                        # Raw user materials (P0 input)
│   └── raw-requirements/
│       └── taskflow-requirements.txt
│
├── ARTIFACTS/                          # ROME artifacts generated through phases
│   ├── activity-log.txt                # Activity log
│   ├── 01-ingest/
│   │   └── source-materials/
│   │       └── document-catalog.md
│   ├── dev/
│   │   ├── requirements/               # P1 outputs
│   │   │   ├── REQ-001.yaml
│   │   │   ├── REQ-002.yaml
│   │   │   ├── ...
│   │   │   ├── requirements-catalog.md
│   │   │   └── requirements-index.json
│   │   ├── analysis/                   # P2 outputs
│   │   │   ├── data-dictionary.yaml
│   │   │   ├── api-spec.yaml
│   │   │   └── phase2-handover.md
│   │   └── design/                     # P3 outputs
│   │       ├── tech-stack.md
│   │       ├── data-dictionary.yaml
│   │       ├── api-design.md
│   │       ├── use-cases.md
│   │       ├── system-architecture.md
│   │       ├── dev-environment.md
│   │       ├── test-architecture.md
│   │       ├── test-data-spec.md
│   │       ├── deployment-plan.md
│   │       ├── actionlist.md
│   │       └── phase3-handover.md
│   ├── 02-analysis/                    # P2 intermediate outputs
│   ├── 03-bdd-features/                # BDD scenarios from P1
│   │   ├── REQ-001.feature
│   │   └── ...
│   └── 04-test-scenarios/              # Test scenarios
│
├── backend/                            # P5: Parse Server (Reena, Ashok)
│   ├── cloud/
│   │   └── functions/
│   ├── migrations/
│   └── package.json
│
├── frontend/                           # P5: Flutter (Charlie)
│   ├── lib/
│   │   ├── features/
│   │   └── main.dart
│   └── test/
│
├── docker/                             # P4: Docker configs (Lucien)
│   ├── docker-compose.dev.yml
│   └── Dockerfile.backend
│
├── scripts/                            # P4: Automation scripts (Lucien)
│   ├── setup-dev.sh
│   └── validate-p3-artifacts.sh
│
└── docs/                               # Documentation
    └── api/
        └── postman/
            └── taskflow.json
```

---

## How to Run This Test

### Prerequisites

- ROME framework installed
- All robot skills configured
- All utilities in ROME/skills/tier-1/ available

### Step 1: Phase 1 (AORDL)

**Robot**: Talib

```bash
# 1. Read raw requirements
cd test-framework-v1
cat _user_input/raw-requirements/taskflow-requirements.txt

# 2. Create AORDL requirements (manual with Talib)
# Output: ARTIFACTS/dev/requirements/REQ-001.yaml to REQ-007.yaml

# 3. Validate AORDL
for file in ARTIFACTS/dev/requirements/REQ-*.yaml; do
  node ../ROME/skills/tier-1/validate-aordl.js \
    --requirement-file "$file" \
    --mode STRICT
done

# 4. Generate BDD scenarios
mkdir -p ARTIFACTS/03-bdd-features
for file in ARTIFACTS/dev/requirements/REQ-*.yaml; do
  base=$(basename "$file" .yaml)
  node ../ROME/skills/tier-1/transform-aordl-to-bdd.js \
    --requirement-file "$file" \
    --output-file "ARTIFACTS/03-bdd-features/${base}.feature"
done

# 5. Request GATE-P1 from Sarah
```

### Step 2: Phase 2 (Analysis)

**Robot**: Talib

```bash
# 1. Generate data dictionary
node ../ROME/skills/tier-1/generate-data-dictionary.js \
  --requirements-directory ARTIFACTS/dev/requirements \
  --output ARTIFACTS/dev/design/data-dictionary.yaml

# 2. Generate API spec (if utility exists)
# node ../ROME/skills/tier-1/generate-openapi-spec.js ...

# 3. Create phase2-handover.md (manual)
```

### Step 3: Phase 3 (Design)

**Robot**: PMA

```bash
# 1. Run artifact automation
# Generate all P3 artifacts automatically

node ../ROME/skills/tier-1/generate-api-design.js \
  --requirements-directory ARTIFACTS/dev/requirements \
  --data-dictionary ARTIFACTS/dev/design/data-dictionary.yaml \
  --output ARTIFACTS/dev/design/api-design.md

node ../ROME/skills/tier-1/generate-use-cases.js \
  --requirements-directory ARTIFACTS/dev/requirements \
  --data-dictionary ARTIFACTS/dev/design/data-dictionary.yaml \
  --output ARTIFACTS/dev/design/use-cases.md

node ../ROME/skills/tier-1/generate-actionlist.js \
  --use-cases ARTIFACTS/dev/design/use-cases.md \
  --data-dictionary ARTIFACTS/dev/design/data-dictionary.yaml \
  --output ARTIFACTS/dev/design/actionlist.md

node ../ROME/skills/tier-1/generate-postman-collection.js \
  --api-design ARTIFACTS/dev/design/api-design.md \
  --output docs/api/postman/taskflow.json

# 2. Manual refinement (tech-stack, system-architecture, dev-environment, etc.)

# 3. Validate artifacts
node ../ROME/skills/tier-1/validate-traceability.js \
  --requirements-directory ARTIFACTS/dev/requirements \
  --design-directory ARTIFACTS/dev/design

node ../ROME/skills/tier-1/validate-api-design.js \
  --api-design ARTIFACTS/dev/design/api-design.md \
  --requirements-directory ARTIFACTS/dev/requirements \
  --data-dictionary ARTIFACTS/dev/design/data-dictionary.yaml

node ../ROME/skills/tier-1/validate-use-cases.js \
  --use-cases ARTIFACTS/dev/design/use-cases.md \
  --requirements-directory ARTIFACTS/dev/requirements

node ../ROME/skills/tier-1/validate-actionlist.js \
  --actionlist ARTIFACTS/dev/design/actionlist.md \
  --use-cases ARTIFACTS/dev/design/use-cases.md

# 4. Request GATE-P3 from Sarah
```

### Step 4: Phase 4 (Configuration)

**Robot**: Lucien

```bash
# Run setup script (after Lucien creates it)
scripts/setup-dev.sh

# Start dev environment
docker-compose -f docker/docker-compose.dev.yml up
```

### Step 5: Phase 5 (Code Generation)

**Robots**: Ashok, Reena, Charlie

```bash
# Ashok: Run migrations
cd backend
npm run migrate

# Reena: Run API tests
newman run ../docs/api/postman/taskflow.json --environment dev

# Charlie: Run frontend tests
cd ../frontend
flutter test --coverage

# Verify coverage
lcov --summary coverage/lcov.info
```

---

## Validation Results

**After completion, document results in `VALIDATION-RESULTS.md`**:

- Time taken per phase
- Automation savings
- Quality metrics (coverage, test pass rate, gate approvals)
- Issues found (framework bugs, missing features)
- Recommendations for framework improvements

---

## Expected Outcome

✅ **Working application** with all 7 use cases functional
✅ **50-60% time savings** vs manual development
✅ **100% traceability** REQ→UC→Code
✅ **≥ 80% test coverage**
✅ **0 GATE blockers** (P1, P3)
✅ **All automation utilities working**

**This validates ROME framework is production-ready.**
