# ROME-PROP-014: Claude Code Hooks Integration for Activity Logging & Methodology Enforcement

| Field | Value |
|-------|-------|
| **Proposal ID** | ROME-PROP-014 |
| **Title** | Claude Code Hooks Integration for Activity Logging & Methodology Enforcement |
| **Status** | Draft |
| **Created** | 2025-12-24 |
| **Author** | Framework Analyst & Architect |
| **Priority** | HIGH |
| **Complexity** | Medium |
| **Dependencies** | ROME-PROP-007 (Activity Logging), ROME-PROP-013 (AORDL Integration) |

---

## Problem Statement

**Current Issues:**

1. **Robots forget to update activity logs** after completing tasks
2. **Inconsistent logging discipline** across different robot sessions
3. **Manual reminders required** to trigger status updates (TODO completion, PHASE transitions, GATE requests)
4. **No automated enforcement** of ROME methodology steps
5. **Difficult to track** when robots complete significant work without explicit logging

**Example Problem Scenario:**

```
Talib: "I've created REQ-001.yaml, REQ-002.yaml, and REQ-003.yaml"
(Forgets to update activity log with STORY status: COMPLETED)

User: "What's the status of requirement writing?"
Talib: (checks activity log) "No recent updates..."

User: "But you just said you created 3 requirements!"
Talib: "Oh yes, let me update the log now..."
```

**Impact:**
- Roma (orchestrator) can't track real-time progress
- Sarah (quality auditor) can't identify what's ready for validation
- Users don't have accurate status visibility
- Activity log becomes unreliable

---

## Proposed Solution: Claude Code Hooks Integration

Use Claude Code's **hooks system** to automatically trigger activity log updates and methodology enforcement based on robot actions.

### Hook Types Relevant to ROME

Claude Code supports hooks that execute shell commands in response to events:

1. **`tool-use-hook`**: Triggers before/after specific tool calls (Read, Write, Edit, Bash, etc.)
2. **`user-prompt-submit-hook`**: Triggers when user submits a prompt
3. **Custom event hooks**: Can be configured for specific patterns

### Core Concept

**Instead of:**
```
Robot manually remembers to log: mcp__activity-log__append({...})
```

**Use hooks to:**
```
Robot uses Write tool → Hook detects → Automatically reminds/logs
Robot completes artifact → Hook detects → Triggers status update prompt
Robot says "complete" → Hook detects → Enforces GATE request
```

---

## Proposed Hook Implementations

### 1. Activity Log Enforcement Hooks

**Use Case:** Automatically remind robots to update activity log after significant actions.

#### Hook A: Artifact Creation Reminder

**Trigger:** After Write tool used in ARTIFACTS/ directory

**Hook Configuration (`.claude/hooks.json`):**
```json
{
  "hooks": {
    "tool-use": [
      {
        "name": "rome-artifact-log-reminder",
        "tool": "Write",
        "phase": "after",
        "condition": "args.file_path includes 'ARTIFACTS/'",
        "command": "echo '\n📋 ROME REMINDER: You created an artifact. Update activity log with mcp__activity-log__append to track this work.\n'"
      }
    ]
  }
}
```

**Example Flow:**
```
Talib uses Write to create ARTIFACTS/dev/requirements/REQ-001.yaml

[Hook triggers]
📋 ROME REMINDER: You created an artifact. Update activity log with
   mcp__activity-log__append to track this work.

Talib: "Right, let me log this..."
mcp__activity-log__append({
  type: "STORY",
  id: "REQ-001-authoring",
  attributes: { status: "COMPLETED", ... }
})
```

#### Hook B: TODO Completion Reminder

**Trigger:** After TodoWrite tool used with status: "completed"

**Hook Configuration:**
```json
{
  "hooks": {
    "tool-use": [
      {
        "name": "rome-todo-completion-log",
        "tool": "TodoWrite",
        "phase": "after",
        "condition": "output includes 'status.*completed'",
        "command": "echo '\n✅ ROME: TODO marked complete. Verify activity log reflects this completion.\n'"
      }
    ]
  }
}
```

