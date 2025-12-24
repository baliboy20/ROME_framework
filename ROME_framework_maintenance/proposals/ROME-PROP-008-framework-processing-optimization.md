# Proposal: Framework Processing Speed Optimization

| Field | Value |
|-------|-------|
| **Document UID** | ROME-PROP-008 |
| **Version** | 0.2 |
| **Date** | 2025-12-19T16:30:00Z |
| **Status** | Proposal |
| **Document Type** | Proposal |
| **Author** | Framework Analyst & Architect |
| **Proposed By** | Technical Architect / Prompt Engineer Review |

---

## Executive Summary

**Proposal:** 10 targeted optimizations to reduce framework processing latency and token consumption while maintaining quality, traceability, and compliance.

**Current State:** Framework exhibits processing inefficiencies from verbose documentation, sequential operations, redundant verification patterns, and mixed state access strategies.

**Proposed Solution:** Systematic refactoring across documentation structure, MCP interaction patterns, state access, and robot initialization to achieve 2.5-3x processing speedup with 45-55% token reduction.

**Assessment:** HIGH VALUE, MEDIUM EFFORT - Measurable performance gains without compromising framework integrity.

**Risk Level:** LOW - All optimizations preserve traceability, validation, and audit capability through git history and event log.

---

## Problem Statement

### Performance Issues

**Current Framework Behavior:**
- Robot context loading time excessive (multiple doc chain-loading)
- MCP verification after every update adds network latency
- Sequential phase transitions create idle time
- Verbose documentation consumes tokens without proportional value

**Reported Impacts:**
1. **Slow Robot Initialization**: Loading dependency chains (CLAUDE.md → governance docs → lexicon)
2. **Network Overhead**: Verification MCP calls after every state update
3. **Token Waste**: Revision histories, verbose procedures, repeated governance boilerplate
4. **Sequential Bottlenecks**: Phase transitions wait for synchronous gate approvals
5. **Mixed State Access**: Some queries use MCP, others YAML - no consistent pattern

### Alignment with ROME Objectives

**ROME-PRIN-001 Principle 2 (LLM Optimization):**
> All output must be terse, high-signal, and optimized for interpretation by Large Language Models. Avoid conversational filler, decorative prose, or superfluous text.

**Current Violations:**
- ❌ Verbose procedural prose (vs. executable pseudocode)
- ❌ Revision histories in active documents (git duplicates this)
- ❌ Repeated governance boilerplate across robot definitions
- ❌ 241-line lexicon with narrative definitions (vs. tabular format)

**ROME-PRIN-001 Principle 10 (Operational Resilience):**
> Framework must maintain operational integrity and support recovery under failure conditions.

**Current State:**
- ✓ Verification after updates provides safety
- ⚠️ Over-verification adds latency without preventing failures
- ⚠️ File append operations are atomic, making most verifications redundant

---

## Proposed Solution

### 1. Document Consolidation

**Target:** Robot CLAUDE.md files (800+ lines each with repeated boilerplate)

**Current Structure:**
```markdown
# Robot CLAUDE.md
- Metadata table: 50 lines
- Dependencies list: 20 lines
- Governance boilerplate: 150 lines (REPEATED across all robots)
- Role definition: 200 lines
- Procedures: 300 lines
- MCP reference: 80 lines
- Revision history: 30 lines
```

**Optimized Structure:**
```markdown
# Robot CLAUDE.md
Document UID: ROME-ROBOT-[###]
Dependencies: ROME-GOV-BASELINE (consolidated governance)

## Role Context
[Robot name, phase, authority - 30 lines]

## Constraints
Permitted: [bulleted list]
Prohibited: [bulleted list]

## Procedures
[Phase-specific only - executable format]

## MCP Tools
[Tool signatures only, reference full docs]
```

**Token Reduction:** ~40% per robot definition (800 → 480 lines average)

**Implementation:**
- Create `ROME-GOV-BASELINE.md` consolidating governance rules
- Refactor all robot CLAUDE.md files to reference baseline
- Move MCP tool documentation to separate reference doc

**Traceability Preserved:** Git history maintains full evolution, UIDs track dependencies

---

### 2. Event Log Verification Pattern Optimization

**Current System:** Text-based append-only event log via `activity-log-file` MCP server
- Events appended to `ARTIFACTS/activity-log.txt`
- State auto-generated to `ARTIFACTS/activity-state.yaml`
- File system operations (not database)

