#!/bin/bash

# Charlie - Frontend Developer startup script
echo -ne "\033]0;Charlie - Frontend Developer\007"
echo "🎨 Starting Charlie - Frontend Development Specialist"
echo "Specializing in: Flutter Web, UI/UX, BLoC, Responsive Design"

# Start Claude in the robot directory
cd "$(dirname "$0")"
echo "execute CLAUDE.md instructions" | claude "$@"