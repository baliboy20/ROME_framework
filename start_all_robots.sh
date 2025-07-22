#!/bin/bash

echo "🚀 Starting ROME Coffee Ordering Webapp Development Team"
echo "=============================================="

# Function to start a robot in its own terminal window
start_robot() {
    local robot_name=$1
    local robot_dir="rodeo_${robot_name}"
    local display_name=$2
    
    if [ -d "$robot_dir" ]; then
        echo "Starting ${display_name} in new terminal..."
        
        # Use osascript to create new Terminal window with custom title
        osascript <<EOF
tell application "Terminal"
    do script "cd '$(pwd)/$robot_dir' && printf '\033]0;ROME Robot: $display_name\007' && ./claude-start.sh"
end tell
EOF
        sleep 2  # Brief pause between starts
    else
        echo "❌ Robot directory $robot_dir not found"
    fi
}

echo "Starting robots with dependency awareness..."
echo ""

# Start foundation robots first (no dependencies)
echo "🔧 Phase 1: Foundation robots (can work immediately)"
start_robot "luc" "Luc (Database/DevOps)"        # Database setup - no dependencies  
start_robot "charlie" "Charlie (Frontend)"       # Frontend foundation - no dependencies

sleep 3
echo ""

# Start dependent robots (they will check dependencies in their CLAUDE.md)
echo "⚙️  Phase 2: Backend robot (will wait for database)"
start_robot "reena" "Reena (Backend API)"        # Backend - depends on Luc's database

sleep 2
echo ""

echo "🎨 Phase 3: Advanced frontend robot (will wait for UI + API)"
start_robot "nicolas" "Nicolas (Advanced Frontend)" # Order management - depends on Charlie + Reena

sleep 2
echo ""

echo "👮 Phase 4: Project Administrator (monitors all robots)"
start_robot "roma" "Roma (Project Admin)"        # Project admin - monitors compliance

echo ""
echo "✅ All robots started!"
echo ""
echo "📋 Dependency Chain:"
echo "   • Luc (Database) → Reena (Backend API)"
echo "   • Charlie (Frontend) → Nicolas (Order Management)"
echo "   • Reena (API) → Nicolas (Order Management)"
echo ""
echo "💡 Robots will automatically check dependencies before proceeding"
echo "📝 Monitor progress in PROJECT/dev/ logs"
echo ""
echo "To check robot status:"
echo "   ps aux | grep claude"
echo ""
echo "To stop all robots:"
echo "   pkill -f 'claude.*in.*newWindow'"