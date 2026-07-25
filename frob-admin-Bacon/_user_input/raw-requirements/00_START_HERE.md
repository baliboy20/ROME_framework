# FOB — ROME Build Handoff · Baseline B1 (2026-07-21, refreshed)

**Status:** BASELINE-READY (STRICT-clean, both ROME guides satisfied).

Read these first, in order:
1. `MANIFEST.md` — index, precedence order, reading orders by task.
2. `Alignment_And_Validation_2026-07-21.md` — the validation verdict (Gates 7 & 8).
3. `BASELINE_ROME_Handoff_2026-07-21.md` — frozen set, build order, per-module `/and-build` paste sets.

Two binding authorities the build reads together:
- **AORDL requirements** (the *what*) — the 13 module specs (78 REQs).
- **`FOB-TSPEC-001_Technical_Spec.md`** (the *how*) — 17 TDRs fixing the Cloudflare/D1/Stripe/Postmark/JWT/Flutter stack.

Everything else is the aligned design set (lexicon, data dictionary, coverage,
workflows, architecture, decision records, Claude Design handovers).

Precedence on conflict: live DDL → Decision Records + TDRs → module specs →
Lexicon → Data Dictionary → Coverage → Workflows → Architecture → handovers.
