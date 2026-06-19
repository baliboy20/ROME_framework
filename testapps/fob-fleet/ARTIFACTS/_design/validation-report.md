# FOB Fleet — Design Validation Report (P3 / Clara)

Role: Clara (design validation). Independent of PMA's design. Reports a finding; holds no gate authority.
Date: 2026-06-19
Verdict: **PASS**

Validated:
- _design/architecture.md
- _design/data-dictionary.md
- _design/component-graph.json
- _design/contracts/fleet-api.json

Against:
- _requirements/REQ-001.yaml, REQ-002.yaml, REQ-003.yaml
- _analysis/entities.md

## (a) Requirement coverage — PASS
All three requirements are covered, each with a dedicated service member and traceability:
- REQ-001 (onboard bike): schema (Bike shape, unique assetId, in-service default), service.onboardBike, ui fleet list.
- REQ-002 (update bike-state): schema (state enum), service.transitionBike + state machine, ui state display.
- REQ-003 (view fleet-compliance): schema (date fields), service.complianceReport + compliance rule, ui badges.
Error messages in design match the requirements verbatim (duplicate id, missing make/model, illegal transition, non-compliant return, dates-not-set).

## (b) State machine vs REQ-002 — PASS
REQ-002 invariant: in-service → out-of-service → maintenance → in-service (only these); non-compliant bike cannot return to in-service.
Architecture state machine and table match exactly: InService→OutOfService, OutOfService→Maintenance, Maintenance→InService; all others rejected ("That state change is not allowed"). The Maintenance→InService transition carries the non-compliant guard ("Bike cannot return to service while non-compliant"). The resolved open question (no maintenance→out-of-service shortcut) is honoured.

## (c) Compliance rule vs REQ-003 — PASS
REQ-003: renewal-due when insurance-expiry or service-due is within 30 days or past; window fixed at 30 days.
Architecture: due = `date <= now + 30 days` (explicitly includes past), renewal-due = either date due, non-compliant = either date past. The "within 30 days OR past" semantics are correctly captured (past dates satisfy `date <= now + 30`). Dates-not-set error present. Window is fixed (matches resolved open question).

## (d) Data dictionary consistency — PASS
Bike fields (assetId, make, model, purchaseDate?, state, insuranceExpiry?, serviceDue?) match entities.md and the requirements. purchaseDate optional (matches REQ-001 resolution). Derived renewalDue/nonCompliant definitions match the architecture compliance rule. Store contract (in-memory map keyed by assetId, uniqueness, JSON snapshot) is consistent with the architecture's data flow. State enum is identical across all artifacts.

## (e) Contract members vs capabilities — PASS
fleet-api.json members = [onboardBike, transitionBike, complianceReport] — one per requirement, producer=service, consumers=[ui]. component-graph.json layering schema→service→ui is consistent with the architecture and contract.

## (f) Scope creep — PASS (none)
No equipment, cost tracking, or reminders appear in any design artifact. Data dictionary and architecture both explicitly restate the out-of-scope boundary. Matches each requirement's OutOfScope (equipment / maintenance cost / renewal reminders).

## Findings
- No missing coverage, inconsistencies, or scope creep detected.
- All error messages, the state machine, and the compliance window match the requirements exactly.

## Result: PASS
