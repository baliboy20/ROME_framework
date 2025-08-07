# ROME CI/CD Guide
## GitHub Actions Integration for TDD-ROME Projects

### Overview

GitHub Actions provides automated enforcement of ROME's TDD methodology, ensuring that quality gates are maintained throughout the development process. This integration prevents the integration failures that occurred in our test project (21% API failure rate).

---

## CI/CD Pipeline Architecture

### Pipeline Structure
```
Pull Request → Contract Tests → Robot Tests → Roma Enforcement → Integration Tests
                    ↓              ↓              ↓                ↓
               Verify TDD     Individual     Coverage &        Cross-system
               Compliance     Robot Tests    Quality Gates     Validation
                                ↓
                         Merge to Main
                                ↓
                    Staging Deploy → Production Deploy
                            ↓              ↓
                    Smoke Tests    Final Validation
```

---

## Workflow Components

### 1. Contract Test Enforcement (`contract-tests.yml`)
**Purpose**: Enforces TDD-ROME contract-first development

**Triggers**:
- Pull requests to main/develop
- Pushes to main/develop

**Key Validations**:
- Contract tests exist for new features
- Contract tests run before implementation tests
- Contract test integrity (not modified to pass)
- Test-first compliance checking

```yaml
# Example contract test validation
- name: Check Contract Tests Exist
  run: |
    # Verify contract tests exist for new controllers/models
    NEW_FILES=$(git diff --name-only origin/main..HEAD | grep -E '(controllers|models)')
    for file in $NEW_FILES; do
      CONTRACT_FILE="SOURCE/tests/contracts/$(basename $file .js).contract.test.js"
      if [ ! -f "$CONTRACT_FILE" ]; then
        echo "❌ Missing contract test: $CONTRACT_FILE"
        exit 1
      fi
    done
```

### 2. Robot-Specific Tests (`robot-tests.yml`)
**Purpose**: Individual robot test validation with parallel execution

**Robot Test Gates**:
- **Luc (Infrastructure)**: Environment validation, database connectivity
- **Ashok (Database)**: Schema tests, migration validation, model integrity
- **Reena (Backend)**: API tests, integration tests, coverage validation
- **Charlie (Frontend)**: Flutter tests, widget tests, macOS build validation

**Smart Change Detection**:
```yaml
- uses: dorny/paths-filter@v2
  with:
    filters: |
      backend:
        - 'SOURCE/backend/**'
      frontend:
        - 'SOURCE/frontend/**'
```

**Coverage Requirements**: 80% minimum for each robot

### 3. Roma Test Enforcement (`roma-enforcement.yml`)
**Purpose**: Central quality gate enforcement

**Roma's Responsibilities**:
- Contract compliance verification (80% threshold)
- Cross-robot coverage aggregation
- Integration test coordination
- Final deployment approval

**Quality Gates**:
```yaml
# Roma's quality gate checks
- Contract compliance ≥ 80%
- Backend coverage ≥ 80%
- Frontend coverage ≥ 80%
- Integration tests passing
- No skipped contract tests
```

**PR Comments**: Automatic quality reports on pull requests

### 4. Integration Test Matrix (`integration-tests.yml`)
**Purpose**: Cross-system integration validation

**Test Suites**:
- **API-Database**: Backend with MongoDB integration
- **Frontend-API**: Flutter with backend API calls
- **File Upload**: Complete file handling workflow
- **End-to-End**: Full user scenarios

**Parallel Execution**: All integration suites run simultaneously

### 5. Deployment Pipeline (`deploy.yml`)
**Purpose**: Production deployment with quality gates

**Deployment Stages**:
1. **Pre-deploy Validation**: Roma's final quality check
2. **Build Artifacts**: Backend (Node.js) and Frontend (Flutter macOS)
3. **Staging Deployment**: Smoke tests and validation
4. **Production Deployment**: Blue-green deployment simulation

**Roma's Deployment Gates**:
- All robot tests passing
- Coverage requirements met
- Integration tests successful
- Contract integrity verified
- Security audit clean

---

## Implementation Guide

### 1. Project Setup

**Required Directory Structure**:
```
.github/workflows/          # GitHub Actions workflows
├── contract-tests.yml
├── robot-tests.yml
├── roma-enforcement.yml
├── integration-tests.yml
└── deploy.yml

scripts/                    # Helper scripts
├── verify-contract-tests.sh
├── aggregate-coverage.sh
└── verify-contract-integrity.sh

SOURCE/tests/contracts/     # Contract tests
├── api/
├── database/
└── ui/
```

**Package.json Scripts** (Backend):
```json
{
  "scripts": {
    "test": "jest",
    "test:contracts": "jest --testPathPattern=contracts",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration",
    "test:coverage": "jest --coverage"
  }
}
```

### 2. Branch Protection Rules

Configure GitHub branch protection:
```yaml
# .github/branch-protection.yml
protection_rules:
  main:
    required_status_checks:
      - "Contract Test Enforcement"
      - "Roma Test Enforcement"
      - "Integration Tests"
    enforce_admins: true
    required_pull_request_reviews:
      required_approving_review_count: 1
    restrictions: null
```

### 3. Environment Setup

**GitHub Secrets**:
- `CODECOV_TOKEN`: Coverage reporting
- `STAGING_DEPLOY_KEY`: Staging deployment
- `PRODUCTION_DEPLOY_KEY`: Production deployment

