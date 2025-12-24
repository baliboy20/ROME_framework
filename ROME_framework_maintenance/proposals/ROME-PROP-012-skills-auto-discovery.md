# ROME-PROP-012: Robot Skills Auto-Discovery System

**Status:** DRAFT
**Created:** 2025-12-24
**Author:** Archie (ROME Framework Analyst)
**Priority:** HIGH
**Related:** ROME-PROP-010 (Skill-Based Architecture)

---

## Executive Summary

Create an auto-discovery system enabling robots to dynamically discover, query, and utilize available ROME skills without hardcoding skill lists in CLAUDE.md files. This eliminates manual maintenance and ensures robots always have access to the latest skills.

---

## Problem Statement

**Current Issues:**
1. 75 skills exist but robots don't know about them
2. CLAUDE.md files must be manually updated with skill lists
3. No way for robots to discover new skills added to framework
4. No context-aware skill recommendations
5. Skill documentation scattered across .yaml manifests
6. No search/filter mechanism for skills

**Impact:**
- Robots underutilize available skills
- Manual maintenance burden on framework developers
- Documentation drift as skills evolve
- Poor discoverability of relevant skills for specific tasks

---

## Proposed Solution

### Phase 1: Core Auto-Discovery Infrastructure (Week 1)

#### 1.1 Skill Registry Enhancement

**Current State:**
- `/ROME/skills/lib/SkillRegistry.js` exists
- Loads skills from `/ROME/skills/registry/*.yaml`

**Enhancement:**
```javascript
// Add to SkillRegistry.js
class SkillRegistry {

  // New methods:
  static getAllSkills() { /* returns all loaded skills */ }

  static getSkillsByCategory(category) { /* filter by category */ }

  static getSkillsByTier(tier) { /* filter by tier */ }

  static getSkillsByPhase(phase) { /* filter by P2/P3/P4/P5 */ }

  static searchSkills(query) { /* search by name/description */ }

  static getSkillDetails(skillName) { /* get full manifest */ }

  static getSkillsForContext(context) { /* recommend by context */ }
}
```

**Files to Modify:**
- `/ROME/skills/lib/SkillRegistry.js`

---

#### 1.2 Create `/list-skills` Skill (Tier 1)

**Skill Manifest:** `/ROME/skills/registry/list-skills.yaml`

```yaml
skill:
  name: list-skills
  version: 1.0.0
  category: discovery
  tier: 1
  description: List and discover available ROME skills

parameters:
  optional:
    - name: filter_category
      type: string
      description: Filter by category (analysis, design, generation, etc.)

    - name: filter_tier
      type: integer
      description: Filter by tier (1, 2, 3)

    - name: filter_phase
      type: string
      description: Filter by phase (P2, P3, P4, P5)

    - name: search_query
      type: string
      description: Search in skill names and descriptions

    - name: output_format
      type: string
      default: summary
      enum: [summary, detailed, json, markdown]

execution:
  timeout: 5000

output:
  skills_found:
    type: array
  total_count:
    type: integer
```

**Implementation:** `/ROME/skills/tier-1/list-skills.js`

