---
name: aordl-validation
description: Automated AORDL validation using validate-aordl.js. Use when creating REQ-###.yaml files or preparing for GATE-P1. Run automated checks, generate BDD scenarios, fix violations.
allowed-tools: [Bash, Read, Write, Glob]
---

# AORDL Validation Skill

## Purpose

Talib's P1 automation tool: validate AORDL requirements using automated utilities. Catch issues early before GATE-P1 submission.

## When to Use

- **Creating REQ-###.yaml**: Run validate-aordl.js after creating each requirement
- **Before GATE-P1**: Run batch validation on all requirements
- **Generating BDD scenarios**: Use transform-aordl-to-bdd.js for test scenarios

## Quick Reference

### AORDL 13 Required Fields

```yaml
ID: REQ-###
Actor: [SpecificRole]
Intent: [verb] [object]
Preconditions: [...]
Conditions: [...]
Postconditions: [...]
Outcomes: [...]
Invariants: [...]
NonFunctional: {...}
Errors: [...]
ScopeBoundary: {...}
OpenQuestions: [...]
CopilotMode: STRICT|GUIDED|PERMISSIVE
```

---

## Automated Validation Utilities

### Utility 1: validate-aordl.js - Automated AORDL Validator

**Purpose**: Validates all 13 required fields, detects anti-patterns, checks approved verbs

**Usage**:
```bash
# Validate single requirement
node ROME/skills/tier-1/validate-aordl.js \
  --requirement-file ARTIFACTS/dev/requirements/REQ-001.yaml \
  --mode STRICT \
  --output-report ARTIFACTS/dev/requirements/REQ-001-validation.json
```

**Output Example**:
```json
{
  "requirement_id": "REQ-001",
  "requirement_file": "ARTIFACTS/dev/requirements/REQ-001.yaml",
  "mode": "STRICT",
  "status": "PASS",
  "violations": [],
  "warnings": [
    {
      "field": "NonFunctional.Performance",
      "message": "Performance requirements not quantified",
      "severity": "MEDIUM"
    }
  ],
  "timestamp": "2025-12-29T20:00:00.000Z"
}
```

**What it validates**:
- ✅ All 13 required fields present
- ✅ Actor specificity (no "User", "Admin", "System")
- ✅ Intent atomicity (no compound intents with "and")
- ✅ Anti-pattern detection (UI language: "click", "button", "screen")
- ✅ Technical jargon detection (API, POST, database, HTTP)
- ✅ Approved verbs vs ambiguous verbs
- ✅ OpenQuestions resolution status

**Batch validation**:
```bash
# Validate all requirements in directory
for file in ARTIFACTS/dev/requirements/REQ-*.yaml; do
  echo "Validating $(basename $file)..."
  node ROME/skills/tier-1/validate-aordl.js \
    --requirement-file "$file" \
    --mode STRICT
done
```

---

### Utility 2: transform-aordl-to-bdd.js - BDD Scenario Generator

**Purpose**: Transforms AORDL requirements to BDD Gherkin format (Given-When-Then)

**Usage**:
```bash
# Generate BDD scenario for single requirement
node ROME/skills/tier-1/transform-aordl-to-bdd.js \
  --requirement-file ARTIFACTS/dev/requirements/REQ-001.yaml \
  --output-file ARTIFACTS/03-bdd-features/REQ-001.feature
```

**Output Example** (REQ-001.feature):
```gherkin
Feature: Create Project (REQ-001)
  As a ProjectManager
  I want to create project
  So that I can organize work

  Scenario: Successfully create project
    Given ProjectManager is authenticated
    And ProjectManager has "create_project" permission
    When ProjectManager creates project with name "New Project"
    Then Project exists with status ACTIVE
    And ProjectManager is assigned as owner
    And Audit log entry created

  Scenario: Project name already exists
    Given ProjectManager is authenticated
    When ProjectManager creates project with existing name
    Then Error "ProjectNameAlreadyExists" is returned
    And Message "A project with this name already exists. Please choose a different name." is shown
```

**What it generates**:
- ✅ Feature description from Actor + Intent
- ✅ Happy path scenario from Preconditions → Outcomes
- ✅ Error scenarios from Errors field
- ✅ Proper Gherkin syntax (Given-When-Then)

