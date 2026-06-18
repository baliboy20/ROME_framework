# TaskFlow — Architecture (M2 proof subset)

Scope: REQ-001 (create project), REQ-002 (create task) ONLY.
Stack: Flutter web (client) | Cloudflare Workers (API) | D1 / SQLite (store).

## Components

- **FlutterClient** — web UI; auth token holder; calls API.
  - ProjectCreateForm → POST /projects [REQ-001]
  - TaskCreateForm → POST /projects/{projectId}/tasks [REQ-002]
- **APIWorker** (Cloudflare Worker) — REST entrypoint; auth check; validation; business rules; D1 access.
  - AuthMiddleware — verifies authenticated caller; team/project membership [REQ-001 sec, REQ-002 sec].
  - ProjectHandler — create-project logic [REQ-001].
  - TaskHandler — create-task logic [REQ-002].
- **D1Store** (SQLite) — `projects`, `tasks`, `team_members` tables. NFR: each create commits < 2s.

## REST Endpoints

### POST /projects  [REQ-001]
Auth: required; caller must be authenticated team member (ProjectAdmin).
Body: `{ "name": string (req), "description": string? }`
Rules:
- Team within allowed project count → else 409 "Project limit reached for this team".
- name unique within team → else 409 "A project with this name already exists".
Effect: insert project, generate unique id, set ownerId=caller, teamId=caller.team, archived=false.
201 → `{ id, name, description, ownerId, teamId, archived }`.
Invariant: exactly one owner; name unique per team.

### POST /projects/{projectId}/tasks  [REQ-002]
Auth: required; caller must be member of {projectId} (TeamMember).
Body: `{ "title": string (req), "description": string? }`
Rules:
- project not archived → else 409 "Cannot add tasks to an archived project".
- title non-empty → else 400 "Task title is required".
Effect: insert task, generate unique id, projectId={path}, status="Backlog".
201 → `{ id, projectId, title, description, status }`.
Invariant: task belongs to exactly one project; status ∈ workflow values.

## Data Flow

create project [REQ-001]:
FlutterClient → POST /projects (token)
→ AuthMiddleware (authn + team membership)
→ ProjectHandler: check team limit → check name uniqueness → INSERT projects (owner=caller)
→ D1 commit (<2s) → 201 → client adds to team project list.

create task [REQ-002]:
FlutterClient → POST /projects/{id}/tasks (token)
→ AuthMiddleware (authn + project membership)
→ TaskHandler: check project not archived → validate title → INSERT tasks (status=Backlog)
→ D1 commit (<2s) → 201 → client adds to project task list.

## Traceability
- REQ-001 → ProjectHandler, POST /projects, projects table.
- REQ-002 → TaskHandler, POST /projects/{projectId}/tasks, tasks table.
- Auth/membership checks → REQ-001 & REQ-002 Security NFRs.