```javascript
class ListSkills {
  static async execute(params) {
    const {
      filter_category,
      filter_tier,
      filter_phase,
      search_query,
      output_format = 'summary'
    } = params;

    const registry = require('../lib/SkillRegistry');
    let skills = registry.getAllSkills();

    // Apply filters
    if (filter_category) {
      skills = skills.filter(s => s.category === filter_category);
    }
    if (filter_tier) {
      skills = skills.filter(s => s.tier === filter_tier);
    }
    if (filter_phase) {
      const phaseSkills = this.getSkillsByPhase(skills, filter_phase);
      skills = phaseSkills;
    }
    if (search_query) {
      skills = registry.searchSkills(search_query);
    }

    // Format output
    const output = this.formatOutput(skills, output_format);

    return {
      skills_found: output,
      total_count: skills.length
    };
  }

  static getSkillsByPhase(skills, phase) {
    const phaseMap = {
      'P2': ['analysis', 'extraction', 'transformation', 'validation'],
      'P3': ['design', 'architecture'],
      'P4': ['configuration', 'composition'],
      'P5': ['generation', 'optimization', 'orchestration']
    };

    const categories = phaseMap[phase] || [];
    return skills.filter(s => categories.includes(s.category));
  }

  static formatOutput(skills, format) {
    switch (format) {
      case 'summary':
        return skills.map(s => ({
          name: s.name,
          tier: s.tier,
          category: s.category,
          description: s.description
        }));

      case 'detailed':
        return skills; // Full manifest

      case 'json':
        return JSON.stringify(skills, null, 2);

      case 'markdown':
        return this.generateMarkdownTable(skills);
    }
  }

  static generateMarkdownTable(skills) {
    let md = '| Skill | Tier | Category | Description |\n';
    md += '|-------|------|----------|-------------|\n';

    skills.forEach(s => {
      md += `| /${s.name} | ${s.tier} | ${s.category} | ${s.description} |\n`;
    });

    return md;
  }
}
```

---

#### 1.3 Create `/recommend-skills` Skill (Tier 2)

**Purpose:** Context-aware skill recommendations

**Skill Manifest:** `/ROME/skills/registry/recommend-skills.yaml`

```yaml
skill:
  name: recommend-skills
  version: 1.0.0
  category: discovery
  tier: 2
  description: Recommend skills based on task context

parameters:
  required:
    - name: task_description
      type: string
      description: Natural language description of what you're trying to do

  optional:
    - name: current_phase
      type: string
      description: Current ROME phase (P2, P3, P4, P5)

    - name: artifacts_available
      type: array
      description: Available artifacts (requirements, design, config, code)

    - name: max_recommendations
      type: integer
      default: 5

execution:
  timeout: 10000

output:
  recommendations:
    type: array
  reasoning:
    type: array
```

**Implementation:** `/ROME/skills/tier-2/recommend-skills.js`

