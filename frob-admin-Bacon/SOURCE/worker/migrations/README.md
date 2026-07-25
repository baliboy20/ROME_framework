# FOB D1 migrations — run-once, in-order runner (satisfies: TDR-03)

`core-data-access` (library inside `api-worker`) is the **single** D1 access
path for all 78 REQs. Its migration runner convention:

## Convention

- Files: `NNNN_description.sql`, strictly increasing 4-digit prefix
  (`0001_init.sql`, `0002_add_bookings.sql`, ...).
- Applied **exactly once**, **in numeric order** — the runner tracks applied
  filenames in a `_migrations` bookkeeping table and skips anything already
  recorded. Never renumber or edit an already-applied file; add a new one.
- All persistence in the app flows through `core-data-access` — no other
  code path writes D1 directly (architecture.md §2, §5 TDR-03).
- Schema is authored **fresh** in P5 (greenfield build, DEV-4) from
  `ARTIFACTS/_design/data-dictionary.md` and `component-specs.md` — no
  `admin-rome`/`guide_app` schema is reused. The Stripe-poc
  `schema/0001_init.sql` (`_user_input/reference/stripe-poc/`) may be used
  as a **reference-only** pattern for the payment tables specifically
  (`payments`, `webhook_events`) per `architecture-impact-brief.md`, with
  two required divergences: Postmark not Resend (TDR-09), and a core-auth
  operator session not the PoC's static admin-key guard.

## Commands (see package.json)

```bash
# local dev (Wrangler local D1, DEV-4/TDR-12)
npm run db:migrate:local

# staging (once staging D1 namespace is created — see infra-impact-brief.md)
npm run db:migrate:staging

# production
npm run db:migrate:production
```

Under the hood these call:

```bash
wrangler d1 migrations apply <db-name> [--env staging|production] [--local|--remote]
```

## Data residency

D1 databases (dev/staging/production) must be provisioned in the **UK**
region (satisfies: TDR-03 data residency, architecture.md §7).

## P5 handover

P4 (Lucien) provides this directory + convention + placeholder `0001_init.sql`
header only. P5 (Ashok) authors the actual table DDL across one or more
numbered migrations, per the data dictionary.
