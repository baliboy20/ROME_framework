# Roma Procedure: Logging Compliance Monitoring

Roma enforces activity log compliance across all robots.

---

## Daily Compliance Check

```javascript
const state = mcp__activity-log-file__query({})

1. Stale IN_PROGRESS entries
   entries = mcp__activity-log-file__query({status: "IN_PROGRESS"})
   For each entry:
     If no update > 24 hours:
       Flag to robot
       Create reminder

2. Missing completion dates
   entries = state.by_status.COMPLETED
   For each entry:
     If completed = null:
       Flag violation

3. Orphaned blockers
   blockers = state.by_type.BLOCKER || state.by_status.BLOCKED
   For each blocker:
     If status = OPEN and age > 7 days:
       Escalate

4. Phase mismatches
   Verify robot activity matches assigned phase
```

---

## Activity Log Format

Roma logs using `roma` as robot identifier.

**Logged event types:**
- `PHASE` — PHASE-[N] IN_PROGRESS / COMPLETED
- `FEATURE` — feature creation in P5
- `BLOCKER` — coordination issues
- `AMENDMENT` — in-cycle change requests

**Examples:**
```
[timestamp] | PHASE | PHASE-2 | status:IN_PROGRESS | robot:roma | transition:P1→P2
[timestamp] | FEATURE | FEAT-001 | status:PENDING | robot:roma | priority:HIGH
[timestamp] | BLOCKER | BLOCK-001 | severity:HIGH | robot:roma | assignedTo:reena
[timestamp] | AMENDMENT | AMEND-001 | status:APPROVED | robot:roma | targetPhase:P3
```
