# ROME GitHub Actions CI/CD

This directory contains GitHub Actions workflows that automate the ROME (Robot Methodology) development process with TDD enforcement.

## Workflows Overview

### 🔒 Contract Test Enforcement (`contract-tests.yml`)
**Triggers**: PR to main/develop, push to main/develop  
**Purpose**: Enforces test-driven development through contract validation

- ✅ Verifies contract tests exist before implementation
- ✅ Validates contract test quality and assertions
- ✅ Prevents TDD violations (implementation without tests)
- ✅ Checks contract test integrity

### 🤖 Robot Test Gates (`robot-tests.yml`) 
**Triggers**: Changes to SOURCE/ directories  
**Purpose**: Individual robot test validation with smart change detection

- **Luc (Infrastructure)**: Environment validation, database connectivity
- **Ashok (Database)**: Schema tests, migrations, model validation  
- **Reena (Backend)**: API tests, integration tests, 80% coverage
- **Charlie (Frontend)**: Flutter tests, widget tests, macOS builds

### 🚨 Roma Test Enforcement (`roma-enforcement.yml`)
**Triggers**: All PRs and main branch pushes  
**Purpose**: Central quality gate enforcement and reporting

- 📊 Aggregates coverage from all robots
- 🔍 Contract compliance verification (≥80%)
- 🧪 Integration test coordination
- 💬 Automated PR quality reports
- 🚫 Blocks deployment if quality gates fail

### 🔗 Integration Test Matrix (`integration-tests.yml`)
**Triggers**: PRs and main branch pushes  
**Purpose**: Cross-system integration validation

Test Suites:
- **api-database**: Backend + MongoDB integration
- **frontend-api**: Flutter + Backend API calls
- **file-upload**: Complete file handling workflow
- **end-to-end**: Full user scenario testing

### 🚀 Deployment Pipeline (`deploy.yml`)
**Triggers**: Main branch pushes, version tags  
**Purpose**: Automated deployment with quality gates

Stages:
1. **Pre-deploy Validation**: Roma's final quality check
2. **Build Artifacts**: Backend (Node.js) + Frontend (Flutter)
3. **Staging Deploy**: Smoke tests and validation
4. **Production Deploy**: Blue-green deployment

## Setup Instructions

### 1. Required Repository Structure
```
.github/workflows/          # These workflow files
scripts/                    # Helper scripts for CI/CD
SOURCE/
├── backend/               # Node.js backend code
├── frontend/              # Flutter frontend code
├── database/              # Database schemas and migrations
├── infrastructure/        # Infrastructure configuration
└── tests/
    └── contracts/         # Contract tests (REQUIRED)
        ├── api/
        ├── database/
        └── ui/
```

### 2. Branch Protection Setup
Configure branch protection rules:
- Require status checks: `Contract Test Enforcement`, `Roma Test Enforcement`
- Require PR reviews: 1+ approving reviews
- Dismiss stale reviews when new commits are pushed

### 3. Environment Variables
Set up repository secrets:
```
CODECOV_TOKEN=<coverage_reporting_token>
STAGING_DEPLOY_KEY=<staging_deployment_key>
PRODUCTION_DEPLOY_KEY=<production_deployment_key>
```

### 4. Package.json Scripts (Backend)
Add test scripts to SOURCE/backend/package.json:
```json
{
  "scripts": {
    "test": "jest",
    "test:contracts": "jest --testPathPattern=contracts",
    "test:unit": "jest --testPathPattern=unit", 
    "test:integration": "jest --testPathPattern=integration",
    "test:coverage": "jest --coverage --coverageReporters=lcov"
  }
}
```

## Workflow Behavior

### Contract-First Development Flow
1. **Developer creates PR** → `contract-tests.yml` runs
2. **Verifies contract tests exist** for new features
3. **Validates TDD compliance** (tests before implementation)
4. **Robot-specific tests run** based on changed files
5. **Roma aggregates results** and reports quality metrics
6. **Integration tests validate** cross-system compatibility
7. **PR blocked if quality gates fail**

### Quality Gates
Roma enforces these requirements:
- ✅ Contract compliance ≥ 80%
- ✅ Test coverage ≥ 80% per robot
- ✅ All integration tests passing
- ✅ No skipped contract tests
- ✅ Contract integrity maintained

### Deployment Gates  
Production deployment requires:
- ✅ All robot tests passing
- ✅ Coverage requirements met
- ✅ Integration tests successful
- ✅ Security audit clean
- ✅ Staging deployment successful

## Roma's Automated Reports

Roma posts quality reports on every PR:

```markdown
## 🤖 Roma's Test Enforcement Report ✅

### Test Coverage Analysis
| Robot | Coverage | Status |
|-------|----------|--------|
| 🔧 Luc (Infrastructure) | 85% | ✅ |
| 🗄️ Ashok (Database) | 92% | ✅ |  
| ⚙️ Reena (Backend) | 87% | ✅ |
| 🎨 Charlie (Frontend) | 83% | ✅ |

### Roma's Verdict: ✅ APPROVED
🚀 All quality gates passed! Ready for merge.
```

## Benefits

- **Prevents Integration Failures**: Contract tests catch issues before merge
- **Enforces TDD**: No implementation without failing tests first
- **Automated Quality**: Roma's standards enforced automatically
- **Parallel Safety**: Robot-specific workflows prevent conflicts
- **Deployment Confidence**: Quality gates ensure production readiness

## Troubleshooting

### Common Issues

**"Missing contract tests directory"**
```bash
mkdir -p SOURCE/tests/contracts/{api,database,ui}
```

**"Coverage below 80%"**  
Add unit tests to meet minimum coverage threshold.

**"Integration test failed"**
Check API compatibility between frontend and backend.

**"Contract integrity issues"**
Ensure contract tests weren't modified to make them pass.

## Support

- 📖 See [ROME_CICD_GUIDE.md](../ROME/ROME_CICD_GUIDE.md) for detailed documentation
- 🔧 Check [scripts/](scripts/) directory for helper utilities
- 🤖 Roma's automated reports provide specific guidance for issues