**Current Pattern:**
```javascript
// 2 MCP calls per update
mcp__activity-log__append({type, id, attributes})
mcp__activity-log__rebuild_state()  // rebuild state index
mcp__activity-log__query({id: id})  // verification read
```

**Problem:** File append operations are atomic and synchronous. Verification adds MCP round-trip without preventing failure. State rebuilds are automatic on append.

**Optimized Pattern:**
```javascript
// Trust-verify at gates only
mcp__activity-log__append({type, id, attributes})
// State automatically rebuilt
// No immediate verification read

// Verify only at phase gates
if (PHASE_GATE):
  verify_state_integrity()  // comprehensive check
  verify_event_log_consistency()
```

**Rationale:**
- File append operations are atomic and fail-fast
- MCP server handles state rebuild automatically
- Failures surface immediately (tool returns error)
- Gate-level verification catches corruption before phase transitions
- State consistency enforced at critical boundaries

**Latency Reduction:** 50% on activity log interactions (eliminates verification reads)

**Safety Preserved:** Phase gates enforce comprehensive integrity checks before critical transitions

---

### 3. State Access Standardization

**Current Mixed Pattern:**
- Some robots read `activity-state.yaml` directly
- Some robots query via MCP
- No documented standard

**Optimized Standard:**

| Operation | Method | Rationale |
|-----------|--------|-----------|
| Monitoring (Roma) | Read YAML | 10x faster, local file |
| Mutations (all robots) | MCP append | Maintains event log integrity |
| Historical queries | MCP query | Access full event history |
| Real-time status | Read YAML | Fastest path for coordination |

**Implementation:**
- Document standard in ROME-PROC-005 (Activity Logging Protocol)
- Update Roma monitoring procedures
- Refactor robot CLAUDEs to reference standard

**Performance Gain:** 10x faster state reads for monitoring (eliminates network round-trips)

---

### 4. Parallel Robot Initialization

**Current Sequential Pattern:**
```
P1 complete → Sarah gate → Roma reads decision → Notify Talib → P2 starts
Latency: Gate review + notification + context loading
```

**Optimized Predictive Pattern:**
```
P1 at 80% → Roma pre-loads P2 robot context (background)
P1 complete → Sarah gate → Decision available
Gate APPROVE → P2 starts immediately (context cached)
```

**Implementation:**
- Roma monitors phase completion percentage
- At 80% threshold, spawns background task to pre-load next robot context
- Context includes: Phase guidelines, handover doc, relevant framework docs
- Cache invalidated if gate REJECTS

**Latency Reduction:** Eliminates post-gate context loading wait

**Risk:** Pre-loading effort wasted if gate rejects (acceptable - gates rarely reject)

---

### 5. Lexicon Compression

**Current Format:** Narrative definitions (241 lines)
```markdown
**Robot**
- Autonomous Claude Code session executing specific tasks within defined operational boundaries
- Characteristics: task-assigned, role-defined, centrally coordinated, rule-constrained
- Scope: Individual agent instance performing framework work
```

**Optimized Format:** Tabular (95 lines)
```markdown
| Term | Definition | Scope |
|------|------------|-------|
| Robot | Autonomous Claude Code session, task-assigned, role-defined | Agent instance |
| Phase | Transformation stage with entry/exit criteria | Process division |
| Quality Gate | Validation checkpoint guarding phase transitions | Boundary control |
```

**Token Reduction:** 60% (241 → 95 lines)

**Implementation:**
- Refactor `ROME/foundation/lexicon.md`
- Update references in dependent documents
- Maintain full semantic content (definitions not simplified, only format changed)

---

### 6. Revision Log Elimination from Active Docs

**Current Practice:** Every document includes revision history table
```markdown
## Revision History
| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 1.0 | 2025-11-20T00:00:00Z | Initial document creation |
| 1.1 | 2025-11-24T00:00:00Z | Added Database Discovery section |
```

**Problem:** Git already provides complete revision history with full diffs

**Optimized Practice:**
- Remove revision history sections from all documents
- Revisions tracked exclusively in git commit history
- Generate revision summaries on-demand for audits via git log parsing

**Token Reduction:** 15% average per document

**Traceability Preserved:** Git provides superior traceability (full diffs vs. summary table)

**Exception:** Published external-facing docs may retain revision tables for audiences without git access

---

### 7. Cross-Robot Coordination via Shared State

