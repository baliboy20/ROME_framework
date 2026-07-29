# T6f — UX Interaction Specification (UXIS) Template

| Field | Value |
|-------|-------|
| **Document UID** | ROME-PIPELINE-006 |
| **Version** | 0.1 |
| **Date** | 2026-07-19T00:00:00Z |
| **Status** | DRAFT |
| **Document Type** | Standalone template (portable — drop into any UI mockup / design session) |
| **Companion** | `ROME-PIPELINE-001` (pipeline; Stage 6f) · `ROME-PIPELINE-003` (Gate 6 UXIS block) · `ROME-GUIDE-001` Part 3 (wireframe sidecar format) |
| **Supersedes** | The embedded T6f section of `AnD_Stage_Templates` v0.2 — that pack now points here |

---

## 1. What this document is, and when to paste it

The UXIS is the **behavioural specification of the UI**: how surfaces navigate, validate,
announce, animate, degrade, and recover. The wireframe sidecar (ROME-GUIDE-001 Part 3) binds
*elements* to data and requirements; the UXIS binds *behaviour* within and across surfaces.

**Paste this template into any session that produces or interprets UI mockups** — a wireframing
session, a Claude-design session, a review of externally produced mockups. Its job in that
session is twofold:

1. **Generative** — give the session the format for formally describing the UI it is engineering.
2. **Disciplinary** — force every interactive behaviour shown in a mockup to be either covered
   by a universal convention or captured as an explicit fine-grained definition. A behaviour
   that is neither is a gap the session must surface, not gloss.

**The binding rule (from Gate 6):** producing any mockup obliges UXIS coverage for its surfaces
in the same pass, recorded in the coverage ledger (§6). A mockup with no ledger row fails Gate 6.

---

## 2. The two-layer structure — read this before filling anything in

A UXIS written surface-by-surface restates the same behaviours dozens of times, and each
restatement is a chance to drift. So this template is structured in two layers:

> **Part A — Universal Conventions.** The UX constitution: rules that apply to *every* module,
> surface, and device unless explicitly overridden. Authored once, early, ratified like any
> other scope. Most of the app's behaviour should live here.
>
> **Part B — Fine-Grained Definitions.** Per-surface / per-interaction records written **only**
> where behaviour (a) deviates from a Part A convention, (b) is safety- or money-critical and
> deserves precision even if conforming, or (c) is a novel interaction no convention covers.

**The silence rule.** A surface with no Part B entry is governed *entirely* by Part A. Silence
means "defaults apply" — and because that is a defined meaning, it is checkable: an auditor
walking a mockup can classify every interaction as *conforming* (silent) or *excepted* (has a
Part B record), and anything unclassifiable is a finding.

**Precedence on conflict** (highest wins):

```
module spec (REQ) → Decision Record → Part B definition → Part A convention → the pixels
```

A mockup never overrides a convention by looking different — if the picture and the UXIS
disagree, either the picture is wrong or a Part B record is missing. Decide which, explicitly.

**Authority rules** (inherited from the pipeline; they prevent this document becoming a second
source of truth):

- Every behaviour cites the REQ/UJ/surface id it serves. An interaction implying unscoped
  capability = emitted question (session rule R2), never authored here.
- User flows are owned by the 6c workflow step-tables — reference them, never restate steps.
- Validation *messages* derive from REQ `errors` condition→message pairs — same wording source.
- Error/empty states cover exactly the states declared in the coverage matrix and sidecars —
  none invented, none dropped.
- UI states map to lexicon/entity lifecycle states; a client-side-only transient state (e.g.
  `previewing-diff`) is flagged as such, never smuggled in as a new entity state.
- **Behavioural, not visual.** Colours, type scales, spacing, and brand belong to a design
  system, not the UXIS. The UXIS says *when* the modal traps focus and *what dismisses it*, not
  what it looks like.

---

## 3. Part A — Universal Interaction Conventions

One table per concern area, mirroring the 13 UXIS concerns. Each convention gets a stable ID
(`UXC-<area>-<n>`), so Part B records can cite exactly what they override. The **Source**
column keeps authority honest: a convention is either derived (REQ/DR), a ratified project
default, or a proposed default awaiting ratification — mark which.

> Fill-in guidance: aim for the *smallest set of conventions that covers most behaviour*. If a
> convention needs three exceptions in Part B, it's probably the wrong convention.

