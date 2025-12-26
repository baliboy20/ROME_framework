# ROME-PROP-016: Standardized Code Traceability Annotations

| Field | Value |
|-------|-------|
| **Proposal ID** | ROME-PROP-016 |
| **Title** | Standardized Code Traceability Annotations for Source Code |
| **Status** | Draft |
| **Created** | 2025-12-24 |
| **Author** | Framework Analyst & Architect |
| **Priority** | HIGH |
| **Complexity** | Medium |
| **Dependencies** | ROME-PROP-007 (Activity Logging), ROME-PROP-013 (AORDL), ROME-PROP-015 (Change Management) |
| **Scope** | Mandatory annotation standards for all code generated in P5 |

---

## Problem Statement

**Current Gap:**

While ROME establishes traceability through requirements (REQ), features (FUNC), and use cases (UC), there is **no standardized mechanism** for linking source code back to these artifacts.

**Issues:**
1. **No annotation standard** - Robots generate code with inconsistent or missing traceability comments
2. **Manual verification required** - Sarah cannot automatically validate code implements requirements
3. **Forward tracing works, backward tracing doesn't** - Can find code from REQ, but not REQ from code
4. **Change impact unknown** - Cannot determine which code to update when requirement changes
5. **Test coverage unclear** - Cannot verify which requirements have test validation

**Example Problem:**

```typescript
// Current state - inconsistent/missing traceability
export function createOrganisation(data: CreateOrgRequest) {
  // Business logic here
  return org;
}

// Questions impossible to answer:
// - Which requirement does this implement?
// - Which use case does this support?
// - What happens if REQ-012 changes?
// - Is this function tested against requirements?
```

---

## Proposed Solution: Mandatory Traceability Annotation Standard

Establish **standardized JSDoc-style annotations** that all ROME robots must include when generating code in P5.

### Core Principles

1. **Every file** has traceability header
2. **Every public function/class/component** has traceability annotation
3. **Every test** explicitly validates requirements
4. **Annotations are machine-parseable** (not just human documentation)
5. **Language-agnostic standard** (works for TypeScript, Python, Java, etc.)
6. **Minimal verbosity** (concise but complete)

---

## Standard Annotation Tags

### File-Level Annotations

**Purpose:** Link entire file to requirements/design

```typescript
/**
 * [Brief description of file purpose]
 *
 * @tracesTo REQ-### [, REQ-###, ...]
 * @implements FUNC-### [, FUNC-###, ...]
 * @usedBy UC-### [, UC-###, ...]
 *
 * [@changeHistory CR-### (YYYY-MM-DD) - Description]
 */
```

**Tag Definitions:**

| Tag | Meaning | Required | Example |
|-----|---------|----------|---------|
| `@tracesTo` | Requirements this file implements | Yes | `@tracesTo REQ-003, REQ-012` |
| `@implements` | Features/functions this file provides | Yes | `@implements FUNC-008` |
| `@usedBy` | Use cases that consume this code | No | `@usedBy UC-012, UC-013` |
| `@changeHistory` | Changes made via CR process | When changed | `@changeHistory CR-001 (2025-12-24) - Renamed from Company` |

---

### Function-Level Annotations

**Purpose:** Link individual functions to specific requirement fields

```typescript
/**
 * [Brief description of function purpose]
 *
 * @tracesTo REQ-###
 * [@implements FUNC-###]
 * [@precondition REQ-###.Preconditions[N]]
 * [@postcondition REQ-###.Postconditions[N]]
 * [@validates REQ-###.Invariants[N]]
 * [@handles REQ-###.Errors.error_type]
 *
 * [@param paramName - Description (REQ-###.field)]
 * [@returns Description (REQ-###.Outcomes[N])]
 * [@throws ErrorType - REQ-###.Errors.error_type]
 *
 * [@changeHistory CR-### (YYYY-MM-DD) - Description]
 */
```

**Tag Definitions:**

| Tag | Meaning | Required | Example |
|-----|---------|----------|---------|
| `@tracesTo` | Primary requirement | Yes | `@tracesTo REQ-012` |
| `@implements` | Feature/function implemented | If applicable | `@implements FUNC-008` |
| `@precondition` | Validates requirement precondition | If applicable | `@precondition REQ-012.Preconditions[0]` |
| `@postcondition` | Ensures requirement postcondition | If applicable | `@postcondition REQ-012.Postconditions[0]` |
| `@validates` | Enforces requirement invariant | If applicable | `@validates REQ-012.Invariants[0]` |
| `@handles` | Handles requirement error case | If applicable | `@handles REQ-012.Errors.duplicate_name` |
| `@changeHistory` | Change tracking | When changed | `@changeHistory CR-001 (2025-12-24) - Renamed` |

