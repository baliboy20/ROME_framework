# FOB — Operational Workflows

| | |
|---|---|
| **Document** | FOB — Operational Workflows (Stage 6c) |
| **Version** | 0.1 |
| **Date** | 2026-07-20T00:00:00Z |
| **Status** | PROPOSED — derived from ratified module specs and the Stage 6b coverage matrix |
| **Sources** | `core-auth.md`, `core-consent-audit.md`, `core-notifications.md`, `core-seo.md`, `booking.md`, `pre-sales.md`, `tour-operations.md`, `pre-tour.md`, `fleet-equipment.md`, `post-tour.md` (v0.2) (Stage 4) · `Surface_Journey_Coverage.md` (Stage 6b) · `Decision_Record_Aristotle_2026-07-20.md` · `Decision_Record_Booking_Aristotle_2026-07-20.md` · `Decision_Record_PreSales_Aristotle_2026-07-20.md` · `Decision_Record_TourOps_Aristotle_2026-07-20.md` · `Decision_Record_PreTour_Aristotle_2026-07-21.md` · `Decision_Record_Fleet_Aristotle_2026-07-21.md` · `Decision_Record_PostTour_Aristotle_2026-07-21.md` · `Decision_Record_Bacon_2026-07-21.md` (DR-BO1–6, DR-BO2a — run Bacon) |

**Rule of authority:** table wins over diagram; module spec wins over table. Surface codes (`W#`/`A#`/`G#`/`E#`/`P#`) are as defined in `Surface_Journey_Coverage.md`.

**GAP-6b-1 resolved here:** the "flagged for the Owner" error outcomes on REQ-SEO01/REQ-SEO02 render as a content-quality panel on **A6** (the existing publish-trigger surface), not a new surface — see UJ-SEO-01/02/03 below. `Surface_Journey_Coverage.md` §7 should be read together with this resolution.

---

## UJ-AUTH-01 — Operator signs in
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | Owner | Presents credentials | A1 | REQ-AUTH01 | Invalid credentials → "Sign-in failed — check your details"; stays on A1 |
| 2 | System | Validates credentials, creates a 1h `auth_session` in KV | — (backend) | REQ-AUTH01 | Session store unavailable → "Sign-in is temporarily unavailable — try again" |
| 3 | Owner | Sees operator functions | A1 → back-office | REQ-AUTH01 | — |

## UJ-AUTH-02 — Customer signed-link session
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | Customer | Opens a signed booking link | W1 | REQ-AUTH02 | Link expired → "This link has expired — request a new one" |
| 2 | System | Verifies link validity and single-booking scope, creates a 1h `auth_session` (JWT+KV, DR-2) | — (backend) | REQ-AUTH02 | Link invalid/tampered → "This link isn't valid"; booking not found → "We couldn't find that booking" |
| 3 | Customer | Sees their booking, no password required | W1 | REQ-AUTH02 | — |

## UJ-AUTH-03 — Guide device recognised
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | Guide | Device asserts `X-Device-ID` on a tour-function request | G1 | REQ-AUTH03 | Identity missing → "This device can't be identified" |
| 2 | System | Matches device to a registered guide | — (backend) | REQ-AUTH03 | Device not registered → "This device isn't registered — contact the owner" |
| 3 | Guide | Sees tour functions, scoped to their identity | G1 | REQ-AUTH03 | — |

