# Approve Change Request

**ID**: approve-change-request
**Category**: Change Management
**Phase**: Post-Delivery
**Robot**: Sarah
**Reference**: Change Request Protocol

## Purpose

Review a CR-###.yaml, validate the impact analysis is complete and credible, and issue APPROVED or REJECTED.

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `--cr` | String | Yes | CR ID to review (e.g. CR-001) |

## Approval Checklist

Sarah BLOCKS if ANY of the following are not satisfied:

| # | Check | Severity |
|---|-------|----------|
| 1 | `ImpactAnalysis.requirements` lists all affected REQ-### files | CRITICAL |
| 2 | `ImpactAnalysis.design` lists all affected SPEC-###, data-dictionary entries, API contracts | CRITICAL |
| 3 | `ImpactAnalysis.code` lists all affected source files | CRITICAL |
| 4 | `ImpactAnalysis.libraries` documents any library version changes required | HIGH |
| 5 | `ImpactAnalysis.pipelines` documents CI/CD and migration ordering changes | HIGH |
| 6 | `RiskAssessment.breaking` correctly assessed (not left null) | HIGH |
| 7 | `Rollback.plan` is present and credible (not empty string) | HIGH |
| 8 | If `migrationRequired:true` → `Rollback.migrationRollback` path provided | CRITICAL |
| 9 | If `migrationRequired:true` → `ImpactAnalysis.pipelines` is not empty | CRITICAL |
| 10 | `GitBranch` is set to `cr/CR-###-[slug]` pattern | MEDIUM |

## Procedure

```
1. Read ARTIFACTS/changes/CR-###.yaml
2. Run through approval checklist — flag each failure
3. If ALL CRITICAL checks pass AND no HIGH failures (or justified exceptions):
   a. Update CR-###.yaml: Status: APPROVED, ApprovedBy: sarah, ApprovedDate: [ISO-8601]
   b. Log: CHANGE_REQUEST | CR-### | status:APPROVED | robot:sarah | approvedBy:sarah
   c. Report APPROVED to Roma
4. If any CRITICAL failure:
   a. Create BLOCKER entry with specific missing items
   b. Log: CHANGE_REQUEST | CR-### | status:PROPOSED | robot:sarah (reverts to PROPOSED for rework)
   c. Report BLOCKED to Roma with checklist failures
```

## Output

- CR-###.yaml with status APPROVED or left as PROPOSED (rework needed)
- Activity log entry
- Report to Roma
