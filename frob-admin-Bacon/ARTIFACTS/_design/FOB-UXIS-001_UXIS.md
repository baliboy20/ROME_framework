# FOB — UX Interaction Specification (UXIS)

| Field | Value |
|-------|-------|
| **Document UID** | FOB-UXIS-001 |
| **Template** | T6f UXIS v0.1 (`ROME-PIPELINE-006`) |
| **Version** | 0.1 — DRAFT |
| **Date** | 2026-07-22T00:00:00Z |
| **Covers** | Back-office console (A1–A20, PC/iMac wide-screen) · Guide app (G1–G13, iOS PWA, issued mobile/tablet) |
| **Mockups** | `Admin System.dc.html` · `Guide App.dc.html` |
| **Companion** | `Handover_AllModules_…Aristotle` (§3 admin, §4 guide) · `Handover_BackOffice_…Bacon` (A17–A20) |
| **Boundary** | Behavioural, not visual. Colours, type, spacing, brand live in the FOB design system, not here. |
| **Precedence** | module spec (REQ) → Decision Record → Part B (UXD) → Part A (UXC) → the pixels |

> **Silence rule.** A surface with no Part B (UXD) entry is governed *entirely* by Part A. Silence = "defaults apply", and is checkable: every interaction is either *conforming* (silent) or *excepted* (has a UXD record). Anything unclassifiable is a finding.

---

## §A — Universal Interaction Conventions

Source key: **D** = derived (REQ/DR) · **R** = ratified project default · **P** = proposed default (awaiting Gate-6 ratification).

### A1 · Navigation (UXC-NAV-*)
| ID | Convention | Source |
|---|---|---|
| UXC-NAV-1 | In-app navigation returns to the previous surface with state intact; it never re-submits a committed action. | P |
| UXC-NAV-2 | Post-commit surfaces (confirmations, "saved", "submitted", "signed off") are terminal targets — returning from them never re-triggers the commit. | P |
| UXC-NAV-3 | The console is a single persistent shell (left nav + top bar); screens swap in the content region. Nav selection is a client-only transient (`active-screen`), not an entity state. | R |
| UXC-NAV-4 | Deep-linked/drilled context (e.g. A17 → A18/A20 for a specific departure) pre-fills the target; missing context renders empty controls, never an error. | D (UJ-BO-04) |

### A2 · Screens & pages (UXC-SCR-*)
| ID | Convention | Source |
|---|---|---|
| UXC-SCR-1 | Initial focus lands on the first incomplete/interactive element of the surface. | P |
| UXC-SCR-2 | In-progress input is preserved across interruption (navigation, refresh, session return) wherever the flow permits return — booking forms (A7), guide sign-offs, draft reviews (G11). | D (REQ-BOOK, G11 draft-save) |
| UXC-SCR-3 | Every list surface declares loading / ready / empty states; empty copy is informational, never an error (e.g. A17 "No departures scheduled in this range"). | D (A3/A4/A17 empty states) |

### A3 · Modals & popups (UXC-MOD-*)
| ID | Convention | Source |
|---|---|---|
| UXC-MOD-1 | Destructive or money-moving confirms are blocking modals dismissed **only** by an explicit choice — never by scrim-click or Escape. | D (A8, A18 cancel) |
| UXC-MOD-2 | Modals trap focus and return it to the trigger on close. | P |
| UXC-MOD-3 | Informational / read-only overlays (A17 departure detail, A17 participant detail) dismiss freely (scrim-click, Escape, close). | R |
| UXC-MOD-4 | Overlays may stack at most one level (participant detail over departure detail); the deeper overlay closes back to the shallower, not to the surface. | P |

### A4 · Components (UXC-CMP-*)
| ID | Convention | Source |
|---|---|---|
| UXC-CMP-1 | Every interactive element exposes default / hover-or-press / disabled / focus states. Press feedback is tint/brightness, never scale. | D (design system) |
| UXC-CMP-2 | Actions that trigger server work show an in-progress state and are not re-triggerable while pending. | P |
| UXC-CMP-3 | A single-select filter group (FilterChip rows, view/mode toggles) has exactly one active member at a time. | R |
| UXC-CMP-4 | Money is always rendered pence-accurate in the serif face; card numbers are never rendered anywhere (amount + status + provider reference only). | D (Bacon §1) |

