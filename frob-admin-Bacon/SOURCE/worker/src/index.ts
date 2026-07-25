// FOB api-worker — entry point.
// Mounts every module's Hono sub-app onto one Worker and wires the Cron
// scheduled() handler to the cron dispatcher. satisfies: TDR-01 (Workers),
// architecture.md §2 (single api-worker bundle co-locating core-data-access
// and cron-workers).
import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "./env";

import { authRoutes } from "./routes/auth";
import { consentRoutes } from "./routes/consent";
import { notificationsRoutes } from "./routes/notifications";
import { seoRoutes } from "./routes/seo";
import { bookingRoutes } from "./routes/booking";
import { presalesRoutes } from "./routes/presales";
import { paymentRoutes } from "./routes/payments";
import { tourops } from "./routes/tourops";
import { pretour } from "./routes/pretour";
import { fleet } from "./routes/fleet";
import { posttour } from "./routes/posttour";
import { backoffice } from "./routes/backoffice";
import { adminLists } from "./routes/admin-lists";
import { handleScheduled } from "./cron/handlers";

const app = new Hono<{ Bindings: Env }>();

// CORS — origins are environment-scoped (ALLOWED_ORIGIN). In local dev the four
// apps run on different localhost ports, so any localhost origin is reflected;
// ALLOWED_ORIGIN itself stays a valid absolute URL (used as the Stripe checkout
// return-URL base — a wildcard there breaks session creation). The Stripe
// webhook route validates its own signature and is exempt from origin trust.
app.use("*", async (c, next) => {
  const configured = c.env.ALLOWED_ORIGIN || "*";
  const reqOrigin = c.req.header("Origin");
  const origin =
    reqOrigin && /^http:\/\/localhost:\d+$/.test(reqOrigin) ? reqOrigin : configured;
  return cors({ origin, credentials: origin !== "*" })(c, next);
});

app.get("/health", (c) => c.json({ ok: true, service: "fob-api-worker" }));

// All module sub-apps mount at root; each declares absolute domain paths
// (/auth/*, /consent, /bookings, /admin/*, /guide/*, /webhooks/stripe, …).
app.route("/", authRoutes);
app.route("/", consentRoutes);
app.route("/", notificationsRoutes);
// FINDING-002: presales/booking must mount BEFORE seo — seo's greedy
// `/tours/:locale/:id` otherwise shadows `/tours/:id/availability` (matching
// "availability" as a tour id) and 404s the availability lookup.
app.route("/", bookingRoutes);
app.route("/", presalesRoutes);
app.route("/", seoRoutes);
app.route("/", paymentRoutes);
app.route("/", tourops);
app.route("/", pretour);
app.route("/", fleet);
app.route("/", posttour);
app.route("/", backoffice);
app.route("/", adminLists);

app.notFound((c) => c.json({ error: "not_found" }, 404));

export default {
  fetch: app.fetch,
  // Cron Triggers — satisfies: TDR-01 (Cron), cron-workers component.
  async scheduled(event: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(handleScheduled(event, env, ctx));
  },
};
