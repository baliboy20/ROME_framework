# Phase Plugins — Retired

| Field | Value |
|-------|-------|
| **Retired by** | ROME-PROP-034 |
| **Retirement date** | 2026-03-05T00:00:00Z |
| **Framework version** | 1.3.0 |

## Reason for Retirement

Phase plugins (`rome-p*`, `rome-qa`) served as the methodology and skill layer for each pipeline phase prior to ROME-PROP-019/020 giving robot plugins full operational capability.

Post ROME-PROP-034, their content has been consolidated into:

| Former Phase Plugin | Content Type | Now Located At |
|---------------------|-------------|----------------|
| `rome-p0-bootup` | Operational workflow | Bootstrap robot ROBOT.md |
| `rome-p1-aordl` | Format specifications | `rome-core/docs/standards/aordl-standard.md` (ROME-GOV-012) |
| `rome-p1-aordl` | Operational workflow | `robot-plugins/talib/modes/P1-aordl.md` |
| `rome-p2-analysis` | Format specifications | `rome-core/docs/standards/analysis-standard.md` (ROME-GOV-013) |
| `rome-p2-analysis` | Operational workflow | `robot-plugins/talib/modes/P2-analysis.md` |
| `rome-p3-design` | Operational workflow | `robot-plugins/pma/modes/P3-design.md` |
| `rome-p3-design` | Clara activation | `robot-plugins/pma/procedures/clara-activation.md` |
| `rome-p4-config` | Operational workflow | `robot-plugins/lucien/modes/P4-config.md` |
| `rome-p5-generation` | Format specifications | `rome-core/docs/standards/code-organisation-standard.md` (ROME-GOV-014) |
| `rome-p5-generation` | Coordination protocol | `robot-plugins/roma/procedures/p5-capability-coordination.md` |
| `rome-p5-generation` | Per-robot workflows | `robot-plugins/ashok/`, `reena/`, `charlie/` modes |
| `rome-qa` | Format specifications | `rome-core/docs/standards/gate-standard.md` (ROME-GOV-015) |
| `rome-qa` | Operational workflow | `robot-plugins/sarah/modes/QA-validator.md` |

## Do Not Delete

These directories are retained for reference during the v1.2.x → v1.3.x transition period.
