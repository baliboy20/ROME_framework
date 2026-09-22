# Gate Decision Standard

| Field | Value |
|-------|-------|
| **UID** | ROME-STD-GATE |
| **Title** | Quality-gate verdicts, ownership, and deterministic enforcement |
| **Status** | Active |
| **Created** | 2026-06-18T00:00:00Z |
| **Origin** | ROME-PROP-034 Track A; implements PROP-035 §3.5 (deterministic enforcement) |
| **Implemented by** | `rome-core/orchestrator/guard.js` + `guard-cli.cjs`, `lifecycle.js` |

Single source of truth for how phase transitions are gated and enforced. The
orchestrator (LLM) drives; the guard (code) enforces. Documents implemented behavior.

---

## 1. Gates & ownership

| Transition | Gate | Owner (gate authority) |
|------------|------|------------------------|
| P0 → next | — (none) | — |
| P0.5 → P1 | GATE-P0.5 | Sarah |
| P1 → P2 | GATE-P1 | Sarah (after AORDL STRICT passes — `validate-aordl`) |
| P2 → P3 | GATE-P2 | Sarah |
| P3 → next | GATE-P3 | Sarah (Clara validates first; advises, no authority) |
| P3.5 → P4 | GATE-P3.5 | Sarah (+ sponsor visual approval) |
| P4 → P5 | GATE-P4 | Sarah |
| P5 → delivery | GATE-P5 | Sarah (requires verified executability + zero contract drift) |

**Producer ≠ gate authority.** Only the designated gate role may record a verdict;
the guard rejects any other role — self-approval is structurally impossible (EP-5).

## 2. Verdict record (gate ledger entry)

```json
{ "gate": "GATE-P3", "phase": "P3", "verdict": "APPROVE|BLOCK",
  "role": "sarah", "timestamp": "<iso8601>", "note": "<optional>" }
```

Recorded via `guard.recordGateVerdict` / `guard-cli.cjs verdict`. Appended to
`state.gateLedger`. A BLOCK sets the phase status to BLOCKED; an APPROVE to GATE.

## 3. Enforced rules (deterministic — not model discretion)

1. Only the **current** routed phase may advance.
2. A gated phase advances only on an **APPROVE** for its gate…
3. …recorded by the phase's **designated gate role** (wrong role → rejected).
4. **Latest verdict wins** — a later BLOCK overrides an earlier APPROVE.
5. **Open blockers** on the phase prevent advance.
6. No routed phase may be **jumped**, and phases may never be **reordered**; advance
   moves exactly one step along the routing. (Optional phases may be *omitted* at
   routing time — "phases cannot be skipped" is not a framework guarantee; see the
   AX-06 note in ROME-ONT-001.)
7. A verdict on an **ungated** phase is rejected.
8. **Mechanical preconditions (the verdict is NOT sufficient).** Each phase declares
   `requires` (lifecycle.js). The guard refuses to advance unless every required
   fact is **recorded AND passing** in `state.verification[phase]` — so an LLM gate
   role cannot APPROVE without the checks actually having run:

   | Phase | Required mechanical facts |
   |-------|---------------------------|
   | P0 / P0.5 | — (none) |
   | P1 | `aordl` (STRICT validation), `traceability`, `flowValidation` (flows confirmed or omission recorded — PROP-057, AX-38) |
   | P2 | `traceability`, `sponsorOq`, `stageConsistency` |
   | P3 | `traceability`, `matrix`, `designAssets`, `sponsorArch`, `tdrConformance` |
   | P3.5 | `traceability`, `matrix` |
   | P4 | `secrets`, `traceability`, `sponsorInfra`, `tdrConformance` |
   | P5 | `executability`, `integration`, `testAdequacy`, `secrets`, `contracts`, `traceability`, `matrix`, `tdrConformance` |

   `lifecycle.js` (`PHASES[].requires`) is authoritative for this table.

   - **traceability** is ALWAYS required (iterative-dev safety): every in-scope
     requirement maps requirement→artifact; at P5 also requirement→**code** AND →**test**,
     where code and test links are **scanned from source comments** by `guard-cli scan`,
     never declared by a producer (PROP-058 / AX-42). "In scope" is the increment's
     recorded scope (`guard-cli scope`), never a list the recorder chose.
   - **testAdequacy** is the **MVP rule** — each in-scope requirement's *declared* Outcomes +
     Errors (from AORDL) must be tested; nothing more is demanded (`verification.js#checkTestAdequacy`).
     Coverage accumulates across increments (`state.traceability.testCoverage`), so a
     mature requirement's earlier tests count. An empty or unset scope, or no coverage
     record at all, is **INCONCLUSIVE** — recorded as not passing, never as PASS.
   - **matrix** is link-level traceability (PROP-041, restored by PROP-058): scanned
     code/test locations plus declared design anchors, projected per requirement and
     computed every time (`verification.js#checkMatrix`; nothing is stored). WARN-only
     at P3, STRICT at P5, where a requirement linked at the previous sealed increment
     that is no longer linked also fails (regression).
   - **sponsorOq** gates on open questions from P2 (PROP-041 Part B): a deferral is
     valid ONLY with explicit `sponsorAuthorized: true` (`verification.js#checkSponsorOq`).
   - **designAssets** (D5 fix / ROME-AX-26): for a project WITH a ui capability,
     P3 must produce design assets (Clara's `design-system.md` + `user-flows.md` in
     `ARTIFACTS/_design/design-assets/`) — `verification.js#checkDesignAssets`.
     Projects with no ui capability pass trivially. Closes the "if Clara provided"
     escape hatch that let the fob-admin design gap ship.
   - **sponsorArch / sponsorInfra** (PROP-051 / ROME-AX-27): a recorded sponsor
     response (CONFIRM/DELEGATE, or resolved REDIRECT) on the phase's Architecture &
     Infrastructure Brief, bound to the current brief revision
     (`verification.js#checkSponsorAib`). DELEGATE never auto-extends across phases.
     Checkpoint omission passes only with recorded sponsor authorization.
   - **tdrConformance** (PROP-052 / ROME-AX-29): every APPROVED TDR binding this
     phase is cited (`satisfies: TDR-##`) or covered by a sponsor-approved deviation
     (`verification.js#checkTdrConformance`). OPEN deviations fail; no-spec projects
     pass trivially. Citation-level, not semantic proof.
   - **stageConsistency** (PROP-049 / ROME-AX-22): on a staged project, no requirement
     may depend on a requirement in a LATER stage (`verification.js#checkStageConsistency`).
     WARN-only at intake (judgement); STRICT here, where the requirement graph is
     mechanical. Unstaged projects pass trivially.
   - **executability** is **component-level only** — each component's own build/test
     in isolation (`executability.js#verifyComponent`). It does NOT prove the
     integrated system runs; that is `integration` (PROP-046).
   - **Stub expiry (PROP-049 / ROME-AX-24)** is enforced by the guard directly at the
     P5 delivery edge (not a `requires` fact): an ACTIVE stub whose `implementBy`
     increment is due blocks advance; delivery refuses undeclared or expired stubs.
   - **integration** (PROP-046): the real system starts and at least one in-scope
     requirement is driven end-to-end **across the component seam** (client→API→store),
     with the response asserted against the contract shape — not each side in-process
     against its own mock. STRICT at P5. For a genuinely un-runnable stack it may be
     recorded as passing with detail `WAIVED (sponsor-authorized)` plus an audit
     entry — never a silent skip.
   - Facts are written by their modules (`executability.js`, `security.js`,
     `contracts.js`, `validate-aordl.js`) via `verification.js#recordVerification`,
     not asserted by the gate role. The requirement-scoped facts (`traceability`,
     `matrix`, `testAdequacy`) are written only by `guard-cli verify`; `guard-cli
     check`/`advance` recomputes them and refuses a record that disagrees (AX-40).
   - **Known gap (AX-41).** `aordl`, `secrets`, `integration`, `contracts` and
     `executability` are required facts with no checker function wired to them at
     v3.5.0; each is satisfied by its module or by assertion until its own proposal
     lands. `tests/axioms.test.cjs` names them so the gap cannot grow silently.

