---
name: aordl-validation
description: Validate AORDL requirements against anti-patterns, completeness, and quality standards. Use when creating REQ-###.yaml files, resolving ambiguities, or preparing for GATE-P1. Ensures 100% STRICT validation pass rate.
---

# AORDL Validation Skill

## Purpose

Talib's primary responsibility: transform raw sponsor materials into AORDL requirements (Actor-Oriented Requirements Definition Language) with zero ambiguities and 100% quality.

## When to Use

Invoke this skill when:
- **Creating REQ-###.yaml**: Validate all 13 required fields
- **Detecting anti-patterns**: Check for UI language, technical jargon, generic actors
- **Resolving ambiguities**: Ensure all OpenQuestions are RESOLVED
- **Preparing for GATE-P1**: Self-validate before submitting to Sarah
- **Reviewing requirements catalog**: Check coverage and completeness

## Quick Reference

### AORDL 13 Required Fields

```yaml
ID: REQ-###
Actor: [SpecificRole]
Intent: [verb] [object]
Preconditions: [...]
Conditions: [...]
Postconditions: [...]
Outcomes: [...]
Invariants: [...]
NonFunctional: {...}
Errors: [...]
ScopeBoundary: {...}
OpenQuestions: [...]
CopilotMode: STRICT|GUIDED|PERMISSIVE
```

---

## Validation Checklist 1: Structure Compliance

### ✅ File Format

- [ ] **Filename**: `REQ-###.yaml` (3-digit zero-padded, e.g., REQ-001, REQ-023, REQ-142)
- [ ] **Location**: `ARTIFACTS/dev/requirements/`
- [ ] **Valid YAML**: Parses without errors
- [ ] **All 13 fields present**: No missing required fields

### ✅ ID Field

- [ ] **Format**: `REQ-###` (exactly matches filename)
- [ ] **Unique**: No duplicate IDs in catalog
- [ ] **Sequential**: No gaps in numbering (unless intentional)

---

## Validation Checklist 2: Actor Field

### ✅ Actor Specificity (CRITICAL)

**Pass:**
- ✅ "ProjectManager" - Specific role
- ✅ "TeamLead" - Specific role
- ✅ "FinanceApprover" - Specific role with clear responsibility
- ✅ "ContentCreator" - Specific user type
- ✅ "SystemAdministrator" - Specific admin role

**Fail:**
- ❌ "User" - Too generic
- ❌ "Admin" - Too generic (admin of what?)
- ❌ "System" - Technical component, not business actor
- ❌ "Manager" - Ambiguous (which kind of manager?)
- ❌ "Employee" - Too broad

### ✅ Actor Validation Rules

- [ ] **No generic terms**: Not "User", "Admin", "Manager", "System"
- [ ] **Business role**: Describes a person's job function
- [ ] **CamelCase format**: "ProjectManager", not "Project Manager" or "project_manager"
- [ ] **Singular form**: "ProjectManager", not "ProjectManagers"
- [ ] **Role, not UI**: Not "API", "Database", "Frontend" (technical components)

**GATE-P1 Blocker**: Generic actors cause GATE-P1 failure.

---

## Validation Checklist 3: Intent Field

### ✅ Intent Atomicity (CRITICAL)

**Format**: `[verb] [object]`

**Pass (Atomic):**
- ✅ "create project" - Single verb + object
- ✅ "view dashboard" - Single action
- ✅ "approve request" - Single decision
- ✅ "delete user" - Single operation
- ✅ "export report" - Single output

**Fail (Compound):**
- ❌ "create and update project" - Two actions
- ❌ "login and view dashboard" - Two steps
- ❌ "manage projects" - Ambiguous (create? update? delete? all?)
- ❌ "handle user authentication" - Vague verb
- ❌ "process data" - What does "process" mean?

### ✅ Approved Atomic Verbs

Use ONLY these verbs (or synonyms with clear atomic meaning):

**CRUD Operations:**
- create, add, insert
- read, view, display, show, list
- update, edit, modify
- delete, remove

