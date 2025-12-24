# Master Test Plan

**Generated:** 2025-12-24T12:05:33.245Z
**Total Requirements:** 25
**Total Test Scenarios:** 239

---

## Test Coverage by Requirement

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| REQ-001 | 9 | 100% |
| REQ-002 | 11 | 89% |
| REQ-003 | 10 | 100% |
| REQ-004 | 8 | 100% |
| REQ-005 | 9 | 100% |
| REQ-006 | 10 | 100% |
| REQ-007 | 9 | 100% |
| REQ-008 | 10 | 100% |
| REQ-009 | 9 | 100% |
| REQ-010 | 8 | 100% |
| REQ-011 | 10 | 100% |
| REQ-012 | 8 | 100% |
| REQ-013 | 11 | 100% |
| REQ-014 | 9 | 100% |
| REQ-015 | 9 | 100% |
| REQ-016 | 11 | 100% |
| REQ-017 | 11 | 100% |
| REQ-018 | 9 | 100% |
| REQ-019 | 9 | 100% |
| REQ-020 | 9 | 100% |
| REQ-021 | 9 | 100% |
| REQ-022 | 9 | 100% |
| REQ-023 | 12 | 100% |
| REQ-024 | 11 | 100% |
| REQ-025 | 9 | 100% |

---

## Test Scenarios by Priority

### HIGH Priority (205 scenarios)

