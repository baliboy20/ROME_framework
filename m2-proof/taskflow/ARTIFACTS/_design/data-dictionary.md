# TaskFlow — Data Dictionary (M2 proof subset)

Scope: REQ-001 (Project), REQ-002 (Task) ONLY. Store: D1 / SQLite.

## Project  [REQ-001]

| Field | Type | Constraints | Trace |
|-------|------|-------------|-------|
| id | TEXT | PK, unique, system-generated | REQ-001 postcond (unique identifier) |
| name | TEXT | NOT NULL, unique within teamId | REQ-001 invariant (name unique in team) |
| description | TEXT | NULLABLE (optional) | REQ-001 OpenQuestion RESOLVED: optional |
| ownerId | TEXT | NOT NULL, FK→TeamMember.id | REQ-001 postcond/invariant (exactly one owner) |
| teamId | TEXT | NOT NULL, FK→Team.id | REQ-001 precond (belongs to team) |
| archived | BOOLEAN | NOT NULL, default false | supports REQ-002 archived check |

Constraints:
- UNIQUE(teamId, name) — REQ-001 invariant.
- Team project-count limit enforced at API (not column) — REQ-001 condition.

## Task  [REQ-002]

| Field | Type | Constraints | Trace |
|-------|------|-------------|-------|
| id | TEXT | PK, unique, system-generated | REQ-002 postcond (unique identifier) |
| projectId | TEXT | NOT NULL, FK→Project.id | REQ-002 invariant (exactly one project) |
| title | TEXT | NOT NULL, non-empty | REQ-002 InScope + error "Task title is required" |
| description | TEXT | NULLABLE (optional) | REQ-002 OpenQuestion RESOLVED: optional |
| status | TEXT | NOT NULL, default 'Backlog', ∈ {Backlog,Todo,InProgress,Review,Done} | REQ-002 postcond (initial Backlog) + invariant (workflow value) |

Constraints:
- CHECK(status IN ('Backlog','Todo','InProgress','Review','Done')) — REQ-002 invariant.
- Create allowed only when parent Project.archived = false — REQ-002 condition (API-enforced).

## Traceability
- REQ-001 → Project (all fields).
- REQ-002 → Task (all fields).
