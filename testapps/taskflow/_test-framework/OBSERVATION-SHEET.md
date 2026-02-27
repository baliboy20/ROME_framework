# TaskFlow — Framework Test Observation Sheet

Fill in during the live test run. One sheet per execution.

**Run date:** _______________
**Framework version:** rome-v1.0.0
**Observer:** _______________

---

## P0 — Bootup

**Start time:** _______  **End time:** _______  **Duration:** _______

| Check | Pass | Notes |
|-------|------|-------|
| Directory structure created | ☐ | |
| rome-config.yaml present with correct version | ☐ | |
| activity-log.txt initialized | ☐ | |
| PHASE-0 IN_PROGRESS logged | ☐ | |
| PHASE-0 COMPLETED logged | ☐ | |
| MCP servers confirmed available | ☐ | |

**Deviations / observations:**

---

## P1 — Ingest

**Start time:** _______  **End time:** _______  **Duration:** _______

| Check | Pass | Notes |
|-------|------|-------|
| F1 Auth decomposed to REQ-### entries | ☐ | |
| F2 Projects decomposed | ☐ | |
| F3 Tasks decomposed | ☐ | |
| F4 Status workflow decomposed | ☐ | |
| F5 Notifications decomposed | ☐ | |
| Non-functional reqs captured | ☐ | |
| Open questions surfaced to sponsor | ☐ | |
| PHASE-1 COMPLETED logged | ☐ | |

**Open questions Talib raised:**

**Sponsor answers given:**

**Deviations / observations:**

---

## P2 — Analysis

**Start time:** _______  **End time:** _______  **Duration:** _______

| Check | Pass | Notes |
|-------|------|-------|
| ARCHITECTURE.md produced | ☐ | |
| DATA-MODEL.md produced | ☐ | |
| TECH-STACK.md produced | ☐ | |
| Hono/D1/Workers topology in ARCHITECTURE | ☐ | |
| D1 migration strategy addressed | ☐ | |
| CORS strategy addressed | ☐ | |
| Notification async pattern addressed | ☐ | |
| **TC-01: Quality gate blocked** | ☐ | |
| TC-01: Finding was specific (migration strategy) | ☐ | |
| TC-01: Resolved on resubmission | ☐ | |
| PHASE-2 COMPLETED logged | ☐ | |

**TC-01 gate failure text (copy exact):**
```

```

**Gate attempts before pass:** _______

**Deviations / observations:**

---

## P3 — Design

**Start time:** _______  **End time:** _______  **Duration:** _______

| Check | Pass | Notes |
|-------|------|-------|
| DESIGN.md produced | ☐ | |
| COMPONENT-MAP.md produced | ☐ | |
| TRACEABILITY.md produced | ☐ | |
| API routes defined (Hono) | ☐ | |
| Flutter screen map defined | ☐ | |
| D1 schema in DESIGN.md | ☐ | |
| **TC-03: Traceability gap blocked** | ☐ | |
| TC-03: Finding named F5 specifically | ☐ | |
| TC-03: Severity was CRITICAL | ☐ | |
| TC-03: Resolved on resubmission | ☐ | |
| **TC-04: AMD-001 injected** | ☐ | |
| TC-04: AMD-001 logged IN_PROGRESS | ☐ | |
| TC-04: DESIGN.md updated with AMD-001 ref | ☐ | |
| TC-04: DATA-MODEL.md updated (COMMENT entity) | ☐ | |
| TC-04: Quality gate re-run after AMD | ☐ | |
| TC-04: AMD-001 logged COMPLETED | ☐ | |
| PHASE-3 COMPLETED logged | ☐ | |

**TC-04 AMD-001 activity log entries (copy):**
```

```

**Deviations / observations:**

---

## P4 — Config

**Start time:** _______  **End time:** _______  **Duration:** _______

