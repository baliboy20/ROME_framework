# Claude Chaperone - Specification Review Assistant

**Role**: Specification Augmentation & Technical Analysis
**Created**: 2025-10-28
**Status**: Active & Ready

---

## What is the Chaperone?

The **Chaperone** is a specialized assistant within the ROME methodology focused on **enhancing and clarifying project specifications** before development begins. While the PMA (Project Manager/Architect) handles planning and coordination, the Chaperone dives deep into **technical specifics** to ensure the development team has complete clarity.

### Key Responsibilities
1. **Review** existing PRD, use cases, and specification documents
2. **Analyze** technical requirements across 8 key dimensions
3. **Question** ambiguities and unvalidated assumptions
4. **Augment** specs with deeper technical analysis
5. **Produce** enhanced specification for development robots

---

## How to Use

### Starting the Chaperone Session

```bash
cd /Users/will/flutterProjects/Exercises/oct/romev2/claude_chaperone
./__start.sh
```

Or invoke directly:
```bash
claude < CLAUDE.md
```

### What Happens Next

1. **Chaperone reads ROME methodology** to understand the framework
2. **Chaperone gathers project specifications** (PRD, use cases, designs)
3. **Chaperone conducts technical analysis** across 8 dimensions:
   - Data Model & Schema
   - Application Flows & Use Cases
   - Authentication & Authorization
   - Caching Strategy
   - Technology Stack & Patterns
   - Target Platforms & Deployment
   - Testing Strategy & Regime
   - Greenfield vs Existing System

4. **Chaperone asks clarifying questions** in structured format
5. **Stakeholders respond** with answers
6. **Chaperone produces enhanced specification** document

---

## The 8 Technical Dimensions

### 1. Data Model & Schema Analysis
Ensures entities, relationships, constraints, and lifecycle are clearly defined.

**Questions addressed**:
- Are all entities clearly defined with attributes and constraints?
- What are the relationships (1:1, 1:M, M:M)?
- What is the entity lifecycle?
- What indexing is needed for performance?

### 2. Application Flows & Use Cases
Clarifies user workflows, success/failure scenarios, and state transitions.

**Questions addressed**:
- Are main user journeys clearly mapped?
- What are failure scenarios and edge cases?
- Are complex state machines documented?
- What is the operational volume?

### 3. Authentication & Authorization
Defines security model and permission structure.

**Questions addressed**:
- Which authentication method? (JWT, OAuth2, session)
- What is the authorization model? (RBAC, ABAC)
- What are the security requirements?
- How are tokens/sessions managed?

### 4. Caching Strategy
Optimizes performance through strategic caching decisions.

**Questions addressed**:
- What data should be cached?
- What is the cache invalidation strategy?
- What are performance targets?
- Do we need distributed caching?

### 5. Technology Stack & Patterns
Justifies technology choices and architecture patterns.

**Questions addressed**:
- What backend framework/language?
- What database and why?
- What architecture patterns (Clean, MVVM, BLoC)?
- Are library choices appropriate?

### 6. Target Platforms & Deployment
Defines platform support and infrastructure requirements.

**Questions addressed**:
- What platforms? (web, iOS, Android)
- Native or cross-platform?
- What cloud/deployment infrastructure?
- How does it scale?

### 7. Testing Strategy & Regime
Plans testing approach following ROME integration-first philosophy.

**Questions addressed**:
- What layers need integration tests?
- Which components need unit tests?
- What are performance benchmarks?
- How is test data managed?

### 8. System Scope - Greenfield vs Existing
Assesses whether building new or integrating with existing systems.

**Questions addressed**:
- Is this new (greenfield) or extending existing (brownfield)?
- What integrations are needed?
- Is data migration needed?
- What's the rollback plan?

---

## Files Included

### In `claude_chaperone/` directory:
- **CLAUDE.md** - Main instructions and phase-by-phase guidance
- **__start.sh** - Startup script to launch chaperone
- **README.md** - This file

### In `ROME/` directory:
- **role-chaperone.md** - Full role specification and framework
- **chaperone-quick-reference.md** - Quick lookup guide with templates
- **template-augmented-specification.md** - Template for output document

---

## Output: Augmented Specification Document

The Chaperone produces an enhanced specification document with:

### 1. Executive Summary
- Project overview and objectives
- Current specification gaps
- Key technical decisions
- Risk summary

### 2. Detailed Analysis Sections
- **Data Model**: Enhanced entity-relationship diagrams, constraints
- **Use Cases**: Clarified workflows with edge cases
- **Architecture**: Authentication, authorization, caching strategy
- **Technology**: Stack choices with justifications
- **Testing**: Strategy by layer with coverage targets
- **Implementation**: Recommended sequence and parallelization

### 3. Decision Documentation
- Stakeholder questions and answers
- Technology trade-offs
- Architecture pattern justifications
- Risk assessments with mitigation

### 4. Actionable Guidance
- For Ashok (Data Architect): Schema design, indexing, constraints
- For Reena (Backend): API contracts, business logic, error handling
- For Charlie (Frontend): Workflows, state management, data fetching

---

## Integration with ROME Team

The Chaperone works alongside the development robots:

- **Data Architect (Ashok)**: Receives detailed schema and constraint specifications
- **Backend Engineer (Reena)**: Receives API contracts and business logic requirements
- **Frontend Engineer (Charlie)**: Receives clarified workflows and state management guidance
- **PMA**: Receives enhanced specifications to support planning and coordination

