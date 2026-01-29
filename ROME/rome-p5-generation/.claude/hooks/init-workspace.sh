#!/bin/bash
# rome-p5-generation/.claude/hooks/init-workspace.sh
# Multi-robot workspace initialization for P5 parallel code generation

PROJECT_DIR="$CLAUDE_PROJECT_DIR"
ROBOT_PLUGINS="$PROJECT_DIR/../robot-plugins"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 P5 GENERATION - Multi-Robot Workspace"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Loading Ashok (Database Layer Specialist)..."
echo ""

# Load Ashok's context (primary robot)
cat "$ROBOT_PLUGINS/ashok/ROBOT.md"
echo ""
echo "---"
echo ""
cat "$ROBOT_PLUGINS/ashok/modes/P5-generation.md"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Ashok loaded and ready"
echo ""
echo "📋 Available robots in this phase:"
echo "   • Ashok  (Database Layer)   - ✅ ACTIVE"
echo "   • Reena  (Backend API)      - Available via /switch-robot reena"
echo "   • Charlie (Frontend UI)     - Available via /switch-robot charlie"
echo ""
echo "🔧 Available commands:"
echo "   • /switch-robot <name>    - Switch to different robot context"
echo "   • /parallel-generate      - Launch all robots with coordination"
echo "   • /status-p5              - Check overall progress"
echo ""
echo "💡 Dependency chain: Ashok → Reena → Charlie"
echo "   (Reena waits for Ashok, Charlie waits for Reena)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
