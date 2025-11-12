# Question & Option Completeness Framework
**Version**: 1.0
**Last Updated**: 2025-11-11
**Audience**: Chaperone (Sarah), PMA, Talib - Robots that gather requirements through interactive questions
**Purpose**: Ensure questions have complete options and handle cases where predefined options are insufficient

---

## Executive Summary

**The Problem**: When robots ask stakeholders questions using the `AskUserQuestion` tool, sometimes the provided options are incomplete. Users select "Other" and provide text responses that don't fit predefined categories, leading to:
- Ambiguous requirements
- Need for follow-up clarification cycles
- Incomplete specifications
- Delays in project progression

**The Solution**: This framework provides:
1. **Decision tree** for selecting question type (multiple choice vs open-ended)
2. **Option completeness checklist** before asking questions
3. **"Other" response handling protocol** with structured follow-ups
4. **Question validation criteria** to ensure adequate information gathering

---

## Part 1: Question Type Decision Tree

### When to Use Multiple Choice Questions

Use `AskUserQuestion` with predefined options when:

✅ **The domain has well-defined choices**
```
Example: "Which authentication method?"
Options: OAuth 2.0, JWT, API Keys, Session Cookies

Rationale: Authentication patterns are well-established with clear options.
```

✅ **Options are mutually exclusive**
```
Example: "Which database?"
Options: PostgreSQL, MySQL, MongoDB, SQLite

Rationale: Project typically uses one primary database.
```

✅ **You can enumerate 90%+ of realistic answers**
```
Example: "Which deployment platform?"
Options: AWS, Google Cloud, Azure, Heroku, DigitalOcean

Rationale: Most projects use major cloud providers.
```

✅ **The answer has limited, discrete choices**
```
Example: "How should users authenticate?"
Options: Email/Password, Social Login (Google/Facebook), Multi-Factor Auth

Rationale: Finite set of common patterns.
```

### When to Use Open-Ended Questions

Use **direct text questions** (not `AskUserQuestion` tool) when:

❌ **The domain is highly variable or creative**
```
Example: "Describe the ideal user workflow for creating a project"

Rationale: Every project is unique; predefined options would constrain thinking.
```

❌ **You need detailed context or justification**
```
Example: "What are the main pain points users experience with the current system?"

Rationale: Requires narrative explanation, not selection.
```

❌ **Options would number 10+ choices**
```
Bad Example: "What specific features do you want?"
[50+ feature options would be overwhelming]

Better: Ask in stages with focused sub-questions.
```

❌ **Stakeholder expertise exceeds robot's domain knowledge**
```
Example: "What specific compliance regulations apply to your industry?"

Rationale: Stakeholder knows their regulatory environment better than generic options.
```

---

## Part 2: Option Completeness Checklist

### Before Using `AskUserQuestion`, Verify:

#### 1. Options Cover Common Cases

**Checklist**:
- [ ] Options cover 80-90% of realistic scenarios
- [ ] Options reflect industry standards (research if needed)
- [ ] Options include both traditional and modern approaches
- [ ] Options represent different scales (small/medium/large)

**Example - Good Options**:
```yaml
Question: "What is the expected scale of concurrent users?"
Options:
  - "1-100 users (MVP/small business)"
  - "100-1,000 users (small-to-medium scale)"
  - "1,000-10,000 users (medium-to-large scale)"
  - "10,000+ users (enterprise scale)"

Why good:
✓ Covers realistic ranges
✓ Gives context (business stage)
✓ Allows stakeholder to self-identify
✓ "Other" handles edge cases (e.g., "1 million users")
```

**Example - Incomplete Options**:
```yaml
Question: "What is the expected scale of concurrent users?"
Options:
  - "Small"
  - "Large"

Why incomplete:
✗ Vague terms (what's "small"?)
✗ Missing middle ground
✗ No context to help stakeholder decide
✗ Forces most answers into "Other"
```

#### 2. Options Are Mutually Exclusive (Unless multiSelect: true)

**Checklist**:
- [ ] Stakeholder can clearly pick ONE option
- [ ] Options don't overlap significantly
- [ ] If overlap exists, use multiSelect: true

