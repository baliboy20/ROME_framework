# ROME Framework Proposal: Integrated AORDL + Skills Implementation Plan

| Field | Value |
|-------|-------|
| **Proposal ID** | ROME-PROP-013 |
| **Title** | Integrated AORDL + Skills Auto-Discovery Implementation Plan |
| **Status** | Draft |
| **Created** | 2025-12-24 |
| **Author** | Archie (Framework Analyst & Architect) |
| **Priority** | Critical |

---

## Executive Summary

**Purpose:** Integrate AORDL requirements methodology and skills auto-discovery system into ROME framework through phased implementation.

**Scope:**
- Replace old PRD/BRD methodology with AORDL across 106 files
- Implement skills auto-discovery system (4 new skills)
- Update life-cycle phase guidelines for AORDL and skills
- Update all robot CLAUDE.md files for new methodology

**Timeline:** 8 weeks (4 phases × 2 weeks each)

**Effort Distribution:**
- Phase 1 (Foundation): 2 weeks - AORDL spec + Skills discovery
- Phase 2 (Core Integration): 2 weeks - P01-P02 life-cycle + Talib robot
- Phase 3 (Full Integration): 3 weeks - P03-P05 + All robots
- Phase 4 (Validation): 1 week - Testing + Documentation

**Critical Path:** AORDL Phase Spec → P01 Life-cycle → Talib Robot → P02 Analysis

**Dependencies Resolved:**
- Skills auto-discovery runs parallel to AORDL spec (no dependency)
- Life-cycle updates consume AORDL spec (sequential)
- Robot updates consume life-cycle updates (sequential)

---

## Problem Statement

### Current State

**AORDL Methodology:**
- ✅ Fully defined in ROME-PROP-009
- ✅ Template exists with 13 required fields
- ✅ Requirements ARE in AORDL format (REQ-001.yaml)
- ✅ 2 AORDL skills exist (/validate-aordl, /transform-aordl-to-bdd)
- ❌ Zero robot scripts mention AORDL
- ❌ All robots still reference PRD/BRD methodology
- ❌ Phase guidelines reference old methodology

**Skills System:**
- ✅ 75 skills implemented (19 P2 + 19 P3 + 18 P4 + 19 P5)
- ✅ SkillInvoker.js working
- ✅ Skill manifests (YAML) complete
- ❌ Robots don't know skills exist
- ❌ No auto-discovery mechanism
- ❌ CLAUDE.md files must be manually updated

**Life-Cycle Guidelines:**
- ✅ Excellent phase specifications (P00-P05)
- ✅ Quality gate definitions
- ✅ Cross-phase procedures
- ❌ Reference old methodology (PRD/BRD/user stories)
- ❌ No skills system references
- ❌ P01 phase incompatible with AORDL

### Gap Analysis

| Component | Old Methodology | AORDL + Skills | Gap |
|-----------|----------------|----------------|-----|
| **Requirements Input** | PRD, BRD documents | AORDL YAML files | P01 phase redefinition |
| **P01 Phase** | Ingest PRDs/BRDs | Transform to AORDL | Complete replacement |
| **P02 Phase** | Extract from PRDs | Analyze AORDL files | Entry criteria update |
| **Robot Awareness** | Manual procedures | Skill invocation | CLAUDE.md updates |
| **Skill Discovery** | Hardcoded | Dynamic discovery | 4 new skills needed |
| **Quality Gates** | Old artifact validation | AORDL validation | Gate criteria update |

---

## Strategic Approach

### Phased Implementation

