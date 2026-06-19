# transform-aordl-to-bdd Skill

| Field | Value |
|-------|-------|
| **Skill UID** | rome-p1-aordl:transform-aordl-to-bdd |
| **Version** | 1.0.0 |
| **Date** | 2026-01-07T00:00:00Z |
| **Status** | Active |
| **Document Type** | Skill Definition |
| **Plugin** | rome-p1-aordl |
| **Tier** | 1 (Atomic) |
| **Phase** | P01-aordl |

---

## Purpose

Transforms AORDL requirement to BDD Gherkin format (Given-When-Then).

## Generates

- Feature description from Actor + Intent
- Happy path scenario from Preconditions → Action → Outcomes
- Error scenarios from Errors field
- Scenario Outlines with Examples (optional)

## Usage

```bash
/transform-aordl-to-bdd --requirement-file REQ-001.yaml --output-file REQ-001-bdd.feature
```

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| requirement_file | string | Yes | Path to REQ-###.yaml file |
| output_file | string | No | Path to save .feature file |
| include_error_scenarios | boolean | No | Generate error scenarios (default: true) |
| include_examples | boolean | No | Generate scenario outlines (default: true) |

## Output Format

```gherkin
Feature: Create project
  As a ProjectManager
  I want to create project
  So that project is created and visible in project list

  Scenario: Successfully create project
    Given the user is authenticated
    And the user has ProjectManager role
    When I create the project
    Then project is created and visible in project list
    And project status is ACTIVE

  Scenario: Error: Project name already exists
    Given the user is authenticated
    And the user has ProjectManager role
    And project name already exists
    When I create the project
    Then Project name must be unique
```

## Returns

```json
{
  "feature_name": "Create project",
  "scenarios": [...],
  "gherkin_content": "...",
  "output_file": "REQ-001-bdd.feature"
}
```

## Implementation

See `/transform-aordl-to-bdd.js` in rome-core library for implementation details.

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 1.0.0 | 2026-01-07T00:00:00Z | Initial skill definition for rome-p1-aordl plugin |
