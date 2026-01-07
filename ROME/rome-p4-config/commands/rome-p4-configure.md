# /rome-p4:configure

Execute Phase 4 Configuration workflow with Lucien agent.

## Metadata
- **Command ID**: rome-p4:configure
- **Version**: 1.0.0
- **Phase**: P4 (Config)
- **Agent**: Lucien
- **Plugin**: rome-p4-config@1.0.0

## Description

Initiates the complete Phase 4 Configuration workflow. Lucien reads P3 outputs, scaffolds workspaces, prepares data workspace structure, configures CI/CD pipelines, sets up environments, and prepares handover for P5 robots.

## Usage

```bash
/rome-p4:configure
```

## Workflow Steps

1. **Verify Entry Criteria**
   - GATE-P3 approved
   - phase3-handover.md exists
   - actionlist.md has workspace definitions

2. **Log Phase Start**
   - Record PHASE-4 IN_PROGRESS in activity log

3. **Read P3 Outputs**
   - phase3-handover.md (entry point)
   - tech-stack.yaml
   - data-dictionary.yaml
   - actionlist.md
   - system-architecture.md
   - api-design.md

4. **Create Technical Specifications**
   - Document workspace details
   - Specify directory structure
   - Define build commands
   - List environment variables

5. **Scaffold Workspaces**
   - Create workspace root directories
   - Initialize projects (npm, flutter, etc.)
   - Install dependencies
   - Create configuration files
   - Log workspace creation

6. **Prepare Data Workspace for Ashok**
   - Create migrations/, models/, seeds/ directories
   - Create .env.example with DB connection template
   - Add README.md with setup instructions

7. **Configure CI/CD**
   - Generate pipeline configuration
   - Document required secrets
   - Create ci-cd-config.md

8. **Configure Environments**
   - Define dev, test, staging, prod environments
   - Create .env templates
   - Document environment setup

9. **Create Scaffolding Manifest**
   - List created workspaces
   - Document configurations
   - Provide verification checklist

10. **Prepare Handover**
    - Complete phase4-handover.md
    - Provide getting started instructions
    - Document known issues

11. **Validate Configuration**
    - Verify all workspaces scaffolded
    - Check dependencies installed
    - Validate build works
    - Confirm CI pipeline valid

12. **Log Phase Completion**
    - Record PHASE-4 COMPLETED

13. **Request Gate Review**
    - Present exit criteria to Roma
    - Initiate GATE-P4 (Sarah audit)

## Inputs

- `ARTIFACTS/_design/design-decisions/phase3-handover.md` - Entry point
- `ARTIFACTS/_design/design-decisions/tech-stack.yaml` - Technology choices
- `ARTIFACTS/_design/data-models/data-dictionary.yaml` - Database schema source
- `ARTIFACTS/_design/design-decisions/actionlist.md` - Workspace definitions
- `ARTIFACTS/_design/architecture/system-architecture.md` - Infrastructure requirements
- `ARTIFACTS/_design/api-contracts/api-design.md` - API structure

## Outputs

### In SOURCE/
- Scaffolded workspace directories with:
  - Project initialization files (package.json, etc.)
  - Build configuration files
  - Lint configuration files
  - Test configuration files
  - Environment templates (.env.example)

### In ARTIFACTS/_config/
- `technical-specs/technical-specs.md` - Implementation specifications
- `environment-config/environment-config.md` - Environment configurations
- `scaffolding-plans/scaffolding-manifest.md` - What was created
- `technical-specs/ci-cd-config.md` - Pipeline documentation
- `technical-specs/phase4-handover.md` - Handover for P5

### CI/CD Files
- `.github/workflows/ci.yml` (GitHub Actions)
- `.gitlab-ci.yml` (GitLab CI)
- `.circleci/config.yml` (CircleCI)
- `Jenkinsfile` (Jenkins)

## Related Commands

- `/rome-p4:scaffold` - Scaffold specific workspace
- `/rome-p4:cicd` - Configure CI/CD pipeline only

## Notes

- Requires GATE-P3 approval
- Scaffolds workspace root only (P5 creates internal structure)
- Prepares data workspace for Ashok (P5 creates schema/migrations/seeds)
- Maintains AORDL traceability
- Prepares for P5 (Generation)
