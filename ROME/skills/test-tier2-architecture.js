/**
 * Test script for Tier 2 architecture skills
 */

const { invokeSkill } = require('./lib/SkillInvoker');
const path = require('path');
const fs = require('fs');

async function testTier2Architecture() {
  console.log('Testing Tier 2 Architecture skills...\n');

  const artifactsDir = path.join(__dirname, '../../ROME_architect/ARTIFACTS');
  const designDir = path.join(artifactsDir, '07-design');
  const componentFile = path.join(designDir, 'component-structure.json');
  const apiControllersFile = path.join(designDir, 'api-controllers.json');

  try {
    // Test 1: Architecture Diagram
    console.log('1/4 Testing generate-architecture-diagram...');
    const archResult = await invokeSkill('generate-architecture-diagram', {
      component_structure_file: componentFile,
      output_file: path.join(designDir, 'architecture-diagram.mmd'),
      diagram_type: 'layered'
    });
    console.log(`  ✅ ${archResult.layers_visualized} layers visualized\n`);

    // Test 2: Class Diagrams
    console.log('2/4 Testing generate-class-diagrams...');
    const classResult = await invokeSkill('generate-class-diagrams', {
      component_structure_file: componentFile,
      output_file: path.join(designDir, 'class-diagrams.mmd')
    });
    console.log(`  ✅ ${classResult.diagrams_generated} class diagrams generated\n`);

    // Test 3: Sequence Diagrams
    console.log('3/4 Testing generate-sequence-diagrams...');
    const seqResult = await invokeSkill('generate-sequence-diagrams', {
      api_controllers_file: apiControllersFile,
      output_file: path.join(designDir, 'sequence-diagrams.mmd')
    });
    console.log(`  ✅ ${seqResult.diagrams_generated} sequence diagrams generated\n`);

    // Test 4: Execute P3 Design (full orchestration)
    console.log('4/4 Testing execute-p3-design...');
    const p3Result = await invokeSkill('execute-p3-design', {
      artifacts_directory: artifactsDir,
      design_output_directory: designDir
    });
    console.log(`  ✅ Status: ${p3Result.design_status}`);
    console.log(`  ✅ Artifacts: ${p3Result.artifacts_generated}\n`);

    console.log('='.repeat(70));
    console.log('ALL TIER 2 ARCHITECTURE SKILLS TESTED SUCCESSFULLY');
    console.log('='.repeat(70));
    console.log('');
    console.log('Summary:');
    console.log(`  Architecture Layers: ${archResult.layers_visualized}`);
    console.log(`  Class Diagrams: ${classResult.diagrams_generated}`);
    console.log(`  Sequence Diagrams: ${seqResult.diagrams_generated}`);
    console.log(`  P3 Design Status: ${p3Result.design_status}`);
    console.log(`  Total Artifacts: ${p3Result.artifacts_generated}`);
    console.log('');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }

  console.log('✅ All tests completed\n');
}

testTier2Architecture();
