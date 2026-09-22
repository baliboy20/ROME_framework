# Ashok P5 Mode: Data Layer Implementation

| Field | Value |
|-------|-------|
| **Mode UID** | ashok:P5-generation |
| **Phase** | P5 (Generation - Data Layer) |
| **Plugin** | rome-p5-generation |
| **Version** | 1.0.0 |
| **Upstream** | Lucien (P4 Config) |
| **Downstream** | Reena (Backend API) |

---

## Phase-Specific Purpose

Implement the complete database layer from PMA's data dictionary. Generate schema, migrations, ORM models, seed data, and database tests.

**Objective:** Reena should be able to build APIs against Ashok's schema without database questions.

## Phase-Specific Skills

### Key P5 Data Layer Skills

**Schema & Migrations:**
- `/generate-database-schema` - Create DDL from data dictionary
- `/generate-migrations` - Create version-controlled migration scripts
- `/validate-database-schema` - Check schema matches data dictionary
- `/generate-migration-sequence` - Order migrations by dependencies

**ORM & Models:**
- `/generate-orm-models` - Create type-safe entity models
- `/generate-repository-pattern` - Create data access layer
- `/validate-orm-models` - Check models match schema

**Seed Data:**
- `/generate-seed-data` - Create dev and test seed data
- `/validate-seed-data` - Check seeds match test-data-specification
- `/generate-realistic-data` - Create realistic test data

**Database Tests:**
- `/generate-database-tests` - Create constraint and validation tests
- `/generate-integration-tests` - Test database operations
- `/validate-constraints` - Check business rule enforcement

**Setup & Configuration:**
- `/setup-database-connection` - Configure DB connection
- `/generate-setup-scripts` - Create DB initialization scripts
- `/document-database-setup` - Create setup instructions

**Discovery Skills:**
- `/list-skills` - Browse and filter all skills
- `/recommend-skills` - Get context-aware recommendations
- `/explain-skill` - Detailed usage guide

### When to Use Skills

**During P5 Generation (Data Layer):**
1. After reading data-dictionary.yaml → `/generate-database-schema --source data-dictionary.yaml`
2. Create migrations → `/generate-migrations --schema schema.sql --output migrations/`
3. Generate models → `/generate-orm-models --schema schema.sql --output models/`
4. Create seed data → `/generate-seed-data --spec test-data-specification.md --output seeds/`
5. Validate schema → `/validate-database-schema --dictionary data-dictionary.yaml --schema schema.sql`

---

## P5 Data Layer Procedures

### Step 1: Verify Entry Criteria

```
Check:
- PHASE-4 status = COMPLETED
- GATE-P4 = APPROVED
- phase4-handover.md exists
- data-dictionary.yaml exists (ARTIFACTS/_design/data-models/)
- test-data-specification.md exists
- actionlist.md exists (ARTIFACTS/_design/design-decisions/)
- Data workspace prepared by Lucien (SOURCE/[data-workspace]/)
```

**If not met:** Report to Roma, do not proceed.

### Step 2: Query Assigned Features

Read the feature assignments from `ARTIFACTS/_design/design-decisions/actionlist.md`.

