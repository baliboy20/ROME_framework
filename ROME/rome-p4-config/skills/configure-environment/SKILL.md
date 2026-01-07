# configure-environment

## Metadata
- **Skill ID**: configure-environment
- **Version**: 1.0.0
- **Tier**: 1
- **Phase**: P4 (Config)
- **Category**: Environment Configuration
- **Plugin**: rome-p4-config@1.0.0

## Description

Generates environment configuration files for all environments (dev, test, staging, prod). Creates .env templates with required variables, documents environment-specific settings, and prepares configuration documentation.

## Parameters

### Required
- `workspace` (string): Workspace directory path
- `system_architecture_file` (string): Path to system-architecture.md from P3
  - Validation: file_exists

### Optional
- `environments` (string): Comma-separated list of environments
  - Default: dev,test,staging,prod
- `output_doc` (string): Path to write environment-config.md
  - Default: ARTIFACTS/04-config/environment-config/environment-config.md

## Execution

- **Timeout**: 60000ms (60 seconds)
- **Retry**: Enabled
  - Max attempts: 2
  - Backoff: linear

## Output

Returns:
- `environments_configured` (integer): Number of environments configured
- `env_files_created` (array): List of .env template files created
- `variables_defined` (integer): Total environment variables defined
- `config_doc_path` (string): Path to environment configuration documentation

## Usage Example

```bash
/configure-environment \
  --workspace SOURCE/api-workspace \
  --system_architecture_file ARTIFACTS/03-design/architecture/system-architecture.md \
  --environments dev,test,staging,prod
```

## Dependencies

- rome-core@^1.0.0 (SkillInvoker, SkillRegistry)
- node:fs (for file operations)

## Algorithm

1. Load system architecture from P3
2. Extract environment requirements:
   - Database connections
   - API URLs
   - External service endpoints
   - Feature flags
   - Debug/logging levels
   - Performance settings (from AORDL NonFunctional.Performance)
   - Security settings (from AORDL NonFunctional.Security)
3. For each environment:
   - Define environment-specific variables
   - Set appropriate defaults
   - Document purpose and expected values
4. Create .env template files:
   - `.env.example` (committed to repo)
   - `.env.development` (local dev, not committed)
   - `.env.test` (testing, not committed)
   - `.env.staging` (staging, not committed)
   - `.env.production` (production, not committed)
5. Generate environment-config.md documentation:
   - Environment overview table
   - Variable definitions
   - Setup instructions
6. Write files and documentation

## Environment Configuration Schema

```markdown
## Environments

### Development
| Attribute | Value |
|-----------|-------|
| Purpose | Local development |
| Database | Local / Docker |
| API URL | http://localhost:[port] |
| Debug | Enabled |

### Test
| Attribute | Value |
|-----------|-------|
| Purpose | Automated testing |
| Database | In-memory / Test instance |
| API URL | http://localhost:[port] |
| Debug | Enabled |

### Staging
| Attribute | Value |
|-----------|-------|
| Purpose | Pre-production validation |
| Database | [Staging DB URL] |
| API URL | [Staging API URL] |
| Debug | Disabled |

### Production
| Attribute | Value |
|-----------|-------|
| Purpose | Live environment |
| Database | [Production DB URL] |
| API URL | [Production API URL] |
| Debug | Disabled |
```

## Example .env.example

```bash
# Database
DATABASE_URL=postgresql://localhost:5432/myapp_dev
DATABASE_TEST_URL=postgresql://localhost:5432/myapp_test

# API
API_PORT=3000
API_HOST=localhost

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRY=7d

# External Services
STRIPE_API_KEY=your-stripe-key
SENDGRID_API_KEY=your-sendgrid-key

# Feature Flags
ENABLE_ANALYTICS=false
ENABLE_DEBUG_LOGGING=true
```

## Notes

- Integrates with Lucien's environment configuration workflow (Step 8)
- References AORDL NonFunctional.Performance for environment sizing
- References AORDL NonFunctional.Security for security config
- Creates both templates (committed) and environment-specific files (not committed)
- Documents setup instructions for P5 robots

## Related Skills

- scaffold-workspace (Tier 1)
- setup-cicd-pipeline (Tier 1)
- validate-workspace-structure (Tier 1)
- execute-p4-config (Tier 2)

## Revision History

| Version | Date | Summary |
|---------|------|---------|
| 1.0.0 | 2026-01-07 | Skill definition created for rome-p4-config plugin |