**Example - Mutually Exclusive**:
```yaml
Question: "Which frontend framework?"
Options:
  - "React"
  - "Vue.js"
  - "Angular"
  - "Flutter (mobile-first)"

Why good:
✓ One primary framework per project
✓ Clear distinctions between choices
```

**Example - Overlapping (Use multiSelect)**:
```yaml
Question: "Which features are most important? (Select all that apply)"
multiSelect: true
Options:
  - "User authentication"
  - "Data export (PDF/CSV)"
  - "Real-time notifications"
  - "Mobile app support"

Why multiSelect:
✓ Features are independent
✓ Stakeholder may want multiple
✓ Not mutually exclusive
```

#### 3. Options Have Clear Descriptions

**Checklist**:
- [ ] Each option has a description field
- [ ] Description explains what choosing this means
- [ ] Description clarifies trade-offs (if relevant)
- [ ] Description uses stakeholder-friendly language (not jargon)

**Example - Good Descriptions**:
```yaml
Question: "Which state management approach for Flutter?"
Options:
  - label: "Provider"
    description: "Simple, recommended for small-to-medium apps. Easy to learn, minimal boilerplate."

  - label: "Bloc"
    description: "Enterprise-grade, best for large teams. Strict architecture, more boilerplate but better maintainability."

  - label: "Riverpod"
    description: "Modern alternative to Provider. Compile-safe, great for medium-large apps. Steeper learning curve."

Why good:
✓ Helps stakeholder understand implications
✓ Mentions scale/complexity
✓ Highlights trade-offs
✓ Enables informed decision
```

**Example - Poor Descriptions**:
```yaml
Question: "Which state management approach for Flutter?"
Options:
  - label: "Provider"
    description: "Uses InheritedWidget"  ← TOO TECHNICAL

  - label: "Bloc"
    description: "Good for big projects"  ← TOO VAGUE

Why poor:
✗ Jargon ("InheritedWidget")
✗ No trade-off clarity
✗ Doesn't help stakeholder decide
```

#### 4. "Other" Option Handles Edge Cases

**Checklist**:
- [ ] "Other" option is always available (automatic in `AskUserQuestion`)
- [ ] Question is phrased to allow custom responses
- [ ] Follow-up plan exists for "Other" responses
- [ ] "Other" responses are validated before proceeding

**Example - Good Question Framing**:
```yaml
Question: "Which deployment platform will you use? (Select closest match, or choose 'Other' to specify custom platform)"
Options:
  - "AWS"
  - "Google Cloud"
  - "Azure"
  - "Heroku"
  # "Other" automatically provided

Why good:
✓ Prompts stakeholder to pick closest match
✓ Clarifies when to use "Other"
✓ Sets expectation for custom input
```

---

## Part 3: Handling "Other" Responses

### Protocol When Stakeholder Selects "Other"

#### Step 1: Receive and Validate

```markdown
Robot receives answer:
  Question: "Which authentication method?"
  Answer: "Other" → "We use a custom LDAP integration with our internal system"
```

#### Step 2: Categorize the Response

**Ask yourself**:
1. Does this fit into one of the predefined options?
   → If YES: Confirm with stakeholder ("This sounds like [Option X]. Is that correct?")

2. Is this a variant of an existing option?
   → If YES: Document as variation and proceed

3. Is this completely novel/custom?
   → If YES: Follow deep-dive protocol (below)

#### Step 3: Deep-Dive Follow-Up (For Novel Responses)

**Template for Follow-Up**:
```markdown
Thank you for specifying [CUSTOM RESPONSE]. To ensure I understand fully, I need to ask a few follow-up questions:

1. **Clarify Scope**:
   "Can you describe how [CUSTOM RESPONSE] works at a high level?"

2. **Identify Constraints**:
   "Are there technical constraints or requirements we must accommodate for [CUSTOM RESPONSE]?"

3. **Map to Architecture**:
   "Does [CUSTOM RESPONSE] integrate with [TECHNOLOGY X] or [TECHNOLOGY Y]?"

4. **Understand Precedent**:
   "Is [CUSTOM RESPONSE] based on industry standards, or is it fully proprietary?"

5. **Assess Feasibility**:
   "Are there existing libraries or frameworks that support [CUSTOM RESPONSE]?"
```

