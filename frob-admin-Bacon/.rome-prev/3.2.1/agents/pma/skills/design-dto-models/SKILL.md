# design-dto-models

## Metadata
- **Skill ID**: design-dto-models
- **Version**: 1.0.0
- **Tier**: 1
- **Phase**: P3 (Design)
- **Category**: Data Modeling
- **Plugin**: rome-p3-design@1.0.0

## Description

Designs Data Transfer Objects (DTOs) for API request/response payloads. DTOs define the shape of data exchanged between client and server, derived from the data dictionary but optimized for API contracts.

## Parameters

### Required
- `data_dictionary_file` (string): Path to data-dictionary.yaml from P3
  - Validation: file_exists

### Optional
- `output_file` (string): File path to write DTO specifications
  - Default: ARTIFACTS/_design/data-models/dto-models.yaml

## Execution

- **Timeout**: 60000ms (60 seconds)
- **Retry**: Enabled
  - Max attempts: 2
  - Backoff: linear

## Output

Returns:
- `dtos_designed` (integer): Number of DTOs created
- `request_dtos` (integer): Request DTO count
- `response_dtos` (integer): Response DTO count

## Usage Example

```bash
/design-dto-models \
  --data_dictionary_file ARTIFACTS/_design/data-models/data-dictionary.yaml \
  --output_file ARTIFACTS/_design/data-models/dto-models.yaml
```

## Dependencies

- rome-core@^1.0.0 (SkillInvoker, SkillRegistry)
- js-yaml (for YAML parsing)

## Algorithm

1. Load data-dictionary.yaml
2. For each entity:
   - Create Request DTO (CreateXxxDto, UpdateXxxDto)
   - Create Response DTO (XxxResponseDto)
   - Apply transformation rules:
     - Exclude internal fields (id, created_at, updated_at from requests)
     - Include computed fields in responses
     - Apply validation decorators
     - Map database_type to api_type
3. Generate dto-models.yaml
4. Write to output file

## DTO Types

### Request DTOs
- **CreateXxxDto**: Fields required for entity creation (excludes id, timestamps)
- **UpdateXxxDto**: Fields allowed for entity update (partial, optional fields)

### Response DTOs
- **XxxResponseDto**: Fields returned in API response (includes id, timestamps, computed fields)

## Example Output

```yaml
dtos:
  CreateTaskDto:
    purpose: "Create new task"
    fields:
      title:
        type: string
        required: true
        validation: min_length:1, max_length:255
      description:
        type: string
        required: false
      due_date:
        type: string
        format: ISO8601
        required: false

  UpdateTaskDto:
    purpose: "Update existing task"
    fields:
      title:
        type: string
        required: false
        validation: min_length:1, max_length:255
      description:
        type: string
        required: false
      due_date:
        type: string
        format: ISO8601
        required: false

  TaskResponseDto:
    purpose: "Task response payload"
    fields:
      id:
        type: string
        format: uuid
      title:
        type: string
      description:
        type: string
      due_date:
        type: string
        format: ISO8601
      created_at:
        type: string
        format: ISO8601
      updated_at:
        type: string
        format: ISO8601
```

## Notes

- DTOs are derived from data dictionary but optimized for API contracts
- Request DTOs exclude id and timestamps
- Response DTOs include all fields plus computed fields
- Integrates with PMA's API design workflow
- Used by Reena (P5) for API implementation

## Related Skills

- design-data-dictionary (Tier 1)
- design-api-controllers (Tier 1)
- design-validation-layer (Tier 1)

## Revision History

| Version | Date | Summary |
|---------|------|---------|
| 1.0.0 | 2026-01-07 | Skill definition created for rome-p3-design plugin |
