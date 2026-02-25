#!/bin/bash
# ROME Activity Log Enforcement Hook
# PostToolUse hook for Write|Edit — checks that the robot has logged
# an IN_PROGRESS entry before writing to SOURCE/ or ARTIFACTS/
#
# Receives tool call JSON on stdin.
# Outputs JSON with additionalContext if logging is missing.

INPUT=$(cat)

# Extract file path from tool input
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Only check for writes to SOURCE/ or ARTIFACTS/
case "$FILE_PATH" in
  */SOURCE/* | */ARTIFACTS/*)
    ;;
  *)
    exit 0
    ;;
esac

# Find the project's activity log
# Walk up from the file path to find activity-log.txt
SEARCH_DIR=$(dirname "$FILE_PATH")
ACTIVITY_LOG=""
for i in $(seq 1 10); do
  if [ -f "$SEARCH_DIR/ARTIFACTS/activity-log.txt" ]; then
    ACTIVITY_LOG="$SEARCH_DIR/ARTIFACTS/activity-log.txt"
    break
  fi
  SEARCH_DIR=$(dirname "$SEARCH_DIR")
done

# If no activity log found, this might not be a ROME project
if [ -z "$ACTIVITY_LOG" ] || [ ! -f "$ACTIVITY_LOG" ]; then
  exit 0
fi

# Check for any IN_PROGRESS entries (STORY or PHASE level)
HAS_IN_PROGRESS=$(grep -c "status:IN_PROGRESS" "$ACTIVITY_LOG" 2>/dev/null || echo "0")

if [ "$HAS_IN_PROGRESS" -gt 0 ]; then
  # Robot has logged something as IN_PROGRESS — all good
  exit 0
fi

# Check if there's at least a PHASE entry
HAS_PHASE=$(grep -c "| PHASE |" "$ACTIVITY_LOG" 2>/dev/null || echo "0")

if [ "$HAS_PHASE" -eq 0 ]; then
  # No phase logged at all
  cat <<'WARN'
ACTIVITY LOG WARNING: You are writing to project files but have NOT logged any phase or story as IN_PROGRESS in the activity log. You MUST log activity before writing code or artifacts.

Use the activity log MCP tool:
  mcp__activity-log-file__append({type: "PHASE", id: "PHASE-[N]", attributes: {status: "IN_PROGRESS", robot: "[your-name]", started: "[ISO-8601]"}})

Or for story-level work:
  mcp__activity-log-file__append({type: "STORY", id: "STORY-[EPIC]-[FEAT]-[SEQ]-[CAP]", attributes: {status: "IN_PROGRESS", robot: "[your-name]"}})
WARN
  exit 0
fi

# Phase exists but no current IN_PROGRESS work items
# Check if the last phase entry is COMPLETED (meaning robot hasn't started new work)
LAST_PHASE_STATUS=$(grep "| PHASE |" "$ACTIVITY_LOG" | tail -1 | grep -o "status:[A-Z_]*" | cut -d: -f2)

if [ "$LAST_PHASE_STATUS" = "COMPLETED" ]; then
  cat <<'WARN'
ACTIVITY LOG WARNING: The current phase is marked COMPLETED but you are still writing files. If you are doing additional work, log a new phase or story as IN_PROGRESS first.
WARN
  exit 0
fi

exit 0