**Batch generation**:
```bash
# Generate BDD scenarios for all requirements
mkdir -p ARTIFACTS/03-bdd-features
for file in ARTIFACTS/dev/requirements/REQ-*.yaml; do
  base=$(basename "$file" .yaml)
  echo "Generating BDD for ${base}..."
  node ROME/skills/tier-1/transform-aordl-to-bdd.js \
    --requirement-file "$file" \
    --output-file "ARTIFACTS/03-bdd-features/${base}.feature"
done
```

---

### GATE-P1 Automated Workflow

**Complete automation for GATE-P1 preparation**:

```bash
#!/bin/bash
# Step 1: Validate all requirements
echo "=== Step 1: Validating all requirements ==="
FAILED=0
for file in ARTIFACTS/dev/requirements/REQ-*.yaml; do
  result=$(node ROME/skills/tier-1/validate-aordl.js \
    --requirement-file "$file" \
    --mode STRICT)

  status=$(echo "$result" | grep -o '"status": "[^"]*"' | cut -d'"' -f4)

  if [ "$status" != "PASS" ]; then
    echo "❌ $(basename $file): FAILED"
    FAILED=$((FAILED + 1))
  else
    echo "✅ $(basename $file): PASSED"
  fi
done

if [ $FAILED -gt 0 ]; then
  echo ""
  echo "❌ GATE-P1 BLOCKED: $FAILED requirements failed validation"
  exit 1
fi

# Step 2: Generate BDD scenarios (GATE-P1 deliverable)
echo ""
echo "=== Step 2: Generating BDD scenarios ==="
mkdir -p ARTIFACTS/03-bdd-features
for file in ARTIFACTS/dev/requirements/REQ-*.yaml; do
  base=$(basename "$file" .yaml)
  node ROME/skills/tier-1/transform-aordl-to-bdd.js \
    --requirement-file "$file" \
    --output-file "ARTIFACTS/03-bdd-features/${base}.feature"
  echo "Generated: ${base}.feature"
done

echo ""
echo "✅ GATE-P1 preparation complete!"
echo "   - All requirements validated: PASS"
echo "   - BDD scenarios generated: $(ls ARTIFACTS/03-bdd-features/*.feature | wc -l) files"
```

---

## Talib's P1 Workflow

**Key Principle**: Talib runs validate-aordl.js during AORDL creation. Sarah reviews validation reports at GATE-P1.

### Step 1: Create REQ-###.yaml

Transform raw user input into AORDL format with all 13 required fields.

### Step 2: Automated Validation

```bash
# Validate during creation (catch issues early)
node ROME/skills/tier-1/validate-aordl.js \
  --requirement-file ARTIFACTS/dev/requirements/REQ-001.yaml \
  --mode STRICT \
  --output-report ARTIFACTS/dev/requirements/REQ-001-validation.json
```

### Step 3: Fix Violations (if any)

Review validation report, fix issues, re-run validation until PASS.

### Step 4: Submit to GATE-P1

Sarah reviews:
- All validation reports (REQ-###-validation.json)
- Requirements catalog completeness
- Coverage (actors, CRUD operations)

**Authoritative GATE-P1 checklist**: See Sarah's quality-gate-validation skill

---

## Common Validation Fixes

### Fix 1: Generic Actor

```yaml
# Before
Actor: User  # ❌

# After
Actor: ProjectManager  # ✅
```

### Fix 2: Compound Intent

```yaml
# Before
Intent: create and update project  # ❌

# After (split into two requirements)
# REQ-001
Intent: create project  # ✅

# REQ-002
Intent: update project  # ✅
```

### Fix 3: UI Language

```yaml
# Before
Intent: click submit button to create project  # ❌

# After
Intent: create project  # ✅
```

### Fix 4: Open Questions

```yaml
# Before
OpenQuestions:
  - question: "Should name be case-sensitive?"
    status: OPEN  # ❌ GATE-P1 BLOCKER

# After (ask sponsor, then update)
OpenQuestions:
  - question: "Should name be case-sensitive?"
    status: RESOLVED  # ✅
    decision: "No, case-insensitive"
    decisionDate: "2025-12-29T10:00:00Z"
    decisionBy: "Sponsor"
```

---

**Skill Version**: 2.0.0
**Last Updated**: 2025-12-29
**Robot**: Talib only
**Priority**: CRITICAL
**Manual Validation Checklists**: See Sarah's quality-gate-validation skill (GATE-P1 section)
