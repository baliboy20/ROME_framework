# Changelog

All notable changes to the ROME Methodology will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [5.0.0] - 2025-11-06

### Added

#### HTM Integration
- **HTM Documentation Suite** - Complete HTM methodology integrated as Phase 1
  - `/HTM/` directory with 7 comprehensive documentation files
  - HTM-Master-Workflow.md - 4-stage requirements engineering process
  - Prompting-Claude-for-HTM.md - HTM Decomposer instructions
  - HTM-Input-Requirements.md - Input quality requirements
  - Transforming-PRDs-for-HTM.md - PRD transformation guide
  - HTM-Ready-PRD-Structure.md - Target PRD structure
  - HTM-Documentation-Suite-Completion-Summary.md - Suite overview

#### New Roles & Robots
- **HTM Decomposer Robot** - New Phase 1 requirements engineering role
  - `/robots/robot_htm_decomposer/` directory
  - `role-htm-decomposer.md` - Complete role specification
  - Handles PRD transformation and hierarchical decomposition

#### Integration Documentation
- **HTM-ROME Integration Guide** - Master integration document
  - Complete workflow from PRD to development
  - Decision trees for when to use HTM
  - Handoff protocols between phases
- **Quick Start Guide** - Fast onboarding for v5.0
  - Step-by-step workflow
  - Common scenarios
  - Troubleshooting
- **HTM-to-PMA Handoff Protocol** - Phase 1 → Phase 2 transition
  - Artifact reading instructions
  - Validation checklist

#### Repository Structure
- `/ROME/integration/` - New directory for integration docs
- `/ROME/roles/` - Reorganized role specifications
- `/ROME/guides/` - Reorganized guide documents
- `/ROME/archive/v4.0/` - Archived v4.0 documentation
- `/templates/` - Project and artifact templates
- `/examples/` - Real-world project examples

#### Documentation
- `CHANGELOG.md` - This file
- `MIGRATION-GUIDE.md` - v4.0 to v5.0 migration instructions
- `implementation-checklist.md` - Implementation roadmap

### Changed

#### 🚨 BREAKING CHANGES

##### Phase 1: HTM Requirements Engineering
- **Old (v4.0):** Chaperone refined specifications through technical analysis
  - Input: Raw requirements
  - Output: `specification_augmented.md` (Markdown prose)
  - Agent: Chaperone

- **New (v5.0):** HTM Decomposer performs structured requirements engineering
  - Input: External PRD (any format)
  - Output: YAML artifacts (requirements-matrix, data-dictionary, component-registry)
  - Agent: HTM Decomposer

**Impact:** Complete workflow change for Phase 1. Teams must learn HTM methodology.

##### Phase 2: PMA Role Expanded

- **Old Step 1:** Requirements Analysis (general)
- **New Step 1:** Read and Analyze HTM Artifacts (specific YAML reading)

- **Old Step 2:** Data-First Design (data model only)
- **New Step 2:** Technical Architecture Design (comprehensive)
  - Technology stack selection
  - API contract design
  - Data layer architecture
  - Authentication patterns
  - Caching strategy
  - Deployment architecture
  - Risk assessment

**Why changed:** PMA has expert documentation and MCP server access. Better positioned to make informed technical architecture decisions.

**Impact:** PMA role significantly expanded. Requires expert docs and MCP access.

##### Chaperone Role Refocused

- **Old (v4.0):** 
  - Phase 1: Specification refinement
  - Phase 2B: Design validation

- **New (v5.0):**
  - Phase 2B: Design validation ONLY
  - Validates both HTM artifacts AND PMA outputs

**Impact:** Chaperone no longer does Phase 1. Focused exclusively on validation gate.

#### Updated Documentation

- **`rome-overview.md`** - Rewritten for v5.0
  - Phase 1 now HTM
  - Phase 2 expanded description
  - Updated workflow diagrams

- **`ROME-4.0-COMPLETE-GUIDE.md`** → **`ROME-5.0-COMPLETE-GUIDE.md`**
  - Complete rewrite of Phase 1 section
  - Expanded Phase 2 Step 2 documentation
  - Updated document flow diagrams

- **`start-here.md`** - Completely rewritten
  - HTM Phase 1 instructions
  - PMA Phase 2 expanded steps
  - Updated handoff protocols

- **`role-pma.md`** - Major update
  - New Step 1: Reading HTM artifacts
  - Expanded Step 2: Technical architecture design
  - Resource requirements (expert docs, MCP)
  - Success criteria updated

- **`role-chaperone.md`** - Refocused
  - Removed Phase 1 responsibilities
  - Enhanced Phase 2B validation criteria
  - Updated to validate YAML artifacts

- **`document-governance-matrix.md`** - Updated
  - Added HTM artifact types
  - Added architecture_specification.md
  - Updated document flow

