# TaskFlow — Design Validation Report (P3)

Validator: Clara (P3-design, independent). Date: 2026-06-18.
Verdict: **PASS**

Sources: REQ-001.yaml, REQ-002.yaml, _analysis/entities.md
Targets: _design/architecture.md, _design/data-dictionary.md

## (a) Requirement coverage
- REQ-001 (create project): covered — ProjectHandler, POST /projects, projects table.
- REQ-002 (create task): covered — TaskHandler, POST /projects/{projectId}/tasks, tasks table.
- Both error messages per requirement are reproduced verbatim in the API rules.
- Both Security NFRs covered by AuthMiddleware; both Performance NFRs (<2s) reflected in D1 commit notes.

## (b) Data dictionary consistency with analysis/requirements
- Project: id (PK/unique), name (NOT NULL, UNIQUE(teamId,name)), description (nullable), ownerId (NOT NULL FK), teamId (NOT NULL FK), archived (default false) — matches entities.md and REQ-001.
- Task: id, projectId (NOT NULL FK), title (NOT NULL non-empty), description (nullable), status (default 'Backlog', CHECK in {Backlog,Todo,InProgress,Review,Done}) — matches entities.md and REQ-002.
- Invariants verified:
  - Project one owner: ownerId NOT NULL + API sets ownerId=caller (single value). OK.
  - Project unique name: UNIQUE(teamId, name) constraint. OK.
  - Task belongs to one project: projectId NOT NULL FK, set from path. OK.
  - Task valid status: CHECK constraint over workflow set; default Backlog. OK.

## (c) Scope discipline
- Design limited to the two requirements. No project deletion, member invitation, task assignment, or due-date features introduced.
- `archived` column is included but justified: it backs REQ-002's "Project is not archived" condition (no archive-management endpoint added). Acceptable, not scope creep.
- TeamMember/Team referenced only as FK targets (from analysis); no CRUD added.

## (d) Completeness (API path + entity per requirement)
- REQ-001: POST /projects + Project entity. Complete.
- REQ-002: POST /projects/{projectId}/tasks + Task entity. Complete.

## Notes
- archived is documented as API-enforced for task creation and FK-resolved against Project; consistent across both artifacts.
- No inconsistencies, gaps, or out-of-scope elements found.
