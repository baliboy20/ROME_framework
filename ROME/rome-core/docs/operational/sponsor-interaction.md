# ROME Framework: Sponsor Interaction

| Field | Value |
|-------|-------|
| **Document UID** | ROME-GOV-006 |
| **Version** | 2.0 |
| **Date** | 2026-01-07 |
| **Status** | Active |
| **Document Type** | Governance |

---

## Purpose

Defines when and how ROME agents interact with the project sponsor (user). Establishes decision authority boundaries and blocking interaction triggers.

---

## Sponsor Contact

| Setting | Value |
|---------|-------|
| **iMessage** | `07412367761` |
| **Email** | `williampaulton@gmail.com` |

---

## Decision Authority

### Sponsor Approval Required

| Decision Type | When |
|---------------|------|
| Phase gate transitions | Before moving P1→P2, P2→P3, etc. |
| Scope changes | Adding/removing features |
| Technology stack changes | Changing frameworks, databases, languages |
| External service selection | Third-party APIs, cloud services |
| Design alternatives (significant) | Architecture patterns, major refactors |

### Agent Decides (No Approval)

| Decision Type | Scope |
|---------------|-------|
| Implementation details | Within approved specifications |
| Tool/library selection | Within approved tech stack constraints |
| Formatting choices | Code style, documentation format |
| Minor clarifications | Unambiguous interpretations |

---

## Blocking Interactions

Agents MUST stop and request sponsor input when:

1. **Ambiguity Encountered**
   - Conflicting requirements
   - Missing specifications
   - Edge cases not addressed
   - Multiple valid interpretations

2. **Phase Gate Reached**
   - P1→P2, P2→P3, P3→P4, P4→P5 transitions
   - Quality gate validation results

3. **Scope Boundary Question**
   - Feature in/out of scope unclear
   - Requirements contradict user goals
   - Technical constraints affect scope

4. **External Blocker**
   - API keys or credentials needed
   - Access to external systems required
   - Business decisions outside agent authority

---

## Interaction Channels

**Primary:** `AskUserQuestion` tool (Claude Code)
- Used for all clarifications and approvals
- Blocking until sponsor responds

**Urgent Escalations:** iMessage
- Critical blockers requiring immediate attention
- Use sparingly for true emergencies

**Progress Reports:** Conversational updates
- Feature completion notifications
- Phase completion summaries
- Non-blocking informational updates

---

## Response Handling

- **Blocking questions:** Agent waits for sponsor response
- **Timeouts:** If no response after reasonable time, agent logs blocker and continues other work if possible
- **All interactions logged:** Activity tracking system records all sponsor Q&A

---

## Roma Coordination

Roma (Orchestrator agent) manages sponsor interaction flow:
- Aggregates questions from multiple agents
- Prioritizes blocking vs. non-blocking requests
- Handles timeout escalations
- Maintains interaction log

Domain agents (Talib, PMA, etc.) may interact directly when:
- Roma unavailable
- Urgent escalation required
- Roma explicitly delegates

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|--------------------|
| 1.0 | 2025-11-21 | Initial policy and config documents |
| 2.0 | 2026-01-07 | Merged policy+config, removed implementation details, simplified to essential decision points |
