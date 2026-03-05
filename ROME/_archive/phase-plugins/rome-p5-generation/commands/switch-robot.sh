#!/bin/bash
# rome-p5-generation/commands/switch-robot.sh
# Switch between robots in P5 phase

ROBOT_NAME=$1
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ROBOT_PLUGINS="$PROJECT_DIR/../robot-plugins"

if [ -z "$ROBOT_NAME" ]; then
  echo "❌ Error: Robot name required"
  echo ""
  echo "Usage: bash switch-robot.sh <robot-name>"
  echo ""
  echo "Available robots:"
  echo "  • ashok   - Database Layer Specialist"
  echo "  • reena   - Backend API Specialist"
  echo "  • charlie - Frontend UI Specialist"
  exit 1
fi

case $ROBOT_NAME in
  ashok)
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📊 Switching to Ashok (Database Layer Specialist)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    cat "$ROBOT_PLUGINS/ashok/ROBOT.md"
    echo ""
    echo "---"
    echo ""
    cat "$ROBOT_PLUGINS/ashok/modes/P5-generation.md"
    echo ""
    echo "✅ Ashok context loaded"
    ;;

  reena)
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔌 Switching to Reena (Backend API Specialist)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    cat "$ROBOT_PLUGINS/reena/ROBOT.md"
    echo ""
    echo "---"
    echo ""
    cat "$ROBOT_PLUGINS/reena/modes/P5-generation.md"
    echo ""
    echo "✅ Reena context loaded"
    echo "⚠️  Reminder: Reena depends on Ashok (database layer must be complete)"
    ;;

  charlie)
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🎨 Switching to Charlie (Frontend UI Specialist)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    cat "$ROBOT_PLUGINS/charlie/ROBOT.md"
    echo ""
    echo "---"
    echo ""
    cat "$ROBOT_PLUGINS/charlie/modes/P5-generation.md"
    echo ""
    echo "✅ Charlie context loaded"
    echo "⚠️  Reminder: Charlie depends on Reena (API layer must be complete)"
    ;;

  *)
    echo "❌ Unknown robot: $ROBOT_NAME"
    echo ""
    echo "Available robots:"
    echo "  • ashok   - Database Layer Specialist"
    echo "  • reena   - Backend API Specialist"
    echo "  • charlie - Frontend UI Specialist"
    exit 1
    ;;
esac
