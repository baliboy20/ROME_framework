# ROME-MIG-002: State Schema v1 → Increment Model (framework v3.0.0)

| Field | Value |
|-------|-------|
| **Document UID** | ROME-MIG-002 |
| **Version** | 1.0 |
| **Date** | 2026-07-17T00:00:00Z |
| **Status** | Active |
| **Document Type** | Migration |
| **Applies To** | Projects created by framework ≤ v2.8.x (`state.json` `schemaVersion: 1`) opening under framework ≥ v3.0.0 |
| **Origin** | ROME-PROP-048 OQ-1 (sponsor: nested restructure + migration) |

## In Plain Terms

Framework v3.0.0 changed the shape of a project's record file (`state.json`) so a
project can hold **many increments of work** instead of exactly one. Old projects
are converted **automatically the first time they're opened** — nothing is lost:
the whole old lifecycle simply becomes "increment 0". You don't run anything.

## What changes

| v1 (≤ v2.8.x) | v2 (v3.0.0) |
|---|---|
| Lifecycle fields (`routing`, `currentPhase`, `phases`, `gateLedger`, `blockers`, `dispatch`, `budget`, `verification`, `oq`, `testManifest`, `inputReliability`) at top level | The same fields live inside `increments[0]`; `activeIncrement` selects the live one |
| `traceability`, `audit` at top level | Unchanged location (shared across increments); each edge gains `increment: 0` |
| — | New: `stubs[]` (PROP-049 stub ledger), `stagePlan` (PROP-049 staging), `increments[]` |
| `schemaVersion: 1` | `schemaVersion: 2` |

## How

`state.js#load()` detects `schemaVersion: 1` and applies `migrateV1()` in memory —
pure, lossless, per ROME-AX-19 (nothing deleted; the record is wrapped, not
rewritten). The next `save()` persists the migrated shape. Regression:
`tests/increments.test.cjs` ("MIG-002" cases) proves ledger, edges, budget, and OQ
counters survive the round-trip.

## For tool authors

Read lifecycle fields via `state.js#active(state)`, never from the top level.
Shared stores (`traceability`, `audit`, `stubs`, `stagePlan`) remain top-level.

## Rollback

The migration is in-memory until the first save. To stay on v2.8.x: don't save
under v3 — or restore `state.json` from git (projects vendor their framework, so
existing projects keep running on their vendored ≤ v2.8.x copy regardless).
