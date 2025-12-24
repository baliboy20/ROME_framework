/**
 * /list-skills skill (Tier 1)
 * Lists available skills with filtering and search capabilities
 * Version: 1.0.0
 */

const { skillRegistry } = require('../lib/SkillRegistry');

class ListSkills {
  static async execute(params, executionId) {
    const {
      filter_category,
      filter_tier,
      filter_phase,
      search_query,
      output_format = 'summary'
    } = params;

    // Start with all skills
    let skills = skillRegistry.getAllSkills();

    // Apply filters
    if (filter_category) {
      skills = skills.filter(s => s.category === filter_category);
    }

    if (filter_tier) {
      skills = skills.filter(s => s.tier === parseInt(filter_tier));
    }

    if (filter_phase) {
      skills = skills.filter(s => s.phase === filter_phase);
    }

    // Apply search if provided
    if (search_query) {
      const searchResults = skillRegistry.searchSkills(search_query);
      const searchNames = new Set(searchResults.map(s => s.name));
      skills = skills.filter(s => searchNames.has(s.name));

      // Preserve relevance scores from search
      const scoreMap = new Map(searchResults.map(s => [s.name, s.relevance_score]));
      skills = skills.map(s => ({
        ...s,
        relevance_score: scoreMap.get(s.name) || 0
      }));

      // Sort by relevance
      skills.sort((a, b) => b.relevance_score - a.relevance_score);
    } else {
      // Sort by phase and tier
      skills.sort((a, b) => {
        const phaseOrder = { P1: 1, P2: 2, P3: 3, P4: 4, P5: 5, unknown: 6 };
        const phaseCompare = (phaseOrder[a.phase] || 6) - (phaseOrder[b.phase] || 6);
        if (phaseCompare !== 0) return phaseCompare;
        return a.tier - b.tier;
      });
    }

    // Format output
    const output = this.formatOutput(skills, output_format);

    return {
      skills_found: output,
      total_count: skills.length,
      filters_applied: {
        category: filter_category || 'none',
        tier: filter_tier || 'none',
        phase: filter_phase || 'none',
        search: search_query || 'none'
      }
    };
  }

  /**
   * Format skills output based on requested format
   */
  static formatOutput(skills, format) {
    switch (format) {
      case 'summary':
        return this.formatSummary(skills);
      case 'detailed':
        return this.formatDetailed(skills);
      case 'json':
        return skills;
      case 'markdown':
        return this.formatMarkdown(skills);
      default:
        return this.formatSummary(skills);
    }
  }

  /**
   * Format as summary list
   */
  static formatSummary(skills) {
    return skills.map(skill => ({
      name: skill.name,
      tier: skill.tier,
      phase: skill.phase,
      category: skill.category,
      description: skill.description.substring(0, 80) + (skill.description.length > 80 ? '...' : '')
    }));
  }

  /**
   * Format as detailed list
   */
  static formatDetailed(skills) {
    return skills.map(skill => ({
      name: skill.name,
      tier: skill.tier,
      phase: skill.phase,
      category: skill.category,
      version: skill.version,
      description: skill.description,
      parameters: {
        required: skill.manifest.parameters?.required?.map(p => p.name || p) || [],
        optional: skill.manifest.parameters?.optional?.map(p => p.name || p) || []
      },
      keywords: skill.keywords
    }));
  }

  /**
   * Format as markdown documentation
   */
  static formatMarkdown(skills) {
    let md = '# Skills List\n\n';
    md += `**Total Skills:** ${skills.length}\n\n`;

    // Group by phase
    const byPhase = {};
    skills.forEach(skill => {
      if (!byPhase[skill.phase]) {
        byPhase[skill.phase] = [];
      }
      byPhase[skill.phase].push(skill);
    });

    for (const [phase, phaseSkills] of Object.entries(byPhase).sort()) {
      md += `## ${phase}\n\n`;

      // Group by tier
      const byTier = {};
      phaseSkills.forEach(skill => {
        if (!byTier[skill.tier]) {
          byTier[skill.tier] = [];
        }
        byTier[skill.tier].push(skill);
      });

      for (const [tier, tierSkills] of Object.entries(byTier).sort()) {
        md += `### Tier ${tier}\n\n`;

        tierSkills.forEach(skill => {
          md += `- **/${skill.name}** (${skill.category})\n`;
          md += `  - ${skill.description}\n\n`;
        });
      }
    }

    return md;
  }
}

module.exports = ListSkills;
