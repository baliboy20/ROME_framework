# Database API Contract

## Overview
Standardized contract for database access layer APIs in ROME backend implementations.

## Endpoints

### User Management
```
GET /api/v1/users
POST /api/v1/users
GET /api/v1/users/{id}
PUT /api/v1/users/{id}
DELETE /api/v1/users/{id}
```

### Authentication
```
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/refresh
GET /api/v1/auth/profile
```

## Data Schemas
- User: `{ id, username, email, created_at, updated_at }`
- Auth: `{ token, expires_at, refresh_token }`

## Error Handling
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 500: Internal Server Error

## Performance Requirements
- Response time < 200ms for read operations
- Response time < 500ms for write operations
- Support for pagination on list endpoints