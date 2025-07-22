# ROME Robot Developer Guide

## Overview
Comprehensive guide for creating, configuring, and managing Robot Developers (Robots) within the ROME methodology. This document consolidates all robot-related procedures and protocols.

---

## Table of Contents
1. [Robot Creation Process](#robot-creation-process)
2. [7-Step Task Execution Protocol](#7-step-task-execution-protocol)
3. [Robot Workspace Setup](#robot-workspace-setup)
4. [Role Assignment and Specialization](#role-assignment-and-specialization)
5. [Coordination and Communication](#coordination-and-communication)
6. [Quality Standards and Compliance](#quality-standards-and-compliance)

---

## Robot Creation Process

### **Prerequisites**
- Completed system design from [System Design Tasks and Deliverables](system_design_tasks_and_deliverables.md)
- Defined module boundaries and assignments
- Project directory structure established per [Project Setup](project_setup.md)

### **Step 1: Determine Robot Requirements**
**Responsibility**: PMA (Project Manager/Architect)

**Analysis Criteria**:
- **Module Complexity**: Number and complexity of assigned tasks
- **Technical Specialization**: Required expertise areas
- **Timeline Constraints**: Development schedule requirements
- **Integration Dependencies**: Coordination requirements with other robots

**Robot Selection Guidelines**:
```
Backend Development: Reena (API, business logic, data access)
Frontend Development: Charlie (CLI, basic UI), Nicolas (advanced UI, mobile)
Infrastructure/DevOps: Luc (database, deployment, monitoring)
Data Architecture: Ashok (data modeling, validation, analytics)
Project Management: PMA (coordination, architecture decisions)
```

### **Step 2: Create Robot Workspace**
**Location**: `claude_[robot_name]/` directory

**Required Files**:
```
claude_[robot_name]/
├── CLAUDE.md              # Robot instructions and role definition
├── claude-start.sh        # Startup script
└── startup_prompt.txt     # Optional detailed startup instructions
```

**Directory Creation Command**:
```bash
mkdir -p claude_[robot_name]
cd claude_[robot_name]
```

### **Step 3: Configure Robot Instructions (CLAUDE.md)**
**Template Structure**:
```markdown
Execute the following tasks

1) read all the documents in the ../ROME folder
2) read and understand your assigned module/ steps and tasks in the ../actionlist.md in accordance to the ROME methodology.
3) execute the plan.

## Your Role: [Role Title]

You are [Robot Name], specializing in:
- [Primary Specialization]
- [Secondary Specialization]
- [Additional Expertise Areas]

Your personality: [Personality description and working style]

Focus areas: [Key responsibilities and priorities]

## Current Assignment
- **Module(s)**: [Assigned module numbers and names]
- **Dependencies**: [What you depend on from other robots]
- **Deliverables**: [What other robots depend on from you]

## Quality Standards
- Code coverage: 80% minimum
- Documentation: Complete for all public interfaces
- Testing: Unit, integration, and module-level tests
- Logging: Comprehensive task execution logs
```

### **Step 4: Create Startup Script**
**Filename**: `claude-start.sh`

**Script Template**:
```bash
#!/bin/bash

# [Robot Name] ([Role]) startup script
echo "Starting [Robot Name] - [Role Description]"
echo "Specializing in: [Key Specializations]"
echo "Current Module(s): [Assigned Modules]"

# Start Claude with CLAUDE.md instructions
cd "$(dirname "$0")"
echo "execute CLAUDE.md instructions" | claude "$@" in newWindow
```

**Permissions Setup**:
```bash
chmod +x claude-start.sh
```

### **Step 4.5: Setup Robot Permissions**
**Objective**: Configure comprehensive permissions to minimize workflow interruptions

**Commands to Execute**:
```bash
# Create .claude directory if it doesn't exist
mkdir -p .claude

# Copy permissions template to robot workspace
cp ../ROME/rodeo_permissions_template.json .claude/settings.local.json

# Verify permissions file exists
ls -la .claude/settings.local.json
```

**Validation**:
- [ ] .claude directory created
- [ ] settings.local.json contains comprehensive permissions
- [ ] Robot can access all necessary development tools without prompts

### **Step 5: Validate Robot Configuration**
**Validation Checklist**:
- [ ] Robot directory created with correct naming convention
- [ ] CLAUDE.md contains complete role definition and instructions
- [ ] Startup script is executable and tested
- [ ] **Permissions file (.claude/settings.local.json) configured**
- [ ] **Robot can execute development commands without permission prompts**
- [ ] Robot assignments align with module definitions
- [ ] Dependencies and deliverables clearly specified
- [ ] Quality standards documented

---

## 7-Step Task Execution Protocol

### **Protocol Overview**
Every Robot Developer must follow this standardized 7-step process for each assigned task to ensure consistency, quality, and proper coordination.

### **Step 1: Review Assigned Tasks**
**Objective**: Understand current task requirements and context

**Activities**:
- Read current task from actionlist.md
- Review task dependencies and prerequisites
- Understand deliverables and acceptance criteria
- Identify coordination requirements with other robots

**Documentation**:
```
[TIMESTAMP] [ROBOT_NAME] - STEP 1 - TASK [MODULE.STEP.TASK] - REVIEWING
Task: [Task Description]
Dependencies: [List dependencies]
Deliverables: [Expected outputs]
```

### **Step 2: Log Task Start**
**Objective**: Record task initiation for coordination and tracking

**Activities**:
- Update project_activity.status with task start
- Log start time in project_tasks.log
- Notify any dependent robots of task initiation
- Set task status to IN_PROGRESS

**Documentation Format**:
```
[DATE] [ROBOT_NAME] - [MODULE.STEP.TASK] - START - [DESCRIPTION]
Started: [TIMESTAMP]
Estimated Duration: [TIME_ESTIMATE]
Dependencies: [PREREQUISITE_TASKS]
```

### **Step 3: Execute Implementation**
**Objective**: Perform the actual task work according to specifications

**Activities**:
- Follow module design principles and standards
- Implement functionality per requirements
- Apply role-specific expertise and best practices
- Maintain code quality and documentation standards
- Create necessary artifacts and deliverables

**Quality Requirements**:
- Code follows established patterns and conventions
- All interfaces properly documented
- Error handling comprehensive
- Security requirements satisfied
- Performance targets considered

### **Step 4: Test and Validate**
**Objective**: Ensure implementation meets quality standards

**Testing Requirements**:
- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Validate interfaces with other modules
- **Functional Tests**: Verify business requirements satisfied
- **Performance Tests**: Ensure response time targets met

**Validation Checklist**:
- [ ] All tests passing
- [ ] Code coverage ≥80%
- [ ] Documentation complete
- [ ] No critical security vulnerabilities
- [ ] Integration points validated

### **Step 5: Log Task Completion**
**Objective**: Record results and communicate deliverables

**Activities**:
- Document task completion status
- Record any issues encountered
- List all deliverables and artifacts
- Note any follow-up actions required
- Update handoff information for dependent robots

**Documentation Format**:
```
[DATE] [ROBOT_NAME] - [MODULE.STEP.TASK] - COMPLETE - [DESCRIPTION]
Completed: [TIMESTAMP]
Duration: [ACTUAL_TIME]
Status: [SUCCESS/PARTIAL/BLOCKED]
Deliverables: [LIST_OF_OUTPUTS]
Issues: [ANY_PROBLEMS_ENCOUNTERED]
Handoffs: [ARTIFACTS_FOR_OTHER_ROBOTS]
```

### **Step 6: Update Project Status**
**Objective**: Maintain real-time project visibility

**Activities**:
- Update project_activity.status with completion
- Mark dependencies as resolved
- Update module progress percentage
- Flag any blockers for other robots
- Notify PMA of significant issues

**Status Updates**:
```
Module [X]: [PROGRESS_PERCENTAGE]% complete
Task [MODULE.STEP.TASK]: COMPLETED
Next Dependencies: [UPCOMING_TASKS]
Blockers: [ANY_BLOCKING_ISSUES]
```

### **Step 7: Proceed to Next Task**
**Objective**: Continue workflow execution efficiently

**Activities**:
- Identify next task in sequence
- Review dependencies for next task
- Begin Step 1 for next task if ready
- Report to PMA if no tasks available
- Coordinate handoffs as needed

**Transition Logic**:
```
IF next_task.dependencies_satisfied():
    BEGIN next_task.step_1()
ELSE:
    WAIT_FOR_DEPENDENCIES()
    NOTIFY_PMA_IF_BLOCKED()
```

---

## Robot Workspace Setup

### **Development Environment Configuration**

**Required Tools by Role**:

**Backend Developer (Reena)**:
```bash
# Node.js/TypeScript environment
node --version  # v18+
npm --version   # v8+
# Python environment (if needed)
python3 --version  # v3.9+
pip3 --version
# Database tools
psql --version  # PostgreSQL client
```

**Frontend Developer (Charlie/Nicolas)**:
```bash
# Node.js and frontend tools
node --version  # v18+
npm --version   # v8+
# Build tools
webpack --version
vite --version
# Testing tools
jest --version
cypress --version
```

**DevOps/DBA (Luc)**:
```bash
# Docker and containerization
docker --version
docker-compose --version
# Infrastructure tools
kubectl --version  # if using Kubernetes
terraform --version  # if using Terraform
```

**Data Architect (Ashok)**:
```bash
# Python data tools
python3 --version  # v3.9+
pip3 install pandas numpy matplotlib
# Database tools
psql --version
# Vector database tools
weaviate-client --version
```

### **File Organization Standards**

**Robot Workspace Structure**:
```
claude_[robot_name]/
├── CLAUDE.md                 # Robot instructions
├── claude-start.sh          # Startup script
├── logs/                    # Execution logs
│   ├── task_execution.log
│   └── coordination.log
├── working/                 # Working files
│   ├── notes/
│   ├── drafts/
│   └── temp/
└── deliverables/           # Completed artifacts
    ├── documentation/
    ├── code/
    └── test_results/
```

**Shared Resource Access**:
```
../actionlist.md            # Task assignments
../ROME/                    # Methodology documentation
../PROJECT/dev/             # Project artifacts
../SOURCE/                  # Source code organization
```

---

## Role Assignment and Specialization

### **Role-Based Capabilities**

#### **Backend Developer (Reena)**
**Primary Responsibilities**:
- API development and business logic
- Database integration and data access
- Authentication and authorization
- Server-side performance optimization

**Module Types**:
- Document Processing Modules
- Search Engine Modules
- API Gateway Modules
- Authentication Modules

**Quality Standards**:
- API response time <200ms for 95th percentile
- Database query optimization
- Comprehensive error handling
- Security vulnerability scanning

#### **Frontend Developer (Charlie)**
**Primary Responsibilities**:
- CLI tool development
- Basic user interface implementation
- API integration from client side
- User experience optimization

**Module Types**:
- Command Line Interface Modules
- Basic UI Components Modules
- Client-side Integration Modules

**Quality Standards**:
- Cross-platform CLI compatibility
- User-friendly error messages
- Comprehensive help documentation
- Input validation and sanitization

#### **Advanced Frontend Developer (Nicolas)**
**Primary Responsibilities**:
- Progressive Web App features
- Mobile-first responsive design
- Advanced UI components and interactions
- Frontend performance optimization

**Module Types**:
- Progressive Web App Modules
- Mobile Optimization Modules
- Advanced UI Component Modules
- Performance Monitoring Modules

**Quality Standards**:
- Mobile responsiveness across devices
- PWA functionality compliance
- Advanced animation and interaction
- Performance metrics monitoring

#### **DevOps/DBA (Luc)**
**Primary Responsibilities**:
- Infrastructure setup and management
- Database administration and optimization
- Deployment pipeline creation
- System monitoring and maintenance

**Module Types**:
- Infrastructure Setup Modules
- Database Configuration Modules
- Deployment Pipeline Modules
- Monitoring and Alerting Modules

**Quality Standards**:
- 99.9% system uptime
- Automated backup and recovery
- Security compliance validation
- Performance monitoring dashboards

#### **Data Architect (Ashok)**
**Primary Responsibilities**:
- Data modeling and schema design
- Data validation and quality assurance
- Test data generation and management
- Analytics and reporting architecture

**Module Types**:
- Data Architecture Modules
- Data Validation Modules
- Test Data Management Modules
- Analytics Platform Modules

**Quality Standards**:
- Data integrity and consistency
- Comprehensive validation rules
- Realistic test data scenarios
- Performance-optimized data access

---

## Coordination and Communication

### **Inter-Robot Communication Protocols**

#### **Handoff Procedures**
**When**: Task completion affects another robot's work

**Process**:
1. **Completing Robot**: Documents artifacts and interfaces
2. **Notification**: Updates project logs with handoff details
3. **Receiving Robot**: Validates artifacts before proceeding
4. **Confirmation**: Both robots confirm handoff completion

**Handoff Documentation Format**:
```
HANDOFF: [DATE] [FROM_ROBOT] → [TO_ROBOT]
Module: [MODULE_NAME]
Artifacts: [LIST_OF_DELIVERABLES]
Interfaces: [API_CONTRACTS_OR_SPECIFICATIONS]
Validation: [RECEIVING_ROBOT_CONFIRMATION]
Next Tasks: [DEPENDENT_TASKS_UNLOCKED]
```

#### **Dependency Management**
**Upstream Dependencies**: What robot needs from others
**Downstream Dependencies**: What others need from robot

**Dependency Tracking**:
```
Robot: [ROBOT_NAME]
Waiting For:
  - [ROBOT_X]: [SPECIFIC_DELIVERABLE] (Expected: [DATE])
  - [ROBOT_Y]: [SPECIFIC_DELIVERABLE] (Expected: [DATE])

Providing To:
  - [ROBOT_A]: [SPECIFIC_DELIVERABLE] (Due: [DATE])
  - [ROBOT_B]: [SPECIFIC_DELIVERABLE] (Due: [DATE])
```

#### **Blocker Escalation**
**Trigger Conditions**:
- Dependency not delivered within 24 hours of expected date
- Technical blocker prevents task completion
- Conflicting requirements or specifications
- Resource constraints impacting delivery

**Escalation Process**:
1. **Immediate Stop**: Cease work on blocked task
2. **Document Issue**: Record blocker details in logs
3. **Notify PMA**: Direct escalation with context
4. **Wait for Resolution**: Do not proceed until cleared

### **Communication Standards**

#### **Status Updates**
**Frequency**: After each task completion, minimum daily
**Format**: Structured updates in project_activity.status
**Content**: Progress, blockers, next steps, estimated completion

#### **Issue Reporting**
**Categories**:
- **Technical Issues**: Code problems, integration failures
- **Process Issues**: Workflow problems, unclear requirements
- **Coordination Issues**: Communication gaps, dependency conflicts
- **Quality Issues**: Test failures, performance problems

**Reporting Template**:
```
ISSUE: [CATEGORY] - [BRIEF_DESCRIPTION]
Reporter: [ROBOT_NAME]
Module: [AFFECTED_MODULE]
Impact: [SEVERITY_LEVEL]
Description: [DETAILED_ISSUE_DESCRIPTION]
Steps to Reproduce: [IF_APPLICABLE]
Workaround: [TEMPORARY_SOLUTION_IF_ANY]
```

---

## Quality Standards and Compliance

### **Code Quality Requirements**

#### **All Robots**
- **Test Coverage**: Minimum 80% line coverage
- **Documentation**: Complete API documentation for all public interfaces
- **Code Style**: Follow established team conventions
- **Error Handling**: Comprehensive error handling and logging
- **Security**: No critical security vulnerabilities
- **Performance**: Meet specified performance targets

#### **Code Review Process**
1. **Self-Review**: Robot reviews own code before completion
2. **Automated Checks**: Run linting, testing, security scans
3. **Peer Review**: Other robots review relevant interfaces
4. **PMA Review**: Architectural review for significant changes

### **Documentation Standards**

#### **Required Documentation**
- **API Documentation**: All endpoints and interfaces
- **Module Documentation**: Purpose, architecture, usage
- **Integration Documentation**: How modules connect
- **Testing Documentation**: Test strategies and coverage
- **Deployment Documentation**: Setup and configuration

#### **Documentation Quality**
- **Clarity**: Clear, unambiguous language
- **Completeness**: All necessary information included
- **Currency**: Kept up-to-date with code changes
- **Accessibility**: Easy to find and understand
- **Examples**: Practical usage examples provided

### **Testing Standards**

#### **Testing Pyramid**
```
System Tests (10%)
├── End-to-end scenarios
├── Performance validation
└── Security testing

Integration Tests (20%)
├── Module interfaces
├── API contract validation
└── Database integration

Unit Tests (70%)
├── Function-level testing
├── Component testing
└── Business logic validation
```

#### **Test Quality Requirements**
- **Fast Execution**: Unit tests <1ms each
- **Reliable**: No flaky or intermittent failures
- **Maintainable**: Easy to update when code changes
- **Comprehensive**: Cover edge cases and error conditions

### **Compliance Monitoring**

#### **Automated Checks**
- **Code Quality**: Linting and static analysis
- **Test Coverage**: Automated coverage reporting
- **Security**: Vulnerability scanning
- **Performance**: Automated performance testing

#### **Manual Reviews**
- **Architecture Compliance**: PMA reviews for ROME adherence
- **Quality Gates**: Milestone reviews before proceeding
- **Cross-Robot Integration**: Validation of interfaces
- **Documentation Review**: Accuracy and completeness checks

---

## Troubleshooting Common Issues

### **Robot Setup Problems**

#### **Issue**: Robot directory not created properly
**Solution**:
```bash
# Verify directory structure
ls -la claude_[robot_name]/
# Recreate if missing
mkdir -p claude_[robot_name]
cd claude_[robot_name]
```

#### **Issue**: Startup script not executable
**Solution**:
```bash
chmod +x claude-start.sh
# Test execution
./claude-start.sh
```

#### **Issue**: Missing or incomplete CLAUDE.md
**Solution**: Use the template provided in Step 3 of Robot Creation Process

### **Task Execution Problems**

#### **Issue**: Cannot access actionlist.md
**Solution**:
```bash
# Check file path
ls -la ../actionlist.md
# Verify current directory
pwd
# Should be in claude_[robot_name]/ directory
```

#### **Issue**: Conflicting task assignments
**Solution**: Escalate to PMA immediately with details

#### **Issue**: Missing dependencies
**Solution**: Check project_activity.status for dependency status, coordinate with providing robot

### **Coordination Problems**

#### **Issue**: Handoff artifacts not received
**Solution**:
1. Check project_tasks.log for handoff record
2. Contact providing robot directly
3. Escalate to PMA if no response within 4 hours

#### **Issue**: Unclear requirements or specifications
**Solution**:
1. Document specific questions
2. Request clarification from PMA
3. Do not proceed with assumptions

---

## Success Metrics

### **Robot Performance Indicators**
- **Task Completion Rate**: Percentage of tasks completed on time
- **Quality Score**: Combination of test coverage, documentation, and review scores
- **Coordination Effectiveness**: Successful handoffs and minimal blockers
- **Compliance Rate**: Adherence to 7-step protocol and quality standards

### **Team Collaboration Metrics**
- **Handoff Success Rate**: Percentage of clean handoffs between robots
- **Blocker Resolution Time**: Average time to resolve blocking issues
- **Communication Quality**: Clarity and timeliness of status updates
- **Integration Success**: Successful module integration rates

### **Project Health Indicators**
- **Schedule Adherence**: On-time delivery of modules and milestones
- **Quality Gates**: Percentage of modules meeting quality standards
- **Technical Debt**: Accumulation of shortcuts or compromises
- **Stakeholder Satisfaction**: Acceptance of deliverables

---

**Document Status**: Comprehensive Robot Developer Guide  
**Usage**: Primary reference for all robot creation and management  

## Robot Session Management

### **Automated Multi-Robot Launcher**
Instead of manually opening multiple terminal sessions, use the automated orchestration tools:

#### **Quick Launch (Recommended)**
```bash
# From project root
./rome_robots.sh go

# Or from ROME/robot_scripts directory  
cd ROME/robot_scripts
./launch_robots.sh go

# Stop all robots
./launch_robots.sh stop

# Check robot status
./launch_robots.sh check
```

#### **Advanced Orchestration**
```bash
# Navigate to robot scripts directory
cd ROME/robot_scripts

# Start specific robots
./rome_orchestrator.sh start claude_reena claude_luc

# Show detailed status
./rome_orchestrator.sh status

# Restart all robots
./rome_orchestrator.sh restart
```

#### **TMux Session Management (Power Users)**
```bash
# Navigate to robot scripts directory
cd ROME/robot_scripts

# Start all robots in single tmux session
./rome_tmux_launcher.sh start

# Attach to session (switch between robots with Ctrl+B, w)
./rome_tmux_launcher.sh attach

# Stop tmux session
./rome_tmux_launcher.sh stop
```

### **Benefits of Automated Launching**
- **One Command**: Start all robots simultaneously
- **Process Tracking**: Automatic PID management
- **Terminal Titles**: Clear identification of each robot
- **Clean Shutdown**: Proper cleanup of all sessions
- **Status Monitoring**: Real-time view of active robots
- **Cross-Platform**: Works on macOS and Linux

**Cross-References**:
- See: [Module Design Principles](module_design_principles.md)
- See: [Project Coordination](project_coordination.md)  
- See: [Project Setup](project_setup.md)
- See: Individual Role Specifications (role_spec_*.md)