# Phase-Based Plugin Architecture for ROME Framework

| Field | Value |
|-------|-------|
| **Document UID** | ROME-PROP-008 |
| **Version** | 1.1 |
| **Date** | 2026-01-07T12:00:00Z |
| **Status** | Proposal |
| **Document Type** | Framework Proposal |
| **Author** | Framework Analyst & Architect |
| **Changes Approved** | false |

---

## Purpose

Propose modular phase-based plugin architecture for ROME framework distribution via Claude Code plugin system, replacing manual setup with standardized plugin installation.

---

## Dependencies

- ROME-PRIN-001 (Core Principles) - Phase Decomposition principle
- ROME-GOV-001 (Document Standards) - Plugin documentation standards
- Claude Code plugin system documentation

---

## Problem Statement

**Current State:**
- Manual framework setup via symlinks, shell scripts
- Complex multi-step installation process
- No version management across team members
- Robots invoked via directory navigation + `claude-code`
- Skills require custom invocation framework
- No standardized distribution mechanism

**Limitations:**
- High friction for new users
- Version drift across team members
- No marketplace distribution
- Manual activity logging calls
- Difficult to share ROME methodology externally

---

## Proposed Solution

**Phase-based modular plugin architecture** where each ROME life-cycle phase distributes as independent Claude Code plugin.

### Architecture

```
rome-core                    # Foundation plugin
rome-p0-bootup              # Phase 0: Project initialization
rome-p1-aordl               # Phase 1: Requirements capture
rome-p2-analysis            # Phase 2: Requirements analysis
rome-p3-design              # Phase 3: System design
rome-p4-config              # Phase 4: Workspace configuration
rome-p5-generation          # Phase 5: Code generation
rome-qa                     # Quality assurance (Sarah)
rome-full                   # Meta-plugin (convenience)
```

### Component Mapping

| ROME Component | Plugin Component | Location |
|----------------|------------------|----------|
| Robot CLAUDE.md | Agent AGENT.md | `agents/{robot}/AGENT.md` |
| Skills (tier-1/2/3) | Agent Skills | `skills/{skill-name}/SKILL.md` |
| Manual commands | Slash Commands | `commands/{command}.md` |
| Activity log MCP | MCP Server | `.mcp.json` + `servers/activity-log/` |
| File operations | Hooks | `hooks/hooks.json` |

---

## Plugin Structures

### rome-core (Foundation)

**Purpose:** Shared libraries, orchestrator, MCP server, templates

```
rome-core/
├── .claude-plugin/
│   └── plugin.json
├── agents/
│   └── roma/                # Orchestrator
│       └── AGENT.md
├── lib/
│   ├── SkillInvoker.js     # Skill execution engine
│   ├── ActivityLogger.js   # Logging utilities
│   └── helpers/
│       ├── aordl-parser.js
│       └── yaml-utils.js
├── templates/
│   └── aordl/
│       ├── REQ-TEMPLATE.md
│       └── validation-rules.yaml
├── .mcp.json               # Activity log MCP server
├── servers/
│   └── activity-log/
│       └── server.js
└── package.json
```

**Manifest:**
```json
{
  "name": "rome-core",
  "version": "1.0.0",
  "description": "ROME Framework foundation",
  "provides": {
    "skillInvoker": "1.0",
    "activityLogger": "1.0",
    "aordlParser": "1.0"
  }
}
```

### rome-p1-aordl (Phase 1)

**Purpose:** AORDL requirements capture and validation

```
rome-p1-aordl/
├── .claude-plugin/
│   └── plugin.json
├── agents/
│   └── talib/              # Requirements Engineer (P1 mode)
│       ├── AGENT.md
│       └── .subagent.json
├── skills/
│   ├── validate-aordl/
│   │   ├── SKILL.md
│   │   ├── index.js
│   │   └── manifest.yaml
│   ├── transform-aordl-to-bdd/
│   │   ├── SKILL.md
│   │   ├── index.js
│   │   └── manifest.yaml
│   └── create-aordl-requirement/
│       ├── SKILL.md
│       ├── index.js
│       └── manifest.yaml
└── commands/
    ├── validate.md         # /rome-p1:validate
    ├── create.md           # /rome-p1:create
    └── transform-bdd.md    # /rome-p1:transform-bdd
```

**Manifest:**
```json
{
  "name": "rome-p1-aordl",
  "version": "1.0.0",
  "description": "ROME Phase 1: AORDL Requirements",
  "requires": {
    "rome-core": "^1.0.0"
  },
  "peerDependencies": {
    "rome-qa": ">=1.0.0"
  }
}
```

