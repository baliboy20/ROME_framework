
osascript -e 'tell app "iTerm"' -e 'set newWindow to (create window with default profile)' -e 'tell current session of newWindow' -e 'write text "$$PATH_TO_DIR"' -e 'write text "claude --dangerously-skip-permissions"' -e 'set name to "$ROBOTS_NAME$"' -e 'end tell' -e 'end tell'


osascript -e 'tell app "iTerm"' -e 'set newWindow to (create window with default profile)' -e 'tell current session of newWindow' -e 'write text " cd /Users/will/flutterProjects/Exercises/oct/romev2"' -e 'write text "claude --dangerously-skip-permissions"' -e 'set name to "$ROBOTS_NAME$"' -e 'end tell' -e 'end tell'
