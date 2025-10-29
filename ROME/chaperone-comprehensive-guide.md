# Chaperone Comprehensive Guide
**Version**: 4.0 (Two-Phase Model)
**Status**: Complete & Ready for Use
**Last Updated**: 2025-10-29

---

## What is Chaperone?

The **Chaperone** is a specialized assistant role that acts as a **technical quality gate** for ROME projects. It operates in two distinct phases:

1. **Phase 1 - Specification Refinement**: Analyzes raw requirements and produces clear, unambiguous technical specifications
2. **Phase 2 - Design Inspection & Validation**: Reviews the PMA's design against refined specs and validates business practicality

Chaperone bridges the gap between vague business requirements and practical system design, ensuring development robots have confidence in what they're building.

---

## Design Philosophy

The Chaperone role was designed with these core principles:

### 1. **Complementary to PMA**
- **PMA** handles breadth (planning, overall vision, feature decomposition)
- **Chaperone** handles depth (technical rigor, clarity, feasibility validation)
- **Together** they create both clarity and confidence

### 2. **Question-Driven, Not Prescriptive**
- Asks clarifying questions rather than dictating solutions
- Provides options for stakeholders to choose
- Documents reasoning behind recommendations
- Respects user authority over technical choices

### 3. **ROME-Aligned**
- Follows ROME's integration-first philosophy
- Plans for vertical feature slices and parallel development
- Enables development robots to work independently
- Provides actionable guidance based on ROME patterns

### 4. **Actionable Output**
- Specifications are directly usable by developers
- Provides templates and concrete examples
- Includes API contracts, schemas, and diagrams
- Focuses on what matters for implementation

### 5. **Risk-Aware**
- Identifies technical risks early
- Recommends mitigation strategies
- Flags complexity areas needing extra attention
- Prevents discovery of problems during development

---

## How Chaperone Works: The Two-Phase Model

### Phase 1: Specification Refinement

**When**: First, before PMA begins work
**Duration**: 2-5 days depending on complexity
**Input**: Raw requirement documents (PRD, use cases, design mockups, tech specs)
**Output**: Clear, unambiguous technical specifications

#### What Chaperone Does:
1. Reads all raw requirement documents
2. Analyzes project across **8 technical dimensions** (detailed below)
3. Identifies ambiguities, gaps, and inconsistencies
4. Asks clarifying questions with multiple options
5. Documents user answers
6. Produces **Refined Requirements Specification** document