```
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 1: FOUNDATION (2 weeks)                                  │
│  ┌─────────────────┐         ┌─────────────────┐               │
│  │ AORDL Phase     │         │ Skills Auto-    │               │
│  │ Specification   │ PARALLEL│ Discovery       │               │
│  │ (P01 Definition)│         │ (4 new skills)  │               │
│  └─────────────────┘         └─────────────────┘               │
│           ↓                           ↓                         │
├─────────────────────────────────────────────────────────────────┤
│  PHASE 2: CORE INTEGRATION (2 weeks)                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Life-Cycle Updates: P01 + P02                          │   │
│  │  - P01-AORDL operations-guidelines.md                   │   │
│  │  - P02 updated for AORDL inputs                         │   │
│  │  - GATE-P1, GATE-P2 updated                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│           ↓                                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Critical Robot Updates: Talib (P01 + P02)              │   │
│  │  - AORDL methodology awareness                          │   │
│  │  - Skills auto-discovery integration                    │   │
│  │  - Reference life-cycle guidelines                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│           ↓                                                     │
├─────────────────────────────────────────────────────────────────┤
│  PHASE 3: FULL INTEGRATION (3 weeks)                            │
│  Week 1: Life-Cycle P03-P05 + Quality Gates                    │
│  Week 2: All Robot CLAUDE.md Updates (8 robots)                │
│  Week 3: Framework Documentation Updates                       │
│           ↓                                                     │
├─────────────────────────────────────────────────────────────────┤
│  PHASE 4: VALIDATION (1 week)                                  │
│  - End-to-end workflow testing                                 │
│  - Integration test with sample project                        │
│  - Documentation review and finalization                       │
└─────────────────────────────────────────────────────────────────┘
```

### Critical Path

```
AORDL Phase Spec (1w) → P01 Life-cycle (3d) → Talib CLAUDE.md (2d) →
P02 Life-cycle (2d) → P03-P05 Life-cycle (1w) → Other Robots (1w) →
Validation (1w)

Total Critical Path: 6 weeks
Parallelization: 2 weeks saved (skills auto-discovery runs parallel)
Final Timeline: 8 weeks
```

---

## Phase 1: Foundation (2 weeks)

### Objective

Establish foundational components that enable subsequent integration work.

### Work Streams (Parallel)

#### Stream A: AORDL Phase Specification (1 week)

**Tasks:**

1. **Define P01-AORDL Phase Specification** (3 days)
   - Create `/ROME/life-cycle/P01-aordl/operations-guidelines.md`
   - Define entry/exit criteria for AORDL requirements
   - Document AORDL validation modes (STRICT, GUIDED, PERMISSIVE)
   - Specify GATE-P1 validation criteria
   - Define handover to P02

   **Deliverable:** P01-AORDL operations-guidelines.md

2. **Create AORDL Artifact Schemas** (1 day)
   - Define requirement file structure (REQ-*.yaml)
   - Create AORDL validation checklist
   - Document 13 required fields with examples
   - Define anti-pattern detection rules

   **Deliverable:** AORDL artifact templates and schemas

3. **Update AORDL Skills** (1 day)
   - Enhance /validate-aordl for GATE-P1 integration
   - Update /transform-aordl-to-bdd for P02 handover
   - Create /create-aordl-requirement helper skill
   - Test AORDL skills with sample requirements

   **Deliverable:** Enhanced AORDL skills (3 skills)

4. **GATE-P1 Definition** (1 day)
   - Define GATE-P1 validation criteria
   - Create gate decision schema
   - Document Sarah's GATE-P1 audit procedures
   - Define blocker severity for AORDL violations

   **Deliverable:** GATE-P1 specification in quality-gate-protocol.md

**Effort:** 1 week (5 days)

#### Stream B: Skills Auto-Discovery System (1 week)

**Tasks:**

1. **Enhance SkillRegistry.js** (1 day)
   - Add searchSkills(query) method
   - Add getSkillsByPhase(phase) method
   - Add getSkillsByCategory(category) method
   - Add skill metadata caching

   **Deliverable:** Enhanced SkillRegistry.js

2. **Implement /list-skills** (1 day)
   - Filter by category, tier, phase
   - Search by keyword
   - Output formats: summary, detailed, JSON, markdown
   - Integration with SkillRegistry

   **Deliverable:** /list-skills skill + manifest

3. **Implement /recommend-skills** (1 day)
   - Keyword extraction from task description
   - Relevance scoring algorithm (keyword + phase + artifacts)
   - Top-N recommendations with reasoning
   - Integration with SkillRegistry

   **Deliverable:** /recommend-skills skill + manifest

4. **Implement /generate-skills-documentation** (1 day)
   - Auto-generate markdown docs from manifests
   - Group by phase and tier
   - Include usage examples
   - Output to /ROME/docs/skills/

   **Deliverable:** /generate-skills-documentation skill + manifest

5. **Implement /explain-skill** (1 day)
   - Detailed skill explanation
   - Parameters and usage examples
   - Related skills suggestions
   - Integration with documentation

   **Deliverable:** /explain-skill skill + manifest

