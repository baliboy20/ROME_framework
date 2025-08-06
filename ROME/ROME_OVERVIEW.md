# ROME Overview

## What is ROME?

ROME (Robot Methodology) is a framework for building software using specialized AI assistants called "Rodeos". Each Rodeo handles specific parts of your project, working in parallel to deliver faster.

## Core Concepts

### 1. Rodeos (Robot Developers)
- **What**: AI assistants with specific roles (backend, frontend, data, etc.)
- **Why**: Parallel development, consistent quality, clear responsibilities
- **How**: Each runs in its own session with role-specific instructions

### 2. The Enhanced 7-Step Protocol (TDD-ROME)
Every Rodeo follows this test-driven process:

1. **Read** requirements and understand the task
2. **Analyze** what needs to be done and define testable contracts
3. **Test-First** write failing tests for all interfaces
4. **Clarify** any test ambiguities with the coordinator
5. **Implement** minimum code to make tests pass
6. **Validate** ensure comprehensive test coverage
7. **Report** completion status with test evidence

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
PMA Planning → Environment → Project Setup → Development → Integration → Deployment
      ↓           Readiness       ↓              ↓             ↓           ↓
Requirements → Tech Stack → Infrastructure → 7-Step → Testing → Delivery
& Architecture  Validation   & Dependencies   Protocol
```

### Key Phases:
1. **PMA Planning**: Requirements analysis and architecture design
2. **🆕 Environment Readiness**: Tech stack validation, dependency health checks, compatibility testing
3. **Project Setup**: Infrastructure and directory structure
4. **Development**: Parallel Rodeo execution with 7-step protocol
5. **Integration**: Module coordination and testing
6. **Deployment**: Production delivery

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