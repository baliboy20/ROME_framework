# ROME-PROP-029: P5 Completion Enforcement

| Field | Value |
|-------|-------|
| **Document UID** | ROME-PROP-029 |
| **Version** | 1.0 |
| **Date** | 2026-02-28T00:00:00Z |
| **Status** | Draft |
| **Document Type** | Proposal |
| **Author** | Archie (Framework Analyst & Architect) |
| **Source** | TaskFlow Run 1 findings — OBSERVATION-SHEET-RUN-1.md |
| **Changes Approved** | false |

---

## Problem Statement

TaskFlow Run 1 identified three enforcement failures in P5 completion:

1. **PHASE-5 COMPLETED never logged** — Individual robot sub-phases (P5-ASHOK, P5-REENA, P5-CHARLIE) each logged COMPLETED, but no composite `PHASE-5 COMPLETED` event was ever written. The framework had no mechanism requiring it.

2. **GATE-P5 never run** — The session ended at P5-CHARLIE COMPLETED with no GATE-P5 submission to Sarah. There was no enforcement preventing project "completion" without Sarah's explicit gate approval.

3. **Zero timestamps (`T00:00:00Z`) throughout P5** — Multiple P5 robot entries used midnight placeholder timestamps, indicating retroactive logging. The PostToolUse hook detected retroactive patterns but could not reject entries with placeholder timestamps — it only warned after the fact.

**Compound effect:** The project appeared complete (all robots COMPLETED, code written) but was not auditable and had no formal delivery approval.

---

## Proposal

Three enforcement additions:

1. **Composite PHASE-5 COMPLETED event** — Roma is responsible for monitoring all P5 robot sub-phases and logging a single `PHASE-5 | status:COMPLETED` event only after all three (Ashok, Reena, Charlie) are confirmed COMPLETED. This event is the mandatory trigger for GATE-P5.

2. **GATE-P5 mandate** — Sarah's GATE-P5 is not optional. Roma must submit to Sarah after the composite PHASE-5 COMPLETED is logged. GATE-P5 APPROVED is required before any post-delivery activity (CR-###) or project close.

3. **Zero-timestamp rejection** — The activity log PreToolUse hook rejects any `mcp__activity-log-file__append` call where a timestamp field contains `T00:00:00` or `00:00:00Z`. Robots must use actual wall-clock time or omit the timestamp field (the MCP server will auto-stamp).

---

## Change 1: Composite PHASE-5 COMPLETED (Roma)

### Roma's new P5 monitoring responsibility

Roma must poll P5 robot completion after each robot reports done:

```javascript
// After each robot signals completion, Roma queries:
const p5Status = await mcp__activity_log_file__query({phase: "P5-generation"});

const ashokDone = p5Status.some(e => e.id === "P5-ASHOK" && e.status === "COMPLETED");
const reenaDone = p5Status.some(e => e.id === "P5-REENA" && e.status === "COMPLETED");
const charlieDone = p5Status.some(e => e.id === "P5-CHARLIE" && e.status === "COMPLETED");

if (ashokDone && reenaDone && charlieDone) {
  // Log composite event
  await mcp__activity_log_file__append({
    type: "PHASE",
    id: "PHASE-5",
    attributes: {
      status: "COMPLETED",
      robot: "roma",
      robotsCompleted: "ashok,reena,charlie",
      completed: new Date().toISOString()
    }
  });

  // Trigger GATE-P5
  // [Notify Sarah via Seez — see Change 2]
}
```

### Activity log entry format

```
[timestamp] | PHASE | PHASE-5 | status:COMPLETED | robot:roma | robotsCompleted:ashok,reena,charlie
```

This is distinct from the individual robot entries:
```
[timestamp] | PHASE | P5-ASHOK   | status:COMPLETED | robot:ashok
[timestamp] | PHASE | P5-REENA   | status:COMPLETED | robot:reena
[timestamp] | PHASE | P5-CHARLIE | status:COMPLETED | robot:charlie
[timestamp] | PHASE | PHASE-5    | status:COMPLETED | robot:roma   ← NEW (composite)
```

---

## Change 2: GATE-P5 Mandate

### Roma triggers Sarah

Immediately after logging PHASE-5 COMPLETED, Roma publishes a Seez notification requesting GATE-P5:

```javascript
mcp__Seez__show_doc({
  label: "Roma: Ready for GATE-P5 — [Project Name]",
  content: `# GATE-P5 Request

**Roma confirms:**
- ✅ P5-ASHOK COMPLETED
- ✅ P5-REENA COMPLETED
- ✅ P5-CHARLIE COMPLETED
- ✅ PHASE-5 COMPLETED logged

**Next step:** Sarah must run GATE-P5 validation.

