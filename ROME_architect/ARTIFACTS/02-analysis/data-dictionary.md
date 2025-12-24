# Data Dictionary

Generated: 2025-12-24T06:53:30.748Z
Requirements Analyzed: 25

---

## Statistics

- Total Entities: 60
- Total Relationships: 2
- Total Attributes: 28
- Avg Attributes/Entity: 0.47

---

## Entities

### Audit

**Type:** secondary
**Mentions:** 16
**Source Requirements:** REQ-001, REQ-005, REQ-009, REQ-010, REQ-011, REQ-012, REQ-014, REQ-015, REQ-016, REQ-018, REQ-019, REQ-021, REQ-022, REQ-023, REQ-024, REQ-025

### Task

**Type:** primary
**Mentions:** 14
**Source Requirements:** REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, REQ-007, REQ-008, REQ-013, REQ-014, REQ-015, REQ-018, REQ-019, REQ-020, REQ-023

**Attributes:**

| Attribute | Type | Constraints |
|-----------|------|-------------|
| status | enum | required, indexed |
| creator | reference | - |
| title | string | required |
| assignee | reference | - |

### Project

**Type:** primary
**Mentions:** 12
**Source Requirements:** REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, REQ-014, REQ-015, REQ-016, REQ-017, REQ-018, REQ-019

**Attributes:**

| Attribute | Type | Constraints |
|-----------|------|-------------|
| name | string | required |
| status | enum | required, indexed |
| owner | reference | indexed |

### ProjectManager

**Type:** actor
**Mentions:** 12
**Source Requirements:** REQ-001, REQ-002, REQ-005, REQ-007, REQ-009, REQ-010, REQ-011, REQ-012, REQ-013, REQ-014, REQ-015, REQ-019

### Manager

**Type:** secondary
**Mentions:** 10
**Source Requirements:** REQ-001, REQ-002, REQ-005, REQ-009, REQ-010, REQ-011, REQ-012, REQ-014, REQ-015, REQ-019

### Notification

**Type:** secondary
**Mentions:** 10
**Source Requirements:** REQ-001, REQ-002, REQ-003, REQ-007, REQ-008, REQ-011, REQ-012, REQ-013, REQ-014, REQ-015

**Attributes:**

| Attribute | Type | Constraints |
|-----------|------|-------------|
| user | string | - |

### TeamMember

**Type:** primary
**Mentions:** 9
**Source Requirements:** REQ-003, REQ-004, REQ-006, REQ-007, REQ-008, REQ-011, REQ-012, REQ-013, REQ-018

### Member

**Type:** secondary
**Mentions:** 9
**Source Requirements:** REQ-003, REQ-004, REQ-006, REQ-007, REQ-008, REQ-011, REQ-012, REQ-013, REQ-018

### Role

**Type:** secondary
**Mentions:** 8
**Source Requirements:** REQ-005, REQ-011, REQ-016, REQ-021, REQ-022, REQ-023, REQ-024, REQ-025

### Permission

**Type:** secondary
**Mentions:** 7
**Source Requirements:** REQ-003, REQ-006, REQ-007, REQ-008, REQ-018, REQ-020, REQ-021

### Organization

**Type:** secondary
**Mentions:** 6
**Source Requirements:** REQ-001, REQ-009, REQ-010, REQ-011, REQ-017, REQ-021

### Created

**Type:** secondary
**Mentions:** 6
**Source Requirements:** REQ-001, REQ-002, REQ-003, REQ-007, REQ-014, REQ-021

**Attributes:**

| Attribute | Type | Constraints |
|-----------|------|-------------|
| date | datetime | immutable |
| time | datetime | immutable |

### Team

**Type:** primary
**Mentions:** 5
**Source Requirements:** REQ-009, REQ-010, REQ-011, REQ-012, REQ-020

**Attributes:**

| Attribute | Type | Constraints |
|-----------|------|-------------|
| name | string | required |
| owner | reference | indexed |

### Administrator

**Type:** secondary
**Mentions:** 5
**Source Requirements:** REQ-016, REQ-020, REQ-023, REQ-024, REQ-025

### Due

**Type:** secondary
**Mentions:** 3
**Source Requirements:** REQ-002, REQ-003, REQ-013

**Attributes:**

| Attribute | Type | Constraints |
|-----------|------|-------------|
| date | datetime | immutable |

### SystemIntegrator

**Type:** actor
**Mentions:** 3
**Source Requirements:** REQ-017, REQ-021, REQ-022

### Integrator

**Type:** secondary
**Mentions:** 3
**Source Requirements:** REQ-017, REQ-021, REQ-022

### Token

**Type:** secondary
**Mentions:** 3
**Source Requirements:** REQ-017, REQ-021, REQ-022

**Attributes:**

| Attribute | Type | Constraints |
|-----------|------|-------------|
| name | string | required |

### Tasks

**Type:** secondary
**Mentions:** 3
**Source Requirements:** REQ-017, REQ-018, REQ-019

### Webhook

**Type:** primary
**Mentions:** 3
**Source Requirements:** REQ-023, REQ-024, REQ-025

### Current

**Type:** secondary
**Mentions:** 2
**Source Requirements:** REQ-001, REQ-007

**Attributes:**

| Attribute | Type | Constraints |
|-----------|------|-------------|
| date | datetime | immutable |

### Related

**Type:** secondary
**Mentions:** 2
**Source Requirements:** REQ-004, REQ-005

### Deletion

