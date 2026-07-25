<!--
ROME-SKILL: test-skill v1.0
ROME-ROBOT: archie
ROME-PHASE: P1-AORDL
ROME-DATE: 2026-01-09T20:46:13.595Z
ROME-DURATION: 1234ms
ROME-PARAMS: test=true
-->

# API Specification

## POST /api/users

Creates a new user account.

### Request Body

```json
{
  "name": "John Doe",
  "email": "john@example.com"
}
```

### Response

```json
{
  "id": "user-123",
  "name": "John Doe",
  "email": "john@example.com"
}
```
