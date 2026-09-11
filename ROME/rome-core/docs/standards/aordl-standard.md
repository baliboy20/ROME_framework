# AORDL Standard

| Field | Value |
|-------|-------|
| **UID** | ROME-STD-AORDL |
| **Title** | AORDL (AI-Optimized Requirement Design Language) — Authoritative Standard |
| **Status** | Active |
| **Created** | 2026-06-18T00:00:00Z |
| **Origin** | ROME-PROP-034 Track A (standards extraction) + ROME-PLAN-035 Stage 1 |
| **Machine rules** | `ROME/rome-core/lib/registry/validate-aordl.yaml` |
| **Validator** | `ROME/rome-core/lib/aordl-parser/validate-aordl.js` |
| **Template** | `ROME/rome-core/templates/aordl/REQ-TEMPLATE.yaml` |

This is the single source of truth for AORDL requirement structure and validation. It is consumed by all roles that author, validate, or transform requirements. The machine-readable rule **values** live in the manifest above and MUST stay in sync with this document; the validator reads the manifest.

---

## 1. Purpose

AORDL expresses requirements as structured, business-level intents free of UI language and technical implementation detail, so they are unambiguous to both humans and LLM agents and traceable through the ROME lifecycle.

## 2. The 13 Required Fields

Every requirement file MUST contain all 13:

| # | Field | Meaning |
|---|-------|---------|
| 1 | `ID` | Unique identifier: `REQ-` plus an optional subject prefix and a number — `REQ-001` or `REQ-NOTIF11`. The prefix is optional; both forms are valid. |
| 2 | `Actor` | A single specific role (not generic "user") |
| 3 | `Intent` | `<approved-verb> <business-object>` — atomic |
| 4 | `Preconditions` | System state required before execution |
| 5 | `Conditions` | Contextual business conditions (may be empty) |
| 6 | `Postconditions` | System state after successful execution |
| 7 | `Outcomes` | Observable results from the Actor's perspective |
| 8 | `Invariants` | Domain truths that must always hold |
| 9 | `NonFunctional` | Performance/Security/Scalability/Usability/Reliability |
| 10 | `Errors` | Each with a condition and a user-facing message |
| 11 | `ScopeBoundary` | Explicit InScope / OutOfScope |
| 12 | `OpenQuestions` | Each with status OPEN/RESOLVED/DEFERRED |
| 13 | `CopilotMode` | STRICT / GUIDED / PERMISSIVE |

## 3. Approved Atomic Verbs (Intent)

`create, read, update, delete, submit, approve, reject, cancel, archive, restore, export, import, view, search`

Intent must be a single verb + business object. Compound intents (multiple approved verbs) are rejected.

## 4. Anti-Patterns (rejected)

| Class | Examples | Rule |
|-------|----------|------|
| **UI language** | click, button, screen, form, page, dropdown, checkbox, menu, dialog, popup, tab, textbox | Describe business intent, not interface actions |
| **Technical jargon** | sql, endpoint, rest, http, post, patch, backend, frontend, microservice, database, schema, query | Use domain language, not implementation |
| **Generic actors** | user, person, someone, anybody, somebody, end-user, actor, role, stakeholder, admin | Use a specific role |
| **Ambiguous verbs** | manage, handle, process, do, perform, support, enable, facilitate, maintain, deal | Use a specific atomic verb |

**Business whitelist:** terms like "api token", "JSON format", "CSV/PDF format", "delete task" legitimately contain technical-looking words and are exempted from the jargon check (see `BUSINESS_WHITELISTED_TERMS` in the validator).

## 5. Validation Modes

| Mode | Behavior |
|------|----------|
| **STRICT** | Any violation = FAIL. **Required for GATE-P1.** |
| **GUIDED** | Only ERROR-severity violations fail; warnings reported. |
| **PERMISSIVE** | Always PASS; issues reported only. |

This makes AORDL validation the **deterministic accuracy backbone at P1** (ROME-PROP-035 §3.5.3): a mechanical, non-LLM check the orchestrator/guard can rely on before advancing past requirements.

## 6. Usage

```bash
# One file, a directory of REQ-*.yaml, or several of either:
node rome-core/lib/aordl-parser/validate-aordl.js <path> [...] [--mode STRICT|GUIDED|PERMISSIVE] [--json]
```

Exit code 0 when every file passes, 1 when any fails, 2 on a usage or read
error — so the P1 gate can record the fact without parsing prose. A file that
cannot be parsed is reported as a FAIL for that file (rule `UNPARSEABLE`) and
never halts the run.

Also callable in-process: `ValidateAORDL.execute({ requirement_file, mode, output_report })`.

Regression: `node ROME/rome-core/lib/aordl-parser/validate-aordl.test.cjs` (good sample PASSes, bad sample FAILs with expected rules).

## 7. Maintenance

To change a rule: edit this standard **and** `validate-aordl.yaml` together; the test fixtures (`tests/REQ-good.yaml`, `tests/REQ-bad.yaml`) guard regressions. Do not hardcode rule values in the validator code. **ROME-GUIDE-001** (repo root, `REQUIREMENTS-AUTHORING-GUIDE.md`) quotes the verb and anti-pattern lists verbatim for external authors — update it in the same change.

---

## Revision History

| Version | Date | Summary |
|---------|------|---------|
| 1.0 | 2026-06-18 | Initial standard — extracted from REQ-TEMPLATE + validate-aordl skills (PROP-034 Track A); paired with restored rules manifest and validator regression (PLAN-035 Stage 1.x). |
| 1.1 | 2026-09-08 | §2 ID format admits an optional subject prefix (`REQ-NOTIF11` alongside `REQ-001`); pattern moved to `id_pattern` in the rules manifest, out of validator code. §6 Usage rewritten against a real CLI — the validator shipped as a library with no entry point and an uninstalled `js-yaml`, so the P1 AORDL gate had never been mechanically enforceable on any project. Raised on frob-admin increment 56 (CHG-067), where the prefixed-ID mismatch had been carried as a standing per-increment waiver since intake. |
