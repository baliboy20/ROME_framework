# Proposal: Design Phase Artifact Conciseness

| Field | Value |
|-------|-------|
| **Document UID** | ROME-PROP-004 |
| **Version** | 0.1 |
| **Date** | 2025-12-18T00:00:00Z |
| **Status** | Proposal |
| **Document Type** | Proposal |
| **Author** | Framework Analyst & Architect |
| **Proposed By** | Sponsor |

---

## Executive Summary

**Proposal:** Reduce design artifact verbosity by eliminating justifications, example code, and rationale bloat.

**Current State:** P03 design artifacts contain extended explanations, alternatives considered, trade-off justifications, and example code that add no execution value for downstream phases.

**Proposed Solution:** Declarative artifact schemas that specify decisions only. Justifications/examples removed unless clarifying ambiguity.

**Assessment:** HIGH VALUE, ZERO EFFORT - Reduces document size 40-60%, accelerates P03 completion, maintains decision integrity.

**Risk Level:** NONE - Downstream phases (P04/P05) consume decisions, not rationale.

---

## Problem Statement

### Framework Principle Conflict

**ROME-DEF-001:16** "All output must be terse, high-signal, and optimized for interpretation by Large Language Models. Avoid conversational filler, decorative prose, or superfluous text."

**Current P03 Requirements:**
- Tech stack WITH justification (ROME-PHASE-004:326)
- "Alternatives Considered" section (ROME-PHASE-004:330)
- "Trade-offs" documentation (ROME-PHASE-004:331)
- Example code in use cases (implied, not mandated but common practice)

**Result:** Design documents contain 40-60% bloat targeting human readers, not LLM execution.

### Downstream Impact

**Config Phase (P04):** Reads tech stack decisions → generates environment config. Does NOT need rationale.

**Generation Phase (P05):** Reads API design, data dictionary, use cases → generates code. Does NOT need justification for pattern choices.

**Actual Usage:**
- Reena: Reads data-dictionary.yaml → generates migrations (no rationale required)
- Charlie: Reads api-design.md → implements endpoints (pattern name sufficient)
- Sarah: Reads use-cases.md → builds UI (component types sufficient)

**Conclusion:** Justifications provide zero execution value; only historical/audit value (achievable via git history).

---

## Proposed Solution

### 1. Tech Stack Schema Revision

**Current (ROME-PHASE-004:319-332):**
```markdown
Application Layer: Frontend technology with rationale
API Layer: Backend technology with rationale
...
Alternatives Considered: Other options and why rejected
Trade-offs: Known compromises and mitigations
Risk Assessment: Technology risks and mitigations
```

**Proposed:**
```yaml
tech_stack:
  application_layer:
    framework: Flutter 3.27.x
    state_management: flutter_bloc ^8.1.0
    dependency_injection: get_it ^8.0.0
    routing: go_router ^14.6.2

  api_layer:
    platform: Parse Server 6.x
    hosting: Back4App | self-hosted
    authentication: Parse Session + JWT fallback

  data_layer:
    database: Parse Server (MongoDB 5.x+)

  additional_technologies:
    - Stripe Flutter SDK ^11.2.0 (payments)
    - Firebase Cloud Messaging (push notifications)
    - image_picker ^1.1.2 (image upload)

  critical_constraints:
    - Parse Server requires MongoDB 5.x minimum
    - Flutter web requires CORS configuration for Parse Server
    - Stripe requires PCI compliance documentation (sponsor responsibility)
```

**Rationale:**
- Technology selections stated unambiguously
- Version constraints specified (execution-critical)
- Critical blockers documented (prevents downstream errors)
- No prose, no alternatives, no philosophical debate

**Size Reduction:** 60-70%

---

### 2. Use Case Schema Revision

**Current (ROME-PHASE-004:414-440):**
```markdown
## UC-###: [Use Case Title]

**Actor**: [User role]
**Preconditions**: [Required state before]
**Postconditions**: [State after completion]

**Main Flow**:
1. [Step 1]
2. [Step 2]

**Alternative Flows**:
- [Condition]: [Alternative path]

**UI Requirements**:
- [UI element specifications]

**API Requirements**:
- [Endpoint]: [Method, payload, response]

**Data Requirements**:
- [Entity operations]
```

**Proposed:**
```markdown
## UC-###: [Title]

Actor: [Role]
Trigger: [Event]

Flow:
1. [Action] → [System response]
2. [Action] → [System response]

Variants:
- [Condition]: [Step deviation]

Requirements:
- UI: [Component type, key data bindings]
- API: [Endpoint pattern reference]
- Data: [Entity CRUD operations]
```

**Rationale:**
- Preconditions/Postconditions merged into Flow step 1/N (implicit)
- "Alternative Flows" → "Variants" (shorter term, same meaning)
- UI Requirements: component type only (detailed layout in Clara deliverables if needed)
- API Requirements: pattern reference (e.g., "REST CRUD", "Parse Cloud Function standard"), not full payload examples

