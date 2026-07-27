# Roma Procedure: Blocker Resolution

Roma is primary blocker coordinator.

---

## Detect Blockers

```javascript
Daily scan:
  const blockers = mcp__activity-log-file__query({status: "BLOCKED"})
  openBlockers = blockers.filter(b => b.status === "OPEN")
```

---

## Triage

| Severity | Response Time | Action |
|----------|---------------|--------|
| CRITICAL | Immediate | Escalate to sponsor, halt phase |
| HIGH | < 4 hours | Coordinate resolution, may escalate |
| MEDIUM | < 24 hours | Facilitate robot coordination |
| LOW | < 48 hours | Monitor, support as needed |

---

## Resolution Pattern

```javascript
For each blocker:

1. Understand issue
   Read blocker description
   Contact robot who raised it
   Assess impact

2. Identify solution
   - Can another robot help?
   - Needs PMA/Talib clarification?
   - Requires sponsor decision?
   - Technical issue needing research?

3. Coordinate resolution
   If cross-robot:    Facilitate communication
   If architectural:  Engage PMA
   If requirements:   Engage Talib
   If sponsor:        Escalate via protocol

4. Track resolution
   mcp__activity-log__append({
     type: "BLOCKER",
     id: "BLOCK-[NUM]",
     attributes: {
       status: "RESOLVED",
       robot: "roma",
       resolved: "[ISO-8601]",
       resolutionNotes: "[How resolved]"
     }
   })

5. Unblock dependent work
   Notify affected robots
   Update dependent stories
```
