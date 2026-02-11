# ROME-PROP-022: Agentic Loop Optimization for Multi-Robot Coordination

| Field | Value |
|-------|-------|
| **Proposal UID** | ROME-PROP-022 |
| **Version** | 1.0 |
| **Date** | 2026-02-06T00:00:00Z |
| **Status** | Draft |
| **Type** | Architecture Enhancement |
| **Author** | Archie (Framework Analyst & Architect) |
| **Depends On** | ROME-PROP-021 (Multi-Robot Parallel Execution) |

---

## Executive Summary

Claude Code's Task tool enables autonomous agent spawning with background execution, full tool access, and self-coordination. ROME currently implements multi-robot coordination via manual terminal management or separate Claude sessions. This proposal leverages agentic loops to enable:

**Problem:** Multi-robot phases (P5-generation) require manual coordination, separate terminals/sessions, and lack true autonomous parallel execution with cross-session communication.

**Solution:** Implement agentic loop orchestration pattern using Claude Code Task tool to enable robots to spawn autonomous subagents that coordinate via activity log MCP, creating a self-managing multi-robot execution environment.

---

## Problem Statement

### Current Multi-Robot Limitations

**Architecture Gap:**
- ✅ Phase plugins declare multi-robot requirements
- ✅ Activity log provides coordination protocol
- ❌ No autonomous agent spawning
- ❌ Manual terminal/session management required
- ❌ No cross-session robot communication
- ❌ Limited parallelization

**Current Workaround (Manual):**
1. User opens 3 separate Claude Code sessions
2. User manually navigates each session to robot directory
3. User manually triggers each robot
4. Robots manually query activity log for coordination
5. User monitors 3 sessions for progress

**Coordination via Files Only:**
- Robots write progress to activity log
- Dependent robots poll activity log
- No direct agent-to-agent communication
- No automatic triggering

---

## Proposed Solution

### Agentic Loop Pattern for Multi-Robot Orchestration

**Core Concept:** Parent robot (orchestrator) spawns autonomous subagents for each worker robot. Subagents execute with full context, coordinate via activity log MCP, and report progress autonomously.

### Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────┐
│  LAYER 1: ORCHESTRATOR ROBOT (Primary Session)         │
│  - Roma, Talib, PMA, etc.                               │
│  - Spawns worker agents                                 │
│  - Monitors overall progress                            │
│  - Aggregates results                                   │
└──────────────────┬──────────────────────────────────────┘
                   │ Task(..., run_in_background: true)
                   ▼
┌─────────────────────────────────────────────────────────┐
│  LAYER 2: AUTONOMOUS WORKER AGENTS (Background Tasks)   │
│  - Ashok Agent, Reena Agent, Charlie Agent              │
│  - Full robot context (ROBOT.md + mode file)            │
│  - Full tool access (Read, Write, Edit, Bash, etc.)     │
│  - Activity log coordination                            │
│  - Self-executing work loops                            │
└──────────────────┬──────────────────────────────────────┘
                   │ mcp__activity_log__*
                   ▼
┌─────────────────────────────────────────────────────────┐
│  LAYER 3: COORDINATION SUBSTRATE (Activity Log MCP)     │
│  - Single source of truth                               │
│  - Robot status tracking                                │
│  - Dependency resolution                                │
│  - Cross-agent communication protocol                   │
└─────────────────────────────────────────────────────────┘
```

---

## Architecture Design

### 1. Orchestrator Pattern

**Phase plugin (P5-generation) provides orchestration command:**

```javascript
// rome-p5-generation/commands/rome-p5:parallel-generate-agentic.js

