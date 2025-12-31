---
name: dev-environment-design
description: Standards for localhost ports, folder structure, build configurations, and environment variables. Use when creating dev-environment.md. Ensures consistent dev setup across team. REQUIRES SPONSOR APPROVAL.
allowed-tools: [Bash, Read, Write, Glob]
---

# Dev Environment Design Skill

## Purpose

PMA's P3 dev environment standards: ports, folders, configs, secrets. Output: dev-environment.md for Lucien (P4 setup).

## When to Use

- Creating dev-environment.md (P3 deliverable)
- Designing local development setup
- Defining environment-specific configurations
- Requires sponsor approval before finalizing

---

## Port Allocation Standards

### Standard Port Assignments

```yaml
# Backend Services
Parse Server (API):     1337
Parse Dashboard:        4040
MongoDB:                27017
Redis (if used):        6379
Test API Server:        1338

# Frontend Services
Flutter Web Dev:        3000
API Documentation:      8080
Storybook (if used):    6006

# Testing
Test Runner Server:     3001
E2E Test Server:        3002
```

### Port Conflict Check

**REQUIRED: Ask sponsor about port conflicts**
```markdown
## Sponsor Approval Required

**Question**: Do any of these ports conflict with your existing services?
- Parse Server: 1337
- MongoDB: 27017
- Flutter Web: 3000

**Alternatives if conflicts**:
- Parse Server: 1337 → 1340
- MongoDB: 27017 → 27020
- Flutter Web: 3000 → 3003
```

### Environment-Specific Ports

```yaml
Development:
  - Parse Server: 1337 (localhost)
  - Frontend: 3000 (localhost)

Staging:
  - Parse Server: https://staging-api.example.com
  - Frontend: https://staging.example.com

Production:
  - Parse Server: https://api.example.com
  - Frontend: https://example.com
```

---

## Folder Structure Standards

### Standard Project Structure

```
project-root/
├── backend/                    # Parse Server backend
│   ├── cloud/                  # Cloud Code functions
│   │   ├── main.js             # Entry point
│   │   ├── functions/          # Cloud functions
│   │   │   ├── projects.js
│   │   │   └── users.js
│   │   └── triggers/           # Triggers (beforeSave, afterSave)
│   ├── migrations/             # Schema migrations
│   │   ├── 001_create_project.js
│   │   └── 002_create_user.js
│   ├── seeds/                  # Test data seeds
│   │   ├── dev.js              # Dev environment
│   │   └── staging.js          # Staging environment
│   ├── config/                 # Environment configs
│   │   ├── dev.js
│   │   ├── staging.js
│   │   └── prod.js
│   └── package.json

├── frontend/                   # Flutter frontend
│   ├── lib/                    # Source code
│   │   ├── features/           # Feature modules
│   │   ├── core/               # Shared utilities
│   │   └── main.dart
│   ├── test/                   # Tests
│   │   ├── unit/
│   │   ├── widget/
│   │   └── integration/
│   ├── build/                  # Build outputs (gitignored)
│   │   ├── web/
│   │   ├── ios/
│   │   └── android/
│   └── pubspec.yaml

├── docker/                     # Docker configs
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   ├── docker-compose.dev.yml
│   └── docker-compose.prod.yml

├── scripts/                    # Automation scripts
│   ├── setup-dev.sh            # First-time setup
│   ├── seed-data.sh            # Seed test data
│   ├── run-migrations.sh       # Run migrations
│   └── reset-db.sh             # Reset local DB

├── docs/                       # Project documentation
│   └── api/                    # API docs (Swagger/OpenAPI)

├── .github/                    # GitHub workflows
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml

├── ARTIFACTS/                  # ROME artifacts
│   ├── dev/
│   │   ├── requirements/
│   │   ├── design/
│   │   └── test-data/
│   └── activity-log.txt

├── .env.example                # Template (committed)
├── .env.development            # Dev secrets (gitignored)
├── .env.staging                # Staging secrets (gitignored)
├── .env.production             # Prod secrets (gitignored)
├── .gitignore
└── README.md
```

### Gitignore Requirements

```gitignore
# REQUIRED: Never commit these
.env.development
.env.staging
.env.production
.env.local

# Build outputs
backend/node_modules/
frontend/build/
frontend/.dart_tool/

# IDE
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db

# Logs
*.log
logs/

# Database dumps
*.dump
*.sql
```

---

## Build Configuration Standards

### Environment Files

**Template (.env.example)**:
```bash
# .env.example - Committed to repo (no secrets)

# Parse Server
PARSE_SERVER_APPLICATION_ID=your_app_id_here
PARSE_SERVER_MASTER_KEY=your_master_key_here
PARSE_SERVER_URL=http://localhost:1337/parse
PARSE_SERVER_DATABASE_URI=mongodb://localhost:27017/dev

# Frontend
FLUTTER_WEB_PORT=3000
API_BASE_URL=http://localhost:1337/parse

# Feature flags
ENABLE_DEBUG_MODE=true
ENABLE_MOCK_DATA=false
```

