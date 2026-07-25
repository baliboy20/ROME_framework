// FOB tour-operations — rider check-in / refusal logic.
//
// satisfies: REQ-OPS05, UXD-16 (G6 rider check-in refusal — "refusal cases
// mark the rider refused and flag for a William-processed refund; the
// guide never handles money"). Refusal reasons per REQ-OPS05 errors:
// incompatible medical condition, visibly impaired/intoxicated, minor
// without accompanying adult, waiver re-confirmation refused.

import type { RiderCheckin } from "../../types";

export type RefusalReason =
  | "medical_incompatible"
  | "impaired_or_intoxicated"
  | "unaccompanied_minor"
  | "waiver_refused";

export interface CheckinInput {
  id: string;
  departure_id: string;
  participant_id: string;
  bike_id: string | null;
  /** Required for a `cleared` outcome (F-30 / REQ-OPS05 invariant). */
  waiver_reconfirmed: boolean;
  refusal_reason: RefusalReason | null;
  guide_notes: string | null;
  now: string;
}

export class CheckinValidationError extends Error {
  constructor(public readonly reason: string) {
    super(reason);
    this.name = "CheckinValidationError";
  }
}

/**
 * Build a RiderCheckin row for either a `cleared` or `refused` outcome.
 * Invariant (REQ-OPS05): "a rider is never marked `cleared` without a
 * recorded waiver re-confirmation."
 *
 * A refused rider is NEVER money-handled here (UXD-16) — the caller must
 * separately raise the Owner-processed-refund flag (e.g. an audit-log
 * entry / owner notification), never a refund action in this module.
 */
export function buildRiderCheckin(input: CheckinInput): RiderCheckin {
  const isRefusal = input.refusal_reason !== null;

  if (!isRefusal && !input.waiver_reconfirmed) {
    throw new CheckinValidationError("waiver_reconfirmation_required_for_clearance");
  }

  return {
    id: input.id,
    departure_id: input.departure_id,
    participant_id: input.participant_id,
    bike_id: input.bike_id,
    waiver_reconfirmed_at: input.waiver_reconfirmed ? input.now : null,
    cleared: isRefusal ? 0 : 1,
    refusal_reason: input.refusal_reason,
    guide_notes: input.guide_notes,
    created_at: input.now,
  };
}

/** True when a check-in row represents a refusal that must be flagged for
 * an Owner-processed refund (UXD-16, D-OPS-4 — "guide flags, Owner
 * processes"). The guide/system never triggers money movement directly.
 */
export function isRefusalRequiringOwnerRefundFlag(checkin: RiderCheckin): boolean {
  return checkin.cleared === 0 && checkin.refusal_reason !== null;
}
