# MCP Rome Documentation Server - User Manual

**Version:** 1.0.0  
**Last Updated:** 2025-08-08  
**Project:** ROME-2025-0806-1200-MCP-DOCSERVER

---

## Section 1: System Status & Health Commands

### 1.0 Quick Test All Commands

**Run Complete System Test**
```bash
# Run comprehensive test of all commands in this manual
cd /Users/will/flutterProjects/Exercises/august/rome_tdd/MCP_ROME
./test-mcp-commands.sh
```

### 1.1 Server Status Commands

**Check MCP Server Status**
```bash
# Check if MCP server process is running
ps aux | grep "dist/index.js" | grep -v grep

# Test MCP server health endpoint (if HTTP API enabled)
curl -f http://localhost:3040/health || echo "HTTP API not available"

# Check MCP server logs
tail -f ~/.claude/logs/mcp-rome.log 2>/dev/null || echo "No log file found"
```

**Check Node.js and Dependencies**
```bash
# Verify Node.js version (requires 18+)
node --version

# Check if TypeScript is compiled
ls -la dist/index.js && echo "✅ Server compiled" || echo "❌ Run: npm run build"

# Verify environment variables
node -e "require('dotenv').config(); console.log('WEAVIATE_URL:', process.env.WEAVIATE_URL); console.log('OpenAI Key:', process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET');"
```

### 1.2 Vector Database (Weaviate) Status Commands

**Basic VDB Health Check**
```bash
# Check if Weaviate is running
curl -s http://localhost:8088/v1/meta | jq '.version' || echo "❌ Weaviate not accessible"

# Get Weaviate cluster status
curl -s http://localhost:8088/v1/cluster/statistics | jq '.'

# Check Weaviate readiness
curl -s http://localhost:8088/v1/.well-known/ready && echo "✅ Weaviate ready" || echo "❌ Weaviate not ready"

# Verify OpenAI module status
curl -s http://localhost:8088/v1/modules | jq '.modules[] | select(.name == "text2vec-openai")'
```

**Detailed VDB Status**
```bash
# Get all available classes (schemas)
curl -s http://localhost:8088/v1/schema | jq '.classes[].class'

# Check database size and object count
curl -s http://localhost:8088/v1/schema | jq '.classes[] | {class: .class, properties: (.properties | length)}'

# Get node information
curl -s http://localhost:8088/v1/nodes | jq '.'

# Check performance metrics
curl -s http://localhost:8088/v1/metrics | grep weaviate_
```

### 1.3 Complete System Health Check Script

```bash
# Copy this to: check-system-health.sh
#!/bin/bash
echo "🏥 MCP Rome System Health Check"
echo "=============================="

# 1. Check Node.js
node_version=$(node --version 2>/dev/null || echo "NOT INSTALLED")
echo "Node.js Version: $node_version"

# 2. Check MCP Server Build
if [ -f "dist/index.js" ]; then
    echo "✅ MCP Server: Built"
else
    echo "❌ MCP Server: Not built - run 'npm run build'"
fi

# 3. Check Weaviate Connection
weaviate_status=$(curl -s http://localhost:8088/v1/.well-known/ready 2>/dev/null && echo "READY" || echo "DOWN")
echo "Weaviate Status: $weaviate_status"

# 4. Check Environment
if [ -f ".env" ]; then
    echo "✅ Environment: Configured"
else
    echo "❌ Environment: No .env file found"
fi

# 5. Check Document Count
doc_count=$(curl -s "http://localhost:8088/v1/graphql" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ Aggregate { FlutterDoc { meta { count } } } }"}' \
  2>/dev/null | jq -r '.data.Aggregate.FlutterDoc[0].meta.count // "0"')
echo "Documents Indexed: $doc_count"

echo "=============================="
```

---

## Section 2: Vector Database CRUD Operations

### 2.1 Schema Management Commands

**List All Schemas**
```bash
# Get all schema classes
curl -s http://localhost:8088/v1/schema | jq '.classes[] | {class: .class, description: .description}'

# Get specific schema details
curl -s http://localhost:8088/v1/schema/FlutterDoc | jq '.'

# List all properties of a class
curl -s http://localhost:8088/v1/schema/FlutterDoc | jq '.properties[] | {name: .name, dataType: .dataType}'
```

