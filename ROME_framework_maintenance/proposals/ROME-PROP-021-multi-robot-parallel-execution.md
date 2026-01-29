# ROME-PROP-021: Multi-Robot Parallel Execution for Phase Plugins

| Field | Value |
|-------|-------|
| **Proposal UID** | ROME-PROP-021 |
| **Version** | 1.0 |
| **Date** | 2026-01-29T00:00:00Z |
| **Status** | Draft |
| **Type** | Architecture Enhancement |
| **Author** | Framework Analyst & Architect |
| **Depends On** | ROME-PROP-020 (Skills in Robot Plugins) |
| **Amends** | None |

---

## Executive Summary

ROME-PROP-020 established that robots own skills and phase plugins orchestrate workflows. However, multi-robot phases (P5-generation) declare parallel execution but lack implementation:

**Problem:** rome-p5-generation declares 3 robots (Ashok, Reena, Charlie) with dependency chains but SessionStart hook only loads one robot. No automatic workspace creation, no dependency resolution, no parallel execution mechanism.

**Solution:** Implement multi-robot workspace initialization, dependency coordination protocol, and parallel orchestration commands to enable true concurrent execution as designed.

---

## Problem Statement

### Current Architecture Gap

**Phase Plugin Declaration (P5-generation):**
```json
{
  "provides": {
    "orchestration": "P5 parallel code generation coordination",
    "workflows": ["parallel-generation", "layer-dependency-management"]
  },
  "requires": {
    "robots": [
      {"name": "ashok", "dependsOn": []},
      {"name": "reena", "dependsOn": ["ashok"]},
      {"name": "charlie", "dependsOn": ["reena"]}
    ]
  }
}
```

**SessionStart Hook (P5-generation):**
```json
{
  "SessionStart:compact": {
    "command": "cat ../robot-plugins/ashok/ROBOT.md && cat ../robot-plugins/ashok/modes/P5-generation.md"
  }
}
```

**The Gap:**
- ✅ Plugin.json declares 3 robots
- ✅ Dependency chain defined (Ashok → Reena → Charlie)
- ❌ SessionStart loads only Ashok
- ❌ No workspace creation for Reena/Charlie
- ❌ No dependency resolution automation
- ❌ No parallel execution mechanism

### Current Workaround (Manual)

Users must manually:
1. Create 3 terminals (one per robot)
2. Load each robot's context separately
3. Manually track Ashok completion before starting Reena
4. Manually track Reena completion before starting Charlie
5. Coordinate work via activity log queries

This defeats the purpose of "parallel-generation" workflow.

---

## Proposed Solution

### Multi-Robot Workspace Initialization

Phase plugins with multiple robot requirements automatically create workspaces with:
- One terminal per robot
- Proper layout (vertical/horizontal splits)
- Auto-loaded robot contexts
- Dependency awareness

### Dependency Coordination Protocol

Robots automatically:
- Check dependency status via activity log
- Wait for dependent robots to complete
- Auto-trigger when dependencies satisfied
- Report progress to coordination system

### Parallel Orchestration Commands

Phase plugins provide commands that:
- Launch all required robots
- Monitor dependency chains
- Track completion status
- Handle errors and blockers

---

## Architecture Design

### 1. Multi-Robot SessionStart Hook

**Replace single-robot hooks with workspace initialization:**

```json
// rome-p5-generation/.claude/settings.json
{
  "hooks": {
    "SessionStart:multi-robot": {
      "command": "bash .claude/hooks/init-workspace.sh",
      "description": "Initialize P5 multi-robot workspace (Ashok, Reena, Charlie)"
    }
  }
}
```

### 2. Workspace Initialization Script

```bash
#!/bin/bash
# rome-p5-generation/.claude/hooks/init-workspace.sh

PROJECT_DIR="$CLAUDE_PROJECT_DIR"
ROBOT_PLUGINS="$PROJECT_DIR/../robot-plugins"

# Create 3-pane workspace
echo "Initializing P5 Generation workspace..."

# Create workspace with vertical-2 layout
workspace_response=$(mcp__iterm2-terminal__create_workspace \
  --name "P5-Generation" \
  --layout "three-pane" \
  --workingDirectory "$PROJECT_DIR")

# Parse workspace response to get terminal IDs
# Format: {"workspace_id": "...", "terminals": ["term1", "term2", "term3"]}

# Load Ashok in terminal 1
cat "$ROBOT_PLUGINS/ashok/ROBOT.md"
echo "\n---\n"
cat "$ROBOT_PLUGINS/ashok/modes/P5-generation.md"

echo "\n\n✅ Ashok loaded (Database Layer)"
echo "📋 Reena and Charlie workspaces created (awaiting manual activation)"
echo "💡 Use /switch-robot <reena|charlie> to activate other robots"
```