### rome-p3-design (Phase 3)

**Purpose:** System architecture and API design

```
rome-p3-design/
├── .claude-plugin/
│   └── plugin.json
├── agents/
│   ├── pma/                # Project Manager/Architect
│   │   └── AGENT.md
│   └── clara/              # UX Designer (optional)
│       └── AGENT.md
├── skills/
│   ├── design-api-spec/
│   ├── design-database-schema/
│   ├── design-component-structure/
│   ├── generate-use-cases/
│   └── optimize-data-model/
└── commands/
    ├── design.md           # /rome-p3:design
    ├── activate-clara.md   # /rome-p3:activate-clara
    └── optimize-model.md   # /rome-p3:optimize-model
```

### rome-p5-generation (Phase 5)

**Purpose:** Parallel code generation across layers

```
rome-p5-generation/
├── .claude-plugin/
│   └── plugin.json
├── agents/
│   ├── ashok/              # Database Engineer
│   │   └── AGENT.md
│   ├── reena/              # Backend Engineer
│   │   └── AGENT.md
│   └── charlie/            # Frontend Engineer
│       └── AGENT.md
├── skills/
│   ├── generate-database-entity/
│   ├── generate-api-endpoint-code/
│   ├── generate-ui-screen-code/
│   └── generate-test-suite/
└── commands/
    ├── generate-db.md      # /rome-p5:generate-db
    ├── generate-api.md     # /rome-p5:generate-api
    └── generate-ui.md      # /rome-p5:generate-ui
```

### rome-full (Meta-plugin)

**Purpose:** Convenience installer for complete ROME framework

```
rome-full/
├── .claude-plugin/
│   └── plugin.json         # Dependencies only, no code
└── README.md
```

**Manifest:**
```json
{
  "name": "rome-full",
  "version": "1.0.0",
  "description": "Complete ROME Framework (all phases)",
  "dependencies": {
    "rome-core": "^1.0.0",
    "rome-p0-bootup": "^1.0.0",
    "rome-p1-aordl": "^1.0.0",
    "rome-p2-analysis": "^1.0.0",
    "rome-p3-design": "^1.0.0",
    "rome-p4-config": "^1.0.0",
    "rome-p5-generation": "^1.0.0",
    "rome-qa": "^1.0.0"
  }
}
```

---

## Installation Patterns

### Beginner (Full Install)

```bash
claude plugin install rome-full
```

**Result:** All phases installed, all robots available

### Requirements Analyst (P1-P2 Only)

```bash
claude plugin install rome-core
claude plugin install rome-p1-aordl
claude plugin install rome-p2-analysis
claude plugin install rome-qa
```

**Result:** Minimal install for requirements work

### Backend Developer (P5 Only)

```bash
claude plugin install rome-core
claude plugin install rome-p5-generation
```

**Result:** Code generation only, no design phases

### CI/CD Pipeline (Automated Generation)

```dockerfile
FROM claude-code:latest
RUN claude plugin install rome-core rome-p5-generation
VOLUME /artifacts
CMD claude --agent rome-p5:reena --artifacts /artifacts
```

**Result:** Minimal container for automated code generation

---

## Usage Examples

### Invoke Phase-Specific Agent

```bash
claude --agent rome-p1:talib
```

Starts Talib in P1 (AORDL) mode.

### Use Phase-Specific Command

```bash
/rome-p1:validate ARTIFACTS/01-requirements/REQ-001.yaml
/rome-p2:analyze REQ-001.yaml
/rome-p3:design
/rome-p5:generate-db
```

### Agent Auto-Invokes Skills

```
User: "Analyze this requirement file"
Talib (rome-p1): [Invokes validate-aordl skill]
Talib (rome-p1): [Invokes analyze-requirement skill]
Talib (rome-p1): [Returns analysis results]
```

### Hooks Auto-Log Activity

```
[User creates REQ-001.yaml via Write tool]
[PostToolUse hook triggers]
[Activity log entry created automatically]
```

---

## Benefits

### Aligns with ROME Principles

**ROME-PRIN-001 §4 - Phase Decomposition:**
- Each phase plugin = discrete transformation stage
- Plugin boundaries enforce phase entry/exit criteria
- Clear separation of concerns

**ROME-PRIN-001 §9 - Modularity:**
- Phases = horizontal system modularity
- Skills = vertical feature slicing
- Plugin architecture enables both

