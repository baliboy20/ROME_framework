/**
 * Test script for /execute-full-pipeline skill (Tier 3)
 */

const { invokeSkill } = require('./lib/SkillInvoker');
const path = require('path');

async function testExecuteFullPipeline() {
  console.log('Testing /execute-full-pipeline skill (Tier 3)...\n');

  const requirementsDir = path.join(
    __dirname,
    '../../ROME_architect/ARTIFACTS/01-requirements'
  );

  const artifactsDir = path.join(
    __dirname,
    '../../ROME_architect/ARTIFACTS'
  );

  console.log('='.repeat(70));
  console.log('Executing Full Pipeline');
  console.log('='.repeat(70));
  console.log('');

  console.log(`Requirements Directory: ${requirementsDir}`);
  console.log(`Artifacts Directory: ${artifactsDir}`);
  console.log('');

  try {
    const result = await invokeSkill('execute-full-pipeline', {
      requirements_directory: requirementsDir,
      artifacts_directory: artifactsDir,
      validate_artifacts: true,
      optimize_data_model: true,
      analyze_dependencies: true,
      generate_deployment_guide: true,
      strict_validation: true
    });

    console.log('\n' + '='.repeat(70));
    console.log('FINAL RESULTS');
    console.log('='.repeat(70));
    console.log('');

    console.log(`🚀 Pipeline Status: ${result.pipeline_status}`);
    console.log(`   Phases Completed: ${result.phases_completed.length}/5`);
    console.log(`   Total Artifacts: ${result.total_artifacts}`);
    console.log('');

    console.log('Completed Phases:');
    result.phases_completed.forEach((phase, idx) => {
      console.log(`  ${idx + 1}. ${phase}`);
    });
    console.log('');

    console.log('Quality Metrics:');
    console.log(`  Validation Status: ${result.validation_status}`);
    console.log(`  Optimization Score: ${result.optimization_score}/100`);
    console.log('');

    if (result.phase_results) {
      console.log('Detailed Phase Results:');
      Object.keys(result.phase_results).forEach(phase => {
        const phaseResult = result.phase_results[phase];
        console.log(`  ${phase}:`);
        Object.keys(phaseResult).forEach(key => {
          console.log(`    ${key}: ${phaseResult[key]}`);
        });
      });
      console.log('');
    }

    if (result.pipeline_status === 'SUCCESS') {
      console.log('✅ Pipeline executed successfully!\n');
    } else if (result.pipeline_status === 'PARTIAL_SUCCESS') {
      console.log('⚠️  Pipeline partially completed\n');
    } else {
      console.log('❌ Pipeline failed\n');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }

  console.log('✅ Test completed\n');
}

testExecuteFullPipeline();