```javascript
class RecommendSkills {
  static async execute(params) {
    const {
      task_description,
      current_phase,
      artifacts_available = [],
      max_recommendations = 5
    } = params;

    // Analyze task description for keywords
    const keywords = this.extractKeywords(task_description);

    // Get all skills
    const registry = require('../lib/SkillRegistry');
    const allSkills = registry.getAllSkills();

    // Score skills based on relevance
    const scored = allSkills.map(skill => ({
      skill,
      score: this.calculateRelevanceScore(skill, {
        keywords,
        current_phase,
        artifacts_available,
        task_description
      }),
      reasoning: this.generateReasoning(skill, keywords, task_description)
    }));

    // Sort by score and take top N
    const recommendations = scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, max_recommendations);

    return {
      recommendations: recommendations.map(r => ({
        skill_name: r.skill.name,
        tier: r.skill.tier,
        category: r.skill.category,
        description: r.skill.description,
        relevance_score: r.score,
        reasoning: r.reasoning
      })),
      reasoning: recommendations.map(r => r.reasoning)
    };
  }

  static extractKeywords(description) {
    const taskKeywords = {
      'validate': ['validate', 'check', 'verify'],
      'analyze': ['analyze', 'examine', 'review'],
      'generate': ['generate', 'create', 'build'],
      'design': ['design', 'architecture', 'plan'],
      'optimize': ['optimize', 'improve', 'enhance'],
      'test': ['test', 'testing', 'qa'],
      'deploy': ['deploy', 'deployment', 'production'],
      'code': ['code', 'programming', 'implementation'],
      'requirements': ['requirements', 'req', 'specification'],
      'configuration': ['config', 'configuration', 'setup']
    };

    const found = [];
    const descLower = description.toLowerCase();

    for (const [category, words] of Object.entries(taskKeywords)) {
      if (words.some(word => descLower.includes(word))) {
        found.push(category);
      }
    }

    return found;
  }

  static calculateRelevanceScore(skill, context) {
    let score = 0;

    // Keyword matching
    context.keywords.forEach(keyword => {
      if (skill.category.includes(keyword)) score += 30;
      if (skill.description.toLowerCase().includes(keyword)) score += 20;
      if (skill.name.includes(keyword)) score += 25;
    });

    // Phase matching
    if (context.current_phase) {
      const phaseMatch = this.skillMatchesPhase(skill, context.current_phase);
      if (phaseMatch) score += 40;
    }

    // Artifact availability (can we run this skill?)
    const requiredArtifacts = this.getRequiredArtifacts(skill);
    const hasRequired = requiredArtifacts.every(a =>
      context.artifacts_available.includes(a)
    );
    if (hasRequired) score += 15;

    return score;
  }

  static skillMatchesPhase(skill, phase) {
    const phaseCategories = {
      'P2': ['analysis', 'extraction', 'transformation', 'validation'],
      'P3': ['design', 'architecture'],
      'P4': ['configuration', 'composition'],
      'P5': ['generation', 'optimization', 'orchestration']
    };

    return phaseCategories[phase]?.includes(skill.category);
  }

  static getRequiredArtifacts(skill) {
    // Map skill parameters to required artifacts
    const paramArtifactMap = {
      'requirements_directory': 'requirements',
      'design_directory': 'design',
      'artifacts_directory': 'artifacts',
      'code_directory': 'code'
    };

    const required = [];
    if (skill.parameters?.required) {
      skill.parameters.required.forEach(param => {
        const artifact = paramArtifactMap[param.name];
        if (artifact) required.push(artifact);
      });
    }

    return required;
  }

  static generateReasoning(skill, keywords, taskDescription) {
    const reasons = [];

    // Why this skill matches
    if (keywords.some(k => skill.category.includes(k))) {
      reasons.push(`Category '${skill.category}' matches your task`);
    }

    if (keywords.some(k => skill.name.includes(k))) {
      reasons.push(`Skill name contains relevant keyword`);
    }

    // What the skill does
    reasons.push(skill.description);

    return reasons.join('. ');
  }
}
```

---

### Phase 2: Documentation Generation (Week 1)

#### 2.1 Create `/generate-skills-documentation` Skill (Tier 2)

**Purpose:** Auto-generate markdown documentation from skill manifests

**Skill Manifest:** `/ROME/skills/registry/generate-skills-documentation.yaml`

```yaml
skill:
  name: generate-skills-documentation
  version: 1.0.0
  category: generation
  tier: 2
  description: Generate comprehensive skills documentation from manifests

parameters:
  required:
    - name: output_file
      type: string
      description: Path to write documentation

  optional:
    - name: format
      type: string
      default: markdown
      enum: [markdown, html, json]

    - name: group_by
      type: string
      default: phase
      enum: [phase, tier, category, alphabetical]

    - name: include_examples
      type: boolean
      default: true

execution:
  timeout: 30000

output:
  file_generated:
    type: string
  skills_documented:
    type: integer
```

**Generated Documentation Structure:**

```markdown
# ROME Skills Reference Guide

Auto-generated on: 2025-12-24

Total Skills: 75

## Phase P2: Analysis (19 skills)

### Tier 1 - Atomic Skills (10 skills)

#### /analyze-requirement
**Category:** analysis
**Description:** Validate and extract entities from single AORDL requirement

**Parameters:**
- `requirement_file` (required): Path to AORDL requirement YAML file
- `mode` (optional): Validation mode (STRICT, GUIDED, PERMISSIVE)

**Returns:**
- `validation_status`: PASS/FAIL
- `entities_extracted`: array
- `complexity_score`: integer

**Usage Example:**
```javascript
await invokeSkill('analyze-requirement', {
  requirement_file: 'ARTIFACTS/01-requirements/REQ-001.yaml',
  mode: 'STRICT'
});
```

**When to Use:**
- Validating a single AORDL requirement
- Extracting entities for data modeling
- Calculating requirement complexity

**Related Skills:**
- /batch-analyze-requirements (process multiple)
- /validate-aordl (format validation only)

---

[... continues for all 75 skills ...]
```