### Technical Benefits

| Benefit | Impact |
|---------|--------|
| **Minimal installation** | Users install only needed phases |
| **Independent evolution** | Update P3 without affecting P1 |
| **Version per phase** | P1 v2.0, P3 v1.5 can coexist |
| **Selective deployment** | Production deploys only P5, dev uses all |
| **Namespace clarity** | `/rome-p1:*` vs `/rome-p5:*` shows scope |
| **Third-party phases** | Community extends via custom phase plugins |
| **Testing isolation** | Each phase independently testable |

### Operational Benefits

| User Type | Install | Benefit |
|-----------|---------|---------|
| Beginner | `rome-full` | Everything works, zero config |
| Requirements Analyst | P1+P2+QA | Minimal surface area |
| Architect | P3+QA | Focus on design |
| Developer | P5 | Code generation only |
| CI/CD | Core+P5 | Automated generation |

---

## Migration Strategy

### Phase 1: Core Infrastructure (Week 1)

```
rome-core/
├── Extract SkillInvoker.js from /ROME/skills/lib/
├── Extract ActivityLogger.js
├── Extract AORDL parser/validator
├── Convert Roma robot → agent
├── Bundle activity-log MCP server
└── Create plugin manifest
```

**Deliverable:** `rome-core` v1.0.0 installable via `claude plugin install`

### Phase 2: Pilot Phase Plugin (Week 2)

```
rome-p1-aordl/
├── Convert Talib (P1 mode) → agent
├── Convert validate-aordl skill → SKILL.md format
├── Convert transform-aordl-to-bdd skill
├── Create /rome-p1:validate command
├── Create /rome-p1:create command
└── Test end-to-end P1 workflow
```

**Deliverable:** `rome-p1-aordl` v1.0.0 functional with `rome-core`

**Validation:**
```bash
claude plugin install rome-core rome-p1-aordl
claude --agent rome-p1:talib
# Should start Talib in P1 mode with access to validation skills
```

### Phase 3: Remaining Phase Plugins (Weeks 3-4)

- Week 3: `rome-p2-analysis`, `rome-p3-design`, `rome-qa`
- Week 4: `rome-p0-bootup`, `rome-p4-config`, `rome-p5-generation`

### Phase 4: Meta-Plugin & Documentation (Week 5)

```
rome-full/
├── plugin.json (dependencies only)
└── README.md

docs/
├── installation-guide.md
├── phase-selection-guide.md
├── skills-reference.md
└── migration-from-manual.md
```

**Deliverable:** Complete plugin ecosystem ready for distribution

---

## Testing & Validation Strategy

### Documentation Relocation Audit

**Objective:** Verify all framework documents correctly migrated and accessible post-plugin conversion.

**Audit Checklist:**
```
├── Core Principles (ROME-PRIN-*)
│   └── Accessible via rome-core agents
├── Phase Specifications (ROME-SPEC-P*)
│   └── Accessible via respective phase plugin agents
├── Robot Instructions (CLAUDE.md → AGENT.md)
│   └── Agent invocation validates instruction loading
├── Skill Manifests (tier-1/2/3)
│   └── Skill execution validates manifest parsing
├── Templates (AORDL, BDD, etc.)
│   └── Template access via rome-core lib functions
└── Governance Docs (ROME-GOV-*)
    └── Referenced in plugin metadata
```

**Audit Script:**
```bash
#!/bin/bash
# validate-doc-migration.sh

echo "Auditing documentation relocation..."

# Check AGENT.md for each robot
for phase in p0 p1 p2 p3 p4 p5; do
  if [ -f "rome-${phase}/agents/*/AGENT.md" ]; then
    echo "✓ rome-${phase}: AGENT.md present"
  else
    echo "✗ rome-${phase}: AGENT.md missing"
    exit 1
  fi
done

# Check skill manifests
find rome-*/skills -name "SKILL.md" | while read skill; do
  grep -q "name:" "$skill" || { echo "✗ $skill: missing name field"; exit 1; }
done

# Check template accessibility
test -d "rome-core/templates/aordl" || { echo "✗ AORDL templates missing"; exit 1; }

echo "✓ All documentation relocated correctly"
```

### Information Accessibility Verification

**Objective:** Validate LLM agents can parse and utilize migrated documentation.

**Test Cases:**

