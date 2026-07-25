# Core Analysis: Authentication, Consent & Audit, Notifications, SEO

Functional decomposition (P2) of the AORDL requirements for the Auth, Consent & Audit, Notifications, and SEO modules. Each Feature traces to exactly one source requirement in `ARTIFACTS/_requirements/`.

---

## Auth (core-auth)

### FUNC-AUTH01 — Operator sign-in
**Traces to:** REQ-AUTH01

**User Stories**
- As an Owner, I want to sign in with my credentials, so that I can reach the operator functions I'm authorized to use.
- As an Owner, I want my session to expire automatically after an hour, so that a forgotten, unattended sign-in doesn't stay open indefinitely.
- As an Owner, I want my actions attributed to my identity while signed in, so that the audit record reflects who did what.

**Acceptance Criteria**
- Given valid credentials and no prior active session, when the Owner signs in, then an operator session is created that lasts up to 1 hour and is stored server-side keyed by its token.
- Given invalid credentials, when the Owner attempts to sign in, then sign-in fails with "Sign-in failed — check your details" and the Owner is prompted to re-enter their details.
- Given the session store is unreachable, when the Owner attempts to sign in, then sign-in is reported as temporarily unavailable rather than silently degraded, and the Owner is told to wait and retry.
- Given an active operator session, when the Owner takes any action, then that action is attributed to the Owner's identity in the audit record.

### FUNC-AUTH02 — Passwordless booking access
**Traces to:** REQ-AUTH02

**User Stories**
- As a Customer, I want to open my booking via a link I was sent, so that I can view it without creating a password.
- As a Customer, I want that link to only ever show me my own booking, so that my access is scoped and safe.

**Acceptance Criteria**
- Given a valid, unexpired signed link for an existing booking, when the Customer opens it, then a booking session is created scoped to that one booking, lasting up to 1 hour.
- Given an expired signed link, when the Customer opens it, then access is refused with "This link has expired — request a new one" and the Customer is told to request a new link.
- Given an invalid or tampered signed link, when the Customer opens it, then access is refused with "This link isn't valid" and the Customer is told to request a new link.
- Given a signed link whose booking no longer exists, when the Customer opens it, then the Customer sees "We couldn't find that booking" and is told to contact the operator.

### FUNC-AUTH03 — Guide device recognition
**Traces to:** REQ-AUTH03

**User Stories**
- As a Guide, I want to use tour functions from my issued device without a separate login, so that I can start work quickly in the field.
- As an Owner, I want unrecognised devices refused automatically, so that only registered guide devices can act on my tours.

**Acceptance Criteria**
- Given a device whose identity matches a device registered to a guide, when it makes a request, then the request is scoped to that guide and tour functions become available.
- Given a device whose identity is not registered to any guide, when it makes a request, then access is refused with "This device isn't registered — contact the owner" and the guide is told to contact the owner.
- Given a device that asserts no identity, when it makes a request, then access is refused with "This device can't be identified" and the guide is told to reconnect with a device that asserts an identity.
- Given any request, when it is evaluated, then the device identity is validated on that request (not cached indefinitely as sufficient).

### FUNC-AUTH04 — Expired-session rejection
**Traces to:** REQ-AUTH04

**User Stories**
- As an Owner or Customer, I want to be asked to sign in again once my session has expired, so that I understand why access was lost and can regain it.
- As an Owner, I want expired sessions to be rejected consistently, so that no operator or booking action can ever proceed on stale access.

**Acceptance Criteria**
- Given a session older than its 1-hour lifetime, when a request is made using that session, then the request is refused with "Your session has expired — please sign in again" (401) and no operator or booking action proceeds.
- Given expiry is being checked, when it is evaluated, then it is enforced independently of any value asserted by the requester (not trusted from client input).
- Given an expired session, when the actor wants to continue, then they must re-establish a session by signing in again.

### FUNC-AUTH05 — Explicit sign-out
**Traces to:** REQ-AUTH05

