# FOB Fleet — Data Dictionary (Bike)

Defined by the `schema` component. All fields traced to REQ-001/002/003.
Scope limited to these three requirements; no equipment, no cost, no reminders.

## Bike record

| Field            | Type                                            | Required | Constraints                                                        | Trace            |
|------------------|-------------------------------------------------|----------|--------------------------------------------------------------------|------------------|
| `assetId`        | string                                          | yes      | Unique across fleet; primary key of the Store                      | REQ-001          |
| `make`           | string                                          | yes      | Non-empty; error "Make and model are required" if missing          | REQ-001          |
| `model`          | string                                          | yes      | Non-empty; error "Make and model are required" if missing          | REQ-001          |
| `purchaseDate`   | string (ISO date `YYYY-MM-DD`)                  | no       | Optional (resolved: not mandatory)                                 | REQ-001          |
| `state`          | enum `InService` \| `OutOfService` \| `Maintenance` | yes  | New bike = `InService`; transitions only per state machine         | REQ-001, REQ-002 |
| `insuranceExpiry`| string (ISO date `YYYY-MM-DD`)                  | no       | Used for renewal-due / non-compliant evaluation                    | REQ-003          |
| `serviceDue`     | string (ISO date `YYYY-MM-DD`)                  | no       | Used for renewal-due / non-compliant evaluation                    | REQ-003          |

## Derived / computed (not stored)

| Name            | Type    | Definition                                                                 | Trace   |
|-----------------|---------|---------------------------------------------------------------------------|---------|
| `renewalDue`    | boolean | `insuranceExpiry` or `serviceDue` is within 30 days of now or past         | REQ-003 |
| `nonCompliant`  | boolean | `insuranceExpiry` or `serviceDue` is in the past                          | REQ-003 |

## Store contract

| Aspect      | Definition                                                                 | Trace            |
|-------------|---------------------------------------------------------------------------|------------------|
| Storage     | In-memory map keyed by `assetId`                                           | REQ-001          |
| Uniqueness  | Insert rejected if `assetId` already present ("A bike with this identifier already exists") | REQ-001          |
| Snapshot    | Serialisable to a plain JSON array of Bike records for the ui             | REQ-001, REQ-002, REQ-003 |

## Invariants
- Every bike has a unique `assetId` (REQ-001).
- A newly onboarded bike is `InService` (REQ-001).
- `state` changes only along the permitted transitions (REQ-002).
- A non-compliant bike cannot return to `InService` (REQ-002 + REQ-003).
- A bike is renewal-due when `insuranceExpiry` or `serviceDue` is within 30 days or past (REQ-003).
