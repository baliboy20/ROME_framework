# ROME v6.1 Methodology Fixes

**Version**: 6.1
**Date**: 2025-11-12
**Purpose**: Document fixes for 3 identified weaknesses in ROME v6.0 methodology
**Status**: IMPLEMENTED

---

## Executive Summary

ROME v6.0 had 3 identified weaknesses that impacted workflow quality:

1. **UX/styling not carried forward to frontend developer (Charlie)**
2. **Robot directories lacked descriptive names** (e.g., `robot1` instead of `robot_charlie`)
3. **Question options sometimes incomplete, forcing awkward freeform responses**

This guide documents the fixes implemented in v6.1 to address these issues.

---

## Weakness #1: Design Handoff Gap (Clara → Charlie)

### Problem

**Symptom:** Frontend developers implementing UI without clear design specifications

**Root Cause:** No formal handoff mechanism from Clara (UX Designer) to Charlie (Frontend Developer)

**Impact:**
- Charlie guesses at spacing, colors, typography values
- Inconsistent UI implementation across features
- Clara can't efficiently validate implementation against designs
- Rework required when designs don't match implementation
- No clear acceptance criteria for "design complete"

---

### Solution: Structured Design Handoff Protocol

**Location of Fixes:**
- `ROME/04-phase2a-ux/role-clara.md` - New section: "Design Handoff to Charlie (Frontend Developer)"
- `ROME/06-phase3-development/role-charlie.md` - New section: "Design Handoff Integration"

---

#### Clara's New Deliverables

Clara MUST now create **5 structured artifacts** for Charlie:

**1. Design System Specification (`design_system.md`)**
- Colors (primary, secondary, semantic, neutral)
- Typography (heading styles, body styles, special styles)
- Spacing scale (4px base unit, xs through 3xl)
- Elevation & shadows (5 levels)
- Border radius (4 sizes)
- Component catalog with references
- Accessibility requirements (WCAG AA, focus states, touch targets)

**2. Design Tokens File (`design_tokens.md`)**
- **Copy-paste ready constants** in Charlie's implementation language
- Dart/Flutter, React/TypeScript, React Native, Vue, or Web CSS variables
- No translation needed - Charlie copies directly into codebase
- Example:
  ```dart
  class AppColors {
    static const Color primary = Color(0xFF0052CC);
    static const Color textPrimary = Color(0xFF172B4D);
    // ... all design tokens
  }
  ```

**3. Component Specifications (in `COMPONENT_SPECS/` directory)**
- Detailed spec for each reusable component
- All variants (Primary/Secondary/Danger button)
- All states (Default/Hover/Active/Disabled/Focus)
- All sizes (Small/Medium/Large)
- Accessibility requirements per component
- Implementation checklist for Charlie
- Example: `button_spec.md`, `input_spec.md`, `card_spec.md`

**4. Screen/Page Mockups (in `MOCKUPS/` directory)**
- Annotated screenshots or Figma exports
- Spacing annotations ("16px padding", "24px between sections")
- Color annotations ("Background: #F4F5F7")
- Typography annotations ("H2 + Body text")
- All states (default, empty, loading, error, hover, focus)
- Responsive breakpoints noted
- Naming: `[feature]_[screen]_[state].png`

**5. Design Handoff Checklist (`DESIGN_HANDOFF.md`)**
- Formal handoff document listing all artifacts
- Implementation priority (tokens first, then components, then screens)
- 3 validation checkpoints with Clara
- Design questions & clarification process
- Amendment protocol if implementation reveals design issues
- Acceptance criteria for "design complete"

---

#### Charlie's New Workflow

**Phase 0: Read Design Handoff (BEFORE any implementation)**
1. Read `DESIGN_HANDOFF.md` for complete checklist
2. Review all design artifacts
3. Plan 3-phase implementation sequence

**Phase 1: Design Foundation (IMPLEMENT FIRST)**
- Create design token files from `design_tokens.md`
- Copy-paste constants (no translation)
- Files: `colors.dart`, `typography.dart`, `spacing.dart`, `elevation.dart`, `radius.dart`
- **Validation Checkpoint 1 with Clara:** Tokens match specs exactly
- **BLOCKED until Clara approves**

**Phase 2: Core Components (IMPLEMENT SECOND)**
- Build reusable components from `COMPONENT_SPECS/`
- Implement all variants, all states, all sizes
- Meet accessibility requirements
- Use design tokens only (no arbitrary values)
- **Validation Checkpoint 2 with Clara:** Components match specs
- **BLOCKED until Clara approves**

