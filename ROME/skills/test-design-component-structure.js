/**
 * Test script for /design-component-structure skill (Tier 1)
 */

const { invokeSkill } = require('./lib/SkillInvoker');
const path = require('path');
const fs = require('fs');

async function testDesignComponentStructure() {
  console.log('Testing /design-component-structure skill (Tier 1)...\n');

  const dataDictFile = path.join(
    __dirname,
    '../../ROME_architect/ARTIFACTS/02-analysis/data-dictionary.json'
  );

  const outputFile = path.join(
    __dirname,
    '../../ROME_architect/ARTIFACTS/07-design/component-structure.json'
  );

  // Ensure design directory exists
  const designDir = path.dirname(outputFile);
  if (!fs.existsSync(designDir)) {
    fs.mkdirSync(designDir, { recursive: true });
  }

  console.log('='.repeat(70));
  console.log('Designing Component Structure');
  console.log('='.repeat(70));
  console.log('');

  try {
    const result = await invokeSkill('design-component-structure', {
      data_dictionary_file: dataDictFile,
      output_file: outputFile,
      architecture_style: 'layered',
      language_target: 'typescript'
    });

    console.log('\n' + '='.repeat(70));
    console.log('Component Design Results');
    console.log('='.repeat(70));
    console.log('');

    console.log(`🏗️  Components Designed: ${result.components_designed}`);
    console.log('');

    console.log('Layer Distribution:');
    Object.keys(result.layer_distribution).forEach(layer => {
      console.log(`  ${layer}: ${result.layer_distribution[layer]}`);
    });
    console.log('');

    // Display some sample components
    console.log('Sample Component (Entity):');
    const sampleEntity = result.component_specs.find(c => c.layer === 'entity');
    if (sampleEntity) {
      console.log(`  Name: ${sampleEntity.name}`);
      console.log(`  Type: ${sampleEntity.type}`);
      console.log(`  Properties: ${sampleEntity.properties.length}`);
      console.log('');
    }

    console.log('Sample Component (Service):');
    const sampleService = result.component_specs.find(c => c.layer === 'service');
    if (sampleService) {
      console.log(`  Name: ${sampleService.name}`);
      console.log(`  Type: ${sampleService.type}`);
      console.log(`  Methods: ${sampleService.methods.length}`);
      sampleService.methods.forEach(method => {
        console.log(`    - ${method.name}()`);
      });
      console.log('');
    }

    console.log(`📄 Component structure written to:`);
    console.log(`   ${outputFile}\n`);

    // Display file size
    if (fs.existsSync(outputFile)) {
      const stats = fs.statSync(outputFile);
      console.log(`File size: ${(stats.size / 1024).toFixed(2)} KB\n`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }

  console.log('✅ Test completed\n');
}

testDesignComponentStructure();
