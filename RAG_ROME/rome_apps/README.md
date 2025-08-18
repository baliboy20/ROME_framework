# ROME MCP Services - Separated Architecture

## Overview

This directory contains the separated services architecture for the ROME MCP system:

- **`mcp-server/`** - ROME Methodology MCP Server (Protocol handling + ROME tools)
- **`vdb-management/`** - Vector Database Management Service (Document processing + VDB operations)

## Quick Start

### 1. Environment Setup

```bash
# Create environment file
cp .env.example .env
# Edit .env with your OpenAI API key
```

### 2. Start All Services

```bash
# From project root
docker-compose -f docker-compose.separated.yml up -d

# Or for development with hot reload
docker-compose -f docker-compose.separated.yml up
```

### 3. Verify Services

```bash
# Check all services are healthy
docker-compose -f docker-compose.separated.yml ps

# Test VDB Management Service
curl http://localhost:8080/health

# Test MCP Server (HTTP endpoint for testing)
curl http://localhost:3000/health

# Check Weaviate
curl http://localhost:8088/v1/meta
```

### 4. Ingest ROME Documentation

```bash
# Connect to VDB Management container
docker exec -it rome_vdb-management_1 /bin/sh

# Run document ingestion
npm run ingest-docs -- /app/rome-docs --clear
```

## Service Architecture

```
┌─────────────────┐    HTTP API     ┌──────────────────┐
│                 │◄───────────────►│                  │
│   MCP Server    │                 │  VDB Management  │
│   (Port 3000)   │                 │   (Port 8080)    │
│                 │                 │                  │
└─────────────────┘                 └──────────────────┘
         │                                    │
         │ MCP Protocol                       │ Vector Queries
         ▼                                    ▼
┌─────────────────┐                 ┌──────────────────┐
│                 │                 │                  │
│   Claude Code   │                 │    Weaviate      │
│   Terminal      │                 │   (Port 8088)    │
│                 │                 │                  │
└─────────────────┘                 └──────────────────┘
```

## ROME Tools

The MCP Server provides 7 ROME-optimized tools:

1. **search_rome_docs** - ROME methodology-focused search
2. **get_rome_standards** - TDD protocols and standards  
3. **get_contract_template** - TDD contract generation
4. **check_roma_approval** - Standards validation
5. **get_robot_protocol** - 8-step TDD guidance
6. **validate_integration_contract** - Interface compatibility
7. **get_coordination_status** - Project tracking

## Development

### Individual Service Development

```bash
# MCP Server development
cd services/mcp-server
npm install
npm run dev

# VDB Management development  
cd services/vdb-management
npm install
npm run dev
```

### Testing

```bash
# Run tests for both services
cd services/mcp-server && npm test
cd services/vdb-management && npm test

# Integration testing
npm run test:integration
```

### Building

```bash
# Build both services
docker-compose -f docker-compose.separated.yml build

# Or individually
cd services/mcp-server && npm run build
cd services/vdb-management && npm run build
```

## Configuration

### Environment Variables

```env
# OpenAI API Key (required for embeddings)
OPENAI_API_KEY=sk-...

# Service URLs (for development)
VDB_SERVICE_URL=http://localhost:8080
MCP_SERVER_URL=http://localhost:3000
WEAVIATE_URL=http://localhost:8088

# Logging
LOG_LEVEL=info
NODE_ENV=development
```

### MCP Client Configuration

For Claude Code integration:

```json
{
  "mcpServers": {
    "rome_methodology": {
      "command": "node",
      "args": ["services/mcp-server/dist/index.js"],
      "env": {
        "VDB_SERVICE_URL": "http://localhost:8080",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

## Monitoring

### Health Checks

```bash
# Service health
curl http://localhost:3000/health  # MCP Server
curl http://localhost:8080/health  # VDB Management
curl http://localhost:8088/v1/.well-known/ready  # Weaviate

# Service metrics
curl http://localhost:3000/metrics  # MCP Server metrics
curl http://localhost:8080/api/v1/stats  # VDB statistics
```

### Logs

```bash
# Follow service logs
docker-compose -f docker-compose.separated.yml logs -f mcp-server
docker-compose -f docker-compose.separated.yml logs -f vdb-management
```

## Troubleshooting

### Common Issues

1. **Services not connecting**: Check network connectivity between containers
2. **OpenAI API errors**: Verify API key is set correctly
3. **Weaviate not ready**: Wait for Weaviate to fully initialize (30-60s)
4. **Document ingestion fails**: Check file permissions and paths

### Debug Mode

```bash
# Start services with debug logging
LOG_LEVEL=debug docker-compose -f docker-compose.separated.yml up
```

## Next Steps

1. Complete tool implementations in `services/mcp-server/src/tools/`
2. Implement VDB API endpoints in `services/vdb-management/src/api/`
3. Add contract template database to VDB Management
4. Integrate with ROME project workflows (actionlist.md, project tracking)
5. Add comprehensive testing and monitoring