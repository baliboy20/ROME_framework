# Data Model
**Project:** [Project Name]  
**Created:** [Date]  
**Last Updated:** [Date]

---

## Core Entities

### [Entity Name 1]

**Attributes:**
- id: UUID (PK, auto-generated)
- field1: Type (constraints, e.g., required, max length)
- field2: Type (constraints)
- field3: Type (optional)
- created_at: Timestamp (auto-generated)
- updated_at: Timestamp (auto-updated)

**Example:**
```
User
- id: UUID (PK)
- email: String (required, unique, max 255 chars)
- name: String (required, max 100 chars)
- role: Enum [admin, user] (required, default: user)
- created_at: Timestamp (auto)
- updated_at: Timestamp (auto)
```

### [Entity Name 2]

**Attributes:**
- [List attributes with types and constraints]

---

## Relationships

### One-to-Many
- [Entity A] has many [Entity B]
- [Entity B] belongs to [Entity A]
- Foreign Key: [Entity B].entity_a_id → [Entity A].id
- Cascade: [On delete, what happens?]

**Example:**
```
User has many Projects
Project belongs to User
- Foreign Key: projects.user_id → users.id
- Cascade: ON DELETE CASCADE (delete all user's projects when user deleted)
```

### Many-to-Many
- [Entity A] has many [Entity B] through [Join Table]
- [Entity B] has many [Entity A] through [Join Table]
- Join Table: [table_name] (entity_a_id, entity_b_id)

**Example:**
```
Project has many Users (collaborators) through project_users
User has many Projects (collaborating on) through project_users
- Join Table: project_users (project_id, user_id, role)
```

---

## Validation Rules

### Field-Level Validation

**[Entity Name]:**
- field1: [Rule - e.g., Required, max 100 characters]
- field2: [Rule - e.g., Valid email format]
- field3: [Rule - e.g., Must be positive number]

**Example:**
```
User:
- email: Required, valid email format, max 255 chars
- name: Required, min 2 chars, max 100 chars
- role: Must be 'admin' or 'user'
```

### Entity-Level Validation

**[Entity Name]:**
- [Complex validation across multiple fields]
- [Unique constraints involving multiple fields]

**Example:**
```
Project:
- name must be unique per user (user_id + name)
- cannot have more than 50 active projects per user
```

### Cross-Entity Validation

**[Validation Rule]:**
- [Description of validation involving multiple entities]

**Example:**
```
Task Assignment:
- Task can only be assigned to users who are project collaborators
- Cannot assign more than 20 active tasks per user
```

---

## Business Rules

### [Entity Name] Business Rules

1. **[Rule Name]:**
   - Description: [What is the rule?]
   - Enforcement: [Where is it enforced? DB constraint, application logic, etc.]
   - Example: [Concrete example]

**Example:**
```
Project Status Transitions:
- Description: Projects can only transition through specific states
- Allowed: draft → active → archived
- Forbidden: Cannot go from archived back to active
- Enforcement: Application logic in backend
- Example: Active project can be archived, but cannot be set back to draft
```

2. **[Another Rule]:**
   - Description: ...

---

## Entity Lifecycle & State Transitions

### [Entity Name] States

**States:**
- [State 1]: [Description]
- [State 2]: [Description]
- [State 3]: [Description]

**Transitions:**
```
[State 1] → [State 2]: [Condition]
[State 2] → [State 3]: [Condition]
[State 3] → [Final]: [Condition]
```

**Example:**
```
Project States:
- draft: Initial state, project being set up
- active: Project in progress
- completed: All tasks done
- archived: Project finished and archived

Transitions:
draft → active: When user marks project as active
active → completed: When all tasks are completed
completed → archived: When user archives project
archived → active: FORBIDDEN (cannot reactivate)
```

---

## Indexes

### Performance Indexes

**[Entity Name]:**
- Index on [field(s)]: For [query optimization purpose]

**Example:**
```
projects:
- Index on (user_id): For fetching user's projects
- Index on (status): For filtering by project status
- Composite index on (user_id, status): For user's projects by status

tasks:
- Index on (project_id): For fetching project's tasks
- Index on (assigned_user_id): For user's assigned tasks
- Index on (due_date): For sorting by due date
```

---

## Constraints Summary

### Primary Keys
- [Entity].id: UUID primary key

### Foreign Keys
- [Entity].[field] → [Referenced Entity].id

### Unique Constraints
- [Entity].[field(s)]: Unique constraint
- [Entity].[field1 + field2]: Composite unique

### Check Constraints
- [Entity].[field]: [Constraint description]

**Example:**
```
Users:
- PK: users.id
- Unique: email
- Check: role IN ('admin', 'user')

Projects:
- PK: projects.id
- FK: projects.user_id → users.id
- Unique: (user_id, name) - project name unique per user
- Check: status IN ('draft', 'active', 'completed', 'archived')

Tasks:
- PK: tasks.id
- FK: tasks.project_id → projects.id
- FK: tasks.assigned_user_id → users.id
- Check: priority BETWEEN 1 AND 5
```

---

## Data Access Patterns

### Common Queries

1. **[Query Description]:**
   - Frequency: [How often?]
   - Performance Requirement: [Response time target]
   - Index Used: [Which index optimizes this?]

**Example:**
```
1. Fetch user's active projects:
   - Frequency: Very high (every page load)
   - SQL: SELECT * FROM projects WHERE user_id = ? AND status = 'active'
   - Performance: < 50ms
   - Index: (user_id, status)

2. Fetch project with tasks:
   - Frequency: High
   - SQL: JOIN projects with tasks
   - Performance: < 100ms
   - Index: tasks.project_id
```

---

## Example Data

### [Entity Name] Examples

```json
{
  "id": "uuid-123",
  "field1": "value1",
  "field2": "value2",
  "created_at": "2025-10-07T10:00:00Z",
  "updated_at": "2025-10-07T10:00:00Z"
}
```

**Example:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "user",
  "created_at": "2025-10-07T10:00:00Z",
  "updated_at": "2025-10-07T10:00:00Z"
}
```

---

## Notes

- All timestamps are stored in UTC
- UUIDs are version 4 (random)
- Soft deletes: [If applicable, describe approach]
- Audit trail: [If applicable, describe approach]
- Data retention: [Describe retention policies]

---

## Change Log

| Date | Change | Changed By |
|------|--------|------------|
| 2025-10-07 | Initial data model created | PMA |
| [Date] | [Description of change] | [Who] |
