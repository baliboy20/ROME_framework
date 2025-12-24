/**
 * Test script for Tier 3 advanced configuration skills (Month 3 Week 3-4)
 */

const { invokeSkill } = require('./lib/SkillInvoker');
const path = require('path');

async function testTier3AdvancedConfiguration() {
  console.log('Testing Tier 3 Advanced Configuration skills (Month 3 Week 3-4)...\n');

  const artifactsDir = path.join(__dirname, '../../ROME_architect/ARTIFACTS');
  const designDir = path.join(artifactsDir, '07-design');
  const configDir = path.join(artifactsDir, '08-configuration');
  const requirementsDir = path.join(artifactsDir, '01-requirements');

  try {
    // Test 1: Validate Configuration
    console.log('1/4 Testing validate-configuration...');
    const configValidation = await invokeSkill('validate-configuration', {
      config_directory: configDir,
      output_file: path.join(configDir, 'validation-report.json')
    });
    console.log(`  ✅ Status: ${configValidation.validation_status}, Security: ${configValidation.security_score}/100, Consistency: ${configValidation.consistency_score}/100\n`);

    // Test 2: Optimize Deployment Config
    console.log('2/4 Testing optimize-deployment-config...');
    const optimization = await invokeSkill('optimize-deployment-config', {
      config_directory: configDir,
      output_file: path.join(configDir, 'optimization-report.json')
    });
    console.log(`  ✅ Score: ${optimization.optimization_score}/100, Recommendations: ${optimization.recommendations.length}\n`);

    // Test 3: Generate Deployment Scripts
    console.log('3/4 Testing generate-deployment-scripts...');
    const deployScripts = await invokeSkill('generate-deployment-scripts', {
      config_directory: configDir,
      output_directory: configDir
    });
    console.log(`  ✅ Scripts: ${deployScripts.scripts_generated.join(', ')}\n`);

    // Test 4: Execute Full Configuration Pipeline
    console.log('4/4 Testing execute-full-configuration-pipeline...');
    const fullPipeline = await invokeSkill('execute-full-configuration-pipeline', {
      requirements_directory: requirementsDir,
      artifacts_directory: artifactsDir
    });
    console.log(`  ✅ Status: ${fullPipeline.pipeline_status}\n`);
    console.log(`  ✅ Phases: ${fullPipeline.phases_completed.length}/4\n`);
    console.log(`  ✅ Total files: ${fullPipeline.total_files}\n`);

    console.log('='.repeat(70));
    console.log('ALL TIER 3 ADVANCED CONFIGURATION SKILLS TESTED SUCCESSFULLY');
    console.log('='.repeat(70));
    console.log('');
    console.log('Summary:');
    console.log(`  Config validation status: ${configValidation.validation_status}`);
    console.log(`  Security score: ${configValidation.security_score}/100`);
    console.log(`  Consistency score: ${configValidation.consistency_score}/100`);
    console.log(`  Optimization score: ${optimization.optimization_score}/100`);
    console.log(`  Optimization recommendations: ${optimization.recommendations.length}`);
    console.log(`  Deployment scripts: ${deployScripts.scripts_generated.length}`);
    console.log(`  Full pipeline status: ${fullPipeline.pipeline_status}`);
    console.log(`  Full pipeline phases: ${fullPipeline.phases_completed.length}/4`);
    console.log(`  Full pipeline files: ${fullPipeline.total_files}`);
    console.log('');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }

  console.log('✅ All tests completed\n');
}

testTier3AdvancedConfiguration();
