# ROME Reference Guide
**Version**: 3.0 - Integration-First with Class Annotations
**Last Updated**: 2025-10-07

## The 6-Step Protocol

Every Rodeo MUST follow these steps for each feature:

| Step | Action | Description | Output |
|------|--------|-------------|--------|
| 1 | **ANALYZE** | Understand use cases, data model, feature scope | Mental model |
| 2 | **DESIGN** | Create feature design with clear interfaces | Design specs |
| 3 | **IMPLEMENT** | Build from data layer outward with annotations | Working code |
| 4 | **INTEGRATE** | Test integration at each layer | Passing tests |
| 5 | **VALIDATE** | Ensure feature completeness | Complete feature |
| 6 | **REPORT** | Update status with test evidence | Status update |

### Implementation Progression

Features must be built in this order, with integration tests at each layer:

```
1. Database Schema (Ashok) + annotations
   ↓ Integration Test: Schema + CRUD works
2. Server Data Access (Reena) + annotations
   ↓ Integration Test: Model ↔ DB works
3. API Endpoints (Reena) + annotations
   ↓ Integration Test: API ↔ DB works
4. Client Data Layer (Charlie) + annotations
   ↓ Integration Test: Client ↔ API works
5. Domain Logic (Charlie) + annotations
   ↓ Integration Test: Use cases work
6. Presentation Layer (Charlie) + annotations
   ↓ Integration Test: UI ↔ Full stack works
```

**Unit tests added at project end** for complex logic only.

---

## Class Annotation Protocol

### Required Annotations

Every class/module MUST have these annotations:

```typescript
/**
 * @Created YYYY-MM-DD by [RobotName]
 * @Modified YYYY-MM-DD by [RobotName]  // Update on significant changes
 * @TestLevel None|Integration|Unit|Both
 * @Stable true|false
 * @ComplexityLevel Low|Medium|High
 * 
 * [Optional: Description]
 * [Optional: CHANGELOG]
 * [Optional: Test file references]
 */
```

### Annotation Rules

#### @Created
- Set ONCE when class is first created
- Format: `YYYY-MM-DD by [RobotName]`
- Example: `@Created 2025-10-07 by Reena`

#### @Modified
- Update on EVERY significant change
- Format: `YYYY-MM-DD by [RobotName]`
- Omit if no modifications since creation
- Example: `@Modified 2025-10-08 by Charlie`

#### @TestLevel
- **None**: Class just created, no tests yet
- **Integration**: Tested via integration tests (most common)
- **Unit**: Has dedicated unit tests (complex logic only)
- **Both**: Has both integration and unit tests

Update progression: `None` → `Integration` → `Both` (if complex)

#### @Stable
- **false** (default): In development, robots can modify freely
- **true**: Production-ready, requires PMA approval for changes

⚠️ **CRITICAL**: Robots MUST get PMA approval before modifying `@Stable true` classes

#### @ComplexityLevel
- **Low**: Simple CRUD, data access - integration tests sufficient
- **Medium**: Some business logic - mostly integration tests
- **High**: Complex algorithms, state machines - needs unit tests

### Annotation Lifecycle Example

```typescript
// Stage 1: Initial creation
/**
 * @Created 2025-10-07 by Reena
 * @TestLevel None
 * @Stable false
 * @ComplexityLevel Low
 */
class ProjectService { }

// Stage 2: After integration tests
/**
 * @Created 2025-10-07 by Reena
 * @Modified 2025-10-07 by Reena
 * @TestLevel Integration
 * @Stable false
 * @ComplexityLevel Low
 * 
 * Integration tests: test/integration/project_service_test.js
 */
class ProjectService { ... }

// Stage 3: Production ready
/**
 * @Created 2025-10-07 by Reena
 * @Modified 2025-10-08 by PMA
 * @TestLevel Integration
 * @Stable true
 * @ComplexityLevel Low
 * 
 * CHANGELOG:
 * 2025-10-08: Marked stable after UAT
 * 2025-10-07: Initial implementation
 */
class ProjectService { ... }

// Stage 4: Complex logic added
/**
 * @Created 2025-10-07 by Reena
 * @Modified 2025-10-10 by Reena
 * @TestLevel Both
 * @Stable true
 * @ComplexityLevel High
 * 
 * CHANGELOG:
 * 2025-10-10: Added authorization logic - added unit tests
 * 2025-10-08: Marked stable
 * 
 * Integration tests: test/integration/project_service_test.js
 * Unit tests: test/unit/project_authorization_test.js
 */
class ProjectService { ... }
```

---

## Feature Design Principles

### 1. Vertical Slices Not Layers

| ✅ Good: Feature Slice | ❌ Bad: Horizontal Layer |
|------------------------|--------------------------|
| "User Project Management" | "All Database Tables" |
| - DB: projects table | - Database team |
| - API: /api/projects | - API team |
| - UI: Project screens | - Frontend team |
| **One robot owns entire feature** | **Integration is a surprise** |

