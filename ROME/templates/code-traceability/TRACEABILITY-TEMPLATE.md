# [Feature Name]

**ROME-PROP-016: Feature-Level Code Traceability**
**Version:** 1.0
**Created:** [YYYY-MM-DD]

---

## Requirements Traceability

- **REQ-###**: [requirement intent description]
- **REQ-###**: [requirement intent description]
- **Feature**: FUNC-### ([feature name from P2])
- **Use Cases**: UC-### ([use case name]), UC-### ([use case name])

---

## Module Structure

### Models (`models/`)
- `[model_name].dart` - [Purpose and description] ([REQ-###, REQ-###])
  - Fields: [list key fields]
  - Implements: [which requirement outcomes/invariants]
  - Validates: [which requirement preconditions/invariants]

### Services (`services/`)
- `[service_name].dart` - [Business logic description] ([REQ-###, REQ-###])
  - `[methodName]()` - Implements [REQ-###]
    - Validates [Preconditions]
    - Validates [Invariants]
    - Ensures [Postconditions]
    - Handles [Errors]

### Repositories (`repositories/`)
- `[repository_name].dart` - [Data access layer description] ([REQ-###, REQ-###])
  - [Database/API operations description]
  - Enforces [which constraints/invariants]

### Widgets (`widgets/`)
- `[widget_name].dart` - [UI component description] ([UC-###])
  - User Story: [brief user story]
  - Implements: [which use case steps]
  - Handles: [which requirement errors]
  - Traces to: [REQ-###]

### Tests (`tests/`)
- `[test_file_name].dart` - Validates [REQ-###, REQ-###]
  - Tests [Preconditions]: [description]
  - Tests [Invariants]: [description]
  - Tests [Outcomes]: [description]
  - Tests [Postconditions]: [description]
  - Tests [Errors]: [description]

---

## Implementation Status

- ✓ **REQ-###**: [Fully implemented | Partially implemented | Not started] - [Notes]
- ⚠ **REQ-###**: [Fully implemented | Partially implemented | Not started] - [Notes]
- ✗ **REQ-###**: [Fully implemented | Partially implemented | Not started] - [Notes]

**Legend:**
- ✓ = Fully implemented and tested
- ⚠ = Partially implemented or has known issues
- ✗ = Not yet implemented

---

## Test Coverage

- **REQ-###**: [Coverage %] ([Details: which aspects tested])
- **REQ-###**: [Coverage %] ([Details: which aspects tested])
- **Overall Feature Coverage**: [Coverage %]

**Testing Notes:**
- [Any specific testing approach or tools used]
- [Edge cases covered]
- [Known gaps in coverage]

---

## Change History

- **CR-###** ([YYYY-MM-DD]): [Change description]
  - Affected: [Which files or scope]
  - Breaking: [Yes/No]
  - Migration: [Reference to migration script if applicable]

---

## Dependencies

**Internal Dependencies:**
- [Other feature modules this feature depends on]

**External Dependencies:**
- [Third-party packages or services]

---

## Notes

**Implementation Notes:**
- [Any important implementation decisions]
- [Known limitations or constraints]
- [Future enhancements planned]

**Verification:**
- Last verified: [YYYY-MM-DD]
- Verified by: [Robot name]
- Traceability intact: [Yes/No]
