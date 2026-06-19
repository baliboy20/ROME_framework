# generate-architecture-diagram

## Metadata
- **Skill ID**: generate-architecture-diagram
- **Version**: 1.0.0
- **Tier**: 2
- **Phase**: P3 (Design)
- **Category**: Architecture Visualization
- **Plugin**: rome-p3-design@1.0.0

## Description

Generates system architecture diagrams in Mermaid format. Supports layered diagrams (presentation, service, data access, domain layers), deployment diagrams (load balancer, API, database), and data flow diagrams.

## Parameters

### Required
- `component_structure_file` (string): Path to component structure JSON file
  - Validation: file_exists

### Optional
- `output_file` (string): File path to write Mermaid diagram
- `diagram_type` (string): Type of diagram to generate
  - Options: layered, deployment, dataflow
  - Default: layered

## Execution

- **Timeout**: 45000ms (45 seconds)
- **Retry**: Enabled
  - Max attempts: 2
  - Backoff: linear

## Output

Returns:
- `diagram_generated` (boolean): Whether diagram was successfully generated
- `diagram_content` (string): Mermaid diagram syntax
- `layers_visualized` (integer): Number of architectural layers visualized

## Usage Example

```bash
/generate-architecture-diagram \
  --component_structure_file ARTIFACTS/_design/architecture/components.json \
  --output_file ARTIFACTS/_design/architecture/system-diagram.mmd \
  --diagram_type layered
```

## Dependencies

- rome-core@^1.0.0 (SkillInvoker, SkillRegistry)

## Algorithm

1. Load component structure from JSON file
2. Based on diagram_type:
   - **layered**: Group components by layer (controller, service, repository, entity, dto), create subgraphs, add connections
   - **deployment**: Create deployment topology (client, load balancer, API server, database, cache)
   - **dataflow**: Show data flow between components
3. Generate Mermaid diagram syntax
4. Write to output file if specified
5. Return diagram content and metadata

## Diagram Types

### Layered Diagram
- Presentation Layer (Controllers)
- Service Layer (Business Logic)
- Data Access Layer (Repositories)
- Domain Layer (Entities, DTOs)

### Deployment Diagram
- Client Application
- Load Balancer
- API Server
- Database
- Cache

### Data Flow Diagram
- Shows data transformations and flows between components

## Notes

- Output is Mermaid syntax compatible with Seez visualization
- Integrates with PMA's system architecture workflow (Step 10)
- Layered diagrams show component dependencies across architectural layers
- Deployment diagrams show infrastructure topology

## Related Skills

- design-component-structure (Tier 1)
- design-service-layer (Tier 1)
- execute-p3-design (Tier 2)

## Revision History

| Version | Date | Summary |
|---------|------|---------|
| 1.0.0 | 2026-01-07 | Skill definition extracted from legacy .js skill for rome-p3-design plugin |