### A5 · UI states (UXC-STA-*)
| ID | Convention | Source |
|---|---|---|
| UXC-STA-1 | Every data-loading surface has loading / ready / empty / error states. | P |
| UXC-STA-2 | UI state machines map to entity lifecycle states (StatusPill: succeeded/requires_payment/refunded/failed/no_show/draft). Client-only transients (nav selection, sidebar collapse, tree expand, calendar view) are named and flagged, never smuggled in as entity states. | D |
| UXC-STA-3 | Data-model states with no screen/flow driving them (`retired`, `awaiting_external_service` bikes) may be *counted/labelled* but expose no transition control. | D (known gap) |

### A6 · Forms & validation (UXC-FRM-*)
| ID | Convention | Source |
|---|---|---|
| UXC-FRM-1 | Format validation fires on blur; required-field validation on submit attempt; never on first keystroke. | P |
| UXC-FRM-2 | Error messages are inline, adjacent to the field, using the REQ error-pair wording verbatim. | D |
| UXC-FRM-3 | Submit is disabled only for unmet *blocking* conditions, with the reason stated adjacent (A12 duplicate id, A18 capacity, G3/G5 typed name, G8 outstanding, G12 narrative). | D |
| UXC-FRM-4 | Marketing-consent controls are never pre-ticked, anywhere. | D (global convention) |
| UXC-FRM-5 | Capacity/party controls never exceed 10 per departure. | D (REQ-BOOK) |

### A7 · Feedback & notifications (UXC-FBK-*)
| ID | Convention | Source |
|---|---|---|
| UXC-FBK-1 | Every REQ outcome observable by an actor has exactly one primary feedback channel (page / inline / email). | P |
| UXC-FBK-2 | Exception copy reassures — states what happened, what is preserved, and the next step. | P |
| UXC-FBK-3 | Owner alerts surface in the A4 inbox; an unreachable channel is recorded there as a fallback rather than lost. | D (A4) |
| UXC-FBK-4 | Enquiry owner-notification is a daily digest (A9); no WhatsApp channel (not built). | D (A9) |

### A8 · Motion (UXC-MOT-*)
| ID | Convention | Source |
|---|---|---|
| UXC-MOT-1 | All motion uses the shared token durations/easings; transitions are short (sidebar width, progress bar, calendar view swap). | P |
| UXC-MOT-2 | `prefers-reduced-motion` replaces all movement with instant transitions — no exceptions. | R |
| UXC-MOT-3 | Motion is feedback, never decoration: nothing animates unless it communicates a state change. | R |

### A9 · Errors & empty states (UXC-ERR-*)
| ID | Convention | Source |
|---|---|---|
| UXC-ERR-1 | Every declared error/empty state offers a recovery or onward action; dead ends are defects. | P |
| UXC-ERR-2 | Security-sensitive failures are generic on screen (anti-enumeration); detail goes to the owner-side queue (A3/A4/A5). | D (UXC-ERR pattern) |
| UXC-ERR-3 | Incomplete records are shown flagged, never hidden (A5 audit missing-actor; A6 content-quality flags). | D (A5, A6) |

### A10 · Responsive & devices (UXC-RSP-*)
| ID | Convention | Source |
|---|---|---|
| UXC-RSP-1 | Back-office (A-surfaces) targets **PC/iMac fixed wide-screen only** — multi-column tables and side-by-side panels are in-scope; no mobile/responsive obligation. | D (Bacon §1, DR) |
| UXC-RSP-2 | Guide app (G-surfaces) targets an **issued mobile/tablet device as an iOS PWA**, single-column, thumb-reachable. | D (§4 + user) |
| UXC-RSP-3 | Touch targets ≥ 44×44px on any guide-app surface. | P |

### A11 · Accessibility (UXC-A11Y-*)
| ID | Convention | Source |
|---|---|---|
| UXC-A11Y-1 | Every interaction is keyboard-operable; no pointer-only affordances (collapsed-nav tooltips duplicate the label, not replace it). | P |
| UXC-A11Y-2 | State changes and feedback announce via live regions, not visually alone (coverage counters, readiness, sign-off results). | P |
| UXC-A11Y-3 | WCAG AA contrast minimum; status is never colour-alone — always a text label (StatusPill, readiness badges). | D (design system) |

---

## §B — Navigation map (UXD-NAV-MAP)

