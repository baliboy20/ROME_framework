#!/bin/bash

#!/bin/bash

BASE_DIR=$(pwd)

# Create a new iTerm window first
osascript <<EOF
tell application "iTerm2"
    create window with default profile
end tell
EOF

# Loop through all claude_* directories
for dir in claude_*; do
  if [ -d "$dir" ]; then
    FULL_PATH="$BASE_DIR/$dir"
    SESSION_NAME="${dir#*_}"  # Everything after the first underscore

    osascript <<EOF
tell application "iTerm2"
    tell current window
        create tab with default profile
        tell current session
            set name to "$SESSION_NAME"
            write text "cd '$FULL_PATH' && sh startclaude.sh"
        end tell
    end tell
end tell
EOF
  fi
done





#function open_in_iterm() {
#  DIR=$1
#  FULL_PATH="$BASE_DIR/$DIR"
#  osascript <<EOF
#tell application "iTerm2"
#    create window with default profile
#    tell current session of current window
#        write text "cd '$FULL_PATH' && sh go.claude.sh"
#    end tell
#end tell
#EOF
#}
#
#open_in_iterm "claude_ashok"
#open_in_iterm "claude_luc"
#open_in_iterm "claude_charlie"
#open_in_iterm "claude_reena"
#open_in_iterm "claude_roma"
