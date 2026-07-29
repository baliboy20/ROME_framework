# FOB Guide App — UX Interaction Specification (UXIS)

| Field | Value |
|-------|-------|
| **Document UID** | FOB-UXIS-GUIDE-001 |
| **Template** | T6f UXIS v0.1 (`ROME-PIPELINE-006`) |
| **Version** | 0.1 — DRAFT |
| **Date** | 2026-07-22T00:00:00Z |
| **Covers** | Guide app G1–G13 — issued mobile/tablet, iOS PWA, extension of the existing GMT navigation PWA |
| **Mockup** | `Guide App.dc.html` |
| **Companion** | `Handover_AllModules_…Aristotle` §4 (guide app) · FOB-UXIS-001 (whole-system UXIS — this doc is the per-app extract, kept in sync) |
| **Boundary** | Behavioural, not visual. Colours, type, spacing, brand live in the FOB design system, not here. |
| **Precedence** | module spec (REQ) → Decision Record → Part B (UXD) → Part A (UXC) → the pixels |

> **Device.** The guide app runs on an **issued device as an installed iOS PWA** (standalone, no browser chrome), single-column, thumb-reachable. Device identity (G1) is implicit on every request — there is no sign-in screen; the app opens straight to the tour-day home.
>
> **Silence rule.** A surface with no Part B (UXD) entry is governed entirely by Part A. Silence = "defaults apply", and is checkable: every interaction is either *conforming* (silent) or *excepted* (has a UXD record). Anything unclassifiable is a finding.

---

## §A — Universal Interaction Conventions (guide-app scope)

Source key: **D** = derived (REQ/DR) · **R** = ratified project default · **P** = proposed default (awaiting Gate-6 ratification).

### A1 · Navigation (UXC-NAV-*)
| ID | Convention | Source |
|---|---|---|
| UXC-NAV-1 | The app is a single-stack shell: the tour-day home (G2) is the hub; every other surface is a push with a persistent back affordance that returns to the hub with state intact. | R |
| UXC-NAV-2 | Post-commit surfaces (sign-off complete, "logged", "submitted") are terminal — back/return never re-fires the commit. Exception: G11 draft-return (UXD-G-08). | D |
| UXC-NAV-3 | Completing a playbook step (G3–G8) returns to the hub and advances the next step to `current`. Step order is fixed; steps are enterable out of order but the hub always reflects true completion state. | D (§4 six-step) |
| UXC-NAV-4 | No sign-in / sign-out surface. Device identity (G1) is implicit; loss of identity is a device-provisioning concern, not an app screen. | D (G1) |

### A2 · Screens & pages (UXC-SCR-*)
| ID | Convention | Source |
|---|---|---|
| UXC-SCR-1 | The home (G2) always shows live progress (n/6) and the current step; it is the default landing surface. | R |
| UXC-SCR-2 | In-progress input is preserved across interruption (backgrounding the PWA, navigation, return) — checklists, partial sign-offs, and the G11 draft survive. | D (G11 draft-save) |
| UXC-SCR-3 | Each surface has one clear primary action anchored at the bottom of the flow (thumb reach). | P |

### A3 · Modals & popups (UXC-MOD-*)
| ID | Convention | Source |
|---|---|---|
| UXC-MOD-1 | The guide app avoids blocking modals for routine flow; sign-offs and logs are full surfaces, not dialogs. | R |
| UXC-MOD-2 | Any confirmation that does appear traps focus and returns it to the trigger on close. | P |

### A4 · Components (UXC-CMP-*)
| ID | Convention | Source |
|---|---|---|
| UXC-CMP-1 | Every interactive element exposes default / pressed / disabled / focus states; press feedback is tint/brightness, never scale. | D (design system) |
| UXC-CMP-2 | A single-select group (event category) has exactly one active member. | R |
| UXC-CMP-3 | The guide never sees or handles money — no amount entry, no refund control anywhere in the app. | D (§4 G6) |
| UXC-CMP-4 | No photo capture on any guide surface this pass (G4, G6, G9, G10, G11, G13). | D (§4 known gaps) |

### A5 · UI states (UXC-STA-*)
| ID | Convention | Source |
|---|---|---|
| UXC-STA-1 | Playbook step status is a three-value machine: `todo` / `current` / `done`; exactly one step is `current` until all are done. | R |
| UXC-STA-2 | Form surfaces (G9–G13) have a `form` and a terminal `submitted` state; the submitted state is a confirmation, not a re-editable form. | R |
| UXC-STA-3 | Rider check-in status maps to `pending` / `checked` / `refused`; refused is a flagged terminal for that rider on this tour. | D (G6) |

