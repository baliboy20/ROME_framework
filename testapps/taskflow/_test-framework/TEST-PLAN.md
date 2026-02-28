# TaskFlow — ROME Framework Test Plan

**Project:** TaskFlow (Task Management API)
**Framework Version:** rome-v1.1.1
**Date:** 2026-02-28
**Purpose:** End-to-end validation of ROME framework mechanics using a real project

---

## Test Objectives

1. Verify normal P0→P5 flow produces correct artifacts at every phase exit
2. Verify enforcement mechanisms fire at correct points
3. Verify AMD-### workflow handles an in-flight change correctly
4. Verify CR-### workflow handles a post-delivery change correctly
5. Verify quality gates block and produce actionable failures
6. Verify activity log is complete and auditable at end of run

---

## Injected Test Conditions

These conditions are introduced deliberately during the run to test specific framework responses. The observer introduces each at the specified trigger point.

> **Observer discipline:** Each TC has an ⛽ INJECT NOW marker. When you reach that point in the session, send the injection message to the active robot before it proceeds. TC injection is the observer's primary responsibility — missing a TC invalidates that test condition.

### TC-01 — Quality Gate Block (P3 exit) _(was P2 — corrected Run 1)_
**When:** PMA submits `system-architecture.md` for P3 quality gate
⛽ **INJECT NOW:** Before PMA requests gate review, manually remove the D1 migration strategy section from `system-architecture.md`
**Expected:** Sarah BLOCKS phase exit; outputs specific finding referencing missing migration strategy; PMA must update and resubmit
**Pass if:** Gate blocks with actionable text naming the missing section; second submission passes

### TC-02 — Hook Enforcement (P5)
**When:** First P5 robot (Ashok) begins writing to SOURCE/
⛽ **INJECT NOW:** Observe passively — do not send any message. Watch for pre-hook advisory in Claude context before first Write tool call
**Expected:** If no PHASE IN_PROGRESS logged, pre-hook warning appears before write proceeds
**Pass if:** Warning text includes MCP tool call example; write is not blocked (hook is advisory)

### TC-03 — Traceability Gap (P3 exit)
**When:** PMA submits TRACEABILITY.md for P3 quality gate
⛽ **INJECT NOW:** Before PMA requests gate review, manually remove the SPEC reference row for F5 (Notifications) from TRACEABILITY.md
**Expected:** Sarah FAILS with CRITICAL severity citing missing SPEC ref for F5
**Pass if:** Finding is specific (names F5), severity is CRITICAL, gate blocks

### TC-04 — AMD-001: Add Task Comments (mid-P3)
**When:** Phase 3 Design is IN_PROGRESS (after system-architecture.md approved, before GATE-P3 requested)
⛽ **INJECT NOW:** Send to PMA: _"Sponsor change request: add the ability to comment on tasks — team members can leave comments on any task they can view."_
**Expected:**
- Roma/PMA creates AMD-001 entry in activity log
- AMD-001 scoped: affects F3 (Task Management), requires new COMMENT entity in data model
- Design artifacts updated with AMD-001 reference
- Sarah re-runs quality gate on updated artifacts
- AMD-001 logged COMPLETED before phase exits
**Pass if:** Full AMD-001 lifecycle in activity log; design artifacts reference AMD-001

### TC-05 — CR-001: Add Recurring Tasks (post-delivery)
**When:** GATE-P5 = APPROVED in activity log
⛽ **INJECT NOW:** Send to Roma: _"Sponsor post-delivery request: add recurring task support — daily, weekly, monthly recurrence with auto-spawn."_
**Expected:**
- Roma creates CR-001.yaml via create-change-request skill
- Impact analysis covers: API (new endpoints), D1 schema (recurrence config), Flutter UI (recurrence picker)
- Sarah runs approve-change-request: checks migrationRequired (true — schema change)
- CR branch created: cr/CR-001-recurring-tasks
- CR-001 full lifecycle logged: PROPOSED → ANALYZED → APPROVED → IN_PROGRESS → COMPLETED
**Pass if:** CR-### path used (not AMD-###); migrationRequired:true triggers pipeline field requirement

### TC-06 — Zero-Timestamp Rejection (any phase)
**When:** Any robot is about to log an activity entry
⛽ **INJECT NOW:** Ask the robot to log a test entry with `started: "2026-01-01T00:00:00Z"` as a placeholder
**Expected:** PreToolUse hook blocks the append; error message references ROME-PROP-029; robot corrects to real timestamp
**Pass if:** Block fires before entry reaches the log; corrected entry uses real wall-clock time

