// FOB tour-operations — preliminary incident capture.
//
// satisfies: REQ-OPS09 ("the Guide's safety actions happen before or
// alongside logging, never blocked by it"; "an incident record, once
// logged, is never modified or deleted" — audited via CNA03). Owner
// notification is via `core-notifications` REQ-NOTIF04 (out of this
// module's scope to implement the send itself; the route triggers it).

import type { Incident, IncidentType } from "../../types";

export interface IncidentInput {
  id: string;
  departure_id: string;
  occurred_at: string;
  location: string;
  type: IncidentType;
  severity: string;
  preliminary_description: string;
}

/** Build a preliminary incident record (REQ-OPS09). Never blocked by
 * validation beyond the required fields — the Guide's safety actions take
 * priority over logging completeness. */
export function buildPreliminaryIncident(input: IncidentInput): Incident {
  return {
    id: input.id,
    departure_id: input.departure_id,
    occurred_at: input.occurred_at,
    location: input.location,
    type: input.type,
    severity: input.severity,
    preliminary_description: input.preliminary_description,
    formal_report: null,
    status: "submitted",
    insurer_dispatch_at: null,
  };
}
