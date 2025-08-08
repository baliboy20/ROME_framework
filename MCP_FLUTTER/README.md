# Flutter MCP Expert Server

A specialized MCP (Model Context Protocol) server providing Flutter development domain expertise with semantic search capabilities.

## Overview

This MCP server is designed to serve as an expert data source for Flutter frontend development. It shares a vector database with the ROME documentation expert but ingests domain-specific Flutter documentation from its own dedicated folder.

## Features

- **Flutter-Specific Documentation**: Ingests and indexes Flutter development documentation
- **Semantic Search**: Advanced vector-based search for Flutter concepts and patterns
- **Shared Vector Database**: Utilizes the same Weaviate instance as ROME MCP for efficient resource usage
- **Domain Isolation**: Separate document ingestion path for Flutter-specific content

## Directory Structure

```
flutter_mcp/
├── documents/
│   └── flutter/     # Flutter-specific documentation files
├── backend/         # MCP server implementation
├── infrastructure/  # Docker and configuration files
└── tests/          # Test suites
```

## Configuration

The Flutter MCP server is configured to:
- Run on port 3040 for the MCP server
- Use port 8088 for the shared Weaviate vector database
- Ingest documents from `./documents/flutter/` by default
- Share the vector database with ROME MCP server

## Document Ingestion

To ingest Flutter documentation:

```bash
cd MCP_FLUTTER/backend
npm run ingest-docs ./documents/flutter
```

Or simply run without arguments to use the default Flutter documents directory:

```bash
npm run ingest-docs
```

## Docker Setup

The server uses a shared vector database container (`shared-vdb`) that serves both the ROME and Flutter MCP servers:

```bash
cd MCP_FLUTTER/infrastructure/docker
docker-compose up -d
```

## Environment Variables

```
SERVER_PORT=3040
WEAVIATE_HOST=localhost
WEAVIATE_PORT=8088
OPENAI_API_KEY=your-api-key-here
```

## Related Projects

- **rome_mcp**: The ROME documentation expert server that shares the vector database
