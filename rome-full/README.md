# ROME Framework - Complete Plugin Bundle

Version: 1.0.0
Type: Meta-Plugin
Status: Complete

## Overview

`rome-full` is the complete meta-plugin bundle for the ROME (Requirements-Oriented Methodology for Engineering) Framework. It provides a unified installation of all ROME phase plugins, enabling the full requirements-to-code generation workflow.

## What is ROME?

ROME is a structured methodology framework that orchestrates multiple Claude Code agents to collaborate with users in designing and generating computer applications. It transforms user-defined requirements through a defined sequence of phases:

**P0 Bootup** → **P1 AORDL** → **P2 Analysis** → **P3 Design** → **P4 Configuration** → **P5 Generation** → **QA Validation**

## What's Included

### Phase Plugins

- **rome-core** (v1.0.0) - Foundation plugin with shared libraries, Roma orchestrator, and activity logging
- **rome-p0-bootup** (v1.0.0) - Project initialization and workspace setup
- **rome-p1-aordl** (v1.0.0) - Requirements capture using Actor-Oriented Requirements Definition Language
- **rome-p2-analysis** (v1.0.0) - Functional decomposition and user story generation
- **rome-p3-design** (v1.0.0) - System architecture and API design
- **rome-p4-config** (v1.0.0) - Workspace scaffolding and environment configuration
- **rome-p5-generation** (v1.0.0) - Database, API, and UI code generation
- **rome-qa** (v1.0.0) - Quality gate validation and traceability verification

### Agents (10 Total)

- **Roma** - Framework orchestrator (coordinates phase transitions)
- **Bootstrap** - Project initialization specialist
- **Talib** - Requirements engineer (AORDL and Analysis phases)
- **PMA** - Project Manager / Architect
- **Clara** - UX Designer (optional activation)
- **Lucien** - DevOps Engineer
- **Ashok** - Data Architect & Database Engineer
- **Reena** - Backend Engineer
- **Charlie** - Frontend/Application Developer
- **Sarah** - System Auditor & Quality Gatekeeper

### Skills (40 Total)

#### Requirements (P1)
- validate-aordl
- transform-aordl-to-bdd
- create-aordl-requirement

#### Analysis (P2)
- analyze-requirement
- batch-analyze-requirements
- generate-user-stories

#### Design (P3)
- design-api-controllers
- design-data-dictionary
- generate-architecture-diagram
- design-dto-models
- design-service-layer
- design-repository-layer
- design-authentication
- design-error-handling
- design-logging-strategy
- design-testing-structure
- design-validation-layer
- design-component-structure

#### Configuration (P4)
- scaffold-workspace
- configure-environment
- setup-cicd-pipeline
- configure-build-system
- setup-test-framework
- validate-workspace-structure
- generate-technical-specs
- create-scaffolding-manifest

#### Generation (P5)
- generate-database-schema
- generate-migrations
- generate-orm-models
- generate-seed-data
- generate-api-endpoints
- generate-authentication-middleware
- generate-ui-screens
- generate-ui-components

#### Quality Assurance (QA)
- validate-aordl-structure
- validate-requirements-coverage
- validate-data-dictionary
- quality-gate-p2
- quality-gate-p3
- verify-traceability

### Slash Commands (18 Total)

```
/rome-p0:bootstrap              # Initialize new ROME project
/rome-p1:validate               # Validate AORDL requirements
/rome-p1:create                 # Create new AORDL requirement
/rome-p1:transform-bdd          # Transform AORDL to BDD format
/rome-p2:analyze                # Analyze single requirement
/rome-p2:batch-analyze          # Batch analyze requirements
/rome-p2:generate-stories       # Generate user stories
/rome-p3:design                 # Execute design phase
/rome-p3:activate-clara         # Activate Clara (UX Designer)
/rome-p3:architecture           # Generate architecture diagrams
/rome-p4:configure              # Configure project environment
/rome-p4:scaffold               # Scaffold workspace structure
/rome-p4:cicd                   # Setup CI/CD pipeline
/rome-p5:generate-db            # Generate database layer
/rome-p5:generate-api           # Generate API layer
/rome-p5:generate-ui            # Generate UI layer
/rome-qa:validate               # Run validation checks
/rome-qa:quality-gate           # Execute quality gate
```

