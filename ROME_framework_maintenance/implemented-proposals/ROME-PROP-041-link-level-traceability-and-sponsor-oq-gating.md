# Proposal: Link-Level Traceability Matrix & Sponsor-OQ Gating

| Field | Value |
|-------|-------|
| **Document UID** | ROME-PROP-041 |
| **Version** | 1.0 |
| **Date** | 2026-06-19T00:00:00Z |
| **Status** | Implemented |
| **Implemented In** | v2.3.0 "Claudius" (commit 88cad4c6) |
| **Implemented By** | `verification.js` (`buildMatrix`, `checkMatrix`, `checkSponsorOq`), `state.js` (`state.traceability.matrix`, `state.oq`), `impact.js` (`resolveDeferral`), `guard-cli.cjs` |
| **Document Type** | Proposal |
| **Author** | Archie (Framework Analyst & Architect) |
| **Proposed By** | Sponsor |
| **Builds On** | ROME-PRIN-002 (sponsor question alternatives), ROME-PROP-002 / ROME-PROP-016 (code traceability), ROME-PROP-035 (orchestrator + state.json), ROME-PROP-039 (executability/contracts) |

---

## Executive Summary

**Proposal:** Two targeted additions to the v2.0 orchestrator, grounded in a live production run (FOB / `friendsonbikes` FLEET module, 2026-06-19):

1. **Link-level traceability** — the guard stores an explicit `REQ-ID → artifact:line` map in `state.json` at each gate, replacing the current self-reported aggregate count.
2. **Sponsor-OQ gating** — P2 splits open questions into design-resolvable (Talib decides) vs. business-fact (sponsor must confirm); sponsor-owned OQs block GATE-P2 closure rather than being resolved unilaterally.

**Assessment:** MEDIUM VALUE, LOW–MEDIUM EFFORT. Both close gaps confirmed by inspection of a passing end-to-end run, not hypothesised.

**Risk Level:** LOW — additive to existing guard + gate machinery; no change to the catalog artifact format.

**Explicitly NOT proposed:** reintroduction of atomic `REQ-NNN.yaml` files. See §5 (Rejected Alternatives) — investigation showed the catalog format and `state.json` gate model are sound; per-file requirements would solve a problem that does not exist.

---

## Problem Statement

### Evidence base

Inspection of a complete, all-gates-APPROVE run (`005-roman-friendsonbikes-dev/dev1/my-app`, framework v2.2.0):

- P1 produced `FLEET-requirements-catalog.md` (REQ-FLEET-001..016 as sections, AORDL-STRICT validated) — **not** atomic files. Format is deliberate and works.
- `state.json` carries a rigorous `gateLedger` + per-phase `verification` block (AORDL validation, traceability, contract-drift, secrets). The gate self-check is a framework strength.

Two real gaps remain:

### Gap 1 — Traceability is count-level, not link-level

`state.json.verification.P5.traceability` asserts:

> "16/16 REQ-FLEET-* referenced in source. All requirements traced to route handlers, Flutter pages, and test files."

This is a **self-reported aggregate count**. It does not store the concrete map (`REQ-FLEET-015 → fleet-validation.ts:42 → fleet.safety.test.ts`). Consequences:

- A requirement can be hollow-implemented (referenced in a comment, not satisfied) and still pass 16/16.
- Backward queries ("which code implements REQ-FLEET-015?") are not answerable from state; they require re-greping.
- Change-impact analysis cannot be driven from `state.json`.

This is the granular-traceability concern (relates to ROME-PRIN-001 Principle 2 and PROP-002), unresolved at the orchestrator/state layer.

### Gap 2 — Sponsor-owned open questions resolved unilaterally

In the FLEET run, **all 36 P2 open questions were resolved by Talib** and GATE-P2 APPROVE issued. Several were business facts only the sponsor can supply, e.g.:

- OQ-001 — actual bike models in the fleet (Talib assumed "8–12 standard models").
- OQ-009 — exact compliance certificates held (Talib enumerated 7 types).
- OQ-034 — first-aid-kit mandatory vs. optional (Talib decided).

ROME-PRIN-002 already mandates sponsor authority over assumption-based questions, but there is **no gate mechanism** enforcing it during P2. Unconfirmed assumptions propagate into design and code unflagged.

---

## Proposed Solution

### Part A — Link-Level Traceability Matrix

**A1. Artifact annotation (consumes PROP-002/016).** Producer roles tag each output unit with the REQ-ID(s) it satisfies (code comment, design-section header, test name) — already the PROP-002 convention; this PROP makes it the *input* the guard consumes.

**A2. Guard emits a matrix.** At each gate, `guard` greps annotations and writes to `state.json.traceability.matrix`:

```json
{
  "REQ-FLEET-015": {
    "design":  ["FLEET-api-design.md#validate-for-booking"],   // P3: section anchor (stable across prose edits)
    "code":    ["fleet-validation.ts:42", "fleet-routes.ts:88"], // P5: line-level
    "tests":   ["fleet.safety.test.ts:30"],
    "status":  "linked"
  }
}
```

**A3. Gate rule (phased enforcement — resolves Q2).** Enforcement escalates by phase:
- **P3 (design): WARN-only.** Unlinked REQ-IDs are recorded in the matrix and surfaced to PMA/Sarah as warnings, but do **not** block GATE-P3. Design-stage links are legitimately fuzzy (a requirement may be covered across wireframe + API note + component spec); early hard-blocking generates false failures.
- **P5 (code+tests): STRICT.** Any in-scope REQ-ID with `status != "linked"` blocks GATE-P5. Code and tests make links concrete and unambiguous, so a dangling requirement here is a real gap.

