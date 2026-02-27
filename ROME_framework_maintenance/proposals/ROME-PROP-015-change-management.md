# ROME-PROP-015: Change Management Protocol

| Field | Value |
|-------|-------|
| **Proposal ID** | ROME-PROP-015 |
| **Title** | Change Management Protocol with Traceability Preservation |
| **Status** | Proposal |
| **Created** | 2025-12-24 |
| **Author** | Framework Analyst & Architect |
| **Priority** | HIGH |
| **Complexity** | High |
| **Dependencies** | ROME-PROP-007 (Activity Logging), ROME-PROP-013 (AORDL Integration) |
| **Scope** | Systematic process for managing changes to requirements, design, and code while preserving traceability |
| **Implementation** | ROME-PROP-026 (G1, G2, G4) delivers the implementation of this proposal |

---

## Problem Statement

**Current Gap:**

Once ROME produces a working application from P0→P5, there is no formal mechanism to handle changes while maintaining traceability:

**Example Scenarios:**
1. User wants to rename "Company" → "Organisation" for standards compliance
2. Requirement REQ-012 needs to change business logic after production deployment
3. Database schema needs a new field added to existing table
4. API endpoint needs parameter renamed (breaking change)
5. UI component needs to support new use case

**Current Issues:**
- No formal change request process
- Changes made ad-hoc break traceability chain (REQ→FUNC→UC→Code)
- No impact analysis before changes
- No systematic propagation across artifacts
- No rollback mechanism if change causes issues
- Activity log doesn't track change history

**Impact:**
- Traceability degrades over time
- Changes in code don't reflect back to requirements
- Requirements become "stale" documentation
- Sarah can't validate if implementation matches design
- Roma can't track what changed and why

---

## Proposed Solution: Formal Change Management Protocol

Introduce a structured process for managing changes at any phase while preserving full traceability.

### Core Principles

1. **Every change starts with a Change Request (CR)**
2. **Impact analysis before implementation**
3. **Systematic propagation across artifacts**
4. **Change metadata embedded in all affected files**
5. **Activity log tracks all changes**
6. **Traceability chain preserved through changes**

---

## Change Request Structure

### Change Request Document

**File:** `ARTIFACTS/changes/CR-###.yaml`

```yaml
ID: CR-001
Type: TERMINOLOGY_CHANGE | LOGIC_CHANGE | SCHEMA_CHANGE | API_CHANGE | UI_CHANGE | REQUIREMENT_CHANGE
Status: PROPOSED | APPROVED | IN_PROGRESS | COMPLETED | REJECTED | ROLLED_BACK
Priority: CRITICAL | HIGH | MEDIUM | LOW

Title: "Rename Company to Organisation for ISO compliance"

Description: |
  External standard requires terminology alignment.
  All references to "Company" should become "Organisation".

Rationale: |
  ISO 27001 certification requires consistent use of "Organisation".
  Current "Company" terminology conflicts with standard.

RequestedBy: User | Roma | <robot-name>
RequestedDate: 2025-12-24T10:00:00Z

ImpactAnalysis:
  requirements:
    - REQ-003: Actor field "CompanyAdmin" → "OrganisationAdmin"
    - REQ-012: Intent "create_company_profile" → "create_organisation_profile"
    - REQ-018: Precondition references to "company"
  design:
    - FUNC-008: Feature "Company Management" → "Organisation Management"
    - UC-012: Use case "Select Company" → "Select Organisation"
    - db-schema.yaml: companies table → organisations table
    - api-design.md: /companies endpoints → /organisations endpoints
  code:
    - src/models/Company.ts → Organisation.ts
    - src/components/CompanyPicker.tsx → OrganisationPicker.tsx
    - Database migration required
    - API version bump to v2 (breaking change)

EstimatedEffort: "2 days (5 requirements, 3 design docs, 8 code files)"

RiskAssessment:
  breaking: true
  dataLoss: false
  rollbackComplexity: MEDIUM
  testingRequired: true
  deploymentRisk: LOW

ApprovedBy: Sarah
ApprovedDate: 2025-12-24T12:00:00Z

ImplementedBy:
  - Talib: Requirements updates
  - PMA: Design document updates
  - Ashok: Database migration
  - Reena: API versioning
  - Charlie: UI component renames

CompletedDate: 2025-12-24T18:00:00Z

Verification:
  traceabilityIntact: true
  testsPass: true
  validatedBy: Sarah
  validatedDate: 2025-12-24T19:00:00Z
```

