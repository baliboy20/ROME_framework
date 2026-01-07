# ROME Subagent Framework: Technical Specification

**Document UID:** ROME-SPEC-SUBAGENT-FRAMEWORK
**Status:** Specification
**Date:** 2025-12-23
**Version:** 1.0
**Implementation:** Month 1

---

## 1. Overview

The Subagent Framework enables **massive parallelization** by spawning autonomous AI agents that execute tasks concurrently. Subagents orchestrate skill invocation, process batches of data, and enable 5-95× speedup through parallel execution.

**Purpose:** Enable robots to transition from sequential execution to parallel orchestration

**Key Principles:**
- Subagents are **autonomous** (execute independently once spawned)
- Subagents are **stateless** (receive context at spawn time)
- Subagents are **skill-based** (invoke skills for operations)
- Subagents are **resource-bounded** (max 95 concurrent)

---

## 2. Subagent Architecture

### 2.1 Core Components

```
┌─────────────────────────────────────────────────┐
│  PARENT ROBOT (Talib, PMA, Clara, etc.)         │
│  Spawns subagents for parallel execution        │
└──────────────────┬──────────────────────────────┘
                   │ spawnSubagent(config)
                   ▼
┌─────────────────────────────────────────────────┐
│  SUBAGENT ORCHESTRATOR                          │
│  - Subagent registry                            │
│  - Resource management (max 95 concurrent)      │
│  - Spawn queue                                   │
│  - Barrier synchronization                       │
│  - Result aggregation                            │
└──────────────────┬──────────────────────────────┘
                   │ spawn N subagents (parallel)
                   ▼
┌─────────────────────────────────────────────────┐
│  SUBAGENT INSTANCES (1..95)                     │
│  Each subagent:                                  │
│  - Receives context + operations                │
│  - Executes autonomously                         │
│  - Invokes skills                                │
│  - Returns results                               │
└──────────────────┬──────────────────────────────┘
                   │ invoke skills
                   ▼
┌─────────────────────────────────────────────────┐
│  SKILL INVOCATION FRAMEWORK                     │
│  Subagents invoke skills just like robots       │
└─────────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│  BARRIER SYNCHRONIZATION                        │
│  Parent awaits all subagents → merge results    │
└─────────────────────────────────────────────────┘
```

---

## 3. Subagent Definition Format

### 3.1 Subagent Manifest (YAML)

```yaml
# /ROME/subagents/SA-001-aordl-validator/subagent.yaml

subagent:
  id: SA-001
  name: AORDL Validator
  version: 1.0
  tier: 1
  description: Validates batches of AORDL requirements in parallel

capabilities:
  primary_skill: validate-aordl
  batch_processing: true
  max_batch_size: 10
  parallel_safe: true

context_schema:
  required:
    - name: requirements
      type: array
      description: Batch of AORDL requirements to validate

  optional:
    - name: validation_rules
      type: string
      description: Path to validation rules file
      default: aordl-rules.yaml

operations:
  - skill: /validate-aordl
    loop: requirements
    params:
      requirement_file: ${item.path}
      validation_rules: ${context.validation_rules}
      output_report: validation-report-${item.id}.md

returns:
  type: object
  schema:
    validation_reports:
      type: array
      items:
        requirement_id: string
        status: enum [PASS, FAIL]
        violations: array

execution:
  timeout: 120000  # 2 minutes
  retry:
    enabled: true
    max_attempts: 2

  resources:
    memory: 512MB
    cpu: 1
    priority: NORMAL

parallelization:
  pattern: FAN_OUT
  max_concurrent: 10  # This subagent type can have 10 instances
  batch_optimal_size: 5-10

tags:
  - validation
  - aordl
  - batch-processing
```

### 3.2 Subagent Spawn Configuration