---

## Process Timeline

### Day 1: Analysis
- Chaperone reads ROME methodology
- Chaperone collects and reviews all specification documents
- Chaperone conducts technical analysis

### Day 2: Clarification
- Chaperone asks structured clarifying questions
- Stakeholders provide answers
- Chaperone documents decisions

### Day 3: Augmentation
- Chaperone produces enhanced specification
- Includes detailed data model, architecture decisions, testing strategy
- Provides implementation roadmap and risk assessment

### Ongoing: Development Support
- Chaperone available to clarify technical decisions
- Supports Ashok, Reena, Charlie with guidance
- Updates specification as needed based on discoveries

---

## Success Criteria

The Chaperone review is complete when:

- ✅ All ROME methodology understood
- ✅ Original specifications reviewed and gaps identified
- ✅ Technical analysis completed across all 8 dimensions
- ✅ Clarifying questions asked and answered
- ✅ Augmented specification document created
- ✅ Development robots (Ashok, Reena, Charlie) have complete clarity
- ✅ Technology stack choices are justified
- ✅ Testing strategy is defined by layer
- ✅ Risk areas identified with mitigation
- ✅ Implementation sequence recommended

---

## Key Features

### 1. Structured Analysis Framework
Eight technical dimensions ensure comprehensive coverage of all important areas.

### 2. Question-Driven Approach
Rather than dictating, Chaperone asks clarifying questions with options.

### 3. ROME Integration
Follows ROME's integration-first testing philosophy and vertical feature slices.

### 4. Actionable Output
Enhanced specifications are directly usable by development robots.

### 5. Risk Management
Identifies risks early and recommends mitigation strategies.

---

## Asking Questions

The Chaperone uses a structured question format:

```
## Area: [Technology Area]

### Question 1: [Specific, answerable question]
**Context**: Why this matters
**Impact**: Technical implications

- **Option A**: Description - Pros / Cons
- **Option B**: Description - Pros / Cons
- **Option C**: Description - Pros / Cons
- **Other**: Custom response welcome

**Complexity**: Implementation complexity with each option
```

This makes it easy for stakeholders to:
- Understand the context
- See the trade-offs
- Make informed decisions
- Respond quickly

---

## Documentation References

### ROME Methodology
- [rome-overview.md](../ROME/rome-overview.md) - ROME philosophy and approach
- [rome-implementation-guide.md](../ROME/rome-implementation-guide.md) - Integration-first testing
- [rome-reference.md](../ROME/rome-reference.md) - Quick reference

### Role Specifications
- [role-pma.md](../ROME/role-pma.md) - PMA (partner role)
- [role-chaperone.md](../ROME/role-chaperone.md) - Full Chaperone specification
- [role-data.md](../ROME/role-data.md) - Data Architect
- [role-backend.md](../ROME/role-backend.md) - Backend Engineer
- [role-frontend.md](../ROME/role-frontend.md) - Frontend Engineer

### Templates & Guides
- [template-augmented-specification.md](../ROME/template-augmented-specification.md) - Output template
- [chaperone-quick-reference.md](../ROME/chaperone-quick-reference.md) - Quick lookup guide

---

## Getting Started

### 1. Prepare Your Specifications
Gather all available project documentation:
- Product Requirements Document (PRD)
- Use cases or user stories
- UI/UX designs (if available)
- Architecture diagrams
- Technical specifications
- Data models

### 2. Launch Chaperone
```bash
cd claude_chaperone
./__start.sh
```

### 3. Guide Chaperone
Tell Chaperone which specifications to review:
```
Please review the following specifications:
1. PROJECT/dev/prd.md
2. PROJECT/dev/use_cases.md
3. Any design mockups in /designs/
```

### 4. Respond to Questions
As Chaperone asks questions, provide answers or let it know which option you prefer.

### 5. Review Augmented Specification
Once complete, review the enhanced specification document in:
```
PROJECT/dev/specification_augmented.md
```

### 6. Share with Team
Distribute to Ashok (Data), Reena (Backend), Charlie (Frontend) for clarity.

---

## When to Use Chaperone

✅ **Use Chaperone For**:
- Complex systems with unclear requirements
- First-time ROME projects
- Brownfield projects with legacy integration
- Systems with sophisticated architecture
- Specifications with known gaps or ambiguities

❌ **Skip Chaperone For**:
- Very simple, straightforward projects
- Specifications already complete and clear
- Projects where tech is already locked in
- Quick prototypes without real specs

---

## Contact & Support

For issues or questions about the Chaperone:

1. Check [chaperone-quick-reference.md](../ROME/chaperone-quick-reference.md) for templates
2. Review [role-chaperone.md](../ROME/role-chaperone.md) for detailed guidance
3. Consult [template-augmented-specification.md](../ROME/template-augmented-specification.md) for output format

---

## Summary

The **Chaperone** role brings **technical rigor and clarity** to project specifications, ensuring the development team has complete, unambiguous guidance before implementation begins.

By analyzing 8 critical technical dimensions and asking structured clarifying questions, the Chaperone transforms vague specifications into **actionable technical documentation** that enables parallel development by Ashok (Data), Reena (Backend), and Charlie (Frontend).

**Ready to enhance your specifications?**

```bash
cd claude_chaperone
./__start.sh
```

---

**Status**: Active & Ready for Use
**Created**: 2025-10-28
**Last Updated**: 2025-10-28
