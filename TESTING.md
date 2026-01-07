# ROME Framework - Testing and Validation Guide

Document UID: ROME-TEST-001
Version: 1.0.0
Status: Complete
Date: 2026-01-07

## Overview

This document provides comprehensive testing and validation procedures for the ROME Framework phase-based plugin architecture. It covers plugin installation verification, functional testing, integration testing, and end-to-end workflow validation.

## Testing Levels

### 1. Plugin Installation Verification
### 2. Agent Activation Testing
### 3. Skill Execution Testing
### 4. Command Invocation Testing
### 5. Phase Transition Testing
### 6. Integration Testing
### 7. End-to-End Workflow Testing

---

## 1. Plugin Installation Verification

### Objective
Verify all plugins are correctly installed and recognized by Claude Code.

### Prerequisites
- Claude Code CLI installed
- Node.js >= 18.0.0

### Test Procedure

#### Test 1.1: Verify rome-core Installation
```bash
claude-plugin list | grep rome-core
```
**Expected Output:**
```
rome-core@1.0.0 (installed)
```

#### Test 1.2: Verify All Phase Plugins
```bash
claude-plugin list | grep rome-
```
**Expected Output:**
```
rome-core@1.0.0 (installed)
rome-p0-bootup@1.0.0 (installed)
rome-p1-aordl@1.0.0 (installed)
rome-p2-analysis@1.0.0 (installed)
rome-p3-design@1.0.0 (installed)
rome-p4-config@1.0.0 (installed)
rome-p5-generation@1.0.0 (installed)
rome-qa@1.0.0 (installed)
rome-full@1.0.0 (installed)
```

#### Test 1.3: Verify Plugin Manifests
```bash
# Check rome-core manifest
cat ~/.claude/plugins/rome-core/.claude-plugin/plugin.json | jq '.version'

# Check rome-p1-aordl manifest
cat ~/.claude/plugins/rome-p1-aordl/.claude-plugin/plugin.json | jq '.provides.agents'
```
**Expected Output:**
```
"1.0.0"
["talib"]
```

#### Test 1.4: Verify Dependencies
```bash
# Verify rome-p1-aordl depends on rome-core
cat ~/.claude/plugins/rome-p1-aordl/.claude-plugin/plugin.json | jq '.dependencies["rome-core"]'
```
**Expected Output:**
```
"^1.0.0"
```

### Validation Criteria
- [ ] All 9 plugins appear in `claude-plugin list`
- [ ] All plugin manifests (.claude-plugin/plugin.json) are valid JSON
- [ ] Dependency chains are correctly declared
- [ ] Version numbers are consistent (1.0.0)

---

## 2. Agent Activation Testing

### Objective
Verify all agents are properly defined and can be activated by Claude Code.

### Test Procedure

#### Test 2.1: Verify Agent Definitions Exist
```bash
# Verify all agent definition files exist
test -f ~/.claude/plugins/rome-core/agents/roma/AGENT.md && echo "Roma: OK"
test -f ~/.claude/plugins/rome-p0-bootup/agents/bootstrap/AGENT.md && echo "Bootstrap: OK"
test -f ~/.claude/plugins/rome-p1-aordl/agents/talib/AGENT.md && echo "Talib: OK"
test -f ~/.claude/plugins/rome-p3-design/agents/pma/AGENT.md && echo "PMA: OK"
test -f ~/.claude/plugins/rome-p3-design/agents/clara/AGENT.md && echo "Clara: OK"
test -f ~/.claude/plugins/rome-p4-config/agents/lucien/AGENT.md && echo "Lucien: OK"
test -f ~/.claude/plugins/rome-p5-generation/agents/ashok/AGENT.md && echo "Ashok: OK"
test -f ~/.claude/plugins/rome-p5-generation/agents/reena/AGENT.md && echo "Reena: OK"
test -f ~/.claude/plugins/rome-p5-generation/agents/charlie/AGENT.md && echo "Charlie: OK"
test -f ~/.claude/plugins/rome-qa/agents/sarah/AGENT.md && echo "Sarah: OK"
```

#### Test 2.2: Validate Agent Metadata
```bash
# Check agent metadata structure
head -20 ~/.claude/plugins/rome-p1-aordl/agents/talib/AGENT.md
```
**Expected Content:**
- Agent Name
- Version
- Phase
- Status
- Role Definition
- Responsibilities