```javascript
// How parent robots spawn subagents

const subagentConfig = {
  type: 'SA-001',  // Subagent type ID
  name: 'aordl-validator-batch-1',  // Instance name (optional)

  context: {
    // Data passed to subagent
    requirements: [
      { id: 'REQ-001', path: 'REQ-001.yaml' },
      { id: 'REQ-002', path: 'REQ-002.yaml' },
      // ... up to 10 requirements
    ],
    validation_rules: 'aordl-rules.yaml'
  },

  operations: [
    // Operations can override manifest defaults
    {
      skill: '/validate-aordl',
      params: {
        requirement_file: '${requirement.path}',
        validation_rules: '${context.validation_rules}'
      }
    }
  ],

  options: {
    run_in_background: true,  // Parallel execution
    timeout: 120000,
    priority: 'NORMAL'
  }
};

const subagentHandle = await spawnSubagent(subagentConfig);
```

---

## 4. Subagent Orchestrator Implementation

### 4.1 Subagent Orchestrator Class

```javascript
// /ROME/framework/subagent-orchestrator.js

const { Task } = require('claude-sdk');  // Using Claude SDK Task tool
const { invokeSkill } = require('./skill-invoker');
const { logActivity } = require('./activity-logger');

class SubagentOrchestrator {
  constructor() {
    this.subagentRegistry = new Map();
    this.activeSubagents = new Map();
    this.maxConcurrent = 95;  // Global limit
    this.loadSubagents();
  }

  /**
   * Load all subagent definitions
   */
  loadSubagents() {
    const subagentsDir = '/ROME/subagents';
    const subagents = fs.readdirSync(subagentsDir);

    for (const subagent of subagents) {
      const manifestPath = `${subagentsDir}/${subagent}/subagent.yaml`;

      if (fs.existsSync(manifestPath)) {
        const manifest = yaml.parse(fs.readFileSync(manifestPath, 'utf8'));
        this.subagentRegistry.set(manifest.subagent.id, manifest);
      }
    }

    console.log(`Loaded ${this.subagentRegistry.size} subagent types`);
  }

  /**
   * Spawn a subagent
   *
   * @param {object} config - Subagent spawn configuration
   * @returns {Promise<SubagentHandle>} - Handle to track subagent
   */
  async spawnSubagent(config) {
    const startTime = Date.now();

    // Validate configuration
    const manifest = this.subagentRegistry.get(config.type);
    if (!manifest) {
      throw new Error(`Subagent type not found: ${config.type}`);
    }

    // Check concurrency limit
    if (this.activeSubagents.size >= this.maxConcurrent) {
      throw new Error(`Maximum concurrent subagents reached (${this.maxConcurrent})`);
    }

    // Generate unique ID
    const subagentId = `${config.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create subagent execution context
    const executionContext = {
      id: subagentId,
      type: config.type,
      name: config.name || subagentId,
      context: config.context || {},
      operations: config.operations || manifest.operations,
      manifest: manifest,
      startTime: startTime
    };

    // Log spawn
    await logActivity({
      type: 'SUBAGENT',
      action: 'SPAWN',
      subagent_id: subagentId,
      subagent_type: config.type,
      timestamp: new Date().toISOString()
    });

    // Execute subagent using Claude SDK Task tool
    const taskPromise = Task({
      subagent_type: 'general-purpose',  // Use Claude SDK agent
      description: `Subagent ${config.type}: ${manifest.subagent.description}`,
      prompt: this.generateSubagentPrompt(executionContext),
      run_in_background: config.options?.run_in_background !== false
    });

    // Create handle
    const handle = {
      id: subagentId,
      type: config.type,
      name: executionContext.name,
      promise: taskPromise,

      // Await completion
      await: async () => {
        const result = await taskPromise;
        await this.handleSubagentCompletion(subagentId, result, startTime);
        return result;
      },

      // Get status (non-blocking)
      getStatus: async () => {
        return this.activeSubagents.get(subagentId)?.status || 'UNKNOWN';
      }
    };

    // Track active subagent
    this.activeSubagents.set(subagentId, {
      handle: handle,
      status: 'RUNNING',
      startTime: startTime
    });

    return handle;
  }

  /**
   * Spawn multiple subagents in parallel
   *
   * @param {Array<object>} configs - Array of subagent configurations
   * @returns {Promise<Array<SubagentHandle>>} - Array of handles
   */
  async spawnSubagentsParallel(configs) {
    const handles = [];

    for (const config of configs) {
      const handle = await this.spawnSubagent(config);
      handles.push(handle);
    }

    return handles;
  }

  /**
   * Barrier synchronization: await all subagents
   *
   * @param {Array<SubagentHandle>} handles - Subagent handles
   * @returns {Promise<Array<object>>} - Array of results
   */
  async awaitAll(handles) {
    const startTime = Date.now();

    await logActivity({
      type: 'SUBAGENT',
      action: 'BARRIER',
      subagent_count: handles.length,
      timestamp: new Date().toISOString()
    });

    const results = await Promise.all(handles.map(h => h.await()));

    await logActivity({
      type: 'SUBAGENT',
      action: 'BARRIER_COMPLETE',
      subagent_count: handles.length,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString()
    });

    return results;
  }

  /**
   * Generate subagent execution prompt
   * This prompt instructs the Claude agent what to do
   */
  generateSubagentPrompt(context) {
    const { type, manifest, context: ctx, operations } = context;

    let prompt = `# Subagent: ${type}\n\n`;
    prompt += `**Description:** ${manifest.subagent.description}\n\n`;
    prompt += `## Context\n\n`;
    prompt += `You have been spawned as a subagent to execute the following task:\n\n`;
    prompt += `**Context Data:**\n\`\`\`json\n${JSON.stringify(ctx, null, 2)}\n\`\`\`\n\n`;

    prompt += `## Operations to Execute\n\n`;

    for (const op of operations) {
      prompt += `### Operation: ${op.skill}\n\n`;

      if (op.loop) {
        prompt += `**Loop over:** \`${op.loop}\` (batch processing)\n\n`;
        prompt += `For each item in \`${op.loop}\`, invoke skill \`${op.skill}\` with parameters:\n`;
      } else {
        prompt += `Invoke skill \`${op.skill}\` with parameters:\n`;
      }

      prompt += `\`\`\`json\n${JSON.stringify(op.params, null, 2)}\n\`\`\`\n\n`;
    }

    prompt += `## Expected Output\n\n`;
    prompt += `Return the results as a structured JSON object matching this schema:\n`;
    prompt += `\`\`\`json\n${JSON.stringify(manifest.returns.schema, null, 2)}\n\`\`\`\n\n`;

    prompt += `## Execution Guidelines\n\n`;
    prompt += `- Execute all operations autonomously\n`;
    prompt += `- Use the skill invocation framework: \`await invokeSkill('/skill-name', params)\`\n`;
    prompt += `- Handle errors gracefully and report them in results\n`;
    prompt += `- Ensure all required fields in the return schema are populated\n`;
    prompt += `- Log activities using the activity logging protocol\n`;

    return prompt;
  }

  /**
   * Handle subagent completion
   */
  async handleSubagentCompletion(subagentId, result, startTime) {
    const duration = Date.now() - startTime;

    await logActivity({
      type: 'SUBAGENT',
      action: 'COMPLETE',
      subagent_id: subagentId,
      duration: duration,
      timestamp: new Date().toISOString()
    });

    // Remove from active tracking
    this.activeSubagents.delete(subagentId);
  }

  /**
   * Get active subagent count
   */
  getActiveCount() {
    return this.activeSubagents.size;
  }

  /**
   * Get subagent manifest
   */
  getSubagentManifest(type) {
    return this.subagentRegistry.get(type);
  }

  /**
   * List all subagent types
   */
  listSubagents(filter = {}) {
    const subagents = Array.from(this.subagentRegistry.values())
      .map(s => s.subagent);

    if (filter.tier) {
      return subagents.filter(s => s.tier === filter.tier);
    }

    if (filter.pattern) {
      return subagents.filter(s => s.parallelization?.pattern === filter.pattern);
    }

    return subagents;
  }
}

