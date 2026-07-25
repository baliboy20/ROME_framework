---
module: AUTH
status: PROPOSED
actors: [Owner, Customer, Guide, System]
depends-on: [core-data-access]
presumes: [Cloudflare KV]
---

# core-auth — Module Spec

| | |
|---|---|
| **Document** | core-auth module spec (Stage 4) |
| **Version** | 0.1 |
| **Date** | 2026-07-20T00:00:00Z |
| **Status** | PROPOSED — not Reliable until ratification (`/and-ratify`). |
| **Sources** | `DOMAIN-LEXICON.md` · `Module_Map.md` · `Intake_Note.md` (F-04, F-12) · `technical-state/FOB_Technical_Context_Summary.md` §G · `ROME-GUIDE-001` (entry format) |

## 1. Intent
Authenticate each actor by the mechanism that fits their context — Owner/Secondary-operator by credential, Customer by signed link, Guide by device — and expose the identity to downstream modules. **Success:** every request is attributable to exactly one actor, and no action proceeds under an absent or expired session.

## 2. Facts
| ID | Fact | Source |
|---|---|---|
| F-04 | Booking/admin sessions are JWT (HS256, 1h) + KV; guide requests carry `X-Device-ID` validated per-guide; no Cloudflare Access anywhere. | Tech Context §G |
| F-12 | KV holds session tokens (and rate-limit counters). | Tech Context §H |
| — | Actors, "auth session" vs "tour session" (KI-1), and the signed-link→JWT relationship are defined in the lexicon; this doc defers to it. | DOMAIN-LEXICON §1–2 |

## 3. Decisions needed
| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D-AUTH-1 | Canonical booking-site source for `jwt.ts` (R-D4/SQ-05). | `rome-dev` \| `admin-rome` | Adopt `admin-rome` (carries CI); reconcile before deploy. | **CLOSED — DR-1.** `admin-rome` canonical; `rome-dev` treated as spurious. |
| D-AUTH-2 | Save-link auth: stateless JWT (Data Model) vs JWT+KV (built site) — KI-8. | stateless \| JWT+KV | JWT+KV, to allow revocation. | **CLOSED — DR-2.** JWT+KV. |
| D-AUTH-3 | Is `X-Device-ID` sufficient guide auth at v1 (SQ-09)? | yes \| add per-guide credential | Yes at v1; revisit if devices are shared. | **CLOSED — DR-3.** Yes at v1. |
| D-AUTH-4 | Session revocation (logout) — carried Gate-1 hole. | in v1 \| defer | In v1: explicit revoke removes the KV session. | **CLOSED — DR-4.** In v1; see REQ-AUTH05. |

## 4. Requirements

### REQ-AUTH01 — Owner creates an operator session
intent:        create operator-session
actor:         Owner
preconditions: Owner presents valid credentials; no active session required
conditions:    session lifetime is 1 hour; the session is stored server-side keyed by its token
postconditions: an active operator session exists for the Owner for up to 1 hour
outcomes:
  - Owner sees they are signed in and can reach operator functions
  - Owner's subsequent actions are attributed to their identity in the audit record
errors:
  - credentials invalid → no session created; "Sign-in failed — check your details"
  - session store unavailable → no session created; "Sign-in is temporarily unavailable — try again"
invariants:    an operator session never outlives its 1-hour lifetime; a session token identifies exactly one operator
non-functional: Security — session tokens expire after 1 hour; credentials are never stored in the session record
scope:         in: credential sign-in producing a time-boxed operator session | out: SSO, multi-factor, password reset
open-questions: none — D-AUTH-1 closed (DR-1)
example:
  given:  William (Owner) with valid credentials and no active session
  when:   William creates an operator session
  then:   an active session exists, expiring 1 hour later; William sees operator functions

### REQ-AUTH02 — Customer creates a booking session from a signed link
intent:        create booking-session
actor:         Customer
preconditions: a valid, unexpired signed link for an existing booking is presented
conditions:    the link identifies exactly one booking; session lifetime is 1 hour
postconditions: an active booking session exists scoped to that one booking
outcomes:
  - Customer sees their booking without entering a password
  - Customer can act only on the booking the link identified
