# ROME Plugin Architecture: Alternative Approaches

**Document UID:** ROME-PROP-014-ALT
**Date:** 2026-01-07
**Status:** Analysis
**Author:** Archie (Framework Analyst & Architect)

---

## Purpose

Compare two plugin architecture approaches:
1. **Monolithic:** Single `rome-framework` plugin containing all components
2. **Modular (Phase-Based):** Each life-cycle phase as separate plugin with phase-specific robots as sub-agents

---

## Approach 1: Monolithic Plugin (Original Design)

### Structure

```
rome-framework/                           # Single plugin
├── .claude-plugin/plugin.json
├── agents/                               # All 9 robots
│   ├── talib/
│   ├── pma/
│   ├── roma/
│   ├── sarah/
│   └── ...
├── skills/                               # All skills (tier-1, 2, 3)
│   ├── validate-aordl/
│   ├── analyze-requirement/
│   └── ...
├── commands/
│   ├── validate.md
│   ├── bootstrap.md
│   └── ...
└── .mcp.json
```

### Installation

```bash
claude plugin install rome-framework
```

### Invocation

```bash
claude --agent rome:talib
```

### Pros
✅ **Simple installation** - One command installs everything
✅ **Single version** - All components guaranteed compatible
✅ **Easier dependency management** - Internal skill calls always resolve
✅ **Lower distribution overhead** - One package to maintain
✅ **Simpler for beginners** - Don't need to understand phase boundaries

### Cons
❌ **Large download** - Users get all phases even if only need one
❌ **Tight coupling** - Changes to any phase require full plugin update
❌ **Harder to extend** - Third-party phase additions require fork
❌ **Namespace pollution** - 9 agents + 50+ skills in one namespace
❌ **Violates phase decomposition principle** - Monolith contradicts ROME architecture

---

## Approach 2: Modular Phase-Based Plugins (Alternative)

### Structure

```
rome-core/                                # Core/foundation plugin
├── .claude-plugin/plugin.json
├── agents/
│   └── roma/                            # Orchestrator only
│       └── AGENT.md
├── lib/                                  # Shared libraries
│   ├── SkillInvoker.js
│   ├── ActivityLogger.js
│   └── aordl-parser.js
├── templates/
│   └── aordl/
│       └── REQ-TEMPLATE.md
└── .mcp.json                            # Activity log MCP

rome-p0-bootup/                          # Phase 0 plugin
├── .claude-plugin/plugin.json
├── agents/
│   └── bootstrap/                       # Bootstrap robot
│       └── AGENT.md
├── skills/
│   ├── create-project-structure/
│   └── initialize-activity-log/
└── commands/
    └── bootstrap.md                     # /rome-p0:bootstrap

rome-p1-aordl/                           # Phase 1 plugin
├── .claude-plugin/plugin.json
├── agents/
│   └── talib/                           # P1-specific robot
│       ├── AGENT.md
│       └── .subagent.json
├── skills/                               # P1-specific skills
│   ├── validate-aordl/
│   ├── transform-aordl-to-bdd/
│   └── create-aordl-requirement/
└── commands/
    ├── validate.md                      # /rome-p1:validate
    └── create-requirement.md            # /rome-p1:create-requirement

rome-p2-analysis/                        # Phase 2 plugin
├── .claude-plugin/plugin.json
├── agents/
│   └── talib/                           # P2-specific mode of Talib
│       ├── AGENT.md
│       └── .subagent.json
├── skills/                               # P2-specific skills
│   ├── analyze-requirement/
│   ├── extract-entities/
│   ├── extract-invariants/
│   ├── batch-analyze-requirements/
│   └── generate-data-dictionary/
└── commands/
    ├── analyze.md                       # /rome-p2:analyze
    └── execute-p2.md                    # /rome-p2:execute-p2

rome-p3-design/                          # Phase 3 plugin
├── .claude-plugin/plugin.json
├── agents/
│   ├── pma/                             # Architect
│   │   └── AGENT.md
│   └── clara/                           # UX Designer (optional)
│       └── AGENT.md
├── skills/
│   ├── design-api-spec/
│   ├── design-database-schema/
│   ├── design-component-structure/
│   └── generate-use-cases/
└── commands/
    ├── design.md                        # /rome-p3:design
    └── activate-clara.md                # /rome-p3:activate-clara

rome-p4-config/                          # Phase 4 plugin
├── .claude-plugin/plugin.json
├── agents/
│   └── lucien/                          # DevOps Engineer
│       └── AGENT.md
├── skills/
│   ├── configure-database-workspace/
│   ├── configure-api-workspace/
│   ├── configure-ui-workspace/
│   └── setup-cicd-pipeline/
└── commands/
    └── scaffold.md                      # /rome-p4:scaffold

rome-p5-generation/                      # Phase 5 plugin
├── .claude-plugin/plugin.json
├── agents/
│   ├── ashok/                           # Database Engineer
│   │   └── AGENT.md
│   ├── reena/                           # Backend Engineer
│   │   └── AGENT.md
│   └── charlie/                         # Frontend Engineer
│       └── AGENT.md
├── skills/
│   ├── generate-database-entity/
│   ├── generate-api-endpoint-code/
│   └── generate-ui-screen-code/
└── commands/
    ├── generate-database.md             # /rome-p5:generate-database
    ├── generate-backend.md              # /rome-p5:generate-backend
    └── generate-frontend.md             # /rome-p5:generate-frontend

rome-qa/                                 # Quality Assurance plugin
├── .claude-plugin/plugin.json
├── agents/
│   └── sarah/                           # System Auditor
│       └── AGENT.md
├── skills/
│   ├── validate-gate-p1/
│   ├── validate-gate-p2/
│   ├── validate-gate-p3/
│   └── validate-gate-p4/
└── commands/
    └── gate.md                          # /rome-qa:gate
```

