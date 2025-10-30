# Question & Option Completeness Framework
**Version**: 1.0 - Interactive Refinement Protocol for Chaperone & PMA
**Last Updated**: 2025-10-30
**Purpose**: Ensure clarifying questions receive adequate answers and option sets are complete before accepting user input

---

## Executive Summary

**The Problem**: When Chaperone and PMA ask users questions with multiple-choice options, sometimes the options don't cover the user's actual need. Without guidance, they're forced to accept incomplete answers or ask follow-up questions without knowing if they're being comprehensive.

**The Solution**: This framework provides:
1. **Decision tree** for choosing question types (multiple-choice vs. open-ended)
2. **Completeness criteria** for evaluating option sets
3. **Recovery patterns** for when options don't fit user's answer
4. **Validation protocols** to ensure specifications are adequately refined
5. **Examples** of good and bad question/option combinations

---

## Part 1: Question Type Selection

### 1.1 Decision Framework

When Chaperone or PMA needs clarification, first decide: **Multiple-choice or open-ended?**

```
START: Need user input on [Topic]

↓ Is there a DEFINED set of mutually exclusive options?
  (e.g., "What platform?" → Web|Mobile|Both)
  YES → Consider multiple-choice
  NO  → Use open-ended

  ↓ Can you predict ALL reasonable answers?
    (Would a knowledgeable user ever answer differently?)
    YES → Can use multiple-choice
    NO  → Use open-ended with optional follow-up

    ↓ Are there 2-5 options? (Not too many, not too few)
      2-5 → ✅ Multiple-choice is good
      6+  → Switch to open-ended OR categorize options
      1   → Question has predetermined answer (don't ask)

      ↓ Is there a sensible "Other" category if options don't fit?
        YES → ✅ Proceed with multiple-choice
        NO  → Add "Other" and open-ended follow-up

✅ MULTIPLE-CHOICE: Use when all options are known and user must pick
🟡 HYBRID: Multiple-choice with "Other - please specify"
📝 OPEN-ENDED: Use when answers can't be predicted
```

### 1.2 Question Type Guidelines

#### ✅ GOOD for Multiple-Choice Options

- Binary decisions: "Will this replace an existing system?" (Yes|No)
- Predetermined categories: "Target platforms?" (Web|iOS|Android|Cross-platform)
- Standard patterns: "Auth method?" (JWT|OAuth2|Session-based|API Keys)
- Discrete choices: "Testing strategy?" (Unit tests only|Integration tests|E2E tests|All)
- Industry standards: "Database type?" (Relational|Document|Key-Value|Graph)

**Pattern**: Clear, binary, or standard industry options with no predictable outliers

#### 🟡 HYBRID (Multiple-Choice + "Other")

Use when:
- Most users will pick from standard options
- BUT some users might have different approaches
- The "Other" case needs clarification

**Example**:
```
Q: "How often does this data need to be synchronized?"
- Daily
- Hourly
- Real-time
- Other (please describe): ___________
```

#### 📝 OPEN-ENDED: Use for

- Complex topics: "Describe the main user workflows"
- Subjective questions: "What makes this system successful?"
- Domain-specific: "Explain your current system architecture"
- Custom requirements: "What integration points exist?"
- Anything user might have unexpected answer for

**Pattern**: Questions where user's answer is unpredictable or can't fit in a small list

### 1.3 Red Flags for Inadequate Options

🚨 **Proceed with caution** if you're tempted to ask:

| Red Flag | Problem | Solution |
|----------|---------|----------|
| "Which programming language?" with only 2 options | You probably missed languages | Switch to open-ended |
| "Other (please specify)" with no follow-up | User's "other" not explored | Add prompt: "Please elaborate on [custom option]" |
| 6+ options in one question | Too many to choose from | Split into sub-questions or use open-ended |
| Vague option names | User doesn't know what you mean | Define each option with brief explanation |
| Options aren't mutually exclusive | User can pick multiple but you want one | Redesign as separate yes/no questions |
| Options are all solutions, not requirements | You're prescribing, not asking | Reframe to ask the business need, not the tech |

---

## Part 2: Completeness Criteria for Option Sets

### 2.1 Option Set Validation Checklist

Before asking a multiple-choice question, validate your options:

