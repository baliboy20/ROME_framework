# ROME Framework - Installation Guide

Document UID: ROME-INSTALL-001
Version: 1.0.0
Status: **ASPIRATIONAL** (Plugin system not yet implemented)
Date: 2026-01-07

---

## ⚠️ IMPORTANT NOTICE

**This guide describes a future plugin installation system that does not currently exist.**

The `claude-plugin install` commands shown here are **not yet functional**.

**For current working instructions, see:** `USER-GUIDE.md`

**Current Reality:** Open AGENT.md files directly from ROME/ directory in Claude Code.

---

## Overview

This guide describes the planned installation procedures for the ROME Framework phase-based plugin architecture once the Claude Code plugin system is operational. It covers multiple installation patterns tailored to different user needs and experience levels.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation Patterns](#installation-patterns)
3. [Pattern 1: Selective (Phase-Specific)](#pattern-1-selective-phase-specific)
4. [Pattern 2: Developer (Manual Installation)](#pattern-2-developer-manual-installation)
6. [Post-Installation Configuration](#post-installation-configuration)
7. [Verification](#verification)
8. [Troubleshooting](#troubleshooting)
9. [Updating Plugins](#updating-plugins)
10. [Uninstallation](#uninstallation)

---

## Prerequisites

### Required Software

1. **Claude Code CLI**
   - Version: Latest stable release
   - Install: Follow instructions at https://claude.com/claude-code

2. **Node.js**
   - Version: >= 18.0.0 (LTS recommended)
   - Download: https://nodejs.org/
   - Verify installation:
     ```bash
     node --version
     npm --version
     ```

3. **Git**
   - Required for plugin management
   - Verify installation:
     ```bash
     git --version
     ```

### System Requirements

- **OS:** macOS, Linux, or Windows (WSL2 recommended)
- **Memory:** Minimum 4GB RAM (8GB recommended)
- **Disk Space:** ~500MB for all plugins
- **Network:** Internet connection for plugin installation

### Permissions

- Write access to Claude Code plugin directory (`~/.claude/plugins/`)
- Ability to execute Node.js scripts
- Ability to create MCP server configurations

---

## Installation Patterns

Choose the installation pattern that best fits your needs:

| Pattern | Description | Use Case | Disk Space |
|---------|-------------|----------|------------|
| **Beginner** | Single command installs all plugins | New users, full workflow needed | ~500MB |
| **Selective** | Install specific phase plugins | Experienced users, partial workflow | ~100-300MB |
| **Developer** | Manual installation from source | Framework contributors, customization | ~500MB |

---

## Pattern 1: Selective (Phase-Specific)

### Overview
Install only the phase plugins you need. Best for experienced users who understand the ROME workflow and only need specific phases.

### Installation Steps

#### Step 1: Install rome-core (Required)

```bash
claude-plugin install rome-core
```

rome-core is required by all phase plugins.

#### Step 2: Choose Your Phases

Select the phases you need:

##### Option A: Requirements Only (P0-P1)
```bash
claude-plugin install rome-p0-bootup
claude-plugin install rome-p1-aordl
```
**Use Case:** Capturing and validating requirements

##### Option B: Requirements + Analysis (P0-P2)
```bash
claude-plugin install rome-p0-bootup
claude-plugin install rome-p1-aordl
claude-plugin install rome-p2-analysis
```
**Use Case:** Requirements capture and functional decomposition

##### Option C: Design Phase Only (P3)
```bash
claude-plugin install rome-p3-design
```
**Use Case:** Architecture and API design (requires existing requirements)
**Note:** Peer dependency on rome-p2-analysis

##### Option D: Code Generation Only (P5)
```bash
claude-plugin install rome-p5-generation
```
**Use Case:** Generate code from existing design artifacts
**Note:** Peer dependency on rome-p4-config

##### Option E: Quality Assurance Only (QA)
```bash
claude-plugin install rome-qa
```
**Use Case:** Validate existing ROME project artifacts

#### Step 3: Configure MCP Server (If rome-core installed)

```bash
cat > ~/.claude/.mcp.json <<'EOF'
{
  "mcpServers": {
    "activity-log": {
      "command": "node",
      "args": ["${pluginPath}/rome-core/servers/activity-log/activity-log-file/index.js"],
      "env": {
        "PROJECT_ROOT": "${projectRoot}"
      }
    }
  }
}
EOF
```

#### Step 4: Verify Installation

```bash
claude-plugin list | grep rome-
```

### Selective Installation Examples

#### Example 1: Requirements Engineer
**Needs:** Capture and validate AORDL requirements

```bash
claude-plugin install rome-core
claude-plugin install rome-p0-bootup
claude-plugin install rome-p1-aordl
claude-plugin install rome-qa
```

**Commands Available:**
- `/rome-p0:bootstrap`
- `/rome-p1:validate`
- `/rome-p1:create`
- `/rome-p1:transform-bdd`
- `/rome-qa:validate`

#### Example 2: System Architect
**Needs:** Design architecture from existing requirements

```bash
claude-plugin install rome-core
claude-plugin install rome-p2-analysis  # Peer dependency
claude-plugin install rome-p3-design
claude-plugin install rome-qa
```

**Commands Available:**
- `/rome-p3:design`
- `/rome-p3:activate-clara`
- `/rome-p3:architecture`
- `/rome-qa:quality-gate`

#### Example 3: Backend Developer
**Needs:** Generate database and API code

```bash
claude-plugin install rome-core
claude-plugin install rome-p4-config  # Peer dependency
claude-plugin install rome-p5-generation
```

**Commands Available:**
- `/rome-p5:generate-db`
- `/rome-p5:generate-api`

---

## Pattern 2: Developer (Manual Installation)

### Overview
Install plugins manually from source for development, customization, or contributing to the framework.

### Installation Steps

#### Step 1: Clone Plugin Repositories

```bash
# Create plugins directory
mkdir -p ~/rome-plugins
cd ~/rome-plugins

# Clone all plugin repositories
git clone https://github.com/rome-framework/rome-core.git
git clone https://github.com/rome-framework/rome-p0-bootup.git
git clone https://github.com/rome-framework/rome-p1-aordl.git
git clone https://github.com/rome-framework/rome-p2-analysis.git
git clone https://github.com/rome-framework/rome-p3-design.git
git clone https://github.com/rome-framework/rome-p4-config.git
git clone https://github.com/rome-framework/rome-p5-generation.git
git clone https://github.com/rome-framework/rome-qa.git
git clone https://github.com/rome-framework/rome-core.git
```

#### Step 2: Install Dependencies

```bash
# Install dependencies for rome-core
cd ~/rome-plugins/rome-core
npm install

# rome-core dependencies: js-yaml ^4.1.0
```

Most plugins are documentation-only and have no npm dependencies.

#### Step 3: Symlink to Claude Plugin Directory

```bash
# Create symlinks
ln -s ~/rome-plugins/rome-core ~/.claude/plugins/rome-core
ln -s ~/rome-plugins/rome-p0-bootup ~/.claude/plugins/rome-p0-bootup
ln -s ~/rome-plugins/rome-p1-aordl ~/.claude/plugins/rome-p1-aordl
ln -s ~/rome-plugins/rome-p2-analysis ~/.claude/plugins/rome-p2-analysis
ln -s ~/rome-plugins/rome-p3-design ~/.claude/plugins/rome-p3-design
ln -s ~/rome-plugins/rome-p4-config ~/.claude/plugins/rome-p4-config
ln -s ~/rome-plugins/rome-p5-generation ~/.claude/plugins/rome-p5-generation
ln -s ~/rome-plugins/rome-qa ~/.claude/plugins/rome-qa
ln -s ~/rome-plugins/rome-core ~/.claude/plugins/rome-core
```

#### Step 4: Configure MCP Server

```bash
cat > ~/.claude/.mcp.json <<'EOF'
{
  "mcpServers": {
    "activity-log": {
      "command": "node",
      "args": ["${HOME}/rome-plugins/rome-core/servers/activity-log/activity-log-file/index.js"],
      "env": {
        "PROJECT_ROOT": "${projectRoot}"
      }
    }
  }
}
EOF
```

#### Step 5: Verify Installation

```bash
claude-plugin list | grep rome-
ls -la ~/.claude/plugins/ | grep rome-
```

### Developer Workflow

#### Making Changes
```bash
cd ~/rome-plugins/rome-p1-aordl
# Edit agent definitions, skills, or commands
git add .
git commit -m "feat: enhance validate-aordl skill"
```

#### Testing Changes
```bash
# Restart Claude Code to reload plugins
claude code restart

# Test changes in Claude Code session
/rome-p1:validate test-requirement.yaml
```

#### Contributing Back
```bash
git push origin feature/enhance-validation
# Create pull request on GitHub
```

---

## Post-Installation Configuration

### MCP Server Configuration

The activity-log MCP server tracks all ROME framework activities.

**Configuration Location:** `~/.claude/.mcp.json`

**Configuration Template:**
```json
{
  "mcpServers": {
    "activity-log": {
      "command": "node",
      "args": ["${pluginPath}/rome-core/servers/activity-log/activity-log-file/index.js"],
      "env": {
        "PROJECT_ROOT": "${projectRoot}",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

**Optional Environment Variables:**
- `LOG_LEVEL`: Set to `debug` for verbose logging
- `PROJECT_ROOT`: Automatically set by Claude Code

### Plugin Preferences

Configure plugin-specific preferences in `~/.claude/preferences.json`:

```json
{
  "plugins": {
    "rome-p3-design": {
      "auto_activate_clara": false
    },
    "rome-p5-generation": {
      "default_tech_stack": "nodejs"
    }
  }
}
```

### Project-Level Configuration

Create `.rome-config.yaml` in your project root:

```yaml
rome_version: 1.0.0
project_name: MyProject
tech_stack: nodejs
database: postgresql

plugins:
  rome-p1-aordl:
    requirement_prefix: REQ
    auto_validate: true

  rome-p3-design:
    architecture_style: microservices
    api_format: openapi-3.0

  rome-p5-generation:
    code_style: airbnb
    test_framework: jest
```

---

## Verification

### Basic Verification

```bash
# Check plugin installation
claude-plugin list | grep rome-

# Verify plugin versions
claude-plugin info rome-core
claude-plugin info rome-p1-aordl

# Check MCP server status
claude code --check-mcp
```

### Functional Verification

#### Test 1: Plugin Recognition
Start Claude Code and run:
```
/rome-p0:bootstrap
```
**Expected:** Project structure created

#### Test 2: Agent Activation
```
User: "I need help with AORDL requirements."
```
**Expected:** Talib agent responds in context

#### Test 3: Skill Execution
```
User: "Validate the AORDL requirement at _requirements/aordl/REQ-001.yaml"
```
**Expected:** Validation report generated

#### Test 4: MCP Server
```
User: "Show me the activity log for this project."
```
**Expected:** Activity log displayed (requires activity-log MCP server)

### Full Verification

Run the complete test suite:
```bash
# See TESTING.md for detailed test procedures
```

---

## Troubleshooting

### Issue 1: Plugin Not Found

**Symptom:**
```bash
claude-plugin list
# rome-* plugins not shown
```

**Solution:**
```bash
# Reinstall plugins
claude-plugin install rome-core

# Or manually check plugin directory
ls ~/.claude/plugins/
```

### Issue 2: MCP Server Not Starting

**Symptom:**
```
Error: MCP server 'activity-log' failed to start
```

**Solution:**
```bash
# Verify Node.js installation
node --version  # Should be >= 18.0.0

# Check MCP configuration
cat ~/.claude/.mcp.json

# Verify server script exists
ls ~/.claude/plugins/rome-core/servers/activity-log/activity-log-file/index.js

# Check server logs
tail -f ~/.claude/logs/mcp-server.log
```

### Issue 3: Dependency Errors

**Symptom:**
```
Error: rome-p3-design requires rome-p2-analysis@>=1.0.0
```

**Solution:**
```bash
# Install missing peer dependency
claude-plugin install rome-p2-analysis

# Or install full bundle
claude-plugin install rome-core
```

### Issue 4: Command Not Recognized

**Symptom:**
```
/rome-p1:validate
# Command not found
```

**Solution:**
```bash
# Verify plugin installation
claude-plugin info rome-p1-aordl

# Restart Claude Code
claude code restart

# Check command documentation
cat ~/.claude/plugins/rome-p1-aordl/commands/rome-p1-validate.md
```

### Issue 5: Permission Denied

**Symptom:**
```
Error: EACCES: permission denied, mkdir '~/.claude/plugins/rome-core'
```

**Solution:**
```bash
# Fix permissions
chmod -R 755 ~/.claude/plugins/

# Or use sudo (not recommended)
sudo claude-plugin install rome-core
```

### Issue 6: Version Mismatch

**Symptom:**
```
Warning: rome-p1-aordl@1.0.0 requires rome-core@^1.0.0 but found rome-core@0.9.0
```

**Solution:**
```bash
# Update rome-core
claude-plugin update rome-core

# Update all plugins
claude-plugin update rome-*
```

---

## Updating Plugins

### Update All Plugins

```bash
claude-plugin update rome-*
```

### Update Specific Plugin

```bash
claude-plugin update rome-p1-aordl
```

### Check for Updates

```bash
claude-plugin outdated | grep rome-
```

### Update rome-core Meta-Plugin

```bash
claude-plugin update rome-core
# Automatically updates all dependencies
```

### Version Pinning

Pin specific versions in project `package.json`:

```json
{
  "dependencies": {
    "rome-core": "1.0.0",
    "rome-p1-aordl": "1.0.0"
  }
}
```

---

## Uninstallation

### Uninstall All ROME Plugins

```bash
claude-plugin uninstall rome-core
claude-plugin uninstall rome-core
claude-plugin uninstall rome-p0-bootup
claude-plugin uninstall rome-p1-aordl
claude-plugin uninstall rome-p2-analysis
claude-plugin uninstall rome-p3-design
claude-plugin uninstall rome-p4-config
claude-plugin uninstall rome-p5-generation
claude-plugin uninstall rome-qa
```

### Uninstall Specific Plugin

```bash
claude-plugin uninstall rome-p1-aordl
```

### Remove MCP Server Configuration

```bash
# Edit .mcp.json and remove activity-log entry
nano ~/.claude/.mcp.json
```

### Clean Up Project Artifacts

```bash
# Remove ROME project directories
rm -rf _user_input _requirements _analysis _design _config

# Remove activity logs
rm -f ARTIFACTS/activity-log.txt ARTIFACTS/activity-state.yaml
```

---

## Advanced Configuration

### Custom Plugin Locations

Install plugins to custom directory:

```bash
export CLAUDE_PLUGIN_PATH=~/my-custom-plugins
claude-plugin install rome-core --path $CLAUDE_PLUGIN_PATH
```

### Multiple ROME Versions

Run different ROME versions side-by-side:

```bash
# Install v1.0.0
claude-plugin install rome-core@1.0.0

# Install v2.0.0 to separate profile
claude-plugin install rome-core@2.0.0 --profile rome-v2
```

### Offline Installation

```bash
# Download plugin packages
claude-plugin pack rome-core --output rome-core-1.0.0.tgz

# Install from tarball
claude-plugin install rome-core-1.0.0.tgz
```

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-07 | Initial installation guide created by Agent Nu |

---

## References

- ROME-PROP-018: Phase-Based Plugin Architecture
- PLUGIN-MANIFEST.md: Complete plugin catalog
- TESTING.md: Validation procedures
- rome-core/README.md: Meta-plugin documentation
