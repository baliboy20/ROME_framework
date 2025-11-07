# YAML Schema Definitions for HTM Artifacts

**Version:** 5.0
**Date:** November 6, 2025
**Purpose:** Define schemas for HTM Phase 1 YAML artifacts
**Status:** Production

---

## Overview

This document defines the schemas for the three YAML artifacts produced by HTM Phase 1:
1. **requirements-matrix.yaml** - Hierarchical requirements with traceability
2. **data-dictionary.yaml** - Domain entities and relationships
3. **component-registry.yaml** - Technical components and mappings

---

## 1. requirements-matrix.yaml Schema

### Purpose
Complete requirements hierarchy from Epic → Feature → Story → Task with full traceability.

### Schema Structure

```yaml
epics:
  - id: string                    # Required. Format: EPIC-XXX
    name: string                  # Required. Short epic name
    description: string           # Required. Detailed epic description
    business_value: string        # Optional. Business justification
    priority: string              # Optional. High/Medium/Low
    acceptance_criteria:          # Required. List of criteria
      - string
      - string
    features:                     # Required. List of features in this epic
      - id: string                # Required. Format: FEAT-XXX.X
        name: string              # Required. Short feature name
        description: string       # Required. Detailed feature description
        priority: string          # Optional. High/Medium/Low
        dependencies:             # Optional. List of feature IDs this depends on
          - string                # Format: FEAT-XXX.X
        acceptance_criteria:      # Required. List of criteria
          - string
        ui_required: boolean      # Optional. Does this need UI? Default: true
        stories:                  # Required. List of stories in this feature
          - id: string            # Required. Format: STORY-XXX.X.X
            name: string          # Required. Short story name
            as_a: string          # Required. User role ("As a [role]")
            i_want: string        # Required. Capability ("I want to [action]")
            so_that: string       # Required. Benefit ("So that [outcome]")
            acceptance_criteria:  # Required. List of criteria
              - string
            tasks:                # Required. List of tasks in this story
              - id: string        # Required. Format: TASK-XXX.X.X.X
                name: string      # Required. Short task name
                description: string # Required. Detailed task description
                component: string # Required. Component ID (from component-registry)
                complexity: string # Optional. Low/Medium/High
                acceptance_criteria: # Required. List of criteria
                  - string
                dependencies:     # Optional. List of task IDs this depends on
                  - string        # Format: TASK-XXX.X.X.X
```

### Required Fields Summary

**Epic Level:**
- id, name, description, acceptance_criteria, features

**Feature Level:**
- id, name, description, acceptance_criteria, stories

**Story Level:**
- id, name, as_a, i_want, so_that, acceptance_criteria, tasks

**Task Level:**
- id, name, description, component, acceptance_criteria

### Validation Rules

1. **ID Format:**
   - Epic: `EPIC-XXX` (3 digits)
   - Feature: `FEAT-XXX.X` (epic number + feature sequence)
   - Story: `STORY-XXX.X.X` (feature ID + story sequence)
   - Task: `TASK-XXX.X.X.X` (story ID + task sequence)

2. **Traceability:**
   - Every feature belongs to an epic
   - Every story belongs to a feature
   - Every task belongs to a story
   - IDs maintain hierarchical numbering

3. **Dependencies:**
   - Reference valid IDs only
   - No circular dependencies
   - Dependencies can be cross-epic

4. **Acceptance Criteria:**
   - At least one criterion per level
   - Specific and testable
   - No vague language

### Example