---

## Change Types Taxonomy

### 1. Terminology Changes
**Example:** Company → Organisation
**Scope:** Names, labels, identifiers
**Breaking:** Usually yes (API, database)
**Complexity:** Medium

### 2. Logic Changes
**Example:** "Max file size 10MB → 50MB"
**Scope:** Business rules, validation logic
**Breaking:** Depends (backward compatible if loosening constraints)
**Complexity:** Low to High

### 3. Schema Changes
**Example:** Add new field "tax_id" to organisations table
**Scope:** Database structure
**Breaking:** No if nullable, Yes if required
**Complexity:** Medium

### 4. API Changes
**Example:** Rename parameter "companyId" → "organisationId"
**Scope:** API contracts
**Breaking:** Yes (requires versioning)
**Complexity:** High

### 5. UI Changes
**Example:** Add new filter option to task list
**Scope:** User interface
**Breaking:** Rarely
**Complexity:** Low to Medium

### 6. Requirement Changes
**Example:** REQ-003 scope expanded to include subsidiaries
**Scope:** Fundamental requirements
**Breaking:** Yes (ripples through all phases)
**Complexity:** High

---

## Change Management Workflow

### Phase 1: Change Request Creation

**Who:** User, Roma, or any robot
**Output:** `CR-###.yaml` in PROPOSED status

```bash
# Roma creates change request
CR_ID=$(date +%Y%m%d-%H%M%S)
cat > ARTIFACTS/changes/CR-${CR_ID}.yaml <<EOF
ID: CR-${CR_ID}
Type: TERMINOLOGY_CHANGE
Status: PROPOSED
Title: "Rename Company to Organisation"
...
EOF
```

**Activity Log:**
```javascript
mcp__activity-log__append({
  type: 'CHANGE_REQUEST',
  id: 'CR-001',
  attributes: {
    status: 'PROPOSED',
    type: 'TERMINOLOGY_CHANGE',
    requestedBy: 'User',
    timestamp: '2025-12-24T10:00:00Z'
  }
})
```

---

### Phase 2: Impact Analysis

**Who:** Roma (orchestrates), relevant robots (analyze)

**Process:**
1. **Roma searches all artifacts** for impacted files
2. **Each robot analyzes their domain:**
   - Talib: Requirements files
   - PMA: Design documents
   - Ashok: Database schemas
   - Reena: API definitions
   - Charlie: UI components
   - Clara: Design system
3. **Roma aggregates impact** into CR-###.yaml

**Tools:**
```bash
# Find all references to "Company"
grep -r "Company" ARTIFACTS/ --include="*.yaml" --include="*.md"
grep -r "Company" src/ --include="*.ts" --include="*.tsx"

# Count impact
echo "Requirements: $(grep -l 'Company' ARTIFACTS/dev/requirements/*.yaml | wc -l)"
echo "Code files: $(grep -rl 'Company' src/ | wc -l)"
```

**Output:** Updated CR-###.yaml with complete ImpactAnalysis section

---

### Phase 3: Approval (GATE)

**Who:** Sarah (validation), User (sign-off)

**Sarah validates:**
- [ ] Impact analysis is complete
- [ ] All affected artifacts identified
- [ ] Risk assessment is accurate
- [ ] Rollback plan exists
- [ ] Test plan covers all changes

**Decision:**
- **APPROVED** → Proceed to implementation
- **REJECTED** → Document reason, close CR
- **DEFERRED** → Schedule for later

**Activity Log:**
```javascript
mcp__activity-log__append({
  type: 'CHANGE_REQUEST',
  id: 'CR-001',
  attributes: {
    status: 'APPROVED',
    approvedBy: 'Sarah',
    timestamp: '2025-12-24T12:00:00Z'
  }
})
```

---

### Phase 4: Systematic Implementation

**Who:** Robots in dependency order

**Implementation Order:**
1. **Talib:** Update requirements (foundational)
2. **PMA:** Update design docs (dependent on requirements)
3. **Ashok:** Update database schema (dependent on design)
4. **Reena:** Update API (dependent on database)
5. **Charlie:** Update UI (dependent on API)
6. **Clara:** Update design system (if needed)

**Critical:** Each robot adds change metadata to updated files

---

