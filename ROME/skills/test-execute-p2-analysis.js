/**
 * Test script for /execute-p2-analysis skill (Tier 2)
 */

const { invokeSkill } = require('./lib/SkillInvoker');
const path = require('path');

async function testExecuteP2Analysis() {
  console.log('Testing /execute-p2-analysis skill (Tier 2)...\n');
  console.log('This will execute the complete P2 Analysis phase pipeline!\n');

  const requirementsDir = path.join(
    __dirname,
    '../../ROME_architect/ARTIFACTS/01-requirements'
  );

  const outputDir = path.join(
    __dirname,
    '../../ROME_architect/ARTIFACTS'
  );

  try {
    const result = await invokeSkill('execute-p2-analysis', {
      requirements_directory: requirementsDir,
      output_directory: outputDir,
      skip_validation: false,
      generate_all_artifacts: true
    });

    console.log('Final Results:');
    console.log('='.repeat(70));
    console.log(`Status: ${result.execution_summary.status}`);
    console.log(`Execution Time: ${result.execution_summary.execution_time_seconds}s`);
    console.log(`Total Artifacts: ${result.execution_summary.total_artifacts}`);
    console.log('');
    console.log('Generated Artifacts:');
    result.artifacts_generated.forEach(artifact => {
      console.log(`  ✓ ${path.basename(artifact)}`);
    });
    console.log('');
    console.log('✅ P2 Analysis Pipeline Test Complete\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

testExecuteP2Analysis();
