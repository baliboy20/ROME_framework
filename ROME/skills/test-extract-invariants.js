/**
 * Test script for /extract-invariants skill
 */

const { invokeSkill } = require('./lib/SkillInvoker');
const path = require('path');

async function testExtractInvariants() {
  console.log('Testing /extract-invariants skill...\n');

  // Test with requirements that have rich invariants
  const testRequirements = [
    'REQ-001', // create project
    'REQ-002', // create task
    'REQ-005', // delete task
  ];

  for (const reqId of testRequirements) {
    console.log('='.repeat(70));
    console.log(`Testing ${reqId}`);
    console.log('='.repeat(70));

    const requirementFile = path.join(
      __dirname,
      '../../ROME_architect/ARTIFACTS/01-requirements',
      `${reqId}.yaml`
    );

    try {
      const result = await invokeSkill('extract-invariants', {
        requirement_file: requirementFile,
        classify_rules: true
      });

      console.log(`\nRequirement: ${result.requirement_id}`);
      console.log(`Total Invariants: ${result.statistics.total_count}`);
      console.log(`\nClassification Summary:`);
      for (const [type, count] of Object.entries(result.statistics.by_type)) {
        console.log(`  ${type}: ${count}`);
      }

      console.log(`\nEntities Mentioned: ${result.statistics.entities_mentioned.join(', ')}`);
      console.log(`Attributes Mentioned: ${result.statistics.attributes_mentioned.join(', ')}`);

      console.log(`\nDetailed Invariants:\n`);

      result.invariants.forEach((inv, i) => {
        console.log(`${i + 1}. [${inv.id}] ${inv.text}`);

        if (inv.classifications.length > 0) {
          const primary = inv.classifications[0];
          console.log(`   Type: ${primary.type} (confidence: ${primary.confidence.toFixed(2)})`);

          if (inv.classifications.length > 1) {
            const secondary = inv.classifications.slice(1, 3).map(c => c.type);
            console.log(`   Also: ${secondary.join(', ')}`);
          }
        }

        if (inv.entities.length > 0) {
          console.log(`   Entities: ${inv.entities.join(', ')}`);
        }

        if (inv.attributes.length > 0) {
          console.log(`   Attributes: ${inv.attributes.join(', ')}`);
        }

        if (inv.semantic.modality) {
          console.log(`   Modality: ${inv.semantic.modality} ${inv.semantic.negation ? '(negated)' : ''}`);
        }

        console.log('');
      });

    } catch (error) {
      console.error(`❌ Test failed for ${reqId}:`, error.message);
      console.error(error.stack);
    }
  }

  console.log('✅ All tests completed\n');
}

testExtractInvariants();
