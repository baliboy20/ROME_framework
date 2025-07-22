#!/bin/bash

# Reena - Backend Developer startup script
echo -ne "\033]0;Reena - Backend Developer\007"
echo "⚙️  Starting Reena - Backend Development Specialist"
echo "Specializing in: Express.js, Node.js, APIs, Business Logic"

# Start Claude in the robot directory
cd "$(dirname "$0")"
echo "execute CLAUDE.md instructions" | claude "$@"