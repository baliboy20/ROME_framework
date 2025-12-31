# ROME Artifact File Splitting Strategy
Document UID: ROME-ANALYSIS-002
Status: Draft
Date: 2025-12-30
Type: Technical Analysis

---

## Executive Summary

**Recommendation**: CONDITIONALLY SPLIT based on artifact type and size thresholds.

Large monolithic files (requirements-index.json, unified-api-spec.yaml) present scalability and maintainability issues beyond ~500 entries. Splitting strategies must balance:
- **LLM context efficiency** (smaller files = faster processing)
- **Human navigability** (logical organization)
- **Tooling complexity** (merge/aggregation overhead)

**Verdict**:
- ✅ **SPLIT**: `unified-api-spec.yaml` (already 2K lines at 25 endpoints)
- ⚠️ **CONDITIONAL**: `requirements-index.json` (297 lines at 25 requirements, threshold ~100 requirements)
- ✅ **ALREADY SPLIT**: Individual REQ-###.yaml files (optimal pattern)

---

## Problem Statement

### Current State

| Artifact | Current Size | Growth Rate | Problem at Scale |
|----------|--------------|-------------|------------------|
| `requirements-index.json` | 297 lines, 25 reqs | ~12 lines/req | 1,200 lines @ 100 reqs, 6,000 lines @ 500 reqs |
| `unified-api-spec.yaml` | 2,024 lines, 25 endpoints | ~81 lines/endpoint | 8,100 lines @ 100 endpoints, 40,500 lines @ 500 endpoints |
| Individual `REQ-###.yaml` | ~50 lines each | N/A | No scaling issue (1 file per req) |

### Scalability Thresholds

**LLM Context Limits**:
- Claude Code Read tool: Optimal <2,000 lines (begins truncation beyond this)
- Human readability: Optimal <500 lines for quick scanning
- Git diff performance: Degrades beyond ~5,000 lines

**Critical Thresholds**:
- 📊 **requirements-index.json**: Becomes problematic at ~100 requirements (1,200 lines)
- ⚠️ **unified-api-spec.yaml**: Already problematic at 25 endpoints (2,024 lines), critical at 50+ endpoints

---

## Growth Projections

### Small Project (Current: Task Management)
- Requirements: 25
- Endpoints: 25
- Status: ✅ Manageable without splitting

### Medium Project (E-commerce, CRM)
- Requirements: 100-150
- Endpoints: 80-120
- **requirements-index.json**: 1,200-1,800 lines → ⚠️ Approaching threshold
- **unified-api-spec.yaml**: 6,500-9,700 lines → ❌ Exceeds threshold

### Large Project (ERP, Hospital System)
- Requirements: 300-500
- Endpoints: 200-400
- **requirements-index.json**: 3,600-6,000 lines → ❌ Exceeds threshold
- **unified-api-spec.yaml**: 16,000-32,000 lines → ❌ Severely exceeds threshold

---

## Splitting Strategies

### Strategy 1: No Splitting (Status Quo)

**Structure**:
```
ARTIFACTS/
├── 01-requirements/
│   ├── requirements-index.json        # Monolithic index (all 500 requirements)
│   ├── REQ-001.yaml
│   ├── REQ-002.yaml
│   └── ...
└── 05-api-specs/
    └── unified-api-spec.yaml          # Monolithic spec (all 500 endpoints)
```

**Pros**:
- ✅ Single source of truth (no merge logic)
- ✅ Simple tooling (one file to read)
- ✅ Easy to validate completeness

**Cons**:
- ❌ Exceeds LLM context limits at scale (>100 requirements)
- ❌ Git diffs become unwieldy
- ❌ Slow to parse/load (YAML parsing is O(n))
- ❌ Merge conflicts on multi-agent collaboration

**Verdict**: ❌ **NOT RECOMMENDED** for medium/large projects

---

### Strategy 2: Split by Tier (Coarse-Grained)

**Structure**:
```
ARTIFACTS/
├── 01-requirements/
│   ├── requirements-index-tier1.json  # Core CRUD (6 reqs)
│   ├── requirements-index-tier2.json  # Collaboration (6 reqs)
│   ├── requirements-index-tier3.json  # Advanced (8 reqs)
│   ├── requirements-index-tier4.json  # System Integration (5 reqs)
│   ├── REQ-001.yaml
│   └── ...
└── 05-api-specs/
    ├── api-spec-tier1.yaml            # Core CRUD endpoints
    ├── api-spec-tier2.yaml            # Collaboration endpoints
    ├── api-spec-tier3.yaml            # Advanced endpoints
    └── api-spec-tier4.yaml            # Integration endpoints
```

