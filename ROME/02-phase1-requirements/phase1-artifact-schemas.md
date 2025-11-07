# Phase 1 Artifact Schemas: YAML Reference

**Version**: 6.0 - Evolutionary, Session-Continuous, Robot-Native
**Date**: 2025-11-07
**Purpose**: Define schemas for Phase 1 (Talib) output artifacts
**Audience**: Developers implementing Phase 1 tooling, users validating Phase 1 output

---

## Overview

Phase 1 (Talib) generates a single primary YAML artifact:

**`PROJECT/dev/requirements-matrix.yaml`** - Complete requirements hierarchy with Epic → Feature → Story hierarchy and full traceability

This document defines the schema and structure for this artifact.

---

## requirements-matrix.yaml Schema

### Purpose

Complete requirements hierarchy from Epic → Feature → Story with full traceability, acceptance criteria, and dependency tracking.

### Top-Level Structure

```yaml
metadata:
  version: "6.0"
  created: "2025-11-07"
  created_by: "robot_talib"
  project_name: "Your Project"
  project_description: "Brief description"

epics:
  - id: EPIC-001
    name: string
    description: string
    business_value: string (optional)
    priority: "High|Medium|Low" (optional)
    acceptance_criteria:
      - string
    features: [...]
```

### Epic Level Schema

```yaml
epics:
  - id: EPIC-XXX                    # Required. Format: EPIC-001, EPIC-002, etc.
    name: string                    # Required. Short, clear epic name
    description: string             # Required. Detailed epic description (2-4 sentences)
    business_value: string          # Optional. Business justification ("Enables X" / "Solves Y")
    priority: string                # Optional. High / Medium / Low
    acceptance_criteria:            # Required. List of 2-5 acceptance criteria
      - string                      # Example: "Epic is complete when all features are working"
    features:
      - {...}                       # See Feature Level Schema below
```

**Epic ID Format**: `EPIC-XXX` (e.g., EPIC-001, EPIC-002)

**Example Epic**:
```yaml
- id: EPIC-001
  name: "User Account Management"
  description: "Allow users to create accounts, authenticate, and manage their profile"
  business_value: "Enables personalization and user-specific features"
  priority: High
  acceptance_criteria:
    - Users can sign up with email and password
    - Users can log in and maintain sessions
    - Users can update their profile information
  features:
    - {...}
```

---

### Feature Level Schema

```yaml
features:
  - id: FEAT-XXX.X                  # Required. Format: FEAT-001.1, FEAT-001.2, etc.
    name: string                    # Required. Short feature name
    description: string             # Required. Detailed feature description
    priority: string                # Optional. High / Medium / Low
    ui_required: boolean            # Optional. Does this feature need UI? Default: true
    dependencies:                   # Optional. List of features this depends on
      - string                      # Format: FEAT-XXX.X
    acceptance_criteria:            # Required. List of 2-5 acceptance criteria
      - string                      # Example: "Feature works when user can X"
    stories:
      - {...}                       # See Story Level Schema below
```

**Feature ID Format**: `FEAT-{EPIC-#}.{FEATURE-#}` (e.g., FEAT-001.1, FEAT-001.2)
- First number: Epic ID (001, 002, etc.)
- Second number: Feature sequence within epic (1, 2, 3, etc.)

**Example Feature**:
```yaml
- id: FEAT-001.1
  name: "User Registration"
  description: "New users can create an account by providing email and password"
  priority: High
  ui_required: true
  acceptance_criteria:
    - User can access registration form
    - User can submit valid email and password
    - Account is created in database
    - Confirmation email is sent
  stories:
    - {...}
```

---

### Story Level Schema

```yaml
stories:
  - id: STORY-XXX.X.X              # Required. Format: STORY-001.1.1, STORY-001.1.2, etc.
    name: string                   # Required. Short story name
    as_a: string                   # Required. User role ("As a [role]")
    i_want: string                 # Required. Capability ("I want to [action]")
    so_that: string                # Required. Benefit ("So that [benefit]")
    acceptance_criteria:           # Required. List of 2-5 acceptance criteria
      - string                     # Specific, testable criteria
    dependencies:                  # Optional. List of stories this depends on
      - string                     # Format: STORY-XXX.X.X
    tasks:
      - {...}                      # See Task Level Schema below
```

**Story ID Format**: `STORY-{FEATURE-ID}.{STORY-#}` (e.g., STORY-001.1.1, STORY-001.1.2)

**Story Format (User Story Standard)**:
- **As a** [user role]: Who is performing the action?
- **I want to** [capability]: What do they want to do?
- **So that** [benefit]: Why do they want to do it?

**Example Story**:
```yaml
- id: STORY-001.1.1
  name: "Fill out registration form"
  as_a: "new user"
  i_want: "enter my email and password in a form"
  so_that: "I can create an account"
  acceptance_criteria:
    - Form displays email input field
    - Form displays password input field
    - Form displays password confirmation field
    - User can click Submit button
    - User can click Cancel button
  tasks:
    - {...}
```

---

### Task Level Schema

```yaml
tasks:
  - id: TASK-XXX.X.X.X             # Required. Format: TASK-001.1.1.1, etc.
    name: string                   # Required. Short task name
    description: string            # Required. Detailed task description
    component: string              # Required. Component ID (what area/module)
    complexity: string             # Optional. Low / Medium / High
    acceptance_criteria:           # Required. List of 2-5 acceptance criteria
      - string                     # Specific, testable criteria
    dependencies:                  # Optional. List of tasks this depends on
      - string                     # Format: TASK-XXX.X.X.X
```

