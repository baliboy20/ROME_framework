/**
 * SkillRegistry - Advanced skill discovery and search
 *
 * Provides discovery capabilities:
 * - Search skills by keywords
 * - Filter by phase, tier, category
 * - Skill recommendations based on context
 * - Metadata extraction and caching
 *
 * Version: 2.0.0
 * Date: 2025-12-24
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

class SkillRegistry {
  constructor() {
    this.skills = new Map();
    this.skillsByPhase = new Map();
    this.skillsByCategory = new Map();
    this.skillsByTier = new Map();
    this.metadataCache = null;
    this.loadAllSkills();
  }

  /**
   * Load all skill manifests from registry directory
   */
  loadAllSkills() {
    const registryPath = path.join(__dirname, '../registry');

    if (!fs.existsSync(registryPath)) {
      console.warn(`Registry directory not found: ${registryPath}`);
      return;
    }

    const files = fs.readdirSync(registryPath).filter(f => f.endsWith('.yaml'));

    for (const file of files) {
      try {
        const manifestPath = path.join(registryPath, file);
        const manifestContent = fs.readFileSync(manifestPath, 'utf8');
        const manifest = yaml.load(manifestContent);

        if (!manifest.skill || !manifest.skill.name) {
          console.warn(`Invalid manifest in ${file}: missing skill.name`);
          continue;
        }

        const skillName = manifest.skill.name;
        const skillData = {
          name: skillName,
          manifest,
          tier: manifest.skill.tier || 1,
          category: manifest.skill.category || 'general',
          version: manifest.skill.version || '1.0.0',
          description: manifest.skill.description || '',
          phase: this.detectPhase(skillName),
          keywords: this.extractKeywords(manifest)
        };

        this.skills.set(skillName, skillData);
        this.indexSkill(skillData);

      } catch (error) {
        console.error(`Error loading skill manifest ${file}:`, error.message);
      }
    }

    console.log(`SkillRegistry loaded: ${this.skills.size} skills`);
  }

  /**
   * Detect which phase a skill belongs to based on naming pattern
   */
  detectPhase(skillName) {
    // P2 Analysis skills
    if (skillName.includes('analyze') || skillName.includes('extract') ||
        skillName.includes('requirement') || skillName.includes('story')) {
      return 'P2';
    }
    // P3 Design skills
    if (skillName.includes('design') || skillName.includes('architecture') ||
        skillName.includes('model') || skillName.includes('api')) {
      return 'P3';
    }
    // P4 Configuration skills
    if (skillName.includes('config') || skillName.includes('environment') ||
        skillName.includes('docker') || skillName.includes('gateway')) {
      return 'P4';
    }
    // P5 Generation skills
    if (skillName.includes('generate') || skillName.includes('code') ||
        skillName.includes('scaffold') || skillName.includes('create')) {
      return 'P5';
    }
    // P1 AORDL skills
    if (skillName.includes('aordl') || skillName.includes('validate-requirement')) {
      return 'P1';
    }
    return 'unknown';
  }

  /**
   * Extract searchable keywords from skill manifest
   */
  extractKeywords(manifest) {
    const keywords = new Set();

    // Add skill name words
    const name = manifest.skill.name;
    name.split('-').forEach(word => keywords.add(word.toLowerCase()));

    // Add description words
    if (manifest.skill.description) {
      const words = manifest.skill.description.toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 3);
      words.forEach(w => keywords.add(w));
    }

    // Add category
    if (manifest.skill.category) {
      keywords.add(manifest.skill.category.toLowerCase());
    }

    // Add parameter names
    if (manifest.parameters) {
      if (manifest.parameters.required) {
        manifest.parameters.required.forEach(p => {
          const paramName = p.name || p;
          keywords.add(paramName.toLowerCase().replace(/_/g, '-'));
        });
      }
      if (manifest.parameters.optional) {
        manifest.parameters.optional.forEach(p => {
          const paramName = p.name || p;
          keywords.add(paramName.toLowerCase().replace(/_/g, '-'));
        });
      }
    }

    return Array.from(keywords);
  }

  /**
   * Index skill by phase, category, and tier for fast lookup
   */
  indexSkill(skillData) {
    // Index by phase
    if (!this.skillsByPhase.has(skillData.phase)) {
      this.skillsByPhase.set(skillData.phase, []);
    }
    this.skillsByPhase.get(skillData.phase).push(skillData);

    // Index by category
    if (!this.skillsByCategory.has(skillData.category)) {
      this.skillsByCategory.set(skillData.category, []);
    }
    this.skillsByCategory.get(skillData.category).push(skillData);

    // Index by tier
    if (!this.skillsByTier.has(skillData.tier)) {
      this.skillsByTier.set(skillData.tier, []);
    }
    this.skillsByTier.get(skillData.tier).push(skillData);
  }

  /**
   * Get all skills
   */
  getAllSkills() {
    return Array.from(this.skills.values());
  }

  /**
   * Get skill by name
   */
  getSkill(skillName) {
    const normalizedName = skillName.replace(/^\//, '');
    return this.skills.get(normalizedName);
  }

  /**
   * Search skills by query string
   * @param {string} query - Search query
   * @returns {Array} - Matching skills with relevance scores
   */
  searchSkills(query) {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const queryWords = query.toLowerCase().split(/\s+/);
    const results = [];

    for (const [name, skillData] of this.skills) {
      let score = 0;

      // Check name match (highest weight)
      queryWords.forEach(word => {
        if (name.toLowerCase().includes(word)) {
          score += 50;
        }
      });

      // Check description match (medium weight)
      queryWords.forEach(word => {
        if (skillData.description.toLowerCase().includes(word)) {
          score += 25;
        }
      });

      // Check keyword match (lower weight)
      queryWords.forEach(word => {
        if (skillData.keywords.includes(word)) {
          score += 10;
        }
      });

      // Check category match
      queryWords.forEach(word => {
        if (skillData.category.toLowerCase().includes(word)) {
          score += 15;
        }
      });

      if (score > 0) {
        results.push({
          ...skillData,
          relevance_score: score
        });
      }
    }

    // Sort by relevance score (descending)
    return results.sort((a, b) => b.relevance_score - a.relevance_score);
  }

  /**
   * Get skills by phase (P1, P2, P3, P4, P5)
   */
  getSkillsByPhase(phase) {
    return this.skillsByPhase.get(phase) || [];
  }

  /**
   * Get skills by category
   */
  getSkillsByCategory(category) {
    return this.skillsByCategory.get(category) || [];
  }

  /**
   * Get skills by tier (1, 2, 3)
   */
  getSkillsByTier(tier) {
    return this.skillsByTier.get(tier) || [];
  }

  /**
   * Get all unique categories
   */
  getCategories() {
    return Array.from(this.skillsByCategory.keys());
  }

  /**
   * Get all unique phases
   */
  getPhases() {
    return Array.from(this.skillsByPhase.keys()).filter(p => p !== 'unknown');
  }

  /**
   * Get metadata cache (for documentation generation)
   */
  getMetadata() {
    if (this.metadataCache) {
      return this.metadataCache;
    }

    const metadata = {
      total_skills: this.skills.size,
      by_phase: {},
      by_tier: {},
      by_category: {},
      phases: this.getPhases(),
      categories: this.getCategories(),
      tiers: [1, 2, 3]
    };

    // Count by phase
    for (const [phase, skills] of this.skillsByPhase) {
      metadata.by_phase[phase] = skills.length;
    }

    // Count by tier
    for (const [tier, skills] of this.skillsByTier) {
      metadata.by_tier[tier] = skills.length;
    }

    // Count by category
    for (const [category, skills] of this.skillsByCategory) {
      metadata.by_category[category] = skills.length;
    }

    this.metadataCache = metadata;
    return metadata;
  }

  /**
   * Filter skills with multiple criteria
   * @param {Object} filters - Filter criteria
   * @returns {Array} - Matching skills
   */
  filterSkills(filters) {
    let results = this.getAllSkills();

    if (filters.phase) {
      results = results.filter(s => s.phase === filters.phase);
    }

    if (filters.tier) {
      results = results.filter(s => s.tier === filters.tier);
    }

    if (filters.category) {
      results = results.filter(s => s.category === filters.category);
    }

    if (filters.search) {
      const searchResults = this.searchSkills(filters.search);
      const searchNames = new Set(searchResults.map(s => s.name));
      results = results.filter(s => searchNames.has(s.name));
    }

    return results;
  }

  /**
   * Get skill statistics
   */
  getStatistics() {
    return {
      total: this.skills.size,
      by_phase: Object.fromEntries(this.skillsByPhase.entries()).map(([phase, skills]) => ({
        phase,
        count: skills.length
      })),
      by_tier: Object.fromEntries(this.skillsByTier.entries()).map(([tier, skills]) => ({
        tier,
        count: skills.length
      })),
      by_category: Object.fromEntries(this.skillsByCategory.entries()).map(([category, skills]) => ({
        category,
        count: skills.length
      }))
    };
  }
}

// Export singleton instance
const skillRegistry = new SkillRegistry();

module.exports = {
  SkillRegistry,
  skillRegistry
};
