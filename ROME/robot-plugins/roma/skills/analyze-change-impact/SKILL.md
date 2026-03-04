# Analyze Change Impact

**ID**: analyze-change-impact
**Category**: Change Management
**Phase**: Post-Delivery
**Robot**: Roma (orchestrates); each robot analyses their own domain

## Purpose

Systematically identify all artifacts affected by a CR across all layers (requirements, design, code, libraries, pipelines) and populate the `ImpactAnalysis` section of `CR-###.yaml`.

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `--cr` | String | Yes | CR ID (e.g. CR-001) |

## Outputs

- Updated `CR-###.yaml` with `ImpactAnalysis` sections populated
- Activity log entry: `CHANGE_REQUEST | CR-### | status:ANALYZED`

## Domain Responsibilities

| Robot | ImpactAnalysis Section | What to Search |
|-------|----------------------|----------------|
| Talib | `requirements` | All REQ-### and FUNC-### files referencing changed concept |
| PMA | `design` | SPEC-###, data-dictionary.yaml, API contracts |
| Ashok | `code` (db), `libraries` (db deps) | Database models, migration files |
| Reena | `code` (api), `libraries` (api deps) | API controllers, routes, middleware |
| Charlie | `code` (ui), `libraries` (ui deps) | UI components, screens |
| Lucien | `pipelines` | CI/CD workflow files, deployment scripts |

## Procedure

```
1. Roma searches ARTIFACTS/ and SOURCE/ for all references to the subject of the change
2. Roma assigns each robot to their domain analysis
3. Each robot:
   a. Searches their domain for affected files
   b. Lists affected file paths in appropriate ImpactAnalysis section
   c. Identifies any library version changes required (libraries section)
   d. Reports findings to Roma
4. Lucien identifies pipeline/CI/CD impacts (pipelines section)
5. Roma aggregates all findings into CR-###.yaml:
   - Populates requirements, design, code, libraries, pipelines arrays
   - Sets RiskAssessment fields: breaking, dataLoss, rollbackComplexity, testingRequired,
     deploymentRisk, migrationRequired
   - Documents Rollback.plan (and migrationRollback if migration required)
6. Log: CHANGE_REQUEST | CR-### | status:ANALYZED | robot:roma | breaking:[bool]
         | requirementsAffected:[n] | codeFilesAffected:[n]
```

## Library Impact Entry Format

```yaml
ImpactAnalysis:
  libraries:
    - capability: api
      robot: reena
      package: "express"
      currentVersion: "4.18.0"
      requiredVersion: "5.0.0"
      breakingChange: true
      reason: "[Why upgrade is needed]"
```

## Pipeline Impact Entry Format

```yaml
ImpactAnalysis:
  pipelines:
    - type: DATABASE_MIGRATION | CI_CHANGE | DEPLOYMENT_ORDER_CHANGE
      script: "migrations/003_add_field.sql"
      runBefore: "api-deployment"
      runAfter: "database-deployment"
      canRollback: true
      rollbackScript: "migrations/003_add_field_rollback.sql"
      stagingRequired: true
      notes: "[Any sequencing or backfill notes]"
```

## Next Step

After analysis: submit to Sarah via `/approve-change-request --cr CR-###`