`guard-cli.cjs` exits non-zero on any blocked transition, so it is wireable as a
hook over `state.json` mutations. The orchestrator MUST route every transition
through it; a phase cannot be completed by narration.

## 4. On BLOCK

Loop back to the producing role with the gate findings; re-produce; re-request
the verdict. All BLOCKs, retries, and escalations are recorded (no silent recovery,
EP-4). Exhaustion escalates to the sponsor (failure policy, PROP-039 B).

---

## Revision History

| Version | Date | Summary |
|---------|------|---------|
| 1.0 | 2026-06-18 | Initial standard — gate ownership, verdict record, the seven enforced rules; documents guard.js behavior (PROP-034 Track A / PROP-035 §3.5). |
| 1.5 | 2026-07-17 | v3.2.1 consistency pass: §3 rule 6 rephrased — "skipped" wording replaced per the AX-06 note (omission at routing time is permitted; jumping/reordering is not); sponsorArch/sponsorInfra/tdrConformance fact explanations added. |
| 1.5 | 2026-07-29 | v3.4.0 (PROP-057): P1 gains `flowValidation` — FLOW artifacts validator-clean + sponsor-confirmed, or recorded sponsor flows-omission (ROME-AX-38/39, ROME-STD-FLOW). Found and corrected in the post-implementation coherence review (table had drifted from lifecycle.js on release day). |
| 1.4 | 2026-07-17 | v3.2.0 (PROP-051/052): P3 gains `sponsorArch`, P4 `sponsorInfra` (ROME-AX-27 sponsor AIB checkpoints); P3/P4/P5 gain `tdrConformance` (ROME-AX-29 TDR binding, ROME-STD-TECHSPEC). |
| 1.3 | 2026-07-17 | v3.1.0 (D5 fix + PROP-037 completion): P3 gains `designAssets` (ROME-AX-26 — Clara's design system required for ui-app projects); P3.5 owner clarified reena|charlie; P3 owner pma|clara. |
| 1.2 | 2026-07-17 | v3.0.0 (PROP-048/049): lifecycle fields live on the ACTIVE increment (state.js#active); sealed increments immutable (ROME-AX-19). P2 gains `stageConsistency` (ROME-AX-22, STRICT at P2). Stub expiry (ROME-AX-24) enforced by the guard at the P5 delivery edge. |
| 1.1 | 2026-07-15 | Drift correction (found while verifying PROP-043's axiom provenance). §3 rule 8 (mechanical preconditions) was added in v2.1.0 without a revision entry — logged retrospectively. `requires` table corrected to match `lifecycle.js`, which had diverged when PROP-041/042 landed in v2.3.0: P2 gains `sponsorOq`, P3/P3.5 gain `matrix`, P5 gains `matrix` as a sixth fact; P0/P0.5 stated explicitly. Added `matrix` and `sponsorOq` definitions. Named `lifecycle.js` (`PHASES[].requires`) authoritative for the table. |
