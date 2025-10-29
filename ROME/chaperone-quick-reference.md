# Chaperone Quick Reference
**Version**: 4.0 (Updated to two-phase model)
**Purpose**: Quick lookup guide for Chaperone specification refinement and design inspection

---

## The 8 Technical Dimensions

### 1️⃣ Data Model & Schema
**What to analyze**:
- Entity definitions and attributes
- Relationships (1:1, 1:M, M:M)
- Validation rules and constraints
- Entity lifecycle and state transitions
- Indexing and query patterns
- Data volume and growth

**Key questions**:
- Are all entities clearly defined?
- What are the cardinalities?
- What are the validation rules?
- What queries are performance-critical?
- What is the expected data volume?

**Deliverable**: Enhanced entity-relationship diagram with detailed entity specs

---

### 2️⃣ Application Flows & Use Cases
**What to analyze**:
- User workflows and journeys
- Success and failure scenarios
- Edge cases and error conditions
- State machines and transitions
- Workflow sequencing and dependencies
- Frequency and volume of operations

**Key questions**:
- Are main user journeys clear?
- What are all failure scenarios?
- Are edge cases documented?
- Are state transitions clear?
- What is the operational volume?

**Deliverable**: Clarified use cases with flow diagrams and edge case analysis

---

### 3️⃣ Authentication & Authorization
**What to analyze**:
- Authentication method (JWT, OAuth2, session, API key)
- Token structure and expiration
- Permission model (RBAC, ABAC, resource-level)
- Authorization matrix (who can do what)
- Security requirements (HTTPS, CORS, rate limiting)
- Secrets management approach

**Key questions**:
- What auth method is appropriate?
- Is MFA needed?
- What is the permission model?
- How are permissions structured?
- What are the security requirements?

**Deliverable**: Auth strategy document with permission matrix and security checklist

---

### 4️⃣ Caching Strategy
**What to analyze**:
- What data should be cached (client, server, both)
- Cache invalidation strategy (TTL, event-based)
- Performance targets (response time, hit ratio)
- Cache warming and preloading
- Cache layers (local, distributed, CDN)
- Data staleness tolerance

**Key questions**:
- What is the cache invalidation strategy?
- What are the performance targets?
- How often does data become stale?
- What is the acceptable cache hit ratio?
- Do we need distributed caching?

**Deliverable**: Caching architecture with invalidation strategy and performance targets

---

### 5️⃣ Technology Stack & Patterns
**What to analyze**:
- Backend language and framework
- Database choice and rationale
- Frontend framework and state management
- Data persistence patterns (repository, data sources)
- Architecture patterns (Clean, MVVM, BLoC)
- Library choices and alternatives
- Anti-patterns to avoid

**Key questions**:
- Is the tech stack appropriate for the problem?
- Are architecture patterns consistent?
- Are library choices justified?
- What are the trade-offs?
- Are there anti-patterns to avoid?

**Deliverable**: Technology selection matrix with architecture diagrams and justifications

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

**Key questions**:
- What platforms must be supported?
- Native or cross-platform?
- What is the deployment infrastructure?
- How does the system scale?
- What is the monitoring strategy?

**Deliverable**: Platform support matrix and deployment architecture

---

### 7️⃣ Testing Strategy & Regime
**What to analyze**:
- Testing layers (DB, data, API, client, domain, UI)
- Integration tests at each boundary
- Unit test priorities (complex logic)
- Test data and fixtures strategy
- Performance testing approach
- Security testing scope
- Test automation strategy

**Key questions**:
- What layers need integration tests?
- Which components need unit tests?
- What are the performance targets?
- How is test data managed?
- What security tests are needed?

**Deliverable**: Testing strategy by layer with coverage targets and test sequence

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

**Key questions**:
- Is this greenfield or brownfield?
- What existing systems must integrate?
- Is data migration needed?
- How is backwards compatibility maintained?
- What is the rollback plan?

**Deliverable**: System scope assessment with migration/integration strategy

---

## Prototype Generation (Phase 4)

### What the Prototype Shows

**Interactive HTML Prototype includes:**
- All application pages/screens
- Navigation links between pages
- Page layouts and information architecture
- Example data from the data model
- Loading, error, and success states
- Basic responsive design with Bootstrap
- Clickable elements showing user flows

### Prototype Structure

