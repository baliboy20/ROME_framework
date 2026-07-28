// REQ-NOTIF10 (CR-002/CHG-001) — HTML email templates: block→HTML renderer +
// house shell, escaping, multipart/alternative MIME, template CRUD with
// body_blocks, merge substitution in both bodies, text-only path unchanged.
//
// The golden fixtures in test/fixtures/html-email/ are the parity contract
// with the Flutter admin's mirrored preview renderer (component-specs.md
// CR-002): same block JSON must produce byte-identical HTML in both suites.

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Hono } from "hono";
import { beforeEach, describe, expect, it } from "vitest";
import {
  renderBlocksToHtml,
  escapeHtml,
  blocksSchema,
  TEMPLATE_LOGO_URL,
  TEMPLATE_LOGO_WIDTH,
  TEMPLATE_LOGO_HEIGHT,
  TEMPLATE_FOOTER_IDENTITY,
} from "../src/modules/notifications/html-render";
import {
  substituteMergeFields,
  substituteMergeFieldsHtml,
  renderTemplate,
} from "../src/modules/notifications/templates";
import { buildMime, encodeQuotedPrintable, type CfEmailInput } from "../src/lib/cloudflare-email";
import { send } from "../src/modules/notifications/send";
import { emailRoutes } from "../src/routes/email";
import type { Env } from "../src/env";
import { createTestEnv } from "./testEnv";
import { createDb } from "../src/db/client";
import { signJwt } from "../src/modules/auth/jwt";
import { putSession } from "../src/kv/session";

const fixturesDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "fixtures",
  "html-email"
);

// ---------------------------------------------------------------------------
// Renderer — per-block output + house shell (REQ-NOTIF10: email-safe HTML)
// ---------------------------------------------------------------------------

describe("renderBlocksToHtml", () => {
  it("renders every block type inside the house shell (600px table, inline styles)", () => {
    const html = renderBlocksToHtml([
      { type: "header", tagline: "Tag" },
      { type: "text", text: "Hello" },
      { type: "button", label: "Go", href: "https://x.example/" },
      { type: "divider" },
      { type: "footer", text: "Bye" },
    ]);
    // Shell: page ground, centred 600px content table, table-based layout.
    expect(html).toContain('role="presentation"');
    expect(html).toContain('width="600"');
    expect(html).toContain("background-color:#f7f5ef");
    // Header band: single hosted logo with explicit dimensions + alt.
    expect(html).toContain(`src="${TEMPLATE_LOGO_URL}"`);
    expect(html).toContain('alt="Friends on Bikes"');
    expect(html).toContain(`width="${TEMPLATE_LOGO_WIDTH}" height="${TEMPLATE_LOGO_HEIGHT}"`);
    // Blocks.
    expect(html).toContain("Tag");
    expect(html).toContain("Hello");
    expect(html).toContain('href="https://x.example/"');
    expect(html).toContain("border-top:1px solid #dde3da");
    expect(html).toContain(TEMPLATE_FOOTER_IDENTITY);
    expect(html).toContain("Bye");
    // Email-safe invariants: no scripts, no <style> block, no classes.
    expect(html).not.toContain("<script");
    expect(html).not.toContain("<style");
    expect(html).not.toContain("class=");
    // Web-safe font fallbacks, brand face first.
    expect(html).toContain("'DM Sans',Helvetica,Arial,sans-serif");
  });

  it("emits the logo-only header band and fixed identity footer when those blocks are absent", () => {
    const html = renderBlocksToHtml([{ type: "text", text: "solo" }]);
    expect(html).toContain(`src="${TEMPLATE_LOGO_URL}"`);
    expect(html).toContain(TEMPLATE_FOOTER_IDENTITY);
  });

  it("HTML-escapes all owner-provided values while preserving {{merge}} tokens", () => {
    const html = renderBlocksToHtml([
      { type: "text", text: `<img onerror=x> & "quo" 'apo' {{ name }}` },
    ]);
    expect(html).toContain("&lt;img onerror=x&gt; &amp; &quot;quo&quot; &#39;apo&#39; {{ name }}");
    expect(html).not.toContain("<img onerror");
  });

  it("rejects unknown block types and empty lists", () => {
    expect(blocksSchema.safeParse([{ type: "raw_html", html: "<p>x</p>" }]).success).toBe(false);
    expect(blocksSchema.safeParse([]).success).toBe(false);
    expect(() => renderBlocksToHtml([{ type: "nope" }])).toThrow();
  });

  it("matches the golden fixtures (parity contract with the Flutter preview renderer)", () => {
    const pairs = readdirSync(fixturesDir).filter((f) => f.endsWith(".blocks.json"));
    expect(pairs.length).toBeGreaterThanOrEqual(3);
    for (const f of pairs) {
      const blocks = JSON.parse(readFileSync(path.join(fixturesDir, f), "utf-8"));
      const golden = readFileSync(path.join(fixturesDir, f.replace(".blocks.json", ".html")), "utf-8");
      expect(renderBlocksToHtml(blocks) + "\n").toBe(golden);
    }
  });
});

