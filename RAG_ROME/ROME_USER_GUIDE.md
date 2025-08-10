# 🤖 ROME System User Guide
*Robot-Orchestrated Methodology for Excellence*

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- Node.js 18+
- Docker (with Weaviate running on port 8088)
- Claude Code CLI

### 1. Start the System
```bash
# Navigate to VDB Management Service
cd services/vdb-management

# Install dependencies (first time only)
npm install

# Start the VDB Management Service
npm start
# ✅ Service running on http://localhost:8081
# ✅ Connected to Weaviate on http://localhost:8088
```

### 2. Test Your First Search
```bash
# Search for ROME methodology documents
curl -X POST http://localhost:8081/api/v1/documents/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "TDD protocol requirements",
    "rome_category": "protocols",
    "limit": 5
  }'
```

### 3. Check System Status
```bash
# Health check
curl http://localhost:8081/health

# Coordination status
curl http://localhost:8081/api/v1/coordination/status
```

**🎉 If you see JSON responses, you're ready to go!**

---

## 🎯 Core Concepts

### **The 6 Robot Types**
1. **PMA** - Project Management Authority (coordination, approval)
2. **Backend** - Server-side development
3. **Frontend** - UI/UX development  
4. **Data** - Database and data processing
5. **DevOps** - Infrastructure and deployment
6. **QA** - Quality assurance and testing

### **The 8-Step TDD Protocol**
1. **Read** - Understand requirements
2. **Outline** - Plan implementation
3. **Model** - Design data structures
4. **Establish** - Set up environment
5. **Transform** - Implement logic
6. **Test** - Verify functionality
7. **Deploy** - Release to production
8. **Document** - Update documentation

### **ROME Document Categories**
- **protocols** - TDD methodology steps
- **standards** - Coding and quality standards
- **contracts** - API and component contracts
- **coordination** - Project management docs
- **templates** - Reusable templates
- **validation** - Testing and approval processes
- **integration** - System integration guides

---

## 🛠️ MCP Tools Reference

### **Guidance Tools** (Read-Only Information)

#### `search_rome_docs`
Find ROME methodology documents using semantic search.
```json
{
  "query": "error handling best practices",
  "rome_category": "standards",
  "robot_role": "backend",
  "limit": 10
}
```

#### `get_rome_standards`  
Get specific TDD and coding standards.
```json
{
  "standard_type": "api_design",
  "robot_role": "backend"
}
```

#### `get_contract_template`
Generate contract templates for different components.
```json
{
  "contract_type": "api",
  "robot_role": "backend"
}
```

#### `check_roma_approval`
Validate contracts against ROME standards.
```json
{
  "contract_type": "component",
  "contract_content": "interface UserProfile { id: string; name: string; }"
}
```

#### `get_robot_protocol`
Get specific guidance for protocol steps.
```json
{
  "robot_role": "frontend",
  "protocol_step": 3
}
```

#### `validate_integration_contract`
Verify integration compatibility.
```json
{
  "contract_data": {
    "api_endpoint": "/users",
    "data_schema": {...}
  }
}
```

#### `get_coordination_status`
Get project overview and robot status.
```json
{}
```

### **Coordination Tools** (Update System State)

#### `update_robot_status`
Report your progress through the 8-step protocol.
```json
{
  "robot_role": "backend",
  "protocol_step": 4,
  "task_progress": 75,
  "current_task": "Implementing user authentication API",
  "recent_activity": "Completed database schema setup"
}
```

#### `update_actionlist`
Update project coordination (PMA only).
```json
{
  "project_phase": "development",
  "overall_progress": 68,
  "priority_actions": ["Complete API contracts", "Start integration testing"]
}
```

#### `report_integration_status`
Report integration test results.
```json
{
  "integration_type": "api",
  "test_results": {
    "passed": 15,
    "failed": 2,
    "coverage": 85
  },
  "readiness_score": 7.8
}
```