---

#### 2.2 Create Skills Quick Reference Card

**File:** `/ROME/skills/SKILLS-QUICK-REFERENCE.md`

**Format:**
```markdown
# ROME Skills Quick Reference

## By Task

### "I need to validate requirements"
→ `/validate-aordl` - Validate AORDL format
→ `/analyze-requirement` - Full requirement analysis
→ `/batch-analyze-requirements` - Process multiple requirements

### "I need to generate code"
→ `/generate-entity-classes` - Domain entities
→ `/generate-bloc-classes` - BLoC state management
→ `/execute-p5-code-generation` - Complete code generation

### "I need to run the full pipeline"
→ `/execute-complete-code-pipeline` - P1→P2→P3→P4→P5

## By Phase

### P2 Analysis (19 skills)
| Skill | Tier | Use When |
|-------|------|----------|
| /analyze-requirement | 1 | Validate single requirement |
| /batch-analyze-requirements | 1 | Process multiple requirements |
| /execute-p2-analysis | 2 | Full P2 orchestration |

### P3 Design (19 skills)
[...]

### P4 Configuration (18 skills)
[...]

### P5 Code Generation (19 skills)
[...]

## By Common Workflows

### Workflow: Validate Requirements
1. `/validate-aordl` - Check AORDL format
2. `/analyze-requirement` - Extract entities & complexity
3. Review validation report

### Workflow: Generate Flutter App
1. `/execute-p5-code-generation` - Generate DDD code
2. `/validate-code-generation` - Check quality
3. `/generate-dependency-injection` - Setup DI
4. `/generate-routing-config` - Setup routing

### Workflow: Complete Pipeline
1. `/execute-complete-code-pipeline` - Run P1→P5
2. Review validation results
3. Deploy generated code
```

---

### Phase 3: Robot Integration (Week 2)

#### 3.1 Update CLAUDE.md Files

**File:** `/ROME_architect/CLAUDE.md`

**Add Section:**

```markdown
## Skills Discovery System

You have access to 75+ ROME skills. Instead of memorizing all skills, use the discovery system:

### Discover Available Skills

**List all skills:**
```javascript
await invokeSkill('list-skills', {
  output_format: 'summary'
});
```

**Filter by phase:**
```javascript
await invokeSkill('list-skills', {
  filter_phase: 'P5',  // P2, P3, P4, P5
  output_format: 'detailed'
});
```

**Search for specific skills:**
```javascript
await invokeSkill('list-skills', {
  search_query: 'validate',
  output_format: 'markdown'
});
```

### Get Skill Recommendations

When you're unsure which skill to use, ask for recommendations:

```javascript
await invokeSkill('recommend-skills', {
  task_description: "I need to validate AORDL requirements and generate a data model",
  current_phase: 'P2',
  artifacts_available: ['requirements'],
  max_recommendations: 5
});
```

This returns ranked skill suggestions with reasoning.

### Skill Categories

Skills are organized into:
- **Tier 1 (Atomic):** Single-purpose, foundational skills
- **Tier 2 (Composition):** Orchestrate multiple Tier 1 skills
- **Tier 3 (Advanced):** Cross-cutting, pipeline orchestration

**Categories:**
- analysis, extraction, transformation, validation (P2)
- design, architecture (P3)
- configuration, composition (P4)
- generation, optimization, orchestration (P5)

### Quick Reference

Before starting work:
1. Use `/recommend-skills` to find relevant skills
2. Or browse `/ROME/skills/SKILLS-QUICK-REFERENCE.md`
3. Or use `/list-skills` with filters

**Pro Tip:** Always check for orchestration skills (Tier 2-3) before running multiple Tier 1 skills manually. Example: Use `/execute-p5-code-generation` instead of manually calling 10 individual code generation skills.
```

---