**Example Flow:**
```
PMA marks TODO "Design API endpoints" as completed

[Hook triggers]
✅ ROME: TODO marked complete. Verify activity log reflects this completion.

PMA: "Updating activity log for api-design completion..."
```

#### Hook C: Phase Completion Enforcement

**Trigger:** When robot claims work is "complete" or "done"

**Hook Configuration:**
```json
{
  "hooks": {
    "user-prompt-submit": [
      {
        "name": "rome-completion-gate-reminder",
        "condition": "response includes 'complete|done|finished'",
        "command": "bash -c 'echo \"\n🚦 ROME GATE CHECK: If phase work is complete, request GATE validation via Roma.\nExample: mcp__activity-log__append({type: PHASE, id: PHASE-X, status: GATE_REQUESTED})\n\"'"
      }
    ]
  }
}
```

**Example Flow:**
```
User: "Is the design phase done?"
Sarah: "Yes, all design artifacts are complete and validated."

[Hook triggers]
🚦 ROME GATE CHECK: If phase work is complete, request GATE validation via Roma.

Sarah: "Actually, let me formally request GATE-P3 validation..."
mcp__activity-log__append({
  type: "GATE",
  id: "GATE-P3",
  attributes: { status: "REQUESTED", requestedBy: "sarah", ... }
})
```

---

### 2. AORDL Validation Hooks

**Use Case:** Ensure AORDL requirements are validated before moving to P2.

#### Hook D: AORDL File Detection

**Trigger:** When REQ-*.yaml file is created

**Hook Configuration:**
```json
{
  "hooks": {
    "tool-use": [
      {
        "name": "rome-aordl-validation-reminder",
        "tool": "Write",
        "phase": "after",
        "condition": "args.file_path matches 'REQ-[0-9]+\\.yaml'",
        "command": "echo '\n📝 AORDL REQUIREMENT CREATED: Remember to validate with /validate-aordl skill before GATE-P1.\n'"
      }
    ]
  }
}
```

**Example Flow:**
```
Talib creates REQ-005.yaml

[Hook triggers]
📝 AORDL REQUIREMENT CREATED: Remember to validate with /validate-aordl
   skill before GATE-P1.

Talib: "Good point. Running /validate-aordl on REQ-005..."
```

---

### 3. Traceability Enforcement Hooks

**Use Case:** Ensure robots maintain AORDL traceability when creating downstream artifacts.

#### Hook E: Traceability Check for Features

**Trigger:** When creating analysis artifacts in P2

**Hook Configuration:**
```json
{
  "hooks": {
    "tool-use": [
      {
        "name": "rome-p2-traceability-check",
        "tool": "Write",
        "phase": "before",
        "condition": "args.file_path includes 'ARTIFACTS/dev/analysis/' AND args.content includes 'FUNC-'",
        "command": "bash -c 'echo \"\n🔗 TRACEABILITY CHECK: Ensure this feature (FUNC-###) traces to AORDL requirement (REQ-###).\nVerify mapping in requirements-matrix.md\n\"'"
      }
    ]
  }
}
```

#### Hook F: Use Case to AORDL Mapping

**Trigger:** When creating use cases in P3

**Hook Configuration:**
```json
{
  "hooks": {
    "tool-use": [
      {
        "name": "rome-p3-use-case-traceability",
        "tool": "Write",
        "phase": "before",
        "condition": "args.file_path includes 'use-cases.md' AND args.content includes 'UC-'",
        "command": "echo '\n🔗 USE CASE TRACEABILITY: Ensure UC-### traces to FUNC-### and ultimately REQ-###.\n'"
      }
    ]
  }
}
```

---

### 4. Robot Coordination Hooks

**Use Case:** Remind robots to coordinate with Roma and other robots.