---

### Component-Level Annotations (React/Vue/Angular)

**Purpose:** Link UI components to use cases and requirements

```typescript
/**
 * [Brief description of component]
 *
 * User Story: [Actor action from use case]
 *
 * @tracesTo REQ-### [, REQ-###, ...]
 * @implements UC-###
 * [@userInteraction UC-###.Step[N]]
 *
 * [@props propName - Description (REQ-###.field)]
 *
 * [@changeHistory CR-### (YYYY-MM-DD) - Description]
 */
```

**Tag Definitions:**

| Tag | Meaning | Required | Example |
|-----|---------|----------|---------|
| `@tracesTo` | Requirements implemented | Yes | `@tracesTo REQ-003, REQ-012` |
| `@implements` | Use case implemented | Yes | `@implements UC-012` |
| `@userInteraction` | Specific UC step this component handles | If applicable | `@userInteraction UC-012.Step[3]` |
| `User Story:` | Plain English user story | Yes | `User Story: As a RegisteredUser, I need to select an organisation` |

---

### Test-Level Annotations

**Purpose:** Explicitly validate requirements through tests

```typescript
/**
 * Test suite for [functionality]
 *
 * @validates REQ-### [, REQ-###, ...]
 */
describe('[test suite name]', () => {

  /**
   * @validates REQ-###.Preconditions[N]
   * [@validates REQ-###.Invariants[N]]
   */
  it('should [test description]', () => {
    // Test implementation
  });

  /**
   * @validates REQ-###.Outcomes[N]
   * @validates REQ-###.Postconditions[N]
   */
  it('should [test description]', () => {
    // Test implementation
  });

  /**
   * @validates REQ-###.Errors.error_type
   */
  it('should reject [error scenario]', () => {
    // Test implementation
  });
});
```

**Tag Definitions:**

| Tag | Meaning | Required | Example |
|-----|---------|----------|---------|
| `@validates` (suite level) | Requirements this test suite validates | Yes | `@validates REQ-012` |
| `@validates` (test level) | Specific requirement field validated | Yes | `@validates REQ-012.Preconditions[0]` |

---

### Database Migration Annotations

**Purpose:** Link schema changes to requirements and change requests

```sql
/*
 * Migration: [Brief description]
 *
 * @tracesTo REQ-### [, REQ-###, ...]
 * @implements [db-schema.yaml reference]
 * [@changeRequest CR-###]
 *
 * @breaking [true|false]
 * @rollback [migration filename]
 *
 * Reason: [Why this migration is needed]
 */
```

---

### API Endpoint Annotations

**Purpose:** Link API routes to requirements and use cases

```typescript
/**
 * [HTTP Method] [Endpoint Path]
 *
 * @tracesTo REQ-###
 * @implements UC-###
 *
 * @endpoint [METHOD] [PATH]
 *
 * [@requestBody Description (REQ-###.field)]
 * [@responseBody Description (REQ-###.Outcomes[N])]
 * [@errorResponse ErrorCode - REQ-###.Errors.error_type]
 *
 * [@deprecated Since [date] (CR-###). Use [alternative] instead.]
 * [@sunsetDate YYYY-MM-DD]
 *
 * [@changeHistory CR-### (YYYY-MM-DD) - Description]
 */
```

---

## Language-Specific Implementations

### TypeScript/JavaScript

```typescript
/**
 * Organisation Domain Model
 *
 * @tracesTo REQ-003, REQ-012
 * @implements FUNC-008
 * @usedBy UC-012, UC-013
 */

/**
 * Create new organisation
 *
 * @tracesTo REQ-012
 * @precondition REQ-012.Preconditions[0] - User must be authenticated
 * @postcondition REQ-012.Postconditions[0] - Organisation exists in database
 * @validates REQ-012.Invariants[0] - Unique organisation name
 *
 * @param data - Organisation creation data (REQ-012.Actor input)
 * @returns Created organisation (REQ-012.Outcomes[0])
 * @throws UnauthorizedError - REQ-012.Errors.unauthorized
 * @throws ConflictError - REQ-012.Errors.duplicate_name
 */
export async function createOrganisation(
  data: CreateOrganisationRequest
): Promise<Organisation> {
  // Implementation
}
```

