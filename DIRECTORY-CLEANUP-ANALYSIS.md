# ROME Directory Structure Cleanup Analysis

**Date:** 2026-01-07
**Purpose:** Identify stale, redundant, and obsolete directories after plugin architecture migration

---

## ✅ CLEANUP EXECUTION SUMMARY

**Execution Date:** 2026-01-07 16:09-16:11
**Status:** COMPLETED
**Result:** Successfully removed old ROME/ monolithic structure (~2.7MB)

### Actions Performed

**Phase 1: Backup Created**
- ✅ Created `ROME-backup-20260107.tar.gz` (729K compressed)
- Backed up: `ROME/` and `Experts/` directories

**Phase 2: Core Framework Documents Migrated**
- ✅ Migrated 17 core framework files to `rome-core/docs/`
  - 4 files: `foundation/` → `rome-core/docs/foundation/`
  - 11 files: `framework-governance/` → `rome-core/docs/governance/`
  - 2 files: `framework-specifications/` → `rome-core/docs/specifications/`

**Phase 3: Fully Migrated Content Deleted**
- ✅ Deleted `ROME/robot-templates/` (832K) - All agents migrated to `rome-*/agents/`
- ✅ Deleted `ROME/skills/` (1.3M) - All skills migrated to `rome-*/skills/`
- ✅ Deleted `ROME/templates/` (120K) - Templates migrated to `rome-core/templates/`

**Phase 4: Historical Content Archived**
- ✅ Moved `ROME/life-cycle/` (172K) → `ROME_framework_maintenance/archive/`
- ✅ Moved `ROME/GETTING-STARTED-GUIDE.md` (30K) → `ROME_framework_maintenance/archive/`

**Phase 5: Root Directory Removed**
- ✅ Deleted entire `ROME/` directory after verifying all content migrated

### Space Freed
- **Total:** ~2.7MB removed from working directory
- Backup size: 729K (compressed)
- Net cleanup: ~2.0MB reduction in repository size

### Remaining Structure
```
ROME/                   # Operational framework (all plugins)
  ├── rome-core/        # Foundation plugin
  │   └── docs/         # Core framework documentation
  │       ├── foundation/       # Core principles, lexicon
  │       ├── governance/       # Document standards, policies
  │       └── specifications/   # Framework specs
  ├── rome-p0-bootup/   # Phase 0: Project bootstrap
  ├── rome-p1-aordl/    # Phase 1: AORDL requirements
  ├── rome-p2-analysis/ # Phase 2: Requirements analysis
  ├── rome-p3-design/   # Phase 3: System design
  ├── rome-p4-config/   # Phase 4: Workspace configuration
  ├── rome-p5-generation/ # Phase 5: Code generation
  └── rome-qa/          # Quality assurance

ROME_architect/         # Archie working directory (support)
ROME_framework_maintenance/  # Framework improvement (support)
  ├── proposals/        # Active proposals
  ├── implemented-proposals/ # Implemented proposals
  └── archive/          # Historical docs
test-project-to-validate-framework-v1/  # Testing (ancillary)
```

---

## Executive Summary

The ROME Framework has migrated from a **monolithic directory structure** (`/ROME/`) to a **modular plugin architecture** (`rome-*/` plugins). This analysis identifies directories that are now redundant and recommends cleanup actions.

**Key Finding:** The `/ROME/` directory (2.7MB) contains the old monolithic framework structure that has been superseded by the new plugin architecture.

---

## Directory Analysis

### 🆕 NEW: Plugin Architecture (Currently Active)

These directories represent the **new phase-based plugin architecture** implemented via ROME-PROP-018, now consolidated under `ROME/`:

| Directory | Size | Status | Purpose |
|-----------|------|--------|---------|
| `ROME/rome-core/` | 896K | ✅ ACTIVE | Foundation plugin with shared libraries, Roma orchestrator, MCP server |
| `ROME/rome-p0-bootup/` | 32K | ✅ ACTIVE | Phase 0: Project bootstrap (Bootstrap agent) |
| `ROME/rome-p1-aordl/` | 52K | ✅ ACTIVE | Phase 1: AORDL requirements (Talib P1 agent) |
| `ROME/rome-p2-analysis/` | 52K | ✅ ACTIVE | Phase 2: Requirements analysis (Talib P2 agent) |
| `ROME/rome-p3-design/` | 100K | ✅ ACTIVE | Phase 3: System design (PMA, Clara agents) |
| `ROME/rome-p4-config/` | 84K | ✅ ACTIVE | Phase 4: Workspace configuration (Lucien agent) |
| `ROME/rome-p5-generation/` | 72K | ✅ ACTIVE | Phase 5: Parallel code generation (Ashok, Reena, Charlie) |
| `ROME/rome-qa/` | 52K | ✅ ACTIVE | Quality assurance (Sarah agent) |

