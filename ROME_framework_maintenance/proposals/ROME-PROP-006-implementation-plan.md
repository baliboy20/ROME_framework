# ROME-PROP-006: Implementation Plan

| Field | Value |
|-------|-------|
| **Document UID** | ROME-PROP-006-IMPL |
| **Version** | 1.0 |
| **Date** | 2025-12-18T00:00:00Z |
| **Status** | Implementation Plan |
| **Document Type** | Implementation Plan |
| **Author** | Framework Analyst & Architect |
| **Related Proposal** | ROME-PROP-006 |

---

## Purpose

Defines step-by-step implementation plan for ROME-PROP-006 (Integration Testing Framework Integration) with verification checkpoints and cohesion review protocol.

---

## Implementation Overview

**Total Documents to Update:** 8 core documents + 1 template directory
**Estimated Effort:** 6-8 hours
**Implementation Phases:** 4 sequential phases
**Review Gates:** 2 (mid-implementation, final)

---

## Phase Breakdown

### Phase 1: Foundation Documents (P03 Design)

**Objective:** Add test architecture schema to P03 design phase specifications.

**Duration:** 2 hours

**Documents:**

1. **ROME-PHASE-004 (Phase 3 Operations Guidelines)**
   - Current: v2.1
   - Target: v2.2
   - Location: `/ROME/life-cycle/P03-design/operations-guidelines.md`

2. **ROME-ROBOT-003 (PMA Robot Definition)**
   - Current: v1.6
   - Target: v1.7
   - Location: `/ROME/robot-templates/pma/CLAUDE.md`

**Changes:**

#### ROME-PHASE-004 v2.2

**Section: Outputs → Required Artifacts**

Add row:
```markdown
| test-architecture.md | `ARTIFACTS/dev/design/` | Test architecture schema: Page Objects, Flow Objects, fixtures |
```

**New Section: Test Architecture Schema** (after API Design Schema)

```markdown
### Test Architecture Schema

test-architecture.md MUST include:

| Section | Content |
|---------|---------|
| Directory Structure | integration_test/ folder hierarchy |
| Page Objects | Screen → Page Object class mappings |
| Flow Objects | User journey → Flow Object class mappings |
| Test Fixtures | Entity → Fixture class mappings |
| Widget Key Strategy | Key naming convention pattern |
| Mock Services | Service → Mock class mappings |
| Test Environment | Database, API, storage test strategies |

**Format:**

```yaml
directory_structure:
  integration_test/
    config/:    # test_environment.dart, mock_services.dart
    pages/:     # [screen]_page.dart
    flows/:     # [journey]_flow.dart
    fixtures/:  # [entity]_fixture.dart
    tests/:     # [feature]_test.dart

page_objects:
  - screen: "[ScreenName]"
    page_object: "[ClassName]"
    finders: ["[key_list]"]
    actions: ["[method_list]"]
    assertions: ["[assertion_list]"]

flow_objects:
  - journey: "[Journey Name]"
    flow: "[ClassName]"
    screens: ["[PageObject list]"]

fixtures:
  - entity: "[EntityName]"
    fixture: "[ClassName]"
    variants: ["[variant_list]"]
    fields: ["[field_list]"]

widget_key_strategy:
  pattern: "ValueKey('[screen]_[element]_[type]')"
  examples:
    - "ValueKey('login_email_field')"
    - "ValueKey('profile_save_button')"

mock_services:
  - service: "[ServiceName]"
    mock_class: "Mock[ServiceName]"
    endpoints: ["[endpoint_list]"]

test_environment:
  database: "[test db strategy]"
  api: "[test api strategy]"
  storage: "[test storage strategy]"
```
```

**Section: Exit Criteria**

Add rows:
```markdown
| Test architecture complete | test-architecture.md with all sections | Yes |
| Widget key strategy defined | Key naming convention documented | Yes |
| Page/Flow Objects mapped | All screens and journeys mapped | Yes |
| Test fixtures specified | Fixture per entity defined | Yes |
```

**Section: Actionlist Schema → assigned_to**

Add note after story pattern:
```markdown
**Test Stories:** Include test-related stories in assignment:
- Data layer: Test fixtures (even-numbered stories)
- Backend layer: API tests (even-numbered stories)
- Frontend layer: Page Objects, Flow Objects, integration tests (even-numbered stories)

**Example:**
```yaml
assigned_to:
  charlie:
    - story: "STORY-001-001-1-ui"
      title: "Login screen implementation"
      estimate: "4h"
    - story: "STORY-001-001-2-ui"
      title: "LoginPage object"
      estimate: "1h"
    - story: "STORY-001-001-3-ui"
      title: "Login flow tests"
      estimate: "2h"
```
```

**Section: Revision History**

Add entry:
```markdown
| 2.2 | 2025-12-18T00:00:00Z | Added test architecture schema, updated actionlist with test stories (ROME-PROP-006) |
```

---

#### ROME-ROBOT-003 v1.7 (PMA)

**Section: Phase 3 Procedures → Step 10 (Document Use Cases)**

Renumber: Step 10 → Step 10

Insert new **Step 10.5: Design Test Architecture** (after Step 10, before Step 11):

```markdown
### Step 10.5: Design Test Architecture

**Input:** use-cases.md, ui-requirements.md, data-dictionary.yaml

**Output:** test-architecture.md

**Procedure:**

1. **Map Screens to Page Objects:**
   - List all screens from use-cases.md and ui-requirements.md
   - For each screen, define Page Object class name
   - Identify interactive widgets requiring keys (buttons, inputs, etc.)
   - Define finder list per Page Object
   - Define action methods (login, submit, navigate, etc.)
   - Define assertion methods (expectVisible, expectError, etc.)

2. **Map User Journeys to Flow Objects:**
   - Identify multi-screen user journeys from use-cases.md
   - For each journey, define Flow Object class name
   - List Page Objects involved in sequence
   - Define flow completion method signature

3. **Define Widget Key Strategy:**
   - Establish naming convention: `ValueKey('[screen]_[element]_[type]')`
   - Provide examples per screen type
   - Document key stability requirements

4. **Specify Test Fixtures:**
   - For each entity in data-dictionary.yaml, define Fixture class
   - Specify fixture variants: valid, invalid, edge cases
   - List fields included in fixtures

5. **Document Mock Services:**
   - Identify external services requiring mocking (APIs, storage, etc.)
   - Define Mock class names
   - List endpoints/methods to mock

6. **Define Test Environment:**
   - Specify test database strategy (in-memory, test DB, etc.)
   - Specify API test strategy (mock HTTP client, test server)
   - Specify storage strategy (temporary files, mock storage)

7. **Create test-architecture.md:**
   - Location: `ARTIFACTS/dev/design/test-architecture.md`
   - Use schema from ROME-PHASE-004
   - Include all sections with complete mappings

8. **Update actionlist.md with Test Stories:**
   - For each feature, add test stories:
     - Ashok: `STORY-[EPIC]-[FEAT]-#-db` for test fixtures
     - Reena: `STORY-[EPIC]-[FEAT]-#-api` for API tests
     - Charlie: `STORY-[EPIC]-[FEAT]-#-ui` for Page Objects, Flow Objects, tests
   - Estimate test effort: 15-20% of implementation effort
   - Use even-numbered story sequences for test artifacts

