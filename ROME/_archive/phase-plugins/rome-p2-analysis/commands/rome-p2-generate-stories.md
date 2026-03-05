# /rome-p2:generate-stories Command

| Field | Value |
|-------|-------|
| **Command UID** | rome-p2-analysis:generate-stories |
| **Version** | 1.0.0 |
| **Date** | 2026-01-07T00:00:00Z |
| **Status** | Active |
| **Document Type** | Slash Command Definition |
| **Plugin** | rome-p2-analysis |

---

## Purpose

Auto-generate user stories from AORDL requirements with full traceability to source requirements.

## Usage

```bash
# Generate stories from catalog
/rome-p2:generate-stories --source-file requirements-catalog.md

# Generate with custom output
/rome-p2:generate-stories --source-file requirements-catalog.md --output-file user-stories.md

# Generate as YAML
/rome-p2:generate-stories --source-file requirements-catalog.md --format yaml

# Generate without acceptance criteria
/rome-p2:generate-stories --source-file requirements-catalog.md --include-acceptance-criteria false
```

## Parameters

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| source_file | Yes | string | Path to requirements catalog or directory of REQ-###.yaml files |
| output_file | No | string | Path to save user stories |
| format | No | string | markdown or yaml (default: markdown) |
| include_acceptance_criteria | No | boolean | Generate AC from AORDL (default: true) |

## Story Generation

Transforms AORDL into user story format:

**From AORDL:**
```yaml
ID: REQ-001
Actor: ProjectManager
Intent: create project
Outcomes:
  - Project is created and visible in project list
Postconditions:
  - Project status is ACTIVE
```

**To User Story (Markdown):**
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

**To User Story (YAML):**
```yaml
- id: FUNC-001
  title: Create Project
  actor: ProjectManager
  capability: create project
  benefit: project is created and visible in project list
  traced_from: REQ-001
  acceptance_criteria:
    - Project is created and visible in project list
    - Project status is ACTIVE
    - User receives confirmation message
```

## Mapping

| AORDL Field | User Story Element |
|-------------|-------------------|
| Actor | As a [role] |
| Intent | I want to [capability] |
| Outcomes | So that [benefit] |
| Outcomes + Postconditions | Acceptance Criteria |
| ID | Traced from |

## Traceability

Each generated story includes:
- **Traced from:** REQ-### - Links to source AORDL requirement
- Enables bidirectional traceability: AORDL ↔ User Story ↔ Design ↔ Code

## Use Cases

- Generate initial user stories from validated AORDL
- Create backlog for agile development
- Prepare for P3 design phase
- Establish requirements traceability chain

## Related

- Skill: rome-p2-analysis:generate-user-stories
- Agent: rome-p2-analysis:talib
- Phase: P02-analysis

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 1.0.0 | 2026-01-07T00:00:00Z | Initial command definition for rome-p2-analysis plugin |