async function launchAgenticGeneration() {
  console.log('🚀 Launching P5 agentic parallel generation...\n');

  const projectRoot = path.resolve(__dirname, '../../..');

  // Spawn Ashok Agent (Database Layer) - No dependencies
  const ashokAgent = await Task({
    subagent_type: "general-purpose",
    description: "P5 Ashok database layer",
    prompt: `
You are Ashok, Database Layer Specialist.

CONTEXT LOADING:
1. Read ${projectRoot}/ROME/robot-plugins/ashok/ROBOT.md
2. Read ${projectRoot}/ROME/robot-plugins/ashok/modes/P5-generation.md
3. Read ${projectRoot}/ARTIFACTS/_design/data-model.md

ENTRY CRITERIA VALIDATION:
- Query activity log: mcp__activity_log__query({phase: "P4-config", status: "COMPLETED"})
- If P4 not complete, log blocker and exit

AUTONOMOUS EXECUTION LOOP:
1. Log phase start: mcp__activity_log__append({
     type: "PHASE",
     id: "P5-ASHOK-START",
     attributes: {status: "IN_PROGRESS", robot: "ashok", phase: "P5-generation"}
   })

2. Query assigned features: mcp__activity_log__query({
     robot: "ashok",
     phase: "P5-generation",
     type: "STORY"
   })

3. For each assigned story:
   a. Log story start
   b. Read design artifacts
   c. Generate database schema/migrations
   d. Write to SOURCE/database/
   e. Log story completion

4. Log phase completion: mcp__activity_log__append({
     type: "PHASE",
     id: "P5-ASHOK-COMPLETE",
     attributes: {status: "COMPLETED", robot: "ashok", phase: "P5-generation"}
   })

AUTONOMOUS EXECUTION: Work independently until all stories complete.
ERROR HANDLING: Log blockers to activity log, do not exit until resolution.
    `.trim(),
    run_in_background: true,
    model: "sonnet"
  });

  console.log(`✅ Ashok agent spawned: ${ashokAgent.agent_id}`);

  // Spawn Reena Agent (Backend API) - Depends on Ashok
  const reenaAgent = await Task({
    subagent_type: "general-purpose",
    description: "P5 Reena backend API",
    prompt: `
You are Reena, Backend API Layer Specialist.

CONTEXT LOADING:
1. Read ${projectRoot}/ROME/robot-plugins/reena/ROBOT.md
2. Read ${projectRoot}/ROME/robot-plugins/reena/modes/P5-generation.md
3. Read ${projectRoot}/ARTIFACTS/_design/api-design.md

DEPENDENCY COORDINATION:
CRITICAL: You MUST wait for Ashok to complete ALL database work.

Polling Loop:
1. Query Ashok status: mcp__activity_log__query({
     robot: "ashok",
     phase: "P5-generation"
   })

2. Check if any PENDING or IN_PROGRESS items remain
3. If yes:
   - Log blocker: mcp__activity_log__append({
       type: "BLOCKER",
       id: "REENA-WAITING-ASHOK",
       attributes: {status: "WAITING", robot: "reena", blocked_by: "ashok"}
     })
   - Wait 30 seconds
   - Re-check (loop until satisfied)

4. If no PENDING/IN_PROGRESS items from Ashok:
   - Log dependency satisfied
   - Proceed to execution

AUTONOMOUS EXECUTION LOOP:
1. Log phase start
2. Query assigned features
3. For each story:
   a. Generate Parse Server cloud functions
   b. Generate API endpoints
   c. Generate authentication/validation middleware
   d. Log completion
4. Log phase completion

ERROR HANDLING: Log blockers, coordinate with Ashok agent via activity log.
    `.trim(),
    run_in_background: true,
    model: "sonnet"
  });

  console.log(`✅ Reena agent spawned: ${reenaAgent.agent_id}`);

  // Spawn Charlie Agent (Frontend UI) - Depends on Reena
  const charlieAgent = await Task({
    subagent_type: "general-purpose",
    description: "P5 Charlie frontend UI",
    prompt: `
You are Charlie, Frontend UI Layer Specialist.

CONTEXT LOADING:
1. Read ${projectRoot}/ROME/robot-plugins/charlie/ROBOT.md
2. Read ${projectRoot}/ROME/robot-plugins/charlie/modes/P5-generation.md
3. Read ${projectRoot}/ARTIFACTS/_design/use-cases.md

DEPENDENCY COORDINATION:
CRITICAL: You MUST wait for Reena to complete ALL backend API work.

[Same polling pattern as Reena, but waiting for Reena instead of Ashok]

AUTONOMOUS EXECUTION LOOP:
1. Log phase start
2. Query assigned features
3. For each story:
   a. Generate Flutter screens/pages
   b. Generate Flutter components
   c. Generate state management
   d. Generate API integration
   e. Log completion
4. Log phase completion

ERROR HANDLING: Log blockers, coordinate with Reena agent via activity log.
    `.trim(),
    run_in_background: true,
    model: "sonnet"
  });

  console.log(`✅ Charlie agent spawned: ${charlieAgent.agent_id}\n`);

  // Return monitoring handles
  return {
    agents: {
      ashok: ashokAgent.agent_id,
      reena: reenaAgent.agent_id,
      charlie: charlieAgent.agent_id
    },
    monitor: async () => {
      const status = await mcp__activity_log__query({phase: "P5-generation"});
      return status;
    }
  };
}
```

---

### 2. Cross-Session Communication Protocol

**Communication Mechanism: Activity Log as Message Bus**

Agents cannot directly communicate across Claude sessions, but they CAN communicate via the activity log MCP server, which persists to file system.

**Activity Log as Communication Substrate:**

```yaml
# activity-log.txt serves as persistent message bus

