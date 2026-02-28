# PinNote — ROME Framework Regression Test Plan

**Project:** PinNote (Minimal Note-Taking App)
**Framework Version:** rome-v1.2.0
**Date:** 2026-02-28
**Purpose:** Regression test for mechanisms introduced in ROME v1.1.0–v1.2.0. Deliberately minimal scope (~1–1.5 hours) to verify new enforcement points fire correctly without re-running the full TaskFlow test.

---

## What This Test Covers

| Mechanism | PROP | TC |
|-----------|------|----|
| rome-config.yaml written at P0 with framework version | PROP-027 | TC-01 |
| GATE-P3 block on missing architecture detail | PROP-028 / Run 1 finding | TC-02 |
| Zero-timestamp rejection hook | PROP-029 | TC-03 |
| Implementation Proposal gate — parallel Seez proposals | PROP-028 | TC-04 |
| Charlie Widget & Screen Design Plan (Section 6) | PROP-028 v1.2 | TC-05 |
| Composite PHASE-5 COMPLETED by Roma | PROP-029 | TC-06 |
| GATE-P5 runs before project close | PROP-029 | TC-07 |
| GATE-P2 content sampling (≥3 REQ→FUNC pairs) | Run 1 finding | TC-08 |

---

## Test Conditions

> **Observer discipline:** Each TC has an ⛽ INJECT NOW marker. Send the injection message to the active robot at that exact point. Do not wait. Missing an injection invalidates that TC.

### TC-01 — rome-config.yaml at P0 (ROME-PROP-027)
**When:** P0 Bootup completes
⛽ **INJECT NOW:** None — observe passively
**Expected:** `ARTIFACTS/rome-config.yaml` present; contains `rome_framework_version` field matching `rome-core/VERSION`
**Pass if:** File exists; version field populated; not empty

### TC-02 — GATE-P3 Architecture Block
**When:** PMA requests P3 gate review
⛽ **INJECT NOW:** Before PMA submits for gate, manually remove the session expiry duration from `system-architecture.md` (delete the JWT expiry line from the authentication section)
**Expected:** Sarah BLOCKS with finding: authentication section incomplete — session expiry duration not specified
**Pass if:** Gate blocks with specific finding; PMA adds expiry duration; second submission passes

### TC-03 — Zero-Timestamp Rejection (ROME-PROP-029)
**When:** Any robot is about to log an activity entry (good moment: Talib logging P1 IN_PROGRESS)
⛽ **INJECT NOW:** Ask the active robot: _"Before you log that, can you test the timestamp validation by using `started: '2026-01-01T00:00:00Z'` as the value?"_
**Expected:** PreToolUse hook fires; append is BLOCKED; error message references placeholder timestamp and instructs robot to use `new Date().toISOString()`
**Pass if:** Block fires before entry reaches the log; robot corrects to real timestamp; corrected entry succeeds

### TC-04 — Parallel Implementation Proposals (ROME-PROP-028)
**When:** P5 begins; all three robots (Ashok, Reena, Charlie) are launched
⛽ **INJECT NOW:** Observe passively — confirm all three Seez proposal tabs appear before any Write call
**Expected:** Three Seez show_doc tabs open; all use the five-section structured form; all robots pause awaiting approval
**Pass if:** No source file written before all proposals visible; sponsor approves; IMPL-PROP-ASHOK, IMPL-PROP-REENA, IMPL-PROP-CHARLIE all logged APPROVED

### TC-05 — Charlie Widget & Screen Design Plan (ROME-PROP-028 v1.2)
**When:** Charlie publishes Implementation Proposal
⛽ **INJECT NOW:** None — observe passively; check Charlie's proposal Seez tab for Section 6
**Expected:** Charlie's proposal contains Section 6 with per-screen widget table covering: LoginScreen, RegisterScreen, NoteListScreen; each row has layout widgets, key child widgets, custom widgets, state connection
**Pass if:** All three screens present in Section 6 table; at least one non-obvious widget choice noted with rationale; no code written

### TC-06 — Composite PHASE-5 COMPLETED by Roma (ROME-PROP-029)
**When:** P5-CHARLIE COMPLETED is logged
⛽ **INJECT NOW:** None — observe passively; watch for Roma to query P5 robot statuses
**Expected:** Roma queries activity log; confirms P5-ASHOK, P5-REENA, P5-CHARLIE all COMPLETED; logs `PHASE | PHASE-5 | status:COMPLETED | robot:roma`; publishes Seez GATE-P5 request
**Pass if:** Composite PHASE-5 entry present in log; logged by `robot:roma`; Seez notification appears

### TC-07 — GATE-P5 Runs Before Project Close (ROME-PROP-029)
**When:** Composite PHASE-5 COMPLETED is logged
⛽ **INJECT NOW:** None — observe that Roma does not allow any post-run activity until GATE-P5 APPROVED
**Expected:** Sarah GATE-P5 runs; validates IMPL-PROP approvals + composite PHASE-5 + traceability; GATE-P5 = APPROVED logged in activity log
**Pass if:** GATE-P5 APPROVED entry present; logged before any post-delivery activity or session close