**Size Reduction:** 30-40%

---

### 3. API Design Simplification

**Current Practice (not mandated but common):**
```markdown
### POST /api/users
Creates a new user account.

**Request:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "id": "user_abc123",
  "username": "john_doe",
  "email": "john@example.com",
  "createdAt": "2025-11-25T10:00:00Z"
}
```

**Errors:**
- 400: Validation failure
- 409: Username/email already exists
```

**Proposed:**
```markdown
### POST /api/users
Pattern: REST resource creation
Input: User entity (username, email, password)
Output: User entity (id, username, email, createdAt)
Errors: 400 (validation), 409 (duplicate)
```

**Rationale:**
- Endpoint signature declared
- Entity references point to data-dictionary.yaml (single source of truth)
- Pattern name guides implementation (Charlie knows REST conventions)
- Example JSON adds no execution value (data types in data dictionary)

**Size Reduction:** 70-80%

**Exception:** Include payload examples ONLY when:
- Complex nested structures require clarification
- Non-standard patterns used
- Ambiguity exists in data dictionary mapping

---

### 4. Data Dictionary - NO CHANGE

**Rationale:** data-dictionary.yaml IS the single source of truth (ROME-PRIN-001:93-95). Must remain complete with all fields, types, examples.

**No reduction needed** - already terse YAML format.

---

### 5. Remove Justification Requirements

**Remove from ROME-PHASE-004:**

**Line 254:** "Justification documented for each choice"
**Line 330:** "Alternatives Considered: Other options and why rejected"
**Line 331:** "Trade-offs: Known compromises and mitigations"

**Keep:**
- Line 252: Technology validation (GitHub health check - prevents dead dependencies)
- Line 255: Risks identified (blocking constraints only)

---

## Impact Analysis

### Affected Documents

| Document UID | Change Type | Description |
|--------------|-------------|-------------|
| ROME-PHASE-004 | Modification | Update artifact schemas, remove justification requirements |
| ROME-ROBOT-003 | Clarification | PMA CLAUDE.md - reference updated schemas |
| ROME-ROBOT-006 | Clarification | Clara CLAUDE.md - align UI requirements format |

### Phase Impact

| Phase | Impact | Mitigation |
|-------|--------|------------|
| P00 (Bootup) | None | - |
| P01 (Ingest) | None | - |
| P02 (Analysis) | None | - |
| **P03 (Design)** | **DIRECT** | Update PMA workflow to declarative style |
| P04 (Config) | None (consumes decisions only) | - |
| P05 (Generation) | None (consumes decisions only) | - |

### Traceability Impact

**Concern:** Removing justifications loses decision rationale.

**Resolution:**
- Git history preserves rationale if documented in commit messages
- Sponsor interaction logs (ROME-PROC-002) capture approval discussions
- Amendment entries track changes with rationale
- Design decisions rarely require post-hoc justification (execution focus, not academic review)

---

## Implementation

### Changes to ROME-PHASE-004

**Section: Technology Stack Schema (lines 319-332)**

Replace with:
```yaml
tech-stack.md schema:

tech_stack:
  application_layer:
    framework: [name version]
    state_management: [library version]
    dependency_injection: [library version]
    routing: [library version]

  api_layer:
    platform: [technology version]
    hosting: [provider | deployment model]
    authentication: [mechanism]

  data_layer:
    database: [technology version]

  additional_technologies:
    - [library version] ([purpose])

  critical_constraints:
    - [Blocking constraint description]
```

**Section: Use Case Schema (lines 414-440)**

Replace with:
```markdown
## UC-###: [Title]

Actor: [Role]
Trigger: [Event]

Flow:
1. [Action] → [System response]
2. [Action] → [System response]

Variants:
- [Condition]: [Step deviation]

Requirements:
- UI: [Component type, key interactions]
- API: [Endpoint pattern reference]
- Data: [Entity operations]
```

**Section: Quality Gate 2 - Technology Validation (lines 247-257)**

Remove lines:
- 254: "Justification documented for each choice"
- 255: "Risks identified and mitigation planned"

Add line:
- "Critical blocking constraints documented"

**Section: Exit Criteria (lines 213)**

Change:
- "Tech stack documented | `tech-stack.md` with justifications"

To:
- "Tech stack documented | `tech-stack.md` with technology selections and constraints"

---

### New Artifact Examples

**Create:** `/ROME/life-cycle/P03-design/artifact-templates/`

**Files:**
1. `tech-stack-template.yaml` - Reference implementation
2. `use-case-template.md` - Reference implementation
3. `api-design-template.md` - Reference implementation

---

### Robot Workflow Updates

**PMA (ROME-ROBOT-003):**
- Reference updated schemas
- Remove "document alternatives" from workflow
- Add "specify critical constraints only"

**Clara (ROME-ROBOT-006):**
- Align UI requirements format with revised use case schema
- Remove expectation of detailed UI justification prose

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Design artifact size reduction | 40-60% | Character count comparison |
| P03 completion time | -20% | Time to phase completion |
| LLM token consumption | -40% | Token count for downstream phases |
| Decision clarity | 100% | No ambiguity requiring clarification |
| Downstream phase delays | 0 | No blocks due to unclear design |

---

## Risk Assessment

### Risk: Insufficient Context for Complex Decisions

**Probability:** LOW

**Impact:** LOW - Can add clarification notes to specific decisions as needed

**Mitigation:**
- Schema allows `notes:` field for edge cases requiring explanation
- Complex patterns can reference external pattern documentation
- Sponsor interaction logs capture discussion context

---

### Risk: Audit Trail Gaps

**Probability:** LOW

**Impact:** LOW - Rationale reconstructible from git history + sponsor logs

**Mitigation:**
- Maintain discipline in commit messages (ROME-PROC-005)
- Sponsor interaction protocol captures approval discussions
- Amendment workflow preserves change rationale

---

### Risk: Learning Curve for New Robots

**Probability:** LOW

**Impact:** NONE - Declarative format easier to follow than prose

**Mitigation:**
- Provide template artifacts in P03 directory
- Templates show exact format expected

---

## Comparison: Before/After

### Tech Stack Example

**Before (658 characters):**
```markdown
## Application Layer

