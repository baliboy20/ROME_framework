// FOB core-consent-audit — routes.
//
// api-contracts.md#consent--audit-cna:
//   POST /consent          -> CNA01
//   POST /consent/withdraw -> CNA02
//   GET  /admin/audit       -> CNA03 (owner-only)
// CNA04 (retention) is cron-triggered, not an HTTP route — see
// src/modules/consent/audit.ts#anonymizeDormantProspect. CNA05 is an
// internal pre-send gate — see src/modules/consent/audit.ts#consentState.

import { Hono } from "hono";
import { z } from "zod";
import type { Env } from "../env";
import { createDb } from "../db/client";
import { recordConsent, writeAudit } from "../modules/consent/audit";
import { requireOwnerSession } from "../modules/auth/middleware";
import { sha256Hex } from "../lib/hash";

export const consentRoutes = new Hono<{ Bindings: Env }>();

const consentTypeEnum = z.enum([
  "marketing_email",
  "marketing_whatsapp",
  "data_processing",
  "cookies_analytics",
  "cookies_marketing",
]);

// ---------------------------------------------------------------------------
// POST /consent — satisfies CNA01
// ---------------------------------------------------------------------------

const captureSchema = z.object({
  prospect_id: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(1).optional(),
  consent_type: consentTypeEnum,
  granted: z.boolean(),
  source: z.string().min(1),
  evidence: z.string().optional(),
  ip_address: z.string().optional(),
});

consentRoutes.post("/consent", async (c) => {
  const parsed = captureSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json(
      { error: "capture source not supplied", message: "Your choice could not be recorded" },
      400
    );
  }
  const body = parsed.data;

  const db = createDb(c.env.DB);
  let prospectId = body.prospect_id ?? null;

  if (!prospectId) {
    if (!body.email && !body.phone) {
      return c.json(
        {
          error: "no contact detail identifies the prospect",
          message: "We need a contact detail to record your choice",
        },
        400
      );
    }
    const now = new Date().toISOString();
    prospectId = crypto.randomUUID();
    await db.prospects.create({
      id: prospectId,
      name: null,
      email: body.email ?? null,
      phone: body.phone ?? null,
      whatsapp_ok: 0,
      preferred_channel: null,
      locale: null,
      source: body.source,
      first_seen_at: now,
      last_seen_at: now,
      created_at: now,
      deleted_at: null,
    });
  }

  const ipAddressHash = body.ip_address ? await sha256Hex(body.ip_address) : null;

  const consent = await recordConsent(db, {
    prospectId,
    consentType: body.consent_type,
    granted: body.granted,
    source: body.source,
    evidence: body.evidence ?? null,
    ipAddressHash,
  });

  return c.json({ consent }, 201);
});

// ---------------------------------------------------------------------------
// POST /consent/withdraw — satisfies CNA02
// ---------------------------------------------------------------------------

const withdrawSchema = z.object({
  prospect_id: z.string().min(1),
  consent_type: consentTypeEnum,
  source: z.string().min(1).default("unsubscribe"),
});

consentRoutes.post("/consent/withdraw", async (c) => {
  const parsed = withdrawSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json(
      { error: "capture source not supplied", message: "Your choice could not be recorded" },
      400
    );
  }
  const { prospect_id, consent_type, source } = parsed.data;

  const db = createDb(c.env.DB);
  const latest = await db.consents.latestByType(prospect_id, consent_type);
  if (!latest || latest.granted === 0) {
    // No prior permission on record — already suppressed, not an error.
    return c.json({ message: "You are already unsubscribed from this" }, 200);
  }

  const consent = await recordConsent(db, {
    prospectId: prospect_id,
    consentType: consent_type,
    granted: false,
    source,
  });

  return c.json({ consent }, 201);
});

// ---------------------------------------------------------------------------
// GET /admin/audit — satisfies CNA03 (owner-only read)
// ---------------------------------------------------------------------------

const auditQuerySchema = z.object({
  subject_type: z.string().min(1),
  subject_id: z.string().min(1),
});

consentRoutes.get("/admin/audit", requireOwnerSession, async (c) => {
  const parsed = auditQuerySchema.safeParse({
    subject_type: c.req.query("subject_type"),
    subject_id: c.req.query("subject_id"),
  });
  if (!parsed.success) {
    return c.json({ error: "subject_type and subject_id are required" }, 400);
  }

  const db = createDb(c.env.DB);
  const entries = await db.auditLog.listBySubject(parsed.data.subject_type, parsed.data.subject_id);
  return c.json({ entries }, 200);
});

// Exported for other P5 modules (booking refunds, fleet overrides, tour-ops
// incidents) to append audit entries without re-implementing writeAudit.
export { writeAudit };
