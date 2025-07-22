#!/usr/bin/env node

import { spawn } from 'child_process';
import { join } from 'path';

// Test the MCP server by sending JSON-RPC requests
function testMCPServer() {
  const serverProcess = spawn('node', ['bin/start.js', '../ROME'], {
    stdio: ['pipe', 'pipe', 'inherit'],
    cwd: process.cwd()
  });

  // Wait for server to initialize
  setTimeout(() => {
    console.log('\n=== Testing MCP Server ===\n');

    // Test 1: List tools
    const listToolsRequest = {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/list"
    };

    console.log('1. Testing tools/list...');
    serverProcess.stdin.write(JSON.stringify(listToolsRequest) + '\n');

    // Test 2: Search ROME docs
    const searchRequest = {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "searchRomeDocs",
        arguments: {
          query: "PMA responsibilities",
          topK: 2
        }
      }
    };

    setTimeout(() => {
      console.log('2. Testing searchRomeDocs...');
      serverProcess.stdin.write(JSON.stringify(searchRequest) + '\n');

      // Test 3: Get context for a role
      const contextRequest = {
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: {
          name: "getRomeContext",
          arguments: {
            role: "PMA"
          }
        }
      };

      setTimeout(() => {
        console.log('3. Testing getRomeContext...');
        serverProcess.stdin.write(JSON.stringify(contextRequest) + '\n');

        // End test after responses
        setTimeout(() => {
          console.log('\n=== Test Complete ===');
          serverProcess.kill();
          process.exit(0);
        }, 3000);
      }, 1000);
    }, 1000);
  }, 8000); // Wait 8 seconds for initialization

  // Capture and display responses
  let responseBuffer = '';
  serverProcess.stdout.on('data', (data) => {
    responseBuffer += data.toString();
    const lines = responseBuffer.split('\n');
    responseBuffer = lines.pop(); // Keep incomplete line

    lines.forEach(line => {
      if (line.trim()) {
        try {
          const response = JSON.parse(line);
          console.log(`\nResponse ${response.id}:`);
          if (response.result && response.result.tools) {
            console.log(`Found ${response.result.tools.length} tools:`, 
              response.result.tools.map(t => t.name).join(', '));
          } else if (response.result && response.result.content) {
            console.log('Content preview:', response.result.content[0].text.substring(0, 200) + '...');
          }
        } catch (e) {
          console.log('Raw response:', line.substring(0, 100) + '...');
        }
      }
    });
  });

  serverProcess.on('error', (err) => {
    console.error('Server error:', err);
  });
}

testMCPServer();