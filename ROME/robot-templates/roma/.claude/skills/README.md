# ROME Skills Integration for Claude Code

This directory contains Claude Code skill wrappers for the ROME Skills Framework.

## Overview

The ROME Skills Framework provides 79+ skills across 3 tiers for AORDL-based development:
- **Tier 1**: Atomic skills (validation, transformation, extraction)
- **Tier 2**: Composite skills (orchestration of multiple tier-1 skills)
- **Tier 3**: Full pipeline skills (complete phase workflows)

## Available Skills

### Discovery Skills

- **/list-skills** - List and filter available ROME skills
  ```bash
  /list-skills
  /list-skills --filter-phase P2
  /list-skills --search-query "validate"
  ```

- **/recommend-skills** - Get skill recommendations based on your task
  ```bash
  /recommend-skills --task-description "I need to validate AORDL requirements"
  /recommend-skills --task-description "Generate API documentation" --current-phase P3
  ```

- **/explain-skill** - Get detailed information about a specific skill
  ```bash
  /explain-skill --skill-name validate-aordl
  /explain-skill --skill-name generate-api-spec
  ```

### Validation Skills

- **/validate-aordl** - Validate AORDL requirements (P1)
  ```bash
  /validate-aordl --aordl-file ARTIFACTS/requirements.yaml
  ```

## How It Works

These Claude Code skills are thin wrappers around the ROME Skills Framework:

1. Skills accept arguments in kebab-case (Claude Code convention)
2. Arguments are converted to snake_case (ROME convention)
3. The ROME SkillInvoker is called to execute the skill
4. Results are formatted for display in Claude Code

## Adding More Skills

To add more ROME skills to Claude Code:

1. Copy one of the existing skill files as a template
2. Update the skill name and description
3. Update the args to match the ROME skill's parameters
4. The execute() method handles the wrapper logic automatically

## Skills Path

Skills are loaded from: `ROME/skills/`
- Registry: `ROME/skills/registry/*.yaml`
- Implementations: `ROME/skills/tier-{1,2,3}/*.js`

## Usage in Claude Code

Once configured, skills can be invoked in any Claude Code conversation:

```bash
# Discover available skills
/list-skills --filter-phase P2

# Get recommendations
/recommend-skills --task-description "Create database schema"

# Learn about a skill
/explain-skill --skill-name generate-database-schema

# Execute a skill
/validate-aordl --aordl-file requirements.yaml
```

## Dependencies

Requires:
- Node.js 18+
- ROME Skills Framework (in `ROME/skills/`)
- Dependencies: `js-yaml` (installed in skills directory)

## Version

Skills Integration: 1.0.0
ROME Skills Framework: 1.0.0
Compatible with Claude Code: v0.11+