#### Test 2.3: Agent Activation in Claude Code
Start a Claude Code session and test agent activation:

```
User: "I need help with AORDL requirements. Can you activate Talib?"
```
**Expected Behavior:** Talib agent should be activated with P1 context.

### Validation Criteria
- [ ] All 10 agent AGENT.md files exist
- [ ] Agent metadata includes required fields (name, version, phase, role)
- [ ] Agents can be activated via natural language requests
- [ ] Agent context loads correctly (visible in Claude response)

---

## 3. Skill Execution Testing

### Objective
Verify all skills are properly defined and can be executed.

### Test Procedure

#### Test 3.1: Verify Skill Definitions Exist
```bash
# Count skill files per plugin
find ~/.claude/plugins/rome-p1-aordl/skills -name "SKILL.md" | wc -l  # Expected: 3
find ~/.claude/plugins/rome-p2-analysis/skills -name "SKILL.md" | wc -l  # Expected: 3
find ~/.claude/plugins/rome-p3-design/skills -name "SKILL.md" | wc -l  # Expected: 12
find ~/.claude/plugins/rome-p4-config/skills -name "SKILL.md" | wc -l  # Expected: 8
find ~/.claude/plugins/rome-p5-generation/skills -name "SKILL.md" | wc -l  # Expected: 8
find ~/.claude/plugins/rome-qa/skills -name "SKILL.md" | wc -l  # Expected: 6
```

#### Test 3.2: Validate Skill Metadata
```bash
# Check skill metadata structure
head -30 ~/.claude/plugins/rome-p1-aordl/skills/validate-aordl/SKILL.md
```
**Expected Content:**
- Skill Name
- Version
- Phase
- Agent
- Status
- Purpose
- Inputs
- Outputs
- Execution Steps

#### Test 3.3: Test Skill Invocation (P1: validate-aordl)

**Setup:**
```bash
# Create test AORDL requirement
mkdir -p /tmp/rome-test/_requirements/aordl
cat > /tmp/rome-test/_requirements/aordl/REQ-TEST-001.yaml <<EOF
requirement_id: REQ-TEST-001
title: Test Requirement
version: 1.0.0
status: draft
actor: test-user
action: create test data
expected_outcome: Test data is created successfully
acceptance_criteria:
  - criterion: Data validation passes
    status: pending
traceability:
  upstream: []
  downstream: []
EOF
```

**Test in Claude Code:**
```
User: "Please validate the AORDL requirement at /tmp/rome-test/_requirements/aordl/REQ-TEST-001.yaml"
```

**Expected Output:** Validation report showing requirement structure is valid.

#### Test 3.4: Test Skill Invocation (P2: analyze-requirement)

**Test in Claude Code:**
```
User: "Please analyze REQ-TEST-001 and perform functional decomposition."
```

**Expected Output:**
- Functional decomposition breaking down the requirement
- Identified actors, actions, entities
- Proposed user stories
- Analysis artifacts saved to `_analysis/functional-decomposition/`

### Validation Criteria
- [ ] All 40 skill SKILL.md files exist
- [ ] Skill metadata includes required fields (name, version, phase, agent, inputs, outputs)
- [ ] Skills can be invoked via agent context
- [ ] Skill execution produces expected outputs
- [ ] Skills create expected artifacts in correct directories

---

## 4. Command Invocation Testing

### Objective
Verify all slash commands are registered and functional.

### Test Procedure

#### Test 4.1: Verify Command Definitions Exist
```bash
# Check command documentation files
test -f ~/.claude/plugins/rome-p0-bootup/commands/rome-p0-bootstrap.md && echo "P0 bootstrap: OK"
test -f ~/.claude/plugins/rome-p1-aordl/commands/rome-p1-validate.md && echo "P1 validate: OK"
test -f ~/.claude/plugins/rome-p1-aordl/commands/rome-p1-create.md && echo "P1 create: OK"
test -f ~/.claude/plugins/rome-p2-analysis/commands/rome-p2-analyze.md && echo "P2 analyze: OK"
```

#### Test 4.2: Test Slash Command: /rome-p0:bootstrap

**Test in Claude Code:**
```
/rome-p0:bootstrap
```