#### 4.1 Requirements Update (Talib)

**Before:**
```yaml
# REQ-003.yaml
ID: REQ-003
Actor: CompanyAdmin
Intent: manage_company_profile
Preconditions:
  - User has CompanyAdmin role
```

**After:**
```yaml
# REQ-003.yaml
ID: REQ-003
Actor: OrganisationAdmin
Intent: manage_organisation_profile
Preconditions:
  - User has OrganisationAdmin role

# CHANGE TRACEABILITY
ChangeHistory:
  - changeRequest: CR-001
    date: 2025-12-24T13:00:00Z
    type: TERMINOLOGY_CHANGE
    implementedBy: Talib
    changes:
      - field: Actor
        oldValue: CompanyAdmin
        newValue: OrganisationAdmin
      - field: Intent
        oldValue: manage_company_profile
        newValue: manage_organisation_profile
      - field: Preconditions[0]
        oldValue: "User has CompanyAdmin role"
        newValue: "User has OrganisationAdmin role"
```

**Activity Log:**
```javascript
mcp__activity-log__append({
  type: 'STORY',
  id: 'CR-001-requirements-update',
  attributes: {
    status: 'COMPLETED',
    changeRequest: 'CR-001',
    filesUpdated: ['REQ-003.yaml', 'REQ-012.yaml', 'REQ-018.yaml'],
    implementedBy: 'Talib'
  }
})
```

---

#### 4.2 Design Update (PMA)

**Before:**
```yaml
# db-schema.yaml
tables:
  companies:
    columns:
      - name: company_id
        type: uuid
        primaryKey: true
      - name: company_name
        type: varchar(255)
```

**After:**
```yaml
# db-schema.yaml
tables:
  organisations:
    columns:
      - name: organisation_id
        type: uuid
        primaryKey: true
      - name: organisation_name
        type: varchar(255)

# CHANGE TRACEABILITY
changeHistory:
  - changeRequest: CR-001
    date: 2025-12-24T14:00:00Z
    type: SCHEMA_RENAME
    implementedBy: PMA
    changes:
      - entity: table
        oldValue: companies
        newValue: organisations
      - entity: column
        oldValue: company_id
        newValue: organisation_id
      - entity: column
        oldValue: company_name
        newValue: organisation_name
    migration: "002_rename_company_to_organisation"
```

---

#### 4.3 Database Migration (Ashok)

**Create migration script:**
```sql
-- migrations/002_rename_company_to_organisation.sql
-- Change Request: CR-001
-- Date: 2025-12-24
-- Implemented by: Ashok

BEGIN TRANSACTION;

-- Rename table
ALTER TABLE companies RENAME TO organisations;

-- Rename columns
ALTER TABLE organisations
  RENAME COLUMN company_id TO organisation_id;

ALTER TABLE organisations
  RENAME COLUMN company_name TO organisation_name;

-- Update foreign keys in dependent tables
ALTER TABLE users
  RENAME COLUMN company_id TO organisation_id;

COMMIT;
```

**Rollback script:**
```sql
-- migrations/002_rename_company_to_organisation_ROLLBACK.sql
-- Change Request: CR-001 ROLLBACK

BEGIN TRANSACTION;

ALTER TABLE organisations RENAME TO companies;
ALTER TABLE companies RENAME COLUMN organisation_id TO company_id;
ALTER TABLE companies RENAME COLUMN organisation_name TO company_name;
ALTER TABLE users RENAME COLUMN organisation_id TO company_id;

COMMIT;
```

**Migration metadata:**
```yaml
# migrations/002_rename_company_to_organisation.yaml
migrationID: 002
changeRequest: CR-001
description: Rename Company to Organisation
appliedDate: 2025-12-24T15:00:00Z
rollbackAvailable: true
breaking: true
```

---

#### 4.4 API Versioning (Reena)

**Before:**
```typescript
// api-design.md
POST /v1/companies
GET /v1/companies/:companyId
```