**Actions:**
- search, filter, find
- authenticate, login, logout
- authorize, grant, revoke
- assign, unassign
- submit, send
- approve, reject
- export, download
- import, upload
- validate, verify
- calculate, compute
- notify, alert
- schedule, plan

### ✅ Ambiguous Verbs to Avoid

**Forbidden verbs** (too vague):
- ❌ manage (does this mean create, update, delete, view, or all?)
- ❌ handle (what action specifically?)
- ❌ process (what transformation?)
- ❌ deal with (meaningless)
- ❌ work with (meaningless)
- ❌ maintain (create? update? delete?)
- ❌ control (authorize? restrict? modify?)
- ❌ administer (too broad)

**Fix**: Replace with specific atomic verb.

### ✅ Intent Validation Rules

- [ ] **Single verb**: Only one action verb
- [ ] **Single object**: Only one thing being acted upon
- [ ] **Atomic action**: Cannot be decomposed further
- [ ] **No UI language**: Not "click button to create project"
- [ ] **No technical jargon**: Not "POST /api/projects"
- [ ] **Lowercase**: "create project", not "Create Project"

**GATE-P1 Blocker**: Compound or ambiguous intents cause GATE-P1 failure.

---

## Validation Checklist 4: Anti-Pattern Detection

### ❌ Anti-Pattern 1: UI Language

**Forbidden UI terms** (AORDL is UI-agnostic):
- "button", "click", "tap"
- "dropdown", "select box", "radio button"
- "modal", "dialog", "popup"
- "screen", "page", "form"
- "scroll", "swipe", "drag"
- "menu", "tab", "sidebar"

**Example Violation:**
```yaml
Intent: click submit button to create project  # ❌ Contains "click button"
```

**Fix:**
```yaml
Intent: create project  # ✅ No UI language
```

**Rationale**: AORDL describes WHAT users want to accomplish, not HOW (UI). Clara and Charlie decide UI in P3/P5.

### ❌ Anti-Pattern 2: Technical Jargon

**Forbidden technical terms** (AORDL is implementation-agnostic):
- "API", "endpoint", "HTTP POST"
- "database", "table", "query"
- "Redux", "BLoC", "state management"
- "JWT", "OAuth", "token"
- "microservice", "lambda", "serverless"

**Example Violation:**
```yaml
Actor: API  # ❌ Technical component, not business actor
Intent: POST to /users endpoint  # ❌ Technical implementation detail
```

**Fix:**
```yaml
Actor: SystemAdministrator  # ✅ Business role
Intent: create user  # ✅ Business intent
```

**Rationale**: AORDL captures business requirements. PMA decides technical implementation in P3.

### ❌ Anti-Pattern 3: Generic Actors

See "Validation Checklist 2: Actor Field" above.

### ❌ Anti-Pattern 4: Compound Intents

See "Validation Checklist 3: Intent Field" above.

### ✅ Anti-Pattern Validation

- [ ] **Zero UI language**: No "button", "click", "screen", etc.
- [ ] **Zero technical jargon**: No "API", "database", "HTTP", etc.
- [ ] **No generic actors**: No "User", "Admin", "System"
- [ ] **No compound intents**: No "and", multiple verbs

**GATE-P1 Blocker**: Any anti-pattern causes GATE-P1 failure.

---

## Validation Checklist 5: Field Completeness

### ✅ Preconditions

- [ ] **At least 1 precondition**: What must be true before action?
- [ ] **Testable**: Can verify precondition is met
- [ ] **Relevant**: Directly affects whether actor can perform intent
- [ ] **No UI language**: "User is logged in", not "Login screen is displayed"

**Examples:**
- ✅ "ProjectManager is authenticated"
- ✅ "Project exists in system"
- ✅ "User has ProjectManager role"
- ❌ "User clicked login button" (UI language)
- ❌ "N/A" or "None" (lazy, always has preconditions)

### ✅ Conditions

- [ ] **Constraints during action**: Rules enforced while action executes
- [ ] **Testable**: Can verify condition holds
- [ ] **Business rules**: Not technical implementation