| Route / entry | Surface | Device | Entry points | Access guard → REQ |
|---|---|---|---|---|
| Sign-in gate | A1 | PC | app root when no session | none (public) |
| Console shell | A2 (sign-out) | PC | top-bar "Sign out" → gate w/ idempotent notice | operator session |
| Payments | A8 | PC | nav · default screen | operator session |
| New booking | A7 | PC | nav | operator session |
| Enquiries | A9 | PC | nav | operator session |
| Departure calendar | A17 | PC | nav | operator session · REQ-BO04 |
| Schedules | A18 | PC | nav · A17 row/Edit | operator session · REQ-BOOK11/12/13 |
| Bike allocation | A20 | PC | nav · A17 "Bikes" | operator session · REQ-BOOK14 |
| Bookings (master) | A19 | PC | nav | operator session · REQ-BO05 (read-only) |
| Bookings (detail) | A19 | PC | Bookings row select · back to master | operator session · REQ-BO06 (read-only) |
| Edit booking | A23 | PC | A19 Detail "Edit" action | operator session · REQ-BOOK15/16 |
| Owner alerts / Deliverability / Audit | A4 / A3 / A5 | PC | nav | operator session |
| Publish & quality | A6 | PC | nav | operator session |
| Incidents / Hazard log | A10 / A11 | PC | nav | operator session |
| Fleet readiness / Add bike / Equipment / Flagged-bike / Compliance | A14 / A12 / A13 / A15 / A16 | PC | nav | operator session |
| Tour-day home | G2 | Guide | app root (device-identity implicit, G1) | device identity (DEV-EMMA-01) |
| Playbook steps | G3–G8 | Guide | G2 step rows | device identity |
| During-tour | G9 / G10 | Guide | G2 "During the tour" | device identity |
| After-tour | G11 / G12 / G13 | Guide | G2 "After the tour" | device identity |

---

## §B — Fine-Grained Definitions (UXD-*)

#### UXD-01 — Refund dialog (cumulative)
- **surfaces:** A8
- **trigger:** high-stakes (money)
- **overrides:** none — conforms to UXC-MOD-1; recorded for precision
- **serves:** A8 · payment/refund management
- **behaviour:** Row "Refund" (succeeded rows) or "View" opens a blocking modal. Fields: Paid, Refunded-so-far (display), Refund amount (entry). A live "Cumulative refunded after this" recomputes on input. Confirm label reflects the entered amount ("Refund £X"). On confirm, the row's refunded total increments (cumulative, not latest-only) and status → refunded. Dismiss only by Cancel or Confirm.
- **states:** entry / computing-preview (client transient) / committed.
- **rationale:** money movement; cumulative total must never be misread as the latest single refund.
- **mockup-ref:** `Admin System.dc.html` A8.

#### UXD-02 — Within-48h refund shows no calculated amount
- **surfaces:** A8 (policy), W10 (customer side, out of these mockups)
- **trigger:** high-stakes (money) — deliberate omission
- **overrides:** UXC-FBK-1 (no computed amount surfaced)
- **serves:** cancellation/refund policy
- **behaviour:** Within-48h cancellations present no system-calculated refund figure; William decides case-by-case. The absence is intentional and must not be "fixed" by showing a computed amount.
- **states:** n/a.
- **rationale:** avoids implying an automated entitlement that does not exist.
- **mockup-ref:** none yet (policy note; not a screen control).

#### UXD-03 — Departure date/time change fan-out confirm
- **surfaces:** A18
- **trigger:** high-stakes (customer impact)
- **overrides:** none — conforms to UXC-MOD-1
- **serves:** REQ-BOOK12 · UJ-BO-02
- **behaviour:** Saving an edit to a departure that has bookings raises a blocking confirm: "This will notify N customers of the change. Continue?" (N = current booked count). Confirm proceeds and saves; Back cancels with no change. Dismiss only by explicit choice.
- **states:** guard-open / confirmed-saved.
- **rationale:** a schedule change silently notifying real customers is money/reputation-adjacent.
- **mockup-ref:** `Admin System.dc.html` A18.

#### UXD-04 — Departure cancellation remediation fan-out
- **surfaces:** A18
- **trigger:** high-stakes (money/legal)
- **overrides:** none — conforms to UXC-MOD-1
- **serves:** REQ-BOOK13 · UJ-BO-03
- **behaviour:** "Cancel departure" (edit mode only) raises a blocking confirm: "This will offer refund / rebook / credit to the N customers already booked. Continue?" Confirm triggers the customer remediation flow behind the scenes (not shown on this screen) and clears the departure. Destructive styling; explicit-choice dismissal only.
- **states:** guard-open / cancelled.
- **rationale:** initiates a downstream money-moving fan-out.
- **mockup-ref:** `Admin System.dc.html` A18.