errors:
  - link expired → no session; "This link has expired — request a new one"
  - link invalid or tampered → no session; "This link isn't valid"
  - booking not found → no session; "We couldn't find that booking"
invariants:    a booking session grants access to exactly one booking; a signed link admits a session only within its validity window
non-functional: Security — signed links are single-purpose and time-limited
scope:         in: passwordless booking access via signed link | out: full customer accounts, cross-booking access
open-questions: none — D-AUTH-2 closed (DR-2)
example:
  given:  Tom (Customer) with a valid signed link for booking BK-1001
  when:   Tom creates a booking session
  then:   an active session scoped to BK-1001 exists; Tom sees BK-1001 without a password

### REQ-AUTH03 — Guide submits device identity
intent:        submit device-identity
actor:         Guide
preconditions: the Guide operates an issued device that asserts a device identity
conditions:    the device identity must match a device registered to a guide
postconditions: the request is scoped to the guide that owns the recognised device
outcomes:
  - Guide sees tour functions available on a recognised device
  - Guide is refused on an unrecognised device
errors:
  - device identity not registered → access refused; "This device isn't registered — contact the owner"
  - device identity missing → access refused; "This device can't be identified"
invariants:    a device identity maps to exactly one guide; an unrecognised device is never granted access
non-functional: Security — device identity is validated on every request
scope:         in: per-device guide recognition | out: guide passwords, device self-registration
open-questions: none — D-AUTH-3 closed (DR-3)
example:
  given:  Emma (Guide) on device DEV-EMMA-01 registered to her
  when:   Emma submits the device identity
  then:   the request is scoped to Emma; she sees tour functions

### REQ-AUTH04 — System rejects an expired session
intent:        reject expired-session
actor:         System
preconditions: a request presents a session token
conditions:    a session older than its 1-hour lifetime is expired
postconditions: an expired session grants no access; the actor must re-establish a session
outcomes:
  - Customer or Owner is asked to sign in again when their session has expired
  - no operator or booking action proceeds under an expired session
errors:
  - expired session presented → access refused; "Your session has expired — please sign in again"
invariants:    no action ever proceeds under an expired session
non-functional: Security — expiry is enforced server-side, never trusted from the client
scope:         in: server-side expiry enforcement and re-auth prompt | out: silent refresh, sliding expiry
open-questions: none
example:
  given:  William (Owner) whose operator session was created 61 minutes ago
  when:   William makes a request under that session
  then:   access is refused; William is asked to sign in again

### REQ-AUTH05 — System deletes a session on sign-out
intent:        delete session
actor:         System
preconditions: an authenticated actor (Owner or Customer) has requested sign-out; an active session (operator or booking) exists
conditions:    sign-out is explicit (actor-initiated); the KV session record is removed immediately
postconditions: the session no longer grants access; a subsequent request under its token is treated as unauthenticated
outcomes:
  - the Owner or Customer sees they have been signed out
  - the deleted session's token grants no further access
errors:
  - no active session to delete → nothing to do; treated as already signed out (no error shown)
invariants:    a deleted session never regains access; deletion takes effect immediately, not on the next expiry check
non-functional: Security — the KV record is removed synchronously, not via a background sweep
scope:         in: actor-initiated end of one's own current session | out: deleting another actor's session, bulk/administrative sign-out
open-questions: none — D-AUTH-4 closed (DR-4)
example:
  given:  William (Owner) with an active operator session, signing out
  when:   the System deletes his session
  then:   the KV session record is removed; William's next request is refused as unauthenticated

## 5. Journeys
| UJ id | Journey | Requirements (thread) |
|---|---|---|
| UJ-AUTH-01 | Operator signs in | REQ-AUTH01 |
| UJ-AUTH-02 | Customer signed-link session | REQ-AUTH02 |
| UJ-AUTH-03 | Guide device recognised | REQ-AUTH03 |
| UJ-AUTH-04 | Session renewed on expiry | REQ-AUTH04 |
| UJ-AUTH-05 | Session revoked (logout) | REQ-AUTH05 |
