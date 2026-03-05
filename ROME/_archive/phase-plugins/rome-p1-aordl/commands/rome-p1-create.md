# /rome-p1:create Command

| Field | Value |
|-------|-------|
| **Command UID** | rome-p1-aordl:create |
| **Version** | 1.0.0 |
| **Date** | 2026-01-07T00:00:00Z |
| **Status** | Active |
| **Document Type** | Slash Command Definition |
| **Plugin** | rome-p1-aordl |

---

## Purpose

Create a new AORDL requirement file from template with all 13 required fields.

## Usage

```bash
# Create new requirement
/rome-p1:create --requirement-id REQ-001 --actor ProjectManager --intent "create project"

# Create with custom output location
/rome-p1:create --requirement-id REQ-002 --actor TeamMember --intent "view project list" --output-file custom/path/REQ-002.yaml
```

## Parameters

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| requirement_id | Yes | string | REQ-### format (e.g., REQ-001) |
| actor | Yes | string | Specific role (not "User") |
| intent | Yes | string | Single atomic intent (verb + object) |
| output_file | No | string | Path to save requirement file |

## Template Structure

Generates YAML file with all 13 fields:

```yaml
ID: REQ-001
Actor: ProjectManager
Intent: create project

Preconditions:
  - [To be defined]

Conditions:
  - [To be defined]

Postconditions:
  - [To be defined]

Outcomes:
  - [To be defined]

Invariants:
  - [To be defined]

NonFunctional:
  Performance: []
  Security: []
  Usability: []

Errors:
  - error: "[To be defined]"
    message: "[To be defined]"
    httpCode: 400
    userAction: "[To be defined]"

ScopeBoundary:
  InScope: []
  OutOfScope: []

OpenQuestions:
  - question: "[To be defined]"
    status: OPEN
    decision: ""
    decisionDate: ""
    decisionBy: ""

CopilotMode: STRICT
```

## Workflow

1. Command creates file with template structure
2. User/agent fills in [To be defined] placeholders
3. Validate with `/rome-p1:validate` before committing

## Related

- Skill: rome-p1-aordl:create-aordl-requirement
- Agent: rome-p1-aordl:talib
- Phase: P01-aordl

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 1.0.0 | 2026-01-07T00:00:00Z | Initial command definition for rome-p1-aordl plugin |