**Development (.env.development)**:
```bash
# .env.development - Local dev (gitignored)

PARSE_SERVER_APPLICATION_ID=dev-app-id-12345
PARSE_SERVER_MASTER_KEY=dev-master-key-67890
PARSE_SERVER_URL=http://localhost:1337/parse
PARSE_SERVER_DATABASE_URI=mongodb://localhost:27017/dev_db

FLUTTER_WEB_PORT=3000
API_BASE_URL=http://localhost:1337/parse

ENABLE_DEBUG_MODE=true
ENABLE_MOCK_DATA=false
LOG_LEVEL=DEBUG
```

**Staging (.env.staging)**:
```bash
# .env.staging - Staging server (gitignored)

PARSE_SERVER_APPLICATION_ID=staging-app-id-xxxxx
PARSE_SERVER_MASTER_KEY=staging-master-key-yyyyy
PARSE_SERVER_URL=https://staging-api.example.com/parse
PARSE_SERVER_DATABASE_URI=mongodb://staging-db.example.com:27017/staging_db

API_BASE_URL=https://staging-api.example.com/parse

ENABLE_DEBUG_MODE=false
ENABLE_MOCK_DATA=false
LOG_LEVEL=INFO
```

**Production (.env.production)**:
```bash
# .env.production - Production (gitignored, use secrets vault)

PARSE_SERVER_APPLICATION_ID=${SECRETS_VAULT_APP_ID}
PARSE_SERVER_MASTER_KEY=${SECRETS_VAULT_MASTER_KEY}
PARSE_SERVER_URL=https://api.example.com/parse
PARSE_SERVER_DATABASE_URI=${SECRETS_VAULT_DB_URI}

API_BASE_URL=https://api.example.com/parse

ENABLE_DEBUG_MODE=false
ENABLE_MOCK_DATA=false
LOG_LEVEL=ERROR
```

### Build Scripts

**package.json (backend)**:
```json
{
  "scripts": {
    "dev": "nodemon --exec 'node -r dotenv/config' index.js dotenv_config_path=.env.development",
    "start:staging": "node -r dotenv/config index.js dotenv_config_path=.env.staging",
    "start:prod": "node -r dotenv/config index.js dotenv_config_path=.env.production",
    "migrate": "node scripts/run-migrations.js",
    "seed:dev": "node seeds/dev.js",
    "seed:staging": "node seeds/staging.js"
  }
}
```

**Flutter run configs**:
```bash
# Development
flutter run -d chrome --dart-define=ENV=development

# Staging
flutter run -d chrome --dart-define=ENV=staging

# Production build
flutter build web --release --dart-define=ENV=production
```

---

## Secrets Management

### Never Commit Secrets

**Prohibited in version control**:
- ❌ Database passwords
- ❌ API keys
- ❌ Master keys
- ❌ JWT secrets
- ❌ Third-party service credentials
- ❌ SSL certificates (private keys)

### Secrets Storage Options

**REQUIRES SPONSOR APPROVAL**:

```markdown
## Sponsor Decision: Secrets Management

**Options**:
1. GitHub Secrets (CI/CD only, free)
2. AWS Secrets Manager ($0.40/secret/month)
3. HashiCorp Vault (self-hosted, complex)
4. Environment variables (staging/prod servers)

**Recommendation**: GitHub Secrets for CI/CD + server env vars for runtime

**Sponsor Choice**: [To be filled]
```

### Local Development Secrets

```bash
# First-time setup script
#!/bin/bash
# scripts/setup-dev.sh

echo "Setting up local development environment..."

# Check if .env.development exists
if [ ! -f .env.development ]; then
  echo "Creating .env.development from template..."
  cp .env.example .env.development
  echo ""
  echo "⚠️  ACTION REQUIRED:"
  echo "Edit .env.development and replace placeholders with real values"
  echo ""
fi

# Install dependencies
cd backend && npm install
cd ../frontend && flutter pub get

echo "✅ Setup complete. Run 'npm run dev' in backend/ and 'flutter run' in frontend/"
```

---

## Docker Configuration

