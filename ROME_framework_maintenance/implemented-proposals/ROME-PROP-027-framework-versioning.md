# ROME-PROP-027: Framework Versioning

| Field | Value |
|-------|-------|
| **Document UID** | ROME-PROP-027 |
| **Version** | 1.1 |
| **Date** | 2026-02-27T00:00:00Z |
| **Status** | Implemented |
| **Document Type** | Proposal |
| **Author** | Archie (Framework Analyst & Architect) |
| **Changes Approved** | false |

---

## Problem Statement

The ROME framework has no top-level version identity. Individual documents carry per-document version numbers, and git implicitly tracks state, but there is no:

- Canonical "ROME Framework vX.Y.Z" declaration
- Mechanism for projects to record which framework version generated them
- Basis for compatibility guarantees between framework releases and existing projects
- Defined trigger rules for when a framework-level version increment is warranted

This creates two concrete failure modes:

1. **Diagnosis ambiguity** — when a robot behaves unexpectedly, there is no way to determine whether the project was generated against an outdated framework version
2. **No compatibility boundary** — breaking changes to activity log format, skill interfaces, or baseline documents propagate silently to all active projects

---

## Proposal

Introduce semantic versioning for the ROME framework as a whole, governed by a canonical VERSION manifest in `rome-core`.

---

## Versioning Scheme

ROME adopts **Semantic Versioning (SemVer)**: `MAJOR.MINOR.PATCH`

| Component | Increment When |
|-----------|---------------|
| **MAJOR** | Breaking change: incompatible activity log format, removed/renamed skill interface, baseline document structural change requiring robot re-configuration |
| **MINOR** | Backward-compatible addition: new robot, new skill, new phase, new governance document, new proposal implemented |
| **PATCH** | Non-functional: documentation correction, clarification, typo fix, UID registry update, fidelity script fix |

**Compatibility contract:** A project configured against framework `vX.Y.Z` is compatible with any `vX.*.*` release. A MAJOR bump signals that projects may need re-configuration or migration.

---

## Canonical Version Location

A single file declares the authoritative framework version:

**File:** `/ROME/rome-core/VERSION`

**Format:**
```
ROME_FRAMEWORK_VERSION=1.0.0
ROME_FRAMEWORK_DATE=2026-02-27T00:00:00Z
ROME_FRAMEWORK_STATUS=stable
```

Fields:
- `ROME_FRAMEWORK_VERSION` — SemVer string
- `ROME_FRAMEWORK_DATE` — ISO 8601 timestamp of the release
- `ROME_FRAMEWORK_STATUS` — one of: `stable`, `rc` (release candidate), `dev`

This file is the single source of truth. No other file declares the framework version.

---

## Project Version Declaration

Each project declares the framework version it was configured against in its project config file.

**File:** `[PROJECT_ROOT]/ARTIFACTS/rome-config.yaml` (existing or new)

**Addition:**
```yaml
rome_framework_version: "1.0.0"
rome_framework_date: "2026-02-27T00:00:00Z"
```

This declaration is written by Bootstrap (P0) at project initialization and is not modified by subsequent phases.

---

## Git Tagging Convention

Each stable framework release is tagged in git:

```
rome-v1.0.0
rome-v1.1.0
rome-v2.0.0
```

Tag format: `rome-v{MAJOR}.{MINOR}.{PATCH}`

Tags are annotated with a summary of changes since the prior release:

```bash
git tag -a rome-v1.0.0 -m "ROME Framework v1.0.0 — baseline release"
```

Release tags are created by the Framework Analyst & Architect only. Robots do not create release tags.

---

## Version Bump Procedure

1. Determine increment level (MAJOR / MINOR / PATCH) per rules above
2. Update `/ROME/rome-core/VERSION`
3. Update fidelity check `check-framework-fidelity.sh` if adding a new consistency check for this release
4. Commit with message: `chore: bump framework version to vX.Y.Z`
5. Create annotated git tag: `rome-vX.Y.Z`
6. If MAJOR bump: create migration guide `ROME-MIG-###`

---

## Fidelity Check Integration

Add **Check 5** to `check-framework-fidelity.sh`:

```
Check 5: Framework Version Consistency
  - VERSION file exists in rome-core/
  - VERSION file contains all required fields
  - ROME_FRAMEWORK_VERSION is valid SemVer
  - ROME_FRAMEWORK_STATUS is one of: stable, rc, dev
```

In `--quick` mode, Check 5 is included (it is fast and structural).

---

## Baseline Version

Upon implementation of this proposal, the framework version is declared as:

**`v1.0.0`** — baseline release representing the fully implemented ROME framework post-PROP-026.

Rationale: The framework has a complete, tested implementation (P0–P5, all robots, activity log enforcement, CR/AMD workflow, fidelity checks). There is no prior version to be compatible with, so `1.0.0` is appropriate.

---

## Affected Documents

| Document | Change Required |
|----------|----------------|
| `ROME/rome-core/VERSION` | **Create** — canonical version manifest |
| `check-framework-fidelity.sh` | Add Check 5 (version file validation) |
| `ROME-PROC-005` (Activity Logging Protocol) | No change — version is a project-level concern |
| `ROME-ROBOT-001` (Bootstrap) | Add step: write `rome-config.yaml` with framework version at P0 |
| `ROME-GOV-002` (UID Registry) | Register ROME-PROP-027 |
| `ROME-GOV-001` (Document Standards) | Note: VERSION is exempt from document metadata header requirement |

---

## Implementation Phases

### Phase A — Foundation
1. Create `ROME/rome-core/VERSION` with `1.0.0`
2. Register ROME-PROP-027 in uid-registry

### Phase B — Tooling
3. Add Check 5 to `check-framework-fidelity.sh`
4. Update Bootstrap (ROME-ROBOT-001) with rome-config.yaml step

### Phase C — Release
5. Commit Phase A+B changes
6. Create annotated tag `rome-v1.0.0`

---

## Non-Goals

- Per-robot versioning (robots carry their own version via their ROBOT.md `Version` field)
- Per-document version compatibility tracking (existing per-document versioning is sufficient)
- Automated version bumping scripts (version bumps are infrequent; manual procedure is adequate)

---

## Revision History

| Version | Date | Summary |
|---------|------|---------|
| 1.0 | 2026-02-27T00:00:00Z | Initial proposal |
| 1.1 | 2026-02-27T00:00:00Z | Implemented: VERSION file created (v1.0.0), Check 5 added to fidelity script, Bootstrap P0 updated with rome-config.yaml step |