**Example test-architecture.md:**

[Include full example from ROME-PHASE-004 schema]

**Quality Check:**
- Every screen has Page Object mapping
- Every multi-screen journey has Flow Object mapping
- Every entity has Fixture specification
- Widget key convention is clear and consistent
- Mock services cover all external dependencies

**Handover:** test-architecture.md available for Lucien (P04 scaffolding) and P5 robots (test generation).
```

**Section: Step 11 → Renumber to Step 11**

**Section: Step 12 → Renumber to Step 12**

**Section: Step 13 (Architecture Review) → Update**

Add column to review table:
```markdown
| Test Architecture | test-architecture.md | Page/Flow Objects mapped, fixtures defined, widget keys specified |
```

**Section: Revision History**

Add entry:
```markdown
| 1.7 | 2025-12-18T00:00:00Z | Added Step 10.5: Design test architecture, updated actionlist with test stories (ROME-PROP-006) |
```

---

### Phase 1 Verification Checklist

- [ ] ROME-PHASE-004 v2.2: Test architecture schema added
- [ ] ROME-PHASE-004 v2.2: Exit criteria includes test artifacts
- [ ] ROME-PHASE-004 v2.2: Actionlist schema includes test stories
- [ ] ROME-PHASE-004 v2.2: Revision history updated
- [ ] ROME-ROBOT-003 v1.7: Step 10.5 added with complete procedure
- [ ] ROME-ROBOT-003 v1.7: Step numbering consistent (10, 10.5, 11, 12, 13)
- [ ] ROME-ROBOT-003 v1.7: Architecture review includes test architecture
- [ ] ROME-ROBOT-003 v1.7: Revision history updated
- [ ] Cross-reference: ROME-PHASE-004 schema matches ROME-ROBOT-003 procedure
- [ ] Language consistency: "Page Object", "Flow Object", "widget key" used uniformly

---

### Phase 2: Configuration Documents (P04 Config)

**Objective:** Add test scaffolding requirements to P04 config phase specifications.

**Duration:** 1.5 hours

**Documents:**

1. **ROME-PHASE-005 (Phase 4 Config Operations Guidelines)**
   - Current: v1.2
   - Target: v1.3
   - Location: `/ROME/life-cycle/P04-config/operations-guidelines.md`

2. **ROME-ROBOT-009 (Lucien Robot Definition)**
   - Current: v1.0
   - Target: v1.1
   - Location: `/ROME/robot-templates/lucien/CLAUDE.md`

**Changes:**

#### ROME-PHASE-005 v1.3

**Section: Entry Criteria**

Add row:
```markdown
| Test architecture documented | `test-architecture.md` complete | Yes |
```

**Section: Exit Criteria**

Add rows:
```markdown
| Test directories created | Test directory structure per test-architecture.md | Yes |
| Test dependencies installed | Test frameworks configured | Yes |
| Test environment configured | .env.test created, test config files exist | Yes |
| Test commands documented | Test execution commands in technical-specs.md | Yes |
```

**Section: Outputs → Technical Specs Schema**

Add row to table:
```markdown
| Test Commands | Install, run integration tests, run unit tests |
```

**Section: Outputs → Scaffolding Manifest Schema**

Add row to table:
```markdown
| Test Infrastructure | Test directories, test dependencies, test config status |
```

**New Section: Test Infrastructure Requirements** (after Environment Requirements, before Traceability Requirements)

```markdown
## Test Infrastructure Requirements

### Test Directory Structure

Per test-architecture.md, create:

```
SOURCE/[app-workspace]/
└── integration_test/
    ├── config/
    │   ├── test_environment.dart
    │   └── mock_services.dart
    ├── pages/
    ├── flows/
    ├── fixtures/
    └── tests/
```

**config/:** Test environment setup, mock service implementations
**pages/:** Page Object classes (generated by Charlie)
**flows/:** Flow Object classes (generated by Charlie)
**fixtures/:** Test fixture classes (generated by Ashok)
**tests/:** Integration test files (generated by P5 robots)

### Test Dependencies

Install per technology stack:

**Flutter:**
```yaml
dev_dependencies:
  integration_test: ^1.0.0
  flutter_test:
    sdk: flutter
  mockito: ^5.4.0
  build_runner: ^2.4.0
```

**React/TypeScript:**
```json
"devDependencies": {
  "@testing-library/react": "^14.0.0",
  "@testing-library/user-event": "^14.0.0",
  "jest": "^29.0.0",
  "jest-environment-jsdom": "^29.0.0"
}
```

**Backend (Node.js):**
```json
"devDependencies": {
  "jest": "^29.0.0",
  "supertest": "^6.3.0",
  "@types/jest": "^29.0.0"
}
```

### Test Environment Configuration

Create `.env.test`:

```bash
# Test Database
TEST_DB_HOST=localhost
TEST_DB_PORT=5432
TEST_DB_NAME=app_test
TEST_DB_USER=test_user
TEST_DB_PASSWORD=test_password

# Test API
TEST_API_URL=http://localhost:3001
TEST_API_TIMEOUT=5000

# Test Storage
TEST_STORAGE_PATH=/tmp/test_storage

# Test Mode Flag
NODE_ENV=test
FLUTTER_TEST=true
```

### Test Configuration Files

**Flutter:** No additional config (uses flutter_test SDK)

**React/TypeScript:** Create `jest.config.js`:
```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/integration_test/config/test_environment.ts'],
  testMatch: ['**/integration_test/tests/**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}']
};
```

**Backend:** Create `jest.config.js`:
```javascript
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/integration_test/config/test_environment.ts'],
  testMatch: ['**/integration_test/tests/**/*.test.ts']
};
```

### CI/CD Test Stage

Add to pipeline:

**GitHub Actions:**
```yaml
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v3
    - name: Install dependencies
      run: npm install  # or flutter pub get
    - name: Run integration tests
      run: npm test  # or flutter test integration_test/
    - name: Upload coverage
      uses: codecov/codecov-action@v3
```

**GitLab CI:**
```yaml
test:
  stage: test
  script:
    - npm install
    - npm test
  coverage: '/Coverage: \d+\.\d+%/'
```

### Test Command Documentation

Document in technical-specs.md:

| Command | Purpose | Workspace |
|---------|---------|-----------|
| `flutter test integration_test/` | Run Flutter integration tests | app-workspace |
| `npm test` | Run Jest integration tests | api-workspace, app-workspace |
| `pytest tests/integration/` | Run Python integration tests | api-workspace |
```

**Section: Revision History**

Add entry:
```markdown
| 1.3 | 2025-12-18T00:00:00Z | Added test infrastructure requirements, test scaffolding (ROME-PROP-006) |
```

---

#### ROME-ROBOT-009 v1.1 (Lucien)

**Section: Phase 4 Procedures**

Add new **Step: Scaffold Test Infrastructure** (after workspace scaffolding, before CI/CD setup):

```markdown
## Step N: Scaffold Test Infrastructure

