# ROME-PROP-017: Expert Documentation Integration with Claude Code Skills

| Field | Value |
|-------|-------|
| **Proposal ID** | ROME-PROP-017 |
| **Title** | Expert Documentation Integration with Claude Code Skills |
| **Status** | Draft |
| **Created** | 2025-12-29 |
| **Author** | Framework Analyst & Architect |
| **Priority** | HIGH |
| **Complexity** | Medium |
| **Dependencies** | ROME-PROP-012 (Skills Auto-Discovery) |
| **Scope** | Enable Claude Code skills to reference and apply expert domain knowledge from structured documentation |

---

## Problem Statement

**Current Gap:**

The ROME framework maintains extensive expert documentation in `/Experts/` covering:
- **Flutter best practices** (19 guides, 435KB, 7 categories)
- **Parse Server implementation** (1 comprehensive guide)
- **UI/UX patterns** (cross-platform, theming, component libraries)
- **Integration patterns** (authentication, state management, API integration)
- **Platform-specific guidance** (mobile, web, desktop)

**However:**
- Robots (Claude Code instances) cannot systematically access this knowledge
- Expert documentation exists separately from skills execution
- No formal mechanism to apply domain expertise during code generation
- Quality depends on robots manually discovering relevant guides
- Best practices not automatically enforced

**Example Scenarios:**

1. **Robot Charlie (Code Generator)** generates Flutter BLoC classes but:
   - Doesn't reference `/Experts/expert_flutter/02_PATTERNS/state_management_guide.md`
   - Misses best practices from `best_practices_consolidated_guide.md`
   - Generates code that violates platform conventions

2. **Robot Clara (Design Architect)** designs UI components but:
   - Doesn't consult `/Experts/expert_flutter/04_UI_UX/flutter_ui_component_library.md`
   - Misses cross-platform considerations from `cross_platform_ui_core.md`
   - Creates architecture inconsistent with documented patterns

3. **Robot Talib (Configuration Engineer)** sets up deployment but:
   - Doesn't reference `/Experts/expert_parse_server/parse-server-expert.md`
   - Misses security configurations and production best practices

**Impact:**
- Generated code quality varies based on robot's implicit knowledge
- Expert documentation becomes "reference only" instead of "enforced standards"
- No systematic application of organizational best practices
- Inconsistent outputs across different robots
- Violates DRY principle (expertise duplicated in robot prompts)

---

## Proposed Solution: Expert Documentation Skills System

Create a **Skills-Based Expert Knowledge System** where Claude Code skills automatically reference and apply domain expertise from structured documentation during execution.

### Core Principles

1. **Skills as Knowledge Bridges**: Claude Code skills load and apply expert documentation
2. **Progressive Disclosure**: Skills reference docs only when needed (avoid context bloat)
3. **Semantic Discovery**: Skills auto-discover relevant expert guides based on task
4. **Enforcement Points**: Skills validate outputs against documented best practices
5. **Traceability**: Generated artifacts cite which expert guides were applied

---

## Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────┐
│  Robot (Claude Code Instance)                       │
│  - Reads CLAUDE.md                                  │
│  - Executes phase tasks                             │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ Invokes skill
                   ↓
┌─────────────────────────────────────────────────────┐
│  Claude Code Skill (e.g., flutter-best-practices)   │
│  - SKILL.md with expert doc references              │
│  - Progressive disclosure of expert guides          │
│  - Validation against best practices                │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ Read references
                   ↓
