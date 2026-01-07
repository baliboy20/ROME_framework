# setup-cicd-pipeline

## Metadata
- **Skill ID**: setup-cicd-pipeline
- **Version**: 1.0.0
- **Tier**: 1
- **Phase**: P4 (Config)
- **Category**: CI/CD Configuration
- **Plugin**: rome-p4-config@1.0.0

## Description

Creates CI/CD pipeline configuration for continuous integration and deployment. Supports GitHub Actions, GitLab CI, CircleCI, and Jenkins. Configures stages for linting, testing, building, and deployment across environments.

## Parameters

### Required
- `platform` (string): CI/CD platform
  - Options: github-actions, gitlab-ci, circleci, jenkins

### Optional
- `tech_stack_file` (string): Path to tech-stack.yaml from P3
  - Default: ARTIFACTS/03-design/design-decisions/tech-stack.yaml
- `output_doc` (string): Path to write ci-cd-config.md
  - Default: ARTIFACTS/04-config/technical-specs/ci-cd-config.md
- `enable_deployment` (boolean): Include deployment stages
  - Default: true

## Execution

- **Timeout**: 60000ms (60 seconds)
- **Retry**: Enabled
  - Max attempts: 2
  - Backoff: linear

## Output

Returns:
- `pipeline_created` (boolean): Whether pipeline was successfully created
- `platform` (string): CI/CD platform used
- `stages_configured` (array): List of pipeline stages (lint, test, build, deploy)
- `pipeline_file` (string): Path to created pipeline configuration file

## Usage Example

```bash
/setup-cicd-pipeline \
  --platform github-actions \
  --tech_stack_file ARTIFACTS/03-design/design-decisions/tech-stack.yaml \
  --enable_deployment true
```

## Dependencies

- rome-core@^1.0.0 (SkillInvoker, SkillRegistry)
- js-yaml (for YAML generation)
- node:fs (for file operations)

## Algorithm

1. Load tech-stack.yaml from P3
2. Determine CI/CD platform
3. Extract technology details:
   - Language/framework
   - Build commands
   - Test commands
   - Deployment targets
4. Generate pipeline configuration based on platform:
   - **GitHub Actions**: `.github/workflows/ci.yml`
   - **GitLab CI**: `.gitlab-ci.yml`
   - **CircleCI**: `.circleci/config.yml`
   - **Jenkins**: `Jenkinsfile`
5. Configure pipeline stages:
   - **CI Stage**: Lint, Test, Build
   - **Deploy Dev**: Merge to develop branch
   - **Deploy Staging**: Merge to main branch
   - **Deploy Prod**: Manual trigger or tag
6. Document required secrets
7. Create ci-cd-config.md documentation
8. Write pipeline files

## Pipeline Stages

### CI (Continuous Integration)
- Trigger: Push or Pull Request
- Actions:
  - Checkout code
  - Setup runtime environment
  - Install dependencies
  - Run linter
  - Run tests
  - Build artifacts

### Deploy Dev
- Trigger: Merge to develop branch
- Actions:
  - Build
  - Deploy to dev environment
  - Run smoke tests

### Deploy Staging
- Trigger: Merge to main branch
- Actions:
  - Build
  - Deploy to staging environment
  - Run integration tests

### Deploy Prod
- Trigger: Manual approval or git tag
- Actions:
  - Build
  - Deploy to production environment
  - Run health checks

## Example GitHub Actions Pipeline

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Run linter
        run: npm run lint
      - name: Run tests
        run: npm test
      - name: Build
        run: npm run build
```

## CI/CD Configuration Documentation Schema

```markdown
# CI/CD Configuration

## Pipeline Overview

| Stage | Trigger | Actions |
|-------|---------|---------|
| CI | Push/PR | Lint, Test, Build |
| Deploy Dev | Merge to develop | Deploy to dev environment |
| Deploy Staging | Merge to main | Deploy to staging |
| Deploy Prod | Manual/Tag | Deploy to production |

## Secrets Required

| Secret | Purpose | Where to Set |
|--------|---------|--------------|
| AWS_ACCESS_KEY_ID | AWS deployment | Repository settings |
| DATABASE_URL_STAGING | Staging DB | Repository settings |
| DATABASE_URL_PROD | Production DB | Repository settings |

## Pipeline Files

| File | Purpose |
|------|---------|
| .github/workflows/ci.yml | Continuous integration |
| .github/workflows/deploy.yml | Deployment pipeline |
```

## Notes

- Integrates with Lucien's CI/CD configuration workflow (Step 7)
- Supports multiple CI/CD platforms
- Configures multi-stage pipelines (CI → Dev → Staging → Prod)
- Documents required secrets for deployment
- Creates both pipeline files and documentation
- Follows best practices for each platform

## Related Skills

- scaffold-workspace (Tier 1)
- configure-environment (Tier 1)
- validate-workspace-structure (Tier 1)
- execute-p4-config (Tier 2)

## Revision History

| Version | Date | Summary |
|---------|------|---------|
| 1.0.0 | 2026-01-07 | Skill definition created for rome-p4-config plugin |