**Task ID Format**: `TASK-{STORY-ID}.{TASK-#}` (e.g., TASK-001.1.1.1, TASK-001.1.1.2)

**Task Purpose**: Technical breakdown of work for Phase 2 (PMA) to estimate and Phase 3 robots to implement

**Example Task**:
```yaml
- id: TASK-001.1.1.1
  name: "Create registration form HTML"
  description: "Build HTML form with email, password, and password confirmation fields with proper labeling"
  component: "auth-ui"
  complexity: Low
  acceptance_criteria:
    - Form has email input field with type="email"
    - Form has password input field with type="password"
    - Form has password confirmation field with type="password"
    - All fields have descriptive labels
    - Form has visible Submit button
    - Form has Cancel button that clears form
```

---

## Validation Rules

### ID Format Rules

1. **Epic**: `EPIC-XXX` format (3 digits, zero-padded)
   - Example: EPIC-001, EPIC-002, EPIC-010

2. **Feature**: `FEAT-XXX.X` format (epic + feature sequence)
   - Example: FEAT-001.1, FEAT-001.2, FEAT-002.1
   - Must match parent epic ID

3. **Story**: `STORY-XXX.X.X` format (feature + story sequence)
   - Example: STORY-001.1.1, STORY-001.1.2
   - Must match parent feature ID

4. **Task**: `TASK-XXX.X.X.X` format (story + task sequence)
   - Example: TASK-001.1.1.1, TASK-001.1.1.2
   - Must match parent story ID

### Traceability Rules

1. **Hierarchical Integrity**:
   - Every feature belongs to exactly one epic
   - Every story belongs to exactly one feature
   - Every task belongs to exactly one story
   - ID hierarchy reflects this: child IDs contain parent ID

2. **Dependency Constraints**:
   - Dependencies must reference valid IDs
   - No circular dependencies allowed
   - Cross-level dependencies allowed (e.g., feature can depend on feature from another epic)

3. **Content Requirements**:
   - Epic: Must have name, description, at least 1 feature
   - Feature: Must have name, description, at least 1 story
   - Story: Must have user story format (as_a, i_want, so_that)
   - Task: Must have name, description, component

4. **Acceptance Criteria**:
   - At least 2 acceptance criteria per level
   - Criteria must be testable/verifiable
   - Criteria should use specific language (not "should work" but "user can see X")

---

## Example: Complete requirements-matrix.yaml

```yaml
metadata:
  version: "6.0"
  created: "2025-11-07"
  created_by: "robot_talib"
  project_name: "Project Management App"
  project_description: "Simple tool for managing projects and tasks"

epics:
  - id: EPIC-001
    name: "User Account Management"
    description: "Allow users to create accounts and authenticate"
    priority: High
    acceptance_criteria:
      - Users can sign up with email/password
      - Users can log in and log out
      - User sessions persist across requests
    features:
      - id: FEAT-001.1
        name: "User Registration"
        description: "New users can create accounts"
        ui_required: true
        acceptance_criteria:
          - Registration form displays correctly
          - User can submit valid credentials
          - Account is created in database
        stories:
          - id: STORY-001.1.1
            name: "Display registration form"
            as_a: "new user"
            i_want: "see a registration form"
            so_that: "I can create an account"
            acceptance_criteria:
              - Form is visible and accessible
              - Form has email and password fields
              - Form has submit and cancel buttons
            tasks:
              - id: TASK-001.1.1.1
                name: "Create registration form component"
                description: "Build HTML/CSS form with email and password fields"
                component: "auth-ui"
                complexity: Low
                acceptance_criteria:
                  - Form displays on page
                  - All fields are visible
                  - Form is responsive on mobile

  - id: EPIC-002
    name: "Project Management"
    description: "Allow users to create and manage projects"
    priority: High
    acceptance_criteria:
      - Users can create projects
      - Users can view their projects
      - Users can delete projects
    features:
      - id: FEAT-002.1
        name: "Create Project"
        description: "Users can create new projects"
        ui_required: true
        dependencies:
          - FEAT-001.1  # User must be able to create account first
        acceptance_criteria:
          - User sees create project button
          - User can enter project name and description
          - Project is saved to database
        stories:
          - id: STORY-002.1.1
            name: "Display create project form"
            as_a: "authenticated user"
            i_want: "see a form to create a new project"
            so_that: "I can start managing a project"
            acceptance_criteria:
              - Form displays when user clicks 'New Project'
              - Form has project name field
              - Form has description field
            tasks:
              - id: TASK-002.1.1.1
                name: "Create project form UI"
                description: "Build form with name and description fields"
                component: "project-ui"
                complexity: Low
                acceptance_criteria:
                  - Form displays on page
                  - Fields are properly labeled
```

---

## Notes for Phase 1 Users

1. **Don't worry about perfect structure** - Talib will validate and refine
2. **Focus on clarity** - Acceptance criteria should be testable
3. **Dependencies are optional** - Only include if one requirement blocks another
4. **Complexity is guidance** - Helps Phase 2 (PMA) estimate effort
5. **User stories follow standard format** - "As a [role], I want [capability], so that [benefit]"

---

## Reference

**See also**:
- `role-talib.md` - Complete Talib (Phase 1 Requirements Engineer) role specification
- `phase1-to-phase2-handoff.md` - How Phase 1 artifacts handoff to Phase 2
- `00-start/README.md` - Complete ROME 6.0 project launch guide

---

**This schema enables clear, traceable requirements that Phase 2 (PMA) uses to design architecture.**
