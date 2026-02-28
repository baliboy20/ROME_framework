# PinNote — Framework Regression Test Observation Sheet

**Run date:** _______________
**Framework version:** rome-v1.2.0
**Observer:** _______________

---

## P0 — Bootup

**Start time:** _______  **End time:** _______  **Duration:** _______

| Check | Pass | Notes |
|-------|------|-------|
| Directory structure created | ☐ | |
| **TC-01: rome-config.yaml present** | ☐ | |
| TC-01: `rome_framework_version` field populated | ☐ | |
| TC-01: Version matches rome-core/VERSION | ☐ | |
| activity-log.txt initialized | ☐ | |
| PHASE-0 IN_PROGRESS logged | ☐ | |
| PHASE-0 COMPLETED logged | ☐ | |

**rome-config.yaml content (copy):**
```

```

**Deviations / observations:**

---

## P1 — Ingest

**Start time:** _______  **End time:** _______  **Duration:** _______

| Check | Pass | Notes |
|-------|------|-------|
| F1 Auth decomposed | ☐ | |
| F2 Note Management decomposed | ☐ | |
| Open question OQ-1 (body limit) surfaced | ☐ | |
| Open question OQ-2 (title limit) surfaced | ☐ | |
| Sponsor answers given immediately | ☐ | |
| **TC-03: Zero-timestamp hook tested** | ☐ | |
| TC-03: Hook blocked the append | ☐ | |
| TC-03: Error message referenced placeholder | ☐ | |
| TC-03: Robot corrected to real timestamp | ☐ | |
| GATE-P1 APPROVED | ☐ | |
| PHASE-1 IN_PROGRESS → COMPLETED logged | ☐ | |

**TC-03 hook block message (copy exact):**
```

```

**Gate attempts before pass:** _______

**Deviations / observations:**

---

## P2 — Analysis

**Start time:** _______  **End time:** _______  **Duration:** _______

| Check | Pass | Notes |
|-------|------|-------|
| requirements-matrix.yaml produced | ☐ | |
| user-stories.md produced | ☐ | |
| acceptance-criteria.md produced | ☐ | |
| **TC-08: Sarah content-sampled ≥3 REQ→FUNC pairs** | ☐ | |
| TC-08: Sampled entry IDs named in gate output | ☐ | |
| TC-08: Semantic alignment confirmed per entry | ☐ | |
| TC-08: Gate duration > 60 seconds | ☐ | |
| GATE-P2 APPROVED | ☐ | |
| PHASE-2 IN_PROGRESS → COMPLETED logged | ☐ | |

**TC-08 sampled REQ-### entries (copy from gate output):**
```

```

**Gate duration:** _______  **Gate attempts:** _______

**Deviations / observations:**

---

## P3 — Design

**Start time:** _______  **End time:** _______  **Duration:** _______

| Check | Pass | Notes |
|-------|------|-------|
| system-architecture.md produced | ☐ | |
| data-model.md produced (users + notes) | ☐ | |
| api-design.md produced | ☐ | |
| SPEC-### files produced | ☐ | |
| **TC-02: GATE-P3 blocked on missing session expiry** | ☐ | |
| TC-02: Finding specifically named session expiry | ☐ | |
| TC-02: PMA added expiry duration and resubmitted | ☐ | |
| TC-02: Second submission passed | ☐ | |
| GATE-P3 APPROVED | ☐ | |
| PHASE-3 IN_PROGRESS → COMPLETED logged | ☐ | |

**TC-02 gate failure text (copy exact):**
```

```

**Gate attempts before pass:** _______

**Deviations / observations:**

---

## P4 — Config

**Start time:** _______  **End time:** _______  **Duration:** _______

| Check | Pass | Notes |
|-------|------|-------|
| wrangler.toml scaffolded | ☐ | |
| D1 migration files scaffolded | ☐ | |
| Flutter web project structure defined | ☐ | |
| GATE-P4 APPROVED | ☐ | |
| PHASE-4 IN_PROGRESS → COMPLETED logged | ☐ | |

**Deviations / observations:**

---

## P5 — Generation

**Start time:** _______  **End time:** _______  **Duration:** _______

