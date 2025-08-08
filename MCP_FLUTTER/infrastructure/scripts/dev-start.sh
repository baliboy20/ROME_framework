#!/bin/bash
# Development environment startup script
# DevOps Engineer: Luc

set -e

echo "🚀 Starting MCP Documentation Server - Development Environment"

# Load environment variables
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
    echo "✅ Environment variables loaded from .env"
else
    echo "❌ Warning: .env file not found"
fi

# Validate required environment variables
if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ Error: OPENAI_API_KEY environment variable is required"
    exit 1
fi

echo "🐳 Starting Docker containers..."

# Start development stack
docker compose \
    -f infrastructure/docker/docker-compose.yml \
    -f infrastructure/docker/docker-compose.dev.yml \
    up -d --build

echo "⏳ Waiting for services to be healthy..."

# Wait for Weaviate to be ready
echo "🔍 Checking Weaviate health..."
timeout 60s bash -c 'until curl -f http://localhost:8088/v1/schema > /dev/null 2>&1; do 
    echo "Waiting for Weaviate..."
    sleep 2
done'
echo "✅ Weaviate is ready"

# Wait for MCP server to be ready
echo "🔍 Checking MCP Server health..."
timeout 60s bash -c 'until curl -f http://localhost:3040/health > /dev/null 2>&1; do 
    echo "Waiting for MCP Server..."
    sleep 2
done'
echo "✅ MCP Server is ready"

echo "🎉 Development environment is ready!"
echo ""
echo "📍 Service URLs:"
echo "   MCP Server:    http://localhost:3040"
echo "   MCP Health:    http://localhost:3040/health"
echo "   Weaviate:      http://localhost:8088"
echo "   Weaviate UI:   http://localhost:8088/v1/schema"
echo ""
echo "🔧 Development Commands:"
echo "   View logs:     docker compose logs -f"
echo "   Stop:          ./infrastructure/scripts/dev-stop.sh"
echo "   Reset:         ./infrastructure/scripts/dev-reset.sh"
echo ""