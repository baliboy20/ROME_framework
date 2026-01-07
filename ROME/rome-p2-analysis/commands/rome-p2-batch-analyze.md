# /rome-p2:batch-analyze Command

| Field | Value |
|-------|-------|
| **Command UID** | rome-p2-analysis:batch-analyze |
| **Version** | 1.0.0 |
| **Date** | 2026-01-07T00:00:00Z |
| **Status** | Active |
| **Document Type** | Slash Command Definition |
| **Plugin** | rome-p2-analysis |

---

## Purpose

Analyze multiple AORDL requirements in batch, generating a consolidated analysis report with cross-requirement insights including dependencies, conflicts, and coverage analysis.

## Usage

```bash
# Analyze all requirements in directory
/rome-p2:batch-analyze --requirements-dir ARTIFACTS/dev/requirements

# Batch analyze with custom output
/rome-p2:batch-analyze --requirements-dir ARTIFACTS/dev/requirements --output-file batch-analysis.json

# Batch analyze without cross-analysis
/rome-p2:batch-analyze --requirements-dir ARTIFACTS/dev/requirements --include-cross-analysis false
```

## Parameters

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| requirements_dir | Yes | string | Directory containing REQ-###.yaml files |
| output_file | No | string | Path to save consolidated report |
| include_cross_analysis | No | boolean | Analyze dependencies (default: true) |

## Analysis Components

1. **Individual Analysis** - Runs /analyze-requirement on each REQ-###.yaml
2. **Cross-Requirement Analysis** - Identifies dependencies and conflicts
3. **Coverage Analysis** - Checks actor coverage, CRUD completeness
4. **Complexity Distribution** - Overall complexity metrics
5. **Consolidated Recommendations** - System-wide improvements

## Output Format

```json
{
  "metadata": {
    "analyzed_at": "2026-01-07T...",
    "requirements_count": 15,
    "requirements_dir": "ARTIFACTS/dev/requirements"
  },
  "individual_analyses": [
    {
      "requirement_id": "REQ-001",
      "complexity": 15,
      "entities": ["Project"],
      "api_endpoint": "POST /projects"
    },
    ...
  ],
  "cross_analysis": {
    "dependencies": [
      {
        "from": "REQ-002",
        "to": "REQ-001",
        "type": "requires",
        "reason": "View project requires project to exist"
      }
    ],
    "conflicts": [],
    "actor_coverage": {
      "ProjectManager": 5,
      "TeamMember": 10
    }
  },
  "summary": {
    "total_complexity_score": 245,
    "avg_complexity": 16.3,
    "high_complexity_requirements": ["REQ-005", "REQ-012"]
  },
  "recommendations": [
    "Consider decomposing REQ-005 (complexity: 28)",
    "Add CRUD completeness for Project entity"
  ]
}
```

## Use Cases

- Identify requirement dependencies before design
- Detect conflicting requirements early
- Assess overall system complexity
- Verify actor coverage completeness
- Plan vertical slices for MVP

## Related

- Skill: rome-p2-analysis:batch-analyze-requirements
- Agent: rome-p2-analysis:talib
- Phase: P02-analysis

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 1.0.0 | 2026-01-07T00:00:00Z | Initial command definition for rome-p2-analysis plugin |