## Installation

### Prerequisites

- Claude Code CLI installed
- Node.js >= 18.0.0
- Git (for plugin management)

### Quick Install

Install the complete ROME Framework bundle:

```bash
claude-plugin install rome-full
```

This single command installs all phase plugins and their dependencies.

### Selective Installation

If you only need specific phases, install individual plugins:

```bash
# Core foundation (required by all plugins)
claude-plugin install rome-core

# Individual phase plugins
claude-plugin install rome-p0-bootup
claude-plugin install rome-p1-aordl
claude-plugin install rome-p2-analysis
claude-plugin install rome-p3-design
claude-plugin install rome-p4-config
claude-plugin install rome-p5-generation
claude-plugin install rome-qa
```

## Usage

### Starting a New ROME Project

1. **Initialize Project (P0)**
```bash
/rome-p0:bootstrap
```
This creates the project structure, workspace directories, and initial configuration files.

2. **Capture Requirements (P1)**
```bash
/rome-p1:create
```
Create AORDL requirements capturing actors, actions, and acceptance criteria.

3. **Analyze Requirements (P2)**
```bash
/rome-p2:batch-analyze
/rome-p2:generate-stories
```
Perform functional decomposition and generate user stories from AORDL requirements.

4. **Design System Architecture (P3)**
```bash
/rome-p3:design
/rome-p3:architecture
```
Generate system architecture, API specifications, and data models.

5. **Configure Workspace (P4)**
```bash
/rome-p4:configure
/rome-p4:scaffold
```
Set up development environment, build system, and CI/CD pipelines.

6. **Generate Code (P5)**
```bash
/rome-p5:generate-db    # Database schema and migrations
/rome-p5:generate-api   # API endpoints and business logic
/rome-p5:generate-ui    # User interface screens and components
```

7. **Quality Assurance (QA)**
```bash
/rome-qa:validate       # Validate deliverables
/rome-qa:quality-gate   # Verify phase completion criteria
```

### Workflow Example

```bash
# Start new project
/rome-p0:bootstrap

# Create requirements
/rome-p1:create
# (Interactive requirement authoring)

# Validate requirements
/rome-p1:validate

# Analyze requirements
/rome-p2:batch-analyze

# Generate user stories
/rome-p2:generate-stories

# Quality gate: P2
/rome-qa:quality-gate --phase P2

# Design architecture
/rome-p3:design

# Activate UX designer (optional)
/rome-p3:activate-clara

# Quality gate: P3
/rome-qa:quality-gate --phase P3

# Configure workspace
/rome-p4:configure
/rome-p4:scaffold

# Generate code (parallel execution supported)
/rome-p5:generate-db
/rome-p5:generate-api
/rome-p5:generate-ui

# Final validation
/rome-qa:validate
```

## Key Features

### 1. Phase-Based Workflow
Each phase has explicit entry/exit criteria enforced by the Roma orchestrator and Sarah QA agent.

### 2. AORDL Traceability
All artifacts maintain bidirectional traceability back to AORDL requirements throughout the workflow.

### 3. Multi-Agent Collaboration
10 specialized agents coordinate to transform requirements into deployable applications.

### 4. Quality Gates
Sarah QA agent blocks phase transitions until validation criteria are met.

### 5. Activity Logging
Automatic event logging via MCP server tracks all framework activities.

### 6. Parallel Generation
P5 generation phase supports concurrent database, API, and UI generation.

### 7. Feature-Based Organization
Generated code follows feature-based structure (ROME-PROP-016) rather than layer-based.

