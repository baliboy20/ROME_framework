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
SOURCE/[workspace]/
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

### Slash Commands

The plugin provides three primary slash commands for parallel generation:

#### /rome-p5:generate-db

Generate complete database layer (schema, migrations, ORM models, seed data)

```bash
# Invoke Ashok to generate database layer
/rome-p5:generate-db
```

**Inputs Required:**
- data-dictionary.yaml (from P3 Design)
- tech-stack.md (database technology choice)

**Outputs:**
- SOURCE/migrations/001_initial_schema.sql
- SOURCE/models/ (ORM entities)
- SOURCE/seeds/ (development and test data)

#### /rome-p5:generate-api

Generate API layer (endpoints, controllers, authentication middleware)

```bash
# Invoke Reena to generate API layer
/rome-p5:generate-api
```

**Inputs Required:**
- api-design.md (from P3 Design)
- data-dictionary.yaml (for validation rules)
- security-requirements.md (for auth)

**Outputs:**
- SOURCE/routes/ (endpoint definitions)
- SOURCE/controllers/ (HTTP handlers)
- SOURCE/middleware/ (authentication, authorization)
- SOURCE/services/ (business logic)

#### /rome-p5:generate-ui

Generate UI layer (screens, components, navigation)

```bash
# Invoke Charlie to generate UI layer
/rome-p5:generate-ui
```

**Inputs Required:**
- ui-design.md (from P3 Design)
- api-design.md (for API integration)
- design-system.md (styling specifications)

**Outputs:**
- SOURCE/screens/ or SOURCE/pages/ (screen implementations)
- SOURCE/components/ (reusable UI components)
- SOURCE/navigation/ (routing configuration)
- SOURCE/state/ (state management)

### Parallel Generation Workflow

The ROME Framework supports parallel code generation with coordinated dependencies:

```yaml
# Phase 5 Generation Workflow

Step 1: Database Layer (Ashok)
  - Command: /rome-p5:generate-db
  - Duration: ~30-60 minutes
  - Blocking: Must complete before API generation

Step 2: API Layer (Reena)
  - Command: /rome-p5:generate-api
  - Duration: ~45-90 minutes
  - Depends on: Database schema complete
  - Blocking: Must complete before UI generation

Step 3: UI Layer (Charlie)
  - Command: /rome-p5:generate-ui
  - Duration: ~60-120 minutes
  - Depends on: API endpoints complete

Step 4: Integration & Testing
  - Run tests for each layer
  - Verify end-to-end integration
  - Quality gate validation
```

### Feature-Based Generation

Each agent generates code organized by feature (ROME-PROP-016):

```
SOURCE/workspace/
└── features/
    ├── user-management/
    │   ├── TRACEABILITY.md          # REQ-001 → User entity → API → Screen
    │   ├── models/
    │   │   └── user.model.ts        # Generated by Ashok
    │   ├── controllers/
    │   │   └── user.controller.ts   # Generated by Reena
    │   ├── screens/
    │   │   └── UserListScreen.tsx   # Generated by Charlie
    │   └── tests/
    │       ├── user.model.test.ts
    │       ├── user.api.test.ts
    │       └── UserListScreen.test.tsx
    │
    └── task-management/
        ├── TRACEABILITY.md          # REQ-002 → Task entity → API → Screen
        └── ...
```

### Agent Coordination

Agents are invoked by Roma (orchestrator) based on actionlist.md:

```markdown
# actionlist.md (Generated by Roma in Phase 5)

## Database Generation (Ashok)
- [ ] Generate User entity schema
- [ ] Generate Task entity schema
- [ ] Generate relationship constraints
- [ ] Generate migrations
- [ ] Generate seed data

## API Generation (Reena)
- [ ] Generate User CRUD endpoints
- [ ] Generate Task CRUD endpoints
- [ ] Generate authentication middleware
- [ ] Generate validation middleware

## UI Generation (Charlie)
- [ ] Generate UserList screen
- [ ] Generate TaskList screen
- [ ] Generate reusable Button component
- [ ] Generate reusable Card component
```

## Quality Assurance

After generation, use rome-qa plugin for validation:

```bash
# Verify generated code quality
/rome-qa:validate

# Execute quality gate for P5
/rome-qa:quality-gate
```

## Integration with Other Plugins

**Dependencies:**
- rome-core: Foundation orchestration and activity logging
- rome-p4-config: Tech stack decisions and configuration

**Consumers:**
- rome-qa: Validates generated code
- User project: Final application artifacts

## License

MIT
