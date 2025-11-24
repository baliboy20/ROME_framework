# ROME Framework: Document Architecture

| Field | Value |
|-------|-------|
| **Document UID** | ROME-GOV-005 |
| **Version** | 1.0 |
| **Date** | 2025-11-21T00:00:00Z |
| **Status** | Draft |
| **Document Type** | Governance |
| **Author** | Framework Analyst & Architect |
| **Changes Approved** | false |

---

## Purpose

Defines how documents within the ROME framework relate to and reference each other. Establishes the hierarchical structure of the document corpus, reference policies, and naming conventions.

**Usage:**
- **Framework evolution:** Guides the Framework Analyst & Architect when creating or amending documents, ensuring new content integrates coherently with existing corpus
- **Framework audits:** Provides criteria for validating ROME consistency, completeness, and fidelity through periodic reviews of reference integrity, hierarchy compliance, and naming conventions

## Scope

Applies to all documents and folders within `/ROME/` directory.

## Dependencies

- ROME-PRIN-001 (Core Principles) - Principle 6: Single Source of Truth
- ROME-GOV-001 (Document Standards) - Individual document structure

---

## Document Hierarchy

### Tier Structure

Documents are organized into tiers based on authority and abstraction level:

```
Tier 0: Foundation (highest authority)
    │
    ├── Tier 1: Governance
    │
    ├── Tier 2: Life-cycle (Phases)
    │
    └── Tier 3: Operations (Robot templates, procedures)
```

### Tier Definitions

| Tier | Folder(s) | Purpose | Authority |
|------|-----------|---------|-----------|
| 0 | `/foundation/` | Core principles, lexicon, policies | Highest - defines framework identity |
| 1 | `/framework-governance/` | Document management, standards, procedures | Governs how framework operates |
| 2 | `/life-cycle/P**/` | Phase specifications, operations guidelines | Defines application development process |
| 3 | `/robot-templates/` | Robot definitions, operational procedures | Implements framework through agents |

### Folder Structure

```
/ROME/
├── foundation/
│   ├── core-principles.md
│   ├── core-principles-policy.md
│   └── lexicon.md
│
├── framework-governance/
│   ├── document-standards.md
│   ├── document-architecture.md
│   ├── uid-registry.md
│   ├── amendment-procedures.md
│   └── terminology-management.md
│
├── life-cycle/
│   ├── P00-bootup/
│   │   └── operations-guidelines.md
│   ├── P01-ingest/
│   │   └── operations-guidelines.md
│   ├── P02-analysis/
│   │   └── operations-guidelines.md
│   ├── P03-design/
│   │   └── operations-guidelines.md
│   ├── P04-config/
│   │   └── operations-guidelines.md
│   └── P05-generation/
│       └── operations-guidelines.md
│
└── robot-templates/
    ├── robot-operations-protocols/
    │   └── activity-logging-protocol.md
    ├── bootstrap/
    │   └── CLAUDE.md
    ├── roma/
    │   └── CLAUDE.md
    ├── talib/
    │   └── CLAUDE.md
    ├── pma/
    │   └── CLAUDE.md
    ├── clara/
    │   └── CLAUDE.md
    ├── sarah/
    │   └── CLAUDE.md
    ├── charlie/
    │   └── CLAUDE.md
    └── reena/
        └── CLAUDE.md
```

---

## Reference Policy

### Core Rule: Upward-Only References

Documents MUST only reference documents at the same tier or higher (lower tier number).

```
Tier 0 ← Tier 1 ← Tier 2 ← Tier 3
```

**Allowed:**
- Tier 3 → Tier 2, Tier 1, Tier 0
- Tier 2 → Tier 1, Tier 0
- Tier 1 → Tier 0
- Same tier → Same tier (sibling references)

**Prohibited:**
- Tier 0 → Tier 1, 2, 3
- Tier 1 → Tier 2, 3
- Tier 2 → Tier 3

### Reference Types

| Type | Direction | Example |
|------|-----------|---------|
| Dependency | Upward | Robot CLAUDE.md references ROME-PROC-005 |
| Authority | Upward | Phase guidelines reference ROME-PRIN-001 |
| Sibling | Lateral | P02-analysis references P01-ingest outputs |
| Sequence | Lateral | Phase N references Phase N-1 exit criteria |

