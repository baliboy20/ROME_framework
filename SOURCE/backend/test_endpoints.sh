#!/bin/bash

echo "Testing Backend API Endpoints..."
echo "================================"

BASE_URL="http://localhost:3000"

echo ""
echo "1. Testing Health Check..."
curl -s "$BASE_URL/health" | jq .

echo ""
echo "2. Testing Email Fetch (POST /api/emails/fetch)..."
curl -s -X POST "$BASE_URL/api/emails/fetch" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2025-01-01T00:00:00Z",
    "endDate": "2025-01-29T23:59:59Z",
    "keywords": ["flutter"],
    "subjects": ["Medium"]
  }' | head -200

echo ""
echo ""
echo "3. Testing Articles List (GET /api/articles)..."
curl -s "$BASE_URL/api/articles?page=1&limit=5" | head -200

echo ""
echo ""
echo "4. Testing Scraping Queue Status..."
curl -s "$BASE_URL/api/scraping/queue-status" | jq .

echo ""
echo "================================"
echo "Backend API Test Complete"