**Input:** test-architecture.md from P3

**Output:** Test directory structure, test dependencies, test environment config

**Procedure:**

1. **Read Test Architecture:**
   - Open `ARTIFACTS/dev/design/test-architecture.md`
   - Note directory structure requirements
   - Note test dependency requirements

2. **Create Test Directory Structure:**
   - Navigate to primary app workspace
   - Create `integration_test/` directory
   - Create subdirectories: `config/`, `pages/`, `flows/`, `fixtures/`, `tests/`
   - Add `.gitkeep` files to empty directories

3. **Install Test Dependencies:**
   - Add test dependencies to package manager config:
     - Flutter: Add to `pubspec.yaml` dev_dependencies
     - Node.js: Add to `package.json` devDependencies
     - Python: Add to `requirements-dev.txt`
   - Run install command: `flutter pub get` / `npm install` / `pip install -r requirements-dev.txt`

4. **Create Test Environment Configuration:**
   - Create `.env.test` file in workspace root
   - Copy template from test-architecture.md or use default:
     ```bash
     # Test Database
     TEST_DB_HOST=localhost
     TEST_DB_PORT=5432
     TEST_DB_NAME=app_test

     # Test API
     TEST_API_URL=http://localhost:3001

     # Test Mode
     NODE_ENV=test
     ```
   - Add `.env.test` to `.gitignore` (do not commit secrets)
   - Create `.env.test.example` with placeholder values for documentation

5. **Create Test Configuration Files:**
   - **Flutter:** No config needed (uses flutter_test SDK)
   - **React/Node.js:** Create `jest.config.js` in workspace root
   - **Python:** Create `pytest.ini` in workspace root
   - Use templates from test-architecture.md or ROME-PHASE-005

6. **Create Test Environment Template Files:**
   - Create `integration_test/config/test_environment.dart` (Flutter) or `.ts` (TypeScript):
     ```dart
     // integration_test/config/test_environment.dart
     import 'package:flutter_test/flutter_test.dart';

     // Test environment setup will be completed by Charlie in P5
     void setupTestEnvironment() {
       // Mock services initialization
       // Test database setup
       // Fixture loading
     }
     ```
   - Create `integration_test/config/mock_services.dart` (or `.ts`):
     ```dart
     // Mock service implementations will be completed by Reena in P5
     ```

7. **Document Test Commands:**
   - Update `technical-specs.md` with test execution commands
   - Add section: "Test Commands"
   - Document: install, run unit tests, run integration tests, coverage

8. **Update Scaffolding Manifest:**
   - Add "Test Infrastructure" section to `scaffolding-manifest.md`
   - Document directories created, dependencies installed, config files created

9. **Verify Test Setup:**
   - Run test command to ensure framework is functional
   - Create simple smoke test if needed to verify
   - Confirm test stage in CI/CD pipeline is configured

**Quality Check:**
- All test directories exist
- Test dependencies installed without errors
- Test environment config created
- Test commands documented and functional
- CI/CD test stage configured

**Handover:** Test infrastructure ready for P5 robots to generate Page Objects, Flow Objects, fixtures, and tests.
```

**Section: Revision History**

Add entry:
```markdown
| 1.1 | 2025-12-18T00:00:00Z | Added test infrastructure scaffolding step (ROME-PROP-006) |
```

---

### Phase 2 Verification Checklist

- [ ] ROME-PHASE-005 v1.3: Test infrastructure requirements section added
- [ ] ROME-PHASE-005 v1.3: Entry/exit criteria include test artifacts
- [ ] ROME-PHASE-005 v1.3: Technical specs schema includes test commands
- [ ] ROME-PHASE-005 v1.3: Scaffolding manifest schema includes test infrastructure
- [ ] ROME-PHASE-005 v1.3: Revision history updated
- [ ] ROME-ROBOT-009 v1.1: Test scaffolding step added with complete procedure
- [ ] ROME-ROBOT-009 v1.1: Step references test-architecture.md from P3
- [ ] ROME-ROBOT-009 v1.1: Revision history updated
- [ ] Cross-reference: ROME-PHASE-005 requirements match ROME-ROBOT-009 procedure
- [ ] Technology coverage: Flutter, React/TypeScript, Python examples provided

---

### Phase 3: Generation Documents (P05 Generation)

**Objective:** Add test generation requirements to P05 generation phase specifications.

**Duration:** 2.5 hours

**Documents:**

1. **ROME-PHASE-006 (Phase 5 Generation Operations Guidelines)**
   - Current: v1.0
   - Target: v1.1
   - Location: `/ROME/life-cycle/P05-generation/operations-guidelines.md`

2. **ROME-ROBOT-010 (Ashok Robot Definition)**
   - Current: v1.0
   - Target: v1.1
   - Location: `/ROME/robot-templates/ashok/CLAUDE.md`

3. **ROME-ROBOT-008 (Reena Robot Definition)**
   - Current: v1.0
   - Target: v1.1
   - Location: `/ROME/robot-templates/reena/CLAUDE.md`

4. **ROME-ROBOT-007 (Charlie Robot Definition)**
   - Current: v1.0
   - Target: v1.1
   - Location: `/ROME/robot-templates/charlie/CLAUDE.md`

**Changes:**

#### ROME-PHASE-006 v1.1

**Section: Layer Responsibilities**

Update table to include test responsibilities:

```markdown
| Layer | Robot | Responsibilities |
|-------|-------|------------------|
| Data | Ashok | Database schema, migrations, models, seed data, **test fixtures**, data tests |
| Backend | Reena | API endpoints, business logic, middleware, **API integration tests**, **mock services** |
| Frontend | Charlie | UI components, state management, API integration, **Page Objects**, **Flow Objects**, **integration tests** |
```

**Section: Exit Criteria**

Add rows:
```markdown
| Integration tests passing | All integration tests green | Yes |
| Page Objects complete | Page Object per screen from test-architecture.md | Yes |
| Flow Objects complete | Flow Object per journey from test-architecture.md | Yes |
| Test fixtures complete | Fixture per entity from test-architecture.md | Yes |
```

**Section: Quality Gates**

Add new **Gate 6: Test Coverage Complete** (after Gate 5):

```markdown
### Gate 6: Test Coverage Complete

**Check:** Integration test suite meets coverage targets.

**Pass Criteria:**
- All Page Objects generated per test-architecture.md
- All Flow Objects generated per test-architecture.md
- All test fixtures generated per entity
- Integration tests exist per feature
- Test suite passes (>95% pass rate)
- Critical user flows covered by Flow Object tests

**Failure Action:** Complete missing test artifacts, fix failing tests.
```

**Section: Feature Implementation Flow**

Update step descriptions to include test generation:

```markdown
1. Ashok implements data requirements
   - Create/update migrations
   - Create/update models
   - Add seed data
   - **Generate test fixtures**
   - Write data tests
   - Mark FEAT-###-database COMPLETED