```
PROJECT/dev/prototype_ui/
├── index.html                    # Homepage/dashboard
├── project-detail.html           # Project page
├── task-detail.html             # Task page
├── settings.html                # Settings page
├── css/
│   ├── bootstrap.css
│   └── custom.css
├── js/
│   └── navigation.js            # Page linking logic
├── README.md                    # Navigation guide
└── navigation-manifest.json     # Site map (for indexing pages)
```

### When to Offer Prototype

**Offer prototype when:**
- ✅ Data model is complex
- ✅ Navigation between pages is intricate
- ✅ Need to validate information architecture
- ✅ Team benefits from visual preview
- ✅ Design handoff to Clara (UX) needed

**Skip prototype when:**
- ❌ Simple single-page app
- ❌ Specification is trivial
- ❌ Timeline is extremely tight
- ❌ Patron explicitly doesn't want it

---

## Question Format Template

```
## Area: [Data Model / Auth / Caching / Tech Stack / etc.]

### Question 1: [Specific, answerable question]
**Context**: [Why this matters]
**Impact**: [Technical implications of answer]

- **Option A**: [Description]
  - Pros: [Advantages]
  - Cons: [Disadvantages]

- **Option B**: [Description]
  - Pros: [Advantages]
  - Cons: [Disadvantages]

- **Option C**: [Description]
  - Pros: [Advantages]
  - Cons: [Disadvantages]

- **Other**: [Custom response welcome]

**Complexity**: [How complex is implementation with each option]
```

---

## Phase 1: Specification Refinement Checklist

### Before Starting
- [ ] Read all ROME documentation
- [ ] Gathered all user requirements (PRD, use cases, design docs, tech specs)
- [ ] Identified stakeholder contact for questions
- [ ] Understood project scope from user perspective

### During Analysis
- [ ] Data Model & Schema analysis complete
- [ ] Use Cases & Workflows analysis complete
- [ ] Auth & Authorization analysis complete
- [ ] Caching Strategy analysis complete
- [ ] Technology Stack analysis complete
- [ ] Platform & Deployment analysis complete
- [ ] Testing Strategy analysis complete
- [ ] System Scope analysis complete

### Clarification Questions Phase
- [ ] Questions formatted with options and context
- [ ] Questions sent to user
- [ ] Responses received and documented
- [ ] User identified which deferred issues (to PMA phase)
- [ ] Ambiguities resolved

### Phase 1 Sign-Off
- [ ] Refined specification document created
- [ ] All 8 dimensions covered
- [ ] Questions and answers documented
- [ ] Deferred issues listed
- [ ] ✅ Confirmation: Specs are clear and interpretable
- [ ] Document stored in PROJECT/dev/

---

## Phase 2: Design Inspection Checklist

### Before Starting
- [ ] Received PMA's functional design
- [ ] Have Phase 1 refined specifications
- [ ] Understand deferred issues from Phase 1

### During Review
- [ ] PMA design reviewed against refined specs
- [ ] All requirements confirmed as addressed
- [ ] Data model validation complete
- [ ] Use case workflows validation complete
- [ ] Feature list completeness check
- [ ] Technical feasibility assessment complete
- [ ] Schedule realism assessment complete
- [ ] Scope clarity assessment complete

### Decision Phase
Choose one:

- [ ] ✅ **APPROVED** - No issues, ready for development robots
- [ ] 🚫 **BLOCKED** - Blocking issues identified (see below)
- [ ] 🚩 **ESCALATE** - Conflicts require user/stakeholder decision

### If Blocking Issues
- [ ] Technical feasibility issues documented
- [ ] Schedule realism issues documented
- [ ] Scope clarity issues documented
- [ ] Suggested fixes or escalation points noted
- [ ] Sent to PMA for resolution or escalation

### Phase 2 Sign-Off
- [ ] Design approval/blocking document created
- [ ] Escalations raised (if needed)
- [ ] Development robots notified of status

---

## Common Patterns & Anti-Patterns

### Data Patterns
✅ Repository pattern (abstraction layer)
❌ Direct database access from business logic
✅ Data source abstraction (remote, local)
❌ Mixed data sources in UI layer
✅ Type-safe models
❌ Untyped JSON everywhere

### Architecture Patterns
✅ Clean Architecture / Hexagonal
✅ MVVM / BLoC / Redux
❌ God classes with all logic
❌ Circular dependencies
✅ Dependency Injection
❌ Service Locator everywhere

### Testing Patterns
✅ Integration tests at layer boundaries
✅ Unit tests for complex logic only
❌ 100% unit test coverage chasing
❌ Tests that don't run against real systems
✅ Descriptive test names
❌ "test_it_works" naming

