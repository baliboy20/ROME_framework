import { describe, expect, it } from "vitest";
import { Hono } from "hono";
import { seoRoutes } from "../src/routes/seo";
import { publishTours, type TourContent } from "../src/modules/seo/publish";
import type { Env } from "../src/env";
import { createTestEnv } from "./testEnv";
import { signJwt } from "../src/modules/auth/jwt";
import { putSession } from "../src/kv/session";

function app() {
  const hono = new Hono<{ Bindings: Env }>();
  hono.route("/", seoRoutes);
  return hono;
}

async function ownerToken(env: Env): Promise<string> {
  const token = await signJwt(env.JWT_SECRET, { actorId: "william", actorType: "owner" });
  await putSession(env.SESSIONS, { token, actor_type: "owner", actor_id: "william" });
  return token;
}

const validTour: TourContent = {
  id: "thames-loop",
  name: "Thames Loop",
  description: "A scenic loop along the Thames.",
  urlPath: "/tours/thames-loop",
  locale: "en-GB",
  schemaOrgType: "TouristAttraction",
};

describe("REQ-SEO01 — crawler-readable tour content", () => {
  it("publishes complete tours as script-free HTML with JSON-LD descriptors", async () => {
    const env = await createTestEnv();
    const result = await publishTours(env.ASSETS, [validTour], "https://friendsonbikes.uk");
    expect(result.publishedCount).toBe(1);
    expect(result.flaggedIncomplete).toEqual([]);

    const object = await env.ASSETS.get("tours/en-GB/thames-loop.html");
    const html = await object!.text();
    expect(html).toContain("application/ld+json");
    expect(html).toContain("Thames Loop");
  });

  it("flags a tour missing its description rather than failing the batch", async () => {
    const env = await createTestEnv();
    const incomplete = { ...validTour, id: "bad-tour", description: "" };
    const result = await publishTours(env.ASSETS, [validTour, incomplete], "https://friendsonbikes.uk");
    expect(result.publishedCount).toBe(1);
    expect(result.flaggedIncomplete).toEqual(["bad-tour"]);
  });
});

describe("REQ-SEO02 — crawlable index (sitemap)", () => {
  it("lists exactly the tours that published successfully in this run", async () => {
    const env = await createTestEnv();
    const good = validTour;
    const bad = { ...validTour, id: "bad-tour", name: "" };
    const result = await publishTours(env.ASSETS, [good, bad], "https://friendsonbikes.uk");
    expect(result.sitemapUrls).toEqual(["/tours/thames-loop"]);

    const sitemap = await (await env.ASSETS.get("sitemap.xml"))!.text();
    expect(sitemap).toContain("/tours/thames-loop");
    expect(sitemap).not.toContain("bad-tour");
  });
});

describe("REQ-SEO03 — publication only on manual, operator-triggered publish", () => {
  it("POST /publish requires an owner session", async () => {
    const env = await createTestEnv();
    const res = await app().request(
      "/publish",
      {
        method: "POST",
        body: JSON.stringify({ tours: [validTour] }),
        headers: { "Content-Type": "application/json" },
      },
      env
    );
    expect(res.status).toBe(401);
  });

  it("regenerates published output for an authenticated owner", async () => {
    const env = await createTestEnv();
    const token = await ownerToken(env);
    const res = await app().request(
      "/publish",
      {
        method: "POST",
        body: JSON.stringify({ tours: [validTour] }),
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      },
      env
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { publishedCount: number };
    expect(body.publishedCount).toBe(1);

    const sitemapRes = await app().request("/sitemap.xml", {}, env);
    expect(sitemapRes.status).toBe(200);
    const sitemapText = await sitemapRes.text();
    expect(sitemapText).toContain("thames-loop");
  });
});