2. Reena implements API requirements
   - Create endpoints
   - Implement business logic
   - **Generate API integration tests**
   - **Create mock service implementations**
   - Write API tests
   - Mark FEAT-###-backend COMPLETED

3. Charlie implements UI requirements
   - **Add widget keys to interactive widgets**
   - Create screens/components
   - Integrate with API
   - Apply design system
   - **Generate Page Objects**
   - **Generate Flow Objects**
   - **Generate integration tests**
   - Write UI tests
   - Mark FEAT-###-frontend COMPLETED
```

**Section: Traceability Requirements → Test Coverage**

Update table:

```markdown
| Implementation | Test Type |
|----------------|-----------|
| Database model | Data validation test |
| API endpoint | **API integration test (Reena)** |
| Business logic | Unit test |
| UI component | Component test |
| UI screen | **Page Object (Charlie)** |
| User flow | **Flow Object test (Charlie)** |
```

**Section: Revision History**

Add entry:
```markdown
| 1.1 | 2025-12-18T00:00:00Z | Added test generation requirements, Quality Gate 6 (ROME-PROP-006) |
```

---

#### ROME-ROBOT-010 v1.1 (Ashok)

**New Section: Generate Test Fixtures** (add after seed data generation, before final quality check):

```markdown
## Step N: Generate Test Fixtures

**Input:** test-architecture.md, data-dictionary.yaml

**Output:** Test fixture classes in `integration_test/fixtures/`

**Procedure:**

1. **Read Test Architecture:**
   - Open `ARTIFACTS/dev/design/test-architecture.md`
   - Note fixtures section with entity → fixture mappings

2. **For Each Entity in Data Dictionary:**
   - Create fixture class file: `integration_test/fixtures/[entity_name]_fixture.dart` (or `.ts`)
   - Generate fixture variants per test-architecture.md specification:
     - **Valid variant:** All fields valid, passes validation
     - **Invalid variants:** Edge cases (invalid email, too short password, etc.)
     - **Edge case variants:** Boundary conditions (empty strings, max lengths, etc.)

3. **Use Deterministic Values:**
   - **No randomness** - fixtures must return same data every time
   - **Meaningful values** - `test@example.com`, not `asdf@asdf.com`
   - **Realistic data** - valid formats, reasonable lengths

4. **Example Fixture Structure (Flutter):**
   ```dart
   // integration_test/fixtures/user_fixture.dart
   import 'package:app/models/user.dart';

   class UserFixture {
     static User validUser() => User(
       id: 'test-user-1',
       email: 'test@example.com',
       password: 'password123',
       name: 'Test User',
       role: UserRole.standard,
       createdAt: DateTime.parse('2024-01-01T00:00:00Z')
     );

     static User invalidEmail() => User(
       id: 'test-user-2',
       email: 'not-an-email',
       password: 'password123',
       name: 'Test User',
       role: UserRole.standard,
       createdAt: DateTime.parse('2024-01-01T00:00:00Z')
     );

     static User adminUser() => User(
       id: 'test-admin-1',
       email: 'admin@example.com',
       password: 'adminpass123',
       name: 'Admin User',
       role: UserRole.admin,
       createdAt: DateTime.parse('2024-01-01T00:00:00Z')
     );
   }
   ```

5. **Export Fixtures:**
   - Create `integration_test/fixtures/index.dart` (or `index.ts`)
   - Export all fixture classes for easy import

6. **Document Fixtures:**
   - Add fixtures section to README
   - Document available variants per fixture
   - Provide usage examples

**Quality Check:**
- Fixture exists per entity
- All variants specified in test-architecture.md are generated
- Values are deterministic (no randomness)
- Fixtures compile/pass linting
- Fixtures are exported from index file

**Handover:** Fixtures available for Reena (API tests) and Charlie (UI tests).
```

**Section: Revision History**

Add entry:
```markdown
| 1.1 | 2025-12-18T00:00:00Z | Added test fixture generation step (ROME-PROP-006) |
```

---

#### ROME-ROBOT-008 v1.1 (Reena)

**New Section: Generate API Integration Tests** (add after endpoint implementation, before final quality check):

```markdown
## Step N: Generate API Integration Tests

**Input:** api-design.md, test-architecture.md, test fixtures from Ashok

**Output:** API integration tests in `integration_test/tests/api/`

**Procedure:**

1. **Read Test Architecture:**
   - Open `ARTIFACTS/dev/design/test-architecture.md`
   - Note mock service requirements
   - Note test environment configuration

2. **For Each API Endpoint:**
   - Create test file: `integration_test/tests/api/[endpoint]_test.dart` (or `.test.ts`)
   - Import test fixtures from Ashok
   - Test scenarios:
     - **Happy path:** Valid input → expected output
     - **Validation errors:** Invalid input → 400 error
     - **Authentication errors:** No auth → 401 error
     - **Authorization errors:** Wrong permissions → 403 error
     - **Not found:** Non-existent resource → 404 error
     - **Edge cases:** Boundary conditions, empty inputs

3. **Use Test Fixtures:**
   - Import fixtures from `integration_test/fixtures/`
   - Use deterministic fixture data in tests
   - Example:
     ```dart
     test('POST /auth/login returns token for valid credentials', () async {
       final user = UserFixture.validUser();
       final response = await api.login(user.email, user.password);

       expect(response.statusCode, 200);
       expect(response.data['token'], isNotNull);
       expect(response.data['user']['email'], user.email);
     });
     ```

4. **Generate Mock Service Implementations:**
   - Create mock classes in `integration_test/config/mock_services.dart` (or `.ts`)
   - Mock external dependencies (third-party APIs, payment processors, etc.)
   - Use deterministic responses
   - Example:
     ```dart
     class MockStripeAPI implements StripeAPI {
       @override
       Future<PaymentIntent> createPaymentIntent(double amount) async {
         return PaymentIntent(
           id: 'pi_test_123',
           amount: amount,
           status: PaymentStatus.succeeded
         );
       }
     }
     ```

5. **Configure Test Environment:**
   - Update `integration_test/config/test_environment.dart` (or `.ts`)
   - Inject mock services
   - Configure test database connection
   - Example:
     ```dart
     void setupTestEnvironment() {
       // Inject mock services
       getIt.registerSingleton<StripeAPI>(MockStripeAPI());

       // Configure test database
       final testDbConfig = DatabaseConfig.fromEnv('.env.test');
       getIt.registerSingleton<Database>(Database(testDbConfig));
     }
     ```

6. **Run Tests and Verify:**
   - Execute: `npm test` or `flutter test integration_test/tests/api/`
   - Ensure all tests pass
   - Fix flaky tests (timing issues, state pollution)
   - Achieve >90% pass rate

**Quality Check:**
- Test exists per endpoint from api-design.md
- Tests cover happy path and error cases
- Tests use fixtures (no hard-coded data)
- Mock services implemented for external dependencies
- Test suite passes reliably

