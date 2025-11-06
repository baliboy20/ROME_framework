# Quick Start: ROME 5.0 with HTM

**Time to Complete:** 30 minutes to understand, 2-10 days to execute  
**Prerequisites:** PRD or requirements document

---

## Step 1: Assess Your PRD (5 minutes)

### Question 1: Do you have requirements documented?
- **NO** → Stop. Do requirements elicitation first.
- **YES** → Continue to Question 2

### Question 2: Project complexity?
- **Simple (<5 features, prototype, POC)** → Skip HTM, use direct ROME Phase 2
- **Complex (≥10 features, needs traceability)** → Use full HTM Phase 1

### Question 3: Is PRD in HTM-ready format?
HTM-ready = 6 sections: Business Context, Product Capabilities, User Context, Domain Model, Technical Context, Scope

- **YES** → Start at HTM Stage 3 (skip transformation)
- **NO** → Start at HTM Stage 1 (full workflow)

---

## Step 2: Phase 1 - HTM Requirements Engineering (2-5 days)

### Prompt Template

```markdown
I'm starting ROME v5.0 Phase 1 with HTM requirements engineering.

Please act as HTM Decomposer and read:
- /mnt/project/HTM/HTM-Master-Workflow.md
- /mnt/project/HTM/Prompting-Claude-for-HTM.md
- /mnt/project/HTM/HTM-Input-Requirements.md

[If transformation needed, also read:]
- /mnt/project/HTM/Transforming-PRDs-for-HTM.md
- /mnt/project/HTM/HTM-Ready-PRD-Structure.md

Here's my PRD:
[Attach or paste PRD]

Follow HTM workflow stages 1-4. Generate YAML artifacts in PROJECT/requirements/
```

### Expected Outputs

```
PROJECT/requirements/
├── requirements-matrix.yaml       # Epic→Feature→Story→Task hierarchy
├── data-dictionary.yaml           # All domain entities
├── component-registry.yaml        # Technical components
└── docs/features/
    ├── FEAT-001.1.md
    ├── FEAT-001.2.md
    └── ...
```

### Success Check
- [ ] All epics identified
- [ ] All features have acceptance criteria
- [ ] All data entities documented
- [ ] All components mapped
- [ ] Requirements have traceability IDs

---

## Step 3: Phase 2 - PMA Technical Architecture (3-7 days)

### Prompt Template

```markdown
I've completed ROME v5.0 Phase 1 (HTM). Starting Phase 2 (PMA).

Please act as PMA and read:
- /mnt/project/ROME/roles/role-pma.md
- /mnt/project/ROME/integration/htm-to-pma-handoff.md
- /mnt/project/ROME/start-here.md

HTM artifacts are in: PROJECT/requirements/

Follow Phase 2 Steps 1-6:
1. Read and analyze HTM artifacts
2. Design technical architecture (expanded step)
3. Refine data model
4. Plan integration tests
5. Setup project structure
6. Create action list

Use expert documentation and MCP servers for architecture decisions.
```

### Expected Outputs

```
PROJECT/dev/
├── architecture_specification.md   # Tech stack, API design, auth, caching, deployment
├── data_model.md                   # Refined from HTM data-dictionary.yaml
├── integration_test_plan.md        # Test strategy per feature
└── actionlist.md                   # Feature assignments to robots
```

### Success Check
- [ ] Technology stack selected with rationale
- [ ] API contracts designed
- [ ] Authentication pattern defined
- [ ] Data model refined with indexes/constraints
- [ ] Integration tests planned
- [ ] Features assigned to robots

---

## Step 4: Phase 2B - Chaperone Validation (1-2 days)

### Prompt Template

```markdown
I've completed Phase 2 (PMA). Starting Phase 2B validation.

Please act as Chaperone and read:
- /mnt/project/ROME/roles/role-chaperone.md

Validate these artifacts:
- PROJECT/requirements/ (HTM outputs)
- PROJECT/dev/ (PMA outputs)

Check:
- Requirements completeness
- Architecture addresses all features
- Data model consistency
- Test plan coverage
- No conflicts or gaps

Provide: design_approval.md OR design_blocking_issues.md
```

### Possible Outcomes
- ✅ **Approved** → Proceed to Phase 3
- 🚫 **Blocked** → Fix issues, re-validate
- 🚩 **Escalated** → Human decision needed

---

## Step 5: Phase 3 - Development (Ongoing)

### Prompt Templates

**For Ashok (Data Layer):**
```markdown
Act as Ashok (Data Architect). Read:
- /mnt/project/ROME/roles/role-data.md
- PROJECT/dev/data_model.md
- PROJECT/dev/actionlist.md (your features)

Implement data layer for assigned features.
```

**For Reena (Backend):**
```markdown
Act as Reena (Backend Engineer). Read:
- /mnt/project/ROME/roles/role-backend.md
- PROJECT/dev/architecture_specification.md
- PROJECT/dev/actionlist.md (your features)

Implement backend for assigned features.
```

**For Charlie (Frontend):**
```markdown
Act as Charlie (Frontend Engineer). Read:
- /mnt/project/ROME/roles/role-frontend.md
- PROJECT/dev/architecture_specification.md
- PROJECT/dev/actionlist.md (your features)

Implement frontend for assigned features.
```

---

## Step 6: Phase 4 - Validation & Deploy

Follow ROME standard validation procedures.

---

## Common Scenarios

### Scenario A: Complex SaaS Application
**Path:** HTM Stage 1-4 → PMA Phase 2 → Chaperone 2B → Development  
**Why:** Needs traceability, complex requirements, multiple features

### Scenario B: Simple Todo App
**Path:** Skip HTM → Direct PMA Phase 2 → Development  
**Why:** <5 features, simple domain, quick prototype

### Scenario C: Well-Documented PRD
**Path:** HTM Stage 3-4 only → PMA Phase 2 → Development  
**Why:** PRD already structured, just needs decomposition

---

## Time Estimates

| Phase | Duration | Can Parallelize? |
|-------|----------|------------------|
| HTM Phase 1 | 2-5 days | No (sequential stages) |
| PMA Phase 2 | 3-7 days | No (sequential steps) |
| Chaperone 2B | 1-2 days | No |
| Development | Varies | Yes (robots work in parallel) |

**Total Before Development:** ~6-14 days

---

## Troubleshooting

### "HTM artifacts incomplete"
→ Review HTM-Input-Requirements.md, ensure all 6 PRD sections present

### "PMA can't read YAML artifacts"
→ Check file format, validate YAML syntax, review htm-to-pma-handoff.md

### "Architecture doesn't match requirements"
→ Phase 2B Chaperone should catch this, return to PMA Step 2

### "Too complex, taking too long"
→ Consider breaking project into phases, MVP first

---

## Next Steps

**After completing this guide:**
1. Read full methodology: `/ROME/ROME-5.0-COMPLETE-GUIDE.md`
2. Review HTM details: `/HTM/HTM-Master-Workflow.md`
3. Understand handoff: `/ROME/integration/htm-to-pma-handoff.md`
4. Start your project!

---

## Support

- **Documentation:** All guides in `/ROME/` and `/HTM/`
- **Examples:** See `/examples/` directory
- **Issues:** GitHub Issues
- **Migration:** See `/MIGRATION-GUIDE.md` if coming from v4.0