### Performance Patterns
✅ Caching at multiple layers
✅ Database query optimization
✅ Pagination for large datasets
❌ Loading everything at once
✅ Async/await patterns
❌ Blocking operations on main thread

---

## Key Metrics to Discuss

### Performance
- Target response time: ___ ms
- Target throughput: ___ requests/second
- Cache hit ratio target: ___ %
- Page load time target: ___ seconds

### Scale
- Expected users: ___
- Daily active users: ___
- Concurrent users peak: ___
- Data volume year 1: ___ GB
- Data growth rate: ___ % per year

### Reliability
- Target uptime: ___ % (nines)
- Mean time to recovery: ___ minutes
- Backup frequency: ___ (hourly/daily/weekly)
- Retention period: ___ days

### Security
- Authentication mechanism: ___
- Authorization model: ___
- Encryption in transit: Yes/No
- Encryption at rest: Yes/No
- Compliance needs: ___ (GDPR, HIPAA, etc.)

---

## Red Flags & Warnings

🚩 **Red Flags to Watch For**:
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

⚠️ **Warnings That Need Escalation**:
- Security requirements that are unclear
- Performance requirements that seem unrealistic
- Scope creep indicators
- Missing stakeholder clarity on key decisions
- Technical constraints not documented
- Backwards compatibility requirements that conflict with refactoring

---

## Decision Matrix Template

| Dimension | Current Spec | Recommendation | Option A | Option B | Rationale |
|-----------|-------------|-----------------|----------|----------|-----------|
| Auth | [Unclear] | JWT | Simple | Scalable | [Why] |
| Cache | [Missing] | Redis | In-memory | Distributed | [Why] |
| DB | PostgreSQL | ✓ Keep | - | - | [Why] |
| Framework | [Not specified] | Express.js | FastAPI | - | [Why] |

---

## Output Structure

### Phase 1: Refined Requirements Document
```
# [Project] - Refined Requirements Specification

1. Summary of Refinements
   - Clarifications made
   - Ambiguities resolved
   - Gaps filled

2. For Each 8 Dimension:
   - Original requirement
   - Questions asked & answers
   - Refined specification

3. Deferred Issues
   - Issues user chose to address in PMA phase
   - Reason for deferral

4. Confirmation
   ✅ Specs are clear and interpretable
   ✅ Ready for PMA to design from
```

### Phase 2: Design Approval Document

**If Approved:**
```
# [Project] - Design Approval

Status: ✅ APPROVED

Validation:
- Design matches refined specs
- All requirements addressed
- Technical feasibility confirmed
- Schedule realism confirmed
- Scope clarity confirmed

Ready for: Development robots (Ashok, Reena, Charlie)
```

**If Blocked:**
```
# [Project] - Design Review: Blocking Issues

Status: 🚫 BLOCKED

Technical Feasibility Issues:
- [Issue & fix required]

Schedule Realism Issues:
- [Issue & impact]

Scope Clarity Issues:
- [Issue & conflict]

Next step: PMA resolves or escalates
```

---

## Success Indicators

### Phase 1 Success:
✅ All 8 dimensions analyzed
✅ Clarifying questions asked and answered
✅ Ambiguities resolved
✅ Gaps identified and addressed
✅ Deferred issues documented
✅ Requirements specifications are clear and unambiguous
✅ PMA can design from these specs with confidence

### Phase 2 Success:
✅ Design reviewed against refined specs
✅ All requirements confirmed as addressed
✅ Technical feasibility validated OR blocking issues identified
✅ Schedule realism validated OR blocking issues identified
✅ Scope clarity validated OR blocking issues identified
✅ Design approved OR blocking issues escalated
✅ Development robots ready to proceed (if approved)

### Overall Success:
✅ Quality gate between requirements and design confirmed
✅ Business practicality issues caught early
✅ Minimal surprises when robots begin implementation

---

## Related Documents

- [role-chaperone.md](role-chaperone.md) - Full role specification
- [template-augmented-specification.md](template-augmented-specification.md) - Output template for specifications
- [template-prototype-ui.md](template-prototype-ui.md) - Output template for UI prototypes
- [rome-overview.md](rome-overview.md) - ROME methodology
- [rome-implementation-guide.md](rome-implementation-guide.md) - Integration testing approach
- [role-pma.md](role-pma.md) - PMA role (partner role)

---

**Status**: Ready for Use
**Last Updated**: 2025-10-28
