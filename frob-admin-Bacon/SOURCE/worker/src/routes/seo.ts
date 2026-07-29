// FOB core-seo — routes.
//
// api-contracts.md#seo:
//   POST /publish -> SEO03 (manual, operator-triggered only — TDR-14)
// Static HTML generation (SEO01) and sitemap/index generation (SEO02) are
// realized inside publishTours() and served back out here for crawlers.

import { Hono } from "hono";
import { z } from "zod";
import type { Env } from "../env";
import { publishTours, type TourContent } from "../modules/seo/publish";
import { requireOwnerSession } from "../modules/auth/middleware";

export const seoRoutes = new Hono<{ Bindings: Env }>();

const tourSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  urlPath: z.string().min(1),
  locale: z.string().min(1),
  schemaOrgType: z.enum(["TouristAttraction", "LocalBusiness", "Product"]),
  image: z.string().optional(),
});

const publishSchema = z.object({
  tours: z.array(tourSchema).min(1),
});

// POST /publish — satisfies SEO03. Owner/secondary-operator triggered only.
seoRoutes.post("/publish", requireOwnerSession, async (c) => {
  const parsed = publishSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: "invalid publish payload" }, 400);
  }

  const siteOrigin = c.env.ALLOWED_ORIGIN ?? "https://friendsonbikes.uk";
  const result = await publishTours(c.env.ASSETS, parsed.data.tours as TourContent[], siteOrigin);

  return c.json(
    {
      publishedCount: result.publishedCount,
      flaggedIncomplete: result.flaggedIncomplete,
      sitemapUrls: result.sitemapUrls,
    },
    200
  );
});

// GET /sitemap.xml — serves the last manual publish's index (SEO02).
seoRoutes.get("/sitemap.xml", async (c) => {
  const object = await c.env.ASSETS.get("sitemap.xml");
  if (!object) return c.text("", 404);
  return c.body(await object.text(), 200, { "Content-Type": "application/xml" });
});

// GET /robots.txt — points crawlers at the sitemap (SEO02).
seoRoutes.get("/robots.txt", async (c) => {
  const object = await c.env.ASSETS.get("robots.txt");
  if (!object) return c.text("User-agent: *\nAllow: /\n", 200);
  return c.body(await object.text(), 200, { "Content-Type": "text/plain" });
});

// GET /tours/:locale/:id — crawler-readable tour content (SEO01).
seoRoutes.get("/tours/:locale/:id", async (c) => {
  const { locale, id } = c.req.param();
  const object = await c.env.ASSETS.get(`tours/${locale}/${id}.html`);
  if (!object) return c.text("Not found", 404);
  return c.body(await object.text(), 200, { "Content-Type": "text/html; charset=utf-8" });
});
