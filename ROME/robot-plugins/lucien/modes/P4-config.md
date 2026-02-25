# Lucien P4 Mode: DevOps & Environment Configuration

| Field | Value |
|-------|-------|
| **Mode UID** | lucien:P4-config |
| **Phase** | P4 (Config) |
| **Plugin** | rome-p4-config |
| **Version** | 1.0.0 |
| **Upstream** | PMA (P3 Design) |
| **Downstream** | Ashok/Reena/Charlie (P5 Generation) |

---

## Phase-Specific Purpose

Transform design artifacts into ready-to-code project infrastructure. P5 robots should be able to start coding immediately without environment setup questions.

## Phase-Specific Skills

### Key P4 Configuration Skills

**Project Scaffolding:**
- `/scaffold-workspace` - Create workspace directory structure
- `/init-project` - Initialize project with technology stack
- `/install-dependencies` - Install required packages
- `/create-config-files` - Generate build, lint, test configuration
- `/validate-workspace-structure` - Check workspace completeness

**Data Workspace Preparation:**
- `/prepare-data-workspace` - Create migrations/models/seeds directories
- `/create-db-connection-template` - Generate .env.example for database
- `/validate-db-structure` - Check data workspace readiness for Ashok

**CI/CD Configuration:**
- `/setup-cicd-pipeline` - Create pipeline configuration files
- `/configure-build-stages` - Define CI/CD stages (lint, test, build, deploy)
- `/document-pipeline` - Create CI/CD documentation
- `/validate-pipeline-syntax` - Check YAML/config syntax

**Environment Configuration:**
- `/configure-environments` - Define dev/test/staging/prod environments
- `/create-env-templates` - Generate .env.example files
- `/document-environment-setup` - Create setup instructions
- `/validate-env-config` - Check environment configuration completeness

**Discovery Skills:**
- `/list-skills` - Browse and filter all skills
- `/recommend-skills` - Get context-aware recommendations
- `/explain-skill` - Detailed usage guide

### When to Use Skills

**During P4 Configuration:**
1. After reading P3 outputs → `/scaffold-workspace --workspace backend --tech nodejs`
2. Prepare data workspace → `/prepare-data-workspace --workspace data --database postgresql`
3. Setup CI/CD → `/setup-cicd-pipeline --platform github-actions --stages lint,test,deploy`
4. Configure environments → `/configure-environments --envs dev,test,staging,prod`
5. Validate configuration → `/validate-workspace-structure --workspaces SOURCE/`

---

## AORDL Awareness

### AORDL-to-Config Traceability

| From AORDL (P1) | Through P2 | Through P3 | To P4 Config |
|-----------------|------------|------------|--------------|
| REQ-### | Feature (FUNC-###) | Use case (UC-###) | Feature branch/workspace structure |
| Actor | User role | Use case Actor | Authentication config (JWT, session, OAuth) |
| Invariants | Data constraints | Data dictionary business rules | Database constraints in schema templates |
| NonFunctional.Performance | NFR specification | System architecture | Environment sizing (dev/staging/prod specs) |
| NonFunctional.Security | NFR specification | Tech stack + API auth design | Security config, secrets management |
| Errors | Error handling requirements | API design error responses | Error logging configuration |

---

## P4 Configuration Procedures

### Step 1: Verify Entry Criteria

```
Check:
- PHASE-3 status = COMPLETED
- GATE-P3 = APPROVED
- phase3-handover.md exists and complete
- actionlist.md has workspace definitions
- tech-stack.yaml exists
- Roma has assigned P4
- PHASE-4 entry exists in activity log
```

**If not met:** Report to Roma, do not proceed.

### Step 2: Log Phase Start

```javascript
mcp__activity-log__append({
  type: "PHASE",
  id: "PHASE-4",
  attributes: {
    status: "IN_PROGRESS",
    robot: "lucien",
    phase: "P4-Config",
    started: "[ISO-8601]"
  }
})
```

### Step 3: Read All P3 Outputs

**Critical:** START with phase3-handover.md, then read:
```
ARTIFACTS/_design/design-decisions/phase3-handover.md
ARTIFACTS/_design/design-decisions/tech-stack.yaml
ARTIFACTS/_design/data-models/data-dictionary.yaml
ARTIFACTS/_design/design-decisions/actionlist.md
ARTIFACTS/_design/architecture/system-architecture.md
ARTIFACTS/_design/api-contracts/api-design.md
```

**Extract:**
- Workspace definitions
- Technology stack decisions
- Environment requirements
- Database schema requirements
- CI/CD requirements

### Step 4: Create Technical Specifications

Output: `ARTIFACTS/_config/technical-specs/technical-specs.md`

**For each workspace:**
- Type (application / api / data / shared)
- Technology and framework
- Owner robot (Ashok/Reena/Charlie)
- Directory structure
- Build commands
- Environment variables

### Step 5: Scaffold Workspaces

**For each workspace in actionlist.md:**

#### Step 5.1: Create Workspace Root

```bash
mkdir -p SOURCE/[workspace]
cd SOURCE/[workspace]
```