**Effort:** 1 week (5 days)

### Phase 1 Deliverables

| Deliverable | Type | Location |
|-------------|------|----------|
| P01-AORDL operations-guidelines.md | Phase Spec | /ROME/life-cycle/P01-aordl/ |
| AORDL artifact templates | Templates | /ROME/templates/aordl/ |
| Enhanced AORDL skills (3) | Skills | /ROME/skills/tier-1/ |
| GATE-P1 specification | Procedure | /ROME/life-cycle/cross-phase-procedures/ |
| Skills auto-discovery (4 skills) | Skills | /ROME/skills/tier-1/ |
| Enhanced SkillRegistry.js | Code | /ROME/skills/lib/ |

### Phase 1 Success Criteria

- [ ] P01-AORDL phase fully specified with entry/exit criteria
- [ ] GATE-P1 validation criteria defined
- [ ] 3 AORDL skills working and tested
- [ ] 4 auto-discovery skills implemented and tested
- [ ] SkillRegistry.js enhancements complete
- [ ] All deliverables committed to git

---

## Phase 2: Core Integration (2 weeks)

### Objective

Integrate AORDL and skills into P01-P02 critical path and update Talib robot.

### Week 1: Life-Cycle P01-P02 Updates (5 days)

**Tasks:**

1. **Replace P01 Life-Cycle** (1 day)
   - Remove old /ROME/life-cycle/P01-ingest/
   - Install new /ROME/life-cycle/P01-aordl/
   - Update folder structure and references
   - Verify symlinks and paths

   **Deliverable:** P01-AORDL life-cycle folder

2. **Update P02 for AORDL Inputs** (2 days)
   - Update entry criteria: AORDL files instead of PRD/BRD
   - Update input artifacts: REQ-*.yaml files
   - Add skills references (19 P2 analysis skills)
   - Update GATE-P2 for AORDL validation
   - Update handover schema for P03

   **Deliverable:** Updated P02-analysis/operations-guidelines.md

3. **Update Quality Gate Protocol** (1 day)
   - Update GATE-P1 section (AORDL validation)
   - Update GATE-P2 section (AORDL-to-analysis validation)
   - Update gate decision schemas
   - Add AORDL-specific blocker types

   **Deliverable:** Updated quality-gate-protocol.md

4. **Test P01→P02 Workflow** (1 day)
   - Create sample AORDL requirements
   - Run /validate-aordl on samples
   - Test GATE-P1 validation
   - Test P02 entry criteria with AORDL inputs
   - Verify skills can consume AORDL format

   **Deliverable:** Test results and validated workflow

**Effort:** 1 week (5 days)

### Week 2: Talib Robot Update (5 days)

**Tasks:**

1. **Update Talib CLAUDE.md for AORDL** (2 days)
   - Remove PRD/BRD ingest procedures
   - Add AORDL requirements capture procedures
   - Add /validate-aordl skill invocation
   - Add GATE-P1 preparation procedures
   - Update handover to P02

   **Deliverable:** Updated /ROME/robots/talib/CLAUDE.md

2. **Add Skills Auto-Discovery to Talib** (1 day)
   - Add /list-skills usage instructions
   - Add /recommend-skills usage examples
   - Add skill discovery workflow
   - Reference P01 and P02 skills

   **Deliverable:** Skills-aware Talib CLAUDE.md

3. **Add Life-Cycle References to Talib** (1 day)
   - Reference /ROME/life-cycle/P01-aordl/operations-guidelines.md
   - Reference /ROME/life-cycle/P02-analysis/operations-guidelines.md
   - Reference quality-gate-protocol.md for GATE-P1
   - Add operational procedure links

   **Deliverable:** Complete Talib CLAUDE.md with references

4. **Test Talib with AORDL Workflow** (1 day)
   - Create test project
   - Run Talib through P01-AORDL
   - Verify AORDL requirement creation
   - Test /validate-aordl invocation
   - Test GATE-P1 preparation
   - Test handover to P02

   **Deliverable:** Validated Talib AORDL workflow

**Effort:** 1 week (5 days)

### Phase 2 Deliverables

