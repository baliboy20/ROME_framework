# ROME-PROP-040: Cost Governance, Incremental Re-Generation, Expert Knowledge & Security

| Field | Value |
|-------|-------|
| **UID** | ROME-PROP-040 |
| **Title** | Operating the Framework Sustainably — Budget Governance, Incremental Re-Generation, Domain-Expert Knowledge Injection, and Security as a Cross-Cutting Concern |
| **Status** | Draft |
| **Author** | Archie |
| **Created** | 2026-06-18T00:00:00Z |
| **Targets** | orchestrator, ROME phase model, `ROME/robot-plugins/`, `Experts/`, change-request flow |
| **Companion to** | ROME-PROP-035 (single-session orchestration), ROME-PROP-038 (capability instancing), ROME-PROP-039 (executability & contracts) |
| **Relates to** | ROME-PROP-036 (intent routing), Roma change-request skills, `Experts/` knowledge library |

---

## Executive Summary

PROP-035..039 make the framework structurally sound and its output verified. This proposal addresses **Tier-2 concerns — operating the framework sustainably over real projects and real time:**

- **D. Cost / budget governance.** Fan-out across many components × sub-agents × self-heal retries can be expensive and unbounded. The orchestrator needs spend tracking, budget ceilings, and a degradation policy.
- **E. Incremental re-generation.** Changes (mid-project iteration and post-delivery) currently imply re-running the pipeline. With the component graph and per-component traceability, a change can re-run **only affected components** — making ROME usable for ongoing maintenance, not just one-shot builds.
- **F. Domain-expert knowledge injection.** The `Experts/` library (Flutter, Parse Server, analysis/design patterns) is rich but unwired — documentation sitting beside the framework, not loaded into the sub-agents that need it.
- **G. Security as a cross-cutting concern.** Security skills exist but are scattered and incidental. Security should be an explicit, enforced concern with gate criteria, not a by-product.

---

## Part D — Cost / Budget Governance

### D.1 Problem

The orchestrator can spawn many sub-agents (one per component, ×self-heal iterations, ×retries). Nothing tracks or bounds cost. A self-healing run on a large component graph can consume unbounded tokens/time with no visibility or ceiling.

### D.2 Solution

The orchestrator tracks spend in `state.json` (PROP-035 §6a) and enforces a budget:

- **Track:** tokens + wall-clock, per phase and per component, accumulated across the run.
- **Ceiling:** optional `budget: { total, per_phase, per_component }`. As a ceiling is approached, the orchestrator applies a **degradation policy** rather than silently overrunning.
- **Degradation policy (in order):** reduce parallelism → reduce self-heal iterations → escalate to sponsor (continue / raise budget / accept reduced scope / abort). No silent budget overrun (EP-4).
- **Report:** spend surfaced in status reports alongside progress/coverage, so cost is observable throughout, not discovered after.

### D.3 Configuration

`budget: { total: tokens|null, on_exhaustion: escalate|abort, degrade: bool }`. `null` total = no ceiling (current behavior). Defaults: degrade + escalate.

---

## Part E — Incremental Re-Generation

### E.1 Problem

Roma has change-request skills (`/create-change-request`, `/analyze-change-impact`, `/rollback-change`) but the underlying model re-runs phases wholesale. Real use — iteration during a build, and changes after delivery — needs **targeted** re-execution, or the framework is a one-shot generator, not a maintenance tool.

### E.2 Solution — impact-scoped re-runs

Leverages the component graph (PROP-038), contracts (PROP-039), and per-component traceability:

1. **Change request → impact analysis.** A change targets requirements/contracts/components. `/analyze-change-impact` walks the traceability chain + component DAG to compute the **affected set**: directly changed components plus dependents (via `dependsOn` and contract references).
2. **Re-run only the affected set.** The orchestrator re-executes the relevant phases **for affected components only**, honoring the DAG. Unaffected components and their verified artifacts are untouched.
3. **Contract-aware propagation.** If a change alters a contract (PROP-039 Part C), all components consuming that contract enter the affected set and re-verify against the new contract.
4. **Re-verify + re-gate.** Affected components re-run the build/verify/self-heal loop (PROP-039 Part A) and the relevant gates. Traceability/verification records update incrementally.

### E.3 Brownfield convergence

This is the same machinery PROP-036 uses for brownfield intent: derive as-is → compute delta → regenerate the delta. Incremental re-generation and brownfield refinement are one mechanism, applied to internal vs. external change.

### E.4 Principle fit

Strengthens EP-1 (change traced through the graph), EP-4 (impact is explicit and recorded), EP-7 (no wasteful full re-runs).

---

## Part F — Domain-Expert Knowledge Injection

### F.1 Problem

`Experts/` holds structured domain knowledge — `expert_flutter/` (CORE, PATTERNS, INTEGRATIONS, UI_UX, PLATFORM_SPECIFIC, DEPLOYMENT…), `expert_parse_server/`, `analysis_design_stages/`. It encodes hard-won conventions (approved libraries, anti-patterns, naming, architecture patterns). Today it is inert: not loaded into the sub-agents whose output it should govern.

### F.2 Solution — expert packs scoped to capability + tech stack