// Export singleton
const subagentOrchestrator = new SubagentOrchestrator();

async function spawnSubagent(config) {
  return subagentOrchestrator.spawnSubagent(config);
}

async function spawnSubagentsParallel(configs) {
  return subagentOrchestrator.spawnSubagentsParallel(configs);
}

async function awaitAll(handles) {
  return subagentOrchestrator.awaitAll(handles);
}

module.exports = {
  spawnSubagent,
  spawnSubagentsParallel,
  awaitAll,
  SubagentOrchestrator,
  subagentOrchestrator
};
```

---

## 5. Parallelization Patterns

### 5.1 Pattern A: Fan-Out (Batch Processing)

**Use Case:** Validate 50 AORDL requirements in parallel

```javascript
// Talib robot, P1 phase
const requirements = await loadAORDLFiles(); // 50 files
const batchSize = 10;
const batches = chunk(requirements, batchSize); // 5 batches

const subagentHandles = await spawnSubagentsParallel(
  batches.map((batch, i) => ({
    type: 'SA-001',
    name: `aordl-validator-batch-${i}`,
    context: { requirements: batch },
    operations: batch.map(req => ({
      skill: '/validate-aordl',
      params: {
        requirement_file: req.path,
        validation_rules: 'aordl-rules.yaml'
      }
    }))
  }))
);

