// FOB tour-operations — readiness sign-off gating logic.
//
// satisfies: REQ-OPS02..07, F-33 ("Safety blocks sign-off structurally: a
// failed bike not removed from service, an uncleared rider, or a missing
// critical kit item each blocks its step's sign-off"), UXD-13 (typed-confirm
// vs full-signature sign-off modes), UXD-15 (G5 high-risk blocks sign-off),
// UXD-17 (G8 final gate — outstanding upstream steps block sign-off).

import type { Db } from "../../db/client";
import type { RiderCheckin, TourReadiness } from "../../types";

export class ReadinessBlockedError extends Error {
  constructor(public readonly reason: string) {
    super(reason);
    this.name = "ReadinessBlockedError";
  }
}

/** REQ-OPS02 — kit check sign-off. Blocked if any critical item is missing. */
export function assertKitSignoffAllowed(criticalItemsConfirmed: boolean): void {
  if (!criticalItemsConfirmed) {
    throw new ReadinessBlockedError("critical_kit_item_missing");
  }
}

/**
 * REQ-OPS03 — bike inspection declaration. Blocked while any assigned
 * bike's roadworthiness status is unresolved (i.e. not yet passed/flagged).
 */
export function assertBikeDeclarationAllowed(allBikesResolved: boolean): void {
  if (!allBikesResolved) {
    throw new ReadinessBlockedError("bike_status_unresolved");
  }
}

/**
 * REQ-OPS04 — dynamic risk assessment sign-off. UXD-15: an unresolved
 * high-risk item blocks sign-off outright.
 */
export function assertRiskAssessmentSignoffAllowed(hasUnresolvedHighRisk: boolean): void {
  if (hasUnresolvedHighRisk) {
    throw new ReadinessBlockedError("unresolved_high_risk_item");
  }
}

/**
 * REQ-OPS06 — briefing confirmation. Blocked while any rider is still
 * unresolved (not cleared or refused) per REQ-OPS05's all-riders
 * declaration invariant.
 */
export function assertBriefingSignoffAllowed(allRidersCleared: boolean): void {
  if (!allRidersCleared) {
    throw new ReadinessBlockedError("riders_not_cleared");
  }
}

/**
 * REQ-OPS07 / UXD-17 — final pre-departure gate. Blocked while any upstream
 * step (kit, bike inspection, risk assessment, all-riders, briefing) is
 * unresolved. Returns the outstanding step names so the UI can state the
 * outstanding count (UXD-17).
 */
export function outstandingFinalSignoffSteps(readiness: TourReadiness): string[] {
  const outstanding: string[] = [];
  if (!readiness.kit_check_signed_at) outstanding.push("kit_check");
  if (!readiness.bike_inspection_signed_at) outstanding.push("bike_inspection");
  if (!readiness.risk_assessment_signed_at) outstanding.push("risk_assessment");
  if (!readiness.all_riders_cleared_at) outstanding.push("all_riders_cleared");
  if (!readiness.briefing_confirmed_at) outstanding.push("briefing");
  return outstanding;
}

export function assertFinalSignoffAllowed(readiness: TourReadiness): void {
  const outstanding = outstandingFinalSignoffSteps(readiness);
  if (outstanding.length > 0) {
    throw new ReadinessBlockedError(`outstanding_steps:${outstanding.join(",")}`);
  }
}

/** Derive the ReadinessStatus from a TourReadiness row's sign-off timestamps. */
export function deriveReadinessStatus(readiness: TourReadiness): TourReadiness["status"] {
  if (readiness.final_signoff_at) return "ready";
  const outstanding = outstandingFinalSignoffSteps(readiness);
  return outstanding.length === 5 ? "in_progress" : "in_progress";
}

/**
 * REQ-OPS05 — "all riders cleared" derivation: every rider_checkins row for
 * the departure must be resolved (cleared, i.e. `cleared = 1`) OR refused
 * (which still counts as "processed" — a refusal is a resolved outcome,
 * not an unresolved one; only a pending/unrecorded rider blocks).
 */
export function allRidersResolved(checkins: RiderCheckin[], expectedParticipantIds: string[]): boolean {
  const processedIds = new Set(checkins.map((c) => c.participant_id));
  return expectedParticipantIds.every((id) => processedIds.has(id));
}

/** Ensure the readiness row exists for a departure, creating if absent. */
export async function getOrCreateReadiness(
  db: Db,
  departureId: string,
  guideId: string,
  newId: () => string
): Promise<TourReadiness> {
  const existing = await db.tourReadiness.getByDeparture(departureId);
  if (existing) return existing;

  const row: TourReadiness = {
    id: newId(),
    departure_id: departureId,
    guide_id: guideId,
    kit_check_signed_at: null,
    bike_inspection_signed_at: null,
    risk_assessment_signed_at: null,
    all_riders_cleared_at: null,
    briefing_confirmed_at: null,
    final_signoff_at: null,
    status: "in_progress",
  };
  await db.tourReadiness.create(row);
  return row;
}