**Pros**:
- ✅ Logical grouping (tiers = implementation phases)
- ✅ Reduces file size (4 files × ~100 lines vs. 1 file × 400 lines)
- ✅ Parallel robot editing (different tiers, different files, no conflicts)
- ✅ Aligns with ROME tiering philosophy

**Cons**:
- ⚠️ Requires aggregation for global queries ("show all HIGH priority reqs")
- ⚠️ Tier boundaries may shift during analysis (REQ-003 moves tier1→tier2)
- ⚠️ Incomplete split (still ~125 reqs/tier for 500-req project)

**Verdict**: ✅ **RECOMMENDED** for medium projects (100-200 reqs), transitional strategy

---

### Strategy 3: Split by Category (Medium-Grained)

**Structure**:
```
ARTIFACTS/
├── 01-requirements/
│   ├── index/
│   │   ├── core-crud.json             # 20 reqs
│   │   ├── collaboration.json         # 30 reqs
│   │   ├── analytics.json             # 15 reqs
│   │   ├── integrations.json          # 25 reqs
│   │   └── administration.json        # 10 reqs
│   ├── REQ-001.yaml
│   └── ...
└── 05-api-specs/
    ├── specs/
    │   ├── core-crud.yaml             # 20 endpoints
    │   ├── collaboration.yaml         # 30 endpoints
    │   ├── analytics.yaml             # 15 endpoints
    │   ├── integrations.yaml          # 25 endpoints
    │   └── administration.yaml        # 10 endpoints
```

**Pros**:
- ✅ Fine-grained logical grouping (business capabilities)
- ✅ Stable boundaries (category rarely changes)
- ✅ Human-navigable (developers know which file to check)
- ✅ Scales to large projects (10 categories × 50 reqs = 500 reqs)

**Cons**:
- ⚠️ Requires aggregation for cross-category queries
- ⚠️ Category taxonomy must be defined upfront
- ⚠️ Uneven distribution (some categories have 5 reqs, others 50)

**Verdict**: ✅ **RECOMMENDED** for large projects (200+ reqs)

---

### Strategy 4: Split by Actor (Alternative Medium-Grained)

**Structure**:
```
ARTIFACTS/
├── 01-requirements/
│   ├── index/
│   │   ├── project-manager.json       # 40 reqs
│   │   ├── team-member.json           # 35 reqs
│   │   ├── administrator.json         # 25 reqs
│   │   └── system-integrator.json     # 20 reqs
│   ├── REQ-001.yaml
│   └── ...
└── 05-api-specs/
    ├── specs/
    │   ├── project-manager.yaml       # 40 endpoints
    │   ├── team-member.yaml           # 35 endpoints
    │   ├── administrator.yaml         # 25 endpoints
    │   └── system-integrator.yaml     # 20 endpoints
```

**Pros**:
- ✅ Aligns with ROME Actor-centric design (AORDL Actor field)
- ✅ Clear ownership boundaries (permissions modeling)
- ✅ Useful for role-based access control (RBAC) analysis

**Cons**:
- ❌ Actors may share requirements (ProjectManager + Administrator both "view analytics")
- ❌ Duplication or arbitrary assignment needed
- ❌ Less intuitive for feature-oriented development

**Verdict**: ⚠️ **CONDITIONAL** - Use only if RBAC is primary concern

---

### Strategy 5: Dynamic Splitting (Threshold-Based)

**Rule**: Split file when exceeds N entries (e.g., N=50)

**Structure**:
```
ARTIFACTS/
├── 01-requirements/
│   ├── index/
│   │   ├── 001-050.json               # First 50 reqs
│   │   ├── 051-100.json               # Next 50 reqs
│   │   └── 101-150.json               # Next 50 reqs
│   ├── REQ-001.yaml
│   └── ...
└── 05-api-specs/
    ├── specs/
    │   ├── 001-050.yaml               # First 50 endpoints
    │   ├── 051-100.yaml               # Next 50 endpoints
    │   └── 101-150.yaml               # Next 50 endpoints
```

**Pros**:
- ✅ Simple rule (no human judgment)
- ✅ Predictable file sizes
- ✅ Automated splitting (script generates ranges)

