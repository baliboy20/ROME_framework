# ROME Project Setup Guide for PMA

## Document Overview
This document defines the tasks and procedures for the PMA (Project Manager/Architect) to establish the complete physical environment, tools, and folder structure for a ROME methodology project.

## Prerequisites Checklist
Before beginning project setup, ensure you have:
- [ ] Administrative access to the development environment
- [ ] Git installed and configured
- [ ] Required development tools and languages installed
- [ ] Access to project requirements documents (PRD, SRS)
- [ ] Team member contact information and availability

---

## Phase 1: Git Repository Setup

### Task 1.1: Initialize Project Repository
**Responsibility**: PMA  
**Priority**: Critical - Must be completed first

#### Git Repository Requirements:
- **Repository Type**: Local Git repository (with optional remote)
- **Repository Name**: Follow pattern: `[project_name]_[methodology]` (e.g., `vector_db_ROME`)
- **Location**: Create in appropriate project directory
- **Branch Strategy**: Main branch with feature branches for each module

#### Commands to Execute:
```bash
# Navigate to project root directory
cd /path/to/projects/

# Create and initialize project directory
mkdir [project_name]_ROME
cd [project_name]_ROME

# Initialize git repository
git init

# Create initial README
echo "# [Project Name] - ROME Methodology Project" > README.md

# Create .gitignore file
cat > .gitignore << 'EOF'
# Environment files
.env
.env.local
.env.production

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Logs
logs/
*.log

# Temporary files
tmp/
temp/

# Dependencies
node_modules/
__pycache__/
*.pyc

# Build artifacts
dist/
build/
*.min.js
*.min.css

# Database files
*.db
*.sqlite

# API keys and secrets
secrets/
keys/
EOF

# Initial commit
git add .
git commit -m "Initial commit: ROME project structure setup

🤖 Generated with ROME Methodology

Co-Authored-By: Claude <noreply@anthropic.com>"
```

#### Git Repository Decision Points:
**PROMPT FOR USER INPUT:**
1. **Remote Repository**: Do you need a remote Git repository (GitHub, GitLab, etc.)?
   - If YES: Provide repository URL for remote setup
   - If NO: Continue with local repository only

2. **Collaboration Requirements**: Will multiple developers work on this simultaneously?
   - If YES: Set up branch protection rules and collaboration workflows
   - If NO: Simple main branch workflow is sufficient

---

## Phase 2: Core Directory Structure

### Task 2.1: Create ROME Methodology Directories
**Responsibility**: PMA  
**Priority**: Critical

#### Standard ROME Folder Structure:
```
[project_name]_ROME/
├── README.md
├── .gitignore
├── ROME/                           # ROME methodology documentation
│   ├── __START_HERE.md
│   ├── rome_methodology.md
│   ├── rome_glossary_of_terms.md
│   ├── robot_actions_protocol.md
│   ├── design_task_list.md
│   ├── project_activity.status_template.md
│   ├── project_tasks_log.template.txt
│   ├── role_spec_pma.md
│   ├── role_spec_[role1_name].md    # One per robot role
│   ├── role_spec_[role2_name].md
│   └── team_structure.md
├── PROJECT/                        # Project-specific artifacts
│   └── dev/                        # Development documentation
│       ├── requirements_review_report.md
│       ├── system_architecture_document.md
│       ├── project_activity.status
│       ├── project_tasks.log
│       └── [robot_name]_tasks.log   # Individual robot logs
├── SOURCE/                         # Source code organization
│   ├── backend/
│   ├── frontend/
│   ├── database/
│   ├── infrastructure/
│   ├── docs/
│   └── tests/
├── actionlist.md                   # Master task list
├── claude_[robot1]/                # Robot workspaces
│   ├── CLAUDE.md
│   ├── claude-start.sh
│   └── startup_prompt.txt
├── claude_[robot2]/
│   ├── CLAUDE.md
│   ├── claude-start.sh
│   └── startup_prompt.txt
└── claude-start.sh                 # Master startup script
```

