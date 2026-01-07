# ROME Framework: Document Governance

| Field | Value |
|-------|-------|
| **Document UID** | DEPRECATED |
| **Version** | 1.0 |
| **Date** | 2025-11-20T00:00:00Z |
| **Status** | Deprecated |
| **Document Type** | Foundation |
| **Author** | Framework Analyst & Architect |
| **Changes Approved** | false |
| **Superseded By** | ROME-GOV-001 (document-standards.md) |

---

## ⚠️ DEPRECATION NOTICE

This document has been superseded by **ROME-GOV-001** (`/ROME/framework-governance/document-standards.md`).

Use document-standards.md for all current document governance requirements.

This file is retained for historical reference only.

---

## Purpose
Defines document classification, naming conventions, folder placement rules, UID allocation, approval workflows, and lifecycle management for all ROME framework documents. Serves as authoritative Single Source of Truth for document governance (Principle 6).

## Document Classification System

### Document Types (UID Type Codes)

| Type Code | Full Name | Purpose | Examples |
|-----------|-----------|---------|----------|
| DEF | Definition | Framework role and concept definitions | ROME-DEF-001 (Role Definition) |
| PRIN | Principles | Core operational principles | ROME-PRIN-001 (Core Principles) |
| IMPL | Implementation | Principle implementation across lifecycle | ROME-IMPL-001 (Core Principles Implementation) |
| LEX | Lexicon | Terminology definitions and glossary | ROME-LEX-001 (Lexicon) |
| GOV | Governance | Document and process governance | ROME-GOV-001 (this document) |
| PHASE | Phase Specification | Phase-specific requirements and processes | ROME-PHASE-001 (Bootup Specification) |
| ROBOT | Robot Role | Robot role definitions and constraints | ROME-ROBOT-001 (Orchestrator Spec) |
| TEMPLATE | Template | Reusable document templates | ROME-TEMPLATE-001 (Requirement Template) |
| SPEC | Technical Specification | Technical constraints and parameters | ROME-SPEC-001 (Technical Specifications) |
| DATA | Data Model | Data dictionaries and schemas | ROME-DATA-001 (Data Dictionary) |
| PROC | Procedure | Operational procedures and workflows | ROME-PROC-001 (Recovery Procedure) |

### Document Classes (Approval Requirements)

| Class | Types Included | Approval Authority | Review Required |
|-------|----------------|-------------------|-----------------|
| **Foundation** | DEF, PRIN, IMPL, LEX, GOV | Framework Analyst & Architect | Yes - Architect must set Changes Approved: true |
| **Phase Specifications** | PHASE | Orchestrator + Phase Robot | Yes - Orchestrator validation |
| **Robot Definitions** | ROBOT | Framework Analyst & Architect | Yes - Architect approval |
| **Templates** | TEMPLATE | Framework Analyst & Architect | Lightweight review |
| **Technical Artifacts** | SPEC, DATA | Orchestrator + Domain Expert | Yes - Domain validation |
| **Procedures** | PROC | Framework Analyst & Architect | Yes - Operational validation |

## Naming Conventions

### UID Format
```
ROME-[TYPE]-[NUMBER]
```

**Rules:**
- TYPE: Uppercase type code from classification table
- NUMBER: Zero-padded 3-digit sequential number (001, 002, 003...)
- No spaces, underscores, or special characters
- Examples: ROME-PRIN-001, ROME-ROBOT-042, ROME-PHASE-015

### File Naming
```
[descriptive-name].md
```

**Rules:**
- Lowercase kebab-case (hyphens between words)
- Descriptive, semantic names reflecting content
- `.md` extension (Markdown format)
- No version numbers in filename (versioning via document header)
- Examples: `core-principles.md`, `orchestrator-spec.md`, `requirement-template.md`

### Reserved Filenames
- `lexicon.md` - Framework terminology (ROME-LEX-001)
- `document-governance.md` - This document (ROME-GOV-001)
- `core-principles.md` - Operational principles (ROME-PRIN-001)
- `core-principles-implementation.md` - Principle implementation (ROME-IMPL-001)
- `CLAUDE.md` - Framework Analyst & Architect role definition (ROME-DEF-001)

## Folder Structure & Placement Rules

### Placement Rules