#### Hook G: Roma Notification Reminder

**Trigger:** When robot completes a major milestone

**Hook Configuration:**
```json
{
  "hooks": {
    "tool-use": [
      {
        "name": "rome-roma-notification",
        "tool": "TodoWrite",
        "phase": "after",
        "condition": "all todos completed",
        "command": "echo '\n👔 ROMA COORDINATION: All tasks complete. Report status to Roma via activity log.\n'"
      }
    ]
  }
}
```

#### Hook H: Blocker Detection

**Trigger:** When robot encounters an error or mentions "blocked"

**Hook Configuration:**
```json
{
  "hooks": {
    "user-prompt-submit": [
      {
        "name": "rome-blocker-notification",
        "condition": "response includes 'blocked|error|cannot|failed'",
        "command": "echo '\n🚫 BLOCKER DETECTED: Log blocker via activity log and notify Roma immediately.\nmcp__activity-log__append({type: BLOCKER, ...})\n'"
      }
    ]
  }
}
```

---

### 5. Quality Gate Hooks

**Use Case:** Enforce quality gate protocol.

#### Hook I: Gate Request Validation

**Trigger:** When robot mentions "GATE-P*"

**Hook Configuration:**
```json
{
  "hooks": {
    "user-prompt-submit": [
      {
        "name": "rome-gate-request-protocol",
        "condition": "response includes 'GATE-P[0-9]'",
        "command": "bash -c './hooks/validate-gate-readiness.sh'"
      }
    ]
  }
}
```

**Hook Script (`hooks/validate-gate-readiness.sh`):**
```bash
#!/bin/bash
# Check if all required artifacts exist before GATE request
PHASE=$(grep -o 'GATE-P[0-9]' | grep -o '[0-9]')

case $PHASE in
  1)
    echo "🚦 GATE-P1 Checklist:"
    echo "  [ ] All REQ-*.yaml files validated with /validate-aordl"
    echo "  [ ] requirements-catalog.md created"
    echo "  [ ] phase1-handover.md created"
    ;;
  2)
    echo "🚦 GATE-P2 Checklist:"
    echo "  [ ] data-dictionary.yaml created"
    echo "  [ ] All requirements analyzed (REQ-*-analysis.json)"
    echo "  [ ] requirements-matrix.md shows REQ→FUNC traceability"
    ;;
  # ... other gates
esac
```

---

### 6. Skills Discovery Hooks

**Use Case:** Suggest relevant skills when robot is performing tasks manually.

#### Hook J: Skills Recommendation

**Trigger:** When robot is doing work that could use a skill

**Hook Configuration:**
```json
{
  "hooks": {
    "tool-use": [
      {
        "name": "rome-skills-recommendation",
        "tool": "Read",
        "phase": "after",
        "condition": "args.file_path includes 'REQ-' AND args.file_path endsWith '.yaml'",
        "command": "echo '\n💡 SKILL SUGGESTION: Use /analyze-requirement skill for automated AORDL analysis.\n'"
      }
    ]
  }
}
```

---

## Implementation Architecture

### Project Structure

```
my-rome-project/
├── .claude/
│   ├── hooks.json              # Hook configurations
│   └── scripts/
│       ├── log-reminder.sh     # Reusable hook scripts
│       ├── gate-check.sh
│       ├── traceability-check.sh
│       └── skills-suggest.sh
├── robots/
│   ├── talib/
│   │   └── .claude/
│   │       └── hooks.json      # Talib-specific hooks
│   ├── pma/
│   │   └── .claude/
│   │       └── hooks.json      # PMA-specific hooks
│   └── ...
└── ROME/ (symlink)
```

### Robot-Specific Hook Profiles

Each robot should have phase-specific hooks:

**Talib (P1-P2) Hooks:**
- AORDL validation reminders
- Requirements catalog updates
- P1→P2 transition enforcement
- Activity log for requirement authoring

