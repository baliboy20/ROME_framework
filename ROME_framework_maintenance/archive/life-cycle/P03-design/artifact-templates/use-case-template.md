# Use Cases Template
# Document UID: (Assigned by project)
# Version: 1.0
# Date: (ISO 8601)
# Status: Draft
# Reference: ROME-PHASE-004 Section: Use Case Schema

---

## UC-001: User Login

Actor: Registered User
Trigger: User navigates to login page

Flow:
1. Display login form (email, password) → User enters credentials
2. User submits form → System validates credentials against User entity
3. Valid credentials → Create Session entity, generate token
4. Redirect to dashboard → User sees authenticated home page

Variants:
- Invalid credentials (step 2): Display error message, remain on form
- Account locked: Display account locked message with support contact
- Network timeout: Display retry prompt with cached credentials

Requirements:
- UI: Form component (email field, password field, submit button), error display area, loading spinner, "Forgot Password" link
- API: POST /auth/login (REST authentication pattern)
- Data: User.read (credential validation), Session.create (token generation)

---

## UC-002: [Use Case Title]

Actor: [User role]
Trigger: [Event or user action that initiates this use case]

Flow:
1. [Action] → [System response]
2. [Action] → [System response]
3. [Action] → [System response]

Variants:
- [Condition]: [Step deviation or alternative path]
- [Error case]: [How system handles error]

Requirements:
- UI: [Component types, key interactions, data bindings]
- API: [Endpoint pattern reference, e.g., "REST CRUD", "Parse Cloud Function"]
- Data: [Entity operations: Create/Read/Update/Delete]

---

# Format Guidelines

## Flow Section
- Use Action → Response pairs for clarity
- Preconditions implicit in step 1
- Postconditions implicit in final step
- Keep steps focused on user-visible behavior

## Variants Section
- List deviations from main flow
- Include error cases and edge conditions
- Reference step number where variant occurs
- No need to repeat entire flow

## Requirements Section
- UI: Component types and interactions (detailed layout in Clara deliverables if needed)
- API: Pattern name rather than full payload (data types in data-dictionary.yaml)
- Data: Operations on entities from data-dictionary.yaml

## What to Exclude
- Verbose precondition/postcondition prose
- Full JSON payload examples (unless complex/ambiguous)
- Implementation details (handled in P05)
- Detailed layout specifications (Clara's domain)