### Installation

**Minimal (P1 only):**
```bash
claude plugin install rome-core
claude plugin install rome-p1-aordl
```

**Full stack:**
```bash
claude plugin install rome-core
claude plugin install rome-p0-bootup
claude plugin install rome-p1-aordl
claude plugin install rome-p2-analysis
claude plugin install rome-p3-design
claude plugin install rome-p4-config
claude plugin install rome-p5-generation
claude plugin install rome-qa
```

**Via meta-plugin:**
```bash
claude plugin install rome-full  # Installs all phase plugins
```

### Invocation

**Phase-specific agent:**
```bash
claude --agent rome-p1:talib
claude --agent rome-p3:pma
claude --agent rome-p5:ashok
```

**Phase-specific commands:**
```bash
/rome-p1:validate REQ-001.yaml
/rome-p2:analyze REQ-001.yaml
/rome-p3:design
```

### Pros
✅ **True phase decomposition** - Aligns with ROME-PRIN-001 architecture
✅ **Minimal installation** - Install only phases you need
✅ **Independent evolution** - Update P3 without affecting P1
✅ **Clear boundaries** - Phase entry/exit criteria enforced by plugin boundaries
✅ **Easier testing** - Test individual phase plugins in isolation
✅ **Third-party phases** - Community can add custom phases as plugins
✅ **Selective deployment** - Production might only need P5, dev needs all
✅ **Better discoverability** - `/rome-p1:*` vs `/rome-p5:*` shows scope
✅ **Reduced coupling** - Phase plugins depend on rome-core, not each other
✅ **Version per phase** - P1 v2.0, P3 v1.5 can coexist

### Cons
❌ **More complex installation** - Need to install multiple plugins
❌ **Dependency management** - Must ensure rome-core compatible with all phases
❌ **Version skew risk** - User might have incompatible phase versions
❌ **Namespace verbosity** - `/rome-p1:validate` vs `/rome:validate`
❌ **Distribution overhead** - 7 separate plugins to maintain
❌ **Beginner confusion** - "Which plugins do I need?"

---

## Hybrid Approach: Best of Both

### Structure

**Option 1: Meta-plugin + Modular phases**

```bash
# Beginner: Install everything
claude plugin install rome-full

# Advanced: Pick phases
claude plugin install rome-core rome-p1-aordl rome-p2-analysis
```

**Option 2: Monolith with optional extensions**

```bash
# Core contains P0-P3 (most common)
claude plugin install rome-framework

# Optional advanced phases
claude plugin install rome-p4-config
claude plugin install rome-p5-generation
```

**Option 3: Core + Phase bundles**

```bash
# Foundation
claude plugin install rome-core

# Requirements & Design bundle (P1-P3)
claude plugin install rome-requirements-design

# Implementation bundle (P4-P5)
claude plugin install rome-implementation
```

---

## Comparison Matrix

| Criterion | Monolithic | Phase-Based | Hybrid |
|-----------|------------|-------------|--------|
| **Alignment with ROME principles** | ❌ Low | ✅ High | ✅ High |
| **Installation complexity** | ✅ Simple | ❌ Complex | ⚠️ Medium |
| **Download size** | ❌ Large | ✅ Small | ⚠️ Medium |
| **Version management** | ✅ Simple | ❌ Complex | ⚠️ Medium |
| **Phase independence** | ❌ Low | ✅ High | ✅ High |
| **Third-party extensibility** | ❌ Hard | ✅ Easy | ✅ Easy |
| **Namespace clarity** | ⚠️ Mixed | ✅ Clear | ✅ Clear |
| **Beginner-friendly** | ✅ Yes | ❌ No | ✅ Yes |
| **Production deployment** | ❌ Bloated | ✅ Minimal | ✅ Minimal |
| **Testing isolation** | ❌ Hard | ✅ Easy | ✅ Easy |

---

## Recommended Architecture: Phase-Based with Meta-Plugin

### Recommendation

**Implement Phase-Based approach with convenience meta-plugin**