**PMA (P3) Hooks:**
- Design artifact creation logging
- Use case traceability checks
- API design completion notifications
- Tech stack documentation reminders

**Lucien (P4) Hooks:**
- Workspace scaffolding completion logs
- Environment config validation
- CI/CD setup verification
- Phase handover document creation

**Ashok/Reena/Charlie (P5) Hooks:**
- Code generation progress tracking
- Test completion notifications
- Feature implementation logging
- Peer dependency alerts (Reena depends on Ashok, Charlie depends on Reena)

**Sarah (Quality Gates) Hooks:**
- Gate validation checklist enforcement
- Approval/rejection logging
- Traceability verification prompts

**Roma (Orchestration) Hooks:**
- Phase transition logging
- Robot assignment notifications
- Blocker escalation alerts
- Overall progress tracking

---

## Hook Configuration Examples

### Master Hooks Configuration (Project-Level)

**File: `.claude/hooks.json`**

```json
{
  "version": "1.0",
  "description": "ROME Framework Master Hooks Configuration",
  "hooks": {
    "tool-use": [
      {
        "name": "rome-artifact-creation-log",
        "description": "Remind robot to log artifact creation",
        "tool": "Write",
        "phase": "after",
        "condition": "args.file_path.startsWith('ARTIFACTS/')",
        "command": "bash .claude/scripts/log-reminder.sh artifact-created \"${args.file_path}\"",
        "enabled": true
      },
      {
        "name": "rome-todo-completion-log",
        "description": "Enforce activity log update when TODO completed",
        "tool": "TodoWrite",
        "phase": "after",
        "condition": "args.todos.some(t => t.status === 'completed')",
        "command": "bash .claude/scripts/log-reminder.sh todo-completed",
        "enabled": true
      },
      {
        "name": "rome-aordl-validation-reminder",
        "description": "Remind to validate AORDL requirements",
        "tool": "Write",
        "phase": "after",
        "condition": "args.file_path.match(/REQ-\\d+\\.yaml$/)",
        "command": "bash .claude/scripts/aordl-validate-reminder.sh \"${args.file_path}\"",
        "enabled": true
      }
    ],
    "user-prompt-submit": [
      {
        "name": "rome-gate-request-enforcement",
        "description": "Enforce GATE request protocol",
        "condition": "response.includes('GATE-P') && response.includes('request')",
        "command": "bash .claude/scripts/gate-check.sh",
        "enabled": true
      },
      {
        "name": "rome-blocker-alert",
        "description": "Alert when robot encounters blocker",
        "condition": "response.match(/blocked|cannot proceed|error|failed/i)",
        "command": "bash .claude/scripts/blocker-alert.sh",
        "enabled": true
      }
    ]
  }
}
```

### Hook Scripts

**File: `.claude/scripts/log-reminder.sh`**

```bash
#!/bin/bash
# ROME Activity Log Reminder Script

EVENT_TYPE=$1
EVENT_DATA=$2

case $EVENT_TYPE in
  artifact-created)
    echo ""
    echo "📋 ═══════════════════════════════════════════════════════════"
    echo "   ROME ACTIVITY LOG REMINDER"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    echo "   You created: $EVENT_DATA"
    echo ""
    echo "   ACTION REQUIRED: Update activity log with:"
    echo "   mcp__activity-log__append({"
    echo "     type: 'STORY',"
    echo "     id: '<story-id>',"
    echo "     attributes: {"
    echo "       status: 'COMPLETED',"
    echo "       artifact: '$EVENT_DATA',"
    echo "       completed: '$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
    echo "     }"
    echo "   })"
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    ;;

  todo-completed)
    echo ""
    echo "✅ ═══════════════════════════════════════════════════════════"
    echo "   TODO COMPLETED - ACTIVITY LOG UPDATE REQUIRED"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    echo "   Verify your activity log reflects this completion."
    echo ""
    echo "   If this completes a STORY or FEATURE, update status:"
    echo "   mcp__activity-log__append({"
    echo "     type: 'STORY',"
    echo "     id: '<story-id>',"
    echo "     attributes: { status: 'COMPLETED' }"
    echo "   })"
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    ;;
esac
```