**Current Pattern:** Roma mediates all coordination
```
Reena encounters blocker
  → Appends event to activity-log.txt (via MCP)
  → State auto-rebuilt to activity-state.yaml
  → Roma polls activity-state.yaml
  → Roma reads blocker
  → Roma notifies Ashok
  → Ashok queries MCP or reads YAML for blocker details
```

**Optimized Pattern:** Direct state polling + event log
```
Reena encounters blocker
  → Appends event to activity-log.txt (via MCP)
  → State auto-rebuilt to activity-state.yaml
Ashok polls dependencies
  → Reads activity-state.yaml directly (no MCP call)
  → Detects blocker affecting dependencies
  → Self-coordinates response
  → Roma observes via monitoring (intervention only if needed)
```

**Implementation:**
- Robots poll `activity-state.yaml` for dependencies (local file read, zero latency)
- Roma escalates only CRITICAL blockers requiring sponsor interaction
- Event log (`activity-log.txt`) maintains complete audit trail
- All coordination visible in state file (Roma monitors)

**Latency Reduction:** Eliminates Roma bottleneck for routine coordination (file read vs. MCP query)

**Safety:** Roma still monitors all activity via periodic state reads, intervenes on exceptions

---

### 8. Executable Procedure Format

**Current Format:** Procedural prose
```markdown
Before beginning work, query for existing entry using find_by_id.
If the entry exists and status is PENDING, update the status to IN_PROGRESS
and set the startDate to the current timestamp. Then begin implementation work.
```

**Optimized Format:** Executable pseudocode
```javascript
BEFORE_WORK:
  entry = mcp__activity-log__query({id: work_id})
  if entry.status == PENDING:
    mcp__activity-log__append({
      type: "STATUS_UPDATE",
      id: work_id,
      attributes: {status: IN_PROGRESS, start: NOW}
    })
  START_IMPLEMENTATION
```

**Benefits:**
- Fewer tokens (30% reduction in procedure sections)
- Clearer semantics for LLM interpretation
- Reduces ambiguity (executable vs. narrative)

**Implementation:**
- Refactor procedures in phase operations guidelines
- Refactor robot CLAUDE.md procedure sections
- Establish pseudocode standard in `ROME-GOV-001` (Document Standards)

---

### 9. Compiled Robot Context

**Current Runtime Pattern:**
```
Robot starts
  → Reads CLAUDE.md
  → Parses dependencies
  → Loads ROME-PROC-005
    → ROME-PROC-005 references ROME-PRIN-001
      → Loads ROME-PRIN-001
  → Loads ROME-LEX-001
  → Loads phase guidelines
```

**Optimized Build-Time Pattern:**
```bash
# Build script (executed before robot spawns)
./build-robot-context.sh roma

# Generates: roma-COMPILED.md
# Contains: All dependencies inlined with minimal redundancy
```

**Generated Structure:**
```markdown
# Roma Robot Context (COMPILED)
# Auto-generated: 2025-12-19T10:00:00Z
# Source: ROME-ROBOT-004 + dependencies

## Core Principles (from ROME-PRIN-001)
[Inlined relevant principles only]

## Lexicon (from ROME-LEX-001)
[Terms used in Roma operations only]

## Procedures (from ROME-PROC-005)
[Activity logging patterns]

## Role Definition
[Roma-specific instructions]
```

**Benefits:**
- Single-file context (no chain-loading)
- Dependency-specific (only relevant content inlined)
- Pre-computed at build time (zero runtime overhead)

**Implementation Effort:** HIGH (requires build tooling)

**Recommendation:** Phase 2 optimization (after quick wins implemented)

---

### 10. Gate Decision Acceleration

**Current Pattern:** Full manual audit per gate
```
P2 complete → Roma triggers GATE-P2
  → Sarah starts
  → Sarah reads all phase outputs
  → Sarah validates requirements matrix
  → Sarah checks acceptance criteria
  → Sarah reviews user stories
  → Sarah logs decision
Total: 15-30 minutes human + LLM time
```

**Optimized Pattern:** Automated pre-checks + focused review
```javascript
// Automated (instant)
pre_checks = [
  check_exit_criteria(phase: 2),
  check_logging_compliance(),
  check_artifact_completeness(),
  check_blocker_resolution(),
  validate_yaml_schemas()
]

if ALL(pre_checks.passed):
  // Sarah reviews quality only
  sarah_review_requirements_quality()
else:
  GATE_BLOCKED(pre_checks.failures)
```

**Benefits:**
- Instant feedback on compliance violations (no human wait)
- Sarah focuses on quality assessment (not mechanical checks)
- Faster gate decisions (mechanical checks automated)