---

### Python

```python
"""
Organisation Domain Model

@tracesTo: REQ-003, REQ-012
@implements: FUNC-008
@usedBy: UC-012, UC-013
"""

def create_organisation(data: CreateOrganisationRequest) -> Organisation:
    """
    Create new organisation

    @tracesTo: REQ-012
    @precondition: REQ-012.Preconditions[0] - User must be authenticated
    @postcondition: REQ-012.Postconditions[0] - Organisation exists in database
    @validates: REQ-012.Invariants[0] - Unique organisation name

    Args:
        data: Organisation creation data (REQ-012.Actor input)

    Returns:
        Organisation: Created organisation (REQ-012.Outcomes[0])

    Raises:
        UnauthorizedError: REQ-012.Errors.unauthorized
        ConflictError: REQ-012.Errors.duplicate_name
    """
    # Implementation
```

---

### Java

```java
/**
 * Organisation Domain Model
 *
 * @tracesTo REQ-003, REQ-012
 * @implements FUNC-008
 * @usedBy UC-012, UC-013
 */

/**
 * Create new organisation
 *
 * @tracesTo REQ-012
 * @precondition REQ-012.Preconditions[0] - User must be authenticated
 * @postcondition REQ-012.Postconditions[0] - Organisation exists in database
 * @validates REQ-012.Invariants[0] - Unique organisation name
 *
 * @param data Organisation creation data (REQ-012.Actor input)
 * @return Created organisation (REQ-012.Outcomes[0])
 * @throws UnauthorizedException REQ-012.Errors.unauthorized
 * @throws ConflictException REQ-012.Errors.duplicate_name
 */
public Organisation createOrganisation(CreateOrganisationRequest data) {
    // Implementation
}
```

---

### SQL (Migration Scripts)

```sql
/*
 * Migration: Create organisations table
 *
 * @tracesTo REQ-003, REQ-012
 * @implements db-schema.yaml v1.0
 *
 * @breaking false
 * @rollback migrations/001_create_organisations_ROLLBACK.sql
 *
 * Reason: Initial schema for organisation management feature
 */

CREATE TABLE organisations (
  id UUID PRIMARY KEY,                    -- REQ-012.Outcomes[0] - unique ID
  name VARCHAR(255) NOT NULL UNIQUE,      -- REQ-012.Invariants[0] - unique name
  created_at TIMESTAMP DEFAULT NOW()      -- REQ-012.Postconditions[0] - record creation time
);
```

---

## Complete Code Examples with Annotations

### Example 1: TypeScript Model + API + Component + Test

**Model:**
```typescript
// src/models/Organisation.ts

/**
 * Organisation Domain Model
 *
 * Represents an organisation entity in the system. Organisations
 * are the primary grouping mechanism for users and data.
 *
 * @tracesTo REQ-003, REQ-012
 * @implements FUNC-008
 * @usedBy UC-012, UC-013, UC-014
 *
 * @changeHistory CR-001 (2025-12-24) - Renamed from Company to Organisation
 */

export interface Organisation {
  /** @tracesTo REQ-012.Outcomes[0] */
  id: string;

  /** @tracesTo REQ-012.Invariants[0] - Must be unique */
  name: string;

  /** @tracesTo REQ-003.Actor - Organisation administrator */
  adminId: string;

  /** @tracesTo REQ-012.Postconditions[0] */
  createdAt: Date;

  /** @tracesTo REQ-003.Outcomes[1] */
  updatedAt: Date;
}

export interface CreateOrganisationRequest {
  /** @tracesTo REQ-012.Actor input */
  name: string;

  /** @tracesTo REQ-012.Preconditions[0] */
  userId: string;
}
```