**Total New Architecture:** ~1.4MB, 8 plugins, 10 agents (all in `ROME/`)

---

### 🗂️ OLD: Monolithic Structure (Superseded)

The `/ROME/` directory (2.7MB) contains the **old monolithic framework** that has been replaced by the plugin architecture:

| Directory | Size | Status | Content | Recommendation |
|-----------|------|--------|---------|----------------|
| `ROME/robot-templates/` | ~800K | 🔴 SUPERSEDED | Old robot CLAUDE.md files | **DELETE** - Migrated to `rome-*/agents/` |
| `ROME/skills/` | ~1.2MB | 🔴 SUPERSEDED | Old skill definitions with test files | **DELETE** - Migrated to `rome-*/skills/` |
| `ROME/templates/` | ~100K | 🔴 SUPERSEDED | AORDL templates | **DELETE** - Migrated to `rome-core/templates/` |
| `ROME/life-cycle/` | ~50K | 🔴 SUPERSEDED | Phase specifications | **ARCHIVE** - May have historical docs |
| `ROME/framework-governance/` | ~200K | ⚠️ REVIEW | Document standards, policies | **MIGRATE** to `ROME_framework_maintenance/` |
| `ROME/framework-specifications/` | ~50K | ⚠️ REVIEW | Skill/subagent specs | **MIGRATE** to `ROME_framework_maintenance/` |
| `ROME/foundation/` | ~100K | ⚠️ REVIEW | Core principles, lexicon | **MIGRATE** to `ROME_framework_maintenance/` |
| `ROME/GETTING-STARTED-GUIDE.md` | ~30K | ⚠️ REVIEW | Old getting started guide | **KEEP** - Still useful for reference |

**Total Old Architecture:** ~2.7MB

---

### 🤔 UNCLEAR: Additional Directories

| Directory | Size | Status | Purpose | Recommendation |
|-----------|------|--------|---------|----------------|
| `Experts/` | 736K | ❓ UNCLEAR | Flutter/Parse Server expert profiles | **REVIEW** - Clarify purpose, possibly delete |
| `Experts/analysis_design_stages/` | ~50K | ❓ UNCLEAR | Analysis/design stage docs | **REVIEW** - Possibly merge into plugins |
| `Experts/expert_flutter/` | ~600K | ❓ UNCLEAR | Flutter-specific guidance | **REVIEW** - Move to skills or archive |
| `Experts/expert_parse_server/` | ~80K | ❓ UNCLEAR | Parse Server guidance | **REVIEW** - Move to skills or archive |

**Total Experts:** ~736K

---

### ✅ KEEP: Framework Maintenance & Governance

These directories contain **active governance and maintenance** documents:

| Directory | Size | Status | Purpose | Recommendation |
|-----------|------|--------|---------|----------------|
| `ROME_architect/` | ~24K | ✅ KEEP | Archie's working directory with CLAUDE.md | **KEEP** - Active role definition |
| `ROME_framework_maintenance/` | ~400K | ✅ KEEP | Proposals, implemented proposals, reviews | **KEEP** - Active governance |
| `test-project-to-validate-framework-v1/` | ~16K | ✅ KEEP | Test/validation project | **KEEP** - Useful for testing |

**Documentation Added (New):**
- `INSTALLATION-GUIDE.md` (16K) - ✅ KEEP
- `TESTING.md` (23K) - ✅ KEEP
- `PLUGIN-MANIFEST.md` (35K) - ✅ KEEP
- `GENERATION-PLUGINS-MANIFEST.md` - ✅ KEEP

---

## Redundancy Analysis

### Content Migration Status