**Examples:**
- ✅ "Project name must be unique within organization"
- ✅ "Budget amount must be positive"
- ✅ "Start date must be before end date"

### ✅ Postconditions

- [ ] **State guaranteed after action**: What changed?
- [ ] **Testable**: Can verify postcondition achieved
- [ ] **Observable**: System state is different

**Examples:**
- ✅ "Project exists with status ACTIVE"
- ✅ "ProjectManager is assigned as project owner"
- ✅ "Audit log entry created"
- ❌ "User sees success message" (UI, not state change)

### ✅ Outcomes

- [ ] **Observable results**: What actor sees/receives
- [ ] **Success criteria**: How to know action succeeded
- [ ] **Measurable**: Can verify outcome achieved

**Examples:**
- ✅ "Project created with ID PRJ-12345"
- ✅ "Confirmation email sent to ProjectManager"
- ✅ "Dashboard shows new project in list"
- ❌ "Success" (too vague)

### ✅ Invariants

- [ ] **Rules that never change**: Constraints always true
- [ ] **Testable**: Can verify invariant holds
- [ ] **Business rules**: Domain constraints

**Examples:**
- ✅ "Project ID is unique and immutable"
- ✅ "Project must have at least one owner"
- ✅ "Budget cannot be negative"
- ❌ "Database must be available" (technical, not business invariant)

### ✅ NonFunctional

- [ ] **Performance quantified**: Not "fast", but "< 2 seconds response time"
- [ ] **Security specified**: Authentication, authorization, encryption, compliance
- [ ] **Usability defined**: Accessibility level (WCAG A/AA/AAA), UX requirements

**Examples:**
```yaml
NonFunctional:
  Performance:
    - Response time < 2 seconds for 95% of requests
    - Support 1000 concurrent users
  Security:
    - Authentication required (JWT tokens)
    - RBAC authorization (ProjectManager role)
    - Data encrypted at rest (AES-256)
    - GDPR compliant
  Usability:
    - WCAG AA accessibility compliance
    - Mobile-responsive design
    - Multi-language support (EN, FR, ES)
```

### ✅ Errors

- [ ] **At least 2-3 error scenarios**: What can go wrong?
- [ ] **User-facing message**: Clear, actionable
- [ ] **HTTP code** (if web application)
- [ ] **User action**: What should user do?

**Example:**
```yaml
Errors:
  - error: "ProjectNameAlreadyExists"
    message: "A project with this name already exists. Please choose a different name."
    httpCode: 409
    userAction: "Choose a different project name and retry"

  - error: "InsufficientPermissions"
    message: "You do not have permission to create projects. Contact your administrator."
    httpCode: 403
    userAction: "Request ProjectManager role from administrator"
```

### ✅ ScopeBoundary

- [ ] **InScope defined**: What this requirement DOES cover
- [ ] **OutOfScope defined**: What this requirement does NOT cover
- [ ] **Clear boundaries**: Prevents scope creep

**Example:**
```yaml
ScopeBoundary:
  InScope:
    - Creating new projects with basic metadata
    - Assigning single owner to project
    - Validating project name uniqueness
  OutOfScope:
    - Editing existing projects (separate REQ-002)
    - Deleting projects (separate REQ-003)
    - Managing project teams (separate REQ-010)
```

### ✅ OpenQuestions

- [ ] **All questions RESOLVED**: Zero status=OPEN for GATE-P1
- [ ] **Decisions documented**: Who decided, when, what
- [ ] **Rationale clear**: Why decision was made

**Pass (GATE-P1):**
```yaml
OpenQuestions:
  - question: "Should project name be case-sensitive?"
    status: RESOLVED
    decision: "No, project names are case-insensitive"
    decisionDate: "2025-12-29T10:30:00Z"
    decisionBy: "Sponsor"
```

**Fail (GATE-P1 Blocker):**
```yaml
OpenQuestions:
  - question: "Should project name be case-sensitive?"
    status: OPEN  # ❌ BLOCKER - must be RESOLVED
```

**Empty is OK:**
```yaml
OpenQuestions: []  # ✅ No ambiguities
```

