/**
 * Test script for /generate-test-scenarios skill
 */

const { invokeSkill } = require('./lib/SkillInvoker');
const path = require('path');

async function testGenerateTestScenarios() {
  console.log('Testing /generate-test-scenarios skill...\n');

  const testRequirements = ['REQ-001', 'REQ-002'];

  for (const reqId of testRequirements) {
    console.log('='.repeat(70));
    console.log(`Generating test scenarios for ${reqId}`);
    console.log('='.repeat(70));

    const requirementFile = path.join(
      __dirname,
      '../../ROME_architect/ARTIFACTS/01-requirements',
      `${reqId}.yaml`
    );

    const outputFile = path.join(
      __dirname,
      '../../ROME_architect/ARTIFACTS/04-test-scenarios',
      `${reqId}-tests.json`
    );

    try {
      const result = await invokeSkill('generate-test-scenarios', {
        requirement_file: requirementFile,
        output_file: outputFile,
        output_format: 'json',
        include_negative_tests: true,
        include_edge_cases: true
      });

      console.log(`\n📋 Test Scenarios for ${reqId}\n`);
      console.log(`Total Scenarios: ${result.test_scenarios.length}`);
      console.log(`Coverage: ${result.coverage.coverage_percentage}%\n`);

      console.log('By Type:');
      for (const [type, count] of Object.entries(result.coverage.by_type)) {
        console.log(`  ${type}: ${count}`);
      }

      console.log('\nBy Priority:');
      for (const [priority, count] of Object.entries(result.coverage.by_priority)) {
        console.log(`  ${priority}: ${count}`);
      }

      console.log('\nScenarios:\n');
      result.test_scenarios.forEach(scenario => {
        console.log(`  ${scenario.id} [${scenario.priority}] ${scenario.name}`);
      });

      console.log(`\n✅ Test scenarios written to: ${outputFile}\n`);

    } catch (error) {
      console.error(`❌ Test failed for ${reqId}:`, error.message);
      console.error(error.stack);
    }
  }

  console.log('✅ All tests completed\n');
}

testGenerateTestScenarios();