**After (v2 API with backward compatibility):**
```typescript
// api-design.md

# v2 API (NEW - uses Organisation terminology)
POST /v2/organisations
GET /v2/organisations/:organisationId

# v1 API (DEPRECATED - still works, maps to v2)
POST /v1/companies  # DEPRECATED since 2025-12-24 (CR-001)
GET /v1/companies/:companyId  # DEPRECATED since 2025-12-24 (CR-001)

# Change Traceability
changeHistory:
  - changeRequest: CR-001
    date: 2025-12-24T16:00:00Z
    type: API_VERSIONING
    implementedBy: Reena
    changes:
      - action: API_VERSION_BUMP
        oldVersion: v1
        newVersion: v2
      - action: ENDPOINT_RENAME
        old: "/v1/companies"
        new: "/v2/organisations"
      - action: PARAMETER_RENAME
        old: "companyId"
        new: "organisationId"
    backwardCompatibility: true
    deprecationDate: "2025-12-24"
    sunsetDate: "2026-06-24"  # 6 months
```

**Implementation with backward compatibility:**
```typescript
// src/api/organisations.ts

/**
 * @endpoint POST /v2/organisations
 * @changeRequest CR-001
 * @previousEndpoint POST /v1/companies
 * @tracesTo REQ-003
 */
router.post('/v2/organisations', createOrganisation);

/**
 * @deprecated Since 2025-12-24 (CR-001). Use /v2/organisations instead.
 * @sunsetDate 2026-06-24
 */
router.post('/v1/companies', (req, res) => {
  // Map old request to new handler
  return createOrganisation(req, res);
});
```

---

#### 4.5 UI Component Update (Charlie)

**Before:**
```tsx
// src/components/CompanyPicker.tsx
export const CompanyPicker: React.FC = () => {
  return <Select label="Select Company" />;
};
```

**After:**
```tsx
// src/components/OrganisationPicker.tsx

/**
 * @component OrganisationPicker
 * @changeRequest CR-001
 * @previousName CompanyPicker
 * @renamedDate 2025-12-24
 * @implementedBy Charlie
 * @tracesTo REQ-003, UC-012
 */
export const OrganisationPicker: React.FC = () => {
  return <Select label="Select Organisation" />;
};
```

**File rename tracked in git:**
```bash
git mv src/components/CompanyPicker.tsx src/components/OrganisationPicker.tsx
git commit -m "refactor(ui): rename CompanyPicker to OrganisationPicker (CR-001)"
```

**Import updates:**
```tsx
// src/pages/Settings.tsx

// OLD:
// import { CompanyPicker } from '@/components/CompanyPicker';

// NEW (with comment tracking change):
import { OrganisationPicker } from '@/components/OrganisationPicker'; // CR-001: renamed from CompanyPicker
```

---

### Phase 5: Testing & Verification

**Who:** All robots (domain-specific), Sarah (overall validation)

**Test Checklist:**
- [ ] **Unit tests pass** (all robots)
- [ ] **Integration tests pass** (Reena, Charlie)
- [ ] **Migration tested** (Ashok - up and rollback)
- [ ] **API backward compatibility verified** (Reena - v1 still works)
- [ ] **UI regression tested** (Charlie - no broken screens)
- [ ] **Traceability intact** (Sarah - REQ→Code chain preserved)

**Activity Log:**
```javascript
mcp__activity-log__append({
  type: 'CHANGE_REQUEST',
  id: 'CR-001',
  attributes: {
    status: 'TESTING',
    testsPass: true,
    verifiedBy: 'Sarah',
    timestamp: '2025-12-24T19:00:00Z'
  }
})
```

---

### Phase 6: Deployment & Completion

**Roma coordinates deployment:**

1. **Database migration** (Ashok)
   ```bash
   psql -f migrations/002_rename_company_to_organisation.sql
   ```

2. **API deployment** (Reena)
   ```bash
   # Deploy v2 API with v1 backward compatibility
   npm run deploy:api
   ```

3. **UI deployment** (Charlie)
   ```bash
   npm run build
   npm run deploy:frontend
   ```

4. **Update CR-001.yaml status:**
   ```yaml
   Status: COMPLETED
   CompletedDate: 2025-12-24T20:00:00Z
   ```

5. **Final activity log:**
   ```javascript
   mcp__activity-log__append({
     type: 'CHANGE_REQUEST',
     id: 'CR-001',
     attributes: {
       status: 'COMPLETED',
       deployedDate: '2025-12-24T20:00:00Z',
       traceabilityVerified: true,
       allTestsPass: true
     }
   })
   ```

---

## Traceability Preservation Mechanisms

### 1. Change Metadata in Artifacts

