# Auto-Parallel P5 Generation (Task-Based)

**Command:** `/parallel-generate-auto`

## Purpose

Launch all 3 P5 robots (Ashok, Reena, Charlie) as background Task agents with automatic dependency coordination.

## How It Works

Uses Claude Code Task tool to spawn 3 background agents:

1. **Ashok Agent** - Starts immediately, generates database layer
2. **Reena Agent** - Polls activity log, waits for Ashok, generates backend API
3. **Charlie Agent** - Polls activity log, waits for Reena, generates frontend

Each agent:
- Has full robot context (ROBOT.md + mode file)
- Full access to tools (Read, Write, Edit, activity log)
- Self-coordinates via activity log queries
- Logs progress with robot identifier

## Implementation

When user invokes `/parallel-generate-auto`, execute:

```javascript
// Launch Ashok (Database Layer)
const ashokTask = await Task({
  subagent_type: "general-purpose",
  description: "P5 Ashok database layer",
  prompt: `
You are Ashok, Database Layer Specialist for P5 generation phase.

Context:
- Read robot-plugins/ashok/ROBOT.md
- Read robot-plugins/ashok/modes/P5-generation.md

Entry criteria:
- Verify P4 complete via activity log
- Verify design artifacts exist

Your task:
1. Log phase start: mcp__activity_log__append({type: "PHASE", id: "P5-ASHOK", attributes: {status: "IN_PROGRESS", robot: "ashok", phase: "P5-generation"}})
2. Query assigned features from activity log
3. Generate database schema based on data-model.md
4. Generate migrations
5. Generate seed data
6. Log each story as you complete it
7. Log phase completion when done

Work autonomously. Log all progress to activity log.
  `.trim(),
  run_in_background: true,
  model: "sonnet"
});

console.log(`✅ Ashok launched: ${ashokTask.agent_id}`);

// Launch Reena (Backend API)
const reenaTask = await Task({
  subagent_type: "general-purpose",
  description: "P5 Reena backend API",
  prompt: `
You are Reena, Backend API Specialist for P5 generation phase.

Context:
- Read robot-plugins/reena/ROBOT.md
- Read robot-plugins/reena/modes/P5-generation.md

CRITICAL DEPENDENCY: You MUST wait for Ashok to complete database layer.

Your task:
1. Query Ashok status: mcp__activity_log__query({robot: "ashok", phase: "P5-generation"})
2. If Ashok has PENDING or IN_PROGRESS items:
   - Log blocker
   - Wait 60 seconds
   - Re-check
   - Repeat until Ashok complete
3. Once Ashok complete:
   - Log phase start
   - Generate Parse Server cloud functions
   - Generate API endpoints
   - Generate authentication middleware
   - Log completion

Work autonomously. Coordinate via activity log.
  `.trim(),
  run_in_background: true,
  model: "sonnet"
});

console.log(`✅ Reena launched: ${reenaTask.agent_id}`);

// Launch Charlie (Frontend)
const charlieTask = await Task({
  subagent_type: "general-purpose",
  description: "P5 Charlie frontend UI",
  prompt: `
You are Charlie, Frontend UI Specialist for P5 generation phase.

Context:
- Read robot-plugins/charlie/ROBOT.md
- Read robot-plugins/charlie/modes/P5-generation.md

CRITICAL DEPENDENCY: You MUST wait for Reena to complete backend API.

Your task:
1. Query Reena status: mcp__activity_log__query({robot: "reena", phase: "P5-generation"})
2. If Reena has PENDING or IN_PROGRESS items:
   - Log blocker
   - Wait 60 seconds
   - Re-check
   - Repeat until Reena complete
3. Once Reena complete:
   - Log phase start
   - Generate Flutter screens
   - Generate Flutter components
   - Generate state management
   - Log completion

Work autonomously. Coordinate via activity log.
  `.trim(),
  run_in_background: true,
  model: "sonnet"
});

console.log(`✅ Charlie launched: ${charlieTask.agent_id}`);

console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🚀 P5 PARALLEL GENERATION LAUNCHED');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');
console.log('📊 Background agents running:');
console.log(`   Ashok:   ${ashokTask.agent_id}`);
console.log(`   Reena:   ${reenaTask.agent_id}`);
console.log(`   Charlie: ${charlieTask.agent_id}`);
console.log('');
console.log('💡 Coordination: Automatic via activity log');
console.log('   Reena waits for Ashok → Charlie waits for Reena');
console.log('');
console.log('📈 Monitor progress:');
console.log('   mcp__activity_log__query({phase: "P5-generation"})');
console.log('');
console.log('🔍 Check agent output:');
console.log(`   Read(ashokTask.output_file)`);
console.log(`   Read(reenaTask.output_file)`);
console.log(`   Read(charlieTask.output_file)`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
```

## Monitoring

```javascript
// Check overall P5 status
const p5Status = await mcp__activity_log__query({
  phase: "P5-generation"
});

// Check specific robot
const ashokStatus = await mcp__activity_log__query({
  robot: "ashok",
  phase: "P5-generation"
});

// Read agent output
const ashokOutput = await Read(ashokTask.output_file);
```

## Advantages

✅ Truly automatic - no manual terminal management
✅ Full Claude intelligence in each agent
✅ Self-coordinating via activity log
✅ Background execution - current session stays free
✅ Parallel where possible (Ashok starts immediately)
✅ Sequential where required (Reena/Charlie wait for dependencies)

## Limitations

⚠️ Agents don't see each other's code in real-time (rely on file system + activity log)
⚠️ Debugging requires reading agent output files
⚠️ Cost: 3 concurrent Sonnet agents

---

**Version**: 1.0
**Status**: Proposed Implementation
**Date**: 2026-01-30