### A6 · Forms & validation (UXC-FRM-*)
| ID | Convention | Source |
|---|---|---|
| UXC-FRM-1 | Sign-off/submit is disabled only for unmet *blocking* conditions, with the reason stated adjacent (typed name, signature, unresolved risk, outstanding steps, minimum narrative). | D |
| UXC-FRM-2 | Validation messages use the REQ error-pair wording verbatim. | D |
| UXC-FRM-3 | Checklists never require all items to enable sign-off unless the REQ makes an item blocking; the sign-off (typed/signature) is the gating act. | R |

### A7 · Feedback & notifications (UXC-FBK-*)
| ID | Convention | Source |
|---|---|---|
| UXC-FBK-1 | Every completed action gives immediate on-device confirmation (step marked done + progress advance, or a "logged/submitted" card). | R |
| UXC-FBK-2 | Actions that alert the owner say so explicitly at the point of action (G10 "alert William", G6 refusal "flagged for William"). | D |
| UXC-FBK-3 | Time-bound obligations state the deadline inline (G11 "due within 24 hours"). | D (G11) |

### A8 · Motion (UXC-MOT-*)
| ID | Convention | Source |
|---|---|---|
| UXC-MOT-1 | Motion is minimal and communicative (progress-bar fill on step completion); shared token durations/easings. | P |
| UXC-MOT-2 | `prefers-reduced-motion` replaces all movement with instant transitions — no exceptions. | R |

### A9 · Errors & empty states (UXC-ERR-*)
| ID | Convention | Source |
|---|---|---|
| UXC-ERR-1 | Every blocked sign-off names what to resolve and offers the path to resolve it (no dead ends). | P |
| UXC-ERR-2 | A read-only snapshot that fails to load degrades to a stated "unavailable" state, never a blank (e.g. G2 bike-status snapshot from Fleet). | P |

### A10 · Responsive & devices (UXC-RSP-*)
| ID | Convention | Source |
|---|---|---|
| UXC-RSP-1 | Target: issued mobile/tablet, installed iOS PWA (standalone display), single-column. No desktop obligation. | D (§4 + user) |
| UXC-RSP-2 | Touch targets ≥ 44×44px on every surface. | P |
| UXC-RSP-3 | Safe-area insets respected (status bar / home indicator) in standalone display. | P |

### A11 · Accessibility (UXC-A11Y-*)
| ID | Convention | Source |
|---|---|---|
| UXC-A11Y-1 | Every interaction is operable without fine pointing; large hit areas, no drag-only affordances. | P |
| UXC-A11Y-2 | Status changes announce via live regions (step complete, sign-off result), not colour/position alone. | P |
| UXC-A11Y-3 | WCAG AA contrast; status always carries a text label (readiness, rider status, step chips). | D (design system) |

---

## §B — Navigation map (UXD-NAV-MAP)

| Route / entry | Surface | Entry points | Guard → REQ |
|---|---|---|---|
| Tour-day home / playbook | G2 | app root | device identity (G1, implicit) |
| Travel kit checklist | G3 | G2 step 1 | device identity · §4 G3 |
| Bike inspection grid | G4 | G2 step 2 | device identity · §4 G4 |
| Risk assessment + decisions log | G5 | G2 step 3 | device identity · §4 G5 |
| Rider check-in card | G6 | G2 step 4 | device identity · §4 G6 |
| Safety briefing script | G7 | G2 step 5 | device identity · §4 G7 |
| Pre-departure sign-off | G8 | G2 step 6 | device identity · §4 G8 |
| Mid-tour event logger | G9 | G2 "During the tour" | device identity · §4 G9 |
| Emergency / incident logger | G10 | G2 "During the tour" | device identity · §4 G10 |
| Post-ride review | G11 | G2 "After the tour" | device identity · §4 G11 |
| Incident report | G12 | G2 "After the tour" | device identity · §4 G12 |
| Hazard observation | G13 | G2 "After the tour" | device identity · §4 G13 |

*(G1 device-identity recognition is implicit on every request — not a distinct route; surfaced only as the device chip in the app bar.)*

---

## §B — Fine-Grained Definitions (UXD-G-*)