| Deliverable | Type | Location |
|-------------|------|----------|
| P01-AORDL life-cycle | Phase Spec | /ROME/life-cycle/P01-aordl/ |
| Updated P02 life-cycle | Phase Spec | /ROME/life-cycle/P02-analysis/ |
| Updated quality gates | Procedure | /ROME/life-cycle/cross-phase-procedures/ |
| Updated Talib CLAUDE.md | Robot Spec | /ROME/robots/talib/ |
| P01→P02 test results | Validation | /ROME_framework_maintenance/tests/ |

### Phase 2 Success Criteria

- [ ] P01-AORDL replaces old P01-ingest
- [ ] P02 consumes AORDL requirements successfully
- [ ] GATE-P1 and GATE-P2 validate AORDL format
- [ ] Talib creates valid AORDL requirements
- [ ] Talib uses skills auto-discovery
- [ ] Talib references life-cycle guidelines
- [ ] End-to-end P01→P02 workflow tested

---

## Phase 3: Full Integration (3 weeks)

### Objective

Complete AORDL and skills integration across all phases and robots.

### Week 1: Life-Cycle P03-P05 + Quality Gates (5 days)

**Tasks:**

1. **Update P03-Design Life-Cycle** (2 days)
   - Add skills references (19 P3 design skills)
   - Add /recommend-skills usage examples
   - Update for AORDL-derived analysis inputs
   - Add /execute-p3-design orchestration
   - Update GATE-P3 criteria

   **Deliverable:** Updated P03-design/operations-guidelines.md

2. **Update P04-Config Life-Cycle** (1 day)
   - Add skills references (18 P4 config skills)
   - Add /execute-p4-configuration orchestration
   - Update GATE-P4 criteria
   - Verify compatibility with AORDL workflow

   **Deliverable:** Updated P04-config/operations-guidelines.md

3. **Update P05-Generation Life-Cycle** (1 day)
   - Add skills references (19 P5 generation skills)
   - Add /execute-p5-code-generation orchestration
   - Update GATE-P5 criteria
   - Add /execute-complete-code-pipeline reference

   **Deliverable:** Updated P05-generation/operations-guidelines.md

4. **Update All Quality Gates** (1 day)
   - Update GATE-P3 for design validation
   - Update GATE-P4 for config validation
   - Update GATE-P5 for code validation
   - Ensure AORDL traceability through all gates

   **Deliverable:** Complete quality-gate-protocol.md

**Effort:** 1 week (5 days)

### Week 2: Robot CLAUDE.md Updates (5 days)

**Robots to Update:** 7 robots (Talib already done in Phase 2)

| Robot | Phase | Priority | Effort |
|-------|-------|----------|--------|
| Roma | Orchestrator | High | 1 day |
| PMA | P03 Design | High | 1 day |
| Sarah | Quality Gates | High | 1 day |
| Charlie | P04 Config | Medium | 0.5 day |
| Reena | P04 Config | Medium | 0.5 day |
| Clara | P03 UX | Low | 0.5 day |
| Lucien | P04 Config | Medium | 0.5 day |

**Standard Updates per Robot:**

1. **AORDL Methodology Awareness**
   - Remove PRD/BRD references
   - Add AORDL awareness for relevant phases
   - Update artifact references (old → AORDL-derived)

2. **Skills Auto-Discovery Integration**
   - Add /list-skills usage instructions
   - Add /recommend-skills workflow
   - Add /explain-skill for learning
   - Reference phase-specific skills

3. **Life-Cycle Guidelines References**
   - Add links to relevant operations-guidelines.md
   - Reference quality gate protocols
   - Reference cross-phase procedures

4. **Skill Invocation Examples**
   - Add examples of key skill usage
   - Add orchestration skill references
   - Add troubleshooting with /recommend-skills

**Tasks:**

1. **Update Roma (Orchestrator)** (1 day)
   - AORDL workflow orchestration
   - Phase transition with AORDL awareness
   - Skills recommendation for all phases
   - Quality gate coordination

2. **Update PMA (Design)** (1 day)
   - AORDL-derived requirements consumption
   - P3 skills integration (19 skills)
   - /execute-p3-design orchestration
   - GATE-P3 preparation

3. **Update Sarah (Auditor)** (1 day)
   - GATE-P1 AORDL validation procedures
   - GATE-P2 AORDL-to-analysis validation
   - Updated audit criteria for all gates
   - AORDL traceability validation

