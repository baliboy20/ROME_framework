# design-api-controllers

## Metadata
- **Skill ID**: design-api-controllers
- **Version**: 1.0.0
- **Tier**: 1
- **Phase**: P3 (Design)
- **Category**: API Design
- **Plugin**: rome-p3-design@1.0.0

## Description

Designs API controller layer with routing, middleware, and request handling. For each API path, designs controller methods, route configuration, request validation, response formatting, and error handling.

## Parameters

### Required
- `api_spec_file` (string): Path to unified API specification file (YAML format)
  - Validation: file_exists

### Optional
- `output_file` (string): File path to write controller design specification
- `framework` (string): API framework (express, fastify, nestjs, spring, flask)
  - Default: express

## Execution

- **Timeout**: 60000ms (60 seconds)
- **Retry**: Enabled
  - Max attempts: 2
  - Backoff: linear

## Output

Returns:
- `controllers_designed` (integer): Number of controllers designed
- `total_routes` (integer): Total API routes designed
- `controller_specs` (array): List of controller specifications

## Usage Example

```bash
/design-api-controllers \
  --api_spec_file ARTIFACTS/03-design/api-contracts/api-spec.yaml \
  --output_file ARTIFACTS/03-design/api-contracts/controller-design.json \
  --framework express
```

## Dependencies

- rome-core@^1.0.0 (SkillInvoker, SkillRegistry)
- js-yaml (for YAML parsing)

## Algorithm

1. Load API specification from YAML file
2. Group endpoints by resource (e.g., /tasks → tasks)
3. For each resource:
   - Design controller class
   - Define route methods (GET, POST, PUT, DELETE)
   - Specify request validation
   - Define response formatting
   - Document error handling
4. Generate design specification document
5. Write to output file if specified

## Notes

- Groups endpoints by resource for cohesive controller design
- Supports multiple frameworks (Express, Fastify, NestJS, Spring, Flask)
- Generates structured design specs for P5 robot implementation
- Integrates with PMA's API design workflow (Step 8)

## Related Skills

- design-service-layer (Tier 1)
- design-repository-layer (Tier 1)
- generate-api-spec (Tier 1)
- execute-p3-design (Tier 2)

## Revision History

| Version | Date | Summary |
|---------|------|---------|
| 1.0.0 | 2026-01-07 | Skill definition extracted from legacy .js skill for rome-p3-design plugin |
