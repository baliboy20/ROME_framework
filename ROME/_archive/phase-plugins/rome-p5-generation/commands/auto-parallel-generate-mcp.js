#!/usr/bin/env node
// rome-p5-generation/commands/auto-parallel-generate-mcp.js
// Auto-launch P5 robots in separate iTerm terminals with coordination

const path = require('path');

async function launchParallelGeneration() {
  console.log('🚀 Launching P5 parallel generation with iTerm2 terminals...\n');

  const projectRoot = path.resolve(__dirname, '../../..');
  const p5Dir = path.join(projectRoot, 'ROME/rome-p5-generation');

  // Terminal 1: Ashok (Database Layer)
  const ashokTerminal = await mcp__iterm2_terminal__add_robot({
    robot_name: 'ashok',
    workingDirectory: p5Dir
  });

  console.log('✅ Created Ashok terminal:', ashokTerminal.terminal_id);
  console.log('   Working on: Database layer\n');

  // Small delay to ensure terminal is ready
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Terminal 2: Reena (Backend API)
  const reenaTerminal = await mcp__iterm2_terminal__add_robot({
    robot_name: 'reena',
    workingDirectory: p5Dir
  });

  console.log('✅ Created Reena terminal:', reenaTerminal.terminal_id);
  console.log('   Will wait for Ashok completion\n');

  await new Promise(resolve => setTimeout(resolve, 1000));

  // Terminal 3: Charlie (Frontend UI)
  const charlieTerminal = await mcp__iterm2_terminal__add_robot({
    robot_name: 'charlie',
    workingDirectory: p5Dir
  });

  console.log('✅ Created Charlie terminal:', charlieTerminal.terminal_id);
  console.log('   Will wait for Reena completion\n');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 Terminals created:');
  console.log('   1. Ashok  (Database)  -', ashokTerminal.terminal_id);
  console.log('   2. Reena  (Backend)   -', reenaTerminal.terminal_id);
  console.log('   3. Charlie (Frontend) -', charlieTerminal.terminal_id);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('💡 In each terminal, start Claude Code and begin work:');
  console.log('   Terminal will auto-load robot context via badge\n');

  console.log('📊 Monitor progress:');
  console.log('   bash commands/rome-p5-status.sh\n');

  return {
    ashok: ashokTerminal.terminal_id,
    reena: reenaTerminal.terminal_id,
    charlie: charlieTerminal.terminal_id
  };
}

// Export for use from Claude Code
module.exports = { launchParallelGeneration };

// If run directly
if (require.main === module) {
  launchParallelGeneration().catch(console.error);
}