### 8. Technology Agnostic
Framework supports multiple tech stacks (Flutter/Dart, Node.js, Python, etc.)

## Architecture

### Plugin Dependency Chain

```
rome-core (foundation)
    ├── rome-p0-bootup
    ├── rome-p1-aordl
    ├── rome-p2-analysis
    │       └── rome-p3-design (peer: rome-p2-analysis)
    │               └── rome-p4-config (peer: rome-p3-design)
    │                       └── rome-p5-generation (peer: rome-p4-config)
    └── rome-qa (cross-phase validation)
```

### Agent Workflow

```
[Bootstrap] → [Talib:P1] → [Talib:P2] → [PMA/Clara] → [Lucien] → [Ashok→Reena→Charlie]
                  ↓            ↓              ↓            ↓              ↓
              [Sarah:QA-P1] [Sarah:QA-P2] [Sarah:QA-P3] [Sarah:QA-P4] [Sarah:QA-P5]
```

### Phase Transitions

Roma orchestrator coordinates phase transitions:

1. Verify current phase completion
2. Invoke Sarah quality gate
3. Resolve blockers if validation fails
4. Authorize phase transition upon approval
5. Log phase transition event
6. Activate next phase agents

## Configuration

### MCP Server Setup

The activity-log MCP server requires configuration in `.mcp.json`:

```json
{
  "mcpServers": {
    "activity-log": {
      "command": "node",
      "args": ["${pluginPath}/rome-core/servers/activity-log/activity-log-file/index.js"],
      "env": {
        "PROJECT_ROOT": "${projectRoot}"
      }
    }
  }
}
```

### Project Structure

ROME projects follow this structure:

```
project-root/
├── _user_input/
│   └── raw-requirements/          # User-provided requirements
├── _requirements/
│   └── aordl/                     # P1: AORDL requirements (REQ-*.yaml)
├── _analysis/
│   ├── functional-decomposition/  # P2: Analysis outputs
│   └── user-stories/              # P2: User stories
├── _design/
│   ├── architecture/              # P3: Architecture diagrams
│   ├── api-specs/                 # P3: API specifications
│   └── data-models/               # P3: Data dictionary
├── _config/
│   └── scaffolding-manifest.yaml  # P4: Workspace configuration
└── src/                           # P5: Generated code
    └── features/                  # Feature-based organization
```

## Validation and Testing

See [TESTING.md](../TESTING.md) for comprehensive validation procedures.

## Documentation

- **[INSTALLATION-GUIDE.md](../INSTALLATION-GUIDE.md)** - Detailed installation patterns
- **[PLUGIN-MANIFEST.md](../PLUGIN-MANIFEST.md)** - Complete plugin catalog
- **[TESTING.md](../TESTING.md)** - Validation procedures

## Troubleshooting

### Plugin Not Found
```bash
# Verify installation
claude-plugin list

# Reinstall if missing
claude-plugin install rome-full
```

### MCP Server Not Starting
```bash
# Check .mcp.json configuration
# Verify Node.js version >= 18.0.0
node --version

# Check server logs
tail -f ~/.claude/logs/mcp-server.log
```

### Quality Gate Blocking
```bash
# Review Sarah's validation report
/rome-qa:validate

# Address blockers listed in report
# Re-run quality gate
/rome-qa:quality-gate --phase <phase>
```

## License

MIT

## Author

ROME Framework Team

## Repository

https://github.com/rome-framework/rome-full

## Support

For issues, questions, or contributions, visit:
- GitHub: https://github.com/rome-framework/rome-full/issues
- Documentation: https://rome-framework.github.io/docs

## Version History

### v1.0.0 (2026-01-07)
- Initial release with all phase plugins
- 10 agents, 40 skills, 18 slash commands
- Complete P0→P1→P2→P3→P4→P5→QA workflow
- Activity logging via MCP server
- AORDL traceability chain
- Quality gate validation