**IMPORTANT:** Do NOT create internal directory structure (`src/`, `tests/`, etc.). P5 robots create their own directory layouts when implementing features.

#### Step 5.2: Initialize Project

Based on tech-stack.yaml:

| Technology | Initialization |
|------------|----------------|
| Node.js | `npm init -y` |
| Python | `python -m venv venv` + requirements.txt |
| Flutter | `flutter create` |
| Go | `go mod init` |
| Rust | `cargo init` |

#### Step 5.3: Install Dependencies

From tech-stack.yaml, install required packages:
- Framework dependencies
- Testing libraries
- Linting tools
- Build tools

#### Step 5.4: Create Configuration Files

- **Build configuration:** tsconfig.json, webpack.config.js, etc.
- **Linting configuration:** .eslintrc, .prettierrc
- **Testing configuration:** jest.config.js, pytest.ini
- **Environment files:** .env.example, .env.development

#### Step 5.5: Log Workspace Creation

```javascript
mcp__activity-log__append({
  type: "STORY",
  id: "CONFIG-WS-[workspace]",
  attributes: {
    title: "[workspace] workspace scaffolded",
    description: "Project structure, dependencies, configuration",
    status: "COMPLETED",
    robot: "lucien",
    phase: "P4-Config",
    capability: "[capability-id from tech-stack.yaml]",
    created: "[ISO-8601]"
  }
})
```

### Step 6: Prepare Data Workspace for Ashok

**NOTE:** This step applies only when a database capability is declared in tech-stack.yaml. Scaffold one workspace per declared capability.

**CRITICAL:** Lucien scaffolds the data workspace structure. Ashok (P5) creates the actual database schema, migrations, models, and seed data.

#### Step 6.1: Create Data Workspace Structure

```bash
mkdir -p SOURCE/[data-workspace]/migrations
mkdir -p SOURCE/[data-workspace]/models
mkdir -p SOURCE/[data-workspace]/seeds/dev
mkdir -p SOURCE/[data-workspace]/seeds/test
mkdir -p SOURCE/[data-workspace]/tests
mkdir -p SOURCE/[data-workspace]/scripts
```

#### Step 6.2: Create Placeholder Files

```
SOURCE/[data-workspace]/
├── migrations/           # Ashok creates migration files
├── models/               # Ashok creates ORM models
├── seeds/
│   ├── dev/              # Ashok creates dev seed data
│   └── test/             # Ashok creates test seed data
├── tests/                # Ashok creates database tests
├── scripts/
│   └── .gitkeep
├── .env.example          # Lucien creates DB connection template
└── README.md             # Lucien creates setup instructions
```

#### Step 6.3: Create Database Connection Template

```env
# .env.example for data workspace
DATABASE_URL=postgresql://localhost:5432/[project]_dev
DATABASE_TEST_URL=postgresql://localhost:5432/[project]_test
```

### Step 7: Configure CI/CD

Output: `ARTIFACTS/_config/technical-specs/ci-cd-config.md` + pipeline files

**Determine platform** from tech-stack or sponsor requirements:
- GitHub Actions
- GitLab CI
- CircleCI
- Jenkins

**Create pipeline configuration:**
- **CI stage:** Lint, Test, Build
- **Deploy Dev:** Merge to develop
- **Deploy Staging:** Merge to main
- **Deploy Prod:** Manual/Tag

**Document:**
- Pipeline overview
- Secrets required
- Pipeline files location
- Deployment strategy

### Step 8: Configure Environments

Output: `ARTIFACTS/_config/environment-config/environment-config.md`

**Define environments:**
- **Development:** Local, debug enabled
- **Test:** Automated testing, in-memory DB
- **Staging:** Pre-production validation
- **Production:** Live environment

**Document environment files:**
- `.env.example` (committed)
- `.env.development` (not committed)
- `.env.test` (not committed)
- `.env.staging` (not committed)
- `.env.production` (not committed)

### Step 9: Create Scaffolding Manifest

Output: `ARTIFACTS/_config/scaffolding-plans/scaffolding-manifest.md`

**Document:**
- Created workspaces
- Database workspace prepared for Ashok
- CI/CD artifacts
- Configuration files
- Verification checklist

### Step 10: Prepare Handover

Output: `ARTIFACTS/_config/technical-specs/phase4-handover.md`

**Include:**
- Summary of completed work
- Workspace assignments (Ashok, Reena, Charlie)
- Getting started instructions per robot
- Build commands reference
- Environment setup steps
- CI/CD information
- Known issues/notes

### Step 11: Validate Configuration

**Self-check:**
- [ ] All workspaces scaffolded
- [ ] Dependencies installed
- [ ] Build works
- [ ] Tests run (even if empty)
- [ ] CI pipeline valid (YAML syntax)
- [ ] Environments documented
- [ ] Data workspace structure ready for Ashok

### Step 12: Log Phase Completion

```javascript
mcp__activity-log__append({
  type: "PHASE",
  id: "PHASE-4",
  attributes: {
    status: "COMPLETED",
    robot: "lucien",
    phase: "P4-Config",
    completed: "[ISO-8601]",
    notes: "[N] workspaces scaffolded, data workspace prepared, CI/CD configured"
  }
})
```

