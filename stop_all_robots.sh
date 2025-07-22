#!/bin/bash

echo "🛑 Stopping all ROME robots..."

# Kill all claude processes with 'in newWindow' (our robot pattern)
pkill -f "claude.*in.*newWindow"

# Wait a moment
sleep 2

# Check if any are still running
remaining=$(ps aux | grep -c "claude.*in.*newWindow")

if [ "$remaining" -gt 1 ]; then
    echo "⚠️  Some robots may still be running. Force killing..."
    pkill -9 -f "claude.*in.*newWindow"
    sleep 1
fi

echo "✅ All robots stopped"
echo ""
echo "To restart: ./start_all_robots.sh"