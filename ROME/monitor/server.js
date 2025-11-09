/**
 * @Created 2025-11-09 by Roma
 * @Purpose ROME v6.1 Real-time Activity Monitor Server
 * @Description WebSocket server + Express API for live dashboard monitoring
 */

const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const ACTIVITY_LOG_PATH = path.join(__dirname, '../templates/project-activity-status.json');

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Load activity log
function loadActivityLog() {
  try {
    if (!fs.existsSync(ACTIVITY_LOG_PATH)) {
      return { project: 'Unknown', version: '6.1', lastUpdated: new Date().toISOString(), entries: [] };
    }
    return JSON.parse(fs.readFileSync(ACTIVITY_LOG_PATH, 'utf8'));
  } catch (e) {
    console.error('Failed to load activity log:', e.message);
    return { project: 'Unknown', version: '6.1', lastUpdated: new Date().toISOString(), entries: [] };
  }
}

// Get statistics
function getStatistics() {
  const log = loadActivityLog();
  const entries = log.entries;

  return {
    totalFeatures: entries.filter(e => e.type === 'feature').length,
    totalStories: entries.filter(e => e.type === 'story').length,
    completedFeatures: entries.filter(e => e.type === 'feature' && e.status === 'COMPLETED').length,
    inProgressStories: entries.filter(e => e.type === 'story' && e.status === 'IN_PROGRESS').length,
    blockedEntries: entries.filter(e => e.blocker).length,
    openBlockers: entries.filter(e => e.type === 'blocker' && e.status === 'OPEN').length,
    pendingAmendments: entries.filter(e => e.type === 'amendment' && e.status === 'PENDING_REVIEW').length,
    robotActivity: getRobotActivity(entries)
  };
}

// Get robot activity summary
function getRobotActivity(entries) {
  const robots = ['talib', 'pma', 'clara', 'sarah', 'ashok', 'reena', 'charlie', 'roma'];
  const activity = {};

  robots.forEach(robot => {
    const robotEntries = entries.filter(e => e.robot === robot);
    activity[robot] = {
      total: robotEntries.length,
      pending: robotEntries.filter(e => e.status === 'PENDING').length,
      inProgress: robotEntries.filter(e => e.status === 'IN_PROGRESS').length,
      completed: robotEntries.filter(e => e.status === 'COMPLETED').length,
      blocked: robotEntries.filter(e => e.status === 'BLOCKED').length
    };
  });

  return activity;
}

// Broadcast to all clients
function broadcast(message) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// Watch activity log for changes
let watcherReady = false;
const watcher = chokidar.watch(ACTIVITY_LOG_PATH, { persistent: true, awaitWriteFinish: { stabilityThreshold: 500 } });

watcher.on('change', () => {
  if (watcherReady) {
    const log = loadActivityLog();
    const stats = getStatistics();
    broadcast({
      type: 'update',
      timestamp: new Date().toISOString(),
      project: log.project,
      entries: log.entries,
      statistics: stats
    });
  }
});

watcher.on('ready', () => {
  watcherReady = true;
  console.log('📁 Activity log watcher ready');
});

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('🔌 Client connected');

  // Send initial data
  const log = loadActivityLog();
  const stats = getStatistics();
  ws.send(JSON.stringify({
    type: 'init',
    timestamp: new Date().toISOString(),
    project: log.project,
    entries: log.entries,
    statistics: stats
  }));

  ws.on('close', () => {
    console.log('🔌 Client disconnected');
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });
});

// API Routes

// Get full activity log
app.get('/api/activity', (req, res) => {
  const log = loadActivityLog();
  const stats = getStatistics();
  res.json({
    ...log,
    statistics: stats
  });
});

// Get statistics
app.get('/api/statistics', (req, res) => {
  const stats = getStatistics();
  res.json(stats);
});

// Filter entries
app.get('/api/entries', (req, res) => {
  const log = loadActivityLog();
  let entries = log.entries;

  // Apply filters
  if (req.query.type) {
    entries = entries.filter(e => e.type === req.query.type);
  }
  if (req.query.status) {
    entries = entries.filter(e => e.status === req.query.status);
  }
  if (req.query.robot) {
    entries = entries.filter(e => e.robot === req.query.robot);
  }
  if (req.query.feature) {
    entries = entries.filter(e => e.feature === req.query.feature || e.id === req.query.feature);
  }

  res.json(entries);
});

// Get specific entry
app.get('/api/entries/:id', (req, res) => {
  const log = loadActivityLog();
  const entry = log.entries.find(e => e.id === req.params.id);

  if (!entry) {
    return res.status(404).json({ error: 'Entry not found' });
  }

  res.json(entry);
});

