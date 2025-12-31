---
name: deployment-design
description: CI/CD pipeline design, deployment stages (local/staging/production), rollback procedures, monitoring. Use when creating deployment-plan.md. Defines Git workflow and quality gates. REQUIRES SPONSOR APPROVAL.
allowed-tools: [Bash, Read, Write, Glob]
---

# Deployment Design Skill

## Purpose

PMA's P3 deployment standards: CI/CD, staging, production, rollback. Output: deployment-plan.md for Lucien (P4 setup).

## When to Use

- Creating deployment-plan.md (P3 deliverable)
- Designing CI/CD pipeline
- Defining deployment stages
- Requires sponsor approval (CI/CD provider, hosting)

---

## Deployment Stages

### Standard 3-Stage Model

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    LOCAL    │ →  │   STAGING   │ →  │ PRODUCTION  │
│  (Developer)│    │ (Pre-prod)  │    │   (Live)    │
└─────────────┘    └─────────────┘    └─────────────┘
     Docker              Cloud             Cloud
   localhost:1337    staging-api.com    api.com
```

### Stage Characteristics

| Aspect | Local | Staging | Production |
|--------|-------|---------|------------|
| Purpose | Development | Pre-prod testing | Live users |
| Data | Synthetic (50 records) | Anonymized real (1000s) | Real data |
| URL | localhost:1337 | staging-api.example.com | api.example.com |
| Deploy | Manual (docker-compose) | Automated (Git push) | Automated (Git tag) |
| Secrets | .env.development | Server env vars | Secrets vault |
| Logs | Console (DEBUG) | File + CloudWatch (INFO) | CloudWatch (ERROR) |
| Monitoring | None | Basic health checks | Full APM + alerts |

---

## Git Workflow

### Branch Strategy (Git Flow)

```
main (production)
  ↑
  └── develop (staging)
        ↑
        ├── feature/project-management
        ├── feature/user-auth
        └── bugfix/login-error
