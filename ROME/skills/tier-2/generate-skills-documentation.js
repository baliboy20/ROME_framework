/**
 * /generate-skills-documentation skill (Tier 2)
 * Auto-generates comprehensive documentation from skill manifests
 * Version: 1.0.0
 */

const fs = require('fs');
const path = require('path');
const { skillRegistry } = require('../lib/SkillRegistry');

class GenerateSkillsDocumentation {
  static async execute(params, executionId) {
    const {
      output_directory,
      format = 'markdown',
      group_by = 'phase'
    } = params;

    // Ensure output directory exists
    fs.mkdirSync(output_directory, { recursive: true });

    const allSkills = skillRegistry.getAllSkills();
    const metadata = skillRegistry.getMetadata();

    // Generate different documentation files
    const files_created = [];

    // 1. Overview/index file
    const overviewPath = path.join(output_directory, 'README.md');
    const overviewContent = this.generateOverview(metadata, allSkills);
    fs.writeFileSync(overviewPath, overviewContent);
    files_created.push('README.md');

    // 2. Group skills by phase/tier/category
    if (group_by === 'phase') {
      const byPhase = this.groupByPhase(allSkills);
      for (const [phase, skills] of Object.entries(byPhase)) {
        const phasePath = path.join(output_directory, `${phase}-skills.md`);
        const phaseContent = this.generatePhaseDoc(phase, skills);
        fs.writeFileSync(phasePath, phaseContent);
        files_created.push(`${phase}-skills.md`);
      }
    } else if (group_by === 'tier') {
      const byTier = this.groupByTier(allSkills);
      for (const [tier, skills] of Object.entries(byTier)) {
        const tierPath = path.join(output_directory, `tier-${tier}-skills.md`);
        const tierContent = this.generateTierDoc(tier, skills);
        fs.writeFileSync(tierPath, tierContent);
        files_created.push(`tier-${tier}-skills.md`);
      }
    } else if (group_by === 'category') {
      const byCategory = this.groupByCategory(allSkills);
      for (const [category, skills] of Object.entries(byCategory)) {
        const categoryPath = path.join(output_directory, `${category}-skills.md`);
        const categoryContent = this.generateCategoryDoc(category, skills);
        fs.writeFileSync(categoryPath, categoryContent);
        files_created.push(`${category}-skills.md`);
      }
    }

    // 3. Individual skill reference pages
    const skillsRefDir = path.join(output_directory, 'skills');
    fs.mkdirSync(skillsRefDir, { recursive: true});

    for (const skill of allSkills) {
      const skillPath = path.join(skillsRefDir, `${skill.name}.md`);
      const skillContent = this.generateSkillDoc(skill);
      fs.writeFileSync(skillPath, skillContent);
      files_created.push(`skills/${skill.name}.md`);
    }

    // 4. Quick reference guide
    const quickRefPath = path.join(output_directory, 'QUICK-REFERENCE.md');
    const quickRefContent = this.generateQuickReference(allSkills);
    fs.writeFileSync(quickRefPath, quickRefContent);
    files_created.push('QUICK-REFERENCE.md');

    return {
      files_created: files_created.length,
      output_directory,
      files_list: files_created,
      total_skills_documented: allSkills.length
    };
  }