// Barrier: Wait for all 5 subagents
const results = await awaitAll(subagentHandles);

// Merge results
const allViolations = results.flatMap(r => r.violations);
```

**Speedup:** 5× (5 subagents vs sequential)

---

### 5.2 Pattern B: Specialized Delegation

**Use Case:** P2 analysis - 5 different enhancement tasks in parallel

```javascript
// Talib robot, P2 phase
const requirements = await loadAORDLRequirements();

const subagentHandles = await spawnSubagentsParallel([
  {
    type: 'SA-015',  // Capability Matrix Builder
    name: 'capability-matrix-builder',
    context: { requirements },
    operations: [{
      skill: '/generate-capability-matrix',
      params: { requirements, output: 'capability-matrix.yaml' }
    }]
  },
  {
    type: 'SA-007',  // Dependency Analyzer
    name: 'dependency-analyzer',
    context: { requirements },
    operations: [{
      skill: '/build-dependency-graph',
      params: { requirements, output: 'dependency-graph.yaml' }
    }]
  },
  {
    type: 'SA-004',  // User Story Generator
    name: 'user-story-generator',
    context: { requirements },
    operations: [{
      skill: '/generate-user-stories',
      params: { requirements, output: 'user-stories.md' }
    }]
  },
  {
    type: 'SA-006',  // Coverage Assessor
    name: 'coverage-assessor',
    context: { requirements },
    operations: [{
      skill: '/check-coverage',
      params: { requirements, output: 'coverage-report.md' }
    }]
  },
  {
    type: 'SA-014',  // BDD Generator
    name: 'bdd-generator',
    context: { requirements },
    operations: [{
      skill: '/generate-bdd',
      params: { requirements, output: 'bdd-scenarios.feature' }
    }]
  }
]);

// Barrier: Wait for all 5 specialized subagents
const results = await awaitAll(subagentHandles);
```

**Speedup:** Time = Max(5 subagent times) vs Sum(5 sequential times)

---

### 5.3 Pattern C: Massive Parallel (Code Generation)

**Use Case:** P5 - Generate 95 code files in parallel

```javascript
// Ashok (25 entities), Reena (40 endpoints), Charlie (30 screens) = 95 total

const entities = await loadEntities(); // 25
const endpoints = await loadEndpoints(); // 40
const screens = await loadScreens(); // 30

// Spawn all 95 subagents concurrently
const subagentHandles = await spawnSubagentsParallel([
  // 25 database entity generators
  ...entities.map(entity => ({
    type: 'SA-036',
    name: `db-generator-${entity.name}`,
    context: { entity, aordl_requirements },
    operations: [{
      skill: '/generate-database-entity',
      params: { entity, output_dir: 'database/models/' }
    }]
  })),

  // 40 API endpoint generators
  ...endpoints.map(endpoint => ({
    type: 'SA-037',
    name: `api-generator-${endpoint.name}`,
    context: { endpoint, aordl_requirements },
    operations: [{
      skill: '/generate-api-endpoint-code',
      params: { endpoint, output_dir: 'api/controllers/' }
    }]
  })),

  // 30 UI screen generators
  ...screens.map(screen => ({
    type: 'SA-038',
    name: `ui-generator-${screen.name}`,
    context: { screen, aordl_requirements },
    operations: [{
      skill: '/generate-ui-screen-code',
      params: { screen, output_dir: 'ui/screens/' }
    }]
  }))
]);

