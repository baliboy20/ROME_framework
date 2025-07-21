# ROME Monitoring Console - System Requirements Specification

## Architecture

### Components
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Console   │◄──►│  Monitor API    │◄──►│   Data Layer    │
│  (Frontend)     │    │   (Express)     │    │   (Logs/DB)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   WebSocket     │
                       │  (Real-time)    │
                       └─────────────────┘
```

### Data Sources
1. **MCP Server Logs** - Connection events, query logs
2. **Weaviate Metrics** - Database health, query performance
3. **File Watcher** - Document monitoring status
4. **System Stats** - CPU, memory, disk usage

## Technical Specifications

### 1. Monitor API (Node.js/Express)

**Endpoints:**
```
GET /api/status - System health summary
GET /api/connections - Active MCP connections
GET /api/queries - Recent query history
GET /api/metrics - Performance statistics
GET /api/alerts - Current alerts/warnings
```

**WebSocket Events:**
```
connection_status - MCP server up/down
new_connection - User connected
query_executed - Real-time query stream
error_occurred - System errors
```

### 2. Data Collection

**MCP Server Integration:**
```javascript
// Add to existing MCP server
app.use('/monitor', monitoringMiddleware);

const monitoringMiddleware = (req, res, next) => {
  // Log connection events
  logger.info('connection', { 
    user: req.user, 
    timestamp: Date.now(),
    endpoint: req.path 
  });
  next();
};
```

**Log Parsing:**
- Parse existing MCP server logs
- Extract connection patterns
- Track query performance
- Monitor error rates

### 3. Frontend (Simple HTML/CSS/JS)

**File Structure:**
```
monitor/
├── index.html
├── style.css
├── script.js
└── api.js
```

**Key Components:**
```html
<!-- System Status Cards -->
<div class="status-grid">
  <div class="status-card mcp-server">
    <h3>MCP Server</h3>
    <span class="status-indicator"></span>
  </div>
</div>

<!-- Active Connections -->
<div class="connections-panel">
  <h3>Active Users</h3>
  <ul id="active-users"></ul>
</div>

<!-- Query Stream -->
<div class="query-feed">
  <h3>Recent Queries</h3>
  <div id="query-list"></div>
</div>
```

### 4. Real-time Updates

**WebSocket Client:**
```javascript
const ws = new WebSocket('ws://localhost:3001/monitor');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  switch(data.type) {
    case 'connection_status':
      updateServerStatus(data.status);
      break;
    case 'new_query':
      addQueryToFeed(data.query);
      break;
  }
};
```

## Implementation Details

### Phase 1: Basic Status Dashboard

**Week 1:**
```bash
# Create monitor directory
mkdir -p SOURCE/monitoring_console
cd SOURCE/monitoring_console

# Basic files
touch index.html style.css script.js
touch server.js package.json

# Install dependencies
npm init -y
npm install express ws node-cron
```

**Simple Status Check:**
```javascript
// Check MCP server health
const checkMCPHealth = async () => {
  try {
    const response = await fetch('http://localhost:3000/health');
    return response.ok ? 'healthy' : 'unhealthy';
  } catch (error) {
    return 'down';
  }
};

// Check Weaviate health
const checkWeaviateHealth = async () => {
  try {
    const response = await fetch('http://localhost:8080/v1/meta');
    return response.ok ? 'healthy' : 'unhealthy';
  } catch (error) {
    return 'down';
  }
};
```

### Phase 2: Connection Monitoring

**Log Parser:**
```javascript
const parseConnectionLogs = () => {
  // Read MCP server logs
  // Extract connection events
  // Track active sessions
  // Return connection statistics
};
```

**Active Users Tracking:**
```javascript
const activeConnections = new Map();

// Track connections
io.on('connection', (socket) => {
  activeConnections.set(socket.id, {
    user: socket.user,
    connected: Date.now(),
    lastActivity: Date.now()
  });
});
```

### Phase 3: Analytics Dashboard

**Query Analytics:**
```javascript
const queryStats = {
  totalQueries: 0,
  averageResponseTime: 0,
  popularTerms: {},
  errorRate: 0
};

const updateQueryStats = (query, responseTime, success) => {
  queryStats.totalQueries++;
  queryStats.averageResponseTime = 
    (queryStats.averageResponseTime + responseTime) / 2;
  
  if (!success) {
    queryStats.errorRate++;
  }
};
```

## Database Schema

### Monitoring Tables (SQLite)
```sql
-- Connection logs
CREATE TABLE connections (
  id INTEGER PRIMARY KEY,
  user_id TEXT,
  connected_at TIMESTAMP,
  disconnected_at TIMESTAMP,
  session_duration INTEGER
);

-- Query logs
CREATE TABLE queries (
  id INTEGER PRIMARY KEY,
  user_id TEXT,
  query_text TEXT,
  response_time INTEGER,
  success BOOLEAN,
  timestamp TIMESTAMP
);

-- System health
CREATE TABLE health_checks (
  id INTEGER PRIMARY KEY,
  service TEXT,
  status TEXT,
  response_time INTEGER,
  timestamp TIMESTAMP
);
```

## Configuration

**Environment Variables:**
```bash
MONITOR_PORT=3001
MCP_SERVER_URL=http://localhost:3000
WEAVIATE_URL=http://localhost:8080
LOG_LEVEL=info
ALERT_EMAIL=admin@example.com
```

**Config File (monitor.config.js):**
```javascript
module.exports = {
  server: {
    port: process.env.MONITOR_PORT || 3001
  },
  services: {
    mcp: process.env.MCP_SERVER_URL || 'http://localhost:3000',
    weaviate: process.env.WEAVIATE_URL || 'http://localhost:8080'
  },
  alerts: {
    email: process.env.ALERT_EMAIL,
    thresholds: {
      responseTime: 2000, // ms
      errorRate: 0.1 // 10%
    }
  }
};
```

## Deployment

**Docker Setup:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["node", "server.js"]
```

**Integration with existing ROME:**
```bash
# Add to docker-compose.yml
services:
  rome-monitor:
    build: ./SOURCE/monitoring_console
    ports:
      - "3001:3001"
    depends_on:
      - rome-mcp-server
      - weaviate
```

## Testing

**Health Check Endpoint:**
```bash
curl http://localhost:3001/api/status
# Expected: {"mcp": "healthy", "weaviate": "healthy", "monitor": "healthy"}
```

**WebSocket Test:**
```bash
wscat -c ws://localhost:3001/monitor
# Should receive real-time updates
```

## Success Criteria

1. **Dashboard loads** in <2 seconds
2. **Real-time updates** within 5 seconds of events
3. **99% uptime** monitoring accuracy
4. **Mobile responsive** for quick checks
5. **Zero configuration** for basic setup