\`\`\`
cd ROME/rome-qa
# Sarah: run GATE-P5
\`\`\`

Project delivery is NOT complete until GATE-P5 = APPROVED.`
})
```

### Sarah GATE-P5 entry criteria (updated)

Add to GATE-P5 entry criteria:

```
- PHASE-5 status = COMPLETED (composite Roma entry — not individual robot entries)
- All three individual robot phases also COMPLETED: P5-ASHOK, P5-REENA, P5-CHARLIE
```

**Block condition:** If PHASE-5 composite entry is missing, Sarah blocks with:

> "GATE-P5 requires a composite PHASE-5 COMPLETED entry logged by Roma. Individual robot completions (P5-ASHOK, P5-REENA, P5-CHARLIE) are present but Roma has not confirmed composite completion. Required action: Roma must query all P5 robot statuses, verify all COMPLETED, then log PHASE-5 COMPLETED before GATE-P5 can proceed."

### No project close without GATE-P5

Roma's ROBOT.md must state explicitly:

> Post-delivery activity (CR-###) and project repository close cannot begin until `GATE-P5 = APPROVED` is recorded in the activity log. If GATE-P5 was not run, Roma must initiate it before any further work.

---

## Change 3: Zero-Timestamp Rejection Hook

### Problem

Robots use `T00:00:00Z` (midnight UTC) as a placeholder when they log activity retroactively or forget to include a real timestamp. The current PostToolUse hook detects retroactive patterns by comparing file mtimes but cannot intercept placeholder timestamps before they enter the log.

### Solution

Add a PreToolUse hook on `mcp__activity-log-file__append` that inspects the `attributes` JSON for zero-time patterns and rejects the call if found.

### Hook: `reject-zero-timestamps.sh`

Location: `ROME/rome-core/.claude/hooks/reject-zero-timestamps.sh`

```bash
#!/bin/bash
# ROME Zero-Timestamp Rejection Hook
# PreToolUse hook on mcp__activity-log-file__append
# Rejects entries containing T00:00:00 placeholder timestamps

INPUT=$(cat)

# Extract attributes JSON
ATTRS=$(echo "$INPUT" | jq -r '.tool_input.attributes // {}' 2>/dev/null)

if [ -z "$ATTRS" ] || [ "$ATTRS" = "null" ]; then
  exit 0
fi

# Check all string values for zero-time patterns
ZERO_FOUND=$(echo "$ATTRS" | jq -r 'to_entries[] | select(.value | type == "string") | select(.value | test("T00:00:00|00:00:00Z")) | .key' 2>/dev/null)

if [ -n "$ZERO_FOUND" ]; then
  FIELDS=$(echo "$ZERO_FOUND" | tr '\n' ', ' | sed 's/,$//')
  cat <<EOF
{
  "decision": "block",
  "reason": "ACTIVITY LOG REJECTED: Zero timestamp detected in field(s): ${FIELDS}. The value 'T00:00:00Z' or '00:00:00Z' indicates a placeholder — not a real wall-clock time. Use new Date().toISOString() or omit the field (the MCP server will auto-stamp). Retroactive logging with placeholder timestamps violates ROME-PROP-029 and undermines audit integrity."
}
EOF
  exit 0
fi

exit 0
```

### Hook registration

Add to each phase plugin's `.claude/settings.json` PreToolUse hooks:

```json
{
  "matcher": "mcp__activity-log-file__append",
  "hooks": [
    {
      "type": "command",
      "command": "bash \"$CLAUDE_PROJECT_DIR/../rome-core/.claude/hooks/reject-zero-timestamps.sh\"",
      "timeout": 3000
    }
  ]
}
```

---

## Impact on Robot Mode Documents

### Roma ROBOT.md

Add new section: **P5 Completion Protocol**:

```markdown
## P5 Completion Protocol

After all three P5 robots signal completion:

1. Query activity log: verify P5-ASHOK, P5-REENA, P5-CHARLIE all COMPLETED
2. Log composite: `PHASE | PHASE-5 | status:COMPLETED | robot:roma | robotsCompleted:ashok,reena,charlie`
3. Publish Seez notification requesting GATE-P5 from Sarah
4. Do NOT initiate CR-### or close project until GATE-P5 = APPROVED
```

### Sarah QA-validator.md (GATE-P5 entry criteria)

Add:
```
- PHASE-5 composite entry (logged by Roma) status = COMPLETED — BLOCK if missing
```

---

## Files to Modify (Implementation)

| File | Change |
|------|--------|
| `robot-plugins/roma/ROBOT.md` | Add P5 Completion Protocol section |
| `robot-plugins/sarah/modes/QA-validator.md` | Add composite PHASE-5 check to GATE-P5 entry criteria |
| `rome-core/.claude/hooks/reject-zero-timestamps.sh` | Create new PreToolUse hook |
| All phase plugin `.claude/settings.json` | Register PreToolUse hook for `mcp__activity-log-file__append` |
| `rome-core/docs/framework-maintenance/uid-registry.md` | Register ROME-PROP-029 |

---

## Test Condition (TaskFlow TEST-PLAN.md)

**TC-09 — Zero-Timestamp Rejection**
- **When:** Any robot attempts to log activity with `started: "2026-01-01T00:00:00Z"` or similar placeholder
- **Expected:** PreToolUse hook blocks the append; error message references ROME-PROP-029; robot corrects to real timestamp
- **Pass if:** Block occurs before entry reaches the log; corrected entry uses real wall-clock time

**TC-10 — GATE-P5 Enforcement**
- **When:** P5-CHARLIE COMPLETED is logged
- **Expected:** Roma queries all P5 robots, confirms all COMPLETED, logs composite PHASE-5 COMPLETED, publishes Seez GATE-P5 request
- **Pass if:** PHASE-5 composite entry present in log before any post-delivery activity; Sarah's GATE-P5 APPROVED before project close

---

## Revision History

| Version | Date | Summary |
|---------|------|---------|
| 1.0 | 2026-02-28T00:00:00Z | Initial draft — from TaskFlow Run 1 findings (issues #1, #2, #3) |