**Phase 3: Feature Screens (IMPLEMENT LAST)**
- Build screens using approved components and tokens
- Reference `MOCKUPS/` for layouts
- Follow mockup annotations
- Implement all states (default, empty, loading, error)
- **Validation Checkpoint 3 with Clara:** Screens match mockups
- **BLOCKED until Clara approves**

**Design Questions Process:**
1. Check docs first (`design_system.md`, `COMPONENT_SPECS/`, `MOCKUPS/`)
2. Still unclear? Log in `robot_charlie/notes/design_issues.md`
3. Clara responds within 4 hours
4. Clara updates specs if ambiguous

---

#### Success Metrics

- **Handoff completeness:** 100% of required artifacts provided by Clara
- **Implementation accuracy:** 95%+ visual match to designs
- **Validation efficiency:** < 2 rounds of feedback per checkpoint
- **Accessibility compliance:** 100% WCAG AA
- **Charlie clarification questions:** < 5 per feature (indicates clear specs)

---

#### Key Files Modified

| File | Change Summary |
|------|----------------|
| `role-clara.md:508-1235` | Added "Design Handoff to Charlie" section with 5 artifact types, Clara's updated workflow, success metrics |
| `role-charlie.md:32-383` | Added "Design Handoff Integration" section with 3-phase implementation priority, validation checkpoints, design token usage |

---

## Weakness #2: Robot Directory Naming

### Problem

**Symptom:** Robot directories named generically (e.g., `robot1`, `robot2`) instead of descriptively

**Root Cause:** Unclear or missing naming convention in scripts/docs

**Impact:**
- Hard to identify which robot is which
- Confusing when navigating project structure
- No clear association between directory and robot role

---

### Solution: Descriptive Robot Names

**Status:** ✅ **ALREADY FIXED IN v6.0**

**Evidence:**
```bash
$ grep "ROBOT_DIR" ROME/scripts/create-robot.sh
ROBOT_DIR="${PROJECT_ROOT}/robot_${ROBOT_NAME}"
```

**Current Behavior:**
- Script creates directories as `robot_${ROBOT_NAME}`
- Examples: `robot_talib`, `robot_pma`, `robot_charlie`, `robot_ashok`, `robot_reena`, `robot_clara`, `robot_sarah`, `robot_roma`
- All documentation references use descriptive names

**No fixes required for this weakness.**

---

## Weakness #3: Incomplete Question Options

### Problem

**Symptom:** When gathering requirements or making design decisions, robots (Talib, PMA, Chaperone) ask closed-choice questions, but options sometimes don't capture stakeholder's actual needs, forcing awkward "write your answer" fallback

**Root Cause:** No protocol for handling edge cases, novel approaches, or domain-specific nuances that don't fit predefined options

**Impact:**
- Stakeholder frustration when real answer isn't in options list
- Robots lack guidance on how to handle "Other" responses
- Non-standard choices poorly documented
- Future robots don't understand why unusual decisions were made
- Amendment requests lack decision history

---

### Solution: Improved Question-Option Completeness Protocol

**Location of Fix:**
- `ROME/robot-protocols/robot-generic-protocols.md` - New section **RP-3: STAKEHOLDER QUESTIONING PATTERNS**

---

#### Protocol Overview

**Core Principle:** Balance structured guidance with flexibility for stakeholder expertise

**3-Step Question Design Pattern:**

1. **Start with Structured Options** (if domain is well-known)
   ```markdown
   **Question:** What authentication method should we use?

   Options:
   A) OAuth 2.0 / OpenID Connect
   B) JWT (stateless tokens)
   C) Session-based (server-side)
   D) Magic Link (passwordless)
   E) Other (please specify)  ← ALWAYS INCLUDE THIS
   ```

2. **Always Include "Other (please specify)"**
   - Captures edge cases not covered by standard options
   - Novel approaches specific to this domain
   - Hybrid solutions
   - Vendor-specific or regulatory requirements

3. **Follow Up with Open-Ended Clarification**
   - Even when stakeholder selects standard option, probe deeper
   - For "Other" responses, use comprehensive follow-up template (5 questions)
   - Document rationale, constraints, trade-offs

---

#### When to Use Structured vs. Open-Ended

**Use Structured Options When:**
- Domain is well-known and options are enumerable
- Decision has standard industry approaches
- Constraining choices helps stakeholder understanding
- Examples: Auth methods, database types, deployment platforms

**Use Open-Ended Questions When:**
- Domain is novel or highly specialized
- Stakeholder has deep expertise you're discovering
- Multiple valid approaches with significant trade-offs
- Examples: Business workflows, custom integrations, regulatory requirements