**Create Schema (if needed)**
```bash
# Create FlutterDoc schema (usually done automatically)
curl -X POST http://localhost:8088/v1/schema \
  -H "Content-Type: application/json" \
  -d '{
    "class": "FlutterDoc",
    "description": "Flutter documentation chunks",
    "properties": [
      {
        "name": "content",
        "dataType": ["text"],
        "description": "Document content"
      },
      {
        "name": "source",
        "dataType": ["text"],
        "description": "Source filename"
      },
      {
        "name": "category",
        "dataType": ["text"],
        "description": "Document category"
      },
      {
        "name": "section",
        "dataType": ["text"],
        "description": "Document section"
      },
      {
        "name": "tags",
        "dataType": ["text[]"],
        "description": "Tags array"
      }
    ],
    "vectorizer": "text2vec-openai"
  }'
```

**Update Schema**
```bash
# Add new property to existing schema
curl -X POST http://localhost:8088/v1/schema/FlutterDoc/properties \
  -H "Content-Type: application/json" \
  -d '{
    "name": "newProperty",
    "dataType": ["text"],
    "description": "New property description"
  }'
```

**Delete Schema**
```bash
# ⚠️  DANGEROUS: Delete entire schema and all data
curl -X DELETE http://localhost:8088/v1/schema/FlutterDoc
```

### 2.2 Document CRUD Operations

**Create Documents**
```bash
# Single document insert
curl -X POST http://localhost:8088/v1/objects \
  -H "Content-Type: application/json" \
  -d '{
    "class": "FlutterDoc",
    "properties": {
      "content": "Flutter widgets are the building blocks of Flutter applications.",
      "source": "widgets-intro.md",
      "category": "widgets",
      "section": "introduction",
      "tags": ["flutter", "widgets", "ui"]
    }
  }'

# Batch insert multiple documents
curl -X POST http://localhost:8088/v1/batch/objects \
  -H "Content-Type: application/json" \
  -d '{
    "objects": [
      {
        "class": "FlutterDoc",
        "properties": {
          "content": "StatefulWidget maintains state across rebuilds.",
          "source": "stateful-widgets.md",
          "category": "widgets",
          "tags": ["stateful", "widgets"]
        }
      },
      {
        "class": "FlutterDoc", 
        "properties": {
          "content": "StatelessWidget does not maintain state.",
          "source": "stateless-widgets.md",
          "category": "widgets",
          "tags": ["stateless", "widgets"]
        }
      }
    ]
  }'
```

**Read Documents**
```bash
# Get document by ID
curl -s "http://localhost:8088/v1/objects/FlutterDoc/{object-id}"

# Search documents with GraphQL
curl -s "http://localhost:8088/v1/graphql" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ Get { FlutterDoc(limit: 10) { content source category _id } } }"
  }' | jq '.data.Get.FlutterDoc'

# Search by category
curl -s "http://localhost:8088/v1/graphql" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ Get { FlutterDoc(where: {path: [\"category\"], operator: Equal, valueText: \"widgets\"}) { content source } } }"
  }' | jq '.data.Get.FlutterDoc'

# Semantic search (vector search)
curl -s "http://localhost:8088/v1/graphql" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ Get { FlutterDoc(nearText: {concepts: [\"state management\"]}, limit: 5) { content source _additional { distance } } } }"
  }' | jq '.data.Get.FlutterDoc'
```

**Update Documents**
```bash
# Update document by ID
curl -X PATCH "http://localhost:8088/v1/objects/FlutterDoc/{object-id}" \
  -H "Content-Type: application/json" \
  -d '{
    "properties": {
      "content": "Updated content here",
      "tags": ["updated", "flutter", "widgets"]
    }
  }'

# Replace entire document
curl -X PUT "http://localhost:8088/v1/objects/FlutterDoc/{object-id}" \
  -H "Content-Type: application/json" \
  -d '{
    "class": "FlutterDoc",
    "properties": {
      "content": "Completely new content",
      "source": "new-source.md",
      "category": "new-category"
    }
  }'
```

**Delete Documents**
```bash
# Delete single document by ID
curl -X DELETE "http://localhost:8088/v1/objects/FlutterDoc/{object-id}"

# Delete by criteria (batch delete)
curl -X POST "http://localhost:8088/v1/batch/objects" \
  -H "Content-Type: application/json" \
  -d '{
    "delete": {
      "class": "FlutterDoc",
      "where": {
        "path": ["category"],
        "operator": "Equal",
        "valueText": "deprecated"
      }
    }
  }'

# Delete ALL documents (⚠️  DANGEROUS)
curl -X POST "http://localhost:8088/v1/batch/objects" \
  -H "Content-Type: application/json" \
  -d '{
    "delete": {
      "class": "FlutterDoc",
      "where": {
        "path": ["source"],
        "operator": "Like", 
        "valueText": "*"
      }
    }
  }'
```

### 2.3 Advanced Query Operations