| Document Type | Primary Location | Secondary Locations |
|---------------|-----------------|-------------------|
| Foundation (DEF, PRIN, IMPL, LEX, GOV) | `/ROME/foundation/` | None |
| Phase Specifications (PHASE) | `/ROME/life-cycle/XX-[phase]/` | None |
| Robot Definitions (ROBOT) | `/ROME/robots/[robot-name]/` | None |
| Templates (TEMPLATE) | `/ROME/templates/` | None |
| Technical Specs (SPEC) | `/ROME/artifacts/[project]/` | Phase-specific reference in `/ROME/life-cycle/` |
| Data Dictionary (DATA) | `/ROME/artifacts/[project]/` | Phase-specific reference in `/ROME/life-cycle/` |
| Procedures (PROC) | `/ROME/life-cycle/XX-[phase]/` or `/ROME/foundation/` | Depends on scope |

**Decision Criteria:**
- Framework-wide scope → `/ROME/foundation/`
- Phase-specific scope → `/ROME/life-cycle/XX-[phase]/`
- Robot-specific scope → `/ROME/robots/[robot-name]/`
- Project-specific scope → `/ROME/artifacts/[project]/`

## UID Registry & Allocation

### Current UID Allocations

| UID | Document Name | File Path |
|-----|---------------|-----------|
| ROME-DEF-001 | Framework Analyst & Architect Role Definition | `/CLAUDE.md` |
| ROME-PRIN-001 | Core Principles | `/ROME/foundation/core-principles.md` |
| ROME-IMPL-001 | Core Principles Implementation | `/ROME/foundation/core-principles-implementation.md` |
| ROME-LEX-001 | Lexicon | `/ROME/foundation/lexicon.md` |
| ROME-GOV-001 | Document Governance | `/ROME/foundation/document-governance.md` |

### Allocation Rules
1. Sequential numbering per TYPE code
2. Numbers never reused (even if document deprecated)
3. Framework Analyst & Architect assigns UIDs for Foundation and Robot documents
4. Orchestrator assigns UIDs for Phase and Procedure documents
5. UID assigned before document creation (reserve in registry)
6. Document creation must include UID in header metadata table

### Next Available UIDs
- ROME-DEF-002
- ROME-PRIN-002
- ROME-IMPL-002
- ROME-LEX-002
- ROME-GOV-002
- ROME-PHASE-001
- ROME-ROBOT-001
- ROME-TEMPLATE-001
- ROME-SPEC-001
- ROME-DATA-001
- ROME-PROC-001

## Document Header Standard

All ROME documents must include this header format:

```markdown
# [Document Title]

| Field | Value |
|-------|-------|
| **Document UID** | ROME-[TYPE]-[NUMBER] |
| **Version** | [Major].[Minor] |
| **Date** | [ISO 8601 timestamp] |
| **Status** | [Draft/Review/Approved/Deprecated/Archived] |
| **Document Type** | [Foundation/Phase Specification/Robot Definition/etc.] |
| **Author** | [Role/Name] |
| **Changes Approved** | [true/false] |

## Purpose
[Clear, concise statement of document purpose]
```

### Header Field Definitions

| Field | Required | Format | Description |
|-------|----------|--------|-------------|
| Document UID | Yes | ROME-TYPE-NNN | Unique identifier |
| Version | Yes | N.N | Semantic versioning (major.minor) |
| Date | Yes | ISO 8601 | Timestamp of current version |
| Status | Yes | Enum | Draft/Review/Approved/Deprecated/Archived |
| Document Type | Yes | String | Classification from system |
| Author | Yes | String | Role or name of author |
| Changes Approved | Yes | Boolean | true/false approval state |

## Revision History Management

### Revision Log Requirements
All documents must maintain a revision history table at the bottom:

```markdown
---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 1.0 | 2025-11-20T00:00:00Z | Initial document creation |
| 1.1 | 2025-11-21T14:30:00Z | Added section on XYZ |
| 2.0 | 2025-11-25T09:00:00Z | Major restructuring of ABC |
```

### Versioning Rules
- **Major version increment (X.0):** Structural changes, breaking changes, significant additions
- **Minor version increment (X.Y):** Clarifications, non-breaking additions, corrections
- Each revision entry includes: Version, ISO 8601 timestamp, concise change summary
- Revision log never deleted, only appended

