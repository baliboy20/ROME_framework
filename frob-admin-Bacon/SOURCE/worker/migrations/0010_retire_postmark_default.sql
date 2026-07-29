-- CR-011 — retire Postmark (2026-07-29).
--
-- `message.provider` was declared `TEXT NOT NULL DEFAULT 'postmark'`
-- (0001_init.sql:153). Every INSERT that omits the column therefore records a
-- provider the business has not used since CHG-008/DR-18 moved outbound
-- transport to Resend. The default is a live landmine, not a stale comment:
-- it silently produces false provenance in the send log.
--
-- SQLite cannot alter a column default in place, and rebuilding the `message`
-- table would mean copying every row and re-creating its indexes and foreign
-- keys — disproportionate risk for a default that every current write path
-- already overrides explicitly. So the default is left in the DDL and the
-- exposure is closed at both ends instead:
--
--   * every INSERT site now supplies `provider` explicitly (the eight that
--     hard-coded 'postmark' now write 'pending', corrected on dispatch by
--     send()), so the default is unreachable from application code;
--   * the historical rows below are repaired.
--
-- Repair existing rows that were never actually sent via Postmark. A row still
-- sitting at 'queued'/'pending_send' was never dispatched, so its recorded
-- provider is provably wrong.
UPDATE message
   SET provider = 'pending'
 WHERE provider = 'postmark'
   AND status IN ('queued', 'pending_send');

-- Rows that DID reach a provider are left exactly as they are. Some genuinely
-- were sent via Postmark before the transport switch, and rewriting them would
-- falsify the send log — the opposite of the point of this change.
