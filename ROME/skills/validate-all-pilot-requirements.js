/**
 * Validate all 25 pilot project requirements
 */

const { invokeSkill } = require('./lib/SkillInvoker');
const path = require('path');
const fs = require('fs');

async function validateAllRequirements() {
  console.log('Validating All 25 Pilot Project Requirements');
  console.log('=============================================\n');

  const requirementsDir = path.join(__dirname, '../../ROME_architect/ARTIFACTS/01-requirements');
  const results = [];

  // Validate REQ-001 through REQ-025
  for (let i = 1; i <= 25; i++) {
    const reqId = `REQ-${String(i).padStart(3, '0')}`;
    const requirementFile = path.join(requirementsDir, `${reqId}.yaml`);

    if (!fs.existsSync(requirementFile)) {
      console.log(`⚠️  ${reqId}: File not found`);
      continue;
    }

    try {
      const result = await invokeSkill('validate-aordl', {
        requirement_file: requirementFile,
        mode: 'STRICT'
      });

      results.push({
        id: reqId,
        status: result.status,
        violations: result.violations.length,
        warnings: result.warnings.length,
        details: result
      });

      const icon = result.status === 'PASS' ? '✅' : '❌';
      const violationText = result.violations.length > 0 ? ` (${result.violations.length} violations)` : '';
      console.log(`${icon} ${reqId}: ${result.status}${violationText}`);

      // Show violations if any
      if (result.violations.length > 0) {
        result.violations.forEach(v => {
          console.log(`   └─ [${v.severity}] ${v.field}: ${v.violation}`);
        });
      }

    } catch (error) {
      console.log(`❌ ${reqId}: ERROR - ${error.message}`);
      results.push({
        id: reqId,
        status: 'ERROR',
        error: error.message
      });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('Validation Summary');
  console.log('='.repeat(50));

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const errors = results.filter(r => r.status === 'ERROR').length;

  console.log(`Total Requirements: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Errors: ${errors}`);

  const passRate = results.length > 0 ? (passed / results.length * 100).toFixed(1) : 0;
  console.log(`\nPass Rate: ${passRate}%`);

  if (passed === 25) {
    console.log('\n🎉 All 25 pilot project requirements pass STRICT mode validation!');
  } else {
    console.log('\n⚠️  Some requirements need fixing before pilot can proceed.');
  }

  // Write detailed report
  const reportPath = path.join(requirementsDir, 'validation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      total: results.length,
      passed,
      failed,
      errors,
      passRate: `${passRate}%`
    },
    results
  }, null, 2));

  console.log(`\n📄 Detailed report: ${reportPath}`);
}

validateAllRequirements().catch(console.error);
