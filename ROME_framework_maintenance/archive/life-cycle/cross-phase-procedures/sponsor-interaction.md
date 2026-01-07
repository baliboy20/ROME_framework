# Cross-Phase Procedure: Sponsor Interaction

| Field | Value |
|-------|-------|
| **Document UID** | ROME-PROC-002 |
| **Version** | 0.1 |
| **Date** | 2025-11-20T00:00:00Z |
| **Status** | Draft |
| **Document Type** | Procedure |
| **Author** | Framework Analyst & Architect |
| **Changes Approved** | false |

## Purpose
Defines standardized procedures for robots to interact with project sponsors (users/stakeholders) to gather clarifications, obtain approvals, and request decisions during any phase of the ROME lifecycle.

## Scope
Applies to all phases and all robots when:
- Requirements are ambiguous or incomplete
- Design decisions require sponsor input
- Multiple valid implementation approaches exist
- Domain expertise needed from sponsor
- Approval required before proceeding
- Constraint conflicts need resolution

## Dependencies
- ROME-PRIN-001 (Core Principles) - Principle 2: Traceability
- ROME-IMPL-001 (Core Principles Implementation)
- Project `.rome-project.json` metadata

## Interaction Categories

### 1. Clarification Requests
**When to use:**
- Ambiguous requirements in source materials
- Contradictory statements in PRD/BRD
- Unclear business rules or constraints
- Missing information needed for progression

**Procedure:**
1. Document the ambiguity precisely
2. Reference source material location (PRD section, page, etc.)
3. Formulate specific question (avoid open-ended)
4. Propose 2-3 interpretation options if possible
5. Log interaction request with timestamp
6. Present to sponsor via designated channel
7. Record sponsor response verbatim
8. Update traceability log linking response to requirement/design element

**Example Format:**
```markdown
## Clarification Request: [Brief Topic]
**Phase:** [Current Phase]
**Robot:** [Robot Name]
**Date:** [ISO 8601 timestamp]
**Source Reference:** PRD Section 3.2, Page 5

**Ambiguity:**
The PRD states "users must authenticate before accessing reports" but also mentions "public dashboard access." These appear contradictory.

**Question:**
Which user types require authentication?

**Proposed Interpretations:**
A) All users authenticate; public dashboard is separate feature
B) Dashboard has public view; detailed reports require auth
C) Dashboard and reports both require authentication; "public" refers to external users with credentials

**Sponsor Response:**
[To be filled after sponsor interaction]

**Traceability:**
- Links to: REQ-AUTH-001, REQ-DASHBOARD-003
```

### 2. Design Approval Requests
**When to use:**
- Architectural decisions with significant impact
- Multiple valid design approaches exist
- Trade-offs require business priority input
- Technology choices affecting budget/timeline

**Procedure:**
1. Document design decision point
2. Present options with pros/cons analysis
3. Highlight trade-offs (cost, time, complexity, scalability)
4. Recommend approach with rationale (optional)
5. Request explicit approval
6. Log decision with timestamp and sponsor name
7. Update architectural decision records (ADR)

**Example Format:**
```markdown
## Design Approval: [Decision Topic]
**Phase:** Design
**Robot:** pma
**Date:** [ISO 8601 timestamp]

**Decision Point:**
Database architecture for multi-tenant application

**Options:**

**Option A: Shared Schema (Single Database)**
- Pros: Lower infrastructure cost, simpler deployment
- Cons: Complex row-level security, potential data leakage risk
- Estimated Cost: $500/month
- Complexity: Medium

**Option B: Separate Databases per Tenant**
- Pros: Strong data isolation, easier compliance
- Cons: Higher cost, complex provisioning
- Estimated Cost: $2000/month (100 tenants)
- Complexity: High

**Option C: Hybrid (Shared + Isolated Tiers)**
- Pros: Flexibility, cost optimization
- Cons: Most complex, dual management
- Estimated Cost: $1200/month
- Complexity: Very High

**Recommendation:**
Option A for MVP; migrate to Option C post-launch as tenant count grows.

**Sponsor Decision:**
[To be filled]

**Traceability:**
- ADR-003
- REQ-MULTI-TENANT-001
```