**Example - Full Flow**:
```markdown
Original Question: "Which authentication method?"
Answer: "Other" → "We use a custom LDAP integration with our internal system"

Robot Follow-Up:
"Thank you for specifying LDAP integration. To ensure I understand correctly:

1. Clarify Scope:
   'Is this LDAP integration used for user login (authentication) only,
   or also for permissions/roles (authorization)?'

2. Identify Constraints:
   'Does the LDAP server support standard protocols (e.g., LDAP v3),
   or does it have custom extensions we need to accommodate?'

3. Map to Architecture:
   'Will the backend communicate directly with LDAP, or is there
   an authentication proxy/service in between?'

4. Understand Precedent:
   'Is this standard LDAP authentication, or are there custom fields/schemas
   we need to handle?'

5. Assess Feasibility:
   'Are there existing libraries for [BACKEND LANGUAGE] that support LDAP,
   or would this require custom integration code?'

Once I receive these answers, I can accurately document the authentication
approach and proceed with architecture design."
```

#### Step 4: Document Custom Response

```yaml
# In technical-decisions.md or requirements-matrix.yaml

Authentication Method:
  Selected: "Custom LDAP Integration"
  Category: "Authentication"
  Details:
    - Protocol: LDAP v3 (standard)
    - Integration: Direct backend connection
    - Library: ldap3 (Python) or ldapts (Node.js)
    - Scope: Authentication only (not authorization)
    - Custom Fields: None (standard schema)
  Constraints:
    - LDAP server at ldap://internal.company.com:389
    - Requires VPN for dev/test environments
    - Credentials managed via environment variables
  Approved By: [Stakeholder Name]
  Date: 2025-11-11
  Status: VALIDATED
```

---

## Part 4: Question Validation Criteria

### Before Finalizing Any Question, Validate:

#### Criterion 1: Adequate Granularity

**Question to Ask Yourself**:
"Will the answer give me enough information to make architecture decisions?"

**Example - Too Broad**:
```yaml
Question: "How should the system handle data?"
Problem: Too vague; "data" could mean storage, caching, sync, export, etc.
```

**Example - Appropriately Scoped**:
```yaml
Question: "How should the system handle user data storage?"
Options:
  - "Cloud database (PostgreSQL on AWS RDS)"
  - "Local database (SQLite on device)"
  - "Hybrid (cloud + local sync)"

Why better:
✓ Focused on one aspect (storage)
✓ Options are specific
✓ Clear implications for architecture
```

#### Criterion 2: Stakeholder Can Answer

**Question to Ask Yourself**:
"Does the stakeholder have enough context to answer this question?"

**Example - Too Technical**:
```yaml
Question: "Which HTTP client library should we use?"
Problem: Stakeholder likely doesn't know libraries; this is a technical decision.
Better: PMA or developer makes this choice based on platform.
```

**Example - Stakeholder-Appropriate**:
```yaml
Question: "How should the app handle offline scenarios?"
Options:
  - "Must work fully offline (local storage required)"
  - "Requires internet connection (cloud-only)"
  - "Graceful degradation (some features offline, some require connection)"

Why appropriate:
✓ Business question (not technical)
✓ Stakeholder understands impact
✓ Directly affects user experience
```

#### Criterion 3: Answer Informs Decisions

**Question to Ask Yourself**:
"Will the answer change how we build the system?"

**Example - Non-Informative**:
```yaml
Question: "Do you want the app to be fast?"
Problem: Everyone says "yes"; doesn't inform decisions.
```

**Example - Informative**:
```yaml
Question: "What are the acceptable response time targets for key operations?"
Options:
  - "Instant (<100ms) - like a native app"
  - "Fast (<500ms) - acceptable for most web apps"
  - "Standard (<2s) - acceptable for complex operations"

Why informative:
✓ Defines measurable targets
✓ Affects caching strategy
✓ Affects architecture (edge caching, CDN, etc.)
✓ Stakeholder understands trade-offs
```

---

## Part 5: Common Pitfall Patterns & Solutions

### Pitfall 1: Binary Questions with Hidden Complexity

**Problem Pattern**:
```yaml
Question: "Should we use a database?"
Options:
  - "Yes"
  - "No"

Issue: Oversimplifies; almost always "yes" but doesn't help choose which.
```

