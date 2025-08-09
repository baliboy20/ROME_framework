#!/bin/bash

# MCP Rome Server Startup Script
# This script starts the MCP Documentation Server for ROME methodology

set -e

echo "🚀 Starting MCP Rome Server..."
echo "================================"

# Set working directory
cd "$(dirname "$0")"

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please copy .env.example to .env and configure it."
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

echo "📋 Configuration:"
echo "  - Node Environment: $NODE_ENV"
echo "  - Weaviate URL: $WEAVIATE_URL"
echo "  - MCP Server Port: $PORT"

# Check if Node.js dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if TypeScript is compiled
if [ ! -d "dist" ]; then
    echo "🔨 Building TypeScript..."
    npm run build
fi

# Check if backend dependencies are installed
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

# Start the MCP server
echo "🎯 Starting MCP Rome Documentation Server..."
echo "   Use Ctrl+C to stop the server"
echo ""

# Choose which entry point to use based on what exists
if [ -f "backend/src/index.ts" ]; then
    echo "🔄 Using backend entry point..."
    cd backend && npm run dev
elif [ -f "src/index.ts" ]; then
    echo "🔄 Using root entry point..."
    npm run dev
else
    echo "❌ No valid entry point found. Please check the project structure."
    exit 1
fi