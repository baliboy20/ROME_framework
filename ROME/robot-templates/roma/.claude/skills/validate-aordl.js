/**
 * Claude Code Skill: validate-aordl
 * Validates AORDL requirements for completeness and anti-patterns (P1)
 *
 * Wraps the ROME Skills Framework validate-aordl tier-1 skill
 */

const path = require('path');

// Path to ROME skills framework
const ROME_SKILLS_PATH = path.join(__dirname, '../../../../skills');

module.exports = {
  name: 'validate-aordl',
  description: 'Validates AORDL requirements for completeness and anti-patterns',

  args: {
    'aordl-file': {
      type: 'string',
      description: 'Path to AORDL YAML file',
      required: true
    },
    'check-anti-patterns': {
      type: 'boolean',
      description: 'Check for anti-patterns (default: true)',
      required: false,
      default: true
    },
    'strict-mode': {
      type: 'boolean',
      description: 'Strict validation mode (default: false)',
      required: false,
      default: false
    }
  },

  async execute(args) {
    try {
      // Load the ROME SkillInvoker
      const { invokeSkill } = require(path.join(ROME_SKILLS_PATH, 'lib/SkillInvoker.js'));

      // Convert kebab-case args to snake_case for ROME skills
      const params = {
        aordl_file: args['aordl-file'],
        check_anti_patterns: args['check-anti-patterns'] !== false,
        strict_mode: args['strict-mode'] || false
      };

      // Invoke the ROME skill
      const result = await invokeSkill('validate-aordl', params);

      // Format output for Claude Code
      return this.formatOutput(result);

    } catch (error) {
      return {
        error: true,
        message: `Failed to execute validate-aordl: ${error.message}`,
        details: error.stack
      };
    }
  },

  formatOutput(result) {
    const { is_valid, validation_results, anti_patterns, summary } = result;

    let output = `\n### AORDL Validation Results\n\n`;

    // Overall status
    output += `**Status:** ${is_valid ? '✅ VALID' : '❌ INVALID'}\n\n`;

    // Summary
    if (summary) {
      output += `**Summary:**\n`;
      output += `- Total fields: ${summary.total_fields || 0}\n`;
      output += `- Valid: ${summary.valid_fields || 0}\n`;
      output += `- Invalid: ${summary.invalid_fields || 0}\n`;
      output += `- Missing: ${summary.missing_fields || 0}\n\n`;
    }

    // Validation results
    if (validation_results && validation_results.length > 0) {
      const errors = validation_results.filter(r => !r.valid);
      const warnings = validation_results.filter(r => r.valid && r.warnings);

      if (errors.length > 0) {
        output += `#### ❌ Errors (${errors.length})\n\n`;
        for (const error of errors) {
          output += `- **${error.field}:** ${error.message}\n`;
          if (error.details) output += `  ${error.details}\n`;
        }
        output += '\n';
      }

      if (warnings.length > 0) {
        output += `#### ⚠️ Warnings (${warnings.length})\n\n`;
        for (const warning of warnings) {
          if (warning.warnings) {
            output += `- **${warning.field}:** ${warning.warnings.join(', ')}\n`;
          }
        }
        output += '\n';
      }
    }

    // Anti-patterns
    if (anti_patterns && anti_patterns.length > 0) {
      output += `#### 🚫 Anti-Patterns Detected (${anti_patterns.length})\n\n`;
      for (const antiPattern of anti_patterns) {
        output += `- **${antiPattern.type}:** ${antiPattern.description}\n`;
        if (antiPattern.field) output += `  Field: ${antiPattern.field}\n`;
        if (antiPattern.recommendation) output += `  💡 ${antiPattern.recommendation}\n`;
      }
      output += '\n';
    }

    if (is_valid) {
      output += '✅ AORDL requirements are valid and ready for P2 analysis.\n';
    } else {
      output += '❌ Please fix the errors above before proceeding to P2.\n';
    }

    return {
      success: true,
      is_valid,
      output,
      data: result
    };
  }
};
