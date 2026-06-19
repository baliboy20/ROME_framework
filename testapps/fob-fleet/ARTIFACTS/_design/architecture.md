# FOB Fleet — Architecture (P3 design slice)

Stack A: runnable headless with plain `node` (CommonJS), no external deps, no network.
Scope is strictly REQ-001, REQ-002, REQ-003. Nothing beyond.

## Components

Three components, layered: `schema` (data) → `service` (logic) → `ui` (view).

### 1. schema (`shared-lib`)
Pure data definitions and the in-memory/JSON store contract. No behaviour beyond
shape validation helpers.
- Defines the `Bike` record shape and field constraints (see data-dictionary.md).
- Defines the `Store` contract: an in-memory map keyed by `assetId`, serialisable to
  JSON for the fleet snapshot consumed by the ui.
- Defines the allowed `state` enum: `InService | OutOfService | Maintenance`.
- Traces: REQ-001 (unique assetId, required make/model, optional purchaseDate),
  REQ-002 (state enum), REQ-003 (insuranceExpiry, serviceDue fields).

### 2. service (`service`, depends on schema)
Node CommonJS module exposing the `fleet-api` (see contracts/fleet-api.json).
Three members, one per requirement:
- `onboardBike(input)` — REQ-001. Validates make/model present, assetId unique;
  records bike with unique assetId in `InService`. Errors: duplicate id, missing make/model.
- `transitionBike(assetId, toState)` — REQ-002. Enforces the state machine and the
  non-compliant-return block. Errors: illegal transition, non-compliant return to service.
- `complianceReport()` — REQ-003. Returns per-bike renewal-due / non-compliant flags
  over the current fleet snapshot.

### 3. ui (`ui`, depends on service)
A single static dashboard view. A tiny render function (no framework) that takes a
fleet snapshot + compliance report and emits plain HTML: a fleet list with each bike's
state and a renewal-due / non-compliant badge. Read-only.
- Traces: REQ-001 (bike appears in fleet list), REQ-002 (state shown in list),
  REQ-003 (renewal-due and non-compliant surfaced).

## Data flow

```
FleetManager action
  → service.onboardBike / transitionBike   (mutates Store)
  → Store (schema, in-memory map)
  → service.complianceReport()             (reads Store snapshot)
  → ui.render(snapshot, report)            (static HTML dashboard)
```

The ui only reads. All mutation goes through the service. The service owns the only
Store reference; schema defines the Store's shape and the snapshot serialisation.

## State machine (REQ-002)

```
InService ──flag──▶ OutOfService ──service──▶ Maintenance ──restore──▶ InService
```

Only these three transitions are permitted. Any other (toState) is rejected with
"That state change is not allowed". The `Maintenance → InService` transition is
additionally blocked when the bike is non-compliant: "Bike cannot return to service
while non-compliant".

| From         | To           | Allowed | Extra guard                         |
|--------------|--------------|---------|-------------------------------------|
| InService    | OutOfService | yes     | —                                   |
| OutOfService | Maintenance  | yes     | —                                   |
| Maintenance  | InService    | yes     | blocked if bike non-compliant       |
| (any other)  | (any other)  | no      | rejected                            |

## Compliance rule (REQ-003)

Given today's date `now` and a fixed 30-day window:
- A date is **due** if it is within 30 days of `now` or in the past
  (`date <= now + 30 days`).
- A date is **past** if `date < now`.
- **renewal-due**: `insuranceExpiry` OR `serviceDue` is due.
- **non-compliant**: `insuranceExpiry` OR `serviceDue` is past.
- A bike with no compliance dates set yields the error
  "Compliance dates are not set for this bike".

Non-compliant is the gate used by REQ-002's `Maintenance → InService` guard.

## Traceability
- REQ-001 → onboard bike: schema (Bike shape/uniqueness), service.onboardBike, ui fleet list.
- REQ-002 → state transitions: schema (state enum), service.transitionBike + state machine, ui state display.
- REQ-003 → compliance: schema (date fields), service.complianceReport + compliance rule, ui badges.
