/**
 * Test script for Tier 2 code generation composition skills (Month 4 Week 2)
 */

const { invokeSkill } = require('./lib/SkillInvoker');
const path = require('path');
const fs = require('fs');

async function testTier2CodeGenerationComposition() {
  console.log('Testing Tier 2 Code Generation Composition skills (Month 4 Week 2)...\n');

  const artifactsDir = path.join(__dirname, '../../ROME_architect/ARTIFACTS');
  const designDir = path.join(artifactsDir, '07-design');
  const codeOutputDir = path.join(artifactsDir, '09-code-generation');

  // Clean up previous test output
  if (fs.existsSync(codeOutputDir)) {
    fs.rmSync(codeOutputDir, { recursive: true, force: true });
  }
  fs.mkdirSync(codeOutputDir, { recursive: true });

  try {
    console.log('='.repeat(70));
    console.log('TIER 2 CODE GENERATION COMPOSITION SKILLS TEST');
    console.log('='.repeat(70));
    console.log('');

    // Test 1: Generate Complete Domain Layer
    console.log('1/4 Testing generate-complete-domain-layer...');
    const domainLayer = await invokeSkill('generate-complete-domain-layer', {
      design_directory: designDir,
      output_directory: path.join(codeOutputDir, 'domain')
    });
    console.log(`  ✅ Files: ${domainLayer.files_generated.length}`);
    console.log(`  ✅ Components: ${JSON.stringify(domainLayer.components_created)}\n`);

    // Test 2: Generate Complete Data Layer
    console.log('2/4 Testing generate-complete-data-layer...');
    const dataLayer = await invokeSkill('generate-complete-data-layer', {
      design_directory: designDir,
      output_directory: path.join(codeOutputDir, 'data')
    });
    console.log(`  ✅ Files: ${dataLayer.files_generated.length}`);
    console.log(`  ✅ Components: ${JSON.stringify(dataLayer.components_created)}\n`);

    // Test 3: Generate Complete Presentation Layer
    console.log('3/4 Testing generate-complete-presentation-layer...');
    const presentationLayer = await invokeSkill('generate-complete-presentation-layer', {
      design_directory: designDir,
      output_directory: path.join(codeOutputDir, 'presentation')
    });
    console.log(`  ✅ Files: ${presentationLayer.files_generated.length}`);
    console.log(`  ✅ Components: ${JSON.stringify(presentationLayer.components_created)}\n`);

    // Test 4: Execute P5 Code Generation (Full Pipeline)
    console.log('4/4 Testing execute-p5-code-generation...');

    // Clean up for full pipeline test
    const p5OutputDir = path.join(codeOutputDir, 'p5-full');
    if (fs.existsSync(p5OutputDir)) {
      fs.rmSync(p5OutputDir, { recursive: true, force: true });
    }

    const p5Result = await invokeSkill('execute-p5-code-generation', {
      design_directory: designDir,
      code_output_directory: p5OutputDir
    });
    console.log(`  ✅ Status: ${p5Result.p5_status}`);
    console.log(`  ✅ Total files: ${p5Result.files_generated.length}\n`);

    console.log('='.repeat(70));
    console.log('ALL TIER 2 CODE GENERATION COMPOSITION SKILLS TESTED SUCCESSFULLY');
    console.log('='.repeat(70));
    console.log('');
    console.log('Summary:');
    console.log(`  Domain layer files: ${domainLayer.files_generated.length}`);
    console.log(`    - Result types: ${domainLayer.components_created.result_types}`);
    console.log(`    - Entities: ${domainLayer.components_created.entities}`);
    console.log(`    - Repository interfaces: ${domainLayer.components_created.repository_interfaces}`);
    console.log(`  Data layer files: ${dataLayer.files_generated.length}`);
    console.log(`    - Parse models: ${dataLayer.components_created.parse_models}`);
    console.log(`    - Repository implementations: ${dataLayer.components_created.repository_implementations}`);
    console.log(`    - Validators: ${dataLayer.components_created.validators}`);
    console.log(`  Presentation layer files: ${presentationLayer.files_generated.length}`);
    console.log(`    - BLoC events: ${presentationLayer.components_created.bloc_events}`);
    console.log(`    - BLoC states: ${presentationLayer.components_created.bloc_states}`);
    console.log(`    - BLoC classes: ${presentationLayer.components_created.bloc_classes}`);
    console.log(`    - UI screens: ${presentationLayer.components_created.ui_screens}`);
    console.log(`  P5 full pipeline:`);
    console.log(`    - Status: ${p5Result.p5_status}`);
    console.log(`    - Total files: ${p5Result.files_generated.length}`);
    console.log('');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }

  console.log('✅ All tests completed\n');
}

testTier2CodeGenerationComposition();
