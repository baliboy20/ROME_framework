# Proposal: Layer-Specific Technical Standards & Test Data Strategy

**Date:** 2025-11-10
**Version:** 6.2 proposal
**Status:** Draft
**Author:** Roma (with sponsor input)

---

## Problem Statement

### Issue 1: Developers Not Following Technical Decisions

**Current situation:**
- Charlie (frontend) uses libraries that contradict PMA's architecture decisions
- Technical decisions are buried in prose in `technical-decisions.md`
- No explicit "mandated" vs "forbidden" technology lists
- Developers don't know which expert docs apply to their layer

**Impact:**
- Sarah catches issues in Phase 2B (late)
- Rework required before Phase 3 can start
- Integration issues when developers use incompatible patterns

**Example:**
- PMA decides on Bloc + exceptions architecture
- Charlie uses Riverpod + Dartz/Either (contradicts decision)
- Integration fails because backend uses exceptions, frontend uses Either

### Issue 2: Inconsistent Test Data

**Current situation:**
- Each developer creates ad-hoc test data
- No canonical test users/entities
- Integration tests use different data
- Hard to reproduce bugs across layers

**Impact:**
- Integration tests fail due to data mismatches
- Debugging requires reconstructing test scenarios
- Time wasted on test data setup

---

## Proposed Solution

### Solution 1: Layer-Specific Technical Standards Section

Add explicit standards to PMA's `technical-decisions.md` output.

#### Template Structure

```markdown
## Layer-Specific Technical Standards

### Database Layer (Ashok)

**Mandated:**
- PostgreSQL 15+ with Supabase
- Migration-based schema evolution (no direct schema changes)
- Seed scripts in `PROJECT/dev/test-data/seed.sql`

**Forbidden:**
- Direct SQL in business logic
- Schema changes without migrations
- Non-versioned database changes

**Expert References:**
- `/Experts/expert_supabase/best-practices.md`
- `/Experts/expert_postgresql/migration-guide.md`

**Coding Standards:**
- Table names: snake_case, plural (e.g., `user_accounts`)
- Foreign keys: `{table}_id` (e.g., `user_account_id`)
- Timestamps: `created_at`, `updated_at` (UTC)

---

### Backend Layer (Reena)

**Mandated:**
- Dart + Shelf framework
- Repository pattern for data access
- Exception-based error handling (throw custom exceptions)
- Dio client configuration for external APIs

**Forbidden:**
- Dartz/Either (functional error handling - anti-pattern for this architecture)
- Direct database access from endpoints
- Provider pattern (use dependency injection)

**Expert References:**
- `/Experts/expert_dart_backend/architecture.md`
- `/Experts/expert_api_design/rest-principles.md`
- `/Experts/expert_dart_backend/error-handling.md`

**Coding Standards:**
- Endpoints: `/api/v1/{resource}`
- Error responses: Use HTTP status codes + JSON error body
- All endpoints return JSON
- Use repositories for all data access

---

### Frontend Layer (Charlie)

**Mandated:**
- Flutter 3.x with Bloc state management
- Dio for HTTP client
- Repository pattern (matching backend architecture)
- Exception handling with try/catch
- Equatable for value objects

**Forbidden:**
- Riverpod (anti-pattern - incompatible with Bloc architecture)
- Dartz/Either (use exceptions instead)
- Provider (use Bloc)
- GetX (anti-pattern)
- setState for complex state (use Bloc)

**Expert References:**
- `/Experts/expert_flutter/bloc-architecture.md`
- `/Experts/expert_flutter/anti-patterns.md`
- `/Experts/expert_flutter/dio-setup.md`
- `/Experts/expert_flutter/error-handling.md`

**Coding Standards:**
- BLoC naming: `{Feature}Bloc`, `{Feature}Event`, `{Feature}State`
- Repository naming: `{Entity}Repository`
- File structure: feature-first organization
- State management: Bloc ONLY (no setState for business logic)
```

#### Why This Works

1. **Explicit** - No interpretation needed
2. **Enforceable** - Sarah validates in Phase 2B
3. **Documented** - Links explain "why"
4. **Per-layer** - Charlie sees only what applies to him
5. **Anti-patterns listed** - Prevents common mistakes

---

### Solution 2: Test Data Strategy

PMA defines canonical test datasets in Phase 2.

#### Template Addition to `technical-decisions.md`

