# Code Traceability Templates

**ROME-PROP-016 Implementation**
**Version:** 2.0 (Feature-Level Approach)
**Date:** 2025-12-26

---

## Overview

This directory contains templates for implementing feature-level code traceability via folder structure and TRACEABILITY.md files.

**Key Principle:** Organize code by **business features**, not technical layers.

---

## Why Feature-Level Traceability?

| Aspect | Function-Level | Feature-Level (This Approach) |
|--------|---------------|-------------------------------|
| **Annotations to maintain** | 1,000+ | 50-100 |
| **Resource overhead** | +25% generation time | +5% generation time |
| **Reliability after 2 years** | 50% accuracy | 90% accuracy |
| **Maintenance effort** | High (scattered) | Low (centralized) |
| **Best for** | Safety-critical | Business applications |

**Result:** Feature-level is more practical, maintainable, and reliable for ROME's typical use cases.

---

## Feature Folder Structure

### Standard Structure (Flutter/Dart Example)

```
lib/
└── features/
    ├── organisation_management/          # Feature module
    │   ├── TRACEABILITY.md              # ✓ Required
    │   ├── models/
    │   │   ├── organisation.dart
    │   │   └── create_organisation_request.dart
    │   ├── services/
    │   │   └── organisation_service.dart
    │   ├── repositories/
    │   │   └── organisation_repository.dart
    │   ├── widgets/
    │   │   ├── organisation_picker.dart
    │   │   └── organisation_form.dart
    │   └── tests/
    │       ├── organisation_service_test.dart
    │       └── organisation_form_test.dart
    │
    ├── task_management/
    │   ├── TRACEABILITY.md              # ✓ Required
    │   ├── models/
    │   ├── services/
    │   ├── widgets/
    │   └── tests/
    │
    └── user_authentication/
        ├── TRACEABILITY.md              # ✓ Required
        ├── models/
        ├── services/
        ├── widgets/
        └── tests/
```

**Key Rules:**
1. **One feature = One folder** under `lib/features/`
2. **One TRACEABILITY.md per feature** (required)
3. **Folder name = Business feature name** (not technical name)
4. **Standard subfolders:** models, services, repositories, widgets, tests

---

## TypeScript/Node.js Structure

```
src/
└── features/
    ├── organisation-management/
    │   ├── TRACEABILITY.md
    │   ├── models/
    │   │   └── organisation.model.ts
    │   ├── services/
    │   │   └── organisation.service.ts
    │   ├── repositories/
    │   │   └── organisation.repository.ts
    │   ├── controllers/
    │   │   └── organisation.controller.ts
    │   └── tests/
    │       └── organisation.test.ts
    │
    └── task-management/
        ├── TRACEABILITY.md
        ├── models/
        ├── services/
        └── tests/
```

---

## Python/Django Structure

```
app/
└── features/
    ├── organisation_management/
    │   ├── TRACEABILITY.md
    │   ├── models.py
    │   ├── services.py
    │   ├── views.py
    │   ├── serializers.py
    │   └── tests.py
    │
    └── task_management/
        ├── TRACEABILITY.md
        ├── models.py
        ├── services.py
        └── tests.py
```

---

## Creating a New Feature

### Step 1: Identify Feature from P3 Design

From P3 design document, identify:
- **Feature ID:** FUNC-008
- **Feature Name:** Organisation Management
- **Requirements:** REQ-003, REQ-012
- **Use Cases:** UC-012, UC-013, UC-014

### Step 2: Create Feature Folder

```bash
# Flutter/Dart
mkdir -p lib/features/organisation_management/{models,services,repositories,widgets,tests}

# TypeScript
mkdir -p src/features/organisation-management/{models,services,repositories,controllers,tests}

# Python
mkdir -p app/features/organisation_management
```

### Step 3: Copy TRACEABILITY.md Template

```bash
cp ROME/templates/code-traceability/TRACEABILITY-TEMPLATE.md \
   lib/features/organisation_management/TRACEABILITY.md
```