| Old Location | New Location | Migration Status |
|--------------|--------------|------------------|
| `ROME/robot-templates/ashok/CLAUDE.md` | `ROME/rome-p5-generation/agents/ashok/AGENT.md` | ✅ MIGRATED |
| `ROME/robot-templates/bootstrap/CLAUDE.md` | `ROME/rome-p0-bootup/agents/bootstrap/AGENT.md` | ✅ MIGRATED |
| `ROME/robot-templates/charlie/CLAUDE.md` | `ROME/rome-p5-generation/agents/charlie/AGENT.md` | ✅ MIGRATED |
| `ROME/robot-templates/clara/CLAUDE.md` | `ROME/rome-p3-design/agents/clara/AGENT.md` | ✅ MIGRATED |
| `ROME/robot-templates/lucien/CLAUDE.md` | `ROME/rome-p4-config/agents/lucien/AGENT.md` | ✅ MIGRATED |
| `ROME/robot-templates/pma/CLAUDE.md` | `ROME/rome-p3-design/agents/pma/AGENT.md` | ✅ MIGRATED |
| `ROME/robot-templates/reena/CLAUDE.md` | `ROME/rome-p5-generation/agents/reena/AGENT.md` | ✅ MIGRATED |
| `ROME/robot-templates/roma/CLAUDE.md` | `ROME/rome-core/agents/roma/AGENT.md` | ✅ MIGRATED |
| `ROME/robot-templates/sarah/CLAUDE.md` | `ROME/rome-qa/agents/sarah/AGENT.md` | ✅ MIGRATED |
| `ROME/robot-templates/talib/CLAUDE.md` | `ROME/rome-p1-aordl/agents/talib/AGENT.md` (P1)<br>`ROME/rome-p2-analysis/agents/talib/AGENT.md` (P2) | ✅ MIGRATED |
| `ROME/skills/*` (40 skills) | `ROME/rome-*/skills/` (distributed across plugins) | ✅ MIGRATED |
| `ROME/templates/aordl/*` | `ROME/rome-core/templates/aordl/` | ✅ MIGRATED |

**Status:** All robot templates, skills, and templates have been successfully migrated to the plugin architecture.

---

## Detailed Breakdown: ROME/ Directory

### ROME/robot-templates/ (SUPERSEDED)

**Old robots migrated to plugin agents:**
```
ROME/robot-templates/
├── ashok/           → ROME/rome-p5-generation/agents/ashok/
├── bootstrap/       → ROME/rome-p0-bootup/agents/bootstrap/
├── charlie/         → ROME/rome-p5-generation/agents/charlie/
├── clara/           → ROME/rome-p3-design/agents/clara/
├── lucien/          → ROME/rome-p4-config/agents/lucien/
├── pma/             → ROME/rome-p3-design/agents/pma/
├── reena/           → ROME/rome-p5-generation/agents/reena/
├── roma/            → ROME/rome-core/agents/roma/
├── sarah/           → ROME/rome-qa/agents/sarah/
└── talib/           → ROME/rome-p1-aordl/agents/talib/ (P1 mode)
                     → ROME/rome-p2-analysis/agents/talib/ (P2 mode)
```

**Recommendation:** DELETE entire `ROME/robot-templates/` directory (all content migrated)

### ROME/skills/ (SUPERSEDED)

**Old skills migrated to plugin skills:**
- ~40 skill definitions
- Test files (test-*.js) no longer needed
- Old skill registry system replaced by plugin manifests

**New Distribution:**
- P1 skills → `ROME/rome-p1-aordl/skills/`
- P2 skills → `ROME/rome-p2-analysis/skills/`
- P3 skills → `ROME/rome-p3-design/skills/`
- P4 skills → `ROME/rome-p4-config/skills/`
- P5 skills → `ROME/rome-p5-generation/skills/`
- QA skills → `ROME/rome-qa/skills/`

**Recommendation:** DELETE entire `ROME/skills/` directory (all content migrated to plugins)

### ROME/templates/ (SUPERSEDED)

**Old templates migrated:**
- `ROME/templates/aordl/*` → `ROME/rome-core/templates/aordl/`

**Recommendation:** DELETE `ROME/templates/` directory (content migrated)

### ROME/foundation/ (REVIEW)

**Contents:**
- `core-principles.md` - ROME core principles
- `core-principles-policy.md` - Policy enforcement
- `document-governance.md` - Document management
- `lexicon.md` - Framework terminology

