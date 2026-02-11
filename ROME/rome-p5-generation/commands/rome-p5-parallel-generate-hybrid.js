#!/usr/bin/env node
/**
 * P5 Parallel Generation - Hybrid Mode
 * Roma Command Center + Background Agents
 *
 * Part of ROME-PROP-022: Agentic Loop Optimization
 *
 * Usage: node rome-p5-parallel-generate-hybrid.js
 */

const path = require('path');
const readline = require('readline');
const MonitoringDashboard = require('../lib/MonitoringDashboard');
const CommandHandlers = require('../lib/CommandHandlers');
const ActivityLogCoordinator = require('../../rome-core/lib/ActivityLogCoordinator');

const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const ROBOT_PLUGINS = path.join(PROJECT_ROOT, 'ROME/robot-plugins');
const ARTIFACTS = path.join(PROJECT_ROOT, 'ARTIFACTS');

/**
 * Generate agent prompt with full context
 */
function generateAgentPrompt(robotName, dependencies = []) {
  const robotConfig = {
    ashok: {
      title: 'Database Layer Specialist',
      artifacts: ['data-model.md', 'tech-stack.yaml'],
      tasks: [
        'Generate database schema based on data-model.md',
        'Generate migrations',
        'Generate ORM models',
        'Generate seed data'
      ]
    },
    reena: {
      title: 'Backend API Layer Specialist',
      artifacts: ['api-design.md', 'data-model.md', 'use-cases.md'],
      tasks: [
        'Generate Parse Server cloud functions',
        'Generate API endpoints (RESTful)',
        'Generate authentication middleware',
        'Generate validation middleware'
      ]
    },
    charlie: {
      title: 'Frontend UI Layer Specialist',
      artifacts: ['use-cases.md', 'api-design.md', 'data-model.md'],
      tasks: [
        'Generate Flutter screens/pages',
        'Generate Flutter components',
        'Generate state management',
        'Generate API integration layer'
      ]
    }
  };

  const config = robotConfig[robotName];
  const depString = dependencies.length > 0
    ? dependencies.map(d => d.toUpperCase()).join(', ')
    : 'None';

  return `You are ${robotName.toUpperCase()}, ${config.title} for P5 generation phase.

ROLE & CONTEXT:
- Read ${ROBOT_PLUGINS}/${robotName}/ROBOT.md for your full identity
- Read ${ROBOT_PLUGINS}/${robotName}/modes/P5-generation.md for phase-specific instructions
- Design artifacts location: ${ARTIFACTS}/_design/

KEY ARTIFACTS TO READ:
${config.artifacts.map(a => `- ${ARTIFACTS}/_design/${a}`).join('\n')}

DEPENDENCIES: ${depString}
${dependencies.length > 0 ? `
CRITICAL DEPENDENCY PROTOCOL:
You MUST wait for ${depString} to complete ALL work before starting.

1. Import coordinator:
   const ActivityLogCoordinator = require('${PROJECT_ROOT}/ROME/rome-core/lib/ActivityLogCoordinator');
   const coordinator = new ActivityLogCoordinator();

2. Wait for dependencies:
   for (const dep of ${JSON.stringify(dependencies)}) {
     const satisfied = await coordinator.waitForDependency(dep, '${robotName}', 'P5-generation');
     if (!satisfied) {
       console.error(\`Dependency timeout waiting for \${dep}\`);
       process.exit(1);
     }
   }

3. Once dependencies satisfied, proceed with your work.
` : ''}

AUTONOMOUS EXECUTION PROTOCOL:

1. LOG PHASE START (MANDATORY):
   await mcp__activity_log__append({
     type: "PHASE",
     id: "P5-${robotName.toUpperCase()}-START",
     attributes: {
       status: "IN_PROGRESS",
       robot: "${robotName}",
       phase: "P5-generation"
     }
   });

2. HEARTBEAT LOOP (every 30 seconds):
   setInterval(async () => {
     await coordinator.logHeartbeat('${robotName}', process.env.AGENT_ID, {
       current_story: currentStoryId,
       stories_completed: completedStoryIds.length
     });
   }, 30000);

3. QUERY ASSIGNED WORK:
   const stories = await mcp__activity_log__query({
     robot: "${robotName}",
     phase: "P5-generation",
     type: "STORY"
   });

4. EXECUTE WORK:
${config.tasks.map((task, i) => `   ${i + 1}. ${task}`).join('\n')}

   For each story:
   a. Log story start (status: IN_PROGRESS)
   b. Read design artifacts
   c. Generate code
   d. Write to SOURCE/ directory
   e. Log story completion (status: COMPLETED)

5. LOG PHASE COMPLETION (MANDATORY):
   await mcp__activity_log__append({
     type: "PHASE",
     id: "P5-${robotName.toUpperCase()}-COMPLETE",
     attributes: {
       status: "COMPLETED",
       robot: "${robotName}",
       phase: "P5-generation"
     }
   });

ERROR HANDLING:
- Log blockers to activity log (do NOT silently fail)
- Use heartbeat to signal liveness
- If stuck, log BLOCKER event with details
- Do NOT exit until phase complete or unrecoverable error

WORK AUTONOMOUSLY until all assigned stories are complete.
`;
}

/**
 * Main orchestration function
 */
async function launchHybridGeneration() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🚀 P5 HYBRID PARALLEL GENERATION');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('Architecture:');
  console.log('  • Roma Command Center (this terminal)');
  console.log('  • Ashok Agent (background - database layer)');
  console.log('  • Reena Agent (background - backend API)');
  console.log('  • Charlie Agent (background - frontend UI)');
  console.log('');
  console.log('Coordination: Activity Log MCP (file-based message bus)');
  console.log('═══════════════════════════════════════════════════════════\n');

  const coordinator = new ActivityLogCoordinator();

  // Log orchestrator start
  await mcp__activity_log__append({
    type: "PHASE",
    id: "P5-ORCHESTRATOR-START",
    attributes: {
      status: "IN_PROGRESS",
      robot: "roma",
      phase: "P5-generation",
      mode: "hybrid"
    }
  });

  console.log('📊 Spawning background agents...\n');

  // Spawn Ashok Agent (Database Layer) - No dependencies
  console.log('🗄️  Launching Ashok (Database Layer)...');
  const ashokAgent = await Task({
    subagent_type: "general-purpose",
    description: "P5 Ashok database layer",
    prompt: generateAgentPrompt('ashok', []),
    run_in_background: true,
    model: "sonnet"
  });
  console.log(`   ✅ Agent ID: ${ashokAgent.agent_id}`);

  await coordinator.logAgentSpawn('ashok', ashokAgent.agent_id, 'P5-generation');

  // Spawn Reena Agent (Backend API) - Depends on Ashok
  console.log('\n🔌 Launching Reena (Backend API)...');
  const reenaAgent = await Task({
    subagent_type: "general-purpose",
    description: "P5 Reena backend API",
    prompt: generateAgentPrompt('reena', ['ashok']),
    run_in_background: true,
    model: "sonnet"
  });
  console.log(`   ✅ Agent ID: ${reenaAgent.agent_id}`);

  await coordinator.logAgentSpawn('reena', reenaAgent.agent_id, 'P5-generation');

  // Spawn Charlie Agent (Frontend UI) - Depends on Reena
  console.log('\n🎨 Launching Charlie (Frontend UI)...');
  const charlieAgent = await Task({
    subagent_type: "general-purpose",
    description: "P5 Charlie frontend UI",
    prompt: generateAgentPrompt('charlie', ['reena']),
    run_in_background: true,
    model: "sonnet"
  });
  console.log(`   ✅ Agent ID: ${charlieAgent.agent_id}`);

  await coordinator.logAgentSpawn('charlie', charlieAgent.agent_id, 'P5-generation');

  const agents = {
    ashok: ashokAgent.agent_id,
    reena: reenaAgent.agent_id,
    charlie: charlieAgent.agent_id
  };

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('✅ ALL AGENTS SPAWNED');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('Background agents running:');
  console.log(`  🗄️  Ashok:   ${ashokAgent.agent_id}`);
  console.log(`  🔌 Reena:   ${reenaAgent.agent_id}`);
  console.log(`  🎨 Charlie: ${charlieAgent.agent_id}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('⏳ Initializing Roma Command Center...\n');

  // Create monitoring dashboard
  const dashboard = new MonitoringDashboard(agents, {
    phase: 'P5-generation',
    refreshInterval: 10000
  });

  // Create command handlers
  const commandHandlers = new CommandHandlers(dashboard, agents, 'P5-generation');

  // Set up command input
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> '
  });

  rl.on('line', async (input) => {
    if (input.trim()) {
      await commandHandlers.handleCommand(input.trim());
    }
  });

  // Start dashboard
  await dashboard.start();

  return { agents, dashboard, commandHandlers };
}

// Export for use as module
module.exports = { launchHybridGeneration };

// If run directly
if (require.main === module) {
  launchHybridGeneration().catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
}