**Every updated artifact contains:**
```yaml
changeHistory:
  - changeRequest: CR-###
    date: ISO-8601-timestamp
    type: CHANGE_TYPE
    implementedBy: <robot-name>
    changes:
      - field: <field-name>
        oldValue: <original-value>
        newValue: <new-value>
```

### 2. Forward Traceability (Requirement → Code)

**After change, chain remains intact:**
```
REQ-003 (OrganisationAdmin)
  ↓ [ChangeHistory: CR-001]
FUNC-008 (Organisation Management)
  ↓ [ChangeHistory: CR-001]
UC-012 (Select Organisation)
  ↓ [ChangeHistory: CR-001]
db-schema.yaml (organisations table)
  ↓ [ChangeHistory: CR-001]
POST /v2/organisations
  ↓ [ChangeHistory: CR-001]
OrganisationPicker.tsx

✓ Traceability intact with change history
```

### 3. Backward Traceability (Code → Original Concept)

**Can always trace back to original design:**
```
OrganisationPicker.tsx
  ↓ [@changeRequest CR-001]
CR-001.yaml
  ↓ [ImpactAnalysis]
REQ-003.yaml
  ↓ [ChangeHistory]
Original Actor: "CompanyAdmin"

✓ Can recover original design rationale
```

### 4. Change Query Capabilities

```bash
# Find all artifacts affected by CR-001
grep -r "CR-001" ARTIFACTS/
grep -r "CR-001" src/

# Find all changes to REQ-003
cat ARTIFACTS/dev/requirements/REQ-003.yaml | grep -A 20 "ChangeHistory"

# Find when "Company" became "Organisation"
git log --all --full-history -p -S "Company"

# List all change requests
ls ARTIFACTS/changes/CR-*.yaml
```

---

## Robot Responsibilities

### Roma (Orchestrator)
- Create change requests
- Coordinate impact analysis
- Assign implementation tasks to robots
- Track progress
- Coordinate deployment
- Verify completion

### Sarah (Quality Auditor)
- Approve/reject change requests
- Validate impact analysis
- Verify traceability after changes
- Test validation
- Final verification before deployment

### Talib (Requirements)
- Update AORDL requirements
- Add change metadata to REQ files
- Validate requirement integrity after changes
- Update requirements-catalog.md

### PMA (Design)
- Update design documents
- Update architecture diagrams
- Add change metadata to design files
- Validate design consistency

### Ashok (Database)
- Create migration scripts
- Create rollback scripts
- Test migrations
- Execute migrations during deployment
- Add change metadata to db-schema.yaml

### Reena (API)
- Implement API changes
- Handle API versioning for breaking changes
- Maintain backward compatibility when possible
- Add change metadata to API definitions

### Charlie (UI)
- Update UI components
- Update component names/files
- Add change metadata to component headers
- Test UI changes

### Clara (Design System)
- Update design system components
- Update component documentation
- Maintain design consistency

---

## Change Request Examples

### Example 1: Non-Breaking Logic Change

**Scenario:** Increase max file upload size from 10MB to 50MB

```yaml
ID: CR-002
Type: LOGIC_CHANGE
Status: COMPLETED
Title: "Increase file upload limit to 50MB"

ImpactAnalysis:
  requirements:
    - REQ-007: NonFunctional.performance.maxFileSize: "10MB" → "50MB"
  design:
    - api-design.md: File upload validation logic
  code:
    - src/api/files/upload.ts: MAX_FILE_SIZE constant
    - src/components/FileUpload.tsx: Error message text

EstimatedEffort: "1 hour"

RiskAssessment:
  breaking: false  # Backward compatible (loosening constraint)
  dataLoss: false
  rollbackComplexity: LOW
  testingRequired: true
  deploymentRisk: LOW
```

**Traceability:**
```yaml
# REQ-007.yaml
NonFunctional:
  performance:
    maxFileSize: "50MB"

changeHistory:
  - changeRequest: CR-002
    date: 2025-12-24T15:00:00Z
    type: LOGIC_CHANGE
    implementedBy: Talib
    changes:
      - field: NonFunctional.performance.maxFileSize
        oldValue: "10MB"
        newValue: "50MB"
        reason: "User feedback - scientific data files often exceed 10MB"
```

---

### Example 2: Breaking Schema Change

**Scenario:** Add required field "tax_id" to organisations table

