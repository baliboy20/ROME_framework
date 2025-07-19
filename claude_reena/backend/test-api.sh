#!/bin/bash

echo "Testing API endpoints..."
echo ""

# Test valid request
echo "1. Testing valid request:"
curl -X POST http://localhost:3000/question \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello World"}' \
  -w "\nStatus: %{http_code}\n"

echo ""
echo "2. Testing max length (100 chars):"
curl -X POST http://localhost:3000/question \
  -H "Content-Type: application/json" \
  -d '{"text": "1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890"}' \
  -w "\nStatus: %{http_code}\n"

echo ""
echo "3. Testing over max length (101 chars):"
curl -X POST http://localhost:3000/question \
  -H "Content-Type: application/json" \
  -d '{"text": "12345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901"}' \
  -w "\nStatus: %{http_code}\n"

echo ""
echo "4. Testing empty text:"
curl -X POST http://localhost:3000/question \
  -H "Content-Type: application/json" \
  -d '{"text": ""}' \
  -w "\nStatus: %{http_code}\n"

echo ""
echo "5. Testing missing text field:"
curl -X POST http://localhost:3000/question \
  -H "Content-Type: application/json" \
  -d '{}' \
  -w "\nStatus: %{http_code}\n"

echo ""
echo "6. Testing unicode:"
curl -X POST http://localhost:3000/question \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello 👋 World 🌎"}' \
  -w "\nStatus: %{http_code}\n"