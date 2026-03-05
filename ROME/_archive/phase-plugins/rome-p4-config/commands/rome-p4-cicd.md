# /rome-p4:cicd

Configure CI/CD pipeline for continuous integration and deployment.

## Metadata
- **Command ID**: rome-p4:cicd
- **Version**: 1.0.0
- **Phase**: P4 (Config)
- **Agent**: Lucien
- **Plugin**: rome-p4-config@1.0.0

## Description

Creates CI/CD pipeline configuration for continuous integration and deployment. Supports GitHub Actions, GitLab CI, CircleCI, and Jenkins. Configures stages for linting, testing, building, and deployment across environments (dev, staging, prod).

## Usage

### GitHub Actions

```bash
/rome-p4:cicd --platform github-actions
```

### GitLab CI

```bash
/rome-p4:cicd --platform gitlab-ci
```

### CircleCI

```bash
/rome-p4:cicd --platform circleci
```

### Jenkins

```bash
/rome-p4:cicd --platform jenkins
```

### With Custom Tech Stack

```bash
/rome-p4:cicd \
  --platform github-actions \
  --tech_stack_file ARTIFACTS/_design/design-decisions/tech-stack.yaml
```

## Parameters

### Required
- `platform` (string): CI/CD platform
  - Options: `github-actions`, `gitlab-ci`, `circleci`, `jenkins`

### Optional
- `tech_stack_file` (string): Path to tech-stack.yaml from P3
  - Default: `ARTIFACTS/_design/design-decisions/tech-stack.yaml`
- `output_doc` (string): Path to write ci-cd-config.md
  - Default: `ARTIFACTS/_config/technical-specs/ci-cd-config.md`
- `enable_deployment` (boolean): Include deployment stages
  - Default: `true`

## Pipeline Stages

### CI Stage (Continuous Integration)
- **Trigger**: Push or Pull Request
- **Actions**:
  - Checkout code
  - Setup runtime environment
  - Install dependencies
  - Run linter
  - Run tests
  - Build artifacts

### Deploy Dev
- **Trigger**: Merge to develop branch
- **Actions**:
  - Build
  - Deploy to dev environment
  - Run smoke tests

### Deploy Staging
- **Trigger**: Merge to main branch
- **Actions**:
  - Build
  - Deploy to staging environment
  - Run integration tests

### Deploy Prod
- **Trigger**: Manual approval or git tag
- **Actions**:
  - Build
  - Deploy to production environment
  - Run health checks

## Created Files

### GitHub Actions
- `.github/workflows/ci.yml`
- `.github/workflows/deploy.yml`

### GitLab CI
- `.gitlab-ci.yml`

### CircleCI
- `.circleci/config.yml`

### Jenkins
- `Jenkinsfile`

## Documentation Output

Creates `ARTIFACTS/_config/technical-specs/ci-cd-config.md`:

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

## Example: GitHub Actions CI Pipeline

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

## Outputs

Returns:
- `pipeline_created` (boolean): Whether pipeline was successfully created
- `platform` (string): CI/CD platform used
- `stages_configured` (array): List of pipeline stages
- `pipeline_file` (string): Path to created pipeline configuration

## Notes

- Invokes `setup-cicd-pipeline` skill (Tier 1)
- Part of Lucien's Step 7 (Configure CI/CD)
- Follows best practices for each platform
- Documents required secrets
- Can be run standalone or as part of `/rome-p4:configure`
- Supports multi-stage deployments
