# ROME Skills Lifecycle Management Guide

**Version**: 1.0.0
**Last Updated**: 2025-12-29

---

## Overview

This guide defines how to create, modify, version, deprecate, and remove Claude Code skills in the ROME framework, ensuring flexibility for different project types and evolving requirements.

---

## Skill Lifecycle States

```
┌─────────────┐
│   Planned   │  (Idea, not yet implemented)
└──────┬──────┘
       │
       ↓
┌─────────────┐
│    Beta     │  (Experimental, testing)
└──────┬──────┘
       │
       ↓
┌─────────────┐
│   Active    │  (Production-ready, recommended)
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ Deprecated  │  (Phasing out, migration path provided)
└──────┬──────┘
       │
       ↓
┌─────────────┐
│   Removed   │  (No longer available)
└─────────────┘
```

---

## 1. Creating New Skills

### Step 1: Identify the Need

**Ask**:
- What expert knowledge needs to be systematically applied?
- What mistakes are robots currently making?
- What new technology/pattern has been adopted?
- Is this project-specific or framework-wide?

**Example**:
- "Robots are generating React code without applying our TypeScript patterns"
- "New project uses Stripe payment integration - need standardized approach"

### Step 2: Check for Existing Skills

```bash
# Search skills-registry.yaml
grep -i "stripe\|payment" .claude/skills/skills-registry.yaml
```

**Avoid duplication**: If similar skill exists, consider extending it rather than creating new one.

### Step 3: Gather Expert Documentation

**Required**:
- At least one expert guide in `/Experts/` or external reference
- Best practices documented
- Common patterns identified
- Validation criteria defined

**If documentation doesn't exist**:
1. Create it first in `/Experts/expert_[domain]/`
2. Follow expert documentation standards
3. Get it reviewed

### Step 4: Use the Template

```bash
# Copy template
cp .claude/skills/SKILL_TEMPLATE.md .claude/skills/my-new-skill/SKILL.md

# Edit the new skill
# Replace all [placeholders] with actual content
```

### Step 5: Register the Skill

Edit `skills-registry.yaml`:

```yaml
active_skills:
  - id: my-new-skill
    name: My New Skill
    version: 1.0.0
    category: [appropriate-category]  # or create new category
    path: my-new-skill/SKILL.md
    status: active
    created: 2025-12-29
    last_modified: 2025-12-29
    priority: medium
    applicable_to:
      - [project-type-1]
      - [project-type-2]
    description: Clear one-line description
    keywords:
      - keyword1
      - keyword2
    expert_docs_referenced:
      - Experts/path/to/guide.md
```

**If new category needed**:
```yaml
categories:
  - id: new-category
    name: New Category Name
    description: What this category covers
```

### Step 6: Define Discovery Rules

Add to `discovery_rules` in `skills-registry.yaml`:

```yaml
discovery_rules:
  keyword_triggers:
    - keywords: [stripe, payment, checkout]
      recommend: stripe-payment-integration

  file_type_triggers:
    - extensions: [.tsx, .ts]
      context: payment
      recommend: stripe-payment-integration
```

### Step 7: Test the Skill

```bash
# 1. Restart Claude Code (to reload registry)

# 2. Test with actual robot task
# Ask Claude to perform task that should trigger the skill

# 3. Verify:
# - Skill is auto-discovered
# - Expert docs are referenced
# - Validation checklist is applied
# - Output includes traceability
```

### Step 8: Mark as Beta (Optional)

If skill is experimental, add to `beta_skills` section instead of `active_skills`:

```yaml
beta_skills:
  - id: experimental-skill
    version: 0.1.0-beta
    status: beta
    stability: experimental
    feedback_deadline: 2026-03-01
```

---

## 2. Modifying Existing Skills

### Minor Changes (Patch Version: 1.0.0 → 1.0.1)

**Examples**: Typo fixes, clarifications, adding examples

**Process**:
1. Edit the `SKILL.md` file
2. Update version in file footer: `1.0.0` → `1.0.1`
3. Update `last_modified` in `skills-registry.yaml`
4. Test to ensure no breaking changes
5. **No migration needed**

### Feature Additions (Minor Version: 1.0.0 → 1.1.0)

**Examples**: Adding new validation checks, new expert doc references, new patterns

**Process**:
1. Edit `SKILL.md` to add new content
2. Update version: `1.0.0` → `1.1.0`
3. Update `skills-registry.yaml`:
   ```yaml
   version: 1.1.0
   last_modified: 2025-12-30
   ```
4. Document changes in skill's "Maintenance Notes"
5. Test with existing and new scenarios
6. **Backwards compatible** - no migration needed

### Breaking Changes (Major Version: 1.0.0 → 2.0.0)

**Examples**: Restructuring validation, changing requirements, removing patterns

**Process**:
1. **Create migration guide** first:
   ```bash
   touch .claude/skills/my-skill/MIGRATION_v1_to_v2.md
   ```