4. **Update Charlie, Reena, Lucien** (1 day)
   - P4/P5 skills awareness
   - AORDL traceability understanding
   - Skills auto-discovery for tasks
   - Life-cycle references

5. **Update Clara (UX)** (1 day)
   - AORDL requirements awareness
   - P3 design skills for UX
   - Life-cycle references

**Effort:** 1 week (5 days)

### Week 3: Framework Documentation (5 days)

**Tasks:**

1. **Generate Skills Documentation** (1 day)
   - Run /generate-skills-documentation
   - Generate docs for all 79 skills (75 + 4 new)
   - Create phase-specific skill guides
   - Create skill quick reference

   **Deliverable:** /ROME/docs/skills/ documentation

2. **Update Framework Core Docs** (2 days)
   - Update core-principles.md (reference AORDL)
   - Update methodology-overview.md
   - Update getting-started.md
   - Create AORDL migration guide

   **Deliverable:** Updated framework foundation docs

3. **Create Integration Examples** (1 day)
   - Create sample AORDL requirements
   - Create sample P01→P02 workflow
   - Create sample skill usage examples
   - Create troubleshooting guide

   **Deliverable:** /ROME/examples/ directory

4. **Update Proposal Documentation** (1 day)
   - Mark ROME-PROP-009 (AORDL) as IMPLEMENTED
   - Mark ROME-PROP-012 (Skills Auto-Discovery) as IMPLEMENTED
   - Mark ROME-PROP-013 (This plan) as IMPLEMENTED
   - Create implementation notes

   **Deliverable:** Updated proposal statuses

**Effort:** 1 week (5 days)

### Phase 3 Deliverables

| Deliverable | Type | Count |
|-------------|------|-------|
| Updated life-cycle P03-P05 | Phase Specs | 3 files |
| Updated robot CLAUDE.md | Robot Specs | 7 files |
| Skills documentation | Documentation | 79 skill docs |
| Framework core docs | Documentation | 4 files |
| Integration examples | Examples | 5+ examples |
| Updated proposals | Meta | 3 proposals |

### Phase 3 Success Criteria

- [ ] All phase life-cycle guidelines updated
- [ ] All 8 robot CLAUDE.md files updated
- [ ] Skills documentation generated
- [ ] Framework docs reflect AORDL + Skills
- [ ] Examples demonstrate integrated workflow
- [ ] All updates committed to git

---

## Phase 4: Validation (1 week)

### Objective

Validate integrated AORDL + Skills workflow through comprehensive testing.

### Tasks

**Day 1-2: End-to-End Workflow Test**

1. **Create Test Project** (0.5 day)
   - Initialize new ROME project
   - Use ignite-rome.sh
   - Verify folder structure
   - Initialize activity log

2. **Execute P01-AORDL** (0.5 day)
   - Launch Talib robot
   - Create 5 sample AORDL requirements
   - Use /validate-aordl on each
   - Test GATE-P1 validation
   - Verify handover to P02

3. **Execute P02-Analysis** (0.5 day)
   - Launch Talib for P02
   - Use /execute-p2-analysis
   - Verify AORDL consumption
   - Test skills auto-discovery
   - Test GATE-P2 validation

4. **Execute P03-Design** (0.5 day)
   - Launch PMA robot
   - Use /execute-p3-design
   - Test skill recommendations
   - Verify analysis artifact consumption
   - Test GATE-P3 validation

**Day 3: Integration Testing**

5. **Test Skills Auto-Discovery** (1 day)
   - Test /list-skills across all phases
   - Test /recommend-skills with various tasks
   - Test /explain-skill for key skills
   - Test /generate-skills-documentation
   - Verify skill manifest accuracy

**Day 4: Documentation Review**

6. **Review All Documentation** (1 day)
   - Verify life-cycle guidelines accuracy
   - Verify robot CLAUDE.md correctness
   - Verify skills documentation completeness
   - Check for broken references
   - Check for methodology consistency

**Day 5: Bug Fixes and Finalization**

7. **Address Issues** (1 day)
   - Fix any bugs found in testing
   - Update documentation errors
   - Refine skill recommendations
   - Polish examples
   - Final git commit

**Effort:** 1 week (5 days)

### Phase 4 Deliverables