### Sibling Reference Rules

Within the same tier:

**Life-cycle phases:**
- Forward references allowed (P01 → P02 for "next phase")
- Backward references allowed (P02 → P01 for "input from")
- Must reference outputs/interfaces, not internal details

**Robot templates:**
- May reference shared governance (`robot-operations-protocols/`)
- Should not reference other robot definitions directly
- Coordination via orchestrator, not direct robot-to-robot

### Exception Handling

If a downward reference is unavoidable:

1. Document the exception in both documents
2. Justify why upward reference is not possible
3. Add to exception registry (below)
4. Review quarterly for elimination

### Exception Registry

| Source (Higher) | Target (Lower) | Justification | Review Date |
|-----------------|----------------|---------------|-------------|
| *None currently* | | | |

---

## Naming Conventions

### Folder Naming

| Pattern | Usage | Example |
|---------|-------|---------|
| `lowercase-hyphenated/` | Standard folders | `framework-governance/` |
| `P##-name/` | Phase folders | `P01-ingest/` |
| `lowercase/` | Robot folders | `roma/`, `talib/` |

### Phase Folder Pattern

```
P[##]-[phase-name]/
```

- `##`: Two-digit zero-padded phase number (00-99)
- `phase-name`: Lowercase hyphenated phase name

| Folder | Phase |
|--------|-------|
| `P00-bootup/` | Framework initialization |
| `P01-ingest/` | Input intake |
| `P02-analysis/` | Requirements analysis |
| `P03-design/` | Architecture design |
| `P04-config/` | Technical configuration |
| `P05-generation/` | Code generation |

### File Naming

| Pattern | Usage | Example |
|---------|-------|---------|
| `lowercase-hyphenated.md` | Standard documents | `core-principles.md` |
| `operations-guidelines.md` | Phase operations | (standard per phase) |
| `CLAUDE.md` | Robot definitions | (uppercase, special) |

### Reserved Names

| Name | Purpose | Location |
|------|---------|----------|
| `CLAUDE.md` | Robot role definition | Each robot folder |
| `operations-guidelines.md` | Phase operations | Each phase folder |
| `lexicon.md` | Term definitions | `/foundation/` |

---

## Document Relationships

### Dependency Declaration

Documents SHOULD declare dependencies in a dedicated section:

```markdown
## Dependencies

- ROME-PRIN-001 (Core Principles) - [specific dependency]
- ROME-LEX-001 (Lexicon) - Terminology
```

### Relationship Types

| Relationship | Meaning | Notation |
|--------------|---------|----------|
| Depends On | Requires content from | `Dependencies:` section |
| Implements | Provides concrete realization of | "Implements ROME-XXX-###" |
| Extends | Adds to without modifying | "Extends ROME-XXX-###" |
| Supersedes | Replaces deprecated document | "Supersedes ROME-XXX-###" |

### Authority Chain

For any given topic, there is one authoritative source:

| Topic | Authority | Location |
|-------|-----------|----------|
| Principles | ROME-PRIN-001 | `/foundation/core-principles.md` |
| Terminology | ROME-LEX-001 | `/foundation/lexicon.md` |
| Document format | ROME-GOV-001 | `/framework-governance/document-standards.md` |
| Document structure | ROME-GOV-005 | `/framework-governance/document-architecture.md` |
| UIDs | ROME-GOV-002 | `/framework-governance/uid-registry.md` |
| Phase operations | ROME-PHASE-### | `/life-cycle/P##-name/operations-guidelines.md` |
| Robot behavior | ROME-ROBOT-### | `/robot-templates/[name]/CLAUDE.md` |

---

## Validation Rules

### Pre-Commit Checks

Before committing document changes:

1. **Reference direction:** All references point upward or lateral
2. **UID validity:** All referenced UIDs exist in registry
3. **Path validity:** All file paths resolve correctly
4. **Naming compliance:** File/folder names follow conventions

### Periodic Audits

Quarterly review:

1. Exception registry - can exceptions be eliminated?
2. Reference integrity - any broken links?
3. Hierarchy compliance - any violations introduced?
4. Naming drift - any non-compliant names?

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 1.0 | 2025-11-21T00:00:00Z | Initial document creation |