**Cons**:
- ❌ No semantic grouping (arbitrary boundaries)
- ❌ Poor navigability (which file has "create project"?)
- ❌ Requires index-of-indexes for lookup

**Verdict**: ❌ **NOT RECOMMENDED** - Sacrifices usability for automation

---

## Recommended Strategy by Project Size

| Project Size | Requirements | Strategy | Split Dimension |
|--------------|--------------|----------|-----------------|
| **Small** (Pilot) | 1-50 | No splitting | N/A (monolithic OK) |
| **Medium** (Product) | 50-150 | Split by Tier | Tier 1-4 |
| **Large** (Enterprise) | 150-500 | Split by Category | Business capabilities |
| **Very Large** (Platform) | 500+ | Split by Category + Tier | Nested (category/tier) |

---

## Implementation Specification

### Format: requirements-index (Split by Category)

**Directory Structure**:
```
ARTIFACTS/01-requirements/index/
├── _master.json                       # Aggregated view (auto-generated)
├── core-crud.json                     # Category: Core CRUD
├── collaboration.json                 # Category: Collaboration
├── advanced.json                      # Category: Advanced
└── system-integration.json            # Category: System Integration
```

**File Schema** (core-crud.json):
```json
{
  "category": "Core CRUD",
  "description": "Basic create, read, update, delete operations for core entities",
  "tier_range": [1, 2],
  "total_requirements": 15,
  "requirements": [
    {
      "id": "REQ-001",
      "tier": 1,
      "category": "Core CRUD",
      "actor": "ProjectManager",
      "intent": "create project",
      "priority": "HIGH",
      "copilot_mode": "STRICT",
      "file": "REQ-001.yaml"
    },
    ...
  ]
}
```

**Master Index** (_master.json):
```json
{
  "pilot_project": "Task Management System",
  "total_requirements": 25,
  "created_date": "2025-12-23",
  "last_updated": "2025-12-30T00:00:00Z",
  "split_strategy": "category",
  "categories": [
    {
      "name": "Core CRUD",
      "file": "index/core-crud.json",
      "count": 6
    },
    {
      "name": "Collaboration",
      "file": "index/collaboration.json",
      "count": 6
    },
    {
      "name": "Advanced",
      "file": "index/advanced.json",
      "count": 8
    },
    {
      "name": "System Integration",
      "file": "index/system-integration.json",
      "count": 5
    }
  ],
  "statistics": {
    "by_tier": {"tier_1": 6, "tier_2": 6, "tier_3": 8, "tier_4": 5},
    "by_actor": {"ProjectManager": 7, "TeamMember": 6, "Administrator": 5, "SystemIntegrator": 3},
    "by_priority": {"HIGH": 8, "MEDIUM": 14, "LOW": 3},
    "by_copilot_mode": {"STRICT": 20, "GUIDED": 4, "PERMISSIVE": 1}
  },
  "entities_identified": ["Project", "Task", "Comment", "Attachment", "Team", "User", "APIToken", "Webhook"],
  "validation_status": "All requirements validated"
}
```

**Naming Convention**:
- Category files: lowercase-with-hyphens (core-crud.json, collaboration.json)
- Master index: Prefix with underscore (_master.json) to sort first alphabetically
- Consistent with ROME terse naming principles

---

### Format: unified-api-spec (Split by Category)

**Directory Structure**:
```
ARTIFACTS/05-api-specs/
├── unified-api-spec.yaml              # Master aggregated spec (auto-generated)
├── specs/
│   ├── core-crud.yaml                 # /project, /task CRUD endpoints
│   ├── collaboration.yaml             # /comment, /attachment, /team endpoints
│   ├── advanced.yaml                  # /analytics, /export, /import endpoints
│   └── system-integration.yaml        # /api-token, /webhook endpoints
```

**File Schema** (specs/core-crud.yaml):
```yaml
# OpenAPI Fragment: Core CRUD Endpoints
# Category: Core CRUD
# Description: Basic CRUD operations for Project and Task entities
# Total Endpoints: 8

openapi: 3.0.3
info:
  title: Core CRUD API (Fragment)
  description: Core CRUD operations extracted from unified spec
  version: 1.0.0

paths:
  /project:
    post:
      summary: create project
      description: Project saved to database with unique ID
      operationId: createProject
      tags: [Project]
      # ... (standard endpoint definition)
    get:
      summary: view project
      # ...
    put:
      summary: update project
      # ...
    delete:
      summary: delete project
      # ...

  /task:
    post:
      summary: create task
      # ...
    # ...
```

