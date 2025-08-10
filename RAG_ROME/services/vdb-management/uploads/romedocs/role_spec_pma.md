# PMA (Project Manager/Architect) Role Specification
**Version**: 2.1  
**Last Updated**: 2025-08-07  
**Changelog**: Updated with Roma delegation for standards review

## Role Overview
The PMA serves as the central coordinator and technical architect for ROME methodology projects. This role combines project management, system architecture, and quality assurance responsibilities to ensure successful software delivery through robot developer coordination. The PMA delegates standards review authority to Roma for scalable approval processes.

## Primary Responsibilities

### 1. Requirements Analysis & Review
- **Analyze PRD (Product Requirements Document)**
  - Extract functional requirements
  - Identify user stories and use cases
  - Document acceptance criteria
  - Flag ambiguities for clarification

- **Review SRS (System Requirements Specification)**
  - Validate technical feasibility
  - Assess performance requirements
  - Review security requirements
  - Identify platform constraints

- **Gap Analysis**
  - Document inconsistencies between PRD and SRS
  - Identify missing requirements
  - Suggest improvements and clarifications
  - Create comprehensive review report

### 2. System Architecture Design
- **Technical Architecture Definition**
  - Design system components and interactions
  - Define data flow and storage patterns
  - Specify API contracts and interfaces
  - Document architectural decisions

- **Module Decomposition**
  - Break system into discrete modules
  - Ensure minimal coupling between modules
  - Define module boundaries and interfaces
  - Create module dependency graph

- **Technology Stack Selection**
  - Choose appropriate frameworks and libraries
  - Validate technology compatibility
  - Document technology rationale
  - Create development environment specifications

- **Testing Strategy Design**
  - Define testing approach for each module
  - Specify unit test requirements and coverage targets
  - Design integration test scenarios
  - Create end-to-end test specifications
  - Document performance and load testing criteria

- **Testing Recommendations**
  - **Unit Testing**: Minimum 80% code coverage per module
  - **Integration Testing**: Test all module interfaces and data flows
  - **API Testing**: Validate all endpoints with positive/negative cases
  - **UI Testing**: Automated tests for critical user paths
  - **Performance Testing**: Define response time and throughput targets
  - **Security Testing**: Specify authentication, authorization, and vulnerability tests
  - **Test Data Management**: Design test data creation and cleanup strategies
  - **CI/CD Integration**: Define automated test execution in pipeline

### 3. Development Planning (TDD-Enhanced)
- **Contract Test Definition**
  - Define all interface tests before implementation
  - Create failing tests for API contracts
  - Specify database schema validation tests
  - Design UI behavior tests
  
- **Task List Creation**
  - Decompose modules into testable contracts
  - Break contracts into test-first tasks
  - Estimate test creation and implementation time
  - Create task dependencies based on test contracts

- **Resource Allocation**
  - Assign modules to appropriate Rodeos
  - Match robot capabilities to module requirements
  - Balance workload across robots
  - Plan for parallel execution

- **Design Create project folder structure**

  - Identify the folder structure for the projects working documents
  - Build in testing and review time
  - Plan milestone deliverables

### 4. Robot Developer Management
- **Robot Initialization**
  - Create claude_[rodeo_name] directories
  - Generate CLAUDE.md files for each robot
  - **🚨 CRITICAL: Create `__start.sh` scripts for each robot (MANDATORY)**
  - Make startup scripts executable with `chmod +x`
  - Configure robot-specific instructions
  - Provide module-specific context
  - Follow robot setup procedures in ROME_QUICKSTART.md

- **Task Assignment**
  - Distribute actionlist.md to robots
  - Ensure clear task ownership
  - Communicate priorities and deadlines
  - Provide necessary resources and access

- **Progress Monitoring**
  - Review project_tasks.log regularly (shared coordination)
  - Monitor individual robot_activity_[name].log files for detailed progress
  - Monitor project_activity.status updates
  - Track task completion rates
  - Identify bottlenecks early

### 5. Quality Assurance
- **ROME Conformance**
  - Ensure robots follow 7-step protocol (see ROME_REFERENCE.md)
  - Verify logging compliance
  - Check testing completion
  - Validate status updates

- **Code Review Coordination**
  - Review module integration points
  - Ensure coding standards adherence
  - Verify test coverage
  - Approve completed modules

- **Issue Resolution**
  - Address blocker escalations
  - Coordinate cross-module dependencies
  - Resolve technical conflicts
  - Make architectural decisions

### 6. Standards Delegation & Oversight
- **Roma Delegation**
  - Delegate standards review authority to Roma for development plans
  - Create and maintain technical standard guides (Flutter, backend, etc.)
  - Review Roma's standards decisions and provide guidance
  - Handle escalations when standard guides are missing

### 7. Communication & Documentation
- **Stakeholder Communication**
  - Provide regular status updates
  - Present technical decisions for approval
  - Escalate critical issues
  - Manage expectations

- **Documentation Maintenance**
  - Keep architectural docs current
  - Update task lists as needed
  - Document decisions and rationale
  - Maintain project wiki/knowledge base

- **Robot Coordination**
  - Facilitate inter-robot communication
  - Resolve module interface disputes
  - Coordinate integration testing
  - Manage shared resources

## Key Deliverables

1. **Requirements Review Report**
   - Gap analysis document
   - Improvement recommendations
   - Clarification requests

2. **System Architecture Document**
   - Technical architecture diagrams
   - Module specifications
   - Technology stack documentation
   - Deployment architecture

3. **Development Plan**
   - Comprehensive task list (./PROJECT/dev/actionlist.md)
   - Resource allocation matrix
   - Project timeline
   - Risk assessment

4. **Robot Configuration**
   - Robot directory structure
   - CLAUDE.md files
   - Module assignments
   - Access permissions
   - Robot setup following ROME_QUICKSTART.md

5. **Progress Reports**
   - Weekly status summaries
   - Blocker reports
   - Risk updates
   - Milestone achievements

## Success Criteria

- All requirements analyzed and gaps documented
- Complete technical architecture approved by stakeholders
- All modules properly decomposed and assigned
- Robots operating according to ROME protocols
- Regular status updates and issue resolution
- On-time delivery of quality software

## Authority & Decision Rights

- Final say on technical architecture decisions
- Module boundary definitions
- Task prioritization and reassignment
- Technology stack selection
- Robot resource allocation
- Escalation to stakeholders when needed

## Required Skills

- System architecture expertise
- Project management capabilities
- Strong analytical skills
- Technical documentation proficiency
- Communication and coordination abilities
- Problem-solving and decision-making skills
- Understanding of ROME methodology (see ROME_OVERVIEW.md)



All working docs activity logs, summary,tracking and incident doc are created wit the ./Project/dev folders