- **TS-001** [REQ-001]: Happy Path: create project
- **TS-E01** [REQ-001]: Error: If project name already exists
- **TS-E02** [REQ-001]: Error: If subscription inactive
- **TS-I01** [REQ-001]: Invariant: Project must have exactly one owner
- **TS-I02** [REQ-001]: Invariant: Project name 3-100 characters
- **TS-I03** [REQ-001]: Invariant: Created date ≤ Current date
- **TS-A01** [REQ-001]: Authorization: Unauthenticated user
- **TS-A02** [REQ-001]: Authorization: User without ProjectManager role
- **TS-001** [REQ-002]: Happy Path: create task
- **TS-E01** [REQ-002]: Error: If project not found
- **TS-E02** [REQ-002]: Error: If assignee not project member
- **TS-E03** [REQ-002]: Error: If due date in past
- **TS-I01** [REQ-002]: Invariant: Task title 3-200 characters
- **TS-I02** [REQ-002]: Invariant: Due date ≥ Created date
- **TS-I03** [REQ-002]: Invariant: Priority must be one of LOW, MEDIUM, HIGH, CRITICAL
- **TS-A01** [REQ-002]: Authorization: Unauthenticated user
- **TS-A02** [REQ-002]: Authorization: User without ProjectManager role
- **TS-001** [REQ-003]: Happy Path: update task
- **TS-E01** [REQ-003]: Error: If invalid status transition (e.g., completed → open)
- **TS-E02** [REQ-003]: Error: If concurrent update detected
- **TS-I01** [REQ-003]: Invariant: Status transitions open → in_progress → completed (no backwards)
- **TS-I02** [REQ-003]: Invariant: Completed tasks cannot be reopened
- **TS-I03** [REQ-003]: Invariant: Due date ≥ Created date
- **TS-A01** [REQ-003]: Authorization: Unauthenticated user
- **TS-A02** [REQ-003]: Authorization: User without TeamMember role
- **TS-001** [REQ-004]: Happy Path: view task
- **TS-E01** [REQ-004]: Error: If task not found
- **TS-E02** [REQ-004]: Error: If TeamMember lacks read permission
- **TS-I01** [REQ-004]: Invariant: Task data immutable during read operation
- **TS-I02** [REQ-004]: Invariant: View count ≥ 0
- **TS-A01** [REQ-004]: Authorization: Unauthenticated user
- **TS-A02** [REQ-004]: Authorization: User without TeamMember role
- **TS-001** [REQ-005]: Happy Path: delete task
- **TS-E01** [REQ-005]: Error: If ProjectManager not project owner
- **TS-E02** [REQ-005]: Error: If task already deleted
- **TS-I01** [REQ-005]: Invariant: Deleted tasks cannot be undeleted (permanent soft delete)
- **TS-I02** [REQ-005]: Invariant: Deletion timestamp recorded
- **TS-I03** [REQ-005]: Invariant: Deletion actor recorded
- **TS-A01** [REQ-005]: Authorization: Unauthenticated user
- **TS-A02** [REQ-005]: Authorization: User without ProjectManager role
- **TS-001** [REQ-006]: Happy Path: search tasks
- **TS-E01** [REQ-006]: Error: If query less than 2 characters
- **TS-E02** [REQ-006]: Error: If search timeout (>5 seconds)
- **TS-I01** [REQ-006]: Invariant: Search results include only tasks TeamMember has permission to view
- **TS-I02** [REQ-006]: Invariant: Results limited to 100 tasks per query
- **TS-I03** [REQ-006]: Invariant: Deleted tasks excluded from results
- **TS-A01** [REQ-006]: Authorization: Unauthenticated user
- **TS-A02** [REQ-006]: Authorization: User without TeamMember role
- **TS-001** [REQ-007]: Happy Path: create comment
- **TS-E01** [REQ-007]: Error: If comment text exceeds 2000 characters
- **TS-E02** [REQ-007]: Error: If task not found
- **TS-I01** [REQ-007]: Invariant: Comment must belong to exactly one task
- **TS-I02** [REQ-007]: Invariant: Comment text cannot be empty
- **TS-I03** [REQ-007]: Invariant: Created date ≤ Current date
- **TS-A01** [REQ-007]: Authorization: Unauthenticated user
- **TS-A02** [REQ-007]: Authorization: User without TeamMember role
- **TS-001** [REQ-008]: Happy Path: create attachment
- **TS-E01** [REQ-008]: Error: If file size exceeds 10MB
- **TS-E02** [REQ-008]: Error: If file type not allowed
- **TS-E03** [REQ-008]: Error: If filename already exists on task
- **TS-I01** [REQ-008]: Invariant: File size ≤ 10MB
- **TS-I02** [REQ-008]: Invariant: Filename unique per task
- **TS-I03** [REQ-008]: Invariant: Upload timestamp recorded
- **TS-A01** [REQ-008]: Authorization: Unauthenticated user
- **TS-A02** [REQ-008]: Authorization: User without TeamMember role
- **TS-001** [REQ-009]: Happy Path: create team
- **TS-E01** [REQ-009]: Error: If team name already exists
- **TS-E02** [REQ-009]: Error: If subscription inactive
- **TS-I01** [REQ-009]: Invariant: Team must have exactly one owner
- **TS-I02** [REQ-009]: Invariant: Team name 3-100 characters
- **TS-I03** [REQ-009]: Invariant: Team has 0+ members
- **TS-A01** [REQ-009]: Authorization: Unauthenticated user
- **TS-A02** [REQ-009]: Authorization: User without ProjectManager role
- **TS-001** [REQ-010]: Happy Path: update team
- **TS-E01** [REQ-010]: Error: If team name already exists
- **TS-E02** [REQ-010]: Error: If ProjectManager not team owner
- **TS-I01** [REQ-010]: Invariant: Team name 3-100 characters
- **TS-I02** [REQ-010]: Invariant: Team must have exactly one owner
- **TS-A01** [REQ-010]: Authorization: Unauthenticated user
- **TS-A02** [REQ-010]: Authorization: User without ProjectManager role
- **TS-001** [REQ-011]: Happy Path: create team-member
- **TS-E01** [REQ-011]: Error: If user already team member
- **TS-E02** [REQ-011]: Error: If user not found
- **TS-E03** [REQ-011]: Error: If team at capacity (100 members)
- **TS-I01** [REQ-011]: Invariant: User can be member of multiple teams
- **TS-I02** [REQ-011]: Invariant: Team member role must be one of MEMBER, ADMIN
- **TS-I03** [REQ-011]: Invariant: User cannot be duplicate in same team
- **TS-A01** [REQ-011]: Authorization: Unauthenticated user
- **TS-A02** [REQ-011]: Authorization: User without ProjectManager role
- **TS-001** [REQ-012]: Happy Path: delete team-member
- **TS-E01** [REQ-012]: Error: If attempting to remove team owner
- **TS-E02** [REQ-012]: Error: If user not team member
- **TS-I01** [REQ-012]: Invariant: Team owner cannot be removed (must transfer ownership first)
- **TS-I02** [REQ-012]: Invariant: Team must have at least 1 member (the owner)
- **TS-A01** [REQ-012]: Authorization: Unauthenticated user
- **TS-A02** [REQ-012]: Authorization: User without ProjectManager role
- **TS-001** [REQ-013]: Happy Path: submit task
- **TS-E01** [REQ-013]: Error: If task missing required fields
- **TS-E02** [REQ-013]: Error: If task status not 'in_progress'
- **TS-E03** [REQ-013]: Error: If due date exceeded by >7 days
- **TS-I01** [REQ-013]: Invariant: Submitted tasks cannot be edited by assignee
- **TS-I02** [REQ-013]: Invariant: Task must have description and all required fields
- **TS-I03** [REQ-013]: Invariant: Submission timestamp recorded
- **TS-A01** [REQ-013]: Authorization: Unauthenticated user
- **TS-A02** [REQ-013]: Authorization: User without TeamMember role
- **TS-001** [REQ-014]: Happy Path: approve task
- **TS-E01** [REQ-014]: Error: If task status not 'pending_review'
- **TS-E02** [REQ-014]: Error: If ProjectManager not project owner
- **TS-I01** [REQ-014]: Invariant: Approved tasks cannot be reopened
- **TS-I02** [REQ-014]: Invariant: Completion timestamp ≥ Submission timestamp
- **TS-I03** [REQ-014]: Invariant: Completion timestamp ≥ Created timestamp
- **TS-A01** [REQ-014]: Authorization: Unauthenticated user
- **TS-A02** [REQ-014]: Authorization: User without ProjectManager role
- **TS-001** [REQ-015]: Happy Path: reject task
- **TS-E01** [REQ-015]: Error: If rejection reason empty
- **TS-E02** [REQ-015]: Error: If task status not 'pending_review'
- **TS-I01** [REQ-015]: Invariant: Rejection reason cannot be empty
- **TS-I02** [REQ-015]: Invariant: Rejection count ≥ 0 (tracked for analytics)
- **TS-I03** [REQ-015]: Invariant: Rejected tasks return to 'in_progress' status
- **TS-A01** [REQ-015]: Authorization: Unauthenticated user
- **TS-A02** [REQ-015]: Authorization: User without ProjectManager role
- **TS-001** [REQ-016]: Happy Path: export project
- **TS-E01** [REQ-016]: Error: If export format invalid
- **TS-E02** [REQ-016]: Error: If project data exceeds 100MB
- **TS-E03** [REQ-016]: Error: If export quota exceeded (>10 concurrent)
- **TS-I01** [REQ-016]: Invariant: Export includes project, tasks, comments, attachments metadata
- **TS-I02** [REQ-016]: Invariant: Export timestamp recorded
- **TS-I03** [REQ-016]: Invariant: Export file size ≤ 100MB
- **TS-A01** [REQ-016]: Authorization: Unauthenticated user
- **TS-A02** [REQ-016]: Authorization: User without Administrator role
- **TS-001** [REQ-017]: Happy Path: import project
- **TS-E01** [REQ-017]: Error: If JSON schema validation fails
- **TS-E02** [REQ-017]: Error: If file size exceeds 50MB
- **TS-E03** [REQ-017]: Error: If project data contains invalid references
- **TS-I01** [REQ-017]: Invariant: Import must pass schema validation
- **TS-I02** [REQ-017]: Invariant: Duplicate project names resolved with suffix
- **TS-I03** [REQ-017]: Invariant: Import timestamp recorded
- **TS-A01** [REQ-017]: Authorization: Unauthenticated user
- **TS-A02** [REQ-017]: Authorization: User without SystemIntegrator role
- **TS-001** [REQ-018]: Happy Path: archive task
- **TS-E01** [REQ-018]: Error: If task status not 'completed'
- **TS-E02** [REQ-018]: Error: If task completed less than 30 days ago
- **TS-I01** [REQ-018]: Invariant: Only completed tasks can be archived
- **TS-I02** [REQ-018]: Invariant: Archived tasks cannot be edited
- **TS-I03** [REQ-018]: Invariant: Archive timestamp recorded
- **TS-A01** [REQ-018]: Authorization: Unauthenticated user
- **TS-A02** [REQ-018]: Authorization: User without TeamMember role
- **TS-001** [REQ-019]: Happy Path: restore task
- **TS-E01** [REQ-019]: Error: If task not archived
- **TS-E02** [REQ-019]: Error: If task archived more than 90 days ago
- **TS-I01** [REQ-019]: Invariant: Restored tasks retain completed status
- **TS-I02** [REQ-019]: Invariant: Restore timestamp recorded
- **TS-I03** [REQ-019]: Invariant: Tasks archived >90 days cannot be restored
- **TS-A01** [REQ-019]: Authorization: Unauthenticated user
- **TS-A02** [REQ-019]: Authorization: User without ProjectManager role
- **TS-001** [REQ-020]: Happy Path: view analytics
- **TS-E01** [REQ-020]: Error: If date range exceeds 365 days
- **TS-E02** [REQ-020]: Error: If analytics service unavailable
- **TS-I01** [REQ-020]: Invariant: Date range ≤ 365 days
- **TS-I02** [REQ-020]: Invariant: Metrics calculated from non-deleted tasks only
- **TS-I03** [REQ-020]: Invariant: Analytics data refreshed every 1 hour
- **TS-A01** [REQ-020]: Authorization: Unauthenticated user
- **TS-A02** [REQ-020]: Authorization: User without Administrator role
- **TS-001** [REQ-021]: Happy Path: create api-token
- **TS-E01** [REQ-021]: Error: If token name already exists
- **TS-E02** [REQ-021]: Error: If SystemIntegrator not admin
- **TS-I01** [REQ-021]: Invariant: Token string cryptographically secure (32 characters)
- **TS-I02** [REQ-021]: Invariant: Token must have at least one permission
- **TS-I03** [REQ-021]: Invariant: Token expiration date > Created date
- **TS-A01** [REQ-021]: Authorization: Unauthenticated user
- **TS-A02** [REQ-021]: Authorization: User without SystemIntegrator role
- **TS-001** [REQ-022]: Happy Path: delete api-token
- **TS-E01** [REQ-022]: Error: If token not found
- **TS-E02** [REQ-022]: Error: If token already revoked
- **TS-I01** [REQ-022]: Invariant: Revoked tokens cannot be un-revoked
- **TS-I02** [REQ-022]: Invariant: Revocation timestamp recorded
- **TS-I03** [REQ-022]: Invariant: Active API requests with revoked token fail
- **TS-A01** [REQ-022]: Authorization: Unauthenticated user
- **TS-A02** [REQ-022]: Authorization: User without SystemIntegrator role
- **TS-001** [REQ-023]: Happy Path: create webhook
- **TS-E01** [REQ-023]: Error: If webhook URL not HTTPS
- **TS-E02** [REQ-023]: Error: If test webhook delivery fails
- **TS-E03** [REQ-023]: Error: If event type invalid
- **TS-I01** [REQ-023]: Invariant: Webhook URL must use HTTPS protocol
- **TS-I02** [REQ-023]: Invariant: Event type must be valid enum
- **TS-I03** [REQ-023]: Invariant: Webhook can subscribe to multiple event types
- **TS-A01** [REQ-023]: Authorization: Unauthenticated user
- **TS-A02** [REQ-023]: Authorization: User without Administrator role
- **TS-001** [REQ-024]: Happy Path: update webhook
- **TS-E01** [REQ-024]: Error: If webhook URL not HTTPS
- **TS-E02** [REQ-024]: Error: If test webhook delivery fails
- **TS-E03** [REQ-024]: Error: If removing all event types
- **TS-I01** [REQ-024]: Invariant: Webhook URL must use HTTPS protocol
- **TS-I02** [REQ-024]: Invariant: Event type must be valid enum
- **TS-I03** [REQ-024]: Invariant: Webhook must have at least one event type
- **TS-A01** [REQ-024]: Authorization: Unauthenticated user
- **TS-A02** [REQ-024]: Authorization: User without Administrator role
- **TS-001** [REQ-025]: Happy Path: delete webhook
- **TS-E01** [REQ-025]: Error: If webhook not found
- **TS-E02** [REQ-025]: Error: If webhook already deleted
- **TS-I01** [REQ-025]: Invariant: Deleted webhooks cannot be restored
- **TS-I02** [REQ-025]: Invariant: Pending webhook deliveries cancelled
- **TS-I03** [REQ-025]: Invariant: Deletion timestamp recorded
- **TS-A01** [REQ-025]: Authorization: Unauthenticated user
- **TS-A02** [REQ-025]: Authorization: User without Administrator role