#### 3.2 Update Expert CLAUDE.md Files

**File:** `/Experts/expert_flutter/CLAUDE.md`

**Add Section:**

```markdown
## Flutter Code Generation Skills

Discover available Flutter code generation skills:

```javascript
await invokeSkill('list-skills', {
  filter_phase: 'P5',
  search_query: 'flutter OR bloc OR ui',
  output_format: 'detailed'
});
```

**Common Flutter Skills:**
- `/generate-entity-classes` - Domain entities with Equatable
- `/generate-bloc-events` - BLoC event classes
- `/generate-bloc-states` - Sealed state classes
- `/generate-bloc-classes` - Complete BLoC implementation
- `/generate-ui-screens` - Screen widgets with BlocBuilder
- `/execute-p5-code-generation` - Complete DDD app generation

**Get Recommendations:**
```javascript
await invokeSkill('recommend-skills', {
  task_description: "Generate a Flutter feature with BLoC state management",
  current_phase: 'P5'
});
```
```

---

### Phase 4: Advanced Features (Week 2)

#### 4.1 Create `/explain-skill` Skill (Tier 1)

**Purpose:** Get detailed explanation of a specific skill

```yaml
skill:
  name: explain-skill
  version: 1.0.0
  category: discovery
  tier: 1
  description: Get detailed explanation and examples for a specific skill

parameters:
  required:
    - name: skill_name
      type: string
      description: Name of skill to explain

  optional:
    - name: include_examples
      type: boolean
      default: true

    - name: include_related
      type: boolean
      default: true

output:
  skill_info:
    type: object
  usage_examples:
    type: array
  related_skills:
    type: array
```

---

#### 4.2 Create Skills Dependency Graph

**Purpose:** Visualize which skills call which other skills

**File:** `/ROME/skills/SKILLS-DEPENDENCY-GRAPH.md`

```markdown
# Skills Dependency Graph

## Tier 3 Orchestration Skills

### /execute-complete-code-pipeline
Calls:
- /execute-p2-analysis
  - /batch-analyze-requirements
    - /analyze-requirement
      - /validate-aordl
      - /extract-entities
      - /extract-invariants
  - /generate-data-dictionary
  - /generate-full-api-spec
    - /generate-api-spec (per requirement)
  - /generate-database-schema
  - /generate-test-plan
    - /generate-test-scenarios (per requirement)
- /execute-p3-design
  - [10 design skills]
- /execute-p4-configuration
  - [10 configuration skills]
- /execute-p5-code-generation
  - /generate-complete-domain-layer
  - /generate-complete-data-layer
  - /generate-complete-presentation-layer
- /validate-code-generation
- /optimize-code-structure
- /generate-dependency-injection
- /generate-routing-config

[Visualize as tree or mermaid diagram]
```

---

## Implementation Plan

### Week 1: Core Infrastructure

**Day 1-2:**
- [ ] Enhance SkillRegistry.js with new query methods
- [ ] Create `/list-skills` skill (manifest + implementation)
- [ ] Test skill listing with filters

**Day 3-4:**
- [ ] Create `/recommend-skills` skill
- [ ] Implement relevance scoring algorithm
- [ ] Test recommendations with various queries

**Day 5:**
- [ ] Create `/generate-skills-documentation` skill
- [ ] Generate initial SKILLS-REFERENCE.md
- [ ] Create SKILLS-QUICK-REFERENCE.md

### Week 2: Integration & Advanced Features

**Day 6-7:**
- [ ] Update `/ROME_architect/CLAUDE.md` with discovery sections
- [ ] Update all `/Experts/*/CLAUDE.md` files
- [ ] Add discovery instructions to onboarding

**Day 8-9:**
- [ ] Create `/explain-skill` skill
- [ ] Generate skills dependency graph
- [ ] Create visual diagrams (mermaid)

**Day 10:**
- [ ] Testing with real robot usage
- [ ] Documentation review
- [ ] Create tutorial examples

---

## Success Metrics

