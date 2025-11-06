# HTM to PMA Handoff Protocol

**Version:** 5.0
**Date:** November 6, 2025
**Status:** Production

---

## Purpose

This document defines the handoff protocol between HTM Decomposer (Phase 1) and PMA (Phase 2), ensuring seamless transition of requirements artifacts to technical architecture planning.

---

## Handoff Artifacts

### Required Deliverables from HTM

The HTM Decomposer MUST deliver all artifacts before PMA begins Phase 2:

```
PROJECT/requirements/
├── requirements-matrix.yaml      # REQUIRED
├── data-dictionary.yaml          # REQUIRED
├── component-registry.yaml       # REQUIRED
└── docs/
    └── features/
        ├── FEAT-XXX.X.md        # One per feature - REQUIRED
        └── ...
```

### Artifact Specifications

#### 1. requirements-matrix.yaml

**Purpose:** Complete requirements hierarchy with traceability

**Must contain:**
- Epic-level requirements
- Feature-level requirements
- Story-level requirements
- Task-level requirements
- Traceability IDs (format: EPIC-XXX, FEAT-XXX.X, STORY-XXX.X.X, TASK-XXX.X.X.X)
- Acceptance criteria at each level
- Dependencies between requirements
- Priority/criticality markers

**PMA uses this for:**
- Understanding scope boundaries
- Identifying integration points
- Planning test coverage
- Creating action list with traceability

#### 2. data-dictionary.yaml

**Purpose:** Domain model and entity definitions

**Must contain:**
- All domain entities
- Entity attributes with types
- Relationships between entities
- Business rules and constraints
- Validation rules
- Enumerations and value sets

**PMA uses this for:**
- Refining into technical data model
- Database schema design
- API endpoint design
- Identifying data architecture patterns

#### 3. component-registry.yaml

**Purpose:** Mapping of features to technical components

**Must contain:**
- Component names and types (Frontend, Backend, Data, Infrastructure)
- Feature-to-component mappings
- Component dependencies
- Technical boundaries
- Integration points

**PMA uses this for:**
- Creating action list assignments
- Identifying robot responsibilities
- Planning integration testing
- Defining service boundaries

#### 4. Feature Documentation (docs/features/*.md)

**Purpose:** Detailed feature specifications

**Each feature document must contain:**
- Feature ID and name
- User stories
- Acceptance criteria
- UI/UX requirements (if applicable)
- Business rules
- Edge cases
- Dependencies

**PMA uses this for:**
- Understanding detailed requirements
- Architecture decision context
- Test case planning

---

## Handoff Validation Checklist

### Pre-Handoff: HTM Decomposer Self-Check

Before declaring Phase 1 complete, HTM Decomposer validates:

- [ ] All three YAML files exist and parse correctly
- [ ] requirements-matrix.yaml has complete traceability chain
- [ ] data-dictionary.yaml defines all entities mentioned in features
- [ ] component-registry.yaml maps all features to components
- [ ] Every feature has a corresponding .md file in docs/features/
- [ ] All traceability IDs follow naming convention
- [ ] No placeholder or TODO items remain
- [ ] Cross-references between artifacts are consistent

### Phase 1B: Artifact Validation Gate (OPTIONAL)

**Validator:** Chaperone or designated reviewer
**Timing:** Between Phase 1 and Phase 2

**Validation checks:**
1. **Completeness:** All required files present
2. **Consistency:** Cross-references match between artifacts
3. **Format:** YAML files parse without errors
4. **Traceability:** All IDs follow convention, no gaps
5. **Coverage:** All features documented, all entities defined

**Outcomes:**
- ✅ **PASS:** PMA proceeds to Phase 2
- 🚫 **BLOCK:** HTM Decomposer fixes issues, resubmit
- 🚩 **ESCALATE:** Ambiguity requires user clarification

---

## PMA Handoff Consumption Protocol

### Step 1: Artifact Analysis (PMA Phase 2, Step 1)

**PMA must:**

1. **Read all YAML artifacts**
   - Parse requirements-matrix.yaml
   - Parse data-dictionary.yaml
   - Parse component-registry.yaml

2. **Validate completeness**
   - Check for missing entities
   - Check for undefined dependencies
   - Check for incomplete traceability

3. **Identify clarification needs**
   - If artifacts incomplete: Request HTM revision
   - If requirements ambiguous: Request user clarification
   - If feasibility concerns: Document for architecture phase

4. **Create artifact summary**
   - Count epics, features, stories, tasks
   - List all entities
   - List all components
   - Identify critical paths

### Step 2: Architecture Design (PMA Phase 2, Step 2)

**Using HTM artifacts:**

