/**
 * Claude Code Skill: recommend-skills
 * Recommends ROME skills based on task description and context
 *
 * Wraps the ROME Skills Framework recommend-skills tier-2 skill
 */

const path = require('path');

// Path to ROME skills framework
const ROME_SKILLS_PATH = path.join(__dirname, '../../../../skills');

module.exports = {
  name: 'recommend-skills',
  description: 'Recommends ROME skills based on task description and context',

  args: {
    'task-description': {
      type: 'string',
      description: 'Description of the task you want to accomplish',
      required: true
    },
    'current-phase': {
      type: 'string',
      description: 'Current phase (P1, P2, P3, P4, P5)',
      required: false
    },
    'artifacts-available': {
      type: 'string',
      description: 'Comma-separated list of available artifacts',
      required: false
    },
    'max-recommendations': {
      type: 'number',
      description: 'Maximum number of recommendations to return (default: 5)',
      required: false,
      default: 5
    }
  },

  async execute(args) {
    try {
      // Load the ROME SkillInvoker
      const { invokeSkill } = require(path.join(ROME_SKILLS_PATH, 'lib/SkillInvoker.js'));

      // Convert kebab-case args to snake_case for ROME skills
      const params = {
        task_description: args['task-description'],
        current_phase: args['current-phase'],
        max_recommendations: parseInt(args['max-recommendations'] || 5, 10)
      };

      // Parse artifacts if provided
      if (args['artifacts-available']) {
        params.artifacts_available = args['artifacts-available']
          .split(',')
          .map(a => a.trim())
          .filter(a => a.length > 0);
      }

      // Remove undefined values
      Object.keys(params).forEach(key => {
        if (params[key] === undefined) {
          delete params[key];
        }
      });

      // Invoke the ROME skill
      const result = await invokeSkill('recommend-skills', params);

      // Format output for Claude Code
      return this.formatOutput(result, args['task-description']);

    } catch (error) {
      return {
        error: true,
        message: `Failed to execute recommend-skills: ${error.message}`,
        details: error.stack
      };
    }
  },

  formatOutput(result, taskDescription) {
    const { recommendations, total_analyzed, keywords_extracted, context } = result;

    let output = `\n### Skill Recommendations\n\n`;
    output += `**Task:** ${taskDescription}\n\n`;

    if (keywords_extracted && keywords_extracted.length > 0) {
      output += `**Keywords:** ${keywords_extracted.join(', ')}\n\n`;
    }

    if (context && context.phase) {
      output += `**Phase:** ${context.phase}\n\n`;
    }

    output += `**Analyzed:** ${total_analyzed} skills\n\n`;

    if (recommendations && recommendations.length > 0) {
      output += `#### Top Recommendations\n\n`;

      for (let i = 0; i < recommendations.length; i++) {
        const rec = recommendations[i];
        output += `${i + 1}. **/${rec.skill_name}** (Score: ${rec.relevance_score}/150)\n`;
        if (rec.tier) output += `   - Tier: ${rec.tier}\n`;
        if (rec.category) output += `   - Category: ${rec.category}\n`;
        if (rec.description) output += `   - ${rec.description}\n`;
        if (rec.match_reason) output += `   - Match: ${rec.match_reason}\n`;
        output += '\n';
      }
    } else {
      output += '*No skill recommendations found for this task.*\n';
    }

    output += '\nUse `/explain-skill <skill-name>` to learn more about a specific skill.\n';

    return {
      success: true,
      output,
      data: result
    };
  }
};
