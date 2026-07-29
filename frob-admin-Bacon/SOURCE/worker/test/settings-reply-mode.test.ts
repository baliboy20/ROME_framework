// FR-001 workstream 3 — reply mode governs WHEN the booking confirmation is
// sent, never WHETHER. These tests exist to hold that line: the dangerous
// failure would be a setting that results in a paying customer being told
// nothing, which REQ-NOTIF11 / UXC-FBK-1 forbid.
import { describe, expect, it } from "vitest";
import { sendBookingOutcome } from "../src/modules/notifications/booking-outcome";
import { createDb } from "../src/db/client";
import { createTestEnv } from "./testEnv";

// The real schema (migration 0008) creates operator_settings with a singleton
// row already present, so these tests exercise the shipped table, not a stub.
async function setReplyMode(
  env: Awaited<ReturnType<typeof createTestEnv>>,
  replyMode: string | null
) {
  if (replyMode === null) {
    await env.DB.prepare(`DELETE FROM operator_settings WHERE id = 'singleton'`).run();
    return;
  }
  await env.DB.prepare(`UPDATE operator_settings SET reply_mode = ? WHERE id = 'singleton'`)
    .bind(replyMode)
    .run();
}

describe("reply mode", () => {
  it("manual mode stands the automatic send down", async () => {
    const env = await createTestEnv();
    await setReplyMode(env, "manual");
    const r = await sendBookingOutcome(createDb(env.DB), env, "BK-does-not-matter");
    expect(r.status).toBe("deferred_manual_reply");
  });

  it("auto mode does not stand down", async () => {
    const env = await createTestEnv();
    await setReplyMode(env, "auto");
    const r = await sendBookingOutcome(createDb(env.DB), env, "BK-missing");
    // Proceeds past the gate and fails on the booking instead — the point is
    // that it was NOT deferred.
    expect(r.status).not.toBe("deferred_manual_reply");
  });

  it("force bypasses manual mode — the Owner's own send is never suppressed", async () => {
    const env = await createTestEnv();
    await setReplyMode(env, "manual");
    const r = await sendBookingOutcome(createDb(env.DB), env, "BK-missing", { force: true });
    expect(r.status).not.toBe("deferred_manual_reply");
  });

  // The two fail-open cases. A confirmation is a transactional guarantee, so a
  // missing row or a broken settings table must never be the reason a paying
  // customer hears nothing. Failing closed here would be the dangerous choice.
  it("defaults to auto when no settings row exists", async () => {
    const env = await createTestEnv();
    await setReplyMode(env, null);
    const r = await sendBookingOutcome(createDb(env.DB), env, "BK-missing");
    expect(r.status).not.toBe("deferred_manual_reply");
  });

  it("defaults to auto when the settings lookup throws", async () => {
    const env = await createTestEnv();
    // Drop the table outright so the query genuinely throws, rather than
    // simulating it — the fail-open path must be exercised for real.
    await env.DB.prepare(`DROP TABLE operator_settings`).run();
    const r = await sendBookingOutcome(createDb(env.DB), env, "BK-missing");
    expect(r.status).not.toBe("deferred_manual_reply");
  });
});
