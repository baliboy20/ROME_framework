# Design Principle: Sponsor Question Alternative Answers

| Field | Value |
|-------|-------|
| **Document UID** | ROME-PRIN-002 |
| **Version** | 1.0 |
| **Date** | 2025-11-25T00:00:00Z |
| **Status** | Principle |
| **Document Type** | Design Principle |
| **Author** | Framework Analyst & Architect |
| **Scope** | All sponsor-facing question interfaces |

---

## Principle Statement

**ALL sponsor-facing questions with predefined options MUST provide mechanism for sponsor to supply alternative or custom answer.**

---

## Rationale

### Problem

Robot-generated question options based on analysis assumptions. Assumptions may be:
- Incomplete (missing valid option)
- Incorrect (misunderstanding sponsor intent)
- Constraining (forcing false choice between inadequate options)

### Impact of Violation

Sponsor forced to select "least wrong" option, leading to:
- Implementation diverges from sponsor's actual intent
- Rework required when misalignment discovered
- Sponsor frustration with constrained interaction
- Loss of sponsor's domain expertise/insight

### Principle Benefit

- Sponsor never constrained by robot assumptions
- Captures sponsor's actual intent vs. forced approximation
- Enables sponsor to provide context robots couldn't anticipate
- Respects sponsor as authoritative source of requirements

---

## Implementation Requirements

### Mandatory Patterns

#### Pattern 1: Multiple Choice + Text Field (PREFERRED)

```javascript
// Multiple choice question
{
  id: "question_id",
  type: "radio",  // or "checkbox"
  label: "Question text?",
  required: true,
  options: [
    { label: "Option A", description: "..." },
    { label: "Option B", description: "..." },
    { label: "Option C", description: "..." }
    // Note: Seez tool automatically adds "Other" option
  ]
},
// MANDATORY: Separate text field for elaboration/alternative
{
  id: "question_id_custom",
  type: "textarea",
  label: "Alternative approach or additional context",
  required: false,
  placeholder: "If none of the above options fit, describe your preferred approach..."
}
```

#### Pattern 2: Text-Only Questions

Questions without predefined options inherently allow alternatives. Still recommended to include elaboration field if primary question is structured.

```javascript
{
  id: "open_question",
  type: "textarea",
  label: "How should we handle X?",
  required: true,
  placeholder: "Describe your preferred approach..."
}
```

---

## Tool-Specific Implementation

### Seez MCP Tool (`mcp__Seez__ask_questions`)

**Built-in Support:** Seez automatically provides "Other" option for radio/checkbox questions.

**Robot Responsibility:** Always include companion textarea field for alternative explanation.

**Example:**

```javascript
mcp__Seez__ask_questions({
  label: "Design Decision",
  title: "API Authentication Method",
  questions: [
    {
      id: "auth_method",
      type: "radio",
      label: "Which authentication approach?",
      required: true,
      options: [
        { label: "JWT tokens", description: "Stateless token-based auth" },
        { label: "Session cookies", description: "Server-side session management" },
        { label: "OAuth 2.0", description: "Third-party authentication" }
        // Seez automatically adds "Other" option
      ]
    },
    // MANDATORY companion field
    {
      id: "auth_method_custom",
      type: "textarea",
      label: "Alternative authentication approach or additional requirements",
      required: false,
      placeholder: "e.g., specific OAuth provider, hybrid approach, additional constraints..."
    }
  ]
})
```

### Other Communication Channels

**iMessage/Terminal Notifier:** Not applicable (notification-only, no input collection)

**Text-based prompts:** Always phrase questions open-endedly, avoid yes/no unless genuinely binary.

---

## Validation & Compliance

### Robot Self-Check

Before sending question to sponsor:

```
□ Question includes multiple choice options?
  → Yes: Companion textarea field included?
    → Yes: COMPLIANT
    → No: VIOLATION - add textarea field
  → No: COMPLIANT (open-ended question)
```

### Roma Audit

During sponsor interaction review:

```
Query: All sponsor_interactions of type "clarification" or "approval"
For each: Validate structure includes alternative mechanism
Flag: Violations for robot training update
```

---

## Exception Cases

### Binary Decisions (Approval/Rejection)

Phase gate approvals genuinely binary (Approve/Reject/Defer). Still provide feedback field:

```javascript
{
  id: "approval",
  type: "radio",
  label: "Approve phase transition?",
  required: true,
  options: [
    { label: "Approve", description: "Proceed to next phase" },
    { label: "Reject", description: "Return with feedback" },
    { label: "Defer", description: "Need more time to review" }
  ]
},
// MANDATORY: Feedback field even for approval
{
  id: "feedback",
  type: "textarea",
  label: "Feedback or conditions",
  required: false,
  placeholder: "Comments, concerns, or conditions for approval..."
}
```

**Rationale:** Even binary decisions may have nuance (conditional approval, specific concerns, timeline constraints).

---

## Training & Enforcement

### Robot Training (CLAUDE.md)

All robot CLAUDE.md files MUST include:

```markdown
### Sponsor Question Design (MANDATORY)

When asking sponsor questions with predefined options:

1. ALWAYS include companion textarea field for alternative answers
2. Label field clearly: "Alternative approach" or "Additional context"
3. Set required: false (optional field)
4. Provide helpful placeholder text
5. Process alternative answers same priority as predefined options

Non-compliance: Question rejected, must be reformulated.
```

### Roma Enforcement

Roma reviews all sponsor question requests before transmission:

```
IF question.type IN ["radio", "checkbox"]
  AND NOT companion_textarea_exists(questions)
THEN
  REJECT question
  NOTIFY robot: "Violation ROME-PRIN-002: Add alternative answer field"
  REQUIRE reformulation
```

---

## Processing Alternative Answers

### Robot Responsibility

When sponsor selects "Other" or provides alternative:

1. **Read carefully:** Alternative may reframe entire question
2. **Seek clarification if needed:** Alternative ambiguous → follow-up question
3. **Log thoroughly:** Record alternative in activity log with full text
4. **Update assumptions:** Sponsor's alternative reveals gap in robot understanding
5. **No dismissal:** Alternatives equal weight to predefined options

### Example Flow

```
Robot asks: "Which database?"
Options: PostgreSQL, MySQL, MongoDB

Sponsor selects: "Other"
Sponsor writes: "We use DynamoDB for serverless, integrate with our existing infrastructure"

Robot response:
✓ CORRECT: "Understood, will design for DynamoDB integration. Confirming: Use existing DynamoDB instance or provision new?"
✗ INCORRECT: "DynamoDB not in options, defaulting to PostgreSQL"
```

---

## Related Documents

- **ROME-REV-005:** Sponsor Interaction Framework (implementation examples)
- **ROME-PROC-002:** Sponsor Interaction Protocol (operational procedures)
- **ROME-GOV-006:** Sponsor Interaction Policy (channel rules, decision authority)
- **AskUserQuestion Tool:** Claude Code built-in tool (always provides "Other" option)

---

## Impact Assessment

| Stakeholder | Impact |
|-------------|--------|
| **Sponsor** | ✓ Never constrained by inadequate options<br>✓ Can express actual intent<br>✓ Reduces frustration |
| **Robots** | ⚠ Must handle alternative answers<br>⚠ Cannot assume predefined options sufficient<br>✓ Better understanding of sponsor intent |
| **Roma** | ⚠ Must enforce principle<br>✓ Fewer rework cycles from misalignment |
| **Framework** | ✓ Higher fidelity requirements capture<br>✓ Reduced rework costs<br>✓ Improved sponsor satisfaction |

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Alternative answer usage rate | >10% | % questions where sponsor provides alternative |
| Rework due to misunderstood questions | <5% | % features requiring rework from clarification gaps |
| Sponsor satisfaction (question clarity) | >8/10 | Sponsor feedback survey |
| Principle compliance rate | 100% | % sponsor questions following pattern |

---

## Examples

### Example 1: Technology Choice

**Question:** Framework selection for frontend

❌ **Incorrect:**
```javascript
{
  type: "radio",
  label: "Which frontend framework?",
  options: [
    { label: "React", description: "..." },
    { label: "Vue", description: "..." },
    { label: "Angular", description: "..." }
  ]
  // Missing alternative field
}
```

✓ **Correct:**
```javascript
{
  type: "radio",
  label: "Which frontend framework?",
  options: [
    { label: "React", description: "..." },
    { label: "Vue", description: "..." },
    { label: "Angular", description: "..." }
  ]
},
{
  type: "textarea",
  label: "Alternative framework or additional constraints",
  required: false,
  placeholder: "e.g., Svelte, Next.js, or specific version requirements..."
}
```

---

### Example 2: Design Pattern

**Question:** API error handling strategy

❌ **Incorrect:**
```javascript
{
  type: "checkbox",
  label: "Which error handling patterns?",
  multiSelect: true,
  options: [
    { label: "Try-catch blocks", description: "..." },
    { label: "Error boundaries", description: "..." },
    { label: "Global error handler", description: "..." }
  ]
  // Missing alternative field
}
```

✓ **Correct:**
```javascript
{
  type: "checkbox",
  label: "Which error handling patterns?",
  multiSelect: true,
  options: [
    { label: "Try-catch blocks", description: "..." },
    { label: "Error boundaries", description: "..." },
    { label: "Global error handler", description: "..." }
  ]
},
{
  type: "textarea",
  label: "Alternative error handling approach or specific requirements",
  required: false,
  placeholder: "e.g., custom error middleware, specific logging service, error reporting tool..."
}
```

---

### Example 3: Approval with Conditions

**Question:** Phase gate approval

✓ **Correct (even for binary decision):**
```javascript
{
  type: "radio",
  label: "Approve Design → Config transition?",
  options: [
    { label: "Approve", description: "Proceed to Config phase" },
    { label: "Reject", description: "Return to Design with feedback" },
    { label: "Defer", description: "Need more time to review" }
  ]
},
{
  type: "textarea",
  label: "Feedback, conditions, or concerns",
  required: false,
  placeholder: "Conditional approval, specific review feedback, timeline concerns..."
}
```

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 1.0 | 2025-11-25T00:00:00Z | Initial principle definition |