### 2. Clear Interfaces

```typescript
// ✅ Good: Clear feature interface
interface ProjectFeature {
  createProject(name: string, description: string): Promise<Project>
  getProjects(): Promise<Project[]>
  updateProject(id: string, data: Partial<Project>): Promise<Project>
}

// ❌ Bad: Unclear boundaries
interface Everything {
  doStuff(action: string, data: any): any
}
```

### 3. Minimal Dependencies

Features should depend on clear interfaces:
```
Feature A → Interface B → Feature B Implementation
```

---

## Integration Test Standards

### Test File Naming
```
test/
└── integration/
    ├── database/
    │   └── projects_schema_test.js
    ├── models/
    │   └── project_model_test.js
    ├── api/
    │   └── projects_api_test.js
    └── ui/
        └── project_list_page_test.dart
```

### Required Test Coverage

Each layer needs integration tests:

**Database (Ashok)**:
- Schema creation successful
- Constraints enforced
- Seed data loads
- CRUD operations work

**Server Data Access (Reena)**:
- Models persist to database
- Queries return correct data
- Relationships work

**API Endpoints (Reena)**:
- Requests handled correctly
- Validation enforced
- Errors returned properly
- Data flows through DB

**Client Data Layer (Charlie)**:
- API communication works
- Data deserialization correct
- Error handling functional

**Domain Logic (Charlie)**:
- Business rules enforced
- Use cases execute properly
- Edge cases handled

**Presentation (Charlie)**:
- Full UI → API → DB flow works
- User interactions functional
- Error states displayed

### Integration Test Template

```javascript
// test/integration/[layer]/[feature]_test.js
describe('[Feature] [Layer] Integration', () => {
  beforeAll(async () => {
    // Setup: connect to real systems
  });
  
  afterEach(async () => {
    // Cleanup: remove test data
  });
  
  afterAll(async () => {
    // Teardown: close connections
  });
  
  it('should [action] successfully', async () => {
    // Test real system behavior
    // Verify data persists/flows correctly
  });
  
  it('should handle [error case]', async () => {
    // Test error handling
  });
});
```

---

## Coordination Protocols

### Feature Assignment Format

```markdown
## Feature: [Name] | Priority: [HIGH/MED/LOW]

### Ashok (Database):
- [ ] Schema: Create [entity] table with constraints
  - Integration Test: CRUD operations, constraints enforced
  - Annotation: @TestLevel Integration, @ComplexityLevel Low
- [ ] Seed: Add test/demo data
  - Integration Test: Data loads successfully

### Reena (Backend):
- [ ] Model: Implement [Entity] model
  - Integration Test: Model persists to DB correctly
  - Annotation: @TestLevel Integration, @ComplexityLevel Low
- [ ] API: Create endpoints POST/GET/PUT/DELETE /api/[resource]
  - Integration Test: API returns correct data from DB
  - Annotation: @TestLevel Integration, @ComplexityLevel Low
- [ ] Validation: Add error handling
  - Integration Test: Invalid requests handled properly

### Charlie (Frontend):
- [ ] Data Layer: [Entity]RemoteDataSource
  - Integration Test: Fetches from real API
  - Annotation: @TestLevel Integration, @ComplexityLevel Low
- [ ] Domain: Repository + Use Cases
  - Integration Test: Use cases work end-to-end
  - Annotation: @TestLevel Integration, @ComplexityLevel Medium
- [ ] UI: [List] screens
  - Integration Test: Complete workflow UI → API → DB
  - Annotation: @TestLevel Integration, @ComplexityLevel Low

### Interface Definition:
```
API: POST/GET/PUT/DELETE /api/[resource]
Request: { field1: type, field2: type }
Response: { success: boolean, data: EntityType | null, error?: ErrorType }
```

### Dependencies:
- [List any feature dependencies]

### Status: PENDING
```

### Status Updates

```
Format: Feature | Layer | Status | Rodeo | Timestamp | TestLevel
Example: Project Management | API | COMPLETED | Reena | 2025-10-07 10:30 | Integration
```

### Blocking Issues

```markdown
🔴 BLOCKED: [Feature Name] - [Layer]
Reason: [Specific blocker]
Needs: [What would unblock]
Impact: [Dependent features]
Status: [Current annotation state]
```

---

## Robot Step-by-Step Guide

### Step 1: ANALYZE
- Read data_model.md - understand entities
- Read use_cases.md - understand workflows
- Review assigned feature in actionlist.md
- Understand integration points with other features

### Step 2: DESIGN
- Sketch feature design (on paper or in comments)
- Define class interfaces
- Plan integration test approach
- Identify complexity (Low/Medium/High)

### Step 3: IMPLEMENT

#### When Creating New Class:

1. **Add initial annotations**:
```typescript
/**
 * @Created [TODAY] by [YOUR_NAME]
 * @TestLevel None
 * @Stable false
 * @ComplexityLevel [Low|Medium|High]
 * 
 * [Brief description]
 */
```

2. **Implement the class**

