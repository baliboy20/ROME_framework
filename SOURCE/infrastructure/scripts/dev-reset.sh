#!/bin/bash
# Development environment reset script
# DevOps Engineer: Luc

set -e

echo "🧹 Resetting MCP Documentation Server - Development Environment"
echo "⚠️  This will remove all containers, volumes, and data"

read -p "Are you sure you want to reset? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Reset cancelled"
    exit 1
fi

echo "🛑 Stopping all containers..."
docker compose \
    -f infrastructure/docker/docker-compose.yml \
    -f infrastructure/docker/docker-compose.dev.yml \
    down -v --remove-orphans

echo "🧽 Cleaning up Docker resources..."
docker system prune -f
docker volume prune -f

echo "🗑️  Removing development data..."
rm -rf data/weaviate_dev/* 2>/dev/null || true

echo "✅ Development environment reset complete"
echo ""
echo "🚀 To start fresh: ./infrastructure/scripts/dev-start.sh"