#### □ Comprehensiveness
- [ ] All realistic options are included
- [ ] No obvious option is missing
- [ ] User couldn't reasonably answer "none of these"
- [ ] User couldn't reasonably answer "some combination of these"

**Ask yourself**: "If a domain expert answered this question differently, would it be in my list?"

**If NO**: Add missing option OR switch to open-ended

#### □ Clarity
- [ ] Each option is clearly defined
- [ ] No two options overlap in meaning
- [ ] User understands what selecting each means
- [ ] Options use consistent terminology

**Ask yourself**: "Could a user reasonably misunderstand what an option means?"

**If YES**: Add definitions or examples to each option

#### □ Practical Relevance
- [ ] Each option has implications for the project
- [ ] No "obviously wrong" options included
- [ ] Options reflect real trade-offs users face
- [ ] Options aren't biased toward one answer

**Ask yourself**: "Would an expert ever recommend this option?"

**If NO**: Remove it

#### □ Completeness for Edge Cases
- [ ] Does the option set handle edge cases?
- [ ] Is there a sensible home for unusual answers?
- [ ] Should there be an "Other" option?

**Ask yourself**: "What if the user's answer doesn't fit neatly?"

**If UNSURE**: Add "Other (please specify)" with follow-up prompt

### 2.2 Completeness Scoring

Rate your option set 1-5:

**5 = Complete & Ready**
- ✅ All foreseeable answers covered
- ✅ Clear and distinct options
- ✅ User can make informed choice
- ✅ If "Other" exists, you know how to follow up

**4 = Good, Minor Issues**
- ⚠️ Options mostly complete
- ⚠️ Slight ambiguity in 1-2 options
- ⚠️ Could add "Other" for edge cases
- → Add clarification or "Other" option

**3 = Marginal, Needs Work**
- ❌ Some obvious gaps in options
- ❌ Ambiguous option definitions
- ❌ User might not find their answer
- → Revise options OR switch to open-ended

**2 = Problematic**
- ❌ Missing major options
- ❌ Unclear what options mean
- ❌ Likely to need follow-up questioning
- → Switch to open-ended with detailed prompt

**1 = Inadequate**
- ❌ Questions itself is unclear
- ❌ Options feel arbitrary
- ❌ Better asked as open-ended
- → Redesign question entirely

**Target**: Aim for 4-5 before asking user

---

## Part 3: Handling Incomplete Options

### 3.1 When User's Answer Doesn't Fit Options

**Scenario**: User answers in a way that doesn't match any option

**Recovery Pattern**:

```
Question: "What is your current system architecture?"
Options: A) Monolith | B) Microservices | C) Serverless

User answers: "It's a mix - we have some microservices in our
search system but the rest is monolithic. We're considering
serverless for new features."

❌ Answer doesn't fit cleanly into options
```

**Recovery Steps**:

1. **Acknowledge the Real Answer**
   ```
   "Thanks, that's helpful - a hybrid architecture
   where you're currently mostly monolithic with
   some microservices and exploring serverless."
   ```

2. **Document the Full Answer**
   - Store the detailed answer, not just the option
   - Note the nuance: "Hybrid monolith + microservices"

3. **Ask Targeted Follow-Up Questions**
   ```
   "Given this mix, which concerns you most:
   - Maintaining consistency across different architectures?
   - Migration path to microservices?
   - Serverless learning curve?
   - Other?"
   ```

4. **Refine Your Understanding**
   - What was the question really trying to understand?
   - What answer variant did you miss?
   - Could future questions have better options?

### 3.2 "Other" Options: When to Use & How to Follow Up

#### When to Include "Other"

Include "Other (please specify)" when:
- Options cover 80%+ of expected answers, but
- There's a foreseeable 10-20% who'll have different approach
- The "Other" answers are important to understand

**Examples where "Other" makes sense**:
```
Q: "What authentication method will you use?"
A: JWT | OAuth2 | Session-based | Custom (please describe)
    → Some orgs might use API keys, custom solutions

Q: "Which database will you use?"
A: PostgreSQL | MySQL | MongoDB | Other (please specify)
    → Some might use DynamoDB, Firestore, etc.
```

#### How to Handle "Other" Responses

**Pattern for Follow-Up Prompt**:

```
When user selects "Other":

1. IMMEDIATELY ask clarifying question:
   "You selected 'Other' for [topic].
    Could you describe your approach?

    Specifically:
    - [Aspect 1]: What does this mean?
    - [Aspect 2]: How does it affect [concern]?
    - [Aspect 3]: Are there constraints we should know?"

2. DOCUMENT the full answer with context:
   - What they specified for "Other"
   - How it relates to other decisions
   - Whether it creates dependencies/risks

3. ASSESS if this is a new pattern:
   - Should future projects include this as an option?
   - Did your option set miss something important?
   - Should other questions be adjusted?
```

**Example**:
```
User selects: "Custom (please describe)" for Auth

Follow-up:
"I see you're building custom authentication.
Help me understand:

1. What are the key requirements that standard
   auth methods don't meet?

2. Do you have existing user infrastructure
   we need to integrate with?

3. What's your approach to:
   - Token generation and validation?
   - Session management?
   - Password security and reset?

4. Are there compliance requirements
   (HIPAA, GDPR, etc.) driving this choice?"

DOCUMENT:
User Auth Strategy: Custom implementation
Drivers: [User's answer to Q1]
Integration: [User's answer to Q2]
Implementation Approach: [User's answer to Q3]
Compliance Considerations: [User's answer to Q4]
```

### 3.3 Incomplete Question Detection

**How to Know if Your Option Set Was Incomplete**:

Look for these signs:
- User answer requires explanation/clarification
- User answers "It depends" or "Both/Neither"
- User picks an option but qualifies it heavily
- You need follow-up questions to understand
- Answer doesn't feel like a complete refinement

**Lightweight Solution**:
```
If user's answer requires explanation:

1. Let them give full explanation
2. Document both the option they picked AND their explanation
3. Note: "Option set for [topic] incomplete - consider
   expanding for future projects"
4. Continue with the deeper understanding they provided
```

---

## Part 4: Validation Protocols

### 4.1 Question Adequacy Checklist

Before closing a topic as "refined," validate that you have adequate understanding:

#### □ Answer Completeness
- [ ] Answer addresses the original business need
- [ ] Answer is specific enough to implement from
- [ ] Answer includes constraints/requirements
- [ ] Answer includes edge cases or exceptions

**Test**: "Could a developer implement from this answer?"
If NO → Ask follow-up questions

#### □ Answer Clarity
- [ ] You understand what the user meant
- [ ] User confirmed you understood correctly
- [ ] No ambiguous terminology remains
- [ ] Implications are clear

**Test**: "Can you explain this back to the user and have them confirm?"
If NO → Clarify further

#### □ Answer Sufficiency
- [ ] Answer is sufficient for design phase
- [ ] Follow-up questions answered
- [ ] Trade-offs documented
- [ ] Deferred issues identified

**Test**: "Could PMA design the system from this answer?"
If NO → Refine further

#### □ Answer Consistency
- [ ] Answer doesn't contradict other refinements
- [ ] Answer aligns with project constraints
- [ ] Answer is feasible given other requirements
- [ ] Implementation approach is realistic

**Test**: "Does this fit with everything else we know?"
If NO → Explore conflicts

### 4.2 Refinement Completeness Matrix

Track completeness across all 8 Chaperone dimensions:

| Dimension | Status | Answer Sufficiency | Clarity | Consistency | Notes |
|-----------|--------|-------------------|---------|-------------|-------|
| **Data Model** | ✅ | Clear (4/5) | Good | Aligned | Schema defined, constraints documented |
| **Use Cases** | ✅ | Clear (5/5) | Excellent | Aligned | All workflows mapped |
| **Auth** | 🟡 | Partial (2/5) | Good | Aligned | Need to clarify token refresh strategy |
| **Caching** | ❌ | None | N/A | N/A | Deferred to PMA design phase |
| **Tech Stack** | ✅ | Clear (4/5) | Good | Aligned | Tech chosen, some library TBD |
| **Platforms** | ✅ | Clear (5/5) | Excellent | Aligned | Web + Mobile (iOS/Android) |
| **Testing** | 🟡 | Partial (3/5) | Fair | Aligned | Coverage targets unclear |
| **Scope** | ✅ | Clear (4/5) | Good | Aligned | Greenfield project, MVP scope clear |

**Action**: Complete 🟡 items before closure. ❌ items need explicit deferral documentation.