```yaml
ID: CR-003
Type: SCHEMA_CHANGE
Status: COMPLETED
Title: "Add mandatory tax_id field to organisations"

ImpactAnalysis:
  requirements:
    - REQ-003: Add Invariant "Organisation must have valid tax_id"
  design:
    - db-schema.yaml: Add tax_id column (NOT NULL)
    - api-design.md: Add tax_id to POST /organisations request body (required)
  code:
    - migrations/003_add_tax_id.sql: ALTER TABLE + backfill for existing data
    - src/models/Organisation.ts: Add tax_id field
    - src/api/organisations/create.ts: Add validation
    - src/components/OrganisationForm.tsx: Add tax_id input field

EstimatedEffort: "1 day"

RiskAssessment:
  breaking: true  # Existing orgs need tax_id
  dataLoss: false  # Migration includes backfill strategy
  rollbackComplexity: MEDIUM
  testingRequired: true
  deploymentRisk: MEDIUM

MigrationStrategy: |
  1. Add tax_id column as NULLABLE
  2. Backfill existing orgs with placeholder "PENDING"
  3. Deploy UI changes to allow users to update tax_id
  4. After 30 days, make tax_id NOT NULL
```

**Migration:**
```sql
-- migrations/003_add_tax_id.sql (CR-003)

BEGIN TRANSACTION;

-- Step 1: Add as nullable
ALTER TABLE organisations
  ADD COLUMN tax_id VARCHAR(50);

-- Step 2: Backfill existing records
UPDATE organisations
  SET tax_id = 'PENDING-' || organisation_id::text
  WHERE tax_id IS NULL;

-- Step 3: After migration period, make NOT NULL
-- (Run manually after 30 days)
-- ALTER TABLE organisations
--   ALTER COLUMN tax_id SET NOT NULL;

COMMIT;
```

---

### Example 3: Requirement Scope Expansion

**Scenario:** REQ-003 now must support subsidiary organisations

```yaml
ID: CR-004
Type: REQUIREMENT_CHANGE
Status: APPROVED
Title: "Add subsidiary organisation support to REQ-003"

ImpactAnalysis:
  requirements:
    - REQ-003: Add "parent_organisation_id" to data model
    - NEW REQ-024: "Manage subsidiary relationships"
  design:
    - db-schema.yaml: Add parent_organisation_id FK to organisations table
    - api-design.md: Add GET /organisations/:id/subsidiaries endpoint
    - use-cases.md: NEW UC-032 "View organisation hierarchy"
  code:
    - Ashok: Self-referential FK migration
    - Reena: Subsidiaries API endpoint
    - Charlie: Organisation hierarchy tree component

EstimatedEffort: "1 week"

RiskAssessment:
  breaking: false  # Additive change
  dataLoss: false
  rollbackComplexity: LOW (just drop column)
  testingRequired: true
  deploymentRisk: LOW
```

**This triggers:**
1. **New requirement:** REQ-024 (Talib creates)
2. **Updated requirement:** REQ-003 with expanded scope
3. **New use case:** UC-032 (PMA creates)
4. **Schema change:** parent_organisation_id column (Ashok)
5. **New API endpoint:** GET /organisations/:id/subsidiaries (Reena)
6. **New UI component:** OrganisationHierarchyTree (Charlie)

**Traceability:**
```
REQ-024 (NEW - Manage subsidiaries)
  ↓ [Created by CR-004]
FUNC-015 (NEW - Subsidiary management)
  ↓ [Created by CR-004]
UC-032 (NEW - View hierarchy)
  ↓ [Created by CR-004]
db-schema.yaml (parent_organisation_id)
  ↓ [Added by CR-004]
GET /organisations/:id/subsidiaries
  ↓ [Added by CR-004]
OrganisationHierarchyTree.tsx

✓ Full traceability for new feature
```

---

## Rollback Procedures

### When to Rollback

- Production issues discovered after deployment
- Tests reveal unforeseen side effects
- User acceptance testing fails
- Breaking change causes more issues than anticipated

### Rollback Process

1. **Identify change request** to rollback (e.g., CR-001)

2. **Roma coordinates rollback** in reverse order:
   - Charlie: Revert UI changes
   - Reena: Remove/revert API changes (or restore v1 as primary)
   - Ashok: Run migration rollback script
   - PMA: Revert design documents
   - Talib: Revert requirements

3. **Execute database rollback:**
   ```bash
   psql -f migrations/002_rename_company_to_organisation_ROLLBACK.sql
   ```