```markdown
## Test Data Strategy

### Purpose
All developers MUST use canonical test data for integration tests to ensure consistency.

### Canonical Test Datasets

#### Test Users

| Email | Password | Role | ID | Notes |
|-------|----------|------|-----|-------|
| admin@test.com | test123 | admin | test-user-001 | Full access |
| user1@test.com | test123 | user | test-user-002 | Regular user |
| user2@test.com | test123 | premium | test-user-003 | Premium features |
| blocked@test.com | test123 | user | test-user-004 | Blocked status |

#### Test Products (example for e-commerce)

| Name | SKU | Category | Price | ID | Stock |
|------|-----|----------|-------|-----|-------|
| Laptop Pro | LAPTOP-001 | Electronics | 999.99 | test-prod-001 | 10 |
| Python Book | BOOK-001 | Books | 29.99 | test-prod-002 | 50 |
| Coffee Mug | MUG-001 | Home | 12.99 | test-prod-003 | 100 |

#### Test Orders (example)

| Order ID | User | Product | Quantity | Status | Total |
|----------|------|---------|----------|--------|-------|
| test-order-001 | test-user-002 | test-prod-001 | 1 | completed | 999.99 |
| test-order-002 | test-user-003 | test-prod-002 | 2 | pending | 59.98 |
| test-order-003 | test-user-002 | test-prod-003 | 5 | cancelled | 64.95 |

### Seed Data Location

**Files:**
- `PROJECT/dev/test-data/seed.sql` - Database seed script (Ashok creates)
- `PROJECT/dev/test-data/seed.json` - JSON format for API testing
- `PROJECT/dev/test-data/README.md` - Usage instructions

**Responsibilities:**
- **Ashok (Phase 3):** Create seed.sql script with all test data
- **Reena (Phase 3):** Use seed data for API integration tests, validate JSON format
- **Charlie (Phase 3):** Use same data for UI integration tests
- **All:** Reference canonical IDs in test assertions

### Usage Rules

1. **DO NOT create new test data** unless approved by PMA
2. **DO reference canonical IDs** in all integration tests
3. **DO reset database** to seed state before each test suite
4. **DO document** any new test data additions in this section

### Example Test Assertions

```dart
// Good - uses canonical ID
test('should fetch user profile', () async {
  final user = await repo.getUser('test-user-002');
  expect(user.email, 'user1@test.com');
});

// Bad - creates ad-hoc data
test('should fetch user profile', () async {
  final user = await repo.getUser('random-id-123'); // ❌ Don't do this
});
```
```

---

## Implementation Plan

### Phase 1: Update PMA Documentation

**File:** `ROME/03-phase2-architecture/role-pma.md`

Add new steps to Phase 2 workflow:

```markdown
### Step 2.5: Define Layer-Specific Technical Standards (NEW)

For each layer (Database, Backend, Frontend):

1. List MANDATED technologies, libraries, patterns
2. List FORBIDDEN anti-patterns with explanations
3. Reference expert documents in `/Experts/`
4. Specify coding standards (naming, structure, etc.)

**Output location:**
- Add section "Layer-Specific Technical Standards" to `technical-decisions.md`

**Template:**
- Use template from `/ROME/templates/technical-standards-template.md`

**Validation:**
- Ensure every mandated choice has expert doc reference
- Ensure every forbidden pattern has explanation

---

### Step 2.6: Define Test Data Strategy (NEW)

Create canonical test datasets:

1. Identify core entities (users, products, etc.)
2. Define 3-5 test instances per entity
3. Assign canonical IDs (e.g., `test-user-001`)
4. Document in table format
5. Specify seed data location and responsibilities

**Output location:**
- Add section "Test Data Strategy" to `technical-decisions.md`

**Template:**
- Use template from `/ROME/templates/test-data-strategy-template.md`

**Rules:**
- Test data MUST be usable by all three layers
- IDs MUST be deterministic and documented
- Seed scripts created by Ashok in early Phase 3
```

### Phase 2: Update Sarah's Phase 2B Quality Gate

**File:** `ROME/05-phase2b-audit/role-sarah.md`

Add validation checklist:

```markdown
## Technical Standards Validation (NEW)

### Layer-Specific Standards Check

- [ ] Database layer: Mandated technologies listed
- [ ] Database layer: Forbidden patterns listed with rationale
- [ ] Backend layer: Mandated technologies listed
- [ ] Backend layer: Forbidden patterns listed with rationale
- [ ] Frontend layer: Mandated technologies listed
- [ ] Frontend layer: Forbidden patterns listed with rationale
- [ ] All mandated choices have expert doc references
- [ ] Expert docs exist and are accessible

**If missing or incomplete:** BLOCK Phase 3, return to PMA

### Test Data Strategy Check

- [ ] Canonical test users defined (minimum 3)
- [ ] Core entities have test instances (3-5 each)
- [ ] All test data has canonical IDs documented
- [ ] Seed script location specified
- [ ] Responsibilities assigned (who creates seed data)

**If missing or incomplete:** BLOCK Phase 3, return to PMA
```

### Phase 3: Update Developer CLAUDE.md Templates

**Files:**
- `ROME/templates/claude-md/ashok.md`
- `ROME/templates/claude-md/reena.md`
- `ROME/templates/claude-md/charlie.md`

Add to each template:

```markdown
## ⚠️ CRITICAL: Read Technical Standards FIRST

Before writing ANY code, you MUST:

1. Read `PROJECT/dev/technical-decisions.md` → "Layer-Specific Technical Standards" → **YOUR LAYER**
2. Read ALL referenced expert documents
3. Review the FORBIDDEN patterns list
4. Read "Test Data Strategy" section

### Your Layer: {Database|Backend|Frontend}

**Mandated standards location:**
`PROJECT/dev/technical-decisions.md` → "Layer-Specific Technical Standards" → "{Your Layer}"

**Test data:**
`PROJECT/dev/technical-decisions.md` → "Test Data Strategy"

### Consequences of Not Following Standards

- Sarah will BLOCK your work in Phase 2B review
- You will need to refactor before Phase 3 can proceed
- Integration with other layers will fail
- Project timeline will be delayed

### When in Doubt

1. Check `technical-decisions.md` first
2. Read referenced expert docs
3. Ask PMA for clarification
4. DO NOT proceed if unsure
```

### Phase 4: Create Template Files

**File 1:** `ROME/templates/technical-standards-template.md`
- Full template for layer-specific standards section
- Examples for common tech stacks
- Guidance on what to include

**File 2:** `ROME/templates/test-data-strategy-template.md`
- Template for test data tables
- Examples for different project types
- Seed script specification format

---

## Benefits

### For PMA
- Clear structure for documenting technical decisions
- Forces thinking about anti-patterns upfront
- Test data strategy planned before implementation

### For Sarah
- Explicit checklist for Phase 2B validation
- Can block Phase 3 if standards missing
- Clear criteria for approval

### For Developers (Ashok, Reena, Charlie)
- No ambiguity about what to use
- Expert docs clearly referenced
- Forbidden patterns listed to avoid mistakes
- Consistent test data across all layers

### For Project
- Reduces rework from using wrong technologies
- Faster integration (everyone uses same patterns)
- Consistent testing with canonical data
- Earlier detection of architecture issues (Phase 2B vs Phase 3)

---

## Example: How This Prevents Charlie's Riverpod Issue

### Current Flow (Broken)
1. PMA mentions "state management" in prose
2. Charlie chooses Riverpod (reasonable guess)
3. Sarah catches it in review (too late)
4. Charlie refactors to Bloc (wasted time)

### New Flow (Fixed)
1. PMA explicitly lists in `technical-decisions.md`:
   ```markdown
   **Mandated:** Bloc state management
   **Forbidden:** Riverpod (anti-pattern - incompatible with Bloc architecture)
   **Reference:** /Experts/expert_flutter/bloc-architecture.md
   ```
2. Sarah validates this exists in Phase 2B
3. Charlie reads standards before coding
4. Charlie uses Bloc from start
5. No rework needed

---

## Design Decisions

### 1. Test Data Creation: PMA (Not Ashok)

**Decision:** PMA creates test data strategy AND the actual test datasets in Phase 2.

**Rationale:**
- PMA has full data model understanding
- Test data designed alongside architecture
- Ashok uses PMA's test data for seed scripts
- Ensures test data matches architectural decisions

**Implementation:**
- PMA creates test data tables in Phase 2
- Saves to `PROJECT/dev/test-data/` folder
- Ashok converts to seed.sql in Phase 3

### 2. Expert Documents: External to ROME

**Decision:** Expert documents are external resources, not created by robots.

**Sources:**
- Organization's existing knowledge base (e.g., `/Experts/`)
- MCP servers with expert guidance
- Industry best practices documentation
- Company standards repositories

**PMA's role:**
- ASK sponsor which expert guidance to follow
- REFERENCE existing expert docs (not create them)
- If no formal docs exist, document sponsor's verbal guidance in technical-decisions.md

**Example:**
```
PMA: "Which expert guidance should I follow for Flutter state management?"

Sponsor (has docs): "Use mcp://expert_flutter/bloc-architecture"

Sponsor (no docs): "We prefer Bloc. Avoid Riverpod and GetX."
→ PMA documents this in technical-decisions.md
```

### 3. Coding Standards Detail Level

**Decision:** High-level standards (naming conventions, patterns), not line-by-line style.

**Include:** Architecture patterns, naming conventions, forbidden anti-patterns
**Exclude:** Formatting rules, linting configs (use project .editorconfig instead)

### 4. Test Data Version Control

**Decision:** Yes, all test data in git, regenerate for each test run.

---

## Next Steps

If approved:

1. Create template files (technical-standards-template.md, test-data-strategy-template.md)
2. Update PMA role documentation (add steps 2.5, 2.6)
3. Update Sarah role documentation (add validation checks)
4. Update developer CLAUDE.md templates (add warnings)
5. Test on next project
6. Refine based on feedback

---

## Version History

- **2025-11-10:** Initial proposal (v6.2 candidate)