# Agent writes message
STORY|2026-02-06T10:30:00Z|STORY-P5-001-1-db|status=IN_PROGRESS,robot=ashok,message="Starting schema generation"

# Dependent agent reads message
STORY|2026-02-06T10:32:00Z|STORY-P5-001-1-db|status=COMPLETED,robot=ashok,artifacts="SOURCE/database/schema.sql"

# Dependent agent responds
BLOCKER|2026-02-06T10:32:05Z|REENA-DEPENDENCY-CHECK|status=WAITING,robot=reena,blocked_by=ashok,check_count=1

# Dependency satisfied, work proceeds
BLOCKER|2026-02-06T10:32:35Z|REENA-DEPENDENCY-CHECK|status=RESOLVED,robot=reena,blocked_by=ashok

STORY|2026-02-06T10:33:00Z|STORY-P5-001-1-api|status=IN_PROGRESS,robot=reena,message="Generating cloud functions"
```

**Cross-Session Communication Primitives:**

1. **Status Broadcasting**: Robots write status to activity log
2. **Dependency Polling**: Robots query activity log for dependencies
3. **Blocker Notification**: Robots log blockers with references
4. **Completion Signaling**: Robots mark phase/story completion
5. **Artifact Publishing**: Robots log artifact locations

**No Direct Inter-Agent Communication:**
- Agents do not see each other's console output
- Agents do not share memory
- Agents do not have direct API to other agents
- **Activity log file is the ONLY communication channel**

---

### 3. Enhanced Activity Log Protocol

**Extend activity log schema for agent coordination:**

```typescript
// Activity log event types for agent coordination

interface CoordinationEvent {
  type: 'AGENT_SPAWN' | 'AGENT_HEARTBEAT' | 'AGENT_COMPLETE' | 'DEPENDENCY_CHECK';
  timestamp: string;
  robot: string;
  agent_id?: string;
  attributes: {
    status: 'SPAWNED' | 'ACTIVE' | 'WAITING' | 'COMPLETED' | 'FAILED';
    dependency_satisfied?: boolean;
    blocked_by?: string[];
    artifacts_produced?: string[];
    message?: string;
  };
}
```

**Heartbeat Protocol:**
```javascript
// Each agent periodically logs heartbeat (every 30 seconds)
await mcp__activity_log__append({
  type: "AGENT_HEARTBEAT",
  id: `HEARTBEAT-${robotName}-${Date.now()}`,
  attributes: {
    status: "ACTIVE",
    robot: robotName,
    agent_id: agentId,
    stories_in_progress: currentStoryIds,
    stories_completed: completedStoryIds
  }
});
```

**Dependency Check Protocol:**
```javascript
// Agent queries dependency status
const dependencyStatus = await mcp__activity_log__query({
  robot: dependencyRobotName,
  phase: currentPhase
});

const hasPending = dependencyStatus.some(
  event => event.attributes.status === 'PENDING' ||
           event.attributes.status === 'IN_PROGRESS'
);