┌─────────────────────────────────────────────────────┐
│  Expert Documentation (/Experts/)                   │
│  - expert_flutter/                                  │
│  - expert_parse_server/                             │
│  - analysis_design_stages/                          │
└─────────────────────────────────────────────────────┘
```

### File Structure

```
ROME_architect/
├── .claude/
│   └── skills/                         # Claude Code skills
│       ├── flutter-best-practices/
│       │   ├── SKILL.md               # Skill definition
│       │   ├── core-references.md     # Quick reference list
│       │   └── validation-rules.md    # Validation criteria
│       ├── parse-server-config/
│       │   └── SKILL.md
│       └── ui-design-patterns/
│           └── SKILL.md
│
├── Experts/                            # Domain expertise (unchanged)
│   ├── expert_flutter/
│   │   ├── 00_MASTER_INDEX.md
│   │   ├── 01_CORE/
│   │   ├── 02_PATTERNS/
│   │   ├── 04_UI_UX/
│   │   └── 05_REFERENCE/
│   └── expert_parse_server/
│       └── parse-server-expert.md
```

---

## Implementation

### Phase 1: Create Expert Documentation Skills

**Location**: `ROME_architect/.claude/skills/`

#### Skill 1: `flutter-best-practices`

**Purpose**: Apply Flutter development best practices during code generation

**SKILL.md**:
```yaml
---
name: flutter-best-practices
description: Apply Flutter development best practices and architectural patterns. Use when generating Flutter code, designing UI components, or implementing state management. Validates against documented standards and prevents common mistakes.
---

# Flutter Best Practices Skill

## Quick Reference

This skill applies expert Flutter knowledge from the ROME documentation library.

**When to use:**
- Generating Flutter widgets, screens, or components
- Implementing state management (BLoC, Provider, Riverpod)
- Designing cross-platform UI
- Setting up Flutter project structure

## Critical Reading (Always Load)