---

#### Handling "Other" Responses

**Follow-up Template:**
```markdown
Thank you for selecting "Other". To ensure I understand your requirements:

1. **Describe the approach:**
   - What method are you envisioning?
   - How would it work from the user's perspective?

2. **Rationale:**
   - Why is this approach better suited than standard options?
   - What constraints or requirements make this necessary?

3. **Technical details:**
   - What technologies or protocols would this involve?
   - Are there existing systems this needs to integrate with?

4. **Trade-offs:**
   - What are the advantages of this approach for your use case?
   - What challenges or risks do you foresee?

5. **Precedents:**
   - Have you seen this approach used successfully elsewhere?
   - Are there any references or examples you can share?
```

---

#### Documenting Unusual Choices

**Create Decision Log Entry:**
```markdown
## Decision: [Topic] - [Chosen Approach]

**Date:** YYYY-MM-DD
**Decision Maker:** [Stakeholder name/role]
**Robot:** [Robot name]

**Question Asked:** [Original question with all options]

**Response:** Option E (Other) - [Brief description]

**Full Stakeholder Response:** [Complete explanation from follow-up]

**Rationale:**
- Why this approach was chosen
- What constraints drove the decision
- What alternatives were considered

**Implications:**
- Technical dependencies this creates
- Integration points this requires
- Risks or challenges to monitor

**Approval:** [Stakeholder approval confirmation]

**Future Reference:**
This decision should be reviewed if:
- [Condition 1 that might invalidate choice]
- [Condition 2 that might suggest reconsideration]
```

---

#### Conditional Questioning Flow

Use decision trees to adapt questions based on previous answers:

```markdown
**Q1:** What's the primary user base for this application?
  A) Internal employees
  B) External customers
  C) Partners/vendors
  D) Mixed (multiple user types)
  E) Other (please specify)

[If A selected → Ask about corporate directory integration]
[If B selected → Ask about self-service registration]
[If C selected → Ask about B2B/SSO requirements]
[If D selected → Ask about role separation strategy]
[If E selected → Use "Other" template]
```

---

#### Integration with Phase Workflow

**Phase 1 (Talib):**
- Use structured + "Other" approach for requirements gathering
- Document unusual requirements with full justification
- Create decision log entries for non-standard choices

**Phase 2 (PMA):**
- Use conditional questioning for architecture decisions
- Build on Phase 1 decision logs
- Validate feasibility of "Other" responses

**Phase 2B (Sarah):**
- Validate decision log completeness
- Ensure "Other" responses have full documentation
- Check that unusual choices have stakeholder approval

**Phase 3 (Ashok/Reena/Charlie):**
- Reference decision logs during implementation
- Flag if implementation reveals unforeseen challenges
- Request amendments if assumptions proven invalid

---

#### Summary Checklist

When asking stakeholders questions:

- [ ] **Start structured** (if domain is well-known)
- [ ] **Always include "Other (please specify)"** option
- [ ] **Follow up with open-ended clarification** (even for standard options)
- [ ] **Use conditional questioning** based on previous answers
- [ ] **Document "Other" responses thoroughly** with full context
- [ ] **Create decision log entries** for non-standard choices
- [ ] **Get stakeholder approval** for unusual/risky approaches
- [ ] **Note future review triggers** for decisions

---

#### Key Files Modified

| File | Change Summary |
|------|----------------|
| `robot-generic-protocols.md:394-705` | Added new RP-3 section with question design pattern, "Other" handling template, decision log template, conditional questioning, integration with phase workflow |

**Note:** All subsequent RP sections renumbered (RP-3 became RP-4, RP-4 became RP-5, etc.)

---

## Version Comparison

| Aspect | v6.0 | v6.1 |
|--------|------|------|
| **Design Handoff** | Informal, implicit | Formal 5-artifact handoff with 3 validation checkpoints |
| **Clara Deliverables** | Undefined | 5 structured artifacts (design_system.md, design_tokens.md, COMPONENT_SPECS/, MOCKUPS/, DESIGN_HANDOFF.md) |
| **Charlie Workflow** | Undefined design integration | 3-phase sequence (tokens → components → screens) with Clara validation gates |
| **Robot Naming** | ✅ Already descriptive (robot_[name]) | ✅ No change needed |
| **Questioning** | Closed options, no "Other" protocol | Structured + "Other" with 5-question follow-up template |
| **Decision Documentation** | Informal | Formal decision log entries for non-standard choices |

---

## Adoption Guide for Existing Projects