```yaml
epics:
  - id: EPIC-001
    name: User Authentication
    description: Enable users to securely sign up, log in, and manage their accounts
    business_value: Required for personalized user experience and data security
    priority: High
    acceptance_criteria:
      - Users can create accounts with email/password
      - Users can log in with valid credentials
      - User sessions persist across browser refreshes
      - Users can reset forgotten passwords
    features:
      - id: FEAT-001.1
        name: User Registration
        description: Allow new users to create accounts
        priority: High
        dependencies: []
        acceptance_criteria:
          - Registration form validates all fields
          - Email confirmation sent on successful registration
          - Duplicate emails rejected
        ui_required: true
        stories:
          - id: STORY-001.1.1
            name: Basic Registration Form
            as_a: New User
            i_want: To create an account with email and password
            so_that: I can access the application
            acceptance_criteria:
              - Form has email, password, confirm password fields
              - Email format validated
              - Password strength indicator shown
              - Submit button disabled until valid
            tasks:
              - id: TASK-001.1.1.1
                name: Create registration form component
                description: Build React form with email and password fields
                component: COMP-FRONTEND-001
                complexity: Medium
                acceptance_criteria:
                  - Form renders with proper layout
                  - Email field uses type="email"
                  - Password field uses type="password"
                  - Confirm password field matches password
                dependencies: []

              - id: TASK-001.1.1.2
                name: Implement form validation
                description: Add client-side validation for all fields
                component: COMP-FRONTEND-001
                complexity: Low
                acceptance_criteria:
                  - Email validation shows error for invalid format
                  - Password length minimum 8 characters
                  - Passwords match check
                dependencies:
                  - TASK-001.1.1.1
```

---

## 2. data-dictionary.yaml Schema

### Purpose
Define all domain entities, their attributes, relationships, and business rules.

### Schema Structure

```yaml
entities:
  - name: string                  # Required. PascalCase entity name
    description: string           # Required. What this entity represents
    table_name: string            # Optional. Database table name (if different)
    attributes:                   # Required. List of attributes
      - name: string              # Required. snake_case attribute name
        type: string              # Required. Data type (see types below)
        required: boolean         # Required. Is this field required?
        unique: boolean           # Optional. Is this field unique? Default: false
        default: any              # Optional. Default value
        validation: string        # Optional. Validation rules
        description: string       # Required. What this attribute represents
        example: any              # Optional. Example value
    relationships:                # Optional. List of relationships
      - type: string              # Required. OneToOne/OneToMany/ManyToOne/ManyToMany
        target: string            # Required. Target entity name
        description: string       # Required. Relationship description
        foreign_key: string       # Optional. Foreign key attribute name
        through: string           # Optional. Junction table (for ManyToMany)
    business_rules:               # Optional. List of business rules
      - string
    indexes:                      # Optional. Recommended indexes
      - fields:                   # List of fields in index
          - string
        unique: boolean           # Is this a unique index?
```

### Supported Data Types

**Primitive Types:**
- `String` - Text data
- `Integer` - Whole numbers
- `Float` - Decimal numbers
- `Boolean` - True/false
- `Date` - Date only (YYYY-MM-DD)
- `DateTime` - Date and time
- `Time` - Time only

**Complex Types:**
- `Email` - Email address (validates format)
- `URL` - Web URL
- `UUID` - Universally unique identifier
- `JSON` - JSON object
- `Enum[Value1,Value2,...]` - Enumeration with specific values

### Validation Syntax

```
min_length:N            # String minimum length
max_length:N            # String maximum length
min:N                   # Numeric minimum value
max:N                   # Numeric maximum value
pattern:/regex/         # Regex pattern match
format:X                # Specific format (e.g., phone, postal_code)
```

### Example

