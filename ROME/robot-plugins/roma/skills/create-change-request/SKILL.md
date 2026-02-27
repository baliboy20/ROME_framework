# Create Change Request

**ID**: create-change-request
**Category**: Change Management
**Phase**: Post-Delivery (cycle complete)
**Robot**: Roma
**Reference**: ROME-PROP-015, ROME-PROP-026 §G4

## Purpose

Scaffold a new `CR-###.yaml` in `ARTIFACTS/changes/` with all required sections, and log the creation event to the activity log.

## When to Use

Only when the ROME cycle (P0–P5) is COMPLETED and the application is deployed. If the cycle is still active, use AMD-### instead (ROME-PRIN-001 §12).

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `--type` | Enum | Yes | TERMINOLOGY_CHANGE \| LOGIC_CHANGE \| SCHEMA_CHANGE \| API_CHANGE \| UI_CHANGE \| REQUIREMENT_CHANGE \| REFACTOR |
| `--title` | String | Yes | Human-readable summary of change |
| `--description` | String | Yes | Detailed description of what needs to change and why |
| `--requestedBy` | String | Yes | Robot name or "sponsor" |
| `--priority` | Enum | No | CRITICAL \| HIGH \| MEDIUM \| LOW (default: MEDIUM) |

## Outputs

- `ARTIFACTS/changes/CR-###.yaml` with status `PROPOSED`
- Activity log entry: `CHANGE_REQUEST | CR-### | status:PROPOSED`

## CR-###.yaml Structure

```yaml
ID: CR-###
Type: [type]
Status: PROPOSED
Priority: [priority]
Title: "[title]"
Description: |
  [description]
RequestedBy: [requestedBy]
RequestedDate: [ISO-8601]

ImpactAnalysis:
  requirements: []    # Talib populates (REQ-### references)
  design: []          # PMA populates (SPEC-###, data-dictionary, API contracts)
  code: []            # P5 robots populate (source file paths)
  libraries: []       # P5 robots + Lucien populate (package version changes)
  pipelines: []       # Lucien populates (CI/CD and migration ordering)

RiskAssessment:
  breaking: null
  dataLoss: null
  rollbackComplexity: null
  testingRequired: null
  deploymentRisk: null
  migrationRequired: null   # If true, pipelines section must not be empty

Rollback:
  plan: ""
  migrationRollback: ""     # Path to rollback script if migrationRequired:true

GitBranch: "cr/CR-###-[slug]"
```

## Procedure

```
1. Determine next CR number (check ARTIFACTS/changes/ for highest CR-###)
2. Write CR-###.yaml with status PROPOSED
3. Create git branch: cr/CR-###-[slug]
4. Log to activity log:
   CHANGE_REQUEST | CR-### | status:PROPOSED | robot:roma | type:[type] | title:"[title]" | requestedBy:[requestedBy]
5. Assign robots to populate ImpactAnalysis sections via /analyze-change-impact
```

## Next Step

After creation: run `/analyze-change-impact --cr CR-###`