**Solution**:
```yaml
Question: "Which database type best fits your data and scale?"
Options:
  - "Relational (SQL) - structured data, complex queries"
  - "Document (NoSQL) - flexible schema, rapid iteration"
  - "Key-Value (Redis/etc.) - caching, simple lookups"
  - "Graph - interconnected data, relationship queries"

Why better:
✓ Helps stakeholder understand options
✓ Directly informs architecture
✓ Provides context for decision
```

### Pitfall 2: Asking Technical Details Too Early

**Problem Pattern**:
```yaml
Phase 1 (Requirements):
Question: "Which ORM should we use?"

Issue: Stakeholder doesn't know ORMs; this is Phase 2 (PMA) decision.
```

**Solution**:
```yaml
Phase 1 (Requirements):
Question: "How complex are your data relationships?"
Options:
  - "Simple - mostly independent entities"
  - "Moderate - some relationships (users → projects)"
  - "Complex - many relationships (users ↔ projects ↔ tasks ↔ tags)"

Phase 2 (PMA):
Based on "Complex relationships" answer:
→ PMA decides ORM based on backend language and complexity

Why better:
✓ Stakeholder answers business question
✓ Technical decision deferred to appropriate phase
✓ Answer still informs architecture
```

### Pitfall 3: Overlapping Options Without multiSelect

**Problem Pattern**:
```yaml
Question: "What should the app prioritize?"
Options:
  - "Fast performance"
  - "Beautiful design"
  - "Rich features"

Issue: Stakeholder wants all three; can't pick one.
```

**Solution**:
```yaml
Question: "Rank these priorities for version 1.0 (select top priority)"
Options:
  - "Performance - app must be fast above all else"
  - "Design - polished, professional UI is critical"
  - "Features - breadth of functionality matters most"

OR (if stakeholder needs multiple):

Question: "Which qualities are non-negotiable for version 1.0? (Select all that apply)"
multiSelect: true
Options:
  - "Fast performance (<2s load time)"
  - "Beautiful, polished design"
  - "Feature-complete (all requirements in v1)"
  - "Rock-solid stability (no crashes)"

Why better:
✓ Forces prioritization OR
✓ Allows multiple selections when appropriate
✓ Clarifies trade-off decisions
```

### Pitfall 4: Jargon-Heavy Descriptions

**Problem Pattern**:
```yaml
Question: "Which frontend architecture?"
Options:
  - label: "Monolithic SPA"
    description: "Single bundle with client-side routing and hydration"

  - label: "Microfrontends"
    description: "Federated modules with webpack module federation"

Issue: Stakeholder doesn't understand technical jargon.
```

**Solution**:
```yaml
Question: "How should the frontend application be structured?"
Options:
  - label: "Single Application"
    description: "One cohesive app. Simpler to build and deploy. Best for small-to-medium projects."

  - label: "Multiple Independent Modules"
    description: "App split into independently deployable pieces. More complex but better for large teams working in parallel."

Why better:
✓ Plain language
✓ Explains trade-offs
✓ Helps stakeholder understand implications
✓ Includes scale guidance
```

---

## Part 6: Question Templates for Common Scenarios

### Template 1: Technology Selection

```yaml
Question: "Which [TECHNOLOGY CATEGORY] will you use?"
Options:
  - label: "[Option 1]"
    description: "[Brief description] - [Use case] - [Pros/Cons]"
  - label: "[Option 2]"
    description: "[Brief description] - [Use case] - [Pros/Cons]"
  - label: "[Option 3]"
    description: "[Brief description] - [Use case] - [Pros/Cons]"

Example:
Question: "Which cloud provider will you use?"
Options:
  - label: "AWS"
    description: "Industry leader with most services. Best for large-scale, complex projects. Higher learning curve."
  - label: "Google Cloud"
    description: "Strong ML/AI services, great for data-heavy apps. Good pricing for compute."
  - label: "Azure"
    description: "Best for Microsoft ecosystem integration. Good for enterprise with existing MS licenses."
  - label: "Heroku"
    description: "Simplest deployment. Best for MVPs and small projects. Less control, higher cost at scale."
```

### Template 2: Scale/Size Questions

