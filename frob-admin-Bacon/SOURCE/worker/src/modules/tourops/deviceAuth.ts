// FOB tour-operations — Guide device-auth middleware.
//
// satisfies: TDR-07 (Guide auth mechanism), AUTH03 (api-contracts.md
// "every `/guide/*` request carries X-Device-ID; middleware matches it to a
// registered `devices` row -> `guides`. No JWT/KV session for guides.").
// Unregistered X-Device-ID -> 403 (api-contracts.md "Error & idempotency
// conventions").

import type { Context, Next } from "hono";
import { createDb } from "../../db/client";
import type { Env } from "../../env";
import type { Device, Guide } from "../../types";

export type GuideAuthVars = {
  device: Device;
  guide: Guide;
};

/**
 * Hono middleware: validates the `X-Device-ID` header against the
 * `devices` table, resolves the owning `guides` row, and stashes both on
 * context for downstream handlers. Missing header -> 401; unregistered or
 * non-active device -> 403.
 */
export async function requireDeviceAuth(
  c: Context<{ Bindings: Env; Variables: GuideAuthVars }>,
  next: Next
) {
  const deviceId = c.req.header("X-Device-ID");
  if (!deviceId) {
    return c.json({ error: "missing_device_id" }, 401);
  }

  const db = createDb(c.env.DB);
  const device = await db.devices.get(deviceId);
  if (!device || device.status !== "active") {
    return c.json({ error: "unregistered_device" }, 403);
  }

  const guide = await db.guides.get(device.guide_id);
  if (!guide) {
    return c.json({ error: "unregistered_device" }, 403);
  }

  c.set("device", device);
  c.set("guide", guide);
  await next();
}
