# ROME-DISC-002 — Rule Bloat: a self-review of the framework's regulatory growth

Document UID: ROME-DISC-002
Status: Discussion — not a proposal; nothing herein changes any rule
Document Type: Review / Discussion
Author: Archie
Date: 2026-07-30
Companion: ROME-DISC-001 (OWL discussion — Stage A is the candidate instrument for §4.1)

---

## In Plain Terms

The framework's rule-book is growing fast — 27 axioms to 39 in two weeks —
and while our process is good at preventing rules from *contradicting* each
other, nothing in it ever asks whether a new rule could *replace* an old one,
or whether the same fact is written down in too many places. This paper takes
stock honestly: where the bloat actually is, which rules are candidates for
merging, which duplicated tables should be generated instead of hand-kept,
and what standing discipline would stop the drift. It decides nothing; it
maps the terrain for a decision.

---

## 1. The growth record (facts, not judgment)

| Release | Axioms | Standards | Lexicon terms (approx) | Notes |
|---------|--------|-----------|------------------------|-------|
| v3.2.1 (2026-07-17) | 30 | 7 | ~55 | baseline for this review |
| v3.3.0 (2026-07-27) | 35 | 7 | ~62 | PROP-054/055 |
| v3.3.1 (2026-07-28) | 37 | 7 | ~64 | PROP-056 |
| v3.4.0 (2026-07-29) | 39 | 8 | ~67 | PROP-057 |

Per-change ceremony: a typical proposal now touches ontology + lexicon +
one standard + changelog + uid-registry + the proposal file itself, plus
tests — v3.4.0's release commit was 25 files, roughly 10 of them governance.

What the process DID prevent: no contradictions shipped; every axiom carries
enforcement + a tagged test; mechanism reuse held (changes run as increments,
flows reuse the omission pattern, scoped deviations amended an API rather
than adding one). The bloat is volume and duplication, not incoherence.

## 2. Where the bloat actually is

### 2.1 The same fact authored in several places (worst class)

| Fact | Authored locations today | Drift record |
|------|--------------------------|--------------|
| Required gate facts per phase | `lifecycle.js` (authoritative), gate-decision-standard §3 table, lifecycle.js comment block, ontology AX-08 note | Drifted TWICE (std v1.1, v1.5 — the second on release day) |
| Axiom list + enforcement | ontology.md, fidelity ENFORCED list (hardcoded), test tags | manual triple-keeping |
| CT taxonomy | PROP-054, lexicon, USER-GUIDE table, orchestrator.md | consistent so far — by vigilance only |
| Consolidated MCP set | 9 ROBOT.md files + agent-roles-standard | fidelity 7a greps all nine |

### 2.2 Axioms that are bundles

- **AX-36** is three rules wearing one number: (a) no silent register
  shrink; (b) empty-after-populated fails conformance; (c) monotonic
  deviation ids. Each has its own enforcement point and test.
- **AX-34** bundles declaration, refusal-above, and compatibility-read-mode.

### 2.3 Axioms sharing one skeleton, restated per instance

The pattern "absence of a recorded sponsor decision = fail; a recorded
sponsor-authorized omission = pass; nothing defaults" appears independently
in **AX-27** (AIB checkpoints), **AX-38** (flows), and in spirit in **AX-18**
(reliability gating) and the `sponsorOq` fact. One *sponsor-decision
pattern* axiom with declared instances would state the invariant once.

Similarly, **AX-29** (binding TDRs must be cited or deviated) and **AX-39**
(declared errors must be routed) are both instances of "a declared
obligation must be explicitly discharged, never silently absent."

### 2.4 Prose restating code

Portions of the standards paraphrase what `guard.js`/`lifecycle.js` simply
are. Useful for human reading; a liability when hand-maintained (see 2.1).

## 3. What is NOT bloat (scope guard for the discussion)

- The tagged-test-per-axiom requirement: that is the enforcement floor, not
  ceremony. Consolidating axioms must not reduce test coverage — merged
  axioms keep every constituent test.
- Revision histories and the uid-registry: traceability is a core objective;
  the cost is real but the alternative is unaccountable drift.
- The "In Plain Terms" convention (ROME-GOV-001 v1.1): sponsor legibility is
  a requirement, not overhead.

## 4. Candidate reductions (for discussion, not decision)

### 4.1 Generate the duplicated tables — no new technology required
The gate-decision §3 table and the ontology AX-08 note become generated
views of `lifecycle.js` (a small script + fidelity check that the committed
doc matches the generation). Kills drift class 2.1 row 1 permanently.
ROME-DISC-001 Stage A extends the same derived-view principle to the whole
ontology; this row is worth doing even if Stage A never happens.

### 4.2 A consolidation pass over AX-01..39
Target: a SMALLER axiom set with unchanged enforcement. Mechanics:
- merge candidates: the AX-27/AX-38 skeleton (§2.3) → one pattern axiom
  with instances; assess AX-29/AX-39 the same way;
- split-then-regroup AX-36 so numbering matches enforcement units;
- retirement is NEVER deletion: a subsumed axiom keeps its row, marked
  `SUBSUMED by AX-nn` with its tests re-tagged — ids stay resolvable
  forever (the uid-registry precedent).

### 4.3 A standing subsume-or-justify rule
Going forward, any proposal introducing an axiom must state which existing
axiom it subsumes, amends, or extends — or argue why none. One sentence of
ceremony that converts growth from default to decision. (Would amend
ROME-GOV-001; this paper only floats it.)

### 4.4 Fidelity list generation
The hardcoded ENFORCED list in `check-framework-fidelity.sh` becomes
derived from the ontology's provenance column — one authored source.

## 5. Honest counter-position

Rule count is not, by itself, harm. Each axiom was earned by a real defect
or a real design decision; the framework's guarantees are the product being
built. The cost that matters is *maintenance surface* (places to touch per
change) and *drift risk* (hand-kept duplicates) — which is why §4.1/§4.4
(generation) rank above §4.2 (consolidation) in value-per-effort, and why
"fewer axioms" should never be pursued at the price of vaguer ones. A
39-axiom set that is precise beats a 25-axiom set that is poetic.

## 6. Questions for the sponsor

1. Accept the principle that duplicated tables become generated views
   (§4.1, §4.4) — even where that means a doc is partly machine-written?
2. Is a consolidation pass (§4.2) worth an Archie work-cycle now, or defer
   until the OWL Stage A projection (DISC-001) can inform which axioms are
   formally subsumable?
3. Adopt the subsume-or-justify rule (§4.3) as a GOV amendment?
4. Is there a target ceiling the sponsor wants stated (e.g. "the axiom set
   should not exceed ~40 without a consolidation pass"), or should growth
   remain unbounded-but-justified?

If discussion converges, outcomes split naturally: §4.1/§4.4 → a small
implementation proposal; §4.2 → a dedicated consolidation proposal;
§4.3 → a ROME-GOV-001 amendment.

---

## Revision History

| Rev | Date (ISO 8601) | Summary |
|-----|------------------|---------|
| v1.0 | 2026-07-30 | Initial discussion draft: growth record, bloat taxonomy (duplication > bundling > skeleton-restatement > prose-restating-code), candidate reductions with generation ranked above consolidation, counter-position, sponsor questions. |
