/**
 * Test script for /validate-artifacts skill (Tier 3)
 */

const { invokeSkill } = require('./lib/SkillInvoker');
const path = require('path');
const fs = require('fs');

async function testValidateArtifacts() {
  console.log('Testing /validate-artifacts skill (Tier 3)...\n');

  const artifactsDir = path.join(
    __dirname,
    '../../ROME_architect/ARTIFACTS'
  );

  const outputFile = path.join(artifactsDir, 'VALIDATION-REPORT.json');

  console.log('='.repeat(70));
  console.log('Cross-Validating P2 Artifacts');
  console.log('='.repeat(70));
  console.log('');

  try {
    const result = await invokeSkill('validate-artifacts', {
      artifacts_directory: artifactsDir,
      output_file: outputFile,
      strict_mode: true,
      check_all: true
    });

    console.log('\n' + '='.repeat(70));
    console.log('Validation Results');
    console.log('='.repeat(70));
    console.log('');

    console.log(`🔍 Validation Status: ${result.validation_status}`);
    console.log(`   Checks Run: ${result.checks_run}`);
    console.log(`   Issues Found: ${result.issues_found.length}`);
    console.log(`   Recommendations: ${result.recommendations.length}\n`);

    // Display issues by severity
    const errors = result.issues_found.filter(i => i.severity === 'ERROR');
    const warnings = result.issues_found.filter(i => i.severity === 'WARNING');

    if (errors.length > 0) {
      console.log(`❌ Errors (${errors.length}):`);
      errors.forEach(issue => {
        console.log(`   [${issue.check}] ${issue.message}`);
      });
      console.log('');
    }

    if (warnings.length > 0) {
      console.log(`⚠️  Warnings (${warnings.length}):`);
      warnings.forEach(issue => {
        console.log(`   [${issue.check}] ${issue.message}`);
      });
      console.log('');
    }

    if (result.recommendations.length > 0) {
      console.log(`💡 Recommendations (${result.recommendations.length}):`);
      result.recommendations.forEach(rec => {
        console.log(`   [${rec.check}] ${rec.message}`);
      });
      console.log('');
    }

    if (result.validation_status === 'PASS') {
      console.log('✅ All validation checks passed!\n');
    } else {
      console.log('❌ Validation failed - review issues above\n');
    }

    console.log(`📄 Validation report written to:`);
    console.log(`   ${outputFile}\n`);

    // Display validation report preview
    if (fs.existsSync(outputFile)) {
      const report = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
      console.log('Validation Report Preview:');
      console.log('='.repeat(70));
      console.log(JSON.stringify(report.summary, null, 2));
      console.log('');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }

  console.log('✅ Test completed\n');
}

testValidateArtifacts();
