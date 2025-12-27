# ROME-PROP-014: Claude Code Hooks for Activity Log Automation

| Field | Value |
|-------|-------|
| **Proposal ID** | ROME-PROP-014 |
| **Title** | Claude Code Hooks for Activity Log Automation |
| **Status** | Draft |
| **Created** | 2025-12-24 |
| **Author** | Framework Analyst & Architect |
| **Priority** | HIGH |
| **Complexity** | Low |
| **Dependencies** | ROME-PROP-007 (Activity Logging) |
| **Scope** | Memory replacement for activity log updates only |

---

## Problem Statement

**Single Issue:**

Robots forget to update activity logs after completing tasks or creating artifacts.

**Example:**

```
Talib: "I've created REQ-001.yaml, REQ-002.yaml, and REQ-003.yaml"
(Forgets to update activity log with STORY status: COMPLETED)

User: "What's the status of requirement writing?"
Talib: (checks activity log) "No recent updates..."
```

**Impact:**
- Roma can't track real-time progress
- Users don't have accurate status visibility
- Activity log accuracy: ~60%

---

## Proposed Solution

Use Claude Code's **hooks system** to automatically remind robots to update activity logs after completing work.

### Mechanism

**Instead of:**
```
Robot manually remembers to log: mcp__activity-log__append({...})
```

**Hooks automatically remind:**
```
Robot creates artifact → Hook triggers → Reminds to update log
Robot completes TODO → Hook triggers → Reminds to update log
```

### Scope Constraint

**Hooks do ONLY this:** Remind robots to update activity logs after task completion.

**Hooks do NOT:**
- Enforce GATE validation (Sarah's responsibility)
- Check traceability (already enforced by phase structure)
- Detect blockers (too broad, false positives)
- Validate requirements (separate concern)
- Coordinate robots (Roma's responsibility)

---

## Hook Implementations

**Total Hooks: 2**

### Hook 1: Artifact Creation Reminder

**Trigger:** After Write tool creates file in ARTIFACTS/ directory

**Configuration:**
```json
{
  "name": "rome-artifact-creation-reminder",
  "tool": "Write",
  "phase": "after",
  "enabled": true,
  "condition": {
    "type": "path-match",
    "pattern": "^ARTIFACTS/.*"
  },
  "action": {
    "type": "echo",
    "message": "\n📋 You created an artifact. Update activity log:\n   mcp__activity-log__append({type: 'STORY', id: '<story-id>', attributes: {status: 'COMPLETED', artifact: '${file_path}'}})\n"
  }
}
```

**Example:**
```
Talib creates ARTIFACTS/dev/requirements/REQ-001.yaml

[Hook triggers]
📋 You created an artifact. Update activity log:
   mcp__activity-log__append({...})

Talib: "Right, logging completion..."
```

### Hook 2: TODO Completion Reminder

**Trigger:** After TodoWrite tool marks task as completed

**Configuration:**
```json
{
  "name": "rome-todo-completion-reminder",
  "tool": "TodoWrite",
  "phase": "after",
  "enabled": true,
  "condition": {
    "type": "content-match",
    "pattern": "status.*completed"
  },
  "action": {
    "type": "echo",
    "message": "\n✅ TODO marked complete. Verify activity log reflects this completion.\n"
  }
}
```

**Example:**
```
PMA marks TODO "Design API endpoints" as completed

[Hook triggers]
✅ TODO marked complete. Verify activity log reflects this completion.

PMA: "Updating activity log..."
```

---

## Deployment

### Target Robots

Deploy to **9 robots** (all except Bootstrap):

1. **Talib** (P1)
2. **PMA** (P2)
3. **Sarah** (GATE validation)
4. **Roma** (Orchestration)
5. **Lucien** (P4)
6. **Ashok** (P5 - Data layer)
7. **Reena** (P5 - API layer)
8. **Charlie** (P5 - UI layer)
9. **Clara** (P5 - Design system)

**NOT Bootstrap** (one-time setup, too short-lived)

### Installation

**Copy template to robot workspace:**
```bash
cp ROME/robot-templates/robot_shell_utils/rome-hooks-template.json \
   my-project/robots/talib/.claude/hooks.json
```

**Same 2 hooks for all robots** - no robot-specific variations

---

## Template

See `ROME/robot-templates/robot_shell_utils/rome-hooks-template.json` for ready-to-use configuration

---

## Benefits

### 1. Improved Logging Accuracy
- **Before:** ~60% (robots manually remember)
- **After:** ~95% (automatic reminders)

### 2. Real-Time Status Visibility
- **Before:** Status updates lag behind work
- **After:** Immediate prompts after completion

### 3. Reduced Cognitive Load
- **Before:** Robots must remember to log manually
- **After:** Hooks handle reminder timing
- **Impact:** Robots focus on work, not process compliance

---

## Implementation Plan

**Simple Rollout:**

1. [ ] Create `rome-hooks-template.json` (2 hooks only)
2. [ ] Pilot with Talib on test project
3. [ ] Measure activity log accuracy improvement
4. [ ] Deploy to remaining 8 robots if successful

---

## Configuration Modes

**Development Mode:** (default)
- All hooks enabled
- Verbose messages shown

**Expert Mode:**
- Hooks disabled (for experienced users)

---

## Example Workflow

**Without Hooks:**
```
User: "Create requirement for recipe search"
Talib: Creates REQ-003.yaml
(Forgets to log - Roma has no visibility)
```

**With Hooks:**
```
User: "Create requirement for recipe search"
Talib: Creates REQ-003.yaml

[Hook triggers]
📋 You created an artifact. Update activity log:
   mcp__activity-log__append({...})

Talib: "Right, logging completion..."
mcp__activity-log__append({type: "STORY", id: "REQ-003-authoring", status: "COMPLETED"})

(Roma now sees progress in real-time)
```

---

## Risks

**Hook Fatigue:** Too many messages become noise
- **Mitigation:** Only 2 hooks, minimal messages, expert mode available

**Task Duration:** Each hook adds execution overhead
- **Mitigation:** Simple echo messages, no complex scripts, <100ms overhead

---

## Conclusion

Hooks provide **memory replacement** for activity log updates. Two simple reminders significantly improve logging accuracy without framework bloat.

**Expected Impact:**
- Activity log accuracy: 60% → 95%
- Minimal overhead: <100ms per hook
- No methodology changes required

---

## Next Steps

1. Create `rome-hooks-template.json` (2 hooks only)
2. Pilot with Talib
3. Measure accuracy improvement
4. Deploy to 8 remaining robots if successful

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 1.0 | 2025-12-24 | Initial proposal - comprehensive hooks system (10+ hooks) |
| 2.0 | 2025-12-24 | **Major scope reduction**: Removed all scope creep. Now ONLY 2 hooks for activity log reminders (memory replacement). Removed GATE enforcement, traceability checks, blocker detection, validation hooks. Applies to 9 robots (not Bootstrap). |
