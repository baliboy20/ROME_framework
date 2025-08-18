# ROME Permissions Troubleshooting Guide

## Common Issues & Solutions

### 1. "Permission denied" for file operations

**Symptom**: Robot says "Permission denied" when trying to write files

**Causes & Solutions**:

#### Missing settings.local.json
```bash
# Check if file exists
ls -la .claude/settings.local.json

# If missing, copy template
cp templates/settings.local.json .claude/settings.local.json
```

#### Wrong file path patterns
```json
// ❌ Too restrictive
"Write(SOURCE/**)"

// ✅ Correct pattern  
"Write(**/SOURCE/**)"
```

#### JSON syntax errors
```bash
# Validate JSON syntax
cat .claude/settings.local.json | python -m json.tool
```

### 2. "Command not allowed" for development tools

**Symptom**: Robot can't run `npm`, `python`, `git`, etc.

**Solution**: Check bash permissions in settings.local.json:

```json
{
  "permissions": {
    "allow": [
      "Bash(npm:*)",
      "Bash(python:*)", 
      "Bash(git:*)",
      "Bash(node:*)"
    ]
  }
}
```

### 3. Robot can't update PROJECT/dev/ files

**Symptom**: Can't update actionlist.md, project_activity.status

**Solution**: Ensure PROJECT/dev access:

```json
{
  "permissions": {
    "allow": [
      "Write(**/PROJECT/dev/**)",
      "Edit(**/PROJECT/dev/**)"
    ]
  }
}
```

### 4. Role-specific file access denied

**Symptom**: Backend robot can't access backend files, etc.

**Check role-specific patterns**:

```json
// Backend Developer
"Write(**/SOURCE/backend/**)",
"Edit(**/SOURCE/backend/**)",

// Frontend Developer  
"Write(**/SOURCE/frontend/**)",
"Edit(**/SOURCE/frontend/**)",

// DevOps
"Write(**/SOURCE/infrastructure/**)",
"Edit(**/SOURCE/infrastructure/**)"
```

### 5. JSON formatting errors

**Common mistakes**:

```json
// ❌ Trailing comma
{
  "permissions": {
    "allow": [
      "Read(*)",
      "Write(**/*.js)", // <- Remove this comma
    ]
  }
}

// ✅ Correct format
{
  "permissions": {
    "allow": [
      "Read(*)",
      "Write(**/*.js)"
    ]
  }
}
```

### 6. Docker/Infrastructure commands blocked

**For DevOps robots**, ensure infrastructure permissions:

```json
{
  "permissions": {
    "allow": [
      "Bash(docker:*)",
      "Bash(docker-compose:*)",
      "Bash(kubectl:*)",
      "Bash(terraform:*)"
    ]
  }
}
```

### 7. Database access denied

**For Data Architect**, ensure database tool access:

```json
{
  "permissions": {
    "allow": [
      "Bash(psql:*)",
      "Bash(mysql:*)",
      "Bash(sqlite3:*)",
      "Bash(mongosh:*)"
    ]
  }
}
```

## Diagnostic Commands

### Check Current Permissions
```bash
# View current settings
cat .claude/settings.local.json

# Validate JSON syntax
python -c "import json; json.load(open('.claude/settings.local.json'))"
```

### Test File Access
```bash
# Test if robot can access key directories
ls -la SOURCE/
ls -la PROJECT/dev/
ls -la claude_*/
```

### Verify Directory Structure
```bash
# Check expected ROME structure
tree -d -L 2
```

## Permission Pattern Reference

### File Patterns

| Pattern | Matches |
|---------|---------|
| `"Read(*)"` | Any file, anywhere |
| `"Write(**/*.js)"` | Any .js file in any subdirectory |
| `"Write(**/SOURCE/**)"` | Any file in any SOURCE directory |
| `"Edit(../PROJECT/dev/**)"` | Files in PROJECT/dev relative to robot dir |

### Bash Patterns

| Pattern | Matches |
|---------|---------|
| `"Bash(npm:*)"` | Any npm command |
| `"Bash(git:*)"` | Any git command |
| `"Bash(docker build:*)"` | Only docker build commands |
| `"Bash(python -m:*)"` | Python module execution |

## Step-by-Step Diagnosis

### Step 1: Verify File Structure
```bash
# Check robot directory structure
ls -la claude_*/
ls -la claude_*/.claude/

# Expected output:
# claude_backend/.claude/settings.local.json
# claude_frontend/.claude/settings.local.json
# etc.
```

### Step 2: Test JSON Validity
```bash
# For each robot directory
cd claude_backend
python -c "import json; print('Valid JSON' if json.load(open('.claude/settings.local.json')) else 'Invalid JSON')"
```

### Step 3: Check Permission Coverage
```bash
# Verify key permissions exist
grep -n "Write.*SOURCE" .claude/settings.local.json
grep -n "Bash.*npm" .claude/settings.local.json
grep -n "PROJECT/dev" .claude/settings.local.json
```

### Step 4: Test With Simple Commands

Launch robot and test basic operations:

1. **File Reading**: `Read a simple file`
2. **Directory Listing**: `List files in SOURCE/`
3. **Development Command**: `Run 'npm --version'`
4. **File Writing**: `Create a test file in SOURCE/tests/`

## Emergency Fixes

### Quick Universal Permissions

If robots are completely blocked, apply universal permissions:

```bash
# Copy comprehensive template to current directory
cp templates/settings.local.json .claude/settings.local.json

# Also copy to each robot directory if using role-specific setup
cp templates/settings.local.json claude_backend/.claude/
cp templates/settings.local.json claude_frontend/.claude/
cp templates/settings.local.json claude_devops/.claude/
cp templates/settings.local.json claude_data/.claude/
```

### Minimal Working Permissions

Absolute minimum for any robot:

```json
{
  "permissions": {
    "requireConfirmation": false,
    "allow": [
      "Read(*)",
      "LS(*)", 
      "Glob(*)",
      "Grep(*)",
      "Task(*)",
      "Write(**/SOURCE/**)",
      "Write(**/PROJECT/dev/**)",
      "Edit(**/SOURCE/**)", 
      "Edit(**/PROJECT/dev/**)",
      "Bash(git:*)",
      "Bash(npm:*)",
      "Bash(mkdir:*)",
      "Bash(ls:*)",
      "Bash(pwd)"
    ],
    "deny": [
      "Bash(sudo:*)",
      "Bash(rm -rf:*)"
    ]
  }
}
```

## Getting Additional Help

1. **Check ROME Documentation**: Review role specifications for authority matrices
2. **Validate with Templates**: Compare your settings.local.json with provided templates
3. **Test Incrementally**: Start with minimal permissions and add as needed
4. **Review Logs**: Check robot output for specific permission error messages

## Prevention Tips

- **Always validate JSON** before deploying
- **Use templates** as starting points
- **Test permissions** before full robot deployment
- **Keep backups** of working permission files
- **Document custom** permission changes