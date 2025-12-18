# API Design Template
# Document UID: (Assigned by project)
# Version: 1.0
# Date: (ISO 8601)
# Status: Draft
# Reference: ROME-PHASE-004 Section: API Design Schema

---

## Authentication Endpoints

### POST /auth/login

Pattern: REST authentication
Input: User credentials (email, password) - see User entity in data-dictionary.yaml
Output: Session token, User entity (id, email, username)
Errors: 400 (validation failure), 401 (invalid credentials), 423 (account locked)
Auth: None (public endpoint)

### POST /auth/logout

Pattern: REST session termination
Input: Session token (header)
Output: Success confirmation
Errors: 401 (invalid/expired token)
Auth: Required (valid session token)

### POST /auth/refresh

Pattern: REST token refresh
Input: Refresh token
Output: New session token
Errors: 401 (invalid refresh token), 403 (refresh token expired)
Auth: Required (valid refresh token)

---

## User Management Endpoints

### GET /users/:id

Pattern: REST resource retrieval
Input: User ID (path parameter)
Output: User entity - see data-dictionary.yaml
Errors: 401 (unauthorized), 403 (forbidden), 404 (user not found)
Auth: Required (authenticated user, can only retrieve own profile unless admin)

### PUT /users/:id

Pattern: REST resource update
Input: User ID (path), User entity fields (email, username, profile_image_url)
Output: Updated User entity
Errors: 400 (validation failure), 401 (unauthorized), 403 (forbidden), 404 (not found), 409 (duplicate email/username)
Auth: Required (authenticated user, can only update own profile unless admin)

### DELETE /users/:id

Pattern: REST resource deletion (soft delete)
Input: User ID (path)
Output: Success confirmation
Errors: 401 (unauthorized), 403 (forbidden), 404 (not found)
Auth: Required (authenticated user, can only delete own account unless admin)

---

## [Resource] Endpoints

### [METHOD] /api/[resource]

Pattern: [Pattern reference, e.g., "REST CRUD", "Parse Cloud Function", "GraphQL Query"]
Input: [Entity/fields from data-dictionary.yaml]
Output: [Entity/fields from data-dictionary.yaml]
Errors: [HTTP codes with brief descriptions]
Auth: [Authentication requirement]

---

# Format Guidelines

## Pattern References
Use established pattern names:
- REST CRUD: Standard Create/Read/Update/Delete operations
- REST authentication: Login/logout/token patterns
- Parse Cloud Function: Parse Server cloud code function
- Parse Query: Parse Server query API
- GraphQL Query/Mutation: GraphQL operations
- RPC: Remote procedure call pattern

## Entity References
Point to data-dictionary.yaml for data types:
- "User entity" = all fields defined in data-dictionary.yaml User entry
- List specific fields only when partial entity used

## Error Codes
Standard HTTP status codes with brief descriptions:
- 400: Validation failure
- 401: Unauthorized (missing/invalid token)
- 403: Forbidden (insufficient permissions)
- 404: Resource not found
- 409: Conflict (duplicate resource)
- 422: Unprocessable entity (business rule violation)
- 500: Internal server error

## When to Include Payload Examples
Only include full JSON examples when:
- Complex nested structures require clarification
- Non-standard data formats used
- Ambiguity exists in data dictionary mapping

Otherwise, entity references are sufficient.

## What to Exclude
- Full JSON payload examples (unless ambiguous)
- Verbose descriptions of standard patterns
- Implementation details (Charlie handles in P05)
- Database query specifications (Reena handles in P05)