```yaml
Question: "What is the expected [METRIC]?"
Options:
  - label: "[Range 1] - [Context]"
    description: "[Implications for architecture]"
  - label: "[Range 2] - [Context]"
    description: "[Implications for architecture]"
  - label: "[Range 3] - [Context]"
    description: "[Implications for architecture]"

Example:
Question: "What is the expected number of concurrent users?"
Options:
  - label: "1-100 users - MVP/early stage"
    description: "Simple architecture. Single server sufficient. Focus on feature development."
  - label: "100-1,000 users - small business"
    description: "Moderate scale. May need basic caching. Standard cloud setup."
  - label: "1,000-10,000 users - established product"
    description: "Requires load balancing, caching strategy, CDN. Multi-server architecture."
  - label: "10,000+ users - enterprise scale"
    description: "Requires auto-scaling, advanced caching, microservices consideration. Full DevOps pipeline."
```

### Template 3: Requirement Prioritization

```yaml
Question: "Which [ASPECT] is most important for version 1.0?"
Options:
  - label: "[Priority 1]"
    description: "Prioritizing this means [implications]"
  - label: "[Priority 2]"
    description: "Prioritizing this means [implications]"
  - label: "[Priority 3]"
    description: "Prioritizing this means [implications]"

Example:
Question: "Which quality is most important for version 1.0?"
Options:
  - label: "Speed to market"
    description: "Launch quickly with core features. Accept technical debt. Iterate based on feedback."
  - label: "Feature completeness"
    description: "Launch with all planned features. Takes longer but more polished at launch."
  - label: "Technical excellence"
    description: "Build scalable, maintainable foundation. Longer timeline but easier future changes."
```

### Template 4: Integration/Complexity Questions

```yaml
Question: "How does [SYSTEM] integrate with [EXTERNAL SYSTEM]?"
Options:
  - label: "No integration needed"
    description: "System is standalone. Simplest architecture."
  - label: "Read-only integration"
    description: "System pulls data from [EXTERNAL]. One-way sync. Moderate complexity."
  - label: "Bi-directional sync"
    description: "System reads and writes to [EXTERNAL]. Requires sync strategy. Higher complexity."
  - label: "Real-time integration"
    description: "System stays in sync in real-time. Requires webhooks or polling. Most complex."

Example:
Question: "How does your system integrate with the existing CRM?"
Options:
  - label: "No integration needed"
    description: "New system is independent. No CRM data needed."
  - label: "Read-only integration"
    description: "Import customer data from CRM. One-way sync (CRM → new system)."
  - label: "Bi-directional sync"
    description: "Keep customer data synchronized between systems (CRM ↔ new system)."
  - label: "Real-time integration"
    description: "Changes in either system reflect immediately in the other."
```

---

## Part 7: Validation Protocol Summary

### Before Asking Any Question Using `AskUserQuestion`

**Step 1: Validate Question Type**
- [ ] Is this a discrete choice question? (If not, use open-ended text)
- [ ] Can I enumerate 80-90% of realistic options?
- [ ] Are options mutually exclusive (or use multiSelect: true)?

**Step 2: Validate Options**
- [ ] Options cover common cases
- [ ] Each option has clear description
- [ ] Descriptions explain implications/trade-offs
- [ ] Descriptions use stakeholder-friendly language
- [ ] Options are measurable/specific (not vague)

**Step 3: Validate Question Clarity**
- [ ] Question is specific (not too broad)
- [ ] Stakeholder has context to answer
- [ ] Answer will inform architecture decisions
- [ ] Question is appropriate for this phase (requirements vs design)

**Step 4: Prepare "Other" Handling**
- [ ] Have follow-up questions ready for "Other" responses
- [ ] Know how to categorize novel answers
- [ ] Can document custom responses appropriately

### After Receiving Answer

**Step 5: Validate Answer Completeness**
- [ ] Answer provides enough detail for architecture decisions
- [ ] If "Other" selected: Follow deep-dive protocol
- [ ] Document answer with justification
- [ ] Get stakeholder approval on documented interpretation

---

## Part 8: Examples - Before & After

### Example 1: Authentication Question

**BEFORE (Incomplete Options)**:
```yaml
Question: "How should users log in?"
Options:
  - "Email and password"
  - "Social media"

Problems:
✗ "Social media" is vague (which platforms?)
✗ Missing modern options (SSO, biometric, MFA)
✗ No context for stakeholder to decide
```

