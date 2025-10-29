# Chaperone Quick Reference
**Version**: 3.0
**Purpose**: Quick lookup guide for Chaperone analysis framework

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

## Analysis Checklist

### Before Starting
- [ ] Read all ROME documentation
- [ ] Gathered all specification documents (PRD, use cases, design docs)
- [ ] Identified stakeholders for clarification
- [ ] Set up project directory structure

### During Analysis
- [ ] Data Model analysis complete
- [ ] Use Cases & Workflows analysis complete
- [ ] Auth & Authorization analysis complete
- [ ] Caching Strategy analysis complete
- [ ] Technology Stack analysis complete
- [ ] Platform & Deployment analysis complete
- [ ] Testing Strategy analysis complete
- [ ] System Scope analysis complete

### Clarification Phase
- [ ] Questions formatted and categorized
- [ ] Options provided for decision points
- [ ] Questions sent to stakeholders
- [ ] Responses received and documented

### Augmentation Phase
- [ ] Enhanced specification document created
- [ ] Original gaps documented
- [ ] Recommendations provided
- [ ] Risk assessment included
- [ ] Implementation sequence planned
- [ ] Questions and answers appended

### Sign-Off
- [ ] PMA review complete
- [ ] Stakeholder approval obtained
- [ ] Development robots (Ashok, Reena, Charlie) have clarity
- [ ] Document stored in PROJECT/dev/

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

### Phase 1: Analysis Report
```
1. Data Model Analysis
2. Use Cases Analysis
3. Auth Analysis
4. Caching Analysis
5. Tech Stack Analysis
6. Platform Analysis
7. Testing Analysis
8. Scope Analysis
```

### Phase 2: Clarification Questions
```
1. Questions for Each Area
2. Options Provided
3. Impact Assessment
4. Complexity Analysis
```

### Phase 3: Augmented Specification
```
1. Executive Summary
2. Enhanced Data Model
3. Clarified Use Cases
4. Architecture Decisions
5. Technology Justifications
6. Testing Strategy
7. Implementation Roadmap
8. Risk Assessment
9. Appendices (schemas, APIs, etc.)
```

---

## Success Indicators

✅ Development robots (Ashok, Reena, Charlie) have complete clarity
✅ All gaps in original spec identified and addressed
✅ Technical decisions documented with trade-offs
✅ Data model is complete and correct
✅ Testing strategy is defined by layer
✅ Architecture patterns are consistent
✅ Technology choices are justified
✅ Performance and scale requirements are clear
✅ Security requirements are explicit
✅ Implementation sequence is recommended
✅ Risks are identified with mitigation strategies
✅ Ambiguities are resolved

---

## Related Documents

- [role-chaperone.md](role-chaperone.md) - Full role specification
- [template-augmented-specification.md](template-augmented-specification.md) - Output template
- [rome-overview.md](rome-overview.md) - ROME methodology
- [rome-implementation-guide.md](rome-implementation-guide.md) - Integration testing approach
- [role-pma.md](role-pma.md) - PMA role (partner role)

---

**Status**: Ready for Use
**Last Updated**: 2025-10-28
