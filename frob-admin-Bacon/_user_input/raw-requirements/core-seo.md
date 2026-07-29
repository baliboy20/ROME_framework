---
module: SEO
status: PROPOSED
actors: [System, Prospect]
depends-on: []
presumes: [marketing-read-api, route-catalogue-read-api, static-build]
---

# core-seo — Module Spec

| | |
|---|---|
| **Document** | core-seo module spec (Stage 4) |
| **Version** | 0.1 |
| **Date** | 2026-07-20T00:00:00Z |
| **Status** | PROPOSED — not Reliable until ratification. |
| **Sources** | `DOMAIN-LEXICON.md` · `Intake_Note.md` (F-09, G-05) · `architecture/FOB_Modular_Architecture_v1_4.md` §3.1, §4 · `ROME-GUIDE-001` |

## 1. Intent
Make public tour and marketing content **fully discoverable by search** so prospects find FOB directly, and keep that content current with the catalogue. **Success:** a search crawler obtains complete tour content and machine-readable descriptors without executing scripts, and published content never lags the catalogue beyond one rebuild cycle. *(Mechanism — islands/static HTML, sitemap format, schema.org shapes — is design/architecture (Stage 6d/6e), not authored here per GUIDE Rule 3 / Part 5.)*

## 2. Facts
| ID | Fact | Source |
|---|---|---|
| F-09 | The marketing site is static HTML + Flutter islands; SEO metadata is owned by the `marketing` BF and flows into the static HTML at build; EN/FR/ES per-locale dirs. | Tech Context §I; Arch §3.1 |
| G-05 | Direct-booking primacy: SEO is how prospects find FOB without OTA commission. | Arch §3.1; PRD principle 2 |

## 3. Decisions needed
| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D-SEO-1 | schema.org type scope (F-D2/SQ-03). | TouristAttraction \| LocalBusiness \| Event \| Product | TouristAttraction + LocalBusiness at v1; Product for gift vouchers. | **CLOSED — DR-9.** Recommendation confirmed as-is; `Event` excluded. |
| D-SEO-2 | Rebuild trigger (F-D1/SQ-04). | automated on content change \| manual publish | Automated on content change, with a manual publish override. | **CLOSED — DR-10.** **Manual-only** (recommendation overridden). REQ-SEO03 rewritten below. |

## 4. Requirements

### REQ-SEO01 — System exports crawlable tour-content
intent:        export tour-content
actor:         System
preconditions: a tour has published catalogue content
conditions:    the content is emitted so a search crawler can read it without executing scripts, including machine-readable descriptors
postconditions: the public tour location serves complete, crawler-readable content
outcomes:
  - a search crawler obtains the full tour content and descriptors without running scripts
  - Prospect finds the tour through a search engine
errors:
  - tour content incomplete (missing title or description) → the location is still served but flagged for the Owner
invariants:    crawler-readable content matches the published catalogue content
non-functional: Performance — primary content is available on first load
scope:         in: crawler-readable tour + marketing content with descriptors | out: paid search, OTA feeds, authenticated locations
open-questions: none — D-SEO-1 closed (DR-9)
example:
  given:  the Hidden City tour (TOUR-HID) published at £45
  when:   the System exports its crawlable content
  then:   a crawler reads the full Hidden City content and descriptors without executing scripts

### REQ-SEO02 — System creates a crawlable-index
intent:        create crawlable-index
actor:         System
preconditions: one or more public locations are published
conditions:    the index lists every currently-published crawlable location
postconditions: an up-to-date index of crawlable locations is available to crawlers
outcomes:
  - a search crawler discovers all published locations from one index
errors:
  - a location is published but absent from the index → treated as a gap and flagged for the Owner
invariants:    the index lists exactly the currently-published crawlable locations
non-functional: Reliability — the index reflects the latest publication within the rebuild cycle
scope:         in: an index of crawlable public locations | out: per-crawler customisation
open-questions: none — D-SEO-2 closed (DR-10); index behaviour unaffected by manual-only trigger
example:
  given:  Hidden City and two other tours published
  when:   the System creates the crawlable index
  then:   the index lists all three tour locations

### REQ-SEO03 — System updates published-content on manual publish
intent:        update published-content
actor:         System
preconditions: marketing or route-catalogue content has changed since the last publication; an operator has triggered a manual publish
conditions:    publication regenerates affected locations with current content and descriptors; content lags the catalogue until the next manual publish is triggered
postconditions: public locations reflect the content current as of the last manual publish
outcomes:
  - Prospect sees the tour details current as of the last manual publish; a crawler indexes those descriptors
  - Owner controls exactly when published content changes
errors:
  - none — a change made without a subsequent manual publish is expected behaviour, not a fault; public content simply reflects the last publish
invariants:    published content only ever reflects a completed manual publish; it never changes without one
non-functional: Reliability — a triggered rebuild completes within the accepted processing window
scope:         in: regeneration of public locations on operator-triggered manual publish | out: automated on-change publishing, instantaneous per-edit publishing
open-questions: none — D-SEO-2 closed (DR-10)
example:
  given:  the Hidden City price changes from £45 to £48, and the Owner has not yet triggered a publish
  when:   the Owner triggers a manual publish
  then:   the public Hidden City location shows £48 and its descriptors match; before that trigger, it correctly still showed £45

## 5. Journeys
| UJ id | Journey | Requirements (thread) |
|---|---|---|
| UJ-SEO-01 | Crawler reads full content | REQ-SEO01 |
| UJ-SEO-02 | Advertise crawlable index | REQ-SEO02 |
| UJ-SEO-03 | Regenerate on content change | REQ-SEO03 |
