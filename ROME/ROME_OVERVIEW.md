# ROME Overview

## What is ROME?

ROME (Robot Methodology) is a framework for building software using specialized AI assistants called "Rodeos". Each Rodeo handles specific parts of your project, working in parallel to deliver faster.

## Core Concepts

### 1. Rodeos (Robot Developers)
- **What**: AI assistants with specific roles (backend, frontend, data, etc.)
- **Why**: Parallel development, consistent quality, clear responsibilities
- **How**: Each runs in its own session with role-specific instructions

### 2. The 7-Step Protocol
Every Rodeo follows this process:

1. **Read** requirements and understand the task
2. **Analyze** what needs to be done
3. **Clarify** any questions with the coordinator
4. **Implement** the solution
5. **Test** the implementation
6. **Document** what was built
7. **Report** completion status

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
2. Create the project structure
3. Launch Rodeos with specific tasks
4. Coordinate through actionlist.md
5. Track progress in project_activity.status

## Key Benefits

- **Speed**: Multiple Rodeos work simultaneously
- **Quality**: Built-in testing and documentation steps
- **Clarity**: Clear roles and responsibilities
- **Tracking**: Automatic progress logging

## Next Steps

- Read [ROME_QUICKSTART.md](ROME_QUICKSTART.md) for setup instructions
- See [ROME_REFERENCE.md](ROME_REFERENCE.md) for detailed protocols
- Check role specifications for each Rodeo type