**API Implementation:**
```typescript
// src/api/organisations/create.ts

/**
 * Organisation Creation API
 *
 * @tracesTo REQ-012
 * @implements FUNC-008
 * @usedBy UC-013
 */

/**
 * Create new organisation
 *
 * Validates user authentication, checks for duplicate organisation names,
 * creates organisation record in database, and returns created entity.
 *
 * @tracesTo REQ-012
 * @implements FUNC-008
 * @precondition REQ-012.Preconditions[0] - User must be authenticated
 * @precondition REQ-012.Preconditions[1] - User must provide organisation name
 * @postcondition REQ-012.Postconditions[0] - Organisation record exists in database
 * @postcondition REQ-012.Postconditions[1] - User becomes organisation admin
 * @validates REQ-012.Invariants[0] - Organisation name must be unique across system
 *
 * @endpoint POST /v2/organisations
 *
 * @param data - Organisation creation request (REQ-012.Actor input)
 * @returns Created organisation with generated ID (REQ-012.Outcomes[0])
 *
 * @throws UnauthorizedError - REQ-012.Errors.unauthorized - User not authenticated
 * @throws ValidationError - REQ-012.Errors.invalid_input - Missing/invalid organisation name
 * @throws ConflictError - REQ-012.Errors.duplicate_name - Organisation name already exists
 *
 * @changeHistory CR-001 (2025-12-24) - Renamed from createCompany
 */
export async function createOrganisation(
  data: CreateOrganisationRequest
): Promise<Organisation> {
  // Validate: REQ-012.Preconditions[0]
  if (!data.userId) {
    throw new UnauthorizedError('User must be authenticated'); // REQ-012.Errors.unauthorized
  }

  // Validate: REQ-012.Preconditions[1]
  if (!data.name || data.name.trim().length === 0) {
    throw new ValidationError('Organisation name required'); // REQ-012.Errors.invalid_input
  }

  // Validate: REQ-012.Invariants[0]
  const existing = await db.organisations.findByName(data.name);
  if (existing) {
    throw new ConflictError('Organisation name already exists'); // REQ-012.Errors.duplicate_name
  }

  // Create: REQ-012.Outcomes[0], REQ-012.Postconditions[0]
  const organisation = await db.organisations.create({
    name: data.name,
    adminId: data.userId,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // REQ-012.Postconditions[1] - User becomes admin (handled by adminId assignment)

  return organisation; // REQ-012.Outcomes[0]
}
```

**React Component:**
```tsx
// src/components/OrganisationForm.tsx

/**
 * Organisation Creation Form Component
 *
 * Provides UI for creating a new organisation. Displays input field
 * for organisation name, validates input, handles submission, and
 * shows error messages.
 *
 * User Story: As a RegisteredUser, I need a form to create a new
 * organisation so that I can group my data and invite team members.
 *
 * @tracesTo REQ-012
 * @implements UC-013
 * @userInteraction UC-013.Step[2] - User enters organisation name
 * @userInteraction UC-013.Step[3] - User submits form
 *
 * @changeHistory CR-001 (2025-12-24) - Renamed from CompanyForm
 */
export const OrganisationForm: React.FC<OrganisationFormProps> = ({
  onSuccess
}) => {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  /**
   * Handle form submission
   *
   * @tracesTo REQ-012
   * @validates REQ-012.Preconditions[1] - Name must be provided
   * @handles REQ-012.Errors.duplicate_name
   * @handles REQ-012.Errors.invalid_input
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate: REQ-012.Preconditions[1]
    if (!name.trim()) {
      setError('Organisation name is required'); // REQ-012.Errors.invalid_input
      return;
    }

    try {
      // Call API: REQ-012
      const org = await createOrganisation({ name, userId: currentUser.id });

      // Success: REQ-012.Outcomes[0]
      onSuccess(org);
    } catch (err) {
      if (err instanceof ConflictError) {
        setError('Organisation name already exists'); // REQ-012.Errors.duplicate_name
      } else if (err instanceof ValidationError) {
        setError(err.message); // REQ-012.Errors.invalid_input
      } else {
        setError('Failed to create organisation');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* UC-013.Step[2] - User enters organisation name */}
      <TextField
        label="Organisation Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={error}
        required
      />

      {/* UC-013.Step[3] - User submits form */}
      <Button type="submit">Create Organisation</Button>
    </form>
  );
};
```

