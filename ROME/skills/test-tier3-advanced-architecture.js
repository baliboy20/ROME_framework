/**
 * Test script for Tier 3 advanced architecture skills
 */

const { invokeSkill } = require('./lib/SkillInvoker');
const path = require('path');

async function testTier3AdvancedArchitecture() {
  console.log('Testing Tier 3 Advanced Architecture skills...\n');

  const artifactsDir = path.join(__dirname, '../../ROME_architect/ARTIFACTS');
  const designDir = path.join(artifactsDir, '07-design');
  const requirementsDir = path.join(artifactsDir, '01-requirements');

  try {
    // Test 1: Validate Architecture
    console.log('1/5 Testing validate-architecture...');
    const archValid = await invokeSkill('validate-architecture', {
      design_directory: designDir,
      output_file: path.join(designDir, 'architecture-validation.json')
    });
    console.log(`  ✅ Status: ${archValid.validation_status}, Score: ${archValid.best_practices_score}/100\n`);

    // Test 2: Analyze Scalability
    console.log('2/5 Testing analyze-scalability...');
    const scalability = await invokeSkill('analyze-scalability', {
      design_directory: designDir,
      output_file: path.join(designDir, 'scalability-analysis.json')
    });
    console.log(`  ✅ Score: ${scalability.scalability_score}/100, Bottlenecks: ${scalability.bottlenecks.length}\n`);

    // Test 3: Generate Tech Stack Spec
    console.log('3/5 Testing generate-tech-stack-spec...');
    const techStack = await invokeSkill('generate-tech-stack-spec', {
      design_directory: designDir,
      output_file: path.join(designDir, 'tech-stack.json'),
      deployment_target: 'cloud'
    });
    console.log(`  ✅ Components: ${techStack.components_count}\n`);

    // Test 4: Generate Architecture Doc (ADR)
    console.log('4/5 Testing generate-architecture-doc...');
    const adr = await invokeSkill('generate-architecture-doc', {
      design_directory: designDir,
      output_file: path.join(designDir, 'ADR.md')
    });
    console.log(`  ✅ ADRs: ${adr.adr_count}\n`);

    // Test 5: Execute Full Design Pipeline
    console.log('5/5 Testing execute-full-design-pipeline...');
    const pipeline = await invokeSkill('execute-full-design-pipeline', {
      requirements_directory: requirementsDir,
      artifacts_directory: artifactsDir,
      strict_validation: true
    });
    console.log(`  ✅ Status: ${pipeline.pipeline_status}`);
    console.log(`  ✅ Phases: ${pipeline.phases_completed.length}/3`);
    console.log(`  ✅ Artifacts: ${pipeline.total_artifacts}\n`);

    console.log('='.repeat(70));
    console.log('ALL TIER 3 ADVANCED ARCHITECTURE SKILLS TESTED SUCCESSFULLY');
    console.log('='.repeat(70));
    console.log('');
    console.log('Summary:');
    console.log(`  Architecture Score: ${archValid.best_practices_score}/100`);
    console.log(`  Scalability Score: ${scalability.scalability_score}/100`);
    console.log(`  Tech Stack Components: ${techStack.components_count}`);
    console.log(`  ADRs Generated: ${adr.adr_count}`);
    console.log(`  Pipeline Status: ${pipeline.pipeline_status}`);
    console.log(`  Total Artifacts: ${pipeline.total_artifacts}`);
    console.log('');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }

  console.log('✅ All tests completed\n');
}

testTier3AdvancedArchitecture();