For essential patterns and rules, see:
- [Best Practices Guide](../../Experts/expert_flutter/05_REFERENCE/best_practices_consolidated_guide.md)
- [Common Mistakes](../../Experts/expert_flutter/00_MASTER_INDEX.md#common-robot-mistakes)

## Progressive Disclosure

Load additional guides based on task:

### For State Management
See [State Management Guide](../../Experts/expert_flutter/02_PATTERNS/state_management_guide.md)

### For UI Components
See [UI Component Library](../../Experts/expert_flutter/04_UI_UX/flutter_ui_component_library.md)

### For Cross-Platform UI
See [Cross-Platform Core](../../Experts/expert_flutter/04_UI_UX/cross_platform_ui_core.md)

### For Authentication
See [Authentication Integration](../../Experts/expert_flutter/03_INTEGRATIONS/authentication_integration_guide.md)

## Validation Checklist

Before completing code generation, verify:

✅ **Architecture**
- [ ] Follows documented layering (Presentation → Domain → Data)
- [ ] BLoC pattern correctly implemented (if applicable)
- [ ] Dependency injection properly configured

✅ **UI/UX**
- [ ] Cross-platform considerations addressed
- [ ] Theme system properly utilized
- [ ] Platform-specific adaptations included

✅ **Code Quality**
- [ ] No violations from Common Mistakes list
- [ ] Input validation patterns applied
- [ ] Error handling follows documented patterns

✅ **Performance**
- [ ] Lazy loading where appropriate
- [ ] Efficient widget rebuilds
- [ ] Memory management best practices

## Output Traceability

When this skill is applied, append to generated file comments:

```dart
// Generated with ROME framework
// Applied: flutter-best-practices skill
// References:
//   - best_practices_consolidated_guide.md
//   - state_management_guide.md
```
```

#### Skill 2: `parse-server-config`

**Purpose**: Apply Parse Server configuration and security best practices

**SKILL.md**:
```yaml
---
name: parse-server-config
description: Apply Parse Server configuration, security, and deployment best practices. Use when configuring Parse Server backend, setting up authentication, defining schemas, or deploying to production. Validates against documented security standards.
---

# Parse Server Configuration Skill

## Quick Reference

This skill applies Parse Server expertise from ROME documentation.

**When to use:**
- Configuring Parse Server backend
- Defining Parse schemas and classes
- Setting up authentication and permissions
- Deploying Parse Server to production

## Critical Reading

Always consult:
- [Parse Server Expert Guide](../../Experts/expert_parse_server/parse-server-expert.md)

## Key Areas

### Security Configuration
- API keys and app IDs
- Master key protection
- Session token configuration
- CORS policies
- Rate limiting

### Schema Definition
- Class naming conventions
- Pointer relationships
- ACL/CLP setup
- Default fields and indexes

### Production Deployment
- Environment variables
- Database configuration
- File storage setup
- Cloud code deployment
- Monitoring and logging

## Validation Checklist

✅ **Security**
- [ ] Master key not exposed in client code
- [ ] Proper CLP (Class Level Permissions) configured
- [ ] Session expiration configured
- [ ] CORS properly restricted

✅ **Schema**
- [ ] All classes have proper ACLs
- [ ] Indexes created for query fields
- [ ] Required fields defined
- [ ] Validation rules applied

✅ **Production Readiness**
- [ ] Environment-specific configs separated
- [ ] Database backups configured
- [ ] Monitoring enabled
- [ ] Error logging configured
```

#### Skill 3: `ui-design-patterns`

**Purpose**: Apply UI/UX design patterns and platform guidelines

**SKILL.md**:
```yaml
---
name: ui-design-patterns
description: Apply UI/UX design patterns for cross-platform applications. Use when designing user interfaces, creating wireframes, implementing navigation, or ensuring platform consistency. References platform-specific guidelines and accessibility standards.
---

# UI Design Patterns Skill

## Quick Reference

Apply platform-appropriate UI/UX patterns during design and implementation.

**When to use:**
- Designing application screens
- Creating navigation flows
- Implementing platform-specific UI
- Ensuring accessibility compliance

## Progressive Loading

### For Cross-Platform UI
See [Cross-Platform UI Core](../../Experts/expert_flutter/04_UI_UX/cross_platform_ui_core.md)

### For Mobile-Specific Patterns
See [Mobile UI Patterns](../../Experts/expert_flutter/06_PLATFORM_SPECIFIC/mobile_ui_patterns.md)

### For Theming
See [Platform Theme Architecture](../../Experts/expert_flutter/04_UI_UX/platform_theme_architecture_guide.md)

### For Component Library
See [Flutter UI Component Library](../../Experts/expert_flutter/04_UI_UX/flutter_ui_component_library.md)

## Design Validation

✅ **Platform Consistency**
- [ ] iOS follows Human Interface Guidelines
- [ ] Android follows Material Design
- [ ] Web follows responsive design principles
- [ ] Desktop follows platform conventions

✅ **Accessibility**
- [ ] Semantic labels for screen readers
- [ ] Sufficient color contrast
- [ ] Keyboard navigation support
- [ ] Touch target sizes (min 48x48dp)

✅ **Navigation**
- [ ] Clear navigation hierarchy
- [ ] Back button behavior correct per platform
- [ ] Deep linking supported
- [ ] State preservation on navigation

✅ **Responsive Design**
- [ ] Breakpoints defined for all screen sizes
- [ ] Layouts adapt to orientation changes
- [ ] Touch and mouse input both supported
```

---

### Phase 2: Robot Integration

Update robot `CLAUDE.md` files to reference expert documentation skills:

#### Charlie (Code Generator) - Updated CLAUDE.md

```markdown
## Code Generation Workflow

Before generating any Flutter code:

1. **Apply Flutter Best Practices**
   - Use the `flutter-best-practices` skill
   - Validate against documented patterns
   - Reference relevant expert guides

2. **Generate Code**
   - Follow architectural patterns from skill references
   - Apply state management best practices
   - Include validation and error handling

3. **Validate Output**
   - Run skill validation checklist
   - Verify no common mistakes
   - Ensure traceability comments included

**Example**:
```
I need to generate BLoC classes for user authentication. Let me first consult
the flutter-best-practices skill to ensure I follow the documented patterns.

[Skill automatically loads state_management_guide.md and authentication_integration_guide.md]

Now generating code according to documented best practices...
```
```

#### Clara (Design Architect) - Updated CLAUDE.md

```markdown
## Design Phase Workflow

When designing UI components and architecture:

1. **Consult UI Design Patterns**
   - Invoke `ui-design-patterns` skill
   - Review cross-platform considerations
   - Apply documented component patterns

2. **Create Design Artifacts**
   - Follow referenced architectural guides
   - Ensure platform consistency
   - Document design decisions

3. **Validate Design**
   - Run design validation checklist
   - Verify accessibility compliance
   - Check against platform guidelines
```

---

### Phase 3: Skill Discovery Enhancement

Extend the existing `/list-skills` Node.js skill to index Claude Code skills:

**New functionality**:
```javascript
// In ROME/skills/tier-1/list-skills.js
static async execute(params) {
  // Existing: List Node.js skills
  const nodeSkills = skillRegistry.getAllSkills();

  // NEW: Discover Claude Code skills
  const claudeSkillsPath = path.join(__dirname, '../../../ROME_architect/.claude/skills');
  const claudeSkills = this.discoverClaudeSkills(claudeSkillsPath);

  return {
    node_skills: nodeSkills,           // ROME automation skills
    claude_skills: claudeSkills,       // Expert documentation skills
    total: nodeSkills.length + claudeSkills.length
  };
}

static discoverClaudeSkills(basePath) {
  const skills = [];
  const dirs = fs.readdirSync(basePath);

  for (const dir of dirs) {
    const skillPath = path.join(basePath, dir, 'SKILL.md');
    if (fs.existsSync(skillPath)) {
      const content = fs.readFileSync(skillPath, 'utf8');
      const frontmatter = this.parseFrontmatter(content);

      skills.push({
        name: frontmatter.name,
        description: frontmatter.description,
        type: 'claude-skill',
        path: skillPath,
        references: this.extractReferences(content)
      });
    }
  }

  return skills;
}
```

---

## Flexibility & Lifecycle Management

### Skill Registry System

**Central Management**: `skills-registry.yaml`

All skills registered in single source of truth enabling:
- **Discovery**: Auto-discover skills by keywords, file types, project structure
- **Versioning**: Track skill versions (semantic versioning)
- **Deprecation**: Manage skill lifecycle with migration paths
- **Project Overrides**: Different projects enable different skill sets
- **Metrics**: Track usage, success rates, validation pass rates
- **Dependencies**: Define skill requirements and conflicts

**Example Registry Structure**:
```yaml
active_skills:
  - id: flutter-best-practices
    version: 1.0.0
    category: flutter-development
    status: active
    applicable_to: [flutter, mobile, cross-platform]
    keywords: [flutter, bloc, widgets]

deprecated_skills:
  - id: old-flutter-patterns
    version: 0.9.0
    deprecated_date: 2026-01-01
    removal_date: 2026-03-01
    migration_to: flutter-best-practices

project_overrides:
  ecommerce-app:
    enabled_skills: [flutter-best-practices, stripe-integration]
    disabled_skills: [parse-server-config]
```

### Skill Categories

**Extensible Taxonomy**:
- `flutter-development` - Flutter/Dart skills
- `backend-configuration` - Backend setup
- `ui-ux-design` - UI/UX patterns
- `security` - Security & compliance
- `testing` - Testing & QA
- `deployment` - CI/CD & DevOps
- **+ Custom categories** - Add new categories per project needs

### Lifecycle States

```
Planned → Beta → Active → Deprecated → Removed
```

**Lifecycle Guide**: `SKILL_LIFECYCLE_GUIDE.md`

Covers:
1. Creating new skills (8-step process with template)
2. Modifying existing skills (patch/minor/major versions)
3. Deprecating skills (2-month minimum notice)
4. Removing skills (archive process)
5. Project-specific skills (override system)
6. Skill categories (adding/removing)
7. Quality metrics (tracking effectiveness)
8. Versioning best practices
9. Cross-project sharing
10. Maintenance schedules

### Skill Template

**File**: `SKILL_TEMPLATE.md`

Pre-built template for creating new skills with:
- Standard structure (Purpose, When to Use, Quick Reference)
- Progressive disclosure sections
- Validation checklist templates
- Traceability boilerplate
- Example usage scenarios
- Maintenance notes

**Create new skill in 5 minutes**:
```bash
cp SKILL_TEMPLATE.md new-skill/SKILL.md
# Fill in placeholders
# Register in skills-registry.yaml
```

### Project-Specific Overrides

**Scenario**: E-commerce project needs Stripe integration, doesn't use Parse Server

```yaml
project_overrides:
  ecommerce-app:
    enabled_skills:
      - flutter-best-practices    # Framework skill
      - ui-design-patterns         # Framework skill
      - stripe-integration         # Project-specific
      - product-catalog-patterns   # Project-specific
    disabled_skills:
      - parse-server-config        # Not using Parse
```

**Benefits**:
- Different projects = different skill sets
- No bloat (only load relevant skills)
- Project-specific expertise captured
- Easy to promote project skills to framework

### Auto-Discovery Rules

Skills automatically recommended based on:

**1. Keywords in user request**:
```yaml
keyword_triggers:
  - keywords: [stripe, payment, checkout]
    recommend: stripe-integration
```

**2. File types being worked on**:
```yaml
file_type_triggers:
  - extensions: [.dart]
    recommend: flutter-best-practices
```

**3. Project structure**:
```yaml
project_structure_triggers:
  - presence_of: [pubspec.yaml, lib/]
    recommend: flutter-best-practices
```

### Versioning & Migration

**Semantic Versioning**: `MAJOR.MINOR.PATCH`

- **Patch** (1.0.0 → 1.0.1): Bug fixes, no migration
- **Minor** (1.0.0 → 1.1.0): New features, backwards compatible
- **Major** (1.0.0 → 2.0.0): Breaking changes, requires migration

**Migration Paths**:
```yaml
deprecated_skills:
  - id: old-skill-v1
    migration_to: new-skill-v2
    migration_guide: .claude/skills/MIGRATION_v1_to_v2.md
```

### Quality Metrics

Track skill effectiveness:
```yaml
metrics:
  flutter-best-practices:
    usage_count: 156
    success_rate: 0.94
    avg_validation_pass_rate: 0.87
    user_feedback_score: 4.3
```

**Review Triggers**:
- success_rate < 0.80 → Skill needs improvement
- usage_count = 0 for >3 months → Consider deprecation
- user_feedback_score < 3.0 → Major issues

### Maintenance Schedule

**Monthly**: Review beta skills, update metrics, check deprecation timelines

**Quarterly**: Review all skills, audit expert docs, gather feedback

**Annually**: Major review, consolidate overlapping skills

---

## Benefits

### 1. Consistent Quality
- All robots apply same expert knowledge
- Best practices automatically enforced
- Reduced variance in outputs

### 2. Maintainability
- Single source of truth for domain expertise
- Update expert docs → all skills benefit
- No duplicated guidance in robot prompts

### 3. Traceability
- Generated code cites expert references
- Audit trail of which guides were applied
- Easy validation against documented standards

### 4. Scalability
- Add new expert domains easily (e.g., expert_react, expert_mongodb)
- Skills auto-discover new documentation
- Progressive disclosure keeps context manageable

### 5. Knowledge Management
- Expert documentation becomes operational, not just reference
- Continuous improvement loop: doc updates → skill improvements
- Organizational knowledge embedded in framework

---

## Implementation Plan

### Milestone 1: Core Skills (Week 1) ✅ COMPLETE
- [x] Create `flutter-best-practices` skill
- [x] Create `parse-server-config` skill
- [x] Create `ui-design-patterns` skill
- [ ] Test with existing Task Management System artifacts

**Files Created**:
- `ROME_architect/.claude/skills/flutter-best-practices/SKILL.md` (313 lines)
- `ROME_architect/.claude/skills/parse-server-config/SKILL.md` (448 lines)
- `ROME_architect/.claude/skills/ui-design-patterns/SKILL.md` (531 lines)
- `ROME_architect/.claude/skills/skills-registry.yaml` (Central registry)
- `ROME_architect/.claude/skills/SKILL_TEMPLATE.md` (Template for new skills)
- `ROME_architect/.claude/skills/SKILL_LIFECYCLE_GUIDE.md` (Lifecycle management guide)

### Milestone 2: Robot Integration (Week 2)
- [ ] Update Charlie's CLAUDE.md with skill references
- [ ] Update Clara's CLAUDE.md with skill references
- [ ] Update Talib's CLAUDE.md with skill references
- [ ] Create robot workflow examples

### Milestone 3: Discovery Enhancement (Week 3)
- [ ] Extend `/list-skills` to index Claude Code skills
- [ ] Create skill recommendation system
- [ ] Add skill validation utilities

### Milestone 4: Documentation & Testing (Week 4)
- [ ] Document skill usage patterns
- [ ] Create skill creation templates
- [ ] Test with new project scenario
- [ ] Gather feedback and iterate

---

## Success Metrics

**Quality Metrics:**
- 100% of generated Flutter code references expert guides
- Zero violations of documented best practices
- All validation checklists passed

**Efficiency Metrics:**
- Robots discover relevant guides in <5 seconds
- No redundant loading of large documentation files
- Context usage optimized via progressive disclosure

**Consistency Metrics:**
- Same input + same skill = same output across different robots
- Design decisions traceable to documented patterns
- Audit logs show which expert guides influenced outputs

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Expert docs become stale | High | Periodic audits, version tracking in skills |
| Skills load too much context | Medium | Progressive disclosure, reference-only links |
| Conflicting guidance across docs | High | Master index conflict detection, precedence rules |
| Skills slow down execution | Low | Cache frequently used references, lazy loading |
| Robots ignore skills | High | Make skills required in CLAUDE.md, validation gates |

---

## Future Enhancements

### Phase 2+: Additional Expert Domains
- `expert_react` - React/Next.js best practices
- `expert_mongodb` - MongoDB schema design
- `expert_api_design` - REST/GraphQL patterns
- `expert_security` - OWASP compliance

### Phase 3: Dynamic Skill Generation
- Auto-generate skills from structured expert docs
- Skill versioning and deprecation
- A/B testing of different expert guidance

### Phase 4: Feedback Loop
- Robots report which expert guides were most useful
- Track which patterns prevent bugs
- Continuous improvement of documentation based on robot feedback

---

## Appendices

### Appendix A: Expert Documentation Inventory

**expert_flutter/** (435KB, 19 guides):
- 00_MASTER_INDEX.md
- 01_CORE/ (5 guides)
- 02_PATTERNS/ (6 guides)
- 03_INTEGRATIONS/ (5 guides)
- 04_UI_UX/ (4 guides)
- 05_REFERENCE/ (3 guides)
- 06_PLATFORM_SPECIFIC/ (6 guides)
- 07_DEPLOYMENT/ (1 guide)

**expert_parse_server/** (20KB, 1 guide):
- parse-server-expert.md

**analysis_design_stages/** (TBD):
- (To be catalogued)

### Appendix B: Skill Template

```yaml
---
name: skill-name
description: Clear description of what this skill does and when to use it. Include keywords robots would naturally mention.
allowed-tools: Read, Grep, Glob  # Optional: restrict to read-only
---

# Skill Title

## Quick Reference
Essential information robots need immediately.

## Progressive Disclosure
Links to detailed expert documentation (loaded on demand).

### For Topic A
See [Guide A](../../Experts/path/to/guide-a.md)

### For Topic B
See [Guide B](../../Experts/path/to/guide-b.md)

## Validation Checklist
Concrete criteria robots must verify.

✅ **Category 1**
- [ ] Check 1
- [ ] Check 2

✅ **Category 2**
- [ ] Check 3
- [ ] Check 4

## Output Traceability
How robots should cite this skill in generated artifacts.
```

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| v1.0 | 2025-12-29 | Framework Analyst & Architect | Initial proposal |

---

**End of Proposal ROME-PROP-017**
