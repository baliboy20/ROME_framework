# Roma Procedure: P5 Capability Coordination

Triggered after GATE-P4 APPROVE. Roma reads capability declarations and dependencies
from `tech-stack.yaml` and coordinates parallel execution.

---

## Step 1: Build Dependency Graph

```javascript
const techStack = Read("ARTIFACTS/_design/design-decisions/tech-stack.yaml")
const capabilities = techStack.capabilities  // [{id, technology, robot, workspace}, ...]
const dependencies = techStack.dependencies  // {api: [database], ui-app: [api], ...}

FOR EACH capability in capabilities:
  deps = dependencies[capability.id] or []
  IF all deps have status COMPLETED in activity log:
    capability is READY — assign robot to start
  ELSE:
    capability is BLOCKED — wait for dependencies
```

Capabilities with no dependencies start immediately. Multiple capabilities assigned to
the same robot execute sequentially by that robot.

---

## Step 2: Assign Layer Work

```javascript
Parse actionlist.md for feature assignments:

For each feature (FEAT-###):
  Create feature entry:
    mcp__activity-log__append({
      type: "FEATURE",
      id: "FEAT-[xxx]",
      attributes: {
        title: "[Feature Title]",
        priority: "HIGH|MEDIUM|LOW",
        status: "PENDING",
        robot: "roma",
        phase: "P5-Generation",
        created: "[ISO-8601]"
      }
    })

  Create capability stories:
    FOR EACH capability in tech-stack.yaml.capabilities:
      Create stories: STORY-[EPIC]-[FEAT]-[SEQ]-[capability.id]
      Assign to: capability.robot

Notify robots:
  FOR EACH capability in capabilities:
    deps = dependencies[capability.id] or []
    IF deps.length == 0:
      "[capability.robot]: Begin [capability.id] for [N] features (no dependencies)"
    ELSE:
      "[capability.robot]: [capability.id] depends on [deps] — wait for completion"
```

---

## Step 3: Monitor Capability Progress

```javascript
MONITOR_P5_PROGRESS:
  FOR EACH capability in capabilities:
    robot = capability.robot
    stories = query_activity_log({robot: robot, capability: capability.id})

    completed  = stories.filter(s => s.status == COMPLETED)
    in_progress = stories.filter(s => s.status == IN_PROGRESS)
    blocked    = stories.filter(s => s.status == BLOCKED)
    pending    = stories.filter(s => s.status == PENDING)

    // Unblock capabilities whose dependencies are now satisfied
    IF capability.status == BLOCKED:
      deps = dependencies[capability.id] or []
      all_deps_done = deps.every(dep =>
        query_activity_log({capability: dep, status: COMPLETED}).length > 0
      )
      IF all_deps_done:
        UNBLOCK capability — notify robot to start

    // Mark capability complete
    IF pending.length == 0 AND in_progress.length == 0 AND blocked.length == 0:
      LOG capability COMPLETED
```

---

## Step 4: Feature-Level Completion Tracking

```javascript
For each feature (FEAT-###):
  Track capability completion:
    FOR EACH capability in tech-stack.yaml.capabilities:
      capability_done = FEAT-###-[capability.id] status == COMPLETED

  If all capabilities complete:
    Mark FEAT-### as COMPLETED
    Log completion date

  If any capability blocked:
    Identify blocker
    Check dependency graph for upstream capability status
    Coordinate resolution
    Update dependent robots
```

---

## Step 5: Integration Issue Coordination

```javascript
When integration issues arise:

1. Identify affected capabilities
   Example: "Charlie's UI requires API field not in Reena's endpoint"

2. Create coordination entry:
   mcp__activity-log__append({
     type: "BLOCKER",
     id: "BLOCK-[NUM]",
     attributes: {
       title: "API contract mismatch",
       description: "Charlie needs [field] from Reena's [endpoint]",
       severity: "MEDIUM",
       assignedTo: "reena",
       robot: "roma",
       status: "OPEN",
       created: "[ISO-8601]"
     }
   })

3. Coordinate fix:
   - Notify affected robot
   - Track resolution
   - Notify dependent robot when resolved
```
