# ROME Framework

**ROME** (Requirements-Oriented Multi-agent Engineering) is a structured
framework that orchestrates Claude Code to turn requirements — a PRD/BRD, an
existing codebase, or a plain idea — into a working, tested application.

One long-lived Claude session, **Roma** (the orchestrator), drives the whole
build. It dispatches specialist sub-agents for each phase, and a deterministic
**guard** — code, not judgment — enforces that no phase advances without the
mechanical checks passing and the correct role's approval. Self-approval is
structurally impossible.

## The pipeline

```
Ingest → Analysis → Design → Configuration → Code Generation
  P0.5     P1, P2      P3          P4              P5
```

- **P0.5 Intake** (optional) — Surveyor characterizes your inputs: quality,
  intent (greenfield vs. brownfield), and any technical decisions you've
  already made.
- **P1–P2 Requirements & Analysis** — Talib turns your requirements into
  AORDL, the framework's formal requirements format, then decomposes it.
- **P3 Design** — PMA (+ Clara) produce architecture, data model, and API
  design. If you've made technical decisions already, they bind here — see
  below.
- **P3.5 Prototype** (optional) — a throwaway visual mock-up for early
  sponsor sign-off on UI direction.
- **P4 Configuration** — Lucien scaffolds the workspace, build system, and
  CI/CD.
- **P5 Generation** — capability-specific sub-agents generate the actual
  code, gated on builds passing, tests passing, and zero contract drift.

At P3 and P4 you get an **Architecture & Infrastructure Brief** — a short,
plain-language summary of what's being built and what it depends on — before
that phase's gate can pass. Nothing expensive gets decided about your project
without you seeing it first.

## Getting started

New to ROME? Start here, in order:

1. **[GETTING-STARTED.md](./GETTING-STARTED.md)** — the absolute-beginner
   path: clone, install, create a project, run the pipeline.
2. **[USER-GUIDE.md](./USER-GUIDE.md)** — the mental model and lifecycle in
   more depth once you're past your first run.

If you're preparing inputs *before* your first run:

- **[REQUIREMENTS-AUTHORING-GUIDE.md](./REQUIREMENTS-AUTHORING-GUIDE.md)** —
  write a requirements spec that converts cleanly to AORDL with no
  clarification round-trips.
- **[TECHNICAL-SPEC-AUTHORING-GUIDE.md](./TECHNICAL-SPEC-AUTHORING-GUIDE.md)**
  — already decided your stack, vendors, or architecture? Write them as
  Technical Decision Records (TDRs) so the framework treats them as binding,
  not as suggestions.

## Repository layout

```
ROME/
  agents/            # role definitions Roma spawns as sub-agents
                      # (talib, pma, clara, lucien, ashok, reena, charlie,
                      #  sarah, bootstrap, surveyor)
  rome-core/
    orchestrator/     # the engine: state, guard, sub-agent contract,
                       # routing, topology, verification, security
    docs/              # standards, foundation (lexicon/ontology), governance
Experts/              # domain knowledge packs injected into generation
                       # sub-agents by stack (patterns, standards, gate rules)
ROME_framework_maintenance/
  proposals/           # draft framework changes (ROME-PROP-###)
  implemented-proposals/ # proposals that shipped
```

## Status

Current version: **v3.2.1 "Marcus"** — stable. See
[CHANGELOG.md](./CHANGELOG.md) for release history and
`ROME/rome-core/docs/framework-maintenance/uid-registry.md` for the full,
authoritative document index.
