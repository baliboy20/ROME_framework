# AORDL Recruitment Examples
This file contains the complete AORDL examples for the internal recruitment pipeline, including four atomic requirements written in strict AORDL format.

## REQ‑REC‑001 — Download Applications
```
ID: REQ-REC-001

Actor:
  RecruitmentAdmin

Intent:
  download applications

Preconditions:
  - recruitment campaign exists
  - job system contains submitted applications

Conditions:
  - when campaign is open
  - if admin has recruitment permissions

Postconditions:
  - application files are stored in internal workspace

Outcomes:
  - admin can view all downloaded applications

Invariants:
  - only applications for the selected campaign are downloaded
  - data export must not modify source system

NonFunctional:
  - export completes within 2 minutes
  - data transfer must comply with internal privacy policy

Errors:
  - no applications available
  - insufficient permissions
  - job system unavailable

ScopeBoundary:
  - does not evaluate application quality
  - does not notify applicants

OpenQuestions:
  - should downloads be incremental or full?

CopilotMode:
  - validate structure
  - generate BDD scenarios
  - propose invariants
  - map to capability registry
```

## REQ‑REC‑002 — Assess Internal Eligibility
```
ID: REQ-REC-002

Actor:
  HiringManager

Intent:
  assess internal eligibility

Preconditions:
  - applications are available in internal workspace

Conditions:
  - when candidate is an internal employee
  - unless candidate has an active HR restriction

Postconditions:
  - eligibility decision is recorded

Outcomes:
  - candidate is marked as eligible or ineligible

Invariants:
  - eligibility criteria must be applied consistently
  - assessment must not modify application content

NonFunctional:
  - decision recorded within 200ms

Errors:
  - missing application data
  - conflicting eligibility criteria

ScopeBoundary:
  - does not schedule interviews
  - does not notify candidates

OpenQuestions:
  - should eligibility reasons be mandatory?

CopilotMode:
  - validate requirement
  - generate BDD
  - propose eligibility invariants
  - detect ambiguous conditions
```

## REQ‑REC‑003 — Conduct Interview
```
ID: REQ-REC-003

Actor:
  Interviewer

Intent:
  conduct interview

Preconditions:
  - candidate is eligible
  - interview slot is scheduled

Conditions:
  - when interviewer is assigned
  - if candidate confirms attendance

Postconditions:
  - interview feedback is submitted

Outcomes:
  - feedback is visible to hiring manager

Invariants:
  - interviewer cannot submit feedback for unassigned candidates
  - feedback must include rating and summary

NonFunctional:
  - feedback submission < 1s

Errors:
  - missing feedback fields
  - interviewer not assigned
  - candidate no-show

ScopeBoundary:
  - does not generate hiring decision
  - does not reschedule interviews

OpenQuestions:
  - should interviews support panel mode?

CopilotMode:
  - validate structure
  - generate BDD
  - propose feedback invariants
  - map to capability registry
```

## REQ‑REC‑004 — Issue Job Offer
```
ID: REQ-REC-004

Actor:
  HiringManager

Intent:
  issue job offer

Preconditions:
  - candidate has completed interviews
  - candidate is marked as recommended

Conditions:
  - when offer is approved by HR
  - if position is still open

Postconditions:
  - job offer is created and stored

Outcomes:
  - candidate receives job offer notification

Invariants:
  - offer must reference a valid position
  - offer cannot be issued twice for same candidate and position

NonFunctional:
  - offer generation < 500ms

Errors:
  - missing approval
  - position closed
  - candidate withdrawn

ScopeBoundary:
  - does not negotiate salary
  - does not onboard candidate

OpenQuestions:
  - should offer expiry dates be mandatory?

CopilotMode:
  - validate requirement
  - generate BDD
  - propose invariants
  - detect conflicts with other capabilities
```

## Summary
This file contains the complete AORDL recruitment examples for all four capabilities in the internal recruitment pipeline. These examples are ready for use in capability modelling, BDD generation, and downstream technical specification.