| Deliverable | Type | Description |
|-------------|------|-------------|
| Test project | Example | Complete P01→P03 test project |
| Test results | Validation | Comprehensive test report |
| Bug fixes | Code | Fixes for discovered issues |
| Final documentation | Documentation | Polished and validated |
| Release notes | Meta | Summary of changes |

### Phase 4 Success Criteria

- [ ] End-to-end P01→P03 workflow successful
- [ ] All skills auto-discovery features working
- [ ] All documentation accurate and complete
- [ ] No critical bugs remaining
- [ ] Test project demonstrates full workflow
- [ ] Ready for production use

---

## Effort Summary

### By Phase

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| Phase 1: Foundation | 2 weeks | AORDL spec + Skills auto-discovery |
| Phase 2: Core Integration | 2 weeks | P01-P02 life-cycle + Talib robot |
| Phase 3: Full Integration | 3 weeks | P03-P05 life-cycle + All robots |
| Phase 4: Validation | 1 week | Testing + Documentation |
| **Total** | **8 weeks** | **Fully integrated framework** |

### By Work Type

| Work Type | Effort | Percentage |
|-----------|--------|------------|
| AORDL Integration | 2.5 weeks | 31% |
| Skills Auto-Discovery | 1 week | 13% |
| Life-Cycle Updates | 2 weeks | 25% |
| Robot CLAUDE.md Updates | 1.5 weeks | 19% |
| Documentation | 0.5 weeks | 6% |
| Testing/Validation | 0.5 weeks | 6% |
| **Total** | **8 weeks** | **100%** |

### By Priority

| Priority | Scope | Duration | Rationale |
|----------|-------|----------|-----------|
| Critical Path | P01-AORDL + Talib | 4 weeks | Enables AORDL requirements |
| High Priority | P02-P03 + PMA/Sarah | 2 weeks | Completes design workflow |
| Medium Priority | P04-P05 + Other robots | 1.5 weeks | Completes implementation |
| Low Priority | Documentation + Examples | 0.5 weeks | Polish and usability |

---

## Risk Assessment

### High Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **AORDL format breaks P2 skills** | Critical | Medium | Test P2 skills with AORDL inputs in Phase 2 |
| **Robot CLAUDE.md too complex** | High | Low | Incremental updates, test each robot |
| **Skills auto-discovery performance** | Medium | Low | Optimize SkillRegistry caching |
| **GATE-P1 criteria too strict** | Medium | Medium | Implement GUIDED mode for flexibility |

### Medium Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Breaking changes to existing projects** | High | Low | Maintain backward compatibility flag |
| **Documentation inconsistency** | Medium | Medium | Systematic review in Phase 4 |
| **Missing edge cases** | Medium | Medium | Comprehensive testing in Phase 4 |

### Mitigation Strategies

1. **Early Testing**: Test critical paths (P01→P02) in Phase 2
2. **Incremental Updates**: Update one component at a time
3. **Rollback Plan**: Git tags at each phase completion
4. **Backward Compatibility**: Support both old and new methodology during transition
5. **Comprehensive Documentation**: Clear migration guide for users

---

## Success Metrics

### Phase Completion Metrics

| Phase | Success Metric |
|-------|---------------|
| Phase 1 | AORDL spec + 4 auto-discovery skills implemented |
| Phase 2 | Talib creates valid AORDL requirements |
| Phase 3 | All 8 robots updated and tested |
| Phase 4 | End-to-end workflow validated |

### Quality Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **AORDL Coverage** | 100% of P01 requirements | All requirements in AORDL format |
| **Skills Awareness** | 100% of robots | All CLAUDE.md reference skills |
| **Documentation Accuracy** | 0 broken links | Automated link checking |
| **Test Coverage** | P01→P03 validated | Successful test project |
| **Migration Readiness** | Complete guide | Migration documentation exists |

### Business Metrics

| Metric | Target | Impact |
|--------|--------|--------|
| **Time to AORDL Adoption** | < 4 weeks | Critical path complete |
| **Robot Skill Utilization** | 75 skills available | Robots can discover/use all skills |
| **Framework Consistency** | All phases aligned | Single methodology throughout |
| **User Onboarding** | Clear documentation | Examples and guides available |

---

## Implementation Dependencies

### External Dependencies

- None (all work self-contained within ROME framework)

### Internal Dependencies