### ✅ CopilotMode

- [ ] **Value is STRICT, GUIDED, or PERMISSIVE**
- [ ] **Default is STRICT** (for most requirements)
- [ ] **PERMISSIVE only with sponsor approval**

**Modes:**
- **STRICT**: Exact implementation, no deviation (default)
- **GUIDED**: Framework provided, some flexibility in implementation
- **PERMISSIVE**: High-level guidance, implementation open

---

## Validation Checklist 6: Quality Standards

### ✅ Traceability

- [ ] **REQ-### in requirements catalog**: Listed with category, priority
- [ ] **Actor coverage**: All business roles represented
- [ ] **CRUD coverage**: For each entity, have create/read/update/delete requirements
- [ ] **No orphaned requirements**: Every REQ-### has clear purpose

### ✅ Consistency

- [ ] **Same Actor uses same terminology**: "ProjectManager", not sometimes "PM"
- [ ] **Same Intent format**: All lowercase, atomic verbs
- [ ] **Same error format**: All have httpCode, userAction
- [ ] **Same NonFunctional structure**: Performance, Security, Usability

### ✅ Completeness

- [ ] **All 13 fields meaningful**: Not "N/A" or "TODO"
- [ ] **No placeholders**: All content finalized
- [ ] **No copy-paste errors**: Each requirement unique

---

## Self-Validation Workflow

### Step 1: Create REQ-###.yaml

```yaml
# ARTIFACTS/dev/requirements/REQ-001.yaml
ID: REQ-001
Actor: ProjectManager
Intent: create project

Preconditions:
  - ProjectManager is authenticated
  - ProjectManager has "create_project" permission

Conditions:
  - Project name must be unique within organization
  - Project name must be 3-50 characters
  - Budget must be non-negative

Postconditions:
  - Project exists with status ACTIVE
  - ProjectManager is assigned as project owner
  - Audit log entry created

Outcomes:
  - Project created with unique ID (PRJ-#####)
  - Confirmation displayed with project ID
  - ProjectManager can access project dashboard

Invariants:
  - Project ID is unique and immutable
  - Every project has exactly one owner
  - Project status can only be: ACTIVE, ARCHIVED, DELETED

NonFunctional:
  Performance:
    - Create project completes in < 2 seconds
  Security:
    - RBAC authorization required
    - HTTPS only
  Usability:
    - WCAG AA compliance
    - Form validation provides inline feedback

Errors:
  - error: "ProjectNameAlreadyExists"
    message: "A project with this name already exists. Please choose a different name."
    httpCode: 409
    userAction: "Choose a different project name and retry"

  - error: "InsufficientPermissions"
    message: "You do not have permission to create projects."
    httpCode: 403
    userAction: "Contact administrator to request ProjectManager role"

ScopeBoundary:
  InScope:
    - Creating new projects with basic metadata (name, description, budget)
    - Validating project name uniqueness
    - Assigning creator as project owner
  OutOfScope:
    - Editing projects (REQ-002)
    - Deleting projects (REQ-003)
    - Adding team members (REQ-010)

OpenQuestions:
  - question: "Should project name be case-sensitive?"
    status: RESOLVED
    decision: "No, project names are case-insensitive for uniqueness check"
    decisionDate: "2025-12-29T10:00:00Z"
    decisionBy: "Sponsor"

CopilotMode: STRICT
```

### Step 2: Run Self-Validation

**Check all checklists above:**
1. ✅ Structure Compliance
2. ✅ Actor Specificity
3. ✅ Intent Atomicity
4. ✅ Anti-Pattern Detection
5. ✅ Field Completeness
6. ✅ Quality Standards

### Step 3: Fix Violations

**Common fixes:**

**Generic Actor:**
```yaml
# Before
Actor: User  # ❌

# After
Actor: ProjectManager  # ✅
```

**Compound Intent:**
```yaml
# Before
Intent: create and update project  # ❌

# After (split into two requirements)
# REQ-001
Intent: create project  # ✅

# REQ-002
Intent: update project  # ✅
```