```

**Branches**:
- `main`: Production-ready code (protected)
- `develop`: Integration branch for staging
- `feature/*`: Feature development
- `bugfix/*`: Bug fixes
- `hotfix/*`: Emergency production fixes

**Rules**:
- No direct commits to `main`
- No direct commits to `develop`
- All changes via Pull Requests
- PR requires:
  - All tests pass
  - Coverage ≥ 80%
  - 1+ approvals (if team > 1)
  - No merge conflicts

### Merge Flow

```
1. Create feature branch from develop
   git checkout -b feature/project-management develop

2. Develop + commit
   git add .
   git commit -m "feat: add project creation"

3. Push feature branch
   git push origin feature/project-management

4. Open Pull Request: feature/project-management → develop

5. CI/CD runs: lint, test, build

6. If pass: Merge to develop → Auto-deploy to staging

7. Test on staging

8. Open Pull Request: develop → main

9. CI/CD runs: lint, test, build

10. If pass: Merge to main → Auto-deploy to production
```

---

## CI/CD Pipeline Design

### Pipeline Stages

```
┌──────┐   ┌──────┐   ┌───────┐   ┌───────┐   ┌────────┐
│ Lint │ → │ Test │ → │ Build │ → │ Deploy│ → │ Verify │
└──────┘   └──────┘   └───────┘   └───────┘   └────────┘
```

### Stage Details

**1. Lint (2 min)**:
```yaml
Jobs:
  - flutter analyze (Dart linter)
  - npm run lint (ESLint for backend)
  - dart format --set-exit-if-changed (formatting)

Fail if:
  - Any lint errors
  - Code not formatted
```

**2. Test (5-10 min)**:
```yaml
Jobs:
  - Unit tests (flutter test)
  - Integration tests (backend API tests)
  - Schema validation (npm run validate:schema)
  - API contract tests (newman run)

Fail if:
  - Any test fails
  - Coverage < 80%
  - Smoke tests fail
```

**3. Build (3-5 min)**:
```yaml
Jobs:
  - flutter build web --release
  - docker build backend
  - docker build frontend

Fail if:
  - Build errors
  - Missing dependencies
```

**4. Deploy (2-5 min)**:
```yaml
Staging (develop branch):
  - Deploy backend to staging server
  - Deploy frontend to staging CDN
  - Run database migrations
  - Smoke test staging

Production (main branch):
  - Deploy backend to production server
  - Deploy frontend to production CDN
  - Run database migrations (with backup)
  - Smoke test production
  - Notify team (Slack/email)

Fail if:
  - Deployment errors
  - Migration fails
  - Smoke test fails
```

**5. Verify (1-2 min)**:
```yaml
Jobs:
  - Health check endpoint (/health)
  - Smoke test critical paths
  - Response time check (< 2s)

Fail if:
  - Health check fails
  - Smoke test fails
  - Response time > 2s
```

---

## CI/CD Provider Options

### REQUIRES SPONSOR APPROVAL

**Option 1: GitHub Actions (Recommended)**:
```yaml
Pros:
  - Free for public repos
  - 2000 min/month free (private repos)
  - Integrated with GitHub
  - YAML configuration

Cons:
  - Limited free minutes
  - Slow runners (public)

Cost: $0-$4/month (small team)
```

**Option 2: GitLab CI/CD**:
```yaml
Pros:
  - 400 min/month free
  - Built-in container registry
  - Good for monorepos

Cons:
  - Requires GitLab migration
  - Learning curve

Cost: $0-$19/user/month
```

**Option 3: CircleCI**:
```yaml
Pros:
  - Fast runners
  - Good caching
  - 6000 min/month free

Cons:
  - Complex config
  - Expensive beyond free tier

Cost: $0-$30/month
```

**Sponsor Decision**:
```markdown
## Sponsor Approval: CI/CD Provider

**Recommended**: GitHub Actions (integrated, cost-effective)

**Alternatives**: GitLab CI, CircleCI

**Decision**: [To be filled]
```

---

## GitHub Actions Template

### .github/workflows/ci.yml

```yaml
name: CI Pipeline

on:
  push:
    branches: [develop, main]
  pull_request:
    branches: [develop, main]

env:
  FLUTTER_VERSION: '3.16.0'
  NODE_VERSION: '20'

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Flutter
        uses: subosito/flutter-action@v2
        with:
          flutter-version: ${{ env.FLUTTER_VERSION }}

      - name: Lint Flutter
        run: |
          cd frontend
          flutter pub get
          flutter analyze
          dart format --set-exit-if-changed .

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Lint Backend
        run: |
          cd backend
          npm ci
          npm run lint

  test:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4

      - name: Setup Flutter
        uses: subosito/flutter-action@v2
        with:
          flutter-version: ${{ env.FLUTTER_VERSION }}

      - name: Unit Tests (Frontend)
        run: |
          cd frontend
          flutter pub get
          flutter test --coverage

      - name: Check Coverage
        run: |
          cd frontend
          lcov --summary coverage/lcov.info
          # Fail if coverage < 80%

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Integration Tests (Backend)
        run: |
          cd backend
          npm ci
          docker-compose -f ../docker/docker-compose.test.yml up -d
          npm run test:integration
          docker-compose -f ../docker/docker-compose.test.yml down

      - name: Schema Validation
        run: |
          cd backend
          npm run validate:schema

      - name: API Contract Tests
        run: |
          npm install -g newman
          newman run docs/api/postman/projects.json

  build:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4

      - name: Setup Flutter
        uses: subosito/flutter-action@v2
        with:
          flutter-version: ${{ env.FLUTTER_VERSION }}

      - name: Build Frontend
        run: |
          cd frontend
          flutter build web --release

      - name: Build Backend Docker Image
        run: |
          docker build -t backend:${{ github.sha }} -f docker/Dockerfile.backend .

  deploy-staging:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/develop'
    steps:
      - name: Deploy to Staging
        run: |
          # SSH to staging server
          # Pull latest code
          # Run migrations
          # Restart services
          # Smoke test
          echo "Deploy to staging"

  deploy-production:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to Production
        run: |
          # SSH to production server
          # Backup database
          # Pull latest code
          # Run migrations
          # Restart services
          # Smoke test
          # Notify team
          echo "Deploy to production"
```

---

## Rollback Procedures

### Automated Rollback Triggers

```yaml
Rollback if:
  - Health check fails (3 consecutive failures)
  - Error rate > 5% (within 5 minutes)
  - Response time > 5s (p95)
  - Database migration fails
```

### Manual Rollback

**Production rollback (max 15 minutes)**:

```bash
# 1. Identify last working version
git log --oneline main

# 2. Revert to previous commit
git revert <commit-hash>
git push origin main

# 3. CI/CD auto-deploys reverted version

# 4. Verify deployment
curl https://api.example.com/health

# 5. If database migration issue:
npm run migrate:rollback

# 6. Notify team
echo "Production rolled back to <commit-hash>"
```

### Rollback Checklist

- [ ] Identify root cause (logs, monitoring)
- [ ] Determine last working version (git log)
- [ ] Backup current database (before rollback)
- [ ] Revert code (git revert + push)
- [ ] Rollback database migrations (if needed)
- [ ] Verify health check passes
- [ ] Verify smoke tests pass
- [ ] Notify team + stakeholders
- [ ] Document incident (postmortem)

---

## Monitoring & Alerts

### Health Check Endpoint

```javascript
// backend/cloud/functions/health.js

Parse.Cloud.define('health', async (req) => {
  try {
    // Check database
    await new Parse.Query('User').limit(1).find({ useMasterKey: true });

    // Check Redis (if used)
    // await redis.ping();

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
});

// GET /parse/functions/health
```

### Monitoring Requirements

**Development**:
- None (console logs sufficient)

**Staging**:
- Health check monitoring (every 5 min)
- Basic error tracking

**Production**:
- Health check monitoring (every 1 min)
- Error tracking (e.g., Sentry)
- Performance monitoring (e.g., New Relic, Datadog)
- Uptime monitoring (e.g., Pingdom, UptimeRobot)
- Log aggregation (e.g., CloudWatch, Loggly)

### Alert Channels

**REQUIRES SPONSOR APPROVAL**:

```markdown
## Sponsor Decision: Alert Channels

**Options**:
1. Email only (free, slow response)
2. Slack + Email (recommended, fast response)
3. PagerDuty (enterprise, on-call rotation)

**Recommended**: Slack + Email for critical alerts

**Decision**: [To be filled]
```

---

## Disaster Recovery Plan

### Backup Strategy

```yaml
Database Backups:
  Frequency: Daily (3 AM UTC)
  Retention: 30 days
  Storage: S3 / Cloud Storage
  Encryption: AES-256
  Test restore: Monthly

Code Backups:
  Frequency: Every commit (Git)
  Retention: Indefinite
  Storage: GitHub

File Storage Backups:
  Frequency: Daily
  Retention: 30 days
  Storage: S3 versioning enabled
```

### Recovery Procedures

**Database Corruption**:
```bash
# 1. Stop application
# 2. Restore from latest backup
mongorestore --uri="mongodb://..." dump/

# 3. Verify data integrity
# 4. Restart application
# 5. Monitor error logs
```

**Complete System Failure**:
```bash
# 1. Provision new infrastructure
# 2. Deploy code from main branch
# 3. Restore database from backup
# 4. Restore file storage from backup
# 5. Update DNS (if needed)
# 6. Smoke test
# 7. Notify users
```

---

## P3 Deliverable Template

### deployment-plan.md Template

```markdown
# Deployment Plan

**Date**: 2025-12-29
**Phase**: P3
**Robot**: PMA
**Status**: REQUIRES SPONSOR APPROVAL

## Deployment Stages

| Stage | URL | Data | Deploy Method |
|-------|-----|------|---------------|
| Local | localhost:1337 | Synthetic | Docker Compose |
| Staging | staging-api.example.com | Anonymized | Git push (develop) |
| Production | api.example.com | Real | Git push (main) |

## Git Workflow

**Branch strategy**: Git Flow
- `main`: Production
- `develop`: Staging
- `feature/*`: Features
- `bugfix/*`: Fixes

**Merge rules**:
- All changes via Pull Requests
- Tests must pass
- Coverage ≥ 80%
- 1+ approval required

## CI/CD Pipeline

**Provider**: GitHub Actions
**Stages**: Lint → Test → Build → Deploy → Verify

**Sponsor Approval**: ⬜ Approved ⬜ Alternative: ___________

**Pipeline gates**:
- Lint: flutter analyze, npm run lint
- Test: Coverage ≥ 80%, smoke tests pass
- Build: No errors
- Deploy: Health check pass
- Verify: Smoke test pass

## Rollback Procedures

**Automated triggers**:
- Health check fails (3x)
- Error rate > 5%
- Response time > 5s

**Manual rollback**: git revert + push (max 15 min)

## Monitoring

**Staging**:
- Health checks (every 5 min)
- Basic error tracking

**Production**:
- Health checks (every 1 min)
- Error tracking (Sentry)
- Performance monitoring (New Relic)
- Log aggregation (CloudWatch)

**Sponsor Approval**: Alert channels
⬜ Slack + Email (recommended)
⬜ Email only
⬜ PagerDuty

## Disaster Recovery

**Backups**:
- Database: Daily, 30-day retention
- Code: Every commit (Git)
- Files: Daily, 30-day retention

**Recovery**: Database restore < 4 hours, Full system < 8 hours

## Sponsor Approval Checklist

- [ ] CI/CD provider approved (GitHub Actions)
- [ ] Git workflow approved (Git Flow)
- [ ] Deployment stages approved (Local/Staging/Production)
- [ ] Monitoring tools approved
- [ ] Alert channels approved
- [ ] Backup strategy approved

**Sponsor Signature**: ________________  **Date**: __________
```

---

## Validation Checklist

Before finalizing deployment-plan.md:

- [ ] Deployment stages defined (local, staging, production)
- [ ] Git workflow defined (Git Flow or alternative)
- [ ] CI/CD provider chosen (requires sponsor approval)
- [ ] CI/CD pipeline stages defined (lint, test, build, deploy, verify)
- [ ] Rollback procedures documented (automated + manual)
- [ ] Monitoring strategy defined (health checks, error tracking, APM)
- [ ] Alert channels chosen (requires sponsor approval)
- [ ] Backup strategy defined (frequency, retention, storage)
- [ ] Disaster recovery procedures documented
- [ ] Sponsor approval obtained

---

**Skill Version**: 1.0.0
**Last Updated**: 2025-12-29
**Robot**: PMA only
**Priority**: CRITICAL
**Sponsor Approval**: REQUIRED before GATE-P3
**Outputs**: deployment-plan.md
