# /rome-p1:transform-bdd Command

| Field | Value |
|-------|-------|
| **Command UID** | rome-p1-aordl:transform-bdd |
| **Version** | 1.0.0 |
| **Date** | 2026-01-07T00:00:00Z |
| **Status** | Active |
| **Document Type** | Slash Command Definition |
| **Plugin** | rome-p1-aordl |

---

## Purpose

Transform AORDL requirement to BDD Gherkin format (Given-When-Then) for behavioral validation.

## Usage

```bash
# Transform to BDD
/rome-p1:transform-bdd --requirement-file REQ-001.yaml

# Transform with custom output
/rome-p1:transform-bdd --requirement-file REQ-001.yaml --output-file features/REQ-001.feature

# Transform without error scenarios
/rome-p1:transform-bdd --requirement-file REQ-001.yaml --include-error-scenarios false
```

## Parameters

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| requirement_file | Yes | string | Path to REQ-###.yaml file |
| output_file | No | string | Path to save .feature file |
| include_error_scenarios | No | boolean | Generate error scenarios (default: true) |
| include_examples | No | boolean | Generate scenario outlines (default: true) |

## Generated Output

Transforms AORDL fields into Gherkin scenarios:

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

## Mapping

| AORDL Field | Gherkin Element |
|-------------|-----------------|
| Actor | Feature role |
| Intent | Feature action |
| Outcomes | Feature benefit |
| Preconditions | Given steps |
| Intent | When step |
| Outcomes | Then steps |
| Errors | Error scenarios |

## Use Cases

- Verify AORDL completeness
- Generate test scenarios for QA
- Validate requirement behavior
- Prepare for acceptance testing

## Related

- Skill: rome-p1-aordl:transform-aordl-to-bdd
- Agent: rome-p1-aordl:talib
- Phase: P01-aordl

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 1.0.0 | 2026-01-07T00:00:00Z | Initial command definition for rome-p1-aordl plugin |
