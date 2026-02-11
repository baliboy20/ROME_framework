# P5 Hybrid Mode: Roma Command Center Guide

**Implementation of ROME-PROP-022: Agentic Loop Optimization**

## Overview

Hybrid mode combines dedicated monitoring terminal (Roma Command Center) with autonomous background agents for optimal visibility and parallelization.

## Architecture

```
┌─────────────────────────────────────────┐
│  Roma Command Center (Your Terminal)   │
│  - Live monitoring dashboard            │
│  - Interactive commands                 │
│  - Real-time alerts                     │
│  - Progress visualization               │
└──────────────────┬──────────────────────┘
                   │
        Spawns & Monitors
                   │
       ┌───────────┴───────────┐
       ▼           ▼           ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│  Ashok   │ │  Reena   │ │ Charlie  │
│ (Database│ │ (Backend │ │(Frontend)│
│  Layer)  │ │   API)   │ │   UI)    │
│          │ │          │ │          │
│Background│ │Background│ │Background│
│  Agent   │ │  Agent   │ │  Agent   │
└─────┬────┘ └─────┬────┘ └─────┬────┘
      │            │            │
      └────────────┴────────────┘
                   │
            Activity Log MCP
        (File-based coordination)
```

## Quick Start

### Prerequisites

1. P4 (Configuration) phase must be complete
2. Activity log MCP server running
3. Design artifacts in ARTIFACTS/_design/

### Launch Hybrid Mode

```bash
cd ROME/rome-p5-generation
node commands/rome-p5-parallel-generate-hybrid.js
```

## What Happens

### 1. Agent Spawning (5-10 seconds)

```
🚀 P5 HYBRID PARALLEL GENERATION
═══════════════════════════════════════════════════════════

📊 Spawning background agents...

🗄️  Launching Ashok (Database Layer)...
   ✅ Agent ID: agent-abc123

🔌 Launching Reena (Backend API)...
   ✅ Agent ID: agent-def456

🎨 Launching Charlie (Frontend UI)...
   ✅ Agent ID: agent-ghi789

═══════════════════════════════════════════════════════════
✅ ALL AGENTS SPAWNED
═══════════════════════════════════════════════════════════
```

### 2. Monitoring Dashboard Appears

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 P5 GENERATION MONITORING DASHBOARD
⏰ Last update: 10:30:45 AM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⏳ ASHOK - ACTIVE
   Completed: 2 | In Progress: 1 | Pending: 5
   💓 Last heartbeat: 5s ago
   🔨 Working on: STORY-P5-001-1-db

🔒 REENA - WAITING
   Completed: 0 | In Progress: 0 | Pending: 8
   💓 Last heartbeat: 3s ago
   🔒 Blocked by: ashok