**Implementation:**
- Create gate pre-check automation script
- Update ROME-PROC-006 (Quality Gate Protocol)
- Update Sarah CLAUDE.md to reference automated pre-checks

**Latency Reduction:** 50% on gate reviews

---

## Implementation Roadmap

### Phase 1: Quick Wins (HIGH IMPACT, LOW EFFORT)

**Week 1:**
1. **State Access Standardization** (#3)
   - Document standard in ROME-PROC-005
   - Update Roma to use YAML reads for monitoring
   - Immediate 10x speedup on state reads

2. **Lexicon Compression** (#5)
   - Refactor lexicon to tabular format
   - 60% token reduction
   - Update dependent docs

3. **Revision Log Removal** (#6)
   - Remove revision tables from all docs
   - 15% average token reduction
   - Update ROME-GOV-001 to document practice

**Week 2:**
4. **Executable Procedure Format** (#8)
   - Establish pseudocode standard
   - Refactor 3 highest-traffic procedures
   - 30% token reduction in procedure sections

### Phase 2: High-Impact Optimizations (MEDIUM EFFORT)

**Week 3-4:**
5. **Document Consolidation** (#1)
   - Create ROME-GOV-BASELINE.md
   - Refactor all robot CLAUDEs
   - 40% token reduction per robot

6. **Event Log Verification Pattern** (#2)
   - Update ROME-PROC-005 logging protocol
   - Remove verification reads after appends
   - Implement comprehensive gate-level verification
   - 50% latency reduction on activity log ops

**Week 5:**
7. **Cross-Robot Coordination** (#7)
   - Update robot CLAUDEs for state polling
   - Update Roma for escalation-only intervention
   - Reduces coordination bottleneck

### Phase 3: Advanced Optimizations (HIGH EFFORT)

**Month 2:**
8. **Parallel Robot Initialization** (#4)
   - Implement pre-loading in Roma
   - Test gate rejection scenarios
   - Eliminates post-gate context loading

9. **Gate Decision Acceleration** (#10)
   - Develop pre-check automation scripts
   - Update Sarah procedures
   - 50% gate review speedup

**Future:**
10. **Compiled Robot Context** (#9)
    - Design build tooling
    - Implement compilation pipeline
    - Single-file context loading

---

## Expected Outcomes

### Performance Metrics

| Metric | Current | Phase 1 | Phase 2 | Phase 3 |
|--------|---------|---------|---------|---------|
| Robot context load time | 100% | 70% | 40% | 20% |
| Activity log query latency | 100% | 10% | 10% | 10% |
| Average token count/doc | 100% | 60% | 45% | 45% |
| Phase transition delay | 100% | 100% | 80% | 50% |
| Gate review time | 100% | 100% | 100% | 50% |

### Cumulative Impact

**After Phase 1 (Week 2):**
- Processing speed: 1.5x faster
- Token consumption: 40% reduction
- Effort: 2 weeks

**After Phase 2 (Week 5):**
- Processing speed: 2x faster
- Token consumption: 50% reduction
- Effort: 5 weeks

**After Phase 3 (Month 2+):**
- Processing speed: 2.5-3x faster
- Token consumption: 55% reduction
- Effort: 8-10 weeks

---

## Risk Assessment

### Low-Risk Optimizations
- ✓ Lexicon compression (#5) - Format change only
- ✓ Revision log removal (#6) - Git provides superior traceability
- ✓ Executable procedures (#8) - Semantic equivalent

### Medium-Risk Optimizations
- ⚠️ Document consolidation (#1) - Requires careful dependency management
- ⚠️ Event log verification removal (#2) - Gate-level verification must be robust
- ⚠️ State access standard (#3) - Requires consistent robot training

### Higher-Risk Optimizations
- ⚠️ Parallel initialization (#4) - Cache invalidation logic required
- ⚠️ Cross-robot coordination (#7) - Roma must still catch critical issues
- ⚠️ Compiled contexts (#9) - Build tooling dependency

### Mitigation Strategies

**For All Optimizations:**
- Implement incrementally (one at a time)
- Test with pilot robot before framework-wide rollout
- Maintain rollback capability (git revert)
- Monitor for regressions (processing time, error rates)

**Specific Mitigations:**
- **Event log verification (#2):** Implement comprehensive gate-level checks (state consistency, event log integrity) before removing inline verification
- **Parallel init (#4):** Test cache invalidation thoroughly, implement fallback to sequential if pre-load fails
- **Compiled contexts (#9):** Build tooling must handle dependency updates automatically

---

## Quality Preservation

### Traceability Maintained

**How:**
- Git history replaces revision logs (superior fidelity)
- Event log preserves all state transitions
- Gate-level verification catches corruption
- Audit capability unchanged

**Evidence:**
- Complete change history via `git log`
- Full event sequence in `activity-log.txt`
- State snapshots in `activity-state.yaml` (git-tracked)

### Validation Maintained

**How:**
- Gate pre-checks automate mechanical validation (more reliable than human)
- Sarah still reviews quality (human judgment)
- Exit criteria enforcement unchanged

**Evidence:**
- Pre-check scripts validate 100% of mechanical criteria
- Sarah gate reviews focus on quality assessment
- Phase transitions still require gate approval

### Compliance Maintained

**How:**
- Activity logging protocol unchanged (timing, events, triggers)
- Roma monitoring unchanged (still sees all robot activity)
- Escalation paths unchanged

**Evidence:**
- Same logging triggers (ROME-PROC-005 §4)
- Same compliance checks (ROME-PROC-005 §9)
- Same orchestrator authority (ROME-ROBOT-004)

---

## Success Criteria

### Quantitative Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Processing speed improvement | 2.5x | Time from phase start to gate approval |
| Token reduction | 50% | Average tokens consumed per robot operation |
| State query latency | 10x faster | Time to read activity state (direct YAML read vs. MCP query) |
| Gate review time | 50% reduction | Time from gate trigger to decision |
| Robot context load time | 60% reduction | Time from spawn to ready state |

### Qualitative Criteria

- [ ] No regression in traceability (git + event log complete)
- [ ] No regression in quality (gate approvals maintain standards)
- [ ] No increase in robot errors (validation maintains integrity)
- [ ] No increase in rework (requirements fidelity preserved)
- [ ] Improved developer experience (faster iterations)

---

## Alternative Approaches Considered

### Alternative 1: LLM Model Upgrade Only
**Approach:** Use faster/cheaper models (Haiku) for routine operations
**Rejected Because:** Doesn't address root cause (verbose docs, inefficient patterns)

### Alternative 2: Caching Layer
**Approach:** Cache document content in memory across robot sessions
**Rejected Because:** Doesn't reduce token consumption, adds complexity

### Alternative 3: Document Summarization
**Approach:** Auto-generate summaries of long documents for robot consumption
**Rejected Because:** Risks losing critical details, summarization accuracy issues

### Alternative 4: Parallel Phase Execution
**Approach:** Run multiple phases simultaneously (P2 + P3)
**Rejected Because:** Violates phase boundary integrity (P3 depends on P2 outputs)

---

## Dependencies

### Framework Documents Requiring Updates

| UID | Document | Change Type |
|-----|----------|-------------|
| ROME-GOV-001 | Document Standards | Add pseudocode format standard |
| ROME-PROC-005 | Activity Logging Protocol | Document state access standard, update verification pattern |
| ROME-PROC-006 | Quality Gate Protocol | Add pre-check automation |
| ROME-LEX-001 | Lexicon | Reformat to tabular structure |
| All ROME-ROBOT-* | Robot Definitions | Consolidate governance, refactor procedures |
| All ROME-PHASE-* | Phase Guidelines | Convert procedures to pseudocode |

### New Documents Required

| UID | Document | Purpose |
|-----|----------|---------|
| ROME-GOV-BASELINE | Governance Baseline | Consolidated governance for robot reference |
| ROME-TOOL-REF | MCP Tool Reference | Centralized MCP tool documentation |

---

## Approval Requirements

**Stakeholder Review:**
- Framework Analyst & Architect (Author)
- Sponsor (Performance impact assessment)
- Pilot robot testing (Roma or Talib)

**Approval Gates:**
- Phase 1 implementation: Framework Analyst approval
- Phase 2 implementation: Sponsor approval (impacts all robots)
- Phase 3 implementation: Sponsor approval (infrastructure changes)

**Pilot Testing:**
- Implement Phase 1 optimizations on single robot (Roma recommended)
- Monitor for 1 week
- Measure performance metrics
- Rollout framework-wide if successful

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 0.1 | 2025-12-19T00:00:00Z | Initial proposal draft |
| 0.2 | 2025-12-19T16:30:00Z | Updated to reflect text-based event log system (activity-log-file MCP) instead of MongoDB. Updated sections #2, #7, risk assessment, and metrics to reflect file-based append operations. |