### TC-08 — GATE-P2 Content Sampling
**When:** Sarah runs GATE-P2
⛽ **INJECT NOW:** None — observe passively
**Expected:** Sarah explicitly reads at least 3 REQ-###→FUNC-### pairs by content (not count); names the sampled entries in gate output; confirms semantic alignment
**Pass if:** Gate output lists sampled REQ-### IDs; gate takes measurably longer than 60 seconds; not a count-only rubber-stamp

---

## Phase Exit Criteria

### P0 — Bootup
- [ ] `ARTIFACTS/rome-config.yaml` present with `rome_framework_version` field (TC-01)
- [ ] `ARTIFACTS/activity-log.txt` initialized
- [ ] PHASE-0 IN_PROGRESS → COMPLETED in activity log

### P1 — Ingest (Talib)
- [ ] F1 Auth decomposed to REQ-### entries
- [ ] F2 Note Management decomposed to REQ-### entries
- [ ] Both open questions surfaced to sponsor (note body limit, title limit)
- [ ] Sponsor answers recorded; blockers resolved
- [ ] GATE-P1 APPROVED
- [ ] PHASE-1 IN_PROGRESS → COMPLETED in activity log

### P2 — Analysis (Talib)
- [ ] requirements-matrix.yaml produced
- [ ] user-stories.md produced
- [ ] acceptance-criteria.md produced
- [ ] Sarah content-samples ≥3 REQ→FUNC pairs (TC-08)
- [ ] GATE-P2 APPROVED
- [ ] PHASE-2 IN_PROGRESS → COMPLETED in activity log

### P3 — Design (PMA)
- [ ] system-architecture.md produced (includes JWT expiry, D1 migration strategy)
- [ ] data-model.md produced (users + notes tables)
- [ ] api-design.md produced (~5 endpoints)
- [ ] SPEC-### files produced for each feature
- [ ] TC-02: Gate block fires on missing session expiry; resolves on resubmission
- [ ] GATE-P3 APPROVED
- [ ] PHASE-3 IN_PROGRESS → COMPLETED in activity log

### P4 — Config (Lucien)
- [ ] wrangler.toml scaffolded with D1 binding
- [ ] D1 migration files scaffolded
- [ ] Flutter web project structure defined
- [ ] GATE-P4 APPROVED
- [ ] PHASE-4 IN_PROGRESS → COMPLETED in activity log

### P5 — Generation
- [ ] TC-03: Zero-timestamp hook fires (tested at any robot, any phase)
- [ ] TC-04: All 3 Seez proposals published before any Write call
- [ ] TC-05: Charlie Section 6 widget table complete (LoginScreen, RegisterScreen, NoteListScreen)
- [ ] IMPL-PROP-ASHOK, IMPL-PROP-REENA, IMPL-PROP-CHARLIE all logged APPROVED
- [ ] SOURCE/taskflow-db/ (or equivalent): D1 schema + migrations
- [ ] SOURCE/taskflow-api/ (or equivalent): Hono routes (auth + notes)
- [ ] SOURCE/taskflow-app/ (or equivalent): Flutter web screens
- [ ] P5-ASHOK, P5-REENA, P5-CHARLIE all COMPLETED in activity log
- [ ] TC-06: Composite PHASE-5 COMPLETED logged by Roma
- [ ] TC-07: GATE-P5 APPROVED before session close

---

## Sponsor Answers (Pre-resolved for Speed)

Answer these immediately when Talib raises them, to keep the run fast:

| Question | Answer |
|----------|--------|
| Note body character limit? | Yes — 1000 characters maximum |
| Note title character limit? | Yes — 100 characters maximum |

---

## Performance Targets

| Phase | Target duration |
|-------|----------------|
| P0 | < 1 min |
| P1 | < 10 min |
| P2 | < 10 min |
| P3 | < 15 min |
| P4 | < 10 min |
| P5 | < 45 min |
| **Total** | **< 90 min** |

---

## Audit Checks (Post-Run)

```bash
# 1. rome-config.yaml present and versioned
cat ARTIFACTS/rome-config.yaml | grep rome_framework_version

# 2. Composite PHASE-5 entry logged by Roma
grep "PHASE-5.*robot:roma" ARTIFACTS/activity-log.txt

# 3. IMPL-PROP approvals present
grep "IMPL-PROP" ARTIFACTS/activity-log.txt

# 4. GATE-P5 approved
grep "GATE-P5.*APPROVED" ARTIFACTS/activity-log.txt

# 5. No zero timestamps survived
grep "T00:00:00" ARTIFACTS/activity-log.txt  # should return nothing

# 6. All phases have IN_PROGRESS → COMPLETED pairs
grep "| PHASE |" ARTIFACTS/activity-log.txt
```

---

## Known Scope Limitations

| Limitation | Impact |
|-----------|--------|
| No AMD-### injection | AMD lifecycle not tested — covered in TaskFlow Run 2 |
| No CR-### injection | CR lifecycle not tested — covered in TaskFlow Run 2 |
| Only 1 actor (NoteUser) | RBAC not tested — covered in TaskFlow |
| No parallel TC injection | TCs are sequential; observer must stay attentive at each ⛽ marker |
