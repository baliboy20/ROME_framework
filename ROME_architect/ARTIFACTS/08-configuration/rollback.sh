#!/bin/bash
set -e

echo "⏪ Starting rollback..."

# Get previous version
PREVIOUS_VERSION=${1}

if [ -z "$PREVIOUS_VERSION" ]; then
  echo "Error: Please specify version to rollback to"
  echo "Usage: ./rollback.sh <version>"
  exit 1
fi

echo "Rolling back to version: $PREVIOUS_VERSION"

# Stop current containers
docker-compose down

# Checkout previous version
git checkout "$PREVIOUS_VERSION"

# Restore database backup (optional)
read -p "Restore database backup? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  ./restore-backup.sh "$PREVIOUS_VERSION"
fi

# Start containers
docker-compose up -d

# Health check
sleep 10
./health-check.sh

echo "✅ Rollback complete!"
