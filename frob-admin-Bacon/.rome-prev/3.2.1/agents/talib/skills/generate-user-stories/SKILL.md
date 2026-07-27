# generate-user-stories Skill

| Field | Value |
|-------|-------|
| **Skill UID** | rome-p2-analysis:generate-user-stories |
| **Version** | 1.0.0 |
| **Date** | 2026-01-07T00:00:00Z |
| **Status** | Active |
| **Document Type** | Skill Definition |
| **Plugin** | rome-p2-analysis |
| **Tier** | 2 (Composition) |
| **Phase** | P02-analysis |

---

## Purpose

Auto-generates user stories from AORDL requirements with full traceability to source requirements.

## Usage

```bash
/generate-user-stories --source-file requirements-catalog.md --output-file user-stories.md
```

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| source_file | string | Yes | Path to requirements catalog or directory of REQ-###.yaml files |
| output_file | string | No | Path to save user stories |
| format | string | No | markdown or yaml (default: markdown) |
| include_acceptance_criteria | boolean | No | Generate AC from AORDL (default: true) |

## Story Generation

Transforms AORDL into user story format:

**From AORDL:**
```yaml
ID: REQ-001
Actor: ProjectManager
Intent: create project
Outcomes:
  - Project is created and visible in project list
```

**To User Story:**
```markdown
## FUNC-001: Create Project

**As a** ProjectManager
**I want to** create project
**So that** project is created and visible in project list

**Traced from:** REQ-001

### Acceptance Criteria
- [ ] Project is created and visible in project list
- [ ] Project status is ACTIVE
- [ ] User receives confirmation message
```

## Returns

```json
{
  "stories_count": 15,
  "output_file": "user-stories.md",
  "stories": [
    {
      "id": "FUNC-001",
      "title": "Create Project",
      "actor": "ProjectManager",
      "capability": "create project",
      "benefit": "project is created and visible in project list",
      "traced_from": "REQ-001",
      "acceptance_criteria": [...]
    }
  ]
}
```

## Implementation

Parses AORDL requirements and generates standardized user story format with traceability.

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 1.0.0 | 2026-01-07T00:00:00Z | Initial skill definition for rome-p2-analysis plugin |
