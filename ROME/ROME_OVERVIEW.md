# ROME Overview
**Version**: 2.1  
**Last Updated**: 2025-08-07  
**Changelog**: Added standards review phase and Roma approval authority

## What is ROME?

ROME (Robot Methodology) is a framework for building software using specialized AI assistants called "Rodeos". Each Rodeo handles specific parts of your project, working in parallel to deliver faster.

## Core Concepts

### 1. Rodeos (Robot Developers)
- **What**: AI assistants with specific roles (backend, frontend, data, etc.)
- **Why**: Parallel development, consistent quality, clear responsibilities
- **How**: Each runs in its own session with role-specific instructions

### 2. The Enhanced 8-Step Protocol (Standards + TDD-ROME)
Every Rodeo follows this standards-driven, test-driven process:

1. **Read** requirements and understand the task
2. **Analyze** what needs to be done and create development plan
3. **Standards Review** get Roma approval of plan against technical standards
4. **Test-First** write failing tests for all interfaces
5. **Clarify** any test ambiguities with the coordinator
6. **Implement** minimum code to make tests pass
7. **Validate** ensure comprehensive test coverage
8. **Report** completion status with test evidence

### 3. Module Design
- **Independent**: Each module can be developed separately
- **Minimal Overlap**: Clear boundaries between modules
- **Well-Defined Interface**: Modules communicate through APIs/contracts

### 4. Project Structure
```
PROJECT/
├── SOURCE/          # All code goes here
│   ├── backend/
│   ├── frontend/
│   ├── database/
│   └── tests/
├── PROJECT/dev/     # Tracking and documentation
│   ├── actionlist.md
│   ├── project_activity.status
│   └── project_tasks.log
└── claude_*/        # Individual Rodeo workspaces
```

## When to Use ROME

✅ **Good for**:
- Projects with clear module boundaries
- Teams using AI assistants
- Parallel development needs
- Consistent quality requirements

❌ **Not ideal for**:
- Small, simple scripts
- Highly interdependent code
- Experimental/research projects

## Quick Start

1. Define your modules and requirements
2. **🆕 Validate environment readiness** (tech stack, dependencies, compatibility)
3. Create the project structure
4. Launch Rodeos with specific tasks
5. Coordinate through actionlist.md
6. Track progress in project_activity.status

## Enhanced Development Flow

```
PMA Planning → Environment → Project Setup → Standards Review → Development → Integration → Deployment
      ↓           Readiness       ↓              ↓                ↓             ↓           ↓
Requirements → Tech Stack → Infrastructure → Roma Approval → 8-Step → Testing → Delivery
& Architecture  Validation   & Dependencies    of Plans       Protocol
```

### Key Phases:
1. **PMA Planning**: Requirements analysis and architecture design
2. **🆕 Environment Readiness**: Tech stack validation, dependency health checks, compatibility testing
3. **Project Setup**: Infrastructure and directory structure
4. **🆕 Standards Review**: Roma validates development plans against technical standards
5. **Development**: Parallel Rodeo execution with 8-step protocol
6. **Integration**: Module coordination and testing
7. **Deployment**: Production delivery

## Key Benefits

- **Speed**: Multiple Rodeos work simultaneously
- **Quality**: Test-driven development ensures first-time success
- **Clarity**: Clear roles and contract-based interfaces
- **Tracking**: Automatic progress logging with test metrics
- **🆕 Reliability**: Environment validation prevents technical surprises
- **🆕 Zero Rework**: Contract tests eliminate integration failures

## Next Steps

- Read [ROME_QUICKSTART.md](ROME_QUICKSTART.md) for setup instructions
- See [ROME_REFERENCE.md](ROME_REFERENCE.md) for detailed protocols
- **NEW**: Read [ROME_TDD_GUIDE.md](ROME_TDD_GUIDE.md) for test-driven development approach
- **NEW**: Read [ROME_CICD_GUIDE.md](ROME_CICD_GUIDE.md) for GitHub Actions integration
- Check role specifications for each Rodeo type