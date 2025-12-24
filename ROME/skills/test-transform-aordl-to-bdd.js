/**
 * Test script for /transform-aordl-to-bdd skill
 */

const { invokeSkill } = require('./lib/SkillInvoker');
const path = require('path');
const fs = require('fs');

async function testTransformAORDLtoBDD() {
  console.log('Testing /transform-aordl-to-bdd skill...\n');

  // Test with a few requirements
  const testRequirements = ['REQ-001', 'REQ-002', 'REQ-005'];

  // Create BDD features directory
  const bddDir = path.join(__dirname, '../../ROME_architect/ARTIFACTS/03-bdd-features');
  if (!fs.existsSync(bddDir)) {
    fs.mkdirSync(bddDir, { recursive: true });
  }

  for (const reqId of testRequirements) {
    console.log('='.repeat(70));
    console.log(`Transforming ${reqId} to BDD`);
    console.log('='.repeat(70));

    const requirementFile = path.join(
      __dirname,
      '../../ROME_architect/ARTIFACTS/01-requirements',
      `${reqId}.yaml`
    );

    const outputFile = path.join(bddDir, `${reqId}.feature`);

    try {
      const result = await invokeSkill('transform-aordl-to-bdd', {
        requirement_file: requirementFile,
        output_file: outputFile,
        include_error_scenarios: true
      });

      console.log(`\nFeature: ${result.feature_name}`);
      console.log(`Scenarios: ${result.scenarios.length}`);

      console.log(`\nGenerated Gherkin:\n`);
      console.log(result.gherkin_content);

      console.log(`✅ BDD feature written to: ${outputFile}\n`);

    } catch (error) {
      console.error(`❌ Test failed for ${reqId}:`, error.message);
      console.error(error.stack);
    }
  }

  console.log('✅ All tests completed\n');
}

testTransformAORDLtoBDD();
