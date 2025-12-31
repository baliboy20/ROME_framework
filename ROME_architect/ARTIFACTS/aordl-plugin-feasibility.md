# AORDL Claude Plugin: Feasibility Analysis
Document UID: ROME-ANALYSIS-001
Status: Draft
Date: 2025-12-29
Type: Feasibility Analysis

---

## Executive Summary

**Verdict**: FEASIBLE with clean separation boundary.

AORDL (AI-Optimized Requirement Design Language) can be extracted from ROME Framework and packaged as standalone Claude plugin (Skill or MCP Server). Core AORDL components have minimal coupling to ROME lifecycle machinery.

**Recommended Path**: Hybrid (Skill + MCP Server)
- **MCP Server**: AORDL validation and transformation tools
- **Skill**: Requirements elicitation guidance and workflow

---

## Current State Analysis

### AORDL Core Components

**1. Language Specification**
- 13 required fields (ID, Actor, Intent, Preconditions, etc.)
- Anti-pattern definitions (UI language, technical jargon, generic actors, ambiguous verbs)
- Approved verb taxonomy (create, read, update, delete, etc.)
- Validation modes (STRICT, GUIDED, PERMISSIVE)
- **Location**: `/ROME/skills/registry/validate-aordl.yaml`
- **Dependencies**: None (pure specification)

**2. Validation Tooling**
- `validate-aordl.js`: Validates AORDL files against specification
- **Input**: YAML requirement file
- **Output**: Validation report (PASS/FAIL, violations, warnings)
- **Dependencies**:
  - `js-yaml` (YAML parsing)
  - Manifest file (`validate-aordl.yaml`)
- **Location**: `/ROME/skills/tier-1/validate-aordl.js`

**3. Transformation Tooling**
- `transform-aordl-to-bdd.js`: Transforms AORDL → Gherkin BDD
- **Input**: YAML requirement file
- **Output**: Gherkin `.feature` file
- **Dependencies**:
  - `js-yaml` (YAML parsing)
  - Manifest file (`transform-aordl-to-bdd.yaml`)
- **Location**: `/ROME/skills/tier-1/transform-aordl-to-bdd.js`

### ROME-Specific Components (Decoupled)

**1. Phase P1 Lifecycle**
- Phase boundaries (P0 → P1 → P2)
- Entry/exit criteria
- **Location**: `/ROME/life-cycle/P01-aordl/operations-guidelines.md`
- **Coupling**: References AORDL but not required for AORDL itself

**2. Quality Gate GATE-P1**
- Checklist for phase completion
- Sarah robot validation procedures
- **Coupling**: Uses AORDL validation but adds ROME-specific checks

**3. Robot Integration**
- Talib: AORDL creation robot
- Sarah: Quality gate validation robot
- **Coupling**: Workflow orchestration, not language definition

---

## Decoupling Analysis

| Component | AORDL-Core | ROME-Specific | Portable |
|-----------|------------|---------------|----------|
| 13-field specification | ✓ | | ✓ |
| Anti-patterns | ✓ | | ✓ |
| Approved verbs | ✓ | | ✓ |
| Validation modes | ✓ | | ✓ |
| `validate-aordl.js` | ✓ | | ✓ |
| `transform-aordl-to-bdd.js` | ✓ | | ✓ |
| Manifest files (`.yaml`) | ✓ | | ✓ |
| Phase P1 definition | | ✓ | ✗ |
| GATE-P1 protocol | | ✓ | ✗ |
| Robot procedures (Talib, Sarah) | | ✓ | ✗ |
| P1→P2 handoff | | ✓ | ✗ |

**Key Finding**: Clean separation boundary exists between AORDL language/tooling and ROME orchestration.

---

## Plugin Architecture Options

### Option 1: Standalone Skill

**Structure**:
```
.claude/skills/aordl/
├── SKILL.md                      # Requirements capture guidance
├── specification/
│   ├── aordl-fields.yaml         # 13 required fields
│   ├── anti-patterns.yaml        # Forbidden patterns
│   └── approved-verbs.yaml       # Verb taxonomy
└── tools/
    ├── validate-aordl.js         # Validation utility
    ├── transform-aordl-to-bdd.js # BDD transformation
    └── manifests/
        ├── validate-aordl.yaml
        └── transform-aordl-to-bdd.yaml
```