🔒 CHARLIE - WAITING
   Completed: 0 | In Progress: 0 | Pending: 12
   💓 Last heartbeat: 8s ago
   🔒 Blocked by: reena

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 OVERALL PROGRESS: 2/23 stories (9%)
   [███░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Commands: /pause /resume /details <robot> /tail <robot>
          /force-continue /restart <robot> /stop /help
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
>
```

**Dashboard auto-refreshes every 10 seconds**

### 3. Agents Execute Autonomously

- **Ashok** starts immediately (no dependencies)
- **Reena** waits for Ashok to complete, then auto-starts
- **Charlie** waits for Reena to complete, then auto-starts

You just monitor. No manual intervention needed.

## Interactive Commands

### View Detailed Status

```bash
> /details ashok

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 ASHOK DETAILED STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Agent ID: agent-abc123
Phase: P5-generation

Stories:
  ✅ Completed: 5
  ⏳ In Progress: 1
  📋 Pending: 2
  📊 Total: 8

💓 Liveness: ALIVE (last heartbeat 5s ago)

📈 Progress: ACTIVE (last work 12s ago)

Recent Events (last 5):
  10:30:42 AM - STORY: STORY-P5-001-5-db (COMPLETED)
  10:30:15 AM - STORY: STORY-P5-001-4-db (COMPLETED)
  10:29:58 AM - STORY: STORY-P5-001-3-db (COMPLETED)
  ...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Tail Agent Output

```bash
> /tail reena

📜 Tailing reena agent output...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Waiting for Ashok to complete...
Dependency check: ashok has 2 pending items
Waiting 30 seconds before re-check...
Dependency check: ashok has 1 pending item
Waiting 30 seconds before re-check...
Dependency satisfied! Starting work...
Reading api-design.md...
Generating Parse Cloud Function: User.create...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Force Continue (Manual Override)

If an agent is stuck or you want to skip dependency:

```bash
> /force-continue reena ashok

⚠️  MANUAL OVERRIDE: Forcing reena to continue

✅ reena dependency on ashok artificially satisfied
💡 reena agent should now proceed
```

### Pause/Resume Monitoring

```bash
> /pause
⏸️  Monitoring paused (agents continue running)

> /resume
▶️  Resuming monitoring...
```

### Stop Everything

```bash
> /stop

🛑 Stopping all agents and exiting...
✅ Monitoring stopped
⚠️  Note: Background agents may still be running
```

## Alert System

Dashboard automatically detects and displays alerts:

### Dead Agent Alert

```
🚨 ALERTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ ASHOK: Agent appears dead: Last heartbeat 120s ago
   → Restart agent or force-continue
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Detection time:** 90 seconds (3 missed heartbeats)

### Stuck Agent Alert

```
🚨 ALERTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  REENA: Agent stuck: No work progress for 12 minutes
   → Check agent output or restart
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Detection time:** 10 minutes without progress

### Long Blocker Alert

```
🚨 ALERTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  CHARLIE: Blocked for 18 minutes
   → Check reena status or force-continue
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Detection time:** 15 minutes blocked

## Execution Flow

### Normal Flow (No Failures)

```
Time    Ashok           Reena           Charlie
0:00    START           WAITING         WAITING
0:30    Working...      WAITING         WAITING
1:00    Working...      WAITING         WAITING
...
45:00   COMPLETE        START           WAITING
45:30   -               Working...      WAITING
1:45:00 -               COMPLETE        START
1:45:30 -               -               Working...
2:35:00 -               -               COMPLETE

Total wall time: ~155 min → 2h 35min
(vs 155 min sequential if done one by one)
```

### With Parallel Optimization

```
Ashok:  0-45min
Reena:  45-105min (depends on Ashok)
Charlie: 105-155min (depends on Reena)

Total: 155 minutes (dependency chain)
Speedup vs manual: 2.4x (no human coordination delays)
```

## Troubleshooting

### Agent Not Progressing

1. Check details: `/details <robot>`
2. Check output: `/tail <robot>`
3. Check dependency: Is blocker actually complete?
4. Force continue: `/force-continue <robot>`

### Agent Appears Dead

1. Check heartbeat age in dashboard
2. Restart: `/restart <robot>` (if implemented)
3. Manual intervention: Check activity log, spawn new agent

### Dependency Timeout

If Reena waits 30 minutes for Ashok:

```
❌ Dependency timeout after 1800 seconds
BLOCKER logged to activity log
```

**Actions:**
- Check Ashok status with `/details ashok`
- Check Ashok output with `/tail ashok`
- Force-continue Reena with `/force-continue reena ashok`

## Files Created

```
rome-core/lib/
  ActivityLogCoordinator.js    - Liveness, progress, dependency checking

rome-p5-generation/lib/
  AlertSystem.js               - Dead agent, stuck agent detection
  MonitoringDashboard.js       - Live status display
  CommandHandlers.js           - Interactive command processing

rome-p5-generation/commands/
  rome-p5-parallel-generate-hybrid.js  - Main orchestrator
```

## Benefits vs Other Modes

### vs Manual (3 separate terminals)
- ✅ No terminal juggling
- ✅ Centralized monitoring
- ✅ Automated coordination

### vs Pure Agentic (background only)
- ✅ Real-time visibility
- ✅ Interactive control
- ✅ Immediate debugging

## Next Steps

After P5 complete:

1. Check generated code in SOURCE/
2. Review activity log for any issues
3. Run tests/validation
4. Proceed to QA phase

## Advanced Usage

### Custom Refresh Interval

Edit `rome-p5-parallel-generate-hybrid.js`:

```javascript
const dashboard = new MonitoringDashboard(agents, {
  phase: 'P5-generation',
  refreshInterval: 5000  // 5 seconds instead of 10
});
```

### Different Model Selection

Edit agent spawning:

```javascript
const ashokAgent = await Task({
  model: "haiku",  // Fast, cheap for simple schema generation
  // ...
});
```

## Support

Issues? Check:
1. Activity log: `cat ARTIFACTS/_activity/activity-log.txt`
2. Agent status via dashboard
3. ROME-PROP-022 proposal document

---

**Status:** Implemented ✅
**Version:** 1.0
**Date:** 2026-02-06
