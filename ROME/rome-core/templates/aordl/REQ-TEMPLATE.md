# AORDL Requirement Template (Markdown Format)

**Version:** 1.0
**Date:** 2025-12-23
**Format:** AI-Optimized Requirement Design Language (AORDL)

---

## ID
**REQ-XXX**

*Format: REQ-### (e.g., REQ-001, REQ-042)*
*Must be unique across all requirements*

---

## Actor
**ActorRole**

*Single role or persona (not generic "user")*
*Examples: Customer, Administrator, SystemIntegrator, AccountManager*
*❌ Anti-pattern: "User", "Person", "Someone"*

---

## Intent
**verb business-object**

*Format: `<approved-verb> <business-object>`*

**Approved Verbs:**
- create, read, update, delete
- submit, approve, reject, cancel
- archive, restore, export, import
- view, search

**Examples:**
- create invoice
- approve purchase-order
- export report

*❌ Anti-pattern: Compound intents, UI language, technical jargon*

---

## Preconditions

- Precondition statement 1
- Precondition statement 2

*System state that must be true BEFORE the intent can be executed*

**Describes:** Authentication, authorization, data existence

**Examples:**
- Customer authenticated
- Customer has active subscription
- Product exists in catalog

*❌ Anti-pattern: UI states, button states, technical implementation*

---

## Conditions

- Condition statement 1
- Condition statement 2

*Contextual conditions that influence execution*

**Describes:** Business rules, timing, thresholds

**Examples:**
- Order total exceeds $1000
- Current date is within billing period
- Inventory level below reorder point

*Can be empty if no conditional logic*

---

## Postconditions

- Postcondition statement 1
- Postcondition statement 2

*System state that must be true AFTER successful execution*

**Describes:** State transitions, data updates, system effects

**Examples:**
- Invoice status set to 'draft'
- Customer notified via email
- Audit log entry created

*❌ Anti-pattern: UI feedback, messages shown*

---

## Outcomes

- Outcome statement 1
- Outcome statement 2

*Observable results from the Actor's perspective*

**Describes:** What the Actor can verify happened

**Examples:**
- Invoice saved to database with unique ID
- Customer receives email confirmation
- Invoice appears in customer invoice list

*Must be observable and verifiable*

---

## Invariants

- Invariant rule 1
- Invariant rule 2

*Business rules that must ALWAYS be true*

**Domain truths that cannot be violated**

**Examples:**
- Invoice total = sum(line items) + tax + shipping
- Invoice number sequential and unique
- Line items must have at least one entry

**Enforced in:** Database constraints, API logic, UI validation

---

## NonFunctional

### Performance
- Performance requirement 1
- Performance requirement 2

### Security
- Security requirement 1
- Security requirement 2

### Scalability
- Scalability requirement 1

### Usability
- Usability requirement 1

### Reliability
- Reliability requirement 1

**Examples:**
- Performance: Invoice creation completes in <2 seconds
- Security: Requires JWT authentication
- Scalability: Supports 10,000 concurrent users

---

## Errors

### Error 1
- **Condition:** Error condition 1
- **Message:** "User-facing error message"

### Error 2
- **Condition:** Error condition 2
- **Message:** "User-facing error message"

*Format: Condition + Message*

**Examples:**
- **Condition:** If line items empty
- **Message:** "Invoice must have at least one line item"

---

- **Condition:** If subscription inactive
- **Message:** "Active subscription required to create invoices"

**Used for:** API error responses, UI validation messages

---

## ScopeBoundary

### InScope
- In-scope item 1
- In-scope item 2

*What this requirement covers*

**Examples:**
- Create invoice with line items, tax, shipping
- Email confirmation to customer

### OutOfScope
- Out-of-scope item 1
- Out-of-scope item 2

*What is explicitly excluded*

**Examples:**
- Invoice payment processing
- Invoice PDF generation

---

## OpenQuestions

### Question 1
- **Question:** Open question 1
- **Status:** OPEN | RESOLVED | DEFERRED
- **Resolution:** Resolution if resolved

### Question 2
- **Question:** Open question 2
- **Status:** OPEN | RESOLVED | DEFERRED
- **Resolution:**

*Questions that need clarification or decision*

**Status Values:**
- OPEN: Needs answer
- RESOLVED: Answered
- DEFERRED: Future consideration

**Examples:**
- **Question:** Should invoice editing be allowed after submission?
- **Status:** OPEN

---

- **Question:** Tax calculation: inclusive or exclusive?
- **Status:** RESOLVED
- **Resolution:** Exclusive - tax added to subtotal

---

## CopilotMode

**STRICT** | GUIDED | PERMISSIVE

*Validation strictness for AORDL processing*

- **STRICT:** Reject any deviation from AORDL rules
- **GUIDED:** Warn on deviations, suggest corrections
- **PERMISSIVE:** Accept with best-effort interpretation

*Recommended: STRICT for production, GUIDED for development*

---

## Metadata (Optional)

**Created:** 2025-12-23
**Author:** RequirementAuthor
**Version:** 1.0
**Priority:** HIGH | MEDIUM | LOW
**Epic:** EPIC-XXX
**Feature:** FEATURE-XXX

**Dependencies:**
- REQ-YYY
- REQ-ZZZ

**Tags:**
- tag1
- tag2

---

## Validation Checklist

Before submitting this AORDL requirement, verify:

- [ ] All 13 required fields are present
- [ ] ID is unique (REQ-###)
- [ ] Actor is a single, specific role (not "user")
- [ ] Intent uses approved verb + business object
- [ ] No UI language (click, button, screen, form)
- [ ] No technical jargon (POST, SQL, endpoint, API)
- [ ] No compound intents (multiple verbs)
- [ ] Invariants are domain truths (not implementation)
- [ ] Errors have both condition and message
- [ ] Outcomes are observable
- [ ] Preconditions describe system state (not UI state)
- [ ] Postconditions describe state changes
- [ ] CopilotMode is set

---

## AORDL → BDD Mapping Preview

*This AORDL requirement will generate:*

**Given** (from Preconditions + Conditions):
- Customer authenticated
- Customer has active subscription
- [Conditions if any]

**When** (from Intent):
- Customer creates invoice

**Then** (from Outcomes):
- Invoice saved to database with unique ID
- Customer receives email confirmation

**And** (from Postconditions):
- Invoice status set to 'draft'
- Audit log entry created

**Business Rules** (from Invariants):
- Invoice total = sum(line items) + tax + shipping
- Invoice number sequential and unique

**Error Scenarios** (from Errors):
- Given Customer tries to create invoice
- When line items are empty
- Then System responds with "Invoice must have at least one line item"

---

## Need Help?

**AORDL Documentation:**
- AORDL Framework Guide: `01_AORDL_Framework.md`
- AORDL Copilot Guide: `04_AORDL_Copilot_and_Analysis.md`

**Common Questions:**
- **Q:** What if I have multiple actors?
  **A:** Create separate requirements (one per actor per intent)

- **Q:** Can I include UI details?
  **A:** No - AORDL is UI-agnostic. Describe WHAT happens, not HOW (UI)

- **Q:** What's the difference between Outcomes and Postconditions?
  **A:** Outcomes = Observable by actor; Postconditions = System state changes

- **Q:** How detailed should Invariants be?
  **A:** Business rule level (not code level). "Total = sum" not "total = items.reduce()"
