// FR-001 workstream 5 — process an imported HTML email document.
//
// The sponsor's reference file (book-conf.html) is why this module exists. It
// is a competent email template that would nonetheless have failed in three
// ways if stored verbatim, all of them mechanically detectable:
//
//   1. 707KB, of which 98% is base64 image data — roughly 7x Gmail's ~102KB
//      clipping threshold. Gmail truncates and hides the rest, and the
//      unsubscribe link sits at the very bottom, so it is exactly what gets
//      cut. A compliance exposure, not a cosmetic one.
//   2. Those images are `data:` URIs, which Gmail and Outlook do not render at
//      all. They would show as broken for most recipients.
//   3. Seven of its fourteen merge fields are not supplied by this system.
//      Unknown fields resolve to the EMPTY STRING at send time, so they fail
//      SILENTLY — the customer receives blank gaps where the meeting-point map
//      link and support phone number should be.
//
// Hosting the images fixes 1 and 2 together and is the only thing that can fix
// 1 at all: the duplication is load-bearing (see below), so inline images
// cannot be shrunk. Reporting unknown fields fixes 3, which is the one a human
// would otherwise never notice until a customer complained.

import type { Env } from "../../env";

/** A data: URI image found in the document. */
interface InlineImage {
  dataUri: string;
  mime: string;
  base64: string;
}

export interface ImportReport {
  originalBytes: number;
  processedBytes: number;
  imagesHosted: number;
  /** Merge fields present in the document that this system does not supply. */
  unknownFields: string[];
  /** Merge fields present and supplied — reported so the Owner sees coverage. */
  knownFields: string[];
  notes: string[];
}

export interface ImportResult {
  html: string;
  report: ImportReport;
}

const MERGE_FIELD = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
const DATA_URI = /data:image\/([a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)/g;

/** Gmail clips messages above roughly this size. */
export const GMAIL_CLIP_BYTES = 102_000;

function decodeBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

/**
 * WebP is a real risk in email: classic Outlook desktop renders through the
 * Word engine, which cannot decode it. Rather than silently re-encode (which
 * would need an image codec the Workers runtime does not provide), the format
 * is preserved and the risk is REPORTED. Saying "this may not display in
 * Outlook" is honest; claiming a conversion that did not happen would not be.
 */
function extensionFor(mime: string): string {
  const m = mime.toLowerCase();
  if (m === "jpeg" || m === "jpg") return "jpg";
  if (m === "png") return "png";
  if (m === "gif") return "gif";
  if (m === "webp") return "webp";
  if (m === "svg+xml") return "svg";
  return "bin";
}

function findInlineImages(html: string): InlineImage[] {
  const seen = new Map<string, InlineImage>();
  for (const m of html.matchAll(DATA_URI)) {
    const [dataUri, mime, base64] = m;
    // Deduplicate by content. The same image is routinely embedded several
    // times — the "bulletproof background" pattern references one image from a
    // `background=` attribute, a `background-image:url()` style and an Outlook
    // VML `<v:fill>`, because each serves a different client. Those references
    // are NOT redundant and must all survive; only the STORAGE is shared.
    if (!seen.has(base64)) seen.set(base64, { dataUri, mime, base64 });
  }
  return [...seen.values()];
}

/**
 * Extract inline images to R2 and rewrite every reference to an absolute URL.
 *
 * `assetBaseUrl` must be publicly reachable — mail clients fetch images from
 * the recipient's device with no session, so anything behind auth will simply
 * not load.
 */
export async function processImportedHtml(
  env: Env,
  html: string,
  opts: { templateId: string; assetBaseUrl: string; suppliedFields: string[] }
): Promise<ImportResult> {
  const originalBytes = new TextEncoder().encode(html).length;
  const notes: string[] = [];

  // ---- images -------------------------------------------------------------
  const images = findInlineImages(html);
  let processed = html;
  let hosted = 0;

  for (const [index, img] of images.entries()) {
    const ext = extensionFor(img.mime);
    // Filenames carry an `-email` marker so an asset's purpose is obvious from
    // its name alone — in the bucket, in a CDN log, or in the URL a recipient
    // can see in a mail client. Assets from other sources are never mistaken
    // for template imagery, and vice versa.
    const key = `email-assets/${opts.templateId}/${index}-email.${ext}`;
    try {
      await env.ASSETS.put(key, decodeBase64(img.base64), {
        httpMetadata: { contentType: `image/${img.mime}` },
      });
    } catch {
      notes.push(
        "One or more images could not be uploaded; they remain embedded and may not display."
      );
      continue;
    }
    const url = `${opts.assetBaseUrl.replace(/\/$/, "")}/${key}`;
    // Replace ALL occurrences — one image may be referenced several times.
    processed = processed.split(img.dataUri).join(url);
    hosted++;

    if (ext === "webp") {
      notes.push(
        "An image is in WebP format, which classic Outlook desktop cannot display. " +
          "Consider replacing it with JPEG or PNG."
      );
    }
  }

  // ---- merge fields -------------------------------------------------------
  const used = new Set<string>();
  for (const m of processed.matchAll(MERGE_FIELD)) used.add(m[1]);
  const supplied = new Set(opts.suppliedFields);
  const unknownFields = [...used].filter((f) => !supplied.has(f)).sort();
  const knownFields = [...used].filter((f) => supplied.has(f)).sort();

  // ---- size ---------------------------------------------------------------
  const processedBytes = new TextEncoder().encode(processed).length;
  if (processedBytes > GMAIL_CLIP_BYTES) {
    notes.push(
      `Still ${Math.round(processedBytes / 1024)}KB after hosting images — above Gmail's ` +
        `~${Math.round(GMAIL_CLIP_BYTES / 1024)}KB limit, so Gmail will cut the message short. ` +
        `Anything at the bottom, including an unsubscribe link, may be hidden.`
    );
  }
  if (/<style[\s>]/i.test(processed)) {
    notes.push(
      "The document uses a <style> block. Some clients strip these — inline styles are safer."
    );
  }

  return {
    html: processed,
    report: { originalBytes, processedBytes, imagesHosted: hosted, unknownFields, knownFields, notes },
  };
}

/** Merge fields found in a document, without processing it. */
export function mergeFieldsIn(html: string): string[] {
  const out = new Set<string>();
  for (const m of html.matchAll(MERGE_FIELD)) out.add(m[1]);
  return [...out].sort();
}
