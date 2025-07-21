# ROME Project Coordination Processes

## Overview
Defines coordination mechanisms between robots (Rodeos) during project execution phase. All coordination follows ROME 7-step protocol and maintains clear accountability chains.

---

## Core Coordination Artifacts

### **actionlist.md**
- Master task registry
- Module → Step → Task hierarchy
- Robot assignments and dependencies
- Critical path definition

### **PROJECT/dev/project_activity.status**
- Real-time module progress tracking
- Robot status updates
- Blocker identification
- Completion percentages

### **PROJECT/dev/project_tasks.log**
- Chronological task execution log
- Robot activity timestamps
- Issue escalation records
- Cross-robot handoff documentation

---

## Coordination Protocols

### **1. Task Execution Protocol**
Each robot follows standardized 7-step process:
1. **Review** → Read assigned tasks from actionlist.md
2. **Log Start** → Update project_activity.status with task initiation
3. **Execute** → Perform implementation per specifications
4. **Test** → Validate functionality within scope
5. **Log Completion** → Record results, issues, handoffs in project_tasks.log
6. **Update Status** → Mark progress in project_activity.status
7. **Proceed** → Move to next sequential task

### **2. Inter-Robot Handoff Protocol**
**Triggering Event**: Task completion affects another robot's work

**Process**:
- **Completing Robot**: Logs handoff details in project_tasks.log
- **Receiving Robot**: Validates handoff artifacts before proceeding
- **PMA Notification**: Both robots notify PMA of handoff completion
- **Status Update**: project_activity.status reflects dependency resolution

**Format**:
```
HANDOFF: [DATE] [ROBOT_FROM] → [ROBOT_TO] - [MODULE.STEP.TASK]
ARTIFACTS: [List of deliverables]
VALIDATION: [Receiving robot confirmation]
```

### **3. Blocker Escalation Protocol**
**Triggering Event**: Robot cannot proceed due to dependency or issue

**Immediate Actions**:
- **Stop Work**: Halt current task execution
- **Log Blocker**: Record in project_tasks.log with BLOCKER tag
- **Notify PMA**: Direct escalation to Project Manager/Architect
- **Update Status**: Mark module as BLOCKED in project_activity.status

**PMA Response Protocol**:
- **Assess Impact**: Evaluate critical path implications
- **Coordinate Resolution**: Engage relevant robots for solution
- **Update Timeline**: Adjust project schedule if necessary
- **Clear Blocker**: Authorize resumption of work

### **4. Parallel Work Coordination**
**Scenario**: Multiple robots working on independent modules simultaneously

**Coordination Rules**:
- **No Shared Files**: Robots avoid simultaneous edits to same files
- **API Contracts**: Backend defines interfaces before frontend implementation
- **Status Broadcasting**: Regular updates prevent conflict
- **Integration Points**: Clearly defined handoff boundaries

**Conflict Resolution**:
- **Detection**: Robot identifies potential conflict
- **Immediate Stop**: Cease conflicting work
- **PMA Arbitration**: Project Manager resolves priority
- **Sequential Execution**: Resume work in determined order

---

## Communication Patterns

### **Daily Coordination Cycle**
**Morning Sync** (Start of work):
- Each robot reviews project_activity.status
- Identifies dependencies and handoffs
- Plans daily task sequence

**Continuous Updates**:
- Real-time logging in project_tasks.log
- Status updates after each task completion
- Immediate blocker escalation

**Evening Summary**:
- Progress validation against actionlist.md
- Next-day dependency identification
- PMA review of daily progress

### **Cross-Functional Coordination**

#### **Backend ↔ Frontend**
- **API Contract Definition**: Backend specifies endpoints before frontend work
- **Data Model Alignment**: Shared understanding of data structures
- **Integration Testing**: Joint validation of API interactions

#### **Infrastructure ↔ Application**
- **Environment Readiness**: DevOps confirms setup before application deployment
- **Resource Allocation**: Infrastructure provides capacity specifications
- **Deployment Coordination**: Sequenced release process

#### **Data Architecture ↔ All Teams**
- **Schema Validation**: Data architect approves all data models
- **Test Data Provision**: Centralized test dataset management
- **Quality Gates**: Data integrity validation at module boundaries

---

## Conflict Resolution Framework

### **Type 1: Resource Conflicts**
**Scenario**: Multiple robots need same resource simultaneously
**Resolution**: PMA assigns time slots or resource allocation priority

### **Type 2: Technical Conflicts**
**Scenario**: Incompatible technical approaches between robots
**Resolution**: Technical review meeting → PMA architectural decision

### **Type 3: Dependency Conflicts**
**Scenario**: Circular or unclear dependencies between modules
**Resolution**: Dependency restructuring → actionlist.md update

### **Type 4: Timeline Conflicts**
**Scenario**: Critical path disruption due to delays
**Resolution**: Schedule rebaseline → stakeholder communication

---

## Quality Gates

### **Module Completion Gates**
Before marking module as COMPLETED:
- [ ] All assigned tasks executed per 7-step protocol
- [ ] Integration points validated with dependent modules
- [ ] Handoff artifacts delivered to downstream robots
- [ ] Test coverage meets specified thresholds
- [ ] Documentation updated and accessible

### **Cross-Module Integration Gates**
Before proceeding to next phase:
- [ ] All module interfaces validated
- [ ] End-to-end functionality demonstrated
- [ ] Performance benchmarks achieved
- [ ] Security requirements satisfied
- [ ] PMA sign-off obtained

---

## Monitoring and Reporting

### **Progress Tracking Metrics**
- **Task Velocity**: Tasks completed per robot per day
- **Dependency Resolution Time**: Blocker clearance speed
- **Handoff Efficiency**: Time between completion and pickup
- **Quality Metrics**: Defect rates and rework frequency

### **Coordination Health Indicators**
- **Communication Lag**: Time between status updates
- **Conflict Frequency**: Number of escalations per week
- **Resource Utilization**: Robot workload distribution
- **Critical Path Adherence**: Schedule variance tracking

### **Escalation Triggers**
- **Blocker Duration**: >4 hours without resolution
- **Handoff Delay**: >24 hours for dependency pickup
- **Quality Gate Failure**: Test coverage or performance miss
- **Timeline Variance**: >20% deviation from planned schedule

---

## Success Criteria

### **Coordination Effectiveness**
- Zero critical path disruptions due to coordination failures
- <2 hour average blocker resolution time
- 100% handoff artifact validation success rate
- Real-time visibility into all robot activities

### **Quality Maintenance**
- All coordination artifacts maintained and current
- No module rework due to coordination gaps
- Clear audit trail for all inter-robot interactions
- Proactive conflict identification and resolution

---

**Implementation Note**: All robots must follow these coordination protocols. PMA enforces compliance and adjusts processes based on project-specific needs.