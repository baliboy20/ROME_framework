/**
 * Test script for /validate-aordl skill
 */

const { invokeSkill } = require('./lib/SkillInvoker');
const path = require('path');

async function testValidateAORDL() {
  console.log('Testing /validate-aordl skill...\n');

  // Test with REQ-001.yaml
  const requirementFile = path.join(__dirname, '../../ROME_architect/ARTIFACTS/01-requirements/REQ-001.yaml');

  try {
    const result = await invokeSkill('validate-aordl', {
      requirement_file: requirementFile,
      mode: 'STRICT'
    });

    console.log('Validation Result:');
    console.log('==================');
    console.log(`Status: ${result.status}`);
    console.log(`Requirement ID: ${result.requirement_id}`);
    console.log(`\nViolations: ${result.violations.length}`);

    if (result.violations.length > 0) {
      console.log('\nViolation Details:');
      result.violations.forEach((v, i) => {
        console.log(`${i + 1}. [${v.severity}] ${v.field}: ${v.violation}`);
      });
    }

    console.log(`\nWarnings: ${result.warnings.length}`);

    if (result.warnings.length > 0) {
      console.log('\nWarning Details:');
      result.warnings.forEach((w, i) => {
        console.log(`${i + 1}. [${w.severity}] ${w.field}: ${w.violation}`);
      });
    }

    console.log('\n✅ Test completed successfully');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

testValidateAORDL();