### MEDIUM Priority (9 scenarios)

- **TS-V01** [REQ-002]: Validation: Task priority must be valid enum (LOW, MEDIUM, HIGH, CRITICAL)
- **TS-V01** [REQ-003]: Validation: Status transition must be valid (open → in_progress → completed)
- **TS-V01** [REQ-006]: Validation: Search query minimum 2 characters
- **TS-V01** [REQ-013]: Validation: All required task fields completed
- **TS-V01** [REQ-016]: Validation: Export format must be one of JSON, CSV, PDF
- **TS-V02** [REQ-017]: Validation: JSON schema validation passes
- **TS-V01** [REQ-023]: Validation: Webhook URL valid HTTPS URL
- **TS-V02** [REQ-023]: Validation: Event type must be valid (task.created, task.updated, task.completed)
- **TS-V01** [REQ-024]: Validation: Webhook URL valid HTTPS URL if changed

### LOW Priority (25 scenarios)

- **TS-EC01** [REQ-001]: Edge Case: Concurrent operations
- **TS-EC01** [REQ-002]: Edge Case: Concurrent operations
- **TS-EC01** [REQ-003]: Edge Case: Concurrent operations
- **TS-EC01** [REQ-004]: Edge Case: Concurrent operations
- **TS-EC01** [REQ-005]: Edge Case: Concurrent operations
- **TS-EC01** [REQ-006]: Edge Case: Concurrent operations
- **TS-EC01** [REQ-007]: Edge Case: Concurrent operations
- **TS-EC01** [REQ-008]: Edge Case: Concurrent operations
- **TS-EC01** [REQ-009]: Edge Case: Concurrent operations
- **TS-EC01** [REQ-010]: Edge Case: Concurrent operations
- **TS-EC01** [REQ-011]: Edge Case: Concurrent operations
- **TS-EC01** [REQ-012]: Edge Case: Concurrent operations
- **TS-EC01** [REQ-013]: Edge Case: Concurrent operations
- **TS-EC01** [REQ-014]: Edge Case: Concurrent operations
- **TS-EC01** [REQ-015]: Edge Case: Concurrent operations
- **TS-EC01** [REQ-016]: Edge Case: Concurrent operations
- **TS-EC01** [REQ-017]: Edge Case: Concurrent operations
- **TS-EC01** [REQ-018]: Edge Case: Concurrent operations
- **TS-EC01** [REQ-019]: Edge Case: Concurrent operations
- **TS-EC01** [REQ-020]: Edge Case: Concurrent operations
- **TS-EC01** [REQ-021]: Edge Case: Concurrent operations
- **TS-EC01** [REQ-022]: Edge Case: Concurrent operations
- **TS-EC01** [REQ-023]: Edge Case: Concurrent operations
- **TS-EC01** [REQ-024]: Edge Case: Concurrent operations
- **TS-EC01** [REQ-025]: Edge Case: Concurrent operations

