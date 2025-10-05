#!/bin/bash

# ROME Project Initialization Script
# This script scaffolds a new project based on the ROME methodology.

echo "🚀 Starting ROME project initialization..."

# 1. Create main project structure
echo "📂 Creating PROJECT/SOURCE and PROJECT/dev directories..."
mkdir -p PROJECT/SOURCE/{backend,frontend,database,tests}
mkdir -p PROJECT/dev

# 2. Create initial tracking files
echo "📝 Creating initial tracking files..."
touch PROJECT/dev/actionlist.md
touch PROJECT/dev/project_activity.status
touch PROJECT/dev/project_tasks.log
echo "# Project Action List" > PROJECT/dev/actionlist.md

# 3. Define robot roles
ROBOTS="pma backend frontend data devops roma"

# 4. Create directories and files for each robot
for robot in $ROBOTS; do
    DIR="claude_$robot"
    echo "🤖 Setting up robot: $DIR..."
    mkdir -p "$DIR/.claude"

    # Create CLAUDE.md instruction file
    cat <<EOF > "$DIR/CLAUDE.md"
Execute the following tasks:
1. Read all documents in the ../ROME folder to understand the methodology and your role.
2. Determine the purpose of this session (e.g., create a new system, modify an existing one, conduct a review).
3. Read your assigned modules, steps, and tasks in ../PROJECT/dev/actionlist.md.
4. Execute your assigned tasks according to the ROME TDD-enhanced protocol.

IMPORTANT: All source code must be created within the ../SOURCE/ directory. Project documentation and artifacts go in ../PROJECT/dev/.
EOF

    # Create __start.sh script
    cat <<EOF > "$DIR/__start.sh"
#!/bin/bash
# Claude Code startup script that automatically executes CLAUDE.md instructions
echo "execute CLAUDE.md instructions" | claude "\$@"
EOF
    chmod +x "$DIR/__start.sh"

    # Create settings.local.json permissions file
    cat <<EOF > "$DIR/.claude/settings.local.json"
{
  "permissions": {
    "requireConfirmation": false,
    "allow": [
      "Read(*)",
      "Write(*)",
      "Edit(*)",
      "LS(*)",
      "Glob(*)",
      "Grep(*)",
      "Task(*)",
      "TodoWrite(*)",
      "Bash(npm:*)",
      "Bash(yarn:*)",
      "Bash(node:*)",
      "Bash(npx:*)",
      "Bash(python:*)",
      "Bash(pip:*)",
      "Bash(pytest:*)",
      "Bash(git:*)",
      "Bash(gh:*)",
      "Bash(jest:*)",
      "Bash(eslint:*)",
      "Bash(prettier:*)",
      "Bash(sqlite3:*)",
      "Bash(psql:*)",
      "Bash(mysql:*)",
      "Bash(docker:*)",
      "Bash(docker-compose:*)",
      "Bash(flutter:*)",
      "Bash(dart:*)",
      "Bash(mkdir:*)",
      "Bash(touch:*)",
      "Bash(cp:*)",
      "Bash(mv:*)",
      "Bash(ls:*)",
      "Bash(pwd:*)",
      "Bash(cat:*)",
      "Bash(echo:*)",
      "Bash(grep:*)",
      "Bash(curl:*)",
      "Bash(wget:*)",
      "Bash(ping:*)",
      "Bash(ps:*)",
      "Bash(kill:*)",
      "Bash(netstat:*)"
    ],
    "deny": [
      "Bash(sudo:*)",
      "Bash(rm -rf:/*)",
      "Bash(rm -rf:/)"
    ]
  }
}
EOF

done

echo "✅ ROME project initialization complete!"
echo "You can now 'cd' into a claude_* directory and start a session."