if (hasPending) {
  await mcp__activity_log__append({
    type: "DEPENDENCY_CHECK",
    id: `DEP-CHECK-${robotName}-${Date.now()}`,
    attributes: {
      status: "WAITING",
      robot: robotName,
      blocked_by: dependencyRobotName,
      check_count: checkAttempts++
    }
  });

  await sleep(30000); // Wait 30 seconds before re-check
}
```

---

## Optimization Opportunities

### 1. Parallelization Gains

**Before (Sequential):**
```
Ashok (45 min) → Reena (60 min) → Charlie (50 min) = 155 minutes total
```

**After (Agentic Parallel):**
```
Ashok (45 min) ──┐
                  ├─ Reena (60 min) ──┐
                                       ├─ Charlie (50 min)

Total: 45 + 60 + 50 = 155 minutes sequential time
Actual: max(45, 60, 50) + dependency_wait = ~65 minutes wall time

Speed improvement: 2.4x
```

### 2. Autonomous Execution

**Benefits:**
- ✅ No user intervention required during execution
- ✅ Agents self-coordinate via activity log
- ✅ Dependency resolution automatic
- ✅ Error recovery via blocker protocol

### 3. Scalability

**Horizontal Scaling:**
- P5 currently has 3 robots (Ashok, Reena, Charlie)
- Pattern scales to N robots per phase
- Activity log coordination scales to dozens of agents
- Resource limit: Claude Code concurrent Task limit (~95)

**Future Phases:**
- P3-design: PMA + Clara (architecture + documentation in parallel)
- P2-analysis: Multiple Talib subagents for large requirement sets
- Custom phases: User-defined multi-robot workflows

### 4. Resource Optimization

**Model Selection:**
```javascript
// Use appropriate model for each agent based on complexity

// Simple, deterministic work: Haiku
const migrationAgent = await Task({
  model: "haiku",  // Fast, cheap for simple generation
  description: "Generate database migrations"
});

// Complex, creative work: Sonnet
const apiAgent = await Task({
  model: "sonnet",  // Standard capability/cost
  description: "Generate Parse Server cloud functions"
});

// Critical, high-complexity work: Opus
const architectureAgent = await Task({
  model: "opus",  // Maximum capability for critical decisions
  description: "Design system architecture"
});
```

### 5. Effectiveness Improvements

**Cross-Phase Optimization:**
```
P3-design: PMA generates architecture in parallel with Clara generating docs
           └─ Both read P2 analysis artifacts
           └─ No dependency between them
           └─ 2x speedup

P5-generation: Ashok → Reena → Charlie with optimal coordination
               └─ Ashok completes → Reena auto-triggers
               └─ Reena completes → Charlie auto-triggers
               └─ Zero coordination delay
```

**Batch Processing:**
```javascript
// P2-analysis: Process 100 requirements in parallel
const requirements = await glob('ARTIFACTS/_requirements/aordl/*.yaml');

// Spawn 10 agents, each processing 10 requirements
const agents = [];
for (let i = 0; i < 10; i++) {
  const batch = requirements.slice(i * 10, (i + 1) * 10);
  const agent = await Task({
    subagent_type: "general-purpose",
    description: `Analyze requirements batch ${i + 1}`,
    prompt: `Analyze these AORDL requirements: ${batch.join(', ')}...`,
    model: "haiku",  // Fast, cheap for analysis
    run_in_background: true
  });
  agents.push(agent);
}

// 100 requirements analyzed in ~10x speedup (10 parallel agents vs 1 sequential)
```

---

## Cross-Session Communication Capabilities

### Can Agents Communicate Across Claude Sessions?

**Direct Communication: NO**
- Agents are isolated processes
- No shared memory between sessions
- No direct API between agents
- Each agent has its own tool context

**Indirect Communication: YES (via Activity Log)**
- Activity log persists to file system
- All agents have MCP access to activity log
- Agents write events → other agents read events
- File system is shared substrate

### Communication Pattern

```
┌─────────────┐                    ┌─────────────┐
│  Session 1  │                    │  Session 2  │
│             │                    │             │
│  Ashok      │                    │  Reena      │
│  Agent      │                    │  Agent      │
└──────┬──────┘                    └──────┬──────┘
       │                                  │
       │ write event                      │ read event
       ▼                                  ▼
