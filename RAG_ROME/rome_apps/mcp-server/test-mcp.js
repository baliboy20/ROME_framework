#!/usr/bin/env node

import { spawn } from 'child_process';

// Start MCP server
const mcp = spawn('npx', ['tsx', 'src/server/MCPServer.ts'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

// Test message
const testMessage = {
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "search_rome_docs",
    "arguments": {
      "query": "TDD protocol step 1",
      "rome_category": "protocols",
      "limit": 3
    }
  }
};

// Send test message
mcp.stdin.write(JSON.stringify(testMessage) + '\n');

// Handle response
mcp.stdout.on('data', (data) => {
  console.log('Response:', data.toString());
});

mcp.stderr.on('data', (data) => {
  console.error('Error:', data.toString());
});

// Close after 5 seconds
setTimeout(() => {
  mcp.kill();
  process.exit(0);
}, 5000);