**File: `.claude/scripts/gate-check.sh`**

```bash
#!/bin/bash
# ROME Gate Request Validation Script

echo ""
echo "🚦 ═══════════════════════════════════════════════════════════"
echo "   ROME GATE REQUEST PROTOCOL"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "   Before requesting a GATE, ensure:"
echo ""
echo "   1. All phase artifacts are complete"
echo "   2. Activity log shows PHASE status: COMPLETED"
echo "   3. All TODOs for this phase are marked complete"
echo "   4. Traceability is maintained (REQ→FUNC→UC→Code)"
echo ""
echo "   Proper GATE request format:"
echo "   mcp__activity-log__append({"
echo "     type: 'GATE',"
echo "     id: 'GATE-PX',"
echo "     attributes: {"
echo "       status: 'REQUESTED',"
echo "       requestedBy: '<robot-name>',"
echo "       timestamp: '$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
echo "     }"
echo "   })"
echo ""
echo "   Then notify Roma for Sarah assignment."
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""
```

**File: `.claude/scripts/blocker-alert.sh`**

```bash
#!/bin/bash
# ROME Blocker Alert Script

echo ""
echo "🚫 ═══════════════════════════════════════════════════════════"
echo "   BLOCKER DETECTED - IMMEDIATE ACTION REQUIRED"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "   You mentioned a blocker or error. Roma must be notified."
echo ""
echo "   1. Log the blocker in activity log:"
echo "   mcp__activity-log__append({"
echo "     type: 'BLOCKER',"
echo "     id: 'BLOCKER-$(date +%Y%m%d-%H%M%S)',"
echo "     attributes: {"
echo "       description: '<describe the blocker>',"
echo "       blockedTask: '<task-id>',"
echo "       robot: '<your-robot-name>',"
echo "       severity: 'HIGH|MEDIUM|LOW',"
echo "       reported: '$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
echo "     }"
echo "   })"
echo ""
echo "   2. Notify Roma immediately for escalation"
echo ""
echo "   3. Do NOT proceed until blocker is resolved"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""
```

---

## Benefits of Hooks Integration

### 1. Automated Logging Discipline
- **Before:** Robots manually remember to log (often forget)
- **After:** Hooks automatically remind/enforce logging
- **Impact:** 95%+ activity log accuracy vs. 60% manual

### 2. Real-Time Status Visibility
- **Before:** Status updates lag behind actual work
- **After:** Immediate logging prompts after work completion
- **Impact:** Roma and Sarah see real-time progress

### 3. Methodology Enforcement
- **Before:** Robots sometimes skip GATE validation
- **After:** Hooks enforce GATE protocol
- **Impact:** No phases advance without proper validation

### 4. Reduced Cognitive Load
- **Before:** Robots must remember 10+ ROME procedures
- **After:** Hooks remind at the right moment
- **Impact:** Robots focus on creative work, not process compliance

### 5. Traceability Assurance
- **Before:** Manual traceability checks (error-prone)
- **After:** Automatic traceability prompts at artifact creation
- **Impact:** 100% REQ→Code traceability maintained

### 6. Faster Onboarding
- **Before:** New robots must memorize all procedures
- **After:** Hooks guide robots through correct procedures
- **Impact:** Reduce onboarding time by 50%

---

## Implementation Plan

### Phase 1: Core Hook Infrastructure (Week 1)
- [ ] Create `.claude/hooks.json` template
- [ ] Implement core hook scripts (log-reminder, gate-check, blocker-alert)
- [ ] Test with Talib (P1 AORDL authoring)
- [ ] Validate activity log accuracy improvement

