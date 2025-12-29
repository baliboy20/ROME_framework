/**
 * Claude Code Skill: explain-skill
 * Provides detailed explanation and usage examples for a ROME skill
 *
 * Wraps the ROME Skills Framework explain-skill tier-1 skill
 */

const path = require('path');

// Path to ROME skills framework
const ROME_SKILLS_PATH = path.join(__dirname, '../../../../skills');

module.exports = {
  name: 'explain-skill',
  description: 'Provides detailed explanation and usage examples for a ROME skill',

  args: {
    'skill-name': {
      type: 'string',
      description: 'Name of the skill to explain (with or without leading /)',
      required: true
    },
    'show-parameters': {
      type: 'boolean',
      description: 'Show detailed parameter information',
      required: false,
      default: true
    },
    'show-examples': {
      type: 'boolean',
      description: 'Show usage examples',
      required: false,
      default: true
    }
  },

  async execute(args) {
    try {
      // Load the ROME SkillInvoker
      const { invokeSkill } = require(path.join(ROME_SKILLS_PATH, 'lib/SkillInvoker.js'));

      // Convert kebab-case args to snake_case for ROME skills
      const params = {
        skill_name: args['skill-name'].replace(/^\//, ''), // Remove leading slash if present
        show_parameters: args['show-parameters'] !== false,
        show_examples: args['show-examples'] !== false
      };

      // Invoke the ROME skill
      const result = await invokeSkill('explain-skill', params);

      // Format output for Claude Code
      return this.formatOutput(result);

    } catch (error) {
      return {
        error: true,
        message: `Failed to execute explain-skill: ${error.message}`,
        details: error.stack
      };
    }
  },

  formatOutput(result) {
    const { skill_info } = result;

    if (!skill_info) {
      return {
        error: true,
        message: 'Skill not found'
      };
    }

    let output = `\n### /${skill_info.name}\n\n`;

    // Basic info
    if (skill_info.version) output += `**Version:** ${skill_info.version}\n`;
    if (skill_info.tier) output += `**Tier:** ${skill_info.tier}\n`;
    if (skill_info.category) output += `**Category:** ${skill_info.category}\n`;
    if (skill_info.phase) output += `**Phase:** ${skill_info.phase}\n`;
    output += '\n';

    // Description
    if (skill_info.description) {
      output += `**Description:**\n${skill_info.description}\n\n`;
    }

    // Parameters
    if (skill_info.parameters) {
      output += `#### Parameters\n\n`;

      if (skill_info.parameters.required && skill_info.parameters.required.length > 0) {
        output += `**Required:**\n`;
        for (const param of skill_info.parameters.required) {
          output += `- \`${param.name}\` (${param.type})`;
          if (param.description) output += `: ${param.description}`;
          output += '\n';
        }
        output += '\n';
      }

      if (skill_info.parameters.optional && skill_info.parameters.optional.length > 0) {
        output += `**Optional:**\n`;
        for (const param of skill_info.parameters.optional) {
          output += `- \`${param.name}\` (${param.type})`;
          if (param.default !== undefined) output += ` [default: ${param.default}]`;
          if (param.description) output += `: ${param.description}`;
          output += '\n';
        }
        output += '\n';
      }
    }

    // Output format
    if (skill_info.output) {
      output += `#### Output\n\n`;
      for (const [key, value] of Object.entries(skill_info.output)) {
        output += `- \`${key}\` (${value.type})`;
        if (value.description) output += `: ${value.description}`;
        output += '\n';
      }
      output += '\n';
    }

    // Examples
    if (skill_info.examples && skill_info.examples.length > 0) {
      output += `#### Examples\n\n`;
      for (const example of skill_info.examples) {
        if (example.description) {
          output += `**${example.description}:**\n`;
        }
        output += `\`\`\`bash\n${example.usage}\n\`\`\`\n\n`;
      }
    }

    // Execution info
    if (skill_info.execution) {
      output += `#### Execution\n\n`;
      if (skill_info.execution.timeout) {
        output += `- Timeout: ${skill_info.execution.timeout}ms\n`;
      }
      if (skill_info.execution.retry) {
        output += `- Retry: ${JSON.stringify(skill_info.execution.retry)}\n`;
      }
      output += '\n';
    }

    return {
      success: true,
      output,
      data: result
    };
  }
};
