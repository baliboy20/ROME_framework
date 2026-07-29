# ROME Framework: Terminology Management

| Field | Value |
|-------|-------|
| **Document UID** | ROME-GOV-004 |
| **Version** | 1.0 |
| **Date** | 2025-11-21T00:00:00Z |
| **Status** | Draft |
| **Document Type** | Governance |
| **Author** | Framework Analyst & Architect |
| **Changes Approved** | false |

---

## Purpose

Defines procedures for managing framework terminology to ensure terminological integrity as required by ROME-PRIN-001 Principle 8. Governs additions, modifications, and usage of terms in the ROME Lexicon.

## Scope

Applies to all framework-specific terminology used within `/ROME/` documents.

## Dependencies

- ROME-PRIN-001 (Core Principles) - Principle 8: Terminological Integrity
- ROME-LEX-001 (Lexicon) - Authoritative term definitions
- ROME-GOV-003 (Amendment Procedures) - Change control process

---

## Terminology Lifecycle

### 1. Proposal

New terms arise from:
- Framework development needs
- Gap identification during document authoring
- Ambiguity discovered during robot operations

### 2. Validation

Before adding to lexicon:
- Verify term is necessary (no existing term suffices)
- Check for conflicts with existing terms
- Check for conflicts with standard software engineering usage
- Define scope boundaries

### 3. Definition

Create lexicon entry with required components (see Entry Requirements below).

### 4. Integration

- Add to ROME-LEX-001
- Update documents using informal references to use canonical term
- Notify relevant robots of new terminology

### 5. Maintenance

- Monitor for drift in usage
- Update definition if scope changes
- Deprecate if term becomes obsolete

---

## Lexicon Entry Requirements

### Required Components

Each lexicon entry MUST include:

| Component | Description |
|-----------|-------------|
| **Term** | The canonical term (bold, title case) |
| **Definition** | Precise, unambiguous definition |
| **Scope** | Where/how the term applies |

### Optional Components

| Component | When Required |
|-----------|---------------|
| **Characteristics** | For complex concepts with multiple attributes |
| **Contrast** | When term could be confused with similar terms |
| **Examples** | When definition benefits from illustration |
| **ID Pattern** | For terms with structured identifiers |

### Entry Format

```markdown
**Term Name**
- Definition statement
- Additional detail if needed
- Scope: [scope description]
```

---

## Conflict Detection

### Types of Conflicts

| Conflict Type | Description | Resolution |
|---------------|-------------|------------|
| Internal Overlap | Two ROME terms with overlapping meaning | Merge or differentiate |
| External Collision | ROME term conflicts with standard usage | Rename or explicitly distinguish |
| Scope Creep | Term used beyond defined scope | Tighten definition or expand scope |
| Ambiguity | Term has multiple interpretations | Clarify definition |

### Detection Methods

1. **Pre-addition check:** Before adding new term, search existing lexicon
2. **Usage audit:** Periodic review of term usage in documents
3. **Robot feedback:** Robots flag ambiguous terms during operation

### Resolution Process

1. Identify all usages of conflicting terms
2. Determine canonical meaning
3. Update lexicon entry
4. Update all affected documents
5. Log resolution in lexicon revision history

---

## Usage Constraints

### Prohibited Practices

Per ROME-LEX-001 "Term Usage Constraints":

- Do not use "phase" for project management phases external to ROME
- Do not use "robot" for RPA systems
- Do not use "quality gate" for CI/CD pipeline gates (unless explicitly integrating)

### Required Practices

- Use terms exactly as defined (no synonyms)
- First usage in a document should reference lexicon for complex terms
- Terms with ID patterns must follow specified format

---

## Standard Terminology Alignment

### Aligned Terms

These ROME terms deliberately align with standard software engineering usage:

- Requirements
- Architecture
- Code Generation

### Distinguished Terms

These ROME terms have specific meanings distinct from common usage:

| ROME Term | Common Usage | ROME Meaning |
|-----------|--------------|--------------|
| Robot | RPA, physical robot | Claude Code session with defined role |
| Phase | Project phase | ROME lifecycle stage with gates |
| Orchestrator | Container orchestration | Roma robot coordinating agents |

---

## Term Categories

### Framework Structure Terms

Terms defining ROME's organizational structure:
- ROME, Phase, Quality Gate

### Phase Terms

Terms specific to lifecycle phases:
- Ingest, Analysis, Design, Config, Generation

### Agent Terms

Terms related to robot operations:
- Robot, Orchestrator

### Document Terms

Terms for document management:
- UID, Revision Log, PRD, BRD

### Activity Tracking Terms

Terms for work tracking:
- Activity Log, Feature Entry, Story Entry, Blocker Entry, Amendment Entry, Phase Entry, Capability (formerly Layer, deprecated), Activity Status, Logging Trigger

### Core Concept Terms

Foundational framework concepts:
- Traceability, Single Source of Truth, Atomic Requirement, Terminological Integrity, LLM Optimization

### Technical Artifact Terms

Terms for produced artifacts:
- Data Dictionary, Technical Specification, Action List, Glossary

---

## Maintenance Procedures

### Adding a Term

1. Verify necessity and uniqueness
2. Draft entry following Entry Requirements
3. Check for conflicts (internal and external)
4. Add to appropriate section in ROME-LEX-001
5. Update this document's term categories if new category needed

### Modifying a Term

1. Follow ROME-GOV-003 Category 4 (Modifications) process
2. Identify all documents using the term
3. Update lexicon entry
4. Update affected documents atomically
5. Notify robots of terminology change

### Deprecating a Term

1. Mark term as deprecated in lexicon
2. Provide replacement term if applicable
3. Update documents to use replacement
4. Retain deprecated entry for historical reference

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 1.0 | 2025-11-21T00:00:00Z | Initial document creation |