#### Commands to Create Structure:
```bash
# Create main directories
mkdir -p ROME
mkdir -p PROJECT/dev
mkdir -p SOURCE/{backend,frontend,database,infrastructure,docs,tests}

# Create robot workspace directories (customize for your project)
mkdir -p claude_luc claude_reena claude_charlie claude_ashok claude_nicolas

# Make startup scripts executable
find . -name "claude-start.sh" -exec chmod +x {} \;
```

---

## Phase 3: ROME Documentation Setup

### Task 3.1: Copy ROME Methodology Documents
**Responsibility**: PMA  
**Priority**: High

#### Required ROME Documents:
1. **__START_HERE.md** - PMA role definition and project initiation guide
2. **rome_methodology.md** - Complete ROME methodology documentation
3. **robot_actions_protocol.md** - 7-step task execution protocols
4. **rome_glossary_of_terms.md** - ROME terminology definitions
5. **design_task_list.md** - Template for task list creation
6. **project_activity.status_template.md** - Status tracking template
7. **project_tasks_log.template.txt** - Task logging template

#### Role Specifications Required:
- **role_spec_pma.md** - Project Manager/Architect specification
- **role_spec_[each_robot].md** - Individual robot role specifications

**PROMPT FOR USER INPUT:**
- **Project Team Composition**: Which robot roles do you need for this project?
  - Backend Developer (Reena)
  - Frontend Developer (Charlie)
  - DevOps/DBA (Luc)
  - Data Architect (Ashok)
  - Advanced Frontend Developer (Nicolas)
  - Custom roles (specify)

---

## Phase 4: Project-Specific Configuration

### Task 4.1: Create Project Configuration Files
**Responsibility**: PMA  
**Priority**: High

#### Master Action List (actionlist.md):
```bash
# Create master actionlist.md
cat > actionlist.md << 'EOF'
# [Project Name] - Action List
**Project**: [Project Name]
**PMA**: [Your Name]
**Date**: [Current Date]
**Status**: Project Setup Phase

## Project Structure: Modules → Steps → Tasks

---

## Module 1: [First Module Name]
**Owner**: [Robot Name]
**Estimated Duration**: [X] days
**Dependencies**: None

### Step 1.1: [Step Name]
- **Task 1.1.1**: [Task Description]
- **Task 1.1.2**: [Task Description]
- **Task 1.1.3**: [Task Description]

[Continue with additional modules...]

---

## Summary
**Total Modules**: [X]
**Total Steps**: [X]
**Total Tasks**: [X]
**Estimated Timeline**: [X] weeks

**Robot Assignments**:
- **[Robot Name]**: Module [X] ([Description])
- **[Robot Name]**: Module [X] ([Description])

**Critical Path**: Module 1 → Module 2 → Module 3...
EOF
```

#### Robot Workspace Setup:
For each robot, create:
```bash
# Example for robot workspace setup
cat > claude_[robot_name]/CLAUDE.md << 'EOF'
Execute the following tasks

1) read all the documents in the ../ROME folder
2) read and understand your assigned module/ steps and tasks in the ../actionlist.md in accordance to the ROME methodology.
3) execute the plan.

## Your Role: [Robot Role Name]

You are [Robot Name], specializing in:
- [Specialization 1]
- [Specialization 2]
- [Specialization 3]

Your personality: [Personality description]

Focus on [key areas of responsibility].
EOF

# Create startup script
cat > claude_[robot_name]/claude-start.sh << 'EOF'
#!/bin/bash

# [Robot Name] startup script
echo "Starting [Robot Name] - [Role Description]"
echo "Specializing in: [Specializations]"

# Start Claude in the robot directory
cd "$(dirname "$0")"
claude --start-with-file CLAUDE.md
EOF

chmod +x claude_[robot_name]/claude-start.sh
```

---

## Phase 5: Development Environment Setup

### Task 5.1: Technology Stack Preparation
**Responsibility**: PMA  
**Priority**: Medium