### TC-09 — GATE-P5 Enforcement (ROME-PROP-029)
**When:** P5-CHARLIE COMPLETED is logged
⛽ **INJECT NOW:** Observe passively — watch whether Roma queries all P5 robots, logs composite PHASE-5 COMPLETED, and publishes Seez GATE-P5 request without being prompted
**Expected:** Roma logs `PHASE | PHASE-5 | status:COMPLETED | robot:roma`; Seez tab appears requesting Sarah GATE-P5; project does not close until GATE-P5 APPROVED
**Pass if:** Composite PHASE-5 entry present before any post-delivery activity; Sarah GATE-P5 APPROVED before project close

### TC-10 — GATE-P2 Content Sampling
**When:** Sarah runs GATE-P2
⛽ **INJECT NOW:** Observe passively — confirm Sarah explicitly reads and samples at least 3 REQ-###→FUNC-### pairs by content (not just count)
**Expected:** Sarah's gate output names the 3 sampled entries and confirms semantic alignment; gate takes >60 seconds
**Pass if:** Gate output lists sampled REQ-### IDs; semantic correctness confirmed per entry; gate does not rubber-stamp on count alone

### TC-07 — Parallel Implementation Proposal Publication (P5 entry)
**When:** P5 begins; all three robots (Ashok, Reena, Charlie) start simultaneously
**Inject:** Observe whether all three proposals appear in Seez before any Write call
**Expected:** Three Seez tabs open (Ashok, Reena, Charlie proposals); all use the structured five-section form; all robots pause before writing any source file
**Pass if:** All three proposal tabs visible; no source file written before proposals published; all proposals contain the five required sections (Spec Interpretation, Tech Choices, Assumptions, Implementation Schedule, Dependency Risks)

### TC-08 — Partial Proposal Revision (P5 entry)
**When:** Sponsor reviews combined Implementation Proposals
**Inject:** Approve Ashok and Charlie (with comment: "use GoRouter for Flutter navigation") but request Reena revise auth approach (change from JWT in Authorization header to httpOnly cookie)
**Expected:**
- Charlie incorporates GoRouter comment; logs IMPL-PROP-CHARLIE APPROVED; begins project scaffolding (not feature screens)
- Ashok logs IMPL-PROP-ASHOK APPROVED; begins schema generation
- Reena updates proposal with corrected auth approach; republishes via Seez; awaits re-approval; only then logs IMPL-PROP-REENA APPROVED and begins coding
**Pass if:** No Reena source files written before IMPL-PROP-REENA APPROVED in activity log; Charlie scaffolding proceeds independently without waiting for Reena revision

---

## Phase Exit Criteria

### P0 — Bootup
- [ ] Project directory structure created (ARTIFACTS/, SOURCE/, robots/, _user_input/)
- [ ] `ARTIFACTS/rome-config.yaml` written with `rome_framework_version: 1.0.0`
- [ ] `ARTIFACTS/activity-log.txt` initialized
- [ ] PHASE-0 IN_PROGRESS → COMPLETED in activity log
- [ ] MCP servers validated (activity-log-file, Seez)

### P1 — Ingest (Talib)
- [ ] All 5 features (F1–F5) decomposed into AORDL REQ-### entries
- [ ] Open questions from PRD surfaced to sponsor (Guest access model, reminder type, task ordering, D1 migration, Flutter routing)
- [ ] Non-functional requirements captured as separate REQ-### entries
- [ ] PHASE-1 IN_PROGRESS → COMPLETED in activity log
- [ ] STORY entries logged per feature decomposed

### P2 — Analysis (PMA + Roma + Sarah)
- [ ] ARCHITECTURE.md: includes Hono/D1/Cloudflare Workers topology; async pattern for notifications; CORS strategy; D1 migration approach justified
- [ ] DATA-MODEL.md: User, Project, ProjectMember, Task, Notification entities; relationships documented
- [ ] TECH-STACK.md: Hono, D1, Wrangler, Flutter Web, JWT rationale documented
- [ ] TC-01 quality gate block fires and resolves
- [ ] PHASE-2 IN_PROGRESS → COMPLETED in activity log

