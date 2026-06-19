# FOB Fleet — Analysis (slice)

## Entities
### Bike (REQ-001, REQ-002, REQ-003)
- assetId (unique), make, model, purchaseDate?
- state: InService | OutOfService | Maintenance
- insuranceExpiry (date?), serviceDue (date?)

## State machine (REQ-002)
InService → OutOfService → Maintenance → InService (only these). Return to
InService blocked if non-compliant.

## Compliance (REQ-003)
renewal-due if insuranceExpiry or serviceDue within 30 days or past.
non-compliant if either date is past.

## Traceability
REQ-001→Bike create/onboard; REQ-002→state machine; REQ-003→compliance report.
