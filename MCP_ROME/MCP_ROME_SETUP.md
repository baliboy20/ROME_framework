# MCP Rome Server Setup for Claude Code

## Overview
This guide helps you set up the MCP Rome Documentation Server for testing with Claude Code.

## Prerequisites
- Node.js 18+ installed
- Weaviate running on port 8088 (optional for basic testing)
- Claude Code CLI installed

## Quick Start

### 1. Install Dependencies & Build
```bash
cd /Users/will/flutterProjects/Exercises/august/rome_tdd/MCP_ROME
./start-mcp-rome.sh
```

### 2. Configure Claude Code MCP Settings

Add this configuration to your Claude Code MCP settings:

```json
{
  "mcpServers": {
    "mcp_rome": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "/Users/will/flutterProjects/Exercises/august/rome_tdd/MCP_ROME/backend",
      "env": {
        "NODE_ENV": "development",
        "WEAVIATE_URL": "http://localhost:8088",
        "WEAVIATE_HOST": "localhost", 
        "WEAVIATE_PORT": "8088",
        "WEAVIATE_SCHEME": "http",
        "PORT": "3040",
        "OPENAI_API_KEY": "dummy-key-for-testing"
      }
    }
  }
}
```

### 3. Test the MCP Server

1. Start the server manually to test:
```bash
cd /Users/will/flutterProjects/Exercises/august/rome_tdd/MCP_ROME/backend
npm run dev
```

2. In another terminal, test Claude Code MCP connection:
```bash
claude mcp list
```

## Available MCP Tools

The MCP Rome server provides these tools:
- `search_docs` - Search documentation with semantic search
- `get_snippet` - Get specific code snippets
- `get_rules` - Retrieve coding standards and rules
- `validate_architecture` - Validate architectural decisions
- `get_related` - Find related documentation

## Troubleshooting

### Common Issues

1. **"Weaviate connection failed"**
   - The server will work with mock data if Weaviate isn't running
   - Start Weaviate on port 8088 for full functionality

2. **"Dependencies missing"**
   - Run: `cd backend && npm install`
   - Then: `npm run build`

3. **"Permission denied"**
   - Make sure the startup script is executable: `chmod +x start-mcp-rome.sh`

### Testing Without Weaviate

The server includes fallback mock responses for testing when Weaviate isn't available.

## ROME Methodology Integration

This MCP server provides:
- **Documentation Search**: Find ROME methodology documents
- **Standards Validation**: Check code against ROME standards  
- **Robot Coordination**: Access robot-specific guidelines
- **Contract Testing**: Retrieve TDD contract examples

## Configuration Files

- `.env` - Environment variables
- `claude-mcp-config.json` - Claude Code MCP configuration
- `start-mcp-rome.sh` - Startup script

## Next Steps

1. Test basic MCP connectivity with Claude Code
2. Verify tool responses work correctly
3. Load documentation into Weaviate for full functionality
4. Configure additional tools as needed