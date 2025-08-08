#!/bin/bash
# Production deployment script
# DevOps Engineer: Luc

set -e

echo "🚀 Deploying MCP Documentation Server - Production Environment"

# Validate environment
if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ Error: OPENAI_API_KEY environment variable is required"
    exit 1
fi

if [ "$NODE_ENV" != "production" ]; then
    echo "❌ Error: NODE_ENV must be set to 'production'"
    exit 1
fi

echo "🔍 Validating production configuration..."

# Check if production config exists
if [ ! -f infrastructure/config/production.json ]; then
    echo "❌ Error: Production configuration file not found"
    exit 1
fi

echo "🐳 Building and deploying production containers..."

# Deploy production stack
docker compose \
    -f infrastructure/docker/docker-compose.yml \
    -f infrastructure/docker/docker-compose.prod.yml \
    up -d --build --force-recreate

echo "⏳ Waiting for production services to be healthy..."

# Wait for services with extended timeout for production
echo "🔍 Checking Weaviate production health..."
timeout 120s bash -c 'until curl -f http://localhost:8088/v1/schema > /dev/null 2>&1; do 
    echo "Waiting for Weaviate..."
    sleep 5
done'
echo "✅ Weaviate is ready"

echo "🔍 Checking MCP Server production health..."
timeout 120s bash -c 'until curl -f http://localhost:3040/health > /dev/null 2>&1; do 
    echo "Waiting for MCP Server..."
    sleep 5
done'
echo "✅ MCP Server is ready"

# Run health checks
echo "🏥 Running comprehensive health checks..."
response=$(curl -s http://localhost:3040/health)
if echo "$response" | grep -q '"status":"healthy"'; then
    echo "✅ All services are healthy"
else
    echo "❌ Health check failed:"
    echo "$response"
    exit 1
fi

echo "🎉 Production deployment successful!"
echo ""
echo "📍 Production URLs:"
echo "   MCP Server:    http://localhost:3040"
echo "   Health Check:  http://localhost:3040/health"
echo "   Metrics:       http://localhost:3040/metrics"
echo ""
echo "📊 Monitoring:"
echo "   Logs:          docker compose logs -f"
echo "   Status:        docker compose ps"
echo "   Stats:         docker stats"