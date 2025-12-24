/**
 * Test script for /generate-test-plan skill (Tier 2)
 */

const { invokeSkill } = require('./lib/SkillInvoker');
const path = require('path');

async function testGenerateTestPlan() {
  console.log('Testing /generate-test-plan skill (Tier 2)...\n');

  const requirementsDir = path.join(
    __dirname,
    '../../ROME_architect/ARTIFACTS/01-requirements'
  );

  const outputFile = path.join(
    __dirname,
    '../../ROME_architect/ARTIFACTS/04-test-scenarios/master-test-plan.md'
  );

  console.log('='.repeat(70));
  console.log('Generating Master Test Plan');
  console.log('='.repeat(70));
  console.log('');

  try {
    const result = await invokeSkill('generate-test-plan', {
      requirements_directory: requirementsDir,
      output_file: outputFile,
      output_format: 'markdown',
      include_traceability: true,
      group_by_priority: true
    });

    console.log('\n' + '='.repeat(70));
    console.log('Master Test Plan Generated');
    console.log('='.repeat(70));
    console.log('');
    console.log(`📊 Test Plan Statistics:`);
    console.log(`  Total Requirements: ${result.test_plan.metadata.total_requirements}`);
    console.log(`  Total Test Scenarios: ${result.total_scenarios}`);
    console.log('');
    console.log(`📋 By Priority:`);
    if (result.test_plan.by_priority) {
      console.log(`  HIGH: ${result.test_plan.by_priority.HIGH.length}`);
      console.log(`  MEDIUM: ${result.test_plan.by_priority.MEDIUM.length}`);
      console.log(`  LOW: ${result.test_plan.by_priority.LOW.length}`);
    }
    console.log('');
    console.log(`🏷️  By Type:`);
    Object.entries(result.test_plan.by_type).forEach(([type, scenarios]) => {
      console.log(`  ${type}: ${scenarios.length}`);
    });
    console.log('');
    console.log(`📈 Coverage Summary:`);
    console.log(`  Average Scenarios per Requirement: ${result.coverage_summary.avg_scenarios_per_requirement}`);
    console.log(`  Average Coverage: ${result.coverage_summary.avg_coverage_percentage}%`);
    console.log('');
    console.log(`✅ Master test plan written to:`);
    console.log(`   ${outputFile}\n`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }

  console.log('✅ Test completed\n');
}

testGenerateTestPlan();
