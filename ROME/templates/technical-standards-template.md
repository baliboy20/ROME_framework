# Layer-Specific Technical Standards Template

**Purpose:** Define explicit mandated and forbidden technologies/patterns for each development layer.

**Instructions:** PMA should complete this template and add to `PROJECT/dev/technical-decisions.md`

---

## Database Layer (Ashok)

### Mandated Technologies/Patterns
- [Database system]: PostgreSQL 15+ / MySQL 8+ / MongoDB 6+ / etc.
- [Migration tool]: [Specify migration tool/approach]
- [Naming conventions]: [Table naming, column naming]
- [Required patterns]: [e.g., soft deletes, timestamps, etc.]

### Forbidden Anti-Patterns
- [Anti-pattern 1]: [Reason why forbidden]
- [Anti-pattern 2]: [Reason why forbidden]
- [Common mistake to avoid]: [Explanation]

### Expert References
- [Link to expert doc or MCP server if available]
- [If no formal docs, document sponsor's verbal guidance here]
- Example: `/Experts/expert_postgresql/best-practices.md`
- Example: `mcp://expert_database/migration-patterns`

### Coding Standards
- Table names: [snake_case, plural, etc.]
- Column names: [convention]
- Foreign keys: [{table}_id format]
- Timestamps: [created_at, updated_at, etc.]
- Indexes: [naming convention]

---

## Backend Layer (Reena)

### Mandated Technologies/Patterns
- [Framework]: Node.js/Express, Dart/Shelf, Python/FastAPI, Go/Gin, etc.
- [Architecture pattern]: Repository pattern, Service layer, etc.
- [Error handling]: Exceptions, Result types, etc.
- [HTTP client]: [For external APIs if needed]
- [Validation]: [Library or approach]

### Forbidden Anti-Patterns
- [Anti-pattern 1]: [Reason - e.g., "Dartz/Either - incompatible with exception-based architecture"]
- [Anti-pattern 2]: [Reason]
- [Direct database access]: [If repository pattern mandated]

### Expert References
- [Link to backend architecture expert docs]
- Example: `/Experts/expert_dart_backend/architecture.md`
- Example: `mcp://expert_api_design/rest-principles`

### Coding Standards
- Endpoint naming: [/api/v1/{resource} format]
- Error responses: [HTTP status codes + JSON error body]
- Repository naming: [{Entity}Repository]
- Service naming: [{Feature}Service]
- File organization: [Feature-first, layer-first, etc.]

---

## Frontend Layer (Charlie)

### Mandated Technologies/Patterns
- [Framework]: Flutter, React, Vue, Angular, etc.
- [State management]: Bloc, Redux, Zustand, Pinia, etc.
- [HTTP client]: Dio, Axios, Fetch, etc.
- [Architecture]: Repository pattern, BLoC pattern, etc.
- [Error handling]: try/catch, error boundaries, etc.

### Forbidden Anti-Patterns
- [Anti-pattern 1]: [Reason - e.g., "Riverpod - incompatible with Bloc architecture"]
- [Anti-pattern 2]: [Reason - e.g., "GetX - anti-pattern for maintainability"]
- [Direct API calls]: [If repository pattern mandated]
- [setState for business logic]: [If state management library mandated]

### Expert References
- [Link to frontend expert docs]
- Example: `/Experts/expert_flutter/bloc-architecture.md`
- Example: `/Experts/expert_flutter/anti-patterns.md`
- Example: `mcp://expert_flutter/state-management`

### Coding Standards
- Component/Widget naming: [{Feature}{Type} format]
- State management naming: [{Feature}Bloc, {Feature}Event, {Feature}State]
- Repository naming: [{Entity}Repository]
- File organization: [Feature-first, component-type-first, etc.]
- Folder structure: [Specify structure]

---

## Notes for PMA

**When filling this template:**

1. **Ask sponsor for expert guidance:**
   ```
   "Which expert guidance should I follow for [database/backend/frontend]?
    Do you have organizational standards or preferred patterns?"
   ```

2. **If sponsor has expert docs:**
   - Reference them in "Expert References" section
   - Ensure docs exist and are accessible

3. **If sponsor has no formal docs:**
   - Document verbal guidance in "Expert References"
   - Be specific about rationale

4. **For each forbidden item:**
   - Explain WHY it's forbidden
   - Prevents confusion later
   - Helps developers understand trade-offs

5. **Keep standards actionable:**
   - Specific enough to be enforceable
   - Not so detailed as to be overwhelming
   - Focus on architecture, not formatting (use linters for that)

---

## Validation by Sarah (Phase 2B)

Sarah will check:
- [ ] All three layers have standards documented
- [ ] Mandated technologies are specified
- [ ] Forbidden patterns include rationale
- [ ] Expert references exist or sponsor guidance documented
- [ ] Coding standards are clear and actionable

**If incomplete:** Sarah will BLOCK Phase 3 and return to PMA.