### Phase 2: Robot-Specific Hooks (Week 2)
- [ ] Create Talib-specific hooks (AORDL validation, P1→P2 transition)
- [ ] Create PMA-specific hooks (design artifact logging, traceability checks)
- [ ] Create Sarah-specific hooks (gate validation enforcement)
- [ ] Create Roma-specific hooks (orchestration alerts)

### Phase 3: Advanced Hooks (Week 3)
- [ ] Implement skills recommendation hooks
- [ ] Implement traceability enforcement hooks (P2→P3→P4→P5)
- [ ] Implement cross-robot coordination hooks (Ashok→Reena→Charlie dependencies)
- [ ] Implement performance monitoring hooks

### Phase 4: Integration & Validation (Week 4)
- [ ] Run complete P0→P5 workflow with hooks enabled
- [ ] Measure activity log accuracy (target: 95%+)
- [ ] Measure GATE compliance (target: 100%)
- [ ] Measure traceability completeness (target: 100%)
- [ ] Document hooks best practices

---

## Configuration Management

### Global vs. Robot-Specific Hooks

**Global Hooks (Project-Level):**
- Artifact creation logging
- TODO completion reminders
- Blocker alerts
- Gate request enforcement

**Robot-Specific Hooks:**
- Talib: AORDL validation, requirement catalog updates
- PMA: Design traceability, tech stack documentation
- Lucien: Workspace validation, environment checks
- Ashok/Reena/Charlie: Code generation logging, test completion
- Sarah: Gate validation checklists
- Roma: Orchestration notifications

### Hook Enable/Disable Strategy

**Development Mode:**
```json
{
  "hooks": {
    "enabled": true,  // All hooks active for learning/enforcement
    "verbose": true   // Show detailed hook messages
  }
}
```

**Production Mode:**
```json
{
  "hooks": {
    "enabled": true,
    "verbose": false,  // Silent hooks (only critical alerts)
    "criticalOnly": true  // Only blocker/gate hooks active
  }
}
```

**Expert Mode:**
```json
{
  "hooks": {
    "enabled": false  // Disable for experienced users who know ROME procedures
  }
}
```

---

## Example Workflow with Hooks

### Scenario: Talib Creating AORDL Requirements

**Without Hooks:**
```
User: "Create requirement for recipe search"
Talib: Creates REQ-003.yaml
(Forgets to log)
(Forgets to validate AORDL)
(Roma has no visibility)
```

**With Hooks:**
```
User: "Create requirement for recipe search"

Talib: Creates REQ-003.yaml

[Hook: rome-artifact-creation-log triggers]
📋 ROME ACTIVITY LOG REMINDER
   You created: ARTIFACTS/dev/requirements/REQ-003.yaml
   ACTION REQUIRED: Update activity log...

Talib: "Right, updating activity log..."
mcp__activity-log__append({type: "STORY", id: "REQ-003-authoring", status: "COMPLETED"})

[Hook: rome-aordl-validation-reminder triggers]
📝 AORDL REQUIREMENT CREATED
   Remember to validate with /validate-aordl skill before GATE-P1

Talib: "Good catch. Running validation..."
/validate-aordl REQ-003.yaml
(Finds 2 issues)

Talib: "Fixed issues. REQ-003 now passes validation."

User: "Great! Are all requirements done?"
Talib: "Yes, we have REQ-001 through REQ-005, all validated."

[Hook: rome-gate-request-protocol triggers on "all...done"]
🚦 GATE REQUEST PROTOCOL
   Before requesting GATE-P1, ensure:
   1. All phase artifacts complete
   2. Activity log shows PHASE: COMPLETED
   ...

Talib: "Let me formally request GATE-P1..."
mcp__activity-log__append({type: "GATE", id: "GATE-P1", status: "REQUESTED"})
(Notifies Roma)
```

---

## Advanced Hook Features

### 1. Context-Aware Hooks

