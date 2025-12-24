/**
 * /explain-skill skill (Tier 1)
 * Provides detailed explanation and usage guidance for a specific skill
 * Version: 1.0.0
 */

const { skillRegistry } = require('../lib/SkillRegistry');

class ExplainSkill {
  static async execute(params, executionId) {
    const { skill_name } = params;

    // Normalize skill name
    const normalizedName = skill_name.replace(/^\//, '');

    // Get skill from registry
    const skill = skillRegistry.getSkill(normalizedName);

    if (!skill) {
      throw new Error(`Skill not found: ${skill_name}. Use /list-skills to see available skills.`);
    }

    // Build comprehensive explanation
    const explanation = {
      name: skill.name,
      full_name: `/${skill.name}`,
      version: skill.version,
      tier: skill.tier,
      tier_description: this.getTierDescription(skill.tier),
      phase: skill.phase,
      category: skill.category,
      description: skill.description,

      parameters: this.explainParameters(skill.manifest.parameters),
      output: this.explainOutput(skill.manifest.output),
      examples: skill.manifest.examples || [],

      usage_guide: this.generateUsageGuide(skill),
      related_skills: this.findRelatedSkills(skill),
      when_to_use: this.generateWhenToUse(skill),
      tips: this.generateTips(skill)
    };

    return explanation;
  }

  /**
   * Get tier description
   */
  static getTierDescription(tier) {
    switch (tier) {
      case 1:
        return 'Atomic - Single focused operation';
      case 2:
        return 'Composition - Combines multiple operations';
      case 3:
        return 'Orchestration - Complete workflow automation';
      default:
        return 'Unknown tier';
    }
  }

  /**
   * Explain parameters with detailed information
   */
  static explainParameters(params) {
    if (!params) {
      return { required: [], optional: [] };
    }

    const explained = {
      required: [],
      optional: []
    };

    if (params.required) {
      explained.required = params.required.map(p => ({
        name: p.name || p,
        type: p.type || 'any',
        description: p.description || 'No description available',
        validation: p.validation || 'none',
        example: this.generateParamExample(p)
      }));
    }

    if (params.optional) {
      explained.optional = params.optional.map(p => ({
        name: p.name || p,
        type: p.type || 'any',
        description: p.description || 'No description available',
        default: p.default !== undefined ? p.default : 'none',
        example: this.generateParamExample(p)
      }));
    }

    return explained;
  }

  /**
   * Generate example value for parameter
   */
  static generateParamExample(param) {
    const name = param.name || param;
    const type = param.type;

    if (param.default !== undefined) {
      return param.default;
    }

    // Generate sensible examples based on name and type
    if (name.includes('file') || name.includes('path')) {
      return '/path/to/file';
    }
    if (name.includes('directory') || name.includes('dir')) {
      return '/path/to/directory';
    }
    if (name.includes('output')) {
      return '/path/to/output.json';
    }
    if (type === 'array') {
      return ['item1', 'item2'];
    }
    if (type === 'boolean') {
      return true;
    }
    if (type === 'integer' || type === 'number') {
      return 100;
    }

    return 'example_value';
  }

  /**
   * Explain output format
   */
  static explainOutput(output) {
    if (!output) {
      return [];
    }

    return Object.entries(output).map(([key, value]) => ({
      field: key,
      type: value.type || 'any',
      description: value.description || 'No description available'
    }));
  }

  /**
   * Generate usage guide
   */
  static generateUsageGuide(skill) {
    const guide = [];

    guide.push(`**Basic Usage:**`);
    guide.push(`  /${skill.name}`);

    if (skill.manifest.parameters && skill.manifest.parameters.required && skill.manifest.parameters.required.length > 0) {
      guide.push('');
      guide.push('**With Required Parameters:**');
      const reqParams = skill.manifest.parameters.required
        .map(p => `--${(p.name || p).replace(/_/g, '-')} <value>`)
        .join(' ');
      guide.push(`  /${skill.name} ${reqParams}`);
    }

    if (skill.manifest.examples && skill.manifest.examples.length > 0) {
      guide.push('');
      guide.push('**Example:**');
      guide.push(`  ${skill.manifest.examples[0].usage}`);
    }

    return guide.join('\n');
  }

  /**
   * Find related skills
   */
  static findRelatedSkills(skill) {
    const allSkills = skillRegistry.getAllSkills();
    const related = [];

    // Same phase skills
    const samePhase = allSkills.filter(s =>
      s.name !== skill.name &&
      s.phase === skill.phase
    ).slice(0, 3);

    related.push(...samePhase.map(s => ({
      name: s.name,
      reason: `Same phase (${s.phase})`,
      description: s.description.substring(0, 80)
    })));

    // Same category skills
    const sameCategory = allSkills.filter(s =>
      s.name !== skill.name &&
      s.category === skill.category &&
      !related.find(r => r.name === s.name)
    ).slice(0, 2);

    related.push(...sameCategory.map(s => ({
      name: s.name,
      reason: `Same category (${s.category})`,
      description: s.description.substring(0, 80)
    })));

    return related.slice(0, 5);
  }

  /**
   * Generate "when to use" guidance
   */
  static generateWhenToUse(skill) {
    const guidance = [];

    // Based on tier
    if (skill.tier === 1) {
      guidance.push('Use this when you need a single, focused operation');
    } else if (skill.tier === 2) {
      guidance.push('Use this when you need multiple related operations combined');
    } else if (skill.tier === 3) {
      guidance.push('Use this when you need a complete automated workflow');
    }

    // Based on phase
    if (skill.phase === 'P1') {
      guidance.push('Use during AORDL requirements phase');
    } else if (skill.phase === 'P2') {
      guidance.push('Use during analysis phase to decompose requirements');
    } else if (skill.phase === 'P3') {
      guidance.push('Use during design phase to create architecture');
    } else if (skill.phase === 'P4') {
      guidance.push('Use during configuration phase to set up environments');
    } else if (skill.phase === 'P5') {
      guidance.push('Use during code generation phase to create implementation');
    }

    // Based on keywords
    if (skill.keywords.includes('validate')) {
      guidance.push('Use this to ensure data/code quality and correctness');
    }
    if (skill.keywords.includes('generate')) {
      guidance.push('Use this to automatically create artifacts or code');
    }
    if (skill.keywords.includes('analyze')) {
      guidance.push('Use this to extract insights from requirements or code');
    }

    return guidance;
  }

  /**
   * Generate usage tips
   */
  static generateTips(skill) {
    const tips = [];

    // Tier-specific tips
    if (skill.tier === 3) {
      tips.push('This orchestration skill runs multiple sub-skills - it may take longer to complete');
      tips.push('Check the activity log to see which sub-skills are being executed');
    }

    // Parameter tips
    if (skill.manifest.parameters) {
      if (skill.manifest.parameters.required && skill.manifest.parameters.required.length > 3) {
        tips.push('This skill has several required parameters - consider using /explain-skill to understand each one');
      }

      // Check for file/directory parameters
      const hasFilePath = skill.manifest.parameters.required?.some(p =>
        (p.name || p).includes('file') || (p.name || p).includes('path') || (p.name || p).includes('directory')
      );
      if (hasFilePath) {
        tips.push('Ensure file paths are absolute and files exist before running');
      }
    }

    // Execution tips
    if (skill.manifest.execution && skill.manifest.execution.timeout > 30000) {
      tips.push('This skill may take a while to execute - be patient');
    }

    // Add skill to favorites tip
    tips.push(`Use /recommend-skills to find similar skills or alternatives`);

    return tips;
  }
}

module.exports = ExplainSkill;