**User Stories**
- As an Owner or Customer, I want to sign out explicitly, so that my session immediately stops granting access.
- As an Owner, I want a deleted session's token to never work again, so that sign-out is a real security boundary, not just a UI state.

**Acceptance Criteria**
- Given an active session and an explicit sign-out request from its owner, when sign-out is processed, then the session record is removed immediately.
- Given a session that has just been deleted, when a subsequent request presents its token, then the request is treated as unauthenticated.
- Given an actor with no active session, when they request sign-out, then they are shown "You are already signed out" (200) and no further action is needed.

---

## Consent & Audit (core-consent-audit)

### FUNC-CNA01 — Capture consent decision
**Traces to:** REQ-CNA01

**User Stories**
- As a Prospect, I want my marketing/processing consent choice recorded exactly as I made it, so that it is honoured going forward.
- As an Owner, I want to be able to prove what consent state applied at any point in the past, so that I can demonstrate compliance.

**Acceptance Criteria**
- Given a data-capture point where the option is not pre-selected, when a Prospect submits a consent decision, then a new immutable consent record is created with capture source, evidence, and timestamp, appended (never overwriting) prior decisions.
- Given no contact detail identifies the Prospect, when a consent decision is submitted, then it is rejected with "We need a contact detail to record your choice" (400) and the Prospect is asked to provide an email or phone number.
- Given no capture source is supplied, when a consent decision is submitted, then it is rejected with "Your choice could not be recorded" (400) and the Prospect is asked to resubmit.
- Given no prior decision exists for a person/purpose, when consent state is evaluated, then the default is withheld (never pre-granted).

### FUNC-CNA02 — Withdraw marketing permission
**Traces to:** REQ-CNA02

**User Stories**
- As a Customer, I want to withdraw my marketing consent in one step, so that I stop receiving that marketing.
- As an Owner, I want a withdrawal to be honoured by the next send cycle at the latest, so that suppression is reliable and prompt.

**Acceptance Criteria**
- Given a prior granted marketing permission for a person and purpose, when the Customer withdraws it, then a new appended decision records the withdrawal and the current consent state becomes withdrawn.
- Given a withdrawal has been recorded, when the next send cycle for that purpose runs, then that person is suppressed from it (suppression takes effect by the next cycle at the latest).
- Given no prior permission is on record for that purpose, when the Customer attempts to withdraw, then they see "You are already unsubscribed from this" (200) with no further action needed.

### FUNC-CNA03 — Record audit entry
**Traces to:** REQ-CNA03

**User Stories**
- As an Owner, I want every money- or safety-critical action logged immutably, so that I can reconstruct exactly what happened, to what, by whom, and when.
- As an Owner, I want audit entries that can never be altered or deleted, so that the record stays trustworthy.

**Acceptance Criteria**
- Given a money- or safety-critical action occurs (refund, consent change, owner override, incident), when it completes, then an immutable audit entry is created referencing the subject and the acting identity, with a timestamp.
- Given an audit entry has been recorded, when any later attempt is made to modify or delete it, then that attempt is not possible — audit entries are append-only.
- Given an audit entry is created with a missing subject or acting identity, when it is recorded, then it is still recorded but flagged (200) for Owner review of the missing detail.

### FUNC-CNA04 — Erase dormant personal data
**Traces to:** REQ-CNA04

**User Stories**
- As an Owner, I want dormant prospect personal data automatically erased after 90 days, so that I comply with data-retention obligations without manual effort.
- As an Owner, I want erasure to preserve record integrity and be itself audited, so that related records stay consistent and the erasure is provable.

**Acceptance Criteria**
- Given a prospect's record has been dormant beyond the 90-day retention window, when the retention scheduler runs, then that record's personal fields are irreversibly blanked while the row itself is retained, and the erasure is audited.
- Given a record shows recent activity (not yet dormant beyond the window), when the scheduler evaluates it, then it is left untouched with "Record is not yet eligible for erasure" (200) and no action needed.
- Given erasure has occurred, when the record is inspected afterward, then it holds no personal data and the erasure cannot be reversed.

