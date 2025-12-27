# Change Management Templates

**ROME-PROP-015 Implementation**
**Version:** 1.0
**Date:** 2025-12-26

---

## Overview

This directory contains templates for managing changes to ROME-generated applications while preserving traceability.

**Key Principle:** Every change to requirements, design, or code must start with a formal Change Request (CR).

---

## Files in this Directory

### CR-TEMPLATE.yaml
Template for creating change requests.

**Usage:**
```bash
# Copy template for new change
cp ROME/templates/changes/CR-TEMPLATE.yaml ARTIFACTS/changes/CR-001.yaml

# Fill in all required fields
# Submit for impact analysis and approval
```

---

## Change Request Workflow

### Phase 1: Request Creation
**Who:** User, Roma, or any robot
**Action:** Create `CR-XXX.yaml` from template
**Status:** PROPOSED

```yaml
ID: CR-001
Type: TERMINOLOGY_CHANGE
Status: PROPOSED
Title: "Rename Company to Organisation"
RequestedBy: User
RequestedDate: 2025-12-26T10:00:00Z
```

### Phase 2: Impact Analysis
**Who:** Roma (orchestrates), relevant robots (analyze)
**Action:** Analyze affected artifacts across all phases
**Status:** Still PROPOSED

```yaml
ImpactAnalysis:
  requirements:
    - REQ-003: Actor "CompanyAdmin" → "OrganisationAdmin"
    - REQ-012: Intent "create_company_profile" → "create_organisation_profile"
  design:
    - FUNC-008: Feature "Company Management" → "Organisation Management"
    - db-schema.yaml: companies table → organisations table
  code:
    - src/models/Company.ts → Organisation.ts
    - Database migration required: Yes
    - API version bump to v2: Yes

EstimatedEffort: "2 days (2 requirements, 2 design docs, 8 code files)"

RiskAssessment:
  breaking: true
  dataLoss: false
  rollbackComplexity: MEDIUM
  testingRequired: true
  deploymentRisk: LOW
```

### Phase 3: Approval
**Who:** Sarah (GATE validator)
**Action:** Review impact analysis, approve or reject
**Status:** APPROVED or REJECTED

```yaml
Status: APPROVED
ApprovedBy: Sarah
ApprovedDate: 2025-12-26T12:00:00Z
```

### Phase 4: Implementation
**Who:** Assigned robots (based on affected artifacts)
**Action:** Execute changes with traceability preservation
**Status:** IN_PROGRESS

**Robot Assignments:**
- **Talib:** Update requirements (REQ-XXX.yaml files)
- **PMA:** Update design documents (FUNC-XXX, UC-XXX)
- **Ashok:** Database migrations, data layer code
- **Reena:** API changes, versioning
- **Charlie:** UI component changes
- **Clara:** Design system updates

```yaml
Status: IN_PROGRESS
ImplementedBy:
  - "Talib: Requirements updated (REQ-003, REQ-012)"
  - "Ashok: Database migration created"
  - "Reena: API versioned to v2"
  - "Charlie: UI components renamed"
```

**Critical:** Each robot must embed change metadata in affected artifacts:

**Requirements (REQ-XXX.yaml):**
```yaml
changeHistory:
  - changeRequest: CR-001
    date: 2025-12-26T14:00:00Z
    type: TERMINOLOGY_CHANGE
    changes:
      - field: Actor
        oldValue: CompanyAdmin
        newValue: OrganisationAdmin
```

**Design Documents (Markdown):**
```markdown
## Change History
- **CR-001** (2025-12-26): Renamed "Company" to "Organisation" for ISO compliance
```

**Code (Comments):**
```typescript
// Changed: CR-001 (2025-12-26) - Renamed Company to Organisation
export interface Organisation {
  id: string;
  name: string;
}
```

### Phase 5: Testing & Verification
**Who:** Sarah (GATE validator)
**Action:** Verify traceability intact, tests pass
**Status:** Still IN_PROGRESS until verified

```yaml
Verification:
  traceabilityIntact: true
  testsPass: true
  validatedBy: Sarah
  validatedDate: 2025-12-26T19:00:00Z
```

### Phase 6: Completion or Rollback
**Who:** Roma (deployment), Sarah (verification)
**Action:** Deploy to production or rollback if issues
**Status:** COMPLETED or ROLLED_BACK

**If successful:**
```yaml
Status: COMPLETED
CompletedDate: 2025-12-26T20:00:00Z
```

