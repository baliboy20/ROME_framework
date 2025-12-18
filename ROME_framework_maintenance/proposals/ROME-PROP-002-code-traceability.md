# Proposal: Code-to-Requirement Traceability Protocol

| Field | Value |
|-------|-------|
| **Document UID** | ROME-PROP-002 |
| **Version** | 0.1 |
| **Date** | 2025-11-25T00:00:00Z |
| **Status** | Proposal |
| **Document Type** | Proposal |
| **Author** | Framework Analyst & Architect |
| **Proposed By** | Sponsor |

---

## Executive Summary

**Proposal:** Establish formal mechanism to trace generated code back to originating requirements.

**Current State:** No formal traceability - code-to-requirement mapping requires manual archaeology through git history and filename guessing.

**Proposed Solution:** Multi-layer traceability using code annotations, git commit tags, file organization, and optional automation.

**Assessment:** HIGH VALUE, LOW EFFORT - Phase 1 implementation adds ~30 seconds per file overhead, enables 10-30 second traceability queries.

**Risk Level:** LOW - Non-invasive additions to existing workflows.

---

## Problem Statement

### Current Gap

**ROME-PRIN-001 Principle 2:** "All transformation steps from requirements to code must be traceable."

**Reality:** Developer discovers code file, cannot determine:
- Which requirement specified this code
- Which feature/story it implements
- Why implementation choices were made
- Which design artifacts informed it

**Consequences:**
- Maintenance requires extensive investigation
- Requirement changes cannot quickly identify affected code
- Knowledge lost when robots/developers rotate off project
- Compliance/audit trails incomplete

---

## Proposed Solution: Multi-Layer Traceability

### Layer 1: Code Annotations ⭐ MANDATORY

**Implementation:** Code generation robots (Charlie, Sarah, Reena) add standardized traceability comment blocks to all generated artifacts.

**Format by Language:**

**TypeScript/JavaScript:**
```typescript
/**
 * @rome-feature FEAT-003
 * @rome-story STORY-003-1-2-api
 * @rome-phase P5
 * @rome-requirement PRD Section 3.2 "User Authentication"
 * @rome-design design/authentication-design.md
 * @rome-robot charlie
 * @rome-generated 2025-11-25T10:30:00Z
 */
export class AuthenticationService {
  // Implementation...
}
```

**Python:**
```python
# @rome-feature: FEAT-003
# @rome-story: STORY-003-1-2-api
# @rome-requirement: PRD Section 3.2 "User Authentication"
# @rome-design: design/authentication-design.md
# @rome-robot: charlie
# @rome-generated: 2025-11-25T10:30:00Z

class AuthenticationService:
    """User authentication service implementation."""
    pass
```

**Dart:**
```dart
/// @rome-feature FEAT-003
/// @rome-story STORY-003-1-2-api
/// @rome-requirement PRD Section 3.2 "User Authentication"
/// @rome-design design/authentication-design.md
/// @rome-robot charlie
/// @rome-generated 2025-11-25T10:30:00Z

class AuthenticationService {
  // Implementation...
}
```

**SQL:**
```sql
-- @rome-feature: FEAT-003
-- @rome-story: STORY-003-1-1-db
-- @rome-requirement: PRD Section 3.2 "User Authentication - Data Model"
-- @rome-design: design/database-schema.md
-- @rome-robot: reena
-- @rome-generated: 2025-11-25T09:15:00Z

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  -- ...
);
```