## UJ-AUTH-04 — Session renewed on expiry
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | Owner/Customer | Makes a request under a session older than 1h | A1 / W1 | REQ-AUTH04 | (this step's normal path *is* the exception it exists to catch) |
| 2 | System | Refuses the request server-side; never trusts client-side expiry | — (backend) | REQ-AUTH04 | — |
| 3 | Owner/Customer | Sees "Your session has expired — please sign in again", redirected to A1/W1 sign-in | A1 / W1 | REQ-AUTH04 | — |

## UJ-AUTH-05 — Session revoked (logout)
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | Owner/Customer | Triggers sign-out | A2 / W2 | REQ-AUTH05 | No active session to revoke → treated as already signed out, no error shown |
| 2 | System | Removes the KV `auth_session` record immediately | — (backend) | REQ-AUTH05 | — |
| 3 | Owner/Customer | Sees they are signed out; token grants no further access | A2 / W2 | REQ-AUTH05 | — |

---

## UJ-CNA-01 — Record marketing permission
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | Prospect | Submits a form with an unticked-by-default marketing option | W4 *(presumed pre-sales surface)* | REQ-CNA01 | — |
| 2 | System | Appends a new `consents` row with source + evidence + timestamp | — (backend) | REQ-CNA01 | Neither email nor phone identifies the prospect → not recorded, "We need a contact detail to record your choice"; capture source missing → not recorded, no marketing proceeds |
| 3 | Prospect | Sees their choice recorded | W4 | REQ-CNA01 | — |

## UJ-CNA-02 — Withdraw permission
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | Customer | Cancels a marketing permission | W3 | REQ-CNA02 | — |
| 2 | System | Appends a withdrawal row; current state becomes withdrawn | — (backend) | REQ-CNA02 | No prior permission on record → still appends, treated as already-suppressed, no error shown |
| 3 | Customer | Sees they will no longer receive that marketing; suppression effective by next send cycle | W3 | REQ-CNA02 | — |

## UJ-CNA-03 — Audit money/safety action
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | System | A money/safety-critical action occurs (refund, consent change, override, incident) | — (backend, triggered by the acting module) | REQ-CNA03 | — |
| 2 | System | Appends an immutable `audit_log` entry (subject, actor, action, timestamp) | — (backend) | REQ-CNA03 | Subject or actor missing → still written, `complete=false`, never dropped |
| 3 | Owner | Reviews the entry later | A5 | REQ-CNA03 | Incomplete entries shown flagged, not hidden |

## UJ-CNA-04 — Erase dormant PII (90-day)
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | System (cron) | `gdpr-cleanup` runs, finds prospects dormant >90 days | — (backend, Cloudflare Cron) | REQ-CNA04 | Record shows recent activity → skipped, personal data left intact |
| 2 | System | Blanks personal fields, sets `deleted_at`, retains the row | — (backend) | REQ-CNA04 | — |
| 3 | System | Writes an `audit_log` entry for the erasure | — (backend, via UJ-CNA-03) | REQ-CNA04 | — |
| 4 | Owner | Can view the erasure event | A5 | REQ-CNA04 | — |

*Scope note (DR-7): this workflow covers `prospects` only. Bookings/participants PII is retained — no erasure workflow exists for them yet.*

## UJ-CNA-05 — Check permission before contact
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | System | Before a marketing send, reads current consent state for the person + purpose | — (backend, internal — no surface by design) | REQ-CNA05 | No decision on record → treated as not granted, send suppressed |
| 2 | System | Proceeds with send (E2) only if granted | — (backend) | REQ-CNA05 | — |

---

## UJ-NOTIF-01 — Transactional send
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | System | A transactional trigger fires (booking confirmed, reminder due) | — (backend, Cloudflare Cron / event) | REQ-NOTIF01 | — |
| 2 | System | Builds one message per person per event with an idempotency key | — (backend) | REQ-NOTIF01, REQ-NOTIF03 | No contact address on record → not sent, gap logged for Owner (surfaces at A3/A4) |
| 3 | System | Hands the message to the delivery provider (Postmark, interim default per D-NOTIF-2) | E1 | REQ-NOTIF01 | Provider rejects → marked failed, retried per provider policy, shown as "delivery pending" |
| 4 | Customer | Receives the confirmation/reminder | E1 | REQ-NOTIF01 | — |

## UJ-NOTIF-02 — Delivery outcome → contactability
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | System (webhook) | Provider reports an outcome (delivered/bounced/complaint) | — (backend) | REQ-NOTIF02 | Outcome references an unknown message → recorded, flagged unmatched, never dropped |
| 2 | System | Updates the person's deliverability state from the latest outcome | — (backend) | REQ-NOTIF02 | — |
| 3 | Owner | Views current deliverability / bounce status | A3 | REQ-NOTIF02 | — |

## UJ-NOTIF-03 — Suppress duplicate send
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | System | A send is attempted carrying an already-processed idempotency key | — (backend, internal — no surface by design) | REQ-NOTIF03 | Idempotency-key store unavailable → send held rather than risking a duplicate, shown as "delivery pending" |
| 2 | System | Rejects the duplicate; original send stands | — (backend) | REQ-NOTIF03 | — |
| 3 | Customer | Receives exactly one message despite the retry | E1 | REQ-NOTIF03 | — |

## UJ-NOTIF-04 — Owner actionable alert
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | System | An event needing the Owner's attention occurs (new enquiry, handoff, incident) | — (backend) | REQ-NOTIF04 | — |
| 2 | System | Sends the alert on the Owner's configured channel, never gated by marketing consent | E3 | REQ-NOTIF04 | Channel unreachable → retried, then recorded for in-app pickup |
| 3 | Owner | Sees the alert once | E3, A4 | REQ-NOTIF04 | — |

---

## UJ-SEO-01 — Crawler reads full content
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | System | Emits published tour content as crawler-readable HTML with machine-readable descriptors | P1 | REQ-SEO01 | Content incomplete (missing title/description) → still served, flagged for the Owner **on A6's content-quality panel (GAP-6b-1 resolution)** |
| 2 | Prospect / crawler | Reads the full content without executing scripts | P1 | REQ-SEO01 | — |

## UJ-SEO-02 — Advertise crawlable index
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | System | Builds an index listing every currently-published crawlable location | P2 | REQ-SEO02 | A published location absent from the index → treated as a gap, flagged **on A6's content-quality panel** |
| 2 | Crawler | Discovers all published locations from the one index | P2 | REQ-SEO02 | — |

## UJ-SEO-03 — Regenerate on manual publish
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | Owner | Triggers a manual publish on A6 | A6 | REQ-SEO03 | — |
| 2 | System | Regenerates affected public locations (P1) and the index (P2) with current content | — (backend) | REQ-SEO03 | — |
| 3 | Prospect / crawler | Sees content current as of the last manual publish | P1, P2 | REQ-SEO03 | Content changed since the last publish and no publish yet triggered → **expected behaviour per DR-10**, not an error; public content simply still reflects the prior publish |

---

## UJ-BOOK-01 — Enter booking flow, confirm selection
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | Customer | Selects tour, date, time, party size | W5 | REQ-BOOK01 | Party size exceeds capacity → "This slot doesn't have enough space" |
| 2 | System | Atomically checks and decrements departure capacity (DR-B3, D1 transactional decrement); creates a booking draft | — (backend) | REQ-BOOK01 | Departure has no remaining capacity → "This slot is no longer available — please choose another" |
| 3 | Customer | Proceeds to attendee details | W5 → W6 | REQ-BOOK01 | — |

## UJ-BOOK-02 — Provide attendee details
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | Customer | Enters attendee details and one emergency contact for the party (DR-B6) | W6 | REQ-BOOK02 | Required field missing → inline indication |
| 2 | System | Records attendee + emergency-contact data against the draft | — (backend) | REQ-BOOK02 | Slot hold expires mid-entry → entry preserved; Customer prompted to re-confirm the slot |
| 3 | Customer | Proceeds to consent | W6 → W7 | REQ-BOOK02 | — |

## UJ-BOOK-03 — Review terms, sign waiver, give consent
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | Customer | Accepts the party-level digital waiver + T&C; optionally grants marketing consent (never pre-ticked) | W7 | REQ-BOOK03 | Waiver/T&C not accepted → "Please accept the waiver and terms to continue" |
| 2 | System | Records waiver/T&C acceptance on the booking; appends any marketing-consent decision via `core-consent-audit` | — (backend, REQ-CNA01) | REQ-BOOK03 | — |
| 3 | Customer | Proceeds to payment | W7 → W8 | REQ-BOOK03 | — |

*Note (DR-B7): a second, individual paper waiver is signed by each attendee on the day at the meeting point — no workflow table exists for it yet; it belongs to a Pre-Tour/on-tour module not yet drafted (unowned ground, `Module_Map.md`).*

## UJ-BOOK-04 — Pay
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | Customer | Submits payment via the embedded Checkout form, carrying a client-generated idempotency key | W8 | REQ-BOOK04 | Card declined → "Your card was declined", retry offered |
| 2 | System | Creates the Checkout Session (`ui_mode: 'embedded'`); a repeated identical submission returns the same session, not a new one | — (backend) | REQ-BOOK04 | — |
| 3 | Customer | Completes payment inline, no redirect away | W8 | REQ-BOOK04 | — |

## UJ-BOOK-05 — Receive confirmation
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | System | Receives the provider's report that payment succeeded; checks the event id against the idempotency store | — (backend) | REQ-BOOK05 | Same event id reported again → recorded as duplicate, no second confirmation |
| 2 | System | Updates the booking to `confirmed`; capacity becomes permanently allocated | — (backend) | REQ-BOOK05 | Provider's report never arrives → booking stays `draft` until a reconciliation sweep confirms it |
| 3 | Customer | Sees the confirmation | W9 | REQ-BOOK05 | — |
| 4 | Customer | Receives the confirmation message | E1 | REQ-BOOK05 *(via REQ-NOTIF01)* | — |

## UJ-BOOK-06 — Modify an existing booking
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | Customer | Requests a date/time change on a confirmed or provisionally-confirmed booking | W10 | REQ-BOOK06 | Within the cancellation cut-off → blocked; "Changes aren't available this close to departure" |
| 2 | System | Checks capacity on the new date/time; releases the old hold and acquires the new one atomically | — (backend) | REQ-BOOK06 | New date/time has no capacity → alternatives suggested |
| 3 | Customer | Sees the change confirmed with any price difference | W10 | REQ-BOOK06 | Party-size/attendee change requested → not self-service; "Contact William to change your party size or attendee details" (DR-B4) |

## UJ-BOOK-07 — Cancel a booking and request refund
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | Customer | Requests cancellation | W10 | REQ-BOOK07 | — |
| 2 | System | Determines refund: automatic full refund if >48h; if within 48h, no automatic amount — routed to Owner (DR-B5) | — (backend) / A8 (within 48h) | REQ-BOOK07 | Refund fails at the provider → booking stays `confirmed`; "William will follow up within one business day" |
| 3 | System | Restores departure capacity | — (backend) | REQ-BOOK07 | — |
| 4 | Customer | Sees cancellation confirmed with the applicable refund (or "William will confirm your refund" if within 48h) | W10 | REQ-BOOK07 | — |

## UJ-BOOK-09 — Owner creates a booking from an enquiry
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | Owner | Opens the booking-creation surface from an agreed enquiry | A7 | REQ-BOOK08 | — |
| 2 | Owner | Sets tour, date, party size, and agreed price | A7 | REQ-BOOK08 | Agreed price differs from standard by more than a threshold discount → confirmation prompt |
| 3 | System | Creates the booking draft and a payment link at the agreed price | — (backend) | REQ-BOOK08 | — |
| 4 | Customer | Pays via the link; downstream is identical to UJ-BOOK-04/05 | (external, Stripe-hosted) | REQ-BOOK05 | — |

## UJ-BOOK-10 — Handle payment failure or booking abandonment
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | Customer | Payment fails, or the Customer abandons before paying | W8 (fails) / — (abandons) | REQ-BOOK09 | Card declined repeatedly → offered to contact William |
| 2 | System | Slot hold expires with no payment and no provisional booking taken | — (backend) | REQ-BOOK09 | — |
| 3 | System | Archives the draft as `abandoned`; releases held capacity back to the departure | — (backend) | REQ-BOOK09 | — |

## UJ-BOOK-12 — Owner creates a provisional booking from a customer's emailed request
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | Customer | Emails a request to book without paying now | — (off-system, not modelled) | *(none — outside this REQ)* | — |
| 2 | Owner | Creates the booking, setting hold duration, deposit requirement, and reminder cadence for this booking specifically (DR-B2, no system-wide default) | A7 | REQ-BOOK10 | Requested party size exceeds remaining capacity → blocked, same as REQ-BOOK01 |
| 3 | System | Marks the booking `provisionally-confirmed`; holds capacity identically to a paid confirmation | — (backend) | REQ-BOOK10 | — |
| 4 | Customer | Receives confirmation of the provisional booking and its terms | E1 | REQ-BOOK10 *(via REQ-NOTIF01)* | — |

*Note (DR-B8): if the customer's booking attempt had instead been abandoned (not provisional), a consent-gated recovery email would apply — but that REQ doesn't exist yet in `core-notifications`/`core-consent-audit` (unowned ground, `Module_Map.md`); no step above assumes it.*

## UJ-PRE-01 — Land on site and orient
*No dedicated REQ — orientation is presumed static site content (homepage, cookie banner), not a behavioural requirement of this module. Folded into W11's landing state; first behavioural step is UJ-PRE-02 below.*

## UJ-PRE-02 — Browse catalogue and shortlist
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | Prospect | Views the tour catalogue, optionally applies filters | W11 | REQ-PRE01 | No tours match filters → empty state, reset option + route to W14 (enquiry) |
| 2 | System | Serves only currently-published tours (presumed RCA read) | — (backend) | REQ-PRE01 | — |
| 3 | Prospect | Taps a tour card | W11 → W12 | REQ-PRE01 | — |

## UJ-PRE-03 — Inspect a single tour in depth
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | Prospect | Views tour detail | W12 | REQ-PRE02 | Tour `paused` → status shown, no book action, enquiry route offered |
| 2 | System | Renders detail appropriate to current status (presumed RCA read) | — (backend) | REQ-PRE02 | Tour not found (archived/bad link) → similar-tours suggestion |
| 3 | Prospect | Proceeds to book, check availability, save, or enquire | W12 → W13 / W15 / W14 / booking W5 | REQ-PRE02 | — |

## UJ-PRE-05 — Check availability for dates/party size
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | Prospect | Selects a date and party size | W13 | REQ-PRE03 | Party size >10 → blocked, routed to W14 (group enquiry) |
| 2 | System | Checks remaining capacity against the presumed `booking` read interface | — (backend) | REQ-PRE03 | All slots on selected date fully booked → next three available dates suggested |
| 3 | Prospect | Sees available slots, proceeds to booking | W13 → booking W5 | REQ-PRE03 | — |

## UJ-PRE-06 — Submit a group/corporate/private enquiry
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | Prospect | Completes and submits the enquiry form | W14 | REQ-PRE04 | Required field missing/invalid → inline validation |
| 2 | System | Creates the enquiry with an SLA due time; alerts the Owner via a daily digest (DR-P1) | — (backend, `core-notifications` REQ-NOTIF04) | REQ-PRE04 | Submission flagged spam → stored `status=spam`, no owner alert fires (DR-P2) |
| 3 | Prospect | Sees the on-screen SLA acknowledgement | W14 | REQ-PRE04 | — |
| 4 | Owner | Views the enquiry, replies via the prospect's preferred channel (off-system) | A9 | REQ-PRE05 | Overdue enquiry → stays visibly flagged; no auto-email to the prospect (DR-P3) |
| 5 | Owner | Marks the enquiry responded | A9 | REQ-PRE05 | — |
| 6 | Owner | *(Optionally)* converts the enquiry into a booking | A9 → booking A7 | *(via `booking` REQ-BOOK08)* | — |

## UJ-PRE-08 — Save / return later
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | Prospect | Saves a tour by email, optionally opts into the follow-up nudge (never pre-ticked) | W15 | REQ-PRE06 | Invalid/missing email → inline validation |
| 2 | System | Creates the saved-tour record; sends the transactional tour-summary email regardless of nudge consent | E4 | REQ-PRE06 | — |
| 3 | System | At +3 days, if `pending` and not yet booked, re-checks marketing consent (REQ-CNA05) and deliverability | — (backend) | REQ-PRE07 | Consent withdrawn or tour already booked → nudge suppressed, no error shown |
| 4 | System | Sends the nudge if consent still holds | E4 | REQ-PRE07 | — |

## UJ-PRE-09 — Convert, enter booking flow
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | Prospect | Taps a "Book" action from any Pre-Sales surface (W11–W15) | W11–W15 | REQ-PRE08 | — |
| 2 | System | Hands over all known context (tour, date, time, party size, email) | — (backend) | REQ-PRE08 | — |
| 3 | Prospect | Enters `booking` pre-filled | booking W5 | REQ-BOOK01 *(consumes REQ-PRE08's handover)* | — |

*Deferred (no workflow authored): UJ-PRE-04 (ask the concierge), UJ-PRE-07 (concierge handoff) — both depend on the not-yet-built concierge stack.*

## UJ-OPS-01 — Receive tour assignment and prepare
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | Guide | Opens the tour-day home, views today's assignment and rider list | G2 | REQ-OPS01 | Assignment missing/wrong → Guide contacts Owner, tour blocked |
| 2 | System | Surfaces weather/route data and any health-flag incompatibility | — (backend, presumed Met Office/TfL) | REQ-OPS01 | Health flag incompatible → flagged to Owner before further prep |
| 3 | Guide | Proceeds to pre-tour checks | G2 → G3 | REQ-OPS01 | — |

## UJ-OPS-02 — Travel kit check
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | Guide | Works through the kit checklist by category | G3 | REQ-OPS02 | — |
| 2 | Guide | Signs off (typed-confirm, DR-O1) | G3 | REQ-OPS02 | Critical item missing → blocked; partial required quantity → blocked or noted with Owner approval |
| 3 | System | Unlocks bike inspection | — (backend) | REQ-OPS02 | — |

## UJ-OPS-03 — Bike inspection
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | Guide | Inspects each assigned bike against five roadworthiness checks | G4 | REQ-OPS03 | A bike fails → marked out of service; DR-O3 status workflow applies |
| 2 | Guide | Signs the declaration once all bikes processed (full signature, DR-O1) | G4 | REQ-OPS03 | Multiple failures, no replacement → party size reduced (logged in REQ-OPS04) |
| 3 | System | Records bike status; unlocks risk assessment | — (backend) | REQ-OPS03 | Bike previously flagged, not cleared → cannot be assigned (**GAP-6b-3** — no Owner-clear REQ authored yet) |

## UJ-OPS-04 — Dynamic risk assessment and decisions log
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | Guide | Reviews pre-populated weather/route/readiness conditions | G5 | REQ-OPS04 | High-severity weather → escalation to Owner for possible cancellation prompted |
| 2 | Guide | Records day-specific decisions and mitigations, tags items for the briefing | G5 | REQ-OPS04 | An item required for safe departure cannot be confirmed → sign-off blocked |
| 3 | Guide | Signs off (typed-confirm, DR-O1) | G5 | REQ-OPS04 | — |

## UJ-OPS-05 — Rider check-in
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | Guide | Opens each rider's check-in card, confirms bike/equipment fit and health/suitability | G6 | REQ-OPS05 | New incompatible medical condition, visible impairment, unaccompanied minor → refused |
| 2 | Rider | Re-confirms the liability waiver with a fresh signature (full signature, DR-O1; corrects DR-B7) | G6 | REQ-OPS05 | Refuses to re-confirm → refused |
| 3 | Guide | Marks the rider `cleared`; repeats for remaining riders | G6 | REQ-OPS05 | Refusal case → flagged for Owner-processed refund (DR-O4), not guide-triggered |
| 4 | Guide | Signs the all-riders declaration once every rider is processed | G6 | REQ-OPS05 | — |

## UJ-OPS-06 — Safety briefing delivery
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | Guide | Delivers all six briefing sections, with day-specific mitigations from G5 shown inline | G7 | REQ-OPS06 | Rider raises an issue mid-briefing → pause, resolve, resume from the relevant section |
| 2 | Guide | Confirms delivery and that questions were answered | G7 | REQ-OPS06 | Rider refuses to acknowledge a required rule → refused (via REQ-OPS05) |

## UJ-OPS-07 — Final pre-departure sign-off
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | Guide | Reviews the readiness summary across all prior gates | G8 | REQ-OPS07 | Any outstanding flag → sign-off blocked until resolved |
| 2 | Guide | Signs the departure sign-off | G8 | REQ-OPS07 | Significantly delayed departure (>30 min) → confirm shortened route or contact Owner |
| 3 | System | Saves the `tour_readiness` record; hands over to GMT's tour start | — (backend; presumed GMT) | REQ-OPS07 | — |

## UJ-OPS-08 — Manage a mid-tour participant issue
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | Guide | Stops the group at a safe location, assesses the issue | G9 | REQ-OPS08 | — |
| 2 | Guide | Logs the event (mechanical/illness/early-leave) and the resolution chosen | G9 | REQ-OPS08 | Issue assessed as an emergency → escalates to REQ-OPS09 instead |
| 3 | Guide | Resumes the tour with an adjusted manifest | G9 | REQ-OPS08 | — |

## UJ-OPS-09 — Respond to an incident
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | Guide | Ensures scene safety, assesses casualties, calls 999 (and FOB ops) | — (off-system, per playbook protocol) | REQ-OPS09 | No mobile signal → seeks help via a passer-by |
| 2 | Guide | Logs the preliminary incident record | G10 | REQ-OPS09 | — |
| 3 | System | Notifies the Owner via `core-notifications` REQ-NOTIF04 | — (backend) | REQ-OPS09 | — |

## UJ-OPS-10 — Complete post-ride review
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | Guide | Completes the structured review (hazards, incidents/near-misses, quality assessment, actions required) | G11 | REQ-OPS10 | Cannot complete immediately → saved as draft, reminder before 24h deadline |
| 2 | Guide | Submits, triggering ticked downstream actions | G11 | REQ-OPS10 | Significant un-flagged issue mentioned in free text → confirmation prompt before submitting |
| 3 | System | Applies downstream actions (bike-service flag, incident-report trigger, etc.) | — (backend) | REQ-OPS10 | — |

## UJ-OPS-11 — File incident report and insurer notification
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | Guide | Submits the formal incident report (full narrative) | G12 | REQ-OPS11 | Submission beyond the 2h statutory window → logged as a process exception |
| 2 | Owner | Reviews, adds notes if needed | A10 | REQ-OPS12 | Insurer responds with questions → Owner adds info, resubmits |
| 3 | Owner | Approves for insurer dispatch | A10 | REQ-OPS12 | **D-OPS-5 still open** — dispatch mechanics are a stub pending confirmed insurer format |

## UJ-OPS-12 — Update the route hazard log
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | Guide | Submits a hazard observation | G13 | REQ-OPS13 | — |
| 2 | Owner | Reviews, deduplicates against existing entries by street | A11 | REQ-OPS14 | Already logged → `last_confirmed_at` bumped, no new entry |
| 3 | Owner | Approves into the hazard log, sets severity | A11 | REQ-OPS14 | High-severity/briefing-relevant → briefing content updated (consumed by REQ-OPS06) |

*GMT's own navigation journeys (UJ-GMT-01–10) are presumed, not workflowed here — they belong to a separate, already-designed tool.*

## UJ-TOUR-01 — Access the tour-day information hub
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | Customer | Opens the tour hub (via manage-booking session) | W16 | REQ-TOUR01 | Booking cancelled → shows cancelled status + remediation outcome |
| 2 | Customer | Reviews booking details, status, and available actions | W16 | REQ-TOUR01 | Tour date passed → completed state shown |

## UJ-TOUR-02 — Receive scheduled pre-tour reminders
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | System | Scheduled check finds the T-1 milestone due and unsent (DR-T1) | — (backend) | REQ-TOUR02 | Booking cancelled before the milestone → suppressed |
| 2 | System | Sends the reminder via `core-notifications` REQ-NOTIF01 | E5 | REQ-TOUR02 | — |
| 3 | Customer | Reads the reminder, deep-links to the tour hub | E5 → W16 | REQ-TOUR02 | — |

## UJ-TOUR-03 — Receive a weather advisory
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | System | Forecast evaluated against threshold rules (informational-only, D-TOUR-3 deferred) | — (backend, Met Office API) | REQ-TOUR03 | Weather source unavailable → falls back to manual Owner review |
| 2 | System | Sends the advisory | E5 | REQ-TOUR03 | Duplicate advisory within the suppression window → not resent unless severity escalates |
| 3 | Customer | Reads the advisory; tour hub reflects weather-watch status | E5 → W16 | REQ-TOUR03 | — |

## UJ-TOUR-04 — Update attendee details or special requirements
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | Customer | Edits a non-financial field | W17 | REQ-TOUR04 | Attempts a date/party-size change → blocked, routed to W10 (`booking` REQ-BOOK06) |
| 2 | System | Saves the change; alerts the Owner if safety-significant (DR-T4) | — (backend) | REQ-TOUR04 | — |
| 3 | Customer | Sees the update reflected in the tour hub | W16 | REQ-TOUR04 | — |

## UJ-TOUR-06 — Receive an operator-initiated change
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | Owner | Edits meeting point/time/guide in the back-office (out of this module) | — | REQ-TOUR05 | — |
| 2 | System | Sends the change notice with an explicit old-vs-new comparison | E5 | REQ-TOUR05 | Change within 24h of the tour → escalated urgency, more channels |
| 3 | Customer | Reads the notice; acknowledges if material | W18 | REQ-TOUR06 | No acknowledgement within 24h → reminder sent, Owner sees it as outstanding |

## UJ-TOUR-07 — Receive an operator-initiated cancellation
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | Owner | Cancels the tour (out of this module) | — | REQ-TOUR07 | — |
| 2 | System | Sends the cancellation notice via every available channel with remediation options (DR-T5) | E5 | REQ-TOUR07 | — |
| 3 | Customer | Chooses remediation: refund, rebook, or credit | W19 | REQ-TOUR08 | No choice within the window → default remediation applied; rebook with no alternative date → credit auto-applied with apology |
| 4 | System | Triggers the chosen remediation via `booking` | — (backend, REQ-BOOK07 or equivalent) | REQ-TOUR08 | — |

## UJ-TOUR-08 — Day-of preparation and arrival
*No step-table — DR-T1's light-cadence ruling removed the T-0 milestone that would have driven this journey's system-side step (GAP-6b-4). The customer-side travel/arrival steps have no system requirement backing them; this is a deliberate carried hole, not an oversight.*

## UJ-TOUR-09 — Notify operator of late arrival
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | Customer | Submits a late-arrival notice with an estimated time, within the per-tour grace window (DR-T6) | W20 | REQ-TOUR09 | Cannot reach the surface → the FOB ops number (DR-T7) is the documented fallback |
| 2 | System | Notifies the Guide and Owner | — (backend) | REQ-TOUR09 | — |
| 3 | Guide | Decides whether to hold or proceed | *(via `tour-operations`)* | *(`tour-operations`'s concern)* | — |

## UJ-TOUR-10 — No-show / non-arrival handling
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | System | Detects missing attendees beyond the grace period, via `tour-operations`' `rider_checkins` | — (backend) | REQ-TOUR10 | A late-arrival notice (REQ-TOUR09) arrives after start → logged but doesn't override the no-show |
| 2 | System | Applies the no-show policy (manual, Owner-decided, per DR-T8) | — (backend) | REQ-TOUR10 | — |
| 3 | Customer | Is notified of the no-show and any remediation | E5 | REQ-TOUR10 | — |

## UJ-FLEET-01 — Onboard a bike to the fleet
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | Owner | Enters identifier, make/model/frame/colour, route eligibility (no photo, DR-F5) | A12 | REQ-FLEET01 | Duplicate identifier → blocked, next-sequential suggested |
| 2 | System | Creates the bike record, `in-service`, immediately available | — (backend) | REQ-FLEET01 | — |

## UJ-FLEET-02 — Onboard or replace safety equipment
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | Owner | Enters equipment details line-by-line, with description (DR-F10, no bulk, no photo) | A13 | REQ-FLEET02 | Helmet impact → immediate retirement regardless of review status |
| 2 | System | If a replacement, retires the prior item with a reason; sets a helmet/first-aid annual review reminder (DR-F2) | — (backend) | REQ-FLEET02 | — |

## UJ-FLEET-03 — View fleet & equipment status
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | Owner | Views the fleet & equipment readiness view | A14 | REQ-FLEET03 | — |
| 2 | Owner | Drills into an alert or item | A14 → A15 / A16 | REQ-FLEET03 | — |

## UJ-FLEET-04 — Handle a flagged bike: out of service → maintain → return
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | System | Records a service flag from `tour-operations`' inspection (REQ-OPS03), a post-ride review, or an Owner-direct flag | — (backend) | REQ-FLEET04 | — |
| 2 | Owner | Opens the flagged bike's detail | A15 | REQ-FLEET04 | — |
| 3 | Owner | Logs a maintenance event (in-house work only, no photo, DR-F5/F9) | A15 | REQ-FLEET05 | — |
| 4 | Owner | Sets the bike back to `in-service` | A15 | REQ-FLEET06 | Same bike flagged 3+ times in 90 days → pattern alert surfaced, not blocking |

*No step exists for `awaiting-external-service` or `retired` transitions — declared holes (DR-F8, DR-F9), not modelled this pass.*

## UJ-FLEET-05 — Track compliance dates and renewals
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | System | Daily check evaluates each compliance item | — (backend, Cloudflare Cron) | REQ-FLEET07 | — |
| 2 | System | Sends a single on-event alert only if the item's classification just changed (DR-F7) | E6 | REQ-FLEET07 | — |
| 3 | Owner | Reviews the compliance view, renews as needed | A16 | REQ-FLEET08 | — |

*UJ-FLEET-06 (retire/dispose an asset) has no step-table — not a stub, but dropped from core scope entirely (DR-F8, 2026-07-21). Handled off-system.*

## UJ-POST-01 — Receive thank-you and tour summary
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | System | Confirms the booking is `completed` and review-request was ticked (`tour-operations` REQ-OPS10) | — (backend) | REQ-POST01 | Booking was a no-show or operator-cancelled → no thank-you sent |
| 2 | System | Sends the thank-you at T+12h (transactional, DR-PT3) | E7 | REQ-POST01 | — |
| 3 | Customer | Reads; may follow the review or feedback link | E7 → E8 / W21 | REQ-POST01 | — |

## UJ-POST-02 — Submit a public review
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | System | Sends the review request at T+24h | E8 | REQ-POST02 | — |
| 2 | Customer | Leaves a review on TripAdvisor/Google, or routes to private feedback | (external) / W21 | REQ-POST02 | — |

## UJ-POST-03 — Submit internal feedback
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | Customer | Submits ratings + optional free text | W21 | REQ-POST03 | — |
| 2 | System | Stores the feedback; alerts the Owner directly if overall rating ≤3★ (DR-PT2) | — (backend, `core-notifications`) | REQ-POST03 | — |

*UJ-POST-05 (formal recovery logging), UJ-POST-06 (public review monitoring/response in-system), UJ-POST-07 (repeat-booking nudge), UJ-POST-08 (lapsed re-engagement), UJ-POST-09 (marketing campaigns) have no step-tables — deferred to a future phase (sponsor decision 2026-07-21), not this pass.*

## UJ-POST-10 — Manage marketing preferences / unsubscribe
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | Customer | Opens the signed preferences link from any retention message | W3 | REQ-POST10 | Link expired/tampered → "This link has expired — request a new one," rate-limited |
| 2 | Customer | Updates granular preferences or unsubscribes from all | W3 | REQ-POST10 | — |
| 3 | System | Appends the consent record (`core-consent-audit` REQ-CNA01); future sends respect it immediately | — (backend) | REQ-POST10 | — |

## UJ-BO-01 — Owner schedules a departure *(run Bacon)*
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | Owner | Sets tour, date, time, capacity, and (optionally) guide | A18 | REQ-BOOK11 | Capacity >10 → "A departure can hold at most 10 riders" |
| 2 | System | Creates the departure (`status=scheduled`, 0 booked); flags "not ready to run" if no guide (DR-BO5) | — (backend) | REQ-BOOK11 | Duplicate `(tour,date,time)` → "That tour is already scheduled at that time" |
| 3 | Owner | Sees the departure on the calendar, open for booking | A17 | REQ-BOOK11 · REQ-BO04 | — |

## UJ-BO-02 — Owner updates a departure *(run Bacon)*
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | Owner | Edits time/capacity/guide on an existing departure | A18 | REQ-BOOK12 | Capacity below current bookings → blocked, "N riders are already booked — capacity can't go below that" |
| 2 | System | Applies the data change; a material date/time change on a booked departure is detected (no stored flag) | — (backend) | REQ-BOOK12 | — |
| 3 | System | *(back-office orchestration, not booking)* on a material change, sends the operator-change notice | E5 | REQ-TOUR05 | — |
| 4 | Customer | Receives the change notice; acknowledges if material | W18 → E5 | REQ-TOUR06 | No acknowledgement within 24h → reminder; Owner sees it outstanding |

## UJ-BO-03 — Owner cancels a departure *(run Bacon)*
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | Owner | Cancels a departure | A18 | REQ-BOOK13 | — |
| 2 | System | Marks it `cancelled` and unbookable; releases held+confirmed capacity | — (backend) | REQ-BOOK13 | — |
| 3 | System | *(back-office orchestration)* routes each booking to operator-cancellation remediation | — (backend) | REQ-TOUR07 → REQ-BOOK07 | A booking's refund fails → booking stays, flagged for follow-up (not silently stranded) |
| 4 | Customer | Chooses remediation (refund / rebook / credit) | W19 → E5 | REQ-TOUR08 | No choice within window → default remediation applied |

## UJ-BO-04 — Owner views the departure calendar *(run Bacon)*
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | Owner | Opens the calendar for a date range | A17 | REQ-BO04 | No departures in range → "No departures scheduled in this range" (empty state, not an error) |
| 2 | System | Renders each departure with fill (booked/capacity) and readiness (derived: scheduled + guide + bikes) | — (backend) | REQ-BO04 | — |
| 3 | Owner | Drills into a departure → scheduler (edit) or bike allocation | A17 → A18 / A20 | REQ-BO04 | — |

## UJ-BO-05 — Owner searches bookings *(run Bacon)*
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | Owner | Searches by reference / customer / tour / date / status | A19 | REQ-BO05 | No matches → "No bookings match these criteria" |
| 2 | System | Returns matching bookings, never exposing card data (provider references only) | — (backend) | REQ-BO05 | — |

## UJ-BO-06 — Owner views a booking's details *(run Bacon)*
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | Owner | Opens a booking (from search, or by reference) | A19 | REQ-BO06 | Reference not found → "No booking found for that reference" |
| 2 | System | Shows attendees, emergency contact, payment/refund references, consent/waiver timestamps, status history | — (backend; reads `core-consent-audit`) | REQ-BO06 | — |

## UJ-BO-07 — Owner allocates bikes to a tour *(run Bacon; DR-BO2a resolved — booking owns `bike_assignments`)*
| Step | Actor | Action | Surface | REQ | Exception path |
|---|---|---|---|---|---|
| 1 | Owner | Opens bike allocation for a departure; the *available* list shows in-service, route-eligible bikes not already out on an overlapping departure (read from `fleet-equipment`) | A20 | REQ-BOOK14 | Bike flagged/out-of-service → "FOB-00X is out of service — choose another"; already on an overlapping departure → "FOB-00X is already out on another tour at that time" |
| 2 | System | Records the assignment in `bike_assignments` (booking-owned); running "N of M riders covered" updates | — (backend) | REQ-BOOK14 | Fewer bikes than booked riders → saved, flagged under-provisioned (feeds A17 readiness), not blocked |
| 3 | Guide | Finds the assigned bikes when starting the pre-tour bike inspection — now a real read, no longer a presumption (resolves F-BO-3) | G2 / G4 | *(consumed by REQ-OPS03, reads active `bike_assignments`)* | — |

## Deliberate stubs (no step-table — infrastructure/design-asset, not behavioural journeys)

| UJ id | Disposition | Realised at |
|---|---|---|
| UJ-DATA-01 · Apply migration in order | Infrastructure — no actor-level REQ | Stage 6d (architecture allocation) |
| UJ-DATA-02 · Persist via one access pattern | Infrastructure — architecture constraint | Stage 6d |
| UJ-DS-01 · Surface renders from design system | Design asset — consumed by App modules | Stage 6e (wireframes) |
| UJ-DS-02 · Token change propagates | Design asset — single-source maintenance rule | Stage 6e |

---

## Revision History

| Version | Date/Time (ISO 8601) | Summary |
|---------|----------------------|---------|
| 0.1 | 2026-07-20T00:00:00Z | Initial workflows: 17 step-tables (5 AUTH, 5 CNA, 4 NOTIF, 3 SEO), 4 deliberate infrastructure/design-asset stubs. Resolves GAP-6b-1 (content-quality flags render on A6). |
| 0.2 | 2026-07-20T00:00:00Z | Added `booking`'s 10 step-tables (UJ-BOOK-01–07, 09, 10, 12). Both unowned-ground gaps (on-day waiver, abandonment email) explicitly noted at their nearest workflow step, not silently assumed. |
| 0.3 | 2026-07-20T00:00:00Z | Added `pre-sales`'s 6 step-tables (UJ-PRE-02, 03, 05, 06, 08, 09) plus a note for UJ-PRE-01 (no dedicated REQ, folded into W11). Concierge journeys (UJ-PRE-04/07) noted as deferred, no workflow authored. |
| 0.4 | 2026-07-20T00:00:00Z | Added `tour-operations`'s 12 step-tables (UJ-OPS-01–12). GAP-6b-3 (Owner-clears-flagged-bike, no authored REQ) noted at its nearest step (UJ-OPS-03). GMT's navigation journeys noted as presumed, no workflow authored. |
| 0.5 | 2026-07-21T00:00:00Z | Added `pre-tour`'s 8 step-tables (UJ-TOUR-01–04, 06, 07, 09, 10). UJ-TOUR-08 explicitly marked as a deliberate carried hole (no step-table) — DR-T1's light-cadence ruling removed the requirement that would have driven it. |
| 0.6 | 2026-07-21T00:00:00Z | Added `fleet-equipment`'s 5 step-tables (UJ-FLEET-01–05). UJ-FLEET-04 formally resolves the GAP-6b-3 lineage (Owner-clears-flagged-bike, now REQ-FLEET06 on A15). UJ-FLEET-06 noted as dropped from scope (DR-F8), not a stub. |
| 0.7 | 2026-07-21T00:00:00Z | Added `post-tour`'s 4 step-tables (UJ-POST-01, 02, 03, 10) for its tight scope. UJ-POST-05–09 noted as deferred to a future phase (sponsor decision 2026-07-21), not stubs. |
| 0.8 | 2026-07-21T00:00:00Z | **Run Bacon (`back-office`).** Added 7 step-tables (UJ-BO-01–07). UJ-BO-02/03 show the acyclic split explicitly — booking does the departure data-op, back-office orchestrates the `pre-tour` customer notice/remediation. UJ-BO-07 marks that bike allocation is not live until DR-BO2a rules the `bike_assignments` owner. |
| 0.9 | 2026-07-21T00:00:00Z | **DR-BO2a resolved (booking owns).** UJ-BO-07 now live — writes `bike_assignments` via REQ-BOOK14; step 3 (guide finds assigned bikes) is now a real read of active assignments, resolving the F-BO-3 presumption. |