| Test ID | Validation | Success Criteria |
|---------|------------|------------------|
| ACC-001 | Agent reads AGENT.md on invocation | Agent outputs role/phase correctly |
| ACC-002 | Agent accesses skill manifests | Skill list matches plugin manifest |
| ACC-003 | Agent uses AORDL templates | Template rendered with correct schema |
| ACC-004 | Agent invokes MCP activity log | Log entry created via MCP tool |
| ACC-005 | External agent reads rome-core docs | Core principles parseable from plugin path |

**Verification Script:**
```javascript
// verify-accessibility.js
const { spawn } = require('child_process');

async function verifyAgentAccess(agent, expectedOutput) {
  const proc = spawn('claude', ['--agent', agent, '--prompt', 'State your role']);
  let output = '';
  proc.stdout.on('data', (data) => output += data);
  await new Promise(resolve => proc.on('close', resolve));

  if (!output.includes(expectedOutput)) {
    throw new Error(`${agent}: AGENT.md not accessible`);
  }
  console.log(`✓ ${agent}: AGENT.md accessible`);
}

await verifyAgentAccess('rome-p1:talib', 'Requirements Engineer');
await verifyAgentAccess('rome-p3:pma', 'Project Manager/Architect');
```

### External Tool Compatibility Testing

**Objective:** Ensure activity-log MCP, hooks, skills function with external Claude Code projects.

**Test Scenarios:**

| Scenario | Tool | Validation |
|----------|------|------------|
| EXT-001 | Activity log MCP | External project logs writes via `rome__log` tool |
| EXT-002 | Pre-tool-use hook | Hook executes on external project file ops |
| EXT-003 | Skill invocation | Skill callable from non-ROME agent |
| EXT-004 | AORDL parser | External project parses AORDL via rome-core lib |
| EXT-005 | Template rendering | External agent uses rome-core templates |

**External Project Test Structure:**
```
test-external-project/
├── .claude/
│   └── config.json          # Uses rome-* plugins
├── .mcp.json                # References rome-core MCP server
├── sample-requirements/
│   └── REQ-001.yaml        # AORDL format
└── tests/
    ├── test-mcp-logging.sh
    ├── test-skill-invocation.sh
    └── test-template-access.sh
```

**MCP Integration Test:**
```bash
# test-mcp-logging.sh
cd test-external-project

# Verify MCP server registration
claude mcp list | grep -q "rome__activity_log" || { echo "✗ MCP server not registered"; exit 1; }

# Verify tool availability
claude mcp tools rome__activity_log | grep -q "rome__log" || { echo "✗ rome__log tool missing"; exit 1; }

# Test logging from external project
echo "test" > test.txt
claude mcp call rome__activity_log rome__log '{"action":"create","file":"test.txt"}'

# Verify log entry created
test -f ".rome-activity/$(date +%Y-%m-%d).log" || { echo "✗ Log not created"; exit 1; }

echo "✓ MCP integration functional in external project"
```

### Test Project

**Purpose:** Reference implementation validating complete ROME workflow via plugins.

**Structure:**
```
rome-plugin-test-project/
├── README.md               # Test execution instructions
├── .claude/
│   ├── config.json         # Plugin configuration
│   └── hooks.json          # Activity log hooks
├── .mcp.json              # rome-core MCP server
├── ARTIFACTS/
│   ├── 00-project-charter/
│   ├── 01-requirements/
│   │   ├── REQ-001.yaml   # Sample AORDL requirement
│   │   └── REQ-002.yaml
│   ├── 02-analysis/
│   ├── 03-design/
│   └── 05-generated-code/
├── tests/
│   ├── validate-doc-migration.sh
│   ├── verify-accessibility.js
│   ├── test-mcp-logging.sh
│   ├── test-skill-invocation.sh
│   ├── test-p1-workflow.sh
│   ├── test-p3-workflow.sh
│   └── test-p5-workflow.sh
└── expected-outputs/       # Golden outputs for validation
    ├── REQ-001-analyzed.yaml
    ├── design-artifacts.json
    └── generated-code-structure.txt
```

**Workflow Tests:**
```bash
# test-p1-workflow.sh - End-to-end Phase 1 validation
#!/bin/bash

echo "Testing P1 (AORDL) workflow..."

# Start Talib agent
claude --agent rome-p1:talib <<EOF
Validate ARTIFACTS/01-requirements/REQ-001.yaml
EOF

# Verify validation output
test -f "ARTIFACTS/01-requirements/REQ-001-validated.yaml" || { echo "✗ Validation failed"; exit 1; }

# Test skill invocation
claude --agent rome-p1:talib <<EOF
Transform REQ-001.yaml to BDD format
EOF

test -f "ARTIFACTS/01-requirements/REQ-001.feature" || { echo "✗ BDD transform failed"; exit 1; }

echo "✓ P1 workflow functional"
```

