# Verify Change Implementation

**ID**: verify-change-implementation
**Category**: Change Management
**Phase**: Post-Delivery
**Robot**: Sarah
**Reference**: Change Request Protocol

## Purpose

After CR implementation (or rollback), verify the traceability chain remains intact and all listed artifacts have been correctly updated.

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `--cr` | String | Yes | CR ID to verify (e.g. CR-001) |
| `--mode` | Enum | No | `implementation` (default) or `rollback` |

## Verification Checklist

### For `--mode implementation`

| # | Check | Severity |
|---|-------|----------|
| 1 | All REQ-### in `ImpactAnalysis.requirements` have a `ChangeHistory` entry referencing this CR | CRITICAL |
| 2 | All SPEC-### and design files in `ImpactAnalysis.design` have a `ChangeHistory` entry | CRITICAL |
| 3 | All source files in `ImpactAnalysis.code` have been modified (git diff confirms) | HIGH |
| 4 | All source file git commits reference `CR-###` in commit message | HIGH |
| 5 | REQ→FUNC→UC→Code chain still resolves for all affected requirements | CRITICAL |
| 6 | Activity log shows all implementing robots logged COMPLETED for their domain | HIGH |
| 7 | If `migrationRequired:true`: Ashok confirms migration ran successfully | CRITICAL |
| 8 | Tests pass (existing test suite + any new tests added for this CR) | HIGH |

### For `--mode rollback`

| # | Check | Severity |
|---|-------|----------|
| 1 | All modified artifacts have `CR-###-ROLLBACK` ChangeHistory entry | CRITICAL |
| 2 | If migration required: rollback script executed successfully | CRITICAL |
| 3 | REQ→FUNC→UC→Code chain restored to pre-CR state | HIGH |
| 4 | Tests pass after rollback | HIGH |

## Procedure

```
1. Read ARTIFACTS/changes/CR-###.yaml for ImpactAnalysis lists
2. For each listed requirement file: verify ChangeHistory contains CR-### entry
3. For each listed design file: verify ChangeHistory contains CR-### entry
4. For each listed source file: verify file modified + commit message contains CR-###
5. Run /verify-traceability for all affected REQ-### to confirm chain intact
6. Check activity log: all robots that owned domain changes show COMPLETED
7. If migrationRequired: query Ashok's activity log entries for migration confirmation
8. If all checks pass:
   a. Update CR-###.yaml: Status: COMPLETED, VerifiedBy: sarah, VerifiedDate: [ISO-8601]
   b. Log: CHANGE_REQUEST | CR-### | status:COMPLETED | robot:sarah | traceabilityVerified:true
   c. Report COMPLETED to Roma
9. If any CRITICAL failure:
   a. Create BLOCKER entry
   b. Report BLOCKED to Roma
```

## Output

- CR-###.yaml with status COMPLETED (or ROLLED_BACK if mode=rollback)
- Activity log entry
- Report to Roma