**Expected Output:**
```
Initializing ROME project...
Creating directory structure:
  ✓ _user_input/raw-requirements
  ✓ _requirements/aordl
  ✓ _analysis/functional-decomposition
  ✓ _analysis/user-stories
  ✓ _design/architecture
  ✓ _design/api-specs
  ✓ _design/data-models
  ✓ _config
  ✓ src/features

Project initialized successfully.
```

#### Test 4.3: Test Slash Command: /rome-p1:validate

**Test in Claude Code:**
```
/rome-p1:validate /tmp/rome-test/_requirements/aordl/REQ-TEST-001.yaml
```

**Expected Output:**
```
Validating AORDL requirement: REQ-TEST-001

✓ Structure validation: PASS
✓ Required fields: PASS
✓ Traceability format: PASS

Validation complete. No issues found.
```

#### Test 4.4: Test Slash Command: /rome-p2:batch-analyze

**Setup:**
```bash
# Create multiple AORDL requirements
cp /tmp/rome-test/_requirements/aordl/REQ-TEST-001.yaml \
   /tmp/rome-test/_requirements/aordl/REQ-TEST-002.yaml
```

**Test in Claude Code:**
```
/rome-p2:batch-analyze /tmp/rome-test/_requirements/aordl/*.yaml
```

**Expected Output:**
```
Batch analyzing 2 AORDL requirements...

Processing REQ-TEST-001... ✓
Processing REQ-TEST-002... ✓

Analysis complete. Results saved to _analysis/functional-decomposition/
```

#### Test 4.5: Test All Commands
Execute each command and verify expected behavior:

| Command | Expected Behavior |
|---------|-------------------|
| /rome-p0:bootstrap | Creates project structure |
| /rome-p1:validate | Validates AORDL requirement |
| /rome-p1:create | Interactive requirement creation |
| /rome-p1:transform-bdd | Transforms AORDL to BDD format |
| /rome-p2:analyze | Analyzes single requirement |
| /rome-p2:batch-analyze | Batch analyzes requirements |
| /rome-p2:generate-stories | Generates user stories |
| /rome-p3:design | Executes design phase |
| /rome-p3:activate-clara | Activates Clara UX agent |
| /rome-p3:architecture | Generates architecture diagrams |
| /rome-p4:configure | Configures project environment |
| /rome-p4:scaffold | Scaffolds workspace |
| /rome-p4:cicd | Sets up CI/CD pipeline |
| /rome-p5:generate-db | Generates database layer |
| /rome-p5:generate-api | Generates API layer |
| /rome-p5:generate-ui | Generates UI layer |
| /rome-qa:validate | Runs validation checks |
| /rome-qa:quality-gate | Executes quality gate |

### Validation Criteria
- [ ] All 18 slash commands are recognized by Claude Code
- [ ] Commands execute without errors
- [ ] Commands produce expected outputs
- [ ] Command documentation exists in `commands/` directory
- [ ] Commands respect phase boundaries (e.g., P3 requires P2 completion)

---

## 5. Phase Transition Testing

### Objective
Verify Roma orchestrator correctly manages phase transitions and enforces quality gates.

### Test Procedure

#### Test 5.1: Test P0 → P1 Transition

**Setup:**
```bash
/rome-p0:bootstrap
```

**Test in Claude Code:**
```
User: "I've completed project initialization. I'm ready to move to Phase 1 (AORDL)."
```

**Expected Behavior:**
- Roma validates P0 completion
- No quality gate required for P0→P1
- Roma authorizes transition
- Talib agent activated in P1 mode

#### Test 5.2: Test P1 → P2 Transition with Quality Gate

**Setup:**
```bash
# Create valid AORDL requirement
/rome-p1:create
# (Complete requirement creation)
```

**Test in Claude Code:**
```
User: "I've completed requirements capture. Ready to move to Phase 2 (Analysis)."
```

**Expected Behavior:**
- Roma invokes Sarah QA agent
- Sarah validates P1 deliverables:
  - AORDL requirements exist
  - Requirements are valid
  - Traceability is initialized
- If PASS: Roma authorizes P1→P2 transition
- If FAIL: Roma blocks transition, lists blockers
- Talib agent remains active, transitions to P2 mode

#### Test 5.3: Test P2 → P3 Transition with Quality Gate

**Setup:**
```bash
/rome-p2:batch-analyze
/rome-p2:generate-stories
```

**Test in Claude Code:**
```
User: "Analysis complete. Ready to move to Phase 3 (Design)."
```

