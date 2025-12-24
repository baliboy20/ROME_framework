#!/bin/bash
set -e

echo "📊 Running database migrations..."

# Load environment
export $(cat .env | xargs)

# Run migrations
docker-compose exec -T app npm run migration:run

echo "✅ Migrations complete"