#### `resolve_blocker`
Mark blockers as resolved.
```json
{
  "blocker_id": "BLK001",
  "resolution_summary": "Fixed authentication timeout by increasing JWT expiry",
  "robot_role": "backend"
}
```

#### `add_dependency`
Track inter-robot dependencies.
```json
{
  "from_robot": "frontend",
  "to_robot": "backend",
  "dependency_type": "api_contract",
  "description": "User profile API needed for dashboard"
}
```

---

## 📋 Robot Workflows

### **🏢 PMA Robot Workflow**

**Role**: Project coordination, contract approval, team oversight

```bash
# 1. Check project status
get_coordination_status()

# 2. Review all robot progress  
search_rome_docs("project status reports")

# 3. Update overall project progress
update_actionlist({
  "project_phase": "development",
  "overall_progress": 75,
  "next_milestone": "Integration testing"
})

# 4. Approve contracts
check_roma_approval({
  "contract_type": "api",
  "contract_content": "..."
})

# 5. Resolve blockers
resolve_blocker({
  "blocker_id": "BLK001",
  "resolution_summary": "Approved API contract changes"
})
```

### **⚙️ Backend Robot Workflow**

**Role**: Server-side development, API implementation, database design

```bash
# 1. Get protocol guidance for current step
get_robot_protocol("backend", 3)

# 2. Search for implementation standards
search_rome_docs("API implementation patterns")

# 3. Get contract template
get_contract_template("api", "backend")

# 4. Update progress
update_robot_status({
  "robot_role": "backend",
  "protocol_step": 3,
  "task_progress": 60,
  "current_task": "Implementing user authentication endpoints"
})

# 5. Report integration status
report_integration_status({
  "integration_type": "database",
  "test_results": {"passed": 12, "failed": 1}
})
```

### **🎨 Frontend Robot Workflow**

**Role**: UI/UX development, component creation, user interaction

```bash
# 1. Get frontend-specific protocols
get_robot_protocol("frontend", 2)

# 2. Search for UI standards
search_rome_docs("component design patterns")

# 3. Get component contract template
get_contract_template("component", "frontend")

# 4. Check dependencies
get_coordination_status()

# 5. Update status
update_robot_status({
  "robot_role": "frontend", 
  "protocol_step": 2,
  "task_progress": 40,
  "current_task": "Designing user profile components"
})
```

### **📊 Data Robot Workflow**

**Role**: Database design, data processing, ETL pipelines

```bash
# 1. Get data-specific guidance
get_robot_protocol("data", 3)

# 2. Search for data standards
search_rome_docs("database schema design")

# 3. Create integration contracts
validate_integration_contract({
  "systems": ["backend", "analytics"],
  "data_contracts": {...}
})

# 4. Report data pipeline status
report_integration_status({
  "integration_type": "database",
  "readiness_score": 8.5
})
```

### **🚀 DevOps Robot Workflow**

**Role**: Infrastructure, deployment, monitoring, CI/CD

```bash
# 1. Get deployment protocols
get_robot_protocol("devops", 7)

# 2. Search for deployment standards
search_rome_docs("production deployment checklist")

# 3. Report infrastructure status
report_integration_status({
  "integration_type": "system",
  "test_results": {"infrastructure_tests": "passed"}
})

# 4. Add deployment dependencies
add_dependency({
  "from_robot": "devops",
  "to_robot": "backend",
  "dependency_type": "deployment_ready"
})
```

### **🧪 QA Robot Workflow**

**Role**: Testing, quality assurance, validation

```bash
# 1. Get testing protocols
get_robot_protocol("qa", 6)

# 2. Search for testing standards  
search_rome_docs("automated testing strategies")

# 3. Validate contracts
check_roma_approval({
  "contract_type": "performance",
  "contract_content": "Response time < 200ms"
})

# 4. Report test results
report_integration_status({
  "integration_type": "performance",
  "test_results": {
    "performance_tests": 95,
    "load_tests": 88
  }
})
```