**Tests:**
```typescript
// src/api/organisations/__tests__/create.test.ts

/**
 * Tests for Organisation Creation
 *
 * Validates all aspects of REQ-012 including preconditions,
 * outcomes, postconditions, invariants, and error handling.
 *
 * @validates REQ-012
 */
describe('createOrganisation', () => {

  /**
   * @validates REQ-012.Preconditions[0] - User must be authenticated
   */
  it('should reject unauthenticated requests', async () => {
    await expect(
      createOrganisation({ name: 'Acme Inc', userId: null })
    ).rejects.toThrow(UnauthorizedError);
  });

  /**
   * @validates REQ-012.Preconditions[1] - Organisation name required
   * @validates REQ-012.Errors.invalid_input
   */
  it('should reject missing organisation name', async () => {
    await expect(
      createOrganisation({ name: '', userId: 'user1' })
    ).rejects.toThrow(ValidationError);
  });

  /**
   * @validates REQ-012.Invariants[0] - Organisation name must be unique
   * @validates REQ-012.Errors.duplicate_name
   */
  it('should reject duplicate organisation names', async () => {
    await createOrganisation({ name: 'Acme Inc', userId: 'user1' });

    await expect(
      createOrganisation({ name: 'Acme Inc', userId: 'user2' })
    ).rejects.toThrow(ConflictError);
  });

  /**
   * @validates REQ-012.Outcomes[0] - Returns organisation with ID
   * @validates REQ-012.Postconditions[0] - Organisation exists in database
   * @validates REQ-012.Postconditions[1] - User becomes admin
   */
  it('should create organisation successfully', async () => {
    const userId = 'user1';
    const result = await createOrganisation({
      name: 'Acme Inc',
      userId
    });

    // REQ-012.Outcomes[0] - Returns organisation with ID
    expect(result.id).toBeDefined();
    expect(result.name).toBe('Acme Inc');

    // REQ-012.Postconditions[0] - Record exists in database
    const dbRecord = await db.organisations.findById(result.id);
    expect(dbRecord).toBeDefined();
    expect(dbRecord.name).toBe('Acme Inc');

    // REQ-012.Postconditions[1] - User is admin
    expect(result.adminId).toBe(userId);
  });

  /**
   * @validates REQ-012.Outcomes[0] - Created timestamp set
   */
  it('should set creation timestamp', async () => {
    const result = await createOrganisation({
      name: 'Acme Inc',
      userId: 'user1'
    });

    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.createdAt.getTime()).toBeLessThanOrEqual(Date.now());
  });
});
```

---

## Robot Responsibilities for Annotations

### Ashok (Data Layer - P5)

**Generates:**
- Database models with `@tracesTo` linking to requirements
- Migration scripts with `@tracesTo`, `@implements`, `@changeRequest`
- Schema validation code with `@validates` for invariants

**Example:**
```typescript
// Ashok generates:

/**
 * Organisation Repository
 *
 * @tracesTo REQ-003, REQ-012
 * @implements db-schema.yaml v1.0
 */
export class OrganisationRepository {
  /**
   * @tracesTo REQ-012
   * @validates REQ-012.Invariants[0] - Unique name
   */
  async create(data: CreateOrgData): Promise<Organisation> {
    // Implementation with unique constraint check
  }
}
```

---

### Reena (API Layer - P5)

**Generates:**
- API route handlers with `@tracesTo`, `@endpoint`, `@implements`
- Request/response types with field-level traceability
- Error handlers with `@handles` for requirement error cases
- API documentation with requirement references

**Example:**
```typescript
// Reena generates:

/**
 * POST /v2/organisations
 *
 * @tracesTo REQ-012
 * @implements UC-013
 * @endpoint POST /v2/organisations
 *
 * @requestBody CreateOrganisationRequest (REQ-012.Actor input)
 * @responseBody Organisation (REQ-012.Outcomes[0])
 * @errorResponse 401 - REQ-012.Errors.unauthorized
 * @errorResponse 409 - REQ-012.Errors.duplicate_name
 */
router.post('/v2/organisations', async (req, res) => {
  // Implementation
});
```

---

### Charlie (UI Layer - P5)

**Generates:**
- React/Vue/Angular components with `@implements UC-###`
- User interaction annotations with `@userInteraction UC-###.Step[N]`
- Component props with requirement field references
- User stories in plain English

**Example:**
```tsx
// Charlie generates:

/**
 * Organisation Picker Component
 *
 * User Story: As a RegisteredUser, I need to select an organisation
 * from a dropdown to view organisation-specific data.
 *
 * @tracesTo REQ-003
 * @implements UC-012
 * @userInteraction UC-012.Step[2] - User selects organisation from dropdown
 *
 * @props value - Currently selected organisation ID (REQ-003.Actor context)
 * @props onChange - Callback when selection changes (UC-012.Step[3])
 */
export const OrganisationPicker: React.FC = ({ value, onChange }) => {
  // Implementation
};
```

---

### Clara (Design System - P5)