// Barrier: Wait for all 95 subagents
const results = await awaitAll(subagentHandles);
```

**Speedup:** 95× (if all 95 can run concurrently)

---

## 6. Resource Management

### 6.1 Concurrency Limits

```javascript
class SubagentOrchestrator {
  constructor() {
    this.maxConcurrent = 95;  // Global limit
    this.activeSubagents = new Map();
  }

  async spawnSubagent(config) {
    // Check limit
    if (this.activeSubagents.size >= this.maxConcurrent) {
      // Queue or reject
      throw new Error(`Maximum concurrent subagents reached (${this.maxConcurrent})`);
    }

    // Spawn...
  }
}
```

### 6.2 Priority Queue (Advanced)

```javascript
class SubagentQueue {
  constructor() {
    this.queue = [];
  }

  enqueue(config, priority = 'NORMAL') {
    this.queue.push({ config, priority });
    this.queue.sort((a, b) => priorityValue(b.priority) - priorityValue(a.priority));
  }

  dequeue() {
    return this.queue.shift();
  }
}

function priorityValue(priority) {
  return { HIGH: 3, NORMAL: 2, LOW: 1 }[priority] || 2;
}
```

---

## 7. Error Handling

### 7.1 Subagent Failure Modes

```javascript
// Subagent execution can fail in several ways:

try {
  const result = await subagentHandle.await();
} catch (error) {
  if (error.type === 'TIMEOUT') {
    // Subagent exceeded timeout
    console.error('Subagent timeout:', subagentHandle.id);
  } else if (error.type === 'SKILL_FAILURE') {
    // Skill invocation failed within subagent
    console.error('Subagent skill failure:', error.skill, error.message);
  } else if (error.type === 'RESOURCE_EXHAUSTION') {
    // Resource limits exceeded
    console.error('Subagent resource exhaustion:', error.message);
  } else {
    // General failure
    console.error('Subagent failure:', error.message);
  }
}
```

### 7.2 Partial Failure Handling

```javascript
// When some subagents fail, others can still succeed

const results = await Promise.allSettled(
  subagentHandles.map(h => h.await())
);

const successful = results.filter(r => r.status === 'fulfilled').map(r => r.value);
const failed = results.filter(r => r.status === 'rejected').map(r => r.reason);

console.log(`${successful.length} succeeded, ${failed.length} failed`);

if (failed.length > 0) {
  // Handle partial failure
  console.error('Failed subagents:', failed.map(f => f.subagent_id));

  // Retry failed subagents or report to user
}
```

---

## 8. Testing Requirements

### 8.1 Unit Tests

```javascript
// /ROME/framework/tests/subagent-orchestrator.test.js

const { spawnSubagent, awaitAll } = require('../subagent-orchestrator');