```yaml
entities:
  - name: User
    description: Application user account
    table_name: users
    attributes:
      - name: id
        type: UUID
        required: true
        unique: true
        description: Unique user identifier
        example: "123e4567-e89b-12d3-a456-426614174000"

      - name: email
        type: Email
        required: true
        unique: true
        validation: "format:email"
        description: User's email address
        example: "user@example.com"

      - name: password_hash
        type: String
        required: true
        validation: "min_length:60"
        description: Bcrypt hashed password
        example: "$2b$10$..."

      - name: first_name
        type: String
        required: true
        validation: "min_length:1, max_length:50"
        description: User's first name
        example: "John"

      - name: last_name
        type: String
        required: true
        validation: "min_length:1, max_length:50"
        description: User's last name
        example: "Doe"

      - name: status
        type: Enum[active,suspended,deleted]
        required: true
        default: active
        description: User account status
        example: "active"

      - name: created_at
        type: DateTime
        required: true
        description: Account creation timestamp
        example: "2025-11-06T10:30:00Z"

      - name: last_login_at
        type: DateTime
        required: false
        description: Last successful login timestamp
        example: "2025-11-06T10:30:00Z"

    relationships:
      - type: OneToMany
        target: Session
        description: User can have multiple active sessions
        foreign_key: user_id

      - type: ManyToMany
        target: Role
        description: User can have multiple roles
        through: user_roles

    business_rules:
      - Email must be verified before user can access protected resources
      - Password must be at least 8 characters with uppercase, lowercase, number, special char
      - Suspended users cannot log in
      - Deleted users retain records for audit purposes

    indexes:
      - fields: [email]
        unique: true
      - fields: [status, created_at]
        unique: false

  - name: Session
    description: User authentication session
    table_name: sessions
    attributes:
      - name: id
        type: UUID
        required: true
        unique: true
        description: Unique session identifier

      - name: user_id
        type: UUID
        required: true
        description: Foreign key to User

      - name: token
        type: String
        required: true
        unique: true
        validation: "min_length:32"
        description: Session token

      - name: expires_at
        type: DateTime
        required: true
        description: Session expiration timestamp

      - name: created_at
        type: DateTime
        required: true
        description: Session creation timestamp

    relationships:
      - type: ManyToOne
        target: User
        description: Session belongs to one user
        foreign_key: user_id

    business_rules:
      - Sessions expire after 7 days of inactivity
      - Expired sessions automatically deleted
      - Maximum 5 concurrent sessions per user

    indexes:
      - fields: [token]
        unique: true
      - fields: [user_id, expires_at]
        unique: false
```

---

## 3. component-registry.yaml Schema

### Purpose
Map features to technical components and define integration points.

### Schema Structure

```yaml
components:
  - id: string                    # Required. Format: COMP-[TYPE]-XXX
    name: string                  # Required. Component name
    type: string                  # Required. Frontend/Backend/Data/Infrastructure
    description: string           # Required. Component purpose
    technology: string            # Optional. Specific tech (e.g., "React", "Node.js")
    features:                     # Required. List of feature IDs this implements
      - string                    # Format: FEAT-XXX.X
    dependencies:                 # Optional. List of component IDs this depends on
      - string                    # Format: COMP-[TYPE]-XXX
    integration_points:           # Optional. List of integration points
      - type: string              # Required. API/Event/Data/Message
        target: string            # Required. Target component ID
        description: string       # Required. Integration description
        protocol: string          # Optional. REST/GraphQL/WebSocket/etc
        endpoints:                # Optional. Specific endpoints (for API)
          - path: string
            method: string
            description: string
```

### Component Types

- **Frontend** - User interface components
- **Backend** - API services and business logic
- **Data** - Database and data layer
- **Infrastructure** - Deployment, monitoring, CI/CD

### Integration Types

- **API** - REST/GraphQL API calls
- **Event** - Event-driven messaging
- **Data** - Direct data access
- **Message** - Message queue communication

### Example

```yaml
components:
  - id: COMP-FRONTEND-001
    name: User Authentication UI
    type: Frontend
    description: User-facing authentication components (login, register, password reset)
    technology: React
    features:
      - FEAT-001.1    # User Registration
      - FEAT-001.2    # User Login
      - FEAT-001.3    # Password Reset
    dependencies:
      - COMP-BACKEND-001
    integration_points:
      - type: API
        target: COMP-BACKEND-001
        description: Authentication API calls
        protocol: REST
        endpoints:
          - path: /api/auth/register
            method: POST
            description: Register new user
          - path: /api/auth/login
            method: POST
            description: Authenticate user
          - path: /api/auth/logout
            method: POST
            description: End user session

  - id: COMP-BACKEND-001
    name: Authentication Service
    type: Backend
    description: Backend service handling user authentication and session management
    technology: Node.js/Express
    features:
      - FEAT-001.1    # User Registration
      - FEAT-001.2    # User Login
      - FEAT-001.3    # Password Reset
    dependencies:
      - COMP-DATA-001
    integration_points:
      - type: Data
        target: COMP-DATA-001
        description: User and session data persistence
        protocol: SQL
      - type: Event
        target: COMP-INFRA-001
        description: Send verification emails
        protocol: MessageQueue

  - id: COMP-DATA-001
    name: User Database
    type: Data
    description: PostgreSQL database storing user and session data
    technology: PostgreSQL
    features:
      - FEAT-001.1    # User Registration (data storage)
      - FEAT-001.2    # User Login (data retrieval)
      - FEAT-001.3    # Password Reset (data update)
    dependencies: []
    integration_points: []

  - id: COMP-INFRA-001
    name: Email Service
    type: Infrastructure
    description: Email sending service for notifications
    technology: SendGrid
    features:
      - FEAT-001.1    # Registration confirmation emails
      - FEAT-001.3    # Password reset emails
    dependencies: []
    integration_points:
      - type: Message
        target: COMP-BACKEND-001
        description: Receive email send requests
        protocol: MessageQueue
```