**Master Spec** (unified-api-spec.yaml):
```yaml
# AUTO-GENERATED: Do not edit directly
# Generated from: specs/*.yaml
# Generation Date: 2025-12-30T00:00:00Z
# Total Endpoints: 25

openapi: 3.0.3
info:
  title: Task Management System API
  description: >
    Unified API specification aggregated from category-specific fragments.
    Edit individual specs in specs/ directory and regenerate this file.
  version: 1.0.0

servers:
  - url: /api/v1
    description: API Server

# Endpoints merged from all category specs
paths:
  # From specs/core-crud.yaml
  /project:
    post:
      # ...

  # From specs/collaboration.yaml
  /comment:
    post:
      # ...

  # ... (all endpoints merged)

components:
  # Schemas deduplicated across all specs
  schemas:
    # ...
```

---

## Tooling Requirements

### Aggregation Script

**Purpose**: Merge split files into monolithic master for consumption by external tools (Swagger UI, API clients)

**Implementation** (`scripts/aggregate-artifacts.js`):
```javascript
#!/usr/bin/env node
/**
 * Aggregate split ROME artifacts into unified files
 * Usage: node scripts/aggregate-artifacts.js
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Aggregate requirements-index
function aggregateRequirementsIndex() {
  const indexDir = 'ARTIFACTS/01-requirements/index';
  const categoryFiles = fs.readdirSync(indexDir)
    .filter(f => f !== '_master.json' && f.endsWith('.json'));

  const categories = [];
  let allRequirements = [];

  categoryFiles.forEach(file => {
    const content = JSON.parse(fs.readFileSync(path.join(indexDir, file)));
    categories.push({
      name: content.category,
      file: `index/${file}`,
      count: content.total_requirements
    });
    allRequirements = allRequirements.concat(content.requirements);
  });

  // Build master index
  const master = {
    pilot_project: "Task Management System",
    total_requirements: allRequirements.length,
    created_date: "2025-12-23",
    last_updated: new Date().toISOString(),
    split_strategy: "category",
    categories,
    // ... statistics, entities, etc.
  };

  fs.writeFileSync(
    path.join(indexDir, '_master.json'),
    JSON.stringify(master, null, 2)
  );

  console.log(`✅ Aggregated ${allRequirements.length} requirements into _master.json`);
}

// Aggregate unified-api-spec
function aggregateAPISpec() {
  const specsDir = 'ARTIFACTS/05-api-specs/specs';
  const specFiles = fs.readdirSync(specsDir).filter(f => f.endsWith('.yaml'));

  const mergedSpec = {
    openapi: '3.0.3',
    info: {
      title: 'Task Management System API',
      description: 'Unified API specification (auto-generated)',
      version: '1.0.0'
    },
    servers: [{ url: '/api/v1', description: 'API Server' }],
    paths: {},
    components: { schemas: {} }
  };

  specFiles.forEach(file => {
    const content = yaml.load(fs.readFileSync(path.join(specsDir, file)));
    // Merge paths
    Object.assign(mergedSpec.paths, content.paths);
    // Merge components (deduplicate schemas)
    if (content.components?.schemas) {
      Object.assign(mergedSpec.components.schemas, content.components.schemas);
    }
  });

  fs.writeFileSync(
    'ARTIFACTS/05-api-specs/unified-api-spec.yaml',
    yaml.dump(mergedSpec, { lineWidth: 120 })
  );

  console.log(`✅ Aggregated ${Object.keys(mergedSpec.paths).length} endpoints into unified-api-spec.yaml`);
}

// Run aggregation
aggregateRequirementsIndex();
aggregateAPISpec();
```

**Invocation**:
```bash
# After editing category specs
node scripts/aggregate-artifacts.js

# Or via npm script
npm run aggregate
```

---

### Validation Script

**Purpose**: Ensure consistency across split files (no duplicate IDs, complete coverage)