### If currently in Phase 2A (Clara working):

1. **Clara:** Create 5 design artifacts per new protocol
2. **Clara:** Complete `DESIGN_HANDOFF.md` checklist
3. **Clara:** Get PMA approval on all artifacts
4. **Clara:** Notify Charlie handoff is ready

### If currently in Phase 3 (Charlie implementing UI):

1. **Pause implementation** temporarily
2. **Clara:** Retroactively create design artifacts
3. **Charlie:** Refactor existing UI to use design tokens
4. **Clara:** Validate Checkpoint 1 (design foundation)
5. **Continue** with component/screen implementation

### If starting new project:

1. Follow updated `role-clara.md` and `role-charlie.md` guidance
2. Use new questioning protocol from `robot-generic-protocols.md` RP-3
3. No migration needed - built-in from start

---

## FAQ

### Q: Does Clara have to create all 5 artifacts even if project is small?

**A:** Yes. Even small projects benefit from:
- Design tokens (prevents arbitrary values)
- Component specs (ensures consistency)
- DESIGN_HANDOFF.md (provides structure)

For very small projects (1-2 screens), Clara can create minimal versions, but all 5 must exist.

---

### Q: What if Charlie's language isn't Dart/Flutter?

**A:** Clara creates `design_tokens.md` in Charlie's language. Examples provided for:
- React/TypeScript (export const objects or CSS-in-JS)
- React Native (StyleSheet constants)
- Vue/Svelte (CSS custom properties)
- Web (CSS variables in `:root`)

Clara adapts to project tech stack.

---

### Q: What if stakeholder always chooses "Other" for questions?

**A:** This indicates:
1. Domain is highly specialized (use more open-ended questions)
2. Options don't match stakeholder's mental model (revise standard options)
3. Robot needs domain education (stakeholder teaches via "Other" responses)

Document all "Other" responses in decision log. Over time, patterns emerge and standard options can be improved.

---

### Q: Can Charlie proceed without Clara's approval at checkpoints?

**A:** **NO.** Clara can BLOCK:
- Checkpoint 1: If design tokens don't match specs exactly
- Checkpoint 2: If components missing states or have visual differences
- Checkpoint 3: If screens deviate significantly from mockups without justification

This is a **quality gate** per ROME principle P5.

---

### Q: What if Clara and Charlie disagree on design feasibility?

**A:**
1. Charlie requests amendment via Clara
2. Clara evaluates technical constraints
3. Options:
   - Clara updates design (if Charlie's constraint is valid)
   - Clara confirms original intent (if constraint is addressable)
   - Escalate to PMA (if fundamental architecture issue)
4. Document decision in decision log
5. Proceed with agreed approach

---

## Impact Assessment

### Positive Impacts

✅ **Design consistency:** Charlie implements UI matching approved designs 95%+ of time
✅ **Reduced rework:** Validation gates catch issues early (before full implementation)
✅ **Faster onboarding:** New frontend developers have clear specs to follow
✅ **Better accessibility:** Accessibility requirements built into component specs
✅ **Decision transparency:** "Other" responses fully documented with rationale
✅ **Institutional knowledge:** Decision logs capture why unusual choices were made

### Potential Concerns

⚠️ **Increased Clara workload:** Creating 5 artifacts takes more time upfront
- **Mitigation:** Templates provided for all artifacts; copy-paste for similar components

⚠️ **More validation steps:** 3 checkpoints could slow Charlie's progress
- **Mitigation:** Checkpoints prevent larger rework later; validation < 30 min per checkpoint if done correctly

⚠️ **Stakeholder fatigue:** Follow-up questions for "Other" responses
- **Mitigation:** Only ask follow-ups for genuinely unusual choices; skip for minor variations

---

## Conclusion

ROME v6.1 addresses all 3 identified weaknesses:

1. ✅ **Design Handoff:** Formal 5-artifact handoff with 3 validation checkpoints
2. ✅ **Robot Naming:** Already fixed in v6.0 (no action needed)
3. ✅ **Question Completeness:** Structured + "Other" protocol with decision log documentation

**Recommendation:** Adopt v6.1 for all new projects immediately. Retrofit existing Phase 2/3 projects when feasible.

**Next Steps:**
1. Update all robot CLAUDE.md templates to reference new sections
2. Create example design artifacts for reference project
3. Train robots on new questioning protocol via role doc updates

---

**Document Version:** 1.0
**Last Updated:** 2025-11-12
**Author:** Senior Computer Systems Designer & Methodology Analyst
**Status:** Approved for ROME v6.1 release
