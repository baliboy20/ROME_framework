# 🚀 Will's ROME Operation Cheat Sheet

*The definitive guide to running and managing the ROME system*

## 🎯 **Quick Service Names**
- **ROME VDB Management Service** → The main backend service and web console (port 8081)
- **Weaviate Vector Database** → Vector storage (port 8088)

---

## ⚡ **Essential Commands**

### **🔥 Fire Up the Full System**
```bash
# 1. Start ROME VDB Service (includes web console)
cd services/vdb-management
npm start
# ✅ API running on http://localhost:8081/api
# ✅ Console running on http://localhost:8081/dashboard

# 2. Verify Weaviate is running
curl http://localhost:8088/v1/meta
# ✅ Should return Weaviate version info
```

### **🏥 Health Check Everything**
```bash
# Quick system health check
curl http://localhost:8081/health    # ROME service
curl http://localhost:8088/v1/meta   # Weaviate

# All should return success/healthy status
```

---

## 🖥️ **Management Console (Recommended)**

**Best way to use ROME - visual dashboard with real-time updates:**

```bash
# Start ROME service (console included)
cd services/vdb-management && npm start

# Open browser to dashboard
open http://localhost:8081/dashboard
```

**Console Features:**
- 📊 **Live Project Dashboard** - progress, active robots, documents
- 🤖 **Robot Status Panel** - see all robots and their TDD steps  
- 🔍 **Document Search** - semantic search through ROME knowledge
- ⚡ **Quick Actions** - refresh, integration status, contracts
- 🔄 **Auto-refresh** - updates every 30 seconds

---

## 🤖 **Robot Operations (API)**

### **Update Your Robot Status**
```bash
# Report progress as Backend robot
curl -X PUT http://localhost:8081/api/v1/coordination/robot/status \
  -H "Content-Type: application/json" \
  -d '{
    "robot_role": "backend",
    "protocol_step": 4,
    "task_progress": 80,
    "current_task": "Implementing authentication endpoints",
    "recent_activity": "Completed database schema and API contracts"
  }'
```

### **Check Project Status**
```bash
# Get coordination dashboard data
curl -s http://localhost:8081/api/v1/coordination/status | jq '
  .coordination_status | {
    project: .project_overview.project_name,
    progress: .project_overview.overall_progress,
    phase: .project_overview.current_phase,
    robots: (.robot_status | length),
    blockers: (.active_blockers | length)
  }'
```

---

## 📚 **Document Operations**

### **Search ROME Knowledge**
```bash
# Semantic search for TDD guidance
curl -X POST http://localhost:8081/api/v1/documents/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "API design best practices",
    "rome_category": "standards",
    "robot_role": "backend",
    "limit": 5
  }'
```

### **Add New ROME Document**
```bash
# Add protocol documentation
curl -X POST http://localhost:8081/api/v1/documents \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Custom Testing Protocol",
    "content": "Detailed testing procedures for ROME methodology...",
    "rome_category": "protocols",
    "robot_type": "qa",
    "protocol_step": 6,
    "tags": ["testing", "qa", "validation"]
  }'
```

---

## 📋 **Contract Management**

### **Get Contract Templates**
```bash
# Get API contract template for backend work
curl "http://localhost:8081/api/v1/contracts/template/api?robot_role=backend"

# Get component contract for frontend work  
curl "http://localhost:8081/api/v1/contracts/template/component?robot_role=frontend"
```

### **Validate Contract with ROMA**
```bash
# Check if contract meets ROME standards
curl -X POST http://localhost:8081/api/v1/contracts/roma/validate \
  -H "Content-Type: application/json" \
  -d '{
    "contract_type": "api",
    "contract_content": "POST /users - Creates user account...",
    "robot_role": "backend"
  }'
```

---

## 🔗 **Integration & Dependencies**

### **Report Integration Status**
```bash
# Report test results and readiness
curl -X POST http://localhost:8081/api/v1/integration/status \
  -H "Content-Type: application/json" \
  -d '{
    "integration_type": "api",
    "test_results": {"passed": 28, "failed": 2, "coverage": 87},
    "readiness_score": 8.5,
    "robot_role": "backend"
  }'
```

### **Add Cross-Robot Dependency**
```bash
# Track that Frontend needs Backend API
curl -X POST http://localhost:8081/api/v1/coordination/dependency \
  -H "Content-Type: application/json" \
  -d '{
    "from_robot": "frontend",
    "to_robot": "backend", 
    "dependency_type": "api_contract",
    "description": "Need user authentication API for login component"
  }'
```

---

## 🚨 **Troubleshooting**

### **Common Issues**

| Problem | Solution |
|---------|----------|
| **Port 8081 in use** | `lsof -ti:8081 \| xargs kill` |
| **Weaviate not responding** | Check Docker: `docker ps` |
| **Console shows offline** | Restart ROME service first |
| **Empty search results** | Add documents first via POST /documents |
| **CORS errors** | Use console instead of direct API calls |

### **Service Restart Sequence**
```bash
# 1. Stop ROME service
pkill -f "node.*8081"  # Stop ROME service

# 2. Check Weaviate is running
curl http://localhost:8088/v1/meta

# 3. Start ROME service (includes console)
cd services/vdb-management && npm start

# 4. Verify health
curl http://localhost:8081/health
open http://localhost:8081/dashboard
```

---

## 💡 **Will's Pro Tips**

### **🎯 Daily Workflow**
1. **Start with Console** - Open http://localhost:8081/dashboard for visual overview
2. **Check Robot Status** - See who's working on what in real-time
3. **Search Before Building** - Use semantic search to find existing solutions
4. **Update Progress Frequently** - Keep team informed via robot status updates
5. **Validate Contracts Early** - Use ROMA validation before implementation

### **🔍 Power Search Queries**
```bash
# Find implementation patterns
"error handling best practices"
"database connection patterns" 
"authentication middleware design"

# Find protocol guidance  
"TDD step 3 modeling requirements"
"integration testing strategies"
"code review checklist"
```

### **📊 Monitoring Shortcuts**
```bash
# Quick status aliases (add to ~/.zshrc or ~/.bashrc)
alias rome-status="curl -s http://localhost:8081/api/v1/coordination/status | jq '.coordination_status.project_overview'"
alias rome-robots="curl -s http://localhost:8081/api/v1/coordination/status | jq '.coordination_status.robot_status'"
alias rome-health="curl -s http://localhost:8081/health"
alias rome-console="open http://localhost:8081/dashboard"
```

### **🚀 Performance Tips**
- **Use Console for monitoring** - Faster than curl commands
- **Batch status updates** - Don't update after every small change
- **Search with categories** - Faster and more relevant results
- **Auto-refresh is enabled** - Console updates every 30 seconds automatically

---

## 🔗 **Key URLs to Bookmark**

- **📊 Management Console**: http://localhost:8081/dashboard
- **🔧 ROME API**: http://localhost:8081/api
- **💾 Weaviate**: http://localhost:8088
- **📋 API Info**: http://localhost:8081/api (endpoint list)

---

**🎯 The console is your best friend - use it for daily operations and fall back to API calls for automation!**

*Keep this cheat sheet handy during ROME development sessions* 📌