# create-aordl-requirement Skill

| Field | Value |
|-------|-------|
| **Skill UID** | rome-p1-aordl:create-aordl-requirement |
| **Version** | 1.0.0 |
| **Date** | 2026-01-07T00:00:00Z |
| **Status** | Active |
| **Document Type** | Skill Definition |
| **Plugin** | rome-p1-aordl |
| **Tier** | 1 (Atomic) |
| **Phase** | P01-aordl |

---

## Purpose

Creates a new AORDL requirement file from template with all 13 required fields.

## Usage

```bash
/create-aordl-requirement --requirement-id REQ-001 --actor ProjectManager --intent "create project"
```

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| requirement_id | string | Yes | REQ-### format (e.g., REQ-001) |
| actor | string | Yes | Specific role (not "User") |
| intent | string | Yes | Single atomic intent (verb + object) |
| output_file | string | No | Path to save requirement file |

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

## Returns

```json
{
  "requirement_id": "REQ-001",
  "file_path": "ARTIFACTS/_requirements/REQ-001.yaml",
  "status": "created"
}
```

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 1.0.0 | 2026-01-07T00:00:00Z | Initial skill definition for rome-p1-aordl plugin |