**Aggregation Queries**
```bash
# Count total documents
curl -s "http://localhost:8088/v1/graphql" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ Aggregate { FlutterDoc { meta { count } } } }"
  }' | jq '.data.Aggregate.FlutterDoc[0].meta.count'

# Count by category
curl -s "http://localhost:8088/v1/graphql" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ Aggregate { FlutterDoc(groupBy: [\"category\"]) { groupedBy { value } meta { count } } } }"
  }' | jq '.data.Aggregate.FlutterDoc'

# Get unique categories
curl -s "http://localhost:8088/v1/graphql" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ Aggregate { FlutterDoc { category { topOccurrences { value occurs } } } } }"
  }' | jq '.data.Aggregate.FlutterDoc[0].category.topOccurrences'
```

**Complex Filtering**
```bash
# Multiple conditions (AND)
curl -s "http://localhost:8088/v1/graphql" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ Get { FlutterDoc(where: {operator: And, operands: [{path: [\"category\"], operator: Equal, valueText: \"widgets\"}, {path: [\"tags\"], operator: ContainsAny, valueTextArray: [\"stateful\"]}]}) { content source } } }"
  }'

# OR conditions
curl -s "http://localhost:8088/v1/graphql" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ Get { FlutterDoc(where: {operator: Or, operands: [{path: [\"category\"], operator: Equal, valueText: \"widgets\"}, {path: [\"category\"], operator: Equal, valueText: \"state\"}]}) { content category } } }"
  }'
```

### 2.4 Backup and Restore Commands

**Export Data (Backup)**
```bash
# Export all FlutterDoc objects to JSON
curl -s "http://localhost:8088/v1/graphql" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ Get { FlutterDoc { content source category section tags _id } } }"
  }' | jq '.data.Get.FlutterDoc' > flutter_docs_backup.json

# Export schema definition
curl -s "http://localhost:8088/v1/schema/FlutterDoc" > schema_backup.json

# Create backup script
cat > backup-vdb.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups/$DATE"
mkdir -p "$BACKUP_DIR"

echo "Creating VDB backup: $BACKUP_DIR"

# Export schema
curl -s "http://localhost:8088/v1/schema/FlutterDoc" > "$BACKUP_DIR/schema.json"

# Export data
curl -s "http://localhost:8088/v1/graphql" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ Get { FlutterDoc { content source category section tags _id } } }"}' \
  | jq '.data.Get.FlutterDoc' > "$BACKUP_DIR/documents.json"

echo "Backup complete: $BACKUP_DIR"
EOF
chmod +x backup-vdb.sh
```

**Restore Data**
```bash
# Restore schema (create class)
curl -X POST http://localhost:8088/v1/schema \
  -H "Content-Type: application/json" \
  -d @schema_backup.json

# Restore documents (batch insert)
# First, convert backup to batch format
jq '{objects: [.[] | {class: "FlutterDoc", properties: {content, source, category, section, tags}}]}' \
  flutter_docs_backup.json > batch_restore.json

# Then restore
curl -X POST http://localhost:8088/v1/batch/objects \
  -H "Content-Type: application/json" \
  -d @batch_restore.json
```

---

## Section 3: MCP Server Management Commands

### 3.1 Server Control

**Start/Stop Server**
```bash
# Start in development mode
npm run dev

# Start in production mode
npm run build && npm start

# Start with specific environment
NODE_ENV=production npm start

# Stop server (Ctrl+C or kill process)
pkill -f "dist/index.js"
```

**Service Management**
```bash
# Check if server is responding
curl -f http://localhost:3040/health 2>/dev/null && echo "✅ Server responsive" || echo "❌ Server not responding"

# Monitor server logs
tail -f logs/mcp-server.log

# Monitor resource usage
top -p $(pgrep -f "dist/index.js")
```

### 3.2 Document Management via MCP Tools

**Using CLI Tools**
```bash
# Option 1: Run from MCP_ROME root directory (recommended)
cd /Users/will/flutterProjects/Exercises/august/rome_tdd/MCP_ROME

# Ingest documentation directory
npm run ingest-docs -- ./flutter-docs --clear

# Ingest single file
npm run ingest-docs -- --file ./docs/widgets.md

# Show ingestion statistics  
npm run ingest-docs -- --stats

# Get help for all CLI options
npm run ingest-docs -- --help

# Ingest with custom pattern
npm run ingest-docs -- ./docs --pattern "\\.md$"

# Verbose logging
npm run ingest-docs -- ./docs --verbose

# Option 2: Run directly from backend directory
cd /Users/will/flutterProjects/Exercises/august/rome_tdd/MCP_ROME/backend
# Then use the same commands as above
```

