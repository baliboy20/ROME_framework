// FR-001 workstream 5 — importing a complete HTML email document.
//
// The cases here are the three real defects found in the sponsor's reference
// file (book-conf.html), reproduced in miniature. Each one is silent: nothing
// in the document is malformed, so without these checks a broken email ships
// and nobody knows until a customer says so.
import { describe, expect, it } from "vitest";
import { processImportedHtml, mergeFieldsIn, GMAIL_CLIP_BYTES } from "../src/modules/notifications/html-import";
import { createTestEnv } from "./testEnv";

// A 1x1 PNG, small enough to keep the fixtures readable.
const PNG =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const dataUri = (mime: string, b64: string) => `data:image/${mime};base64,${b64}`;

const baseOpts = {
  templateId: "tmpl_1",
  assetBaseUrl: "https://api.test",
  suppliedFields: ["name", "tour", "date"],
};

describe("imported HTML — images", () => {
  it("moves an inline image to storage and rewrites the reference", async () => {
    const env = await createTestEnv();
    const html = `<img src="${dataUri("png", PNG)}">`;
    const { html: out, report } = await processImportedHtml(env, html, baseOpts);

    expect(report.imagesHosted).toBe(1);
    expect(out).not.toContain("data:image");
    expect(out).toContain("https://api.test/email-assets/tmpl_1/0-email.png");
  });

  // The bulletproof-background pattern: one image referenced three times, from
  // a `background=` attribute, a CSS `background-image`, and an Outlook VML
  // fill. Each serves a different mail client, so all three references must
  // survive — only the storage is shared. Deduplicating the REFERENCES would
  // break the background for whichever client lost its copy.
  it("stores a repeated image once but keeps every reference", async () => {
    const env = await createTestEnv();
    const uri = dataUri("png", PNG);
    const html = `<td background="${uri}" style="background-image:url('${uri}')">
        <v:fill src="${uri}" />
      </td>`;
    const { html: out, report } = await processImportedHtml(env, html, baseOpts);

    expect(report.imagesHosted).toBe(1); // uploaded once
    const url = "https://api.test/email-assets/tmpl_1/0-email.png";
    expect(out.split(url).length - 1).toBe(3); // referenced three times
    expect(out).not.toContain("data:image");
  });

  it("warns about WebP, which classic Outlook cannot display", async () => {
    const env = await createTestEnv();
    const { report } = await processImportedHtml(env, `<img src="${dataUri("webp", PNG)}">`, baseOpts);
    expect(report.notes.join(" ")).toMatch(/WebP/i);
  });

  it("leaves a document with no images untouched", async () => {
    const env = await createTestEnv();
    const html = "<p>Hi {{name}}</p>";
    const { html: out, report } = await processImportedHtml(env, html, baseOpts);
    expect(out).toBe(html);
    expect(report.imagesHosted).toBe(0);
  });
});

describe("imported HTML — merge fields", () => {
  // The defect that matters most: an unknown field resolves to an empty string
  // at send time, so the customer gets a blank gap where the support phone
  // number should be, and nothing anywhere reports a problem.
  it("reports fields the system does not supply", async () => {
    const env = await createTestEnv();
    const html = "<p>Hi {{name}}, your {{tour}}. Call {{support_phone}} or see {{map_link}}.</p>";
    const { report } = await processImportedHtml(env, html, baseOpts);

    expect(report.unknownFields).toEqual(["map_link", "support_phone"]);
    expect(report.knownFields).toEqual(["name", "tour"]);
  });

  it("accepts a document whose fields are all supplied", async () => {
    const env = await createTestEnv();
    const { report } = await processImportedHtml(env, "<p>{{name}} {{tour}} {{date}}</p>", baseOpts);
    expect(report.unknownFields).toEqual([]);
  });

  it("reads the same merge syntax the send path uses", () => {
    // Spacing inside the braces is tolerated by the send-time substitution, so
    // it must be tolerated here too — otherwise import would pass a field that
    // later renders, or vice versa.
    expect(mergeFieldsIn("{{ name }} {{tour}}")).toEqual(["name", "tour"]);
  });
});

