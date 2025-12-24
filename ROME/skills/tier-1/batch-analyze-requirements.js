/**
 * /batch-analyze-requirements skill
 *
 * Batch analyzes all AORDL requirements in a directory.
 *
 * For each requirement:
 * - Runs /analyze-requirement
 * - Generates analysis report
 * - Collects statistics
 *
 * Generates aggregate summary:
 * - Total requirements analyzed
 * - Validation pass/fail rates
 * - Complexity distribution
 * - Common issues
 *
 * Version: 1.0.0
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

class BatchAnalyzeRequirements {
  static async execute(params, executionId) {
    const {
      requirements_directory,
      output_directory = null,
      output_format = 'json',
      generate_summary = true
    } = params;

    try {
      // Lazy load invokeSkill
      const { invokeSkill } = require('../lib/SkillInvoker');

      // Find all requirement files
      const requirementFiles = this.findRequirementFiles(requirements_directory);

      console.log(`Found ${requirementFiles.length} requirements to analyze\n`);

      // Analyze each requirement
      const analyses = [];
      const failures = [];

      for (const reqFile of requirementFiles) {
        const reqId = path.basename(reqFile, '.yaml');

        try {
          console.log(`Analyzing ${reqId}...`);

          const outputFile = output_directory
            ? path.join(output_directory, `${reqId}-analysis.${output_format}`)
            : null;

          const analysis = await invokeSkill('analyze-requirement', {
            requirement_file: reqFile,
            output_file: outputFile,
            output_format,
            include_recommendations: true
          });

          analyses.push({
            requirement_id: analysis.requirement_id,
            validation_status: analysis.validation_status,
            complexity: analysis.complexity,
            entity_count: analysis.entities.length,
            invariant_count: analysis.invariants.length,
            recommendation_count: analysis.recommendations.length,
            api_endpoint: analysis.api_endpoint.full_endpoint
          });

        } catch (error) {
          console.error(`  ❌ Failed: ${error.message}`);
          failures.push({
            requirement_id: reqId,
            error: error.message
          });
        }
      }

      console.log(`\n✅ Completed ${analyses.length} of ${requirementFiles.length} analyses\n`);

      // Generate summary
      const summary = generate_summary
        ? this.generateSummary(analyses)
        : null;

      // Write summary file if output directory specified
      if (output_directory && summary) {
        const summaryPath = path.join(output_directory, `_summary.${output_format}`);
        this.writeSummaryFile(summaryPath, summary, output_format);
        console.log(`📊 Summary written to: ${summaryPath}\n`);
      }

      return {
        analyses,
        summary,
        failed_count: failures.length,
        failures
      };

    } catch (error) {
      throw new Error(`Batch analysis failed: ${error.message}`);
    }
  }

  /**
   * Find all requirement files in directory
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
   * Generate aggregate summary
   */
  static generateSummary(analyses) {
    const summary = {
      total_requirements: analyses.length,
      validation: {
        pass: 0,
        fail: 0,
        pass_rate: 0
      },
      complexity: {
        LOW: 0,
        MEDIUM: 0,
        HIGH: 0,
        VERY_HIGH: 0,
        average_score: 0
      },
      entities: {
        total: 0,
        average_per_requirement: 0
      },
      invariants: {
        total: 0,
        average_per_requirement: 0
      },
      recommendations: {
        total: 0,
        average_per_requirement: 0
      },
      api_endpoints: []
    };

    let totalComplexityScore = 0;
    let totalEntities = 0;
    let totalInvariants = 0;
    let totalRecommendations = 0;

    analyses.forEach(analysis => {
      // Validation
      if (analysis.validation_status === 'PASS') {
        summary.validation.pass++;
      } else {
        summary.validation.fail++;
      }

      // Complexity
      const complexityLevel = analysis.complexity.level;
      summary.complexity[complexityLevel]++;
      totalComplexityScore += analysis.complexity.total_score;

      // Entities
      totalEntities += analysis.entity_count;

      // Invariants
      totalInvariants += analysis.invariant_count;

      // Recommendations
      totalRecommendations += analysis.recommendation_count;

      // API endpoints
      summary.api_endpoints.push({
        requirement_id: analysis.requirement_id,
        endpoint: analysis.api_endpoint
      });
    });

    // Calculate averages
    summary.validation.pass_rate = summary.total_requirements > 0
      ? Math.round((summary.validation.pass / summary.total_requirements) * 100)
      : 0;

    summary.complexity.average_score = summary.total_requirements > 0
      ? Math.round(totalComplexityScore / summary.total_requirements)
      : 0;

    summary.entities.total = totalEntities;
    summary.entities.average_per_requirement = summary.total_requirements > 0
      ? (totalEntities / summary.total_requirements).toFixed(1)
      : 0;

    summary.invariants.total = totalInvariants;
    summary.invariants.average_per_requirement = summary.total_requirements > 0
      ? (totalInvariants / summary.total_requirements).toFixed(1)
      : 0;

    summary.recommendations.total = totalRecommendations;
    summary.recommendations.average_per_requirement = summary.total_requirements > 0
      ? (totalRecommendations / summary.total_requirements).toFixed(1)
      : 0;

    return summary;
  }

  /**
   * Write summary file
   */
  static writeSummaryFile(filePath, summary, format) {
    let content;

    if (format === 'yaml') {
      content = yaml.dump(summary);
    } else if (format === 'markdown') {
      content = this.formatSummaryAsMarkdown(summary);
    } else {
      content = JSON.stringify(summary, null, 2);
    }

    fs.writeFileSync(filePath, content);
  }

  /**
   * Format summary as Markdown
   */
  static formatSummaryAsMarkdown(summary) {
    let md = '# Requirements Analysis Summary\n\n';

    md += `**Total Requirements:** ${summary.total_requirements}\n\n`;

    md += '---\n\n';
    md += '## Validation\n\n';
    md += `- **Pass:** ${summary.validation.pass} (${summary.validation.pass_rate}%)\n`;
    md += `- **Fail:** ${summary.validation.fail}\n\n`;

    md += '---\n\n';
    md += '## Complexity Distribution\n\n';
    md += `- **Average Score:** ${summary.complexity.average_score}\n\n`;
    md += `| Level | Count |\n`;
    md += `|-------|-------|\n`;
    md += `| LOW | ${summary.complexity.LOW} |\n`;
    md += `| MEDIUM | ${summary.complexity.MEDIUM} |\n`;
    md += `| HIGH | ${summary.complexity.HIGH} |\n`;
    md += `| VERY_HIGH | ${summary.complexity.VERY_HIGH} |\n\n`;

    md += '---\n\n';
    md += '## Entities\n\n';
    md += `- **Total:** ${summary.entities.total}\n`;
    md += `- **Average per Requirement:** ${summary.entities.average_per_requirement}\n\n`;

    md += '---\n\n';
    md += '## Invariants\n\n';
    md += `- **Total:** ${summary.invariants.total}\n`;
    md += `- **Average per Requirement:** ${summary.invariants.average_per_requirement}\n\n`;

    md += '---\n\n';
    md += '## Recommendations\n\n';
    md += `- **Total:** ${summary.recommendations.total}\n`;
    md += `- **Average per Requirement:** ${summary.recommendations.average_per_requirement}\n\n`;

    md += '---\n\n';
    md += '## API Endpoints\n\n';
    summary.api_endpoints.forEach(ep => {
      md += `- **${ep.requirement_id}**: \`${ep.endpoint}\`\n`;
    });
    md += '\n';

    return md;
  }
}

module.exports = BatchAnalyzeRequirements;