1. **Expert packs.** Treat each `Experts/<domain>/` set as a named **knowledge pack** with a manifest declaring applicability (tech stack, capability, phase). E.g. `expert_flutter` applies to `generate-ui` instances when `platform = flutter`.
2. **Orchestrator-driven injection.** When instancing a capability (PROP-038), the orchestrator selects expert packs matching the component's `type`/`platform`/tech-stack (`tech-stack.yaml`) and loads them into that sub-agent's context as scoped reference.
3. **Phase-appropriate.** `analysis_design_stages` packs load into P2/P3 sub-agents (decomposition, design); implementation packs load into P5 generators.
4. **Enforced, not advisory.** Expert anti-pattern rules (e.g. Flutter approved-libraries / anti-patterns) become **gate criteria** Sarah/Clara check — generated code must conform to the loaded expert conventions.

### F.3 Extensibility

New domains are added by dropping an `Experts/<domain>/` pack with a manifest — no framework change. This makes ROME's output quality grow with the knowledge library (EP-6 specialization, EP-3 quality).

---

## Part G — Security as a Cross-Cutting Concern

### G.1 Problem

Security skills exist but are scattered and incidental: `reena/parse-server-security`, `reena/generate-authentication-middleware`, `lucien/configure-environment`. There is no framework-level guarantee that generated apps handle auth, secrets, and common vulnerabilities — security is a by-product of whichever skill happens to run.

### G.2 Solution — explicit, enforced security concern

1. **Security standard (framework doc).** A neutral security standard (consumed by all relevant capabilities): secrets handling (never hard-coded), authn/authz expectations, input validation, dependency/vulnerability posture, transport security. Aligns with the PROP-034 framework-standards approach.
2. **Security gate criteria (Sarah).** GATE-P4 (config/secrets) and GATE-P5 (code) include security checks: no secrets in source, auth present where required, input validation on external boundaries, no known-vulnerable dependencies.
3. **Security review pass (optional dedicated role/skill).** For higher-assurance projects, an electable security-review sub-agent runs an adversarial pass before delivery (mirrors the optional-phase pattern of PROP-037). Electable via config/ICR.
4. **Secrets handling at config (Lucien, P4).** Secrets are provisioned as configuration/environment (extending `configure-environment`), never generated into source — enforced at GATE-P4.

### G.3 Principle fit

EP-3 (security is a measured quality, not assumed), EP-5 (independent security review separate from producers), EP-1 (security findings traced and recorded).

---

## Principle Alignment (summary)

| Principle | Effect |
|-----------|--------|
| EP-1 Traceability | Spend, change impact, expert conformance, security findings all recorded/traced. **Enhanced.** |
| EP-3 Quality control | Expert conventions + security become enforced gate criteria. **Enhanced.** |
| EP-4 Progress monitoring | Cost observable; change impact explicit; no silent overrun. **Enhanced.** |
| EP-6 Specialization | Expert packs deepen per-capability expertise. **Enhanced.** |
| EP-7 Optimal operation | Budget control + incremental re-gen avoid waste. **Enhanced.** |

---

## Migration Path

- **D1** — Track spend in `state.json`; report it. **D2** — Add budget ceilings + degradation policy.
- **E1** — Extend `/analyze-change-impact` to compute the affected set from graph + traceability. **E2** — Orchestrator re-runs affected components only; contract-aware propagation.
- **F1** — Add manifests to `Experts/` packs (applicability metadata). **F2** — Orchestrator injects matching packs at instancing. **F3** — Promote expert anti-pattern rules to gate criteria.
- **G1** — Author the security standard doc. **G2** — Add security gate criteria to GATE-P4/P5. **G3** — Add the optional security-review pass.

All steps are additive and independently shippable; none breaks the 035..039 baseline.

---

## Risks

| Risk | Mitigation |
|------|------------|
| Budget ceiling aborts viable runs prematurely | Degrade-before-abort; escalate to sponsor with options. |
| Incremental re-gen misses a true dependency | Affected-set computed from explicit graph + contract refs; conservative closure; full re-run available as fallback. |
| Expert packs conflict or go stale | Manifest applicability + versioning; Clara flags conflicting conventions. |
| Expert rules too rigid for a project | Packs electable/overridable per project; conflicts surfaced, not silently enforced. |
| Security gate produces false confidence | Gate criteria are explicit and auditable; optional adversarial review for high-assurance; security standard versioned. |

---

## Recommendation

1. Add **budget tracking + ceiling with degrade-before-abort** to the orchestrator.
2. Implement **incremental, impact-scoped re-generation** — unifying iteration and brownfield change on one mechanism.
3. Wire the **`Experts/` library** into sub-agents as capability/stack-scoped packs, with anti-pattern rules promoted to gate criteria.
4. Make **security an explicit cross-cutting concern** with a standard doc, gate criteria, and an optional review pass.
5. Sequence by value: F (immediate output-quality gain from existing assets) and D (cost safety) first; E and G follow.

---

## Open Questions for Sponsor

1. Default budget behavior — ceiling on by default, or opt-in? Recommend opt-in ceiling, tracking always on.
2. Conservative vs. minimal affected-set for incremental re-gen? Recommend conservative (correctness over cost) with full-rerun fallback.
3. Is the security-review pass mandatory for any project class, or always electable? Recommend electable, with a recommended-on default for externally-facing apps.

---

## Revision History

| Version | Date | Summary |
|---------|------|---------|
| 1.0 | 2026-06-18 | Initial draft — Tier-2 concerns: budget governance, incremental impact-scoped re-generation, `Experts/` knowledge injection, and security as an enforced cross-cutting concern. |