**Generates:**
- Design system components with design token references
- Component documentation with use case links
- Accessibility annotations

**Example:**
```tsx
// Clara generates:

/**
 * Primary Button Component
 *
 * @implements design-system.yaml - Button.Primary
 * @usedBy UC-012, UC-013, UC-014
 *
 * @a11y WCAG 2.1 AA compliant (contrast ratio 4.5:1)
 */
export const Button: React.FC<ButtonProps> = (props) => {
  // Implementation
};
```

---

## Validation & Enforcement

### 1. Pre-Commit Hook Validation

**Tool:** `.git/hooks/pre-commit`

```bash
#!/bin/bash
# Validate traceability annotations before commit

echo "Validating traceability annotations..."

# Check for files missing @tracesTo
FILES_MISSING_TRACEABILITY=$(grep -L "@tracesTo" src/**/*.ts | grep -v ".test.ts")

if [ -n "$FILES_MISSING_TRACEABILITY" ]; then
  echo "❌ ERROR: Files missing @tracesTo annotation:"
  echo "$FILES_MISSING_TRACEABILITY"
  exit 1
fi

# Check for tests missing @validates
TESTS_MISSING_VALIDATES=$(grep -L "@validates" src/**/*.test.ts)

if [ -n "$TESTS_MISSING_VALIDATES" ]; then
  echo "❌ ERROR: Tests missing @validates annotation:"
  echo "$TESTS_MISSING_VALIDATES"
  exit 1
fi

echo "✓ All files have required traceability annotations"
```

---

### 2. CI/CD Pipeline Check

**GitHub Actions workflow:**

```yaml
# .github/workflows/traceability.yml

name: Traceability Validation

on: [push, pull_request]

jobs:
  validate-traceability:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Validate Traceability Annotations
        run: |
          npm install -g @rome/traceability-validator
          rome-validate-traceability src/

      - name: Generate Traceability Report
        run: |
          rome-generate-traceability-matrix > traceability-report.md

      - name: Upload Report
        uses: actions/upload-artifact@v2
        with:
          name: traceability-report
          path: traceability-report.md
```

---

### 3. Proposed Skill: `/validate-traceability`

```bash
# Usage
/validate-traceability

# Output:
Scanning source code for traceability annotations...

File-level traceability:
  ✓ src/models/Organisation.ts (@tracesTo REQ-003, REQ-012)
  ✓ src/api/organisations/create.ts (@tracesTo REQ-012)
  ✗ src/utils/helpers.ts (MISSING @tracesTo)

Function-level traceability:
  ✓ createOrganisation() (@tracesTo REQ-012)
  ✓ getOrganisation() (@tracesTo REQ-003)
  ✗ validateInput() (MISSING @tracesTo)

Test coverage:
  ✓ REQ-012 validated by create.test.ts
  ✓ REQ-003 validated by get.test.ts
  ✗ REQ-018 NOT validated (no tests found)

Requirements without code:
  ⚠ REQ-018 - No code files found

Code without requirements:
  ⚠ src/utils/helpers.ts - Missing traceability

Traceability Score: 85% (17/20 requirements traced)
```

---

### 4. Proposed Skill: `/generate-traceability-matrix`

```bash
# Usage
/generate-traceability-matrix

# Output: ARTIFACTS/traceability-matrix.md
```

**Generated Matrix:**

```markdown
# Traceability Matrix

| Requirement | Feature | Use Case | Model | API | UI | Tests | Coverage |
|-------------|---------|----------|-------|-----|----|----|----------|
| REQ-003 | FUNC-008 | UC-012 | Organisation.ts | get.ts, update.ts | OrganisationPicker.tsx | get.test.ts, update.test.ts | 100% |
| REQ-012 | FUNC-008 | UC-013 | Organisation.ts | create.ts | OrganisationForm.tsx | create.test.ts | 100% |
| REQ-018 | FUNC-015 | UC-025 | - | - | - | - | 0% ⚠ |

## Coverage Summary
- Requirements traced to code: 95% (19/20)
- Requirements validated by tests: 90% (18/20)
- Files with traceability: 98% (156/159)

## Missing Traceability
- REQ-018: No implementation found
- src/utils/helpers.ts: Missing @tracesTo annotation
- src/utils/validators.ts: Missing @tracesTo annotation
```

---

### 5. ESLint/TSLint Rule

**Custom ESLint rule:** `require-traceability-annotation`

