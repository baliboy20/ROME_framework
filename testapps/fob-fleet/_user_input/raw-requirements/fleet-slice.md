# FOB Fleet Management — greenfield slice (from FOB-PRD-001 §5.7)

Scope: a self-contained Fleet & Equipment management service for a small bike-tour
operator. No external services. Three capabilities:

1. Onboard a bike to the fleet (UJ-FLEET-01): register a bike with a unique asset id,
   make/model, purchase date. A new bike starts in service.
2. Flagged-bike workflow (UJ-FLEET-04): a bike moves InService → OutOfService (flagged)
   → Maintenance → back InService. Only these transitions are allowed.
3. Track compliance dates (UJ-FLEET-05): each bike has an insurance-expiry and a
   service-due date; the system reports which bikes are "renewal due" (date within 30 days
   or past). A bike that is non-compliant cannot be returned to service.

Operator: FleetManager. Tech: runnable Node/TypeScript service + a data store + a simple
dashboard read. Mobile not required (operator desktop).