---

## Test Scenarios by Type

### happy_path (25 scenarios)

- **TS-001** [REQ-001]: Happy Path: create project
- **TS-001** [REQ-002]: Happy Path: create task
- **TS-001** [REQ-003]: Happy Path: update task
- **TS-001** [REQ-004]: Happy Path: view task
- **TS-001** [REQ-005]: Happy Path: delete task
- ... and 20 more

### error_handling (58 scenarios)

- **TS-E01** [REQ-001]: Error: If project name already exists
- **TS-E02** [REQ-001]: Error: If subscription inactive
- **TS-E01** [REQ-002]: Error: If project not found
- **TS-E02** [REQ-002]: Error: If assignee not project member
- **TS-E03** [REQ-002]: Error: If due date in past
- ... and 53 more

### invariant (72 scenarios)

- **TS-I01** [REQ-001]: Invariant: Project must have exactly one owner
- **TS-I02** [REQ-001]: Invariant: Project name 3-100 characters
- **TS-I03** [REQ-001]: Invariant: Created date ≤ Current date
- **TS-I01** [REQ-002]: Invariant: Task title 3-200 characters
- **TS-I02** [REQ-002]: Invariant: Due date ≥ Created date
- ... and 67 more

### authorization (50 scenarios)

- **TS-A01** [REQ-001]: Authorization: Unauthenticated user
- **TS-A02** [REQ-001]: Authorization: User without ProjectManager role
- **TS-A01** [REQ-002]: Authorization: Unauthenticated user
- **TS-A02** [REQ-002]: Authorization: User without ProjectManager role
- **TS-A01** [REQ-003]: Authorization: Unauthenticated user
- ... and 45 more