4. **Git revert:**
   ```bash
   git revert <commit-hash-of-CR-001-implementation>
   ```

5. **Update CR-001.yaml:**
   ```yaml
   Status: ROLLED_BACK
   RollbackDate: 2025-12-25T10:00:00Z
   RollbackReason: "API backward compatibility issues with legacy clients"
   ```

6. **Activity log:**
   ```javascript
   mcp__activity-log__append({
     type: 'CHANGE_REQUEST',
     id: 'CR-001',
     attributes: {
       status: 'ROLLED_BACK',
       rollbackDate: '2025-12-25T10:00:00Z',
       reason: 'API backward compatibility issues'
     }
   })
   ```

### Rollback Traceability

**Change history shows rollback:**
```yaml
# REQ-003.yaml
changeHistory:
  - changeRequest: CR-001
    date: 2025-12-24T13:00:00Z
    type: TERMINOLOGY_CHANGE
    changes:
      - field: Actor
        oldValue: CompanyAdmin
        newValue: OrganisationAdmin
  - changeRequest: CR-001-ROLLBACK
    date: 2025-12-25T10:00:00Z
    type: ROLLBACK
    changes:
      - field: Actor
        oldValue: OrganisationAdmin
        newValue: CompanyAdmin  # REVERTED
```

---

## Integration with Existing ROME Phases

### Change Requests During Development (P0-P5)

**Scenario:** User requests change while robots are still building

**Process:**
1. User submits change request
2. Roma pauses current work
3. Sarah validates impact
4. If approved, robots implement change inline
5. Resume normal workflow

**Example:**
```
User: "Actually, I want Organisation instead of Company"
Status: Charlie is 50% done with UI (P5)

Roma: "Pause current work"
Sarah: "Validates change, approves"
Talib: Updates REQ-003 (already written)
PMA: Updates design docs (already written)
Ashok: Updates schema before generating migrations
Reena: Updates API before implementing
Charlie: Updates component names before continuing

Result: Change integrated cleanly, no rework needed
```

### Change Requests After Delivery

**Scenario:** Production app needs change

**Process:**
1. User submits CR-005
2. Roma creates CR-005.yaml
3. Impact analysis by relevant robots
4. Sarah GATE approval
5. Implementation with change metadata
6. Testing
7. Deployment with migration scripts
8. Activity log update

---

## Change Management Tools

### Proposed Skills

**1. `/create-change-request`**
```bash
# Usage
/create-change-request \
  --type TERMINOLOGY_CHANGE \
  --title "Rename Company to Organisation" \
  --description "ISO compliance requirement"

# Output: CR-###.yaml created with initial structure
```

**2. `/analyze-change-impact`**
```bash
# Usage
/analyze-change-impact --cr CR-001

# Output:
# Requirements affected: 3 files
# Design docs affected: 5 files
# Code files affected: 12 files
# Estimated effort: 2 days
# Breaking: Yes (API v2 required)
```

**3. `/implement-change`**
```bash
# Usage (by Roma)
/implement-change --cr CR-001 --robot talib

# Talib updates requirements with change metadata
```

**4. `/verify-traceability`**
```bash
# Usage (by Sarah)
/verify-traceability --cr CR-001

# Output:
# ✓ REQ-003 → FUNC-008 → UC-012 → Code (intact)
# ✓ All artifacts have change metadata
# ✓ Activity log updated
# ✓ Traceability preserved
```

**5. `/rollback-change`**
```bash
# Usage (by Roma)
/rollback-change --cr CR-001 --reason "Backward compatibility issues"

# Executes rollback in reverse dependency order
```

---

## Success Metrics

### Traceability Preservation
- **Target:** 100% of changes maintain REQ→Code traceability
- **Measure:** `/verify-traceability` passes after every change

### Change Documentation
- **Target:** 100% of changes have CR-###.yaml
- **Measure:** All git commits reference a CR ID

### Rollback Success Rate
- **Target:** 100% of changes can be rolled back cleanly
- **Measure:** Test rollback scripts in staging before production

### Change Impact Accuracy
- **Target:** Impact analysis covers 95%+ of affected files
- **Measure:** Post-implementation review finds <5% missed files

### Time to Implement Changes
- **Baseline:** Unknown (no current process)
- **Target:** 80% of changes implemented within estimated effort
- **Measure:** Compare EstimatedEffort vs actual time