### 3.3 Testing MCP Tools

**Test Individual Tools**
```bash
# Test via HTTP API (if enabled)
curl -X POST http://localhost:3040/api/mcp/tools/search_docs \
  -H "Content-Type: application/json" \
  -d '{"query": "flutter widgets", "limit": 3}'

# Test via MCP protocol
echo '{"method": "tools/call", "params": {"name": "search_docs", "arguments": {"query": "state management"}}}' | \
  node dist/index.js
```

---

## Section 4: Monitoring and Maintenance

### 4.1 Performance Monitoring

**Query Performance**
```bash
# Monitor query response times
curl -s "http://localhost:8088/v1/graphql" \
  -H "Content-Type: application/json" \
  -w "Response Time: %{time_total}s\n" \
  -d '{"query": "{ Get { FlutterDoc(limit: 1) { content } } }"}'

# Check database size
du -sh $(docker inspect weaviate | jq -r '.[0].Mounts[] | select(.Destination == "/var/lib/weaviate") | .Source')

# Memory usage
docker stats weaviate --no-stream
```

**Log Analysis**
```bash
# Parse MCP server logs for errors
grep ERROR logs/mcp-server.log | tail -10

# Check Weaviate logs
docker logs weaviate --tail 50

# Monitor successful vs failed queries
grep -c "search_docs.*success" logs/mcp-server.log
```

### 4.2 Maintenance Tasks

**Regular Maintenance**
```bash
# Cleanup old logs
find logs/ -name "*.log" -mtime +7 -delete

# Optimize Weaviate (if needed)
curl -X POST "http://localhost:8088/v1/schema/FlutterDoc/shards/_cleanup"

# Update embeddings (re-vectorize)
curl -X POST "http://localhost:8088/v1/classifications" \
  -H "Content-Type: application/json" \
  -d '{"class": "FlutterDoc", "type": "text2vec-openai"}'
```

**Database Maintenance**
```bash
# Check database consistency
curl -s "http://localhost:8088/v1/schema" | jq '.classes[] | .class' | wc -l

# Verify vector indices
curl -s "http://localhost:8088/v1/schema/FlutterDoc" | jq '.vectorIndexConfig'

# Test OpenAI connectivity
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  "https://api.openai.com/v1/models" | jq '.data[] | select(.id == "text-embedding-ada-002")'
```

---

## Section 5: Troubleshooting Guide

### 5.1 Common Issues and Solutions

**Issue: Weaviate Connection Failed**
```bash
# Diagnosis
curl -v http://localhost:8088/v1/.well-known/ready

# Solutions
docker restart weaviate
# OR
docker-compose down && docker-compose up -d weaviate
```

**Issue: OpenAI API Errors**
```bash
# Check API key
echo $OPENAI_API_KEY | head -c 20 && echo "..."

# Test API connectivity
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/models | jq '.error'
```

**Issue: No Search Results**
```bash
# Check document count
curl -s "http://localhost:8088/v1/graphql" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ Aggregate { FlutterDoc { meta { count } } } }"}' \
  | jq '.data.Aggregate.FlutterDoc[0].meta.count'

# If count is 0, re-ingest documents
npm run ingest-docs -- ./documents --clear
```

### 5.2 Debug Mode

```bash
# Enable debug logging
LOG_LEVEL=debug npm run dev

# Trace MCP protocol messages
DEBUG=mcp:* npm run dev

# Monitor all HTTP requests to Weaviate
tcpdump -i lo0 -A 'port 8088'
```

---

## Appendix A: Configuration Reference

```bash
# Complete .env template
NODE_ENV=development
WEAVIATE_URL=http://localhost:8088
WEAVIATE_HOST=localhost
WEAVIATE_PORT=8088
WEAVIATE_SCHEME=http
OPENAI_API_KEY=your-key-here
PORT=3040
LOG_LEVEL=info
DEBUG=mcp:*
COMPOSE_PROJECT_NAME=mcp-docserver
```

## Appendix B: API Quick Reference

| Command | Purpose | Endpoint |
|---------|---------|----------|
| Health Check | Server status | `GET /health` |
| Schema List | Get all schemas | `GET /v1/schema` |
| Object Count | Document count | `GraphQL: Aggregate.FlutterDoc.meta.count` |
| Search | Semantic search | `GraphQL: Get.FlutterDoc(nearText)` |
| Insert | Add document | `POST /v1/objects` |
| Delete | Remove document | `DELETE /v1/objects/{id}` |

This manual provides comprehensive coverage of system monitoring, CRUD operations, and troubleshooting for the MCP Rome Documentation Server.