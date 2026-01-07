# ROME Skill Framework: Technical Specification

**Document UID:** ROME-SPEC-SKILL-FRAMEWORK
**Status:** Specification
**Date:** 2025-12-23
**Version:** 1.0
**Implementation:** Month 1

---

## 1. Overview

The Skill Framework provides **standardized, reusable operations** that robots invoke by name. Skills encapsulate multi-step workflows and complex logic into simple, parameterized function calls.

**Purpose:** Enable robot definitions to transition from procedural (500-1200 lines) to declarative (50-150 lines)

**Key Principles:**
- Skills are **stateless** (no persistent state between invocations)
- Skills are **idempotent** (same input → same output)
- Skills are **composable** (can invoke other skills)
- Skills are **AORDL-aware** (can consume AORDL structured data)

---

## 2. Skill Architecture

### 2.1 Core Components

```
┌─────────────────────────────────────────────────┐
│  ROBOT (Talib, PMA, Clara, etc.)                │
│  Invokes skills via skill invocation framework  │
└──────────────────┬──────────────────────────────┘
                   │ invokeSkill('/skill-name', params)
                   ▼
┌─────────────────────────────────────────────────┐
│  SKILL INVOCATION FRAMEWORK                     │
│  - Skill registry lookup                        │
│  - Parameter validation                         │
│  - Execution orchestration                      │
│  - Result handling                               │
│  - Error management                              │
│  - Activity logging                              │
└──────────────────┬──────────────────────────────┘
                   │ execute(skill, params)
                   ▼
┌─────────────────────────────────────────────────┐
│  SKILL IMPLEMENTATION                           │
│  - Skill logic (operations)                     │
│  - AORDL processing (if applicable)             │
│  - File I/O, validation, generation             │
│  - Subskill invocation (if needed)              │
└──────────────────┬──────────────────────────────┘
                   │ return result
                   ▼
┌─────────────────────────────────────────────────┐
│  RESULT                                          │
│  - Status (success/failure)                     │
│  - Output data                                   │
│  - Artifacts generated                           │
│  - Errors (if any)                               │
└─────────────────────────────────────────────────┘
```

---

## 3. Skill Definition Format

### 3.1 Skill Manifest (YAML)

Each skill has a manifest defining its interface:

```yaml
# /ROME/skills/validation/validate-aordl/skill.yaml

skill:
  name: validate-aordl
  version: 1.0
  category: validation
  tier: 1
  description: Validates AORDL requirement structure, vocabulary, and anti-patterns

parameters:
  required:
    - name: requirement_file
      type: string
      description: Path to AORDL requirement file (YAML or Markdown)
      validation: file_exists

    - name: validation_rules
      type: string
      description: Path to AORDL validation rules file
      default: aordl-rules.yaml

  optional:
    - name: output_report
      type: string
      description: Path to validation report output
      default: validation-report-{requirement_id}.md

    - name: strict_mode
      type: boolean
      description: Fail on any violation vs warn only
      default: true

returns:
  type: object
  schema:
    status:
      type: enum
      values: [PASS, FAIL]
    violations:
      type: array
      items: string
    report_path:
      type: string
    requirement_id:
      type: string

execution:
  timeout: 30000  # 30 seconds
  retry:
    enabled: true
    max_attempts: 3
    backoff: exponential

  resources:
    memory: 256MB
    cpu: 1

logging:
  activity_log: true
  log_level: INFO
  log_parameters: true
  log_result: true

aordl_integration:
  consumes_aordl: true
  aordl_fields_used:
    - ID
    - Actor
    - Intent
    - Preconditions
    - Conditions
    - Postconditions
    - Outcomes
    - Invariants
    - NonFunctional
    - Errors
    - ScopeBoundary
    - OpenQuestions
    - CopilotMode

dependencies:
  skills: []  # No skill dependencies
  tools:
    - yaml-parser
    - markdown-parser

tags:
  - validation
  - aordl
  - quality-gate
```

