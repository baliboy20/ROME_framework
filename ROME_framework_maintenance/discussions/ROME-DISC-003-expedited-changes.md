# ROME-DISC-003 — Expedited Changes: sponsor-directed edits with post-approval

Document UID: ROME-DISC-003
Status: Discussion — not a proposal; nothing herein changes any rule
Document Type: Review / Discussion
Author: Archie (from a sponsor question, 2026-07-30)
Companion: PROP-054 (change queue), PROP-056 §7a (field evidence), AX-24 (the stub precedent), AX-27/38 (recorded sponsor decisions)

---

## In Plain Terms

Sometimes, mid-development, the sponsor wants a change made *now* — a label,
a broken button, a demo tomorrow — and the full classify-confirm-gate path,
however light, is friction at the wrong moment. Today the framework has no
sanctioned way to do this, so it happens anyway, off the record (we have the
field evidence). This paper discusses giving that pressure a recorded
channel: the sponsor authorizes the quick edit *before* it happens (thirty
seconds, one queue entry), the edit is made immediately, and the change is
then run through the normal checks afterwards — with real teeth: the project
cannot be sealed/delivered while any quick change is still unratified, the
retro-check is allowed to conclude the change was wrong, and only small
code-level changes qualify. Expedience becomes visible debt with a due date,
not a bypass.

---

## 1. The problem is real and already happening

- frob-admin-Bacon: app-icon assets edited directly in the working tree; the
  queue entry followed the work, not the other way round.
- PROP-056 §7a: sponsor-approved deviations living only in design documents
  because the sanctioned path was blocked. Conclusion recorded there: *"the
  drift is not carelessness — it is what the API leaves people no choice but
  to do."*
- Refusing an expedient path does not prevent expedient edits; it only
  guarantees they are untracked. An invisible channel is strictly worse than
  a sanctioned one.

## 2. The precedent to build on: the stub model (AX-24)

ROME already has a mechanism for "sponsor-declared debt, recorded before it
is incurred, with a due point, blocking delivery while outstanding": stubs.
An expedited change is the same shape applied to the change queue. Nothing
architecturally new is required — that is the strongest argument that this
can be added without weakening the framework's promise.

## 3. Proposed shape (for discussion)

| Element | Rule | Rationale |
|---------|------|-----------|
| Capture-first | Queue entry BEFORE the edit: description, recorded sponsor authorization (`sponsorAuthorized: true` — the AX-27/38 pattern), declared touched scope (files/component, or the commit hash immediately after) | What is forbidden is untracked speed, not speed. The trace anchor makes retro blast-radius computable |
| New status | `EXPEDITED` in the change-queue flow; reachable only with sponsor authorization | Distinct from QUEUED (not yet acted) and IN_PROGRESS (running the path) |
| Regularization | The normal path run retroactively: trace-verified classification (AX-31), blast radius, tests, gate with evidence (AX-32, Sarah's evidence-from-disk). Only then DELIVERED | Post-approval is the real path deferred, not a lighter path |
| Teeth 1 — seal block | `sealActive` refuses while any EXPEDITED entry is unregularized (exact AX-24 mechanic) | "Later" cannot become "never" |
| Teeth 2 — refusable | A failed retro-gate converts the entry into a defect against itself: fix or revert, sponsor decides. The record may conclude the expedient change was wrong | A gate that can only ratify is theatre |
| Tier limit | Code-tier only (would-be CT-1/CT-2). Requirement/design/architecture-tier requests are refused the expedited path (HIGH-priority queue instead) | You can retro-approve a label; you cannot retro-approve architecture — downstream work builds on it before the gate could object |
| Accumulation cap | Max N open EXPEDITED entries (propose N=3); further requests refused until one regularizes | Expedience as exception stays honest; as default it is the framework failing, made visible |

## 4. Dangers, named honestly

1. **Rubber-stamp drift.** Retro-gates psychologically bias toward approval
   because the code already "works." Mitigations: Sarah's evidence rule
   applies unchanged; the seal-block means unratified debt hurts; the cap
   keeps volume reviewable. Residual risk accepted and stated.
2. **Scope creep inside an authorized edit.** The entry authorizes a
   declared scope; the retro-classification checks the actual diff against
   it. A mismatch is a finding, not a footnote.
3. **Tier misjudgment under pressure** ("it's just a label" that is actually
   a requirement change). The existing AX-31 reclassification already
   handles this at regularization: the trace decides, and a mis-tiered
   expedited change fails its retro-gate into the fix-or-revert path.
4. **Erosion by success.** If expedited becomes the habitual path, the cap
   triggers constantly — which is the correct signal that the standard light
   path (CT-1/2 → [P5]) is too heavy and should be improved, rather than the
   cap raised.

## 5. What this does NOT change

- The guard remains the sole authority on delivery; nothing is DELIVERED
  without the full evidence chain (AX-32 untouched).
- No gate is skipped — every gate is deferred, none waived.
- Greenfield phase work is out of scope: this is for changes against
  built/running code during development and after delivery, not a way to
  write P5 code before P3 exists.

## 6. Questions for the sponsor

1. Cap value: is 3 open expedited entries right? (Lower = stricter honesty;
   higher = more parallel expedience.)
2. Should regularization have a time expectation (e.g. "before the next
   seal" only, as drafted — or additionally "within N days" with the doctor
   flagging stale debt)?
3. Is commit-hash anchoring acceptable as the scope record (requires the
   project repo to commit the expedited edit immediately), or is a declared
   file list enough?
4. Should the expedited path exist for DELIVERED projects too, or only
   during active development increments? (Drafted: both — the seal-block
   naturally covers each.)

If discussion converges: one proposal (PROP-058 or next free number)
amending PROP-054's queue machinery (`EXPEDITED` status, authorization
record, seal-block, cap), with an axiom stating the invariant — candidate
wording: *"An expedited change is sponsor-authorized before the edit,
trace-anchored, and never delivered without its deferred gates; sealing
refuses while one is outstanding."* Per DISC-002 §4.3, that axiom would
declare what it builds on (AX-24 pattern; amends AX-32's path, never its
guarantee).

---

## Revision History

| Rev | Date (ISO 8601) | Summary |
|-----|------------------|---------|
| v1.0 | 2026-07-30 | Initial discussion draft from sponsor question: capture-first EXPEDITED status, stub-precedent seal-block, refusable retro-gate, code-tier limit, accumulation cap, dangers named, sponsor questions. |
