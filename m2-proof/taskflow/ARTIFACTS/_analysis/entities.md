# TaskFlow — Analysis (M2 proof subset)

Source: REQ-001 (create project), REQ-002 (create task).

## Entities

### Project (from REQ-001)
- id (unique)
- name (unique within team)
- description (optional)
- ownerId → TeamMember
- teamId → Team
- archived (boolean)

### Task (from REQ-002)
- id (unique)
- projectId → Project (exactly one)
- title (required)
- description (optional)
- status (Backlog | Todo | InProgress | Review | Done)

### TeamMember
- id
- teamId
- role (Admin | Member)

## Relationships
- Team 1—* Project
- Project 1—* Task
- TeamMember *—* Project (membership)

## Traceability
- REQ-001 → Project entity, ownership invariant
- REQ-002 → Task entity, status workflow invariant
