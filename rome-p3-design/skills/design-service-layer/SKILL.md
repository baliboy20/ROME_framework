# design-service-layer

## Metadata
- **Skill ID**: design-service-layer
- **Version**: 1.0.0
- **Tier**: 1
- **Phase**: P3 (Design)
- **Category**: Architecture Design
- **Plugin**: rome-p3-design@1.0.0

## Description

Designs the business logic service layer. Services orchestrate use cases, implement business rules, coordinate between controllers and repositories, and enforce business logic constraints.

## Parameters

### Required
- `use_cases_file` (string): Path to use-cases.md from P3
  - Validation: file_exists
- `data_dictionary_file` (string): Path to data-dictionary.yaml from P3
  - Validation: file_exists

### Optional
- `output_file` (string): File path to write service layer design
  - Default: ARTIFACTS/03-design/architecture/service-layer.md

## Execution

- **Timeout**: 60000ms (60 seconds)
- **Retry**: Enabled
  - Max attempts: 2
  - Backoff: linear

## Output

Returns:
- `services_designed` (integer): Number of service classes designed
- `total_methods` (integer): Total service methods
- `business_rules_enforced` (integer): Business rules mapped to services

## Usage Example

```bash
/design-service-layer \
  --use_cases_file ARTIFACTS/03-design/design-decisions/use-cases.md \
  --data_dictionary_file ARTIFACTS/03-design/data-models/data-dictionary.yaml
```

## Dependencies

- rome-core@^1.0.0 (SkillInvoker, SkillRegistry)
- js-yaml (for YAML parsing)

## Algorithm

1. Load use-cases.md and data-dictionary.yaml
2. Group use cases by domain entity
3. For each entity/domain:
   - Design service class (e.g., TaskService, UserService)
   - Map use case flows to service methods
   - Extract business rules from data dictionary
   - Define method signatures (parameters, return types)
   - Specify business logic steps
   - Document error handling
   - Map to repository dependencies
4. Generate service-layer.md
5. Write to output file

## Service Design Pattern

Each service:
- **Single Responsibility**: One service per domain entity
- **Methods**: Map to use case operations (create, update, delete, find, execute business logic)
- **Business Rules**: Enforce data dictionary business rules
- **Coordination**: Call repositories for data access
- **Transactions**: Define transaction boundaries
- **Error Handling**: Business-level error handling

## Example Output

```markdown
# Service Layer Design

## TaskService

### Purpose
Implements task management business logic

### Dependencies
- TaskRepository (data access)
- UserRepository (validation)
- NotificationService (side effects)

### Methods

#### createTask(createTaskDto: CreateTaskDto, userId: string): Task
**Purpose**: Create new task with business rule validation

**Steps**:
1. Validate user exists (call UserRepository.findById)
2. Validate due_date is not in past (business rule BR-TASK-001)
3. Create task entity
4. Save task (call TaskRepository.save)
5. Send notification (call NotificationService.notifyTaskCreated)
6. Return created task

**Throws**:
- UserNotFoundException
- InvalidDateException
- RepositoryException

#### updateTask(taskId: string, updateTaskDto: UpdateTaskDto, userId: string): Task
**Purpose**: Update existing task with authorization

**Steps**:
1. Validate task exists (call TaskRepository.findById)
2. Validate user is task owner or has permission
3. Apply business rules (BR-TASK-002: cannot update completed tasks)
4. Update task entity
5. Save task (call TaskRepository.update)
6. Return updated task

**Throws**:
- TaskNotFoundException
- UnauthorizedException
- InvalidStateException
```

## Notes

- Service layer implements business logic from use cases
- Enforces business rules from data dictionary
- Coordinates between controllers and repositories
- Defines transaction boundaries
- Integrates with PMA's system architecture workflow (Step 10)
- Used by Reena (P5) for backend implementation

## Related Skills

- design-api-controllers (Tier 1)
- design-repository-layer (Tier 1)
- design-error-handling (Tier 1)

## Revision History

| Version | Date | Summary |
|---------|------|---------|
| 1.0.0 | 2026-01-07 | Skill definition created for rome-p3-design plugin |
