# ROME-DEFECT-002 — Framework document consistency: seven open defects

| Field | Value |
|-------|-------|
| **Document UID** | ROME-DEFECT-002 |
| **Version** | 1.0 |
| **Date** | 2026-09-17T00:00:00Z |
| **Status** | Draft — open; raised for sponsor triage. No PROP number claimed. |
| **Document Type** | Defect Report |
| **Author** | Archie |
| **Changes Approved** | false |
| **Raised from** | Framework maintenance session, 2026-09-17 (document read-through at v3.5.0) |
| **Against** | Framework documents under `ROME/rome-core/docs/` and `check-framework-fidelity.sh` |
| **Severity** | MEDIUM overall — no runtime guard behaviour is affected; one defect (D2) directs agents to a deleted document |

---

## In Plain Terms

A read-through of the framework's own documents found places where they
contradict each other, point at a document that no longer exists, or use
words the standards do not allow. None of this changes how a project is
built today. It does mean an agent reading the documents can be given two
different answers, and that the consistency-checking script cannot see some
of these problems. Four other defects found in the same session were fixed
the same day (§3). The seven below are still open.

---

## 1. Open defects

| # | Defect | Severity | Category (ROME-GOV-003) |
|---|--------|----------|-------------------------|
| D1 | Two governing documents give opposite rules on revision history | HIGH | 4 — Modification |
| D2 | Retired ROME-PROC-005 is cited as live in eight documents | MEDIUM | 4 — Modification |
| D3 | Status values in use are not in the approved list | MEDIUM | 4 — Modification |
| D4 | Fidelity script: two blind spots | MEDIUM | code change |
| D5 | Header and revision nonconformance in three documents | LOW | 1 — Correction |
| D6 | Draft-location rule conflicts between ROME-GOV-003 and ROME-DEF-001 | LOW | 2 — Clarification |
| D7 | `defects/defects.md` is an empty file with no defined purpose | LOW | 1 — Correction |

Known and deliberately deferred, recorded here for completeness, not raised
as new: "robot" wording in governance and operational documents
(ROME-STD-AGENT-ROLES §5 defers it to the Stage 7 rename pass); the five
required facts with no checker (already declared in ROME-AX-41).

---

## 2. Detail

### D1 — Opposite rules on revision history (HIGH)

- ROME-GOV-001 (`document-standards.md`) §Revision Tracking Policy:
  "Active framework documents DO NOT include revision history sections."
  Git is the stated record.
- ROME-DEF-001 (`ROME_architect/CLAUDE.md`) §Document Standards 2: every
  revision MUST be logged, with revision notes at the bottom of the document.
- Practice follows ROME-DEF-001: ROME-LEX-001, ROME-ONT-001, ROME-GOV-002,
  ROME-GOV-003 and all seven standards carry revision tables.
- ROME-LEX-001 revision row 1.1 states its log was "absent since initial
  issue, contrary to ROME-GOV-001" — it cites ROME-GOV-001 for the opposite of
  what ROME-GOV-001 says.
- **Effect:** a maintainer following either document violates the other. The
  2026-09-17 session added revision tables to ROME-PRIN-001 and ROME-DEF-001
  under the ROME-DEF-001 rule; under ROME-GOV-001 those additions are
  nonconforming.
- **Decision needed:** which rule governs. Then amend the other document.

### D2 — Retired ROME-PROC-005 cited as live (MEDIUM)

ROME-GOV-002 registers ROME-PROC-005 (Activity Logging Protocol) as
Deprecated: file deleted in v2.0, replaced by the `activity-log-file` MCP and
ROME-GOV-008. It is still cited as a live authority:

| Document | Live citations | Worst case |
|----------|----------------|-----------|
| `operational/baseline-universal.md` | 6 | "Log activity per ROME-PROC-005 (no exceptions)"; "state access patterns per ROME-PROC-005 §2" |
| `framework-maintenance/core-principles-policy.md` (ROME-IMPL-001) | 7 | gives a path under the deleted `robot-templates/` tree |
| `operational/activity-log-format.md` (ROME-GOV-008) | 2 | lists "Update ROME-PROC-005" as a pending step |
| `framework-maintenance/baseline-governance.md` | 1 | lists `activity-logging-protocol.md` as a file |
| `framework-maintenance/document-architecture.md` | 1 | dependency example |
| `framework-maintenance/amendment-procedures.md` (ROME-GOV-003) | 1 | AMD-### workflow reference |
| `framework-maintenance/core-principles.md` (ROME-PRIN-001) | 1 | Principle 12, AMD-### workflow reference |

- **Effect:** an Instance told to follow ROME-PROC-005 "no exceptions" cannot.
  ROME-GOV-008 defines the log *format*; no current document is confirmed to
  hold the AMD-### *workflow* or the state-access standard (§2) that
  ROME-PROC-005 carried.
- **Fix outline:** confirm where each of the three contents of ROME-PROC-005
  (logging triggers, state access, AMD workflow) now lives; repoint or remove
  each citation.