2. Document what changed and how to adapt:
   ```markdown
   # Migration: my-skill v1 → v2

   ## Breaking Changes
   - Removed pattern X (use pattern Y instead)
   - Validation check Z now mandatory

   ## Migration Steps
   1. Update code using pattern X
   2. Ensure validation Z passes

   ## Timeline
   - v1 deprecated: 2026-01-01
   - v1 removed: 2026-03-01
   ```

3. Move v1 to `deprecated_skills`:
   ```yaml
   deprecated_skills:
     - id: my-skill
       version: 1.5.0
       deprecated_date: 2026-01-01
       removal_date: 2026-03-01
       reason: Breaking changes in v2
       migration_to: my-skill-v2
       migration_guide: .claude/skills/my-skill/MIGRATION_v1_to_v2.md
   ```

4. Create v2 skill (or update existing)

5. **Both versions available during transition period**

---

## 3. Deprecating Skills

### When to Deprecate

- Skill superseded by better version
- Expert docs outdated/removed
- Technology no longer used
- Skill ineffective (low quality metrics)

### Deprecation Process

**Timeline**: Minimum 2 months notice before removal

1. **Announce Deprecation**:
   ```yaml
   deprecated_skills:
     - id: old-skill
       version: 1.0.0
       deprecated_date: 2026-01-01
       removal_date: 2026-03-01  # At least 2 months later
       reason: Superseded by new-skill v2.0
       migration_to: new-skill
       migration_guide: docs/migration/old-to-new.md
   ```

2. **Update Skill File**:
   Add deprecation notice at top of `SKILL.md`:
   ```markdown
   > **⚠️ DEPRECATED**
   > This skill is deprecated as of 2026-01-01 and will be removed 2026-03-01.
   > Use `new-skill` instead.
   > See [Migration Guide](MIGRATION_old_to_new.md)
   ```

3. **Create Migration Guide**

4. **Notify Robots**:
   Update robot `CLAUDE.md` files to reference new skill

5. **Monitor Usage**:
   Track which robots/projects still using deprecated skill

6. **Remove After Timeline**

---

## 4. Removing Skills

### Pre-Removal Checklist

- [ ] Skill in `deprecated_skills` for ≥2 months
- [ ] Migration guide provided
- [ ] All robots updated to use replacement skill
- [ ] No active projects using the skill
- [ ] Removal date announced and communicated

### Removal Process

1. **Move to Archive**:
   ```bash
   mkdir -p .claude/skills/.archive
   mv .claude/skills/old-skill .claude/skills/.archive/
   ```

2. **Update Registry**:
   ```yaml
   # Remove from deprecated_skills
   # Add to removed_skills (for historical record)
   removed_skills:
     - id: old-skill
       version: 1.0.0
       removed_date: 2026-03-01
       reason: Superseded by new-skill
       archive_path: .archive/old-skill
   ```

3. **Update Discovery Rules**:
   Remove any keyword/file triggers

4. **Document Removal**:
   Add note to `CHANGELOG.md`

---

## 5. Project-Specific Skills

### Creating Project-Specific Skills

Some skills are only relevant to specific projects.

**Directory Structure**:
```
ROME_architect/
├── .claude/
│   └── skills/
│       ├── [framework-wide skills]
│       └── projects/
│           └── ecommerce-app/
│               ├── stripe-integration/
│               │   └── SKILL.md
│               └── product-catalog/
│                   └── SKILL.md
```

**Registry**:
```yaml
# Project-specific overrides
project_overrides:
  ecommerce-app:
    enabled_skills:
      - flutter-best-practices  # Framework-wide
      - ui-design-patterns       # Framework-wide
      - stripe-integration       # Project-specific
      - product-catalog          # Project-specific
    disabled_skills:
      - parse-server-config      # Not using Parse
```

### Promoting Project Skills to Framework

If project-specific skill proves valuable across multiple projects:

1. Generalize the skill (remove project-specific assumptions)
2. Move from `projects/` to main skills directory
3. Update registry to `active_skills`
4. Remove from project overrides

---

## 6. Skill Categories

### Adding New Categories

When to add:
- New technology domain (e.g., "machine-learning", "blockchain")
- New project type (e.g., "e-commerce", "healthcare")
- New skill purpose (e.g., "compliance", "performance")

**Process**:
```yaml
categories:
  - id: new-category-id
    name: New Category Name
    description: What this category encompasses
```

### Removing Categories

Only remove if:
- No active skills in category
- Category scope merged into another

---

## 7. Skill Quality Metrics

### Tracking Effectiveness

Update metrics in `skills-registry.yaml`:

```yaml
metrics:
  my-skill:
    usage_count: 42           # Times skill invoked
    success_rate: 0.95        # Tasks completed successfully
    avg_validation_pass_rate: 0.89  # % of validations passing
    user_feedback_score: 4.5  # 1-5 scale
```

### Review Triggers

Review skill when:
- `success_rate` < 0.80 (skill not effective)
- `avg_validation_pass_rate` < 0.70 (validations too strict or robots struggling)
- `user_feedback_score` < 3.0 (users dissatisfied)
- `usage_count` = 0 for >3 months (skill unused, consider deprecation)