#### UXD-04a — Schedules master/detail (A18 layout, 2026-07-26)
- **surfaces:** A18
- **trigger:** novel (presentation convention; behaviour of UXD-03/04 unchanged)
- **overrides:** none — supersedes the earlier dropdown-selector layout
- **serves:** REQ-BOOK11/12/13 · UJ-BO-02/03
- **behaviour:** A18 is a **master/detail** screen. The master (left) is a selectable list of scheduled departures (tour · date · time · booked/capacity) plus a **New** (+) control; the detail (right) is the create/edit form for the selected — or new — departure, carrying the capacity guard (UXD-05), the change fan-out confirm (UXD-03) and the cancellation remediation fan-out (UXD-04). Selecting a row pre-fills the form (conforms UXC-NAV-4); New clears it. Renamed from "Scheduler". Cancellation is a notice workflow, never a silent row delete.
- **states:** list-ready / row-selected(edit) / new(empty form).
- **rationale:** replaces a dropdown-of-ids selector with a first-class list; unifies read + write in one surface and matches the app's master/detail navigation idiom, also used by A19 Bookings (master/detail, but read-only — the write side lives on the separate A23 Edit booking screen, not unified into one surface as it is here on A18). A17 departure calendar remains the complementary date-oriented view (potential future consolidation, recorded in the build finding).
- **mockup-ref:** none yet (layout evolution; behaviour mockups A18 unchanged).

#### UXD-05 — Scheduler capacity guards
- **surfaces:** A18
- **trigger:** high-stakes / novel
- **overrides:** none — addition to UXC-FRM-3
- **serves:** REQ-BOOK11/12
- **behaviour:** Capacity input is guarded inline: > 10 → "A departure can hold at most 10 riders."; in edit mode, below current booked → "N riders are already booked — capacity can't go below that." Save is disabled while any guard is unmet. (Duplicate tour@datetime → "That tour is already scheduled at that time" — declared, to wire on real data.)
- **states:** valid / blocked (message adjacent).
- **rationale:** capacity below bookings would strand paid riders.
- **mockup-ref:** `Admin System.dc.html` A18.

#### UXD-06 — No-guide departure marked "not ready to run"
- **surfaces:** A18, A17
- **trigger:** novel
- **overrides:** none — addition
- **serves:** REQ-BOOK11 · REQ-BO04
- **behaviour:** Leaving the guide empty is permitted; the scheduler shows a non-blocking note ("marked not ready to run") and the A17 readiness indicator renders the guide sub-state as ✗ (feeds the composite readiness dot). Not an error, does not block save.
- **states:** ready / not-ready (derived, not an entity state).
- **rationale:** a legal-but-incomplete configuration must be glanceable, not blocked.
- **mockup-ref:** `Admin System.dc.html` A18/A17.

#### UXD-07 — Departure readiness indicator
- **surfaces:** A17
- **trigger:** novel
- **overrides:** none — addition
- **serves:** REQ-BO04 · UJ-BO-04
- **behaviour:** Each departure shows a composite readiness of two sub-parts — guide ✓/✗, bikes ✓/~/✗ (scheduled is always ✓, so it is not badged) — plus a single colour-coded dot: all-clear = lime, any hard-miss (no guide or no bikes) = orange, partial = cyan. Derived live from `departures` + `bike_assignments`; read-only glance, drills into detail.
- **states:** ready / partial / not-ready (all derived).
- **rationale:** the planning glance the whole calendar exists to give.
- **mockup-ref:** `Admin System.dc.html` A17 (list + calendar).

#### UXD-08 — Departure calendar: dual view + drill-down
- **surfaces:** A17
- **trigger:** novel
- **overrides:** none — addition (UXC-MOD-3 governs the overlays)
- **serves:** REQ-BO04 · UJ-BO-04
- **behaviour:** A List/Calendar toggle (client transient) switches between a dense dated list and a month grid. List range chips (week/month/all) filter the list only. A departure (calendar chip or list row) opens a read-only detail overlay listing its bookings and each booking's participants; a participant opens a second read-only overlay (age band, requirements, emergency contact, consent). Both overlays dismiss freely; the participant overlay closes back to the departure overlay (UXC-MOD-4).
- **states:** list / calendar (view transient) · overlay: closed / departure / participant.
- **rationale:** novel navigation metaphor across a hierarchy; read-only, so free dismissal is safe.
- **mockup-ref:** `Admin System.dc.html` A17.

