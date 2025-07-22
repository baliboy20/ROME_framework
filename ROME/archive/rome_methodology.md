## ROME Methodology - Detailed Summary

### **ROME (Robot Methodology)**
Systematic software development framework using specialized robot developers (Rodeos) with defined protocols and structured task management.

I 


### **Key Actors**

**PMA (Project Manager/Architect)**
- Analyzes PRD/SRS documents
- Identifies inconsistencies/omissions
- Creates comprehensive task lists
- Designs technical architecture
- Assigns modules to Rodeos
- Ensures ROME conformance

**Rodeos (Robot Developers)**
- Execute assigned module tasks
- Follow 7-step execution protocol
- Update logs/status continuously
- Communicate blockers to PMA
- Maintain code quality standards


**Experts**
- ModelContextProtocols (MCP) programs who provide insight and advice on best or established practice onto how to solve certain problems
- none yet available

**Task Structure**: See [Module Design Principles](module_design_principles.md) for complete hierarchy and design guidelines.

## Methodology Phrases

### Phase : 0 - Initial Setup
**1. PMA Purpose**
must determine or  ask the user whether the purpose of this session is to create a new system, continue the modification or complete an existing one, conduct a review, or some other purpose.

### Phase : 1 - Project Analysis and Design
**1. PMA Review Stage**

- Input: PRD + SRS documents
- Output: Gap analysis, improvement suggestions
- Action: Document review for completeness

**2. System Design Creation**
- See: [System Design Tasks and Deliverables](system_design_tasks_and_deliverables.md)


**3. Documentation Validation Stage**
- Verify Requirements Review Report exists in ./PROJECT/dev/
- Confirm System Architecture Document is complete
- Validate Development Plan and Task List (actionlist.md)
- Check Robot Configuration is properly set up
- Ensure all PMA deliverables meet ROME standards

**4. User Approval Gate**
- Mandatory checkpoint before development
- Review validated documentation package
- Approve technical architecture and approach

Phase 2 : Setup Project and Planning

2.1 Project Environment Setup
     - See: [Project Setup](project_setup.md)
2.2 Create Project coordination artifacts (task lists, documentation, etc.)
 -  See: [Project Coordination](project_coordination.md)
2.3 Perform Critical Path Analysis (CPA)
 - Classify tasks as BLOCKING, SEMI-BLOCKING, or NON-BLOCKING
 - Identify minimum viable handoffs between modules
 - Optimize parallel work opportunities


**5. Robot Setup Phase**
- Create claude_[robot_name] directories
- Generate CLAUDE.md files for each robot
- **Configure robot permissions from template (rodeo_permissions_template.json)**
- **Verify permissions setup eliminates workflow bottlenecks**
- Verify robot environment setup

**6. Development Planning**
- Module step definition
- **Critical Path Analysis (CPA)** - Distinguish blocking vs non-blocking tasks
- Resource allocation
- Rodeo assignment
- Business requirement mapping
- ROME conformance review

**7. Execution Phase**
- Sequential task completion
- 7-step protocol per task
- Continuous status updates
- Blocker escalation

### **7-Step Task Protocol**
All Robot Developers follow a standardized 7-step execution process for each task.

**Complete Protocol Details**: See [Robot Developer Guide](robot_creation_guide.md) Section 2

### **Core Documents**
- **Requirements**: PRD, SRS
- **Templates**: project_activity.status_template.md, project_tasks_log.template.txt
- **Protocols**: robot_actions_protocol.md
- **Roles**: robot_developer_roles.spec.md
- **Task Lists**: design_task_list.md

### **Module Characteristics**
- Self-contained functionality
- Minimal file/state overlap
- Independent testing capability
- Business use-case alignment
- Specific dependency management

### **Benefits**
- Parallel development enabled
- Clear accountability chains
- Quality gates enforced
- Conflict minimization
- Systematic progress tracking
- Issue visibility maintained

### **Implementation Rules**
- Sequential task execution within modules
- Mandatory logging at task boundaries
- Testing required before completion
- Status updates per task
- Blocker communication immediate
- ROME protocol adherence strict

---

## Human-Readable Summary

**What is ROME?**

ROME is a structured approach to building software using AI assistants (called "Rodeos" or "Robot Developers"). Think of it as a factory assembly line where each robot worker has a specific job and follows strict protocols.

**How it works:**

1. **The Architect (PMA)** reads your requirements and breaks down the entire project into manageable chunks called modules (like "Frontend", "Backend", "Database").

2. **Each module** is assigned to a specialized robot developer who works through a checklist of tasks in order.

3. **Robot developers** follow a simple 7-step process for each task:
   - Read what needs to be done
   - Log when they start
   - Do the work
   - Test it works
   - Log when they finish (and any problems)
   - Update the project status
   - Move to the next task

4. **Everything is tracked** - who's doing what, when they started, when they finished, and what issues they encountered.

**Why use ROME?**

- **No conflicts**: Each robot works on separate parts, so they don't step on each other's toes
- **Clear progress**: You always know what's done and what's left to do
- **Quality control**: Every task must be tested before moving on
- **Easy to manage**: Problems are caught and reported immediately
- **Scalable**: Add more robots to work on different modules simultaneously

**In simple terms**: ROME turns chaotic software development into an organized, trackable process where multiple AI assistants can work together efficiently without creating conflicts or losing track of progress.