describe('Subagent Orchestrator', () => {
  it('should spawn subagent successfully', async () => {
    const handle = await spawnSubagent({
      type: 'SA-001',
      context: { requirements: [{ id: 'REQ-001', path: 'test/REQ-001.yaml' }] }
    });

    assert.ok(handle.id);
    assert.strictEqual(handle.type, 'SA-001');
  });

  it('should await subagent completion', async () => {
    const handle = await spawnSubagent({
      type: 'SA-001',
      context: { requirements: [{ id: 'REQ-001', path: 'test/REQ-001.yaml' }] }
    });

    const result = await handle.await();
    assert.ok(result);
  });

  it('should spawn multiple subagents in parallel', async () => {
    const handles = await spawnSubagentsParallel([
      { type: 'SA-001', context: { requirements: batch1 } },
      { type: 'SA-001', context: { requirements: batch2 } },
      { type: 'SA-001', context: { requirements: batch3 } }
    ]);

    assert.strictEqual(handles.length, 3);
  });

  it('should synchronize with barrier', async () => {
    const handles = await spawnSubagentsParallel([...]);
    const results = await awaitAll(handles);

    assert.strictEqual(results.length, handles.length);
  });

  it('should enforce concurrency limit', async () => {
    // Spawn 96 subagents (exceeds limit of 95)
    const configs = Array(96).fill({}).map((_, i) => ({
      type: 'SA-001',
      context: { requirements: [{ id: `REQ-${i}` }] }
    }));

    await assert.rejects(
      async () => await spawnSubagentsParallel(configs),
      { message: /Maximum concurrent subagents/ }
    );
  });
});
```

### 8.2 Integration Tests

```javascript
describe('Subagent + Skill Integration', () => {
  it('should invoke skills from subagent', async () => {
    const handle = await spawnSubagent({
      type: 'SA-001',
      context: { requirements: [{ id: 'REQ-001', path: 'test/REQ-001.yaml' }] },
      operations: [{
        skill: '/validate-aordl',
        params: { requirement_file: 'test/REQ-001.yaml' }
      }]
    });

    const result = await handle.await();

    assert.ok(result.validation_reports);
    assert.strictEqual(result.validation_reports[0].requirement_id, 'REQ-001');
  });
});
```

---

## 9. Performance Monitoring

### 9.1 Metrics Collection

```javascript
class SubagentMetrics {
  constructor() {
    this.metrics = [];
  }

  recordSpawn(subagentId, type) {
    this.metrics.push({
      event: 'SPAWN',
      subagent_id: subagentId,
      type: type,
      timestamp: Date.now()
    });
  }

  recordComplete(subagentId, duration) {
    this.metrics.push({
      event: 'COMPLETE',
      subagent_id: subagentId,
      duration: duration,
      timestamp: Date.now()
    });
  }

  getAverageDuration(type) {
    const completions = this.metrics.filter(m =>
      m.event === 'COMPLETE' && m.type === type
    );

    const total = completions.reduce((sum, m) => sum + m.duration, 0);
    return total / completions.length;
  }

  getConcurrencyPeak() {
    // Calculate max concurrent subagents over time
    let peak = 0;
    let current = 0;

    for (const metric of this.metrics) {
      if (metric.event === 'SPAWN') current++;
      if (metric.event === 'COMPLETE') current--;
      peak = Math.max(peak, current);
    }

    return peak;
  }
}
```

---

## 10. Implementation Checklist (Month 1)

### Week 1: Core Framework
- [ ] Implement SubagentOrchestrator class
- [ ] Implement subagent registry and loading
- [ ] Implement spawn mechanism (using Claude SDK Task)
- [ ] Implement concurrency limit enforcement
- [ ] Implement barrier synchronization (awaitAll)

### Week 2: Resource Management
- [ ] Implement active subagent tracking
- [ ] Implement resource limits
- [ ] Implement priority queue (optional)
- [ ] Implement activity logging integration

### Week 3: Error Handling & Testing
- [ ] Implement error handling (timeout, failure, partial failure)
- [ ] Unit tests for subagent orchestrator (100% coverage)
- [ ] Integration tests (subagent + skill)
- [ ] Performance tests (95 concurrent subagents)

### Week 4: Optimization & Documentation
- [ ] Performance optimization
- [ ] Metrics collection
- [ ] Developer documentation
- [ ] Example subagents (2-3)
- [ ] Ready for Month 3 (Tier 1 subagents implementation)

---

## 11. Success Criteria

**Subagent Framework is ready if:**
- ✓ Subagents can be spawned (`spawnSubagent(config)`)
- ✓ Multiple subagents execute in parallel
- ✓ Barrier synchronization works correctly (`awaitAll(handles)`)
- ✓ Concurrency limit enforced (max 95 concurrent)
- ✓ Skills can be invoked from subagents
- ✓ Errors handled gracefully (timeout, partial failure)
- ✓ All subagent activity logged
- ✓ Test coverage >95%
- ✓ 95 concurrent subagents tested successfully
- ✓ Documentation complete

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-23 | Initial subagent framework specification - Architecture, orchestration API, parallelization patterns, resource management, error handling, testing requirements |
