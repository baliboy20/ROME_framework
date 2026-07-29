# design-repository-layer

## Metadata
- **Skill ID**: design-repository-layer
- **Version**: 1.0.0
- **Tier**: 1
- **Phase**: P3 (Design)
- **Category**: Architecture Design
- **Plugin**: rome-p3-design@1.0.0

## Description

Designs the data access repository layer. Repositories abstract database operations, provide data persistence interface, and implement queries needed by the service layer.

## Parameters

### Required
- `data_dictionary_file` (string): Path to data-dictionary.yaml from P3
  - Validation: file_exists

### Optional
- `output_file` (string): File path to write repository layer design
  - Default: ARTIFACTS/_design/architecture/repository-layer.md

## Execution

- **Timeout**: 60000ms (60 seconds)
- **Retry**: Enabled
  - Max attempts: 2
  - Backoff: linear

## Output

Returns:
- `repositories_designed` (integer): Number of repository classes designed
- `total_methods` (integer): Total repository methods
- `queries_designed` (integer): Custom queries designed

## Usage Example

```bash
/design-repository-layer \
  --data_dictionary_file ARTIFACTS/_design/data-models/data-dictionary.yaml
```

## Dependencies

- rome-core@^1.0.0 (SkillInvoker, SkillRegistry)
- js-yaml (for YAML parsing)

## Algorithm

1. Load data-dictionary.yaml
2. For each entity:
   - Design repository interface (e.g., TaskRepository, UserRepository)
   - Define standard CRUD methods (save, update, delete, findById)
   - Define custom query methods from relationships
   - Specify query parameters and return types
   - Document index usage
3. Generate repository-layer.md
4. Write to output file

## Repository Design Pattern

Each repository:
- **Single Responsibility**: One repository per entity
- **Standard Methods**: save, update, delete, findById, findAll
- **Custom Queries**: Based on relationships and use case needs
- **Return Types**: Entity objects or arrays
- **Error Handling**: Database-level error handling

## Example Output

```markdown
# Repository Layer Design

## TaskRepository

### Purpose
Data access layer for Task entity

### Standard Methods

#### save(task: Task): Task
Create or update task in database

**Returns**: Saved task entity

**Throws**: RepositoryException

#### findById(id: string): Task | null
Find task by ID

**Parameters**:
- `id` (string): Task UUID

**Returns**: Task entity or null if not found

**Throws**: RepositoryException

#### delete(id: string): boolean
Delete task by ID

**Parameters**:
- `id` (string): Task UUID

**Returns**: true if deleted, false if not found

**Throws**: RepositoryException

### Custom Query Methods

#### findByUserId(userId: string): Task[]
Find all tasks for a user

**Parameters**:
- `userId` (string): User UUID

**Returns**: Array of Task entities

**Index Used**: idx_tasks_user_id

**Throws**: RepositoryException

#### findActiveTasks(userId: string): Task[]
Find active (not completed) tasks for a user

**Parameters**:
- `userId` (string): User UUID

**Returns**: Array of active Task entities

**Query**: WHERE user_id = ? AND status != 'completed'

**Index Used**: idx_tasks_user_id_status

**Throws**: RepositoryException

#### findOverdueTasks(): Task[]
Find tasks past due date

**Returns**: Array of overdue Task entities

**Query**: WHERE due_date < NOW() AND status != 'completed'

**Index Used**: idx_tasks_due_date_status

**Throws**: RepositoryException

### Implementation Notes

- Use ORM (TypeORM, Sequelize, Prisma, etc.)
- Leverage entity relationships from data dictionary
- Implement pagination for findAll-style queries
- Use database indexes for performance
- Handle database connection errors
```

## Notes

- Repository layer abstracts database operations
- One repository per entity
- Standard CRUD + custom queries
- References data dictionary for entity definitions
- Integrates with PMA's system architecture workflow (Step 10)
- Used by Ashok (P5) for database implementation

## Related Skills

- design-data-dictionary (Tier 1)
- design-service-layer (Tier 1)
- design-error-handling (Tier 1)

## Revision History

| Version | Date | Summary |
|---------|------|---------|
| 1.0.0 | 2026-01-07 | Skill definition created for rome-p3-design plugin |