┌────────────────────────────────────────────────┐
│  Activity Log MCP (File: activity-log.txt)     │
│                                                 │
│  STORY|...|STORY-001|status=COMPLETED          │
│  PHASE|...|P5-ASHOK|status=COMPLETED           │
└────────────────────────────────────────────────┘
```

**Coordination Protocol:**
1. Ashok agent completes work → writes COMPLETED event
2. Reena agent polls activity log → reads COMPLETED event
3. Reena agent sees dependency satisfied → proceeds with work
4. Reena agent writes IN_PROGRESS event → Charlie can monitor

**Between Different Terminal Sessions:**
- User opens Terminal 1, starts Claude Code session with Ashok context
- User opens Terminal 2, starts Claude Code session with Reena context
- Both sessions connected to same activity log MCP server
- Ashok writes events in Session 1 → Reena reads events in Session 2
- **File system is the bridge**

**Between Background Task Agents:**
- Orchestrator spawns Ashok agent (background Task)
- Orchestrator spawns Reena agent (background Task)
- Both agents write to activity-log.txt
- Both agents query via mcp__activity_log__query
- Coordination is automatic via shared file

---

## Implementation Details

### Phase 1: Enhanced Activity Log Protocol

**Add coordination event types:**
```javascript
// rome-core/lib/activity-log-coordinator.js

class ActivityLogCoordinator {
  async logAgentSpawn(robotName, agentId, phase) {
    return await mcp__activity_log__append({
      type: "AGENT_SPAWN",
      id: `SPAWN-${robotName}-${Date.now()}`,
      attributes: {
        status: "SPAWNED",
        robot: robotName,
        agent_id: agentId,
        phase: phase,
        timestamp: new Date().toISOString()
      }
    });
  }

  async checkDependencySatisfied(dependencyRobot, phase) {
    const status = await mcp__activity_log__query({
      robot: dependencyRobot,
      phase: phase
    });

    return !status.some(
      e => e.attributes.status === 'PENDING' ||
           e.attributes.status === 'IN_PROGRESS'
    );
  }

  async waitForDependency(dependencyRobot, currentRobot, phase) {
    let attempts = 0;
    const maxAttempts = 60; // 30 minutes max wait (30s intervals)

    while (attempts < maxAttempts) {
      const satisfied = await this.checkDependencySatisfied(dependencyRobot, phase);

      if (satisfied) {
        await mcp__activity_log__append({
          type: "DEPENDENCY_CHECK",
          id: `DEP-RESOLVED-${currentRobot}-${Date.now()}`,
          attributes: {
            status: "RESOLVED",
            robot: currentRobot,
            blocked_by: dependencyRobot,
            wait_time_seconds: attempts * 30
          }
        });
        return true;
      }

      await mcp__activity_log__append({
        type: "DEPENDENCY_CHECK",
        id: `DEP-WAITING-${currentRobot}-${Date.now()}`,
        attributes: {
          status: "WAITING",
          robot: currentRobot,
          blocked_by: dependencyRobot,
          check_count: attempts + 1
        }
      });

      await new Promise(resolve => setTimeout(resolve, 30000));
      attempts++;
    }

    // Timeout
    await mcp__activity_log__append({
      type: "BLOCKER",
      id: `DEP-TIMEOUT-${currentRobot}-${Date.now()}`,
      attributes: {
        status: "FAILED",
        robot: currentRobot,
        blocked_by: dependencyRobot,
        reason: "Dependency timeout after 30 minutes"
      }
    });

    return false;
  }
}
```

### Phase 2: Agentic Orchestration Commands

**Create orchestration commands for each multi-robot phase:**

```javascript
// rome-p5-generation/commands/rome-p5:parallel-generate-agentic.js
// (Full implementation shown in Architecture Design section above)

// rome-p3-design/commands/rome-p3:parallel-design-agentic.js
// Similar pattern for PMA + Clara parallel execution
```

### Phase 3: Robot Mode File Updates

**Update robot mode files to support agentic execution:**

```markdown
<!-- robot-plugins/reena/modes/P5-generation.md -->

# Reena: P5 Generation Mode

## Execution Modes

### Mode 1: Interactive (Default)
User works with Reena interactively, manually executing skills.

### Mode 2: Agentic (Background Task)
Reena operates as autonomous agent, self-coordinating via activity log.

**Agentic Execution Protocol:**

1. **Context Loading**
   - Read ROBOT.md
   - Read P5-generation.md mode file
   - Read design artifacts (api-design.md, data-model.md)

