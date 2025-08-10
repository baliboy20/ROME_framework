# 🎯 ROME System Quick Reference

## 🚀 Essential Commands

### **Start System**
```bash
cd services/vdb-management && npm start
# ✅ http://localhost:8081 (VDB Service)
# ✅ http://localhost:8088 (Weaviate)
```

### **Health Check**
```bash
curl http://localhost:8081/health
```

## 🤖 Robot Types & Roles

| Robot | Role | Primary Tasks |
|-------|------|---------------|
| **PMA** | Coordination | Approve contracts, resolve blockers, track progress |
| **Backend** | Server Dev | APIs, databases, server logic |
| **Frontend** | UI/UX | Components, user interfaces, interactions |
| **Data** | Data Engineering | Schemas, pipelines, analytics |
| **DevOps** | Infrastructure | Deployment, monitoring, CI/CD |
| **QA** | Testing | Quality assurance, validation, testing |

## 📋 8-Step TDD Protocol

| Step | Name | Focus |
|------|------|-------|
| 1 | **Read** | Understand requirements |
| 2 | **Outline** | Plan implementation |
| 3 | **Model** | Design data structures |
| 4 | **Establish** | Set up environment |
| 5 | **Transform** | Implement logic |
| 6 | **Test** | Verify functionality |
| 7 | **Deploy** | Release to production |
| 8 | **Document** | Update documentation |

## 🛠️ MCP Tools Cheat Sheet

### **📚 Guidance Tools** (Read-Only)
```bash
search_rome_docs(query, category, robot_role)
get_rome_standards(standard_type, robot_role)  
get_contract_template(type, robot_role)
check_roma_approval(contract_type, contract_content)
get_robot_protocol(robot_role, protocol_step)
validate_integration_contract(contract_data)
get_coordination_status()
```

### **🔄 Coordination Tools** (Updates State)
```bash
update_robot_status(robot_role, protocol_step, task_progress)
update_actionlist(updates)
report_integration_status(integration_type, test_results)
resolve_blocker(blocker_id, resolution_summary)
add_dependency(from_robot, to_robot, dependency_type)
```

## 🏃‍♂️ Common Workflows

### **Start Your Work Session**
```bash
1. get_coordination_status()           # Check project state
2. get_robot_protocol(role, step)      # Get current step guidance  
3. search_rome_docs(query, category)   # Find relevant docs
4. update_robot_status(role, step, 0)  # Mark step started
```

### **During Development**
```bash
1. get_contract_template(type, role)   # Get templates
2. check_roma_approval(contract)       # Validate contracts
3. update_robot_status(role, step, 50) # Update progress
4. add_dependency(from, to, type)      # Track dependencies
```

### **Complete a Task**
```bash
1. report_integration_status(type, results) # Report results
2. update_robot_status(role, step, 100)     # Mark complete
3. resolve_blocker(id, resolution)          # Clear blockers
4. update_robot_status(role, next_step, 0)  # Start next step
```

## 📂 Document Categories

| Category | Purpose | Examples |
|----------|---------|----------|
| **protocols** | TDD methodology steps | "Step 3: Model Design" |
| **standards** | Coding & quality standards | "API Response Format" |
| **contracts** | Component/API contracts | "User Service Contract" |
| **coordination** | Project management | "Sprint Planning Guide" |
| **templates** | Reusable templates | "API Contract Template" |
| **validation** | Testing & approval | "Code Review Checklist" |
| **integration** | System integration | "Database Connection Guide" |

## 🌐 API Endpoints

### **Documents**
```bash
POST /api/v1/documents/search        # Semantic search
POST /api/v1/documents               # Create document
GET  /api/v1/documents/categories    # List categories
GET  /api/v1/documents/stats         # Document statistics
```

### **Coordination**
```bash
GET  /api/v1/coordination/status           # Project overview
PUT  /api/v1/coordination/robot/status     # Update robot status
GET  /api/v1/coordination/robot/:role/status # Get robot status
PUT  /api/v1/coordination/actionlist       # Update action list
```

### **Integration**
```bash
GET  /api/v1/integration/readiness     # Integration readiness
POST /api/v1/integration/status        # Report integration status
POST /api/v1/integration/blocker/resolve # Resolve blocker
```

### **Contracts**
```bash
GET  /api/v1/contracts/template/:type    # Get contract template
POST /api/v1/contracts/roma/validate     # ROMA validation
POST /api/v1/contracts/integration/validate # Integration validation
```

## 🚨 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| **Port 8081 connection refused** | `npm start` in vdb-management |
| **Weaviate connection failed** | Check port 8088: `curl localhost:8088/v1/meta` |
| **Empty search results** | Add documents first via POST /documents |
| **MCP tools not working** | Check MCP server on port 3000 |
| **Permission errors** | Check CORS settings |

## 💡 Pro Tips

- **Always search first**: Use `search_rome_docs()` before implementing
- **Update status frequently**: Keep team informed of progress
- **Validate contracts early**: Use `check_roma_approval()` before building
- **Track dependencies**: Use `add_dependency()` to avoid blockers
- **Check coordination daily**: Use `get_coordination_status()` for overview

## 🔗 Key URLs
- **VDB Service**: http://localhost:8081
- **Health Check**: http://localhost:8081/health  
- **Weaviate**: http://localhost:8088
- **Service Info**: http://localhost:8081/

---
*Keep this reference handy during development! 🤖⚡*