---

## 8. Versioning Best Practices

### Semantic Versioning

**Format**: `MAJOR.MINOR.PATCH`

- **PATCH** (1.0.0 → 1.0.1): Bug fixes, clarifications, no behavior change
- **MINOR** (1.0.0 → 1.1.0): New features, backwards compatible
- **MAJOR** (1.0.0 → 2.0.0): Breaking changes, migration required

### Version Branches

For major version changes, consider branching:

```
.claude/skills/
├── my-skill/           # v2.0 (current)
└── my-skill-v1/        # v1.5 (deprecated, during transition)
```

Update registry:
```yaml
active_skills:
  - id: my-skill
    version: 2.0.0

deprecated_skills:
  - id: my-skill-v1
    version: 1.5.0
```

---

## 9. Cross-Project Skill Sharing

### Exporting Skills to Other Projects

1. **Package the skill**:
   ```bash
   tar -czf my-skill-v1.0.0.tar.gz \
     .claude/skills/my-skill/ \
     Experts/relevant-docs/
   ```

2. **Document dependencies**:
   ```yaml
   # In skill metadata
   dependencies:
     requires:
       - expert-doc: Experts/expert_flutter/guide.md
       - skill: flutter-best-practices
   ```

3. **Import to other project**:
   ```bash
   cd /path/to/other-project
   tar -xzf my-skill-v1.0.0.tar.gz
   ```

4. **Update that project's registry**

---

## 10. Maintenance Schedule

### Monthly
- Review beta skills for promotion to active
- Update metrics for all active skills
- Check for deprecated skills approaching removal date

### Quarterly
- Review all active skills for updates
- Audit expert documentation references
- Gather robot feedback on skill effectiveness
- Consider new skills based on project needs

### Annually
- Major review of all skills
- Deprecate unused or outdated skills
- Consolidate overlapping skills
- Update skill categories if needed

---

## 11. Quick Reference Commands

```bash
# List all active skills
yq '.active_skills[].id' .claude/skills/skills-registry.yaml

# Find skill by keyword
yq '.active_skills[] | select(.keywords[] | contains("flutter"))' \
   .claude/skills/skills-registry.yaml

# Check deprecated skills
yq '.deprecated_skills[]' .claude/skills/skills-registry.yaml

# Create new skill from template
cp .claude/skills/SKILL_TEMPLATE.md .claude/skills/new-skill/SKILL.md

# Archive old skill
mv .claude/skills/old-skill .claude/skills/.archive/

# Validate registry syntax
yq eval .claude/skills/skills-registry.yaml > /dev/null && echo "Valid YAML"
```

---

## 12. Example Workflows

### Workflow 1: Add New Skill for React Project

```bash
# 1. Create skill directory
mkdir -p .claude/skills/react-best-practices

# 2. Copy template
cp .claude/skills/SKILL_TEMPLATE.md \
   .claude/skills/react-best-practices/SKILL.md

# 3. Edit skill file
# (Fill in React-specific patterns, validations, expert doc references)

# 4. Add to registry
# Edit skills-registry.yaml:
#   - Add to active_skills
#   - Add react-development category if needed
#   - Add keyword triggers (react, jsx, component)

# 5. Test
# Restart Claude Code and ask it to "Create a React component"

# 6. Iterate based on feedback
```

### Workflow 2: Deprecate Outdated Skill

```bash
# 1. Identify replacement skill
# Decision: "old-patterns" → "new-patterns-v2"

# 2. Create migration guide
touch .claude/skills/old-patterns/MIGRATION_v1_to_v2.md

# 3. Update registry
# Move from active_skills to deprecated_skills
# Set removal_date = today + 2 months

# 4. Update skill file with deprecation notice

# 5. Notify robots
# Update robot CLAUDE.md files

# 6. Monitor usage for 2 months

# 7. Remove after timeline
mv .claude/skills/old-patterns .claude/skills/.archive/
```

### Workflow 3: Create Project-Specific Override

```bash
# Project needs Stripe integration (not in framework)

# 1. Create project-specific skill
mkdir -p .claude/skills/projects/ecommerce/stripe-integration

# 2. Use template
cp .claude/skills/SKILL_TEMPLATE.md \
   .claude/skills/projects/ecommerce/stripe-integration/SKILL.md

# 3. Update registry with project override
# Edit skills-registry.yaml:
project_overrides:
  ecommerce:
    enabled_skills:
      - flutter-best-practices
      - stripe-integration  # Project-specific
    disabled_skills: []

# 4. Test in ecommerce project context
```

---

## Conclusion

Skills are **living artifacts** that evolve with:
- Technology changes
- Project requirements
- Robot feedback
- Expert documentation updates

**Key Principles**:
1. **Flexibility**: Easy to add, modify, remove
2. **Traceability**: All changes tracked with versions
3. **Migration**: Clear paths when breaking changes
4. **Project-Specific**: Override for different needs
5. **Quality**: Metrics-driven continuous improvement