**AFTER (Complete Options)**:
```yaml
Question: "Which authentication method should users use to log in?"
Options:
  - label: "Email/Password"
    description: "Traditional login. Simple to implement. Users create account with email and password."

  - label: "Social Login (Google, Facebook, Apple)"
    description: "Users log in with existing social accounts. Faster signup, no password to remember."

  - label: "Single Sign-On (SSO)"
    description: "Enterprise option. Users log in with company credentials (SAML, LDAP). Best for B2B."

  - label: "Multi-Factor Authentication (MFA)"
    description: "Extra security layer (email/password + code). Required for high-security applications."

  - label: "Passwordless (Magic Link or Biometric)"
    description: "Modern approach. Email magic link or fingerprint/face recognition. Best user experience."

Why better:
✓ Covers common patterns
✓ Explains each option
✓ Helps stakeholder understand trade-offs
✓ "Other" handles edge cases (custom enterprise SSO)
```

### Example 2: Data Storage Question

**BEFORE (Too Technical)**:
```yaml
Question: "Which database?"
Options:
  - "PostgreSQL"
  - "MongoDB"
  - "Redis"

Problems:
✗ Stakeholder doesn't know databases
✗ No context about when to use each
✗ Technical decision, not business decision
```

**AFTER (Business-Focused)**:
```yaml
Question: "How structured is your data, and how complex are relationships between entities?"
Options:
  - label: "Highly structured with complex relationships"
    description: "Example: Users have many projects, projects have many tasks, tasks have many tags, etc. (Choose this for relational database like PostgreSQL)"

  - label: "Semi-structured with some relationships"
    description: "Example: Mostly independent entities with a few connections. (Works with relational or document database)"

  - label: "Flexible schema, minimal relationships"
    description: "Example: Data structure changes frequently, entities are mostly independent. (Document database like MongoDB)"

  - label: "Simple key-value storage"
    description: "Example: User preferences, session data, caching. (Key-value store like Redis)"

Then PMA makes technical decision:
"Highly structured" → PostgreSQL
"Flexible schema" → MongoDB
"Simple key-value" → Redis

Why better:
✓ Stakeholder understands question
✓ Business-focused, not technical
✓ Answer still informs architecture
✓ PMA translates to technical choice
```

### Example 3: Scale Question

**BEFORE (Vague)**:
```yaml
Question: "How big will the system be?"
Options:
  - "Small"
  - "Medium"
  - "Large"

Problems:
✗ "Small/Medium/Large" are subjective
✗ No measurable criteria
✗ Doesn't help architecture decisions
```

**AFTER (Measurable)**:
```yaml
Question: "What is the expected number of users and data volume?"
multiSelect: false
Options:
  - label: "MVP/Pilot - <100 users, <10GB data"
    description: "Simple architecture. Single server. Focus on rapid iteration. ~$50-100/month hosting."

  - label: "Small Business - 100-1,000 users, 10-100GB data"
    description: "Standard architecture. Basic scaling. Load balancer optional. ~$100-500/month hosting."

  - label: "Growth Stage - 1,000-10,000 users, 100GB-1TB data"
    description: "Requires caching, CDN, load balancing. Auto-scaling recommended. ~$500-2,000/month hosting."

  - label: "Enterprise - 10,000+ users, 1TB+ data"
    description: "Advanced architecture. Microservices consideration. Full DevOps. ~$2,000+/month hosting."

Why better:
✓ Measurable ranges
✓ Explains architectural implications
✓ Includes cost guidance
✓ Stakeholder can self-identify
```

---

## Part 9: Robot-Specific Applications

### For Talib (Phase 1 - Requirements)

**Focus**: Gathering business requirements

**Good Questions**:
- User workflows and pain points
- Data entities in business domain
- Business rules and constraints
- Integration with existing systems
- Success metrics

**Avoid**:
- Technical implementation details
- Library/framework choices
- Architectural patterns
- Performance optimization techniques

**Example Question**:
```yaml
Question: "What happens when a user creates a new project?"
(Open-ended text, not AskUserQuestion)

Why: Gathering workflow understanding, not selecting from options.
```

### For PMA (Phase 2 - Architecture)

**Focus**: Technical architecture decisions

**Good Questions**:
- Technology stack choices
- Deployment strategies
- Scale and performance targets
- Testing approaches
- Integration patterns