**If issues found:**
```yaml
Status: ROLLED_BACK
Rollback:
  reason: "Breaking changes caused API incompatibility"
  rolledBackBy: Roma
  rolledBackDate: 2025-12-26T21:00:00Z
  restorePoint: "git-commit-abc123"
```

---

## Change Types

### TERMINOLOGY_CHANGE
Renaming entities, fields, or concepts.

**Examples:**
- Company → Organisation
- TaskOwner → TaskAssignee
- ProjectManager → TeamLead

**Typical Impact:**
- Requirements: Actor names, Intent names
- Design: Entity names, field names
- Code: Class names, variable names, API parameters
- Database: Table/column names (migration required)

**Breaking:** Usually yes (API, database)

### LOGIC_CHANGE
Modifying business rules or validation logic.

**Examples:**
- Max file size 10MB → 50MB
- Invoice approval requires 1 manager → 2 managers
- Task status workflow: 3 states → 5 states

**Typical Impact:**
- Requirements: Conditions, Invariants, Errors
- Design: Business rules, state machines
- Code: Validation logic, conditional logic
- Database: Constraints (if enforced at DB level)

**Breaking:** Depends (backward compatible if loosening constraints)

### SCHEMA_CHANGE
Database structure modifications.

**Examples:**
- Add field "tax_id" to organisations table
- Change "status" from VARCHAR to ENUM
- Add foreign key constraint

**Typical Impact:**
- Requirements: May add new Preconditions/Postconditions
- Design: db-schema.yaml updates
- Code: Data models, repositories, migrations
- Database: Migration script required

**Breaking:** No if nullable/optional, Yes if required

### API_CHANGE
API contract modifications.

**Examples:**
- Rename parameter "companyId" → "organisationId"
- Add required parameter to endpoint
- Change response structure

**Typical Impact:**
- Requirements: May affect Outcomes
- Design: api-design.md updates
- Code: Controllers, DTOs, client code
- API: Version bump required if breaking

**Breaking:** Yes (requires API versioning)

### UI_CHANGE
User interface modifications.

**Examples:**
- Add new filter option to task list
- Change form layout
- Add new dashboard widget

**Typical Impact:**
- Requirements: May add new Outcomes
- Design: Use cases, wireframes
- Code: Components, views
- Tests: UI/E2E tests

**Breaking:** Rarely (usually additive)

### REQUIREMENT_CHANGE
Fundamental requirement scope or behavior changes.

**Examples:**
- REQ-003 scope expanded to include subsidiaries
- REQ-012 now handles multi-currency
- REQ-008 changed from sync to async processing

**Typical Impact:**
- Requirements: Multiple fields changed
- Design: Functional specs, use cases
- Code: Core business logic
- Database: Possible schema changes

**Breaking:** Yes (ripples through all phases)

**Complexity:** High

---

## Activity Log Integration

All change requests should be tracked in the activity log:

**Request created:**
```javascript
mcp__activity-log__append({
  type: 'CHANGE_REQUEST',
  id: 'CR-001',
  attributes: {
    status: 'PROPOSED',
    type: 'TERMINOLOGY_CHANGE',
    title: 'Rename Company to Organisation'
  }
})
```

**Approved:**
```javascript
mcp__activity-log__append({
  type: 'CHANGE_REQUEST',
  id: 'CR-001',
  attributes: {
    status: 'APPROVED',
    approvedBy: 'Sarah',
    estimatedEffort: '2 days'
  }
})
```

**Completed:**
```javascript
mcp__activity-log__append({
  type: 'CHANGE_REQUEST',
  id: 'CR-001',
  attributes: {
    status: 'COMPLETED',
    traceabilityVerified: true
  }
})
```

---

## Robot Responsibilities

### Roma (Orchestrator)
- Create change requests from user input
- Coordinate impact analysis across robots
- Orchestrate implementation across phases
- Monitor change progress
- Deploy completed changes

### Sarah (Quality Assurance)
- Review and approve change requests
- Verify impact analysis completeness
- Validate traceability preservation
- Verify tests pass after implementation
- Approve or reject deployment

### Talib (P1 - Requirements)
- Analyze impact on requirements
- Update REQ-XXX.yaml files
- Embed changeHistory metadata
- Ensure AORDL validation still passes

