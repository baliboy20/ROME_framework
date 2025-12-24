/**
 * Test script for /generate-project-summary skill (Tier 2)
 */

const { invokeSkill } = require('./lib/SkillInvoker');
const path = require('path');
const fs = require('fs');

async function testGenerateProjectSummary() {
  console.log('Testing /generate-project-summary skill (Tier 2)...\n');

  const artifactsDir = path.join(
    __dirname,
    '../../ROME_architect/ARTIFACTS'
  );

  const outputFile = path.join(artifactsDir, 'PROJECT-SUMMARY.md');

  console.log('='.repeat(70));
  console.log('Generating Project Summary');
  console.log('='.repeat(70));
  console.log('');

  try {
    const result = await invokeSkill('generate-project-summary', {
      artifacts_directory: artifactsDir,
      output_file: outputFile,
      output_format: 'markdown',
      project_name: 'Project Management System'
    });

    console.log('\n' + '='.repeat(70));
    console.log('Project Summary Generated');
    console.log('='.repeat(70));
    console.log('');

    const summary = result.summary;

    console.log(`📋 Project: ${summary.project.name}`);
    console.log(`   Status: ${summary.project.status}\n`);

    console.log(`📊 Requirements:`);
    console.log(`   Total: ${summary.requirements.total}`);
    console.log(`   Validation: ${summary.requirements.validation_pass_rate}`);
    console.log(`   Avg Complexity: ${summary.requirements.avg_complexity}\n`);

    console.log(`📚 Data Model:`);
    console.log(`   Entities: ${summary.data_model.total_entities} (${summary.data_model.primary_entities} primary)`);
    console.log(`   Attributes: ${summary.data_model.total_attributes}`);
    console.log(`   Relationships: ${summary.data_model.relationships}\n`);

    console.log(`🔌 API:`);
    console.log(`   Specifications: ${summary.api.specifications_generated}\n`);

    console.log(`🗄️  Database:`);
    console.log(`   Tables: ${summary.database.tables}`);
    console.log(`   Type: ${summary.database.database_type}\n`);

    console.log(`🧪 Testing:`);
    console.log(`   Test Scenarios: ~${Math.round(summary.testing.total_test_scenarios)}`);
    console.log(`   Coverage: ${summary.testing.coverage}\n`);

    console.log(`✅ Readiness:`);
    console.log(`   Overall: ${summary.readiness.overall_status}`);
    console.log(`   Next Phase: ${summary.readiness.next_phase}\n`);

    if (summary.readiness.recommendations.length > 0) {
      console.log(`💡 Recommendations:`);
      summary.readiness.recommendations.forEach(rec => {
        console.log(`   - ${rec}`);
      });
      console.log('');
    }

    console.log(`✅ Project summary written to:`);
    console.log(`   ${outputFile}\n`);

    // Also read and display a preview
    const mdContent = fs.readFileSync(outputFile, 'utf8');
    console.log('Preview of generated summary:');
    console.log('='.repeat(70));
    console.log(mdContent.split('\n').slice(0, 20).join('\n'));
    console.log('...\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }

  console.log('✅ Test completed\n');
}

testGenerateProjectSummary();