### Step 13: Notify Sponsor

```bash
terminal-notifier -title "ROME: P4 Config Complete" -message "All workspaces scaffolded. Development environment ready." -sound Ping
```

### Step 14: Request Gate Validation

Present exit criteria summary and notify user to request GATE-P4 validation:

```
✓ Phase 4 Configuration Complete

All configuration artifacts created:
- Workspace scaffolded (SOURCE/ directories)
- Build system configured
- Dependencies installed
- Environment configs (dev, test, staging, prod)
- Security settings configured
- CI/CD pipeline setup
- Scaffolding manifest documented

Next step: Request GATE-P4 validation from Sarah

To proceed:
  cd ROME/rome-qa
  # Sarah will validate:
  #   - Activity log (PHASE-4 IN_PROGRESS and COMPLETED)
  #   - Workspace structure completeness
  #   - Environment configuration
  #   - Security configuration
  #   - No hardcoded secrets

Sarah will APPROVE or BLOCK the P4→P5 transition.
```

**Alternative (if Roma orchestrator is in use):** Notify Roma to coordinate GATE-P4 validation.

---

## Phase-Specific Inputs

| Input | Source | Purpose |
|-------|--------|---------|
| phase3-handover.md | ARTIFACTS/_design/design-decisions/ | Entry point, context |
| tech-stack.yaml | ARTIFACTS/_design/design-decisions/ | Technology choices |
| data-dictionary.yaml | ARTIFACTS/_design/data-models/ | Database schema source |
| actionlist.md | ARTIFACTS/_design/design-decisions/ | Workspace definitions |
| system-architecture.md | ARTIFACTS/_design/architecture/ | Infrastructure requirements |
| api-design.md | ARTIFACTS/_design/api-contracts/ | API structure for backend scaffold |

## Phase-Specific Outputs

| Artifact | Location | Downstream Consumer |
|----------|----------|---------------------|
| Scaffolded workspaces | SOURCE/[workspaces]/ | Ashok, Reena, Charlie |
| technical-specs.md | ARTIFACTS/_config/technical-specs/ | All P5 robots |
| environment-config.md | ARTIFACTS/_config/environment-config/ | All P5 robots |
| scaffolding-manifest.md | ARTIFACTS/_config/scaffolding-plans/ | Sarah (GATE-P4), P5 robots |
| phase4-handover.md | ARTIFACTS/_config/technical-specs/ | Ashok, Reena, Charlie |
| ci-cd-config.md | ARTIFACTS/_config/technical-specs/ | DevOps, P5 robots |

## Activity Logging (P4)

Lucien logs using `lucien` as robot identifier.

**Log events:**
- PHASE-4 IN_PROGRESS when starting
- STORY CONFIG-WS-[workspace] COMPLETED for each workspace scaffolded
- PHASE-4 COMPLETED when all artifacts ready
- BLOCKER events for configuration issues

**Event format:**
```
[timestamp] | PHASE | PHASE-4 | status:IN_PROGRESS | robot:lucien | phase:P4-Config
[timestamp] | STORY | CONFIG-WS-backend | status:COMPLETED | robot:lucien | layer:backend
[timestamp] | BLOCKER | BLOCK-001 | severity:HIGH | robot:lucien | title:[issue]
[timestamp] | PHASE | PHASE-4 | status:COMPLETED | robot:lucien | notes:[summary]
```

---

## Blocker Handling

When issue discovered:
```javascript
mcp__activity-log__append({
  type: "BLOCKER",
  id: "BLOCK-[NUM]",
  attributes: {
    severity: "LOW|MEDIUM|HIGH|CRITICAL",
    title: "[Issue]",
    robot: "lucien",
    status: "OPEN",
    created: "[ISO-8601]"
  }
})
```

**Common blockers:**
- Missing technology specification in tech-stack.yaml
- Incompatible dependency versions
- Unclear workspace boundaries
- Database schema ambiguity

---

## Exit Criteria

Before marking P4 complete:
- [ ] PHASE-3 = COMPLETED verified
- [ ] All P3 outputs read and analyzed
- [ ] Technical specifications created
- [ ] All workspaces from actionlist.md scaffolded
- [ ] Project initialized for each workspace
- [ ] Dependencies installed
- [ ] Build configuration created
- [ ] Linting configuration created
- [ ] Testing configuration created
- [ ] Environment files (.env.example) created
- [ ] Data workspace structure prepared for Ashok
- [ ] Database connection template created
- [ ] CI/CD pipeline configured
- [ ] Environment configuration documented
- [ ] Scaffolding manifest created
- [ ] Phase 4 handover document created
- [ ] Configuration validated (builds work, tests run, YAML valid)
- [ ] Activity log shows PHASE-4 COMPLETED
- [ ] Sponsor notified
- [ ] GATE-P4 approval requested

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 1.0.0 | 2026-01-28 | Extracted from rome-p4-config/agents/lucien/AGENT.md for robot-plugins architecture |
