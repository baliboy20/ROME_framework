# Cloudflare configuration — how this POC is actually built and deployed

POC only, not product infrastructure (see `TC_e2e-fullstack_2026-07-25.md`'s disposal note). This
describes exactly what's configured in the real Cloudflare account so the POC could send and
receive genuine email, not simulated sends — everything below was actually deployed and tested
live, not just planned.

| | |
|---|---|
| **Account** | `Williampaulton@yahoo.co.uk's Account` (account id `e6e822db1c1bf79acf64f7e8d3b145f5`) |
| **Domain** | `friendsonbikes.uk` — an existing zone in this account, already carrying a production Email Routing setup (`email-routing-01`) that this POC deliberately never touches |
| **Worker** | `fob-e2e-poc` — deployed at `https://fob-e2e-poc.williampaulton.workers.dev` |
| **Database** | Cloudflare D1, `fob-e2e-poc` (id `be076ca6-f379-40a8-8517-38f5d92959f4`) |

## 1. Component map

```mermaid
flowchart LR
    Browser["Browser<br/>(React/Ionic SPA)"] -->|GET /, /assets/*| Worker
    Browser -->|fetch /api/*| Worker

    subgraph CF["Cloudflare"]
        Worker["Worker: fob-e2e-poc<br/>src/index.ts"]
        Assets["Static Assets<br/>frontend/dist"]
        D1[("D1 Database<br/>fob-e2e-poc")]
        Sending["Email Sending<br/>(send_email binding)"]
        Routing["Email Routing<br/>(zone-level rule)"]
    end

    Worker -->|env.ASSETS.fetch()<br/>non-/api fallback| Assets
    Worker <-->|env.DB.prepare()| D1
    Worker -->|env.EMAIL.send()| Sending
    Sending -->|SMTP| Internet(("Real inboxes<br/>e.g. yahoo.com"))
    Internet -->|inbound mail to<br/>poc-test@friendsonbikes.uk| Routing
    Routing -->|"Action: Send to a Worker"| Worker
    Worker -->|"async email(message, env, ctx)"| D1
```

One Worker serves three roles: the static frontend (via Static Assets), the JSON API
(`/api/*`), and the inbound-mail handler (`email()`, invoked by Email Routing) — plus it calls
out to Email Sending for outbound. This is one deployable, not three.

## 2. Worker — `wrangler.toml`

```toml
name = "fob-e2e-poc"
main = "src/index.ts"
compatibility_date = "2024-09-01"

[assets]
directory = "./frontend/dist"
binding = "ASSETS"

[[d1_databases]]
binding = "DB"
database_name = "fob-e2e-poc"
database_id = "be076ca6-f379-40a8-8517-38f5d92959f4"

[[send_email]]
name = "EMAIL"
remote = true

[vars]
SEND_FROM_ADDRESS = "bookings@friendsonbikes.uk"
```

- `[assets]` — Workers' built-in Static Assets feature. `directory` points at the Vite build
  output (`npm run build:frontend`); `binding = "ASSETS"` exposes `env.ASSETS.fetch(request)` to
  the Worker's own code, used as the fallback for anything that isn't `/api/*` (see §3).
- `[[d1_databases]]` — a real D1 database, not a mock. `database_id` was generated once via
  `wrangler d1 create fob-e2e-poc` and is fixed from then on; the same id is used for both local
  (`--local`) and remote (`--remote`) `wrangler d1 execute` calls.
- `[[send_email]]` with `remote = true` — this is the one flag that makes the difference between
  "logs an email locally" and "actually sends it." Without `remote = true`, `env.EMAIL.send()`
  during `wrangler dev` only simulates the call. With it, `wrangler dev` (and any real
  `wrangler deploy`) sends through Cloudflare's real Email Sending product, subject to the domain
  verification in §4.
- `[vars] SEND_FROM_ADDRESS` — the literal from-address used by every outbound send
  (`bookings@friendsonbikes.uk`, DR-1). Kept as a var rather than hardcoded in `src/lib.ts` so it
  can be swapped without a code change.

**Deploy commands actually used**, from `package.json`:
```json
"build:frontend": "cd frontend && npm run build",
"dev": "npm run build:frontend && wrangler dev",
"deploy": "npm run build:frontend && wrangler deploy"
```
`deploy` always rebuilds the frontend first — `wrangler deploy` re-uploads only assets whose
content hash changed since the last deploy (confirmed in practice: a deploy after only editing
one component re-uploaded just that file's built output, not the whole `dist/`).

## 3. Serving the frontend alongside the API

`src/index.ts`'s `fetch` handler checks the path before doing anything else:

```ts
interface AssetsEnv extends Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
}
// ...
if (!pathname.startsWith("/api/")) {
  return env.ASSETS.fetch(request);
}
```

Everything under `/api/*` is handled by the Worker's own routing (templates, cancellations,
bookings, archive, settings, etc.). Everything else — `/`, `/assets/index-*.js`,
`/favicon.svg` — falls straight through to the Static Assets binding, which serves the built
React/Ionic SPA. There is no separate frontend deployment or CDN configuration to manage; it's
one `wrangler deploy` for both.

## 4. Outbound email — Cloudflare Email Sending

**Dashboard setup performed once, manually, before any of this Worker code mattered:**
1. Cloudflare dashboard → the `friendsonbikes.uk` zone → **Email** → **Email Sending** →
   requested verification for the domain (this required the account's paid-tier gate to be
   cleared first — the very first verification attempt failed until the account was upgraded).
2. Cloudflare generated the required DNS records automatically (added to the zone, not
   hand-typed): an SPF `TXT` record authorizing Cloudflare's sending infrastructure for
   `friendsonbikes.uk`, a DKIM `TXT` record for signing, and a bounce-handling `MX`/`TXT` pair on
   a dedicated `cf-bounce.friendsonbikes.uk` subdomain Cloudflare provisions for this purpose. A
   `DMARC` `TXT` record was added at the zone root (`_dmarc.friendsonbikes.uk`).
3. Verification was polled from the dashboard until it flipped to verified — the first send
   attempt before that point failed with a "destination/sender not verified" class of error
   (Cloudflare's sandbox restriction on unverified senders); once verified, real delivery worked
   immediately with no code change.

**Code side** (`src/lib.ts`): `env.EMAIL.send({ to, from, subject, text })`. Cloudflare's Email
Sending API accepts one primary recipient per call, so multi-recipient fan-out (Party Leader +
every opted-in Co-leader, F-18) is a loop, not a single call with a `to` array:

```ts
await env.EMAIL.send({ to: recipients[0], from: env.SEND_FROM_ADDRESS ?? DEFAULT_FROM, subject, text: content });
for (const extra of recipients.slice(1)) {
  await env.EMAIL.send({ to: extra, from: env.SEND_FROM_ADDRESS ?? DEFAULT_FROM, subject, text: content });
}
```

Every attempt is wrapped so a Cloudflare-side rejection is recorded, never thrown away: the
`sent_emails` row always gets written (the message was still correctly assembled), with
`delivery_status` set to `sent` or `failed` and `delivery_error` populated on failure. This is
what lets the Archive/Home screens show a real "delivery failed" chip instead of silently losing
the record.

## 5. Inbound email — Cloudflare Email Routing

**Dashboard setup:** the zone already had Email Routing enabled for production use
(`email-routing-01`), so rather than touch that, a **second, additive** routing rule was created:

- **Address:** `poc-test@friendsonbikes.uk` (a brand-new address, chosen specifically so nothing
  already relying on the zone's existing routing rules is affected)
- **Action:** *Send to a Worker* → `fob-e2e-poc`

Cloudflare's Email Routing needs its own MX and routing-verification TXT records on the zone,
but those were already present from the existing production setup — no new DNS records were
needed for the inbound side, only the one additional rule above.

**Code side** (`src/index.ts`): the Worker exports an `email(message, env, ctx)` handler
alongside `fetch` and `default`. Cloudflare invokes this automatically for any mail matched to
the Worker by a routing rule:

```ts
export default {
  async fetch(request, env) { /* ... */ },
  async email(message: any, env: Env, ctx: ExecutionContext): Promise<void> {
    const fromAddress = message.from;
    const parsed = await PostalMime.parse(message.raw);   // see below
    const subject = parsed.subject || message.headers?.get?.("subject") || "(no subject)";
    const body = parsed.text || parsed.html || "";
    const result = await categorise(env, fromAddress, subject, body);
    // ... writes email_threads + received_emails
  },
};
```

`message.raw` is an unparsed MIME stream — reading it directly (an early version of this POC did
a single-chunk `getReader()` read) only recovers the raw headers, not the actual message text.
This was found by testing against a real inbound email, not by inspection. The fix was to add
`postal-mime` (Cloudflare's own recommended library for this) and parse properly:
`PostalMime.parse(message.raw)` → `{ subject, text, html }`.

**Local testing without waiting for real mail:** Cloudflare's Workers runtime exposes a built-in
simulator endpoint during `wrangler dev` —
`curl -X POST http://localhost:8792/cdn-cgi/handler/email --data-binary @test.eml` — which
invokes the same `email()` handler with a hand-crafted `.eml` file, letting the categorisation
cascade be exercised locally before ever sending real mail.

## 6. Local vs. remote D1

Two D1 targets share the same `database_id`, selected by a wrangler flag rather than separate
config:
- `wrangler d1 execute fob-e2e-poc --local --file=schema.sql` — Miniflare's local SQLite,
  used for `wrangler dev` and the `db:init` script.
- `wrangler d1 execute fob-e2e-poc --remote --file=...` — the real, deployed D1 instance, used
  for schema migrations (e.g. the DR-15 `notification_settings` table + `enquiries.acknowledged`
  column) and for resetting test data back to the seed fixtures after live-testing a scenario.

Every "run this scenario live" step in this POC's later testing (life-cycle scenarios, DR-13,
DR-14, DR-15 verification) ran with `--remote` against the real deployed database — not a local
simulation — specifically so the fan-out, delivery-status, and categorisation behaviour being
checked was the real Cloudflare-hosted behaviour, not Miniflare's approximation of it.

## 7. Known POC-only deviations from a real production setup

- **No secrets/environment separation.** `SEND_FROM_ADDRESS` is a plain `[vars]` string, fine for
  a from-address but not a pattern to copy for anything actually secret — this POC has no
  secrets to protect (Email Sending/Routing don't need an API key from the Worker's side; the
  binding itself carries the account's authorization).
- **Single environment.** No `[env.staging]`/`[env.production]` split in `wrangler.toml` — one
  Worker, one D1 database, one set of DNS records. A real build would separate these.
- **Inbound handler doesn't forward to the Owner's personal inbox.** The real REQ-EML11 always
  forwards (DR-7); this POC's `email()` handler only captures + categorises (no
  `message.forward()` call) since there was no real personal inbox to forward test messages to
  without risking noise in it.
