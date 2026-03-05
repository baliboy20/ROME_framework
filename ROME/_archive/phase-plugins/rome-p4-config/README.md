# rome-p4-config

ROME Framework P4 Config Phase Plugin

## Overview

This plugin provides agents and skills for Phase 4 (Config) of the ROME methodology. It transforms design artifacts into ready-to-code project infrastructure, enabling P5 robots to start implementation immediately.

## Version

1.0.0

## Agents

### Lucien (DevOps Engineer)
- **Role**: Execute Phase 4 configuration activities
- **Responsibilities**: Workspace scaffolding, environment configuration, CI/CD pipeline setup, build system configuration, data workspace preparation
- **Location**: `agents/lucien/AGENT.md`

## Skills

### Tier 1 Skills

- **scaffold-workspace**: Create workspace directory structure from actionlist.md
- **configure-environment**: Generate environment configuration files (dev, test, staging, prod)
- **setup-cicd-pipeline**: Create CI/CD pipeline configuration (GitHub Actions, GitLab CI, CircleCI, Jenkins)
- **configure-build-system**: Set up build tools and configuration
- **setup-test-framework**: Configure testing frameworks
- **validate-workspace-structure**: Verify scaffolding completeness
- **generate-technical-specs**: Document technical implementation details
- **create-scaffolding-manifest**: Document all created artifacts

## Dependencies

### Required
- **rome-core@^1.0.0**: Foundation libraries, orchestrator, activity logging

### Peer Dependencies
- **rome-p3-design@>=1.0.0**: Design phase outputs (tech stack, actionlist, architecture)

## Installation

```bash
npm install rome-p4-config
```

## Usage

This plugin is activated during Phase 4 when Roma assigns Lucien to execute configuration activities.

### Typical Workflow

1. **Entry Criteria**: GATE-P3 approved, phase3-handover.md available
2. **Lucien reads P3 outputs**: tech-stack.yaml, actionlist.md, system-architecture.md, data-dictionary.yaml
3. **Step 1**: Create technical specifications
4. **Step 2**: Scaffold workspaces (root only, P5 creates internal structure)
5. **Step 3**: Prepare data workspace structure for Ashok
6. **Step 4**: Configure CI/CD pipelines
7. **Step 5**: Configure environments (dev, test, staging, prod)
8. **Step 6**: Create scaffolding manifest
9. **Step 7**: Prepare phase4-handover.md for P5 robots
10. **Exit Criteria**: All workspaces scaffolded, GATE-P4 approved

### Invoking Skills

Skills are invoked via slash commands:

```bash
/scaffold-workspace \
  --actionlist_file ARTIFACTS/_design/design-decisions/actionlist.md \
  --tech_stack_file ARTIFACTS/_design/design-decisions/tech-stack.yaml

/configure-environment \
  --workspace SOURCE/api-workspace \
  --system_architecture_file ARTIFACTS/_design/architecture/system-architecture.md

/setup-cicd-pipeline \
  --platform github-actions \
  --enable_deployment true
```

## Outputs

Phase 4 produces the following artifacts:

### In `SOURCE/`
- Scaffolded workspace directories
- Project initialization files (package.json, etc.)
- Build configuration files
- Lint configuration files
- Test configuration files
- Environment templates (.env.example)

### In `ARTIFACTS/_config/`
- `technical-specs.md` - Detailed implementation specs
- `environment-config.md` - Environment configurations
- `scaffolding-manifest.md` - What was created, where
- `ci-cd-config.md` - Pipeline configuration docs
- `phase4-handover.md` - Handover for P5 robots

### CI/CD Files
- `.github/workflows/` (GitHub Actions)
- `.gitlab-ci.yml` (GitLab CI)
- `.circleci/config.yml` (CircleCI)
- `Jenkinsfile` (Jenkins)

## Important Notes

### Workspace Scaffolding Philosophy

Lucien scaffolds **workspace root only**:
- Creates root directory
- Initializes project (npm init, flutter create, etc.)
- Installs dependencies
- Creates root-level config files

Lucien does **NOT** create internal structure (`src/`, `tests/`, `lib/`, etc.). P5 robots (Ashok, Reena, Charlie) create their own directory layouts during feature implementation.

### Data Workspace

Lucien prepares data workspace structure:
- `migrations/` (Ashok creates migration files)
- `models/` (Ashok creates ORM models)
- `seeds/dev/` (Ashok creates dev seed data)
- `seeds/test/` (Ashok creates test seed data)
- `tests/` (Ashok creates database tests)
- `.env.example` (Lucien creates DB connection template)

## AORDL Integration

This plugin maintains traceability to AORDL requirements:

- REQ-### → Feature → Workspace structure
- Actor → Authentication config (JWT, OAuth, session)
- Invariants → Database constraint templates
- NonFunctional.Performance → Environment sizing (dev/staging/prod)
- NonFunctional.Security → Security config, secrets management
- Errors → Error logging configuration

## License

MIT

## Repository

https://github.com/rome-framework/rome-p4-config
