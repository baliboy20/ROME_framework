/**
 * Claude Code Skill: list-skills
 * Lists available ROME skills with filtering and search capabilities
 *
 * Wraps the ROME Skills Framework list-skills tier-1 skill
 */

const path = require('path');

// Path to ROME skills framework
const ROME_SKILLS_PATH = path.join(__dirname, '../../../../skills');

module.exports = {
  name: 'list-skills',
  description: 'List available ROME skills with filtering and search capabilities',

  args: {
    'filter-category': {
      type: 'string',
      description: 'Filter by category (analysis, design, generation, etc.)',
      required: false
    },
    'filter-tier': {
      type: 'string',
      description: 'Filter by tier (1, 2, or 3)',
      required: false
    },
    'filter-phase': {
      type: 'string',
      description: 'Filter by phase (P1, P2, P3, P4, P5)',
      required: false
    },
    'search-query': {
      type: 'string',
      description: 'Search skills by keywords',
      required: false
    },
    'output-format': {
      type: 'string',
      description: 'Output format: summary (default), detailed, json, markdown',
      required: false,
      default: 'summary'
    }
  },

  async execute(args) {
    try {
      // Load the ROME SkillInvoker
      const { invokeSkill } = require(path.join(ROME_SKILLS_PATH, 'lib/SkillInvoker.js'));

      // Convert kebab-case args to snake_case for ROME skills
      const params = {
        filter_category: args['filter-category'],
        filter_tier: args['filter-tier'],
        filter_phase: args['filter-phase'],
        search_query: args['search-query'],
        output_format: args['output-format'] || 'summary'
      };

      // Remove undefined values
      Object.keys(params).forEach(key => {
        if (params[key] === undefined) {
          delete params[key];
        }
      });

      // Invoke the ROME skill
      const result = await invokeSkill('list-skills', params);

      // Format output for Claude Code
      return this.formatOutput(result);

    } catch (error) {
      return {
        error: true,
        message: `Failed to execute list-skills: ${error.message}`,
        details: error.stack
      };
    }
  },

  formatOutput(result) {
    const { skills_found, total_count, filters_applied } = result;

    let output = `\n### ROME Skills - ${total_count} skill(s) found\n\n`;

    // Show applied filters
    const activeFilters = [];
    if (filters_applied.category !== 'none') activeFilters.push(`Category: ${filters_applied.category}`);
    if (filters_applied.tier !== 'none') activeFilters.push(`Tier: ${filters_applied.tier}`);
    if (filters_applied.phase !== 'none') activeFilters.push(`Phase: ${filters_applied.phase}`);
    if (filters_applied.search !== 'none') activeFilters.push(`Search: "${filters_applied.search}"`);

    if (activeFilters.length > 0) {
      output += `**Filters:** ${activeFilters.join(', ')}\n\n`;
    }

    // Display skills
    if (Array.isArray(skills_found) && skills_found.length > 0) {
      // Group by phase if no phase filter applied
      if (filters_applied.phase === 'none') {
        const byPhase = skills_found.reduce((acc, skill) => {
          const phase = skill.phase || 'unknown';
          if (!acc[phase]) acc[phase] = [];
          acc[phase].push(skill);
          return acc;
        }, {});

        const phaseOrder = ['P1', 'P2', 'P3', 'P4', 'P5', 'unknown'];
        for (const phase of phaseOrder) {
          if (byPhase[phase]) {
            output += `#### ${phase} Skills (${byPhase[phase].length})\n\n`;
            for (const skill of byPhase[phase]) {
              output += this.formatSkillLine(skill);
            }
            output += '\n';
          }
        }
      } else {
        // Just list skills
        for (const skill of skills_found) {
          output += this.formatSkillLine(skill);
        }
      }
    } else {
      output += '*No skills match your filters.*\n';
    }

    output += `\n**Total:** ${total_count} skill(s)\n`;

    return {
      success: true,
      output,
      data: result
    };
  },

  formatSkillLine(skill) {
    let line = `- **/${skill.name}**`;
    if (skill.tier) line += ` (T${skill.tier})`;
    if (skill.category) line += ` [${skill.category}]`;
    if (skill.relevance_score !== undefined) line += ` - Score: ${skill.relevance_score}`;
    if (skill.description) line += `\n  ${skill.description}`;
    line += '\n';
    return line;
  }
};