// Get robot summary
app.get('/api/robots/:name', (req, res) => {
  const log = loadActivityLog();
  const entries = log.entries.filter(e => e.robot === req.params.name);

  res.json({
    robot: req.params.name,
    entries,
    summary: {
      total: entries.length,
      pending: entries.filter(e => e.status === 'PENDING').length,
      inProgress: entries.filter(e => e.status === 'IN_PROGRESS').length,
      completed: entries.filter(e => e.status === 'COMPLETED').length,
      blocked: entries.filter(e => e.status === 'BLOCKED').length
    }
  });
});

// Get blockers
app.get('/api/blockers', (req, res) => {
  const log = loadActivityLog();
  const blockers = log.entries.filter(e => e.type === 'blocker');

  if (req.query.status) {
    return res.json(blockers.filter(b => b.status === req.query.status));
  }

  res.json(blockers);
});

// Get amendments
app.get('/api/amendments', (req, res) => {
  const log = loadActivityLog();
  const amendments = log.entries.filter(e => e.type === 'amendment');

  if (req.query.status) {
    return res.json(amendments.filter(a => a.status === req.query.status));
  }

  res.json(amendments);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static HTML dashboard
app.get('/', (req, res) => {
  res.send(getDashboardHTML());
});

// Dashboard HTML
function getDashboardHTML() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ROME v6.1 Activity Monitor</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%);
      color: #e0e0e0;
      overflow-x: hidden;
    }

    .container {
      max-width: 1600px;
      margin: 0 auto;
      padding: 20px;
    }

    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding: 20px;
      background: rgba(0,0,0,0.3);
      border-radius: 8px;
      border-left: 4px solid #00d4ff;
    }

    h1 {
      font-size: 28px;
      font-weight: 300;
      letter-spacing: 1px;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
    }

    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #00ff41;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .stat-card {
      background: rgba(0,0,0,0.5);
      border: 1px solid rgba(0,212,255,0.3);
      padding: 20px;
      border-radius: 8px;
      transition: all 0.3s ease;
    }

    .stat-card:hover {
      border-color: #00d4ff;
      transform: translateY(-2px);
    }

    .stat-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #888;
      margin-bottom: 10px;
    }

    .stat-value {
      font-size: 32px;
      font-weight: bold;
      color: #00d4ff;
    }

    .stat-value.warning { color: #ff9500; }
    .stat-value.danger { color: #ff3333; }
    .stat-value.success { color: #00ff41; }

    .section {
      margin-bottom: 30px;
    }

    .section-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 15px;
      padding: 10px;
      border-left: 3px solid #00d4ff;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .robots-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
    }

    .robot-card {
      background: rgba(0,0,0,0.5);
      border: 1px solid rgba(0,212,255,0.2);
      padding: 15px;
      border-radius: 8px;
      font-size: 13px;
    }

    .robot-name {
      font-weight: 600;
      color: #00d4ff;
      margin-bottom: 10px;
    }

    .robot-stat {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }

    .robot-stat:last-child { border: none; }

    .robot-stat-value {
      font-weight: bold;
    }

    .blockers-list, .amendments-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .blocker-item, .amendment-item {
      background: rgba(0,0,0,0.5);
      border-left: 3px solid #ff3333;
      padding: 12px;
      border-radius: 4px;
      font-size: 13px;
    }

    .amendment-item {
      border-left-color: #ff9500;
    }

    .item-id {
      font-weight: 600;
      color: #00d4ff;
      margin-bottom: 5px;
    }

    .item-description {
      color: #b0b0b0;
      margin-bottom: 5px;
    }

    .item-meta {
      font-size: 11px;
      color: #666;
    }

    .timestamp {
      font-size: 12px;
      color: #666;
    }

    @media (max-width: 768px) {
      .grid { grid-template-columns: 1fr; }
      .robots-grid { grid-template-columns: repeat(2, 1fr); }
      h1 { font-size: 20px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div>
        <h1>🚀 ROME v6.1 Activity Monitor</h1>
        <p style="font-size: 12px; color: #888; margin-top: 5px;">Real-time project activity tracking</p>
      </div>
      <div class="status-indicator">
        <span class="status-dot"></span>
        <span id="connection-status">Connecting...</span>
      </div>
    </header>

    <div class="grid" id="statistics">
      <!-- Stats populated by JS -->
    </div>

    <div class="section">
      <div class="section-title">📊 Robot Activity</div>
      <div class="robots-grid" id="robots">
        <!-- Robots populated by JS -->
      </div>
    </div>

    <div class="grid">
      <div class="section">
        <div class="section-title">🚨 Open Blockers</div>
        <div class="blockers-list" id="blockers">
          <p style="color: #666; font-size: 12px;">No blockers</p>
        </div>
      </div>

      <div class="section">
        <div class="section-title">📋 Pending Amendments</div>
        <div class="amendments-list" id="amendments">
          <p style="color: #666; font-size: 12px;">No amendments</p>
        </div>
      </div>
    </div>

    <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); color: #666; font-size: 12px;">
      <p>Last updated: <span id="last-update">--:--:--</span></p>
    </div>
  </div>

  <script>
    const ws = new WebSocket(\`ws://\${window.location.host}\`);

    ws.onopen = () => {
      document.getElementById('connection-status').textContent = 'Connected';
      document.querySelector('.status-dot').style.background = '#00ff41';
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      renderDashboard(data);
    };

    ws.onclose = () => {
      document.getElementById('connection-status').textContent = 'Disconnected';
      document.querySelector('.status-dot').style.background = '#ff3333';
    };

    function renderDashboard(data) {
      // Update statistics
      const stats = data.statistics;
      const statsHtml = \`
        <div class="stat-card">
          <div class="stat-label">Total Features</div>
          <div class="stat-value">\${stats.totalFeatures}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Completed</div>
          <div class="stat-value success">\${stats.completedFeatures}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">In Progress Stories</div>
          <div class="stat-value warning">\${stats.inProgressStories}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Open Blockers</div>
          <div class="stat-value danger">\${stats.openBlockers}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Pending Amendments</div>
          <div class="stat-value warning">\${stats.pendingAmendments}</div>
        </div>
      \`;
      document.getElementById('statistics').innerHTML = statsHtml;

      // Update robots
      const robotsHtml = Object.entries(stats.robotActivity)
        .map(([name, activity]) => \`
          <div class="robot-card">
            <div class="robot-name">🤖 \${name.charAt(0).toUpperCase() + name.slice(1)}</div>
            <div class="robot-stat">
              <span>Total</span>
              <span class="robot-stat-value">\${activity.total}</span>
            </div>
            <div class="robot-stat">
              <span>Pending</span>
              <span class="robot-stat-value">\${activity.pending}</span>
            </div>
            <div class="robot-stat">
              <span>In Progress</span>
              <span class="robot-stat-value" style="color: #ff9500;">\${activity.inProgress}</span>
            </div>
            <div class="robot-stat">
              <span>Completed</span>
              <span class="robot-stat-value" style="color: #00ff41;">\${activity.completed}</span>
            </div>
            <div class="robot-stat">
              <span>Blocked</span>
              <span class="robot-stat-value" style="color: #ff3333;">\${activity.blocked}</span>
            </div>
          </div>
        \`)
        .join('');
      document.getElementById('robots').innerHTML = robotsHtml;

      // Update blockers
      const blockers = data.entries.filter(e => e.type === 'blocker' && e.status === 'OPEN');
      const blockersHtml = blockers.length > 0
        ? blockers.map(b => \`
          <div class="blocker-item">
            <div class="item-id">\${b.id} - \${b.severity}</div>
            <div class="item-description">\${b.description}</div>
            <div class="item-meta">Reported by \${b.robot} • \${new Date(b.createdDate).toLocaleDateString()}</div>
          </div>
        \`).join('')
        : '<p style="color: #666; font-size: 12px;">No blockers</p>';
      document.getElementById('blockers').innerHTML = blockersHtml;

      // Update amendments
      const amendments = data.entries.filter(e => e.type === 'amendment' && e.status === 'PENDING_REVIEW');
      const amendmentsHtml = amendments.length > 0
        ? amendments.map(a => \`
          <div class="amendment-item">
            <div class="item-id">\${a.id} - \${a.severity}</div>
            <div class="item-description">\${a.description}</div>
            <div class="item-meta">Requested by \${a.requestedBy} • Phase \${a.targetPhase}</div>
          </div>
        \`).join('')
        : '<p style="color: #666; font-size: 12px;">No amendments</p>';
      document.getElementById('amendments').innerHTML = amendmentsHtml;

      // Update timestamp
      document.getElementById('last-update').textContent = new Date().toLocaleTimeString();
    }
  </script>
</body>
</html>
  `;
}

// Start server
server.listen(PORT, () => {
  console.log(`✅ ROME Monitor listening on http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
  console.log(`📡 WebSocket: ws://localhost:${PORT}`);
  console.log(`📋 API: http://localhost:${PORT}/api`);
});