### 3. Robot Switching Command

```bash
#!/bin/bash
# rome-p5-generation/commands/switch-robot.sh

ROBOT_NAME=$1
ROBOT_PLUGINS="../robot-plugins"

case $ROBOT_NAME in
  ashok|reena|charlie)
    cat "$ROBOT_PLUGINS/$ROBOT_NAME/ROBOT.md"
    echo "\n---\n"
    cat "$ROBOT_PLUGINS/$ROBOT_NAME/modes/P5-generation.md"
    echo "\n✅ Switched to $ROBOT_NAME"
    ;;
  *)
    echo "❌ Unknown robot: $ROBOT_NAME"
    echo "Available: ashok, reena, charlie"
    exit 1
    ;;
esac
```

### 4. Dependency Coordination Module

```javascript
// rome-p5-generation/lib/dependency-coordinator.js

class DependencyCoordinator {
  constructor(robots) {
    this.robots = robots; // Array of {name, dependsOn, expectedSkills}
  }

  async checkDependenciesReady(robotName) {
    const robot = this.robots.find(r => r.name === robotName);
    if (!robot.dependsOn || robot.dependsOn.length === 0) {
      return true; // No dependencies
    }

    // Query activity log for each dependency
    for (const dep of robot.dependsOn) {
      const status = await this.queryRobotStatus(dep);
      if (status !== 'COMPLETED') {
        return false;
      }
    }
    return true;
  }

  async queryRobotStatus(robotName) {
    // Query activity log for robot's P5 work items
    const result = await mcp__activity_log__query({
      robot: robotName,
      phase: "P5-generation"
    });

    // Check if all features completed
    const pending = result.filter(item => item.status === 'PENDING' || item.status === 'IN_PROGRESS');
    return pending.length === 0 ? 'COMPLETED' : 'IN_PROGRESS';
  }

  async waitForDependencies(robotName) {
    console.log(`⏳ ${robotName} waiting for dependencies: ${this.robots.find(r => r.name === robotName).dependsOn.join(', ')}`);

    while (!(await this.checkDependenciesReady(robotName))) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Check every 5 seconds
    }

    console.log(`✅ ${robotName} dependencies satisfied, ready to start`);
  }
}

module.exports = DependencyCoordinator;
```

### 5. Parallel Orchestration Command

```bash
#!/bin/bash
# rome-p5-generation/commands/rome-p5:parallel-generate.sh

echo "🚀 Starting P5 parallel code generation..."
echo ""

# Terminal 1: Ashok (Database Layer) - starts immediately
echo "📊 Launching Ashok (Database Layer)..."
mcp__iterm2-terminal__add_robot({
  robot_name: "ashok",
  workingDirectory: "$CLAUDE_PROJECT_DIR"
})

# Ashok auto-executes:
# 1. Query assigned features
# 2. Generate database schema
# 3. Generate migrations
# 4. Log completion

# Terminal 2: Reena (Backend API) - depends on Ashok
echo "🔌 Launching Reena (Backend API) - waiting for Ashok..."
mcp__iterm2-terminal__add_robot({
  robot_name: "reena",
  workingDirectory: "$CLAUDE_PROJECT_DIR"
})

# Reena auto-executes:
# 1. Wait for Ashok completion (dependency check)
# 2. Query assigned features
# 3. Generate API endpoints
# 4. Log completion

# Terminal 3: Charlie (Frontend) - depends on Reena
echo "🎨 Launching Charlie (Frontend) - waiting for Reena..."
mcp__iterm2-terminal__add_robot({
  robot_name: "charlie",
  workingDirectory: "$CLAUDE_PROJECT_DIR"
})

# Charlie auto-executes:
# 1. Wait for Reena completion (dependency check)
# 2. Query assigned features
# 3. Generate UI screens/components
# 4. Log completion

echo ""
echo "✅ All robots launched with dependency coordination"
echo "📋 Monitor progress via activity log"
echo "🔍 Use /status-p5 to check overall progress"
```

### 6. Status Monitoring Command

```bash
#!/bin/bash
# rome-p5-generation/commands/rome-p5:status.sh

echo "📊 P5 Generation Status"
echo "======================"
echo ""

# Query activity log for each robot
for robot in ashok reena charlie; do
  echo "🤖 $robot:"
  mcp__activity_log__query({
    robot: "$robot",
    phase: "P5-generation"
  }) | jq -r '.[] | "  \(.id): \(.status)"'
  echo ""
done

# Overall completion percentage
total=$(mcp__activity_log__query({phase: "P5-generation"}) | jq 'length')
completed=$(mcp__activity_log__query({phase: "P5-generation", status: "COMPLETED"}) | jq 'length')
percentage=$((completed * 100 / total))

echo "Overall: $completed/$total ($percentage%)"
```