describe("imported HTML — size", () => {
  it("warns when the result would still be clipped by Gmail", async () => {
    const env = await createTestEnv();
    const big = `<p>${"x".repeat(GMAIL_CLIP_BYTES + 1000)}</p>`;
    const { report } = await processImportedHtml(env, big, baseOpts);
    expect(report.notes.join(" ")).toMatch(/Gmail/);
  });

  it("does not warn about a normal-sized document", async () => {
    const env = await createTestEnv();
    const { report } = await processImportedHtml(env, "<p>Hi {{name}}</p>", baseOpts);
    expect(report.notes.join(" ")).not.toMatch(/Gmail/);
  });

  // The headline result: hosting the images is what takes the sponsor's file
  // from 707KB to about 14KB. Reproduced in miniature — a document that is
  // mostly image data shrinks dramatically once the image is moved out.
  it("shrinks a document that is mostly image data", async () => {
    const env = await createTestEnv();
    // A large VALID base64 payload — length divisible by 4, so it decodes.
    const fat = "A".repeat(40_000);
    const html = `<p>Hi {{name}}</p><img src="${dataUri("png", fat)}">`;
    const { report } = await processImportedHtml(env, html, baseOpts);
    expect(report.imagesHosted).toBe(1);
    expect(report.processedBytes).toBeLessThan(report.originalBytes / 10);
  });

  // Found while writing the test above: a malformed data URI made `atob` throw.
  // The right behaviour is to leave that image embedded and say so, rather than
  // fail the whole import — one bad image should not cost the Owner the
  // document they just pasted.
  it("keeps a malformed image inline and reports it, rather than failing", async () => {
    const env = await createTestEnv();
    // 5 characters — base64 length can never be 1 more than a multiple of 4,
    // so `atob` rejects this outright.
    const broken = dataUri("png", "AAAAA");
    const { html: out, report } = await processImportedHtml(env, `<img src="${broken}">`, baseOpts);
    expect(report.imagesHosted).toBe(0);
    expect(out).toContain("data:image"); // left as it was
    expect(report.notes.join(" ")).toMatch(/could not be uploaded/i);
  });

  it("flags a <style> block, which some clients strip", async () => {
    const env = await createTestEnv();
    const { report } = await processImportedHtml(env, "<style>p{color:red}</style><p>x</p>", baseOpts);
    expect(report.notes.join(" ")).toMatch(/<style>/);
  });
});

// ---------------------------------------------------------------------------
// Saving after an import must not destroy the imported document.
//
// The original defect: the editor sent `body_blocks: null` (because it read a
// stale pre-import record), and PATCH treated that as "clear both columns".
// One keystroke destroyed the document and left the row claiming to be raw HTML
// with none. Guarded on the server too, so a client that has not been updated —
// or any other caller — cannot reproduce it.
// ---------------------------------------------------------------------------
import worker from "../src/index";
import { signJwt } from "../src/modules/auth/jwt";
import { putSession } from "../src/kv/session";

const ctx = { waitUntil() {}, passThroughOnException() {} } as unknown as ExecutionContext;

async function operatorToken(env: Awaited<ReturnType<typeof createTestEnv>>) {
  const token = await signJwt(env.JWT_SECRET, { actorId: "owner@x", actorType: "owner" });
  await putSession(env.SESSIONS, { token, actor_type: "owner", actor_id: "owner@x" });
  return token;
}

describe("saving a raw template does not destroy the imported document", () => {
  it("ignores a body_blocks:null clear when the row is raw", async () => {
    const env = await createTestEnv();
    const token = await operatorToken(env);
    const now = new Date().toISOString();

    await env.DB.prepare(
      `INSERT INTO email_templates (id, use_case, name, subject, body, variables, status,
                                    body_blocks, body_html, body_source, created_at, updated_at)
       VALUES ('t1','booking_confirmed_paid','n','s','b','[]','draft', NULL,
               '<h1>imported</h1>','raw', ?, ?)`
    ).bind(now, now).run();

    // Exactly what the old editor sent: an ordinary field edit that also
    // carried a null blocks clear.
    const res = await worker.fetch(
      new Request("https://api.test/admin/email-templates/t1", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ subject: "edited", body_blocks: null }),
      }),
      env,
      ctx
    );
    expect(res.status).toBe(200);

    const row = await env.DB.prepare(`SELECT * FROM email_templates WHERE id = 't1'`)
      .first<{ subject: string; body_html: string | null; body_source: string }>();
    expect(row?.subject).toBe("edited");        // the real edit landed
    expect(row?.body_html).toBe("<h1>imported</h1>"); // the document survived
    expect(row?.body_source).toBe("raw");
  });

  it("switches a raw template back to blocks when real blocks are supplied", async () => {
    const env = await createTestEnv();
    const token = await operatorToken(env);
    const now = new Date().toISOString();
    await env.DB.prepare(
      `INSERT INTO email_templates (id, use_case, name, subject, body, variables, status,
                                    body_blocks, body_html, body_source, created_at, updated_at)
       VALUES ('t2','booking_confirmed_paid','n','s','b','[]','draft', NULL,
               '<h1>imported</h1>','raw', ?, ?)`
    ).bind(now, now).run();

    const res = await worker.fetch(
      new Request("https://api.test/admin/email-templates/t2", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ body_blocks: [{ type: "text", text: "hello" }] }),
      }),
      env,
      ctx
    );
    expect(res.status).toBe(200);

    const row = await env.DB.prepare(`SELECT * FROM email_templates WHERE id = 't2'`)
      .first<{ body_source: string; body_html: string | null }>();
    // Deliberately switching back is allowed — the row must not keep claiming
    // 'raw' while holding rendered block HTML.
    expect(row?.body_source).toBe("blocks");
    expect(row?.body_html).toContain("hello");
  });
});

