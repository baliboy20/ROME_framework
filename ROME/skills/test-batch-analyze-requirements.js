/**
 * Test script for /batch-analyze-requirements skill
 */

const { invokeSkill } = require('./lib/SkillInvoker');
const path = require('path');

async function testBatchAnalyzeRequirements() {
  console.log('Testing /batch-analyze-requirements skill...\n');
  console.log('This will analyze all 25 pilot project requirements...\n');

  const requirementsDir = path.join(
    __dirname,
    '../../ROME_architect/ARTIFACTS/01-requirements'
  );

  const outputDir = path.join(
    __dirname,
    '../../ROME_architect/ARTIFACTS/02-analysis'
  );

  console.log('='.repeat(70));
  console.log('Batch Analyzing All Requirements');
  console.log('='.repeat(70));
  console.log('');

  try {
    const result = await invokeSkill('batch-analyze-requirements', {
      requirements_directory: requirementsDir,
      output_directory: outputDir,
      output_format: 'json',
      generate_summary: true
    });

    console.log('='.repeat(70));
    console.log('Batch Analysis Complete');
    console.log('='.repeat(70));
    console.log('');

    console.log(`📊 Summary Statistics\n`);
    console.log(`Total Requirements: ${result.summary.total_requirements}`);
    console.log(`Failed: ${result.failed_count}\n`);

    console.log(`Validation:`);
    console.log(`  Pass: ${result.summary.validation.pass} (${result.summary.validation.pass_rate}%)`);
    console.log(`  Fail: ${result.summary.validation.fail}\n`);

    console.log(`Complexity:`);
    console.log(`  Average Score: ${result.summary.complexity.average_score}`);
    console.log(`  LOW: ${result.summary.complexity.LOW}`);
    console.log(`  MEDIUM: ${result.summary.complexity.MEDIUM}`);
    console.log(`  HIGH: ${result.summary.complexity.HIGH}`);
    console.log(`  VERY_HIGH: ${result.summary.complexity.VERY_HIGH}\n`);

    console.log(`Entities:`);
    console.log(`  Total: ${result.summary.entities.total}`);
    console.log(`  Average per Requirement: ${result.summary.entities.average_per_requirement}\n`);

    console.log(`Invariants:`);
    console.log(`  Total: ${result.summary.invariants.total}`);
    console.log(`  Average per Requirement: ${result.summary.invariants.average_per_requirement}\n`);

    console.log(`Recommendations:`);
    console.log(`  Total: ${result.summary.recommendations.total}`);
    console.log(`  Average per Requirement: ${result.summary.recommendations.average_per_requirement}\n`);

    console.log(`API Endpoints Generated: ${result.summary.api_endpoints.length}\n`);

    if (result.failures.length > 0) {
      console.log(`⚠️  Failures:\n`);
      result.failures.forEach(failure => {
        console.log(`  ${failure.requirement_id}: ${failure.error}`);
      });
      console.log('');
    }

    console.log(`✅ Summary written to: ${outputDir}/_summary.json\n`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }

  console.log('✅ Test completed\n');
}

testBatchAnalyzeRequirements();
