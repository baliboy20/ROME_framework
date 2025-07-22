# ROME Vector Database MCP Server

A Model Context Protocol (MCP) server that provides semantic search over ROME methodology documents using vendor-free embeddings.

## Features

- **Vendor-free**: Uses local Hugging Face models, no API keys required
- **Semantic Search**: Find relevant ROME guidance by meaning, not just keywords
- **Role-specific Context**: Get targeted guidance for PMAs, Rodeos, and specialists
- **Simple Integration**: Works with Claude Code and other MCP clients

## Tools Available

### `searchRomeDocs(query, topK?)`
Search ROME documents semantically.
```javascript
searchRomeDocs("robot task execution protocols", 3)
searchRomeDocs("PMA responsibilities and duties")
searchRomeDocs("module design principles")
```

### `listRomeFiles()`
List all indexed ROME methodology documents.

### `getRomeContext(role)`
Get comprehensive context for specific roles:
- `PMA` - Project Manager/Architect guidance
- `rodeo` - Robot Developer protocols
- `backend` - Backend development guidance
- `frontend` - Frontend development guidance  
- `devops` - DevOps and DBA guidance
- `data-architect` - Data architecture guidance

## Installation & Usage

### Local Development
```bash
cd rome-vector-mcp
npm install
npm start
```

### As MCP Server
Add to your Claude Code configuration:
```json
{
  "mcpServers": {
    "rome-vector-db": {
      "command": "npx",
      "args": ["-y", "rome-vector-db", "../ROME"]
    }
  }
}
```

### Publish to npm
```bash
npm publish
```

Then anyone can use:
```bash
npx rome-vector-db /path/to/rome/docs
```

## Architecture

- **embed.js**: Handles text chunking and embedding generation
- **index.js**: MCP server implementation with tool handlers
- **bin/start.js**: CLI entry point

Uses `@xenova/transformers` with the `all-MiniLM-L6-v2` model for embeddings.

## Port Usage
This MCP server uses stdio transport (no network ports required), avoiding conflicts with existing services.