```javascript
// .eslintrc.js
{
  "rules": {
    "@rome/require-traceability": ["error", {
      "requireFileLevel": true,
      "requireFunctionLevel": true,
      "requireTestValidation": true,
      "exemptPatterns": ["*.config.ts", "*.d.ts"]
    }]
  }
}
```

---

## Integration with Change Management (ROME-PROP-015)

When a change request modifies requirements, the annotation system enables automated impact analysis:

### Before Change (CR-001):

```typescript
/**
 * @tracesTo REQ-003
 */
export interface Company {
  companyId: string;
  companyName: string;
}
```

### After Change (CR-001):

```typescript
/**
 * @tracesTo REQ-003
 * @changeHistory CR-001 (2025-12-24) - Renamed from Company to Organisation
 */
export interface Organisation {
  /** @changeHistory CR-001 - Renamed from companyId */
  organisationId: string;

  /** @changeHistory CR-001 - Renamed from companyName */
  organisationName: string;
}
```

### Impact Analysis Tool:

```bash
# Find all code affected by CR-001
/analyze-change-impact --cr CR-001

# Output:
Files affected by CR-001:
  - src/models/Organisation.ts (@tracesTo REQ-003)
  - src/api/organisations/get.ts (@tracesTo REQ-003)
  - src/api/organisations/create.ts (@tracesTo REQ-012)
  - src/components/OrganisationPicker.tsx (@tracesTo REQ-003)

Total: 4 files, 8 functions, 3 tests
```

---

## Benefits

### 1. Automated Forward Tracing
```bash
# "What code implements REQ-012?"
grep -r "@tracesTo REQ-012" src/

# Output:
src/api/organisations/create.ts
src/components/OrganisationForm.tsx
src/models/Organisation.ts
```

### 2. Automated Backward Tracing
```bash
# "What requirement does create.ts implement?"
grep "@tracesTo" src/api/organisations/create.ts

# Output:
@tracesTo REQ-012
```

### 3. Change Impact Analysis
```bash
# "If REQ-012 changes, what code needs updating?"
grep -r "@tracesTo REQ-012" src/ | awk -F: '{print $1}' | sort -u

# Output:
src/api/organisations/create.ts
src/components/OrganisationForm.tsx
```

### 4. Test Coverage Verification
```bash
# "Is REQ-012 tested?"
grep -r "@validates REQ-012" src/**/*.test.ts

# Output:
src/api/organisations/__tests__/create.test.ts
```

### 5. Requirements Gap Detection
```bash
# "Which requirements have no code?"
/verify-traceability --report gaps

# Output:
Requirements without implementation:
  REQ-018: No code files found
  REQ-024: No code files found
```

---

## Migration Strategy for Existing Code

### Phase 1: New Code Only
- All new code generated in P5 MUST have annotations
- Existing code is exempt temporarily

### Phase 2: Critical Paths
- Add annotations to core business logic
- Focus on REQ-### with highest priority

### Phase 3: Full Coverage
- Backfill annotations for all existing code
- Use `/generate-annotations` tool to auto-generate draft annotations

### Proposed Tool: `/generate-annotations`

```bash
# Analyze code and suggest annotations
/generate-annotations src/api/organisations/create.ts

# Output (draft annotations to review):
Suggested annotations for createOrganisation():

Based on code analysis:
- Function creates organisation record
- Checks for duplicate names
- Throws UnauthorizedError and ConflictError
- Returns organisation with ID

Suggested annotation:
/**
 * Create new organisation
 *
 * @tracesTo REQ-012 (inferred from function behavior)
 * @validates REQ-012.Invariants[0] (inferred from duplicate name check)
 * @handles REQ-012.Errors.unauthorized
 * @handles REQ-012.Errors.duplicate_name
 *
 * Review and confirm annotation is accurate.
 */
```

---

## Robot Training

### P5 Robot Prompts

**Ashok, Reena, Charlie, Clara MUST include in their system prompts:**

```markdown
CRITICAL: All code you generate MUST include traceability annotations.

File-Level Header Template:
/**
 * [File description]
 *
 * @tracesTo REQ-### [, REQ-###, ...]
 * @implements FUNC-### [, FUNC-###, ...]
 * @usedBy UC-### [, UC-###, ...]
 */

Function-Level Template:
/**
 * [Function description]
 *
 * @tracesTo REQ-###
 * @precondition REQ-###.Preconditions[N]
 * @postcondition REQ-###.Postconditions[N]
 * @validates REQ-###.Invariants[N]
 * @handles REQ-###.Errors.error_type
 */

Test Template:
/**
 * @validates REQ-###.Preconditions[N]
 */
it('should [test description]', () => {
  // Test implementation
});

Annotations are MANDATORY. Code without annotations will be rejected by CI/CD.
```

