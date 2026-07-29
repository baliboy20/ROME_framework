// FOB core-seo — publish logic.
//
// satisfies: REQ-SEO01 (crawler-readable tour content + machine-readable
// descriptors), REQ-SEO02 (crawlable index of every published location),
// REQ-SEO03 (regeneration only on operator-triggered manual publish —
// TDR-14). Static HTML + JSON-LD + sitemap.xml are written to the `ASSETS`
// R2 bucket; nothing regenerates outside of `publishTours()`.

import type { SchemaOrgType } from "../../types";

export interface TourContent {
  id: string;
  name: string;
  description: string;
  urlPath: string; // e.g. "/tours/thames-loop"
  locale: string; // e.g. "en-GB"
  schemaOrgType: SchemaOrgType;
  image?: string;
}

export interface PublishResult {
  publishedCount: number;
  flaggedIncomplete: string[];
  sitemapUrls: string[];
}

function jsonLd(tour: TourContent, siteOrigin: string): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": tour.schemaOrgType,
    name: tour.name,
    description: tour.description,
    url: `${siteOrigin}${tour.urlPath}`,
    ...(tour.image ? { image: tour.image } : {}),
  };
}

function renderTourHtml(tour: TourContent, siteOrigin: string): string {
  const ld = JSON.stringify(jsonLd(tour, siteOrigin));
  // Server-rendered, script-free — a crawler reads this without executing
  // JS (REQ-SEO01: "without executing scripts").
  return `<!doctype html>
<html lang="${tour.locale}">
<head>
<meta charset="utf-8">
<title>${escapeHtml(tour.name)}</title>
<meta name="description" content="${escapeHtml(tour.description)}">
<script type="application/ld+json">${ld}</script>
</head>
<body>
<h1>${escapeHtml(tour.name)}</h1>
<p>${escapeHtml(tour.description)}</p>
</body>
</html>`;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderSitemap(urls: string[], siteOrigin: string): string {
  const entries = urls.map((path) => `  <url><loc>${siteOrigin}${path}</loc></url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`;
}

function renderRobots(siteOrigin: string): string {
  return `User-agent: *\nAllow: /\nSitemap: ${siteOrigin}/sitemap.xml\n`;
}

/**
 * Regenerate crawlable output for the given tours (satisfies SEO01 + SEO03).
 * A tour missing title or description is flagged (not published) rather
 * than failing the whole batch. The sitemap (SEO02) is regenerated to list
 * exactly the tours that *did* publish successfully in this run.
 */
export async function publishTours(
  bucket: R2Bucket,
  tours: TourContent[],
  siteOrigin: string
): Promise<PublishResult> {
  const flaggedIncomplete: string[] = [];
  const published: TourContent[] = [];

  for (const tour of tours) {
    if (!tour.name?.trim() || !tour.description?.trim()) {
      flaggedIncomplete.push(tour.id);
      continue;
    }
    published.push(tour);
    await bucket.put(`tours/${tour.locale}/${tour.id}.html`, renderTourHtml(tour, siteOrigin), {
      httpMetadata: { contentType: "text/html; charset=utf-8" },
    });
  }

  const sitemapUrls = published.map((t) => t.urlPath);
  await bucket.put("sitemap.xml", renderSitemap(sitemapUrls, siteOrigin), {
    httpMetadata: { contentType: "application/xml" },
  });
  await bucket.put("robots.txt", renderRobots(siteOrigin), {
    httpMetadata: { contentType: "text/plain" },
  });

  return { publishedCount: published.length, flaggedIncomplete, sitemapUrls };
}