### FUNC-CNA05 — Gate marketing sends on consent state
**Traces to:** REQ-CNA05

**User Stories**
- As an Owner, I want every marketing send checked against current consent immediately before sending, so that I never market to someone who withdrew or never granted permission.
- As a Prospect/Customer, I want my most recent consent decision to always be the one that's honoured, so that changing my mind actually works.

**Acceptance Criteria**
- Given a marketing message is about to be sent to a person for a purpose, when the current consent state for that person and purpose is granted, then the send proceeds.
- Given the current consent state is withheld or withdrawn, when a send is attempted, then it never proceeds against that state.
- Given no decision is on record for that person and purpose, when a send is attempted, then the recipient is treated as not consented, the send is suppressed, and no action is required.

---

## Notifications (core-notifications)

### FUNC-NOTIF01 — Send transactional message
**Traces to:** REQ-NOTIF01

**User Stories**
- As a Customer, I want to receive a confirmation or reminder for my booking automatically, so that I know my booking status without asking.
- As an Owner, I want to see that a transactional message was sent, so that I have confidence the Customer was informed.

**Acceptance Criteria**
- Given a transactional trigger fires (booking confirmed, reminder due) for a person with a contact address, when the trigger fires, then exactly one message per person per event is produced with an idempotency key and handed to the delivery provider once, and logged.
- Given no contact address is on record for the recipient, when the trigger fires, then the send fails with "The message could not be sent — no contact address on file" (422) and the Owner is prompted to add a contact address.
- Given the delivery provider rejects the send, when this happens, then the Customer/Owner sees "Delivery pending" (202) and no manual action is needed — retry is automatic per provider policy.
- Given a transactional message is being sent, when marketing consent state is checked, then it is not gated by marketing consent.

### FUNC-NOTIF02 — Track deliverability outcomes
**Traces to:** REQ-NOTIF02

**User Stories**
- As an Owner, I want to see which contact addresses are bouncing or complaining, so that I understand delivery health.
- As an Owner, I want future sends to automatically avoid addresses known to hard-bounce, so that I don't damage sender reputation.

**Acceptance Criteria**
- Given the delivery provider reports an outcome (delivered, bounced, complaint) for a prior message, when the outcome is matched to the message by provider reference, then the person's deliverability state is updated to reflect that latest outcome.
- Given an outcome references a message the system cannot identify, when it is processed, then it is flagged for review with "The delivery outcome could not be matched and was flagged for review" (200).
- Given provider callbacks are retried or repeated, when they are processed, then deliverability state updates remain idempotent (no duplicate state churn).

### FUNC-NOTIF03 — Suppress duplicate sends
**Traces to:** REQ-NOTIF03

**User Stories**
- As a Customer, I want to receive exactly one message per event even if the system retries internally, so that I'm not spammed by duplicates.
- As an Owner, I want retried delivery jobs to never double-send, so that customer trust and delivery costs are protected.

**Acceptance Criteria**
- Given a send is attempted with an idempotency key already processed within the retention window, when the duplicate attempt occurs, then it is not delivered and the original send stands.
- Given the idempotency-key store is unavailable, when a send is attempted, then it is held as "Delivery pending" (202) rather than risked as a duplicate.
- Given a message has been delivered once for a given idempotency key, when any retry occurs, then at most one delivery ever occurs per key.

### FUNC-NOTIF04 — Alert Owner of actionable events
**Traces to:** REQ-NOTIF04

**User Stories**
- As an Owner, I want to be alerted when an event needs my attention (new enquiry, handoff, incident), so that I can respond promptly.
- As an Owner, I want alerts to reach me even if my primary channel is unreachable, so that I never silently miss something actionable.