**Recommendation:** **MIGRATE** to `ROME_framework_maintenance/foundation/` (governance docs should be centralized)

### ROME/framework-governance/ (REVIEW)

**Contents:**
- Document standards, taxonomy, architecture
- Activity log format specifications
- Robot baseline definitions
- Amendment procedures
- Terminology management
- UID registry
- Sponsor interaction policies

**Recommendation:** **MIGRATE** to `ROME_framework_maintenance/governance/` (consolidate governance)

### ROME/framework-specifications/ (REVIEW)

**Contents:**
- `skill-framework-specification.md` - Old skill framework (superseded by plugin skills)
- `subagent-framework-specification.md` - Subagent specs

**Recommendation:** **ARCHIVE** or **MIGRATE** to `ROME_framework_maintenance/specifications/` (historical reference)

### ROME/life-cycle/ (REVIEW)

**Contents:**
- Phase specifications for P0-P5
- Workflow definitions

**Recommendation:** **REVIEW** for unique content, then **DELETE** (phase workflows now in plugin README.md files)

### ROME/GETTING-STARTED-GUIDE.md (KEEP)

**Status:** Useful beginner guide
**Recommendation:** **KEEP** - Still has value as a high-level introduction

---

## Experts/ Directory Analysis

### Purpose: UNCLEAR

The `Experts/` directory (736K) appears to contain technology-specific expert guidance:

**Contents:**
- `Experts/analysis_design_stages/` - Analysis/design documentation
- `Experts/expert_flutter/` (600K) - Flutter development guidance
- `Experts/expert_parse_server/` (80K) - Parse Server configuration

**Questions:**
1. Is this content referenced by any active plugins?
2. Should Flutter/Parse Server guidance be plugin skills instead?
3. Is this legacy content from older ROME versions?

**Recommendation:**
- **REVIEW** - Determine if content should be:
  - Converted to plugin skills (preferred)
  - Moved to `ROME_framework_maintenance/technology-guides/`
  - Archived as legacy content
  - Deleted if obsolete

---

## Recommended Cleanup Actions

### Priority 1: DELETE (Fully Migrated)

**These directories are 100% superseded by plugin architecture:**

```bash
# DELETE - All content migrated to plugins
rm -rf ROME/robot-templates/
rm -rf ROME/skills/
rm -rf ROME/templates/

# Size savings: ~2.1MB
```

### Priority 2: MIGRATE (Governance Consolidation)

**Move governance documents to ROME_framework_maintenance:**

```bash
# MIGRATE foundation documents
mkdir -p ROME_framework_maintenance/foundation/
mv ROME/foundation/* ROME_framework_maintenance/foundation/

# MIGRATE governance documents
mkdir -p ROME_framework_maintenance/governance/
mv ROME/framework-governance/* ROME_framework_maintenance/governance/

# MIGRATE specifications (archive)
mkdir -p ROME_framework_maintenance/specifications/
mv ROME/framework-specifications/* ROME_framework_maintenance/specifications/
```

### Priority 3: REVIEW & DECIDE

**Review these directories before action:**

```bash
# REVIEW life-cycle specs
# Check for unique content not in plugin README.md files
ROME/life-cycle/

# REVIEW Experts directory
# Determine: convert to skills, migrate, or delete
Experts/

# KEEP getting started guide
# Move to top-level docs if desired
ROME/GETTING-STARTED-GUIDE.md
```

### Priority 4: DELETE Root ROME/ Directory

**After migrations complete:**

```bash
# DELETE old monolithic ROME directory
rm -rf ROME/

# Size savings: ~2.7MB
```

---

## Size Impact Summary

| Action | Directories | Size Impact | Risk |
|--------|-------------|-------------|------|
| DELETE robot-templates, skills, templates | 3 dirs | -2.1MB | ✅ LOW (fully migrated) |
| MIGRATE governance docs | 3 dirs | -450K | ✅ LOW (just moving) |
| REVIEW Experts/ | 3 dirs | -736K | ⚠️ MEDIUM (unclear purpose) |
| DELETE entire ROME/ | 1 dir | -2.7MB | ✅ LOW (after migrations) |
| **TOTAL POTENTIAL SAVINGS** | | **-3.4MB** | |

---