---

## Implementation Details

### Phase 1: Multi-Robot SessionStart Hooks

**Create workspace initialization scripts for P5:**

1. Create `.claude/hooks/init-workspace.sh`
2. Update `.claude/settings.json` to call init script
3. Script creates 3-pane workspace
4. Script loads Ashok by default
5. Provide instructions for switching to Reena/Charlie

**Files:**
- `rome-p5-generation/.claude/hooks/init-workspace.sh` (new)
- `rome-p5-generation/.claude/settings.json` (update)

### Phase 2: Robot Switching Commands

**Create commands for manual robot context switching:**

1. Create `commands/switch-robot.sh`
2. Add to phase plugin exports
3. Update plugin.json with command declarations

**Files:**
- `rome-p5-generation/commands/switch-robot.sh` (new)
- `rome-p5-generation/.claude-plugin/plugin.json` (update)

### Phase 3: Dependency Coordination

**Implement dependency checking in robot mode files:**

1. Add dependency check step to Reena's P5-generation.md
2. Add dependency check step to Charlie's P5-generation.md
3. Ashok has no dependencies (starts immediately)

**Example for Reena:**
```markdown
### Step 2: Check Dependencies

Before starting, verify Ashok (database layer) has completed:

```javascript
const coordinator = require('../../../rome-p5-generation/lib/dependency-coordinator.js');
await coordinator.waitForDependencies('reena');
```

If dependencies not met, wait until Ashok completes database generation.
```

**Files:**
- `robot-plugins/reena/modes/P5-generation.md` (update)
- `robot-plugins/charlie/modes/P5-generation.md` (update)
- `rome-p5-generation/lib/dependency-coordinator.js` (new)

### Phase 4: Parallel Orchestration Commands

**Create orchestration commands:**

1. `rome-p5:parallel-generate` - Launch all robots with coordination
2. `rome-p5:status` - Monitor overall progress
3. `rome-p5:restart-robot <name>` - Restart individual robot

**Files:**
- `rome-p5-generation/commands/rome-p5:parallel-generate.sh` (new)
- `rome-p5-generation/commands/rome-p5:status.sh` (new)
- `rome-p5-generation/commands/rome-p5:restart-robot.sh` (new)

### Phase 5: Workflow Documentation

**Document parallel execution workflows:**

1. Create `workflows/parallel-generation.md`
2. Create `workflows/dependency-management.md`
3. Add workflow references to plugin.json exports

**Files:**
- `rome-p5-generation/workflows/parallel-generation.md` (new)
- `rome-p5-generation/workflows/dependency-management.md` (new)
- `rome-p5-generation/.claude-plugin/plugin.json` (update)

---

## Updated Architecture

### Before PROP-021 (Sequential)

```
User: cd rome-p5-generation
  ↓
SessionStart loads Ashok
  ↓
User works with Ashok
  ↓
User manually switches to Reena (cat ROBOT.md + mode)
  ↓
User works with Reena
  ↓
User manually switches to Charlie (cat ROBOT.md + mode)
  ↓
User works with Charlie
```

**Sequential execution, manual coordination.**

### After PROP-021 (Parallel)

```
User: cd rome-p5-generation
  ↓
SessionStart creates 3-terminal workspace
  ↓
Ashok loaded in Terminal 1 (auto-starts)
Reena loaded in Terminal 2 (waits for Ashok)
Charlie loaded in Terminal 3 (waits for Reena)
  ↓
Ashok generates DB → logs completion
  ↓
Reena dependency satisfied → auto-starts API generation
  ↓
Charlie dependency satisfied → auto-starts UI generation
  ↓
All robots work in parallel with automatic coordination
```

**Parallel execution, automatic coordination.**

---

## Impact Analysis

### Benefits

**1. True Parallel Execution**
- ✅ Multiple robots work simultaneously
- ✅ Ashok starts immediately, Reena/Charlie wait appropriately
- ✅ Faster overall phase completion

**2. Automatic Dependency Resolution**
- ✅ No manual tracking of robot completion
- ✅ Activity log provides single source of truth
- ✅ Robots auto-trigger when ready

**3. Better User Experience**
- ✅ Single command launches entire phase workflow
- ✅ Visual workspace shows all active robots
- ✅ Easy status monitoring

**4. Scalable Pattern**
- ✅ Works for any multi-robot phase
- ✅ Can extend to P3 (PMA + Clara coordination)
- ✅ Can extend to custom user-defined phases

**5. Framework Completeness**
- ✅ Fulfills PROP-020 orchestration vision
- ✅ Phase plugins truly orchestrate, not just declare
- ✅ Architecture fully operational