2. **Dependency Coordination**
   - Query Ashok status via activity log
   - If Ashok incomplete: log blocker, wait, re-check
   - If Ashok complete: proceed

3. **Autonomous Work Loop**
   - Query assigned stories from activity log
   - For each story:
     - Generate Parse Server cloud functions
     - Generate API endpoints
     - Log completion
   - Log phase completion

4. **Error Handling**
   - Log blockers to activity log
   - Do not exit until resolution
   - Heartbeat every 30 seconds

**Skills:**
- `/log-phase-start`
- `/generate-api-endpoint`
- `/generate-cloud-function`
- `/log-phase-complete`
```

### Phase 4: Monitoring and Observability

**Provide monitoring commands:**

```javascript
// rome-p5-generation/commands/rome-p5:monitor.js

async function monitorAgenticExecution() {
  console.log('📊 P5 Agentic Execution Monitor\n');

  // Query overall phase status
  const phaseStatus = await mcp__activity_log__query({
    phase: "P5-generation"
  });

  // Group by robot
  const byRobot = {
    ashok: phaseStatus.filter(e => e.attributes.robot === 'ashok'),
    reena: phaseStatus.filter(e => e.attributes.robot === 'reena'),
    charlie: phaseStatus.filter(e => e.attributes.robot === 'charlie')
  };

  // Display status
  for (const [robot, events] of Object.entries(byRobot)) {
    console.log(`🤖 ${robot.toUpperCase()}`);

    const completed = events.filter(e => e.attributes.status === 'COMPLETED').length;
    const inProgress = events.filter(e => e.attributes.status === 'IN_PROGRESS').length;
    const pending = events.filter(e => e.attributes.status === 'PENDING').length;
    const waiting = events.filter(e => e.attributes.status === 'WAITING').length;

    console.log(`   ✅ Completed: ${completed}`);
    console.log(`   ⏳ In Progress: ${inProgress}`);
    console.log(`   📋 Pending: ${pending}`);
    if (waiting > 0) {
      console.log(`   🔒 Waiting: ${waiting}`);
    }
    console.log('');
  }

  // Overall progress
  const totalStories = phaseStatus.filter(e => e.type === 'STORY').length;
  const completedStories = phaseStatus.filter(
    e => e.type === 'STORY' && e.attributes.status === 'COMPLETED'
  ).length;

  const percentage = Math.round((completedStories / totalStories) * 100);
  console.log(`Overall Progress: ${completedStories}/${totalStories} (${percentage}%)`);

  // Identify blockers
  const blockers = phaseStatus.filter(
    e => e.type === 'BLOCKER' && e.attributes.status !== 'RESOLVED'
  );

  if (blockers.length > 0) {
    console.log('\n⚠️  Active Blockers:');
    blockers.forEach(b => {
      console.log(`   - ${b.attributes.robot} waiting for ${b.attributes.blocked_by}`);
    });
  }
}
```

---

## Impact Analysis

### Benefits

**1. True Autonomous Parallel Execution**
- ✅ Multi-robot phases execute without user intervention
- ✅ Dependency coordination automatic via activity log
- ✅ 2-3x wall time speedup for P5 generation
- ✅ Scalable to N robots per phase

**2. Cross-Session Coordination**
- ✅ Robots communicate via activity log substrate
- ✅ Works across terminal sessions, background tasks
- ✅ No direct agent API required
- ✅ File system provides reliable message bus

**3. Resource Optimization**
- ✅ Model selection per agent (haiku/sonnet/opus)
- ✅ Background execution frees user session
- ✅ Parallel batch processing for large datasets
- ✅ Optimal concurrency (up to 95 agents)

**4. Framework Completeness**
- ✅ Fulfills PROP-021 orchestration vision
- ✅ Enables true multi-agent engineering
- ✅ Scalable pattern for future phases
- ✅ Production-ready automation

**5. Developer Experience**
- ✅ Single command launches entire phase
- ✅ Clear monitoring and observability
- ✅ Automatic error recovery via blockers
- ✅ Transparent coordination protocol

### Risks & Mitigations

**Risk 1: Agent failures in background**
- **Mitigation:** Heartbeat protocol detects failures
- **Mitigation:** Timeout handling with clear error messages
- **Mitigation:** Monitoring commands show agent status

**Risk 2: Activity log contention**
- **Mitigation:** Atomic MCP operations
- **Mitigation:** Polling intervals prevent hammering
- **Mitigation:** File-based log has low contention

**Risk 3: Dependency deadlocks**
- **Mitigation:** Timeout after 30 minutes with blocker log
- **Mitigation:** Explicit dependency chains validated
- **Mitigation:** Manual override commands available

**Risk 4: Cost (multiple concurrent agents)**
- **Mitigation:** Model selection (haiku for simple tasks)
- **Mitigation:** Opt-in (user chooses agentic vs manual)
- **Mitigation:** Progress monitoring prevents runaway execution

---

## Validation Criteria

### Architecture Validation
- [ ] Orchestrator can spawn multiple background agents
- [ ] Agents load robot context correctly
- [ ] Activity log coordination protocol functional
- [ ] Cross-session communication verified

### Functional Validation
- [ ] Ashok agent executes database generation autonomously
- [ ] Reena agent waits for Ashok, then auto-starts
- [ ] Charlie agent waits for Reena, then auto-starts
- [ ] Dependency resolution accurate (no false starts)
- [ ] Heartbeat protocol detects agent failures

### Performance Validation
- [ ] P5 wall time reduced by 40-60% (parallel vs sequential)
- [ ] No coordination delays > 60 seconds
- [ ] Resource usage within limits (< 95 concurrent agents)

### User Experience Validation
- [ ] Single command launches full phase
- [ ] Monitoring commands provide clear visibility
- [ ] Error messages actionable
- [ ] Manual override available if needed

---

## Success Metrics

**Quantitative:**
- ✅ P5 wall time: 155 min → 65 min (2.4x speedup)
- ✅ User intervention: 100% → 0% (fully autonomous)
- ✅ Dependency coordination accuracy: 100%
- ✅ Agent failure detection: < 60 seconds

**Qualitative:**
- ✅ Framework completeness: multi-agent vision realized
- ✅ Scalability: pattern proven for N robots
- ✅ Developer experience: "launch and monitor"
- ✅ Cross-session coordination: transparent via activity log

---

## Related Proposals

- **ROME-PROP-021:** Multi-Robot Parallel Execution (foundation)
- **ROME-PROP-020:** Skills in Robot Plugins (enables agent skill invocation)
- **ROME-PROP-019:** Robot Plugins Architecture (robot structure)
- **ROME-PROP-011:** Subagent Architecture (conceptual foundation)

---

## Open Questions

1. **Should agentic mode be default or opt-in?**
   - Option A: Default to agentic for multi-robot phases
   - Option B: User explicitly invokes `/parallel-generate-agentic`
   - **Recommendation:** Option B (predictable, explicit)

2. **How to handle agent cost management?**
   - Option A: Pre-flight cost estimate shown to user
   - Option B: Hard limit on agent count (e.g., max 10)
   - **Recommendation:** Both (estimate + limits)

3. **Heartbeat frequency?**
   - Option A: Every 30 seconds (responsive, higher log volume)
   - Option B: Every 2 minutes (lower volume, slower failure detection)
   - **Recommendation:** Option A (30s)

4. **Dependency timeout duration?**
   - Option A: 15 minutes (fail fast)
   - Option B: 30 minutes (tolerate slow work)
   - **Recommendation:** Option B (30 min, configurable)

---

## Recommendation

**APPROVE and IMPLEMENT**

Agentic loop pattern completes the ROME multi-agent architecture. Current implementation requires manual coordination and lacks autonomous execution. This proposal enables:

- ✅ True parallel multi-robot execution
- ✅ Automatic dependency coordination
- ✅ Cross-session communication via activity log
- ✅ 2-3x performance improvement
- ✅ Scalable to future multi-robot phases

**Priority:** High - Completes multi-agent vision
**Effort:** 3-4 weeks (phased implementation)
**Risk:** Medium (agent coordination complexity)
**Benefit:** High (autonomous execution, 2-3x speedup, framework completeness)

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-06T00:00:00Z | Initial proposal - agentic loop optimization for multi-robot coordination with cross-session communication via activity log substrate |
