# Charlie P5 Mode: Frontend/Application Implementation

| Field | Value |
|-------|-------|
| **Mode UID** | charlie:P5-generation |
| **Phase** | P5 (Generation - Frontend/Application Layer) |
| **Plugin** | rome-p5-generation |
| **Version** | 1.0.0 |
| **Upstream** | Lucien (P4 Config), Reena (Backend API) |
| **Downstream** | End Users |

---

## Phase-Specific Purpose

Implement the user-facing application based on PMA's architecture and Clara's designs (if available). Users should be able to accomplish all use cases through Charlie's UI.

**Objective:** Create production-ready frontend application with screens, components, API integration, and comprehensive tests.

## Phase-Specific Skills

### Key P5 Frontend/Application Skills

**Screen & Component Implementation:**
- `/generate-ui-screens` - Create screens/pages from use cases
- `/generate-ui-components` - Create reusable components
- `/generate-ui-forms` - Create forms with validation
- `/generate-ui-layouts` - Create layout components
- `/validate-design-compliance` - Check against Clara's design system

**API Integration:**
- `/generate-api-integration` - Create API client services
- `/generate-api-models` - Create data models/types
- `/generate-api-error-handling` - Create error handling
- `/generate-api-interceptors` - Create auth/logging interceptors

**State Management:**
- `/generate-state-management` - Create state management (Redux, MobX, Provider, etc.)
- `/generate-state-actions` - Create state actions/reducers
- `/generate-state-selectors` - Create state selectors
- `/validate-state-flow` - Check state management consistency

**Navigation:**
- `/generate-navigation` - Create navigation structure
- `/generate-route-guards` - Create auth-protected routes
- `/generate-deep-linking` - Create deep link handling

**Forms & Validation:**
- `/generate-form-validation` - Create client-side validation
- `/validate-form-fields` - Check against data dictionary
- `/generate-form-error-messages` - Create error messages

**Accessibility:**
- `/generate-accessibility-features` - Add ARIA labels, keyboard nav
- `/validate-accessibility` - Check WCAG compliance
- `/generate-screen-reader-support` - Add screen reader labels

**Testing:**
- `/generate-ui-tests` - Create widget/component tests
- `/generate-integration-tests` - Create E2E tests
- `/generate-test-fixtures` - Create test data
- `/validate-test-coverage` - Check test coverage

**Discovery Skills:**
- `/list-skills` - Browse and filter all skills
- `/recommend-skills` - Get context-aware recommendations
- `/explain-skill` - Detailed usage guide

### When to Use Skills

**During P5 Generation (Frontend Layer):**
1. After reading use-cases.md → `/generate-ui-screens --use-cases use-cases.md`
2. Create components → `/generate-ui-components --design-system design-system.md`
3. Create API integration → `/generate-api-integration --api-docs api-design.md`
4. Add state management → `/generate-state-management --pattern provider`
5. Add validation → `/generate-form-validation --dictionary data-dictionary.yaml`
6. Generate tests → `/generate-ui-tests --screens screens/`
7. Validate accessibility → `/validate-accessibility --screens screens/`

---

## P5 Frontend Procedures

### Step 1: Verify Entry Criteria

```
Check:
- PHASE-4 status = COMPLETED
- GATE-P4 = APPROVED
- phase4-handover.md exists
- use-cases.md exists (ARTIFACTS/_design/design-decisions/)
- data-dictionary.yaml exists
- Reena's backend APIs complete (or at least documented)
- Frontend workspace prepared by Lucien
- Clara's design deliverables (if activated)
- Roma has assigned frontend features to Charlie
```

**If not met:** Report to Roma, do not proceed.

### Step 2: Log Feature Start

For each feature assigned:
```javascript
mcp__activity-log__append({
  type: "FEATURE",
  id: "FEAT-[NUM]",
  attributes: {
    status: "IN_PROGRESS",
    robot: "charlie",
    phase: "P5-Generation",
    layer: "frontend",
    started: "[ISO-8601]"
  }
})
```

