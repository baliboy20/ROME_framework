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