### edge_case (25 scenarios)

- **TS-EC01** [REQ-001]: Edge Case: Concurrent operations
- **TS-EC01** [REQ-002]: Edge Case: Concurrent operations
- **TS-EC01** [REQ-003]: Edge Case: Concurrent operations
- **TS-EC01** [REQ-004]: Edge Case: Concurrent operations
- **TS-EC01** [REQ-005]: Edge Case: Concurrent operations
- ... and 20 more

### validation (9 scenarios)

- **TS-V01** [REQ-002]: Validation: Task priority must be valid enum (LOW, MEDIUM, HIGH, CRITICAL)
- **TS-V01** [REQ-003]: Validation: Status transition must be valid (open → in_progress → completed)
- **TS-V01** [REQ-006]: Validation: Search query minimum 2 characters
- **TS-V01** [REQ-013]: Validation: All required task fields completed
- **TS-V01** [REQ-016]: Validation: Export format must be one of JSON, CSV, PDF
- ... and 4 more

---

## Traceability Matrix

### REQ-001 (9 tests)

- TS-001: Happy Path: create project [happy_path] [HIGH]
- TS-E01: Error: If project name already exists [error_handling] [HIGH]
- TS-E02: Error: If subscription inactive [error_handling] [HIGH]
- TS-I01: Invariant: Project must have exactly one owner [invariant] [HIGH]
- TS-I02: Invariant: Project name 3-100 characters [invariant] [HIGH]
- TS-I03: Invariant: Created date ≤ Current date [invariant] [HIGH]
- TS-A01: Authorization: Unauthenticated user [authorization] [HIGH]
- TS-A02: Authorization: User without ProjectManager role [authorization] [HIGH]
- TS-EC01: Edge Case: Concurrent operations [edge_case] [LOW]