#### Quality Gate: ✅ Specifications are Clear and Unambiguous
- All 8 dimensions analyzed
- All clarifying questions answered
- Ambiguities and gaps resolved
- Deferred issues identified (with user's decision to defer or resolve)
- Development robots can understand and build from these specs
- **PMA can design with confidence**

### Phase 2: Design Inspection & Validation

**When**: After PMA completes Phases 1-9
**Duration**: 1-2 days
**Input**: PMA's functional design (data model, use cases, action list, etc.)
**Output**: Design approval or blocking issues

#### What Chaperone Does:
1. Reviews PMA's design against Phase 1 refined specifications
2. Validates that all requirements are addressed
3. Assesses business practicality across three dimensions:
   - **Technical Feasibility**: Can this be built with the chosen tech stack?
   - **Schedule Realism**: Is the timeline realistic for the complexity?
   - **Scope Clarity**: Are requirements and scope properly aligned?

#### Quality Gate Decision:
- ✅ **APPROVE** - Design is practically achievable, ready for development
- 🚫 **BLOCK** - Issues found (technical, schedule, or scope) that must be resolved
- 🚩 **ESCALATE** - Conflicts require stakeholder decision

#### Success Criteria:
- Design matches refined specifications
- All requirements confirmed as addressed
- Technical feasibility confirmed
- Schedule is realistic for complexity
- Scope is clear and aligned with requirements

---

## The 8 Technical Dimensions

Chaperone analyzes projects across 8 critical technical dimensions. Each dimension is explored through analysis, clarifying questions, and documented decisions.

### 1️⃣ Data Model & Schema

**What to analyze**:
- Entity definitions and attributes
- Relationships (1:1, 1:M, M:M)
- Validation rules and constraints
- Entity lifecycle and state transitions
- Indexing and query patterns
- Data volume and growth

**Key questions to explore**:
- Are all entities clearly defined?
- What are the cardinalities between entities?
- What are the validation rules for each field?
- Which queries are performance-critical?
- What is the expected data volume and growth rate?
- Are there entities that need change history or audit trails?

**Deliverable**: Enhanced entity-relationship diagram with detailed entity specs, constraints, and indexing strategy

---

### 2️⃣ Application Flows & Use Cases

**What to analyze**:
- User workflows and journeys
- Success and failure scenarios
- Edge cases and error conditions
- State machines and transitions
- Workflow sequencing and dependencies
- Frequency and volume of operations

**Key questions to explore**:
- Are main user journeys clearly documented?
- What are all failure scenarios and how are they handled?
- What edge cases exist?
- What are the state transitions and when do they occur?
- What is the operational volume and frequency?
- How do workflows interact with data state?

**Deliverable**: Clarified use cases with flow diagrams, edge case analysis, and volume estimates

---

### 3️⃣ Authentication & Authorization

**What to analyze**:
- Authentication method (JWT, OAuth2, session, API key, multi-factor)
- Token structure and expiration
- Permission model (RBAC, ABAC, resource-level)
- Authorization matrix (who can do what)
- Security requirements (HTTPS, CORS, rate limiting)
- Secrets management approach

**Key questions to explore**:
- What authentication method is appropriate?
- Is multi-factor authentication needed?
- What is the permission model?
- How granular should permissions be?
- What are the security requirements?
- How are secrets managed and rotated?

**Deliverable**: Auth strategy document with permission matrix, security checklist, and token/session management approach

---

### 4️⃣ Caching Strategy

**What to analyze**:
- What data should be cached (client, server, both)
- Cache invalidation strategy (TTL, event-based, manual)
- Performance targets (response time, hit ratio)
- Cache warming and preloading
- Cache layers (local, distributed, CDN)
- Data staleness tolerance

**Key questions to explore**:
- What is the cache invalidation strategy?
- What are the performance targets?
- How often can data be stale?
- What is the acceptable cache hit ratio?
- Do we need distributed caching (Redis)?
- How is cache warming handled?

**Deliverable**: Caching architecture with invalidation strategy, performance targets, and layer specifications

---

### 5️⃣ Technology Stack & Patterns

**What to analyze**:
- Backend language and framework
- Database choice and rationale
- Frontend framework and state management
- Data persistence patterns (repository, data sources)
- Architecture patterns (Clean, MVVM, BLoC, etc.)
- Library choices and alternatives
- Anti-patterns to avoid

**Key questions to explore**:
- Is the tech stack appropriate for the problem?
- Are architecture patterns consistent?
- Are library choices justified?
- What are the trade-offs between options?
- Are there anti-patterns or red flags?
- Does the stack support the non-functional requirements (performance, scale)?

**Deliverable**: Technology selection matrix with architecture diagrams and justifications for each choice

---

### 6️⃣ Target Platforms & Deployment

**What to analyze**:
- Target platforms (web, iOS, Android)
- Native vs cross-platform approach
- Supported versions and minimum versions
- Deployment infrastructure (cloud, container, serverless)
- Environment strategy (dev, staging, prod)
- Scaling and reliability approach
- Monitoring and alerting

**Key questions to explore**:
- What platforms must be supported?
- Should the approach be native or cross-platform?
- What is the deployment infrastructure?
- How does the system scale as users grow?
- What is the monitoring and alerting strategy?
- What is the backup and disaster recovery plan?

**Deliverable**: Platform support matrix and deployment architecture with scaling strategy

---

### 7️⃣ Testing Strategy & Regime

**What to analyze**:
- Testing layers (DB, data, API, client, domain, UI)
- Integration tests at each boundary
- Unit test priorities (complex logic only)
- Test data and fixtures strategy
- Performance testing approach
- Security testing scope
- Test automation strategy

**Key questions to explore**:
- What layers need integration tests?
- Which components need unit tests?
- What are the performance targets?
- How is test data managed?
- What security tests are needed?
- What is the target test coverage?

**Deliverable**: Testing strategy by layer with coverage targets, test sequence, and automation approach

---

### 8️⃣ System Scope - Greenfield vs Existing

**What to analyze**:
- System newness (greenfield, brownfield, replacement)
- Existing system integration points
- Data migration requirements
- Backwards compatibility needs
- Legacy API contracts to maintain
- Parallel run period strategy
- Rollback planning

**Key questions to explore**:
- Is this greenfield or brownfield?
- What existing systems must integrate?
- Is data migration needed?
- How is backwards compatibility maintained?
- What is the rollback plan?
- What is the timeline for decommissioning old system?

**Deliverable**: System scope assessment with migration/integration strategy and rollback plan

---

## Prototype Generation (Optional)

Chaperone can generate an **optional interactive HTML prototype** that visualizes the application before design. This is helpful for validating information architecture and user flows.

### What the Prototype Shows
- All application pages/screens
- Navigation links between pages
- Page layouts and information architecture
- Example data from the data model
- Loading, error, and success states
- Basic responsive design
- Clickable elements showing user flows

### Prototype Structure
```
PROJECT/dev/prototype_ui/
├── index.html                    # Homepage/dashboard
├── page-detail.html              # Detail pages
├── settings.html                 # Settings
├── css/
│   ├── bootstrap.css
│   └── custom.css
├── js/
│   └── navigation.js             # Page linking
├── README.md                     # Navigation guide
└── navigation-manifest.json      # Site map
```

### When to Offer Prototype
**Offer when:**
- ✅ Data model is complex
- ✅ Navigation between pages is intricate
- ✅ Need to validate information architecture
- ✅ Team benefits from visual preview
- ✅ Design handoff to UX designer needed

**Skip when:**
- ❌ Simple single-page app
- ❌ Specification is trivial
- ❌ Timeline is extremely tight
- ❌ Patron explicitly doesn't want it

---

## Phase 1: Specification Refinement - Complete Checklist

### Before Starting Phase 1
- [ ] Read all ROME documentation
- [ ] Gathered all user requirements (PRD, use cases, design docs, tech specs)
- [ ] Located user/stakeholder contact for answering questions
- [ ] Understood project scope from user perspective
- [ ] Identified where user documents are located

### During 8-Dimension Analysis
- [ ] Data Model & Schema analysis complete
- [ ] Application Flows & Use Cases analysis complete
- [ ] Authentication & Authorization analysis complete
- [ ] Caching Strategy analysis complete
- [ ] Technology Stack & Patterns analysis complete
- [ ] Target Platforms & Deployment analysis complete
- [ ] Testing Strategy & Regime analysis complete
- [ ] System Scope analysis complete

### During Clarification Questions Phase
- [ ] Questions formatted with options and context
- [ ] Questions communicated to user
- [ ] Responses received and documented
- [ ] User identified which deferred issues (to PMA phase)
- [ ] Ambiguities resolved
- [ ] Gaps identified and addressed

### Phase 1 Sign-Off
- [ ] Refined specification document created
- [ ] All 8 dimensions covered with clarity
- [ ] Questions and answers documented (in separate Q&A log)
- [ ] Deferred issues listed (in separate deferred issues doc)
- [ ] ✅ Confirmation: Specs are clear and interpretable
- [ ] ✅ Confirmation: PMA can design with confidence
- [ ] Documents stored in `PROJECT/dev/`

---

## Phase 2: Design Inspection & Validation - Complete Checklist

### Before Starting Phase 2
- [ ] Received PMA's complete functional design
- [ ] Have Phase 1 refined specifications document
- [ ] Understand deferred issues from Phase 1
- [ ] Reviewed PMA's data model, use cases, and action list

### During Design Review
- [ ] PMA design reviewed against refined specs
- [ ] All Phase 1 requirements confirmed as addressed
- [ ] Data model design validation complete
- [ ] Use case workflows validation complete
- [ ] Feature list completeness check complete
- [ ] Technical feasibility assessment complete
- [ ] Schedule realism assessment complete
- [ ] Scope clarity assessment complete

### Decision Phase
Choose exactly one:
- [ ] ✅ **APPROVED** - No issues, design is practically achievable, ready for robots
- [ ] 🚫 **BLOCKED** - Blocking issues identified (see below)
- [ ] 🚩 **ESCALATE** - Conflicts require user/stakeholder decision

### If Blocking Issues Found
- [ ] Technical feasibility issues documented with specifics
- [ ] Schedule realism issues documented with impact analysis
- [ ] Scope clarity issues documented with conflicts identified
- [ ] Suggested fixes or escalation points noted
- [ ] Sent to PMA for resolution or escalation
- [ ] Plan for Phase 2 re-review after issues resolved

### Phase 2 Sign-Off
- [ ] Design approval/blocking document created
- [ ] Status clearly communicated (Approved, Blocked, or Escalate)
- [ ] Escalations raised if needed
- [ ] Development robots notified of status
- [ ] If approved, robots can proceed with confidence

---

## Question Format Template

Use this structure for clarifying questions in Phase 1:

```
## Area: [Data Model / Auth / Caching / Tech Stack / etc.]

### Question: [Specific, answerable question]

**Context**: [Why this matters to the project]

**Impact**: [Technical and business implications of the answer]

- **Option A**: [Clear description of option]
  - Pros: [Advantages of this choice]
  - Cons: [Disadvantages]
  - Complexity: [Implementation effort]

- **Option B**: [Clear description of option]
  - Pros: [Advantages]
  - Cons: [Disadvantages]
  - Complexity: [Implementation effort]

- **Option C**: [Clear description of option]
  - Pros: [Advantages]
  - Cons: [Disadvantages]
  - Complexity: [Implementation effort]

- **Other**: [Custom response welcome - user not bound to options]

**Recommended**: [Your technical recommendation, if any]

**Timeline Impact**: [How this affects schedule and scope]
```

---

## Common Patterns & Anti-Patterns

Chaperone flags good and bad patterns during analysis.

### Data Patterns
✅ **Repository pattern** (abstraction layer between data and business logic)
❌ **Direct database access** from business logic
✅ **Data source abstraction** (separate remote/local data sources)
❌ **Mixed data sources** in UI layer
✅ **Type-safe models** and validation
❌ **Untyped JSON** everywhere
✅ **Entities with clear lifecycle** (creation, update, deletion)
❌ **Entities with unclear state** or no validation

### Architecture Patterns
✅ **Clean Architecture** or **Hexagonal Architecture**
✅ **MVVM**, **BLoC**, or **Redux** state management
❌ **God classes** with all business logic
❌ **Circular dependencies** between modules
✅ **Dependency Injection** for testability
❌ **Service Locator** everywhere (tight coupling)
✅ **Layered separation** (data, business, presentation)
❌ **Tangled cross-cutting concerns**

### Testing Patterns
✅ **Integration tests at layer boundaries** (DB, API, UI)
✅ **Unit tests for complex logic only** (not trivial getters)
❌ **100% unit test coverage chasing** (wastes effort)
❌ **Mocked tests** that don't run against real systems
✅ **Descriptive test names** ("should_reject_duplicate_email")
❌ **Vague test names** ("test_it_works")
✅ **Test fixtures** for consistent test data
❌ **Random test data** generation

### Performance Patterns
✅ **Caching at multiple layers** (client, server, CDN)
✅ **Database query optimization** (indexes, query plans)
✅ **Pagination** for large datasets
❌ **Loading everything at once**
✅ **Async/await patterns** for non-blocking operations
❌ **Blocking operations** on main thread
✅ **Lazy loading** of related data
❌ **Eager loading** everything upfront

---

## Red Flags & Warnings

### 🚩 Red Flags to Watch For
- Specifications that are vague or contradictory
- Missing data models or relationships
- Unclear authentication requirements
- No defined testing strategy
- No performance targets defined
- Complex state machines not documented
- Integration points not clearly defined
- No disaster recovery plan
- Scope that seems too large for team size
- Technology choices without justification
- Conflicting non-functional requirements (e.g., "real-time and no caching")

### ⚠️ Warnings That Need Escalation
- Security requirements that are unclear or aggressive
- Performance requirements that seem unrealistic for the tech stack
- Scope creep indicators (features expanding during spec phase)
- Missing stakeholder clarity on key technical decisions
- Technical constraints not documented (legacy system integration, platform limitations)
- Backwards compatibility requirements that conflict with refactoring needs
- Conflicting deferred issues that affect architecture

### 🚨 Critical Issues (Block Design)
- Design violates Phase 1 refined specifications
- Technical feasibility not addressed (e.g., "scale to 1M users with no infrastructure plan")
- Schedule unrealistic for complexity level
- Scope misalignment (missing core requirements)
- Security requirements not met by proposed design
- Performance targets unachievable with tech stack

---

## Key Metrics to Discuss

Chaperone should clarify these metrics in Phase 1 questions:

### Performance Metrics
- Target response time: _____ ms
- Target throughput: _____ requests/second
- Cache hit ratio target: _____ %
- Page load time target: _____ seconds
- Database query time target: _____ ms

### Scale Metrics
- Expected users: _____
- Daily active users: _____
- Concurrent users at peak: _____
- Data volume year 1: _____ GB
- Data growth rate: _____ % per year

### Reliability Metrics
- Target uptime: _____ % (nines: 99.9%, 99.99%, etc.)
- Mean time to recovery: _____ minutes
- Backup frequency: _____ (hourly/daily/weekly)
- Retention period: _____ days
- Recovery point objective (RPO): _____ hours

### Security Metrics
- Authentication mechanism: _____
- Authorization model: _____
- Encryption in transit: Yes/No (TLS version)
- Encryption at rest: Yes/No (algorithm)
- Compliance needs: _____ (GDPR, HIPAA, SOC2, etc.)
- Password policy: _____

---

## Decision Matrix Template

Chaperone uses this format to document technical decisions:

| Dimension | Current Spec | Question | Recommended | Option A | Option B | Option C | Rationale |
|-----------|-------------|----------|-------------|----------|----------|----------|-----------|
| Auth | [Unclear] | What auth mechanism? | JWT | JWT | OAuth2 | Session | Simpler than OAuth2 for single org |
| Cache | [Missing] | What cache layer? | Redis | In-memory | Redis | CDN | Distributed needed for scale |
| DB | PostgreSQL | ✓ (Confirmed) | Keep | - | - | - | Good choice, no change needed |
| Framework | [Not specified] | Backend framework? | Express.js | Express | FastAPI | Django | Speed to market + team familiarity |
| Testing | [Unclear] | Coverage target? | 80% | 100% | 80% | 50% | Focus on integration tests, not unit % |

---

## Output Documents & Templates

### Phase 1: Refined Requirements Specification

**Document**: `PROJECT/dev/specification_augmented.md`

**Structure**:
```
# [Project Name] - Refined Requirements Specification

## Executive Summary
- What this document is (refined version of raw requirements)
- Key clarifications made
- Scope of analysis (8 dimensions covered)

## 1. Data Model & Schema
- Original requirement: [from user]
- Questions asked: [what was unclear]
- Answers received: [user's decisions]
- **Refined Specification**: [clear technical spec]
- [Diagram or schema example if complex]

## 2. Application Flows & Use Cases
- [Same structure as above for each dimension]

## 3. Authentication & Authorization
[...]

## 4. Caching Strategy
[...]

## 5. Technology Stack & Patterns
[...]

## 6. Target Platforms & Deployment
[...]

## 7. Testing Strategy & Regime
[...]

## 8. System Scope - Greenfield vs Existing
[...]

## Deferred Issues
Issues that user chose to address during PMA Phase 1 instead of Phase 1:
- Issue: [Description]
  - Reason: [Why user deferred it]
  - Impact: [How it affects design]

## Risk Assessment
- [Key technical risks identified]
- [Mitigation strategies]
- [Complexity areas needing attention]

## Confirmation
✅ All 8 dimensions analyzed and clarified
✅ Ambiguities resolved
✅ Gaps identified and addressed
✅ Specifications are clear and interpretable
✅ **Ready for PMA to design from these specifications**
```

### Phase 1: Questions & Answers Log

**Document**: `PROJECT/dev/questions_and_answers.md`

Log of all clarification questions asked and user's responses:

```
# Q&A Log - [Project Name]

## Q1: [Question text]
- Asked: [Date]
- Context: [Why this mattered]
- Options offered: A, B, C
- **User Response**: Option B
- Rationale: [Why user chose it]

## Q2: [Next question]
[...]
```

### Phase 1: Deferred Issues

**Document**: `PROJECT/dev/deferred_issues.md`

Issues that user chose to address during PMA instead of Phase 1:

```
# Deferred Issues - [Project Name]

## Issue: [Description]
- When: Phase 1 (could be resolved now but deferred)
- Reason: [Why user deferred it]
- Impact: [How it affects design and timeline]
- Owner: [Who will address in PMA phase]

## Issue: [Next deferred item]
[...]
```

### Phase 2: Design Approval

**Document**: `PROJECT/dev/design_approval.md` (if approved)

```
# [Project Name] - Design Approval

**Status**: ✅ APPROVED

**Date**: [Date of approval]

## Validation Summary

### Specification Alignment
- ✅ Design addresses all Phase 1 refined specifications
- ✅ All 8 dimensions reflected in design
- ✅ Deferred issues addressed appropriately

### Requirements Coverage
- ✅ All user requirements covered
- ✅ Use cases properly decomposed into vertical slices
- ✅ Data model supports all workflows

### Technical Feasibility
- ✅ Technology stack appropriate for requirements
- ✅ Architecture patterns are sound
- ✅ Performance targets achievable
- ✅ No unresolved integration complexity

### Schedule Realism
- ✅ Complexity level matches timeline
- ✅ Team capacity adequate for scope
- ✅ Risk mitigation plans exist

### Scope Clarity
- ✅ Requirements aligned with scope
- ✅ Feature boundaries clear
- ✅ Dependencies documented

## Approval Decision

This design is **practically achievable** and ready for development robots.

**Next Step**: Development robots (Ashok, Reena, Charlie) can proceed with confidence.

---

**Approved by**: Chaperone
**Reviewed specs**: `specification_augmented.md`
**Reviewed design**: `data_model.md`, `use_cases.md`, `actionlist.md`
```

### Phase 2: Blocking Issues (if not approved)

**Document**: `PROJECT/dev/design_blocking_issues.md` (if blocked)

```
# [Project Name] - Design Review: Blocking Issues

**Status**: 🚫 BLOCKED

**Date**: [Date of review]

## Technical Feasibility Issues

### Issue 1: [Description]
- Impact: [How this blocks the design]
- Refined Spec Conflict: [What requirement isn't met]
- Fix Required: [What must change]
- Severity: Critical/High/Medium

### Issue 2: [Next technical issue]
[...]

## Schedule Realism Issues

### Issue: [Description]
- Estimated Scope: [Effort estimate]
- Available Time: [Timeline from PMA]
- Gap: [Difference]
- Fix Options:
  - Option A: Extend timeline by X weeks
  - Option B: Reduce scope by Y features
  - Option C: Increase team size

[...]

## Scope Clarity Issues

### Issue: [Description]
- Spec Says: [Phase 1 requirement]
- Design Shows: [PMA's design]
- Conflict: [What doesn't match]
- Resolution Needed: [What needs to change]

[...]

## Next Steps

**Path Forward**:
1. PMA to address blocking issues (listed above)
2. Submit revised design for Phase 2 re-review
3. OR escalate to user for decision on trade-offs

**Decision Point**: Issues must be resolved before development begins.
```

---

## Success Indicators

### Phase 1 Success: Specifications are Clear ✅

- All 8 technical dimensions analyzed thoroughly
- Clarifying questions asked and answered
- Ambiguities resolved (no "unclear" items remain)
- Gaps identified and addressed
- Deferred issues documented with user's reasoning
- Specifications are unambiguous and interpretable
- **PMA can design from these specs with confidence**
- Development robots will understand what to build

### Phase 2 Success: Design is Practical ✅

- Design reviewed against Phase 1 refined specifications
- All Phase 1 requirements confirmed as addressed
- Technical feasibility validated (can be built)
- Schedule realism validated (timeline achievable)
- Scope clarity validated (requirements aligned)
- **Design approved OR blocking issues documented**
- **Development robots ready to proceed** (if approved)

### Overall Success: Early Risk Management ✅

- Quality gates between requirements and design confirmed
- Business practicality issues caught early (not during development)
- Technical feasibility issues surfaced (not discovered mid-build)
- Minimal surprises when robots begin implementation
- Team confidence in specifications and design

---

## Integration with Other Roles

### PMA (Project Manager/Architect)

**What Chaperone provides to PMA:**
- Enhanced specifications for Phase 1 deep analysis
- Feature dependency analysis and complexity assessment
- Recommended implementation sequence
- Risk assessment with mitigation strategies
- Technical complexity assessment
- Technology stack justification
- Architecture guidance

**What Chaperone validates from PMA:**
- Functional design completeness
- Technical feasibility of design choices
- Schedule realism for complexity
- Scope alignment with Phase 1 specs

**Relationship**: Chaperone Phase 1 → PMA → Chaperone Phase 2 (approval gate)

---

### Data Architect (Ashok)

**What Chaperone provides:**
- Detailed entity specifications with constraints and validation rules
- Relationship diagrams (1:1, 1:M, M:M)
- Indexing recommendations and query pattern analysis
- Data volume and growth estimates
- State transition specifications for complex entities
- Data migration strategy (if applicable)

**What Ashok uses:** `specification_augmented.md` (data model section)

---

### Backend Engineer (Reena)

**What Chaperone provides:**
- API contract specifications and patterns
- Business logic requirements clarified
- Authentication and authorization specifications
- Error handling patterns and expectations
- Technology stack justification
- Performance and caching requirements
- Integration point specifications

**What Reena uses:** `specification_augmented.md` (full context)

---

### Frontend Engineer (Charlie)

**What Chaperone provides:**
- Clarified user workflows and journeys
- State management requirements
- Data fetching patterns and caching strategy
- Loading and error state specifications
- Platform and responsive design requirements
- Validation rules and constraints

**What Charlie uses:** `specification_augmented.md` (use cases and flows)

---

## Comparison: Chaperone vs Other Roles

### Chaperone vs PMA

| Aspect | Chaperone | PMA |
|--------|-----------|-----|
| **Primary Focus** | Technical depth & clarity | Planning & coordination |
| **Timing** | Phase 1: Before PMA; Phase 2: After PMA | After Chaperone Phase 1 |
| **Input** | User documents (PRD, design, specs) | Refined specs from Chaperone |
| **Output** | Refined specification document | Functional design + action list |
| **Scope** | Technical depth on 8 dimensions | Breadth across features & planning |
| **Expertise** | Requirements clarity & validation | System design & decomposition |
| **Authority** | Can BLOCK design approval | Creates the design |
| **Questions** | Technical-focused | Business & planning-focused |

### Chaperone vs Individual Robot

| Aspect | Chaperone | Robot (Ashok/Reena/Charlie) |
|--------|-----------|---|
| **Scope** | Broad (8 dimensions, whole system) | Narrow (single layer: data/backend/frontend) |
| **Timing** | Early (Phase 1 & 2) | During & after development |
| **Focus** | Specification & design review | Implementation |
| **Input** | Requirements & design documents | Specs, use cases, action list |
| **Output** | Refined specs & design approval | Working code |
| **Authority** | Quality gate (approve/block) | Expert execution |

### Chaperone vs External Consultant

| Aspect | Chaperone | External Consultant |
|--------|-----------|---|
| **Availability** | Always (no scheduling) | Limited (expensive) |
| **Methodology** | ROME-integrated (understands your approach) | Generic or imposed approach |
| **Consistency** | Same framework every time | Varies by consultant |
| **Turnaround** | Fast (no scheduling delays) | Slower (external constraints) |
| **Learning** | Builds team capability | One-time engagement |
| **Cost** | Included in ROME | External cost |
| **Deliverables** | Specifications & design approval | Recommendations only |

---

## Key Features of This Approach

### 1. Comprehensive Framework
Eight technical dimensions ensure nothing is missed. No stone left unturned in specification analysis.

### 2. Question-Driven
Asks questions with options rather than dictating solutions. Respects user authority.

### 3. ROME-Aligned
Follows ROME's integration-first testing and vertical slicing philosophy. Works with (not against) the methodology.

### 4. Actionable Output
Enhanced specifications are directly usable by development robots. Provides templates, examples, schemas.

### 5. Risk Management
Identifies risks early and recommends mitigation. Prevents late discovery of problems.

### 6. Scalable Analysis
Works for projects of any size and complexity. Adapts to project context.

### 7. Optional UI Prototype
Generates interactive HTML prototype showing pages and navigation flows (patron chooses if needed).

### 8. Design Quality Gate
Phase 2 catches design issues before development starts. Saves cost of fixing problems mid-build.

---

## Files Delivered

### Chaperone Workspace Files

**claude_chaperone/CLAUDE.md** (13 KB)
- Detailed phase-by-phase execution instructions
- What Chaperone should do in each phase
- Success criteria and decision points
- Step-by-step guidance

**claude_chaperone/__start.sh** (272 B)
- Startup script to launch Chaperone
- Makes executable with: `chmod +x __start.sh`

**claude_chaperone/README.md** (9 KB)
- User-friendly guide to Chaperone
- What Chaperone does
- How to use it
- Getting started instructions

### ROME Documentation Files

**ROME/role-chaperone.md** (12 KB)
- Complete role specification
- Responsibilities and relationships
- Analysis framework for 8 dimensions
- Success criteria and principles

**ROME/chaperone-comprehensive-guide.md** (This file)
- Single source of truth for Chaperone
- Combines quick-reference and setup summary
- Complete tactical and strategic guidance
- Checklists, templates, patterns, warnings

**ROME/template-augmented-specification.md** (18 KB)
- Complete template for output document
- Executive summary section
- Detailed analysis sections for each dimension
- Risk assessment and mitigation

**ROME/template-prototype-ui.md** (20 KB)
- Complete template for UI prototype output
- HTML page structure documentation
- Navigation flow maps
- Validation checklist

---

## Next Steps: How to Use Chaperone

### Step 1: Gather Your Requirements
Collect and organize raw requirement documents:
- Product Requirements Document (PRD)
- Use cases or user stories
- UI/UX designs (if available)
- Architecture diagrams (if available)
- Technical specifications (if available)

### Step 2: Create User Input Directory
```bash
mkdir -p PROJECT/dev/_user_input
# Copy your requirement documents here
```

### Step 3: Launch Chaperone Phase 1
```bash
cd /path/to/claude_chaperone
./__start.sh
# Chaperone will ask: "Where are your requirement documents?"
# Answer: "PROJECT/dev/_user_input/"
```

### Step 4: Work Through Specification Refinement
- Chaperone asks clarifying questions
- You answer with option choices
- Chaperone documents your answers
- This takes 2-5 days depending on complexity

### Step 5: Review Refined Specifications
Chaperone produces `PROJECT/dev/specification_augmented.md`
- ✅ All 8 dimensions covered
- ✅ Ambiguities resolved
- ✅ Ready for PMA to design from

### Step 6: Proceed to PMA
PMA uses refined specs to create functional design
- PMA completes Phases 1-9
- Creates `data_model.md`, `use_cases.md`, `actionlist.md`

### Step 7: Launch Chaperone Phase 2
```bash
cd /path/to/claude_chaperone
./__start.sh
# Select: Phase 2 - Design Inspection & Validation
```

### Step 8: Design Validation
- Chaperone reviews PMA's design
- Validates against refined specs
- Assesses technical feasibility, schedule, and scope
- Approves or blocks (or escalates)

### Step 9: If Approved, Launch Development
- Robots proceed with confidence
- Minimal surprises during implementation

---

## Evaluation Questions

Reflect on Chaperone with these questions:

1. **Coverage**: Does the 8-dimension framework cover all important technical areas?
2. **Depth**: Is the analysis deep enough to be useful for development?
3. **Usability**: Are the templates and guides easy to follow?
4. **Integration**: Does it integrate well with ROME methodology?
5. **Value**: Would this role add value to your projects?
6. **Prototype**: Does the optional UI prototype feature add value?
7. **Design Gate**: Does Phase 2 design approval add confidence?
8. **Improvements**: What could be improved?

---

## Summary

**Chaperone operates as two quality gates:**

### Phase 1: Specification Refinement
✅ **Analyzes** requirements across 8 technical dimensions
✅ **Clarifies** ambiguities with structured questions
✅ **Refines** specs until clear and unambiguous
✅ **Identifies** deferred issues (user decides timing)
✅ **Produces** refined specification document
✅ **Confirms** specs are ready for PMA design

### Phase 2: Design Inspection & Validation
✅ **Reviews** PMA's functional design against refined specs
✅ **Validates** design addresses all requirements
✅ **Assesses** business practicality:
   - Technical feasibility (can it be built?)
   - Schedule realism (is timeline achievable?)
   - Scope clarity (are requirements aligned?)
✅ **Can BLOCK** design approval if issues found
✅ **Escalates** conflicts to user/stakeholders
✅ **Approves** design for development robots

**Together with PMA and Development Robots, Chaperone ensures:**
- ✅ Requirements are clear before design starts
- ✅ Design is feasible before development starts
- ✅ Development robots have confidence in specs
- ✅ Minimal surprises during implementation

---

**Status**: Complete & Ready for Use
**Last Updated**: 2025-10-29
**Version**: 4.0 (Two-Phase Model, Comprehensive)

For questions, refer to:
- [claude_chaperone/README.md](../claude_chaperone/README.md) - User guide
- [ROME/role-chaperone.md](./role-chaperone.md) - Detailed role specification
- [ROME/template-augmented-specification.md](./template-augmented-specification.md) - Output template
