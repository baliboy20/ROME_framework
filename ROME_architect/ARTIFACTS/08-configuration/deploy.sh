#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Load environment
ENV=${1:-production}
echo "Environment: $ENV"

# Pull latest images
echo "Pulling Docker images..."
docker-compose pull

# Stop old containers
echo "Stopping old containers..."
docker-compose down

# Run database migrations
echo "Running migrations..."
./migrate.sh

# Start new containers
echo "Starting new containers..."
docker-compose up -d

# Wait for services
echo "Waiting for services to be ready..."
sleep 10

# Run health checks
echo "Running health checks..."
./health-check.sh

echo "✅ Deployment complete!"