### Step 4: Fill in TRACEABILITY.md

```markdown
# Organisation Management

## Requirements Traceability
- **REQ-003**: manage_organisation_profile
- **REQ-012**: create_organisation_profile
- **Feature**: FUNC-008 (Organisation Management)
- **Use Cases**: UC-012 (Select Organisation), UC-013 (Create Organisation)

## Module Structure

### Models (`models/`)
- `organisation.dart` - Organisation domain model (REQ-003, REQ-012)
  - Fields: id, name, adminId, createdAt, updatedAt
  - Implements REQ-012.Outcomes[0] - organisation with unique ID
  - Enforces REQ-012.Invariants[0] - unique organisation name

### Services (`services/`)
- `organisation_service.dart` - Business logic (REQ-003, REQ-012)
  - `createOrganisation()` - Implements REQ-012
    - Validates Preconditions[0]: User authentication
    - Validates Invariants[0]: Unique name check
    - Ensures Postconditions[0]: Record created in database
    - Handles Errors: unauthorized, duplicate_name, invalid_input

### Widgets (`widgets/`)
- `organisation_form.dart` - Creation UI (UC-013)
  - Implements UC-013.Step[2]: User enters organisation name
  - Implements UC-013.Step[3]: User submits form
  - Traces to REQ-012

## Implementation Status
- ✓ **REQ-003**: Fully implemented
- ✓ **REQ-012**: Fully implemented

## Test Coverage
- REQ-003: 100% (all CRUD operations tested)
- REQ-012: 100% (preconditions, invariants, outcomes, errors validated)

## Change History
- Initial implementation: 2025-12-26
```

### Step 5: Generate Code

Generate feature code organized within the folder structure:

**Models:**
```dart
// lib/features/organisation_management/models/organisation.dart
class Organisation {
  final String id;
  final String name;
  final String adminId;
  final DateTime createdAt;
  final DateTime updatedAt;
}
```

**Services:**
```dart
// lib/features/organisation_management/services/organisation_service.dart
class OrganisationService {
  Future<Organisation> createOrganisation(String name, String userId) async {
    // Implements REQ-012
    // Validates Preconditions, Invariants
    // Ensures Postconditions
  }
}
```

**Widgets:**
```dart
// lib/features/organisation_management/widgets/organisation_form.dart
class OrganisationForm extends StatefulWidget {
  // Implements UC-013
}
```

**Tests:**
```dart
// lib/features/organisation_management/tests/organisation_service_test.dart
void main() {
  group('createOrganisation', () {
    test('REQ-012: Preconditions[0] - rejects unauthenticated', () {
      // Test REQ-012.Preconditions[0]
    });

    test('REQ-012: Invariants[0] - rejects duplicate name', () {
      // Test REQ-012.Invariants[0]
    });

    test('REQ-012: Outcomes[0] - returns organisation with ID', () {
      // Test REQ-012.Outcomes[0]
    });
  });
}
```

---

## Traceability Queries

### Forward Tracing (REQ → Code)

**Question:** "Which code implements REQ-012?"

**Answer:**
```bash
# Search TRACEABILITY.md files for REQ-012
grep -r "REQ-012" lib/features/*/TRACEABILITY.md

# Result:
# lib/features/organisation_management/TRACEABILITY.md:- **REQ-012**: create_organisation_profile
```

**Found:** `lib/features/organisation_management/` contains REQ-012 implementation

**Files implementing REQ-012:**
- `models/organisation.dart`
- `services/organisation_service.dart`
- `widgets/organisation_form.dart`
- `tests/organisation_service_test.dart`

### Backward Tracing (Code → REQ)

**Question:** "Which requirement does `organisation_service.dart` implement?"

**Answer:**
```bash
# Read TRACEABILITY.md in the feature folder
cat lib/features/organisation_management/TRACEABILITY.md

# Result: REQ-003, REQ-012
```