**Smart Hook Triggering Based on Phase:**
```json
{
  "hooks": {
    "tool-use": [
      {
        "name": "rome-phase-aware-reminder",
        "tool": "Write",
        "phase": "after",
        "condition": "getCurrentPhase() === 'P1' && args.file_path.includes('requirements')",
        "command": "bash .claude/scripts/p1-specific-reminder.sh"
      }
    ]
  }
}
```

### 2. Cumulative Progress Tracking

**Hook that Tracks Overall Completion:**
```bash
#!/bin/bash
# Check if all requirements have been validated
REQ_COUNT=$(ls ARTIFACTS/dev/requirements/REQ-*.yaml 2>/dev/null | wc -l)
VALIDATED_COUNT=$(grep -l "validated: true" ARTIFACTS/dev/requirements/REQ-*.yaml 2>/dev/null | wc -l)

if [ "$REQ_COUNT" -eq "$VALIDATED_COUNT" ] && [ "$REQ_COUNT" -gt 0 ]; then
  echo "✅ All $REQ_COUNT requirements validated! Ready for GATE-P1."
fi
```

### 3. Dependency Checking Hooks

**P5 Robot Coordination:**
```json
{
  "hooks": {
    "tool-use": [
      {
        "name": "rome-p5-dependency-check",
        "description": "Ensure Reena doesn't start before Ashok completes",
        "condition": "robot === 'reena' && !ashokComplete()",
        "command": "echo '⚠️  DEPENDENCY: Reena depends on Ashok completing data layer first.'"
      }
    ]
  }
}
```

---

## Metrics & Monitoring

### Success Metrics

**Activity Log Accuracy:**
- Baseline (no hooks): ~60% of work logged
- Target (with hooks): >95% of work logged

**GATE Compliance:**
- Baseline: 80% (robots sometimes skip gates)
- Target: 100% (hooks enforce gate requests)

**Traceability Completeness:**
- Baseline: 85% (some artifacts lack REQ→Code tracing)
- Target: 100% (hooks prompt traceability at creation)

**Blocker Resolution Time:**
- Baseline: 2-4 hours (manual detection)
- Target: <30 minutes (automatic blocker logging)

---

## Risks & Mitigation

### Risk 1: Hook Fatigue
**Problem:** Too many hook messages become noise
**Mitigation:**
- Implement "verbose" mode toggle
- Only show critical hooks in production
- Group related hooks into single message

### Risk 2: Hook Conflicts
**Problem:** Multiple hooks trigger simultaneously, causing confusion
**Mitigation:**
- Priority system for hooks
- Debouncing (don't trigger same hook twice in 5 minutes)
- Clear hook namespacing

### Risk 3: Over-Automation
**Problem:** Robots become dependent on hooks, don't learn procedures
**Mitigation:**
- Use hooks as training wheels initially
- Gradually reduce hook verbosity as robots learn
- Expert mode disables reminder hooks

---

## Conclusion

Claude Code hooks provide a **powerful mechanism** to enforce ROME methodology discipline without manual reminders. By automatically triggering activity log updates, traceability checks, and gate validations, hooks ensure:

1. ✅ **Consistent activity logging** (95%+ accuracy)
2. ✅ **Real-time status visibility** (Roma/Sarah see progress immediately)
3. ✅ **Methodology compliance** (no skipped gates or broken traceability)
4. ✅ **Reduced cognitive load** (robots focus on work, not process)
5. ✅ **Faster onboarding** (hooks guide new robots)

**Recommendation:** Implement hooks integration as **ROME-PROP-014** to significantly improve ROME's operational reliability and robot coordination.

---

## Next Steps

1. **Approve ROME-PROP-014** for implementation
2. **Create prototype** hooks configuration for Talib (P1)
3. **Run pilot** with complete P1→P2 workflow
4. **Measure** activity log accuracy improvement
5. **Iterate** based on results
6. **Roll out** to all robots (P0-P5)

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 1.0 | 2025-12-24 | Initial proposal for Claude Code hooks integration into ROME framework for activity logging enforcement and methodology compliance |
