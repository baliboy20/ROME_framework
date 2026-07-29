# FOB — Baseline B1 · ROME Build Handoff (Stage 9)

| | |
|---|---|
| **Baseline** | **B1** · 2026-07-21 |
| **STRICT validation** | ✅ PASS at 2026-07-21 — evidence: `Alignment_And_Validation_2026-07-21.md` (Gates 7 & 8) |
| **Runs frozen** | Aristotle (2026-07-20→21) + Bacon (2026-07-21) |
| **Precedence** | live D1 DDL → Decision Records → module specs → Lexicon → Data Dictionary → Coverage → Workflows → Architecture → handovers |

This is the coherent, validated version handed to ROME. Build each module with `/and-build <module>`, in the order below, using its paste set.

---

## 1. Frozen doc set

| Doc | Version | Role |
|---|---|---|
| `FOB-TSPEC-001_Technical_Spec.md` | 1.0 | **Binding technical decisions (17 TDRs)** — the *how* |
| `DOMAIN-LEXICON.md` | 0.1 (current) | Vocabulary + entity/state model |
| `Module_Map.md` | 0.1 (current) | Boundaries + dependency graph |
| Decision Records (Aristotle ×7 + Bacon) | — | Ratified tie-breakers |
| 13 module specs | v0.1–0.2 | Normative behaviour (78 REQs) |
| `Data_Dictionary.md` | 0.9 | Fields + enum registry |
| `Surface_Journey_Coverage.md` | 0.9 | Surfaces (W/A/G/E/P) |
| `Operational_Workflows.md` | 0.9 | Journey step-tables |
| `Architecture_Allocation.md` | 0.9 | Layer allocation + providers |
| `Alignment_And_Validation_2026-07-21.md` | 1.0 | STRICT verdict |
| `MANIFEST.md` | — | Index + precedence + maintenance |

## 2. Build order (topological — dependencies first)

Each module's `depends-on` must be built (or interface-stubbed) before it. Stubbing is fine — build against **interfaces, never internals** (module-build isolation).

| # | Module | Build with only these other modules' **headers** | Existing code to reuse |
|---|---|---|---|
| 1 | `core-data-access` | — | admin-rome D1 migrations |
| 2 | `core-design-system` | — | `styles.css` + `design-system.md` (tokens; Flutter component lib to-build, DR-12) |
| 3 | `core-auth` | DATA | admin-rome `lib/jwt.ts`; route-pipeline `auth.ts` (X-Device-ID) |
| 4 | `core-consent-audit` | DATA | `consents` DDL; `gdpr-cleanup` cron |
| 5 | `core-notifications` | DATA, CNA | admin-rome `lib/email.ts` (Postmark); `pocs/email`; stripe `webhook_events` (idempotency) |
| 6 | `pre-sales` | DATA, CNA, NOTIF | — (no reference code) |
| 7 | `fleet-equipment` | DATA, AUTH, NOTIF | — (greenfield) |
| 8 | `booking` | DATA, AUTH, CNA, NOTIF, PRE, FLEET | `pocs/stripe_embedded_checkout`; admin-rome booking/departure/participant/payment routes |
| 9 | `core-seo` | *(presumes marketing/route-catalogue + static-build — out of scope; stub)* | admin-rome static HTML frontend |
| 10 | `tour-operations` | DATA, AUTH, CNA, NOTIF, BOOK, FLEET | `guide_app/` (GMT, partial) |
| 11 | `pre-tour` | DATA, AUTH, CNA, NOTIF, BOOK, OPS | reminder cron (partial) |
| 12 | `post-tour` | DATA, CNA, NOTIF, BOOK, OPS | review-request + gdpr crons |
| 13 | `back-office` | AUTH, BOOK, FLEET, pre-tour | admin-rome ops admin (partial) |

*`core-data-access` and `core-design-system` carry **zero REQs** — build them as the presumed shared subsystem / design asset they are (architecture at 6d, design at 6e), not from a requirements list.*

## 3. Per-module paste set (the `/and-build <module>` inputs)