**Expected Behavior:**
- Roma invokes Sarah QA quality-gate-p2
- Sarah validates P2 deliverables:
  - Functional decomposition complete
  - User stories generated
  - Traceability chain maintained
- If PASS: Roma authorizes P2→P3 transition
- If FAIL: Roma blocks transition
- PMA agent activated for P3

#### Test 5.4: Test Quality Gate Blocking

**Setup:**
```bash
# Intentionally skip P2 analysis
/rome-p0:bootstrap
/rome-p1:create
# (Create requirement but don't analyze)
```

**Test in Claude Code:**
```
User: "I want to skip to Phase 3 design."
```

**Expected Behavior:**
- Roma blocks transition attempt
- Sarah reports missing P2 deliverables
- Roma lists blockers:
  - No functional decomposition found
  - No user stories generated
- Roma instructs user to complete P2 first

### Validation Criteria
- [ ] Roma orchestrator controls all phase transitions
- [ ] Sarah QA agent is invoked at appropriate transitions
- [ ] Quality gates block invalid transitions
- [ ] Blocker lists are clear and actionable
- [ ] Phase transitions are logged in activity-log
- [ ] Correct agents are activated for each phase

---

## 6. Integration Testing

### Objective
Verify plugins integrate correctly and share data across phases.

### Test Procedure

#### Test 6.1: AORDL Traceability Chain (P1→P2→P3)

**Setup:**
```bash
# Create AORDL requirement
/rome-p1:create
```
**Requirement Details:**
- ID: REQ-USER-001
- Title: User Login
- Actor: User
- Action: Authenticate with credentials
- Expected Outcome: User gains access to system

**Test Steps:**
1. **P1: Create Requirement**
   ```
   /rome-p1:create
   # Create REQ-USER-001
   ```
   **Verify:** `_requirements/aordl/REQ-USER-001.yaml` exists

2. **P2: Analyze Requirement**
   ```
   /rome-p2:analyze REQ-USER-001
   ```
   **Verify:**
   - `_analysis/functional-decomposition/REQ-USER-001-analysis.md` created
   - Analysis references `upstream: [REQ-USER-001]`

3. **P2: Generate User Stories**
   ```
   /rome-p2:generate-stories REQ-USER-001
   ```
   **Verify:**
   - User stories created in `_analysis/user-stories/`
   - Stories reference `upstream: [REQ-USER-001]`

4. **P3: Design API**
   ```
   /rome-p3:design
   # "Design authentication API based on REQ-USER-001"
   ```
   **Verify:**
   - API spec created in `_design/api-specs/authentication-api.yaml`
   - API spec references `upstream: [REQ-USER-001, US-AUTH-001]`

5. **Verify Traceability Chain**
   ```
   /rome-qa:verify-traceability REQ-USER-001
   ```
   **Expected Output:**
   ```
   Traceability chain for REQ-USER-001:

   REQ-USER-001 (AORDL)
     └─> REQ-USER-001-analysis (P2 Analysis)
           └─> US-AUTH-001, US-AUTH-002 (P2 User Stories)
                 └─> authentication-api.yaml (P3 Design)

   ✓ Full traceability chain verified
   ```

#### Test 6.2: Data Dictionary Consistency (P2→P3→P5)

**Test Steps:**
1. **P2: Generate User Stories with Entities**
   ```
   /rome-p2:generate-stories
   # Stories mention entities: User, Session, Credential
   ```

2. **P3: Generate Data Dictionary**
   ```
   /rome-p3:design
   # "Generate data dictionary from user stories"
   ```
   **Verify:**
   - `_design/data-models/data-dictionary.yaml` created
   - Entities: User, Session, Credential defined
   - Attributes specified for each entity

3. **P5: Generate Database Schema**
   ```
   /rome-p5:generate-db
   ```
   **Verify:**
   - `src/features/auth/database/schema.sql` created
   - Tables correspond to data dictionary entities
   - Columns match data dictionary attributes

4. **Validate Consistency**
   ```
   /rome-qa:validate-data-dictionary
   ```
   **Expected Output:**
   ```
   ✓ All entities from data dictionary have corresponding tables
   ✓ All attributes have corresponding columns
   ✓ Data types are consistent
   ✓ Relationships are properly defined
   ```

#### Test 6.3: Architecture Diagram → Scaffolding (P3→P4)

