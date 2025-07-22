# 🔗 Integration Examples

How to integrate the centralized configuration system with existing ROME services.

## 🎯 Quick Integration

### 1. MCP Server Backend
```javascript
// File: ROME_SEARCH/vector_db/backend_ts/src/config/index.ts
const { config } = require('../../../../artifact/config-loader');

// Load centralized config
const cfg = config.load();

export const serverConfig = {
  server: {
    host: cfg.services.mcp.host,
    port: cfg.services.mcp.port
  },
  weaviate: {
    url: cfg.services.weaviate.url,
    className: cfg.services.weaviate.className
  },
  auth: {
    apiKey: cfg.auth.romeApiKey,
    jwtSecret: cfg.auth.jwtSecret
  },
  openai: {
    apiKey: cfg.auth.openaiApiKey,
    model: cfg.auth.openaiModel
  }
};
```

### 2. ROME CLI Tool
```typescript
// File: ROME_SEARCH/vector_db/cli/src/utils/config.ts
const { config } = require('../../../../artifact/config-loader');

const cfg = config.load();

export const cliConfig = {
  mcp_server: {
    host: cfg.services.mcp.host,
    port: cfg.services.mcp.port,
    timeout: cfg.database.vector.connectionTimeout,
    api_key: cfg.auth.romeApiKey
  },
  output: {
    format: 'markdown',
    colors: true,
    verbose: cfg.app.debugMode
  },
  cache: {
    enabled: cfg.cache.enabled,
    ttl: cfg.cache.ttl,
    max_size: cfg.cache.maxSize
  },
  search: {
    default_limit: cfg.search.defaultLimit,
    min_confidence: cfg.search.minConfidence,
    highlight: true
  }
};
```

### 3. Monitoring Console Backend
```javascript
// File: rome_search_experimental/monitoring_backend/config/monitor.config.js
const { config } = require('../../../artifact/config-loader');

const cfg = config.load();

module.exports = {
  monitoring: {
    backend: { 
      port: cfg.services.monitoring.backend.port 
    },
    frontend: { 
      port: cfg.services.monitoring.frontend.port 
    },
    websocket: { 
      port: cfg.services.monitoring.websocket.port 
    }
  },
  file_monitoring: {
    watch_path: cfg.paths.rome,
    ignore_patterns: ['node_modules', '.git', '*.log']
  },
  ngrok: {
    enabled: cfg.ngrok.enabled,
    auth_token: cfg.ngrok.authToken,
    subdomains: {
      backend: cfg.ngrok.backendSubdomain,
      frontend: cfg.ngrok.frontendSubdomain
    }
  },
  health_checks: {
    mcp_server: {
      url: cfg.services.mcp.url,
      timeout: cfg.monitoring.serviceTimeout
    },
    weaviate: {
      url: cfg.services.weaviate.url,
      timeout: cfg.monitoring.serviceTimeout
    }
  }
};
```

### 4. Flutter Frontend Configuration
```dart
// File: rome_search_experimental/monitoring_frontend/lib/config/app_config.dart
import 'dart:io';
import 'dart:convert';

class AppConfig {
  static Map<String, String> _envVars = {};
  
  static Future<void> loadConfig() async {
    try {
      final envFile = File('../../../artifact/.env');
      final contents = await envFile.readAsString();
      
      for (String line in contents.split('\n')) {
        if (line.contains('=') && !line.startsWith('#')) {
          final parts = line.split('=');
          if (parts.length >= 2) {
            _envVars[parts[0].trim()] = parts.sublist(1).join('=').trim();
          }
        }
      }
    } catch (e) {
      print('Failed to load config: $e');
    }
  }
  
  static String get backendUrl => 
    _envVars['RSE_MONITORING_BACKEND_URL'] ?? 'http://localhost:3002';
    
  static String get websocketUrl => 
    _envVars['RSE_MONITORING_WEBSOCKET_URL'] ?? 'ws://localhost:3003';
    
  static bool get debugMode => 
    _envVars['DEBUG_MODE'] == 'true';
}

// Usage in main.dart:
void main() async {
  await AppConfig.loadConfig();
  runApp(MyApp());
}
```

## 🔄 Migration Scripts

### Update MCP Server
```bash
#!/bin/bash
# File: artifact/migrate-mcp-server.sh

echo "🔄 Migrating MCP Server to use centralized config..."

# Backup original config
cp ROME_SEARCH/vector_db/backend_ts/.env ROME_SEARCH/vector_db/backend_ts/.env.backup

# Update server startup to use artifact config
cat > ROME_SEARCH/vector_db/backend_ts/load-config.js << 'EOF'
// Load centralized configuration
const { config } = require('../../../artifact/config-loader');
const cfg = config.load();

// Set environment variables
process.env.SERVER_HOST = cfg.services.mcp.host;
process.env.SERVER_PORT = cfg.services.mcp.port;
process.env.API_KEY = cfg.auth.romeApiKey;
process.env.OPENAI_API_KEY = cfg.auth.openaiApiKey;
process.env.WEAVIATE_HOST = cfg.services.weaviate.host + ':' + cfg.services.weaviate.port;

console.log('✅ Loaded centralized configuration for MCP Server');
EOF

echo "✅ MCP Server migration complete"
```