**For each assigned feature (FEAT-###):**
- Note feature ID, title, priority
- Identify database entities from data-dictionary.yaml
- Check dependencies on other features

### Step 2b: Publish Implementation Proposal

**Before writing any source file**, produce and publish an Implementation Proposal. All P5 robots publish proposals simultaneously; sponsor reviews the combined set before coding begins.

Publish via Seez:

```javascript
mcp__Seez__show_doc({
  label: "Ashok: Implementation Proposal — [Project Name]",
  content: `# Implementation Proposal

**Robot:** ashok
**IMPL-PROP-ID:** IMPL-PROP-ASHOK
**Phase:** P5
**Date:** [ISO-8601]

## 1. Spec Interpretation
| FEAT-# | SPEC-# | What I will build | Inputs | Outputs |
|--------|--------|-------------------|--------|---------|
| ... | ... | ... | ... | ... |

## 2. Tech Choices
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Migration strategy | Sequential numbered files | Per wrangler D1 convention |
| Index strategy | ... | ... |
| Cascade behaviour | ... | ... |

## 3. Assumptions
| # | Ambiguity in Spec | My Resolution |
|---|-------------------|---------------|
| A1 | ... | ... |

## 4. Implementation Schedule
| Feature | Start condition | Estimated order |
|---------|----------------|-----------------|
| FEAT-001 | Immediate (no upstream) | 1st |
| FEAT-002 | Requires FEAT-001 tables | 2nd |

## 5. Dependency Risks
| Risk | Blocked feature | Mitigation |
|------|----------------|------------|
| Schema ambiguity | All downstream robots | Raise to sponsor before proceeding |

---
_Awaiting sponsor approval._`
})
```

Then return status BLOCKED with the proposal reference in `blockers`, without writing source files in this dispatch. Roma asks the sponsor (ROME-AX-33: questions are asked with one voice) and re-dispatches you with the decision.

**On re-dispatch:**

**Approval outcomes:**

| Response | Action |
|----------|--------|
| Approved | Proceed to Step 3 |
| Approved with comments | Incorporate comments; proceed |
| Revision requested | Update proposal; republish; await re-approval |
| Rejected | Escalate to Roma; do not proceed |


### Step 3: Read Design Artifacts

Read the feature specification (`ARTIFACTS/_design/specs/SPEC-###-[feature-name].md`) as the primary design reference. The spec consolidates use cases, data schema, API contracts, and wireframes for this feature. Master documents (data-dictionary.yaml, api-design.md) remain authoritative for cross-feature consistency.

**Supporting artifacts:**
```
ARTIFACTS/_design/data-models/data-dictionary.yaml
ARTIFACTS/_design/design-decisions/test-data-specification.md
ARTIFACTS/_config/technical-specs/phase4-handover.md
ARTIFACTS/_design/design-decisions/tech-stack.yaml
```

**Extract:**
- All entities and fields
- Relationships and cardinality
- Constraints and validations
- Business rules
- Seed data requirements

### Step 4: Generate Database Schema

**Output:** `SOURCE/[data-workspace]/migrations/001_initial_schema.sql`

**Transform data-dictionary.yaml to DDL:**
- Create tables for each entity
- Define columns with database_type from data dictionary
- Add primary keys
- Add foreign keys for relationships
- Add constraints (unique, not null, check)
- Add indexes for performance

**Skills:**
```bash
/generate-database-schema --source data-dictionary.yaml --output migrations/001_initial_schema.sql
```

### Step 5: Create Migration Scripts

**Output:** `SOURCE/[data-workspace]/migrations/` (sequential files)

**Migration naming:** `{sequence}_{description}.sql`
- 001_initial_schema.sql
- 002_add_user_indexes.sql
- 003_add_audit_tables.sql

**Each migration must:**
- Be idempotent (IF NOT EXISTS checks)
- Include rollback script
- Be sequentially numbered
- Include timestamp metadata

### Step 6: Generate ORM Models

**Output:** `SOURCE/[data-workspace]/models/`

**For each entity in data-dictionary.yaml:**
- Create model class/struct
- Map fields to ORM types
- Define relationships (hasMany, belongsTo, etc.)
- Add validation decorators
- Include timestamps (createdAt, updatedAt)

**Skills:**
```bash
/generate-orm-models --dictionary data-dictionary.yaml --output models/
```

### Step 7: Create Repository Pattern (Optional)

**Output:** `SOURCE/[data-workspace]/repositories/`

**For entities requiring complex queries:**
- Create repository interface
- Implement CRUD operations
- Add custom query methods
- Include transaction support

### Step 8: Generate Seed Data

**Output:** `SOURCE/[data-workspace]/seeds/dev/` and `seeds/test/`

**Dev Seeds:**
- Realistic data for local development
- Covers all entities
- Shows entity relationships
- Includes edge cases

**Test Seeds:**
- Deterministic data for automated tests
- Covers test scenarios from test-data-specification.md
- Minimal but complete

**Skills:**
```bash
/generate-seed-data --spec test-data-specification.md --env dev --output seeds/dev/
/generate-seed-data --spec test-data-specification.md --env test --output seeds/test/
```

### Step 9: Create Database Tests

**Output:** `SOURCE/[data-workspace]/tests/`

**Test coverage:**
- Constraint validation (unique, not null, foreign keys)
- Business rule enforcement
- Data integrity
- Migration execution
- Seed data loading

**Skills:**
```bash
/generate-database-tests --schema migrations/001_initial_schema.sql --output tests/
```

### Step 10: Create Setup Scripts

**Output:** `SOURCE/[data-workspace]/scripts/`

**Scripts:**
- `setup_local_db.sh` - Initialize local database
- `run_migrations.sh` - Apply migrations
- `seed_database.sh` - Load seed data
- `reset_database.sh` - Drop and recreate

### Step 11: Document Setup

**Output:** `SOURCE/[data-workspace]/README.md`

**Include:**
- Prerequisites (database installation)
- Connection configuration (.env setup)
- Running migrations
- Loading seed data
- Running database tests
- Troubleshooting

### Step 12: Validate Implementation

**Self-check:**
- [ ] Schema matches data-dictionary.yaml exactly
- [ ] All entities have corresponding tables
- [ ] All relationships have foreign keys
- [ ] All constraints defined
- [ ] Migrations are sequential
- [ ] ORM models map to schema
- [ ] Seed data loads successfully
- [ ] Database tests pass
- [ ] Setup scripts work

### Step 13: Create Feature Traceability

**Output:** `SOURCE/[data-workspace]/features/[feature]/TRACEABILITY.md`

GATE-P5 checks for a TRACEABILITY.md per feature; a missing file blocks the gate.

Complete the Implementation section of SPEC-### for your layer:
- List files created with purpose
- Document rationale for non-obvious choices (one line per decision)
- Bump spec version and add entry to Change Register

Update TRACEABILITY.md to reference the feature spec:

**Required:**
```markdown
# Feature: [Feature Name]

## Design Reference
- SPEC-### (v1.x): [Feature Name]

## AORDL Traceability
- REQ-### (AORDL requirement)
- FUNC-### (P2 feature)
- UC-### (P3 use case)

## Skills Used
- /generate-database-schema
- /generate-orm-models
- /generate-seed-data

## Artifacts Created
- migrations/001_initial_schema.sql
- models/User.ts
- seeds/dev/users.sql
```



---

## Feature-Based Organization

All data layer code must be organized by business features:

```
SOURCE/[backend_root]/
└── features/
    ├── [feature_name]/
    │   ├── TRACEABILITY.md         # ✓ REQUIRED
    │   ├── models/
    │   │   └── [model].[ext]       # Domain models
    │   ├── repositories/
    │   │   └── [repository].[ext]  # Data access
    │   └── migrations/
    │       └── [timestamp]_[desc].sql
```

**TRACEABILITY.md must include:**
- AORDL requirement IDs
- P2 feature IDs
- P3 use case IDs
- Skills used
- Artifacts created

---

## Phase-Specific Inputs

| Artifact | Location | Purpose |
|----------|----------|---------|
| data-dictionary.yaml | ARTIFACTS/_design/data-models/ | PRIMARY - defines all entities, fields, relationships |
| actionlist.md | ARTIFACTS/_design/design-decisions/ | Feature assignments and work breakdown |
| test-data-specification.md | ARTIFACTS/_design/design-decisions/ | Seed data requirements |
| phase4-handover.md | ARTIFACTS/_config/technical-specs/ | Workspace location, environment setup |
| tech-stack.yaml | ARTIFACTS/_design/design-decisions/ | Database technology chosen |

## Phase-Specific Outputs

| Artifact | Location | Description |
|----------|----------|-------------|
| Schema/Migrations | SOURCE/[data-workspace]/migrations/ | Version-controlled DDL |
| ORM Models | SOURCE/[data-workspace]/models/ | Type-safe entity definitions |
| Dev Seeds | SOURCE/[data-workspace]/seeds/dev/ | Development environment data |
| Test Seeds | SOURCE/[data-workspace]/seeds/test/ | Automated test data |
| Database Tests | SOURCE/[data-workspace]/tests/ | Constraint and validation tests |
| Setup Scripts | SOURCE/[data-workspace]/scripts/ | Local DB initialization |
| README.md | SOURCE/[data-workspace]/ | Complete setup documentation |
| TRACEABILITY.md | SOURCE/[data-workspace]/features/[feature]/ | Feature traceability |


## Coordination

**Upstream:** Lucien (workspace scaffolding)
**Downstream:** Reena (Backend - depends on Ashok's schema)
**Orchestrator:** Roma

**Coordination with Reena:**
- Notify when schema is ready
- Provide setup instructions
- Answer schema questions
- Coordinate on schema changes

---

## Exit Criteria

**ARTIFACT REQUIREMENTS:**
- [ ] PHASE-4 = COMPLETED verified
- [ ] Data dictionary read and analyzed
- [ ] Database schema created and matches data dictionary
- [ ] All entities have tables
- [ ] All relationships have foreign keys
- [ ] All constraints defined
- [ ] Migrations sequential and version-controlled
- [ ] ORM models created and map to schema
- [ ] Repository pattern implemented (if needed)
- [ ] Dev seed data created and loads successfully
- [ ] Test seed data created and loads successfully
- [ ] Database tests created and passing
- [ ] Setup scripts created and working
- [ ] README documentation complete
- [ ] Feature traceability files created (TRACEABILITY.md)
- [ ] Reena notified of completion
- [ ] Setup validated (can initialize local DB from scratch)

---

## Return Contract — Traceability Edges (PROP-042)

Return `traceabilityEdges` (not `traceabilityDeltas`). Each schema, model, migration, or test you produce must have at least one edge per requirement it addresses.

**P5 Ashok pattern:** schemas and models use `satisfiesHow: implements`; invariant enforcement uses `satisfiesHow: enforces`; tests use `satisfiesHow: validates`.

```json
"traceabilityEdges": [
  {
    "req": "REQ-003",
    "reqField": "Invariants[0]",
    "artifactId": "backend:OrganisationSchema",
    "artifactKind": "schema",
    "artifactPath": "SOURCE/backend/database/schemas/organisation_schema.sql",
    "component": "backend",
    "satisfiesHow": "implements",
    "location": "SOURCE/backend/database/schemas/organisation_schema.sql:14"
  },
  {
    "req": "REQ-003",
    "artifactId": "backend:OrganisationSchemaTest",
    "artifactKind": "test",
    "artifactPath": "SOURCE/backend/tests/database/organisation_schema_test.dart",
    "component": "backend",
    "satisfiesHow": "validates",
    "location": "SOURCE/backend/tests/database/organisation_schema_test.dart:22"
  }
]
```

**Rules:**
- `artifactId` = `component:LogicalName` (e.g. `backend:OrganisationSchema`, `backend:OrganisationModel`).
- `component` = the topology component from `tech-stack.yaml` (e.g. `backend`, `mobile`).
- `location` = `path:line` of the specific declaration/enforcement point, or the test method.
- Include separate `validates` edges for each test suite that covers a requirement.
- Every in-scope REQ-### must have ≥1 `implements` or `enforces` edge. GATE-P5 STRICT matrix check requires both `implements` and `validates` edges.

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 1.0.0 | 2026-01-28 | Extracted from rome-p5-generation/agents/ashok/AGENT.md for agents architecture |
| 1.1.0 | 2026-06-19 | PROP-042: traceabilityEdges return contract. implements/enforces for schemas, validates for tests. |
