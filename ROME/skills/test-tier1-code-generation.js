/**
 * Test script for Tier 1 code generation skills (Month 4 Week 1)
 */

const { invokeSkill } = require('./lib/SkillInvoker');
const path = require('path');
const fs = require('fs');

async function testTier1CodeGeneration() {
  console.log('Testing Tier 1 Code Generation skills (Month 4 Week 1)...\n');

  const artifactsDir = path.join(__dirname, '../../ROME_architect/ARTIFACTS');
  const designDir = path.join(artifactsDir, '07-design');
  const codeOutputDir = path.join(artifactsDir, '09-code-generation');

  // Clean up previous test output
  if (fs.existsSync(codeOutputDir)) {
    fs.rmSync(codeOutputDir, { recursive: true, force: true });
  }
  fs.mkdirSync(codeOutputDir, { recursive: true });

  const domainDir = path.join(codeOutputDir, 'domain');
  const dataDir = path.join(codeOutputDir, 'data');
  const presentationDir = path.join(codeOutputDir, 'presentation');

  try {
    console.log('='.repeat(70));
    console.log('TIER 1 CODE GENERATION SKILLS TEST');
    console.log('='.repeat(70));
    console.log('');

    // Test 1: Generate Result Types (foundation)
    console.log('1/10 Testing generate-result-types...');
    const resultTypes = await invokeSkill('generate-result-types', {
      output_directory: path.join(domainDir, 'value_objects')
    });
    console.log(`  ✅ Files: ${resultTypes.files_generated.join(', ')}\n`);

    // Test 2: Generate Entity Classes
    console.log('2/10 Testing generate-entity-classes...');
    const entities = await invokeSkill('generate-entity-classes', {
      design_directory: designDir,
      output_directory: path.join(domainDir, 'entities')
    });
    console.log(`  ✅ Entities: ${entities.entities_created} (${entities.files_generated.join(', ')})\n`);

    // Test 3: Generate Parse Models
    console.log('3/10 Testing generate-parse-models...');
    const parseModels = await invokeSkill('generate-parse-models', {
      design_directory: designDir,
      output_directory: path.join(dataDir, 'models')
    });
    console.log(`  ✅ Models: ${parseModels.models_created} (${parseModels.files_generated.join(', ')})\n`);

    // Test 4: Generate Repository Interfaces
    console.log('4/10 Testing generate-repository-interfaces...');
    const repoInterfaces = await invokeSkill('generate-repository-interfaces', {
      design_directory: designDir,
      output_directory: path.join(domainDir, 'repositories')
    });
    console.log(`  ✅ Repositories: ${repoInterfaces.repositories_created} (${repoInterfaces.files_generated.join(', ')})\n`);

    // Test 5: Generate Repository Implementations
    console.log('5/10 Testing generate-repository-implementations...');
    const repoImpls = await invokeSkill('generate-repository-implementations', {
      design_directory: designDir,
      output_directory: path.join(dataDir, 'repositories')
    });
    console.log(`  ✅ Implementations: ${repoImpls.implementations_created} (${repoImpls.files_generated.join(', ')})\n`);

    // Test 6: Generate BLoC Events
    console.log('6/10 Testing generate-bloc-events...');
    const blocEvents = await invokeSkill('generate-bloc-events', {
      design_directory: designDir,
      output_directory: path.join(presentationDir, 'bloc')
    });
    console.log(`  ✅ Events: ${blocEvents.events_created} (${blocEvents.files_generated.join(', ')})\n`);

    // Test 7: Generate BLoC States
    console.log('7/10 Testing generate-bloc-states...');
    const blocStates = await invokeSkill('generate-bloc-states', {
      design_directory: designDir,
      output_directory: path.join(presentationDir, 'bloc')
    });
    console.log(`  ✅ States: ${blocStates.states_created} (${blocStates.files_generated.join(', ')})\n`);

    // Test 8: Generate BLoC Classes
    console.log('8/10 Testing generate-bloc-classes...');
    const blocs = await invokeSkill('generate-bloc-classes', {
      design_directory: designDir,
      output_directory: path.join(presentationDir, 'bloc')
    });
    console.log(`  ✅ BLoCs: ${blocs.blocs_created} (${blocs.files_generated.join(', ')})\n`);

    // Test 9: Generate UI Screens
    console.log('9/10 Testing generate-ui-screens...');
    const uiScreens = await invokeSkill('generate-ui-screens', {
      design_directory: designDir,
      output_directory: path.join(presentationDir, 'screens')
    });
    console.log(`  ✅ Screens: ${uiScreens.screens_created} (${uiScreens.files_generated.join(', ')})\n`);

    // Test 10: Generate Parse Validation
    console.log('10/10 Testing generate-parse-validation...');
    const validation = await invokeSkill('generate-parse-validation', {
      design_directory: designDir,
      output_directory: path.join(dataDir, 'validators')
    });
    console.log(`  ✅ Validators: ${validation.validators_created} (${validation.files_generated.join(', ')})\n`);

    // Summary
    const totalFiles =
      resultTypes.files_generated.length +
      entities.files_generated.length +
      parseModels.files_generated.length +
      repoInterfaces.files_generated.length +
      repoImpls.files_generated.length +
      blocEvents.files_generated.length +
      blocStates.files_generated.length +
      blocs.files_generated.length +
      uiScreens.files_generated.length +
      validation.files_generated.length;

    console.log('='.repeat(70));
    console.log('ALL TIER 1 CODE GENERATION SKILLS TESTED SUCCESSFULLY');
    console.log('='.repeat(70));
    console.log('');
    console.log('Summary:');
    console.log(`  Result types: ${resultTypes.files_generated.length} file`);
    console.log(`  Domain entities: ${entities.entities_created} entities`);
    console.log(`  Parse models: ${parseModels.models_created} models`);
    console.log(`  Repository interfaces: ${repoInterfaces.repositories_created} interfaces`);
    console.log(`  Repository implementations: ${repoImpls.implementations_created} implementations`);
    console.log(`  BLoC events: ${blocEvents.events_created} event files`);
    console.log(`  BLoC states: ${blocStates.states_created} state files`);
    console.log(`  BLoC classes: ${blocs.blocs_created} BLoCs`);
    console.log(`  UI screens: ${uiScreens.screens_created} screens`);
    console.log(`  Validators: ${validation.validators_created} validators`);
    console.log(`  Total files generated: ${totalFiles}`);
    console.log('');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }

  console.log('✅ All tests completed\n');
}

testTier1CodeGeneration();