### 3.2 Skill Implementation Structure

```javascript
// /ROME/skills/validation/validate-aordl/index.js

/**
 * AORDL Requirement Validator Skill
 * Validates AORDL structure, controlled vocabulary, and anti-patterns
 */

const fs = require('fs');
const yaml = require('yaml');
const { logActivity } = require('../../shared/activity-logger');

async function validateAORDL(params) {
  const startTime = Date.now();

  try {
    // 1. Validate parameters
    validateParameters(params);

    // 2. Load AORDL requirement
    const requirement = await loadRequirement(params.requirement_file);

    // 3. Load validation rules
    const rules = await loadValidationRules(params.validation_rules);

    // 4. Perform validation
    const violations = [];

    // 4a. Schema validation (13 required fields)
    violations.push(...validateSchema(requirement, rules));

    // 4b. Controlled vocabulary validation
    violations.push(...validateVocabulary(requirement, rules));

    // 4c. Anti-pattern detection
    violations.push(...detectAntiPatterns(requirement, rules));

    // 4d. Cross-reference validation
    violations.push(...validateCrossReferences(requirement, rules));

    // 5. Generate validation report
    const report = generateValidationReport(requirement, violations, params);

    // 6. Write report to file
    if (params.output_report) {
      await fs.promises.writeFile(params.output_report, report);
    }

    // 7. Log activity
    await logActivity({
      type: 'SKILL',
      skill: 'validate-aordl',
      status: violations.length === 0 ? 'PASS' : 'FAIL',
      duration: Date.now() - startTime,
      requirement_id: requirement.ID,
      violations_count: violations.length
    });

    // 8. Return result
    return {
      status: violations.length === 0 ? 'PASS' : 'FAIL',
      violations: violations,
      report_path: params.output_report,
      requirement_id: requirement.ID
    };

  } catch (error) {
    // Log error
    await logActivity({
      type: 'SKILL',
      skill: 'validate-aordl',
      status: 'ERROR',
      error: error.message,
      duration: Date.now() - startTime
    });

    throw error;
  }
}

// Helper functions
function validateParameters(params) {
  if (!params.requirement_file) {
    throw new Error('Parameter requirement_file is required');
  }
  if (!fs.existsSync(params.requirement_file)) {
    throw new Error(`Requirement file not found: ${params.requirement_file}`);
  }
}

async function loadRequirement(filePath) {
  const content = await fs.promises.readFile(filePath, 'utf8');

  if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
    return yaml.parse(content);
  } else if (filePath.endsWith('.md')) {
    return parseMarkdownAORDL(content);
  } else {
    throw new Error('Unsupported file format. Use .yaml or .md');
  }
}

function validateSchema(requirement, rules) {
  const violations = [];
  const requiredFields = rules.schema.required_fields;

  for (const field of requiredFields) {
    if (!requirement.hasOwnProperty(field)) {
      violations.push({
        type: 'MISSING_FIELD',
        field: field,
        message: `Required field '${field}' is missing`
      });
    }
  }

  return violations;
}

function validateVocabulary(requirement, rules) {
  const violations = [];

  // Validate Actor (not generic)
  if (rules.vocabulary.generic_actors.includes(requirement.Actor?.toLowerCase())) {
    violations.push({
      type: 'GENERIC_ACTOR',
      field: 'Actor',
      value: requirement.Actor,
      message: `Actor "${requirement.Actor}" is too generic. Use a specific role.`
    });
  }

  // Validate Intent verb
  const intent = requirement.Intent?.split(' ');
  const verb = intent?.[0]?.toLowerCase();

  if (verb && !rules.vocabulary.approved_verbs.includes(verb)) {
    violations.push({
      type: 'UNAPPROVED_VERB',
      field: 'Intent',
      value: verb,
      message: `Verb "${verb}" is not in approved list. Use: ${rules.vocabulary.approved_verbs.join(', ')}`
    });
  }

  return violations;
}

function detectAntiPatterns(requirement, rules) {
  const violations = [];

  // Check for UI language
  const uiKeywords = rules.anti_patterns.ui_language;
  const fieldsToCheck = ['Intent', 'Preconditions', 'Outcomes'];

  for (const field of fieldsToCheck) {
    const value = JSON.stringify(requirement[field]).toLowerCase();

    for (const keyword of uiKeywords) {
      if (value.includes(keyword)) {
        violations.push({
          type: 'UI_LANGUAGE',
          field: field,
          keyword: keyword,
          message: `Field '${field}' contains UI language: "${keyword}". AORDL should be UI-agnostic.`
        });
      }
    }
  }

  // Check for technical jargon
  const techKeywords = rules.anti_patterns.technical_jargon;

  for (const field of fieldsToCheck) {
    const value = JSON.stringify(requirement[field]);

    for (const keyword of techKeywords) {
      if (value.includes(keyword)) {
        violations.push({
          type: 'TECHNICAL_JARGON',
          field: field,
          keyword: keyword,
          message: `Field '${field}' contains technical jargon: "${keyword}". Use business language.`
        });
      }
    }
  }

  return violations;
}

function validateCrossReferences(requirement, rules) {
  const violations = [];

  // Check ID uniqueness (requires global registry - simplified for now)
  if (!requirement.ID || !requirement.ID.match(/^REQ-\d{3}$/)) {
    violations.push({
      type: 'INVALID_ID_FORMAT',
      field: 'ID',
      value: requirement.ID,
      message: 'ID must follow format REQ-### (e.g., REQ-001)'
    });
  }

  return violations;
}

function generateValidationReport(requirement, violations, params) {
  let report = `# AORDL Validation Report\n\n`;
  report += `**Requirement ID:** ${requirement.ID}\n`;
  report += `**Validation Date:** ${new Date().toISOString()}\n`;
  report += `**Status:** ${violations.length === 0 ? 'PASS ✓' : 'FAIL ✗'}\n\n`;

  if (violations.length === 0) {
    report += `## Result\n\nAll validations passed. This AORDL requirement is valid.\n`;
  } else {
    report += `## Violations (${violations.length})\n\n`;

    violations.forEach((v, i) => {
      report += `### ${i + 1}. ${v.type}\n`;
      report += `- **Field:** ${v.field}\n`;
      if (v.value) report += `- **Value:** ${v.value}\n`;
      if (v.keyword) report += `- **Keyword:** ${v.keyword}\n`;
      report += `- **Message:** ${v.message}\n\n`;
    });
  }

  return report;
}