### REQ-002 (11 tests)

- TS-001: Happy Path: create task [happy_path] [HIGH]
- TS-E01: Error: If project not found [error_handling] [HIGH]
- TS-E02: Error: If assignee not project member [error_handling] [HIGH]
- TS-E03: Error: If due date in past [error_handling] [HIGH]
- TS-V01: Validation: Task priority must be valid enum (LOW, MEDIUM, HIGH, CRITICAL) [validation] [MEDIUM]
- TS-I01: Invariant: Task title 3-200 characters [invariant] [HIGH]
- TS-I02: Invariant: Due date ≥ Created date [invariant] [HIGH]
- TS-I03: Invariant: Priority must be one of LOW, MEDIUM, HIGH, CRITICAL [invariant] [HIGH]
- TS-A01: Authorization: Unauthenticated user [authorization] [HIGH]
- TS-A02: Authorization: User without ProjectManager role [authorization] [HIGH]
- TS-EC01: Edge Case: Concurrent operations [edge_case] [LOW]

### REQ-003 (10 tests)

- TS-001: Happy Path: update task [happy_path] [HIGH]
- TS-E01: Error: If invalid status transition (e.g., completed → open) [error_handling] [HIGH]
- TS-E02: Error: If concurrent update detected [error_handling] [HIGH]
- TS-V01: Validation: Status transition must be valid (open → in_progress → completed) [validation] [MEDIUM]
- TS-I01: Invariant: Status transitions open → in_progress → completed (no backwards) [invariant] [HIGH]
- TS-I02: Invariant: Completed tasks cannot be reopened [invariant] [HIGH]
- TS-I03: Invariant: Due date ≥ Created date [invariant] [HIGH]
- TS-A01: Authorization: Unauthenticated user [authorization] [HIGH]
- TS-A02: Authorization: User without TeamMember role [authorization] [HIGH]
- TS-EC01: Edge Case: Concurrent operations [edge_case] [LOW]

