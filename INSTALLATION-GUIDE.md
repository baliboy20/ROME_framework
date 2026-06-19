# ROME Installation Guide (v2.0)

ROME v2.0 is a single-session orchestrator + sub-agent framework. There are no
per-robot session setups, no `switch-robot`, and no per-robot MCP scripts (all
retired in the PROP-035 cutover).

---

## Prerequisites

- **Node.js ≥ 18** (developed on v24).
- **Claude Code** (the orchestrator and sub-agents run as Claude sessions / the Agent tool).
- A git repository for your project.

## Layout

```
ROME/
  rome-core/
    orchestrator/   # the engine: state, guard, sub-agent contract, topology,
                    # executability, contracts, routing, budget, impact, experts,
                    # security, visualize, driver, rome-start.cjs
    docs/standards/ # aordl, agent-roles, traceability, gate-decision, security
    lib/            # deterministic utils (AORDL validator, annotate-artifact)
    servers/        # activity-log MCP (audit trail)
  agents/           # the agent roles (roma, talib, pma, clara, lucien, ashok,
                    # reena, charlie, sarah, bootstrap, surveyor)
```

## Setup

1. **Install deterministic-lib deps** (local, not committed):
   ```bash
   cd ROME/rome-core/lib && npm install
   ```
2. **Verify the engine** (no deps needed):
   ```bash
   node ROME/rome-core/orchestrator/tests/run.cjs   # orchestrator suite
   (cd ROME/rome-core/lib && npm test)              # AORDL validator + annotate
   ```
3. **MCP servers** — the orchestrator session uses a small consolidated set:
   - `activity-log-file` (audit trail) — in `rome-core/servers/activity-log/`
   - `Seez` (sponsor clarification)
   - `Mermaid` (visualization, optional)
   Add these to your Claude Code MCP config. (The old per-robot `add-mcps-v4.sh`
   scripts and `iterm2-terminal` are gone.)

## Start a project

```bash
node ROME/rome-core/orchestrator/rome-start.cjs <projectDir> \
     --intent greenfield --ts "$(date -u +%FT%TZ)"
```
Then run a Claude session as Roma (`agents/roma/`) and follow the operating loop
in `rome-core/orchestrator/README.md`. See `USER-GUIDE.md`.

## Notes

- `node_modules/` is gitignored; install locally.
- The activity-log is an **audit trail only** — enforcement is the deterministic
  guard (`orchestrator/guard-cli.cjs`), invoked on every phase transition.