**Type:** secondary
**Mentions:** 2
**Source Requirements:** REQ-005, REQ-025

**Attributes:**

| Attribute | Type | Constraints |
|-----------|------|-------------|
| time | datetime | immutable |

### Results

**Type:** secondary
**Mentions:** 2
**Source Requirements:** REQ-006, REQ-020

### User

**Type:** secondary
**Mentions:** 2
**Source Requirements:** REQ-011, REQ-012

### Submission

**Type:** secondary
**Mentions:** 2
**Source Requirements:** REQ-013, REQ-014

**Attributes:**

| Attribute | Type | Constraints |
|-----------|------|-------------|
| time | datetime | immutable |

### ApiToken

**Type:** primary
**Mentions:** 2
**Source Requirements:** REQ-021, REQ-022

### Event

**Type:** secondary
**Mentions:** 2
**Source Requirements:** REQ-023, REQ-024

**Attributes:**

| Attribute | Type | Constraints |
|-----------|------|-------------|
| type | enum | required, indexed |

### Test

**Type:** secondary
**Mentions:** 2
**Source Requirements:** REQ-023, REQ-024

### Assignee

**Type:** secondary
**Mentions:** 1
**Source Requirements:** REQ-002

### Priority

**Type:** secondary
**Mentions:** 1
**Source Requirements:** REQ-002

### Completed

**Type:** secondary
**Mentions:** 1
**Source Requirements:** REQ-003

### Last

**Type:** secondary
**Mentions:** 1
**Source Requirements:** REQ-004

### View

**Type:** secondary
**Mentions:** 1
**Source Requirements:** REQ-004

### Search

**Type:** secondary
**Mentions:** 1
**Source Requirements:** REQ-006

**Attributes:**

| Attribute | Type | Constraints |
|-----------|------|-------------|
| time | datetime | immutable |

### Deleted

**Type:** secondary
**Mentions:** 1
**Source Requirements:** REQ-006

### Comment

**Type:** primary
**Mentions:** 1
**Source Requirements:** REQ-007

**Attributes:**

| Attribute | Type | Constraints |
|-----------|------|-------------|
| time | datetime | immutable |

### Attachment

**Type:** primary
**Mentions:** 1
**Source Requirements:** REQ-008

### File

**Type:** secondary
**Mentions:** 1
**Source Requirements:** REQ-008

**Attributes:**

| Attribute | Type | Constraints |
|-----------|------|-------------|
| type | enum | required, indexed |

### Fs

**Type:** secondary
**Mentions:** 1
**Source Requirements:** REQ-008

### Filename

**Type:** secondary
**Mentions:** 1
**Source Requirements:** REQ-008

### Upload

**Type:** secondary
**Mentions:** 1
**Source Requirements:** REQ-008

**Attributes:**

| Attribute | Type | Constraints |
|-----------|------|-------------|
| time | datetime | immutable |

### Completion

**Type:** secondary
**Mentions:** 1
**Source Requirements:** REQ-014

**Attributes:**

| Attribute | Type | Constraints |
|-----------|------|-------------|
| time | datetime | immutable |

### Rejection

**Type:** secondary
**Mentions:** 1
**Source Requirements:** REQ-015

### Rejected

**Type:** secondary
**Mentions:** 1
**Source Requirements:** REQ-015

### Export

**Type:** secondary
**Mentions:** 1
**Source Requirements:** REQ-016

**Attributes:**

| Attribute | Type | Constraints |
|-----------|------|-------------|
| time | datetime | immutable |

### Import

**Type:** secondary
**Mentions:** 1
**Source Requirements:** REQ-017

**Attributes:**

| Attribute | Type | Constraints |
|-----------|------|-------------|
| time | datetime | immutable |

### Duplicate

**Type:** secondary
**Mentions:** 1
**Source Requirements:** REQ-017

### Archived

**Type:** secondary
**Mentions:** 1
**Source Requirements:** REQ-018

### Archive

**Type:** secondary
**Mentions:** 1
**Source Requirements:** REQ-018

**Attributes:**

| Attribute | Type | Constraints |
|-----------|------|-------------|
| time | datetime | immutable |

### Restore

**Type:** secondary
**Mentions:** 1
**Source Requirements:** REQ-019

**Attributes:**

| Attribute | Type | Constraints |
|-----------|------|-------------|
| time | datetime | immutable |

### Analytic

**Type:** primary
**Mentions:** 1
**Source Requirements:** REQ-020

### Metrics

**Type:** secondary
**Mentions:** 1
**Source Requirements:** REQ-020

### Charts

**Type:** secondary
**Mentions:** 1
**Source Requirements:** REQ-020

### NonDeleted

**Type:** secondary
**Mentions:** 1
**Source Requirements:** REQ-020

### Analytics

**Type:** secondary
**Mentions:** 1
**Source Requirements:** REQ-020

### UnRevoked

**Type:** secondary
**Mentions:** 1
**Source Requirements:** REQ-022

### Revocation

**Type:** secondary
**Mentions:** 1
**Source Requirements:** REQ-022

**Attributes:**

| Attribute | Type | Constraints |
|-----------|------|-------------|
| time | datetime | immutable |

### Active

**Type:** secondary
**Mentions:** 1
**Source Requirements:** REQ-022

### Pending

**Type:** secondary
**Mentions:** 1
**Source Requirements:** REQ-025

---

## Relationships

- **Projectmanager** --[has_many]--> **Project**
  - Source: REQ-001
- **Projectmanager** --[has_many]--> **Team**
  - Source: REQ-009