### A1 · Navigation (UXC-NAV-*)
| ID | Convention | Source |
|---|---|---|
| UXC-NAV-1 | e.g. "Back (browser or in-app) always returns to the previous step with state intact; it never re-submits an action" | |
| UXC-NAV-2 | e.g. "Post-commit surfaces (confirmations) are redirect targets; Back from them never re-triggers the commit" | |
| UXC-NAV-3 | e.g. "Deep links are parsed for pre-fill; missing context renders empty controls, never an error" | |

### A2 · Screens & pages (UXC-SCR-*)
| ID | Convention | Source |
|---|---|---|
| UXC-SCR-1 | e.g. "Initial focus lands on the first incomplete/interactive element" | |
| UXC-SCR-2 | e.g. "In-progress user input is preserved across interruptions (expiry, navigation, refresh) wherever the flow permits return" | |

### A3 · Modals & popups (UXC-MOD-*)
| ID | Convention | Source |
|---|---|---|
| UXC-MOD-1 | e.g. "Destructive or money-moving confirms are blocking modals dismissed only by an explicit choice — never by clicking outside or pressing Escape" | |
| UXC-MOD-2 | e.g. "Modals trap focus and return it to the trigger on close" | |
| UXC-MOD-3 | e.g. "Informational overlays (previews, help) dismiss freely" | |

### A4 · Components (UXC-CMP-*)
| ID | Convention | Source |
|---|---|---|
| UXC-CMP-1 | e.g. "Every interactive element has visible default/hover-or-press/disabled/focus states" | |
| UXC-CMP-2 | e.g. "Actions that trigger server work show an in-progress state and are not re-triggerable while pending" | |

### A5 · UI states (UXC-STA-*)
| ID | Convention | Source |
|---|---|---|
| UXC-STA-1 | e.g. "Every surface that loads data has defined loading / ready / empty / error states" | |
| UXC-STA-2 | e.g. "UI state machines map to entity lifecycle states; client-only transients are named and flagged" | |

### A6 · Forms & validation (UXC-FRM-*)
| ID | Convention | Source |
|---|---|---|
| UXC-FRM-1 | e.g. "Field format validation fires on blur; required-field validation fires on submit attempt; never on first keystroke" | |
| UXC-FRM-2 | e.g. "Error messages are inline, adjacent to the field, and use the REQ error-pair wording verbatim" | |
| UXC-FRM-3 | e.g. "Submit is disabled only for unmet *blocking* conditions, with the reason stated next to it" | |

### A7 · Feedback & notifications (UXC-FBK-*)
| ID | Convention | Source |
|---|---|---|
| UXC-FBK-1 | e.g. "Every REQ outcome observable by an actor has exactly one primary feedback channel (page, inline, email)" | |
| UXC-FBK-2 | e.g. "Exception copy reassures — states what happened, what is preserved, and the next step" | |

### A8 · Motion (UXC-MOT-*)
| ID | Convention | Source |
|---|---|---|
| UXC-MOT-1 | e.g. "All motion uses the shared token set: durations {fast/base/slow = …}, easings {…}" | |
| UXC-MOT-2 | e.g. "`prefers-reduced-motion` replaces all movement with instant transitions — no exceptions" | |
| UXC-MOT-3 | e.g. "Motion is feedback, never decoration: nothing animates unless it communicates a state change" | |

### A9 · Errors & empty states (UXC-ERR-*)
| ID | Convention | Source |
|---|---|---|
| UXC-ERR-1 | e.g. "Every declared error state offers a recovery action; dead ends are design defects" | |
| UXC-ERR-2 | e.g. "Security-sensitive failures are generic on screen (anti-enumeration); detail goes to the owner-side queue" | |

### A10 · Responsive & devices (UXC-RSP-*)
| ID | Convention | Source |
|---|---|---|
| UXC-RSP-1 | e.g. "Target devices and breakpoints: <ratified list — this row must trace to a DR>" | |
| UXC-RSP-2 | e.g. "Touch targets ≥ 44×44px on any surface reachable from a mobile device" | |

### A11 · Accessibility (UXC-A11Y-*)
| ID | Convention | Source |
|---|---|---|
| UXC-A11Y-1 | e.g. "Every interaction is keyboard-operable; no pointer-only affordances" | |
| UXC-A11Y-2 | e.g. "State changes and feedback events announce via live regions, not visually alone" | |
| UXC-A11Y-3 | e.g. "WCAG AA contrast minimum" | |

