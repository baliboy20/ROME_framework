# ROME-REVIEW-PROP-058 — Proof run of derived traceability on frob-admin-Bacon

| Field | Value |
|-------|-------|
| **UID** | ROME-REVIEW-PROP-058 |
| **Status** | Complete |
| **Author** | Archie (session Rome-archie-master) |
| **Date** | 2026-09-11T00:00:00Z |
| **Source** | ROME-PROP-058 acceptance criterion 11 |
| **Method** | A copy of the project's `state.json` (2026-09-11) in a scratch directory with `SOURCE/` and `ARTIFACTS/_requirements/` linked read-only. Increment 65 opened on the copy; `guard-cli scope --from-corpus`, `scan --ts`, `verify --phase P5`. The project itself was not touched. |

## Result

| Measure | Declared record (pre-3.5.0 rule) | Scan (3.5.0 rule) |
|---|---|---|
| Requirements in corpus / scope | 106 | 106 |
| With any code or test link | 102 | 98 |
| `linked` (code AND test) | 95 | 47 |
| Source files with no requirement id | not tracked | 346 of 521 |
| Annotations naming no requirement | not checked | 12, all `REQ-EML05..17` |

**63 of 106 requirements change status.**

| Transition | Count | Meaning |
|---|---|---|
| linked → partial | 55 | the declared record claimed both code and test; the source carries the id on only one side. |
| partial → linked | 7 | the source carries more than was declared. |
| unlinked → partial | 1 | nothing was declared; the source carries the id. |

The 55 `linked → partial` cases are the finding. The declared record said these requirements reached both code and test. The files say otherwise: in most, a test file cites the requirement and no source file does, or the reverse. Nobody wrote a false claim on purpose; producers declared edges from memory and nothing read the files.

The sponsor's original test file, `booking_record_view.dart`, is found from its own comment at line 16 against `REQ-BO06`, which the stored table had answered with a fleet route.

`testAdequacy` after coverage backfill: FAIL with 20 gaps (three requirements with no tests reported, the rest with declared error conditions untested). Before 3.5.0 the same fact had been recorded PASS at increment 59 with an empty list.

A tamper test — the recorded `matrix` fact flipped to PASS by hand — was refused by `guard-cli check` (AX-40).

## Requirements that read `linked` before and do not now

REQ-AUTH03, REQ-AUTH04, REQ-BO04, REQ-BO09, REQ-BOOK09, REQ-BOOK13, REQ-BOOK14, REQ-BOOK15, REQ-BOOK17, REQ-CNA02, REQ-CNA04, REQ-CNA05, REQ-CONT01, REQ-CONT02, REQ-FLEET01, REQ-FLEET02, REQ-FLEET03, REQ-FLEET04, REQ-FLEET05, REQ-FLEET06, REQ-FLEET07, REQ-FLEET08, REQ-NOTIF04, REQ-OPS01, REQ-OPS03, REQ-OPS04, REQ-OPS06, REQ-OPS08, REQ-OPS09, REQ-OPS10, REQ-OPS11, REQ-OPS12, REQ-OPS13, REQ-OPS14, REQ-POST01, REQ-POST02, REQ-POST03, REQ-POST10, REQ-PRE01, REQ-PRE02, REQ-PRE04, REQ-PRE05, REQ-PRE06, REQ-PRE07, REQ-PRE08, REQ-PROMO01, REQ-SEO02, REQ-SEO03, REQ-TOUR03, REQ-TOUR04, REQ-TOUR06, REQ-TOUR07, REQ-TOUR08, REQ-TOUR09, REQ-TOUR10

## What the project must do (MIG-3.4.0→3.5.0 gaps)

1. Producers annotate the 346 unattributed files as they touch them; WARN now, FAIL from the next MINOR.
2. Decide the `REQ-EML` family: rename the 12 annotations to the `REQ-NOTIF` ids that absorbed them, or add the requirements.
3. Run `guard-cli scope` and `scan` on the next increment before its first gate.

Nothing in sealed increments is re-gated (AX-19).