**Adoption Metrics:**
- Robots use `/list-skills` or `/recommend-skills` before manually searching
- Reduction in "I don't know what skill to use" scenarios
- Increase in Tier 2/3 orchestration skill usage (vs manual Tier 1 chains)

**Quality Metrics:**
- Skill recommendations have >80% relevance accuracy
- Documentation is auto-generated and stays synchronized
- Zero hardcoded skill lists in CLAUDE.md files

**Developer Metrics:**
- New skills are automatically discoverable within 1 second of registration
- Adding a skill requires zero documentation updates (auto-generated)
- Skills dependency graph auto-updates

---

## Files to Create

### New Skills (6 files):
1. `/ROME/skills/registry/list-skills.yaml`
2. `/ROME/skills/tier-1/list-skills.js`
3. `/ROME/skills/registry/recommend-skills.yaml`
4. `/ROME/skills/tier-2/recommend-skills.js`
5. `/ROME/skills/registry/generate-skills-documentation.yaml`
6. `/ROME/skills/tier-2/generate-skills-documentation.js`
7. `/ROME/skills/registry/explain-skill.yaml`
8. `/ROME/skills/tier-1/explain-skill.js`

### Documentation (4 files):
1. `/ROME/skills/SKILLS-REFERENCE.md` (auto-generated)
2. `/ROME/skills/SKILLS-QUICK-REFERENCE.md` (template)
3. `/ROME/skills/SKILLS-DEPENDENCY-GRAPH.md` (auto-generated)
4. `/ROME/skills/SKILLS-BY-WORKFLOW.md` (curated)

### Updates:
1. `/ROME/skills/lib/SkillRegistry.js` (enhance)
2. `/ROME_architect/CLAUDE.md` (add discovery section)
3. `/Experts/expert_flutter/CLAUDE.md` (add discovery section)
4. `/Experts/expert_parse_server/CLAUDE.md` (add discovery section)

---

## Dependencies

**Prerequisites:**
- Existing SkillRegistry.js
- 75 skills with .yaml manifests
- AORDL integration (ROME-PROP-011)

**Blocks:**
- None (can run in parallel with AORDL integration)

**Enables:**
- Robots can autonomously discover and use skills
- Self-documenting skill system
- Context-aware skill recommendations
- Eliminates manual CLAUDE.md updates

---

## Risks & Mitigations

**Risk 1: Recommendation accuracy**
- Mitigation: Start with keyword matching, iterate based on usage
- Fallback: Manual override in CLAUDE.md for critical workflows

**Risk 2: Performance with 75+ skills**
- Mitigation: Cache skill registry, lazy load details
- Benchmark: Should return results in <500ms

**Risk 3: Documentation drift**
- Mitigation: Auto-generate from manifests, not manual editing
- Validation: CI check that docs are up-to-date

---

## Future Enhancements (Post-MVP)

1. **Skill Usage Analytics**
   - Track which skills are used most
   - Identify unused skills
   - Optimize recommendations based on actual usage

2. **Natural Language Skill Discovery**
   - "Show me skills for validating Flutter code"
   - Use LLM to interpret queries and match to skills

3. **Skill Composition Assistant**
   - Suggest skill chains for complex workflows
   - Auto-generate Tier 2 skills from common Tier 1 patterns

4. **Visual Skill Explorer**
   - Interactive web UI for browsing skills
   - Dependency graph visualization
   - Search and filter interface

5. **Skill Versioning & Deprecation**
   - Track skill versions
   - Deprecation warnings
   - Migration guides

---

## Approval & Next Steps

**Requires Approval From:** Framework Lead
**Estimated Effort:** 2 weeks (1 developer)
**Target Completion:** 2025-01-07

**Next Steps After Approval:**
1. Create feature branch: `013-skills-auto-discovery`
2. Implement Week 1 tasks
3. Daily standups on progress
4. Demo at end of Week 1
5. Integration testing Week 2
6. Merge to main after testing

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-24 | Archie | Initial proposal |
