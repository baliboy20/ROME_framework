# Generate Seed Data

**ID**: generate-seed-data
**Category**: Database & Data
**Phase**: P5 (Generation)
**Robot**: Ashok

## Purpose

Generate database seed data scripts for development, testing, and initial production setup

## Inputs

- data-dictionary.yaml (entity definitions)
- use-cases.md (realistic data scenarios)
- acceptance-criteria.md (test data requirements)
- tech-stack.md (seeding approach)

## Outputs

- Seed data scripts (SQL, JSON, or ORM seeders)
- Test fixtures
- Reference data (lookup tables, configuration)

## Process

1. Identify required reference data (roles, statuses, categories)
2. Generate realistic test data matching acceptance criteria
3. Create seed scripts with proper foreign key ordering
4. Include data for all use case scenarios
5. Generate both development and production seed sets

## Example Output

```typescript
// seeds/001-seed-users.ts
import { QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  await queryInterface.bulkInsert('users', [
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'admin@example.com',
      display_name: 'System Admin',
      role: 'admin',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      email: 'user@example.com',
      display_name: 'Test User',
      role: 'user',
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);
}

export async function down(queryInterface: QueryInterface) {
  await queryInterface.bulkDelete('users', null, {});
}
```

## AORDL Traceability

- AORDL Use Cases → Seed data scenarios
- Acceptance Criteria → Test data sets
- AORDL Invariants → Valid seed data constraints
- Reference data requirements → Lookup table seeds
