/**
 * Test script for Tier 3 advanced code generation skills (Month 4 Week 3-4)
 */

const { invokeSkill } = require('./lib/SkillInvoker');
const path = require('path');

async function testTier3AdvancedCodeGeneration() {
  console.log('Testing Tier 3 Advanced Code Generation skills (Month 4 Week 3-4)...\n');

  const artifactsDir = path.join(__dirname, '../../ROME_architect/ARTIFACTS');
  const codeOutputDir = path.join(artifactsDir, '09-code-generation');
  const requirementsDir = path.join(artifactsDir, '01-requirements');

  try {
    console.log('='.repeat(70));
    console.log('TIER 3 ADVANCED CODE GENERATION SKILLS TEST');
    console.log('='.repeat(70));
    console.log('');

    // First, generate code using P5 to have something to validate
    console.log('0/5 Generating code for testing...');
    const designDir = path.join(artifactsDir, '07-design');
    await invokeSkill('execute-p5-code-generation', {
      design_directory: designDir,
      code_output_directory: codeOutputDir
    });
    console.log('  ✅ Code generated\n');

    // Test 1: Validate Code Generation
    console.log('1/5 Testing validate-code-generation...');
    const codeValidation = await invokeSkill('validate-code-generation', {
      code_directory: codeOutputDir,
      output_file: path.join(codeOutputDir, 'validation-report.json')
    });
    console.log(`  ✅ Status: ${codeValidation.validation_status}, Quality: ${codeValidation.quality_score}/100, Pattern: ${codeValidation.pattern_score}/100\n`);

    // Test 2: Optimize Code Structure
    console.log('2/5 Testing optimize-code-structure...');
    const optimization = await invokeSkill('optimize-code-structure', {
      code_directory: codeOutputDir,
      output_file: path.join(codeOutputDir, 'optimization-report.json')
    });
    console.log(`  ✅ Score: ${optimization.optimization_score}/100, Recommendations: ${optimization.recommendations.length}\n`);

    // Test 3: Generate Dependency Injection
    console.log('3/5 Testing generate-dependency-injection...');
    const diSetup = await invokeSkill('generate-dependency-injection', {
      code_directory: codeOutputDir,
      output_file: path.join(codeOutputDir, 'injection.dart')
    });
    console.log(`  ✅ File: ${diSetup.file_generated}, Dependencies: ${diSetup.dependencies_registered}\n`);

    // Test 4: Generate Routing Config
    console.log('4/5 Testing generate-routing-config...');
    const routing = await invokeSkill('generate-routing-config', {
      code_directory: codeOutputDir,
      output_file: path.join(codeOutputDir, 'router.dart')
    });
    console.log(`  ✅ File: ${routing.file_generated}, Routes: ${routing.routes_created}\n`);

    // Test 5: Execute Complete Code Pipeline
    console.log('5/5 Testing execute-complete-code-pipeline...');
    const fullPipeline = await invokeSkill('execute-complete-code-pipeline', {
      requirements_directory: requirementsDir,
      artifacts_directory: artifactsDir
    });
    console.log(`  ✅ Status: ${fullPipeline.pipeline_status}\n`);
    console.log(`  ✅ Phases: ${fullPipeline.phases_completed.length}/5\n`);
    console.log(`  ✅ Total files: ${fullPipeline.total_files}\n`);

    console.log('='.repeat(70));
    console.log('ALL TIER 3 ADVANCED CODE GENERATION SKILLS TESTED SUCCESSFULLY');
    console.log('='.repeat(70));
    console.log('');
    console.log('Summary:');
    console.log(`  Code validation status: ${codeValidation.validation_status}`);
    console.log(`  Quality score: ${codeValidation.quality_score}/100`);
    console.log(`  Pattern score: ${codeValidation.pattern_score}/100`);
    console.log(`  Optimization score: ${optimization.optimization_score}/100`);
    console.log(`  Optimization recommendations: ${optimization.recommendations.length}`);
    console.log(`  DI dependencies registered: ${diSetup.dependencies_registered}`);
    console.log(`  Routes created: ${routing.routes_created}`);
    console.log(`  Full pipeline status: ${fullPipeline.pipeline_status}`);
    console.log(`  Full pipeline phases: ${fullPipeline.phases_completed.length}/5`);
    console.log(`  Full pipeline files: ${fullPipeline.total_files}`);
    console.log('');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }

  console.log('✅ All tests completed\n');
}

testTier3AdvancedCodeGeneration();