### Version Control Integration
- All ROME framework documents stored in version control (git)
- Commit messages reference document UID and version
- Semantic tags applied to Approved documents: `[UID]-v[VERSION]`
- Example tag: `ROME-PRIN-001-v1.0`

## Validation Rules

### Structural Validation
All documents must pass these checks before Review state:

1. **Header Validation:**
   - All required header fields present
   - UID format matches ROME-TYPE-NNN pattern
   - UID exists in registry
   - Version format is N.N
   - Date is valid ISO 8601 timestamp
   - Status is valid enum value
   - Changes Approved is boolean

2. **Content Validation:**
   - Purpose section present and non-empty
   - Headings follow logical hierarchy
   - No heading level skipping (H1 → H3 without H2)

3. **Reference Validation:**
   - All referenced UIDs exist in registry
   - All file path references valid
   - No broken internal links

4. **Terminology Validation:**
   - Framework-specific terms defined in Lexicon
   - No term conflicts with ROME-LEX-001
   - Consistent term usage throughout document

5. **Revision Log Validation:**
   - Revision history section present
   - At least one entry (version 1.0 creation)
   - Entries in chronological order
   - Version numbers sequential

### Semantic Validation
Documents under Review undergo semantic validation:

1. **Conflict Detection:**
   - No contradictions with Foundation documents
   - No overlapping definitions with other documents
   - Scope boundaries respected

2. **Completeness:**
   - All required sections present per document type
   - Referenced dependencies exist
   - Implementation details sufficient for robot execution

3. **Alignment:**
   - Adheres to Core Principles (ROME-PRIN-001)
   - Follows conventions in this governance document
   - Supports framework objectives

### Automated Validation
Robots performing validation must:
- Check structural validation before creating/editing documents
- Flag validation failures with specific error messages
- Not transition documents to Review state if validation fails
- Log validation attempts and results

## Document Dependencies

### Dependency Declaration
Documents should declare dependencies in Purpose or dedicated section:

```markdown
## Dependencies
- ROME-PRIN-001 (Core Principles)
- ROME-LEX-001 (Lexicon)
- ROME-GOV-001 (Document Governance)
```

### Dependency Rules
1. Foundation documents have minimal dependencies (typically only ROME-DEF-001)
2. Phase specifications depend on ROME-IMPL-001 and Foundation docs
3. Robot definitions depend on ROME-PRIN-001 and relevant Phase specs
4. Circular dependencies prohibited
5. Dependency changes require version increment

### Impact Analysis
When updating documents:
1. Identify all documents with dependencies on updated document
2. Validate dependent documents remain consistent
3. Update dependent documents if breaking changes introduced
4. Document impact in revision log

## Recovery & Rollback Procedures

### Document Corruption Recovery
If document corruption detected:
1. Validate file integrity via checksum (if available)
2. Identify last known-good version via revision log
3. Restore from version control at specific commit/tag
4. Verify restoration via structural validation
5. Log recovery event

### Approval Revocation
If approved document found to contain errors:
1. Framework Analyst & Architect may revoke approval
2. Status changed back to Draft or Review
3. Changes Approved set to false
4. Revision log updated with revocation reason
5. Dependent documents flagged for review
6. Corrections made following standard workflow

### Version Rollback
If new version introduces issues:
1. Identify stable previous version from revision history
2. Create new version reverting to previous content
3. Version number incremented (no version reuse)
4. Revision log documents rollback with rationale
5. Re-submit for approval workflow

## Enforcement

### Robot Responsibilities
All robots operating within ROME must:
- Only use documents with Status: Approved for operational decisions
- Validate document structure before reading
- Check Changes Approved: true before trusting content
- Report validation failures to Orchestrator
- Reference documents by UID in all logging and traceability

### Framework Analyst & Architect Responsibilities
- Maintain UID registry accuracy
- Conduct approval reviews per workflows
- Monitor for terminology conflicts
- Ensure Foundation documents remain consistent
- Resolve governance ambiguities
- Update this governance document as framework evolves

### Orchestrator Responsibilities
- Enforce state transitions per workflows
- Validate Phase specifications
- Coordinate multi-document updates
- Maintain audit trail of approvals
- Report governance violations

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 1.0 | 2025-11-20T00:00:00Z | Initial document creation |
| 1.1 | 2025-12-19T00:00:00Z | Document deprecated - superseded by ROME-GOV-001 (document-standards.md) |