#### Development Tools Checklist:
**PROMPT FOR USER INPUT:**
- **Primary Technologies**: What technologies will this project use?
  - Programming Languages: [Python, Node.js, TypeScript, etc.]
  - Databases: [PostgreSQL, MongoDB, Weaviate, etc.]
  - Frameworks: [React, Express, FastAPI, etc.]
  - Infrastructure: [Docker, Kubernetes, etc.]

#### Environment Setup Commands:
```bash
# Create environment configuration
cat > .env.template << 'EOF'
# Project Environment Configuration
PROJECT_NAME=[project_name]
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=[database_name]
DB_USER=[username]
DB_PASSWORD=[password]

# API Configuration
API_PORT=3000
API_HOST=localhost

# External Services
OPENAI_API_KEY=[your_api_key]

# Security
JWT_SECRET=[generate_random_secret]
EOF

# Create docker-compose template if needed
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  # Add services as needed for your project
  database:
    image: postgres:13
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "${DB_PORT}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
EOF
```

---

## Phase 6: Project Initialization Validation

### Task 6.1: Setup Verification
**Responsibility**: PMA  
**Priority**: Critical

#### Verification Checklist:
- [ ] Git repository initialized and first commit made
- [ ] All ROME directories created
- [ ] ROME methodology documents in place
- [ ] Robot role specifications created
- [ ] Robot workspaces configured
- [ ] actionlist.md template created
- [ ] Environment configuration files created
- [ ] All startup scripts executable
- [ ] Project structure documented

#### Validation Commands:
```bash
# Verify directory structure
tree -L 3

# Verify git setup
git log --oneline
git status

# Verify executable permissions
find . -name "*.sh" -exec ls -la {} \;

# Verify ROME documents
ls -la ROME/

# Verify robot workspaces
for robot in claude_*; do
  echo "Checking $robot..."
  ls -la "$robot/"
done
```

---

## Phase 7: Team Onboarding Preparation

### Task 7.1: Documentation Handoff
**Responsibility**: PMA  
**Priority**: High

#### Team Communication:
**PROMPT FOR USER INPUT:**
- **Communication Channels**: How will the team communicate?
  - Project management tool: [Jira, Trello, etc.]
  - Chat platform: [Slack, Teams, etc.]
  - Documentation sharing: [Confluence, Notion, etc.]

#### Handoff Package:
Create a comprehensive handoff document including:
1. **Project Overview**: Goals, timeline, success criteria
2. **Technology Stack**: Tools, languages, frameworks
3. **Development Environment**: Setup instructions
4. **ROME Methodology**: Process overview and protocols
5. **Role Assignments**: Each robot's responsibilities
6. **Getting Started**: First tasks and priorities

---

## Troubleshooting Common Setup Issues

### Git Repository Issues:
```bash
# If git init fails due to permissions
sudo chown -R $USER:$USER .
git init

# If remote repository connection fails
git remote -v
git remote set-url origin [correct_url]
```

### Directory Permission Issues:
```bash
# Fix directory permissions
find . -type d -exec chmod 755 {} \;
find . -type f -exec chmod 644 {} \;
find . -name "*.sh" -exec chmod +x {} \;
```

### Missing Dependencies:
```bash
# Check for required tools
which git && echo "Git installed" || echo "Git missing"
which node && echo "Node.js installed" || echo "Node.js missing"
which python3 && echo "Python installed" || echo "Python missing"
which docker && echo "Docker installed" || echo "Docker missing"
```

---

## Post-Setup Actions

### Immediate Next Steps:
1. **Requirements Analysis**: Review PRD and SRS documents
2. **Module Definition**: Break down project into ROME modules
3. **Task Creation**: Populate actionlist.md with specific tasks
4. **Robot Assignment**: Assign modules to appropriate robots
5. **Kickoff Meeting**: Brief team on project setup and next steps

### Success Criteria:
- [ ] Complete project structure established
- [ ] All team members have access to repositories and documentation
- [ ] Development environment functional
- [ ] ROME methodology properly implemented
- [ ] Clear task assignments and timelines defined

---

**Document Status**: Template for PMA Project Setup  
**Usage**: Customize prompts and configurations for specific project needs  
**Maintenance**: Update as ROME methodology evolves