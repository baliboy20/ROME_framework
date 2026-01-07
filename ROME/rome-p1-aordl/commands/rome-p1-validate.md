# /rome-p1:validate Command

| Field | Value |
|-------|-------|
| **Command UID** | rome-p1-aordl:validate |
| **Version** | 1.0.0 |
| **Date** | 2026-01-07T00:00:00Z |
| **Status** | Active |
| **Document Type** | Slash Command Definition |
| **Plugin** | rome-p1-aordl |

---

## Purpose

Validate AORDL requirement files according to STRICT, GUIDED, or PERMISSIVE modes.

## Usage

```bash
# Validate single requirement (STRICT mode)
/rome-p1:validate --requirement-file REQ-001.yaml

# Validate with specific mode
/rome-p1:validate --requirement-file REQ-001.yaml --mode GUIDED

# Validate entire catalog
/rome-p1:validate --catalog-file requirements-catalog.md --mode STRICT
```

## Parameters

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| requirement_file | Conditional | string | Path to single REQ-###.yaml file |
| catalog_file | Conditional | string | Path to requirements catalog |
| mode | No | string | STRICT, GUIDED, or PERMISSIVE (default: STRICT) |
| output_report | No | string | Path to save validation report |

**Note:** Either `requirement_file` or `catalog_file` must be provided.

## Validation Checks

- All 13 required fields present
- ID format (REQ-###)
- Actor is specific role (not generic "user")
- Intent uses approved verb + business object
- No UI language (click, button, screen)
- No technical jargon (POST, SQL, endpoint)
- No compound intents
- Invariants are domain truths
- Errors have condition and message
- Outcomes are observable

## Modes

**STRICT:** Any violation = FAIL. Required for GATE-P1.
**GUIDED:** Only errors fail (not warnings).
**PERMISSIVE:** Always pass, just report issues.

## Related

- Skill: rome-p1-aordl:validate-aordl
- Agent: rome-p1-aordl:talib
- Phase: P01-aordl

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 1.0.0 | 2026-01-07T00:00:00Z | Initial command definition for rome-p1-aordl plugin |
