/**
 * /recommend-skills skill (Tier 2)
 * Recommends skills based on task description and context
 * Version: 1.0.0
 */

const { skillRegistry } = require('../lib/SkillRegistry');

class RecommendSkills {
  static async execute(params, executionId) {
    const {
      task_description,
      current_phase,
      artifacts_available = [],
      max_recommendations = 5
    } = params;

    // Extract keywords from task description
    const keywords = this.extractKeywords(task_description);

    // Get all skills
    const allSkills = skillRegistry.getAllSkills();

    // Score each skill based on relevance
    const scored = allSkills.map(skill => ({
      skill,
      score: this.calculateRelevanceScore(skill, {
        keywords,
        current_phase,
        artifacts_available,
        task_description
      }),
      reasoning: this.generateReasoning(skill, keywords, task_description, current_phase)
    }));

    // Filter skills with score > 0 and sort by score
    const recommendations = scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, max_recommendations);

    return {
      recommendations: recommendations.map(r => ({
        skill_name: r.skill.name,
        tier: r.skill.tier,
        phase: r.skill.phase,
        category: r.skill.category,
        relevance_score: r.score,
        reasoning: r.reasoning,
        description: r.skill.description
      })),
      total_analyzed: allSkills.length,
      keywords_extracted: keywords,
      context: {
        current_phase: current_phase || 'unknown',
        artifacts: artifacts_available.length
      }
    };
  }

  /**
   * Extract keywords from task description
   */
  static extractKeywords(description) {
    const keywords = [];
    const text = description.toLowerCase();

    // Keyword patterns
    const patterns = {
      // Actions
      create: ['create', 'generate', 'build', 'make', 'construct'],
      analyze: ['analyze', 'examine', 'evaluate', 'assess', 'review'],
      design: ['design', 'architect', 'model', 'structure', 'plan'],
      validate: ['validate', 'verify', 'check', 'test', 'ensure'],
      transform: ['transform', 'convert', 'map', 'translate'],
      extract: ['extract', 'pull', 'identify', 'find'],
      optimize: ['optimize', 'improve', 'enhance', 'refine'],

      // Artifacts
      requirements: ['requirement', 'spec', 'story', 'criteria', 'aordl'],
      architecture: ['architecture', 'system', 'component', 'structure'],
      data: ['data', 'database', 'schema', 'entity', 'model'],
      api: ['api', 'endpoint', 'interface', 'service', 'controller'],
      code: ['code', 'implementation', 'class', 'function'],
      config: ['config', 'environment', 'docker', 'deployment'],
      test: ['test', 'testing', 'validation', 'scenario'],
      documentation: ['document', 'docs', 'readme', 'guide']
    };

    // Match patterns
    for (const [category, words] of Object.entries(patterns)) {
      for (const word of words) {
        if (text.includes(word)) {
          keywords.push(category);
          break; // Only add category once
        }
      }
    }

    return keywords;
  }

  /**
   * Calculate relevance score for a skill
   */
  static calculateRelevanceScore(skill, context) {
    let score = 0;
    const { keywords, current_phase, artifacts_available, task_description } = context;

    // Phase matching (40 points)
    if (current_phase && skill.phase === current_phase) {
      score += 40;
    }

    // Keyword matching in skill name (30 points total)
    keywords.forEach(keyword => {
      if (skill.name.toLowerCase().includes(keyword)) {
        score += 30 / keywords.length;
      }
    });

    // Keyword matching in description (25 points total)
    keywords.forEach(keyword => {
      if (skill.description.toLowerCase().includes(keyword)) {
        score += 25 / keywords.length;
      }
    });

    // Keyword matching in skill keywords (20 points total)
    keywords.forEach(keyword => {
      if (skill.keywords.includes(keyword)) {
        score += 20 / keywords.length;
      }
    });

    // Category matching (15 points)
    keywords.forEach(keyword => {
      if (skill.category.toLowerCase().includes(keyword)) {
        score += 15;
      }
    });

    // Artifact availability matching (10 points)
    // If task mentions artifacts the skill needs, boost score
    if (skill.manifest.parameters && skill.manifest.parameters.required) {
      const requiredParams = skill.manifest.parameters.required.map(p => p.name || p);
      const artifactMatch = artifacts_available.some(artifact => {
        return requiredParams.some(param =>
          artifact.toLowerCase().includes(param.toLowerCase().replace(/_/g, '-'))
        );
      });

      if (artifactMatch) {
        score += 10;
      }
    }

    return Math.round(score);
  }

  /**
   * Generate reasoning for recommendation
   */
  static generateReasoning(skill, keywords, taskDescription, currentPhase) {
    const reasons = [];

    // Phase match
    if (currentPhase && skill.phase === currentPhase) {
      reasons.push(`Matches current phase (${currentPhase})`);
    }

    // Keyword matches in name
    const nameMatches = keywords.filter(k => skill.name.toLowerCase().includes(k));
    if (nameMatches.length > 0) {
      reasons.push(`Skill name matches: ${nameMatches.join(', ')}`);
    }

    // Description match
    const descMatches = keywords.filter(k => skill.description.toLowerCase().includes(k));
    if (descMatches.length > 0 && descMatches.length !== nameMatches.length) {
      reasons.push(`Description mentions: ${descMatches.join(', ')}`);
    }

    // Category relevance
    if (keywords.some(k => skill.category.toLowerCase().includes(k))) {
      reasons.push(`Relevant category: ${skill.category}`);
    }

    // Tier explanation
    if (skill.tier === 3) {
      reasons.push('Orchestration skill - runs complete workflows');
    } else if (skill.tier === 2) {
      reasons.push('Composition skill - combines multiple operations');
    } else {
      reasons.push('Atomic skill - focused single operation');
    }

    if (reasons.length === 0) {
      reasons.push('General relevance to task description');
    }

    return reasons.join('; ');
  }
}

module.exports = RecommendSkills;
