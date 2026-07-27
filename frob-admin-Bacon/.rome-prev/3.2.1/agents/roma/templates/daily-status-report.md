# Template: Daily Status Report

**Output:** `ARTIFACTS/status-reports/[YYYY-MM-DD].md`

---

```markdown
# Daily Status Report

| Field | Value |
|-------|-------|
| Date | [YYYY-MM-DD] |
| Phase | P[N] - [Phase Name] |
| Overall Status | ON_TRACK / AT_RISK / BLOCKED |

## Progress Summary

| Metric | Count |
|--------|-------|
| Total Features | [N] |
| Completed | [N] |
| In Progress | [N] |
| Pending | [N] |
| Blocked | [N] |
| Completion % | [N]% |

## Robot Status

| Robot | Assigned | Complete | In Progress | Blocked |
|-------|----------|----------|-------------|---------|
| [robot] | [N] | [N] | [N] | [N] |

## Completed Today

- STORY-[xxx]: [Title] ([Robot])

## Active Blockers

| ID | Title | Severity | Age (days) | Assigned |
|----|-------|----------|------------|----------|
| BLOCK-[xxx] | [Title] | [SEVERITY] | [N] | [robot] |

## Risks

- [Risk description and mitigation]

## Next 24 Hours

- [Robot] will complete [story]
- [Robot] will start [story]
```