**UI Language:**
```yaml
# Before
Intent: click submit button to create project  # ❌

# After
Intent: create project  # ✅
```

**Technical Jargon:**
```yaml
# Before
Actor: API  # ❌
Intent: POST to /projects endpoint  # ❌

# After
Actor: ProjectManager  # ✅
Intent: create project  # ✅
```

**Unresolved Ambiguity:**
```yaml
# Before
OpenQuestions:
  - question: "Should name be case-sensitive?"
    status: OPEN  # ❌ GATE-P1 BLOCKER

# After (ask sponsor, then update)
OpenQuestions:
  - question: "Should name be case-sensitive?"
    status: RESOLVED  # ✅
    decision: "No, case-insensitive"
    decisionDate: "2025-12-29T10:00:00Z"
    decisionBy: "Sponsor"
```

### Step 4: Log AORDL Validation

```yaml
timestamp: 2025-12-29T12:00:00Z
robot: Talib
phase: P1
action: COMPLETED
artifact: ARTIFACTS/dev/requirements/REQ-001.yaml
description: |
  REQ-001 created and validated:
  - ✓ All 13 fields complete
  - ✓ Actor specific (ProjectManager)
  - ✓ Intent atomic (create project)
  - ✓ Zero anti-patterns
  - ✓ All OpenQuestions RESOLVED
  - ✓ STRICT validation passed
status: SUCCESS
```

---

## GATE-P1 Preparation

### Before Requesting GATE-P1

Run validation on entire requirements catalog:

1. **Check all REQ-###.yaml files**:
   - All 13 fields present
   - No anti-patterns
   - All OpenQuestions RESOLVED

2. **Check requirements-catalog.md**:
   - All REQ-### listed
   - Coverage complete (actors, CRUD operations)
   - Dependencies documented

3. **Check validation summary**:
   - 100% STRICT validation pass rate
   - Zero open ambiguities
   - Zero anti-pattern violations

### GATE-P1 Checklist

- [ ] **All REQ-###.yaml files valid YAML**
- [ ] **100% STRICT validation pass rate**
- [ ] **Zero generic actors** (all specific roles)
- [ ] **Zero compound intents** (all atomic)
- [ ] **Zero UI language** (no "button", "click", "screen")
- [ ] **Zero technical jargon** (no "API", "database", "HTTP")
- [ ] **Zero open questions** (all status=RESOLVED)
- [ ] **Requirements catalog complete**
- [ ] **Phase 1 handover document ready**

**GATE-P1 Result:**
- **APPROVED**: All criteria met, proceed to P2
- **APPROVED WITH CONDITIONS**: Minor warnings, can proceed but fix in P2
- **BLOCKED**: Critical violations, must fix before P2

---

## Common GATE-P1 Blockers

### Blocker 1: Generic Actors

**Violation:**
```yaml
Actor: User  # ❌
```

**Fix:**
```yaml
Actor: ProjectManager  # ✅
```

### Blocker 2: Compound Intents

**Violation:**
```yaml
Intent: create and update project  # ❌
```

**Fix (split into 2 requirements):**
```yaml
# REQ-001
Intent: create project  # ✅

# REQ-002
Intent: update project  # ✅
```

### Blocker 3: UI Language

**Violation:**
```yaml
Intent: click submit button to save changes  # ❌
```

**Fix:**
```yaml
Intent: update project  # ✅
```

### Blocker 4: Open Questions

**Violation:**
```yaml
OpenQuestions:
  - question: "Should name be unique?"
    status: OPEN  # ❌ BLOCKER
```

**Fix (ask sponsor):**
```yaml
OpenQuestions:
  - question: "Should name be unique?"
    status: RESOLVED  # ✅
    decision: "Yes, within organization"
    decisionDate: "2025-12-29T10:00:00Z"
    decisionBy: "Sponsor"
```

---

## Related Skills

- `activity-logging` - Log AORDL creation progress
- `rome-protocols` - ROME framework compliance

---

**Skill Version**: 1.0.0
**Last Updated**: 2025-12-29
**Robot**: Talib only
**Priority**: CRITICAL
