# MCP Documentation Server

A Model Context Protocol (MCP) server for Flutter documentation with semantic search capabilities. Provides intelligent documentation retrieval for Claude Code terminal sessions.

## Features

- **MCP Protocol Support**: Full compatibility with Claude Code
- **Semantic Search**: Vector-based search using Weaviate and OpenAI embeddings
- **Document Ingestion**: CLI and API tools for loading documentation
- **5 Tool Handlers**: search_docs, get_snippet, get_rules, validate_architecture, get_related
- **Performance Optimized**: <200ms query response time
- **TypeScript**: Full type safety with strict configuration

## Quick Start

### Prerequisites

- Node.js 18+
- Docker and Docker Compose (for Weaviate)
- OpenAI API key (for embeddings)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your settings
```

### Start Weaviate Database

```bash
# Using Docker Compose (from project root)
docker-compose up -d weaviate
```

### Ingest Documentation

#### Method 1: CLI Tool

```bash
# Ingest all markdown files from a directory
npm run ingest-docs ./flutter-docs

# Ingest with custom file pattern
npm run ingest-docs ./docs --pattern "\\.md$"

# Ingest a single file
npm run ingest-docs --file ./docs/widgets.md

# Clear existing documents first
npm run ingest-docs ./docs --clear

# Show statistics
npm run ingest-docs --stats
```

#### Method 2: HTTP API

```bash
# Start the document management server
npm run doc-server

# Upload a single file
curl -X POST http://localhost:3001/api/documents/upload \
  -F "file=@./docs/widgets.md" \
  -F "category=widgets" \
  -F "tags=[\"flutter\",\"ui\"]"

# Ingest directory via API
curl -X POST http://localhost:3001/api/documents/directory \
  -H "Content-Type: application/json" \
  -d '{"directoryPath": "./flutter-docs", "pattern": "\\.md$"}'

# Get statistics
curl http://localhost:3001/api/documents/stats
```

#### Method 3: Programmatic

```typescript
import { DocumentIngestionService } from './src/ingestion/DocumentIngestionService.js';
import { WeaviateClient } from './src/vectorstore/WeaviateClient.js';

// Initialize services
const weaviateClient = new WeaviateClient(config);
const ingestionService = new DocumentIngestionService(weaviateClient);
await ingestionService.initialize();

// Ingest a document
const result = await ingestionService.ingestDocument({
  content: "# Flutter Widgets\nWidgets are the building blocks...",
  source: "widgets-guide.md",
  category: "widgets",
  tags: ["flutter", "ui", "widgets"]
});
```

### Start MCP Server

```bash
# Start the MCP server
npm run mcp-server

# Or in development mode
npm run dev
```

## Environment Variables

Create a `.env` file with these variables:

```env
# Weaviate Configuration
WEAVIATE_HOST=localhost
WEAVIATE_PORT=8080
WEAVIATE_SCHEME=http

# OpenAI API Key (required for embeddings)
OPENAI_API_KEY=your-openai-api-key-here

# Logging
LOG_LEVEL=info

# Document API Server (optional)
PORT=3001
```

## Usage with Claude Code

Once the MCP server is running, configure Claude Code to use it:

1. Add to your Claude Code settings:
```json
{
  "mcpServers": {
    "flutter-docs": {
      "command": "node",
      "args": ["path/to/dist/index.js"],
      "env": {
        "WEAVIATE_HOST": "localhost",
        "OPENAI_API_KEY": "your-key-here"
      }
    }
  }
}
```

2. Available tools in Claude Code:

### `search_docs`
Search Flutter documentation with semantic understanding.

```
search_docs({
  "query": "state management with provider",
  "category": "state",  // optional
  "limit": 10          // optional, default: 5
})
```

### `get_snippet`
Retrieve specific code snippets by ID.

```
get_snippet({
  "snippet_id": "flutter_stateful_widget_basic",
  "include_context": true  // optional
})
```

### `get_rules`
Get architecture rules and best practices.

```
get_rules({
  "category": "state_management",     // optional
  "rule_type": "best_practices"       // optional
})
```

### `validate_architecture`
Validate code against Flutter patterns.

```
validate_architecture({
  "code": "class MyWidget extends StatefulWidget { ... }",
  "pattern_type": "widget"  // optional
})
```

### `get_related`
Find related documentation and concepts.

```
get_related({
  "topic": "state management",
  "context": "flutter widgets",  // optional
  "limit": 5                    // optional
})
```

## API Reference

### Document Management API

Start the HTTP API server:

```bash
npm run doc-server
```

#### Endpoints

**Health Check**
```http
GET /health
```

**Upload Single File**
```http
POST /api/documents/upload
Content-Type: multipart/form-data