### D3 — Status values outside the approved list (MEDIUM)

ROME-GOV-001 §Status Values permits: Draft, Review, Approved, Deprecated.

- "Active" is used by ROME-ONT-001 and all seven standards. "Approved" is used
  by none of the documents read.
- ROME-GOV-002 uses Implemented, Superseded, Closed, Discussion, Reserved,
  and (since v4.25) Withdrawn. None is defined anywhere.
- Documents that are in force declare themselves not authoritative:
  ROME-LEX-001, ROME-PRIN-001, ROME-GOV-001, ROME-GOV-002, ROME-GOV-003 are
  all `Draft`, which ROME-GOV-001 defines as "not authoritative". Three also
  carry `Changes Approved: false`.
- **Effect:** status cannot be used to decide which document governs.
  ROME-LEX-001 (Draft) and its companion ROME-ONT-001 (Active) disagree on
  their own standing.
- **Fix outline:** extend the approved list to the vocabulary in use, with
  definitions; then set each in-force document to its true status.

### D4 — Fidelity script blind spots (MEDIUM)

`ROME/rome-core/scripts/check-framework-fidelity.sh`:

- **Check 1** exempts a missing registry path only when the line contains
  "deprecated", "superseded" or "reserved". Closed and Withdrawn are not
  exempt. It also reads every line of ROME-GOV-002, so a backticked path in a
  *revision row* is treated as a live entry. v4.25 worked around both by
  removing the path and the backticks; the script is unchanged.
- **Check 6** verifies only citations of the form `` `module.js#function` ``.
  A citation of a field (ROME-AX-08 and, since ontology v1.10, ROME-AX-41,
  both citing `lifecycle.js` `PHASES[].requires`) is not verified at all.
  The v1.10 correction cleared a false failure by moving AX-41's citation
  outside what the check can see.
- **Effect:** ROME-AX-11 (every cited enforcement point exists) is weaker than
  stated for field citations.
- **Fix outline:** teach check 1 the full status vocabulary (depends on D3)
  and restrict it to the registry tables; give check 6 a field-citation form.

### D5 — Header and revision nonconformance (LOW)

- ROME-STD-AGENT-ROLES: header has `UID`/`Created`, no Version, Date or
  Author. The "Annotation duty (PROP-058 / AX-42)" section was added with no
  revision row and sits after the document's closing rule. §3 names Opus 4.8 /
  Sonnet 4.6 as "currently" the latest while instructing "always use the
  latest model in each tier"; the lineup has since advanced.
- ROME-PRIN-001: metadata is bold lines, not the required table; no
  `Changes Approved` field.
- ROME-DEF-001: metadata is plain lines; no Version or Date.

### D6 — Draft-location conflict (LOW)

ROME-GOV-003 Categories 3 and 4 say to draft changes in `/ROME_architect/`.
ROME-DEF-001 says proposals must not be created under `ROME_architect/` and
belong in `ROME_framework_maintenance/proposals/`. ROME-GOV-003 predates the
maintenance tree and does not mention it.

### D7 — Empty defects file (LOW)

`ROME_framework_maintenance/defects/defects.md` is zero bytes. Defect reports
live in `defect-reports/`. No document defines the `defects/` folder. Either
define it (e.g. an index of ROME-DEFECT-###) or remove it.

---

## 3. Fixed in the same session (for the record)

Committed as `ada3d0e4` on branch `fix/framework-doc-corrections`:

| Fixed | Document version |
|-------|------------------|
| ROME-AX-41 cited a field as a function; fidelity check 6 failed | ROME-ONT-001 v1.10 |
| ROME-AX-08 fact table omitted `flowValidation` at P1 | ROME-ONT-001 v1.10 |
| Duplicate revision numbers (ontology 1.6; lexicon 1.7) and stale lexicon header | ROME-ONT-001 v1.10, ROME-LEX-001 v1.10 |
| ROME-GUIDE-001 registered Active after its file was deleted | ROME-GOV-002 v4.25 |
| Principles 4, 5, 7 contradicted the lexicon (five phases; "Robot" sessions) | ROME-PRIN-001 v1.2 |
| ROME-DEF-001 described Archie as a Roma-spawned sub-agent | ROME-DEF-001 v2.1 |

---

## 4. Observation — not a defect

ROME-PRIN-001 has no principle stating that an agent's statement about its
own work is never accepted as proof, although ROME-AX-02, AX-03, AX-08, AX-40
and AX-42 all enforce it. Adding one is a Category 3 Extension and needs a
sponsor decision. Not raised as a defect: nothing is contradicted.

---

## Revision History

Included under the ROME-DEF-001 rule; see D1.

| Version | Date (ISO 8601) | Summary |
|---------|-----------------|---------|
| 1.0 | 2026-09-17T00:00:00Z | Initial issue: seven open defects (D1–D7), six same-session fixes recorded, one observation. |