### REQ-004 (8 tests)

- TS-001: Happy Path: view task [happy_path] [HIGH]
- TS-E01: Error: If task not found [error_handling] [HIGH]
- TS-E02: Error: If TeamMember lacks read permission [error_handling] [HIGH]
- TS-I01: Invariant: Task data immutable during read operation [invariant] [HIGH]
- TS-I02: Invariant: View count ≥ 0 [invariant] [HIGH]
- TS-A01: Authorization: Unauthenticated user [authorization] [HIGH]
- TS-A02: Authorization: User without TeamMember role [authorization] [HIGH]
- TS-EC01: Edge Case: Concurrent operations [edge_case] [LOW]

### REQ-005 (9 tests)

- TS-001: Happy Path: delete task [happy_path] [HIGH]
- TS-E01: Error: If ProjectManager not project owner [error_handling] [HIGH]
- TS-E02: Error: If task already deleted [error_handling] [HIGH]
- TS-I01: Invariant: Deleted tasks cannot be undeleted (permanent soft delete) [invariant] [HIGH]
- TS-I02: Invariant: Deletion timestamp recorded [invariant] [HIGH]
- TS-I03: Invariant: Deletion actor recorded [invariant] [HIGH]
- TS-A01: Authorization: Unauthenticated user [authorization] [HIGH]
- TS-A02: Authorization: User without ProjectManager role [authorization] [HIGH]
- TS-EC01: Edge Case: Concurrent operations [edge_case] [LOW]

### REQ-006 (10 tests)

