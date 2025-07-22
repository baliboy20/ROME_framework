#!/bin/bash

# Luc - Database Specialist startup script
echo -ne "\033]0;Luc - Database Specialist\007"
echo "🗄️  Starting Luc - Database & DevOps Specialist"
echo "Specializing in: MongoDB, Data Models, Schema Design"

# Start Claude in the robot directory
cd "$(dirname "$0")"
echo "execute CLAUDE.md instructions" | claude "$@"