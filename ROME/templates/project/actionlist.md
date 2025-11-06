# Project Action List
**Project:** [Project Name]  
**Last Updated:** [Date]  
**Methodology:** ROME 3.0 - Integration-First with Class Annotations

---

## Feature: [Feature Name] | Priority: [HIGH/MEDIUM/LOW]

### Clara (UX Design - FIRST):

- [ ] **UX Design**: Create design artifacts
  - User flows and wireframes
  - Component specifications
  - Design system adherence
  - Accessibility requirements
  - Deliverable: Design files with @ApprovedBy PMA annotation

### Ashok (Database Layer):

- [ ] **Schema**: Create [entity] table with constraints
  - Columns: [list key columns]
  - Constraints: [unique, foreign keys, etc.]
  - Integration Test: CRUD operations, constraints enforced
  - Annotations: `@TestLevel Integration`, `@ComplexityLevel Low`
  - Test File: `test/integration/database/[entity]_schema_test.js`

- [ ] **Clara UX Validation**: Database layer review
  - ✅ All UI fields have corresponding data fields
  - ✅ Field types support UI requirements
  - ✅ Enums match UI states
  - **Status**: PENDING Clara approval

- [ ] **Seed Data**: Add test/demo data
  - Data: [describe seed data]
  - Integration Test: Data loads successfully
  - Annotations: `@TestLevel Integration`, `@ComplexityLevel Low`

### Reena (Backend Layer):

- [ ] **Model**: Implement [Entity] model
  - Methods: create, findAll, findById, update, delete
  - Integration Test: Model persists to DB correctly
  - Annotations: `@TestLevel Integration`, `@ComplexityLevel Low`
  - Test File: `test/integration/models/[entity]_model_test.js`

- [ ] **API Endpoints**: Create REST API
  - Endpoints: POST/GET/PUT/DELETE `/api/[resource]`
  - Validation: [list validation rules]
  - Integration Test: API ↔ DB, validation, error handling
  - Annotations: `@TestLevel Integration`, `@ComplexityLevel Low`
  - Test File: `test/integration/api/[entity]_api_test.js`

- [ ] **Clara UX Validation**: Backend/API layer review
  - ✅ API responses include all UI-displayed fields
  - ✅ Error messages are user-friendly
  - ✅ Sorting/filtering supports UI features
  - **Status**: PENDING Clara approval

### Charlie (Frontend Layer):

- [ ] **Data Layer**: [Entity]RemoteDataSource
  - Methods: fetch, create, update, delete
  - Integration Test: Communication with real API
  - Annotations: `@TestLevel Integration`, `@ComplexityLevel Low`
  - Test File: `test/integration/data/[entity]_datasource_test.dart`

- [ ] **Domain Layer**: Repository + Use Cases
  - Repository: [Entity]RepositoryImpl
  - Use Cases: Create[Entity], Fetch[Entity]s, Update[Entity], Delete[Entity]
  - Integration Test: Domain layer with real API
  - Annotations: `@TestLevel Integration`, `@ComplexityLevel Medium`
  - Test File: `test/integration/domain/[entity]_usecase_test.dart`

- [ ] **Presentation Layer**: UI Screens
  - Screens: [List], [Create/Edit], [Detail]
  - State Management: BLoC/Provider/etc.
  - Integration Test: Complete UI → API → DB workflow
  - Annotations: `@TestLevel Integration`, `@ComplexityLevel Low`
  - Test File: `test/integration/presentation/[entity]_page_test.dart`

- [ ] **Clara UX Validation**: Frontend implementation review
  - ✅ Visual design matches approved mockups
  - ✅ User flows match specifications
  - ✅ Accessibility compliance (WCAG AA)
  - ✅ Responsive design works
  - **Status**: PENDING Clara approval

### Feature Complete When:
- [ ] All layers implemented
- [ ] All integration tests passing
- [ ] All Clara validations passed (✅)
- [ ] All classes properly annotated

### API Interface Definition:

```
POST /api/[resource]
  Request: { field1: type, field2: type, ... }
  Response: { success: boolean, data: EntityType | null, error?: ErrorType }

GET /api/[resource]
  Response: { success: boolean, data: EntityType[] }

GET /api/[resource]/:id
  Response: { success: boolean, data: EntityType | null, error?: ErrorType }

PUT /api/[resource]/:id
  Request: { field1: type, field2: type, ... }
  Response: { success: boolean, data: EntityType | null, error?: ErrorType }

DELETE /api/[resource]/:id
  Response: { success: boolean, data: null, error?: ErrorType }
```

### Error Response Format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

### Dependencies:

- Depends on: [List any feature dependencies]
- Provides to: [List features that depend on this]

### Status: PENDING

---

## Feature: [Another Feature] | Priority: [LEVEL]

[Repeat structure above for each feature]

---

## Complex Logic Unit Tests (End of Project)

**Add unit tests for:**

- [ ] State machine logic in [module]
  - @ComplexityLevel High
  - Test File: `test/unit/[module]_state_test.js`

- [ ] Algorithm for [calculation]
  - @ComplexityLevel High
  - Test File: `test/unit/[module]_algorithm_test.js`

- [ ] Complex validation in [entity]
  - @ComplexityLevel Medium
  - Test File: `test/unit/[entity]_validation_test.js`

---

## Integration Test Summary

| Feature | Database Tests | Backend Tests | Frontend Tests | Status |
|---------|----------------|---------------|----------------|--------|
| [Feature 1] | ⏳ Pending | ⏳ Pending | ⏳ Pending | Not Started |
| [Feature 2] | ⏳ Pending | ⏳ Pending | ⏳ Pending | Not Started |

**Legend:**
- ⏳ Pending - Not started
- 🔄 In Progress - Being implemented
- ✅ Complete - Tests passing
- ❌ Failing - Tests exist but failing

---

## Notes

- All classes must have annotations: @Created, @Modified, @TestLevel, @Stable, @ComplexityLevel
- Integration tests required at each layer before moving to next layer
- Unit tests only for @ComplexityLevel High logic at project end
- Get PMA approval before modifying @Stable true classes
