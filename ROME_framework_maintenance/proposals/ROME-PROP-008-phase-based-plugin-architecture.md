# Phase-Based Plugin Architecture for ROME Framework

| Field | Value |
|-------|-------|
| **Document UID** | ROME-PROP-008 |
| **Version** | 1.0 |
| **Date** | 2026-01-07T00:00:00Z |
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

### Non-Functional Requirements

| Criterion | Target |
|-----------|--------|
| Installation time | <60 seconds for `rome-full` |
| Plugin size | <10MB per phase plugin |
| Startup time | <5 seconds for agent invocation |
| Skill execution | <30 seconds per skill (complex analysis) |
| Documentation completeness | 100% coverage of installation/usage |

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

### Milestone 1: Core Foundation (Weeks 1-2)

- [ ] Create `rome-core` plugin structure
- [ ] Extract shared libraries (SkillInvoker, ActivityLogger, parsers)
- [ ] Convert Roma robot → agent
- [ ] Bundle activity-log MCP server
- [ ] Test `rome-core` installation

### Milestone 2: Pilot Phase (Weeks 3-4)

- [ ] Create `rome-p1-aordl` plugin structure
- [ ] Convert Talib (P1 mode) → agent
- [ ] Convert 3 tier-1 skills → SKILL.md format
- [ ] Create 2 slash commands
- [ ] Test end-to-end P1 workflow

### Milestone 3: Remaining Phases (Weeks 5-8)

- [ ] `rome-p0-bootup` - Bootstrap robot
- [ ] `rome-p2-analysis` - Talib (P2 mode)
- [ ] `rome-p3-design` - PMA + Clara
- [ ] `rome-p4-config` - Lucien
- [ ] `rome-p5-generation` - Ashok/Reena/Charlie
- [ ] `rome-qa` - Sarah

### Milestone 4: Meta-Plugin & Polish (Weeks 9-10)

- [ ] Create `rome-full` meta-plugin
- [ ] Write comprehensive documentation
- [ ] Create example projects
- [ ] Implement auto-logging hooks
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