```
Phase 1 (Foundation)
├── AORDL Phase Spec → Phase 2 (P01 Life-cycle)
└── Skills Auto-Discovery → Phase 2 (Talib Robot)

Phase 2 (Core Integration)
├── P01 Life-cycle → Phase 3 (P02-P05 Life-cycle)
└── Talib Robot → Phase 3 (Other Robots)

Phase 3 (Full Integration)
├── P03-P05 Life-cycle → Phase 4 (Testing)
└── All Robots → Phase 4 (Validation)

Phase 4 (Validation)
└── All previous phases → Production Release
```

---

## Migration Strategy

### For Existing Projects

**Option 1: Hard Migration (Recommended)**
- All new projects use AORDL from start
- Existing projects can continue with old methodology
- No backward compatibility needed

**Option 2: Soft Migration (If needed)**
- Support both methodologies temporarily
- Add methodology flag to .rome-project.json
- Robots detect and adapt to methodology
- Deprecate old methodology after 6 months

### Migration Guide Topics

1. **AORDL Requirement Creation**
   - How to transform existing PRDs to AORDL
   - Using /validate-aordl
   - AORDL best practices

2. **Skills Discovery**
   - How to find relevant skills
   - When to use /recommend-skills
   - Skill invocation patterns

3. **Quality Gates**
   - New GATE-P1 validation
   - Updated GATE-P2 criteria
   - AORDL traceability requirements

---

## Rollout Plan

### Pre-Rollout (Before Phase 1)

- [ ] User approval of this implementation plan
- [ ] Backup current ROME framework state
- [ ] Create feature branch: `aordl-skills-integration`
- [ ] Set up testing environment

### During Implementation (Phases 1-4)

- [ ] Weekly progress updates
- [ ] Phase completion reviews
- [ ] Incremental git commits
- [ ] Continuous testing

### Post-Rollout (After Phase 4)

- [ ] Merge feature branch to main
- [ ] Tag release: `v2.0-aordl-skills`
- [ ] Publish migration guide
- [ ] User training (if needed)
- [ ] Monitor adoption

---

## Next Steps

### Immediate Actions

1. **User Decision**: Approve this implementation plan
2. **Prepare Environment**: Create feature branch and backups
3. **Begin Phase 1**: Start AORDL spec and skills auto-discovery
4. **Schedule Reviews**: Weekly check-ins for progress

### Questions for User

1. **Timeline**: Is 8-week timeline acceptable?
2. **Scope**: Any additions/removals from plan?
3. **Priority**: Should any phases be reordered?
4. **Migration**: Hard or soft migration for existing projects?
5. **Testing**: Any specific test scenarios to include?

---

## Appendix A: File Modification List

### Files to Create (New)