### 3. Domain Expertise Requests
**When to use:**
- Technical robot lacks domain knowledge
- Business rules require industry expertise
- Regulatory/compliance requirements unclear
- User workflow details needed

**Procedure:**
1. Identify knowledge gap
2. Formulate specific information need
3. Request sponsor consultation or expert referral
4. Document expert input verbatim
5. Validate understanding with sponsor
6. Incorporate into data dictionary or requirements
7. Log expert contribution for traceability

**Example Format:**
```markdown
## Domain Expertise Request: [Topic]
**Phase:** Analysis
**Robot:** talib
**Date:** [ISO 8601 timestamp]

**Knowledge Gap:**
Healthcare provider credentialing workflow specifics

**Information Needed:**
- Required credentialing documents
- Validation steps and responsible parties
- Typical processing timeline
- Regulatory requirements (HIPAA, state-specific)

**Sponsor Action:**
[Expert contact information or inline explanation]

**Expert Input:**
[Detailed domain knowledge from sponsor/expert]

**Validation:**
[Robot's interpretation for sponsor confirmation]

**Incorporation:**
- Added to Data Dictionary: DICT-CREDENTIAL-001
- Referenced in: REQ-PROVIDER-VERIFY-003

**Traceability:**
- Source: [Expert name/role], [Date]
```

### 4. Approval for Phase Progression
**When to use:**
- Quality gate passed, ready for next phase
- All exit criteria met
- Orchestrator requests sponsor sign-off
- Formal milestone approval required

**Procedure:**
1. Orchestrator (roma) compiles phase summary
2. List all deliverables and outputs
3. Confirm exit criteria satisfaction
4. Highlight any deviations or risks
5. Request formal approval to proceed
6. Log approval with timestamp
7. Update `.rome-project.json` phase status

**Example Format:**
```markdown
## Phase Progression Approval: [Phase Name]
**Phase:** [Completed Phase]
**Orchestrator:** roma
**Date:** [ISO 8601 timestamp]

**Phase Summary:**
Analysis phase complete. All requirements extracted and validated.

**Deliverables:**
- 143 atomic requirements documented
- Data dictionary with 87 domain terms
- Requirement traceability matrix to source PRD/BRD
- 12 clarifications resolved with sponsor

**Exit Criteria Status:**
✓ All source content represented as atomic requirements
✓ Requirements validated for completeness
✓ Ambiguities resolved
✓ Data dictionary established
✓ Traceability links documented

**Deviations/Risks:**
- 3 requirements marked as "future phase" per sponsor direction
- Performance requirement quantification deferred to Design phase

**Approval Request:**
Approve progression to Design phase?

**Sponsor Approval:**
[Approved/Rejected] - [Sponsor Name] - [Date]

**Next Phase:**
Design (Phase 2)

**Traceability:**
- Phase status updated in .rome-project.json
- Logged in: ARTIFACTS/02-analysis/phase-approval.md
```

### 5. Constraint Conflict Resolution
**When to use:**
- Technical constraints conflict with requirements
- Budget/timeline conflicts with scope
- Regulatory requirements conflict with design preferences
- Performance requirements unachievable with constraints

**Procedure:**
1. Document constraint conflict precisely
2. Explain technical/business implications
3. Present resolution options with trade-offs
4. Request sponsor prioritization decision
5. Log decision and rationale
6. Update technical specifications or requirements accordingly

**Example Format:**
```markdown
## Constraint Conflict Resolution: [Conflict Topic]
**Phase:** Config
**Robot:** charlie
**Date:** [ISO 8601 timestamp]

**Conflict:**
Requirement REQ-PERF-001 specifies <100ms response time for all API calls. Technical constraint TECH-INFRA-002 limits us to shared hosting with average 200ms latency.

**Implications:**
- Meeting performance requirement requires dedicated infrastructure
- Cost increase: $300/month → $1500/month
- Timeline impact: 2 weeks for infrastructure setup

**Resolution Options:**

**Option A: Upgrade Infrastructure**
- Meets performance requirement
- Increased cost and timeline
- Future scalability benefit

**Option B: Relax Performance Requirement**
- Modify to <200ms for most calls, <500ms acceptable for heavy queries
- No cost/timeline impact
- May affect user experience

**Option C: Phased Approach**
- Launch with shared hosting
- Monitor actual performance
- Upgrade if user complaints exceed threshold
- Delayed cost, risk of poor launch experience

**Sponsor Decision:**
[To be filled]

**Updated Artifacts:**
[Requirement or constraint modification details]

**Traceability:**
- REQ-PERF-001 (potentially modified)
- TECH-INFRA-002
```