**Skill Invocation**:
```markdown
User: /aordl "create a user registration flow"
Claude: [Uses AORDL skill to capture requirements in 13-field format]
```

**Pros**:
- Single portable artifact (copy `.claude/skills/aordl` to any project)
- No external dependencies beyond Node.js
- Self-contained specification + tooling

**Cons**:
- Requires Node.js runtime for validation
- Tools invoked via Bash (less ergonomic)
- No cross-language support

---

### Option 2: MCP Server

**Structure**:
```
aordl-mcp-server/
├── package.json
├── src/
│   ├── index.ts                  # MCP server entry
│   ├── tools/
│   │   ├── validate.ts           # aordl_validate tool
│   │   ├── transform.ts          # aordl_transform_to_bdd tool
│   │   └── template.ts           # aordl_generate_template tool
│   └── specification/
│       ├── fields.yaml
│       ├── anti-patterns.yaml
│       └── verbs.yaml
└── README.md
```

**Tools Exposed**:
1. `aordl_validate`
   - Input: `requirement_file` (path), `mode` (STRICT/GUIDED/PERMISSIVE)
   - Output: Validation report JSON
2. `aordl_transform_to_bdd`
   - Input: `requirement_file` (path)
   - Output: Gherkin `.feature` file content
3. `aordl_generate_template`
   - Input: `id` (REQ-###)
   - Output: Empty AORDL template YAML

**Pros**:
- Protocol-agnostic (not Claude-specific)
- Tools directly accessible (no Bash wrapper)
- Centralized updates (upgrade MCP server, all projects benefit)

**Cons**:
- Requires MCP server installation/configuration
- Decoupled from requirements elicitation guidance
- No workflow orchestration (just tools)

---

### Option 3: Hybrid (Skill + MCP) [RECOMMENDED]

**Architecture**:
- **MCP Server**: Provides AORDL validation and transformation tools
- **Skill**: Provides requirements elicitation workflow and guidance

**MCP Server** (`aordl-tools`):
```typescript
// Tools exposed via MCP protocol
export const tools = {
  aordl_validate: ValidateTool,
  aordl_transform_to_bdd: TransformTool,
  aordl_generate_template: TemplateTool
};
```

**Skill** (`.claude/skills/aordl/SKILL.md`):
```markdown
---
name: aordl
description: Capture requirements using AORDL methodology. Guides through 13-field requirement elicitation, validates structure, transforms to BDD.
---

## Workflow
1. Elicit requirements from user conversation
2. Structure into 13 AORDL fields
3. Validate using `aordl_validate` tool (via MCP)
4. Transform to BDD using `aordl_transform_to_bdd` tool (via MCP)
5. Present to user for approval
```

**Pros**:
- **Separation of concerns**: Tools (MCP) vs. Methodology (Skill)
- **Best of both**: Protocol-agnostic tools + Claude-specific workflow
- **Composability**: Use MCP tools without skill, or skill references MCP tools
- **Portability**: Skill can be copied to projects; MCP server centrally managed

**Cons**:
- Two artifacts to maintain (MCP server + Skill)
- Dependency management (skill assumes MCP server available)

---

## Critical Design Decisions

### 1. Scope Boundary

**Question**: Where does "AORDL language" end and "ROME process" begin?

**Answer**:
- **AORDL Language** (portable):
  - 13-field specification
  - Validation rules
  - Anti-patterns
  - Transformation to BDD
- **ROME Process** (not portable):
  - Phase P1 entry/exit criteria
  - GATE-P1 checklist
  - Robot roles (Talib, Sarah)
  - P1→P2 handoff protocol

**Implication**: Plugin must NOT reference:
- Phase numbers (P1, P2, etc.)
- Quality gates (GATE-P1)
- Robot names (Talib, Sarah)
- ROME lifecycle stages

### 2. Validation Modes

**Question**: Are STRICT/GUIDED/PERMISSIVE modes AORDL-core or ROME-specific?

**Answer**: AORDL-core. These modes control validation rigor, not ROME orchestration.

**Implication**: Plugin retains all three modes as configurable options.

### 3. BDD Transformation

**Question**: Is BDD transformation intrinsic to AORDL or a ROME convention?

**Analysis**:
- BDD scenarios validate requirement completeness (testability)
- Common practice outside ROME (Cucumber, SpecFlow, Behave)
- Transformation logic is deterministic (no ROME-specific context)

**Answer**: AORDL-core feature (included in plugin).

### 4. OpenQuestions Resolution

**Question**: How to handle `OpenQuestions` field without ROME sponsor workflow?

**Current ROME Behavior**:
- Talib flags open questions
- User/sponsor provides answers
- GATE-P1 blocks if questions remain open

**Plugin Behavior**:
- Validate `OpenQuestions` structure
- Warn if status = OPEN (not FAIL)
- Guide user to resolve before finalization
- No external "sponsor" concept required

**Implication**: Plugin encourages resolution but doesn't enforce GATE-P1 blocking.

---

## Implementation Roadmap

### Phase 1: Extract Core Components
1. Copy validation/transformation tools from `/ROME/skills/tier-1/`
2. Copy manifest files from `/ROME/skills/registry/`
3. Remove ROME-specific references (Phase P1, GATE-P1, Talib, Sarah)
4. Create standalone test suite

### Phase 2: Build MCP Server
1. Initialize Node.js/TypeScript project (`aordl-mcp-server`)
2. Implement MCP protocol handlers
3. Expose three tools:
   - `aordl_validate`
   - `aordl_transform_to_bdd`
   - `aordl_generate_template`
4. Package as npm module
5. Publish to MCP registry (if public)

### Phase 3: Build Claude Skill
1. Create `.claude/skills/aordl/SKILL.md`
2. Define requirements elicitation workflow
3. Integrate with MCP tools (if available)
4. Provide fallback guidance if MCP server not installed
5. Include 13-field reference guide

### Phase 4: Documentation & Examples
1. Write `README.md` with installation instructions
2. Provide example AORDL requirements
3. Document validation error messages
4. Create quick-start guide

---

## Open Questions

1. **Public vs. Private Distribution**
   - Publish MCP server publicly (npm registry)?
   - Publish skill publicly (Claude skill repository)?
   - Decision impacts naming, licensing, documentation scope

2. **AORDL Branding**
   - Use "AORDL" name outside ROME context?
   - Rename to generic "Structured Requirements Language"?
   - Decision impacts discoverability and attribution

3. **Backward Compatibility**
   - Support ROME-specific fields (e.g., `PhaseGenerated: P1`)?
   - Ignore unknown fields or warn?
   - Decision impacts migration path for existing ROME projects

4. **Extension Mechanism**
   - Allow users to extend approved verbs?
   - Allow users to customize anti-patterns?
   - Decision impacts flexibility vs. standardization

---

## Risk Analysis

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Spec Drift**: ROME updates AORDL, plugin diverges | High | Establish versioning scheme (AORDL v1.0, v2.0) |
| **Dependency Conflict**: `js-yaml` version mismatch | Low | Lock dependencies in `package.json` |
| **Adoption Friction**: Users unfamiliar with AORDL | Medium | Provide interactive tutorial in skill |
| **Maintenance Burden**: Two artifacts (MCP + Skill) | Medium | Automate release pipeline, CI/CD |
| **ROME Coupling Creep**: Plugin re-introduces ROME concepts | High | Strict boundary enforcement, code reviews |

---

## Success Criteria

Plugin considered successful if:
1. ✅ Any Claude project can use AORDL without ROME framework
2. ✅ Validation and BDD transformation work identically to ROME
3. ✅ Zero references to ROME-specific concepts (phases, gates, robots)
4. ✅ Users can install via `npm install -g aordl-mcp-server` (MCP option)
5. ✅ Users can copy `.claude/skills/aordl/` to project (Skill option)
6. ✅ Documentation clear enough for non-ROME users

---

## Next Steps

1. **Decision Required**: Choose architecture (Skill, MCP, or Hybrid)
2. **Prototype**: Build minimal viable plugin (single tool, single skill)
3. **User Testing**: Validate with non-ROME project
4. **Refinement**: Iterate based on feedback
5. **Release**: Publish to appropriate registry/repository

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| v1.0 | 2025-12-29T00:00:00Z | Initial feasibility analysis |