  /**
   * Generate overview/index documentation
   */
  static generateOverview(metadata, skills) {
    let md = '# ROME Skills Documentation\n\n';
    md += `**Total Skills:** ${metadata.total_skills}\n\n`;

    md += '## Quick Stats\n\n';
    md += `- **Phases:** ${metadata.phases.length}\n`;
    md += `- **Tiers:** ${metadata.tiers.length}\n`;
    md += `- **Categories:** ${metadata.categories.length}\n\n`;

    md += '## Skills by Phase\n\n';
    for (const phase of metadata.phases) {
      md += `- **${phase}:** ${metadata.by_phase[phase]} skills\n`;
    }
    md += '\n';

    md += '## Skills by Tier\n\n';
    for (const tier of metadata.tiers) {
      const tierName = tier === 1 ? 'Atomic' : tier === 2 ? 'Composition' : 'Orchestration';
      md += `- **Tier ${tier} (${tierName}):** ${metadata.by_tier[tier] || 0} skills\n`;
    }
    md += '\n';

    md += '## Skills by Category\n\n';
    const sortedCategories = Object.entries(metadata.by_category).sort((a, b) => b[1] - a[1]);
    for (const [category, count] of sortedCategories) {
      md += `- **${category}:** ${count} skills\n`;
    }
    md += '\n';

    md += '## Documentation Structure\n\n';
    md += '- `README.md` - This overview\n';
    md += '- `QUICK-REFERENCE.md` - Quick lookup guide\n';
    md += '- `P#-skills.md` - Skills grouped by phase\n';
    md += '- `skills/*.md` - Individual skill documentation\n\n';

    md += '## How to Use Skills\n\n';
    md += '### Discovery\n\n';
    md += '```bash\n';
    md += '# List all skills\n';
    md += '/list-skills\n\n';
    md += '# Search for specific skills\n';
    md += '/list-skills --search-query "analyze"\n\n';
    md += '# Filter by phase\n';
    md += '/list-skills --filter-phase P2\n';
    md += '```\n\n';

    md += '### Recommendations\n\n';
    md += '```bash\n';
    md += '# Get skill recommendations\n';
    md += '/recommend-skills --task-description "I need to create API endpoints" --current-phase P3\n';
    md += '```\n\n';

    md += '### Learning\n\n';
    md += '```bash\n';
    md += '# Get detailed explanation of a skill\n';
    md += '/explain-skill --skill-name analyze-requirement\n';
    md += '```\n\n';

    return md;
  }

  /**
   * Generate phase documentation
   */
  static generatePhaseDoc(phase, skills) {
    let md = `# ${phase} Skills\n\n`;
    md += `**Total Skills:** ${skills.length}\n\n`;

    // Group by tier
    const byTier = this.groupByTier(skills);

    for (const [tier, tierSkills] of Object.entries(byTier).sort()) {
      const tierName = tier === '1' ? 'Atomic' : tier === '2' ? 'Composition' : 'Orchestration';
      md += `## Tier ${tier}: ${tierName}\n\n`;

      for (const skill of tierSkills.sort((a, b) => a.name.localeCompare(b.name))) {
        md += `### /${skill.name}\n\n`;
        md += `**Category:** ${skill.category}  \n`;
        md += `**Version:** ${skill.version}  \n\n`;
        md += `${skill.description}\n\n`;

        if (skill.manifest.parameters) {
          md += '**Parameters:**\n\n';

          if (skill.manifest.parameters.required && skill.manifest.parameters.required.length > 0) {
            md += '*Required:*\n';
            for (const param of skill.manifest.parameters.required) {
              const name = param.name || param;
              const type = param.type || 'any';
              const desc = param.description || '';
              md += `- \`${name}\` (${type}): ${desc}\n`;
            }
            md += '\n';
          }

          if (skill.manifest.parameters.optional && skill.manifest.parameters.optional.length > 0) {
            md += '*Optional:*\n';
            for (const param of skill.manifest.parameters.optional) {
              const name = param.name || param;
              const type = param.type || 'any';
              const defaultVal = param.default !== undefined ? ` (default: ${param.default})` : '';
              const desc = param.description || '';
              md += `- \`${name}\` (${type})${defaultVal}: ${desc}\n`;
            }
            md += '\n';
          }
        }

        md += `[View full documentation →](skills/${skill.name}.md)\n\n`;
        md += '---\n\n';
      }
    }

    return md;
  }

  /**
   * Generate tier documentation
   */
  static generateTierDoc(tier, skills) {
    const tierName = tier === '1' ? 'Atomic' : tier === '2' ? 'Composition' : 'Orchestration';
    let md = `# Tier ${tier}: ${tierName} Skills\n\n`;
    md += `**Total Skills:** ${skills.length}\n\n`;

    for (const skill of skills.sort((a, b) => a.name.localeCompare(b.name))) {
      md += `## /${skill.name}\n\n`;
      md += `**Phase:** ${skill.phase}  \n`;
      md += `**Category:** ${skill.category}  \n\n`;
      md += `${skill.description}\n\n`;
      md += `[View full documentation →](skills/${skill.name}.md)\n\n`;
      md += '---\n\n';
    }

    return md;
  }