---

## 🔧 Advanced Usage

### **Custom Document Creation**
```bash
# Add new ROME methodology documents
curl -X POST http://localhost:8081/api/v1/documents \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Custom API Testing Protocol",
    "content": "Step-by-step guide for API testing...",
    "rome_category": "protocols",
    "robot_type": "qa",
    "protocol_step": 6,
    "tags": ["api", "testing", "automation"]
  }'
```

### **Coordination Dashboard Data**
```bash
# Get comprehensive project status
curl http://localhost:8081/api/v1/coordination/status | jq '
  .coordination_status | {
    project_progress: .project_overview.overall_progress,
    active_robots: (.robot_status | length),
    blockers: (.active_blockers | length),
    integration_score: .integration_readiness.overall_score
  }'
```

### **Integration Readiness Check**
```bash
# Check if system is ready for deployment
curl http://localhost:8081/api/v1/integration/readiness | jq '
  .readiness_assessment | {
    overall_readiness: .overall_readiness,
    deployment_ready: .deployment_readiness,
    blockers: .blockers
  }'
```

---

## 🚨 Troubleshooting

### **Common Issues**

**❌ Connection Refused on Port 8081**
```bash
# Check if service is running
curl http://localhost:8081/health
# If not running: npm start
```

**❌ Weaviate Connection Failed**  
```bash
# Check Weaviate is running on port 8088
curl http://localhost:8088/v1/meta
# Start Weaviate if needed: docker-compose up weaviate
```

**❌ Empty Search Results**
```bash
# Add sample documents first
curl -X POST http://localhost:8081/api/v1/documents -d '{...}'
# Then search again
```

**❌ MCP Tools Not Working**
```bash
# Ensure MCP server is running on port 3000
# Check server logs for connection issues
```

### **Service Health Check**
```bash
# Complete system health
curl http://localhost:8081/health/ready

# Individual component status
curl http://localhost:8081/health/live
```

---

## 📊 Monitoring & Analytics

### **Document Statistics**
```bash
curl http://localhost:8081/api/v1/documents/stats
```

### **Robot Performance**
```bash
curl http://localhost:8081/api/v1/coordination/status | \
  jq '.coordination_status.robot_status[] | {robot: .robot_role, progress: .task_progress, step: .protocol_step}'
```

### **Integration Matrix**
```bash
curl http://localhost:8081/api/v1/integration/readiness | \
  jq '.readiness_assessment.integration_matrix'
```

---

## 🎓 Best Practices

### **For All Robots**
1. **Always check coordination status first** - `get_coordination_status()`
2. **Update status regularly** - After each significant task
3. **Search before implementing** - Use `search_rome_docs()` for guidance
4. **Validate contracts** - Use `check_roma_approval()` before proceeding
5. **Report blockers immediately** - Don't let issues cascade

### **For PMA Robots**
1. **Monitor all robot progress daily**
2. **Resolve blockers promptly** 
3. **Approve contracts quickly**
4. **Update project milestones regularly**
5. **Maintain dependency tracking**

### **For Development Robots**
1. **Follow the 8-step protocol strictly**
2. **Create contracts before implementation**
3. **Test integration points early**
4. **Document as you develop**
5. **Report integration status frequently**

---

## 📞 Support & Resources

### **Quick Reference**
- **VDB Management Service**: http://localhost:8081
- **Weaviate Vector DB**: http://localhost:8088  
- **MCP Server**: stdio (port 3000 for HTTP debug)

### **API Documentation**
- All endpoints return JSON
- Use `Content-Type: application/json` for POST/PUT
- Check `/health` for service status
- See `/` for endpoint list

### **Logs & Debugging**
- Service logs: Check console output from `npm start`
- Structured JSON logging enabled
- Correlation IDs in headers: `x-correlation-id`

---

*Happy robot coordinating! 🤖✨*