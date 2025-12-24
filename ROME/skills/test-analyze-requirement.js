/**
 * Test script for /analyze-requirement skill
 */

const { invokeSkill } = require('./lib/SkillInvoker');
const path = require('path');

async function testAnalyzeRequirement() {
  console.log('Testing /analyze-requirement skill...\n');

  // Test with a few different requirements
  const testRequirements = [
    'REQ-001', // create project (simple)
    'REQ-002', // create task (medium complexity)
    'REQ-011'  // create team-member (relationships)
  ];

  for (const reqId of testRequirements) {
    console.log('='.repeat(70));
    console.log(`Analyzing ${reqId}`);
    console.log('='.repeat(70));

    const requirementFile = path.join(
      __dirname,
      '../../ROME_architect/ARTIFACTS/01-requirements',
      `${reqId}.yaml`
    );

    const outputFile = path.join(
      __dirname,
      '../../ROME_architect/ARTIFACTS/02-analysis',
      `${reqId}-analysis.json`
    );

    try {
      const result = await invokeSkill('analyze-requirement', {
        requirement_file: requirementFile,
        output_file: outputFile,
        output_format: 'json',
        include_recommendations: true
      });

      console.log(`\n📊 Analysis Summary for ${result.requirement_id}\n`);

      console.log(`Validation: ${result.validation_status}`);

      console.log(`\nEntities: ${result.entities.length}`);
      const primaryEntities = result.entities.filter(e => e.type === 'primary');
      if (primaryEntities.length > 0) {
        console.log(`  Primary: ${primaryEntities.map(e => e.name).join(', ')}`);
      }

      console.log(`\nInvariants: ${result.invariants.length}`);
      if (result.invariants.length > 0) {
        const types = [...new Set(result.invariants
          .flatMap(inv => inv.classifications.map(c => c.type))
        )];
        console.log(`  Types: ${types.join(', ')}`);
      }

      console.log(`\nAPI Endpoint: ${result.api_endpoint.full_endpoint}`);
      console.log(`  Resource: ${result.api_endpoint.resource}`);
      console.log(`  Auth: ${result.api_endpoint.authorization.required_role}`);

      console.log(`\nComplexity: ${result.complexity.level} (score: ${result.complexity.total_score})`);
      console.log(`  Entities: ${result.complexity.factors.entity_count}`);
      console.log(`  Invariants: ${result.complexity.factors.invariant_count}`);
      console.log(`  Conditions: ${result.complexity.factors.condition_count}`);

      if (result.recommendations.length > 0) {
        console.log(`\nRecommendations: ${result.recommendations.length}`);
        result.recommendations.forEach((rec, i) => {
          console.log(`  ${i + 1}. [${rec.type}] ${rec.message}`);
        });
      }

      console.log(`\n✅ Analysis written to: ${outputFile}`);
      console.log('');

    } catch (error) {
      console.error(`❌ Test failed for ${reqId}:`, error.message);
      console.error(error.stack);
    }
  }

  console.log('✅ All tests completed\n');
}

testAnalyzeRequirement();
