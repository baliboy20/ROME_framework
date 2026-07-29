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
import { toursAdmin } from "./routes/tours-admin";
import { emailRoutes } from "./routes/email";
import { handleScheduled } from "./cron/handlers";
import { handleInboundEmail } from "./email/handler";
import { requireOperatorSession, requireCustomerSession } from "./lib/auth";
import { requireNoticeOwner } from "./lib/notice-auth";

const app = new Hono<{ Bindings: Env }>();

// CORS — origins are environment-scoped (ALLOWED_ORIGIN). In local dev the four
// apps run on different localhost ports, so any localhost origin is reflected;
// ALLOWED_ORIGIN itself stays a valid absolute URL (used as the Stripe checkout
// return-URL base — a wildcard there breaks session creation). The Stripe
// webhook route validates its own signature and is exempt from origin trust.
app.use("*", async (c, next) => {
  const configured = c.env.ALLOWED_ORIGIN || "*";
  const reqOrigin = c.req.header("Origin");
  // Reflect any localhost port (local dev) and any friendsonbikes.uk subdomain
  // (book./dev.book./guide./capture./… — the customer + operator surfaces all
  // live under the apex). Everything else falls back to ALLOWED_ORIGIN.
  const trusted =
    !!reqOrigin &&
    (/^http:\/\/localhost:\d+$/.test(reqOrigin) ||
      /^https:\/\/([a-z0-9-]+\.)*friendsonbikes\.uk$/.test(reqOrigin));
  const origin = trusted ? reqOrigin! : configured;
  return cors({ origin, credentials: origin !== "*" })(c, next);
});

app.get("/health", (c) => c.json({ ok: true, service: "fob-api-worker" }));

// FR-001 workstream 5 — images extracted from imported HTML templates.
//
// DELIBERATELY PUBLIC, and it must stay that way: a mail client fetches images
// from the recipient's device with no session of any kind, so anything behind
// auth simply would not load. Declared here, before the deny-by-default guards
// below, so the exemption is visible rather than an accident of prefixes.
//
// Scope is narrow by construction — the key is always prefixed `email-assets/`,
// so no other object in the bucket is reachable through this route. Contents
// are Owner-authored marketing imagery, not customer data.
app.get("/email-assets/*", async (c) => {
  const key = new URL(c.req.url).pathname.replace(/^\//, "");
  if (!key.startsWith("email-assets/")) return c.json({ error: "not_found" }, 404);
  const object = await c.env.ASSETS.get(key);
  if (!object) return c.json({ error: "not_found" }, 404);
  return new Response(object.body, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream",
      // Immutable: the key contains the template id and an index, and content
      // is replaced by a fresh import rather than edited in place.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
});

// ---------------------------------------------------------------------------
// FINDING-008 — deny-by-default auth, mounted BEFORE any sub-app.
//
// Hono runs matched handlers in registration order, so a guard declared inside
// a sub-app protects only that sub-app — and only if the request was not
// already answered by an earlier-mounted one. `fleet`, `pretour`, `posttour`
// and two `/admin/*` routes in `tourops` shipped with no guard of their own and
// mount before `backoffice`, so its `use("*")` guard never ran for them: every
// route below was reachable anonymously (verified against a running worker —
// `GET /admin/fleet` returned 200 with no credentials).
//
// These middlewares are declared at the app level so protection no longer
// depends on each module remembering to opt in. A module may still add its own
// narrower guard; running both is harmless (the second is a repeat KV read).
// Anything genuinely public must NOT live under these prefixes.
//
// `/auth/*` (login, link verification) is deliberately outside — it is how a
// caller obtains a session in the first place.
app.use("/admin/*", requireOperatorSession);
// `/internal/*` is named internal but was publicly routable; operators only.
app.use("/internal/*", requireOperatorSession);
// Customer, booking-scoped (AUTH02). `requireCustomerSession` matches the
// route's `:id`/`:bookingId` against the session's own booking, so one
// customer cannot read another's tour hub. This is the route that exposed
// participant PII and emergency contacts to anyone who could guess an id.
app.use("/tour-hub/*", requireCustomerSession);
// `/notices/:id/*` cannot use `requireCustomerSession`: its `:id` is a NOTICE
// id, not a booking id, so the generic param check would compare a notice id
// against a booking id and reject every legitimate caller. Ownership is
// resolved by lookup instead.
app.use("/notices/*", requireCustomerSession, requireNoticeOwner);

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
app.route("/", toursAdmin);
app.route("/", emailRoutes);

app.notFound((c) => c.json({ error: "not_found" }, 404));

export default {
  fetch: app.fetch,
  // Cron Triggers — satisfies: TDR-01 (Cron), cron-workers component.
  async scheduled(event: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(handleScheduled(event, env, ctx));
  },
  // Inbound mail (Cloudflare Email Routing) — satisfies: REQ-NOTIF05, DR-18.
  async email(message: ForwardableEmailMessage, env: Env, ctx: ExecutionContext) {
    await handleInboundEmail(message, env, ctx);
  },
};