**Rationale:**
1. **Aligns with ROME principles** - Phase decomposition is core to ROME
2. **Flexibility** - Users choose what they need
3. **Professional** - Enterprise users can deploy only P5 generation in CI/CD
4. **Beginner-friendly** - Meta-plugin provides one-command install
5. **Extensible** - Community can create custom phase plugins
6. **Testable** - Each phase plugin independently testable

### Implementation Strategy

#### Phase 1: Core Plugin
```
rome-core v1.0.0
- Roma orchestrator
- SkillInvoker library
- ActivityLogger library
- AORDL templates
- MCP server
```

#### Phase 2: Essential Plugins
```
rome-p0-bootup v1.0.0
rome-p1-aordl v1.0.0
rome-p2-analysis v1.0.0
rome-qa v1.0.0 (Sarah)
```

#### Phase 3: Design & Implementation
```
rome-p3-design v1.0.0
rome-p4-config v1.0.0
rome-p5-generation v1.0.0
```

#### Phase 4: Meta-Plugin
```
rome-full v1.0.0
- Depends on all phase plugins
- No code, just dependencies
- Single-command install convenience
```

### Dependency Graph

```
rome-full v1.0.0
  ├─ rome-core v1.x
  ├─ rome-p0-bootup v1.x
  │  └─ rome-core v1.x
  ├─ rome-p1-aordl v1.x
  │  └─ rome-core v1.x
  ├─ rome-p2-analysis v1.x
  │  └─ rome-core v1.x
  ├─ rome-p3-design v1.x
  │  └─ rome-core v1.x
  ├─ rome-p4-config v1.x
  │  └─ rome-core v1.x
  ├─ rome-p5-generation v1.x
  │  └─ rome-core v1.x
  └─ rome-qa v1.x
     └─ rome-core v1.x
```

### Version Compatibility

**rome-core provides compatibility API:**
```json
{
  "name": "rome-core",
  "version": "1.0.0",
  "provides": {
    "skillInvoker": "1.0",
    "activityLogger": "1.0",
    "aordlParser": "1.0"
  }
}
```

**Phase plugins declare requirements:**
```json
{
  "name": "rome-p1-aordl",
  "version": "1.0.0",
  "requires": {
    "rome-core": "^1.0.0"
  },
  "peerDependencies": {
    "rome-qa": ">=1.0.0"  // For gate validation
  }
}
```

---

## Usage Examples

### Scenario 1: Beginner Learning ROME

```bash
# Install everything
claude plugin install rome-full

# Bootstrap project
/rome-p0:bootstrap my-app

# Switch to Talib for P1
claude --agent rome-p1:talib

# Validate requirements
/rome-p1:validate ARTIFACTS/01-requirements/REQ-001.yaml

# Request gate
/rome-qa:gate P1
```

### Scenario 2: Requirements Analyst (Only P1-P2)

```bash
# Install core + P1 + P2 + QA
claude plugin install rome-core
claude plugin install rome-p1-aordl
claude plugin install rome-p2-analysis
claude plugin install rome-qa

# Work only with requirements
claude --agent rome-p1:talib
```

### Scenario 3: Backend Developer (Only P5)

```bash
# Install core + P5 only
claude plugin install rome-core
claude plugin install rome-p5-generation

# Generate code from existing design artifacts
claude --agent rome-p5:reena

# Generate API code
/rome-p5:generate-backend
```

### Scenario 4: CI/CD Pipeline (P5 only)

```dockerfile
# Dockerfile for code generation service
FROM claude-code:latest

# Install minimal ROME for code generation
RUN claude plugin install rome-core rome-p5-generation

# Mount design artifacts
VOLUME /artifacts

# Run generation
CMD claude --agent rome-p5:ashok --artifacts /artifacts
```

---

## Migration Path

### From Monolithic to Phase-Based

**Step 1:** Split existing `rome-framework` into:
- Extract shared code → `rome-core`
- Extract P0 components → `rome-p0-bootup`
- Extract P1 components → `rome-p1-aordl`
- ... etc

**Step 2:** Update dependencies:
- Each phase plugin imports from `rome-core`
- Remove inter-phase dependencies
- Add peer dependencies for gates

**Step 3:** Create meta-plugin:
- `rome-full` with dependencies on all phases
- No code, just package.json

**Step 4:** Publish:
- Publish `rome-core` first
- Publish phase plugins
- Publish `rome-full` last

**Step 5:** Deprecation:
- Mark old `rome-framework` as deprecated
- Redirect to `rome-full` installation
- Maintain for 6 months for backward compatibility

---

## Decision

**RECOMMENDED: Phase-Based Architecture with Meta-Plugin**

**Next Actions:**
1. Update ROME-PROP-014 to reflect phase-based design
2. Create `rome-core` plugin structure
3. Create `rome-p1-aordl` as pilot phase plugin
4. Test installation and agent invocation
5. Iterate on remaining phases
6. Create `rome-full` meta-plugin for convenience

---

## Revision Tracking

Analysis completed: 2026-01-07
Decision: Phase-based with meta-plugin
See git log for detailed changes