### Risks & Mitigations

**Risk 1: Terminal complexity**
- **Mitigation:** Provide clear terminal switching instructions
- **Mitigation:** Default to single-robot (Ashok) for simplicity
- **Mitigation:** Multi-robot is opt-in via `/parallel-generate` command

**Risk 2: Dependency resolution failures**
- **Mitigation:** Timeout mechanisms with clear error messages
- **Mitigation:** Manual override commands if coordination fails
- **Mitigation:** Activity log validation before auto-trigger

**Risk 3: Increased cognitive load**
- **Mitigation:** Single-robot workflow still available
- **Mitigation:** Status commands provide clear progress visibility
- **Mitigation:** Comprehensive documentation

**Risk 4: Race conditions in activity log**
- **Mitigation:** Atomic status updates
- **Mitigation:** Polling interval prevents hammering
- **Mitigation:** Explicit completion markers

---

## Validation Criteria

### Architecture Validation

- [ ] Multi-robot SessionStart hook creates workspace
- [ ] All declared robots loaded in separate terminals
- [ ] Dependency chains correctly configured
- [ ] Robot switching commands functional

### Functional Validation

- [ ] Ashok starts immediately (no dependencies)
- [ ] Reena waits for Ashok completion
- [ ] Charlie waits for Reena completion
- [ ] Activity log coordination works
- [ ] Status monitoring shows accurate progress

### User Experience Validation

- [ ] Single command launches parallel workflow
- [ ] Clear instructions for robot switching
- [ ] Terminal layout is intuitive
- [ ] Error messages are actionable

---

## Migration Path

### Existing Single-Robot Phases (No Change)

Phases that declare single robot remain unchanged:
- rome-p0-bootup (Roma)
- rome-p1-aordl (Talib)
- rome-p2-analysis (Talib)
- rome-p3-design (PMA) - could become multi-robot if Clara added
- rome-p4-config (Lucien)
- rome-qa (Sarah)

### P5-generation (Multi-Robot)

**Step 1:** Update SessionStart hook to create workspace
**Step 2:** Add robot switching commands
**Step 3:** Update Reena/Charlie mode files with dependency checks
**Step 4:** Add orchestration commands
**Step 5:** Document parallel workflow

**Backwards compatible:** Users can still work with single robot (Ashok) if preferred.

### Future Multi-Robot Phases

Any new phase declaring multiple robots automatically gets:
- Workspace initialization template
- Dependency coordination boilerplate
- Orchestration command templates

---

## Success Metrics

**Quantitative:**
- ✅ P5 phase completion time reduced by 40% (parallel vs sequential)
- ✅ Zero manual context switching required
- ✅ 100% dependency resolution accuracy
- ✅ All 3 robots operational in parallel

**Qualitative:**
- ✅ Users report easier multi-robot workflow
- ✅ Clear visibility into parallel execution
- ✅ Reduced cognitive load for coordination
- ✅ Architecture vision fully realized

---

## Related Proposals

- **ROME-PROP-020:** Skills in Robot Plugins (enables this proposal)
- **ROME-PROP-019:** Robot Plugins Architecture (foundation)
- **ROME-PROP-010:** Skill-Based Architecture (skill invocation model)

---

## Open Questions

1. **Should workspace creation be automatic or opt-in?**
   - Option A: Always create multi-terminal workspace
   - Option B: Default to single-robot, `/parallel-generate` creates workspace
   - **Recommendation:** Option B (less overwhelming for beginners)

2. **How to handle robot failures during parallel execution?**
   - Option A: Pause dependent robots until manual fix
   - Option B: Auto-retry with backoff
   - **Recommendation:** Option A (predictable behavior)

3. **Should dependency coordination be synchronous or event-driven?**
   - Option A: Polling (check every N seconds)
   - Option B: Event-driven (activity log webhooks)
   - **Recommendation:** Option A (simpler, no external dependencies)

4. **Terminal layout for 3+ robots?**
   - Vertical splits? Horizontal splits? Grid?
   - **Recommendation:** three-pane layout (1 top, 2 bottom horizontal split)

---

## Recommendation

**APPROVE and IMPLEMENT**

This proposal completes the architecture vision established by ROME-PROP-020. Multi-robot phase plugins currently declare parallel workflows but lack implementation. This creates:
- ✅ True parallel execution capability
- ✅ Automatic dependency coordination
- ✅ Better user experience
- ✅ Framework completeness

**Priority:** High - Completes architectural vision
**Effort:** 2-3 weeks (phased implementation)
**Risk:** Medium (terminal coordination complexity)
**Benefit:** High (parallel execution, better UX, scalable pattern)

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-29T00:00:00Z | Initial proposal - multi-robot parallel execution for phase plugins with automatic dependency coordination |