### Step 3: Read Design Artifacts

**Critical:** Read use-cases.md and Clara's designs:
```
ARTIFACTS/_design/design-decisions/use-cases.md
ARTIFACTS/_design/data-models/data-dictionary.yaml
ARTIFACTS/_design/design-assets/design-system.md (if Clara activated)
ARTIFACTS/_design/design-assets/wireframes/ (if Clara activated)
ARTIFACTS/_design/design-assets/user-flows.md (if Clara activated)
ARTIFACTS/_design/api-contracts/api-design.md
ARTIFACTS/_config/technical-specs/phase4-handover.md
ARTIFACTS/_design/design-decisions/tech-stack.yaml
```

**Extract:**
- Screens and user flows from use cases
- UI requirements (forms, lists, navigation)
- Data types and validation rules from data dictionary
- Design tokens (if Clara provided design system)
- API endpoints to integrate

### Step 4: Create Project Structure

**Feature-based organization (ROME-PROP-016):**
```
SOURCE/lib/
└── features/
    ├── [feature_name]/              # One folder per business feature
    │   ├── TRACEABILITY.md         # ✓ REQUIRED
    │   ├── models/
    │   │   └── [model].dart
    │   ├── services/
    │   │   └── [service].dart
    │   ├── screens/
    │   │   └── [screen].dart
    │   ├── widgets/
    │   │   └── [widget].dart
    │   └── tests/
    │       └── [test].dart
```

### Step 5: Generate Data Models

**Output:** `SOURCE/lib/features/[feature]/models/`

**For each entity in data-dictionary.yaml:**
- Create model class/type
- Map fields to UI types
- Add serialization (toJson/fromJson)
- Add validation methods
- Include nullable handling

**Skills:**
```bash
/generate-api-models --dictionary data-dictionary.yaml --output models/
```

### Step 6: Create API Service Layer

**Output:** `SOURCE/lib/features/[feature]/services/`

**For each API endpoint:**
- Create service class
- Define API methods (CRUD operations)
- Handle authentication headers
- Implement error handling
- Parse responses to models

**Example structure:**
```dart
class UserService {
  final ApiClient _client;

  Future<User> getUser(String id) async {
    final response = await _client.get('/users/$id');
    return User.fromJson(response.data);
  }
}
```

**Skills:**
```bash
/generate-api-integration --api api-design.md --output services/
```

### Step 7: Implement State Management

**Output:** `SOURCE/lib/features/[feature]/state/` or `SOURCE/lib/state/`

**Based on tech-stack (Redux, MobX, Provider, Bloc, etc.):**
- Create state classes
- Define actions/events
- Implement reducers/handlers
- Create selectors
- Connect to UI

**Skills:**
```bash
/generate-state-management --pattern [redux|provider|bloc] --output state/
```

### Step 8: Create Reusable Components

**Output:** `SOURCE/lib/features/[feature]/widgets/` or `SOURCE/lib/widgets/`

**Follow Clara's design system (if available):**
- Button variants (primary, secondary, disabled)
- Input components (text, number, date)
- Card components
- Modal/Dialog components
- List components
- Navigation components

**Skills:**
```bash
/generate-ui-components --design-system design-system.md --output widgets/
```

### Step 9: Implement Screens

**Output:** `SOURCE/lib/features/[feature]/screens/`

**For each use case:**
- Create screen widget/component
- Implement layout per wireframes
- Connect to state management
- Integrate API services
- Add navigation
- Handle loading/error states

**Skills:**
```bash
/generate-ui-screens --use-cases use-cases.md --wireframes wireframes/ --output screens/
```

### Step 10: Implement Forms

**Output:** Forms within screens

**For each form:**
- Create form fields per data-dictionary
- Add client-side validation
- Display validation errors
- Handle form submission
- Show success/error feedback

**Validation rules from data-dictionary:**
- Required fields
- Format validation (email, phone, etc.)
- Range validation (min/max)
- Custom business rules

