#!/bin/bash

echo "🔍 ROME Coffee Webapp - Project Monitor"
echo "======================================"

# Function to show robot status
show_robots() {
    echo "🤖 Robot Status:"
    robot_count=$(ps aux | grep -c "claude.*in.*newWindow")
    if [ "$robot_count" -gt 1 ]; then
        echo "   Active robots: $((robot_count - 1))"
        ps aux | grep "claude.*in.*newWindow" | grep -v grep | awk '{print "   - Robot PID: " $2}'
    else
        echo "   ❌ No robots currently running"
    fi
    echo ""
}

# Function to show recent task activity
show_activity() {
    echo "📋 Recent Task Activity:"
    if [ -f "PROJECT/dev/project_tasks.log" ]; then
        echo "   Last 5 entries:"
        tail -5 PROJECT/dev/project_tasks.log | sed 's/^/   /'
    else
        echo "   ❌ No task log found"
    fi
    echo ""
}

# Function to show current status
show_status() {
    echo "📊 Module Status Summary:"
    if [ -f "PROJECT/dev/project_activity.status" ]; then
        grep -E "(Status:|Progress:)" PROJECT/dev/project_activity.status | head -20 | sed 's/^/   /'
    else
        echo "   ❌ No status file found"
    fi
    echo ""
}

# Function to show source code progress
show_progress() {
    echo "💻 Source Code Progress:"
    
    # Check database progress
    db_files=$(find PROJECT/SOURCE/database -name "*.js" -o -name "*.sql" -o -name "*.json" 2>/dev/null | wc -l)
    echo "   Database: $db_files files"
    
    # Check backend progress  
    backend_files=$(find PROJECT/SOURCE/backend -name "*.js" -o -name "*.ts" 2>/dev/null | wc -l)
    echo "   Backend: $backend_files files"
    
    # Check frontend progress
    frontend_files=$(find PROJECT/SOURCE/frontend -name "*.dart" 2>/dev/null | wc -l)
    echo "   Frontend: $frontend_files files"
    
    echo ""
}

# Function to check blockers
show_blockers() {
    echo "🚫 Current Blockers:"
    if [ -f "PROJECT/dev/project_activity.status" ]; then
        grep -A1 "Blockers:" PROJECT/dev/project_activity.status | grep -v "Blockers:" | grep -v "^--$" | sed 's/^/   /'
    fi
    echo ""
}

# Main monitoring loop
if [ "$1" = "watch" ]; then
    while true; do
        clear
        echo "$(date) - Auto-refresh every 30 seconds (Ctrl+C to exit)"
        echo ""
        show_robots
        show_activity
        show_status
        show_progress
        show_blockers
        sleep 30
    done
else
    show_robots
    show_activity  
    show_status
    show_progress
    show_blockers
    echo "💡 Usage: $0 watch (for auto-refresh monitoring)"
fi