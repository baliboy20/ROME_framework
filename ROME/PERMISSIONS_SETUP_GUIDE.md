# ROME Robot Permissions Setup Guide

## The Problem

ROME robots need specific permissions to:
- ✅ Read/write source code in `SOURCE/` directories
- ✅ Update project tracking files in `PROJECT/dev/`
- ✅ Run development tools (npm, python, git, etc.)
- ❌ But NOT access system files or dangerous operations

## Quick Setup (5 Minutes)

### Option 1: Universal Permissions (Recommended for Testing)

Copy the comprehensive permissions template:

```bash
# From your ROME directory
cp templates/settings.local.json .claude/settings.local.json
```

This gives all robots the same comprehensive permissions.

### Option 2: Role-Specific Permissions (Production)

Copy role-specific permissions for each robot:

```bash
# Backend Developer (Reena)
cp templates/permissions/backend_permissions.json claude_backend/.claude/settings.local.json

# Frontend Developer (Charlie)  
cp templates/permissions/frontend_permissions.json claude_frontend/.claude/settings.local.json

# DevOps Engineer (Luc)
cp templates/permissions/devops_permissions.json claude_devops/.claude/settings.local.json

# Data Architect (Ashok)
cp templates/permissions/data_permissions.json claude_data/.claude/settings.local.json
```

## Permission Structure Explained

### What Robots CAN Do ✅

| Permission Type | Example | Purpose |
|----------------|---------|---------|
| **File Reading** | `"Read(*)"` | Read any file for analysis |
| **Source Code** | `"Write(**/SOURCE/**)"` | Create/modify application code |
| **Project Tracking** | `"Write(**/PROJECT/dev/**)"` | Update status and logs |
| **Development Tools** | `"Bash(npm:*)"` | Run build/test commands |
| **Version Control** | `"Bash(git:*)"` | Commit and push changes |

### What Robots CANNOT Do ❌

| Restriction | Example | Reason |
|-------------|---------|---------|
| **System Files** | `"Write(/etc/**)"` | Prevent system damage |
| **ROME Docs** | `"Write(../ROME/**)"` | Protect methodology files |
| **Global Installs** | `"Bash(npm install -g:*)"` | Avoid system changes |
| **Admin Commands** | `"Bash(sudo:*)"` | Security protection |

## Role-Specific Differences

### Backend Developer (Reena)
- ✅ Backend and database files
- ✅ Python, Node.js, SQL tools
- ❌ Frontend files
- ❌ Infrastructure tools

### Frontend Developer (Charlie)
- ✅ Frontend files and UI tools
- ✅ JavaScript/TypeScript, CSS, HTML
- ❌ Backend files
- ❌ Database operations

### DevOps Engineer (Luc)
- ✅ Infrastructure files and Docker
- ✅ Cloud tools (AWS, GCP, Azure)
- ❌ Application source code
- ❌ Dangerous system operations

### Data Architect (Ashok)
- ✅ Database files and SQL tools
- ✅ Data processing tools
- ❌ Frontend/backend code
- ❌ Production database access

## Setup Process

### Step 1: Choose Your Approach

**For Learning/Testing**: Use universal permissions
**For Production**: Use role-specific permissions

### Step 2: Create Directories

```bash
# If not already created
mkdir -p claude_backend/.claude
mkdir -p claude_frontend/.claude  
mkdir -p claude_devops/.claude
mkdir -p claude_data/.claude
```

### Step 3: Copy Permission Files

```bash
# Universal approach
cp templates/settings.local.json .claude/settings.local.json

# OR role-specific approach
cp templates/permissions/backend_permissions.json claude_backend/.claude/settings.local.json
cp templates/permissions/frontend_permissions.json claude_frontend/.claude/settings.local.json
cp templates/permissions/devops_permissions.json claude_devops/.claude/settings.local.json
cp templates/permissions/data_permissions.json claude_data/.claude/settings.local.json
```

### Step 4: Test Permissions

Launch a robot and verify it can:
- Read files: `Read a source file`
- Write code: `Create a test file in SOURCE/`
- Run tools: `Run npm --version`
- Access tracking: `Update PROJECT/dev/project_activity.status`

## Troubleshooting

### "Permission denied" errors

1. **Check file exists**: `ls -la .claude/settings.local.json`
2. **Validate JSON**: Use a JSON validator on the file
3. **Check path matching**: Ensure permission patterns match your file structure

### Robot can't write to SOURCE/

```bash
# Check permissions template includes:
"Write(**/SOURCE/**)",
"Edit(**/SOURCE/**)"
```

### Robot can't run development commands

```bash
# Check permissions include development tools:
"Bash(npm:*)",
"Bash(python:*)",
"Bash(git:*)"
```

### JSON syntax errors

- Remove trailing commas
- Check quote matching
- Use a JSON formatter/validator

## Security Notes

### Safe Permissions ✅
- File operations in project directories
- Development tool execution
- Version control operations
- Testing and building

### Dangerous Permissions ❌ (Blocked)
- System file modification
- Global package installation
- Administrative commands
- Production database access

## Advanced Configuration

### Adding New Tools

To allow a new development tool:

```json
{
  "permissions": {
    "allow": [
      "Bash(new-tool:*)"
    ]
  }
}
```

### Restricting Specific Operations

To block specific patterns:

```json
{
  "permissions": {
    "deny": [
      "Bash(dangerous-command:*)"
    ]
  }
}
```

### Directory-Specific Permissions

```json
{
  "permissions": {
    "allow": [
      "Write(**/specific-dir/**)"
    ],
    "deny": [
      "Write(**/restricted-dir/**)"
    ]
  }
}
```

## Validation Checklist

Before launching robots, verify:

- [ ] `.claude/settings.local.json` exists in each robot directory
- [ ] JSON syntax is valid (no trailing commas, proper quotes)
- [ ] Permissions match role requirements
- [ ] SOURCE/ and PROJECT/dev/ access included
- [ ] Development tools allowed for role
- [ ] Dangerous operations blocked

## Getting Help

Common issues and solutions are in `PERMISSIONS_TROUBLESHOOTING.md`.

For role-specific questions, check the Authority Matrix in each role specification.