#!/bin/bash
# ROME Activity Log Pre-Write Hook
# PreToolUse hook for Write|Edit — fires BEFORE writing to SOURCE/ or ARTIFACTS/
# Outputs additionalContext to surface reminder prominently before the tool executes.
#
# Receives tool call JSON on stdin.

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
SEARCH_DIR=$(dirname "$FILE_PATH")
ACTIVITY_LOG=""
for i in $(seq 1 10); do
  if [ -f "$SEARCH_DIR/ARTIFACTS/activity-log.txt" ]; then
    ACTIVITY_LOG="$SEARCH_DIR/ARTIFACTS/activity-log.txt"
    break
  fi
  SEARCH_DIR=$(dirname "$SEARCH_DIR")
done

# If no activity log found, not a ROME project
if [ -z "$ACTIVITY_LOG" ] || [ ! -f "$ACTIVITY_LOG" ]; then
  exit 0
fi

# Check for IN_PROGRESS entries (use grep -q for boolean check)
if grep -q "status:IN_PROGRESS" "$ACTIVITY_LOG" 2>/dev/null; then
  # Activity logged — proceed silently
  exit 0
fi

# No IN_PROGRESS logged — output prominent warning as additionalContext
# PreToolUse additionalContext appears before the tool executes
cat <<'WARN'
⚠ ROME ACTIVITY LOG: You are about to write to a ROME project file but NO activity has been logged as IN_PROGRESS. Log your activity BEFORE writing.

Required action — log in activity log FIRST:
  mcp__activity-log-file__append({
    type: "STORY",
    id: "STORY-[EPIC]-[FEAT]-[SEQ]-[CAP]",
    attributes: { status: "IN_PROGRESS", robot: "[your-name]" }
  })

Then proceed with writing.
WARN

exit 0
