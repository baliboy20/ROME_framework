/**
 * Test script for /optimize-data-model skill (Tier 3)
 */

const { invokeSkill } = require('./lib/SkillInvoker');
const path = require('path');
const fs = require('fs');

async function testOptimizeDataModel() {
  console.log('Testing /optimize-data-model skill (Tier 3)...\n');

  const dataDictFile = path.join(
    __dirname,
    '../../ROME_architect/ARTIFACTS/02-analysis/data-dictionary.json'
  );

  const outputFile = path.join(
    __dirname,
    '../../ROME_architect/ARTIFACTS/OPTIMIZATION-REPORT.json'
  );

  console.log('='.repeat(70));
  console.log('Optimizing Data Model');
  console.log('='.repeat(70));
  console.log('');

  try {
    const result = await invokeSkill('optimize-data-model', {
      data_dictionary_file: dataDictFile,
      output_file: outputFile,
      check_normalization: true,
      check_naming: true,
      suggest_consolidation: true
    });

    console.log('\n' + '='.repeat(70));
    console.log('Optimization Results');
    console.log('='.repeat(70));
    console.log('');

    console.log(`🔧 Optimization Status: ${result.optimization_status}`);
    console.log(`   Checks Run: ${result.checks_run}`);
    console.log(`   Issues Found: ${result.issues_found.length}`);
    console.log(`   Recommendations: ${result.recommendations.length}\n`);

    // Display metrics
    console.log('📊 Data Model Metrics:');
    console.log(`   Entities: ${result.metrics.total_entities} (${result.metrics.primary_entities} primary)`);
    console.log(`   Relationships: ${result.metrics.total_relationships}`);
    console.log(`   Total Attributes: ${result.metrics.total_attributes}`);
    console.log(`   Avg Attributes/Entity: ${result.metrics.avg_attributes_per_entity}`);
    console.log(`   Relationship/Entity Ratio: ${result.metrics.relationship_to_entity_ratio}`);
    console.log(`   Optimization Score: ${result.metrics.optimization_score}/100\n`);

    // Display issues by severity
    const critical = result.issues_found.filter(i => i.severity === 'CRITICAL');
    const warnings = result.issues_found.filter(i => i.severity === 'WARNING');
    const info = result.issues_found.filter(i => i.severity === 'INFO');

    if (critical.length > 0) {
      console.log(`🔴 Critical Issues (${critical.length}):`);
      critical.forEach(issue => {
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

    if (info.length > 0) {
      console.log(`ℹ️  Info (${info.length}):`);
      info.forEach(issue => {
        console.log(`   [${issue.check}] ${issue.message}`);
      });
      console.log('');
    }

    if (result.recommendations.length > 0) {
      console.log(`💡 Recommendations (${result.recommendations.length}):`);
      result.recommendations.slice(0, 10).forEach(rec => {
        console.log(`   [${rec.check}] ${rec.message}`);
      });
      if (result.recommendations.length > 10) {
        console.log(`   ... and ${result.recommendations.length - 10} more`);
      }
      console.log('');
    }

    if (result.optimization_status === 'OPTIMIZED') {
      console.log('✅ Data model is well optimized!\n');
    } else if (result.optimization_status === 'NEEDS_WORK') {
      console.log('⚠️  Data model needs optimization work\n');
    } else {
      console.log('🔴 Data model has critical optimization issues\n');
    }

    console.log(`📄 Optimization report written to:`);
    console.log(`   ${outputFile}\n`);

    // Display report preview
    if (fs.existsSync(outputFile)) {
      const report = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
      console.log('Optimization Report Preview:');
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

testOptimizeDataModel();
