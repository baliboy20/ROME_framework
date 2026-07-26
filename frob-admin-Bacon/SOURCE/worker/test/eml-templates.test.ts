import { describe, expect, it } from "vitest";
import { send } from "../src/modules/notifications/send";
import { substituteMergeFields, renderTemplate } from "../src/modules/notifications/templates";
import { createTestEnv } from "./testEnv";
import { createDb } from "../src/db/client";

async function seedActiveTemplate(env: Awaited<ReturnType<typeof createTestEnv>>) {
  await env.DB.prepare(
    `INSERT INTO email_templates (id, use_case, name, subject, body, variables, status, created_at, updated_at)
     VALUES (?, 'cancellation_notice', 'Cancellation', 'Sorry {{ name }} — {{ tour }} is off',
             'Hi {{ name }}, your {{ tour }} on {{ date }} is cancelled. {{ discount_line }}',
             '["name","tour","date","discount_line"]', 'active', '2026-07-26T00:00:00Z', '2026-07-26T00:00:00Z')`
  )
    .bind(crypto.randomUUID())
    .run();
}

// ---------------------------------------------------------------------------
// REQ-NOTIF10 — email-template rendering into send()
// ---------------------------------------------------------------------------

describe("substituteMergeFields", () => {
  it("replaces known {{ tokens }} and blanks unknown ones (never leaks the token)", () => {
    const out = substituteMergeFields("Hi {{ name }} — {{ missing }}!", { name: "Ada" });
    expect(out).toBe("Hi Ada — !");
  });
});

describe("renderTemplate", () => {
  it("returns null when no active template exists for the use_case", async () => {
    const env = await createTestEnv();
    expect(await renderTemplate(env.DB, "cancellation_notice", {})).toBeNull();
  });

  it("renders the active template's subject and body with the supplied vars", async () => {
    const env = await createTestEnv();
    await seedActiveTemplate(env);
    const rendered = await renderTemplate(env.DB, "cancellation_notice", {
      name: "Tom",
      tour: "Coastal Loop",
      date: "2026-08-01",
      discount_line: "Use REBOOK10.",
    });
    expect(rendered).not.toBeNull();
    expect(rendered!.subject).toBe("Sorry Tom — Coastal Loop is off");
    expect(rendered!.textBody).toContain("your Coastal Loop on 2026-08-01 is cancelled. Use REBOOK10.");
  });
});

describe("send() with template", () => {
  it("renders from the active template and records message.template_id", async () => {
    const env = await createTestEnv();
    await seedActiveTemplate(env);
    const db = createDb(env.DB);

    const result = await send(db, env, {
      messageType: "transactional",
      recipient: "tom@example.com",
      event: "cancellation-notice:bk1",
      idempotencyKey: "cancellation-notice:bk1:tom@example.com",
      // Plain-text fallback — should be overridden by the active template.
      subject: "PLAIN SUBJECT",
      textBody: "PLAIN BODY",
      template: {
        useCase: "cancellation_notice",
        vars: { name: "Tom", tour: "Coastal Loop", date: "2026-08-01", discount_line: "" },
      },
    });

    expect(result.status).toBe("sent");
    expect(result.message?.template_id).toBeTruthy();

    // The persisted message carries the template_id.
    const row = await env.DB.prepare(`SELECT template_id FROM message WHERE id = ?`)
      .bind(result.message!.id)
      .first<{ template_id: string | null }>();
    expect(row?.template_id).toBe(result.message?.template_id);
  });

  it("falls back to the caller's plain text when no active template exists", async () => {
    const env = await createTestEnv();
    const db = createDb(env.DB);

    const result = await send(db, env, {
      messageType: "transactional",
      recipient: "jo@example.com",
      event: "cancellation-notice:bk2",
      idempotencyKey: "cancellation-notice:bk2:jo@example.com",
      subject: "PLAIN SUBJECT",
      textBody: "PLAIN BODY",
      template: { useCase: "cancellation_notice", vars: {} },
    });

    expect(result.status).toBe("sent");
    expect(result.message?.template_id).toBeNull();
  });
});