| Check | Pass | Notes |
|-------|------|-------|
| **TC-04: All 3 Seez proposals published before any Write** | ☐ | |
| TC-04: Ashok proposal — 5 sections present | ☐ | |
| TC-04: Reena proposal — 5 sections present | ☐ | |
| TC-04: Charlie proposal — 5 sections present | ☐ | |
| TC-04: All robots paused awaiting approval | ☐ | |
| **TC-05: Charlie Section 6 widget table present** | ☐ | |
| TC-05: LoginScreen row complete | ☐ | |
| TC-05: RegisterScreen row complete | ☐ | |
| TC-05: NoteListScreen row complete | ☐ | |
| TC-05: At least 1 non-obvious widget choice noted | ☐ | |
| IMPL-PROP-ASHOK APPROVED logged | ☐ | |
| IMPL-PROP-REENA APPROVED logged | ☐ | |
| IMPL-PROP-CHARLIE APPROVED logged | ☐ | |
| SOURCE DB workspace present | ☐ | |
| SOURCE API workspace present | ☐ | |
| SOURCE frontend workspace present | ☐ | |
| P5-ASHOK COMPLETED logged | ☐ | |
| P5-REENA COMPLETED logged | ☐ | |
| P5-CHARLIE COMPLETED logged | ☐ | |
| **TC-06: Composite PHASE-5 COMPLETED logged by Roma** | ☐ | |
| TC-06: Entry shows `robot:roma` | ☐ | |
| TC-06: Entry shows `robotsCompleted:ashok,reena,charlie` | ☐ | |
| TC-06: Seez GATE-P5 request published by Roma | ☐ | |
| **TC-07: GATE-P5 runs and APPROVED** | ☐ | |
| TC-07: GATE-P5 APPROVED before session close | ☐ | |
| TC-07: No post-delivery activity before GATE-P5 APPROVED | ☐ | |

**TC-04 Seez proposal tabs (list robot names visible in Seez):**

**TC-05 Charlie Section 6 — NoteListScreen widgets:**

**TC-06 composite log entry (copy exact):**
```

```

**TC-07 GATE-P5 approved at (timestamp):** _______

**Deviations / observations:**

---

## Performance Summary

| Metric | P0 | P1 | P2 | P3 | P4 | P5 | Total |
|--------|----|----|----|----|----|----|-------|
| Wall time (min) | | | | | | | |
| Gate attempts | — | | | | | — | |
| Activity log entries | | | | | | | |

**Total vs target (< 90 min):** _______  **On target?** ☐ Yes  ☐ No

---

## TC Results Summary

| TC | Description | Pass | Notes |
|----|-------------|------|-------|
| TC-01 | rome-config.yaml at P0 | ☐ | |
| TC-02 | GATE-P3 block (session expiry) | ☐ | |
| TC-03 | Zero-timestamp rejection | ☐ | |
| TC-04 | Parallel Impl Proposals | ☐ | |
| TC-05 | Charlie Widget Design Plan | ☐ | |
| TC-06 | Composite PHASE-5 by Roma | ☐ | |
| TC-07 | GATE-P5 before close | ☐ | |
| TC-08 | GATE-P2 content sampling | ☐ | |

**TCs passed:** ___/8

---

## Audit Checks (Post-Run)

```bash
# Run from project ARTIFACTS directory

# TC-01
cat rome-config.yaml | grep rome_framework_version

# TC-03
grep "T00:00:00" activity-log.txt   # should return nothing

# TC-04/05
grep "IMPL-PROP" activity-log.txt

# TC-06
grep "PHASE-5.*robot:roma" activity-log.txt

# TC-07
grep "GATE-P5" activity-log.txt

# TC-08 (manual — review gate output text)
```

**TC-01 output:** _______
**TC-03 output (expect empty):** _______
**TC-04/05 IMPL-PROP lines:** _______
**TC-06 composite entry:** _______
**TC-07 GATE-P5 line:** _______

---

## Issues Found

| # | Phase | TC | Issue | Severity | Classification |
|---|-------|----|-------|----------|----------------|
| 1 | | | | | |
| 2 | | | | | |

---

## Recommendations for Framework

(Fill in after run)