**Test Steps:**
1. **P3: Generate Architecture Diagram**
   ```
   /rome-p3:architecture
   ```
   **Verify:**
   - `_design/architecture/system-architecture.md` created
   - Layers defined: Database, API, UI
   - Components identified

2. **P4: Scaffold Workspace**
   ```
   /rome-p4:scaffold
   ```
   **Verify:**
   - `_config/scaffolding-manifest.yaml` references architecture diagram
   - Workspace structure matches architecture layers
   - Directory structure created in `src/`

3. **Validate Alignment**
   ```
   /rome-qa:quality-gate --phase P4
   ```
   **Expected:** Sarah validates scaffolding matches architecture design

### Validation Criteria
- [ ] AORDL requirements are traceable through all phases
- [ ] Data dictionary entities are consistent from P3→P5
- [ ] Architecture diagrams inform P4 scaffolding
- [ ] Cross-phase references are maintained
- [ ] Quality gates validate cross-phase consistency

---

## 7. End-to-End Workflow Testing

### Objective
Validate complete ROME workflow from requirements to generated code.

### Test Procedure

#### Test 7.1: Simple Feature End-to-End

**Scenario:** Implement "User Registration" feature

**Steps:**

1. **P0: Bootstrap Project**
   ```
   /rome-p0:bootstrap
   ```
   **Verify:** Project structure created

2. **P1: Create AORDL Requirement**
   ```
   /rome-p1:create
   ```
   **Input:**
   - ID: REQ-REG-001
   - Title: User Registration
   - Actor: New User
   - Action: Register account with email and password
   - Expected Outcome: Account created, confirmation email sent
   - Acceptance Criteria:
     - Email validation
     - Password strength requirements
     - Duplicate email prevention

   **Verify:** `_requirements/aordl/REQ-REG-001.yaml` created

3. **P1: Validate Requirement**
   ```
   /rome-p1:validate REQ-REG-001
   ```
   **Verify:** Validation passes

4. **P2: Analyze Requirement**
   ```
   /rome-p2:analyze REQ-REG-001
   ```
   **Verify:**
   - Functional decomposition created
   - Entities identified: User, Account, Email
   - Actions identified: Validate, Create, Send

5. **P2: Generate User Stories**
   ```
   /rome-p2:generate-stories REQ-REG-001
   ```
   **Verify:** User stories created (US-REG-001, US-REG-002, etc.)

6. **P2: Quality Gate**
   ```
   /rome-qa:quality-gate --phase P2
   ```
   **Verify:** Sarah approves P2 completion

7. **P3: Design System**
   ```
   /rome-p3:design
   # "Design registration API and data models"
   ```
   **Verify:**
   - API spec: `_design/api-specs/registration-api.yaml`
   - Data dictionary: `_design/data-models/data-dictionary.yaml`
   - Architecture diagram updated

8. **P3: Quality Gate**
   ```
   /rome-qa:quality-gate --phase P3
   ```
   **Verify:** Sarah approves P3 completion

9. **P4: Configure Workspace**
   ```
   /rome-p4:configure
   /rome-p4:scaffold
   ```
   **Verify:**
   - Environment config created
   - Workspace scaffolded
   - Build system configured

10. **P5: Generate Database Layer**
    ```
    /rome-p5:generate-db
    ```
    **Verify:**
    - Schema: `src/features/registration/database/schema.sql`
    - Migrations: `src/features/registration/database/migrations/`
    - Models: `src/features/registration/database/models/`

11. **P5: Generate API Layer**
    ```
    /rome-p5:generate-api
    ```
    **Verify:**
    - Controller: `src/features/registration/api/registration-controller.js`
    - Service: `src/features/registration/services/registration-service.js`
    - Repository: `src/features/registration/repositories/user-repository.js`

12. **P5: Generate UI Layer**
    ```
    /rome-p5:generate-ui
    ```
    **Verify:**
    - Screen: `src/features/registration/ui/registration-screen.dart`
    - Components: `src/features/registration/ui/components/`

13. **QA: Final Validation**
    ```
    /rome-qa:validate
    ```
    **Verify:**
    - All traceability links intact
    - All acceptance criteria addressed
    - Code generation complete

#### Test 7.2: Multi-Feature Project

**Scenario:** Build simple task management app with 3 features

**Features:**
- User Authentication (Login/Register)
- Task Management (CRUD)
- Task Sharing (Collaboration)

