# Robot Action Protocols

## Overview
This document provides a concise reference for Robot Developer protocols within the ROME methodology.

**For complete details, see: [Robot Developer Guide](robot_creation_guide.md)**

## Robot Developer Responsibilities

Each robot is assigned modules and follows standardized procedures:

- **Sequential Execution**: Complete assigned tasks from actionlist.md in order
- **Comprehensive Logging**: Update logs at task start and completion
- **Status Reporting**: Keep project_activity.status current
- **Quality Assurance**: Ensure code quality and testing standards
- **Communication**: Report blockers and coordinate handoffs immediately

## 7-Step Task Execution Protocol (Summary)

Every Robot Developer must follow this standardized process for each task:

1. **Review** → Read assigned tasks from actionlist.md
2. **Log Start** → Update project_activity.status with task initiation  
3. **Execute** → Implement per specifications and quality standards
4. **Test** → Validate functionality and integration points
5. **Log Completion** → Record results and deliverables in project_tasks.log
6. **Update Status** → Mark progress in project_activity.status.md
7. **Proceed** → Continue to next task in sequence

### Protocol Benefits
- **Accountability**: Through comprehensive logging
- **Quality**: Mandatory testing and validation
- **Visibility**: Real-time project status updates
- **Coordination**: Sequential execution prevents conflicts
- **Issue Tracking**: Problems documented and escalated

## Key Standards

### Quality Requirements
- **Test Coverage**: Minimum 80% line coverage
- **Documentation**: Complete API documentation for all interfaces
- **Code Standards**: Follow established team conventions
- **Performance**: Meet specified targets
- **Security**: No critical vulnerabilities

### Documentation Standards
All working documents, activity logs, summaries, tracking, and incident documentation are created in the `./PROJECT/dev/` folders.

### Escalation Triggers
- Blocked >4 hours on dependencies
- Unclear or conflicting requirements
- Technical issues beyond robot expertise
- Timeline impact >20% of module estimate

## File References
- **Task Assignments**: `actionlist.md`
- **Activity Tracking**: `PROJECT/dev/project_activity.status`
- **Task Logging**: `PROJECT/dev/project_tasks.log`
- **ROME Documentation**: `ROME/` directory

---

**Complete Protocol Details**: See [Robot Creation Guide](robot_creation_guide.md)  
**Module Design**: See [Module Design Principles](module_design_principles.md)  
**Project Coordination**: See [Project Coordination](project_coordination.md)