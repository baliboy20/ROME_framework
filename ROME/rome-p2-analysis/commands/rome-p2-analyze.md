# /rome-p2:analyze Command

| Field | Value |
|-------|-------|
| **Command UID** | rome-p2-analysis:analyze |
| **Version** | 1.0.0 |
| **Date** | 2026-01-07T00:00:00Z |
| **Status** | Active |
| **Document Type** | Slash Command Definition |
| **Plugin** | rome-p2-analysis |

---

## Purpose

Perform comprehensive analysis of a single AORDL requirement, extracting entities, invariants, API endpoints, complexity metrics, and generating recommendations.

## Usage

```bash
# Analyze single requirement
/rome-p2:analyze --requirement-file REQ-001.yaml

# Analyze with recommendations
/rome-p2:analyze --requirement-file REQ-001.yaml --include-recommendations

# Analyze with custom output
/rome-p2:analyze --requirement-file REQ-001.yaml --output-file analysis/REQ-001-analysis.json

# Output as markdown
/rome-p2:analyze --requirement-file REQ-001.yaml --output-format markdown
```

## Parameters

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| requirement_file | Yes | string | Path to REQ-###.yaml file |
| output_file | No | string | Path to save analysis report |
| output_format | No | string | json, yaml, or markdown (default: json) |
| include_recommendations | No | boolean | Generate recommendations (default: true) |

## Analysis Components

1. **Validation** - Runs AORDL validation in STRICT mode
2. **Entity Extraction** - Identifies domain entities and relationships
3. **Invariant Classification** - Categorizes business rules
4. **API Derivation** - Maps Intent to HTTP endpoints
5. **Complexity Calculation** - Scores requirement complexity
6. **Recommendations** - Suggests improvements

## Output Format

```json
{
  "metadata": {
    "analyzed_at": "2026-01-07T...",
    "execution_id": "...",
    "requirement_file": "REQ-001.yaml"
  },
  "requirement_id": "REQ-001",
  "requirement_intent": "create project",
  "validation": {
    "status": "PASS",
    "mode": "STRICT",
    "violations": []
  },
  "entities": {
    "primary": "Project",
    "attributes": ["name", "status", "ownerId"],
    "relationships": [...]
  },
  "invariants": {
    "uniqueness": ["Project.name"],
    "referential_integrity": [...]
  },
  "api_endpoint": {
    "method": "POST",
    "path": "/projects",
    "request_body": {...},
    "response_codes": [201, 400]
  },
  "complexity": {
    "score": 15,
    "factors": {...}
  },
  "recommendations": [
    "Consider splitting into atomic requirements",
    "Add performance NFR for list operations"
  ]
}
```

## Related

- Skill: rome-p2-analysis:analyze-requirement
- Agent: rome-p2-analysis:talib
- Phase: P02-analysis

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 1.0.0 | 2026-01-07T00:00:00Z | Initial command definition for rome-p2-analysis plugin |
