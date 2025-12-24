# Capability Registry (Recruitment Pipeline)

```yaml
CAP-REC-001:
  name: Download Applications
  actor: RecruitmentAdmin
  intent: download applications
  inputs:
    - campaignId
  outputs:
    - applicationFiles
  invariants:
    - only applications for the selected campaign are downloaded
    - export must not modify the source system
  errors:
    - no applications available
    - insufficient permissions
    - job system unavailable

CAP-REC-002:
  name: Assess Internal Eligibility
  actor: HiringManager
  intent: assess internal eligibility
  inputs:
    - applicationId
  outputs:
    - eligibilityDecision
  invariants:
    - eligibility criteria must be applied consistently
    - assessment must not modify application content
  errors:
    - missing application data
    - conflicting eligibility criteria

CAP-REC-003:
  name: Conduct Interview
  actor: Interviewer
  intent: conduct interview
  inputs:
    - candidateId
    - interviewSlotId
  outputs:
    - interviewFeedback
  invariants:
    - interviewer cannot submit feedback for unassigned candidates
    - feedback must include rating and summary
  errors:
    - missing feedback fields
    - interviewer not assigned
    - candidate no-show

CAP-REC-004:
  name: Issue Job Offer
  actor: HiringManager
  intent: issue job offer
  inputs:
    - candidateId
    - positionId
  outputs:
    - jobOffer
  invariants:
    - offer must reference a valid position
    - offer cannot be issued twice for same candidate and position
  errors:
    - missing approval
    - position closed
    - candidate withdrawn
```

# Full BDD Suite (Recruitment Pipeline)

## Feature: Download applications (CAP‑REC‑001)
```
Feature: Download applications for an internal recruitment campaign

  Scenario: Admin downloads applications for an open campaign
    Given a recruitment campaign exists
    And the campaign is open
    And the admin has recruitment permissions
    And the job system contains submitted applications
    When the admin downloads applications
    Then the application files are stored in the internal workspace
    And the admin can view all downloaded applications

  Scenario: No applications available
    Given a recruitment campaign exists
    And the campaign is open
    And the admin has recruitment permissions
    And the job system contains no applications
    When the admin downloads applications
    Then the system reports that no applications are available

  Scenario: Admin lacks permissions
    Given the admin does not have recruitment permissions
    When the admin attempts to download applications
    Then the system denies access

  Rule: Export must not modify the source system
```

## Feature: Assess internal eligibility (CAP‑REC‑002)
```
Feature: Assess internal eligibility of candidates

  Scenario: Hiring manager marks candidate as eligible
    Given applications are available in the internal workspace
    And the candidate is an internal employee
    And the candidate has no HR restrictions
    When the hiring manager assesses internal eligibility
    Then the candidate is marked as eligible
    And the eligibility decision is recorded

  Scenario: Hiring manager marks candidate as ineligible
    Given applications are available in the internal workspace
    And the candidate is an internal employee
    And the candidate has an active HR restriction
    When the hiring manager assesses internal eligibility
    Then the candidate is marked as ineligible
    And the eligibility decision is recorded

  Scenario: Missing application data
    Given the application data is incomplete
    When the hiring manager assesses internal eligibility
    Then the system reports missing application data

  Rule: Eligibility criteria must be applied consistently
  Rule: Assessment must not modify application content
```

## Feature: Conduct interview (CAP‑REC‑003)
```
Feature: Conduct interviews for eligible candidates

  Scenario: Interviewer submits interview feedback
    Given the candidate is eligible
    And an interview slot is scheduled
    And the interviewer is assigned to the candidate
    And the candidate has confirmed attendance
    When the interviewer conducts the interview
    And the interviewer submits feedback
    Then the feedback is visible to the hiring manager

  Scenario: Candidate does not attend interview
    Given the candidate is eligible
    And an interview slot is scheduled
    And the candidate has not confirmed attendance
    When the interviewer attempts to conduct the interview
    Then the system reports that the candidate did not attend

  Scenario: Interviewer not assigned
    Given the candidate is eligible
    And an interview slot is scheduled
    And the interviewer is not assigned to the candidate
    When the interviewer attempts to submit feedback
    Then the system denies feedback submission

  Rule: Interviewer cannot submit feedback for unassigned candidates
  Rule: Feedback must include rating and summary
```

## Feature: Issue job offer (CAP‑REC‑004)
```
Feature: Issue job offers to recommended candidates

  Scenario: Hiring manager issues a job offer
    Given the candidate has completed interviews
    And the candidate is marked as recommended
    And HR has approved the offer
    And the position is open
    When the hiring manager issues a job offer
    Then the job offer is created and stored
    And the candidate receives a job offer notification

  Scenario: Offer cannot be issued without HR approval
    Given the candidate has completed interviews
    And the candidate is marked as recommended
    And HR has not approved the offer
    When the hiring manager attempts to issue a job offer
    Then the system blocks the offer

  Scenario: Position is closed
    Given the candidate has completed interviews
    And the candidate is marked as recommended
    And the position is closed
    When the hiring manager attempts to issue a job offer
    Then the system reports that the position is no longer available

  Rule: Offer must reference a valid position
  Rule: Offer cannot be issued twice for the same candidate and position
```

## Cross‑Capability Pipeline Rules
```
Feature: Recruitment pipeline integrity rules

  Rule: Applications must be downloaded before eligibility assessment
    Example:
      Given applications have not been downloaded
      When the hiring manager attempts to assess eligibility
      Then the system prevents the action

  Rule: Eligibility must be completed before interviews
    Example:
      Given the candidate has not been assessed
      When the interviewer attempts to conduct an interview
      Then the system prevents the action

  Rule: Interviews must be completed before issuing an offer
    Example:
      Given the candidate has not completed interviews
      When the hiring manager attempts to issue a job offer
      Then the system prevents the action
```

# Summary
This file contains the complete capability registry and the full BDD suite for the internal recruitment pipeline. These artefacts are ready for use in technical specification, architecture mapping, and automated test generation.