**Environment Variables**:
```yaml
env:
  NODE_VERSION: '18'
  FLUTTER_VERSION: '3.16.0'
  MONGODB_URI: mongodb://localhost:27017/test_db
```

---

## Workflow Examples

### Contract-First Development Flow
```bash
# 1. Developer creates feature branch
git checkout -b feature/user-authentication

# 2. Write contract tests FIRST
mkdir -p SOURCE/tests/contracts/api
cat > SOURCE/tests/contracts/api/auth.contract.test.js << EOF
describe('Authentication API Contract', () => {
  it('should authenticate user with valid credentials', async () => {
    // Contract test defines expected API behavior
  });
});
EOF

# 3. Commit contract tests
git add SOURCE/tests/contracts/api/auth.contract.test.js
git commit -m "Add authentication API contract tests"

# 4. Push - triggers contract-tests.yml
git push origin feature/user-authentication

# 5. GitHub Actions validates:
#    ✅ Contract tests exist
#    ✅ Contract tests are failing (red phase)
#    ✅ No implementation without contracts

# 6. Implement feature to pass contract tests
# ... implementation code ...

# 7. Push implementation - triggers all workflows
git push origin feature/user-authentication

# 8. GitHub Actions runs:
#    ✅ Contract tests (should now pass)
#    ✅ Robot-specific tests
#    ✅ Roma enforcement
#    ✅ Integration tests

# 9. Create PR - Roma comments with quality report
# 10. Merge when all checks pass
```

### Roma's Quality Report Example
```markdown
## 🤖 Roma's Test Enforcement Report ✅

### Test Coverage Analysis
| Robot | Coverage | Status |
|-------|----------|--------|
| 🔧 Luc (Infrastructure) | Contract: 85% | ✅ |
| 🗄️ Ashok (Database) | 92% | ✅ |
| ⚙️ Reena (Backend) | 87% | ✅ |
| 🎨 Charlie (Frontend) | 83% | ✅ |

### Integration Tests
✅ Integration Status: passed

### Roma's Verdict: ✅ APPROVED

🚀 **All quality gates passed!** Ready for merge and deployment.
```

---

## Benefits for ROME Projects

### 1. **Prevents Integration Failures**
- Contract tests catch interface mismatches before merge
- Integration matrix validates cross-system compatibility
- Roma's enforcement prevents deployment of untested code

### 2. **Enforces TDD Compliance**
- No implementation without failing tests first
- Contract integrity verification prevents test weakening
- Coverage requirements ensure comprehensive testing

### 3. **Parallel Development Safety**
- Robot-specific workflows prevent conflicts
- Change detection runs only relevant tests
- Integration tests validate cross-robot compatibility

### 4. **Automated Quality Gates**
- Roma's enforcement eliminates manual review overhead
- Consistent quality standards across all robots
- Deployment blocked until quality requirements met

### 5. **Measurable Quality Metrics**
- Coverage tracking per robot
- Contract compliance scoring
- Integration success rates
- Deployment quality gates

---

## Monitoring and Metrics

### Quality Dashboards
Track key metrics:
- **First-time Success Rate**: % of PRs passing all checks initially
- **Integration Failure Rate**: Cross-system test failures
- **Coverage Trends**: Per-robot coverage over time
- **Contract Compliance**: TDD adherence percentage
- **Deployment Success**: Production deployment success rate

### Alerts and Notifications
- **Coverage Drops**: Alert when robot coverage falls below 80%
- **Integration Failures**: Immediate notification of cross-system issues
- **Contract Violations**: TDD compliance violations
- **Deployment Blocks**: When Roma prevents deployment

---

## Migration Guide

### For Existing ROME Projects
1. **Add Workflows**: Copy workflow files to `.github/workflows/`
2. **Create Contracts**: Write contract tests for existing APIs
3. **Update Scripts**: Add test scripts to package.json
4. **Configure Branch Protection**: Enable required status checks
5. **Train Team**: Ensure robots understand TDD-ROME workflow

### For New ROME Projects
1. **Use Template**: Start with ROME-CI template repository
2. **Define Contracts**: Create contract tests during architecture phase
3. **Configure Environments**: Set up staging/production environments
4. **Enable Monitoring**: Set up coverage and quality dashboards

---

## Troubleshooting

### Common Issues

**Contract Tests Not Found**:
```bash
❌ Missing contract tests directory
📝 Create SOURCE/tests/contracts/ with API and database contract tests
```
*Solution*: Create contract test directory and add tests before implementation

**Coverage Below Threshold**:
```bash
❌ Backend coverage 75% < 80% - deployment blocked
```
*Solution*: Add unit tests to meet 80% minimum coverage

**Integration Test Failures**:
```bash
🚨 Integration test failed: api-database
```
*Solution*: Check API compatibility with database schema

**TDD Compliance Violations**:
```bash
⚠️ Both contract tests and implementation modified in same PR
```
*Solution*: Separate contract definition from implementation commits

---

## Conclusion

The ROME CI/CD integration transforms the methodology from "hope tests pass" to "guaranteed tests pass before merge." By automating Roma's enforcement role, we eliminate the manual overhead while ensuring consistent quality standards.

**Expected Results**:
- Integration failures: 21% → <5%
- Rework cycles: Eliminated through contract-first development
- Deployment confidence: 100% through automated quality gates
- Development velocity: Increased through parallel, validated development