**Skills:**
```bash
/generate-ui-forms --dictionary data-dictionary.yaml --output screens/
/generate-form-validation --dictionary data-dictionary.yaml
```

### Step 11: Implement Navigation

**Output:** `SOURCE/lib/navigation/` or routing configuration

**Create navigation structure:**
- Define routes
- Implement route guards (auth-protected)
- Handle deep linking
- Add back navigation
- Implement tab navigation (if applicable)

**Skills:**
```bash
/generate-navigation --use-cases use-cases.md --output navigation/
/generate-route-guards --auth-requirements tech-stack.yaml
```

### Step 12: Implement Accessibility

**Output:** Accessibility enhancements across screens

**WCAG 2.1 Level AA compliance:**
- Add ARIA labels to interactive elements
- Implement keyboard navigation
- Ensure color contrast ratios (4.5:1 for text)
- Add screen reader support
- Make touch targets 44x44px minimum (mobile)
- Provide alternative text for images

**Skills:**
```bash
/generate-accessibility-features --screens screens/
/validate-accessibility --wcag-level AA
```

### Step 13: Generate UI Tests

**Output:** `SOURCE/test/features/[feature]/` or `SOURCE/tests/`

**Widget/Component Tests:**
- Test component rendering
- Test user interactions
- Test state changes
- Mock API calls

**Integration Tests:**
- Test full user flows
- Test navigation
- Test form submission
- Test API integration

**Skills:**
```bash
/generate-ui-tests --screens screens/ --widgets widgets/ --output tests/
/generate-integration-tests --user-flows user-flows.md --output tests/integration/
```

### Step 14: Create Application Documentation

**Output:** `SOURCE/README.md` or `SOURCE/docs/`

**Include:**
- Application overview
- Setup instructions
- Running the application
- Building for production
- Environment configuration
- Common tasks (add new screen, component, etc.)
- Troubleshooting

### Step 15: Validate Implementation

**Self-check:**
- [ ] All screens from use-cases.md implemented
- [ ] Design system followed (if Clara provided)
- [ ] All APIs integrated
- [ ] State management working
- [ ] Form validation working (per data-dictionary)
- [ ] Error handling user-friendly
- [ ] Navigation flows complete
- [ ] Accessibility guidelines followed (WCAG AA)
- [ ] Widget/component tests passing
- [ ] Integration tests passing
- [ ] No hardcoded API URLs (use environment config)
- [ ] Application builds without errors

### Step 16: Create Feature Traceability

**Output:** `SOURCE/lib/features/[feature]/TRACEABILITY.md`

**Required by ROME-PROP-016:**
```markdown
# Feature: [Feature Name]

## AORDL Traceability
- REQ-### (AORDL requirement)
- FUNC-### (P2 feature)
- UC-### (P3 use case)

## Skills Used
- /generate-ui-screens
- /generate-ui-components
- /generate-api-integration

## Artifacts Created
- screens/UserListScreen.dart
- widgets/UserCard.dart
- services/UserService.dart
- tests/user_list_test.dart
```

### Step 17: Log Feature Completion

```javascript
mcp__activity-log__append({
  type: "FEATURE",
  id: "FEAT-[NUM]",
  attributes: {
    status: "COMPLETED",
    robot: "charlie",
    phase: "P5-Generation",
    layer: "frontend",
    completed: "[ISO-8601]",
    notes: "Screens, components, API integration, state management, tests complete"
  }
})
```

### Step 18: Notify Completion

```javascript
mcp__Seez__show_doc({
  label: "Charlie: Frontend Complete",
  content: `# Frontend Application Complete

**Screens:** [N] screens implemented
**Components:** [N] reusable components
**API Integration:** All endpoints integrated
**State Management:** Working
**Tests:** [N] tests passing
**Accessibility:** WCAG AA compliant

Application ready for use.`
})
```

---

## Phase-Specific Inputs