3. **Write integration test** (same commit or immediately after)

4. **Update annotations**:
```typescript
/**
 * @Created [DATE] by [YOUR_NAME]
 * @Modified [TODAY] by [YOUR_NAME]
 * @TestLevel Integration
 * @Stable false
 * @ComplexityLevel [Level]
 * 
 * Integration tests: test/integration/[path]_test.[ext]
 */
```

#### When Modifying Existing Class:

1. **Check @Stable status**:
   - If `@Stable true` → GET PMA APPROVAL FIRST
   - If `@Stable false` → Proceed with changes

2. **Make your changes**

3. **Update @Modified**:
```typescript
@Modified [TODAY] by [YOUR_NAME]
```

4. **Add CHANGELOG entry** (if significant change):
```typescript
/**
 * CHANGELOG:
 * [TODAY]: [Description of change]
 * [PREVIOUS]: [Previous change]
 */
```

5. **Ensure tests still pass**

6. **Update @TestLevel** if test coverage changed

### Step 4: INTEGRATE

- Run integration tests for your layer
- Verify tests pass against real systems
- Check data flows correctly
- Test error cases

### Step 5: VALIDATE

- Feature works end-to-end
- All integration tests passing
- Error handling comprehensive
- Annotations up to date

### Step 6: REPORT

Update status files:

**project_activity.status**:
```
Feature: Project Management | Layer: API | Status: COMPLETED | Rodeo: Reena | 2025-10-07 10:30 | TestLevel: Integration
```

**project_tasks.log**:
```
[2025-10-07 10:30:00] [Reena] [COMPLETE] Project API endpoints with integration tests
```

---

## File Structure

```
PROJECT/
├── SOURCE/
│   ├── backend/
│   │   ├── models/          # @TestLevel Integration
│   │   ├── routes/          # @TestLevel Integration
│   │   ├── services/        # @TestLevel Integration or Both
│   │   └── utils/           # @TestLevel Unit (if complex)
│   ├── frontend/
│   │   └── lib/
│   │       ├── data/        # @TestLevel Integration
│   │       ├── domain/      # @TestLevel Integration
│   │       └── presentation/ # @TestLevel Integration
│   ├── database/
│   │   ├── schema.sql       # @TestLevel Integration
│   │   └── seed.sql
│   └── tests/
│       ├── integration/     # ALL integration tests here
│       │   ├── database/
│       │   ├── models/
│       │   ├── api/
│       │   └── ui/
│       └── unit/            # Unit tests (complex logic only)
│           ├── algorithms/
│           └── state_machines/
├── PROJECT/dev/
│   ├── data_model.md
│   ├── use_cases.md
│   ├── actionlist.md
│   ├── project_activity.status
│   └── project_tasks.log
└── claude_*/
```

---

## Quick Reference Commands

### Check Annotations

```bash
# Find all unstable classes
grep -r "@Stable false" SOURCE/

# Find classes needing unit tests
grep -r "@ComplexityLevel High" SOURCE/ | grep "@TestLevel Integration"

# Find recent modifications
grep -r "@Modified 2025-10-07" SOURCE/

# Find classes by creator
grep -r "@Created.*by Reena" SOURCE/
```

### Check Feature Status

```bash
# View current features
cat PROJECT/dev/actionlist.md

# Find blockers
grep "BLOCKED" PROJECT/dev/project_activity.status

# View recent activity
tail -20 PROJECT/dev/project_tasks.log
```

### Run Tests

```bash
# Run all integration tests
npm test -- tests/integration
flutter_archive test test/integration

# Run specific layer
npm test -- tests/integration/api
flutter_archive test test/integration/data

# Check coverage
npm test -- --coverage
flutter_archive test --coverage
```

---

## PMA Quality Gates

### Before Marking @Stable true

PMA verifies:

- [ ] All integration tests passing
- [ ] Feature tested in realistic environment
- [ ] Error handling comprehensive
- [ ] Performance acceptable
- [ ] Annotations complete and accurate
- [ ] @TestLevel matches actual test coverage
- [ ] @ComplexityLevel accurate
- [ ] CHANGELOG documents major changes
- [ ] No placeholder or TODO code

### Annotation Audit

PMA should periodically verify:

```bash
# Classes missing annotations
grep -L "@Created" $(find SOURCE -name "*.js" -o -name "*.dart" -o -name "*.ts")

# Classes with @TestLevel None (should have tests)
grep -r "@TestLevel None" SOURCE/

# High complexity without unit tests
grep -r "@ComplexityLevel High" SOURCE/ | grep "@TestLevel Integration"
```

---

## Summary

**ROME 3.0 Key Principles:**

1. **Data-first design** drives implementation
2. **Vertical feature slices**, not horizontal layers
3. **Integration tests at each layer**
4. **Class annotations** for traceability and safety
5. **Unit tests only for complex logic**
6. **Build outward from data sources**
7. **Each robot delivers complete working features**

**Every class annotated, every layer tested, production code protected.**
