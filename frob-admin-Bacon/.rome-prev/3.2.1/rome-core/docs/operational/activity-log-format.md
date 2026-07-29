# ROME Framework: Activity Log Format Specification

| Field | Value |
|-------|-------|
| **Document UID** | ROME-GOV-008 |
| **Version** | 2.1 |
| **Date** | 2026-02-27T00:00:00Z |
| **Status** | Draft |
| **Document Type** | Governance |
| **Author** | Framework Analyst & Architect |
| **Changes Approved** | false |

---

## Purpose

Defines the canonical format for ROME activity log files and state indexes. Ensures consistent event logging across all robots and enables automated parsing, state reconstruction, and traceability.

## Scope

Applies to ALL robots logging activity in ROME v10+ projects using the Event Log Protocol.

## Dependencies

- ROME-PRIN-001 (Core Principles) - Principle 2: Traceability
- ROME-PROC-005 (Activity Logging Protocol) - Logging procedures
- ROME-LEX-001 (Lexicon) - Activity tracking terminology

---

## Event Log File Format

### File Location

**Path:** `ARTIFACTS/activity-log.txt`

**Characteristics:**
- Append-only (never edit previous lines)
- Plain text UTF-8 encoding
- Unix line endings (LF)
- Git-tracked
- Human-readable

### File Header

Every activity log MUST begin with this header:

```
# ROME Activity Log
# Project: [project_name]
# Created: [ISO-8601-timestamp]
# Format: TIMESTAMP | TYPE | ID | ATTRIBUTES

```

**Example:**
```
# ROME Activity Log
# Project: my_project
# Created: 2025-12-01T10:00:00Z
# Format: TIMESTAMP | TYPE | ID | ATTRIBUTES

```

**Rules:**
- Header is OPTIONAL for parsing (parsers skip lines starting with `#`)
- Header provides human context
- Blank line after header separates from events

---

## Event Line Format

### Syntax

```
TIMESTAMP | TYPE | ID | ATTR1:VALUE1 | ATTR2:VALUE2 | ...
```

**Example:**
```
2025-12-03T10:00:00Z | STORY | STORY-001-001-1-database | status:IN_PROGRESS | robot:ashok | started:2025-12-03T10:00:00Z
```

### Field Definitions

#### 1. TIMESTAMP (Required)

**Format:** ISO 8601 UTC timestamp

**Pattern:** `YYYY-MM-DDTHH:MM:SSZ`

**Rules:**
- MUST be UTC (indicated by `Z` suffix)
- MUST include seconds
- MUST NOT include milliseconds (for readability)
- MUST be chronologically increasing (new events have later timestamps)

**Valid:**
```
2025-12-03T10:00:00Z
2025-12-03T10:15:30Z
```

**Invalid:**
```
2025-12-03T10:00:00      # Missing Z
2025-12-03T10:00:00.123Z # Milliseconds not allowed
2025-12-03 10:00:00Z     # Wrong format
```

---

#### 2. TYPE (Required)

**Format:** Uppercase enum value