### PMA (P2 - Analysis & Design)
- Analyze impact on design documents
- Update functional specs, use cases
- Update entity models, data dictionary
- Maintain traceability to updated requirements

### Lucien (P4 - Configuration)
- Analyze impact on workspace configuration
- Update workspace files if needed
- Coordinate with implementation robots

### Ashok (P5 - Data Layer)
- Create database migration scripts
- Update data models, repositories
- Create rollback scripts
- Test migrations in staging

### Reena (P5 - API Layer)
- Handle API versioning for breaking changes
- Update API contracts, DTOs
- Create client migration guides
- Test backward compatibility

### Charlie (P5 - UI Layer)
- Update UI components
- Update forms, views, navigation
- Test UI changes
- Update UI tests

### Clara (P5 - Design System)
- Update design system components
- Ensure consistency across UI
- Update style guides if needed

---

## Traceability Preservation

**Critical Rule:** Every change must preserve the REQ→Code traceability chain.

**Before Change:**
```
REQ-003 (Actor: CompanyAdmin, Intent: manage_company_profile)
  ↓
FUNC-008 (Company Management)
  ↓
UC-012 (Select Company)
  ↓
src/models/Company.ts
  ↓
src/components/CompanyPicker.tsx
```

**After Change (with CR-001):**
```
REQ-003 (Actor: OrganisationAdmin, Intent: manage_organisation_profile)
  + changeHistory: CR-001
  ↓
FUNC-008 (Organisation Management)
  + Change History: CR-001
  ↓
UC-012 (Select Organisation)
  + Change History: CR-001
  ↓
src/models/Organisation.ts
  // Changed: CR-001
  ↓
src/components/OrganisationPicker.tsx
  // Changed: CR-001
```

**Traceability intact:** Requirements still map to code, metadata shows change history.

---

## Rollback Procedure

If a change causes issues in production:

1. **Create rollback decision:**
   ```yaml
   Status: ROLLED_BACK
   Rollback:
     reason: "Breaking changes caused API incompatibility with mobile app"
     rolledBackBy: Roma
     rolledBackDate: 2025-12-26T21:00:00Z
     restorePoint: "git-commit-abc123"
   ```

2. **Execute rollback:**
   - Revert code changes (git revert)
   - Run database rollback migration
   - Restore API to previous version
   - Revert requirement/design documents

3. **Preserve rollback history:**
   - Keep CR-XXX.yaml with ROLLED_BACK status
   - Add rollback entry to changeHistory in artifacts
   - Log rollback in activity log

4. **Learn and retry:**
   - Analyze root cause
   - Create new CR with fixes
   - Test more thoroughly before deployment

---

## Best Practices

### 1. Always Start with CR
Never make ad-hoc changes. Create CR first, analyze impact, get approval.

### 2. Complete Impact Analysis
Spend time on thorough impact analysis. Missing affected files causes issues.

### 3. Embed Change Metadata
Every changed artifact must have changeHistory or change comments.

### 4. Test Before Deployment
Run full test suite. Verify traceability with Sarah.

### 5. Create Rollback Scripts
For database/API changes, create rollback scripts before deployment.

### 6. Document Breaking Changes
For breaking changes, create migration guides for API clients.

### 7. Version Breaking Changes
Breaking API changes require version bump (v1 → v2).

### 8. Preserve Traceability
REQ→Code traceability must remain intact after every change.

---

## Quick Reference

| Phase | Who | Input | Output | Status |
|-------|-----|-------|--------|--------|
| Request | User/Robot | Need for change | CR-XXX.yaml | PROPOSED |
| Analysis | Roma + Robots | CR-XXX.yaml | Impact analysis | PROPOSED |
| Approval | Sarah | Impact analysis | Approval decision | APPROVED/REJECTED |
| Implementation | Assigned robots | Approved CR | Updated artifacts | IN_PROGRESS |
| Verification | Sarah | Updated artifacts | Traceability check | IN_PROGRESS |
| Deployment | Roma | Verified changes | Production deploy | COMPLETED |

---

## See Also

- **ROME-PROP-015:** Full change management proposal
- **ROME-PROP-007:** Activity logging integration
- **ROME-PROP-016:** Code traceability annotations
- **REQ-TEMPLATE.yaml:** Requirement template with changeHistory field

---

## Revision History

| Version | Date | Summary |
|---------|------|---------|
| 1.0 | 2025-12-26 | Initial implementation of ROME-PROP-015 change management templates |
