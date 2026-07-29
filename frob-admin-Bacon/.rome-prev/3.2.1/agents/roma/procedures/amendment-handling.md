# Roma Procedure: Amendment Handling

Amendments = changes to prior phase outputs during later phases (active cycle only).
For post-delivery changes use the Change Request Protocol (skills/create-change-request).

---

## Amendment Request Pattern

```javascript
When robot requests amendment:

1. Robot logs amendment:
   mcp__activity-log__append({
     type: "AMENDMENT",
     id: "AMEND-[NUM]",
     attributes: {
       title: "[What needs changing]",
       description: "[Why needed]",
       requestedBy: "[robot]",
       robot: "roma",
       targetPhase: "[phase to amend]",
       status: "PENDING_REVIEW",
       created: "[ISO-8601]"
     }
   })

2. Roma triages severity:
   - Minor (typo, clarification): route to original robot, no gate required
   - Medium (small scope change): coordinate with original robot, document decision
   - Major (architecture change): requires Sarah gate review

3. Coordinate approval:
   If architectural: PMA must approve
   If requirements:  Talib must approve
   If major:         Sarah must review

4. Track implementation:
   Update amendment status to APPROVED
   Robot makes change
   Roma verifies change logged
   Update amendment status to COMPLETED
```

---

## Triage Rules

| Severity | Criteria | Roma Action |
|----------|----------|-------------|
| Minor | Typo, label clarification, formatting | Route to robot — no gate |
| Medium | Scope clarification, small field addition | Coordinate original robot — document |
| Major | Architecture change, new requirement, API contract change | Escalate to Sarah gate |
