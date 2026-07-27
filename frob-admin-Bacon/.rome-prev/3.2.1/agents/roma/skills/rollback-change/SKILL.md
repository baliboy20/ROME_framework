# Rollback Change

**ID**: rollback-change
**Category**: Change Management
**Phase**: Post-Delivery
**Robot**: Roma (coordinates); each implementing robot reverses their changes

## Purpose

Coordinate reversal of a completed CR in dependency-reversed order. Rollback sequence is derived from `tech-stack.yaml` capability dependencies — capabilities with dependents roll back before their dependencies.

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

Derived from `tech-stack.yaml` dependency graph, reversed:

```
1. Read tech-stack.yaml capabilities and dependencies
2. Build dependency graph (same as implementation order)
3. Rollback order = reverse of implementation order
   (capabilities with no dependents roll back first)
4. For each capability in rollback order:
   capability.robot reverts their workspace
5. Lucien reverses any CI/CD changes last
```

Example for a typical database→api→ui stack:
```
Implementation order: database → api → ui-app
Rollback order:       ui-app → api → database
```

## Procedure

```
1. Read CR-###.yaml — note ImpactAnalysis and Rollback sections
2. Read tech-stack.yaml — derive rollback order from reversed dependency graph
3. Log: CHANGE_REQUEST | CR-### | status:ROLLED_BACK | robot:roma | reason:"[reason]"
4. For each capability in rollback order:
   a. Robot reverts their files (git revert preferred over hard reset)
   b. Robot appends CR-###-ROLLBACK ChangeHistory entry to each modified artifact:
      changeHistory:
        - changeRequest: CR-###-ROLLBACK
          date: [ISO-8601]
          type: ROLLBACK
          implementedBy: [robot]
          changes: [list of reverted fields]
   c. Robot logs STORY COMPLETED in activity log
5. If Rollback.migrationRollback is set: database robot executes rollback script
6. Lucien reverses any CI/CD changes (re-deploys previous pipeline config)
7. Roma verifies with Sarah via /verify-change-implementation --cr CR-### --mode rollback
8. Update CR-###.yaml: Status: ROLLED_BACK, RollbackDate, RollbackReason
```

## Notes

- Git revert preferred over hard reset to preserve history
- If partial implementation: only reverse what was completed
- Rollback order must always be re-derived from tech-stack.yaml — never hardcoded