// ---------------------------------------------------------------------------
// The Owner's chosen template must be the one that is sent.
//
// `renderTemplate` selects by use_case + status='active', which is correct for
// the AUTOMATIC path — a process asks for "the current template for this
// outcome". The booking send route validated the Owner's choice by id and then
// rendered by use_case, so a different row could go out than the one picked.
// ---------------------------------------------------------------------------
import { renderTemplate, renderTemplateById } from "../src/modules/notifications/templates";

describe("rendering the chosen template", () => {
  // Migration 0005 already seeds an ACTIVE template for booking_confirmed_paid,
  // and a partial unique index allows only one active row per use_case. So the
  // fixture replaces that seeded row with a known one, then adds a draft
  // alongside it — which is exactly the real situation: the Owner picks a
  // template that is NOT the currently active one.
  async function seedTwo(env: Awaited<ReturnType<typeof createTestEnv>>) {
    const now = new Date().toISOString();
    await env.DB.prepare(
      `DELETE FROM email_templates WHERE use_case = 'booking_confirmed_paid'`
    ).run();
    await env.DB.prepare(
      `INSERT INTO email_templates (id, use_case, name, subject, body, variables, status,
                                    body_blocks, body_html, created_at, updated_at)
       VALUES ('active-one','booking_confirmed_paid','A','ACTIVE SUBJECT','active body','[]','active',
               NULL, NULL, ?, ?)`
    ).bind(now, now).run();
    await env.DB.prepare(
      `INSERT INTO email_templates (id, use_case, name, subject, body, variables, status,
                                    body_blocks, body_html, created_at, updated_at)
       VALUES ('chosen-one','booking_confirmed_paid','B','CHOSEN SUBJECT','chosen body','[]','draft',
               NULL, NULL, ?, ?)`
    ).bind(now, now).run();
  }

  it("renders the row asked for by id, not whichever is active", async () => {
    const env = await createTestEnv();
    await seedTwo(env);
    const rendered = await renderTemplateById(env.DB, "chosen-one", {});
    expect(rendered?.templateId).toBe("chosen-one");
    expect(rendered?.subject).toBe("CHOSEN SUBJECT");
  });

  it("the automatic path is unchanged — still resolves by use_case to the active row", async () => {
    const env = await createTestEnv();
    await seedTwo(env);
    const rendered = await renderTemplate(env.DB, "booking_confirmed_paid", {});
    expect(rendered?.templateId).toBe("active-one");
  });

  it("returns null for an unknown id rather than falling back to something else", async () => {
    const env = await createTestEnv();
    await seedTwo(env);
    expect(await renderTemplateById(env.DB, "no-such-template", {})).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Documents that cannot render in email at all.
//
// The sponsor imported a self-extracting bundle — valid HTML, 99% JavaScript,
// with the real email held inside as a string. It was accepted silently and
// reported no problems, because nothing was malformed. A recipient would have
// seen its "Unpacking…" loading screen.
// ---------------------------------------------------------------------------
describe("imported HTML — documents that cannot render", () => {
  it("flags a document containing a script", async () => {
    const env = await createTestEnv();
    const html = "<p>Hi {{name}}</p><script>document.write('x')</script>";
    const { report } = await processImportedHtml(env, html, baseOpts);
    expect(report.notes.join(" ")).toMatch(/BLOCKING.*<script>/);
  });

  it("flags a noscript fallback — the document expects to run", async () => {
    const env = await createTestEnv();
    const html = "<noscript>enable javascript</noscript><p>{{name}}</p>";
    const { report } = await processImportedHtml(env, html, baseOpts);
    expect(report.notes.join(" ")).toMatch(/BLOCKING.*<noscript>/);
  });

  it("flags a document that is mostly JavaScript by weight", async () => {
    const env = await createTestEnv();
    const html = `<p>Hi</p><script>${"var x=1;".repeat(4000)}</script>`;
    const { report } = await processImportedHtml(env, html, baseOpts);
    expect(report.notes.join(" ")).toMatch(/% of this document is/);
  });

  // A tracking pixel snippet is not the same problem as a document that IS a
  // program — the weight check must not fire on ordinary content.
  it("does not raise the weight warning for a normal document", async () => {
    const env = await createTestEnv();
    const html = `<p>${"Real email content. ".repeat(200)}</p>`;
    const { report } = await processImportedHtml(env, html, baseOpts);
    expect(report.notes.join(" ")).not.toMatch(/% of this document is/);
  });
});