**Handover:** API integration tests complete, mock services available for Charlie (UI tests).
```

**Section: Revision History**

Add entry:
```markdown
| 1.1 | 2025-12-18T00:00:00Z | Added API integration test and mock service generation (ROME-PROP-006) |
```

---

#### ROME-ROBOT-007 v1.1 (Charlie)

**New Section: Generate Widget Keys** (add before screen implementation):

```markdown
## Step N.1: Add Widget Keys to UI Components

**Input:** test-architecture.md (widget key strategy)

**Output:** Widget keys added to all interactive UI elements

**Procedure:**

1. **Read Widget Key Strategy:**
   - Open `ARTIFACTS/dev/design/test-architecture.md`
   - Note key naming convention: `ValueKey('[screen]_[element]_[type]')`

2. **For Each Interactive Widget:**
   - Add `key` property with semantic ValueKey
   - Pattern: `key: const ValueKey('[screen]_[element]_[type]')`
   - Interactive widgets: TextField, Button, Checkbox, Switch, Dropdown, etc.

3. **Examples:**
   ```dart
   // Login screen
   TextField(
     key: const ValueKey('login_email_field'),
     decoration: InputDecoration(labelText: 'Email'),
   )

   ElevatedButton(
     key: const ValueKey('login_submit_button'),
     onPressed: _handleLogin,
     child: Text('Login'),
   )

   Text(
     _errorMessage,
     key: const ValueKey('login_error_message'),
   )
   ```

4. **Key Naming Conventions:**
   - **Screen prefix:** Use screen name (login, profile, settings)
   - **Element descriptor:** Use descriptive name (email, password, submit)
   - **Type suffix:** Use widget type (field, button, message, dropdown)

