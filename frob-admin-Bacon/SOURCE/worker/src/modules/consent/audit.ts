// FOB core-consent-audit — internal logic.
//
// satisfies: REQ-CNA01 (append-only consent capture), REQ-CNA03 (append-only
// audit_log service — `writeAudit()`), REQ-CNA04 (90-day dormant-prospect
// anonymisation, cron-triggered), REQ-CNA05 (`consentState()` pre-send
// gate, used internally by core-notifications NOTIF01/NOTIF04's marketing
// path and by cron sends elsewhere in the system).

import type { Db } from "../../db/client";
import type { AuditActorType, Consent, ConsentType } from "../../types";

// ---------------------------------------------------------------------------
// writeAudit() — satisfies REQ-CNA03
// ---------------------------------------------------------------------------

export interface WriteAuditInput {
  actorType: AuditActorType;
  actorId: string | null;
  subjectType: string;
  subjectId: string | null;
  action: string;
  detail?: string | null;
  now?: Date;
}

/** Append one immutable audit_log entry. Never updates or deletes. */
export async function writeAudit(db: Db, input: WriteAuditInput): Promise<void> {
  // "complete" flags entries missing subject or actor identity for owner
  // review, per REQ-CNA03's error path — the entry is still recorded.
  const complete = input.subjectId !== null && input.actorId !== null ? 1 : 0;
  await db.auditLog.create({
    id: crypto.randomUUID(),
    occurred_at: (input.now ?? new Date()).toISOString(),
    actor_type: input.actorType,
    actor_id: input.actorId,
    subject_type: input.subjectType,
    subject_id: input.subjectId,
    action: input.action,
    detail: input.detail ?? null,
    complete,
  });
}

// ---------------------------------------------------------------------------
// consentState() — satisfies REQ-CNA05
// ---------------------------------------------------------------------------

/**
 * The current consent state for a person+purpose is the *latest* appended
 * decision, or withheld/withdrawn (false) if no decision is on record at
 * all — a marketing permission is never pre-granted (CNA01 invariant).
 */
export async function consentState(
  db: Db,
  prospectId: string,
  consentType: ConsentType
): Promise<boolean> {
  const latest = await db.consents.latestByType(prospectId, consentType);
  if (!latest) return false;
  return latest.granted === 1;
}

// ---------------------------------------------------------------------------
// recordConsent() — satisfies REQ-CNA01 / REQ-CNA02 (grant + withdrawal are
// both just a new appended row; granted=0 is a withdrawal).
// ---------------------------------------------------------------------------

export interface RecordConsentInput {
  prospectId: string;
  consentType: ConsentType;
  granted: boolean;
  source: string;
  evidence?: string | null;
  ipAddressHash?: string | null;
  now?: Date;
}

export async function recordConsent(db: Db, input: RecordConsentInput): Promise<Consent> {
  const row: Consent = {
    id: crypto.randomUUID(),
    prospect_id: input.prospectId,
    consent_type: input.consentType,
    granted: input.granted ? 1 : 0,
    source: input.source,
    evidence: input.evidence ?? null,
    ip_address_hash: input.ipAddressHash ?? null,
    granted_at: (input.now ?? new Date()).toISOString(),
  };
  await db.consents.create(row);
  return row;
}

// ---------------------------------------------------------------------------
// anonymizeDormantProspects() — satisfies REQ-CNA04 (90-day retention
// scheduler). Intended to be invoked by the cron-workers component
// (`gdpr-cleanup`, 03:00 UTC daily per wrangler.toml); exported here for
// that P5 agent to wire up.
// ---------------------------------------------------------------------------

const RETENTION_WINDOW_DAYS = 90;

export interface AnonymizeResult {
  prospectId: string;
  anonymized: boolean;
}

/**
 * Blank a single prospect's personal fields if dormant beyond the 90-day
 * window (last_seen_at older than now - 90d). The row itself is never
 * removed (referential integrity); every erasure is itself audited.
 */
export async function anonymizeDormantProspect(
  db: Db,
  prospectId: string,
  now: Date = new Date()
): Promise<AnonymizeResult> {
  const prospect = await (async () => {
    // Db interface only exposes `get` on some repos; prospects has `get`.
    return db.prospects.get(prospectId);
  })();
  if (!prospect) return { prospectId, anonymized: false };
  if (prospect.deleted_at) return { prospectId, anonymized: false };

  const dormantSince = new Date(prospect.last_seen_at).getTime();
  const cutoff = now.getTime() - RETENTION_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  if (dormantSince > cutoff) {
    // Record shows recent activity — not yet eligible.
    return { prospectId, anonymized: false };
  }

  // `prospects` has a CHECK requiring email OR phone non-null (referential/
  // contactability invariant from an earlier module); blank both personal
  // fields' content but satisfy the CHECK with an empty, non-personal
  // placeholder rather than a real contact detail.
  await db.prospects.update(prospectId, {
    name: null,
    email: null,
    phone: "",
    deleted_at: now.toISOString(),
  });

  await writeAudit(db, {
    actorType: "system_cron",
    actorId: null,
    subjectType: "prospect",
    subjectId: prospectId,
    action: "gdpr_anonymize",
    now,
  });

  return { prospectId, anonymized: true };
}