**Acceptance Criteria**
- Given an event needing the Owner's attention occurs, when it fires, then the Owner is notified once via their configured channel, regardless of marketing consent state.
- Given the Owner's channel is unreachable, when the alert is attempted, then it is recorded for in-app pickup with "The alert could not be delivered and was recorded for in-app pickup" (202) and the Owner is told to check in-app.
- Given an actionable event has occurred, when the system processes it, then the event is never silently lost.

---

## SEO (core-seo)

### FUNC-SEO01 — Publish crawler-readable tour content
**Traces to:** REQ-SEO01

**User Stories**
- As a Prospect, I want to find a tour through a search engine, so that I can discover it without already knowing the operator's site.
- As an Owner, I want my published tour content to be fully readable by search crawlers, including structured descriptors, so that my listings surface well in search results.

**Acceptance Criteria**
- Given a tour has published catalogue content, when a search crawler requests the public tour location, then it receives the complete, crawler-readable content and machine-readable descriptors without needing to execute scripts.
- Given crawler-readable content is served, when compared to the published catalogue content, then they match.
- Given a tour's content is missing a title or description, when it is published, then it is flagged with "This tour listing is incomplete and has been flagged for review" (200) and the Owner is prompted to complete it.
- Given the public tour location is requested, when the page loads, then primary content is available on first load (not deferred behind script execution).

### FUNC-SEO02 — Maintain crawlable location index
**Traces to:** REQ-SEO02

**User Stories**
- As an Owner, I want all my published locations discoverable from a single index, so that search crawlers find everything I've published.
- As an Owner, I want the index kept accurate as I publish, so that crawlers aren't fed stale or incomplete data.

**Acceptance Criteria**
- Given one or more public locations are published, when a crawler requests the index, then it lists exactly the currently-published crawlable locations.
- Given a location is published but missing from the index, when this is detected, then it is flagged with "This location is missing from the crawlable index and has been flagged for review" (200) and the Owner is prompted to review the gap.
- Given content has been published, when the index is next rebuilt, then it reflects the latest publication within the rebuild cycle.

### FUNC-SEO03 — Regenerate published content on manual publish
**Traces to:** REQ-SEO03

**User Stories**
- As an Owner, I want to control exactly when my published tour content changes, so that updates go live only when I intend them to.
- As a Prospect, I want to see tour details that are accurate as of the operator's last publish, so that what I see is trustworthy.

**Acceptance Criteria**
- Given marketing or route-catalogue content has changed and an operator triggers a manual publish, when publication runs, then affected public locations are regenerated with the current content and descriptors.
- Given content has changed but no manual publish has been triggered, when a Prospect or crawler views the public location, then it still reflects the content as of the last manual publish (lagging until the next trigger).
- Given a manual publish is triggered, when it runs, then the rebuild completes within the accepted processing window.
- Given published content is inspected at any time, when checked, then it never changes without having gone through a completed manual publish.

---

## Traceability Summary

| REQ | Feature |
|---|---|
| REQ-AUTH01 | FUNC-AUTH01 |
| REQ-AUTH02 | FUNC-AUTH02 |
| REQ-AUTH03 | FUNC-AUTH03 |
| REQ-AUTH04 | FUNC-AUTH04 |
| REQ-AUTH05 | FUNC-AUTH05 |
| REQ-CNA01 | FUNC-CNA01 |
| REQ-CNA02 | FUNC-CNA02 |
| REQ-CNA03 | FUNC-CNA03 |
| REQ-CNA04 | FUNC-CNA04 |
| REQ-CNA05 | FUNC-CNA05 |
| REQ-NOTIF01 | FUNC-NOTIF01 |
| REQ-NOTIF02 | FUNC-NOTIF02 |
| REQ-NOTIF03 | FUNC-NOTIF03 |
| REQ-NOTIF04 | FUNC-NOTIF04 |
| REQ-SEO01 | FUNC-SEO01 |
| REQ-SEO02 | FUNC-SEO02 |
| REQ-SEO03 | FUNC-SEO03 |
