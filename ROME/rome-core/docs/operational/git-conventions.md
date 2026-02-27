# ROME Framework: Git Conventions

| Field | Value |
|-------|-------|
| **Document UID** | ROME-GOV-011 |
| **Version** | 1.0 |
| **Date** | 2026-02-27T00:00:00Z |
| **Status** | Draft |
| **Document Type** | Governance |
| **Author** | Framework Analyst & Architect |
| **Implements** | ROME-PROP-026 §G6 |

---

## Purpose

Defines the canonical git branching strategy and commit message convention for all ROME-managed application development. Applies to all P5 robots writing source code and to Roma coordinating merges.

---

## Scope

All robots writing to `SOURCE/` or `ARTIFACTS/`. Roma is the sole robot that merges to `main`.

---

## Branch Types

| Type | Pattern | Owner | Lifecycle |
|------|---------|-------|-----------|
| Main | `main` | Roma | Always deployable |
| Development | `develop` | Roma | Integration branch; P5 work merges here |
| Feature (P5) | `feat/FEAT-###-[slug]` | Assigned P5 robot | One branch per feature; merged to `develop` on GATE-P5 pass |
| Change Request | `cr/CR-###-[slug]` | Roma (assigns) | Post-delivery change; all implementing robots commit here; merged to `main` on GATE-CR pass |
| Refactor | `refactor/[description]` | Assigned robot | Refactoring work per ROME-PROP-026 §G7; merged to `develop` |
| Phase | `phase/P[N]-[robot]` | Phase robot | Optional; for isolated phase work requiring review before merge |
| Hotfix | `hotfix/[description]` | Roma | Emergency production fix; merged to both `main` and `develop` |

---

## Commit Message Convention

All commits MUST follow Conventional Commits format with a ROME traceability suffix:

```
type(scope): description ([FEAT-###]|[CR-###]|[AMD-###])
```

### Commit Types

| Type | Use For |
|------|---------|
| `feat` | New functionality |
| `fix` | Bug fix |
| `refactor` | Code restructuring with no behaviour change |
| `docs` | Documentation only |
| `test` | Test additions or changes |
| `chore` | Build, config, dependency updates |
| `schema` | Database schema changes |

### Scope

Scope identifies the capability or system area affected (e.g., `api`, `ui`, `db`, `auth`).

### Examples

```bash
feat(api): add POST /organisations endpoint (FEAT-002)
fix(ui): correct validation on login form (CR-003)
refactor(api): extract auth logic into middleware (FEAT-002)
schema(db): add tax_id column to organisations (CR-005)
chore(api): upgrade express to v5.0.0 (CR-005)
docs(requirements): update REQ-007 actor field (AMD-002)
test(auth): add integration tests for login flow (FEAT-001)
```

---

## Branching Rules

1. **No direct commits to `main` or `develop`** — all work via branches.
2. **One branch per FEAT-###** — P5 robots create `feat/FEAT-###-[slug]`; branch deleted after merge.
3. **CR branches are shared** — all robots implementing a CR commit to the same `cr/CR-###-[slug]` branch. Roma coordinates.
4. **Migration commits last** — `schema:` commits MUST be the last commit on a branch before merge, ensuring deployment ordering is explicit.
5. **Roma merges to `main`** — only Roma merges to `main`. Other robots merge to `develop` or their assigned CR/feat branch.
6. **Hotfix branches merge to both** — `hotfix/*` merges to `main` AND `develop` to prevent regression.

---

## Merge Strategy

| Target | Strategy | Who |
|--------|----------|-----|
| `develop` from `feat/*` | Squash merge with FEAT-### in message | Roma or assigned robot |
| `main` from `develop` | Merge commit (preserve history) | Roma |
| `main` from `cr/*` | Merge commit | Roma |
| `main` from `hotfix/*` | Merge commit (also merge to develop) | Roma |

---

## Robot Responsibilities

| Robot | Branch Responsibility |
|-------|----------------------|
| Roma | Creates `develop`, `main`, `cr/*`, `hotfix/*` branches; performs all merges to `main` |
| Ashok | Commits to assigned `feat/` or `cr/` branch; `schema:` commits last |
| Reena | Commits to assigned `feat/` or `cr/` branch |
| Charlie | Commits to assigned `feat/` or `cr/` branch |
| Lucien | Commits `chore:` configuration changes to assigned branch |
| All | MUST include ROME ID suffix in commit messages |

---

## TRACEABILITY.md Commit Convention

When a robot creates or updates a `TRACEABILITY.md` file, the commit message MUST include the `docs` type:

```bash
docs(traceability): add TRACEABILITY.md for FEAT-002 (FEAT-002)
```

---

## References

- **ROME-PROP-015:** Change Management Protocol (CR-### process)
- **ROME-PROP-026 §G6:** Proposal that introduced this document
- **ROME-PRIN-001 §12:** Iterative refinement threshold decision (AMD vs CR vs New Cycle)

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 1.0 | 2026-02-27T00:00:00Z | Initial git conventions document per ROME-PROP-026 §G6 |