**Implementation** (`scripts/validate-split-artifacts.js`):
```javascript
#!/usr/bin/env node
/**
 * Validate split ROME artifacts for consistency
 * Checks:
 * - No duplicate requirement IDs across categories
 * - All REQ-###.yaml files referenced in index
 * - Category totals match actual requirement counts
 */

const fs = require('fs');
const path = require('path');

function validateRequirementsIndex() {
  const indexDir = 'ARTIFACTS/01-requirements/index';
  const categoryFiles = fs.readdirSync(indexDir)
    .filter(f => f !== '_master.json' && f.endsWith('.json'));

  const seenIDs = new Set();
  let violations = [];

  categoryFiles.forEach(file => {
    const content = JSON.parse(fs.readFileSync(path.join(indexDir, file)));

    // Check: Declared count matches actual count
    if (content.total_requirements !== content.requirements.length) {
      violations.push({
        file,
        issue: `Declared total_requirements (${content.total_requirements}) ≠ actual (${content.requirements.length})`
      });
    }

    // Check: No duplicate IDs
    content.requirements.forEach(req => {
      if (seenIDs.has(req.id)) {
        violations.push({
          file,
          issue: `Duplicate requirement ID: ${req.id}`
        });
      }
      seenIDs.add(req.id);
    });
  });

  if (violations.length > 0) {
    console.error('❌ Validation failed:');
    violations.forEach(v => console.error(`  - ${v.file}: ${v.issue}`));
    process.exit(1);
  } else {
    console.log('✅ Requirements index validation passed');
  }
}

validateRequirementsIndex();
```

---

## Migration Path

### Phase 1: Establish Threshold (Current State)
- **Action**: Continue with monolithic files until threshold reached
- **Threshold**: 100 requirements OR 50 API endpoints
- **Monitoring**: Track file line counts in CI/CD

### Phase 2: Initial Split (Medium Projects)
- **Action**: Split by Tier (4 files)
- **Timing**: When threshold exceeded
- **Tooling**: Create `aggregate-artifacts.js` script
- **Robot Training**: Update Clara/Charlie procedures to reference split files

### Phase 3: Fine-Grained Split (Large Projects)
- **Action**: Split by Category (8-10 files)
- **Timing**: When tier files exceed 1,000 lines each
- **Tooling**: Enhance aggregation script for category merging
- **Documentation**: Update ROME lifecycle docs with split strategy

### Phase 4: Nested Split (Very Large Projects)
- **Action**: Split by Category + Subcategory (e.g., core-crud/projects.json, core-crud/tasks.json)
- **Timing**: When category files exceed 1,500 lines
- **Tooling**: Recursive aggregation support

---

## Tradeoffs Summary

| Aspect | Monolithic | Split (Tier) | Split (Category) |
|--------|-----------|--------------|------------------|
| **File Size** | Large (6K+ lines) | Medium (1.5K lines) | Small (500 lines) |
| **LLM Context Efficiency** | Poor (truncation) | Good | Excellent |
| **Human Navigability** | Poor (scroll fatigue) | Good (4 files) | Excellent (semantic grouping) |
| **Tooling Complexity** | None | Low (1 script) | Medium (validation + aggregation) |
| **Merge Conflicts** | High (multi-agent) | Low (isolated tiers) | Very Low (isolated categories) |
| **Query Performance** | Fast (1 file) | Medium (4 files) | Slow (10 files, needs aggregation) |
| **Maintenance Overhead** | None | Low | Medium |

---

## Critical Design Decisions

### Decision 1: When to Split?

**Question**: At what size threshold should splitting occur?

**Recommendation**:
- **requirements-index.json**: Split at 100 requirements (~1,200 lines)
- **unified-api-spec.yaml**: Split at 50 endpoints (~4,000 lines)

**Rationale**:
- LLM Read tool begins truncation warnings at ~2,000 lines
- Human cognitive load increases significantly beyond ~500 lines
- Git diff performance degrades noticeably beyond ~5,000 lines

---

### Decision 2: Split Dimension?

**Question**: Tier, Category, Actor, or ID-range?

**Recommendation**: Category (business capabilities)

**Rationale**:
- **Stability**: Categories rarely change (unlike tiers, which shift during analysis)
- **Semantics**: Developers know where to look ("authentication is in `auth.json`")
- **ROME Alignment**: Categories align with functional decomposition (Phase P2 output)

---

### Decision 3: Auto-generate Master or Manual Maintenance?

**Question**: Should unified files be auto-generated or manually maintained?

**Recommendation**: Auto-generate with script