module.exports = { validateAORDL };
```

---

## 4. Skill Invocation Framework

### 4.1 Core Invocation API

```javascript
// /ROME/framework/skill-invoker.js

const fs = require('fs');
const yaml = require('yaml');
const { logActivity } = require('./activity-logger');

class SkillInvoker {
  constructor() {
    this.skillRegistry = new Map();
    this.loadSkills();
  }

  /**
   * Load all skills from /ROME/skills directory
   */
  loadSkills() {
    const skillsDir = '/ROME/skills';
    const categories = fs.readdirSync(skillsDir);

    for (const category of categories) {
      const categoryPath = `${skillsDir}/${category}`;
      const skills = fs.readdirSync(categoryPath);

      for (const skillName of skills) {
        const skillPath = `${categoryPath}/${skillName}`;
        const manifestPath = `${skillPath}/skill.yaml`;

        if (fs.existsSync(manifestPath)) {
          const manifest = yaml.parse(fs.readFileSync(manifestPath, 'utf8'));
          const implementation = require(`${skillPath}/index.js`);

          this.skillRegistry.set(manifest.skill.name, {
            manifest: manifest,
            implementation: implementation
          });
        }
      }
    }

    console.log(`Loaded ${this.skillRegistry.size} skills`);
  }

  /**
   * Invoke a skill by name
   *
   * @param {string} skillName - Skill name (e.g., 'validate-aordl' or '/validate-aordl')
   * @param {object} params - Skill parameters
   * @param {object} options - Invocation options (timeout, retry, etc.)
   * @returns {Promise<object>} - Skill result
   */
  async invokeSkill(skillName, params = {}, options = {}) {
    const startTime = Date.now();

    // Normalize skill name (remove leading slash if present)
    const normalizedName = skillName.replace(/^\//, '');

    // Lookup skill
    const skill = this.skillRegistry.get(normalizedName);
    if (!skill) {
      throw new Error(`Skill not found: ${skillName}`);
    }

    const manifest = skill.manifest.skill;
    const implementation = skill.implementation;

    try {
      // Validate parameters
      this.validateParameters(params, manifest.parameters);

      // Apply defaults
      const mergedParams = this.applyDefaults(params, manifest.parameters);

      // Set timeout
      const timeout = options.timeout || manifest.execution?.timeout || 60000;

      // Execute skill with timeout
      const result = await this.executeWithTimeout(
        implementation[Object.keys(implementation)[0]], // Main exported function
        mergedParams,
        timeout
      );

      // Log success
      await logActivity({
        type: 'SKILL',
        skill: normalizedName,
        status: 'SUCCESS',
        duration: Date.now() - startTime,
        params: manifest.logging?.log_parameters ? params : undefined,
        result: manifest.logging?.log_result ? result : undefined
      });

      return result;

    } catch (error) {
      // Retry logic
      if (options.retry || manifest.execution?.retry?.enabled) {
        const maxAttempts = manifest.execution?.retry?.max_attempts || 3;

        if ((options.attempt || 1) < maxAttempts) {
          console.log(`Retrying skill ${skillName}, attempt ${(options.attempt || 1) + 1}/${maxAttempts}`);

          // Exponential backoff
          const backoffMs = 1000 * Math.pow(2, options.attempt || 1);
          await new Promise(resolve => setTimeout(resolve, backoffMs));

          return this.invokeSkill(skillName, params, {
            ...options,
            attempt: (options.attempt || 1) + 1
          });
        }
      }

      // Log failure
      await logActivity({
        type: 'SKILL',
        skill: normalizedName,
        status: 'FAILURE',
        duration: Date.now() - startTime,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Validate skill parameters against manifest
   */
  validateParameters(params, parameterSpec) {
    const required = parameterSpec?.required || [];

    for (const param of required) {
      if (!params.hasOwnProperty(param.name)) {
        throw new Error(`Required parameter '${param.name}' is missing`);
      }

      // Type validation
      if (param.type && typeof params[param.name] !== param.type) {
        throw new Error(`Parameter '${param.name}' must be of type ${param.type}`);
      }

      // Custom validation
      if (param.validation === 'file_exists') {
        if (!fs.existsSync(params[param.name])) {
          throw new Error(`File not found: ${params[param.name]}`);
        }
      }
    }
  }

  /**
   * Apply default parameter values
   */
  applyDefaults(params, parameterSpec) {
    const merged = { ...params };

    const optional = parameterSpec?.optional || [];

    for (const param of optional) {
      if (!merged.hasOwnProperty(param.name) && param.default !== undefined) {
        merged[param.name] = param.default;
      }
    }

    return merged;
  }

  /**
   * Execute function with timeout
   */
  async executeWithTimeout(fn, params, timeout) {
    return Promise.race([
      fn(params),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Skill execution timeout (${timeout}ms)`)), timeout)
      )
    ]);
  }

  /**
   * Get skill manifest by name
   */
  getSkillManifest(skillName) {
    const normalizedName = skillName.replace(/^\//, '');
    const skill = this.skillRegistry.get(normalizedName);
    return skill?.manifest;
  }

  /**
   * List all available skills
   */
  listSkills(filter = {}) {
    const skills = Array.from(this.skillRegistry.values())
      .map(s => s.manifest.skill);

    if (filter.category) {
      return skills.filter(s => s.category === filter.category);
    }

    if (filter.tier) {
      return skills.filter(s => s.tier === filter.tier);
    }

    return skills;
  }
}

// Export singleton
const skillInvoker = new SkillInvoker();

async function invokeSkill(skillName, params, options) {
  return skillInvoker.invokeSkill(skillName, params, options);
}

module.exports = { invokeSkill, SkillInvoker, skillInvoker };
```

---

## 5. Skill Categories & Tiers

### 5.1 Categories

```yaml
categories:
  validation:
    description: Validation and quality assurance skills
    skills: [validate-aordl, validate-entry-criteria, check-coverage, check-consistency]

  generation:
    description: Artifact generation skills
    skills: [generate-user-stories, generate-bdd, generate-api-endpoint, generate-use-case]

  coordination:
    description: Coordination and orchestration skills
    skills: [log-phase-event, prepare-handover, execute-gate, request-approval]

  configuration:
    description: Workspace and environment configuration
    skills: [configure-database-workspace, configure-api-workspace, configure-ui-workspace]

  code-generation:
    description: Code generation skills
    skills: [generate-database-entity, generate-api-endpoint-code, generate-ui-screen-code]
```

### 5.2 Tier System

```yaml
tiers:
  tier_1:
    priority: HIGH
    implementation: Month 2
    count: 20
    description: Core skills required for P1-P3

  tier_2:
    priority: MEDIUM
    implementation: Month 5
    count: 20
    description: Configuration and advanced skills

  tier_3:
    priority: LOW
    implementation: Month 7
    count: 10
    description: Code generation and specialized skills
```

---

## 6. AORDL Integration

### 6.1 AORDL-Aware Skills

Skills can declare AORDL integration in their manifest:

```yaml
aordl_integration:
  consumes_aordl: true
  aordl_fields_used:
    - Intent
    - Invariants
    - Preconditions
    - Errors
```

### 6.2 AORDL Field Mapping Examples

**Skill: /generate-api-endpoint**
```javascript
function generateAPIEndpoint(params) {
  const { aordl_requirement } = params;

  // Direct field mapping
  const httpMethod = mapIntentToHTTPMethod(aordl_requirement.Intent); // "create invoice" → POST
  const endpoint = mapIntentToResource(aordl_requirement.Intent);      // "create invoice" → /api/invoices
  const authMiddleware = mapPreconditionsToAuth(aordl_requirement.Preconditions); // "Customer authenticated" → requireAuth()
  const businessLogic = mapInvariantsToLogic(aordl_requirement.Invariants); // Invariants → validation code
  const errorHandlers = mapErrorsToHandlers(aordl_requirement.Errors);       // Errors → error responses

  return {
    method: httpMethod,
    path: endpoint,
    auth: authMiddleware,
    logic: businessLogic,
    errors: errorHandlers
  };
}
```

---

## 7. Error Handling

### 7.1 Error Types

```javascript
class SkillError extends Error {
  constructor(message, type, context) {
    super(message);
    this.name = 'SkillError';
    this.type = type;
    this.context = context;
  }
}

// Error types
const ErrorTypes = {
  PARAMETER_VALIDATION: 'PARAMETER_VALIDATION',
  SKILL_NOT_FOUND: 'SKILL_NOT_FOUND',
  EXECUTION_TIMEOUT: 'EXECUTION_TIMEOUT',
  EXECUTION_FAILURE: 'EXECUTION_FAILURE',
  DEPENDENCY_FAILURE: 'DEPENDENCY_FAILURE'
};
```

### 7.2 Error Handling Pattern

```javascript
try {
  const result = await invokeSkill('/validate-aordl', {
    requirement_file: 'REQ-001.yaml'
  });
} catch (error) {
  if (error.type === 'PARAMETER_VALIDATION') {
    // Handle parameter validation error
    console.error('Invalid parameters:', error.message);
  } else if (error.type === 'EXECUTION_TIMEOUT') {
    // Handle timeout
    console.error('Skill execution timeout:', error.message);
  } else {
    // Handle general error
    console.error('Skill execution failed:', error.message);
    throw error;
  }
}
```

---

## 8. Activity Logging

All skill invocations are logged to the ROME activity log:

```javascript
{
  type: "SKILL",
  skill: "validate-aordl",
  status: "SUCCESS",
  duration: 1243,  // milliseconds
  timestamp: "2025-12-23T10:30:45.123Z",
  params: {
    requirement_file: "REQ-001.yaml"
  },
  result: {
    status: "PASS",
    violations: []
  }
}
```

---

## 9. Testing Requirements

### 9.1 Unit Tests (Per Skill)

```javascript
// /ROME/skills/validation/validate-aordl/test.js

const { validateAORDL } = require('./index');
const assert = require('assert');

describe('validate-aordl skill', () => {
  it('should pass for valid AORDL requirement', async () => {
    const result = await validateAORDL({
      requirement_file: 'test/fixtures/valid-requirement.yaml',
      validation_rules: 'test/fixtures/test-rules.yaml'
    });

    assert.strictEqual(result.status, 'PASS');
    assert.strictEqual(result.violations.length, 0);
  });

  it('should fail for missing required fields', async () => {
    const result = await validateAORDL({
      requirement_file: 'test/fixtures/missing-fields.yaml',
      validation_rules: 'test/fixtures/test-rules.yaml'
    });

    assert.strictEqual(result.status, 'FAIL');
    assert.ok(result.violations.length > 0);
  });

  it('should detect UI language anti-pattern', async () => {
    const result = await validateAORDL({
      requirement_file: 'test/fixtures/ui-language.yaml',
      validation_rules: 'test/fixtures/test-rules.yaml'
    });

    assert.ok(result.violations.some(v => v.type === 'UI_LANGUAGE'));
  });
});
```

### 9.2 Integration Tests

```javascript
// /ROME/framework/tests/skill-framework.test.js

const { invokeSkill } = require('../skill-invoker');

describe('Skill Framework', () => {
  it('should invoke skill successfully', async () => {
    const result = await invokeSkill('/validate-aordl', {
      requirement_file: 'test/REQ-001.yaml',
      validation_rules: 'aordl-rules.yaml'
    });

    assert.ok(result.status);
  });

  it('should handle skill not found error', async () => {
    await assert.rejects(
      async () => await invokeSkill('/non-existent-skill', {}),
      { message: /Skill not found/ }
    );
  });

  it('should retry on failure', async () => {
    // Test retry logic
  });
});
```

---

## 10. Implementation Checklist (Month 1)

### Week 1: Core Framework
- [ ] Implement SkillInvoker class
- [ ] Implement skill registry and loading
- [ ] Implement parameter validation
- [ ] Implement timeout handling
- [ ] Implement retry logic
- [ ] Implement activity logging integration

### Week 2: Testing & Documentation
- [ ] Unit tests for skill framework (100% coverage)
- [ ] Integration tests for skill invocation
- [ ] API documentation
- [ ] Example skills (2-3 simple examples)

### Week 3: AORDL Integration
- [ ] AORDL field mapping utilities
- [ ] AORDL-aware skill base class
- [ ] AORDL validation integration

### Week 4: Optimization & Refinement
- [ ] Performance optimization
- [ ] Error handling improvements
- [ ] Developer documentation
- [ ] Ready for Month 2 (Tier 1 skills implementation)

---

## 11. Success Criteria

**Skill Framework is ready if:**
- ✓ Skills can be invoked by name (`invokeSkill('/skill-name', params)`)
- ✓ Parameter validation works correctly
- ✓ Timeout handling prevents hung executions
- ✓ Retry logic handles transient failures
- ✓ All skill invocations logged to activity log
- ✓ AORDL-aware skills can consume AORDL data
- ✓ Test coverage >95%
- ✓ Documentation complete

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-23 | Initial skill framework specification - Architecture, invocation API, AORDL integration, error handling, testing requirements |