**Technology:** Flutter 3.27.x

**Rationale:** Flutter provides cross-platform support for iOS, Android, and Web from a single codebase, aligning with the sponsor's requirement for multi-platform deployment. Version 3.27.x includes stable support for Material Design 3 and improved performance optimizations.

**Alternatives Considered:**
- React Native: Rejected due to limited native performance for complex UI
- Native iOS/Android: Rejected due to budget constraints for maintaining separate codebases

**Trade-offs:**
- Web support is less mature than iOS/Android
- Larger app bundle size compared to native
- Mitigation: Progressive web app approach for web platform

**State Management:** flutter_bloc ^8.1.0
**Rationale:** Well-established pattern with strong community support...
```

**After (168 characters - 74% reduction):**
```yaml
application_layer:
  framework: Flutter 3.27.x
  state_management: flutter_bloc ^8.1.0
  dependency_injection: get_it ^8.0.0
  routing: go_router ^14.6.2
```

---

### Use Case Example

**Before (587 characters):**
```markdown
## UC-003: User Login

**Actor**: Registered User
**Preconditions**: User has valid credentials and is not currently logged in
**Postconditions**: User is authenticated and redirected to dashboard

**Main Flow**:
1. User navigates to login page
2. System displays login form with username and password fields
3. User enters credentials and submits form
4. System validates credentials against database
5. System creates session token
6. System redirects user to dashboard

**Alternative Flows**:
- 4a. Invalid credentials: System displays error message, remains on login page
- 4b. Account locked: System displays account locked message with support contact

**UI Requirements**:
- Login form with email/password fields, submit button, "Forgot Password" link
- Error message display area above form
- Loading indicator during authentication

**API Requirements**:
- Endpoint: POST /api/auth/login
- Payload: { "email": "string", "password": "string" }
- Response (200): { "token": "string", "user": { "id": "string", "email": "string" } }
- Response (401): { "error": "Invalid credentials" }

**Data Requirements**:
- Read User entity for credential verification
- Create Session entity
```

**After (291 characters - 50% reduction):**
```markdown
## UC-003: User Login

Actor: Registered User
Trigger: User accesses login page

Flow:
1. Display login form (email, password) → User enters credentials
2. Submit credentials → Validate against User entity
3. Create Session → Redirect to dashboard

Variants:
- Invalid credentials: Display error, remain on form
- Account locked: Display support contact

Requirements:
- UI: Form (email field, password field, submit button), error display, loading state
- API: POST /auth/login (email, password → token, user)
- Data: User.read (authentication), Session.create
```

---

## Recommendation

### Approve and Implement ✅

**Rationale:**
- Aligns with ROME-DEF-001 (LLM optimization principle)
- Reduces P03 effort by 20-30%
- No downstream risk (phases consume decisions only)
- Improves readability through structured format (YAML/concise markdown)
- Maintains decision integrity

**Action Items:**
1. Update ROME-PHASE-004 (this proposal → modification)
2. Create artifact templates in `/ROME/life-cycle/P03-design/artifact-templates/`
3. Update PMA CLAUDE.md (reference schemas)
4. Update Clara CLAUDE.md (align UI format)
5. Commit with amendment log

**Timeline:** 2-3 hours implementation

**Effective:** Next P03 execution

---

## Related Documents

- **ROME-DEF-001:** Framework Analyst & Architect Role (LLM optimization mandate)
- **ROME-PRIN-001:** Core Principles (Principle 6: Single Source of Truth)
- **ROME-PHASE-004:** Phase 3 Design Operations Guidelines (target document)
- **ROME-ROBOT-003:** PMA Robot Definition
- **ROME-ROBOT-006:** Clara Robot Definition

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 0.1 | 2025-12-18T00:00:00Z | Initial proposal - design artifact conciseness |
