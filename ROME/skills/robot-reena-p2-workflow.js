/**
 * Reena Robot - Phase 2 Analysis Workflow
 *
 * This script demonstrates how robot Reena (Analysis Robot)
 * executes the complete Phase 2 analysis workflow using ROME skills.
 *
 * Reena would invoke this via:
 *   cd /path/to/ROME/skills && node robot-reena-p2-workflow.js
 */

const { invokeSkill } = require('./lib/SkillInvoker');
const path = require('path');

async function reenaP2Workflow() {
  console.log('🤖 Reena (Analysis Robot) starting Phase 2 workflow...\n');

  const artifactsDir = path.join(__dirname, '../../ROME_architect/ARTIFACTS');
  const requirementsDir = path.join(artifactsDir, '01-requirements');
  const analysisDir = path.join(artifactsDir, '02-analysis');

  try {
    // Step 1: Discover available analysis skills
    console.log('📋 Step 1: Discovering analysis skills...');
    const analysisSkills = await invokeSkill('list-skills', {
      filter_phase: 'P2',
      output_format: 'summary'
    });
    console.log(`Found ${analysisSkills.total_count} P2 skills\n`);

    // Step 2: Validate all requirements before analysis
    console.log('✅ Step 2: Validating all requirements...');
    const validation = await invokeSkill('batch-validate-requirements', {
      requirements_dir: requirementsDir
    });
    console.log(`Validated ${validation.total_validated} requirements`);
    console.log(`  Pass: ${validation.passed_count}, Fail: ${validation.failed_count}\n`);

    if (validation.failed_count > 0) {
      console.log('❌ Cannot proceed - validation failures detected');
      console.log('Blocking until requirements are fixed.\n');
      return { status: 'BLOCKED', reason: 'Validation failures' };
    }

    // Step 3: Batch analyze all requirements
    console.log('🔍 Step 3: Analyzing all requirements...');
    const batchAnalysis = await invokeSkill('batch-analyze-requirements', {
      requirements_dir: requirementsDir,
      output_dir: analysisDir,
      output_format: 'json',
      include_recommendations: true
    });
    console.log(`Analyzed ${batchAnalysis.total_analyzed} requirements\n`);

    // Step 4: Analyze dependencies between requirements
    console.log('🔗 Step 4: Analyzing requirement dependencies...');
    const dependencies = await invokeSkill('analyze-dependencies', {
      requirements_dir: requirementsDir,
      output_file: path.join(artifactsDir, 'DEPENDENCY-ANALYSIS.json')
    });
    console.log(`Found ${dependencies.total_dependencies} dependencies\n`);

    // Step 5: Generate unified data dictionary
    console.log('📚 Step 5: Generating data dictionary...');
    const dataDictionary = await invokeSkill('generate-data-dictionary', {
      analysis_dir: analysisDir,
      output_file: path.join(analysisDir, 'data-dictionary.json')
    });
    console.log(`Data dictionary: ${dataDictionary.total_entities} entities\n`);

    // Step 6: Generate unified API specification
    console.log('📡 Step 6: Generating unified API spec...');
    const apiSpec = await invokeSkill('generate-full-api-spec', {
      requirements_dir: requirementsDir,
      analysis_dir: analysisDir,
      output_file: path.join(artifactsDir, '05-api-specs/unified-api-spec.yaml')
    });
    console.log(`API spec: ${apiSpec.total_endpoints} endpoints\n`);

    // Step 7: Generate test scenarios
    console.log('🧪 Step 7: Generating test scenarios...');
    const testScenarios = await invokeSkill('generate-test-scenarios', {
      requirements_dir: requirementsDir,
      output_dir: path.join(artifactsDir, '04-test-scenarios')
    });
    console.log(`Generated ${testScenarios.total_scenarios} test scenarios\n`);

    // Step 8: Generate project summary
    console.log('📊 Step 8: Generating project summary...');
    const summary = await invokeSkill('generate-project-summary', {
      requirements_dir: requirementsDir,
      analysis_dir: analysisDir,
      output_file: path.join(artifactsDir, 'PROJECT-SUMMARY.md')
    });
    console.log(`Summary complete\n`);

    // Step 9: Report completion to Roma (orchestrator)
    console.log('✅ Phase 2 Analysis Complete!');
    console.log('\n📋 Summary:');
    console.log(`  Requirements analyzed: ${batchAnalysis.total_analyzed}`);
    console.log(`  Entities extracted: ${dataDictionary.total_entities}`);
    console.log(`  API endpoints: ${apiSpec.total_endpoints}`);
    console.log(`  Dependencies: ${dependencies.total_dependencies}`);
    console.log(`  Test scenarios: ${testScenarios.total_scenarios}`);
    console.log('\n🚀 Ready for Quality Gate P2→P3 (Sarah validation)\n');

    return {
      status: 'SUCCESS',
      phase: 'P2',
      requirements_analyzed: batchAnalysis.total_analyzed,
      entities_extracted: dataDictionary.total_entities,
      api_endpoints: apiSpec.total_endpoints,
      dependencies: dependencies.total_dependencies,
      test_scenarios: testScenarios.total_scenarios,
      ready_for_gate: 'P2_TO_P3'
    };

  } catch (error) {
    console.error('❌ Phase 2 workflow failed:', error.message);
    console.error(error.stack);
    return { status: 'FAILED', error: error.message };
  }
}

// Execute if run directly
if (require.main === module) {
  reenaP2Workflow()
    .then(result => {
      console.log('\n📝 Final Result:', JSON.stringify(result, null, 2));
      process.exit(result.status === 'SUCCESS' ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { reenaP2Workflow };