#### UXD-09 — Bike allocation transfer + coverage
- **surfaces:** A20
- **trigger:** novel
- **overrides:** none — addition
- **serves:** REQ-BOOK14 · UJ-BO-07
- **behaviour:** Two lists (Available / Assigned) with move controls and a running "N of M riders covered" counter. Under-provisioning (assigned < riders) is a **non-blocking warning** ("Under-provisioned") and remains saveable, feeding the A17 readiness dot. Out-of-service and overlapping bikes appear disabled with a reason ("out of service — choose another" / "already out on another tour at that time") and cannot be moved. Empty available list → "No available bikes for this slot — check the fleet."
- **states:** available / assigned / disabled-oos / disabled-busy · loading (live bike-status read) · empty.
- **rationale:** saveable-with-warning is a deliberate deviation from "block on invalid".
- **mockup-ref:** `Admin System.dc.html` A20.

#### UXD-10 — Add-bike duplicate guard
- **surfaces:** A12
- **trigger:** novel
- **overrides:** none — addition to UXC-FRM-3
- **serves:** A12
- **behaviour:** A duplicate identifier blocks Add and surfaces the next sequential suggestion inline ("FOB-00X is already in use — next available is FOB-00Y."). No photo capture. On success, an inline confirmation replaces the guard.
- **states:** valid / duplicate-blocked / added.
- **rationale:** identifier collisions corrupt the fleet register.
- **mockup-ref:** `Admin System.dc.html` A12.

#### UXD-11 — Flagged-bike clear-to-service gate
- **surfaces:** A15
- **trigger:** high-stakes (safety)
- **overrides:** none — addition
- **serves:** A15
- **behaviour:** "Clear to service" is disabled until at least one maintenance event is logged for the flagged bike. Logging an event enables the control; clearing sets status → in_service. External repairs are handled off-system (not logged here).
- **states:** flagged (cannot clear) / flagged-with-event (can clear) / in_service.
- **rationale:** returning an un-serviced bike to a rider is a safety failure.
- **mockup-ref:** `Admin System.dc.html` A15.

#### UXD-12 — Overdue enquiry: flag, no auto-email
- **surfaces:** A9
- **trigger:** deviation
- **overrides:** UXC-FBK-1 (no automated outbound to the prospect)
- **serves:** A9
- **behaviour:** Overdue enquiries stay visibly flagged on the Open/Overdue tabs; no email is auto-sent to the prospect. Spam-flagged enquiries live on a separate tab and raise no alert.
- **states:** new / overdue / spam.
- **rationale:** deliberate — the owner chooses whether/when to respond.
- **mockup-ref:** `Admin System.dc.html` A9.

#### UXD-13 — Sign-off modes: typed-confirm vs full-signature
- **surfaces:** G3, G4, G5, G6, G8
- **trigger:** novel
- **overrides:** none — addition
- **serves:** §4 guide sign-offs
- **behaviour:** Two distinct sign-off affordances by declared weight. **Typed-confirm** (G3 travel kit, G5 risk) requires a typed full name to enable the confirm. **Full-signature** (G4 bike inspection, G6 rider check-in, G8 final) requires a signature declaration before completion. Modes are not interchangeable; the surface's declared weight fixes which applies.
- **states:** unsigned (confirm disabled) / signed (confirm enabled) / completed.
- **rationale:** distinct legal weights must be visibly distinct actions.
- **mockup-ref:** `Guide App.dc.html` G3–G8.

#### UXD-14 — G4 bike inspection: no same-day shortcut
- **surfaces:** G4
- **trigger:** high-stakes (safety) — deliberate absence of a convenience
- **overrides:** none — addition
- **serves:** §4 G4
- **behaviour:** Every bike is inspected every tour with a full-signature declaration; there is deliberately no "same as this morning" shortcut for a second same-day fleet.
- **states:** per-point checked/unchecked · signed/unsigned.
- **rationale:** re-inspection is the control; a shortcut would defeat it.
- **mockup-ref:** `Guide App.dc.html` G4.

#### UXD-15 — G5 high-risk blocks sign-off
- **surfaces:** G5, G7
- **trigger:** high-stakes (safety)
- **overrides:** none — addition to UXC-FRM-3
- **serves:** §4 G5
- **behaviour:** An unresolved high-risk item blocks the risk-assessment sign-off (message: resolve all high-risk items first). Resolving logs a mitigation and downgrades the item; the mitigation then appears inline on the G7 safety-briefing script ("Today's mitigations").
- **states:** high-unresolved (blocked) / mitigated / signed.
- **rationale:** riding out on an unmitigated high risk is the core safety failure.
- **mockup-ref:** `Guide App.dc.html` G5/G7.

