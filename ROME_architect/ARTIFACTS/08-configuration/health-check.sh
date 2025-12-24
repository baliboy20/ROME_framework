#!/bin/bash

echo "🔍 Running health checks..."

API_URL=${API_URL:-http://localhost:3000}
MAX_RETRIES=5
RETRY_DELAY=5

check_service() {
  local url=$1
  local name=$2
  
  for i in $(seq 1 $MAX_RETRIES); do
    if curl -f -s "$url" > /dev/null; then
      echo "  ✅ $name is healthy"
      return 0
    fi
    echo "  ⏳ Waiting for $name... (attempt $i/$MAX_RETRIES)"
    sleep $RETRY_DELAY
  done
  
  echo "  ❌ $name health check failed"
  return 1
}

FAILED=0

# Check API
check_service "${API_URL}/health" "API" || FAILED=1

# Check database
check_service "${API_URL}/health/db" "Database" || FAILED=1

# Check Redis
check_service "${API_URL}/health/redis" "Redis" || FAILED=1

if [ $FAILED -eq 1 ]; then
  echo "❌ Health checks failed"
  exit 1
fi

echo "✅ All health checks passed"
exit 0