---

## Integration with Activity Log (ROME-PROP-007)

### Activity Log Event Types for Changes

```javascript
// Change request created
mcp__activity-log__append({
  type: 'CHANGE_REQUEST',
  id: 'CR-001',
  attributes: {
    status: 'PROPOSED',
    type: 'TERMINOLOGY_CHANGE',
    title: 'Rename Company to Organisation',
    requestedBy: 'User',
    priority: 'HIGH'
  }
})

// Impact analysis complete
mcp__activity-log__append({
  type: 'CHANGE_REQUEST',
  id: 'CR-001',
  attributes: {
    status: 'ANALYZED',
    requirementsAffected: 3,
    designDocsAffected: 5,
    codeFilesAffected: 12,
    estimatedEffort: '2 days',
    breaking: true
  }
})

// Approval
mcp__activity-log__append({
  type: 'CHANGE_REQUEST',
  id: 'CR-001',
  attributes: {
    status: 'APPROVED',
    approvedBy: 'Sarah',
    approvalDate: '2025-12-24T12:00:00Z'
  }
})

// Implementation progress
mcp__activity-log__append({
  type: 'STORY',
  id: 'CR-001-requirements',
  attributes: {
    status: 'COMPLETED',
    changeRequest: 'CR-001',
    implementedBy: 'Talib',
    filesUpdated: ['REQ-003.yaml', 'REQ-012.yaml']
  }
})

// Completion
mcp__activity-log__append({
  type: 'CHANGE_REQUEST',
  id: 'CR-001',
  attributes: {
    status: 'COMPLETED',
    deployedDate: '2025-12-24T20:00:00Z',
    traceabilityVerified: true
  }
})
```

---

## Integration with Hooks (ROME-PROP-014)

### Proposed Hook: Change Request Reminder

**Trigger:** When robot modifies artifact outside of CR process

```json
{
  "name": "rome-change-request-enforcement",
  "tool": "Edit",
  "phase": "before",
  "enabled": true,
  "condition": {
    "type": "path-match",
    "pattern": "ARTIFACTS/.*"
  },
  "action": {
    "type": "echo",
    "message": "You're modifying an artifact. Is this part of a Change Request?\nIf not, create CR first: /create-change-request"
  }
}
```

---

## Future Enhancements

### 1. Automated Conflict Detection
- Detect if multiple CRs affect same artifact
- Alert Roma to coordinate implementation order

### 2. Change Request Dependencies
```yaml
ID: CR-006
DependsOn: [CR-004, CR-005]  # Must complete CR-004, CR-005 first
```

### 3. Change Request Templates
```yaml
# Template for TERMINOLOGY_CHANGE
# Pre-populated impact analysis queries
# Standard rollback procedures
```

### 4. Change Metrics Dashboard
```markdown
## Project Change Stats
- Total CRs: 15
- Completed: 12
- In Progress: 2
- Rolled Back: 1
- Average time to implement: 1.5 days
- Traceability preserved: 100%
```

---

## Conclusion

ROME-PROP-015 provides a **formal change management protocol** that preserves traceability while allowing systematic changes to requirements, design, and code.

**Key Benefits:**
1. ✅ **Traceability preserved** through change metadata in all artifacts
2. ✅ **Systematic propagation** of changes across all phases
3. ✅ **Rollback capability** with migration scripts
4. ✅ **Activity log integration** for full change history
5. ✅ **Impact analysis** before implementation
6. ✅ **GATE approval** before changes deployed

**Expected Impact:**
- Requirements remain accurate throughout product lifecycle
- REQ→Code traceability maintained at 100%
- Changes implemented consistently across all artifacts
- Rollback available for all changes
- Full audit trail of what changed, when, and why

---

## Next Steps

1. **Approve ROME-PROP-015** for implementation
2. **Create change management skills** (/create-change-request, /analyze-change-impact, etc.)
3. **Update robot CLAUDE.md files** with change management responsibilities
4. **Pilot with small change** (e.g., rename a field)
5. **Validate traceability preservation** with Sarah
6. **Document best practices** based on pilot results

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 1.0 | 2025-12-24 | Initial proposal for formal change management protocol with traceability preservation. Defines CR structure, workflow, robot responsibilities, rollback procedures, and integration with activity logging and hooks. |