  /**
   * Generate category documentation
   */
  static generateCategoryDoc(category, skills) {
    let md = `# ${category.charAt(0).toUpperCase() + category.slice(1)} Skills\n\n`;
    md += `**Total Skills:** ${skills.length}\n\n`;

    for (const skill of skills.sort((a, b) => a.name.localeCompare(b.name))) {
      md += `## /${skill.name}\n\n`;
      md += `**Phase:** ${skill.phase}  \n`;
      md += `**Tier:** ${skill.tier}  \n\n`;
      md += `${skill.description}\n\n`;
      md += `[View full documentation →](skills/${skill.name}.md)\n\n`;
      md += '---\n\n';
    }

    return md;
  }

  /**
   * Generate individual skill documentation
   */
  static generateSkillDoc(skill) {
    let md = `# /${skill.name}\n\n`;
    md += `**Version:** ${skill.version}  \n`;
    md += `**Category:** ${skill.category}  \n`;
    md += `**Tier:** ${skill.tier}  \n`;
    md += `**Phase:** ${skill.phase}  \n\n`;

    md += '## Description\n\n';
    md += `${skill.description}\n\n`;

    if (skill.manifest.parameters) {
      md += '## Parameters\n\n';

      if (skill.manifest.parameters.required && skill.manifest.parameters.required.length > 0) {
        md += '### Required\n\n';
        for (const param of skill.manifest.parameters.required) {
          const name = param.name || param;
          const type = param.type || 'any';
          const desc = param.description || '';
          md += `- **\`${name}\`** (${type}): ${desc}\n`;
        }
        md += '\n';
      }

      if (skill.manifest.parameters.optional && skill.manifest.parameters.optional.length > 0) {
        md += '### Optional\n\n';
        for (const param of skill.manifest.parameters.optional) {
          const name = param.name || param;
          const type = param.type || 'any';
          const defaultVal = param.default !== undefined ? ` (default: \`${param.default}\`)` : '';
          const desc = param.description || '';
          md += `- **\`${name}\`** (${type})${defaultVal}: ${desc}\n`;
        }
        md += '\n';
      }
    }

    if (skill.manifest.examples && skill.manifest.examples.length > 0) {
      md += '## Examples\n\n';
      for (const example of skill.manifest.examples) {
        md += `**${example.description}**\n\n`;
        md += '```bash\n';
        md += `${example.usage}\n`;
        md += '```\n\n';
      }
    }

    if (skill.manifest.output) {
      md += '## Output\n\n';
      for (const [key, value] of Object.entries(skill.manifest.output)) {
        const type = value.type || 'any';
        const desc = value.description || '';
        md += `- **\`${key}\`** (${type}): ${desc}\n`;
      }
      md += '\n';
    }

    return md;
  }

  /**
   * Generate quick reference guide
   */
  static generateQuickReference(skills) {
    let md = '# Quick Reference\n\n';
    md += '## All Skills\n\n';
    md += '| Skill | Phase | Tier | Category | Description |\n';
    md += '|-------|-------|------|----------|-------------|\n';

    for (const skill of skills.sort((a, b) => a.name.localeCompare(b.name))) {
      const desc = skill.description.substring(0, 60) + (skill.description.length > 60 ? '...' : '');
      md += `| \`/${skill.name}\` | ${skill.phase} | ${skill.tier} | ${skill.category} | ${desc} |\n`;
    }

    return md;
  }

  /**
   * Helper: Group skills by phase
   */
  static groupByPhase(skills) {
    const grouped = {};
    for (const skill of skills) {
      if (!grouped[skill.phase]) {
        grouped[skill.phase] = [];
      }
      grouped[skill.phase].push(skill);
    }
    return grouped;
  }

  /**
   * Helper: Group skills by tier
   */
  static groupByTier(skills) {
    const grouped = {};
    for (const skill of skills) {
      if (!grouped[skill.tier]) {
        grouped[skill.tier] = [];
      }
      grouped[skill.tier].push(skill);
    }
    return grouped;
  }

  /**
   * Helper: Group skills by category
   */
  static groupByCategory(skills) {
    const grouped = {};
    for (const skill of skills) {
      if (!grouped[skill.category]) {
        grouped[skill.category] = [];
      }
      grouped[skill.category].push(skill);
    }
    return grouped;
  }
}

module.exports = GenerateSkillsDocumentation;