**Avoid**:
- Business process questions (Talib's job)
- UI/UX design questions (Clara's job)
- Implementation details (dev robots' job)

**Example Question**:
```yaml
Question: "Which backend framework should we use for this project?"
Options:
  - label: "Node.js + Express"
    description: "JavaScript ecosystem. Fast development. Great for real-time apps. Large community."

  - label: "Python + Django/FastAPI"
    description: "Python ecosystem. Excellent for data-heavy apps and ML integration. Strong libraries."

  - label: "Java + Spring Boot"
    description: "Enterprise Java. Best for large teams, complex systems. Strict typing, robust tooling."

  - label: "Go"
    description: "High performance, low resource usage. Best for microservices and APIs. Simpler than Java."

Why appropriate for PMA:
✓ Technical decision
✓ Affects architecture
✓ PMA coordinates with stakeholder on team expertise
✓ Documented in technical-decisions.md
```

### For Sarah/Chaperone (Phase 2B - Quality Gate)

**Focus**: Validation questions about design completeness

**Good Questions**:
- Missing specifications
- Ambiguities in design
- Gaps in technical decisions
- Unaddressed edge cases

**Avoid**:
- Gathering new requirements (Talib's job)
- Making architecture changes (PMA's job)
- Redesigning (go back to appropriate phase)

**Example Question**:
```yaml
Question: "I found the data model doesn't specify how users are authenticated. Was this intentional?"
Options:
  - label: "Authentication is out of scope for v1.0"
    description: "Proceed without authentication (public access)"

  - label: "Authentication was assumed but not documented"
    description: "BLOCKER - PMA must document authentication approach"

  - label: "Authentication handled by external system"
    description: "Document integration with external auth system"

Why appropriate for Sarah:
✓ Identifying gap in specifications
✓ Offers options for resolution
✓ Can BLOCK if critical information missing
```

---

## Part 10: Success Metrics

### How to Measure Question Quality

| Metric | Target | How to Measure |
|--------|--------|----------------|
| "Other" Response Rate | <20% | Count "Other" selections vs predefined options |
| Follow-Up Clarification Cycles | <2 per question | Count how many times you need to re-ask |
| Stakeholder Confusion | 0 instances | Track "I don't understand this question" responses |
| Option Completeness | >90% | % of realistic scenarios covered by options |
| Decision Informativeness | 100% | Every answer leads to architecture decision |

### Question Quality Checklist

**Before finalizing any question, verify**:
- [ ] Options cover 80-90% of realistic scenarios
- [ ] Each option has clear, stakeholder-friendly description
- [ ] Question is appropriate for this phase (requirements vs architecture)
- [ ] Answer will inform architecture decisions
- [ ] Stakeholder has context to answer
- [ ] "Other" handling protocol defined
- [ ] Mutually exclusive options (or multiSelect used correctly)

---

## Conclusion

This framework ensures:
- ✅ Questions have complete, well-described options
- ✅ "Other" responses are handled systematically
- ✅ Follow-up protocols capture missing information
- ✅ Stakeholders provide adequate detail for architecture decisions
- ✅ Robots gather requirements efficiently with minimal clarification cycles

**Key Principle**: Ask the right question at the right time with the right options, and have a plan for when the answer doesn't fit predefined categories.

---

## Quick Reference Card

### Decision Tree
```
Is this a discrete choice? → YES → Use AskUserQuestion
                           → NO  → Use open-ended text question

Can I list 80-90% of realistic options? → YES → Proceed with AskUserQuestion
                                        → NO  → Use open-ended or break into smaller questions

Are options mutually exclusive? → YES → Single selection
                                → NO  → Use multiSelect: true
```

### Option Checklist
- [ ] Covers common cases (80-90%)
- [ ] Clear descriptions (stakeholder-friendly)
- [ ] Trade-offs explained
- [ ] Measurable/specific (not vague)
- [ ] Appropriate for phase

### "Other" Protocol
1. Receive custom response
2. Categorize (fits option? variant? novel?)
3. If novel: Deep-dive follow-up (scope, constraints, feasibility)
4. Document with full context
5. Validate with stakeholder

---

**Version History**:
- v1.0 (2025-11-11): Initial framework created based on ROME v6.0 methodology analysis