#### UXD-G-01 — Sign-off modes: typed-confirm vs full-signature
- **surfaces:** G3, G4, G5, G6, G8
- **trigger:** novel
- **overrides:** none — addition
- **serves:** §4 guide sign-offs
- **behaviour:** Two distinct affordances fixed by each surface's declared weight. **Typed-confirm** (G3 travel kit, G5 risk) enables its confirm only when a full name is typed. **Full-signature** (G4 bike inspection, G6 rider check-in, G8 final) requires a signature declaration before completion. The modes are not interchangeable; a surface never offers both.
- **states:** unsigned (confirm disabled) → signed (enabled) → completed (returns to hub, advances step).
- **rationale:** distinct legal weights must be visibly distinct acts.
- **mockup-ref:** `Guide App.dc.html` G3–G8.

#### UXD-G-02 — G4 bike inspection: no same-day shortcut
- **surfaces:** G4
- **trigger:** high-stakes (safety) — deliberate absence of a convenience
- **overrides:** none — addition
- **serves:** §4 G4
- **behaviour:** Every bike is inspected every tour with a full-signature declaration. There is deliberately **no "same as this morning"** shortcut for a second same-day fleet — the grid resets and must be re-completed.
- **states:** per-bike per-point checked/unchecked · signed/unsigned.
- **rationale:** the re-inspection *is* the control; a shortcut defeats it.
- **mockup-ref:** `Guide App.dc.html` G4.

#### UXD-G-03 — G5 high-risk blocks sign-off; mitigation flows to G7
- **surfaces:** G5, G7
- **trigger:** high-stakes (safety)
- **overrides:** none — addition to UXC-FRM-1
- **serves:** §4 G5, G7
- **behaviour:** An unresolved high-risk item blocks the risk sign-off (message: resolve all high-risk items first). "Log mitigation & resolve" records the mitigation and downgrades the item to `mitigated`; the mitigation text then appears inline on the G7 briefing script under "Today's mitigations (from G5)". Typed sign-off also required.
- **states:** high-unresolved (blocked) / mitigated / signed.
- **rationale:** riding out on an unmitigated high risk is the core safety failure; the briefing must carry the day's decisions.
- **mockup-ref:** `Guide App.dc.html` G5/G7.

#### UXD-G-04 — G6 rider check-in & refusal (the W7 second layer)
- **surfaces:** G6
- **trigger:** high-stakes (safety / money boundary)
- **overrides:** none — addition
- **serves:** §4 G6 (second layer referenced at W7)
- **behaviour:** Per-rider on-day waiver re-confirmation — digital, not paper, and distinct from the party-level W7 waiver (the two acceptance moments never merge). Each rider is `checked` or `refused`; refusal cases (medical, intoxication, unaccompanied minor, waiver refused) mark `refused` and flag for a **William-processed** refund — the guide never handles money. A guide signature completes the card; completion requires no rider left `pending`.
- **states:** pending / checked / refused (flagged) · signed/unsigned.
- **rationale:** refusals initiate money handled off-app; the guide/money boundary is strict and must be enforced in the affordances.
- **mockup-ref:** `Guide App.dc.html` G6.

#### UXD-G-05 — G8 pre-departure sign-off gate
- **surfaces:** G8
- **trigger:** high-stakes (safety)
- **overrides:** none — addition to UXC-FRM-1
- **serves:** §4 G8
- **behaviour:** Any outstanding upstream step (G3–G7 not `done`) blocks the final sign-off; the outstanding count is stated and each item links back to its step. When all clear, a signature enables "Sign off — tour ready to run".
- **states:** blocked (n outstanding) / ready / signed-off.
- **rationale:** the last gate before a tour runs.
- **mockup-ref:** `Guide App.dc.html` G8.

#### UXD-G-06 — G10 emergency logger alerts the owner
- **surfaces:** G10
- **trigger:** high-stakes (safety)
- **overrides:** none — addition
- **serves:** §4 G10
- **behaviour:** A quick form (nature, location, account) whose primary action ("Log emergency & alert William") explicitly states it alerts the owner immediately; destructive/urgent styling. No photo capture. Confirmation card states William has been alerted.
- **states:** form / submitted (owner-alerted).
- **rationale:** an emergency path must make its side-effect (owner alert) unmistakable at the point of action.
- **mockup-ref:** `Guide App.dc.html` G10.

#### UXD-G-07 — G9 mid-tour event categories
- **surfaces:** G9
- **trigger:** novel
- **overrides:** none — addition
- **serves:** §4 G9
- **behaviour:** A single-select category (mechanical / illness / early-leave) plus a free-text account; logs to the tour record. Distinct from G10 — routine events, not emergencies.
- **states:** form / logged.
- **rationale:** the category set is fixed and must not blur into the emergency path.
- **mockup-ref:** `Guide App.dc.html` G9.

