# Flutter MCP Testing Guide

## Overview
This guide explains how to test the Flutter MCP server with its optimized chunking, metadata extraction, and search capabilities.

## Quick Start

### 1. One-Command Test
```bash
cd MCP_FLUTTER
npm run test:setup
```
This will:
- Set up environment variables
- Install dependencies
- Start Weaviate database
- Build TypeScript files
- Run all tests

### 2. Manual Testing

#### Prerequisites
```bash
# 1. Copy and configure environment variables
cp .env.example .env
# Edit .env with your OpenAI API key

# 2. Install dependencies
cd backend
npm install
cd ..
```

#### Start Services
```bash
# Start Weaviate vector database
npm run docker:up

# Check Docker logs
npm run docker:logs
```

#### Run Tests
```bash
# Run Flutter-specific tests
npm run test:flutter_archive

# Run contract tests
npm run test:contracts

# Run all tests with coverage
npm run test:coverage
```

## Test Categories

### 1. **Chunking Tests** (`test:flutter`)
Tests the FlutterCodeChunker optimization:
- ✅ Preserves complete code blocks
- ✅ Splits large classes intelligently
- ✅ Maintains token limits
- ✅ Detects code types (widget, bloc, service)
- ✅ Extracts imports and patterns

### 2. **Metadata Extraction Tests**
Tests the FlutterMetadataExtractor:
- ✅ Categorizes content correctly
- ✅ Identifies Flutter patterns
- ✅ Extracts best practices
- ✅ Detects complexity levels
- ✅ Captures code elements

### 3. **Search Optimization Tests**
Tests the FlutterSearchOptimizer:
- ✅ Intent detection (implementation, debug, pattern)
- ✅ Query expansion with Flutter terms
- ✅ Context-aware scoring
- ✅ Code snippet extraction
- ✅ Search suggestions

### 4. **Integration Tests**
Tests the complete flow:
- ✅ Document ingestion
- ✅ Chunking + metadata enrichment
- ✅ Search-ready document creation

## Document Ingestion Testing

### Ingest Flutter Documentation
```bash
# Ingest all Flutter docs
npm run ingest

# Or manually specify directory
cd backend
npm run ingest-docs ../documents/flutter_archive
```

### Test with Sample Queries
```bash
# Start the MCP server
npm run server

# In another terminal, test queries
curl -X POST http://localhost:3040/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "how to implement bloc pattern",
    "intent": "implementation",
    "context": {
      "stateManagement": "bloc"
    }
  }'
```

## Expected Test Output

### Successful Test Run
```
🧪 Testing Flutter Code Chunker
  ✓ Should create chunks from Dart code
  ✓ Should detect code type correctly
  ✓ Should extract imports
  ✓ Should chunk markdown documents
  ✓ Should split large classes into multiple chunks

🧪 Testing Flutter Metadata Extractor
  ✓ Should detect error-handling category
  ✓ Should identify as guide
  ✓ Should detect async patterns
  ✓ Should extract best practices
  ✓ Should extract class names

🧪 Testing Flutter Search Optimizer
  ✓ Should return results for: how to implement bloc pattern
  ✓ Should score results based on context
  ✓ Should generate relevant suggestions

==================================================
Test Summary
==================================================
✓ Passed: 25
✗ Failed: 0
⚠ Skipped: 0

Success Rate: 100%
```

## Troubleshooting

### Common Issues

1. **Docker not running**
   ```bash
   # Start Docker manually
   open -a Docker
   # Wait and retry
   npm run docker:up
   ```

2. **Port 8088 already in use**
   ```bash
   # Stop existing container
   docker stop shared-vdb
   docker rm shared-vdb
   # Restart
   npm run docker:up
   ```

3. **TypeScript compilation errors**
   ```bash
   # Clean and rebuild
   cd backend
   npm run clean
   npm run build
   ```

4. **Missing OpenAI API key**
   ```bash
   # Add to .env file
   echo "OPENAI_API_KEY=your-key-here" >> .env
   ```

## Performance Benchmarks

Expected performance metrics:
- **Chunking**: ~50-100ms per document
- **Metadata extraction**: ~20-50ms per chunk
- **Search query**: ~100-300ms including vector search
- **Document ingestion**: ~1-2 seconds per document

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Flutter MCP Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      weaviate:
        image: semitechnologies/weaviate:1.22.4
        ports:
          - 8088:8080
    
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd MCP_FLUTTER/backend
          npm install
      
      - name: Run tests
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        run: |
          cd MCP_FLUTTER
          npm run test:flutter
```

## Advanced Testing

### Load Testing
```bash
# Generate multiple test documents
for i in {1..100}; do
  echo "# Test Document $i" > documents/flutter_archive/test_$i.md
  echo "Flutter widget test content" >> documents/flutter_archive/test_$i.md
done

# Run ingestion
npm run ingest

# Monitor performance
time npm run test:flutter_archive
```

### Memory Profiling
```bash
# Run with memory profiling
node --inspect test-flutter_archive-mcp.ts

# Open Chrome DevTools
# Navigate to chrome://inspect
```

## Validation Checklist

Before deploying, ensure:
- [ ] All tests pass (`npm run test:flutter`)
- [ ] Documents are properly chunked (check chunk sizes)
- [ ] Metadata extraction captures Flutter patterns
- [ ] Search returns relevant results
- [ ] Weaviate database is accessible
- [ ] Environment variables are configured
- [ ] Docker containers are running
- [ ] API endpoints respond correctly

## Support

For issues or questions:
1. Check the test output for specific errors
2. Review the Docker logs: `npm run docker:logs`
3. Verify environment configuration in `.env`
4. Ensure all dependencies are installed
