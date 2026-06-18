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
6. Phases cannot be **skipped or reordered** (advance moves exactly one step).
7. A verdict on an **ungated** phase is rejected.

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