For **every** module, hand the build session exactly:
1. **That module's spec** (normative).
2. **`FOB-TSPEC-001_Technical_Spec.md`** (the TDRs — binds the stack/vendor/deployment/patterns for P3–P5; the build cites `satisfies: TDR-##`).
4. `DOMAIN-LEXICON.md` (vocabulary + fixtures = seed data).
5. Its **Decision Record(s)** (the tie-breakers touching it).
6. `Data_Dictionary.md` (its entities + the enum registry).
7. Its **`Operational_Workflows.md` step-tables** (its UJ-### only).
8. Its **`Architecture_Allocation.md` rows** + the `presumes`-provider table.
9. **Dependency headers only** from the modules in the §2 order — `depends-on` / `presumes` + declared interfaces, **never their bodies**.
10. The **build/POC reference** (§2 column 4), as *existing-code context*, not greenfield instructions.

**Binding rules for the build session** (from `/and-build`):
- Precedence on conflict; stop and cite both, never pick silently (R2).
- Outcomes + Errors are the **test contract** — each gets a test; the REQ `example` blocks are the seed vectors.
- **Scope is the spec** — no field, enum, or surface not traceable to a REQ id. A needed-but-missing anything = emitted question, not an invention.
- Respect the **interim-default decisions** (D-NOTIF-1/2, D-TOUR-2/3, D-OPS-5, DR-BO4/6) — build to the default, flagged, not to a guess.

## 4. AORDL conversion — worked sample

The 78 REQ entries are already in the 13-field shape; conversion is mechanical. Example (`REQ-BOOK01`):

```yaml
- id: REQ-BOOK01
  actor: Customer
  intent: create booking-selection
  preconditions: a departure exists (scheduled via REQ-BOOK11) with available capacity for the requested party size
  conditions: party size does not exceed remaining capacity (max 10, F-19); a slot hold is acquired for the flow
  postconditions: a booking draft exists in `draft`; the departure's available capacity is reduced by the held party size
  outcomes:
    - Customer sees their selection confirmed and proceeds to attendee details
    - Owner never sees a departure oversold beyond its capacity
  invariants: held+confirmed capacity never exceeds the maximum; a slot hold is time-bounded
  nonFunctional: Reliability — capacity check + hold are atomic (no race on the last space)
  errors:
    - condition: party size exceeds remaining capacity
      message: "This slot doesn't have enough space — try a smaller group or another date"
    - condition: departure has no remaining capacity
      message: "This slot is no longer available — please choose another"
  scopeBoundary:
    inScope: [tour/date/party-size selection producing a held draft]
    outOfScope: [multi-tour cart, partial-tour selection]
  openQuestions: []
  copilotMode: STRICT
```

## 5. Change-control loop (in force from B1)
- New decision → **Decision Record first** → propagate → stale-reference sweep.
- New field/enum → **Data-Dictionary revision first** → specs reference it.
- New surface → must **earn a coverage-matrix row** (journey + REQ) or it isn't built.
- Build-session discoveries (new question, missing enum, phantom surface) flow back to the DR / dictionary / coverage matrix — **never patched only in code**.

## 6. Known outstanding handed to the build (documented, not hidden)
- **Carried holes:** `UJ-TOUR-08` (no REQ, DR-T1); DR-B8 recovery email, DR-F1 maintenance trigger, DR-F6 certification gate (ratified, unauthored); 2 undriven bike states (DR-F8/F9).
- **Interim-default decisions:** D-NOTIF-1/2, D-TOUR-2/3, D-OPS-5, DR-BO4/6.
- **Deferred scope (do not build):** OTA (UJ-BOOK-08), gift vouchers (UJ-BOOK-11), concierge/AI (UJ-PRE-04/07, UJ-TOUR-05), POST retention (UJ-POST-05–09), fleet retire/dispose (UJ-FLEET-06).

---

## Change log since previous baseline
| Change | Driven by | Docs touched |
|---|---|---|
| First baseline | Stages 7–8 BASELINE-READY | all |

## Handed to
ROME build sessions, one per module, in the §2 order, with the §3 paste set each.