## Recommended Cleanup Script

```bash
#!/bin/bash
# ROME Framework Directory Cleanup
# Execute after reviewing this analysis

set -e

echo "=== ROME Directory Cleanup ==="
echo ""

# PHASE 1: Backup before deletion
echo "Phase 1: Creating backup..."
tar -czf ROME-backup-$(date +%Y%m%d).tar.gz ROME/ Experts/
echo "✓ Backup created: ROME-backup-$(date +%Y%m%d).tar.gz"
echo ""

# PHASE 2: Delete fully migrated directories
echo "Phase 2: Deleting fully migrated content..."
read -p "Delete ROME/robot-templates/, ROME/skills/, ROME/templates/? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf ROME/robot-templates/
    rm -rf ROME/skills/
    rm -rf ROME/templates/
    echo "✓ Deleted migrated directories (~2.1MB freed)"
fi
echo ""

# PHASE 3: Migrate governance documents
echo "Phase 3: Migrating governance documents..."
read -p "Migrate foundation/governance/specs to ROME_framework_maintenance/? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    mkdir -p ROME_framework_maintenance/foundation/
    mkdir -p ROME_framework_maintenance/governance/
    mkdir -p ROME_framework_maintenance/specifications/

    mv ROME/foundation/* ROME_framework_maintenance/foundation/ 2>/dev/null || true
    mv ROME/framework-governance/* ROME_framework_maintenance/governance/ 2>/dev/null || true
    mv ROME/framework-specifications/* ROME_framework_maintenance/specifications/ 2>/dev/null || true

    echo "✓ Governance documents migrated"
fi
echo ""

# PHASE 4: Manual review required
echo "Phase 4: Manual review required for:"
echo "  - ROME/life-cycle/ (check for unique content)"
echo "  - Experts/ (determine: skill conversion, migrate, or delete)"
echo "  - ROME/GETTING-STARTED-GUIDE.md (consider moving to docs/)"
echo ""

# PHASE 5: Delete root ROME/ directory (after manual review)
echo "Phase 5: Delete ROME/ directory"
echo "After manual review of life-cycle/ and moving GETTING-STARTED-GUIDE.md:"
echo "  rm -rf ROME/"
echo ""

echo "=== Cleanup Script Complete ==="
echo "Review the changes and commit when satisfied."
```

---

## Post-Cleanup Verification

After cleanup, verify the directory structure:

```bash
# Expected active directories:
rome-core/              # Foundation plugin
rome-p0-bootup/         # Phase 0 plugin
rome-p1-aordl/          # Phase 1 plugin
rome-p2-analysis/       # Phase 2 plugin
rome-p3-design/         # Phase 3 plugin
rome-p4-config/         # Phase 4 plugin
rome-p5-generation/     # Phase 5 plugin
rome-qa/                # QA plugin
rome-full/              # Meta-plugin
ROME_architect/         # Archie working directory
ROME_framework_maintenance/  # Governance & proposals
test-project-to-validate-framework-v1/  # Test project

# Documentation
INSTALLATION-GUIDE.md
TESTING.md
PLUGIN-MANIFEST.md
GENERATION-PLUGINS-MANIFEST.md
DIRECTORY-CLEANUP-ANALYSIS.md (this file)
```

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Deleting content still in use | 🔴 HIGH | Create backup tarball first |
| Losing historical governance docs | 🟡 MEDIUM | Migrate to ROME_framework_maintenance/ |
| Breaking references to ROME/ | 🟢 LOW | All plugins self-contained |
| Removing useful Experts/ content | 🟡 MEDIUM | Manual review before deletion |

---

## Conclusion

The ROME Framework has successfully migrated from a **monolithic directory structure** to a **modular plugin architecture**. The old `/ROME/` directory (2.7MB) is now redundant and can be safely removed after:

1. **Migrating governance documents** to `ROME_framework_maintenance/`
2. **Reviewing** `ROME/life-cycle/` and `Experts/` for unique content
3. **Creating a backup** before deletion

**Estimated cleanup impact:** ~3.4MB freed, cleaner repository structure, reduced confusion between old and new architectures.

**Next Steps:**
1. Review this analysis
2. Execute cleanup script with manual approval at each phase
3. Verify plugin functionality after cleanup
4. Commit cleaned directory structure