The P3 warning still earns its place: it gives early sight of likely gaps so they are cheaper to close by P5, without hard-stopping a pipeline on a still-in-flux design. Replaces the aggregate "N/N" assertion with per-requirement evidence.

**A4. Backward query.** `rome-start` / guard-cli exposes `trace <REQ-ID>` returning the matrix row.

### Part B — Sponsor-OQ Gating

**B1. OQ classification (P2, Talib).** Every open question is tagged:
- `owner: talib` — resolvable from PRD + framework principles.
- `owner: sponsor` — requires a business fact, real-world inventory, legal/compliance specific, or a scope decision with no principled default.

**B2. Sponsor questions surfaced via PRIN-002 interface.** `owner: sponsor` OQs are emitted as Seez questions following ROME-PRIN-002 (options + mandatory free-text alternative). Talib MUST NOT close them unilaterally.

**B3. Gate rule (resolves Q3).** GATE-P2 records two counts in `state.json`: `oqResolvedByTalib` and `oqAwaitingSponsor`. If `oqAwaitingSponsor > 0` and unanswered, GATE-P2 verdict is `BLOCK`. No new verdict type is introduced: a sponsor may explicitly defer a non-critical OQ, in which case the gate issues **APPROVE** and the deferral is logged in `gateLedger.deferrals[]` with the sponsor's authorization + rationale. A deferral without explicit sponsor authorization is invalid (prevents APPROVE-with-deferral becoming a silent escape hatch). Keeps gate semantics binary.

**B4. Provisional-assumption marker.** Where the sponsor defers, Talib's resolution is recorded with `provisional: true` and surfaced in the design/code traceability matrix so a later sponsor answer triggers PROP-039 incremental re-gen scoped to the affected REQ-IDs.

---

## Affected Components

| Component | Change |
|-----------|--------|
| `rome-core/orchestrator/guard.js` + `guard-cli.cjs` | Emit/validate `traceability.matrix`; enforce A3 + B3 gate rules; `trace` query |
| `rome-core/orchestrator/state.js` | `traceability.matrix` + `oqAwaitingSponsor`/`oqResolvedByTalib` fields |
| `agents/talib/modes/*` (P2) | OQ classification (B1); provisional markers (B4) |
| Producer agent modes (P3 PMA, P5 Ashok/Reena/Charlie) | REQ-ID annotation discipline (A1) |
| `rome-core/docs/standards/traceability-standard.md` | Document matrix schema + gate rules |
| Sarah gate mode | Consume matrix + sponsor-OQ counts in verdict |

---

## Rejected Alternatives

**Reintroduce atomic `REQ-NNN.yaml` files.** Rejected. Investigation (2026-06-19) showed: (a) the new ROME P1 never produced atomic files — the catalog-with-sections format is deliberate and passes AORDL-STRICT; (b) traceability is keyed on the stable `REQ-ID` string, which grep-based verification handles identically whether the requirement is a file or a section; (c) the real granularity gap is count-level vs. link-level evidence (Part A), which atomic files would not fix. Per-file requirements add per-requirement git diffs at the cost of re-introducing fan-out the v2.0 model deliberately removed. Net negative.

---

## Acceptance Criteria

1. A passing run's `state.json` contains a `traceability.matrix` with a `linked` row for every in-scope REQ-ID at P3 and P5.
2. `trace <REQ-ID>` returns design+code+test locations for any requirement.
3. A deliberately hollow requirement (annotation present, implementation absent) is caught by the A3 gate rule (negative test).
4. A run with a business-fact OQ produces a sponsor Seez question (PRIN-002 compliant) and GATE-P2 does not APPROVE until answered or explicitly deferred.
5. A deferred sponsor OQ is recorded `provisional: true` and a later answer scopes PROP-039 re-gen to the affected REQ-IDs only.

---

## Open Questions

| Ref | Question | Owner |
|-----|----------|-------|
| ~~Q1~~ | ~~Matrix granularity at P3?~~ **RESOLVED (sponsor, 2026-06-19): section anchors at P3 (stable across prose edits), line-level at P5 (code).** | — |
| ~~Q2~~ | ~~STRICT at P3 vs warn-only until P5?~~ **RESOLVED (sponsor, 2026-06-19): warn-only at P3, STRICT at P5.** See A3. | — |
| ~~Q3~~ | ~~CONDITIONAL verdict vs APPROVE-with-deferrals?~~ **RESOLVED (sponsor, 2026-06-19): no new verdict — APPROVE with `provisional: true` + ledger `deferrals[]` carrying explicit sponsor authorization.** See B3/B4. | — |

**All open questions resolved. Proposal is build-ready pending implementation scheduling.**

---

## Revision Log

| Version | Date | Summary |
|---------|------|---------|
| 0.1 | 2026-06-19T00:00:00Z | Initial draft. Two recommendations from FLEET live-run inspection: link-level traceability matrix (Part A) + sponsor-OQ gating (Part B). Atomic-file reintroduction explicitly rejected (§5). |
| 0.2 | 2026-06-19T00:00:00Z | Q2 resolved (sponsor): phased enforcement — WARN-only at P3, STRICT at P5. A3 updated. |
| 0.3 | 2026-06-19T00:00:00Z | Q1 + Q3 resolved (sponsor): section anchors at P3 / line-level at P5 (A2); no new gate verdict — APPROVE with authorized `deferrals[]` (B3). All OQs closed; proposal build-ready. |
| 1.0 | 2026-07-15T00:00:00Z | Status → Implemented. Parts A (link-level matrix) and B (sponsor-OQ gating) built in commit 88cad4c6; released in v2.3.0 "Claudius". Moved to `implemented-proposals/`. |