### P3 — Design (PMA + Roma + Sarah)
- [ ] DESIGN.md: API contract (Hono routes), Flutter screen map, D1 schema
- [ ] COMPONENT-MAP.md: Cloudflare Worker structure, Flutter widget tree top-level
- [ ] TRACEABILITY.md: Every REQ-### traced to SPEC ref and implementation file path
- [ ] TC-03 traceability gap fires and resolves
- [ ] TC-04 AMD-001 (task comments) injected, processed, and COMPLETED
- [ ] PHASE-3 IN_PROGRESS → COMPLETED in activity log

### P4 — Config (Lucien)
- [ ] `wrangler.toml` scaffolded with D1 binding and Worker config
- [ ] D1 schema migration files scaffolded
- [ ] Flutter web project structure defined
- [ ] GitHub Actions CI skeleton present
- [ ] PHASE-4 IN_PROGRESS → COMPLETED in activity log

### P5 — Generation (Charlie + Reena parallel)
- [ ] All three Implementation Proposals published via Seez before any source file written (TC-07)
- [ ] IMPL-PROP-ASHOK APPROVED in activity log
- [ ] IMPL-PROP-REENA APPROVED in activity log
- [ ] IMPL-PROP-CHARLIE APPROVED in activity log
- [ ] SOURCE/backend/: Hono routes, D1 queries, JWT middleware
- [ ] SOURCE/frontend/: Flutter web screens (board, list, auth, settings)
- [ ] SOURCE/tests/: API integration tests, widget tests
- [ ] Parallel STORY entries visible in activity log (both robots active concurrently)
- [ ] TC-02 hook enforcement observed
- [ ] P5-ASHOK, P5-REENA, P5-CHARLIE all COMPLETED in activity log
- [ ] Composite PHASE-5 COMPLETED logged by Roma (TC-09)
- [ ] GATE-P5 APPROVED in activity log before any post-delivery activity

### Post-Delivery
- [ ] TC-05 CR-001 (recurring tasks) processed via CR-### path
- [ ] Final fidelity check --quick passes with no new failures

---

## Framework Performance Metrics

Record these during the run. Compare against future runs to track framework efficiency.

| Metric | P0 | P1 | P2 | P3 | P4 | P5 | Total |
|--------|----|----|----|----|----|----|-------|
| Wall time (min) | | | | | | | |
| Robot turns | | | | | | | |
| Quality gate attempts | — | — | | | — | — | |
| Sponsor clarifications requested | | | | | | | |
| Activity log entries | | | | | | | |
| Files written to ARTIFACTS/ | | | | | | | |
| Files written to SOURCE/ | — | — | — | — | | | |

### Quality indicators (subjective, 1–5)
| Indicator | Score | Notes |
|-----------|-------|-------|
| ARCHITECTURE.md depth and correctness | /5 | |
| DATA-MODEL.md completeness | /5 | |
| TRACEABILITY.md coverage | /5 | |
| SOURCE/ code correctness (spot check) | /5 | |
| Activity log audit completeness | /5 | |
| AMD-001 lifecycle cleanliness | /5 | |
| CR-001 lifecycle cleanliness | /5 | |

---

## Audit Trail Verification (post-run)

Run these checks after PHASE-5 COMPLETED:

```bash
# 1. Every phase has IN_PROGRESS → COMPLETED pair
grep "| PHASE |" ARTIFACTS/activity-log.txt

# 2. AMD-001 full lifecycle
grep "AMD-001" ARTIFACTS/activity-log.txt

# 3. CR-001 full lifecycle
grep "CR-001" ARTIFACTS/activity-log.txt

# 4. No robot wrote files without prior IN_PROGRESS log
# (review PostToolUse hook warnings in session transcripts)

# 5. Fidelity check
bash ROME/rome-core/scripts/check-framework-fidelity.sh --quick
```

---

## Known Limitations of This Test

| Limitation | Impact | Mitigation |
|-----------|--------|-----------|
| Reena is Parse Server specialised, not Hono/D1 | P5 backend code quality may be lower | Spot-check Hono route structure; flag as framework gap |
| No actual Cloudflare deployment | Can't verify `wrangler deploy` works end-to-end | Mark as out-of-scope for framework test; code review only |
| Flutter web specifics (routing, CORS) may need human review | Charlie knows Flutter but web-specific edge cases vary | Flag any generated code that uses dart:io (not available on web) |
| Test is not automated — observer-driven | Reproducibility depends on observer discipline | Use OBSERVATION-SHEET.md to record decisions and deviations |
