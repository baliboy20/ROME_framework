# Generate ORM Models

**ID**: generate-orm-models
**Category**: Database & Data
**Phase**: P5 (Generation)
**Robot**: Ashok

## Purpose

Generate ORM/Entity models from data-dictionary.yaml for application data access layer

## Inputs

- data-dictionary.yaml (entities, fields, relationships)
- tech-stack.md (ORM framework: Sequelize, TypeORM, Prisma, etc.)
- migrations (database schema)

## Outputs

- Model classes/entities for chosen ORM
- Relationships (hasMany, belongsTo, etc.)
- Validation rules
- Computed properties

## Process

1. Read data-dictionary.yaml
2. Map entities to ORM model classes
3. Define field types per ORM conventions
4. Configure relationships (1:1, 1:N, N:M)
5. Add validation decorators/rules
6. Generate computed properties from business rules

## Example Output

```typescript
// models/User.ts (TypeORM example)
import { Entity, PrimaryGeneratedColumn, Column, Index, OneToMany } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index()
  email: string;

  @Column({ type: 'varchar', length: 100 })
  displayName: string;

  @Column({ type: 'varchar', length: 50 })
  role: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @OneToMany(() => Task, task => task.assignedTo)
  tasks: Task[];
}
```

## AORDL Traceability

- AORDL Entities → ORM Model classes
- AORDL Relationships → ORM associations
- AORDL Invariants → Validation rules
- Data dictionary constraints → ORM validators
