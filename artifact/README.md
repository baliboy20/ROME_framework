# ROME Project Artifact Directory

## 📁 Centralized Configuration Hub

This directory contains the **single source of truth** for all ROME project configuration settings, eliminating conflicts between services and ensuring consistent connectivity.

## 🔧 What's Inside

### `.env` - Master Configuration File
Contains all URLs, ports, API keys, and settings used by:
- **MCP Server** (Backend API - Port 3000)
- **ROME CLI** (Command line tool)
- **Monitoring Console** (RSE - Ports 3002/8081/3003)  
- **Vector Database** (Weaviate - Port 8080)
- **Coffee App** (Example project - Ports 3001/8082)

## 🚀 How to Use

### 1. Load in Node.js Applications
```javascript
// Load from artifact directory
require('dotenv').config({ 
  path: '/Users/will/flutterProjects/Exercises/july/zz_robot_army/artifact/.env' 
});

// Use environment variables
const mcpPort = process.env.MCP_SERVER_PORT;
const apiKey = process.env.ROME_API_KEY;
```

### 2. Load in CLI Tools
```bash
# Export from artifact .env
export $(cat /Users/will/flutterProjects/Exercises/july/zz_robot_army/artifact/.env | xargs)

# Use in commands
rome-search "query" --api-key $ROME_API_KEY
```

### 3. Load in Flutter Applications
```dart
// Read from artifact .env file
import 'package:flutter_dotenv/flutter_dotenv.dart';

await dotenv.load(fileName: "/path/to/artifact/.env");
final apiUrl = dotenv.env['MCP_SERVER_URL'];
```

## 📋 Configuration Categories

### 🌐 **Core Services**
- MCP Server (3000) - Vector database API
- RSE Monitor (3002/8081/3003) - Real-time monitoring
- Weaviate (8080) - Vector storage
- Coffee App (3001/8082) - Example project

### 🔐 **Authentication**
- ROME API key for server access
- OpenAI API key for embeddings  
- JWT secrets for session management
- Ngrok tokens for external access

### 🗄️ **Database Connections**
- Weaviate vector database settings
- MongoDB connection strings
- Connection timeouts and retries

### 📁 **File Paths**
- ROME documentation directories
- Source code output locations
- Backup and artifact paths

### ⚙️ **Feature Flags**
- Enable/disable experimental features
- Debug and development modes
- Security and monitoring settings

## 🔄 Updating Configuration

### Add New Service
1. Add port assignments in **Core Services** section
2. Add any required API keys in **Authentication** section  
3. Update applications to load from artifact/.env
4. Test connectivity between services

### Modify Existing Settings
1. Update values in artifact/.env
2. Restart affected services
3. Verify connectivity with monitoring console

## 🛠️ Integration Examples

### MCP Server Integration
```javascript
// In ROME_SEARCH/vector_db/backend_ts/src/config/index.ts
require('dotenv').config({ 
  path: '../../../artifact/.env' 
});

export const config = {
  server: {
    host: process.env.MCP_SERVER_HOST,
    port: process.env.MCP_SERVER_PORT
  },
  weaviate: {
    url: process.env.WEAVIATE_URL,
    className: process.env.WEAVIATE_CLASS_NAME
  }
};
```

### CLI Integration
```typescript
// In ROME_SEARCH/vector_db/cli/src/utils/config.ts
const artifactEnvPath = '../../../artifact/.env';
require('dotenv').config({ path: artifactEnvPath });

export const cliConfig = {
  mcpServer: {
    url: process.env.MCP_SERVER_URL,
    apiKey: process.env.ROME_API_KEY
  }
};
```

### Monitoring Console Integration
```javascript
// In rome_search_experimental/monitoring_backend/config/monitor.config.js
require('dotenv').config({ 
  path: '../../../artifact/.env' 
});

module.exports = {
  monitoring: {
    backend: { port: process.env.RSE_MONITORING_BACKEND_PORT },
    frontend: { port: process.env.RSE_MONITORING_FRONTEND_PORT },
    websocket: { port: process.env.RSE_MONITORING_WEBSOCKET_PORT }
  },
  ngrok: {
    enabled: process.env.NGROK_ENABLED === 'true',
    auth_token: process.env.NGROK_AUTH_TOKEN
  }
};
```

## 🧪 Testing Configuration

### Verify All Services Can Connect
```bash
# Test MCP server
curl http://localhost:$(grep MCP_SERVER_PORT artifact/.env | cut -d'=' -f2)/health

# Test monitoring backend  
curl http://localhost:$(grep RSE_MONITORING_BACKEND_PORT artifact/.env | cut -d'=' -f2)/api/status

# Test Weaviate
curl http://localhost:$(grep WEAVIATE_PORT artifact/.env | cut -d'=' -f2)/v1/meta
```

### Check Port Conflicts
```bash
# Find which ports are in use
netstat -an | grep LISTEN | grep -E ':(3000|3001|3002|8080|8081|8082)'
```

## 🔒 Security Notes

- **Never commit real API keys** to version control
- Use different keys for development/production
- Rotate API keys regularly
- Restrict CORS origins in production
- Enable SSL/TLS for production deployments

## 📞 Support

- **Configuration Issues**: Check this README
- **Port Conflicts**: Update port assignments in .env
- **Missing Keys**: Add required API keys to .env
- **Integration Problems**: Verify path to artifact/.env in code

---

*Centralized configuration eliminates the chaos of scattered settings across multiple files and ensures all ROME services work together seamlessly.*