**Quality Check:**
- All interactive widgets have keys
- Keys follow naming convention
- Keys are semantic (describe purpose, not position)
- Keys are stable (won't change with UI refactors)
```

**New Section: Generate Page Objects** (add after screen implementation):

```markdown
## Step N.2: Generate Page Objects

**Input:** test-architecture.md, implemented screens

**Output:** Page Object classes in `integration_test/pages/`

**Procedure:**

1. **For Each Screen:**
   - Create Page Object file: `integration_test/pages/[screen]_page.dart` (or `.ts`)
   - Class name: `[Screen]Page` (e.g., `LoginPage`, `ProfilePage`)

2. **Define Finders:**
   - For each widget key, create finder
   - Use `find.byKey(const ValueKey('[key]'))` pattern
   - Example:
     ```dart
     class LoginPage {
       final emailField = find.byKey(const ValueKey('login_email_field'));
       final passwordField = find.byKey(const ValueKey('login_password_field'));
       final submitButton = find.byKey(const ValueKey('login_submit_button'));
       final errorMessage = find.byKey(const ValueKey('login_error_message'));
     }
     ```

3. **Define Action Methods:**
   - Methods that perform user actions
   - Examples: enterEmail, enterPassword, submit, tapButton, selectOption
   - Pattern:
     ```dart
     Future<void> enterEmail(WidgetTester tester, String email) async {
       await tester.enterText(emailField, email);
     }

     Future<void> submit(WidgetTester tester) async {
       await tester.tap(submitButton);
       await tester.pumpAndSettle();  // Wait for animations
     }
     ```

4. **Define Combined Actions:**
   - High-level actions combining multiple steps
   - Example:
     ```dart
     Future<void> login(WidgetTester tester, String email, String password) async {
       await enterEmail(tester, email);
       await enterPassword(tester, password);
       await submit(tester);
     }
     ```

5. **Define Assertion Methods:**
   - Methods that verify screen state
   - Examples: expectVisible, expectEnabled, expectErrorShown
   - Pattern:
     ```dart
     Future<void> expectErrorVisible(WidgetTester tester) async {
       expect(errorMessage, findsOneWidget);
     }

     Future<void> expectSubmitEnabled(WidgetTester tester) async {
       final button = tester.widget<ElevatedButton>(submitButton);
       expect(button.enabled, isTrue);
     }
     ```

6. **Export Page Objects:**
   - Create `integration_test/pages/index.dart` (or `index.ts`)
   - Export all Page Object classes

**Quality Check:**
- Page Object exists per screen from test-architecture.md
- All finders from test-architecture.md are defined
- Action methods cover all user interactions
- Assertion methods cover key verification scenarios
- Page Objects follow consistent structure
```

**New Section: Generate Flow Objects** (add after Page Objects):

```markdown
## Step N.3: Generate Flow Objects

**Input:** test-architecture.md, Page Objects

**Output:** Flow Object classes in `integration_test/flows/`

**Procedure:**

1. **For Each User Journey:**
   - Create Flow Object file: `integration_test/flows/[journey]_flow.dart` (or `.ts`)
   - Class name: `[Journey]Flow` (e.g., `OnboardingFlow`, `CheckoutFlow`)

2. **Compose Page Objects:**
   - Instantiate Page Objects involved in journey
   - Example:
     ```dart
     class OnboardingFlow {
       final welcome = WelcomePage();
       final login = LoginPage();
       final home = HomePage();
     }
     ```

3. **Define Flow Completion Method:**
   - Method that executes complete journey
   - Uses Page Object actions
   - Example:
     ```dart
     Future<void> complete(WidgetTester tester) async {
       await welcome.tapGetStarted(tester);
       await login.login(tester, 'test@example.com', 'password123');
       await home.verifyLoaded(tester);
     }
     ```

4. **Use Test Fixtures:**
   - Import fixtures from Ashok
   - Use deterministic test data
   - Example:
     ```dart
     import '../fixtures/user_fixture.dart';

     Future<void> completeWithUser(WidgetTester tester, User user) async {
       await welcome.tapGetStarted(tester);
       await login.login(tester, user.email, user.password);
       await home.verifyLoaded(tester);
     }
     ```

5. **Export Flow Objects:**
   - Create `integration_test/flows/index.dart` (or `index.ts`)
   - Export all Flow Object classes

**Quality Check:**
- Flow Object exists per journey from test-architecture.md
- Flow composes correct Page Objects in sequence
- Flow completion method covers full journey
- Flows use test fixtures (not hard-coded data)
```

**New Section: Generate Integration Tests** (add after Flow Objects):

```markdown
## Step N.4: Generate Integration Tests

**Input:** test-architecture.md, Page Objects, Flow Objects, test fixtures

**Output:** Integration test files in `integration_test/tests/`

**Procedure:**

1. **For Each Feature:**
   - Create test file: `integration_test/tests/[feature]_test.dart` (or `.test.tsx`)
   - Group related tests under feature name

2. **Generate Test Cases:**
   - **Flow-based tests:** Use Flow Objects for multi-screen journeys
   - **Screen-based tests:** Use Page Objects for single-screen interactions
   - **Edge case tests:** Test error states, validation, edge conditions

3. **Flow-Based Test Example:**
   ```dart
   testWidgets('User completes onboarding flow', (tester) async {
     await tester.pumpWidget(MyApp());

     final flow = OnboardingFlow();
     await flow.complete(tester);

     expect(find.byKey(const ValueKey('home_screen')), findsOneWidget);
   });
   ```

4. **Screen-Based Test Example:**
   ```dart
   testWidgets('Login shows error for invalid credentials', (tester) async {
     await tester.pumpWidget(MyApp());

     final loginPage = LoginPage();
     await loginPage.login(tester, 'wrong@example.com', 'wrongpass');

     await loginPage.expectErrorVisible(tester);
     expect(find.text('Invalid credentials'), findsOneWidget);
   });
   ```

5. **Use Test Fixtures:**
   ```dart
   testWidgets('User logs in with valid credentials', (tester) async {
     await tester.pumpWidget(MyApp());

     final user = UserFixture.validUser();
     final loginPage = LoginPage();
     await loginPage.login(tester, user.email, user.password);

     expect(find.byKey(const ValueKey('home_screen')), findsOneWidget);
   });
   ```

6. **Test Organization:**
   - Group by feature: `group('User Authentication', () { ... })`
   - Descriptive test names: 'User can log in with valid credentials'
   - Setup/teardown if needed

7. **Run Tests and Fix Issues:**
   - Execute: `flutter test integration_test/` or `npm test`
   - Fix timing issues (add `pumpAndSettle()` after navigation)
   - Fix state pollution (ensure tests are isolated)
   - Achieve >95% pass rate

**Quality Check:**
- Integration tests exist per feature
- Tests use Page/Flow Objects (not direct widget access)
- Tests use fixtures (not hard-coded data)
- Tests are readable (describe user behavior)
- Test suite passes reliably
```

**Section: Revision History**

Add entry:
```markdown
| 1.1 | 2025-12-18T00:00:00Z | Added widget key, Page Object, Flow Object, integration test generation (ROME-PROP-006) |
```

---

### Phase 3 Verification Checklist

- [ ] ROME-PHASE-006 v1.1: Layer responsibilities include test generation
- [ ] ROME-PHASE-006 v1.1: Exit criteria include test coverage
- [ ] ROME-PHASE-006 v1.1: Quality Gate 6 added
- [ ] ROME-PHASE-006 v1.1: Feature implementation flow includes test generation
- [ ] ROME-PHASE-006 v1.1: Test coverage section updated
- [ ] ROME-PHASE-006 v1.1: Revision history updated
- [ ] ROME-ROBOT-010 v1.1: Test fixture generation step added
- [ ] ROME-ROBOT-010 v1.1: Revision history updated
- [ ] ROME-ROBOT-008 v1.1: API integration test and mock service generation added
- [ ] ROME-ROBOT-008 v1.1: Revision history updated
- [ ] ROME-ROBOT-007 v1.1: Widget key, Page Object, Flow Object, test generation steps added
- [ ] ROME-ROBOT-007 v1.1: Steps sequenced correctly (keys → Page Objects → Flow Objects → tests)
- [ ] ROME-ROBOT-007 v1.1: Revision history updated
- [ ] Cross-reference: All robot procedures align with ROME-PHASE-006 requirements
- [ ] Code examples: Consistent syntax across all robot definitions

---

### Phase 4: Metadata & Documentation

**Objective:** Update CHANGELOG, commit changes.

**Duration:** 0.5 hours

**Documents:**

1. **CHANGELOG.md**
   - Location: `/CHANGELOG.md`

2. **Git commit**

**Changes:**

#### CHANGELOG.md

Add new entry at top:

```markdown
## [2025-12-18] - Integration Testing Framework (ROME-PROP-006)

### Implemented

**P03 (Design) - PMA:**
- **ROME-PHASE-004 v2.2**: Added test-architecture.md schema
  - Page Object mappings (screen → class → finders/actions)
  - Flow Object mappings (journey → class → screens)
  - Test fixture specifications (entity → class → variants)
  - Widget key strategy convention
  - Mock service requirements
  - Test environment configuration
  - Updated actionlist schema with test stories

- **ROME-ROBOT-003 v1.7**: Added Step 10.5: Design test architecture
  - Map screens to Page Objects
  - Map journeys to Flow Objects
  - Define widget key strategy
  - Specify test fixtures per entity
  - Document mock services
  - Add test stories to actionlist
  - Updated Architecture Review to include test architecture

**P04 (Config) - Lucien:**
- **ROME-PHASE-005 v1.3**: Added test infrastructure requirements
  - Test directory structure specification
  - Test dependency installation per tech stack
  - Test environment configuration (.env.test)
  - Test configuration files (jest.config.js, etc.)
  - CI/CD test stage setup
  - Test command documentation

- **ROME-ROBOT-009 v1.1**: Added test infrastructure scaffolding step
  - Create test directory structure
  - Install test dependencies
  - Configure test environment
  - Create test config files
  - Update CI/CD pipeline
  - Document test commands

**P05 (Generation) - Layer Robots:**
- **ROME-PHASE-006 v1.1**: Added test generation requirements
  - Updated layer responsibilities to include test generation
  - Added Quality Gate 6: Test Coverage Complete
  - Updated feature implementation flow with test steps
  - Updated traceability requirements with test coverage

- **ROME-ROBOT-010 v1.1** (Ashok): Added test fixture generation
  - Generate fixture classes per entity
  - Create deterministic test data variants
  - Export fixtures for use by Reena and Charlie

- **ROME-ROBOT-008 v1.1** (Reena): Added API integration test generation
  - Generate integration tests per endpoint
  - Create mock service implementations
  - Configure test environment with mocks

- **ROME-ROBOT-007 v1.1** (Charlie): Added comprehensive test generation
  - Add widget keys to interactive UI elements
  - Generate Page Object classes per screen
  - Generate Flow Object classes per user journey
  - Generate integration tests using Page/Flow Objects

### Rationale
- Addresses lack of test architecture in ROME framework
- Enables deterministic, maintainable integration tests
- Follows Page Object pattern (industry best practice)
- Eliminates brittle, hard-coded tests
- Provides 80%+ integration test coverage from day 1

### Pattern
```
Feature Implementation + Test Generation:
- STORY-[EPIC]-[FEAT]-1-db: Database implementation (Ashok)
- STORY-[EPIC]-[FEAT]-2-db: Test fixtures (Ashok)
- STORY-[EPIC]-[FEAT]-1-api: API implementation (Reena)
- STORY-[EPIC]-[FEAT]-2-api: API integration tests (Reena)
- STORY-[EPIC]-[FEAT]-1-ui: UI implementation (Charlie)
- STORY-[EPIC]-[FEAT]-2-ui: Page Objects (Charlie)
- STORY-[EPIC]-[FEAT]-3-ui: Flow Objects + tests (Charlie)
```

### Impact
- **P03 (Design)**: PMA designs test architecture, adds ~15% design effort
- **P04 (Config)**: Lucien scaffolds test infrastructure, one-time setup
- **P05 (Generation)**: All robots generate test artifacts, adds ~20% implementation effort
- **Overall**: ~18% project effort increase, high long-term value

### Related Documents
- ROME-PROP-006: Integration Testing Framework Integration
- Review: `/ROME_framework_maintenance/reviews/configuring-integration-testing.review.md`
- ROME-PHASE-004, ROME-ROBOT-003 (P03)
- ROME-PHASE-005, ROME-ROBOT-009 (P04)
- ROME-PHASE-006, ROME-ROBOT-007/008/010 (P05)

---
```

---

## Mid-Implementation Review Gate

**Trigger:** After Phase 2 complete, before Phase 3

**Purpose:** Verify P03-P04 cohesion before proceeding to P05 changes

**Checklist:**

### Cross-Phase Consistency

- [ ] Test architecture schema in ROME-PHASE-004 matches PMA Step 10.5 procedure
- [ ] Test infrastructure requirements in ROME-PHASE-005 reference test-architecture.md correctly
- [ ] Lucien scaffolding step creates directories matching test-architecture.md schema
- [ ] P04 exit criteria verify P03 outputs exist

### Terminology Consistency

- [ ] "Page Object" used uniformly (not "Page Object class", "PageObject", "page object")
- [ ] "Flow Object" used uniformly
- [ ] "widget key" used uniformly (not "Widget key", "widget keys", "key")
- [ ] "test fixture" used uniformly
- [ ] "integration test" used uniformly

### Reference Integrity

- [ ] All document UIDs referenced correctly (ROME-PHASE-004, not ROME-PHASE-004.md)
- [ ] All file paths valid (`ARTIFACTS/dev/design/test-architecture.md`)
- [ ] All cross-references bidirectional (if A references B, B should reference A)

### Schema Completeness

- [ ] test-architecture.md schema includes all required sections
- [ ] Test directory structure complete (config/, pages/, flows/, fixtures/, tests/)
- [ ] Test dependencies specified per tech stack (Flutter, React, Python)
- [ ] Test environment variables documented

### Procedural Completeness

- [ ] PMA Step 10.5 generates complete test-architecture.md
- [ ] Lucien scaffolding step creates all directories
- [ ] Lucien scaffolding step installs all dependencies
- [ ] Lucien scaffolding step configures test environment

**Decision Point:**
- [ ] PASS → Proceed to Phase 3
- [ ] FAIL → Fix issues, re-verify

---

## Final Review Gate

**Trigger:** After Phase 4 complete

**Purpose:** Verify full framework cohesion before commit

**Checklist:**

### Phase Integration

- [ ] P03 outputs (test-architecture.md) consumed by P04 (Lucien)
- [ ] P04 outputs (test directories) consumed by P05 (robots)
- [ ] P05 robots reference test-architecture.md correctly

### Robot Coordination

- [ ] Ashok generates fixtures → Reena uses fixtures → Charlie uses fixtures
- [ ] Reena generates mock services → Charlie uses mock services
- [ ] Charlie generates Page Objects → Flow Objects use Page Objects → tests use both

### Story ID Consistency

- [ ] Test stories follow pattern: `STORY-[EPIC]-[FEAT]-#-[LAYER]`
- [ ] Even-numbered sequences used for test artifacts
- [ ] Test stories included in actionlist.md schema example

### Exit Criteria Alignment

- [ ] P03 exit criteria: test-architecture.md complete
- [ ] P04 exit criteria: test directories created, dependencies installed
- [ ] P05 exit criteria: Page Objects complete, Flow Objects complete, tests passing

### Quality Gate Alignment

- [ ] P03 Architecture Review includes test architecture
- [ ] P04 scaffolding manifest includes test infrastructure
- [ ] P05 Quality Gate 6 validates test coverage

### Traceability

- [ ] Screen → Page Object traceable
- [ ] Journey → Flow Object traceable
- [ ] Entity → Fixture traceable
- [ ] Endpoint → API test traceable

### Documentation Completeness

- [ ] All revision histories updated
- [ ] All version numbers incremented correctly
- [ ] CHANGELOG entry complete
- [ ] All cross-references valid

### Code Example Consistency

- [ ] Flutter examples use consistent syntax
- [ ] TypeScript examples use consistent syntax
- [ ] Python examples use consistent syntax
- [ ] All examples compile/are syntactically valid

**Decision Point:**
- [ ] PASS → Proceed to commit
- [ ] FAIL → Fix issues, re-verify

---

## Post-Implementation Cohesion Review Protocol

### Purpose

Systematic verification that ROME-PROP-006 implementation maintains framework internal cohesion.

### Cohesion Dimensions

#### 1. Terminological Cohesion

**Check:** All new terms defined in lexicon, used consistently

- [ ] Add to ROME-LEX-001:
  - Page Object: "Test abstraction representing single screen with finders, actions, assertions"
  - Flow Object: "Test abstraction representing multi-screen user journey using Page Objects"
  - Widget Key: "Stable ValueKey identifier for Flutter widget, used by Page Object finders"
  - Test Fixture: "Deterministic test data class providing entity variants for testing"
  - Mock Service: "Test implementation of external service with deterministic responses"

- [ ] Verify usage consistency across all updated documents
- [ ] Check for synonyms or variations (e.g., "page object class" vs "Page Object")

#### 2. Structural Cohesion

**Check:** Phase boundaries respected, no scope creep

- [ ] P03 only designs test architecture (does not scaffold)
- [ ] P04 only scaffolds infrastructure (does not generate code)
- [ ] P05 only generates test code (does not design architecture)
- [ ] No design decisions leak into P04/P05
- [ ] No implementation details leak into P03

#### 3. Dependency Cohesion

**Check:** Dependencies flow correctly across phases

```
P03 (Design) → test-architecture.md
    ↓
P04 (Config) → reads test-architecture.md → creates test directories
    ↓
P05 (Generation) → reads test-architecture.md + test directories → generates test code
```

- [ ] P04 entry criteria include P03 outputs
- [ ] P05 entry criteria include P04 outputs
- [ ] No circular dependencies
- [ ] No missing dependencies

#### 4. Robot Cohesion

**Check:** Robot responsibilities clear, no overlap

| Robot | Test Responsibilities | Does NOT Do |
|-------|----------------------|-------------|
| PMA | Design test architecture | Generate test code |
| Lucien | Scaffold test infrastructure | Design architecture, generate code |
| Ashok | Generate test fixtures | Generate Page/Flow Objects |
| Reena | Generate API tests, mock services | Generate UI tests |
| Charlie | Generate Page/Flow Objects, UI tests | Generate fixtures, API tests |

- [ ] No overlapping responsibilities
- [ ] Clear handoff points documented
- [ ] All test artifacts assigned to specific robot

#### 5. Artifact Cohesion

**Check:** Artifacts well-defined, traceable

- [ ] test-architecture.md schema complete
- [ ] All P05 robots reference test-architecture.md
- [ ] All generated test artifacts match schema
- [ ] No orphan artifacts (generated but not specified)
- [ ] No missing artifacts (specified but not generated)

#### 6. Principle Cohesion

**Check:** Changes align with ROME core principles

- [ ] **Principle 1 (Traceability):** Screen → Page Object → tests traceable
- [ ] **Principle 2 (Quality Assurance):** Quality Gate 6 validates test coverage
- [ ] **Principle 3 (Phase Decomposition):** Test work correctly decomposed across phases
- [ ] **Principle 4 (Modularity):** Page/Flow Objects are modular, reusable
- [ ] **Principle 5 (Single Source of Truth):** test-architecture.md is SSOT for test design
- [ ] **Principle 6 (Incremental Validation):** Tests validate each layer incrementally
- [ ] **Principle 7 (Explicit Specifications):** Test specifications explicit in P03
- [ ] **Principle 8 (Terminological Integrity):** Test terms align with industry standards

#### 7. Schema Cohesion

**Check:** New schemas consistent with existing schemas

- [ ] test-architecture.md follows ROME document standards
- [ ] YAML format matches tech-stack.yaml pattern
- [ ] Schema sections parallel existing schemas (Inputs, Outputs, Format)
- [ ] Schema validation approach consistent with other schemas

#### 8. Procedural Cohesion

**Check:** Robot procedures follow consistent patterns

- [ ] All procedures have Input/Output/Procedure/Quality Check sections
- [ ] All procedures reference source documents
- [ ] All procedures include examples
- [ ] All procedures define verification steps
- [ ] Step numbering consistent within robot definitions

#### 9. Lexical Cohesion

**Check:** Language consistency across documents

- [ ] Imperative voice in procedures ("Create test file", not "Test file is created")
- [ ] Present tense in specifications ("test-architecture.md MUST include...")
- [ ] Consistent capitalization (Page Object, Flow Object, not page object, flow object)
- [ ] Consistent acronyms (UI, API, not ui, api)

#### 10. Versioning Cohesion

**Check:** Version increments logical and documented

- [ ] Minor version bumps (v1.0 → v1.1) for additive changes
- [ ] Major version bumps (v1.x → v2.0) if breaking changes
- [ ] Revision history entries accurate and complete
- [ ] Date stamps correct (ISO 8601 format)

---

## Cohesion Review Execution

### When to Execute

1. **Mid-Implementation Review Gate:** After Phase 2
2. **Final Review Gate:** After Phase 4
3. **Post-Commit Review:** Within 24 hours of merge

### Review Procedure

1. **Automated Checks:**
   - Run grep for terminology consistency
   - Validate YAML schemas
   - Check cross-references
   - Verify file paths exist

2. **Manual Review:**
   - Read updated documents sequentially (P03 → P04 → P05)
   - Trace artifact flow across phases
   - Verify robot procedures are executable
   - Check examples compile/run

3. **Cohesion Scoring:**
   - Each dimension scored: PASS / MINOR ISSUE / MAJOR ISSUE
   - PASS: No issues found
   - MINOR ISSUE: Inconsistency, does not break framework (e.g., capitalization)
   - MAJOR ISSUE: Breaks cohesion (e.g., circular dependency, missing artifact)

4. **Issue Resolution:**
   - MINOR ISSUES: Fix in follow-up commit
   - MAJOR ISSUES: Fix before commit (block merge)

---

## Commit Strategy

### Commit Sequence

**Single Atomic Commit Preferred:**

```bash
git add \
  ROME/life-cycle/P03-design/operations-guidelines.md \
  ROME/robot-templates/pma/CLAUDE.md \
  ROME/life-cycle/P04-config/operations-guidelines.md \
  ROME/robot-templates/lucien/CLAUDE.md \
  ROME/life-cycle/P05-generation/operations-guidelines.md \
  ROME/robot-templates/ashok/CLAUDE.md \
  ROME/robot-templates/reena/CLAUDE.md \
  ROME/robot-templates/charlie/CLAUDE.md \
  ROME/framework-governance/uid-registry.md \
  CHANGELOG.md \
  ROME_framework_maintenance/proposals/ROME-PROP-006-integration-testing-framework.md

git commit -m "[P00] [ARCHIE] Implement ROME-PROP-006: Integration Testing Framework

Added test architecture design, scaffolding, and generation across P03-P05.

P03 (Design):
- ROME-PHASE-004 v2.2: Added test-architecture.md schema
- ROME-ROBOT-003 v1.7: Added Step 10.5 test architecture design

P04 (Config):
- ROME-PHASE-005 v1.3: Added test infrastructure requirements
- ROME-ROBOT-009 v1.1: Added test scaffolding step

P05 (Generation):
- ROME-PHASE-006 v1.1: Added test generation requirements, Quality Gate 6
- ROME-ROBOT-010 v1.1: Added test fixture generation (Ashok)
- ROME-ROBOT-008 v1.1: Added API test and mock service generation (Reena)
- ROME-ROBOT-007 v1.1: Added Page Object, Flow Object, test generation (Charlie)

Test Architecture:
- PMA designs: Page Objects, Flow Objects, fixtures, widget keys, mock services
- Lucien scaffolds: Test directories, dependencies, environment, CI/CD
- Layer robots generate: Fixtures (Ashok), API tests (Reena), Page/Flow Objects (Charlie)

Pattern: STORY-[EPIC]-[FEAT]-#-[LAYER] includes test stories (even-numbered)
Effort: ~18% increase, delivers 80%+ integration test coverage
Benefit: Deterministic tests, Page Object pattern, test architecture from design phase

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

**Alternative: Phased Commits (if issues found)**

If mid-review finds issues, commit in phases:
1. Phase 1-2 (P03-P04) after mid-review passes
2. Phase 3-4 (P05, metadata) after final review passes

---

## Rollback Plan

**If Major Cohesion Issues Found Post-Commit:**

1. **Create rollback branch:**
   ```bash
   git checkout -b rollback-prop-006
   git revert [commit-hash]
   ```

2. **Document issues:**
   - Create `/ROME_framework_maintenance/reviews/ROME-PROP-006-rollback.md`
   - List all cohesion issues found
   - Categorize by dimension (terminological, structural, etc.)

3. **Fix issues offline:**
   - Create fix branch
   - Apply fixes
   - Re-run cohesion review
   - Commit when all checks pass

4. **Re-apply:**
   - Merge fix branch
   - Update CHANGELOG with rollback note

---

## Success Criteria

**Implementation Complete When:**

- [ ] All 8 documents updated with correct version numbers
- [ ] All revision histories accurate
- [ ] CHANGELOG entry complete
- [ ] Mid-implementation review passed
- [ ] Final review gate passed
- [ ] All 10 cohesion dimensions scored PASS or MINOR ISSUE
- [ ] Commit successful
- [ ] Post-commit review passed within 24 hours

---

## Estimated Timeline

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Phase 1 (P03) | 2.0h | 2.0h |
| Mid-Review Gate | 0.5h | 2.5h |
| Phase 2 (P04) | 1.5h | 4.0h |
| Phase 3 (P05) | 2.5h | 6.5h |
| Phase 4 (Metadata) | 0.5h | 7.0h |
| Final Review Gate | 1.0h | 8.0h |
| **Total** | **8.0h** | - |

**Post-commit review:** 0.5h (within 24 hours)

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 1.0 | 2025-12-18T00:00:00Z | Initial implementation plan for ROME-PROP-006 |