| Check | Pass | Notes |
|-------|------|-------|
| wrangler.toml scaffolded | ☐ | |
| D1 migration files scaffolded | ☐ | |
| Flutter web project structure defined | ☐ | |
| GitHub Actions CI skeleton present | ☐ | |
| PHASE-4 COMPLETED logged | ☐ | |

**Deviations / observations:**

---

## P5 — Generation

**Start time:** _______  **End time:** _______  **Duration:** _______

| Check | Pass | Notes |
|-------|------|-------|
| **TC-07: All 3 proposals published before any Write** | ☐ | |
| TC-07: Ashok proposal uses 5-section structured form | ☐ | |
| TC-07: Reena proposal uses 5-section structured form | ☐ | |
| TC-07: Charlie proposal uses 5-section structured form | ☐ | |
| **TC-08: Partial revision handled correctly** | ☐ | |
| TC-08: Reena revised proposal published before source files | ☐ | |
| TC-08: Charlie proceeded independently (GoRouter incorporated) | ☐ | |
| IMPL-PROP-ASHOK APPROVED in activity log | ☐ | |
| IMPL-PROP-REENA APPROVED in activity log | ☐ | |
| IMPL-PROP-CHARLIE APPROVED in activity log | ☐ | |
| Charlie generating frontend (Flutter) | ☐ | |
| Reena generating backend (Hono routes) | ☐ | |
| Parallel STORY entries in activity log | ☐ | |
| SOURCE/backend/ present | ☐ | |
| SOURCE/frontend/ present | ☐ | |
| SOURCE/tests/ present | ☐ | |
| **TC-02: Hook enforcement observed** | ☐ | |
| TC-02: Warning text included MCP tool example | ☐ | |
| PHASE-5 COMPLETED logged | ☐ | |

**TC-02 hook warning text (copy):**
```

```

**Robot stack mismatch observations (Reena vs Hono):**

**Deviations / observations:**

---

## Post-Delivery

**Start time:** _______  **End time:** _______  **Duration:** _______

| Check | Pass | Notes |
|-------|------|-------|
| **TC-05: CR-001 initiated** | ☐ | |
| TC-05: Roma used create-change-request skill | ☐ | |
| TC-05: CR-001.yaml scaffolded | ☐ | |
| TC-05: Impact analysis covers API + schema + UI | ☐ | |
| TC-05: migrationRequired: true set | ☐ | |
| TC-05: Sarah ran approve-change-request | ☐ | |
| TC-05: cr/CR-001-recurring-tasks branch created | ☐ | |
| TC-05: CR-001 PROPOSED→ANALYZED→APPROVED→COMPLETED | ☐ | |
| Fidelity check --quick: zero new failures | ☐ | |

**TC-06 retroactive logging — observed? (Y/N):** _______
**If yes, copy hook warning:**
```

```

---

## Performance Summary

| Metric | P0 | P1 | P2 | P3 | P4 | P5 | Total |
|--------|----|----|----|----|----|----|-------|
| Wall time (min) | | | | | | | |
| Robot turns (approx) | | | | | | | |
| Gate attempts | — | — | | | — | — | |
| Activity log entries | | | | | | | |
| ARTIFACTS/ files | | | | | | | |
| SOURCE/ files | — | — | — | — | — | | |

## Quality Scores

| Indicator | Score (1–5) | Notes |
|-----------|------------|-------|
| ARCHITECTURE.md depth | /5 | |
| DATA-MODEL.md completeness | /5 | |
| TRACEABILITY.md coverage | /5 | |
| SOURCE/ code quality (spot check) | /5 | |
| Activity log audit completeness | /5 | |
| AMD-001 lifecycle cleanliness | /5 | |
| CR-001 lifecycle cleanliness | /5 | |
| **Overall framework score** | /5 | |

---

## Issues Found

| # | Phase | Issue | Severity | Framework bug or expected? |
|---|-------|-------|----------|---------------------------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

---

## Recommendations for Framework

(Fill in after run)