### Change Impact Analysis

**Question:** "If REQ-012 changes, what code needs updating?"

**Steps:**
1. Find feature: `grep -r "REQ-012" lib/features/*/TRACEABILITY.md`
2. Result: `lib/features/organisation_management/`
3. Read TRACEABILITY.md for affected files
4. Update:
   - `models/organisation.dart` (domain model)
   - `services/organisation_service.dart` (business logic)
   - `widgets/organisation_form.dart` (UI)
   - `tests/organisation_service_test.dart` (tests)
   - `TRACEABILITY.md` (update change history)

---

## Integration with Change Management (ROME-PROP-015)

When a requirement changes via Change Request (CR), update TRACEABILITY.md:

### Before CR-001

```markdown
# Organisation Management

## Requirements Traceability
- **REQ-003**: manage_company_profile
- **REQ-012**: create_company_profile
```

### After CR-001 (Terminology Change: Company → Organisation)

```markdown
# Organisation Management

## Requirements Traceability
- **REQ-003**: manage_organisation_profile
- **REQ-012**: create_organisation_profile

## Change History
- **CR-001** (2025-12-26): Renamed from `company_management` to `organisation_management`
  - Affected: All files in this module
  - Breaking: Yes (API v2 required)
  - Migration: See migrations/002_rename_company_to_organisation.sql
```

---

## Robot Responsibilities

### Charlie (P5 - UI Layer)
**Flutter/Dart code generation**

1. Create feature folder structure
2. Generate models, services, widgets
3. Create TRACEABILITY.md from template
4. Fill in Requirements Traceability section
5. Document module structure
6. Mark implementation status
7. Update TRACEABILITY.md when changes occur

### Ashok (P5 - Data Layer)
**Database and repositories**

1. Generate repository classes within feature folders
2. Document repository in TRACEABILITY.md
3. Link to database schema and requirements
4. Create migration scripts
5. Update TRACEABILITY.md for schema changes

### Reena (P5 - API Layer)
**API controllers and services**

1. Generate API controllers within feature folders (if backend)
2. Document API endpoints in TRACEABILITY.md
3. Link to use cases and requirements
4. Handle API versioning for breaking changes
5. Update TRACEABILITY.md for API changes

### Clara (P5 - Design System)
**Shared components**

1. For shared design system components, create `design_system/` feature
2. Document which components are used by which features
3. Update TRACEABILITY.md when design tokens change

---

## Validation

### Manual Validation

**Check traceability is intact:**
```bash
# 1. Every feature has TRACEABILITY.md
find lib/features -type d -mindepth 1 -maxdepth 1 | while read feature; do
  if [ ! -f "$feature/TRACEABILITY.md" ]; then
    echo "❌ Missing: $feature/TRACEABILITY.md"
  else
    echo "✓ Found: $feature/TRACEABILITY.md"
  fi
done

# 2. Every requirement is implemented
# Extract all REQs from requirements, check if they appear in TRACEABILITY.md files
```

### Automated Validation (Future: `/validate-traceability` skill)

```bash
# Usage (by Sarah)
/validate-traceability --project my-app

# Checks:
# - All features have TRACEABILITY.md
# - All requirements from P1 are covered
# - All use cases from P3 are implemented
# - No orphaned code (code not linked to any requirement)
# - Folder structure follows standard
```

---

## Benefits

### 1. Practical Resource Overhead
**+5% generation time** (vs +25% for function-level)
- Only need to create ~50-100 TRACEABILITY.md files
- Folder structure implied by feature organization
- No per-function annotations needed

### 2. High Long-Term Reliability
**90% accuracy after 2 years** (vs 50% for function-level)
- Folder structure changes rarely
- Centralized maintenance (one file per feature)
- Refactoring tools don't corrupt folder names
- Change Request process naturally updates TRACEABILITY.md

