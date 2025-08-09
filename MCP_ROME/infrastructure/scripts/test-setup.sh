#!/bin/bash
# Test environment setup script
# DevOps Engineer: Luc

set -e

echo "🧪 Setting up MCP Documentation Server - Test Environment"

# Load test environment variables
if [ -f .env.test ]; then
    export $(grep -v '^#' .env.test | xargs)
    echo "✅ Test environment variables loaded"
fi

echo "🧹 Cleaning up any existing test containers..."
docker compose \
    -f infrastructure/docker/docker-compose.yml \
    -f infrastructure/docker/docker-compose.test.yml \
    down -v --remove-orphans 2>/dev/null || true

echo "🐳 Starting test containers..."
docker compose \
    -f infrastructure/docker/docker-compose.yml \
    -f infrastructure/docker/docker-compose.test.yml \
    up -d --build

echo "⏳ Waiting for test services..."

# Wait for test Weaviate
echo "🔍 Checking test Weaviate health..."
timeout 60s bash -c 'until curl -f http://localhost:8082/v1/schema > /dev/null 2>&1; do 
    echo "Waiting for test Weaviate..."
    sleep 2
done'
echo "✅ Test Weaviate is ready"

echo "🧪 Test environment is ready!"
echo ""
echo "📍 Test Service URLs:"
echo "   Test Weaviate:     http://localhost:8082"
echo "   Vector DB Test:    http://localhost:8083"
echo ""
echo "🔧 Test Commands:"
echo "   Run tests:         npm test"
echo "   Run contracts:     npm run test:contracts"
echo "   Clean up:          docker compose -f infrastructure/docker/docker-compose.test.yml down -v"