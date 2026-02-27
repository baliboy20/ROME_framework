# Rollback Change

**ID**: rollback-change
**Category**: Change Management
**Phase**: Post-Delivery
**Robot**: Roma (coordinates); each implementing robot reverses their changes
**Reference**: ROME-PROP-015, ROME-PROP-026 §G4

## Purpose

Coordinate reversal of a completed CR in dependency-reversed order. Ensures database migrations roll back before API, API before UI.

## When to Use

When a deployed CR causes production issues, test failures, or UAT rejection.

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `--cr` | String | Yes | CR ID to roll back (e.g. CR-001) |
| `--reason` | String | Yes | Reason for rollback |

## Outputs

- CR-###.yaml status updated to `ROLLED_BACK`
- Activity log entry: `CHANGE_REQUEST | CR-### | status:ROLLED_BACK`
- `ChangeHistory` ROLLBACK entries appended to all affected artifacts

## Rollback Order

Reverse dependency order (opposite of implementation order):

```
1. Charlie  — revert UI components
2. Reena    — revert API changes (restore previous version if versioned)
3. Ashok    — run migrationRollback script (if migrationRequired was true)
4. PMA      — revert design documents
5. Talib    — revert requirement files
```

## Procedure

```
1. Read CR-###.yaml — note ImpactAnalysis and Rollback sections
2. Log: CHANGE_REQUEST | CR-### | status:ROLLED_BACK | robot:roma | reason:"[reason]"
3. For each robot in reverse order:
   a. Robot reverts their files (git revert or manual restore)
   b. Robot appends CR-###-ROLLBACK ChangeHistory entry to each modified artifact:
      changeHistory:
        - changeRequest: CR-###-ROLLBACK
          date: [ISO-8601]
          type: ROLLBACK
          implementedBy: [robot]
          changes: [list of reverted fields]
   c. Robot logs STORY COMPLETED in activity log
4. If Rollback.migrationRollback is set: Ashok executes rollback script
5. Roma verifies with Sarah via /verify-change-implementation --cr CR-### --mode rollback
6. Update CR-###.yaml: Status: ROLLED_BACK, RollbackDate, RollbackReason
```

## Notes

- Git revert preferred over hard reset to preserve history
- If partial implementation: only reverse what was completed
- Lucien reverses any CI/CD changes (re-deploys previous pipeline config)