### Development (docker-compose.dev.yml)

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    container_name: dev_mongodb
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_DATABASE: dev_db
    volumes:
      - mongo_data:/data/db

  parse-server:
    build:
      context: ./backend
      dockerfile: ../docker/Dockerfile.backend
    container_name: dev_parse_server
    ports:
      - "1337:1337"
    environment:
      PARSE_SERVER_APPLICATION_ID: ${PARSE_SERVER_APPLICATION_ID}
      PARSE_SERVER_MASTER_KEY: ${PARSE_SERVER_MASTER_KEY}
      PARSE_SERVER_DATABASE_URI: mongodb://mongodb:27017/dev_db
    depends_on:
      - mongodb
    volumes:
      - ./backend:/app
      - /app/node_modules

  parse-dashboard:
    image: parseplatform/parse-dashboard:5.0.0
    container_name: dev_parse_dashboard
    ports:
      - "4040:4040"
    environment:
      PARSE_DASHBOARD_SERVER_URL: http://parse-server:1337/parse
      PARSE_DASHBOARD_APP_ID: ${PARSE_SERVER_APPLICATION_ID}
      PARSE_DASHBOARD_MASTER_KEY: ${PARSE_SERVER_MASTER_KEY}
    depends_on:
      - parse-server

volumes:
  mongo_data:
```

**Usage**:
```bash
# Start dev environment
docker-compose -f docker/docker-compose.dev.yml up

# Stop dev environment
docker-compose -f docker/docker-compose.dev.yml down

# Reset database
docker-compose -f docker/docker-compose.dev.yml down -v
```

---

## P3 Deliverable Template

### dev-environment.md Template

```markdown
# Development Environment

**Date**: 2025-12-29
**Phase**: P3
**Robot**: PMA
**Status**: REQUIRES SPONSOR APPROVAL

## Port Allocation

| Service | Port | Environment |
|---------|------|-------------|
| Parse Server | 1337 | Development |
| MongoDB | 27017 | Development |
| Parse Dashboard | 4040 | Development |
| Flutter Web | 3000 | Development |

**Sponsor Approval**: ⬜ Approved ⬜ Conflicts (specify alternatives)

## Folder Structure

[Copy standard structure from skill]

**Deviations from standard**: [None / List deviations with rationale]

## Environment Files

**Configuration strategy**:
- .env.development: Local dev (gitignored)
- .env.staging: Staging server (gitignored)
- .env.production: Production (secrets vault)
- .env.example: Template (committed)

**Required secrets**:
- PARSE_SERVER_APPLICATION_ID
- PARSE_SERVER_MASTER_KEY
- PARSE_SERVER_DATABASE_URI
- JWT_SECRET
- [Add project-specific secrets]

**Sponsor Approval**: Secrets management approach
⬜ GitHub Secrets + server env vars (recommended)
⬜ AWS Secrets Manager
⬜ HashiCorp Vault
⬜ Other: ___________

## Build Configurations

**Development**:
```bash
Backend: npm run dev
Frontend: flutter run -d chrome --dart-define=ENV=development
```

**Staging**:
```bash
Backend: npm run start:staging
Frontend: flutter build web --dart-define=ENV=staging
```

**Production**:
```bash
Backend: npm run start:prod
Frontend: flutter build web --release --dart-define=ENV=production
```

## Docker Setup

**Local development**: docker-compose.dev.yml
**Services**: MongoDB, Parse Server, Parse Dashboard

**First-time setup**:
```bash
1. Copy .env.example to .env.development
2. Edit .env.development with real values
3. Run: docker-compose -f docker/docker-compose.dev.yml up
4. Run: npm run migrate (backend migrations)
5. Run: npm run seed:dev (test data)
```

## Sponsor Approval Checklist

- [ ] Port allocation approved (no conflicts)
- [ ] Folder structure approved
- [ ] Secrets management approach approved
- [ ] Docker setup approved for local dev
- [ ] Build configurations reviewed

**Sponsor Signature**: ________________  **Date**: __________

## Handoff to Lucien (P4)

Lucien will:
1. Initialize Flutter project structure (frontend/)
2. Initialize Node.js Parse Server project (backend/)
3. Create docker-compose.dev.yml
4. Create .env.example template
5. Create setup scripts (scripts/setup-dev.sh)
6. Document first-time setup in README.md
```

---

## Validation Checklist

Before finalizing dev-environment.md:

- [ ] Port allocation documented (no conflicts)
- [ ] Folder structure defined (follows standard or justifies deviations)
- [ ] Environment files strategy defined (.env.development, .env.staging, .env.production)
- [ ] Secrets identified (NEVER commit secrets)
- [ ] Secrets management approach chosen (requires sponsor approval)
- [ ] Build scripts defined (dev, staging, prod)
- [ ] Docker configs defined (docker-compose.dev.yml)
- [ ] First-time setup documented (scripts/setup-dev.sh)
- [ ] Gitignore configured (secrets, build outputs, IDE files)
- [ ] Sponsor approval obtained

---

**Skill Version**: 1.0.0
**Last Updated**: 2025-12-29
**Robot**: PMA only
**Priority**: CRITICAL
**Sponsor Approval**: REQUIRED before GATE-P3
