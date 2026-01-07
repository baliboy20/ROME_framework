# validate-aordl Skill

| Field | Value |
|-------|-------|
| **Skill UID** | rome-p1-aordl:validate-aordl |
| **Version** | 1.0.0 |
| **Date** | 2026-01-07T00:00:00Z |
| **Status** | Active |
| **Document Type** | Skill Definition |
| **Plugin** | rome-p1-aordl |
| **Tier** | 1 (Atomic) |
| **Phase** | P01-aordl |

---

## Purpose

Validates AORDL requirement files according to STRICT, GUIDED, or PERMISSIVE modes.

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

## Usage

```bash
/validate-aordl --requirement-file ARTIFACTS/dev/requirements/REQ-001.yaml --mode STRICT
```

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| requirement_file | string | Yes | Path to REQ-###.yaml file |
| mode | string | No | STRICT, GUIDED, or PERMISSIVE (default: STRICT) |
| output_report | string | No | Path to save validation report JSON |

## Modes

**STRICT:** Any violation = FAIL. Required for GATE-P1.
**GUIDED:** Only errors fail (not warnings).
**PERMISSIVE:** Always pass, just report issues.

## Returns

```json
{
  "status": "PASS|FAIL",
  "violations": [...],
  "warnings": [...],
  "report_path": "...",
  "requirement_id": "REQ-001"
}
```

## Implementation

See `/validate-aordl.js` in rome-core library for implementation details.

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 1.0.0 | 2026-01-07T00:00:00Z | Initial skill definition for rome-p1-aordl plugin |
