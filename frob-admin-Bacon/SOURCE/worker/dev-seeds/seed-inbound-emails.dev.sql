-- DEV-ONLY seed: inbound email archive fixtures (REQ-NOTIF05-08).
-- Not a numbered migration — run manually against --local D1 to give the
-- Email Archive UI + categorisation cascade something to work with:
--   npx wrangler d1 execute fob-d1-dev --local --file migrations/seed-inbound-emails.dev.sql
-- Idempotent: clears the dev fixture rows (fixed 'seed-*' ids) before re-inserting.

DELETE FROM received_emails WHERE id LIKE 'seed-re-%';
DELETE FROM email_threads   WHERE id LIKE 'seed-th-%';

-- 1. LINKED to a real booking (reply-reference match, DR category "linked").
INSERT INTO email_threads (id, categorisation, booking_id, enquiry_id, candidate_refs, created_at)
VALUES ('seed-th-linked-booking', 'linked', '4104e9a1-2f1f-44bb-b5d1-4158fe5e7d98', NULL, NULL, '2026-07-24T09:12:00Z');
INSERT INTO received_emails
  (id, thread_id, from_address, subject, body, spam_flag, references_header, in_reply_to, provider_ref, received_at)
VALUES
  ('seed-re-01', 'seed-th-linked-booking', 'leader.tom@example.com',
   'Re: Complete your Friends on Bikes booking',
   'Hi — one of our party is vegetarian, can you note that for the ride? Thanks, Tom',
   0, '<booking-4104e9a1@friendsonbikes.uk>', '<booking-4104e9a1@friendsonbikes.uk>', 'cf-in-1001', '2026-07-24T09:12:00Z'),
  ('seed-re-02', 'seed-th-linked-booking', 'leader.tom@example.com',
   'Re: Complete your Friends on Bikes booking',
   'Also — is there parking near the start point? Cheers.',
   0, '<booking-4104e9a1@friendsonbikes.uk>', '<cf-in-1001@friendsonbikes.uk>', 'cf-in-1002', '2026-07-24T14:40:00Z');

-- 2. LINKED to a real enquiry (sender lookup matched a prospect).
INSERT INTO email_threads (id, categorisation, booking_id, enquiry_id, candidate_refs, created_at)
VALUES ('seed-th-linked-enquiry', 'linked', NULL, 'en-01', NULL, '2026-07-23T16:05:00Z');
INSERT INTO received_emails
  (id, thread_id, from_address, subject, body, spam_flag, references_header, in_reply_to, provider_ref, received_at)
VALUES
  ('seed-re-03', 'seed-th-linked-enquiry', 'harriet@example.com',
   'Re: Your enquiry about a group ride',
   'Thanks for getting back to me — could we do the second weekend in August instead?',
   0, NULL, NULL, 'cf-in-1003', '2026-07-23T16:05:00Z');

-- 3. UNLINKED (no reference, no matching sender — awaiting manual link, NOTIF07).
INSERT INTO email_threads (id, categorisation, booking_id, enquiry_id, candidate_refs, created_at)
VALUES ('seed-th-unlinked', 'unlinked', NULL, NULL, NULL, '2026-07-25T08:30:00Z');
INSERT INTO received_emails
  (id, thread_id, from_address, subject, body, spam_flag, references_header, in_reply_to, provider_ref, received_at)
VALUES
  ('seed-re-04', 'seed-th-unlinked', 'newrider99@gmail.com',
   'Do you run rides for beginners?',
   'Hello, a friend recommended you. Do you have any gentle routes for first-timers?',
   0, NULL, NULL, 'cf-in-1004', '2026-07-25T08:30:00Z');

-- 4. AMBIGUOUS (sender matched more than one candidate — candidate_refs recorded).
INSERT INTO email_threads (id, categorisation, booking_id, enquiry_id, candidate_refs, created_at)
VALUES ('seed-th-ambiguous', 'ambiguous', NULL, NULL,
        '["4104e9a1-2f1f-44bb-b5d1-4158fe5e7d98","4782801a-c0b2-48db-a38f-b2b3dae229c3"]',
        '2026-07-25T11:15:00Z');
INSERT INTO received_emails
  (id, thread_id, from_address, subject, body, spam_flag, references_header, in_reply_to, provider_ref, received_at)
VALUES
  ('seed-re-05', 'seed-th-ambiguous', 'family.jones@example.com',
   'Question about our upcoming ride',
   'We have two bookings with you — can you confirm the meeting time for the one this Saturday?',
   0, NULL, NULL, 'cf-in-1005', '2026-07-25T11:15:00Z');

-- 5. SPAM (unlinked, spam_flag set — should be filterable out of the archive).
INSERT INTO email_threads (id, categorisation, booking_id, enquiry_id, candidate_refs, created_at)
VALUES ('seed-th-spam', 'unlinked', NULL, NULL, NULL, '2026-07-25T03:02:00Z');
INSERT INTO received_emails
  (id, thread_id, from_address, subject, body, spam_flag, references_header, in_reply_to, provider_ref, received_at)
VALUES
  ('seed-re-06', 'seed-th-spam', 'promo@cheap-seo-deals.biz',
   'Boost your website ranking TODAY',
   'Dear owner, we can get you to page 1 of Google. Reply STOP to unsubscribe.',
   1, NULL, NULL, 'cf-in-1006', '2026-07-25T03:02:00Z');