describe("escapeHtml", () => {
  it("escapes & < > \" '", () => {
    expect(escapeHtml(`&<>"'`)).toBe("&amp;&lt;&gt;&quot;&#39;");
  });
});

// ---------------------------------------------------------------------------
// Merge substitution — both bodies, escaped values in HTML
// ---------------------------------------------------------------------------

describe("substituteMergeFieldsHtml", () => {
  it("fills tokens and HTML-escapes merge values", () => {
    const out = substituteMergeFieldsHtml("<td>Hi {{ name }}</td>", { name: `<b>Ada & "co"</b>` });
    expect(out).toBe("<td>Hi &lt;b&gt;Ada &amp; &quot;co&quot;&lt;/b&gt;</td>");
  });

  it("blanks unknown tokens like the text variant", () => {
    expect(substituteMergeFieldsHtml("x{{ nope }}y", {})).toBe("xy");
  });
});

// ---------------------------------------------------------------------------
// MIME — multipart/alternative structure + text-only path byte-unchanged
// ---------------------------------------------------------------------------

describe("buildMime (CR-002 multipart/alternative)", () => {
  const base: CfEmailInput = {
    from: "bookings@friendsonbikes.uk",
    to: "tom@example.com",
    subject: "Hello",
    textBody: "Plain body ✔",
  };

  it("text-only input produces exactly the pre-CR-002 single-part message", () => {
    const mime = buildMime({ ...base, textBody: "Plain body" }, "<mid@friendsonbikes.uk>");
    const expected =
      `From: bookings@friendsonbikes.uk\r\n` +
      `To: tom@example.com\r\n` +
      `Subject: Hello\r\n` +
      `Message-ID: <mid@friendsonbikes.uk>\r\n` +
      `Date: ${mime.match(/Date: (.*)\r\n/)![1]}\r\n` +
      `MIME-Version: 1.0\r\n` +
      `Content-Type: text/plain; charset="utf-8"\r\n` +
      `\r\nPlain body\r\n`;
    expect(mime).toBe(expected);
    expect(mime).not.toContain("multipart");
  });

  it("with htmlBody emits multipart/alternative: text/plain first, text/html last, QP UTF-8, CRLF", () => {
    const mime = buildMime({ ...base, htmlBody: "<p>HTML body ✔</p>" }, "<mid@x>");
    const boundary = mime.match(/boundary="([^"]+)"/)![1];
    expect(boundary.startsWith("=_fob_")).toBe(true);
    expect(mime).toContain(`Content-Type: multipart/alternative; boundary="${boundary}"`);

    const firstPart = mime.indexOf(`--${boundary}\r\n`);
    const plainAt = mime.indexOf('Content-Type: text/plain; charset="utf-8"');
    const htmlAt = mime.indexOf('Content-Type: text/html; charset="utf-8"');
    expect(firstPart).toBeGreaterThan(-1);
    expect(plainAt).toBeGreaterThan(firstPart);
    expect(htmlAt).toBeGreaterThan(plainAt); // ascending preference (RFC 2046)
    expect(mime.match(/Content-Transfer-Encoding: quoted-printable/g)).toHaveLength(2);
    expect(mime.endsWith(`--${boundary}--\r\n`)).toBe(true);
    // 8-bit chars are QP-encoded (✔ = E2 9C 94), so the raw char never appears.
    expect(mime).toContain("=E2=9C=94");
    expect(mime).not.toContain("✔");
    // No bare LFs.
    expect(mime.replace(/\r\n/g, "")).not.toContain("\n");
  });
});

describe("encodeQuotedPrintable", () => {
  it("encodes '=' and 8-bit octets, soft-wraps to ≤76 chars", () => {
    expect(encodeQuotedPrintable("a=b")).toBe("a=3Db");
    expect(encodeQuotedPrintable("é")).toBe("=C3=A9");
    const long = encodeQuotedPrintable("x".repeat(300));
    for (const line of long.split("\r\n")) expect(line.length).toBeLessThanOrEqual(76);
    expect(long.replace(/=\r\n/g, "")).toBe("x".repeat(300));
  });
});

// ---------------------------------------------------------------------------
// Route + send-path integration
// ---------------------------------------------------------------------------

function app() {
  const hono = new Hono<{ Bindings: Env }>();
  hono.route("/", emailRoutes);
  return hono;
}

async function operatorToken(env: Env): Promise<string> {
  const token = await signJwt(env.JWT_SECRET, { actorId: "william", actorType: "owner" });
  await putSession(env.SESSIONS, { token, actor_type: "owner", actor_id: "william" });
  return token;
}
function headers(token: string) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