| File | Phase | Purpose |
|------|-------|---------|
| /ROME/life-cycle/P01-aordl/operations-guidelines.md | 1 | AORDL phase spec |
| /ROME/skills/tier-1/list-skills.js | 1 | Skills listing |
| /ROME/skills/tier-1/recommend-skills.js | 1 | Skills recommendation |
| /ROME/skills/tier-1/generate-skills-documentation.js | 1 | Doc generation |
| /ROME/skills/tier-1/explain-skill.js | 1 | Skill explanation |
| /ROME/skills/registry/*.yaml | 1 | Manifests for 4 new skills |

### Files to Update (Existing)

| File | Phase | Change Type |
|------|-------|-------------|
| /ROME/life-cycle/P02-analysis/operations-guidelines.md | 2 | AORDL inputs |
| /ROME/life-cycle/P03-design/operations-guidelines.md | 3 | Skills references |
| /ROME/life-cycle/P04-config/operations-guidelines.md | 3 | Skills references |
| /ROME/life-cycle/P05-generation/operations-guidelines.md | 3 | Skills references |
| /ROME/life-cycle/cross-phase-procedures/quality-gate-protocol.md | 2 | GATE-P1, GATE-P2 |
| /ROME/robots/talib/CLAUDE.md | 2 | AORDL + Skills |
| /ROME/robots/roma/CLAUDE.md | 3 | AORDL + Skills |
| /ROME/robots/pma/CLAUDE.md | 3 | AORDL + Skills |
| /ROME/robots/sarah/CLAUDE.md | 3 | AORDL gates |
| /ROME/robots/charlie/CLAUDE.md | 3 | Skills awareness |
| /ROME/robots/reena/CLAUDE.md | 3 | Skills awareness |
| /ROME/robots/lucien/CLAUDE.md | 3 | Skills awareness |
| /ROME/robots/clara/CLAUDE.md | 3 | Skills awareness |
| /ROME/skills/lib/SkillRegistry.js | 1 | Discovery methods |

### Files to Remove (Deprecated)

| File | Phase | Replacement |
|------|-------|-------------|
| /ROME/life-cycle/P01-ingest/operations-guidelines.md | 2 | P01-aordl/operations-guidelines.md |

**Total Files Modified:** 19 files updated, 6 created, 1 removed = 26 file operations

---

## Appendix B: Detailed Task Checklist

### Phase 1 Tasks (14 tasks)

**AORDL Specification:**
- [ ] 1.1: Create P01-AORDL operations-guidelines.md
- [ ] 1.2: Define AORDL entry/exit criteria
- [ ] 1.3: Create AORDL artifact schemas
- [ ] 1.4: Define GATE-P1 validation criteria
- [ ] 1.5: Enhance /validate-aordl skill
- [ ] 1.6: Update /transform-aordl-to-bdd skill
- [ ] 1.7: Create /create-aordl-requirement skill

**Skills Auto-Discovery:**
- [ ] 1.8: Enhance SkillRegistry.js
- [ ] 1.9: Implement /list-skills
- [ ] 1.10: Implement /recommend-skills
- [ ] 1.11: Implement /generate-skills-documentation
- [ ] 1.12: Implement /explain-skill
- [ ] 1.13: Create manifests for 4 new skills
- [ ] 1.14: Test all auto-discovery features

### Phase 2 Tasks (11 tasks)

**Life-Cycle P01-P02:**
- [ ] 2.1: Replace P01-ingest with P01-aordl
- [ ] 2.2: Update P02 entry criteria for AORDL
- [ ] 2.3: Add P2 skills references to P02 guidelines
- [ ] 2.4: Update GATE-P1 in quality-gate-protocol.md
- [ ] 2.5: Update GATE-P2 in quality-gate-protocol.md
- [ ] 2.6: Test P01→P02 workflow with samples

**Talib Robot:**
- [ ] 2.7: Update Talib CLAUDE.md for AORDL
- [ ] 2.8: Add skills auto-discovery to Talib
- [ ] 2.9: Add life-cycle references to Talib
- [ ] 2.10: Test Talib AORDL workflow
- [ ] 2.11: Validate Talib P01→P02 handover

### Phase 3 Tasks (20 tasks)

**Life-Cycle P03-P05:**
- [ ] 3.1: Add skills references to P03-design
- [ ] 3.2: Add skills references to P04-config
- [ ] 3.3: Add skills references to P05-generation
- [ ] 3.4: Update GATE-P3, GATE-P4, GATE-P5

**Robot Updates:**
- [ ] 3.5: Update Roma CLAUDE.md
- [ ] 3.6: Update PMA CLAUDE.md
- [ ] 3.7: Update Sarah CLAUDE.md
- [ ] 3.8: Update Charlie CLAUDE.md
- [ ] 3.9: Update Reena CLAUDE.md
- [ ] 3.10: Update Lucien CLAUDE.md
- [ ] 3.11: Update Clara CLAUDE.md
- [ ] 3.12: Test all robot updates

**Documentation:**
- [ ] 3.13: Generate skills documentation
- [ ] 3.14: Update core-principles.md
- [ ] 3.15: Update methodology-overview.md
- [ ] 3.16: Update getting-started.md
- [ ] 3.17: Create AORDL migration guide
- [ ] 3.18: Create integration examples
- [ ] 3.19: Update proposal statuses
- [ ] 3.20: Review all documentation

### Phase 4 Tasks (8 tasks)

**Testing:**
- [ ] 4.1: Create test project
- [ ] 4.2: Execute P01-AORDL test
- [ ] 4.3: Execute P02-Analysis test
- [ ] 4.4: Execute P03-Design test
- [ ] 4.5: Test skills auto-discovery
- [ ] 4.6: Review all documentation
- [ ] 4.7: Fix discovered bugs
- [ ] 4.8: Final validation and release

**Total Tasks:** 53 tasks across 4 phases

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 1.0 | 2025-12-24 | Initial integrated implementation plan |
