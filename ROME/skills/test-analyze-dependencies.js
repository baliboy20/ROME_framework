/**
 * Test script for /analyze-dependencies skill (Tier 3)
 */

const { invokeSkill } = require('./lib/SkillInvoker');
const path = require('path');
const fs = require('fs');

async function testAnalyzeDependencies() {
  console.log('Testing /analyze-dependencies skill (Tier 3)...\n');

  const requirementsDir = path.join(
    __dirname,
    '../../ROME_architect/ARTIFACTS/01-requirements'
  );

  const outputFile = path.join(
    __dirname,
    '../../ROME_architect/ARTIFACTS/DEPENDENCY-ANALYSIS.json'
  );

  console.log('='.repeat(70));
  console.log('Analyzing Requirement Dependencies');
  console.log('='.repeat(70));
  console.log('');

  try {
    const result = await invokeSkill('analyze-dependencies', {
      requirements_directory: requirementsDir,
      output_file: outputFile,
      detect_circular: true,
      suggest_order: true
    });

    console.log('\n' + '='.repeat(70));
    console.log('Dependency Analysis Results');
    console.log('='.repeat(70));
    console.log('');

    console.log(`🔗 Dependency Status: ${result.dependency_status}`);
    console.log(`   Total Requirements: ${result.total_requirements}`);
    console.log(`   Total Dependencies: ${result.total_dependencies}`);
    console.log(`   Circular Dependencies: ${result.circular_dependencies.length}`);
    console.log('');

    if (result.circular_dependencies.length > 0) {
      console.log(`⚠️  Circular Dependencies Detected (${result.circular_dependencies.length}):`);
      result.circular_dependencies.forEach((cycle, idx) => {
        console.log(`   ${idx + 1}. ${cycle.join(' -> ')}`);
      });
      console.log('');
    } else {
      console.log('✅ No circular dependencies detected\n');
    }

    if (result.implementation_order.length > 0) {
      console.log(`📋 Implementation Order (first 15 of ${result.implementation_order.length}):`);
      result.implementation_order.slice(0, 15).forEach((req, idx) => {
        const node = result.dependency_graph[req];
        const depCount = node ? node.dependencies.length : 0;
        console.log(`   ${String(idx + 1).padStart(2)}. ${req} (${depCount} deps)`);
      });
      if (result.implementation_order.length > 15) {
        console.log(`   ... and ${result.implementation_order.length - 15} more`);
      }
      console.log('');
    }

    // Display some dependency statistics
    const graph = result.dependency_graph;
    const reqsWithDeps = Object.keys(graph).filter(r => graph[r].dependencies.length > 0);
    const reqsWithDependents = Object.keys(graph).filter(r => graph[r].dependents.length > 0);

    console.log('📊 Dependency Statistics:');
    console.log(`   Requirements with dependencies: ${reqsWithDeps.length}`);
    console.log(`   Requirements with dependents: ${reqsWithDependents.length}`);
    console.log(`   Foundation requirements: ${result.total_requirements - reqsWithDeps.length}`);
    console.log('');

    // Find most dependent requirement
    let maxDeps = 0;
    let mostDependentReq = null;
    Object.keys(graph).forEach(req => {
      if (graph[req].dependencies.length > maxDeps) {
        maxDeps = graph[req].dependencies.length;
        mostDependentReq = req;
      }
    });

    if (mostDependentReq) {
      console.log(`🔝 Most Dependent Requirement: ${mostDependentReq} (${maxDeps} dependencies)`);
      console.log('');
    }

    console.log(`📄 Dependency analysis written to:`);
    console.log(`   ${outputFile}\n`);

    // Display report preview
    if (fs.existsSync(outputFile)) {
      const report = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
      console.log('Dependency Report Preview:');
      console.log('='.repeat(70));
      console.log(`Status: ${report.dependency_status}`);
      console.log(`Requirements: ${report.total_requirements}`);
      console.log(`Dependencies: ${report.total_dependencies} (${report.explicit_dependencies} explicit, ${report.implicit_dependencies} implicit)`);
      console.log(`Circular: ${report.circular_dependencies.length}`);
      console.log(`Orphans: ${report.orphan_requirements.length}`);
      console.log(`Critical Path: ${report.critical_path.length} requirements`);
      console.log('');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }

  console.log('✅ Test completed\n');
}

testAnalyzeDependencies();