const SAMPLE_BLOCKS = [
  { type: "text", text: "Hi {{ name }}, see you on {{ date }}." },
  { type: "button", label: "View booking", href: "https://friendsonbikes.uk/b/{{ booking_ref }}" },
];

let env: Env;
let token: string;
beforeEach(async () => {
  env = await createTestEnv();
  token = await operatorToken(env);
});

describe("NOTIF10 CR-002 template CRUD with body_blocks", () => {
  it("create with body_blocks stores blocks and a server-rendered body_html", async () => {
    const res = await app().request(
      "/admin/email-templates",
      {
        method: "POST",
        headers: headers(token),
        body: JSON.stringify({ use_case: "reminder", name: "R", subject: "S", body: "B", body_blocks: SAMPLE_BLOCKS }),
      },
      env
    );
    expect(res.status).toBe(201);
    const { id } = await res.json<{ id: string }>();
    const row = await env.DB.prepare(`SELECT body_blocks, body_html FROM email_templates WHERE id = ?`)
      .bind(id)
      .first<{ body_blocks: string | null; body_html: string | null }>();
    expect(JSON.parse(row!.body_blocks!)).toEqual(SAMPLE_BLOCKS);
    expect(row!.body_html).toBe(renderBlocksToHtml(SAMPLE_BLOCKS));
    expect(row!.body_html).toContain("{{ name }}"); // merge tokens survive rendering
  });

  it("text-only create leaves both columns null (behaviour unchanged)", async () => {
    const res = await app().request(
      "/admin/email-templates",
      { method: "POST", headers: headers(token), body: JSON.stringify({ use_case: "reminder", name: "R", subject: "S", body: "B" }) },
      env
    );
    const { id } = await res.json<{ id: string }>();
    const row = await env.DB.prepare(`SELECT body_blocks, body_html FROM email_templates WHERE id = ?`)
      .bind(id)
      .first<{ body_blocks: string | null; body_html: string | null }>();
    expect(row).toEqual({ body_blocks: null, body_html: null });
  });

  it("rejects client-supplied body_html on create and patch (422)", async () => {
    const create = await app().request(
      "/admin/email-templates",
      {
        method: "POST",
        headers: headers(token),
        body: JSON.stringify({ use_case: "reminder", name: "R", subject: "S", body: "B", body_html: "<script>x</script>" }),
      },
      env
    );
    expect(create.status).toBe(422);

    const ok = await app().request(
      "/admin/email-templates",
      { method: "POST", headers: headers(token), body: JSON.stringify({ use_case: "reminder", name: "R", subject: "S", body: "B" }) },
      env
    );
    const { id } = await ok.json<{ id: string }>();
    const patch = await app().request(
      `/admin/email-templates/${id}`,
      { method: "PATCH", headers: headers(token), body: JSON.stringify({ body_html: "<p>evil</p>" }) },
      env
    );
    expect(patch.status).toBe(422);
  });

  it("rejects unknown block types (422)", async () => {
    const res = await app().request(
      "/admin/email-templates",
      {
        method: "POST",
        headers: headers(token),
        body: JSON.stringify({ use_case: "reminder", name: "R", subject: "S", body: "B", body_blocks: [{ type: "iframe", src: "x" }] }),
      },
      env
    );
    expect(res.status).toBe(422);
  });

  it("PATCH body_blocks re-renders body_html; PATCH body_blocks:null clears both", async () => {
    const create = await app().request(
      "/admin/email-templates",
      { method: "POST", headers: headers(token), body: JSON.stringify({ use_case: "reminder", name: "R", subject: "S", body: "B", body_blocks: SAMPLE_BLOCKS }) },
      env
    );
    const { id } = await create.json<{ id: string }>();

    const newBlocks = [{ type: "text", text: "Rewritten." }];
    const patch = await app().request(
      `/admin/email-templates/${id}`,
      { method: "PATCH", headers: headers(token), body: JSON.stringify({ body_blocks: newBlocks }) },
      env
    );
    expect(patch.status).toBe(200);
    let row = await env.DB.prepare(`SELECT body_blocks, body_html FROM email_templates WHERE id = ?`)
      .bind(id)
      .first<{ body_blocks: string | null; body_html: string | null }>();
    expect(row!.body_html).toBe(renderBlocksToHtml(newBlocks));

    const clear = await app().request(
      `/admin/email-templates/${id}`,
      { method: "PATCH", headers: headers(token), body: JSON.stringify({ body_blocks: null }) },
      env
    );
    expect(clear.status).toBe(200);
    row = await env.DB.prepare(`SELECT body_blocks, body_html FROM email_templates WHERE id = ?`)
      .bind(id)
      .first<{ body_blocks: string | null; body_html: string | null }>();
    expect(row).toEqual({ body_blocks: null, body_html: null });
  });

  it("GET list includes body_blocks and body_html", async () => {
    await app().request(
      "/admin/email-templates",
      { method: "POST", headers: headers(token), body: JSON.stringify({ use_case: "reminder", name: "R", subject: "S", body: "B", body_blocks: SAMPLE_BLOCKS }) },
      env
    );
    const list = await app().request("/admin/email-templates", { headers: headers(token) }, env);
    const { templates } = await list.json<{ templates: Record<string, unknown>[] }>();
    const t = templates.find((t) => t.name === "R")!;
    expect(t.body_blocks).toBeTruthy();
    expect(String(t.body_html)).toContain('width="600"');
  });
});