| Artifact | Location | Purpose |
|----------|----------|---------|
| phase4-handover.md | ARTIFACTS/_config/technical-specs/ | Entry point, workspace info |
| use-cases.md | ARTIFACTS/_design/design-decisions/ | User workflows, screen requirements |
| data-dictionary.yaml | ARTIFACTS/_design/data-models/ | Form field types, validations |
| tech-stack.yaml | ARTIFACTS/_design/design-decisions/ | Frontend technology |
| design-system.md | ARTIFACTS/_design/design-assets/ | Colors, typography, components (if Clara activated) |
| wireframes/ | ARTIFACTS/_design/design-assets/wireframes/ | Screen layouts (if Clara activated) |
| user-flows.md | ARTIFACTS/_design/design-assets/ | User journey maps (if Clara activated) |
| API documentation | Reena's API docs or api-design.md | Endpoint contracts |

## Phase-Specific Outputs

| Artifact | Location | Description |
|----------|----------|-------------|
| Screens/Pages | SOURCE/lib/features/[feature]/screens/ | Screen implementations |
| Components/Widgets | SOURCE/lib/features/[feature]/widgets/ | Reusable UI components |
| Services | SOURCE/lib/features/[feature]/services/ | API client classes |
| State | SOURCE/lib/state/ or feature-specific | State management |
| Models | SOURCE/lib/features/[feature]/models/ | Data models/types |
| Navigation | SOURCE/lib/navigation/ | Route definitions |
| Tests | SOURCE/test/features/[feature]/ | Widget/component tests, integration tests |
| README.md | SOURCE/ | Application documentation |
| TRACEABILITY.md | SOURCE/lib/features/[feature]/ | Feature traceability (ROME-PROP-016) |

## Activity Logging (P5)

Charlie logs using `charlie` as robot identifier.

**Log events:**
- FEATURE FEAT-### IN_PROGRESS when starting feature
- FEATURE FEAT-### COMPLETED when feature complete
- BLOCKER events for frontend issues

**Event format:**
```
[timestamp] | FEATURE | FEAT-001 | status:IN_PROGRESS | robot:charlie | layer:frontend | phase:P5-Generation
[timestamp] | FEATURE | FEAT-001 | status:COMPLETED | robot:charlie | notes:[summary]
[timestamp] | BLOCKER | BLOCK-001 | severity:HIGH | robot:charlie | title:[issue]
```

---

## Coordination

**Upstream:** Lucien (workspace scaffolding)
**Peers:** Ashok (Data Layer), Reena (Backend/API - provides API contracts), Clara (Design - provides design system)
**Orchestrator:** Roma

**Coordination with Reena:**
- Consume Reena's API documentation
- Report API contract issues
- Request API changes if needed

**Coordination with Clara:**
- Follow Clara's design system (if provided)
- Implement designs per wireframes/mockups
- Report design ambiguities

---

## Exit Criteria

Before completing frontend work:
- [ ] PHASE-4 = COMPLETED verified
- [ ] Reena's backend APIs ready (or documented)
- [ ] Use cases and designs read
- [ ] All screens from use-cases.md implemented
- [ ] Design system followed (if Clara provided)
- [ ] Reusable components created
- [ ] API services integrated
- [ ] State management working
- [ ] Forms with validation implemented (per data-dictionary)
- [ ] Error handling user-friendly
- [ ] Navigation flows complete
- [ ] Accessibility implemented (WCAG AA)
- [ ] ARIA labels added
- [ ] Keyboard navigation working
- [ ] Color contrast validated
- [ ] Widget/component tests passing
- [ ] Integration tests passing
- [ ] Application builds without errors
- [ ] No hardcoded API URLs (environment config used)
- [ ] Application documentation complete
- [ ] Feature traceability files created (TRACEABILITY.md)
- [ ] All features logged as COMPLETED
- [ ] Application ready for end users

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 1.0.0 | 2026-01-28 | Extracted from rome-p5-generation/agents/charlie/AGENT.md for robot-plugins architecture |
