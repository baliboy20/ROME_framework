# rome-p5-generation

ROME Phase 5 Generation Plugin - Parallel code generation for Database, API, and UI layers

## Overview

This plugin provides three specialized agents for parallel code generation in Phase 5 of the ROME Framework:

- **Ashok**: Data Architect & Database Engineer (Database layer)
- **Reena**: Backend Engineer (API layer)
- **Charlie**: Frontend/Application Developer (UI layer)

## Version

1.0.0

## Dependencies

- **rome-core**: ^1.0.0 (required)
- **rome-p4-config**: >=1.0.0 (peer dependency - must be installed separately)

## Agents

### Ashok (Data Layer)

Implements the complete database layer from PMA's data dictionary:

- Database schema creation (DDL)
- Migration scripts (version-controlled)
- ORM models
- Seed data (dev and test)
- Database tests
- Setup scripts

### Reena (API Layer)

Implements the API/service layer:

- RESTful API endpoints
- Business logic / service layer
- Authentication and authorization
- Input validation and error handling
- Middleware (auth, logging, rate limiting)
- API tests (unit + integration)
- API documentation

### Charlie (UI Layer)

Implements the user-facing application:

- Screen/page implementation
- Component development
- API integration
- State management
- Form validation
- Navigation flows
- Accessibility implementation
- UI tests (widget/component + integration)

## Skills

### Database & Data (Ashok)
- generate-database-schema
- generate-migrations
- generate-orm-models
- generate-seed-data

### Backend & API (Reena)
- generate-api-endpoints
- generate-authentication-middleware

### Frontend & UI (Charlie)
- generate-ui-screens
- generate-ui-components

## Parallel Execution

The three agents can work in parallel with coordination:

1. **Ashok** creates database schema first
2. **Reena** builds APIs against Ashok's schema (sequential dependency)
3. **Charlie** builds UI against Reena's APIs (sequential dependency)

Ashok → Reena → Charlie form a dependency chain, but within each layer, work can be parallelized.

## Feature-Based Organization (ROME-PROP-016)

All generated code follows feature-based organization:

```
[workspace]/
└── features/
    ├── [feature_name]/
    │   ├── TRACEABILITY.md         # ✓ REQUIRED
    │   ├── models/
    │   ├── services/ or repositories/
    │   ├── controllers/ or widgets/
    │   └── tests/
```

## Installation

This plugin is part of the ROME Framework v3 architecture and requires rome-core to be installed.

## Usage

Agents are activated by the Roma orchestrator during Phase 5 (Generation) based on the actionlist.md work breakdown.

## License

MIT