### Update CLI Tool
```bash
#!/bin/bash
# File: artifact/migrate-cli.sh

echo "🔄 Migrating CLI Tool to use centralized config..."

# Update CLI config loading
cat > ROME_SEARCH/vector_db/cli/src/utils/centralized-config.ts << 'EOF'
const { config } = require('../../../../../artifact/config-loader');

export function loadCentralizedConfig() {
  const cfg = config.load();
  
  return {
    mcp_server: {
      host: cfg.services.mcp.host,
      port: cfg.services.mcp.port,
      timeout: cfg.database.vector.connectionTimeout,
      api_key: cfg.auth.romeApiKey
    },
    output: {
      format: 'markdown',
      colors: true,
      verbose: cfg.app.debugMode
    },
    cache: cfg.cache,
    search: cfg.search
  };
}
EOF

echo "✅ CLI Tool migration complete"
```

### Update Monitoring Console
```bash
#!/bin/bash
# File: artifact/migrate-monitoring.sh

echo "🔄 Migrating Monitoring Console to use centralized config..."

# Replace existing config file
cat > rome_search_experimental/monitoring_backend/config/monitor.config.js << 'EOF'
const { config } = require('../../../artifact/config-loader');

// Load and export centralized configuration
module.exports = config.load();
EOF

echo "✅ Monitoring Console migration complete"
```

## 🧪 Testing Integration

### Service Connectivity Test
```javascript
// File: artifact/test-integration.js
const { config, getServiceUrl } = require('./config-loader');
const axios = require('axios');

async function testServiceConnectivity() {
  const cfg = config.load();
  
  console.log('🧪 Testing service connectivity...\n');
  
  // Test MCP Server
  try {
    const mcpResponse = await axios.get(`${cfg.services.mcp.url}/health`, {
      timeout: cfg.monitoring.serviceTimeout
    });
    console.log('✅ MCP Server: Connected');
  } catch (error) {
    console.log('❌ MCP Server: Failed to connect');
  }
  
  // Test Weaviate
  try {
    const weaviateResponse = await axios.get(`${cfg.services.weaviate.url}/v1/meta`, {
      timeout: cfg.monitoring.serviceTimeout
    });
    console.log('✅ Weaviate: Connected');
  } catch (error) {
    console.log('❌ Weaviate: Failed to connect');
  }
  
  // Test Monitoring Backend
  try {
    const monitorResponse = await axios.get(`${cfg.services.monitoring.backend.url}/api/status`, {
      timeout: cfg.monitoring.serviceTimeout
    });
    console.log('✅ Monitoring Backend: Connected');
  } catch (error) {
    console.log('❌ Monitoring Backend: Failed to connect');
  }
}

testServiceConnectivity();
```

### Configuration Validation
```javascript
// File: artifact/validate-all-configs.js
const { config, validate } = require('./config-loader');
const fs = require('fs');
const path = require('path');

function validateAllConfigurations() {
  console.log('🔍 Validating all service configurations...\n');
  
  const cfg = config.load();
  
  // Check required paths exist
  const pathsToCheck = [
    { name: 'ROME Docs', path: cfg.paths.rome },
    { name: 'ROME Search', path: cfg.paths.romeSearch },
    { name: 'Experimental', path: cfg.paths.experimental }
  ];
  
  pathsToCheck.forEach(({ name, path: dirPath }) => {
    if (fs.existsSync(dirPath)) {
      console.log(`✅ ${name}: ${dirPath}`);
    } else {
      console.log(`❌ ${name}: ${dirPath} (not found)`);
    }
  });
  
  // Validate port assignments
  console.log('\n🔌 Port assignments:');
  const ports = [
    { service: 'MCP Server', port: cfg.services.mcp.port },
    { service: 'Monitor Backend', port: cfg.services.monitoring.backend.port },
    { service: 'Monitor Frontend', port: cfg.services.monitoring.frontend.port },
    { service: 'Weaviate', port: cfg.services.weaviate.port }
  ];
  
  ports.forEach(({ service, port }) => {
    console.log(`   ${service}: ${port}`);
  });
  
  // Check for port conflicts
  const portNumbers = ports.map(p => p.port);
  const duplicates = portNumbers.filter((port, index) => portNumbers.indexOf(port) !== index);
  
  if (duplicates.length > 0) {
    console.log(`\n❌ Port conflicts detected: ${duplicates.join(', ')}`);
  } else {
    console.log('\n✅ No port conflicts detected');
  }
  
  console.log('\n🎉 Configuration validation complete!');
}

validateAllConfigurations();
```

## 📁 File Structure After Integration

```
artifact/
├── .env                    # Master configuration file
├── README.md              # Documentation
├── config-loader.js       # Configuration utility
├── test-config.js         # Configuration test
├── INTEGRATION_EXAMPLES.md # This file
├── package.json           # Node.js dependencies
└── migration-scripts/
    ├── migrate-mcp-server.sh
    ├── migrate-cli.sh
    └── migrate-monitoring.sh

ROME_SEARCH/
└── vector_db/
    ├── backend_ts/
    │   └── src/config/index.ts     # Uses artifact config
    └── cli/
        └── src/utils/config.ts     # Uses artifact config

rome_search_experimental/
└── monitoring_backend/
    └── config/monitor.config.js    # Uses artifact config
```

---

*With centralized configuration, all ROME services stay in sync and conflicts become a thing of the past!*