describe("renderTemplate + send() with an HTML template", () => {
  async function seedHtmlTemplate(useCase = "reminder"): Promise<string> {
    const id = crypto.randomUUID();
    const html = renderBlocksToHtml(SAMPLE_BLOCKS);
    await env.DB.prepare(
      `INSERT INTO email_templates (id, use_case, name, subject, body, variables, status, body_blocks, body_html, created_at, updated_at)
       VALUES (?, ?, 'R', 'Hi {{ name }}', 'Hi {{ name }}, see you on {{ date }}.', '["name","date"]', 'active', ?, ?, '2026-07-27T00:00:00Z', '2026-07-27T00:00:00Z')`
    )
      .bind(id, useCase, JSON.stringify(SAMPLE_BLOCKS), html)
      .run();
    return id;
  }

  it("renderTemplate substitutes merge fields into BOTH bodies (escaped in HTML)", async () => {
    await seedHtmlTemplate();
    const rendered = await renderTemplate(env.DB, "reminder", { name: `Ada <&>`, date: "2026-08-01", booking_ref: "R1" });
    expect(rendered!.textBody).toBe("Hi Ada <&>, see you on 2026-08-01.");
    expect(rendered!.htmlBody).toContain("Hi Ada &lt;&amp;&gt;, see you on 2026-08-01.");
    expect(rendered!.htmlBody).toContain("https://friendsonbikes.uk/b/R1");
  });

  it("send() dispatches multipart/alternative when the template has an HTML body", async () => {
    await seedHtmlTemplate();
    let raw = "";
    env.EMAIL = { send: async (m: { raw: string }) => { raw = m.raw; } } as unknown as SendEmail;
    const result = await send(createDb(env.DB), env, {
      messageType: "transactional",
      recipient: "tom@example.com",
      event: "reminder:bk1",
      idempotencyKey: `reminder:${crypto.randomUUID()}`,
      subject: "plain",
      textBody: "plain",
      template: { useCase: "reminder", vars: { name: "Tom", date: "2026-08-01", booking_ref: "R2" } },
    });
    expect(result.status).toBe("sent");
    expect(raw).toContain("multipart/alternative");
    expect(raw).toContain("Content-Type: text/html");
  });

  it("send() of a text-only template stays single-part text/plain", async () => {
    let raw = "";
    env.EMAIL = { send: async (m: { raw: string }) => { raw = m.raw; } } as unknown as SendEmail;
    await send(createDb(env.DB), env, {
      messageType: "transactional",
      recipient: "tom@example.com",
      event: "x",
      idempotencyKey: `x:${crypto.randomUUID()}`,
      subject: "plain",
      textBody: "plain",
    });
    expect(raw).toContain('Content-Type: text/plain; charset="utf-8"');
    expect(raw).not.toContain("multipart");
  });

  it("test-send of a draft HTML template delivers the real multipart message", async () => {
    const id = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO email_templates (id, use_case, name, subject, body, variables, status, body_blocks, body_html, created_at, updated_at)
       VALUES (?, 'booking_confirmed_paid', 'Draft', 'Hi {{ name }}', 'Hi {{ name }}.', '["name"]', 'draft', ?, ?, '2026-07-27T00:00:00Z', '2026-07-27T00:00:00Z')`
    )
      .bind(id, JSON.stringify(SAMPLE_BLOCKS), renderBlocksToHtml(SAMPLE_BLOCKS))
      .run();
    let raw = "";
    env.EMAIL = { send: async (m: { raw: string }) => { raw = m.raw; } } as unknown as SendEmail;
    const res = await app().request(
      `/admin/email-templates/${id}/test-send`,
      { method: "POST", headers: headers(token), body: JSON.stringify({}) },
      env
    );
    expect(res.status).toBe(200);
    expect((await res.json<{ status: string }>()).status).toBe("sent");
    expect(raw).toContain("multipart/alternative");
    // Sample merge data filled the HTML body (name = Alex Rivers).
    expect(raw.replace(/=\r\n/g, "")).toContain("Hi Alex Rivers");
  });
});
