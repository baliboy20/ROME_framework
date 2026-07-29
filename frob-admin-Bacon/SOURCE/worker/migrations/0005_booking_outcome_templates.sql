-- Booking-outcome confirmation templates (dispatched by
-- modules/notifications/booking-outcome.ts). Seeds the two live flavours as the
-- active template for their use_case. The deposit flavour is intentionally left
-- unseeded for now (dispatcher falls back to built-in plain text until an owner
-- authors + activates one). Fixed ids keep this migration reproducible.

INSERT INTO email_templates (id, use_case, name, subject, body, variables, status, created_at, updated_at)
VALUES (
  'tmpl-booking-confirmed-paid',
  'booking_confirmed_paid',
  'Booking confirmed — paid in full',
  'You''re booked, {{ name }} — {{ tour }}',
  'Hi {{ name }},

Great news — your place on {{ tour }} is confirmed and paid in full ({{ amount_paid }}).

Your ride
  Date: {{ date }} at {{ time }}
  Party size: {{ party_size }}
  Booking reference: {{ booking_ref }}
  Meeting point: {{ meeting_point }}

Please arrive 10 minutes before your start time. Your bike, helmet, hi-vis vest and printed route map are all provided — just bring yourself and comfortable clothing.

Need to make a change? Just reply to this email.

See you on the road,
Friends on Bikes',
  '["name","tour","date","time","party_size","amount_paid","booking_ref","meeting_point"]',
  'active',
  '2026-07-26T00:00:00Z',
  '2026-07-26T00:00:00Z'
);

INSERT INTO email_templates (id, use_case, name, subject, body, variables, status, created_at, updated_at)
VALUES (
  'tmpl-booking-reserved-unpaid',
  'booking_reserved_unpaid',
  'Reserved — awaiting payment',
  'Your booking is reserved, {{ name }} — {{ tour }}',
  'Hi {{ name }},

We''ve reserved your place on {{ tour }} on {{ date }} for a party of {{ party_size }}.

To confirm your booking, please complete it and pay securely here:
{{ completion_link }}

Your place is held until payment is completed. If you have any questions, just reply to this email.

Friends on Bikes
{{ meeting_point }}',
  '["name","tour","date","party_size","completion_link","meeting_point"]',
  'active',
  '2026-07-26T00:00:00Z',
  '2026-07-26T00:00:00Z'
);
