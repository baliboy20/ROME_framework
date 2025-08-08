#!/bin/bash

# Flutter MCP Test Setup Script
# Sets up the environment and runs tests

set -e

echo "🚀 Flutter MCP Test Setup"
echo "========================="

# Check if .env exists, if not copy from example
if [ ! -f .env ]; then
    echo "📝 Creating .env file from example..."
    cp .env.example .env
    echo "⚠️  Please update .env with your OpenAI API key"
fi

# Install dependencies
echo "📦 Installing dependencies..."
cd backend
npm install
cd ..

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "⚠️  Docker is not running. Starting Docker..."
    open -a Docker || echo "Please start Docker manually"
    echo "Waiting for Docker to start..."
    sleep 10
fi

# Start Weaviate if not running
echo "🗄️  Checking Weaviate status..."
if ! docker ps | grep -q shared-vdb; then
    echo "Starting Weaviate vector database..."
    cd infrastructure/docker
    docker-compose up -d
    cd ../..
    echo "Waiting for Weaviate to be ready..."
    sleep 5
else
    echo "✅ Weaviate is already running"
fi

# Compile TypeScript
echo "🔨 Building TypeScript files..."
cd backend
npm run build || echo "Build warnings detected, continuing..."
cd ..

# Run the test suite
echo ""
echo "🧪 Running Flutter MCP Tests"
echo "============================"
npx tsx test-flutter-mcp.ts

echo ""
echo "✅ Test setup complete!"