---

## Success Metrics

### Traceability Coverage
- **Target:** 100% of code files have `@tracesTo` annotation
- **Measure:** `grep -L "@tracesTo" src/**/*.ts | wc -l` = 0

### Test Validation Coverage
- **Target:** 100% of requirements have at least one test with `@validates`
- **Measure:** `/verify-traceability --report test-coverage`

### Annotation Accuracy
- **Target:** 95% of annotations correctly link code to requirements
- **Measure:** Manual review by Sarah during GATE validation

### Change Impact Accuracy
- **Target:** 95% of files affected by requirement change are identified by annotation scan
- **Measure:** Compare manual impact analysis vs automated tool results

---

## Future Enhancements

### 1. IDE Extension - ROME Traceability Navigator

**Features:**
- Hover over `REQ-003` → Shows requirement YAML content in popup
- Click `REQ-003` → Jump to `ARTIFACTS/dev/requirements/REQ-003.yaml`
- Right-click file → "Show Traceability Graph"
- Auto-suggest `@tracesTo` annotation based on code analysis
- Highlight missing annotations in red

### 2. Visual Traceability Graph

```bash
/visualize-traceability REQ-012

# Output: Interactive diagram
REQ-012 (create_organisation_profile)
  ↓
FUNC-008 (Organisation Management)
  ↓
UC-013 (Create Organisation)
  ↓
├── Organisation.ts (interface definition)
├── create.ts (API implementation)
├── OrganisationForm.tsx (UI component)
└── create.test.ts (validation tests)
```

### 3. Auto-Generated Documentation

```bash
/generate-requirement-docs REQ-012

# Output: REQ-012-implementation.md
# REQ-012 Implementation Documentation

## Requirement
Actor: RegisteredUser
Intent: create_organisation_profile

## Implementation

### Data Model
- `src/models/Organisation.ts` - Organisation interface

### API Endpoints
- `POST /v2/organisations` - src/api/organisations/create.ts

### UI Components
- `OrganisationForm` - src/components/OrganisationForm.tsx

### Tests
- `src/api/organisations/__tests__/create.test.ts`
  - Validates Preconditions[0]: User authentication
  - Validates Invariants[0]: Unique name
  - Validates Outcomes[0]: Returns organisation with ID

### Test Coverage
- Preconditions: 100% (2/2)
- Invariants: 100% (1/1)
- Outcomes: 100% (1/1)
- Error Cases: 100% (2/2)
```

---

## Conclusion

ROME-PROP-016 establishes **mandatory traceability annotations** for all source code generated in P5.

**Key Benefits:**
1. ✅ **Automated forward tracing** - REQ → find all code
2. ✅ **Automated backward tracing** - Code → find REQ
3. ✅ **Change impact analysis** - Know what to update when requirements change
4. ✅ **Test coverage verification** - Ensure all requirements validated
5. ✅ **Requirements gap detection** - Find unimplemented requirements
6. ✅ **Machine-parseable** - Enables automated validation tools
7. ✅ **Language-agnostic** - Works for TypeScript, Python, Java, etc.

**Expected Impact:**
- Traceability coverage: 0% → **100%** (all code traced to requirements)
- Change impact accuracy: Manual → **95%+ automated**
- Test coverage visibility: Unknown → **100% transparent**
- GATE validation time: 4 hours → **30 minutes** (automated checks)

---

## Next Steps

1. **Approve ROME-PROP-016** for implementation
2. **Update P5 robot system prompts** with annotation requirements
3. **Implement `/validate-traceability` skill**
4. **Implement `/generate-traceability-matrix` skill**
5. **Add pre-commit hook** for annotation validation
6. **Pilot with small project** (validate all code generated has annotations)
7. **Measure coverage** and adjust requirements as needed

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 1.0 | 2025-12-24 | Initial proposal for standardized traceability annotations in source code. Defines annotation tags (@tracesTo, @implements, @validates, etc.), language-specific implementations, robot responsibilities, validation tools, and integration with change management (PROP-015). |
