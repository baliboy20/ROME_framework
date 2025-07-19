## ROME Methodology - Detailed Summary

### **ROME (Robot Methodology)**
Systematic software development framework using specialized robot developers (Rodeos) with defined protocols and structured task management.

### **Key Roles**

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

### **Hierarchical Structure**
```
Project (root)
├── Module (discrete functionality unit)
│   ├── Step (logical task grouping)
│   │   └── Task (atomic work unit)
```

### **Development Phases**

**1. PMA Review Stage**
- Input: PRD + SRS documents
- Output: Gap analysis, improvement suggestions
- Action: Document review for completeness

**2. System Design Production**
- Technical architecture definition
- Module boundaries establishment
- Library selection/specification
- UI design creation
- Deployment specification

**3. User Approval Gate**
- Mandatory checkpoint before development

**4. Development Planning**
- Module step definition
- Resource allocation
- Rodeo assignment
- Business requirement mapping
- ROME conformance review

**5. Execution Phase**
- Sequential task completion
- 7-step protocol per task
- Continuous status updates
- Blocker escalation

### **7-Step Task Protocol**
1. Review module/tasks
2. Log start time/status
3. Execute per specifications
4. Test/verify implementation
5. Log completion/issues
6. Update activity status
7. Proceed to next task

### **Core Documents**
- **Requirements**: PRD, SRS
- **Templates**: project_activity.status_template.md, project_tasks_log.template.txt
- **Protocols**: robot_action_protocols.md
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