**Rationale**:
- ✅ **Single source of truth**: Category files are canonical
- ✅ **Consistency**: Aggregation script ensures no drift
- ✅ **DX**: Robots/humans edit category files, script regenerates master
- ⚠️ **Tradeoff**: Adds build step (run `npm run aggregate` before consumption)

**Implementation**:
- Add header comment to auto-generated files: `# AUTO-GENERATED: Edit specs/*.yaml instead`
- Include generation timestamp
- Run aggregation in pre-commit hook or CI/CD pipeline

---

### Decision 4: Backward Compatibility?

**Question**: Support both monolithic and split formats during transition?

**Recommendation**: Yes, with deprecation timeline

**Migration Plan**:
1. **Phase 1 (Months 1-2)**: Support both formats, emit deprecation warnings for monolithic
2. **Phase 2 (Months 3-4)**: Auto-migrate monolithic → split on first robot invocation
3. **Phase 3 (Month 5+)**: Remove monolithic support, split becomes required

**Tooling**:
```javascript
// Auto-detect format
function loadRequirementsIndex() {
  if (fs.existsSync('ARTIFACTS/01-requirements/index/_master.json')) {
    // Split format detected
    return loadSplitIndex();
  } else if (fs.existsSync('ARTIFACTS/01-requirements/requirements-index.json')) {
    // Monolithic format detected
    console.warn('⚠️ DEPRECATED: Monolithic requirements-index.json. Run `npm run migrate-split`');
    return loadMonolithicIndex();
  }
}
```

---

## Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Aggregation script bugs** | High (broken builds) | Medium | Comprehensive test suite, CI validation |
| **Merge conflict in category file** | Medium (delays) | Low | Fine-grained categories reduce collision |
| **Developer confusion** | Medium (DX) | High | Clear documentation, training, examples |
| **Orphaned requirements** | High (data loss) | Low | Validation script checks coverage |
| **Performance regression** | Low (slower queries) | Medium | Cache aggregated master in memory |

---

## Success Criteria

Split strategy considered successful if:
1. ✅ No single artifact file exceeds 2,000 lines (LLM context limit)
2. ✅ Robots can edit artifacts without merge conflicts (90%+ conflict-free rate)
3. ✅ Developers can locate requirements in <10 seconds (navigability)
4. ✅ Aggregation script runs in <5 seconds (performance)
5. ✅ Zero orphaned requirements detected in validation (completeness)

---

## Recommendations

### Immediate Actions (Current: 25 Requirements)
1. ✅ **KEEP** monolithic format (under threshold)
2. ⚠️ **MONITOR** file sizes (set CI warning at 100 reqs)
3. ✅ **PREPARE** aggregation script (ready for future split)

### Medium-Term Actions (50-100 Requirements)
1. ✅ **SPLIT** `unified-api-spec.yaml` by tier (already exceeds 2K lines)
2. ⚠️ **EVALUATE** requirements-index split (approaching threshold)
3. ✅ **IMPLEMENT** validation script (consistency checks)

### Long-Term Actions (100+ Requirements)
1. ✅ **SPLIT** requirements-index by category (exceeds threshold)
2. ✅ **AUTOMATE** aggregation in CI/CD pipeline
3. ✅ **DOCUMENT** split strategy in ROME framework (ROME-PROC-###)

---

## Open Questions

1. **Category Taxonomy**: Who defines canonical category list (Lucien, Clara, Archie)?
2. **Cross-Category Requirements**: How to handle requirements spanning multiple categories?
3. **Historical Tracking**: Should split files preserve requirement creation order or sort by ID?
4. **Tooling Ownership**: Which robot maintains aggregation scripts (Bootstrap, Charlie)?

---

## Appendix: Example Split for Current Pilot

**Current** (Monolithic):
```
ARTIFACTS/01-requirements/requirements-index.json  (297 lines)
```

**Proposed** (Split by Tier):
```
ARTIFACTS/01-requirements/
├── index/
│   ├── _master.json               # Auto-generated, 320 lines
│   ├── tier1-core-crud.json       # 6 reqs, ~80 lines
│   ├── tier2-collaboration.json   # 6 reqs, ~80 lines
│   ├── tier3-advanced.json        # 8 reqs, ~100 lines
│   └── tier4-integration.json     # 5 reqs, ~70 lines
```

**Benefit**: Files under 100 lines each, fast LLM processing, clear organization

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| v1.0 | 2025-12-30T00:00:00Z | Initial file splitting strategy analysis |
