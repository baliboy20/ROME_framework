#!/bin/bash
# Development environment stop script
# DevOps Engineer: Luc

set -e

echo "🛑 Stopping MCP Documentation Server - Development Environment"

# Stop development containers
docker compose \
    -f infrastructure/docker/docker-compose.yml \
    -f infrastructure/docker/docker-compose.dev.yml \
    stop

echo "✅ Development environment stopped"
echo ""
echo "💡 To start again: ./infrastructure/scripts/dev-start.sh"
echo "💡 To reset everything: ./infrastructure/scripts/dev-reset.sh"