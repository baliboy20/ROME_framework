#!/bin/bash
# ROME Zero-Timestamp Rejection Hook (ROME-PROP-029)
# PreToolUse hook on mcp__activity-log-file__append
# Rejects activity log entries containing T00:00:00 placeholder timestamps.
#
# Robots must use new Date().toISOString() or omit the field entirely.
# The MCP server auto-stamps omitted fields with real wall-clock time.

INPUT=$(cat)

# Extract attributes JSON
ATTRS=$(echo "$INPUT" | jq -r '.tool_input.attributes // {}' 2>/dev/null)

if [ -z "$ATTRS" ] || [ "$ATTRS" = "null" ]; then
  exit 0
fi

# Check all string values for zero-time patterns (T00:00:00 or 00:00:00Z)
ZERO_FOUND=$(echo "$ATTRS" | jq -r 'to_entries[] | select(.value | type == "string") | select(.value | test("T00:00:00|00:00:00Z")) | .key' 2>/dev/null)

if [ -n "$ZERO_FOUND" ]; then
  FIELDS=$(echo "$ZERO_FOUND" | tr '\n' ',' | sed 's/,$//')
  cat <<EOF
{
  "decision": "block",
  "reason": "ACTIVITY LOG REJECTED — zero timestamp in field(s): [${FIELDS}]. The value 'T00:00:00Z' or '00:00:00Z' is a placeholder, not a real wall-clock time. Use new Date().toISOString() for the current time, or omit the field (the MCP server will auto-stamp with real time). Placeholder timestamps violate ROME-PROP-029 and undermine audit integrity."
}
EOF
  exit 0
fi

exit 0
