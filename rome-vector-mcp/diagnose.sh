#!/bin/bash

echo "🔍 ROME Vector MCP Server Diagnostics"
echo "======================================"

echo "1. Checking Node.js version:"
node --version

echo -e "\n2. Checking server file exists:"
ls -la "/Users/will/flutterProjects/Exercises/july/zz_robot_army/rome-vector-mcp/bin/start.js"

echo -e "\n3. Checking MCP configuration:"
cat "/Users/will/flutterProjects/Exercises/july/zz_robot_army/ROME/.claude/mcp-servers.json"

echo -e "\n4. Testing server startup (first 10 lines):"
timeout 10 node "/Users/will/flutterProjects/Exercises/july/zz_robot_army/rome-vector-mcp/bin/start.js" 2>&1 | head -10

echo -e "\n5. Checking dependencies:"
cd "/Users/will/flutterProjects/Exercises/july/zz_robot_army/rome-vector-mcp"
npm list --depth=0

echo -e "\n✅ Diagnostics complete!"
echo "If server starts but tools aren't available:"
echo "1. Restart Claude Code to reload MCP config"
echo "2. Wait 30-60 seconds for embedding model to load"
echo "3. Try: listRomeFiles()"