#### UXD-G-08 — G11 post-ride review: draft-save & 24h deadline
- **surfaces:** G11
- **trigger:** deviation
- **overrides:** UXC-NAV-2 (a non-terminal return path)
- **serves:** §4 G11
- **behaviour:** Ratings (overall / guide / value) plus optional notes. "Save draft" returns to the hub without committing and the surface stays re-enterable to complete; the review is due within 24h (stated inline). "Submit review" is the terminal commit. A draft is not a submission.
- **states:** draft / submitted.
- **rationale:** deliberate return-to-complete path against the terminal-confirmation default.
- **mockup-ref:** `Guide App.dc.html` G11.

#### UXD-G-09 — G12 incident report (formal narrative)
- **surfaces:** G12
- **trigger:** high-stakes (legal)
- **overrides:** none — addition to UXC-FRM-1
- **serves:** §4 G12
- **behaviour:** A formal free-text narrative submitted to William; submit is disabled until a minimum narrative is present. No photo capture. Confirmation states it was submitted and a copy is retained on-device. Distinct from the G10 emergency log (which is the in-the-moment record).
- **states:** form (submit gated on min length) / submitted.
- **rationale:** a legal account must not be submittable empty.
- **mockup-ref:** `Guide App.dc.html` G12.

#### UXD-G-10 — G13 hazard observation
- **surfaces:** G13
- **trigger:** novel
- **overrides:** none — addition
- **serves:** §4 G13
- **behaviour:** Location (street), hazard type, and notes; submit gated on location + type. No photo capture. Submitted hazards feed the A11 hazard log, where they dedupe by street name (a repeat bumps "last confirmed" rather than creating a new entry) — the guide app does not surface the dedupe, only the submission.
- **states:** form / submitted.
- **rationale:** novel capture that hands off to an owner-side dedupe the guide need not see.
- **mockup-ref:** `Guide App.dc.html` G13.

#### UXD-G-11 — Home progress & step advancement
- **surfaces:** G2
- **trigger:** novel — client-derived
- **overrides:** none — addition; flagged derived per UXC-STA-1
- **serves:** §4 G2
- **behaviour:** The hub shows n/6 completed and a progress bar derived from step status; the `current` step is highlighted. Completing any step advances the next `todo` to `current` and refreshes progress. Steps are enterable out of order for flexibility, but progress reflects only true completions. A read-only bike-status snapshot (from Fleet & Equipment) also appears here (degrades to "unavailable" if the read fails, per UXC-ERR-2).
- **states:** per-step todo/current/done (derived progress).
- **rationale:** the six-step playbook is the app's spine; progress must be derived, never a stored entity state.
- **mockup-ref:** `Guide App.dc.html` G2.

---

## §C — Coverage ledger

| Mockup / wireframe | Surfaces | Sidecar updated | UXD records touched | Conventions confirmed sufficient? | Date |
|---|---|---|---|---|---|
| `Guide App.dc.html` | G1, G2, G3, G4, G5, G6, G7, G8, G9, G10, G11, G12, G13 | pending | UXD-G-01…11 | Yes, except records listed | 2026-07-22 |

---

## Open questions to route (session rule R2 — do not design into scope)

1. **G2 bike-status snapshot** — read-only from Fleet & Equipment; source/refresh cadence and the failure/"unavailable" copy need confirming (UXC-ERR-2).
2. **Signature capture fidelity** — the mockup uses a tap-to-sign placeholder. Whether the production PWA needs a drawn-signature canvas vs typed-attestation for the "full signature" surfaces (G4/G6/G8) is a legal/DR question, not a design choice — route before build.
3. **Offline behaviour** — an issued-device PWA on tour may lose connectivity; queue/sync behaviour for logs and sign-offs (G6, G9–G13) is unscoped here and must trace to a DR.
4. **Focus/keyboard/live-region conventions (UXC-A11Y-*, SCR-3)** — proposed defaults; ratify at first Gate-6 pass, then re-sweep.

---

## Revision History

| Version | Date | Summary |
|---|---|---|
| 0.1 | 2026-07-22 | Standalone guide-app UXIS from the G1–G13 mockup: Part A conventions scoped to the issued iOS PWA (no sign-in, guide/money boundary, no-photo, offline-aware), navigation map, 11 fine-grained records (UXD-G-*), coverage ledger, and routed open questions (bike snapshot, signature fidelity, offline sync, a11y ratification). Behavioural-not-visual boundary observed; kept in sync with FOB-UXIS-001. |