file: <file>
category: <string>
tags: <json-array>
```

**Ingest Text Content**
```http
POST /api/documents/ingest
Content-Type: application/json

{
  "content": "documentation content",
  "source": "filename.md",
  "category": "widgets",
  "tags": ["flutter", "ui"]
}
```

**Ingest Directory**
```http
POST /api/documents/directory
Content-Type: application/json

{
  "directoryPath": "/path/to/docs",
  "pattern": "\\.md$"
}
```

**Get Statistics**
```http
GET /api/documents/stats
```

**Clear All Documents**
```http
DELETE /api/documents/clear
```

**Search Documents**
```http
GET /api/documents/search?query=flutter&category=widgets&limit=5
```

## Development

### Build

```bash
npm run build
```

### Test

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Lint

```bash
npm run lint
npm run lint:fix
```

## Architecture

```
SOURCE/backend/src/
├── api/                 # HTTP API endpoints
│   └── DocumentAPI.ts
├── cli/                 # Command-line tools
│   └── ingest-docs.ts
├── handlers/            # MCP tool handlers
│   ├── IToolHandler.ts
│   ├── SearchHandler.ts
│   ├── SnippetHandler.ts
│   ├── RulesHandler.ts
│   ├── ValidationHandler.ts
│   └── RelatedHandler.ts
├── ingestion/           # Document processing
│   └── DocumentIngestionService.ts
├── server/              # MCP server core
│   ├── MCPServer.ts
│   ├── RequestHandler.ts
│   └── ResponseFormatter.ts
├── utils/               # Utilities
│   ├── ErrorHandler.ts
│   ├── Logger.ts
│   └── Validator.ts
├── vectorstore/         # Database integration
│   └── WeaviateClient.ts
└── index.ts            # Main entry point
```

## Performance

- **Query Response Time**: <200ms (95th percentile)
- **Memory Usage**: <512MB peak
- **Concurrent Connections**: 10+ supported
- **Document Processing**: <60 seconds for large directories
- **Search Relevance**: >85% accuracy target

## Troubleshooting

### Common Issues

1. **Weaviate Connection Failed**
   ```bash
   # Check if Weaviate is running
   curl http://localhost:8080/v1/meta
   
   # Restart Weaviate
   docker-compose restart weaviate
   ```

2. **OpenAI API Errors**
   ```bash
   # Verify API key is set
   echo $OPENAI_API_KEY
   
   # Test API connectivity
   curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/models
   ```

3. **Document Ingestion Fails**
   ```bash
   # Check file permissions
   ls -la /path/to/docs
   
   # Verify file format
   file /path/to/docs/*.md
   ```

4. **MCP Server Not Responding**
   ```bash
   # Check server logs
   npm run dev
   
   # Verify port availability
   netstat -an | grep 8080
   ```

### Debugging

Enable verbose logging:

```bash
LOG_LEVEL=debug npm run dev
```

## Contributing

1. Follow the TDD-ROME methodology
2. All code must be ES module compatible
3. Maintain 80%+ test coverage
4. Use TypeScript strict mode
5. Follow existing code patterns

## License

MIT License - see LICENSE file for details.