**Required Fields:**
- `@rome-feature`: Feature ID (FEAT-###)
- `@rome-story`: Story ID (STORY-###-#-#-layer) if applicable
- `@rome-requirement`: Source requirement reference (PRD section, BRD page, etc.)
- `@rome-robot`: Generating robot name
- `@rome-generated`: ISO 8601 timestamp

**Optional Fields:**
- `@rome-phase`: Phase when generated (usually P5)
- `@rome-design`: Related design document path
- `@rome-depends`: Dependencies on other features/stories

**Query Method:**
```bash
# Find all code for FEAT-003
grep -r "@rome-feature FEAT-003" SOURCE/

# Find what implemented specific requirement
grep -r "@rome-requirement.*User Authentication" SOURCE/

# Find all code by Charlie
grep -r "@rome-robot charlie" SOURCE/
```

**Effort:** LOW - 30-60 seconds per file
**Traceability:** MEDIUM-HIGH - Immediate grep-based queries

---

### Layer 2: File Organization 📁 RECOMMENDED

**Implementation:** Organize generated code by feature hierarchy during P5.

**Proposed Structure:**
```
SOURCE/
├── features/
│   ├── FEAT-001-user-authentication/
│   │   ├── database/
│   │   │   ├── users_table.sql              # STORY-001-1-1-db
│   │   │   └── auth_tokens_table.sql        # STORY-001-1-2-db
│   │   ├── backend/
│   │   │   ├── auth_service.ts              # STORY-001-1-1-api
│   │   │   ├── token_manager.ts             # STORY-001-1-2-api
│   │   │   └── password_hasher.ts           # STORY-001-1-3-api
│   │   └── frontend/
│   │       ├── LoginForm.tsx                # STORY-001-1-1-ui
│   │       ├── SessionProvider.tsx          # STORY-001-1-2-ui
│   │       └── LogoutButton.tsx             # STORY-001-1-3-ui
│   ├── FEAT-002-profile-management/
│   │   ├── database/
│   │   ├── backend/
│   │   └── frontend/
│   └── FEAT-003-dashboard/
│       └── ...
└── shared/
    ├── utils/
    ├── types/
    └── constants/
```

**Benefits:**
- Intuitive navigation (FEAT-ID visible in path)
- Feature isolation (easier to extract/modify)
- Clear ownership (feature → robot mapping)
- Simple queries (directory listing)

**Query Method:**
```bash
# Find all artifacts for FEAT-001
ls -R SOURCE/features/FEAT-001-user-authentication/

# Find which feature contains LoginForm
find SOURCE/features -name "LoginForm*"

# Count stories in FEAT-001
ls SOURCE/features/FEAT-001-user-authentication/*/ | wc -l
```

**Effort:** MEDIUM - Requires upfront structure design by PMA
**Traceability:** HIGH - Visual directory structure maps to features

---

### Layer 3: Git Commit Tags 🏷️ MANDATORY

**Implementation:** Structured git commit messages with traceability IDs (already proposed in ROME-PROC-005).

**Format:**
```
[P#] [ROBOT] [FEAT-###] [STORY-###-#-#-layer] Brief description

Extended description:
- What was implemented
- Implementation decisions
- Dependencies

@rome-feature: FEAT-###
@rome-story: STORY-###-#-#-layer
@rome-requirement: [Requirement reference]
@rome-design: [Design doc reference]
```

**Example:**
```
[P5] [CHARLIE] [FEAT-003] [STORY-003-1-2-api] Implement JWT authentication service

- Added AuthenticationService class with token generation/validation
- Implemented token expiration handling
- Added error responses for invalid/expired tokens
- Used jsonwebtoken@9.0.2 library

@rome-feature: FEAT-003
@rome-story: STORY-003-1-2-api
@rome-requirement: PRD Section 3.2 "User Authentication"
@rome-design: design/authentication-design.md
```

**Query Method:**
```bash
# Find all commits for FEAT-003
git log --all --grep="FEAT-003"

# Find when STORY-003-1-2 was implemented
git log --all --grep="STORY-003-1-2"

# Show commit with full details
git show --stat <commit-hash>

# Find all Charlie's commits for FEAT-003
git log --all --author="charlie" --grep="FEAT-003"
```

**Effort:** LOW - Marginal addition to existing commit workflow
**Traceability:** MEDIUM - Full version history with requirements context

---

### Layer 4: Traceability Matrix 📊 RECOMMENDED

**Implementation:** PMA generates and maintains traceability matrix document linking requirements → features → stories → artifacts.

**Format:** Markdown table in `ARTIFACTS/reference/traceability-matrix.md`

**Structure:**
```markdown
# Traceability Matrix: [Project Name]

**Generated:** 2025-11-25T00:00:00Z
**Phase:** P5 (Code Generation)
**Maintainer:** PMA

---

## Feature: FEAT-001 User Authentication

**Requirement:** PRD Section 3.2 "User Authentication"
**Design:** `design/authentication-design.md`, `design/api-spec.yaml`
**Status:** COMPLETED

| Story ID | Layer | Description | Code Files | Tests | Status |
|----------|-------|-------------|------------|-------|--------|
| STORY-001-1-1-db | Database | User table schema | `features/FEAT-001/database/users_table.sql` | `tests/db/users_table.test.sql` | ✓ COMPLETED |
| STORY-001-1-1-api | Backend | Auth service | `features/FEAT-001/backend/auth_service.ts` | `tests/backend/auth_service.test.ts` | ✓ COMPLETED |
| STORY-001-1-1-ui | Frontend | Login form | `features/FEAT-001/frontend/LoginForm.tsx` | `tests/frontend/LoginForm.test.tsx` | ✓ COMPLETED |
| STORY-001-1-2-db | Database | Auth tokens table | `features/FEAT-001/database/auth_tokens_table.sql` | - | ✓ COMPLETED |
| STORY-001-1-2-api | Backend | Token manager | `features/FEAT-001/backend/token_manager.ts` | `tests/backend/token_manager.test.ts` | ✓ COMPLETED |
| STORY-001-1-2-ui | Frontend | Session provider | `features/FEAT-001/frontend/SessionProvider.tsx` | - | ✓ COMPLETED |

---

## Feature: FEAT-002 Profile Management

**Requirement:** PRD Section 4.1 "User Profiles"
**Design:** `design/profile-schema.md`
**Status:** IN_PROGRESS

| Story ID | Layer | Description | Code Files | Tests | Status |
|----------|-------|-------------|------------|-------|--------|
| STORY-002-1-1-db | Database | Profile table | `features/FEAT-002/database/profiles_table.sql` | - | ✓ COMPLETED |
| STORY-002-1-1-api | Backend | Profile service | `features/FEAT-002/backend/profile_service.ts` | - | IN_PROGRESS |
| STORY-002-1-1-ui | Frontend | Profile page | - | - | PENDING |
```

**Maintenance:**
- PMA creates template during P2 (Analysis) with features/stories
- Robots update during P5 as they generate code (add file paths)
- Roma validates completeness at phase gates

**Query Method:**
- Open matrix document
- Search for requirement ID / feature ID / file name
- Navigate to listed artifacts

**Effort:** MEDIUM - Initial template creation (PMA), ongoing updates (robots)
**Traceability:** VERY HIGH - Single source of truth for all mappings

---

### Layer 5: Automated Tooling 🤖 OPTIONAL/FUTURE

**Implementation:** Script to query all traceability layers automatically.

**Tool:** `rome-trace.sh`

```bash
#!/bin/bash
# rome-trace.sh - ROME Traceability Query Tool
# Usage: ./rome-trace.sh FEAT-003

FEATURE_ID=$1

if [ -z "$FEATURE_ID" ]; then
  echo "Usage: $0 FEATURE-ID"
  exit 1
fi

echo "========================================"
echo " ROME Traceability Report"
echo " Feature: $FEATURE_ID"
echo " Generated: $(date -Iseconds)"
echo "========================================"

# 1. Code Files
echo -e "\n=== Code Files ==="
grep -r "@rome-feature $FEATURE_ID" SOURCE/ \
  --include="*.ts" --include="*.tsx" --include="*.dart" --include="*.py" --include="*.sql" \
  | cut -d: -f1 | sort -u

# 2. Git Commits
echo -e "\n=== Git Commits ==="
git log --all --oneline --grep="$FEATURE_ID" | head -20

# 3. Activity Log (if MongoDB available)
echo -e "\n=== Activity Log ==="
if command -v mcp__activity-log__find_by_feature &> /dev/null; then
  mcp__activity-log__find_by_feature --featureId="$FEATURE_ID"
else
  echo "(Activity log MCP not available)"
fi

# 4. Design Documents
echo -e "\n=== Design Documents ==="
grep -r "$FEATURE_ID" ARTIFACTS/design/ 2>/dev/null | cut -d: -f1 | sort -u

# 5. Traceability Matrix
echo -e "\n=== Traceability Matrix ==="
if [ -f ARTIFACTS/reference/traceability-matrix.md ]; then
  sed -n "/## Feature: $FEATURE_ID/,/^## Feature:/p" ARTIFACTS/reference/traceability-matrix.md | head -n -1
else
  echo "(Traceability matrix not found)"
fi

echo -e "\n========================================"
echo " End of Report"
echo "========================================"
```

**Usage:**
```bash
chmod +x rome-trace.sh
./rome-trace.sh FEAT-003
```

**Example Output:**
```
========================================
 ROME Traceability Report
 Feature: FEAT-003
 Generated: 2025-11-25T15:00:00Z
========================================

=== Code Files ===
SOURCE/features/FEAT-003/backend/auth_service.ts
SOURCE/features/FEAT-003/frontend/LoginForm.tsx
SOURCE/features/FEAT-003/database/users.sql

=== Git Commits ===
abc1234 [P5] [CHARLIE] [FEAT-003] Implement auth service
def5678 [P5] [SARAH] [FEAT-003] Add login UI
ghi9012 [P5] [REENA] [FEAT-003] Create user tables

=== Activity Log ===
{
  "id": "FEAT-003-api",
  "feature": "FEAT-003",
  "status": "COMPLETED",
  "robot": "charlie"
}

=== Design Documents ===
ARTIFACTS/design/authentication-design.md
ARTIFACTS/design/api-spec.yaml

=== Traceability Matrix ===
## Feature: FEAT-003 User Authentication
**Requirement:** PRD Section 3.2
**Status:** COMPLETED
[Full matrix entry...]

========================================
 End of Report
========================================
```

**Effort:** HIGH to build (6-8 hours), TRIVIAL to use
**Traceability:** VERY HIGH - Single command for complete lineage

---

## Implementation Phasing

### Phase 1: Minimal Viable Traceability (MVP) ✅ IMMEDIATE

**Timeline:** Current sprint

**Components:**
1. **Code annotations** - Charlie, Sarah, Reena add standardized comment blocks
2. **Git commit tags** - Structured commit messages (already required by ROME-PROC-005)

**Deliverables:**
- Update robot CLAUDE.md files with annotation requirements
- Provide annotation templates for each language
- Document in ROME-PROC-007 (Code Traceability Protocol)

**Effort:** 2-4 hours (documentation), 30-60s per file (ongoing)
**Traceability Capability:** MEDIUM-HIGH
**Query Time:** 10-30 seconds (grep/git log)

---

### Phase 2: Enhanced Traceability 🎯 NEXT

**Timeline:** Next project

**Components:**
3. **File organization** - PMA defines feature-based directory structure during P4
4. **Traceability matrix** - PMA creates template during P2, robots update during P5

**Deliverables:**
- Standard directory structure template
- Traceability matrix template
- PMA CLAUDE.md updates for structure/matrix responsibilities
- ROME-PROC-007 updates

**Effort:** 4-6 hours (setup), ongoing maintenance
**Traceability Capability:** HIGH
**Query Time:** 5-20 seconds (directory nav + matrix lookup)

---

### Phase 3: Automated Traceability 🚀 FUTURE

**Timeline:** After Phase 2 proven

**Components:**
5. **Tooling** - `rome-trace.sh` script for automated queries

**Deliverables:**
- Traceability query script
- Installation/usage documentation
- Integration with ROME workflow

**Effort:** 6-8 hours (build)
**Traceability Capability:** VERY HIGH
**Query Time:** <5 seconds (single command)

---

## Robot Workflow Integration

### Charlie (Backend Code Generation)

**Current Workflow:**
1. Read story specification
2. Read design artifacts
3. Generate code
4. Run tests
5. Commit code
6. Update activity log

**Enhanced Workflow (Phase 1):**
1. Read story specification
2. Read design artifacts
3. Generate code **+ add traceability comment block**
4. Run tests
5. Commit code **with structured message including @rome-* tags**
6. Update activity log

**Additional Time:** +30-60 seconds per file

**Template:**
```typescript
/**
 * @rome-feature ${FEATURE_ID}
 * @rome-story ${STORY_ID}
 * @rome-requirement ${PRD_REFERENCE}
 * @rome-design ${DESIGN_DOC_PATH}
 * @rome-robot charlie
 * @rome-generated ${TIMESTAMP}
 */
```

---

### Sarah (Frontend Code Generation)

Same pattern as Charlie, adapted for JSX/TSX/CSS files.

**Template:**
```typescript
/**
 * @rome-feature ${FEATURE_ID}
 * @rome-story ${STORY_ID}
 * @rome-requirement ${PRD_REFERENCE}
 * @rome-design ${DESIGN_DOC_PATH}
 * @rome-robot sarah
 * @rome-generated ${TIMESTAMP}
 */
```

---

### Reena (Database Code Generation)

Same pattern, adapted for SQL/migration files.

**Template:**
```sql
-- @rome-feature: ${FEATURE_ID}
-- @rome-story: ${STORY_ID}
-- @rome-requirement: ${PRD_REFERENCE}
-- @rome-design: ${DESIGN_DOC_PATH}
-- @rome-robot: reena
-- @rome-generated: ${TIMESTAMP}
```

---

### PMA (Analysis & Decomposition)

**Phase 2 Additions:**
- During P2: Create traceability matrix template with features/stories
- During P4: Define feature-based directory structure
- Ongoing: Monitor matrix completeness

---

### Roma (Orchestration)

**Phase 1+:**
- Audit code commits for traceability tag compliance
- Flag missing annotations in compliance reports

**Phase 2+:**
- Validate traceability matrix completeness before phase transitions
- Verify directory structure compliance

---

## Practical Examples

### Example 1: Tracing LoginForm.tsx to Requirement

**Scenario:** Developer discovers `LoginForm.tsx`, needs to understand originating requirement.

**Method 1 - Code Annotation (10 seconds):**
```bash
$ head -10 SOURCE/features/FEAT-003/frontend/LoginForm.tsx

/**
 * @rome-feature FEAT-003
 * @rome-story STORY-003-1-3-ui
 * @rome-requirement PRD Section 3.2 "User Authentication - Login Interface"
 * @rome-design design/authentication-design.md
 * @rome-robot sarah
 * @rome-generated 2025-11-25T14:00:00Z
 */
```

→ **Result:** PRD Section 3.2 identified in 10 seconds

---

**Method 2 - Git History (30 seconds):**
```bash
$ git log --follow -- LoginForm.tsx | head -20

commit abc1234def5678
Author: sarah <sarah@rome>
Date: 2025-11-25 14:00:00

[P5] [SARAH] [FEAT-003] [STORY-003-1-3-ui] Implement login form

@rome-feature: FEAT-003
@rome-requirement: PRD Section 3.2
```

→ **Result:** PRD Section 3.2 + implementation context

---

**Method 3 - Activity Log (45 seconds):**
```bash
$ mcp__activity-log__find_by_id --id="STORY-003-1-3-ui"

{
  "id": "STORY-003-1-3-ui",
  "feature": "FEAT-003",
  "storyName": "As a user, I want to login with username/password",
  "phase": "5",
  "robot": "sarah",
  "notes": "PRD Section 3.2 - Login interface with form validation"
}
```

→ **Result:** Story description + PRD reference

---

**Method 4 - Traceability Matrix (20 seconds):**
```bash
$ grep -A 10 "LoginForm" ARTIFACTS/reference/traceability-matrix.md

| STORY-003-1-3-ui | Frontend | Login form | features/FEAT-003/frontend/LoginForm.tsx | tests/frontend/LoginForm.test.tsx | ✓ COMPLETED |

Feature: FEAT-003 User Authentication
Requirement: PRD Section 3.2 "User Authentication"
```

→ **Result:** Complete context with tests, status, requirement

---

### Example 2: Finding All Code for FEAT-007

**Scenario:** Need to locate all code implementing FEAT-007 for review/refactor.

**Method 1 - Grep (15 seconds):**
```bash
$ grep -r "@rome-feature FEAT-007" SOURCE/ --include="*.ts" --include="*.tsx" --include="*.sql"

SOURCE/features/FEAT-007/database/payments.sql
SOURCE/features/FEAT-007/backend/payment_service.ts
SOURCE/features/FEAT-007/backend/stripe_adapter.ts
SOURCE/features/FEAT-007/frontend/CheckoutForm.tsx
SOURCE/features/FEAT-007/frontend/PaymentStatus.tsx
```

→ **Result:** All 5 code files identified

---

**Method 2 - Directory Listing (5 seconds):**
```bash
$ find SOURCE/features/FEAT-007 -type f

SOURCE/features/FEAT-007/database/payments.sql
SOURCE/features/FEAT-007/backend/payment_service.ts
SOURCE/features/FEAT-007/backend/stripe_adapter.ts
SOURCE/features/FEAT-007/frontend/CheckoutForm.tsx
SOURCE/features/FEAT-007/frontend/PaymentStatus.tsx
```

→ **Result:** All files in feature directory

---

**Method 3 - Automated Tool (3 seconds):**
```bash
$ ./rome-trace.sh FEAT-007

========================================
 ROME Traceability Report
 Feature: FEAT-007
========================================

=== Code Files ===
SOURCE/features/FEAT-007/database/payments.sql
SOURCE/features/FEAT-007/backend/payment_service.ts
...

=== Git Commits ===
[Full commit history for FEAT-007]

=== Activity Log ===
[All activity entries for FEAT-007]

=== Design Documents ===
ARTIFACTS/design/payment-integration-design.md
```

→ **Result:** Complete feature lineage in single command

---

## Success Metrics

| Metric | Target | Measurement | Phase |
|--------|--------|-------------|-------|
| Annotation coverage | 100% | % code files with @rome-feature annotation | 1 |
| Git tag compliance | 100% | % commits with structured messages | 1 |
| Query time (manual) | <30s | Time to trace code → requirement | 1 |
| Directory structure compliance | 100% | % projects using feature-based org | 2 |
| Matrix completeness | 100% | % stories mapped in matrix | 2 |
| Query time (automated) | <5s | Time with tooling | 3 |

---

## Risk Assessment

### Risk 1: Robot Non-Compliance

**Description:** Robots forget to add annotations or use inconsistent format.

**Probability:** MEDIUM (without enforcement)

**Impact:** MEDIUM - Gaps in traceability

**Mitigation:**
- Add annotation requirement to robot CLAUDE.md (mandatory step)
- Provide copy-paste templates
- Roma audits commits for compliance
- Pre-commit hook validates annotation presence (optional)

---

### Risk 2: Annotation Overhead

**Description:** 30-60s per file slows development.

**Probability:** LOW

**Impact:** LOW - Marginal velocity reduction

**Mitigation:**
- Provide IDE snippets/templates for quick insertion
- Emphasize value: audit trails, maintenance, knowledge preservation
- Measure actual overhead (likely closer to 20-30s with templates)

---

### Risk 3: Stale Traceability Matrix

**Description:** Matrix not updated as code evolves.

**Probability:** MEDIUM (Phase 2 only)

**Impact:** MEDIUM - Matrix becomes unreliable

**Mitigation:**
- Roma validates matrix completeness at phase gates
- Make matrix update part of story completion criteria
- Automated tooling (Phase 3) can regenerate matrix from annotations

---

### Risk 4: Directory Structure Conflicts

**Description:** Feature boundaries unclear, files don't fit clean hierarchy.

**Probability:** LOW

**Impact:** LOW - Shared utilities go in `/shared`, structure still valuable

**Mitigation:**
- Allow `/shared` directory for cross-feature code
- Shared files still get annotations pointing to primary feature
- Document structure conventions in ROME-PROC-007

---

## Framework Document Requirements

### New Documents

1. **ROME-PROC-007:** Code Traceability Protocol
   - Annotation standards for all languages
   - File organization conventions
   - Traceability matrix template
   - Query methods and examples

---

### Updated Documents

1. **Charlie CLAUDE.md:** Add code annotation requirements to workflow
2. **Sarah CLAUDE.md:** Add code annotation requirements to workflow
3. **Reena CLAUDE.md:** Add code annotation requirements to workflow
4. **PMA CLAUDE.md:** Add traceability matrix and directory structure responsibilities
5. **Roma CLAUDE.md:** Add traceability compliance audit procedures
6. **ROME-PROC-005:** Reference code traceability as complement to activity logging

---

## Cost-Benefit Analysis

### Costs

| Item | Effort | Frequency |
|------|--------|-----------|
| Documentation (ROME-PROC-007) | 2-4 hours | One-time |
| Robot CLAUDE.md updates | 1 hour | One-time |
| Annotation per file | 30-60s | Per file (ongoing) |
| Matrix maintenance (Phase 2) | 5-10 min | Per feature |
| Tooling development (Phase 3) | 6-8 hours | One-time |

**Total One-Time:** 9-13 hours (all phases)
**Total Ongoing:** ~45s per file + 7 min per feature (Phases 1-2)

---

### Benefits

| Benefit | Value | Impact |
|---------|-------|--------|
| Audit trail compliance | HIGH | Regulatory/enterprise requirements |
| Knowledge preservation | HIGH | Survives robot/developer rotation |
| Maintenance velocity | MEDIUM | Faster requirement → code navigation |
| Impact analysis | HIGH | Quick "what breaks if I change X?" |
| Onboarding | MEDIUM | New developers/robots understand context |
| Quality assurance | MEDIUM | Verify all requirements implemented |

**ROI Estimate:** 10-30 second query time vs. hours of manual investigation = 100-1000x time savings per query.

**Frequency:** Maintenance/review tasks occur 10-100x per project lifecycle.

**Net Value:** HIGH - One-time + marginal ongoing cost for massive time savings.

---

## Recommendation

### Implement Phase 1 Immediately ✅

**Rationale:**
- Minimal effort (documentation + 30-60s per file)
- Immediate value (grep-based queries work day one)
- Foundation for future automation
- Aligns with ROME-PRIN-001 Principle 2
- No external dependencies

**Action Items:**
1. Document ROME-PROC-007 (Code Traceability Protocol)
2. Update robot CLAUDE.md files with annotation requirements
3. Create annotation templates for TypeScript/JavaScript/Python/Dart/SQL
4. Begin using in current/next project
5. Measure compliance and overhead

**Success Criteria:**
- 100% annotation coverage on generated code
- <30 second query time for code → requirement trace
- Positive robot feedback on workflow integration

---

### Evaluate Phase 2 After First Project

**Decision Point:** After completing one project with Phase 1

**Evaluation Criteria:**
- Did annotations provide sufficient traceability?
- Would directory organization add value?
- Is matrix worth maintenance overhead?
- How frequently were traceability queries needed?

**Proceed to Phase 2 if:**
- Traceability queries frequent (>10 per week)
- Project complexity high (>20 features)
- Multiple robots/developers need coordination
- Enterprise/regulatory requirements demand comprehensive mapping

---

## Related Documents

- **ROME-PRIN-001:** Core Principles (Principle 2: Traceability)
- **ROME-PROC-005:** Activity Logging Protocol (complementary to code traceability)
- **ROME-PROP-001:** Parallel Development (interface contracts require traceability)
- **Git-Based Activity Tracking Review:** Alternative traceability mechanism

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 0.1 | 2025-11-25T00:00:00Z | Initial proposal - code-to-requirement traceability protocol |