**Valid Values:**
- `PHASE` - Phase transitions
- `FEATURE` - Feature-level work
- `STORY` - User story implementation
- `BLOCKER` - Impediments blocking progress
- `AMENDMENT` - In-flight amendments during an active ROME cycle (AMD-###)
- `CHANGE_REQUEST` - Post-delivery change requests after cycle completion (CR-###)

**Rules:**
- MUST be uppercase
- MUST be one of the defined values
- Case-sensitive

**Valid:**
```
PHASE
STORY
BLOCKER
```

**Invalid:**
```
phase      # Lowercase
Story      # Mixed case
TASK       # Not a defined type
```

---

#### 3. ID (Required)

**Format:** Unique identifier string

**Patterns by Type:**

| Type | ID Pattern | Example |
|------|-----------|---------|
| PHASE | `PHASE-#` | `PHASE-2` |
| FEATURE | `FEAT-###` | `FEAT-001` |
| STORY | `STORY-[EPIC]-[FEAT]-[SEQ]-[CAP]` | `STORY-001-001-1-database` |
| BLOCKER | `BLOCK-###` | `BLOCK-001` |
| AMENDMENT | `AMD-###` | `AMD-001` |
| CHANGE_REQUEST | `CR-###` | `CR-001` |

**Rules:**
- MUST be unique within project
- MUST follow pattern for entry type
- MUST NOT contain pipes (`|`) or colons (`:`)
- MUST NOT contain spaces

**Valid:**
```
PHASE-2
FEAT-001
STORY-001-001-1-database
BLOCK-001
```

**Invalid:**
```
PHASE 2         # Contains space
FEAT:001        # Contains colon
STORY|001       # Contains pipe
feat-001        # Lowercase (wrong pattern)
```

---

#### 4. ATTRIBUTES (Optional, Repeatable)

**Format:** `key:value` pairs separated by ` | `

**Syntax:** `key:value`

**Rules:**
- Key MUST be lowercase alphanumeric + underscore
- Value format depends on data type (see below)
- Multiple attributes separated by ` | ` (space-pipe-space)
- Order does NOT matter (parsers treat as key-value map)

**Value Encoding by Type:**

| Data Type | Encoding | Example |
|-----------|----------|---------|
| String (no spaces) | Unquoted | `robot:ashok` |
| String (with spaces) | Double-quoted | `title:"User Authentication"` |
| Number | Unquoted | `estimate:2h` |
| ISO Timestamp | Unquoted | `started:2025-12-03T10:00:00Z` |
| Enum | Uppercase unquoted | `status:IN_PROGRESS` |
| Null/Empty | Omit attribute | (not `value:null`) |

**Valid:**
```
status:IN_PROGRESS | robot:ashok | started:2025-12-03T10:00:00Z
title:"User table" | estimate:2h | phase:2
severity:HIGH | feature:FEAT-001
```

**Invalid:**
```
status:"IN_PROGRESS"    # Enum should not be quoted
robot: ashok            # Space after colon
title:User table        # Spaces require quotes
started:"2025-12-03"    # Timestamp should not be quoted
```

---

### Common Attributes

#### Universal Attributes (All Types)

| Attribute | Type | Required? | Example | Description |
|-----------|------|-----------|---------|-------------|
| `status` | Enum | Yes | `status:IN_PROGRESS` | Entry current status |
| `role` | String | Yes | `role:ashok` | Producing Role (ROME-STD-AGENT-ROLES). Canonical. |
| `robot` | String | No | `robot:ashok` | **Legacy alias for `role`.** Deprecated (ROME-STD-AGENT-ROLES §1 retired "Robot" → Role/Instance). Parsers accept it as a synonym for `role`; new entries SHOULD emit `role`. |

> **`role` vs `robot` (PROP-044 Part C).** `role` is canonical; `robot` is retained as a backward-compatible alias so existing logs and parsers keep working. Optionally pair `role` with `agent:<instance-id>` to distinguish the Role from the specific Instance filling it (the orchestrator state already records both). A hard rename is deferred to a future MAJOR release.

#### Status Values by Entry Type

**PHASE, FEATURE, STORY:**
- `PENDING` - Not yet started
- `IN_PROGRESS` - Currently active
- `COMPLETED` - Finished successfully
- `BLOCKED` - Blocked by impediment

**BLOCKER:**
- `OPEN` - Unresolved
- `ESCALATED` - Escalated to sponsor
- `RESOLVED` - Resolved

**AMENDMENT:**
- `PENDING_REVIEW` - Awaiting approval
- `APPROVED` - Approved for implementation
- `REJECTED` - Rejected

**CHANGE_REQUEST:**
- `PROPOSED` - CR submitted, awaiting analysis
- `ANALYZED` - Impact analysis complete
- `APPROVED` - Sarah approved, implementation may begin
- `IN_PROGRESS` - Implementation underway
- `COMPLETED` - Implementation verified, deployed
- `REJECTED` - CR rejected with documented reason
- `ROLLED_BACK` - Implementation reversed

---

#### Type-Specific Attributes

**PHASE:**
| Attribute | Type | Example | Description |
|-----------|------|---------|-------------|
| `phase` | Number | `phase:2` | Phase number (0-5) |
| `description` | String | `description:"Analysis phase"` | Phase description |
| `start` | Timestamp | `start:2025-12-01T10:00:00Z` | Phase start time |
| `end` | Timestamp | `end:2025-12-02T16:00:00Z` | Phase end time |

**FEATURE:**
| Attribute | Type | Example | Description |
|-----------|------|---------|-------------|
| `epic` | ID | `epic:EPIC-001` | Parent epic |
| `phase` | Number | `phase:2` | Phase number |
| `title` | String | `title:"User Authentication"` | Feature title |
| `priority` | Enum | `priority:HIGH` | Priority (HIGH/MEDIUM/LOW) |
| `capability` | String | `capability:database` | Capability identifier from tech-stack.yaml |

**STORY:**
| Attribute | Type | Example | Description |
|-----------|------|---------|-------------|
| `feature` | ID | `feature:FEAT-001` | Parent feature |
| `title` | String | `title:"User table"` | Story title |
| `estimate` | String | `estimate:2h` | Time estimate |
| `started` | Timestamp | `started:2025-12-03T10:00:00Z` | Start timestamp |
| `completed` | Timestamp | `completed:2025-12-03T12:00:00Z` | Completion timestamp |
| `blocker` | ID | `blocker:BLOCK-001` | Blocking blocker ID |

**BLOCKER:**
| Attribute | Type | Example | Description |
|-----------|------|---------|-------------|
| `severity` | Enum | `severity:HIGH` | Severity (CRITICAL/HIGH/MEDIUM/LOW) |
| `feature` | ID | `feature:FEAT-001` | Affected feature |
| `story` | ID | `story:STORY-001-001-1-database` | Affected story |
| `title` | String | `title:"Missing API spec"` | Blocker description |
| `resolution` | String | `resolution:"Spec provided"` | Resolution description |
| `created` | Timestamp | `created:2025-12-02T14:00:00Z` | Creation timestamp |
| `resolved` | Timestamp | `resolved:2025-12-03T10:00:00Z` | Resolution timestamp |

**AMENDMENT:**
| Attribute | Type | Example | Description |
|-----------|------|---------|-------------|
| `targetPhase` | Number | `targetPhase:3` | Phase to amend |
| `severity` | Enum | `severity:MEDIUM` | Impact severity |
| `feature` | ID | `feature:FEAT-001` | Affected feature |
| `title` | String | `title:"Update API design"` | Amendment description |
| `requestedBy` | String | `requestedBy:reena` | Requesting robot |
| `approvedBy` | String | `approvedBy:roma` | Approving robot |

**CHANGE_REQUEST:**
| Attribute | Type | Example | Description |
|-----------|------|---------|-------------|
| `type` | Enum | `type:TERMINOLOGY_CHANGE` | Change category (TERMINOLOGY_CHANGE \| LOGIC_CHANGE \| SCHEMA_CHANGE \| API_CHANGE \| UI_CHANGE \| REQUIREMENT_CHANGE \| REFACTOR) |
| `title` | String | `title:"Rename Company to Organisation"` | Human-readable summary |
| `requestedBy` | String | `requestedBy:roma` | Initiating robot or sponsor |
| `approvedBy` | String | `approvedBy:sarah` | Approving robot |
| `targetPhase` | Number | `targetPhase:3` | Phase whose artifacts are affected |
| `breaking` | Boolean | `breaking:true` | Whether change breaks existing consumers |
| `requirementsAffected` | Number | `requirementsAffected:3` | Count of affected REQ-### files |
| `codeFilesAffected` | Number | `codeFilesAffected:12` | Count of affected source files |
| `traceabilityVerified` | Boolean | `traceabilityVerified:true` | Traceability chain intact after change |

---

## Event Type Specifications

### PHASE Events

**Purpose:** Track phase transitions

**Example:**
```
2025-12-01T10:00:00Z | PHASE | PHASE-2 | status:IN_PROGRESS | robot:talib | phase:2 | description:"Analysis phase" | start:2025-12-01T10:00:00Z
2025-12-02T16:00:00Z | PHASE | PHASE-2 | status:COMPLETED | robot:talib | end:2025-12-02T16:00:00Z
```

**State Transition:**
- Phase begins: `status:IN_PROGRESS` with `start` timestamp
- Phase ends: `status:COMPLETED` with `end` timestamp

---

### FEATURE Events

**Purpose:** Track feature-level work

**Example:**
```
2025-12-02T14:00:00Z | FEATURE | FEAT-001 | status:IN_PROGRESS | robot:talib | epic:EPIC-001 | phase:2 | title:"User Authentication" | priority:HIGH
2025-12-03T16:00:00Z | FEATURE | FEAT-001 | status:COMPLETED | robot:talib
```

**State Transition:**
- Feature created: `status:PENDING` or `status:IN_PROGRESS`
- Feature completed: `status:COMPLETED`
- Feature blocked: `status:BLOCKED` with `blocker` ID

---

### STORY Events

**Purpose:** Track user story implementation

**Example:**
```
2025-12-02T14:05:00Z | STORY | STORY-001-001-1-database | status:PENDING | robot:talib | feature:FEAT-001 | title:"User table" | estimate:2h
2025-12-03T10:00:00Z | STORY | STORY-001-001-1-database | status:IN_PROGRESS | robot:ashok | started:2025-12-03T10:00:00Z
2025-12-03T12:00:00Z | STORY | STORY-001-001-1-database | status:COMPLETED | robot:ashok | completed:2025-12-03T12:00:00Z
```

**State Transition:**
- Story created: `status:PENDING`
- Story started: `status:IN_PROGRESS` with `started` timestamp
- Story completed: `status:COMPLETED` with `completed` timestamp
- Story blocked: `status:BLOCKED` with `blocker` ID

---

### BLOCKER Events

**Purpose:** Track impediments

**Example:**
```
2025-12-02T14:30:00Z | BLOCKER | BLOCK-001 | status:OPEN | severity:HIGH | feature:FEAT-001 | robot:talib | title:"Missing API specification" | created:2025-12-02T14:30:00Z
2025-12-03T10:00:00Z | BLOCKER | BLOCK-001 | status:RESOLVED | robot:roma | resolution:"Spec provided by PMA" | resolved:2025-12-03T10:00:00Z
```

**State Transition:**
- Blocker created: `status:OPEN` with `created` timestamp
- Blocker escalated: `status:ESCALATED`
- Blocker resolved: `status:RESOLVED` with `resolved` timestamp and `resolution` description

---

### AMENDMENT Events

**Purpose:** Track in-flight amendments during an active ROME cycle (P0–P5 still running). Use AMD-### only while the cycle is active. For post-delivery changes, use CHANGE_REQUEST.

**Example:**
```
2025-12-04T09:00:00Z | AMENDMENT | AMD-001 | status:PENDING_REVIEW | robot:reena | targetPhase:3 | severity:MEDIUM | feature:FEAT-001 | title:"Add pagination to API design" | requestedBy:reena
2025-12-04T11:00:00Z | AMENDMENT | AMD-001 | status:APPROVED | robot:roma | approvedBy:roma
```

**State Transition:**
- Amendment created: `status:PENDING_REVIEW` with `requestedBy`
- Amendment approved: `status:APPROVED` with `approvedBy`
- Amendment rejected: `status:REJECTED` with rejection reason

---

### CHANGE_REQUEST Events

**Purpose:** Track post-delivery Change Request lifecycle. Use CR-### only after the ROME cycle (P0–P5) is complete and the application is deployed. For in-flight changes, use AMENDMENT.

**Example:**
```
2026-03-01T09:00:00Z | CHANGE_REQUEST | CR-001 | status:PROPOSED | robot:roma | type:TERMINOLOGY_CHANGE | title:"Rename Company to Organisation" | requestedBy:sponsor
2026-03-01T11:00:00Z | CHANGE_REQUEST | CR-001 | status:ANALYZED | robot:roma | breaking:true | requirementsAffected:3 | codeFilesAffected:12
2026-03-01T13:00:00Z | CHANGE_REQUEST | CR-001 | status:APPROVED | robot:sarah | approvedBy:sarah
2026-03-02T17:00:00Z | CHANGE_REQUEST | CR-001 | status:COMPLETED | robot:roma | traceabilityVerified:true
```

**State Transition:**
- CR created: `status:PROPOSED`
- Impact analysis done: `status:ANALYZED` with counts
- Sarah approves: `status:APPROVED` with `approvedBy`
- Implementation starts: `status:IN_PROGRESS`
- Implementation verified: `status:COMPLETED` with `traceabilityVerified:true`
- If rejected: `status:REJECTED`
- If reversed: `status:ROLLED_BACK`

**Document:** `ARTIFACTS/changes/CR-###.yaml` — full CR schema defined in the Change Request Protocol.

---

## State Index File Format

### File Location

**⚠️ DEPRECATED:** State file eliminated in favor of direct log parsing.

**Path:** `ARTIFACTS/activity-state.yaml` _(no longer created)_

**Rationale for Elimination:**
- Eliminated guaranteed sync issues between log and state
- Simplified architecture (single source of truth)
- Queries parse log directly for always-current data
- No manual rebuild operations needed

### File Structure

```yaml
# ROME Activity State Index
# Auto-generated from activity-log.txt
# Last updated: [ISO-8601-timestamp]
# DO NOT EDIT MANUALLY - use rebuild_activity_state()

metadata:
  project: [project_name]
  generated: [ISO-8601-timestamp]
  event_count: [number]
  last_event: [ISO-8601-timestamp]

phases:
  [PHASE-ID]:
    status: [status]
    robot: [robot]
    phase: [number]
    description: [string]
    start: [timestamp]
    end: [timestamp]

features:
  [FEAT-ID]:
    title: [string]
    epic: [EPIC-ID]
    status: [status]
    robot: [robot]
    phase: [number]
    priority: [priority]
    created: [timestamp]
    last_update: [timestamp]

stories:
  [STORY-ID]:
    title: [string]
    feature: [FEAT-ID]
    status: [status]
    robot: [robot]
    estimate: [string]
    started: [timestamp]
    completed: [timestamp]
    blocker: [BLOCK-ID]

blockers:
  [BLOCK-ID]:
    title: [string]
    severity: [severity]
    feature: [FEAT-ID]
    story: [STORY-ID]
    status: [status]
    robot: [robot]
    created: [timestamp]
    resolved: [timestamp]
    resolution: [string]

amendments:
  [AMD-ID]:
    title: [string]
    targetPhase: [number]
    severity: [severity]
    feature: [FEAT-ID]
    status: [status]
    requestedBy: [robot]
    approvedBy: [robot]

# Query indexes
by_robot:
  [robot]: [[entry-IDs]]

by_status:
  [status]: [[entry-IDs]]

by_phase:
  [phase]: [[entry-IDs]]

statistics:
  total_features: [number]
  total_stories: [number]
  completed_stories: [number]
  open_blockers: [number]
  resolved_blockers: [number]
```

### Generation Rules (In-Memory)

**State Reconstruction Algorithm:**

When queries execute, state is built in-memory from log:

1. Read all events from activity-log.txt
2. For each entry ID, track all events chronologically
3. Latest event for each ID determines current state
4. Build query indexes from current state
5. Calculate statistics
6. Return results (no file written)

**Example:**
```
# Events in log
2025-12-03T10:00:00Z | STORY | STORY-001 | status:PENDING | robot:talib
2025-12-03T11:00:00Z | STORY | STORY-001 | status:IN_PROGRESS | robot:ashok
2025-12-03T12:00:00Z | STORY | STORY-001 | status:COMPLETED | robot:ashok

# State built in-memory (latest wins)
stories:
  STORY-001:
    status: COMPLETED  # From latest event
    robot: ashok       # From latest event
```

**Performance:** State reconstruction is fast (~10ms for typical logs). For logs >10,000 events, consider archival strategies.

---

## Parsing Rules

### Event Parser Requirements

**Parsers MUST:**
1. Skip comment lines (starting with `#`)
2. Skip blank lines
3. Split on ` | ` (space-pipe-space)
4. Parse timestamp as ISO 8601 UTC
5. Parse type as enum
6. Parse ID as string
7. Parse attributes as key:value pairs
8. Handle quoted attribute values (strings with spaces)
9. Validate timestamp format
10. Validate type enum
11. Validate ID pattern

**Parsers MAY:**
- Ignore unknown attribute keys (forward compatibility)
- Warn on malformed lines instead of failing
- Skip corrupted lines (continue parsing)

**Error Handling:**
- Malformed timestamp: Skip line, log warning
- Invalid type: Skip line, log warning
- Missing ID: Skip line, log warning
- Malformed attributes: Skip attribute, continue
- Duplicate IDs in same timestamp: Use last one

---

## Validation Rules

### Event Line Validation

**Valid Event Line:**
```
2025-12-03T10:00:00Z | STORY | STORY-001-001-1-database | status:IN_PROGRESS | robot:ashok
```

**Validation Checks:**
1. ✅ Timestamp is valid ISO 8601
2. ✅ Type is valid enum value
3. ✅ ID matches pattern for type
4. ✅ Attributes are well-formed key:value pairs
5. ✅ Required attributes present (`status`, `robot`)
6. ✅ Attribute values match expected types

**Invalid Event Line (Examples):**
```
# Missing timestamp
| STORY | STORY-001 | status:IN_PROGRESS

# Invalid type
2025-12-03T10:00:00Z | TASK | TASK-001 | status:IN_PROGRESS

# Missing ID
2025-12-03T10:00:00Z | STORY | | status:IN_PROGRESS

# Missing required attribute (status)
2025-12-03T10:00:00Z | STORY | STORY-001 | robot:ashok

# Malformed attribute (space after colon)
2025-12-03T10:00:00Z | STORY | STORY-001 | status: IN_PROGRESS
```

---

## File Corruption Handling

### Detecting Corruption

**Indicators:**
- Parser fails on specific line
- Unexpected characters in fields
- Missing delimiters
- Encoding errors

### Recovery Procedure

1. **Identify corrupted line(s)** via parser error
2. **DO NOT delete** - preserve for forensics
3. **Comment corrupted line** with `#CORRUPTED:` prefix
4. **Append corrected event** if needed
5. **Query again** (parser automatically skips commented lines)
6. **Report to Roma** for manual review

**Example:**
```
# Original corrupted line
2025-12-03T10:00:00Z | STORY | STORY-001 | stat�s:IN_PROGRESS

# After recovery
#CORRUPTED: 2025-12-03T10:00:00Z | STORY | STORY-001 | stat�s:IN_PROGRESS
2025-12-03T10:01:00Z | STORY | STORY-001 | status:IN_PROGRESS | robot:ashok
```

**Note:** No rebuild needed - next query automatically parses corrected log.

---

## Extensibility

### Adding New Entry Types

**Procedure:**
1. Update this document with new TYPE enum value
2. Define ID pattern for new type
3. Define required attributes
4. Define state transitions
5. Update parser to recognize new type
6. Update state builder to handle new type
7. Update ROME-PROC-005 with logging procedures

### Adding New Attributes

**Procedure:**
1. Update this document with attribute definition
2. Define data type and encoding
3. Specify which entry types support attribute
4. Update examples
5. Parsers automatically handle new attributes (forward compatible)

**Example:**
```
# Add new attribute: assignedTo
2025-12-03T10:00:00Z | STORY | STORY-001 | status:PENDING | robot:talib | assignedTo:ashok
```

**Rules:**
- New attributes are OPTIONAL (parsers ignore unknown keys)
- Do NOT change existing attribute semantics
- Do NOT remove attributes (deprecated attributes may be ignored)

---

## Examples

### Complete Feature Workflow

```
# Feature created
2025-12-02T14:00:00Z | FEATURE | FEAT-001 | status:IN_PROGRESS | robot:talib | epic:EPIC-001 | phase:2 | title:"User Authentication" | priority:HIGH

# Stories created
2025-12-02T14:05:00Z | STORY | STORY-001-001-1-database | status:PENDING | robot:talib | feature:FEAT-001 | title:"User table" | estimate:2h
2025-12-02T14:06:00Z | STORY | STORY-001-001-1-api | status:PENDING | robot:talib | feature:FEAT-001 | title:"Login endpoint" | estimate:3h
2025-12-02T14:07:00Z | STORY | STORY-001-001-1-ui-app | status:PENDING | robot:talib | feature:FEAT-001 | title:"Login screen" | estimate:4h

# Ashok starts database story
2025-12-03T10:00:00Z | STORY | STORY-001-001-1-database | status:IN_PROGRESS | robot:ashok | started:2025-12-03T10:00:00Z

# Ashok completes database story
2025-12-03T12:00:00Z | STORY | STORY-001-001-1-database | status:COMPLETED | robot:ashok | completed:2025-12-03T12:00:00Z

# Reena starts API story
2025-12-03T13:00:00Z | STORY | STORY-001-001-1-api | status:IN_PROGRESS | robot:reena | started:2025-12-03T13:00:00Z

# Reena encounters blocker
2025-12-03T14:00:00Z | BLOCKER | BLOCK-001 | status:OPEN | severity:MEDIUM | feature:FEAT-001 | story:STORY-001-001-1-api | robot:reena | title:"API design unclear on error codes" | created:2025-12-03T14:00:00Z
2025-12-03T14:01:00Z | STORY | STORY-001-001-1-api | status:BLOCKED | robot:reena | blocker:BLOCK-001

# Roma resolves blocker
2025-12-03T15:00:00Z | BLOCKER | BLOCK-001 | status:RESOLVED | robot:roma | resolution:"PMA clarified: use standard HTTP codes" | resolved:2025-12-03T15:00:00Z

# Reena resumes API story
2025-12-03T15:05:00Z | STORY | STORY-001-001-1-api | status:IN_PROGRESS | robot:reena | blocker:null

# Reena completes API story
2025-12-03T17:00:00Z | STORY | STORY-001-001-1-api | status:COMPLETED | robot:reena | completed:2025-12-03T17:00:00Z

# Charlie completes UI story
2025-12-03T20:00:00Z | STORY | STORY-001-001-1-ui-app | status:IN_PROGRESS | robot:charlie | started:2025-12-03T16:00:00Z
2025-12-03T21:00:00Z | STORY | STORY-001-001-1-ui-app | status:COMPLETED | robot:charlie | completed:2025-12-03T21:00:00Z

# Feature completed
2025-12-03T21:05:00Z | FEATURE | FEAT-001 | status:COMPLETED | robot:talib
```

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 1.0 | 2025-12-18T00:00:00Z | Initial format specification for ROME-PROP-007 |
| 2.0 | 2026-01-09T00:00:00Z | Eliminated state file - queries now parse log directly (Solution C) |
| 2.1 | 2026-02-27T00:00:00Z | Added CHANGE_REQUEST type (CR-###) per ROME-PROP-026 G2. Clarified AMENDMENT scope (intra-cycle only). Added CR status values and type-specific attributes. |