#### UXD-16 — G6 rider check-in refusal
- **surfaces:** G6
- **trigger:** high-stakes (safety/money)
- **overrides:** none — addition
- **serves:** §4 G6
- **behaviour:** On-day waiver re-confirmation per rider (this is the second layer referenced at W7 — digital, not paper). Each rider is check-in or refused; refusal cases (medical, intoxication, unaccompanied minor, waiver refused) mark the rider refused and flag for a William-processed refund — the guide never handles money. Guide signature completes the card.
- **states:** pending / checked / refused (flagged).
- **rationale:** refusals trigger money handled elsewhere; the guide boundary is strict.
- **mockup-ref:** `Guide App.dc.html` G6.

#### UXD-17 — G8 pre-departure sign-off gate
- **surfaces:** G8
- **trigger:** high-stakes (safety)
- **overrides:** none — addition to UXC-FRM-3
- **serves:** §4 G8
- **behaviour:** Any outstanding upstream step (G3–G7 not done) blocks the final sign-off; the outstanding count is stated. When clear, a signature enables "Sign off — tour ready to run".
- **states:** blocked (n outstanding) / ready / signed-off.
- **rationale:** the last gate before a tour runs.
- **mockup-ref:** `Guide App.dc.html` G8.

#### UXD-18 — Console chrome transients (nav collapse + treeview)
- **surfaces:** all A-surfaces (shell)
- **trigger:** novel — client-only
- **overrides:** none — addition; flagged transient per UXC-STA-2
- **serves:** shell usability
- **behaviour:** The left nav collapses to a 68px icon rail (labels/group titles hidden; codes remain; hover exposes the label as tooltip — duplicating, not replacing, per UXC-A11Y-1) and each group is an independently expand/collapse tree node. Collapse state, per-group expand state, and active screen are client-only transients — they persist in the session but are never entity states and never affect data.
- **states:** expanded / collapsed (rail); per-group open / closed; active-screen.
- **rationale:** purely presentational; must be explicitly out of the entity-state space.
- **mockup-ref:** `Admin System.dc.html` shell.

#### UXD-19 — Guide draft-save & 24h review
- **surfaces:** G11
- **trigger:** deviation
- **overrides:** UXC-NAV-2 (a non-terminal draft return path)
- **serves:** §4 G11
- **behaviour:** The post-ride review saves as a draft if not completed immediately and is due within 24h; "Save draft" returns home without committing, and the surface remains re-enterable to complete. Submit is the terminal commit.
- **states:** draft / submitted.
- **rationale:** deliberate return-to-complete path against the terminal-confirmation default.
- **mockup-ref:** `Guide App.dc.html` G11.

---

## §C — Coverage ledger

| Mockup / wireframe | Surfaces | Sidecar updated | UXD records touched | Conventions confirmed sufficient? | Date |
|---|---|---|---|---|---|
| `Admin System.dc.html` | A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13, A14, A15, A16, A17, A18, A19, A20, A23 | pending | UXD-01…12, UXD-18 | Yes, except records listed (A23 has no mockup yet — new screen, layout evolution only) | 2026-07-22 |
| `Guide App.dc.html` | G1, G2, G3, G4, G5, G6, G7, G8, G9, G10, G11, G12, G13 | pending | UXD-13…17, UXD-19 | Yes, except records listed | 2026-07-22 |

---

## Open questions to route (session rule R2 — do not design into scope)

1. **A18 duplicate-slot check** — declared in the Bacon brief; wire to real `departures` uniqueness (message wording exists). Not yet demonstrable on fixtures.
2. **A10 insurer dispatch** — format unconfirmed by William; the send step is stubbed. No UXD authored beyond the status progression (submitted → insurer_ack → reviewed → closed).
3. **Bike states `retired` / `awaiting_external_service`** — exist in the data model with no driving flow (UXC-STA-3). A14 counts them; no transition control invented.
4. **Focus/keyboard/live-region conventions (UXC-SCR-1, A11Y-*)** — authored as proposed defaults; ratify at first Gate-6 pass, then re-sweep both mockups.

---

## Revision History

| Version | Date | Summary |
|---|---|---|
| 0.1 | 2026-07-22 | Initial UXIS from the admin console (A1–A20) and guide app (G1–G13) mockups: Part A conventions (UXC-*) with the silence rule, navigation map, 19 fine-grained records (UXD-*), coverage ledger, and routed open questions. Behavioural-not-visual boundary observed. |