## Communication Channels

### Primary Channel: Project Documentation
- All sponsor interactions logged in `/ARTIFACTS/reference/meetings/sponsor-interactions.md`
- Chronological log with unique interaction IDs
- Cross-referenced in relevant requirement/design documents

### Secondary Channels
- Email (for asynchronous clarifications)
- Scheduled meetings (for complex design approvals)
- Real-time chat (for urgent blocking issues)
- Screen-sharing sessions (for UI/UX feedback)

**Channel Selection Criteria:**
- **Urgent + Blocking:** Real-time chat or immediate meeting
- **Complex + High-impact:** Scheduled meeting with preparation
- **Simple + Non-blocking:** Email or documentation comment
- **Requires demonstration:** Screen-sharing session

## Traceability Requirements

### Every Sponsor Interaction Must Log:
1. **Interaction ID:** Format `SI-[PHASE]-[NUMBER]` (e.g., SI-ANALYSIS-001)
2. **Timestamp:** ISO 8601 format
3. **Robot initiating interaction**
4. **Phase context**
5. **Interaction category** (Clarification/Approval/Expertise/etc.)
6. **Question/request verbatim**
7. **Sponsor response verbatim**
8. **Action taken** (requirement updated, design modified, etc.)
9. **Links to affected artifacts** (requirements, designs, configs)

### Centralized Log Location
`/ARTIFACTS/reference/meetings/sponsor-interactions.md`

**Format:**
```markdown
# Sponsor Interaction Log

## SI-ANALYSIS-001
**Date:** 2025-11-20T14:30:00Z
**Robot:** talib
**Phase:** Analysis
**Category:** Clarification
**Status:** Resolved

**Question:**
[...]

**Sponsor Response:**
[...]

**Action Taken:**
Updated REQ-AUTH-003 to specify authentication applies to all users except public dashboard view.

**Artifacts Updated:**
- /ARTIFACTS/02-analysis/requirements/REQ-AUTH-003.md
- /ARTIFACTS/02-analysis/requirement-maps/prd-to-requirements.md
```

## Quality Gates

### Before Sponsor Interaction:
- Question/request is specific and actionable
- All available information from existing sources exhausted
- Multiple interpretations considered (if clarification request)
- Impact of decision documented (if approval request)

### After Sponsor Interaction:
- Response documented verbatim
- Robot interpretation validated with sponsor (if complex)
- Affected artifacts updated
- Traceability links established
- Interaction logged in central register

## Error Handling

### Sponsor Unavailable
1. Log blocked status with timestamp
2. Escalate to orchestrator (roma)
3. Identify alternative: defer decision, make assumption with flag, consult domain expert
4. Document assumption and risk if proceeding without sponsor input
5. Retry sponsor contact at scheduled interval

### Ambiguous Sponsor Response
1. Request clarification immediately
2. Restate understanding for confirmation
3. Provide specific examples illustrating interpretation
4. Do not proceed until clarity achieved

### Conflicting Sponsor Guidance
1. Document both positions with timestamps
2. Highlight contradiction explicitly
3. Request sponsor reconciliation
4. Escalate to orchestrator if unresolved
5. Do not proceed with conflicting requirements

## Best Practices

### Do:
- Ask specific, closed questions when possible
- Provide context and source references
- Offer options with trade-offs analyzed
- Document everything verbatim
- Validate understanding before acting
- Thank sponsor for input explicitly

### Don't:
- Ask open-ended "what do you want?" questions
- Present technical jargon without explanation
- Make sponsor choose without trade-off information
- Paraphrase sponsor responses without validation
- Proceed with assumptions when clarity is achievable
- Overwhelm sponsor with excessive simultaneous requests

### Batching Interactions
When multiple questions arise:
- Group by topic/phase for coherence
- Prioritize blocking issues first
- Limit to 3-5 questions per interaction session
- Allow sponsor time to consider complex decisions

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 0.1 | 2025-11-20T00:00:00Z | Initial procedure definition |
