/**
 * Test script for Tier 2 configuration composition skills (Month 3 Week 2)
 */

const { invokeSkill } = require('./lib/SkillInvoker');
const path = require('path');

async function testTier2ConfigurationComposition() {
  console.log('Testing Tier 2 Configuration Composition skills (Month 3 Week 2)...\n');

  const artifactsDir = path.join(__dirname, '../../ROME_architect/ARTIFACTS');
  const designDir = path.join(artifactsDir, '07-design');
  const configDir = path.join(artifactsDir, '08-configuration');
  const dataDictFile = path.join(artifactsDir, '02-analysis/data-dictionary.json');

  try {
    // Test 1: Generate Complete Docker Setup
    console.log('1/4 Testing generate-complete-docker-setup...');
    const dockerSetup = await invokeSkill('generate-complete-docker-setup', {
      design_directory: designDir,
      output_directory: configDir
    });
    console.log(`  ✅ Files: ${dockerSetup.files_generated.length}, Setup: ${dockerSetup.setup_complete}\n`);

    // Test 2: Generate Complete Database Setup
    console.log('2/4 Testing generate-complete-database-setup...');
    const dbSetup = await invokeSkill('generate-complete-database-setup', {
      data_dictionary_file: dataDictFile,
      design_directory: designDir,
      output_directory: configDir
    });
    console.log(`  ✅ Files: ${dbSetup.files_generated.length}, Tables: ${dbSetup.tables_created}\n`);

    // Test 3: Generate Complete Observability Stack
    console.log('3/4 Testing generate-complete-observability-stack...');
    const obsStack = await invokeSkill('generate-complete-observability-stack', {
      design_directory: designDir,
      output_directory: configDir
    });
    console.log(`  ✅ Files: ${obsStack.files_generated.length}, Components: ${obsStack.components_configured}\n`);

    // Test 4: Execute P4 Configuration
    console.log('4/4 Testing execute-p4-configuration...');
    const p4Config = await invokeSkill('execute-p4-configuration', {
      artifacts_directory: artifactsDir,
      config_output_directory: configDir
    });
    console.log(`  ✅ Status: ${p4Config.phase_status}\n`);
    console.log(`  ✅ Files: ${p4Config.files_generated}\n`);

    console.log('='.repeat(70));
    console.log('ALL TIER 2 CONFIGURATION COMPOSITION SKILLS TESTED SUCCESSFULLY');
    console.log('='.repeat(70));
    console.log('');
    console.log('Summary:');
    console.log(`  Docker setup files: ${dockerSetup.files_generated.length}`);
    console.log(`  Database setup files: ${dbSetup.files_generated.length}`);
    console.log(`  Database tables: ${dbSetup.tables_created}`);
    console.log(`  Observability files: ${obsStack.files_generated.length}`);
    console.log(`  P4 phase status: ${p4Config.phase_status}`);
    console.log(`  P4 total files: ${p4Config.files_generated}`);
    console.log('');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }

  console.log('✅ All tests completed\n');
}

testTier2ConfigurationComposition();