### 3. Low Maintenance Burden
**50-100 files to maintain** (vs 1,000+ for function-level)
- One TRACEABILITY.md per feature
- Centralized in one location
- Easy to find and update

### 4. Automated Queries Supported
- **Forward tracing:** REQ → Feature folder → Code files
- **Backward tracing:** Code file → Feature folder → TRACEABILITY.md → REQ
- **Change impact:** REQ changed → Find in TRACEABILITY.md → Affected files listed

### 5. Language-Agnostic
Works for:
- Flutter/Dart (Charlie)
- TypeScript/React (if used)
- Python/Django
- Java/Spring
- Any language with folder support

---

## Limitations

### 1. Granularity Trade-off
**Feature-level, not function-level:**
- Cannot trace individual functions to requirements
- Entire feature folder maps to requirements
- Acceptable for business applications
- Not suitable for safety-critical systems requiring function-level proof

**Workaround:** For safety-critical, use hybrid approach (feature-level + selective function-level annotations)

### 2. Manual Maintenance Required
**TRACEABILITY.md not auto-generated:**
- Robots must manually update after code changes
- Relies on robot discipline (mitigated by PROP-014 hooks)
- Can drift if robots forget to update
- Estimated drift: 10% after 2 years (acceptable)

**Mitigation:** Hooks remind robots to update TRACEABILITY.md

### 3. No Enforcement Without Tools
**No automated validation yet:**
- `/validate-traceability` skill not implemented
- Sarah cannot automatically verify traceability
- Manual verification required

**Future:** Implement `/validate-traceability` skill for automated checks

---

## Best Practices

### 1. One Feature = One Business Capability
✅ Good: `organisation_management`, `task_management`, `user_authentication`
❌ Bad: `models`, `services`, `utils` (technical layers)

### 2. Feature Naming Conventions
- Use snake_case for Flutter/Dart, Python
- Use kebab-case for TypeScript/JavaScript
- Use descriptive business names (not technical jargon)

### 3. Keep Features Focused
- One feature should cover 2-5 requirements
- If feature has 10+ requirements, consider splitting

### 4. Update TRACEABILITY.md Immediately
- When implementing: Document as you code
- When changing: Update Change History section
- When refactoring: Verify traceability intact

### 5. Link Tests to Requirements
- Test file names match source file names
- Tests explicitly reference requirement IDs in test descriptions
- Example: `test('REQ-012: Preconditions[0] - rejects unauthenticated')`

---

## Migration from Existing Codebases

### If code organized by technical layers:

**Before:**
```
lib/
├── models/
│   ├── organisation.dart
│   └── task.dart
├── services/
│   ├── organisation_service.dart
│   └── task_service.dart
└── widgets/
    ├── org_picker.dart
    └── task_list.dart
```

**After:**
```
lib/features/
├── organisation_management/
│   ├── TRACEABILITY.md
│   ├── models/organisation.dart
│   ├── services/organisation_service.dart
│   └── widgets/org_picker.dart
└── task_management/
    ├── TRACEABILITY.md
    ├── models/task.dart
    ├── services/task_service.dart
    └── widgets/task_list.dart
```

**Migration steps:**
1. Identify business features from requirements
2. Create feature folders
3. Move related files into feature folders
4. Create TRACEABILITY.md for each feature
5. Update imports across codebase
6. Test thoroughly

---

## Examples

### Complete Example: Organisation Management

See **ROME-PROP-016** for full example including:
- Folder structure
- TRACEABILITY.md content
- Flutter/Dart code samples
- Test coverage approach

---

## See Also

- **ROME-PROP-016:** Full feature-level traceability proposal
- **ROME-PROP-015:** Change management integration
- **ROME-PROP-014:** Hooks for reminding robots to update traceability
- **ROME-PROP-007:** Activity logging integration

---

## Revision History

| Version | Date | Summary |
|---------|------|---------|
| 1.0 | 2025-12-26 | Initial implementation of ROME-PROP-016 v2.0 (feature-level approach) |