*(Navigation architecture — the route map itself — is per-project, not a convention: record it
as a Part B table `UXD-NAV-MAP`, one row per route: route, surface id, device(s), entry points,
access guard → REQ.)*

---

## 4. Part B — Fine-Grained Definitions

Write an entry **only** when one of the three triggers applies:

| Trigger | Example |
|---|---|
| **Deviation** — behaviour differs from a Part A convention | A hold-expiry countdown banner that *is* dismissible although banners normally persist |
| **High stakes** — conforming, but money/safety/legal demands precision | A departure-cancellation fan-out confirm; a refund-amount dialog |
| **Novel** — no convention covers it | A capacity-hold timer; a height range selector with "not sure" |

### The definition record

```markdown
#### UXD-<nn> — <short name>
surfaces:      <W#/R#/E# ids, from the coverage matrix>
trigger:       deviation | high-stakes | novel
overrides:     <UXC id(s) being overridden, or "none — addition">
serves:        <REQ/UJ ids>
behaviour:     <the fine-grained definition: interaction → response, states, dismissal,
                announcement, timing — as precise as the stakes require>
states:        <the element/surface states this defines, incl. empty/error/loading if local>
rationale:     <one line: why this can't just follow the conventions>
mockup-ref:    <which wireframe/mockup shows it — or "none yet" (pre-gate)>
```

**Discipline notes.**
- An `overrides` entry citing no UXC id and claiming no addition is malformed — the audit
  question "what does this deviate from?" must always have an answer.
- If the same deviation recurs on a third surface, stop: it's not an exception, it's a wrong
  convention. Amend Part A and delete the records (note the amendment in the revision history).
- High-stakes records are the ones a build session tests hardest — write their `behaviour`
  field with the same given/when/then precision as a REQ example where possible.

---

## 5. Running a mockup session with this template (the walkthrough protocol)

For **each mockup produced or reviewed** in the session:

1. **Bind elements** — write/update the wireframe sidecar (ROME-GUIDE-001 Part 3): every
   element binds to a lexicon attribute and a REQ/UJ id, or is marked decorative.
2. **Classify behaviours** — for every interactive element and every transition the mockup
   implies, ask: *is this covered by a Part A convention?*
   - Covered, conforming → write nothing (the silence rule).
   - One of the three Part B triggers → write/extend a `UXD-*` record.
   - Covered by nothing, and implies new capability → **emit a question (R2)**; do not design
     scope into existence via a picture.
3. **Sweep the states** — confirm every empty/error/loading state the coverage matrix declares
   for these surfaces appears in the mockup or a `UXD-*` record; states the mockup shows that
   nothing declares are findings (route them: coverage-matrix row first, then design).
4. **Ledger it** — add the row to §6. A mockup absent from the ledger doesn't exist, and a
   ledger row is what Gate 6 checks.
5. **Close with the gate** — run the Gate 6 UXIS block (ROME-PIPELINE-003) over what this
   session touched; report pass/fail/carried.

---

## 6. Coverage ledger

| Mockup / wireframe | Surfaces | Sidecar updated | UXD records touched | Conventions confirmed sufficient? | Date |
|---|---|---|---|---|---|

---

## 7. Structure of the finished document set

A project's UXIS, built with this template, ends up as:

```
<project>-UXIS.md
  §A  Universal Interaction Conventions   (UXC-* — most behaviour lives here)
  §B  Navigation map                      (UXD-NAV-MAP — routes × surfaces × guards)
  §B  Fine-grained definitions            (UXD-* — exceptions, high-stakes, novel only)
  §C  Coverage ledger                     (one row per mockup, kept current)
```

Manifest precedence slot: below workflows, above mechanism references and copy (per pipeline
§6, rank 8). The conventions section is ratified at its first Gate 6 pass and thereafter
amended under change control like any spec: convention change → this doc first → then any
mockups it invalidates get re-swept.

---

## Revision History

| Version | Date/Time (ISO 8601) | Summary |
|---------|----------------------|---------|
| 0.1 | 2026-07-19T00:00:00Z | Standalone UXIS template extracted from AnD_Stage_Templates v0.2's embedded T6f and restructured per sponsor direction: two-layer form — Part A universal conventions (UXC-*, with the silence rule) + Part B fine-grained definitions (UXD-*, three triggers, mandatory `overrides` citation) — plus the mockup-session walkthrough protocol and the promote-to-convention rule (a deviation recurring three times is a wrong convention). Behavioural-not-visual boundary stated. |