**Execute full workflow for all 3 features:**
1. Create AORDL requirements for each feature
2. Progress through P1→P2→P3→P4→P5
3. Verify cross-feature dependencies (e.g., Task sharing requires Authentication)
4. Validate final codebase has all features integrated

### Validation Criteria
- [ ] Complete workflow executes without errors
- [ ] All phases produce expected deliverables
- [ ] Quality gates validate each phase
- [ ] Generated code is functional and complete
- [ ] Traceability chain is intact from REQ to code
- [ ] Cross-feature dependencies are handled correctly

---

## Test Summary Checklist

### Plugin Installation
- [ ] All 9 plugins installed
- [ ] Plugin manifests are valid
- [ ] Dependencies are correct
- [ ] Version numbers are consistent

### Agent Activation
- [ ] All 10 agents have AGENT.md definitions
- [ ] Agents can be activated
- [ ] Agent context loads correctly

### Skill Execution
- [ ] All 40 skills have SKILL.md definitions
- [ ] Skills execute without errors
- [ ] Skills produce expected outputs
- [ ] Skills create correct artifacts

### Command Invocation
- [ ] All 18 slash commands are recognized
- [ ] Commands execute correctly
- [ ] Commands produce expected results

### Phase Transitions
- [ ] Roma orchestrator controls transitions
- [ ] Quality gates are enforced
- [ ] Blockers are reported clearly
- [ ] Phase transitions are logged

### Integration
- [ ] AORDL traceability chain works P1→P2→P3→P5
- [ ] Data dictionary is consistent P3→P5
- [ ] Architecture informs scaffolding P3→P4

### End-to-End
- [ ] Simple feature workflow completes
- [ ] Multi-feature project works
- [ ] Generated code is functional
- [ ] Full traceability is maintained

---

## Known Issues

### Issue 1: MCP Server Startup Delay
**Description:** Activity-log MCP server may take 2-3 seconds to start on first invocation.
**Workaround:** Wait for server startup message before issuing commands.
**Status:** Expected behavior, not a bug.

### Issue 2: Clara Optional Activation
**Description:** Clara (UX Designer) is optional and must be explicitly activated.
**Workaround:** Use `/rome-p3:activate-clara` command when UI/UX design is needed.
**Status:** By design.

### Issue 3: Parallel Generation Dependencies
**Description:** P5 generation has dependency chain: Ashok (DB) → Reena (API) → Charlie (UI).
**Workaround:** Ensure database generation completes before API generation.
**Status:** By design, enforced by agents.

---

## Test Reporting

### Report Format

```yaml
test_report_id: ROME-TEST-<DATE>-<ID>
date: <YYYY-MM-DD>
tester: <Name>
rome_version: 1.0.0
test_level: <installation|agent|skill|command|phase|integration|e2e>

results:
  - test_id: <Test ID>
    test_name: <Test Name>
    status: <PASS|FAIL|BLOCKED>
    notes: <Details>
    blockers: <List if FAIL/BLOCKED>

summary:
  total_tests: <N>
  passed: <N>
  failed: <N>
  blocked: <N>
  pass_rate: <Percentage>

recommendations: <Actions to address failures>
```

### Example Test Report

```yaml
test_report_id: ROME-TEST-2026-01-07-001
date: 2026-01-07
tester: Agent Nu
rome_version: 1.0.0
test_level: e2e

results:
  - test_id: E2E-7.1
    test_name: Simple Feature End-to-End
    status: PASS
    notes: User Registration feature generated successfully
    blockers: null

summary:
  total_tests: 1
  passed: 1
  failed: 0
  blocked: 0
  pass_rate: 100%

recommendations: None. All tests passed.
```

---

## Automated Testing (Future)

### Planned Automation
- Plugin installation verification script
- Agent activation smoke tests
- Skill execution unit tests
- Command invocation integration tests
- End-to-end workflow regression tests

### Test Framework
- Test runner: Node.js + Mocha/Jest
- Assertion library: Chai
- Mock data: Fixtures in `test/fixtures/`
- Test reports: JUnit XML format

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-07 | Initial testing guide created by Agent Nu |

---

## References

- ROME-PROP-018: Phase-Based Plugin Architecture
- PLUGIN-MANIFEST.md: Complete plugin catalog
- INSTALLATION-GUIDE.md: Installation procedures
- rome-full/README.md: Meta-plugin documentation
