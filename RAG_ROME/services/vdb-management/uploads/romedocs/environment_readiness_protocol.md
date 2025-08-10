# Environment Readiness Protocol
## ROME Methodology Enhancement

### Phase: Pre-Development Environment Validation
**Owner**: Infrastructure Engineer (Enhanced DevOps Role)  
**When**: After PMA planning, before any development work  
**Blocking**: All development work depends on this phase

---

## Stage 1: Tech Stack Validation

### Core Platform Checks
```bash
# Platform compatibility matrix
- [ ] Node.js version (LTS vs project requirements)
- [ ] Python version compatibility 
- [ ] Browser version support matrix
- [ ] Operating system compatibility
- [ ] Memory and disk space requirements
```

### Development Tools Validation
```bash
# Essential tooling
- [ ] Git version and configuration
- [ ] Package managers (npm, yarn, pip)
- [ ] Build tools (webpack, vite, etc.)
- [ ] Testing frameworks availability
- [ ] Linting and formatting tools
```

---

## Stage 2: Third-Party Library Assessment

### Dependency Health Check
```javascript
// Example for Node.js projects
const auditChecks = {
  libraries: [
    {
      name: "express",
      checkPoints: [
        "npm audit results",
        "Last updated date",
        "GitHub activity (commits, issues)",
        "Maintenance status",
        "Security advisories",
        "License compatibility"
      ]
    }
  ]
};
```

### Library Compatibility Matrix
| Library | Version | Last Update | Vulnerabilities | Maintenance | Alternatives |
|---------|---------|-------------|-----------------|-------------|--------------|
| Express | 4.18.2 | 6 months ago | 0 high | Active | Fastify, Koa |
| React | 18.2.0 | 3 months ago | 0 high | Active | Vue, Angular |
| Jest | 29.7.0 | 2 months ago | 0 high | Active | Vitest, Mocha |

### Automated Dependency Checks
```bash
# Security and maintenance validation
npm audit --audit-level=moderate
npm outdated
npx depcheck  # unused dependencies
```

---

## Stage 3: Compatibility & Integration Testing

### Version Compatibility Testing
```bash
# Cross-version compatibility
- [ ] Node.js + Express compatibility
- [ ] Frontend framework + build tool compatibility  
- [ ] Testing framework + assertion library compatibility
- [ ] Database driver + ORM compatibility
```

### Known Issue Assessment
```markdown
# Research common issues
- [ ] Check GitHub Issues for showstoppers
- [ ] Review Stack Overflow common problems
- [ ] Validate peer dependency conflicts
- [ ] Check for breaking changes in recent versions
```

---

## Stage 4: Environment Configuration

### Permission & Access Validation
```bash
# Settings validation
- [ ] settings.local.json syntax validation
- [ ] Permission scope testing (curl, npm, git)
- [ ] Network access validation
- [ ] Port availability (3301, 3302, 8094)
```

### Credential Management Setup
```bash
# Secret and API key management
- [ ] .env file template creation
- [ ] API key requirement documentation
- [ ] Local development credential setup
- [ ] No hardcoded secrets validation
```

---

## Stage 5: Risk Assessment & Mitigation

### Library Risk Evaluation
| Risk Level | Criteria | Mitigation |
|------------|----------|------------|
| 🔴 **High** | Unmaintained >1 year, security issues | Find alternative |
| 🟡 **Medium** | Irregular updates, minor issues | Monitor closely |
| 🟢 **Low** | Active maintenance, no issues | Proceed |

### Fallback Planning
```markdown
# Contingency for each major dependency
- [ ] Express alternative: Fastify (same API pattern)
- [ ] React alternative: Vue (if needed)
- [ ] Database alternative: SQLite → PostgreSQL migration path
```

---

## Validation Scripts

### `rome_environment_check.sh`
```bash
#!/bin/bash
echo "🔍 ROME Environment Readiness Check"
echo "=================================="

# Tech stack validation
echo "📋 Checking Node.js version..."
node --version | grep -E "v(18|20)" || echo "⚠️  Node.js version may be incompatible"

# Dependency health check
echo "📋 Checking dependency security..."
npm audit --audit-level=high --quiet || echo "⚠️  Security vulnerabilities found"

# Library maintenance check
echo "📋 Checking library maintenance..."
npx check-outdated || echo "⚠️  Outdated dependencies detected"

# Permission validation
echo "📋 Testing permissions..."
curl --version > /dev/null || echo "⚠️  Curl permission denied"

echo "✅ Environment check complete"
```

### `rome_dependency_health.js`
```javascript
// Automated dependency health assessment
const packageJson = require('./package.json');
const dependencies = packageJson.dependencies;

async function assessDependencyHealth() {
  for (const [name, version] of Object.entries(dependencies)) {
    const health = await checkLibraryHealth(name);
    console.log(`${name}: ${health.status} (last update: ${health.lastUpdate})`);
  }
}

function checkLibraryHealth(packageName) {
  // Check npm registry, GitHub activity, security advisories
  // Return health assessment
}
```

---

## Integration with ROME Workflow

### Enhanced Development Flow
1. **PMA Planning** → Requirements & Architecture
2. **🆕 Environment Readiness** → Tech stack & dependency validation
3. **DevOps Setup** → Project structure & infrastructure
4. **Development** → Feature implementation
5. **Integration** → Module coordination
6. **Deployment** → Production readiness

### Exit Criteria for Environment Readiness
- [ ] All core dependencies pass security audit
- [ ] No high-risk unmaintained libraries
- [ ] Version compatibility matrix validated
- [ ] All development tools accessible without permission prompts
- [ ] Fallback plans documented for critical dependencies
- [ ] Environment validation scripts passing

---

## Tech Stack Specific Considerations

### Node.js Projects
```bash
# Node.js specific checks
- [ ] NPM registry access
- [ ] Node modules security scan
- [ ] Package-lock.json consistency
- [ ] Native module compilation capability
```

### Python Projects  
```bash
# Python specific checks
- [ ] Virtual environment setup
- [ ] Pip dependency resolution
- [ ] Python C extension compatibility
- [ ] Requirements.txt vulnerability scan
```

### Frontend Projects
```bash
# Frontend specific checks
- [ ] Browser compatibility matrix
- [ ] Build tool configuration
- [ ] CSS framework compatibility
- [ ] Polyfill requirements
```

This comprehensive Environment Readiness stage ensures solid technical foundations before any development begins!