### Test Execution Matrix

| Phase | Test Script | Validates |
|-------|-------------|-----------|
| Core | `validate-doc-migration.sh` | All docs relocated |
| Core | `verify-accessibility.js` | LLM can parse migrated docs |
| Core | `test-mcp-logging.sh` | Activity log MCP works externally |
| P1 | `test-p1-workflow.sh` | AORDL validation + transform |
| P3 | `test-p3-workflow.sh` | Design generation |
| P5 | `test-p5-workflow.sh` | Code generation |
| External | `test-skill-invocation.sh` | Skills callable from non-ROME projects |

**Success Gate:** All tests pass before plugin marked production-ready.

---

## Backward Compatibility

### Existing ROME Projects

**Continue to function:**
- `/ROME/` symlinks remain valid
- Robots still runnable from `/ROME/robot-templates/{robot}/`
- Skills still accessible via `/ROME/skills/`
- Activity log MCP server unchanged

**Migration path:**
```bash
# Install plugins
claude plugin install rome-full

# Optional: Remove /ROME/ symlink (plugin takes precedence)
rm ROME

# Continue working (now using plugin-provided agents)
claude --agent rome-p1:talib
```

### Dual Operation

- Plugin and local `/ROME/` coexist
- Plugin agents take precedence over local
- Local `.claude/` configs override plugin defaults
- No breaking changes to existing workflows

---

## Success Criteria

### Functional Requirements

| Criterion | Validation |
|-----------|------------|
| Plugin installation | `claude plugin install rome-core` succeeds |
| Agent invocation | `claude --agent rome-p1:talib` starts Talib |
| Skill execution | Skills invocable from agents |
| Command execution | `/rome-p1:validate` executes validation |
| MCP integration | Activity log accessible via MCP tools |
| Hooks trigger | File writes auto-log to activity log |
| **Doc relocation** | **`validate-doc-migration.sh` exits 0** |
| **Doc accessibility** | **`verify-accessibility.js` all tests pass** |
| **External MCP** | **`test-mcp-logging.sh` succeeds from external project** |
| **External skills** | **`test-skill-invocation.sh` invokes skills from non-ROME agent** |
| **Template access** | **External agent renders AORDL templates via rome-core** |

### Non-Functional Requirements

| Criterion | Target |
|-----------|--------|
| Installation time | <60 seconds for `rome-full` |
| Plugin size | <10MB per phase plugin |
| Startup time | <5 seconds for agent invocation |
| Skill execution | <30 seconds per skill (complex analysis) |
| Documentation completeness | 100% coverage of installation/usage |
| **Test coverage** | **100% phase workflows (P0-P5, QA)** |
| **Audit completeness** | **All framework docs mapped to plugin locations** |
| **External compatibility** | **0 failures in external project test suite** |

---

## Risk Analysis

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Version skew between phase plugins | Medium | High | rome-core provides compatibility API |
| Circular dependencies | Low | Medium | Enforce dependency hierarchy |
| Plugin size bloat | Medium | Low | Share code via rome-core |
| MCP server conflicts | Low | Medium | Namespace all MCP tools with `rome__` |

### Operational Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| User installs incompatible versions | High | Medium | Document version compatibility |
| Beginner overwhelmed by choices | Medium | Low | Provide rome-full meta-plugin |
| Breaking changes in updates | Low | High | Semantic versioning, changelogs |

---

## Alternatives Considered

### Alternative 1: Monolithic Plugin

**Structure:** Single `rome-framework` plugin containing all components

**Rejected because:**
- Violates phase decomposition principle (ROME-PRIN-001 §4)
- Forces download of unused phases
- Tight coupling prevents independent evolution
- Namespace pollution (9 agents, 50+ skills in one plugin)

### Alternative 2: Skills-Only Plugin

**Structure:** Skills as plugin, robots remain in `/ROME/`

**Rejected because:**
- Incomplete solution (robots still manual setup)
- Doesn't leverage Claude Code agent system
- No namespace benefits for commands
- Hybrid approach confuses users

### Alternative 3: Bundled Phases (P1-P2, P3-P5)

**Structure:** Two plugins - requirements bundle, implementation bundle

**Rejected because:**
- Arbitrary phase grouping
- Doesn't align with ROME phase boundaries
- Reduces flexibility vs full modularity

