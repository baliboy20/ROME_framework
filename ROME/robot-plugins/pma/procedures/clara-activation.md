# Procedure: Clara Activation

| Field | Value |
|-------|-------|
| **Procedure ID** | pma:clara-activation |
| **Owner** | PMA |
| **Phase** | P3 (Design) |
| **Version** | 1.0 |

---

## Purpose

Defines when and how PMA activates Clara (UX Designer) during P3 Design, and what inputs PMA must provide.

---

## Activation Criteria

PMA activates Clara when any of the following conditions are met:

| Condition | Examples |
|-----------|---------|
| Requirements contain explicit UX complexity | Multi-step wizards, complex navigation flows, accessibility mandates |
| Sponsor has provided visual specifications | Wireframes, mockups, brand guidelines in source materials |
| System includes end-user facing interfaces | Web app, mobile app, kiosk — any direct user-facing surface |
| NFR.Usability entries exist in AORDL requirements | WCAG compliance, responsive design, specific UX standards |

Clara is **not** activated for:
- API-only systems with no user interface
- Admin panels with standard CRUD forms and no UX complexity
- Systems where the tech stack includes an established design system already defined

---

## Activation Protocol

### Step 1 — PMA Assessment

PMA reviews P2 outputs and identifies UX scope:
- Count requirements with Actor = end-user roles (not system/admin)
- Identify NFR.Usability entries
- Assess navigation complexity from use case flows

If any activation criterion is met, proceed to Step 2.

### Step 2 — Request via Roma

PMA logs a Clara assignment request via Roma:

```javascript
mcp__activity_log__append({
  type: "TASK",
  id: "TASK-CLARA-ACTIVATION",
  attributes: {
    robot: "pma",
    action: "REQUEST_CLARA_ACTIVATION",
    reason: "[Which activation criterion triggered]",
    inputsReady: false,
    phase: "P3-design"
  }
})
```

Roma assigns Clara and notifies PMA of assignment.

### Step 3 — PMA Prepares Input Package

Before handing off to Clara, PMA must complete:

| Input | Source | Status Required |
|-------|--------|----------------|
| User story list | P2 user-stories.md | Complete |
| Actor list with role descriptions | P2 requirements-matrix.yaml | Complete |
| Use case flows (at least rough draft) | P3 use-cases.md draft | Draft acceptable |
| Tech stack (platform: web/mobile/desktop) | P3 tech-stack.yaml | Final |
| NFR.Usability requirements | P2 non-functional-requirements.md | Complete |
| Any sponsor-provided visual references | _user_input/ | As available |

### Step 4 — Hand-off to Clara

PMA provides the input package and a written brief:

```markdown
## Clara Brief

**Platform:** [web | mobile | desktop | cross-platform]
**Primary actors:** [list of end-user roles]
**Key user journeys:** [top 3-5 flows from use cases]
**Usability constraints:** [NFR.Usability items]
**Design references:** [any sponsor-provided materials]
**Output required:** [design system | wireframes | user flows | accessibility spec | all]
```

### Step 5 — Clara Delivers

Clara produces design assets into `ARTIFACTS/_design/design-assets/`:
- `design-system.md`
- `user-flows.md`
- `wireframes/[feature-name].md` (one per feature)
- `accessibility.md`

Clara notifies PMA of completion via activity log.

### Step 6 — PMA Integration

PMA incorporates Clara's outputs into:
- `use-cases.md` — add UI references per use case
- `system-architecture.md` — add front-end architecture section
- `actionlist.md` — include design asset references in Charlie's work breakdown

---

## Revision History

| Version | Date | Summary |
|---------|------|---------|
| 1.0 | 2026-03-05T00:00:00Z | Created — extracted from rome-p3-design phase plugin (ROME-PROP-034) |
