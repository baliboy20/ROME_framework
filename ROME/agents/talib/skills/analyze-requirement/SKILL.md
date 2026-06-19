# analyze-requirement Skill

| Field | Value |
|-------|-------|
| **Skill UID** | rome-p2-analysis:analyze-requirement |
| **Version** | 1.0.0 |
| **Date** | 2026-01-07T00:00:00Z |
| **Status** | Active |
| **Document Type** | Skill Definition |
| **Plugin** | rome-p2-analysis |
| **Tier** | 2 (Composition) |
| **Phase** | P02-analysis |

---

## Purpose

Provides comprehensive analysis of a single AORDL requirement by:
- Validating against AORDL standards
- Extracting entities and attributes
- Extracting and classifying invariants
- Deriving API endpoint design
- Calculating complexity metrics
- Generating improvement recommendations

This is a meta-skill that orchestrates other skills.

## Usage

```bash
/analyze-requirement --requirement-file REQ-001.yaml --include-recommendations
```

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| requirement_file | string | Yes | Path to REQ-###.yaml file |
| output_file | string | No | Path to save analysis report |
| output_format | string | No | json, yaml, or markdown (default: json) |
| include_recommendations | boolean | No | Generate recommendations (default: true) |

## Analysis Components

1. **Validation** - Runs /validate-aordl in STRICT mode
2. **Entity Extraction** - Identifies domain entities and relationships
3. **Invariant Classification** - Categorizes business rules
4. **API Derivation** - Maps Intent to HTTP endpoints
5. **Complexity Calculation** - Scores requirement complexity
6. **Recommendations** - Suggests improvements

## Returns

```json
{
  "metadata": {
    "analyzed_at": "2026-01-07T...",
    "execution_id": "...",
    "requirement_file": "REQ-001.yaml"
  },
  "requirement_id": "REQ-001",
  "requirement_intent": "create project",
  "validation": {...},
  "entities": {...},
  "invariants": {...},
  "api_endpoint": {...},
  "complexity": {...},
  "recommendations": [...]
}
```

## Implementation

See `/analyze-requirement.js` in rome-core library for implementation details.

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 1.0.0 | 2026-01-07T00:00:00Z | Initial skill definition for rome-p2-analysis plugin |