---

## Implementation Plan

### Milestone 1: Core Foundation + Test Infrastructure (Weeks 1-2)

- [ ] Create `rome-core` plugin structure
- [ ] Extract shared libraries (SkillInvoker, ActivityLogger, parsers)
- [ ] Convert Roma robot → agent
- [ ] Bundle activity-log MCP server
- [ ] Test `rome-core` installation
- [ ] **Create `rome-plugin-test-project/` structure**
- [ ] **Implement `validate-doc-migration.sh` (core audit)**
- [ ] **Implement `verify-accessibility.js` (core agent validation)**
- [ ] **Create `test-external-project/` for MCP/hook testing**
- [ ] **Implement `test-mcp-logging.sh`**

### Milestone 2: Pilot Phase + P1 Validation (Weeks 3-4)

- [ ] Create `rome-p1-aordl` plugin structure
- [ ] Convert Talib (P1 mode) → agent
- [ ] Convert 3 tier-1 skills → SKILL.md format
- [ ] Create 2 slash commands (`/rome-p1:validate`, `/rome-p1:create`)
- [ ] Test end-to-end P1 workflow
- [ ] **Extend `validate-doc-migration.sh` for P1 plugin**
- [ ] **Implement `test-p1-workflow.sh` (AORDL validation + BDD transform)**
- [ ] **Create sample AORDL requirements (REQ-001, REQ-002)**
- [ ] **Implement `test-skill-invocation.sh` (external skill access)**
- [ ] **Run full test suite: audit + accessibility + P1 workflow**

### Milestone 3: Remaining Phases + Phase-Specific Tests (Weeks 5-8)

- [ ] `rome-p0-bootup` - Bootstrap robot + `test-p0-workflow.sh`
- [ ] `rome-p2-analysis` - Talib (P2 mode) + `test-p2-workflow.sh`
- [ ] `rome-p3-design` - PMA + Clara + `test-p3-workflow.sh`
- [ ] `rome-p4-config` - Lucien + `test-p4-workflow.sh`
- [ ] `rome-p5-generation` - Ashok/Reena/Charlie + `test-p5-workflow.sh`
- [ ] `rome-qa` - Sarah + QA validation tests
- [ ] **Extend `validate-doc-migration.sh` for all phase plugins**
- [ ] **Create golden outputs in `expected-outputs/` for regression testing**
- [ ] **Implement `test-template-access.sh` (external template rendering)**

### Milestone 4: Meta-Plugin, Documentation & Final Validation (Weeks 9-10)

- [ ] Create `rome-full` meta-plugin
- [ ] Write comprehensive documentation
- [ ] Create example projects
- [ ] Implement auto-logging hooks
- [ ] **Execute complete test suite (all phases, external project)**
- [ ] **Validate 100% test coverage per Success Criteria**
- [ ] **Run audit: all framework docs relocated and accessible**
- [ ] **Validate external tool compatibility (0 failures)**
- [ ] **Document test execution procedures in test project README**
- [ ] Final integration testing

---

## Approval Requirements

**Required Reviews:**
- Framework Analyst & Architect (proposal author)
- Lead Developer (technical feasibility)
- Documentation Team (user impact assessment)

**Approval Criteria:**
- Aligns with ROME core principles
- Technically feasible with Claude Code plugin system
- Migration path preserves backward compatibility
- Documentation plan adequate

**Target Approval Date:** 2026-01-14

---

## Next Steps

1. **Immediate:** Review proposal, gather feedback
2. **Week 1:** Begin `rome-core` implementation
3. **Week 3:** Pilot `rome-p1-aordl` plugin
4. **Week 10:** Complete ecosystem, publish to marketplace

---

## References

- Claude Code Plugin Documentation: https://code.claude.com/docs/en/plugins.md
- Claude Code Agents: https://code.claude.com/docs/en/agents.md
- Claude Code Skills: https://code.claude.com/docs/en/skills.md
- ROME-PRIN-001: Core Principles (Phase Decomposition §4)
- ROME-GOV-001: Document Standards

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-07T00:00:00Z | Initial proposal - phase-based plugin architecture |
| 1.1 | 2026-01-07T12:00:00Z | Added Testing & Validation Strategy section: documentation relocation audit, information accessibility verification, external tool compatibility testing, test scripts, test project structure, test execution matrix. Updated Success Criteria with doc audit and accessibility requirements. Integrated test deliverables into Implementation Plan milestones. |