#### Project Structure

```diff
PROJECT/
+ ├── requirements/              # NEW - HTM Phase 1 outputs
+ │   ├── requirements-matrix.yaml
+ │   ├── data-dictionary.yaml
+ │   ├── component-registry.yaml
+ │   └── docs/features/*.md
+ │
  ├── dev/                        # Phase 2 PMA outputs
+ │   ├── architecture_specification.md  # NEW
  │   ├── data_model.md           # Now refined from HTM
  │   ├── integration_test_plan.md
  │   └── actionlist.md
  │
  ├── SOURCE/                     # Unchanged
  └── robots/                     # Unchanged structure
+     └── robot_htm_decomposer/   # NEW robot
```

### Removed

- **Chaperone Phase 1 Specification Refinement**
  - Replaced by HTM Decomposer
  - No longer part of ROME workflow

- **PMA Step 1 "Requirements Analysis" (old version)**
  - Replaced with "Read HTM Artifacts"

### Deprecated

- **specification_augmented.md** (v4.0 artifact)
  - Replaced by HTM YAML artifacts
  - Old format no longer used in v5.0

### Archived

- ROME v4.0 documentation moved to `/ROME/archive/v4.0/`
  - `ROME-4.0-COMPLETE-GUIDE.md`
  - `rome-overview-v4.md`
  - Available for reference but not maintained

### Migration

See `MIGRATION-GUIDE.md` for detailed migration instructions from v4.0 to v5.0.

**Key Migration Paths:**
1. **New projects:** Start with v5.0 HTM Phase 1
2. **In-progress (Phase 2+):** Finish with v4.0, next project use v5.0
3. **Convert existing specs:** Run HTM on v4.0 specs, continue with v5.0

---

## [4.0.0] - 2025-10-XX

### Added
- 4-Phase execution model (Phase 1, 2, 2B, 3, 4)
- Phase 2B Design Validation Gate
- Chaperone validation role
- Document governance system
- Integration-first testing methodology
- Class annotation system
- Vertical feature slice approach

### Changed
- Split Phase 2 into 2 and 2B (planning vs validation)
- Formalized robot protocols (6-step process)
- Standardized project structure

---

## [3.0.0] - 2025-10-XX

### Added
- Integration-first testing philosophy
- Data-driven design approach
- Robot specialization (Ashok, Reena, Charlie)

### Changed
- Moved away from unit-test-first
- Focus on vertical slices over horizontal layers

---

## [2.0.0] - 2025-XX-XX

### Added
- Multi-robot coordination
- Role-based development

---

## [1.0.0] - 2025-XX-XX

### Added
- Initial ROME methodology
- Basic robot framework

---

## Version Comparison Matrix

| Feature | v4.0 | v5.0 | Change Type |
|---------|------|------|-------------|
| **Phase 1 Agent** | Chaperone | HTM Decomposer | Breaking |
| **Phase 1 Output** | Markdown prose | YAML artifacts | Breaking |
| **Requirements Format** | Unstructured | Hierarchical (Epic→Feature→Story→Task) | Breaking |
| **PMA Architecture Role** | Limited (data only) | Comprehensive (full stack) | Major |
| **PMA Inputs** | specification_augmented.md | HTM YAML artifacts | Breaking |
| **Chaperone Phase 1** | Yes | No (removed) | Breaking |
| **Chaperone Phase 2B** | Yes | Yes (enhanced) | Minor |
| **Development Robots** | Ashok, Reena, Charlie | Unchanged | None |
| **Integration Testing** | Yes | Yes | None |
| **Class Annotations** | Yes | Yes | None |
| **Vertical Slices** | Yes | Yes | None |

---

## Upgrade Path Summary

### Breaking Changes
1. Phase 1 workflow completely different (Chaperone → HTM)
2. PMA inputs changed (Markdown → YAML)
3. Phase 2 Step 2 expanded significantly

### Compatible Changes
1. Phase 2B validation process (enhanced but compatible)
2. Phase 3 development (unchanged)
3. Phase 4 deployment (unchanged)
4. Class annotations (unchanged)
5. Integration testing (unchanged)

### Recommended Action
- **New projects:** Use v5.0 from start
- **In-progress:** Complete with v4.0
- **Converting:** Follow migration guide

---

## Support

- **Issues:** [GitHub Issues](link)
- **Discussions:** [GitHub Discussions](link)
- **Documentation:** [Wiki](link)
- **Migration Help:** See `MIGRATION-GUIDE.md`

---

## Contributors

- [Your name/team]

---

**Legend:**
- 🚨 Breaking change
- ⚠️ Deprecated
- ✨ New feature
- 🐛 Bug fix
- 📝 Documentation
- ♻️ Refactor