---

## Part 5: Examples

### 5.1 Good Question/Option Combinations

#### Example 1: Platform Selection

✅ **GOOD**:
```
Q: "What platforms do you need to support?"

Options:
- A) Web only
- B) Mobile only (iOS + Android)
- C) Web + Mobile
- D) Native platforms separately (iOS, Android, Web separate codebases)

If "D": "Can you explain the business reason for separate codebases?"
```

**Why it's good**:
- Clear, mutually exclusive options
- All realistic answers covered
- Easy to follow up if needed
- Implications are clear for each option

---

#### Example 2: Data Synchronization

✅ **GOOD**:
```
Q: "How fresh does the data need to be?"

Options:
- A) Daily synchronization (acceptable to wait up to 24 hours)
- B) Hourly synchronization (need updates every ~60 minutes)
- C) Real-time (need updates within seconds)
- D) Event-driven (update when specific events occur)
- E) Other (please describe): _____________

If "E": "What's your synchronization strategy and what triggers updates?"
```

**Why it's good**:
- Covers standard patterns
- "Other" handles custom approaches
- Clear implications (real-time is expensive)
- Includes follow-up for custom approach

---

### 5.2 Bad Question/Option Combinations

#### ❌ Example 1: Incomplete Options

```
Q: "What programming language will you use?"

Options:
- A) Python
- B) JavaScript

⚠️ PROBLEMS:
- Missing many languages (Go, Rust, Java, C#, etc.)
- User might need TypeScript (not listed)
- User might need different languages for different components
- Only 2 options for vast ecosystem
```

**Fix**:
```
OPTION 1 - Switch to open-ended:
Q: "What programming language(s) will you use for [component]?
   Consider performance, team expertise, and ecosystem needs."

OPTION 2 - Add more options:
Q: "What will be your primary backend language?"
Options: Python | JavaScript/Node | Go | Java/Kotlin | C#/.NET |
         Rust | Other (please specify)

Then add: "Are there other languages needed for specific components?"
```

---

#### ❌ Example 2: Ambiguous Options

```
Q: "What's your preferred architecture?"

Options:
- A) Traditional
- B) Modern
- C) Cloud-native

⚠️ PROBLEMS:
- Terms are undefined ("What's 'traditional'?")
- Subjective ("'modern' to whom?")
- User doesn't know what you mean
- Options aren't mutually exclusive
```

**Fix**:
```
Q: "How will you structure your application?"

Options:
- A) Monolithic (single deployable unit, all code together)
- B) Microservices (multiple independent services, separate deployments)
- C) Hybrid (mostly monolithic with some extracted microservices)
- D) Serverless (event-driven, managed infrastructure)
- E) Other: ____________

If unsure, describe your current constraints and we can discuss trade-offs.
```

---

#### ❌ Example 3: Missing "Other"

```
Q: "How many users will your system serve?"

Options:
- A) Hundreds
- B) Thousands
- C) Millions

User's real answer: "It's hard to estimate, but probably
between 50,000-500,000 depending on adoption"

⚠️ PROBLEMS:
- No "Other" option for outlier answers
- Can't express range or uncertainty
- User picks closest but feels wrong
- Specialist doesn't capture nuance
```

**Fix**:
```
Q: "How many concurrent active users do you anticipate?"

Options:
- A) Less than 1,000
- B) 1,000 - 10,000
- C) 10,000 - 100,000
- D) 100,000 - 1,000,000
- E) More than 1 million
- F) Uncertain - help me estimate: ____________

If "F": "Tell me about your expected growth, target market size,
and adoption assumptions."
```

---

### 5.3 Real-World Scenario: Recovery from Incomplete Options

**Scenario**:

Chaperone asks: "What's your authentication strategy?"
```
Options:
- A) Basic authentication (username/password)
- B) OAuth2
- C) LDAP/Active Directory
```

**User answers**: "We need multi-tenant authentication where
different organizations can use their own auth system (Okta,
Azure AD, Google Workspace, etc.)"

**Problem**: Answer doesn't fit any option

**Recovery Protocol**:

```
STEP 1: Acknowledge Real Answer
"Got it - so you need a multi-tenant auth system where
each organization brings their own identity provider.
That's different from the options I listed."

STEP 2: Explore What You Missed
"This is actually SAML/OpenID Connect federated auth,
not on my original list. Let me understand the details:

- Will you support:
  □ OAuth2-based providers (Google, GitHub, Microsoft 365)
  □ SAML providers (Okta, Azure AD)
  □ Both?
  □ Custom LDAP integration for legacy orgs?

- Who manages the auth configuration:
  □ You manage mappings for each org
  □ Each org configures their own provider
  □ Self-service portal for org admins?

- Multi-tenancy constraints:
  □ Each org sees only their users
  □ Shared user directories
  □ Cross-org delegation?"

STEP 3: Document the Full Understanding
Auth Strategy: Federated multi-tenant (SAML + OAuth2)
- Supports: Organization-provided identity providers
- Orgs: [User's answer to Q1]
- Management: [User's answer to Q2]
- Isolation: [User's answer to Q3]
- Implications: Complex auth flow, needs provider mapping

STEP 4: Update Your Model
"For future projects, I should include 'Federated/multi-tenant
(SAML/OpenID)' as an authentication option"
```

---

## Part 6: Integration with Chaperone & PMA Workflows

### 6.1 Chaperone Phase 1: Applying This Framework

**Chaperone's Specification Refinement includes**:

```
For Each of 8 Technical Dimensions:

1. DECIDE: Should this be multiple-choice or open-ended?
   - Use Decision Framework from Part 1

2. IF MULTIPLE-CHOICE: Validate options
   - Use Completeness Criteria from Part 2
   - Score 4-5 before asking user

3. ASK USER: Get their answer
   - If they pick option → document
   - If they pick "Other" → follow-up (Part 3.2)
   - If answer doesn't fit → recovery (Part 3.3)

4. VALIDATE: Check answer adequacy
   - Use Adequacy Checklist from Part 4.1
   - If insufficient → ask follow-ups
   - When complete → move to next dimension

5. DOCUMENT: In refined specs
   - Original question
   - Options provided (if multiple-choice)
   - User's answer
   - Clarifications and follow-ups
   - Impact on project design
```

### 6.2 PMA Phase 2: Applying This Framework

**PMA's Requirements Analysis includes**:

```
When PMA asks probing questions:

1. Determine Question Type
   - Is this multiple-choice? (use Decision Framework)
   - Can options be predicted?
   - Is there a sensible "Other"?

2. Provide Complete Options (if applicable)
   - Score options 4-5 before asking
   - Include clear definitions
   - Add "Other" if appropriate

3. Handle User Answers
   - If complete → incorporate into design
   - If incomplete → ask follow-ups
   - If "Other" → explore implications
   - If doesn't fit → use recovery protocol

4. Document Decisions
   - What question was asked
   - What options were provided
   - What user answered
   - What it means for the design
```

---

## Part 7: Quick Reference

### Decision Tree

```
Need user input?
├─ Is answer predetermined? → Don't ask
├─ Are there 2-5 standard options? → Multiple-choice
├─ Are there 6+ options? → Open-ended OR categorize
├─ Might user have different approach? → Add "Other" option
└─ Can't predict answer? → Open-ended
```

### Completeness Checklist

Before asking multiple-choice:
- [ ] All realistic options included (4-5 comprehensiveness)
- [ ] Options clearly defined (clarity check)
- [ ] Each option is actionable (relevance check)
- [ ] "Other" included if 20%+ might differ (edge case check)

### Recovery When Answer Doesn't Fit

1. Acknowledge the real answer
2. Ask targeted follow-ups
3. Document the full understanding
4. Update your question templates for next time

### Validation Gates

Before marking topic as "refined":
- [ ] Answer addresses business need
- [ ] Answer is specific enough to implement
- [ ] You understand it (can repeat back)
- [ ] It's consistent with other answers
- [ ] No follow-up questions remain

---

## Conclusion

This framework ensures that:

✅ Questions are appropriate for their answers (not forcing binary answers to open-ended questions)
✅ Options are comprehensive before asking users
✅ Incomplete answers are identified and resolved
✅ Edge cases are handled gracefully with "Other" + follow-ups
✅ Specifications are adequately refined before proceeding
✅ Follow-up patterns are consistent and efficient

**Result**: Chaperone and PMA can ask questions with confidence knowing they're gathering complete, adequate information before passing work to the next phase.
