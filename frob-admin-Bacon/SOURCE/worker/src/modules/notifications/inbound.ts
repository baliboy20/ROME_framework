// FOB core-notifications — inbound email capture + categorisation cascade.
//
// satisfies: REQ-NOTIF05 (import received-email; the 5-step ordered cascade,
// first-match-wins, no step guesses). Genuinely-new capability from the EML
// reintegration (was REQ-EML11). DR-7 (spam flagged, never withheld), DR-10
// (co-leader addresses match), DR-9 (cascade steps are tunable).
//
// Uses the generic query/exec helpers (core-data-access) for the new EML
// tables rather than extending the per-entity Db repository.

import { exec, query, queryOne } from "../../db/client";

export type Categorisation = "linked" | "unlinked" | "ambiguous";

export interface InboundEmail {
  fromAddress: string;
  subject: string | null;
  body: string | null;
  references: string | null;
  inReplyTo: string | null;
  spam: boolean;
  providerRef: string | null;
  now?: Date;
}

export interface CaptureResult {
  threadId: string;
  receivedEmailId: string;
  categorisation: Categorisation;
  bookingId: string | null;
  enquiryId: string | null;
  candidateRefs: string[] | null;
}

interface CascadeOutcome {
  existingThreadId: string | null;
  categorisation: Categorisation;
  bookingId: string | null;
  enquiryId: string | null;
  candidateRefs: string[] | null;
}

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const MSGID_RE = /<[^>]+>/g;

function extractMessageIds(references: string | null, inReplyTo: string | null): string[] {
  const raw = `${references ?? ""} ${inReplyTo ?? ""}`;
  return Array.from(new Set(raw.match(MSGID_RE) ?? []));
}

const OPEN_BOOKING = ["confirmed", "provisionally-confirmed", "draft"];
const OPEN_ENQUIRY = ["open", "acknowledged"];

/**
 * Run the ordered categorisation cascade. First match wins; no step guesses.
 * Returns the outcome without persisting anything.
 */
export async function runCascade(db: D1Database, input: InboundEmail): Promise<CascadeOutcome> {
  // Step 1 + 2 — reply-reference threading + inheritance.
  const refIds = extractMessageIds(input.references, input.inReplyTo);
  if (refIds.length) {
    const placeholders = refIds.map(() => "?").join(",");
    const prior = await queryOne<{ thread_id: string }>(
      db,
      `SELECT thread_id FROM received_emails WHERE provider_ref IN (${placeholders}) LIMIT 1`,
      refIds
    );
    if (prior) {
      const thread = await queryOne<{
        id: string;
        categorisation: Categorisation;
        booking_id: string | null;
        enquiry_id: string | null;
      }>(db, `SELECT id, categorisation, booking_id, enquiry_id FROM email_threads WHERE id = ?`, [
        prior.thread_id,
      ]);
      if (thread) {
        return {
          existingThreadId: thread.id,
          categorisation: thread.categorisation,
          bookingId: thread.booking_id,
          enquiryId: thread.enquiry_id,
          candidateRefs: null,
        };
      }
    }
  }

  // Step 3 — reference-number extraction (a booking/enquiry id in subject/body).
  const text = `${input.subject ?? ""} ${input.body ?? ""}`;
  const tokens = Array.from(new Set(text.match(UUID_RE) ?? [])).map((t) => t.toLowerCase());
  if (tokens.length) {
    const ph = tokens.map(() => "?").join(",");
    const bk = await queryOne<{ id: string }>(
      db,
      `SELECT id FROM bookings WHERE lower(id) IN (${ph}) LIMIT 1`,
      tokens
    );
    if (bk) return outcome("linked", bk.id, null, null);
    const enq = await queryOne<{ id: string }>(
      db,
      `SELECT id FROM enquiries WHERE lower(id) IN (${ph}) LIMIT 1`,
      tokens
    );
    if (enq) return outcome("linked", null, enq.id, null);
  }

  // Step 4 — sender-address lookup. Exactly one open candidate links; more than
  // one is ambiguous (candidates recorded, none chosen). DR-10: a co-leader/
  // leader address on a booking matches, same as the party leader's.
  const from = input.fromAddress.toLowerCase();
  const candidates: { type: "booking" | "enquiry"; id: string }[] = [];

  const parts = await query<{ booking_id: string }>(
    db,
    `SELECT p.booking_id FROM participants p
       JOIN bookings b ON b.id = p.booking_id
      WHERE lower(p.email) = ? AND b.status IN (${OPEN_BOOKING.map(() => "?").join(",")})`,
    [from, ...OPEN_BOOKING]
  );
  for (const p of parts) candidates.push({ type: "booking", id: p.booking_id });

  const prospect = await queryOne<{ id: string }>(
    db,
    `SELECT id FROM prospects WHERE lower(email) = ? LIMIT 1`,
    [from]
  );
  if (prospect) {
    const enqs = await query<{ id: string }>(
      db,
      `SELECT id FROM enquiries WHERE prospect_id = ? AND status IN (${OPEN_ENQUIRY.map(() => "?").join(",")})`,
      [prospect.id, ...OPEN_ENQUIRY]
    );
    for (const e of enqs) candidates.push({ type: "enquiry", id: e.id });
  }

  const distinct = Array.from(
    new Map(candidates.map((c) => [`${c.type}:${c.id}`, c])).values()
  );
  if (distinct.length === 1) {
    const only = distinct[0];
    return only.type === "booking"
      ? outcome("linked", only.id, null, null)
      : outcome("linked", null, only.id, null);
  }
  if (distinct.length > 1) {
    return outcome("ambiguous", null, null, distinct.map((c) => `${c.type}:${c.id}`));
  }

  // Step 5 — no match.
  return outcome("unlinked", null, null, null);
}

function outcome(
  categorisation: Categorisation,
  bookingId: string | null,
  enquiryId: string | null,
  candidateRefs: string[] | null
): CascadeOutcome {
  return { existingThreadId: null, categorisation, bookingId, enquiryId, candidateRefs };
}

/**
 * Capture an inbound message: run the cascade, create/reuse its thread, and
 * insert the received_email. Never throws away a message — an uncategorised
 * one lands as `unlinked`/`ambiguous`, still searchable (REQ-NOTIF06).
 */
export async function captureInbound(db: D1Database, input: InboundEmail): Promise<CaptureResult> {
  const nowIso = (input.now ?? new Date()).toISOString();
  const c = await runCascade(db, input);

  let threadId = c.existingThreadId;
  if (!threadId) {
    threadId = crypto.randomUUID();
    await exec(
      db,
      `INSERT INTO email_threads (id, categorisation, booking_id, enquiry_id, candidate_refs, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        threadId,
        c.categorisation,
        c.bookingId,
        c.enquiryId,
        c.candidateRefs ? JSON.stringify(c.candidateRefs) : null,
        nowIso,
      ]
    );
  }

  const receivedEmailId = crypto.randomUUID();
  await exec(
    db,
    `INSERT INTO received_emails
       (id, thread_id, from_address, subject, body, spam_flag, references_header, in_reply_to, provider_ref, received_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      receivedEmailId,
      threadId,
      input.fromAddress,
      input.subject,
      input.body,
      input.spam ? 1 : 0,
      input.references,
      input.inReplyTo,
      input.providerRef,
      nowIso,
    ]
  );

  return {
    threadId,
    receivedEmailId,
    categorisation: c.categorisation,
    bookingId: c.bookingId,
    enquiryId: c.enquiryId,
    candidateRefs: c.candidateRefs,
  };
}