- TS-001: Happy Path: search tasks [happy_path] [HIGH]
- TS-E01: Error: If query less than 2 characters [error_handling] [HIGH]
- TS-E02: Error: If search timeout (>5 seconds) [error_handling] [HIGH]
- TS-V01: Validation: Search query minimum 2 characters [validation] [MEDIUM]
- TS-I01: Invariant: Search results include only tasks TeamMember has permission to view [invariant] [HIGH]
- TS-I02: Invariant: Results limited to 100 tasks per query [invariant] [HIGH]
- TS-I03: Invariant: Deleted tasks excluded from results [invariant] [HIGH]
- TS-A01: Authorization: Unauthenticated user [authorization] [HIGH]
- TS-A02: Authorization: User without TeamMember role [authorization] [HIGH]
- TS-EC01: Edge Case: Concurrent operations [edge_case] [LOW]

### REQ-007 (9 tests)

- TS-001: Happy Path: create comment [happy_path] [HIGH]
- TS-E01: Error: If comment text exceeds 2000 characters [error_handling] [HIGH]
- TS-E02: Error: If task not found [error_handling] [HIGH]
- TS-I01: Invariant: Comment must belong to exactly one task [invariant] [HIGH]
- TS-I02: Invariant: Comment text cannot be empty [invariant] [HIGH]
- TS-I03: Invariant: Created date ≤ Current date [invariant] [HIGH]
- TS-A01: Authorization: Unauthenticated user [authorization] [HIGH]
- TS-A02: Authorization: User without TeamMember role [authorization] [HIGH]
- TS-EC01: Edge Case: Concurrent operations [edge_case] [LOW]

### REQ-008 (10 tests)

- TS-001: Happy Path: create attachment [happy_path] [HIGH]
- TS-E01: Error: If file size exceeds 10MB [error_handling] [HIGH]
- TS-E02: Error: If file type not allowed [error_handling] [HIGH]
- TS-E03: Error: If filename already exists on task [error_handling] [HIGH]
- TS-I01: Invariant: File size ≤ 10MB [invariant] [HIGH]
- TS-I02: Invariant: Filename unique per task [invariant] [HIGH]
- TS-I03: Invariant: Upload timestamp recorded [invariant] [HIGH]
- TS-A01: Authorization: Unauthenticated user [authorization] [HIGH]
- TS-A02: Authorization: User without TeamMember role [authorization] [HIGH]
- TS-EC01: Edge Case: Concurrent operations [edge_case] [LOW]

### REQ-009 (9 tests)

- TS-001: Happy Path: create team [happy_path] [HIGH]
- TS-E01: Error: If team name already exists [error_handling] [HIGH]
- TS-E02: Error: If subscription inactive [error_handling] [HIGH]
- TS-I01: Invariant: Team must have exactly one owner [invariant] [HIGH]
- TS-I02: Invariant: Team name 3-100 characters [invariant] [HIGH]
- TS-I03: Invariant: Team has 0+ members [invariant] [HIGH]
- TS-A01: Authorization: Unauthenticated user [authorization] [HIGH]
- TS-A02: Authorization: User without ProjectManager role [authorization] [HIGH]
- TS-EC01: Edge Case: Concurrent operations [edge_case] [LOW]

### REQ-010 (8 tests)

- TS-001: Happy Path: update team [happy_path] [HIGH]
- TS-E01: Error: If team name already exists [error_handling] [HIGH]
- TS-E02: Error: If ProjectManager not team owner [error_handling] [HIGH]
- TS-I01: Invariant: Team name 3-100 characters [invariant] [HIGH]
- TS-I02: Invariant: Team must have exactly one owner [invariant] [HIGH]
- TS-A01: Authorization: Unauthenticated user [authorization] [HIGH]
- TS-A02: Authorization: User without ProjectManager role [authorization] [HIGH]
- TS-EC01: Edge Case: Concurrent operations [edge_case] [LOW]

*... and 15 more requirements*