---

## Validation Tools

### Schema Validation

**YAML Parsers:**
- Python: `PyYAML` library
- JavaScript: `js-yaml` library
- Online: yamllint.com

### Validation Checklist

**requirements-matrix.yaml:**
- [ ] YAML parses without errors
- [ ] All required fields present
- [ ] ID format correct (EPIC-XXX, FEAT-XXX.X, etc.)
- [ ] Traceability chain complete
- [ ] No circular dependencies
- [ ] All referenced components exist in component-registry

**data-dictionary.yaml:**
- [ ] YAML parses without errors
- [ ] All required fields present
- [ ] Data types are valid
- [ ] Relationships reference existing entities
- [ ] Validation rules use correct syntax
- [ ] All entities mentioned in requirements exist here

**component-registry.yaml:**
- [ ] YAML parses without errors
- [ ] All required fields present
- [ ] Component IDs follow format (COMP-[TYPE]-XXX)
- [ ] All referenced features exist in requirements-matrix
- [ ] No circular dependencies
- [ ] Integration points reference valid components

---

## Common Validation Errors

### Error: "Invalid YAML syntax"

**Cause:** Indentation or formatting issue

**Fix:**
- Use 2-space indentation consistently
- Check for tabs (use spaces only)
- Validate with yamllint

### Error: "Missing required field"

**Cause:** Required field not provided

**Fix:**
- Review schema above
- Add missing required fields
- Check spelling of field names

### Error: "Invalid ID format"

**Cause:** ID doesn't match required format

**Fix:**
- Epic: `EPIC-001` (3 digits)
- Feature: `FEAT-001.1` (epic.feature)
- Story: `STORY-001.1.1` (epic.feature.story)
- Task: `TASK-001.1.1.1` (epic.feature.story.task)
- Component: `COMP-TYPE-001` (type is Frontend/Backend/Data/Infrastructure)

### Error: "Broken traceability reference"

**Cause:** Referenced ID doesn't exist

**Fix:**
- Check spelling of referenced IDs
- Ensure referenced items exist
- Verify hierarchical numbering

### Error: "Circular dependency detected"

**Cause:** Feature A depends on B, B depends on A

**Fix:**
- Review dependency chain
- Break circular reference
- Consider if both dependencies necessary

---

## Usage in ROME Workflow

### Phase 1 (HTM Decomposer)
- **Generates:** All three YAML files
- **Validates:** Self-check against schemas
- **Output:** `PROJECT/requirements/`

### Phase 2 (PMA)
- **Reads:** All three YAML files
- **Uses:** For architecture design
- **Refines:** data-dictionary.yaml → data_model.md

### Phase 2A (UX Clara)
- **Reads:** requirements-matrix.yaml, data-dictionary.yaml
- **Uses:** For UI design decisions
- **Creates:** Design artifacts

### Phase 2B (Chaperone)
- **Validates:** All YAML files against schemas
- **Checks:** Completeness, consistency, cross-references
- **Approves:** Or blocks with specific issues

### Phase 3 (Development Robots)
- **Reads:** Component assignments from component-registry.yaml
- **Implements:** Features mapped to their components
- **Tests:** Against acceptance criteria in requirements-matrix.yaml

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 5.0 | 2025-11-06 | Initial YAML schema definitions for HTM integration |

---

## Related Documents

- `/ROME/integration/htm-rome-integration-guide.md` - Overall workflow
- `/ROME/integration/htm-to-pma-handoff.md` - Handoff protocol
- `ROME/02-phase1-requirements/role-talib.md` - HTM Decomposer (Talib) role
- `/HTM/HTM-Master-Workflow.md` - HTM methodology

---

**Use these schemas to validate HTM Phase 1 artifacts before handoff to Phase 2.**
