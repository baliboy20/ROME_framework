# Generate Migrations

**ID**: generate-migrations
**Category**: Database & Data
**Phase**: P5 (Generation)
**Robot**: Ashok

## Purpose

Create version-controlled migration scripts for database schema changes

## Inputs

- data-dictionary.yaml
- Existing migrations (for sequential numbering)

## Outputs

- migrations/[NNN]_[description].sql
- Forward migration (UP)
- Rollback migration (DOWN) if applicable

## Process

1. Determine next migration number
2. Create descriptive migration name
3. Generate forward migration SQL
4. Generate rollback migration SQL (if reversible)
5. Test migrations in sequence

## Example Output

```sql
-- migrations/002_add_organisations_table.sql
CREATE TABLE organisations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- migrations/002_rollback.sql
DROP TABLE organisations;
```
