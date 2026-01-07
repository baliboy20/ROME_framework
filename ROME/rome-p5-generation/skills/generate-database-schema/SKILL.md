# Generate Database Schema

**ID**: generate-database-schema
**Category**: Database & Data
**Phase**: P5 (Generation)
**Robot**: Ashok

## Purpose

Generate database schema DDL from data-dictionary.yaml

## Inputs

- data-dictionary.yaml (entities, fields, types, constraints)
- tech-stack.md (database technology)

## Outputs

- SOURCE/migrations/001_initial_schema.sql (or appropriate file for chosen DB)
- Schema with tables, fields, constraints, indexes

## Process

1. Read data-dictionary.yaml
2. Extract entities and map to tables
3. Map field types (database_type field)
4. Generate constraints (NOT NULL, UNIQUE, CHECK, FK)
5. Generate indexes (indexed: true fields)
6. Output DDL file

## Example Output

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
```

## AORDL Traceability

- AORDL Invariants → Database constraints (NOT NULL, UNIQUE, CHECK)
- AORDL Postconditions → Foreign key relationships
- Data dictionary business rules → CHECK constraints
