# Security Standard

| Field | Value |
|-------|-------|
| **UID** | ROME-STD-SECURITY |
| **Title** | Security as a cross-cutting, enforced concern |
| **Status** | Active |
| **Created** | 2026-06-18T00:00:00Z |
| **Origin** | ROME-PROP-040 Part G |
| **Mechanical check** | `rome-core/orchestrator/security.js` (`scanForSecrets`, `gateSecurity`) |

Security is an explicit, enforced concern — not a by-product. Consumed by all
producing roles and checked at gates.

---

## 1. Requirements

| Area | Rule |
|------|------|
| **Secrets** | Never hardcoded in source. Provisioned as configuration/environment by Lucien (P4). |
| **AuthN/AuthZ** | Present wherever a requirement implies access control; least-privilege by default. |
| **Input validation** | All external boundaries validate input (API edges, untrusted data). |
| **Transport** | Secure transport for data in transit; no secrets in logs. |
| **Dependencies** | No known-vulnerable dependencies introduced. |

## 2. Mechanical gate criterion (deterministic)

**No secrets in source** is enforced mechanically at GATE-P4 (config) and GATE-P5
(code) via `security.js`:
- `scanForSecrets(text)` detects AWS keys, private-key blocks, bearer tokens,
  hardcoded passwords, API/secret-key assignments, Slack tokens.
- Placeholders / env references (`process.env`, `${...}`, `YOUR_*`, `xxxx`, `example`) are ignored.
- `gateSecurity(files)` → `conforms=false` BLOCKS the gate (PROP-040 G).

This is a hard, non-LLM check (like AORDL STRICT and executability).

## 3. Optional security-review pass

For higher-assurance projects, an electable security-review sub-agent runs an
adversarial pass before delivery (mirrors the optional-phase pattern of PROP-037).
Producer-independent (EP-5); Sarah gates on its findings. Recommended-on for
externally-facing apps.

## 4. Secrets at config (Lucien, P4)

Secrets are generated as configuration/environment templates (extending
`configure-environment`), never into source — enforced at GATE-P4 by §2.

---

## Revision History

| Version | Date | Summary |
|---------|------|---------|
| 1.0 | 2026-06-18 | Initial standard — security requirements, the mechanical no-secrets-in-source gate (security.js), optional adversarial review pass, secrets-as-config (PROP-040 Part G). |
