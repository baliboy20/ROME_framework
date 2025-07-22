# Coordination Matrix
## Farm Weather App PoC

### Inter-Robot Dependencies

| From Robot | To Robot | Dependency | Type | Status |
|------------|----------|------------|------|--------|
| DevOps | Backend | Project structure must exist | BLOCKING | PENDING |
| DevOps | Frontend | Project structure must exist | BLOCKING | PENDING |
| Backend | Frontend | API endpoint URL and format | SEMI-BLOCKING | PENDING |
| Frontend | Backend | API endpoint must be running | SEMI-BLOCKING | PENDING |
| Backend | DevOps | Server configuration needed | INFO | PENDING |
| Frontend | DevOps | Static file serving setup | SEMI-BLOCKING | PENDING |
| Roma | All Robots | Progress monitoring and coordination | INFO | PENDING |

### Communication Points

#### 1. Project Structure Handoff
**Owner**: DevOps (Luc)
**Consumers**: Backend (Reena), Frontend (Charlie)
**Artifact**: Directory structure in ../../PROJECT/SOURCE/
**Status**: PENDING

#### 2. API Contract
**Owner**: Backend (Reena)
**Consumer**: Frontend (Charlie)
**Artifact**: 
```
GET http://localhost:3301/api/weather
Response: {
  "weather": "Today's weather: Sunny and 72°F - Perfect for farm work!",
  "timestamp": "2025-07-22T10:30:00Z"
}
```
**Status**: PENDING

#### 3. CORS Configuration
**Owner**: Backend (Reena)
**Consumer**: Frontend (Charlie)
**Artifact**: CORS middleware allowing localhost:3301, 3302, 8094
**Status**: PENDING

#### 4. Static File Serving
**Owner**: DevOps (Luc)
**Consumers**: Backend (Reena), Frontend (Charlie)
**Artifact**: Express static configuration
**Status**: PENDING

### Conflict Resolution Protocol

1. **Resource Conflicts**
   - File conflicts: Later robot must coordinate with earlier robot
   - Port conflicts: Use documented ports (3301, 3302, 8094)
   - Directory conflicts: Follow SOURCE structure

2. **Technical Conflicts**
   - API changes: Backend notifies Frontend via project_tasks.log
   - Structure changes: DevOps notifies all via project_activity.status
   - Integration issues: Escalate to PMA

3. **Timing Conflicts**
   - Blocking dependencies: Waiting robot logs status
   - Integration delays: Update project_activity.status
   - Testing blockers: Coordinate through PMA

### Integration Sync Points

| Sync Point | Participants | Purpose | Trigger |
|------------|--------------|---------|---------|
| Structure Complete | DevOps → All | Begin development | SOURCE dirs created |
| API Ready | Backend → Frontend | Begin integration | Endpoint responding |
| Frontend Ready | Frontend → Backend | Test integration | UI complete |
| Integration Complete | All → PMA | Begin testing | Both connected |

### Escalation Path

1. **Technical Issues**: Robot → project_tasks.log → PMA
2. **Blocking Issues**: Robot → project_activity.status → PMA → Resolution
3. **Integration Issues**: Both Robots → coordination_matrix.md → PMA

---

*This matrix ensures smooth coordination between all robot developers*