- **requirements-matrix.yaml** → Informs integration points, test boundaries
- **data-dictionary.yaml** → Basis for data architecture decisions
- **component-registry.yaml** → Guides service/module boundaries
- **Feature docs** → Context for technology selection

**PMA decisions informed by HTM:**
- Which features need real-time vs. batch processing
- Which entities require relational vs. document storage
- Which components need high availability
- Which integrations are synchronous vs. asynchronous

---

## Handoff Failure Scenarios

### Scenario 1: Incomplete Artifacts

**Symptoms:**
- Missing YAML files
- Empty or stub sections
- Placeholder IDs (e.g., "XXX", "TBD")

**Resolution:**
1. PMA documents missing items
2. Return to HTM Decomposer
3. HTM completes artifacts
4. Re-validate before proceeding

**Prevention:** Use Phase 1B validation gate

### Scenario 2: Inconsistent Traceability

**Symptoms:**
- Feature references undefined entities
- Component registry references nonexistent features
- Broken ID chains in requirements matrix

**Resolution:**
1. PMA identifies inconsistencies
2. HTM Decomposer reconciles artifacts
3. PMA re-validates

**Prevention:** HTM self-check before handoff

### Scenario 3: Ambiguous Requirements

**Symptoms:**
- PMA cannot make architecture decision without clarification
- Feature specifications conflict
- Business rules unclear

**Resolution:**
1. PMA documents specific questions
2. Escalate to user via Chaperone
3. User provides clarification
4. HTM or PMA updates artifacts (depending on answer)

**Prevention:** HTM Stage 1 assessment catches ambiguity early

### Scenario 4: Technical Infeasibility

**Symptoms:**
- Requirements conflict with available technology
- Performance requirements unachievable
- Integration requirements not supported

**Resolution:**
1. PMA documents infeasibility with evidence
2. Escalate to Chaperone
3. User decision: Revise requirements OR change technology
4. HTM updates artifacts if requirements change

**Prevention:** HTM Stage 1 includes technical context review

---

## Communication Protocol

### HTM Declares Completion

**Method:** Status update via activity log

**Message format:**
```
Phase 1 COMPLETE
- requirements-matrix.yaml: ✅ [X epics, Y features, Z stories]
- data-dictionary.yaml: ✅ [N entities defined]
- component-registry.yaml: ✅ [M components mapped]
- Feature docs: ✅ [Y files]
Status: READY FOR PHASE 2 HANDOFF
```

### PMA Acknowledges Receipt

**Method:** Status update via activity log

**Message format:**
```
Phase 2 STARTED
- Received HTM artifacts
- Validation: [PASS/ISSUES]
- Issues identified: [list or "None"]
- Proceeding to: [Architecture Design / Request Revision]
```

### PMA Requests Revision

**Method:** Issue documentation + activity log

**Message format:**
```
Phase 1 REVISION REQUIRED
Issue: [Describe specific problem]
Artifact: [Which file(s)]
Required action: [What HTM needs to fix]
Blocking: [Yes/No]
```

---

## Success Criteria

### Handoff Considered Successful When:

1. ✅ All required artifacts delivered
2. ✅ YAML files parse without errors
3. ✅ PMA validates completeness (Step 1)
4. ✅ No blocking issues identified
5. ✅ PMA proceeds to Step 2 (Architecture Design)
6. ✅ No revisions requested within first iteration

### Metrics

**Ideal state:**
- Zero handoff revisions required
- PMA proceeds directly from Step 1 to Step 2

**Acceptable state:**
- One revision cycle for minor corrections
- PMA identifies clarifications but can proceed with assumptions

**Unacceptable state:**
- Multiple revision cycles
- PMA blocked from proceeding
- Escalations due to incomplete artifacts

---

## Integration with Phase 2A (UX)

**Note:** UX Clara (Phase 2A) also reads HTM artifacts

**UX Clara needs from HTM:**
- requirements-matrix.yaml → UI feature requirements
- Feature docs → User stories and acceptance criteria
- data-dictionary.yaml → Form fields and display data

**Coordination:**
- PMA completes architecture first (Phase 2)
- UX Clara receives both HTM artifacts AND PMA architecture
- UX design constrained by both requirements and architecture

---

## Related Documents

- `/ROME/integration/htm-rome-integration-guide.md` - Overall v5.0 workflow
- `/ROME/integration/quick-start-htm-rome.md` - Step-by-step guide
- `/ROME/role-pma.md` - PMA role specification
- `/ROME/roles/role-htm-decomposer.md` - HTM Decomposer role specification
- `/ROME/integration/yaml-schema-definitions.md` - YAML artifact schemas

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 5.0 | 2025-11-06 | Initial handoff protocol for HTM-ROME integration |

---

**Next:** Read `/ROME/integration/quick-start-htm-rome.md` for end-to-end walkthrough
