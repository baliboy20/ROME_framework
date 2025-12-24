/**
 * /generate-test-plan skill (Tier 2)
 *
 * Generates master test plan from all AORDL requirements.
 *
 * Process:
 * 1. Scan requirements directory
 * 2. Generate test scenarios for each requirement using /generate-test-scenarios
 * 3. Aggregate all scenarios
 * 4. Group by priority (HIGH, MEDIUM, LOW)
 * 5. Generate traceability matrix
 * 6. Calculate coverage statistics
 * 7. Generate master test plan document
 *
 * Version: 1.0.0
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

class GenerateTestPlan {
  static async execute(params, executionId) {
    const {
      requirements_directory,
      output_file = null,
      output_format = 'markdown',
      include_traceability = true,
      group_by_priority = true
    } = params;

    try {
      // Lazy load invokeSkill
      const { invokeSkill } = require('../lib/SkillInvoker');

      // Find all requirement files
      const requirementFiles = this.findRequirementFiles(requirements_directory);

      console.log(`Generating master test plan from ${requirementFiles.length} requirements...\n`);

      // Generate test scenarios for each requirement
      const allScenarios = [];
      const scenariosByRequirement = [];

      for (const reqFile of requirementFiles) {
        const reqId = path.basename(reqFile, '.yaml');

        try {
          console.log(`  Processing ${reqId}...`);

          const result = await invokeSkill('generate-test-scenarios', {
            requirement_file: reqFile,
            include_negative_tests: true,
            include_edge_cases: true
          });

          // Tag scenarios with requirement ID
          const taggedScenarios = result.test_scenarios.map(scenario => ({
            ...scenario,
            requirement_id: reqId
          }));

          allScenarios.push(...taggedScenarios);

          scenariosByRequirement.push({
            requirement_id: reqId,
            scenario_count: result.test_scenarios.length,
            coverage: result.coverage
          });

        } catch (error) {
          console.warn(`  Warning: Failed to generate scenarios for ${reqId}: ${error.message}`);
        }
      }

      console.log(`\n✓ Generated ${allScenarios.length} test scenarios from ${scenariosByRequirement.length} requirements`);

      // Build test plan
      const testPlan = this.buildTestPlan(
        allScenarios,
        scenariosByRequirement,
        group_by_priority,
        include_traceability
      );

      // Calculate coverage summary
      const coverageSummary = this.calculateCoverageSummary(scenariosByRequirement);

      // Write output file if requested
      if (output_file) {
        this.writeTestPlan(output_file, testPlan, output_format);
      }

      console.log(`\n✓ Test plan generated:`);
      console.log(`  Total Scenarios: ${allScenarios.length}`);
      console.log(`  HIGH Priority: ${testPlan.by_priority?.HIGH?.length || 0}`);
      console.log(`  MEDIUM Priority: ${testPlan.by_priority?.MEDIUM?.length || 0}`);
      console.log(`  LOW Priority: ${testPlan.by_priority?.LOW?.length || 0}`);

      return {
        test_plan: testPlan,
        total_scenarios: allScenarios.length,
        coverage_summary: coverageSummary,
        output_file
      };

    } catch (error) {
      throw new Error(`Test plan generation failed: ${error.message}`);
    }
  }

  /**
   * Find all requirement files
   */
  static findRequirementFiles(directory) {
    const files = fs.readdirSync(directory);

    return files
      .filter(file => file.endsWith('.yaml') || file.endsWith('.yml'))
      .filter(file => file.match(/^REQ-\d{3}\.yaml$/))
      .map(file => path.join(directory, file))
      .sort();
  }

  /**
   * Build test plan structure
   */
  static buildTestPlan(allScenarios, scenariosByRequirement, groupByPriority, includeTraceability) {
    const testPlan = {
      metadata: {
        generated_at: new Date().toISOString(),
        total_scenarios: allScenarios.length,
        total_requirements: scenariosByRequirement.length
      },
      scenarios: allScenarios,
      by_type: this.groupByType(allScenarios),
      by_priority: groupByPriority ? this.groupByPriority(allScenarios) : null,
      by_requirement: scenariosByRequirement,
      traceability_matrix: includeTraceability ? this.buildTraceabilityMatrix(allScenarios) : null
    };

    return testPlan;
  }

  /**
   * Group scenarios by type
   */
  static groupByType(scenarios) {
    const grouped = {};

    scenarios.forEach(scenario => {
      if (!grouped[scenario.type]) {
        grouped[scenario.type] = [];
      }
      grouped[scenario.type].push(scenario);
    });

    return grouped;
  }

  /**
   * Group scenarios by priority
   */
  static groupByPriority(scenarios) {
    const grouped = {
      HIGH: [],
      MEDIUM: [],
      LOW: []
    };

    scenarios.forEach(scenario => {
      if (grouped[scenario.priority]) {
        grouped[scenario.priority].push(scenario);
      }
    });

    return grouped;
  }

  /**
   * Build traceability matrix (requirement → test scenarios)
   */
  static buildTraceabilityMatrix(scenarios) {
    const matrix = {};

    scenarios.forEach(scenario => {
      if (!matrix[scenario.requirement_id]) {
        matrix[scenario.requirement_id] = [];
      }

      matrix[scenario.requirement_id].push({
        id: scenario.id,
        name: scenario.name,
        type: scenario.type,
        priority: scenario.priority
      });
    });

    return matrix;
  }

  /**
   * Calculate coverage summary
   */
  static calculateCoverageSummary(scenariosByRequirement) {
    const summary = {
      total_requirements: scenariosByRequirement.length,
      total_scenarios: 0,
      avg_scenarios_per_requirement: 0,
      avg_coverage_percentage: 0
    };

    let totalCoverage = 0;

    scenariosByRequirement.forEach(req => {
      summary.total_scenarios += req.scenario_count;
      totalCoverage += req.coverage.coverage_percentage;
    });

    summary.avg_scenarios_per_requirement = summary.total_requirements > 0
      ? (summary.total_scenarios / summary.total_requirements).toFixed(1)
      : 0;

    summary.avg_coverage_percentage = summary.total_requirements > 0
      ? Math.round(totalCoverage / summary.total_requirements)
      : 0;

    return summary;
  }

  /**
   * Write test plan to file
   */
  static writeTestPlan(filePath, testPlan, format) {
    let content;

    if (format === 'yaml') {
      content = yaml.dump(testPlan);
    } else if (format === 'markdown') {
      content = this.formatAsMarkdown(testPlan);
    } else {
      content = JSON.stringify(testPlan, null, 2);
    }

    fs.writeFileSync(filePath, content);
  }

  /**
   * Format test plan as Markdown
   */
  static formatAsMarkdown(testPlan) {
    let md = '# Master Test Plan\n\n';
    md += `**Generated:** ${testPlan.metadata.generated_at}\n`;
    md += `**Total Requirements:** ${testPlan.metadata.total_requirements}\n`;
    md += `**Total Test Scenarios:** ${testPlan.metadata.total_scenarios}\n\n`;

    md += '---\n\n';
    md += '## Test Coverage by Requirement\n\n';
    md += '| Requirement | Scenarios | Coverage |\n';
    md += '|-------------|-----------|----------|\n';

    testPlan.by_requirement.forEach(req => {
      md += `| ${req.requirement_id} | ${req.scenario_count} | ${req.coverage.coverage_percentage}% |\n`;
    });
    md += '\n';

    md += '---\n\n';
    md += '## Test Scenarios by Priority\n\n';

    if (testPlan.by_priority) {
      ['HIGH', 'MEDIUM', 'LOW'].forEach(priority => {
        const scenarios = testPlan.by_priority[priority];
        if (scenarios && scenarios.length > 0) {
          md += `### ${priority} Priority (${scenarios.length} scenarios)\n\n`;

          scenarios.forEach(scenario => {
            md += `- **${scenario.id}** [${scenario.requirement_id}]: ${scenario.name}\n`;
          });

          md += '\n';
        }
      });
    }

    md += '---\n\n';
    md += '## Test Scenarios by Type\n\n';

    Object.entries(testPlan.by_type).forEach(([type, scenarios]) => {
      md += `### ${type} (${scenarios.length} scenarios)\n\n`;
      scenarios.slice(0, 5).forEach(scenario => {
        md += `- **${scenario.id}** [${scenario.requirement_id}]: ${scenario.name}\n`;
      });
      if (scenarios.length > 5) {
        md += `- ... and ${scenarios.length - 5} more\n`;
      }
      md += '\n';
    });

    if (testPlan.traceability_matrix) {
      md += '---\n\n';
      md += '## Traceability Matrix\n\n';

      Object.entries(testPlan.traceability_matrix).slice(0, 10).forEach(([reqId, scenarios]) => {
        md += `### ${reqId} (${scenarios.length} tests)\n\n`;
        scenarios.forEach(scenario => {
          md += `- ${scenario.id}: ${scenario.name} [${scenario.type}] [${scenario.priority}]\n`;
        });
        md += '\n';
      });

      const totalReqs = Object.keys(testPlan.traceability_matrix).length;
      if (totalReqs > 10) {
        md += `*... and ${totalReqs - 10} more requirements*\n\n`;
      }
    }

    return md;
  }
}

module.exports = GenerateTestPlan;
