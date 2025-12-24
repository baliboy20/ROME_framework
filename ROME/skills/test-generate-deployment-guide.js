/**
 * Test script for /generate-deployment-guide skill (Tier 3)
 */

const { invokeSkill } = require('./lib/SkillInvoker');
const path = require('path');
const fs = require('fs');

async function testGenerateDeploymentGuide() {
  console.log('Testing /generate-deployment-guide skill (Tier 3)...\n');

  const artifactsDir = path.join(
    __dirname,
    '../../ROME_architect/ARTIFACTS'
  );

  const outputFile = path.join(artifactsDir, 'DEPLOYMENT-GUIDE.md');

  console.log('='.repeat(70));
  console.log('Generating Deployment Guide');
  console.log('='.repeat(70));
  console.log('');

  try {
    const result = await invokeSkill('generate-deployment-guide', {
      artifacts_directory: artifactsDir,
      output_file: outputFile,
      output_format: 'markdown',
      include_diagrams: true,
      deployment_target: 'cloud'
    });

    console.log('\n' + '='.repeat(70));
    console.log('Deployment Guide Generated');
    console.log('='.repeat(70));
    console.log('');

    console.log(`📚 Guide File: ${result.guide_file}`);
    console.log(`   Sections Generated: ${result.sections_generated}`);
    console.log(`   Diagrams Included: ${result.diagram_count}`);
    console.log('');

    // Read and display preview
    if (fs.existsSync(outputFile)) {
      const guideContent = fs.readFileSync(outputFile, 'utf8');
      const lines = guideContent.split('\n');

      console.log('Guide Preview (first 50 lines):');
      console.log('='.repeat(70));
      console.log(lines.slice(0, 50).join('\n'));
      console.log('...');
      console.log('');
      console.log(`Total lines: ${lines.length}`);
      console.log(`Total size: ${(guideContent.length / 1024).toFixed(2)} KB`);
      console.log('');
    }

    console.log('✅ Deployment guide successfully generated!');
    console.log(`   Location: ${outputFile}\n`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }

  console.log('✅ Test completed\n');
}

testGenerateDeploymentGuide();
