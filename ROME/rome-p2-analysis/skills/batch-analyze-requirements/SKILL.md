# batch-analyze-requirements Skill

| Field | Value |
|-------|-------|
| **Skill UID** | rome-p2-analysis:batch-analyze-requirements |
| **Version** | 1.0.0 |
| **Date** | 2026-01-07T00:00:00Z |
| **Status** | Active |
| **Document Type** | Skill Definition |
| **Plugin** | rome-p2-analysis |
| **Tier** | 2 (Composition) |
| **Phase** | P02-analysis |

---

## Purpose

Analyzes multiple AORDL requirements in batch, generating a consolidated analysis report with cross-requirement insights.

## Usage

```bash
/batch-analyze-requirements --requirements-dir ARTIFACTS/dev/requirements --output-file batch-analysis.json
```

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| requirements_dir | string | Yes | Directory containing REQ-###.yaml files |
| output_file | string | No | Path to save consolidated report |
| include_cross_analysis | boolean | No | Analyze dependencies (default: true) |

## Analysis Components

1. **Individual Analysis** - Runs /analyze-requirement on each REQ-###.yaml
2. **Cross-Requirement Analysis** - Identifies dependencies and conflicts
3. **Coverage Analysis** - Checks actor coverage, CRUD completeness
4. **Complexity Distribution** - Overall complexity metrics
5. **Consolidated Recommendations** - System-wide improvements

## Returns

```json
{
  "metadata": {
    "analyzed_at": "2026-01-07T...",
    "requirements_count": 15,
    "requirements_dir": "ARTIFACTS/dev/requirements"
  },
  "individual_analyses": [...],
  "cross_analysis": {
    "dependencies": [...],
    "conflicts": [...],
    "actor_coverage": {...}
  },
  "summary": {
    "total_complexity_score": 245,
    "avg_complexity": 16.3,
    "high_complexity_requirements": [...]
  },
  "recommendations": [...]
}
```

## Implementation

See `/batch-analyze-requirements.js` in rome-core library for implementation details.

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 1.0.0 | 2026-01-07T00:00:00Z | Initial skill definition for rome-p2-analysis plugin |
